import { supabase, supabaseAdmin } from '../../lib/supabase';

export function mapCollectionToTable(collectionName: string): string {
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
    case 'task_assignees': return 'task_assignees';
    case 'task_project_members': return 'task_project_members';
    case 'reminder_recipients': return 'reminder_recipients';
    case 'notification_recipients': return 'notification_recipients';
    case 'presence_pauses': return 'presence_pauses';
    case 'absences': return 'absences';
    case 'leave_requests': return 'leave_requests';
    case 'building_supervisors': return 'generic_collections';
    default: return 'generic_collections';
  }
}

export function isUuid(val: any): boolean {
  if (typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
}

export async function resolveEmployeeDbId(client: any, empIdVal: any): Promise<number | null> {
  if (!empIdVal) return null;
  if (typeof empIdVal === 'number' && Number.isInteger(empIdVal)) return empIdVal;
  const strId = String(empIdVal).trim();
  if (/^\d+$/.test(strId)) return Number(strId);

  try {
    const { data: byDoc } = await client.from('employees').select('id').eq('doc_id', strId).maybeSingle();
    if (byDoc?.id) return Number(byDoc.id);

    const { data: byEmail } = await client.from('employees').select('id').eq('email', strId.toLowerCase()).maybeSingle();
    if (byEmail?.id) return Number(byEmail.id);

    if (isUuid(strId)) {
      const { data: byUid } = await client.from('employees').select('id').eq('uid', strId).maybeSingle();
      if (byUid?.id) return Number(byUid.id);
    }
  } catch {}
  return null;
}

export const getSupabaseClient = () => supabaseAdmin || supabase;
