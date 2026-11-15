import { supabaseAdmin } from '../../lib/supabase';
import { isUuid, mapCollectionToTable } from './tableHelpers';

export async function getCollectionData(collectionName: string): Promise<any[]> {
  const table = mapCollectionToTable(collectionName);
  try {
    if (table === 'generic_collections') {
      const { data, error } = await supabaseAdmin
        .from('generic_collections')
        .select('*')
        .eq('collection', collectionName);
      if (error) throw error;
      return (data || []).map((row: any) => ({
        ...(row.data || {}),
        id: row.doc_id || row.id,
        _dbId: row.id,
      }));
    }

    const { data, error } = await supabaseAdmin.from(table).select('*');
    if (error) {
      if (!error.message.includes('fetch failed')) {
        console.warn(`[SQL getCollectionData error for ${table}]:`, error.message);
      }
      return [];
    }

    return (data || []).map((row: any) => {
      const raw = row.raw_data && typeof row.raw_data === 'object' ? row.raw_data : {};
      if (table === 'notifications') {
        const textMsg = row.message || raw.message || raw.content || raw.description || raw.title || 'Notification système';
        return {
          ...raw,
          ...row,
          title: row.title || raw.title || 'Notification',
          message: textMsg,
          content: raw.content || textMsg,
          id: row.doc_id || row.id || raw.id,
          _dbId: row.id,
        };
      }
      if (table === 'company_settings') {
        return {
          ...raw,
          id: row.doc_id || raw.id || 'main_config',
          docId: row.doc_id || raw.docId || 'main_config',
          companyName: raw.companyName || (row.setting_value && typeof row.setting_value === 'object' && row.setting_value.companyName) || 'Citrine SARL',
          workStartTime: raw.workStartTime || '08:00',
          plannedDepartureTime: raw.plannedDepartureTime || '16:30',
          _dbId: row.id,
        };
      }
      if (table === 'hse_incidents') {
        return {
          ...raw,
          ...row,
          id: row.doc_id || String(row.id),
          docId: row.doc_id || String(row.id),
          reference: raw.reference || `HSE-2026-${String(row.id).padStart(4, '0')}`,
          site: row.site_location || raw.site || 'Base Japoma - Carrefour Matango',
          zonePrecise: row.zone_precise || raw.zonePrecise || '',
          type: row.type || raw.type || 'presque_accident',
          severity: row.severity || raw.severity || 'faible',
          date: row.date || raw.date || '',
          time: row.time || raw.time || '',
          title: row.title || raw.title || '',
          description: row.description || raw.description || '',
          reportedBy: row.reported_by || raw.reportedBy || '',
          victimName: row.victim_name || raw.victimName || '',
          daysLost: typeof row.days_lost === 'number' ? row.days_lost : (typeof raw.daysLost === 'number' ? raw.daysLost : 0),
          status: row.status || raw.status || 'signale',
          immediateActionTaken: raw.immediateActionTaken || '',
          rootCause: raw.rootCause || '',
          victimInjury: raw.victimInjury || '',
          correctiveActions: raw.correctiveActions || [],
          _dbId: row.id,
        };
      }
      return {
        ...raw,
        ...row,
        id: row.doc_id || row.id || raw.id,
        _dbId: row.id,
      };
    });
  } catch (error: any) {
    if (!error?.message?.includes('fetch failed')) {
      console.error(`Database query failed for collection ${collectionName}:`, error);
    }
    return [];
  }
}

export async function deleteDocumentData(collectionName: string, id: string): Promise<boolean> {
  const table = mapCollectionToTable(collectionName);
  try {
    const strId = String(id).trim();
    if (table === 'generic_collections') {
      await supabaseAdmin
        .from('generic_collections')
        .delete()
        .eq('collection', collectionName)
        .eq('doc_id', strId);
      return true;
    }

    if (/^\d+$/.test(strId)) {
      await Promise.allSettled([
        supabaseAdmin.from(table).delete().eq('id', Number(strId)),
        supabaseAdmin.from(table).delete().eq('doc_id', strId),
      ]);
    } else if (isUuid(strId)) {
      await Promise.allSettled([
        supabaseAdmin.from(table).delete().eq('uid', strId),
        supabaseAdmin.from(table).delete().eq('doc_id', strId),
      ]);
    } else {
      await Promise.allSettled([
        supabaseAdmin.from(table).delete().eq('doc_id', strId),
        supabaseAdmin.from(table).delete().match({ id: strId }),
      ]);
    }

    return true;
  } catch (error) {
    console.error(`Database delete failed for ${collectionName}/${id}:`, error);
    return false;
  }
}

export async function getOrCreateUserRecord(uid: string, email: string, name?: string, role?: string) {
  try {
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('uid', uid)
      .limit(1);

    if (existing && existing.length > 0) {
      return existing[0];
    }

    const newUser = {
      uid,
      email,
      name: name || null,
      doc_id: uid,
      raw_data: { uid, email, name, role },
      updated_at: new Date().toISOString(),
    };

    const { data: inserted, error } = await supabaseAdmin
      .from('users')
      .upsert(newUser, { onConflict: 'uid' })
      .select()
      .single();

    if (error) throw error;
    return inserted;
  } catch (error) {
    console.error(`Error in getOrCreateUserRecord for ${uid}:`, error);
    return null;
  }
}
