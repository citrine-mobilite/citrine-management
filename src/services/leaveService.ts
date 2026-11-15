import { LeaveRequest, LeaveStatus, Employee, NotificationLog } from '../types';
import {
  COLLECTIONS,
  subscribeToCollection,
  saveDocument,
  deleteDocument,
  getCollection,
} from './dataService';
import {
  notifyNewLeaveCreated,
  syncEmployeeMissionOnApproval,
  notifyLeaveDecisionOutcome,
  notifyAdminLeaveCreated,
} from './leaveNotificationHelpers';

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
  _onAddNotification?: (n: NotificationLog) => void
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

  await saveDocument(COLLECTIONS.LEAVE_REQUESTS, newLeave);
  await notifyNewLeaveCreated(newLeave, days, now);

  return newLeave;
}

/**
 * Arbitrage d'une demande par le responsable :
 * - Validation
 * - Refus
 * - Modification de la durée / période
 */
export async function decideLeaveRequest(
  _leaveId: string,
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

  await saveDocument(COLLECTIONS.LEAVE_REQUESTS, updated);

  const effectiveDays = updated.approvedDaysCount ?? updated.daysCount;
  const effectiveStart = updated.approvedStartDate ?? updated.startDate;
  const effectiveEnd = updated.approvedEndDate ?? updated.endDate;

  if (existingLeave.type === 'mission_professionnelle' && (decision.status === 'approved' || decision.status === 'modified')) {
    await syncEmployeeMissionOnApproval(existingLeave, employee, effectiveStart, effectiveEnd, effectiveDays, now);
  }

  await notifyLeaveDecisionOutcome({
    decision,
    existingLeave,
    updated,
    employee,
    effectiveDays,
    effectiveStart,
    effectiveEnd,
    now,
    onAddNotification,
  });

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

  await saveDocument(COLLECTIONS.LEAVE_REQUESTS, newLeave);
  await notifyAdminLeaveCreated(newLeave, days, status, now, authorUser, onAddNotification);

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
