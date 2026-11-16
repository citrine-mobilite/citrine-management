import { LeaveRequest, Employee, AppUser, NotificationLog } from '../../types';
import { COLLECTIONS, saveDocument } from '../dataService';
import { pushNotificationBridgeService } from '../pushNotificationBridgeService';
import { logSystemAudit } from '../adminAuditService';

export function hasOtherActiveMissionForEmployee(
  leaveRequests: LeaveRequest[],
  excludedLeaveId: string,
  employeeId: string,
  todayStr: string
): boolean {
  return leaveRequests.some(
    (l) =>
      l.id !== excludedLeaveId &&
      l.employeeId === employeeId &&
      l.type === 'mission_professionnelle' &&
      (l.status === 'approved' || l.status === 'modified') &&
      todayStr >= (l.approvedStartDate || l.startDate) &&
      todayStr <= (l.approvedEndDate || l.endDate)
  );
}

export function findMatchingUserIndex(users: AppUser[], emp: Employee): number {
  return users.findIndex(
    (u) =>
      (emp.userId && String(u.id) === String(emp.userId)) ||
      (emp.email && u.email && u.email.toLowerCase() === emp.email.toLowerCase()) ||
      (u.employeeId && String(u.employeeId) === String(emp.id))
  );
}

export async function restoreEmployeeAndUserToPost(params: {
  leave: LeaveRequest;
  employees: Employee[];
  users: AppUser[];
  start: string;
  end: string;
  actorName: string;
  isManual: boolean;
  onAddNotification?: (n: NotificationLog) => void;
}): Promise<{ employeeUpdated: boolean; userUpdated: boolean }> {
  const { leave, employees, users, start, end, actorName, isManual, onAddNotification } = params;
  const empIdx = employees.findIndex((e) => String(e.id) === String(leave.employeeId));
  if (empIdx < 0) return { employeeUpdated: false, userUpdated: false };

  const emp = employees[empIdx];
  if (!isManual && emp.employmentStatus !== 'en_mission' && emp.status !== 'en_mission') {
    return { employeeUpdated: false, userUpdated: false };
  }

  const now = new Date().toISOString();
  const updatedEmp: Employee = {
    ...emp,
    employmentStatus: 'en_poste',
    status: 'en_poste',
    updatedAt: now,
  };
  employees[empIdx] = updatedEmp;
  await saveDocument(COLLECTIONS.EMPLOYEES, updatedEmp);

  let userUpdated = false;
  const userIdx = findMatchingUserIndex(users, emp);
  if (userIdx >= 0) {
    const updatedU: AppUser = { ...users[userIdx], employmentStatus: 'en_poste' };
    users[userIdx] = updatedU;
    userUpdated = true;
    await saveDocument(COLLECTIONS.USERS, updatedU);
  }

  const operationKey = `mission-restore:${leave.id}`;
  const pushTitle = isManual ? `Mission Clôturée : ${emp.name}` : `Mission Terminée : ${emp.name}`;
  const pushMsg = isManual
    ? `La mission professionnelle de ${emp.name} a été marquée comme terminée par ${actorName}. Statut remis à « En poste ».`
    : `La mission professionnelle de ${emp.name} est officiellement terminée. Le collaborateur et son compte utilisateur ont été automatiquement replacés en statut « En poste ».`;

  pushNotificationBridgeService.sendPush({
    operationKey,
    actionKey: operationKey,
    title: pushTitle,
    message: pushMsg,
    senderName: isManual ? actorName : 'Système RH Citrine',
    type: 'attendance',
    link: 'collaborators',
    suppressLocalNative: true,
    remoteBeams: {
      targetRoles: ['administrateur', 'responsable'],
      targetEmployeeIds: emp.id ? [String(emp.id)] : undefined,
      targetEmails: emp.email ? [emp.email] : undefined,
      targetUserIds: emp.userId ? [String(emp.userId)] : undefined,
    },
  });

  const notif: NotificationLog = {
    id: `notif-mission-${isManual ? 'term' : 'end'}-${leave.id}-${Date.now()}`,
    type: 'system',
    recipient: isManual ? emp.name || emp.email || 'Direction & Collaborateurs' : 'Direction & Collaborateurs',
    title: isManual ? `Mission Terminée : ${emp.name}` : `Fin de Mission : ${emp.name}`,
    content: isManual
      ? `La mission (${start} au ${end}) a été clôturée. Le collaborateur et son compte sont repassés à « En poste ».`
      : `La mission de ${emp.name} (${start} au ${end}) a pris fin. Statut collaborateur et compte utilisateur basculés automatiquement à « En poste ».`,
    payload: JSON.stringify({
      source: 'mission_lifecycle',
      operationKey,
      employeeId: emp.id,
      leaveId: leave.id,
      action: 'returned_to_post',
      ...(isManual ? { closedBy: actorName } : {}),
    }),
    timestamp: now,
    read: false,
  };

  if (onAddNotification) {
    onAddNotification(notif);
  } else {
    await saveDocument(COLLECTIONS.NOTIFICATIONS, notif);
  }

  logSystemAudit({
    authorName: isManual ? actorName : 'Système Automatique RH',
    authorRole: 'admin',
    targetName: emp.name,
    targetEmployeeId: emp.id,
    operationType: 'status_change',
    operationLabel: isManual ? 'Clôture de Mission' : 'Fin de Mission Automatique',
    details: isManual
      ? `Mission ${leave.id} clôturée manuellement par ${actorName}. Statut collaborateur et compte utilisateur repassés à "en_poste".`
      : `Mission ${leave.id} échue au ${end}. Statut collaborateur et compte utilisateur repassés à "en_poste".`,
    level: 'info',
  });

  return { employeeUpdated: true, userUpdated };
}

export async function activateEmployeeMissionStatus(
  leave: LeaveRequest,
  employees: Employee[],
  users: AppUser[]
): Promise<{ employeeUpdated: boolean; userUpdated: boolean }> {
  const empIdx = employees.findIndex((e) => String(e.id) === String(leave.employeeId));
  if (empIdx < 0) return { employeeUpdated: false, userUpdated: false };

  const emp = employees[empIdx];
  if (emp.employmentStatus === 'en_mission') return { employeeUpdated: false, userUpdated: false };

  const updatedEmp: Employee = {
    ...emp,
    employmentStatus: 'en_mission',
    status: 'en_mission',
    updatedAt: new Date().toISOString(),
  };
  employees[empIdx] = updatedEmp;
  await saveDocument(COLLECTIONS.EMPLOYEES, updatedEmp);

  let userUpdated = false;
  const userIdx = findMatchingUserIndex(users, emp);
  if (userIdx >= 0) {
    const updatedU: AppUser = { ...users[userIdx], employmentStatus: 'en_mission' };
    users[userIdx] = updatedU;
    userUpdated = true;
    await saveDocument(COLLECTIONS.USERS, updatedU);
  }

  return { employeeUpdated: true, userUpdated };
}
