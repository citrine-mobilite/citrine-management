import { resolveEmployeeDbId } from './tableMapper';
import { supabaseRowToItem } from './rowToItem';

export async function saveGenericCollectionItem<T extends { id: string }>(
  client: any,
  collectionName: string,
  item: T
): Promise<T> {
  const gDocId = String(item.id || (item as any).docId || `sup-${Date.now()}`);
  const gRow: any = {
    collection: collectionName,
    doc_id: gDocId,
    data: item,
    updated_at: new Date().toISOString(),
  };

  const { data: upsertData, error: upsertErr } = await client
    .from('generic_collections')
    .upsert(gRow, { onConflict: 'collection,doc_id' })
    .select()
    .single();

  if (upsertErr) {
    console.error(`[generic_collections save error for ${collectionName}:${gDocId}]:`, upsertErr);
    throw new Error(upsertErr.message || `Échec de l'enregistrement de ${collectionName}`);
  }

  return supabaseRowToItem(collectionName, upsertData) as T;
}

export async function saveUserItem<T>(client: any, collectionName: string, row: any): Promise<T> {
  let savedResult: any = null;
  let userErr: any = null;
  if (row.id && Number.isInteger(row.id)) {
    const { data, error } = await client.from('users').upsert(row, { onConflict: 'id' }).select().single();
    if (!error && data) savedResult = data;
    else if (error) userErr = error;
  }
  if (!savedResult && row.email) {
    const { data, error } = await client.from('users').upsert(row, { onConflict: 'email' }).select().single();
    if (!error && data) savedResult = data;
    else if (error) userErr = error;
  }
  if (!savedResult) {
    const { data, error } = await client.from('users').insert(row).select().single();
    if (!error && data) savedResult = data;
    else if (error) userErr = error;
  }

  if (!savedResult) {
    throw userErr || new Error("Échec de l'enregistrement de l'utilisateur en base de données");
  }

  if (savedResult && savedResult.email) {
    try {
      await client.from('employees').update({ email: savedResult.email }).eq('user_id', savedResult.id);
    } catch {}
  }

  return supabaseRowToItem(collectionName, savedResult) as T;
}

export async function saveEmployeeItem<T>(client: any, collectionName: string, row: any): Promise<T> {
  if (!row.user_id || !Number.isInteger(row.user_id)) {
    try {
      if (row.email) {
        const { data: u } = await client.from('users').select('id').eq('email', row.email).maybeSingle();
        if (u?.id) {
          row.user_id = u.id;
        } else {
          delete row.user_id;
        }
      } else {
        delete row.user_id;
      }
    } catch {
      delete row.user_id;
    }
  }

  let savedResult: any = null;
  let empErr: any = null;

  if (row.id && Number.isInteger(row.id)) {
    const { data, error } = await client.from('employees').upsert(row, { onConflict: 'id' }).select().single();
    if (!error && data) savedResult = data;
    else if (error) empErr = error;
  }
  if (!savedResult && row.doc_id) {
    const { data, error } = await client.from('employees').upsert(row, { onConflict: 'doc_id' }).select().single();
    if (!error && data) savedResult = data;
    else if (error) empErr = error;
  }
  if (!savedResult && row.email) {
    const { data, error } = await client.from('employees').upsert(row, { onConflict: 'email' }).select().single();
    if (!error && data) savedResult = data;
    else if (error) empErr = error;
  }
  if (!savedResult && row.uid) {
    const { data, error } = await client.from('employees').upsert(row, { onConflict: 'uid' }).select().single();
    if (!error && data) savedResult = data;
    else if (error) empErr = error;
  }
  if (!savedResult) {
    const { data, error } = await client.from('employees').insert(row).select().single();
    if (!error && data) savedResult = data;
    else if (error) empErr = error;
  }

  if (!savedResult) {
    throw empErr || new Error("Échec de l'enregistrement du collaborateur en base de données");
  }

  if (savedResult && savedResult.email && savedResult.user_id) {
    try {
      await client.from('users').update({ email: savedResult.email }).eq('id', savedResult.user_id);
    } catch {}
  }

  return supabaseRowToItem(collectionName, savedResult) as T;
}

export async function saveTaskItem<T extends { id: string }>(
  client: any,
  collectionName: string,
  item: T,
  row: any
): Promise<T> {
  const taskDocId = String(item.id || row.doc_id);
  const { data: upsertData, error: upsertErr } = await client
    .from('tasks')
    .upsert({ ...row, doc_id: taskDocId }, { onConflict: 'doc_id' })
    .select()
    .single();
  if (!upsertErr && upsertData) return supabaseRowToItem(collectionName, upsertData) as T;

  const { data: existingRows } = await client.from('tasks').select('id').eq('doc_id', taskDocId).limit(1);
  if (existingRows && existingRows.length > 0) {
    const { data: updateData } = await client.from('tasks').update({ ...row, doc_id: taskDocId }).eq('doc_id', taskDocId).select().single();
    if (updateData) return supabaseRowToItem(collectionName, updateData) as T;
  } else {
    const { data: insertData } = await client.from('tasks').insert({ ...row, doc_id: taskDocId }).select().single();
    if (insertData) return supabaseRowToItem(collectionName, insertData) as T;
  }
  return item;
}

export async function savePresenceItem<T extends { id: string }>(
  client: any,
  collectionName: string,
  item: T,
  row: any
): Promise<T> {
  try {
    const empIdVal = (item as any).employeeId || (item as any).employee_id;
    const resolvedId = await resolveEmployeeDbId(client, empIdVal);
    if (resolvedId) {
      row.employee_id = resolvedId;
    } else {
      delete row.employee_id;
    }
  } catch {
    delete row.employee_id;
  }

  const presenceDocId = String(item.id || row.doc_id || `pr-${Date.now()}`);
  row.doc_id = presenceDocId;

  const { data: upsertData, error: upsertErr } = await client
    .from('presences')
    .upsert(row, { onConflict: 'doc_id' })
    .select()
    .single();
  if (!upsertErr && upsertData) return supabaseRowToItem(collectionName, upsertData) as T;

  const { data: insertData, error: insertErr } = await client.from('presences').insert(row).select().single();
  if (!insertErr && insertData) return supabaseRowToItem(collectionName, insertData) as T;
  if (insertErr) {
    console.error('[supabaseService presences save error]:', insertErr.message);
  }
  return item;
}
