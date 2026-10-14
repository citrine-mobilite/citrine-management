import { supabaseAdmin } from '../lib/supabase';

// Map collection name to Supabase table name
function mapCollectionToTable(collectionName: string): string {
  switch (collectionName) {
    case 'users': return 'users';
    case 'employees': return 'employees';
    case 'tasks': return 'tasks';
    case 'task_projects': return 'task_projects';
    case 'reminders': return 'reminders';
    case 'presences': return 'presences';
    case 'attendance_incidents': return 'attendance_incidents';
    case 'badge_codes_16': return 'badge_codes_16';
    case 'dynamic_qr_sessions': return 'dynamic_qr_sessions';
    case 'inventory_items':
    case 'inventory': return 'inventory';
    case 'disciplinary_incidents': return 'disciplinary_incidents';
    case 'departments': return 'departments';
    case 'documents': return 'documents';
    case 'rh_document_templates': return 'rh_document_templates';
    case 'processflow_salary_debts': return 'processflow_salary_debts';
    case 'salary_payments': return 'salary_payments';
    case 'financial_transactions': return 'financial_transactions';
    case 'partners': return 'partners';
    case 'notifications': return 'notifications';
    case 'company_settings': return 'company_settings';
    case 'calls': return 'calls';
    case 'user_presences': return 'user_presences';
    case 'job_offers': return 'job_offers';
    case 'job_applications': return 'job_applications';
    case 'expense_claims': return 'expense_claims';
    case 'hse_incidents': return 'hse_incidents';
    case 'visitor_logs': return 'visitor_logs';
    case 'idea_suggestions': return 'idea_suggestions';
    case 'enterprise_surveys': return 'enterprise_surveys';
    case 'connection_logs': return 'connection_logs';
    case 'admin_audit_logs':
    case 'citrine_admin_audit_operations_v1': return 'admin_audit_logs';
    default: return 'generic_collections';
  }
}

export function isSqlConfigured(): boolean {
  return true; // Database (Supabase PostgreSQL) is always active
}

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
      console.warn(`[SQL getCollectionData error for ${table}]:`, error.message);
      return [];
    }

    return (data || []).map((row: any) => {
      const raw = row.raw_data && typeof row.raw_data === 'object' ? row.raw_data : row;
      return {
        ...raw,
        ...row,
        id: row.doc_id || row.id || raw.id,
        _dbId: row.id,
      };
    });
  } catch (error) {
    console.error(`Database query failed for collection ${collectionName}:`, error);
    return [];
  }
}

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

    if (item.title !== undefined) rowData.title = item.title;
    if (item.description !== undefined) rowData.description = item.description;
    if (item.status !== undefined) rowData.status = item.status;
    if (item.email !== undefined) rowData.email = item.email;
    if (item.name !== undefined) rowData.name = item.name;
    if (item.type !== undefined) rowData.type = item.type;
    if (item.priority !== undefined) rowData.priority = item.priority;
    if (item.department !== undefined) rowData.department = item.department;

    await supabaseAdmin.from(table).upsert(rowData, { onConflict: 'doc_id' });
  } catch (error) {
    console.error(`Database save failed for ${collectionName}/${docId}:`, error);
  }

  return savedItem;
}

export async function deleteDocumentData(collectionName: string, id: string): Promise<boolean> {
  const table = mapCollectionToTable(collectionName);
  try {
    if (table === 'generic_collections') {
      await supabaseAdmin
        .from('generic_collections')
        .delete()
        .eq('collection', collectionName)
        .eq('doc_id', id);
      return true;
    }

    await supabaseAdmin
      .from(table)
      .delete()
      .eq('doc_id', id);

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
