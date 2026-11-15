import { supabaseAdmin } from '../../lib/supabase';
import { resolveEmployeeDbId, resolveUserDbId } from './tableHelpers';

export async function populateCoreRowData(table: string, item: any, rowData: any): Promise<boolean> {
  if (table === 'notifications') {
    rowData.title = item.title || 'Notification';
    rowData.message = item.message || item.content || item.description || item.payload || item.title || 'Notification système';
    rowData.type = item.type || 'system';
    rowData.is_read = Boolean(item.isRead ?? item.read ?? false);

    const resolvedUserId = await resolveUserDbId(
      supabaseAdmin,
      item.targetUserId || item.target_user_id || item.recipient,
      item.recipient
    );
    rowData.target_user_id = resolvedUserId || null;

    if (item.targetUserIds && Array.isArray(item.targetUserIds)) {
      rowData.target_user_ids = item.targetUserIds;
    }
    if (item.targetEmployeeIds && Array.isArray(item.targetEmployeeIds)) {
      rowData.target_employee_ids = item.targetEmployeeIds;
    } else if (item.employeeId || item.targetEmployeeId) {
      const empDbId = await resolveEmployeeDbId(supabaseAdmin, item.employeeId || item.targetEmployeeId);
      if (empDbId) rowData.target_employee_ids = [empDbId];
    }
    return true;
  }

  if (table === 'presences') {
    rowData.employee_name = item.employeeName || item.employee_name || null;
    rowData.date = item.date || new Date().toISOString().split('T')[0];
    rowData.arrival_time = item.arrivalTime || null;
    rowData.departure_time = item.departureTime || null;
    rowData.status = item.status || 'present';
    rowData.late_minutes = Number(item.lateMinutes || 0);
    rowData.pause_minutes = Number(item.pauseMinutes || 0);
    rowData.motif = item.motif || item.adminBadgeReason || null;
    rowData.signature = item.signature || null;
    rowData.gps_lat = typeof item.latitude === 'number' ? item.latitude : (typeof item.gpsLat === 'number' ? item.gpsLat : null);
    rowData.gps_lng = typeof item.longitude === 'number' ? item.longitude : (typeof item.gpsLng === 'number' ? item.gpsLng : null);
    rowData.method = item.clockingMethod || item.method || 'kiosk';
    if (item.employeeId) {
      const resolvedId = await resolveEmployeeDbId(supabaseAdmin, item.employeeId);
      if (resolvedId) rowData.employee_id = resolvedId;
    }
    return true;
  }

  if (table === 'attendance_incidents') {
    rowData.date = item.date || new Date().toISOString().split('T')[0];
    rowData.type = item.type || 'retard';
    rowData.description = item.reason || item.description || item.origin || 'Incident de présence';
    rowData.status = item.status || 'en_attente';
    if (item.employeeId) {
      const resolvedId = await resolveEmployeeDbId(supabaseAdmin, item.employeeId);
      if (resolvedId) rowData.employee_id = resolvedId;
    }
    return true;
  }

  if (table === 'badge_codes_16') {
    rowData.code = item.code || '';
    rowData.assigned_name = item.assignedName || item.employeeName || null;
    rowData.created_by = item.createdBy || item.generatedBy || 'Responsable';
    rowData.expires_at = item.expiresAt || null;
    rowData.is_used = Boolean(item.isUsed);
    rowData.used_at = item.usedAt || null;
    if (item.employeeId || item.usedByEmployeeId) {
      const resolvedId = await resolveEmployeeDbId(supabaseAdmin, item.employeeId || item.usedByEmployeeId);
      if (resolvedId) rowData.employee_id = resolvedId;
    }
    return true;
  }

  if (table === 'dynamic_qr_sessions') {
    rowData.session_id = item.sessionId || item.id || `dyn_${Date.now()}`;
    rowData.created_by = item.createdBy || item.generatedBy || 'Responsable';
    rowData.expires_at = item.expiresAt || null;
    rowData.is_active = item.isActive !== false;
    return true;
  }

  if (table === 'tasks') {
    rowData.title = item.title || 'Tâche';
    rowData.description = item.description || null;
    rowData.date = item.date || null;
    rowData.time = item.time || null;
    rowData.status = item.status || 'todo';
    rowData.priority = item.priority || 'medium';
    rowData.assigned_to = item.assignedTo || null;
    rowData.department = item.department || null;
    rowData.due_date = item.dueDate || null;
    rowData.is_milestone = Boolean(item.isMilestone);
    rowData.milestone_progress = Number(item.milestoneProgress || 0);
    if (item.employeeId) {
      const resolvedId = await resolveEmployeeDbId(supabaseAdmin, item.employeeId);
      if (resolvedId) rowData.employee_id = resolvedId;
      else rowData.employee_id = null;
    } else {
      rowData.employee_id = null;
    }
    if (item.projectId && /^\d+$/.test(String(item.projectId))) {
      rowData.project_id = Number(item.projectId);
    } else {
      rowData.project_id = null;
    }
    return true;
  }

  if (table === 'reminders') {
    rowData.title = item.title || 'Rappel';
    rowData.note = item.note || item.description || null;
    rowData.date = item.date || null;
    rowData.time = item.time || null;
    rowData.location = item.location || null;
    rowData.all_employees = Boolean(item.allEmployees);
    rowData.trigger_before = item.triggerBefore || null;
    rowData.triggered = Boolean(item.triggered);
    rowData.stopped = Boolean(item.stopped);
    if (item.employeeId) {
      const resolvedId = await resolveEmployeeDbId(supabaseAdmin, item.employeeId);
      if (resolvedId) rowData.employee_id = resolvedId;
    }
    return true;
  }

  return false;
}
