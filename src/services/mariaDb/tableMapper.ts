import { getApiToken } from '../sessionService';

export function mapCollectionToTable(collectionName: string): string {
  switch (collectionName) {
    case 'roles': return 'roles';
    case 'inventory_assignments': return 'inventory_assignments';
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
    default: return 'generic_collections';
  }
}

export function isUuid(val: any): boolean {
  return typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
}

/** Résout un identifiant d'employé via l'API MariaDB (aucun client SQL navigateur). */
export async function resolveEmployeeDbId(_client: any, value: any): Promise<number | null> {
  if (!value) return null;
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  const token = getApiToken();
  if (!token) return null;
  try {
    const response = await fetch('/api/data/employees', { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return null;
    const result = await response.json();
    const match = (result.data || []).find((employee: any) =>
      String(employee.id) === String(value) || String(employee.docId) === String(value) ||
      String(employee.uid) === String(value) || String(employee.email || '').toLowerCase() === String(value).toLowerCase()
    );
    return match?._dbId ? Number(match._dbId) : (/^\d+$/.test(String(value)) ? Number(value) : null);
  } catch { return null; }
}
