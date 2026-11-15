import { getSupabaseClient, mapCollectionToTable } from './tableMapper';
import { itemToSupabaseRow } from './itemToRow';
import { supabaseRowToItem } from './rowToItem';
import {
  saveEmployeeItem,
  saveGenericCollectionItem,
  savePresenceItem,
  saveTaskItem,
  saveUserItem,
} from './saveCoreTables';
import {
  saveAttendanceIncidentItem,
  saveHseIncidentItem,
  saveLeaveRequestItem,
  saveRhTemplateItem,
  saveVisitorLogItem,
} from './saveModuleTables';

async function saveBadgeCode16Item<T extends { id: string }>(
  client: any,
  collectionName: string,
  item: T,
  row: any
): Promise<T> {
  const codeDocId = String(item.id || row.doc_id || `code16-${Date.now()}`);
  const cleanCode = String((item as any).code || row.code || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const codeRow: any = {
    ...row,
    doc_id: codeDocId,
    code: cleanCode,
    is_used: Boolean((item as any).isUsed ?? row.is_used ?? false),
    expires_at: (item as any).expiresAt || row.expires_at || null,
    created_by: (item as any).createdBy || (item as any).generatedBy || row.created_by || 'Responsable',
    assigned_name: (item as any).assignedName || (item as any).employeeName || row.assigned_name || null,
    used_at: (item as any).usedAt || row.used_at || null,
    raw_data: item,
    updated_at: new Date().toISOString(),
  };
  if (typeof codeRow.id !== 'number') delete codeRow.id;

  const { data: upsertCodeData, error: upsertCodeErr } = await client
    .from('badge_codes_16')
    .upsert(codeRow, { onConflict: 'code' })
    .select()
    .single();
  if (!upsertCodeErr && upsertCodeData) {
    return supabaseRowToItem(collectionName, upsertCodeData) as T;
  }

  const { data: upsertDocData, error: upsertDocErr } = await client
    .from('badge_codes_16')
    .upsert(codeRow, { onConflict: 'doc_id' })
    .select()
    .single();
  if (!upsertDocErr && upsertDocData) {
    return supabaseRowToItem(collectionName, upsertDocData) as T;
  }

  const { data: updateData } = await client
    .from('badge_codes_16')
    .update(codeRow)
    .or(`code.eq.${cleanCode},doc_id.eq.${codeDocId}`)
    .select()
    .single();
  if (updateData) return supabaseRowToItem(collectionName, updateData) as T;

  const { data: insertData } = await client.from('badge_codes_16').insert(codeRow).select().single();
  if (insertData) return supabaseRowToItem(collectionName, insertData) as T;

  return item;
}

async function saveDynamicQrSessionItem<T extends { id: string }>(
  client: any,
  collectionName: string,
  item: T,
  row: any
): Promise<T> {
  const dynDocId = String(item.id || row.doc_id || (item as any).sessionId || `dyn-${Date.now()}`);
  const dynRow: any = {
    ...row,
    doc_id: dynDocId,
    session_id: String((item as any).sessionId || (item as any).id || row.session_id || dynDocId),
    token: String((item as any).token || row.token || ''),
    status: String((item as any).status || row.status || 'active'),
    expires_at: (item as any).expiresAt || row.expires_at || null,
    raw_data: item,
    updated_at: new Date().toISOString(),
  };
  if (typeof dynRow.id !== 'number') delete dynRow.id;

  const { data: upsertData, error: upsertErr } = await client
    .from('dynamic_qr_sessions')
    .upsert(dynRow, { onConflict: 'session_id' })
    .select()
    .single();
  if (!upsertErr && upsertData) return supabaseRowToItem(collectionName, upsertData) as T;

  const { data: insertData } = await client.from('dynamic_qr_sessions').insert(dynRow).select().single();
  if (insertData) return supabaseRowToItem(collectionName, insertData) as T;

  return item;
}

export async function saveDocument<T extends { id: string }>(collectionName: string, item: T): Promise<T> {
  try {
    const table = mapCollectionToTable(collectionName);
    const client = getSupabaseClient();
    const row = itemToSupabaseRow(collectionName, item);

    if (table === 'generic_collections') return saveGenericCollectionItem(client, collectionName, item);
    if (table === 'users') return saveUserItem<T>(client, collectionName, row);
    if (table === 'employees') return saveEmployeeItem<T>(client, collectionName, row);
    if (table === 'tasks') return saveTaskItem(client, collectionName, item, row);
    if (table === 'rh_document_templates') return saveRhTemplateItem(client, collectionName, item, row);
    if (table === 'presences') return savePresenceItem(client, collectionName, item, row);
    if (table === 'attendance_incidents') return saveAttendanceIncidentItem(client, collectionName, item, row);
    if (table === 'hse_incidents') return saveHseIncidentItem(client, collectionName, item, row);
    if (table === 'leave_requests') return saveLeaveRequestItem(client, collectionName, item, row);
    if (table === 'visitor_logs') return saveVisitorLogItem(client, collectionName, item, row);
    if (table === 'badge_codes_16') return saveBadgeCode16Item(client, collectionName, item, row);
    if (table === 'dynamic_qr_sessions') return saveDynamicQrSessionItem(client, collectionName, item, row);

    if (table === 'notifications') {
      try {
        if (row.target_user_id) {
          const { data: u } = await client.from('users').select('id').eq('id', row.target_user_id).maybeSingle();
          if (!u?.id) {
            const { data: emp } = await client.from('employees').select('user_id').eq('id', row.target_user_id).maybeSingle();
            if (emp?.user_id) {
              row.target_user_id = emp.user_id;
            } else {
              delete row.target_user_id;
            }
          }
        }
      } catch {
        delete row.target_user_id;
      }
    }

    if (row.id) {
      const { data, error } = await client.from(table).upsert(row, { onConflict: 'id' }).select().single();
      if (!error && data) return supabaseRowToItem(collectionName, data) as T;
      if (!error) return item;
    } else if (row.uid) {
      const { data, error } = await client.from(table).upsert(row, { onConflict: 'uid' }).select().single();
      if (!error && data) return supabaseRowToItem(collectionName, data) as T;
      if (!error) return item;
    } else if (row.doc_id) {
      const { data, error } = await client.from(table).upsert(row, { onConflict: 'doc_id' }).select().single();
      if (!error && data) return supabaseRowToItem(collectionName, data) as T;
      const { data: updateData } = await client.from(table).update(row).eq('doc_id', row.doc_id).select().single();
      if (updateData) return supabaseRowToItem(collectionName, updateData) as T;
      const { data: insertData } = await client.from(table).insert(row).select().single();
      if (insertData) return supabaseRowToItem(collectionName, insertData) as T;
      return item;
    } else {
      const { data, error } = await client.from(table).insert(row).select().single();
      if (!error && data) return supabaseRowToItem(collectionName, data) as T;
      if (!error) return item;
    }

    return item;
  } catch (err) {
    console.warn(`[Supabase Save] Exception saving to ${collectionName}:`, err);
    return item;
  }
}
