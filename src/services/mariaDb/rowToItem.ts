import { mapCollectionToTable } from '../../db/repository/tableHelpers';
import { mapModuleMariaDbRowToItem } from './rowToItemModules';

function parseRowJson(value: any): Record<string, any> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch { return {}; }
  }
  return {};
}

export function mariaDbRowToItem(collectionName: string, row: any): any {
  if (!row) return null;

  if (row.collection && row.data) {
    const dataObj = parseRowJson(row.data);
    return {
      ...dataObj,
      id: row.doc_id || dataObj.id || String(row.id),
      docId: row.doc_id,
      uid: row.uid,
      _dbId: row.id,
    };
  }

  const table = mapCollectionToTable(collectionName);
  if (table === 'employees') {
    const raw = parseRowJson(row.raw_data);
    return {
      ...raw,
      id: String(row.id),
      docId: row.doc_id || raw.docId || raw.doc_id,
      uid: row.uid,
      _dbId: row.id,
      userId: row.user_id ? String(row.user_id) : raw.userId,
      roleId: row.role_id ? String(row.role_id) : raw.roleId,
      managerId: row.manager_id ? String(row.manager_id) : raw.managerId,
      name: row.name || `${row.first_name || ''} ${row.last_name || ''}`.trim() || raw.name || 'Collaborateur',
      firstName: row.first_name || raw.firstName,
      lastName: row.last_name || raw.lastName,
      email: row.email || raw.email || '',
      phone: row.phone || raw.phone || '',
      roleType: row.role_type || raw.roleType || 'employé',
      role: row.position || raw.role || row.role_type || 'Employé',
      position: row.position || raw.position,
      status: raw.status || raw.employmentStatus || row.employment_status || (row.status ? 'en_poste' : 'parti'),
      employmentStatus: raw.employmentStatus || (typeof raw.status === 'string' && raw.status !== 'actif' && raw.status !== 'inactif' ? raw.status : undefined) || row.employment_status || (row.status ? 'en_poste' : 'parti'),
      hireDate: row.hire_date || raw.hireDate,
      departureDate: row.departure_date || raw.departureDate,
      salary: typeof row.salary === 'number' ? row.salary : (Number(row.salary) || raw.salary || 0),
      avatarUrl: row.avatar_url || raw.avatarUrl || '',
      team: row.team || raw.team,
      teams: Array.isArray(raw.teams) ? raw.teams : undefined,
      allowEarlyDeparture15_17: Boolean(raw.allowEarlyDeparture15_17 || row.allow_early_departure_15_17),
      allowLateArrival8_930: Boolean(raw.allowLateArrival8_930 || row.allow_late_arrival_8_930),
      departureReason: raw.departureReason,
      suspensionReason: raw.suspensionReason,
      suspensionDate: raw.suspensionDate,
      birthDate: raw.birthDate,
      createdAt: row.created_at || raw.createdAt,
      updatedAt: row.updated_at || raw.updatedAt,
    };
  }

  if (table === 'users') {
    const raw = (row.raw_data && typeof row.raw_data === 'object') ? row.raw_data : {};
    let resolvedRole: 'administrateur' | 'responsable' | 'employé' = 'employé';
    if (
      row.role_id === 1 ||
      String(raw.role).toUpperCase() === 'SUPER_ADMIN' ||
      String(raw.role).toLowerCase() === 'administrateur' ||
      String(raw.role).toLowerCase().includes('admin')
    ) {
      resolvedRole = 'administrateur';
    } else if (
      row.role_id === 2 ||
      String(raw.role).toUpperCase() === 'RESPONSABLE' ||
      String(raw.role).toLowerCase() === 'responsable'
    ) {
      resolvedRole = 'responsable';
    } else {
      resolvedRole = 'employé';
    }

    return {
      ...raw,
      id: String(row.id),
      docId: row.doc_id || raw.docId || raw.doc_id,
      uid: row.uid,
      _dbId: row.id,
      name: row.name || raw.name || 'Utilisateur',
      email: row.email || raw.email || '',
      phone: row.phone || raw.phone || '',
      role: resolvedRole,
      roleId: row.role_id ? Number(row.role_id) : (resolvedRole === 'administrateur' ? 1 : resolvedRole === 'responsable' ? 2 : 3),
      status: (row.status === false || row.status === 'inactif') ? 'inactif' : 'actif',
      department: row.department || raw.department || 'Direction Générale',
      avatarUrl: row.avatar_url || raw.avatarUrl || '',
      allowEarlyDeparture15_17: Boolean(raw.allowEarlyDeparture15_17 || row.allow_early_departure_15_17),
      allowLateArrival8_930: Boolean(raw.allowLateArrival8_930 || row.allow_late_arrival_8_930),
      passwordHash: raw.passwordHash || raw.password_hash,
      createdAt: row.created_at || raw.createdAt,
      updatedAt: row.updated_at || raw.updatedAt,
    };
  }

  if (table === 'tasks') {
    const raw = (row.raw_data && typeof row.raw_data === 'object') ? row.raw_data : {};
    const originalId = raw.id || row.doc_id || String(row.id);
    return {
      ...raw,
      id: originalId,
      docId: row.doc_id || originalId,
      _dbId: row.id,
      title: row.title || raw.title || 'Sans titre',
      description: row.description || raw.description || '',
      date: row.date || raw.date || '',
      time: row.time || raw.time || '',
      status: (row.status || raw.status || 'todo') as any,
      priority: (row.priority || raw.priority || 'medium') as any,
      assignedTo: row.assigned_to || raw.assignedTo || 'Équipe',
      employeeId: row.employee_id || raw.employeeId || null,
      department: row.department || raw.department || null,
      projectId: row.project_id || raw.projectId || 'general',
      dueDate: row.due_date || raw.dueDate || null,
      isMilestone: row.is_milestone !== undefined ? Boolean(row.is_milestone) : Boolean(raw.isMilestone),
      milestoneProgress: row.milestone_progress !== undefined ? Number(row.milestone_progress) : Number(raw.milestoneProgress || 0),
      subtasks: raw.subtasks || [],
      comments: raw.comments || [],
      incidents: raw.incidents || [],
      reminderPeriod: raw.reminderPeriod || 'none',
      createdAt: row.created_at || raw.createdAt,
      updatedAt: row.updated_at || raw.updatedAt,
    };
  }

  if (table === 'notifications') {
    const raw = (row.raw_data && typeof row.raw_data === 'object') ? row.raw_data : {};
    const textMsg = row.message || raw.message || raw.content || raw.description || raw.title || 'Notification système';
    return {
      ...raw,
      id: raw.id || row.doc_id || String(row.id),
      uid: row.uid || raw.uid,
      _dbId: row.id,
      title: row.title || raw.title || 'Notification',
      message: textMsg,
      content: raw.content || textMsg,
      type: row.type || raw.type || 'system',
      read: Boolean(row.is_read ?? raw.read ?? false),
      timestamp: row.created_at || raw.timestamp || new Date().toISOString(),
    };
  }

  const moduleMapped = mapModuleMariaDbRowToItem(table, row);
  if (moduleMapped) return moduleMapped;

  const raw = parseRowJson(row.raw_data);
  if (Object.keys(raw).length > 0) {
    return {
      ...raw,
      id: raw.id || row.doc_id || String(row.id),
      uid: row.uid || raw.uid,
      _dbId: row.id,
    };
  }
  return { ...row, id: row.doc_id || String(row.id), uid: row.uid, _dbId: row.id };
}
