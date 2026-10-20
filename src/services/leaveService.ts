import { LeaveRequest, LeaveType, LeaveStatus, Employee, AppUser, NotificationLog, LEAVE_TYPE_LABELS } from '../types';
import { 
  COLLECTIONS, 
  subscribeToCollection, 
  saveDocument, 
  deleteDocument,
  getCollection 
} from './dataService';
import { pushNotificationBridgeService } from './pushNotificationBridgeService';
import { soundService } from './soundService';
import { logSystemAudit } from './adminAuditService';

// (Zero localStorage architecture)

/**
 * Calcul du nombre de jours entre deux dates (inclusif)
 */
export function calculateDaysBetween(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 1;
}

/**
 * Souscription temps réel aux demandes de congés
 */
export function subscribeToLeaveRequests(callback: (leaves: LeaveRequest[]) => void) {
  return subscribeToCollection<LeaveRequest>(COLLECTIONS.LEAVE_REQUESTS, (list) => {
    const sorted = [...(list || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    callback(sorted);
  });
}

/**
 * Création d'une nouvelle demande de congé par un employé
 */
export async function createLeaveRequest(
  data: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>,
  onAddNotification?: (n: NotificationLog) => void
): Promise<LeaveRequest> {
  const newId = `leave-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const days = data.daysCount > 0 ? data.daysCount : calculateDaysBetween(data.startDate, data.endDate);

  const newLeave: LeaveRequest = {
    id: newId,
    ...data,
    daysCount: days,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  // 1. Sauvegarde Firestore
  await saveDocument(COLLECTIONS.LEAVE_REQUESTS, newLeave);

  // 2. Notification Push au responsable / direction (exclut l'employé créateur pour qu'il ne reçoive pas son propre push)
  const typeLabel = LEAVE_TYPE_LABELS[newLeave.type]?.label || 'Congé / Permission';
  pushNotificationBridgeService.sendPush({
    title: `Nouvelle demande : ${newLeave.employeeName}`,
    message: `${typeLabel} du ${newLeave.startDate} au ${newLeave.endDate} (${days} jour${days > 1 ? 's' : ''}). Motif : ${newLeave.reason}`,
    senderName: newLeave.employeeName,
    senderAvatar: newLeave.employeeAvatar,
    type: 'alert',
    excludeUserId: newLeave.employeeId,
  });

  // 3. NotificationLog persistée dans l'onglet notifications
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

  // Émission d'un événement global pour actualiser les badges
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('citrine:leave_requests_updated'));
  }

  return newLeave;
}

/**
 * Arbitrage d'une demande par le responsable :
 * - Validation
 * - Refus
 * - Modification de la durée / période
 */
export async function decideLeaveRequest(
  leaveId: string,
  decision: {
    status: 'approved' | 'rejected' | 'modified';
    managerComment?: string;
    approvedStartDate?: string;
    approvedEndDate?: string;
    approvedDaysCount?: number;
    decidedBy: string;
    decidedByUserId?: string;
  },
  existingLeave: LeaveRequest,
  employee?: Employee,
  onAddNotification?: (n: NotificationLog) => void
): Promise<LeaveRequest> {
  const now = new Date().toISOString();

  const updated: LeaveRequest = {
    ...existingLeave,
    status: decision.status,
    managerComment: decision.managerComment || existingLeave.managerComment,
    approvedStartDate: decision.approvedStartDate || existingLeave.startDate,
    approvedEndDate: decision.approvedEndDate || existingLeave.endDate,
    approvedDaysCount: decision.approvedDaysCount ?? existingLeave.daysCount,
    decidedBy: decision.decidedBy,
    decidedByUserId: decision.decidedByUserId,
    decidedAt: now,
    updatedAt: now,
  };

  // 1. Sauvegarde Firestore
  await saveDocument(COLLECTIONS.LEAVE_REQUESTS, updated);

  const effectiveDays = updated.approvedDaysCount ?? updated.daysCount;
  const effectiveStart = updated.approvedStartDate ?? updated.startDate;
  const effectiveEnd = updated.approvedEndDate ?? updated.endDate;
  const todayStr = new Date().toISOString().split('T')[0];

  // Si c'est une mission professionnelle et qu'elle est approuvée ou modifiée
  if (existingLeave.type === 'mission_professionnelle' && (decision.status === 'approved' || decision.status === 'modified')) {
    if (employee) {
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

        // Mettre à jour également le statut de compte AppUser
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
  }

  // 2. Notification Push envoyée au collaborateur
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

  // 3. NotificationLog persistée pour l'employé
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

  // Audit Log
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

  // Émission d'un événement global
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('citrine:leave_requests_updated'));
    window.dispatchEvent(new CustomEvent('citrine:new_unread_alert'));
  }

  return updated;
}

/**
 * Création directe d'un congé ou d'une permission pour un collaborateur par un manager/administrateur
 */
export async function createAdminLeaveRequest(
  data: Omit<LeaveRequest, 'id' | 'createdAt'> & { status?: LeaveStatus },
  authorUser?: { id?: string; name?: string; role?: string } | null,
  onAddNotification?: (n: NotificationLog) => void
): Promise<LeaveRequest> {
  const newId = `leave-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const days = data.daysCount > 0 ? data.daysCount : calculateDaysBetween(data.startDate, data.endDate);
  const status: LeaveStatus = data.status || 'approved';

  const newLeave: LeaveRequest = {
    ...data,
    id: newId,
    daysCount: days,
    status,
    approvedStartDate: status === 'approved' ? data.startDate : undefined,
    approvedEndDate: status === 'approved' ? data.endDate : undefined,
    approvedDaysCount: status === 'approved' ? days : undefined,
    decidedBy: status === 'approved' ? (authorUser?.name || 'Direction RH') : undefined,
    decidedByUserId: status === 'approved' ? authorUser?.id : undefined,
    decidedAt: status === 'approved' ? now : undefined,
    createdAt: now,
    updatedAt: now,
  };

  // 1. Sauvegarde
  await saveDocument(COLLECTIONS.LEAVE_REQUESTS, newLeave);

  // 2. Notification Push
  const typeLabel = LEAVE_TYPE_LABELS[newLeave.type]?.label || 'Congé / Permission';
  pushNotificationBridgeService.sendPush({
    title: status === 'approved' ? `Congé / Permission accordé(e) : ${newLeave.employeeName}` : `Nouvelle permission enregistrée : ${newLeave.employeeName}`,
    message: `${typeLabel} accordé(e) du ${newLeave.startDate} au ${newLeave.endDate} (${days} jour(s)). ${newLeave.reason ? `Motif : ${newLeave.reason}` : ''}`,
    senderName: authorUser?.name || 'Direction RH',
    type: 'alert',
  });

  // 3. Notification log
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

  // 4. Audit Log
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

  return newLeave;
}

/**
 * Suppression ou annulation d'une demande de congé
 */
export async function deleteLeaveRequest(id: string): Promise<void> {
  await deleteDocument(COLLECTIONS.LEAVE_REQUESTS, id);
  try {
    await deleteDocument(COLLECTIONS.NOTIFICATIONS, `notif-leave-${id}`);
  } catch {}
  try {
    const notifs = await getCollection<NotificationLog>(COLLECTIONS.NOTIFICATIONS);
    for (const n of notifs) {
      if (n.payload && n.payload.includes(id)) {
        await deleteDocument(COLLECTIONS.NOTIFICATIONS, n.id);
      }
    }
  } catch {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('citrine:leave_requests_updated'));
  }
}
