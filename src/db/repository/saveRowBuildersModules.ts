import { supabaseAdmin } from '../../lib/supabase';
import { resolveEmployeeDbId } from './tableHelpers';

export async function populateModuleRowData(table: string, item: any, docId: string, rowData: any): Promise<void> {
  if (table === 'departments') {
    rowData.name = item.name || 'Département';
    rowData.code = item.code || null;
    rowData.budget_xaf = Number(item.budgetXaf || item.budget || 0);
  } else if (table === 'inventory') {
    rowData.name = item.name || item.designation || 'Matériel';
    rowData.category = item.category || null;
    rowData.serial_number = item.serialNumber || null;
    rowData.quantity = Number(item.quantity || 1);
    rowData.status = item.status || 'disponible';
    rowData.unit_price_xaf = Number(item.unitPriceXaf || item.price || 0);
  } else if (table === 'documents') {
    rowData.title = item.title || 'Document';
    rowData.type = item.type || item.documentType || 'general';
  } else if (table === 'users') {
    rowData.name = item.name || item.email || 'Utilisateur';
    if (item.email) rowData.email = String(item.email).trim();
    rowData.phone = item.phone || null;
    rowData.department = item.department || 'Direction Générale';
    rowData.avatar_url = item.avatarUrl || item.photoUrl || null;
    rowData.status = item.status !== false && item.status !== 'inactif';
    if (item.roleId) rowData.role_id = Number(item.roleId);
  } else if (table === 'employees') {
    rowData.name = item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Collaborateur';
    rowData.first_name = item.firstName || null;
    rowData.last_name = item.lastName || null;
    if (item.email) rowData.email = String(item.email).trim();
    rowData.phone = item.phone || null;
    rowData.department = item.department || 'Direction Générale';
    rowData.position = item.position || item.role || item.roleType || null;
    rowData.role_type = item.roleType || item.role || 'Employé';
    rowData.status = item.status === true || item.status === 'en_poste';
    rowData.hire_date = item.hireDate ? String(item.hireDate).split('T')[0] : null;
    rowData.salary = Number(item.salary || 0);
    rowData.photo_url = item.photoUrl || item.avatarUrl || null;
    rowData.emergency_contact = item.emergencyContact || null;
    rowData.work_location = item.workLocation || 'Douala';
    rowData.badge_code = item.badgeCode || null;
    if (item.userId) {
      if (typeof item.userId === 'number') rowData.user_id = item.userId;
      else if (typeof item.userId === 'string' && /^\d+$/.test(item.userId)) rowData.user_id = Number(item.userId);
    }
    if (item.roleId) rowData.role_id = Number(item.roleId);
  } else if (table === 'disciplinary_incidents') {
    rowData.employee_name = item.employeeName || null;
    rowData.date = item.date || new Date().toISOString().split('T')[0];
    rowData.severity = item.severity || 'mineure';
    rowData.reason = item.reason || 'Incident disciplinaire';
    rowData.action_taken = item.actionTaken || null;
    rowData.decision_by = item.decisionBy || null;
    if (item.employeeId) {
      const resolvedId = await resolveEmployeeDbId(supabaseAdmin, item.employeeId);
      if (resolvedId) rowData.employee_id = resolvedId;
    }
  } else if (table === 'rh_document_templates') {
    rowData.name = String(item.name || item.title || 'Modèle RH').trim() || 'Modèle RH';
    rowData.code = String(item.code || docId || `code_${Date.now()}`).trim();
    rowData.type = String(item.type || item.documentType || 'general').trim();
    rowData.content_template = String(item.contentTemplate || item.content || item.template || 'Contenu du modèle').trim();
  } else if (table === 'company_settings') {
    rowData.setting_key = 'main_config';
  } else if (table === 'visitor_logs') {
    rowData.visitor_name = item.visitorName || item.visitor_name || item.name || 'Visiteur';
    rowData.visitor_company = item.visitorCompany || item.visitor_company || null;
    rowData.visitor_phone = item.visitorPhone || item.visitor_phone || '';
    rowData.id_card_number = item.idCardNumber || item.id_card_number || null;
    rowData.site_location = item.siteLocation || item.site_location || 'Siège Akwa';
    rowData.purpose = item.purpose || 'rdv_commercial';
    rowData.host_employee_id = item.hostEmployeeId ? String(item.hostEmployeeId) : null;
    rowData.host_employee_name = item.hostEmployeeName || item.host_employee_name || null;
    rowData.badge_number = item.badgeNumber || item.badge_number || null;
    rowData.vehicle_plate = item.vehiclePlate || item.vehicle_plate || null;
    rowData.check_in_time = item.checkInTime || item.check_in_time || null;
    rowData.check_in_date = item.checkInDate || item.check_in_date || new Date().toISOString().split('T')[0];
    rowData.check_out_time = item.checkOutTime || item.check_out_time || null;
    rowData.status = item.status || 'sur_site';
  } else if (table === 'leave_requests') {
    rowData.employee_name = item.employeeName || item.employee_name || null;
    rowData.type = item.type || 'conge_annuel';
    rowData.start_date = item.startDate ? String(item.startDate).split('T')[0] : new Date().toISOString().split('T')[0];
    rowData.end_date = item.endDate ? String(item.endDate).split('T')[0] : new Date().toISOString().split('T')[0];
    rowData.days_count = Number(item.daysCount || 1);
    rowData.reason = item.reason || null;
    rowData.status = item.status || 'pending';
    rowData.decided_by = item.decidedBy || null;
    rowData.decided_at = item.decidedAt || null;
    rowData.decision_reason = item.managerComment || item.decisionReason || null;
    if (item.employeeId) {
      const resolvedId = await resolveEmployeeDbId(supabaseAdmin, item.employeeId);
      if (resolvedId) rowData.employee_id = resolvedId;
    }
  } else if (table === 'absences') {
    rowData.employee_name = item.employeeName || item.employee_name || null;
    rowData.date = item.date ? String(item.date).split('T')[0] : new Date().toISOString().split('T')[0];
    rowData.type = item.type || 'non_justifie';
    rowData.reason = item.reason || null;
    rowData.status = item.status || 'en_attente';
    if (item.employeeId) {
      const resolvedId = await resolveEmployeeDbId(supabaseAdmin, item.employeeId);
      if (resolvedId) rowData.employee_id = resolvedId;
    }
  } else if (table === 'hse_incidents') {
    rowData.title = item.title;
    rowData.site_location = item.site || item.siteLocation || 'Base Japoma - Carrefour Matango';
    rowData.zone_precise = item.zonePrecise || null;
    rowData.type = item.type || 'presque_accident';
    rowData.severity = item.severity || 'faible';
    rowData.date = item.date || new Date().toISOString().split('T')[0];
    rowData.time = item.time || null;
    rowData.description = item.description || null;
    rowData.reported_by = item.reportedBy || null;
    rowData.victim_name = item.victimName || null;
    rowData.days_lost = Number(item.daysLost || 0);
    rowData.status = item.status || 'signale';
  }
}
