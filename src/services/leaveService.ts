import { LeaveRequest, LeaveType, LeaveStatus, Employee, NotificationLog, LEAVE_TYPE_LABELS } from '../types';
import { 
  COLLECTIONS, 
  subscribeToCollection, 
  saveDocument, 
  deleteDocument,
  getCollection 
} from './dataService';
import { pushNotificationBridgeService } from './pushNotificationBridgeService';
import { soundService } from './soundService';

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

  // 2. Notification Push envoyée au collaborateur
  let decisionTitle = '';
  let decisionMsg = '';

  const effectiveDays = updated.approvedDaysCount ?? updated.daysCount;
  const effectiveStart = updated.approvedStartDate ?? updated.startDate;
  const effectiveEnd = updated.approvedEndDate ?? updated.endDate;

  if (decision.status === 'approved') {
    decisionTitle = 'Demande de congé validée ✓';
    decisionMsg = `Votre demande a été approuvée pour ${effectiveDays} jour(s) du ${effectiveStart} au ${effectiveEnd}. ${decision.managerComment ? `Note : ${decision.managerComment}` : ''}`;
  } else if (decision.status === 'rejected') {
    decisionTitle = 'Demande de congé refusée ✕';
    decisionMsg = `Votre demande du ${updated.startDate} au ${updated.endDate} a été refusée. ${decision.managerComment ? `Motif du refus : ${decision.managerComment}` : ''}`;
  } else if (decision.status === 'modified') {
    decisionTitle = 'Durée de congé ajustée par le responsable ⚠️';
    decisionMsg = `La durée de votre demande a été réajustée à ${effectiveDays} jour(s) (du ${effectiveStart} au ${effectiveEnd}). Note : ${decision.managerComment || 'Ajustement de planning'}`;
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

  // Émission d'un événement global
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('citrine:leave_requests_updated'));
    window.dispatchEvent(new CustomEvent('citrine:new_unread_alert'));
  }

  return updated;
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
