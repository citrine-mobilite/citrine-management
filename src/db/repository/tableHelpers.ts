import { supabaseAdmin } from '../../lib/supabase';

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
    case 'leave_requests': return 'leave_requests';
    case 'absences': return 'absences';
    default: return 'generic_collections';
  }
}

export function isUuid(val: any): boolean {
  if (typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
}

export function isSqlConfigured(): boolean {
  return true;
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
  } catch {}
  return null;
}

export async function resolveUserDbId(client: any, candidateUserIdVal: any, recipientEmailOrName?: string): Promise<number | null> {
  if (!candidateUserIdVal && !recipientEmailOrName) return null;

  try {
    if (candidateUserIdVal) {
      if (typeof candidateUserIdVal === 'number' && Number.isInteger(candidateUserIdVal)) {
        const { data: directUser } = await client.from('users').select('id').eq('id', candidateUserIdVal).maybeSingle();
        if (directUser?.id) return Number(directUser.id);
      }
      const strVal = String(candidateUserIdVal).trim();
      if (/^\d+$/.test(strVal)) {
        const num = Number(strVal);
        const { data: directUser } = await client.from('users').select('id').eq('id', num).maybeSingle();
        if (directUser?.id) return Number(directUser.id);

        const { data: empLinked } = await client.from('employees').select('user_id').eq('id', num).maybeSingle();
        if (empLinked?.user_id) {
          const { data: linkedUser } = await client.from('users').select('id').eq('id', empLinked.user_id).maybeSingle();
          if (linkedUser?.id) return Number(linkedUser.id);
        }
      }

      const { data: byDoc } = await client.from('employees').select('user_id').eq('doc_id', strVal).maybeSingle();
      if (byDoc?.user_id) {
        const { data: linkedUser } = await client.from('users').select('id').eq('id', byDoc.user_id).maybeSingle();
        if (linkedUser?.id) return Number(linkedUser.id);
      }
    }

    if (recipientEmailOrName && recipientEmailOrName.includes('@')) {
      const { data: byEmail } = await client.from('users').select('id').eq('email', recipientEmailOrName.trim().toLowerCase()).maybeSingle();
      if (byEmail?.id) return Number(byEmail.id);
    }
  } catch (e) {
    console.warn('[resolveUserDbId error]:', e);
  }

  return null;
}

export { supabaseAdmin };
