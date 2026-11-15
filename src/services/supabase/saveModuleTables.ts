import { resolveEmployeeDbId } from './tableMapper';
import { supabaseRowToItem } from './rowToItem';

export async function saveRhTemplateItem<T extends { id: string }>(
  client: any,
  collectionName: string,
  item: T,
  row: any
): Promise<T> {
  const tplDocId = String(item.id || row.doc_id || 'tpl-memo');
  const rowToSave = {
    ...row,
    doc_id: tplDocId,
    name: String(row.name || (item as any).name || (item as any).title || 'Template RH').trim() || 'Template RH',
    code: String((item as any).code || tplDocId).trim(),
    type: String((item as any).type || (item as any).documentType || 'general').trim(),
    content_template: String((item as any).contentTemplate || (item as any).content || (item as any).template || 'Contenu').trim(),
  };
  const { data: existingRows } = await client.from('rh_document_templates').select('id').eq('doc_id', tplDocId).limit(1);
  if (existingRows && existingRows.length > 0) {
    const { data: updateData, error: updateErr } = await client.from('rh_document_templates').update(rowToSave).eq('doc_id', tplDocId).select().single();
    if (!updateErr && updateData) return supabaseRowToItem(collectionName, updateData) as T;
  } else {
    const { data: insertData, error: insertErr } = await client.from('rh_document_templates').insert(rowToSave).select().single();
    if (!insertErr && insertData) return supabaseRowToItem(collectionName, insertData) as T;
  }
  return item;
}

export async function saveAttendanceIncidentItem<T extends { id: string }>(
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

  const incDocId = String(item.id || row.doc_id || `inc-${Date.now()}`);
  row.doc_id = incDocId;

  const { data: upsertData, error: upsertErr } = await client
    .from('attendance_incidents')
    .upsert(row, { onConflict: 'doc_id' })
    .select()
    .single();
  if (!upsertErr && upsertData) return supabaseRowToItem(collectionName, upsertData) as T;

  const { data: insertData, error: insertErr } = await client.from('attendance_incidents').insert(row).select().single();
  if (!insertErr && insertData) return supabaseRowToItem(collectionName, insertData) as T;
  return item;
}

export async function saveHseIncidentItem<T extends { id: string }>(
  client: any,
  collectionName: string,
  item: T,
  row: any
): Promise<T> {
  const hseDocId = String(item.id || row.doc_id || `hse-${Date.now()}`);
  row.doc_id = hseDocId;
  row.title = (item as any).title || row.title;
  row.site_location = (item as any).site || (item as any).siteLocation || row.site_location || 'Base Japoma - Carrefour Matango';
  row.date = (item as any).date || row.date || new Date().toISOString().split('T')[0];

  const { data: upsertData, error: upsertErr } = await client
    .from('hse_incidents')
    .upsert(row, { onConflict: 'doc_id' })
    .select()
    .single();
  if (!upsertErr && upsertData) return supabaseRowToItem(collectionName, upsertData) as T;

  const { data: existingRows } = await client.from('hse_incidents').select('id').eq('doc_id', hseDocId).limit(1);
  if (existingRows && existingRows.length > 0) {
    const { data: updateData, error: updateErr } = await client.from('hse_incidents').update(row).eq('doc_id', hseDocId).select().single();
    if (!updateErr && updateData) return supabaseRowToItem(collectionName, updateData) as T;
  } else {
    const { data: insertData, error: insertErr } = await client.from('hse_incidents').insert(row).select().single();
    if (!insertErr && insertData) return supabaseRowToItem(collectionName, insertData) as T;
  }
  return item;
}

export async function saveLeaveRequestItem<T extends { id: string }>(
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

  const leaveDocId = String(item.id || row.doc_id || `leave-${Date.now()}`);
  row.doc_id = leaveDocId;

  const { data: upsertData, error: upsertErr } = await client
    .from('leave_requests')
    .upsert(row, { onConflict: 'doc_id' })
    .select()
    .single();
  if (!upsertErr && upsertData) return supabaseRowToItem(collectionName, upsertData) as T;

  const { data: insertData, error: insertErr } = await client.from('leave_requests').insert(row).select().single();
  if (!insertErr && insertData) return supabaseRowToItem(collectionName, insertData) as T;
  if (insertErr) {
    console.error('[supabaseService leave_requests save error]:', insertErr.message);
  }
  return item;
}

export async function saveVisitorLogItem<T extends { id: string }>(
  client: any,
  collectionName: string,
  item: T,
  row: any
): Promise<T> {
  const visDocId = String(item.id || row.doc_id || `vis-${Date.now()}`);
  const visitorRow: any = {
    ...row,
    doc_id: visDocId,
    visitor_name: (item as any).visitorName || row.visitor_name || (item as any).name || 'Visiteur',
    visitor_company: (item as any).visitorCompany || row.visitor_company || null,
    visitor_phone: (item as any).visitorPhone || row.visitor_phone || null,
    id_card_number: (item as any).idCardNumber || row.id_card_number || null,
    site_location: (item as any).siteLocation || row.site_location || null,
    purpose: (item as any).purpose || row.purpose || null,
    host_employee_id: (item as any).hostEmployeeId || row.host_employee_id || null,
    host_employee_name: (item as any).hostEmployeeName || row.host_employee_name || null,
    badge_number: (item as any).badgeNumber || row.badge_number || null,
    vehicle_plate: (item as any).vehiclePlate || row.vehicle_plate || null,
    check_in_time: (item as any).checkInTime || row.check_in_time || null,
    check_in_date: (item as any).checkInDate && String((item as any).checkInDate).length >= 10 ? String((item as any).checkInDate).split('T')[0] : new Date().toISOString().split('T')[0],
    check_out_time: (item as any).checkOutTime || row.check_out_time || null,
    status: (item as any).status || row.status || 'sur_site',
    raw_data: item,
    updated_at: new Date().toISOString(),
  };
  delete visitorRow.id;

  const { data: upsertData, error: upsertErr } = await client
    .from('visitor_logs')
    .upsert(visitorRow, { onConflict: 'doc_id' })
    .select()
    .single();
  if (!upsertErr && upsertData) return supabaseRowToItem(collectionName, upsertData) as T;

  if (upsertErr) {
    console.error('[visitor_logs save error]:', upsertErr);
    throw new Error(upsertErr.message || "Erreur d'enregistrement du visiteur en base de données");
  }
  return item;
}
