import { LeaveRequest, LeaveStatus, Employee, AppUser, NotificationLog, LEAVE_TYPE_LABELS } from '../types';
import {
  COLLECTIONS,
  saveDocument,
  getCollection,
} from './dataService';
import { pushNotificationBridgeService } from './pushNotificationBridgeService';
import { soundService } from './soundService';
import { logSystemAudit } from './adminAuditService';

export async function notifyNewLeaveCreated(newLeave: LeaveRequest, days: number, now: string): Promise<void> {
  const typeLabel = LEAVE_TYPE_LABELS[newLeave.type]?.label || 'Congé / Permission';
  pushNotificationBridgeService.sendPush({
    title: `Nouvelle demande : ${newLeave.employeeName}`,
    message: `${typeLabel} du ${newLeave.startDate} au ${newLeave.endDate} (${days} jour${days > 1 ? 's' : ''}). Motif : ${newLeave.reason}`,
    senderName: newLeave.employeeName,
    senderAvatar: newLeave.employeeAvatar,
    type: 'alert',
    excludeUserId: newLeave.employeeId,
  });

  const notif: NotificationLog = {
    id: `notif-leave-${newLeave.id}`,
    type: 'system',
    recipient: 'Direction RH & Responsables',
    title: `Demande de ${typeLabel} : ${newLeave.employeeName}`,
    content: `${newLeave.employeeName} (${newLeave.department || 'Opérations'}) sollicite ${days} jour(s) du ${newLeave.startDate} au ${newLeave.endDate}. Motif : ${newLeave.reason}`,
    payload: JSON.stringify({
      source: 'leave_request',
      leaveId: newLeave.id,
      employeeId: newLeave.employeeId,
      employeeName: newLeave.employeeName,
      type: newLeave.type,
      startDate: newLeave.startDate,
      endDate: newLeave.endDate,
      daysCount: days,
    }),
    timestamp: now,
    read: false,
  };

  await saveDocument(COLLECTIONS.NOTIFICATIONS, notif);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('citrine:leave_requests_updated'));
  }
}

export async function syncEmployeeMissionOnApproval(
  existingLeave: LeaveRequest,
  employee: Employee | undefined,
  effectiveStart: string,
  effectiveEnd: string,
  effectiveDays: number,
  now: string
): Promise<void> {
  if (!employee) return;
  const todayStr = new Date().toISOString().split('T')[0];
  const isOngoingToday = todayStr >= effectiveStart && todayStr <= effectiveEnd;
  const updatedMissionHistory = [
    {
      id: `mission-${existingLeave.id}-${Date.now()}`,
      reason: existingLeave.reason,
      startDate: effectiveStart,
      endDate: effectiveEnd,
      durationDays: effectiveDays,
      createdAt: now,
    },
    ...(employee.missionHistory || []),
  ];

  const updatedEmp: Employee = {
    ...employee,
    employmentStatus: isOngoingToday ? 'en_mission' : employee.employmentStatus,
    status: isOngoingToday ? 'en_mission' : employee.status,
    missionHistory: updatedMissionHistory,
    updatedAt: now,
  };

  try {
    await saveDocument(COLLECTIONS.EMPLOYEES, updatedEmp);

    if (isOngoingToday && (employee.userId || employee.email)) {
      const users = await getCollection<AppUser>(COLLECTIONS.USERS);
      const targetUser = users.find(
        (u) =>
          (employee.userId && String(u.id) === String(employee.userId)) ||
          (employee.email && u.email && u.email.toLowerCase() === employee.email.toLowerCase()) ||
          (u.employeeId && String(u.employeeId) === String(employee.id))
      );
      if (targetUser && targetUser.employmentStatus !== 'en_mission') {
        await saveDocument(COLLECTIONS.USERS, {
          ...targetUser,
          employmentStatus: 'en_mission',
        });
      }
    }
  } catch (e) {
    console.warn('Error updating employee/user mission status:', e);
  }
}

