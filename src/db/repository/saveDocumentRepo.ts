import { supabaseAdmin } from '../../lib/supabase';
import { mapCollectionToTable } from './tableHelpers';
import { populateCoreRowData } from './saveRowBuildersCore';
import { populateModuleRowData } from './saveRowBuildersModules';

export async function saveDocumentData(collectionName: string, item: any): Promise<any> {
  const table = mapCollectionToTable(collectionName);
  const docId = String(item.id || item.docId || `doc_${Date.now()}`);
  const savedItem = { ...item, id: docId, updatedAt: new Date().toISOString() };

  try {
    if (table === 'generic_collections') {
      await supabaseAdmin.from('generic_collections').upsert({
        collection: collectionName,
        doc_id: docId,
        data: savedItem,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'collection,doc_id' });
      return savedItem;
    }

    const rowData: any = {
      doc_id: docId,
      raw_data: savedItem,
      updated_at: new Date().toISOString(),
    };

    const handledCore = await populateCoreRowData(table, item, rowData);
    if (!handledCore) {
      await populateModuleRowData(table, item, docId, rowData);
    }

    let matchedId: number | null = null;
    if (table === 'employees' || table === 'users') {
      if (docId) {
        const { data: byDoc } = await supabaseAdmin.from(table).select('id').eq('doc_id', docId).maybeSingle();
        if (byDoc?.id) matchedId = byDoc.id;
      }
      if (!matchedId && rowData.id && typeof rowData.id === 'number') {
        const { data: byNumId } = await supabaseAdmin.from(table).select('id').eq('id', rowData.id).maybeSingle();
        if (byNumId?.id) matchedId = byNumId.id;
      }
      if (!matchedId && rowData.email) {
        const { data: byEmail } = await supabaseAdmin.from(table).select('id').ilike('email', rowData.email).maybeSingle();
        if (byEmail?.id) matchedId = byEmail.id;
      }
    }

    if (matchedId) {
      const { error: updateErr } = await supabaseAdmin.from(table).update(rowData).eq('id', matchedId);
      if (updateErr) {
        console.warn(`[repository] Update by id ${matchedId} failed on ${table}:`, updateErr.message);
        throw updateErr;
      }
    } else {
      const { error: saveErr } = await supabaseAdmin.from(table).upsert(rowData, { onConflict: 'doc_id' });
      if (saveErr) {
        console.warn(`Database upsert error for table ${table}, trying fallback:`, saveErr.message);
        let existingId: number | null = null;
        const { data: existingRows } = await supabaseAdmin.from(table).select('id').eq('doc_id', docId).limit(1);
        if (existingRows && existingRows.length > 0) {
          existingId = existingRows[0].id;
        } else if (rowData.email) {
          const { data: existingByEmail } = await supabaseAdmin.from(table).select('id').ilike('email', rowData.email).limit(1);
          if (existingByEmail && existingByEmail.length > 0) {
            existingId = existingByEmail[0].id;
          }
        }

        if (existingId) {
          const { error: updateErr } = await supabaseAdmin.from(table).update(rowData).eq('id', existingId);
          if (updateErr) throw updateErr;
        } else {
          const { error: insertErr } = await supabaseAdmin.from(table).insert(rowData);
          if (insertErr) throw insertErr;
        }
      }
    }
  } catch (error: any) {
    console.error(`Database save failed for ${collectionName}/${docId}:`, error);
    throw error;
  }

  return savedItem;
}
