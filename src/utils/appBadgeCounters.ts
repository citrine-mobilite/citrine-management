import { AppUser, Employee, NotificationLog, Presence } from '../types';
import { canSeeAllNotifications, isEmployeeOnlyRole } from './roleUtils';

export function computeUnreadNotificationsCount(
  notifications: NotificationLog[],
  currentUser: AppUser | null
): number {
  if (!currentUser) return 0;
  if (canSeeAllNotifications(currentUser)) return notifications.filter((n) => !n.read).length;
  return notifications.filter(
    (n) =>
      !n.read &&
      ((n.targetUserId && (String(n.targetUserId) === String(currentUser.id) || String(n.targetUserId) === String(currentUser.email))) ||
        n.recipient === currentUser.name ||
        n.recipient === currentUser.email ||
        n.recipient === 'Tous' ||
        n.recipient === 'Broadcast' ||
        (currentUser.phone && n.recipient.includes(currentUser.phone)))
  ).length;
}

export function computeNonBadgedEmployeesCount(
  employees: Employee[],
  presences: Presence[],
  todayStr: string
): number {
  const eligibleEmployees = employees.filter((emp) => {
    if (
      emp.status === false ||
      emp.status === 'parti' ||
      emp.status === 'renvoye' ||
      emp.status === 'demissionne' ||
      emp.status === 'suspendu'
    ) {
      return false;
    }
    return isEmployeeOnlyRole(emp.roleType || emp.role);
  });
  if (eligibleEmployees.length === 0) return 0;

  const badgedIds = new Set(
    presences
      .filter((p) => p.date === todayStr && (Boolean(p.arrivalTime) || p.status === 'present' || p.status === 'late'))
      .map((p) => p.employeeId)
  );
  return Math.max(0, eligibleEmployees.length - eligibleEmployees.filter((emp) => badgedIds.has(emp.id)).length);
}