export async function notifyLeaveDecisionOutcome(params: {
  decision: {
    status: 'approved' | 'rejected' | 'modified';
    managerComment?: string;
    decidedBy: string;
  };
  existingLeave: LeaveRequest;
  updated: LeaveRequest;
  employee?: Employee;
  effectiveDays: number;
  effectiveStart: string;
  effectiveEnd: string;
  now: string;
  onAddNotification?: (n: NotificationLog) => void;
}): Promise<void> {
  const { decision, existingLeave, updated, employee, effectiveDays, effectiveStart, effectiveEnd, now, onAddNotification } = params;
  let decisionTitle = '';
  let decisionMsg = '';
  const isMission = existingLeave.type === 'mission_professionnelle';

  if (decision.status === 'approved') {
    decisionTitle = isMission ? 'Mission professionnelle validée ✓' : 'Demande de congé validée ✓';
    decisionMsg = isMission
      ? `Votre mission professionnelle a été approuvée pour ${effectiveDays} jour(s) du ${effectiveStart} au ${effectiveEnd}. ${decision.managerComment ? `Note : ${decision.managerComment}` : ''}`
      : `Votre demande a été approuvée pour ${effectiveDays} jour(s) du ${effectiveStart} au ${effectiveEnd}. ${decision.managerComment ? `Note : ${decision.managerComment}` : ''}`;
  } else if (decision.status === 'rejected') {
    decisionTitle = isMission ? 'Mission professionnelle refusée ✕' : 'Demande de congé refusée ✕';
    decisionMsg = `Votre demande du ${updated.startDate} au ${updated.endDate} a été refusée. ${decision.managerComment ? `Motif du refus : ${decision.managerComment}` : ''}`;
  } else if (decision.status === 'modified') {
    decisionTitle = isMission ? 'Période de mission réajustée ⚠️' : 'Durée de congé ajustée par le responsable ⚠️';
    decisionMsg = `La durée de votre mission a été réajustée à ${effectiveDays} jour(s) (du ${effectiveStart} au ${effectiveEnd}). Note : ${decision.managerComment || 'Ajustement de planning'}`;
  }

  pushNotificationBridgeService.sendPush({
    title: decisionTitle,
    message: decisionMsg,
    senderName: decision.decidedBy,
    type: 'alert',
  });

  try {
    soundService.playAlertNotification(0.65);
  } catch {}

  const recipientTarget = employee?.email || employee?.name || updated.employeeEmail || updated.employeeName;
  const notif: NotificationLog = {
    id: `notif-leave-decision-${updated.id}-${Date.now()}`,
    type: 'system',
    recipient: recipientTarget,
    title: decisionTitle,
    content: decisionMsg,
    payload: JSON.stringify({
      source: 'leave_decision',
      leaveId: updated.id,
      status: updated.status,
      employeeId: updated.employeeId,
      effectiveDays,
      effectiveStart,
      effectiveEnd,
      comment: decision.managerComment,
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
    authorName: decision.decidedBy || 'Responsable RH',
    authorRole: 'admin',
    targetName: existingLeave.employeeName,
    targetEmployeeId: existingLeave.employeeId,
    operationType: 'conge_permission',
    operationLabel: `Décision Congé / Permission : ${decision.status.toUpperCase()}`,
    details: `Demande de ${effectiveDays} jour(s) pour ${existingLeave.employeeName} : ${decision.status}. ${decision.managerComment ? `Note : ${decision.managerComment}` : ''}`,
    level: decision.status === 'approved' ? 'success' : decision.status === 'rejected' ? 'warning' : 'info',
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('citrine:leave_requests_updated'));
    window.dispatchEvent(new CustomEvent('citrine:new_unread_alert'));
  }
}

export async function notifyAdminLeaveCreated(
  newLeave: LeaveRequest,
  days: number,
  status: LeaveStatus,
  now: string,
  authorUser?: { id?: string; name?: string; role?: string } | null,
  onAddNotification?: (n: NotificationLog) => void
): Promise<void> {
  const typeLabel = LEAVE_TYPE_LABELS[newLeave.type]?.label || 'Congé / Permission';
  pushNotificationBridgeService.sendPush({
    title: status === 'approved' ? `Congé / Permission accordé(e) : ${newLeave.employeeName}` : `Nouvelle permission enregistrée : ${newLeave.employeeName}`,
    message: `${typeLabel} accordé(e) du ${newLeave.startDate} au ${newLeave.endDate} (${days} jour(s)). ${newLeave.reason ? `Motif : ${newLeave.reason}` : ''}`,
    senderName: authorUser?.name || 'Direction RH',
    type: 'alert',
  });

  const notif: NotificationLog = {
    id: `notif-leave-${newLeave.id}`,
    type: 'system',
    recipient: newLeave.employeeName,
    title: `${typeLabel} attribué(e) : ${newLeave.employeeName}`,
    content: `${authorUser?.name || 'La Direction RH'} a accordé un(e) ${typeLabel} de ${days} jour(s) du ${newLeave.startDate} au ${newLeave.endDate}.`,
    payload: JSON.stringify(newLeave),
    timestamp: now,
    read: false,
  };

  if (onAddNotification) {
    onAddNotification(notif);
  } else {
    await saveDocument(COLLECTIONS.NOTIFICATIONS, notif);
  }

  logSystemAudit({
    authorName: authorUser?.name || 'Direction RH',
    authorRole: authorUser?.role || 'admin',
    targetName: newLeave.employeeName,
    targetEmployeeId: newLeave.employeeId,
    operationType: 'conge_permission',
    operationLabel: status === 'approved' ? 'Création & Validation de Congé / Permission' : 'Création de Demande de Permission',
    details: `${typeLabel} de ${days} jour(s) pour ${newLeave.employeeName} (du ${newLeave.startDate} au ${newLeave.endDate}). Statut : ${status}. Motif : ${newLeave.reason}`,
    level: 'success',
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('citrine:leave_requests_updated'));
    window.dispatchEvent(new CustomEvent('citrine:new_unread_alert'));
  }
}
