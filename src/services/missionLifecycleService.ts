import { LeaveRequest, Employee, AppUser, NotificationLog } from '../types';
import { COLLECTIONS, saveDocument } from './dataService';
import {
  activateEmployeeMissionStatus,
  hasOtherActiveMissionForEmployee,
  restoreEmployeeAndUserToPost,
} from './missions/missionStatusHelpers';

export async function syncMissionsAndEmployeeStatus(
  leaveRequests: LeaveRequest[],
  employees: Employee[],
  users: AppUser[],
  onUpdateLeaveRequests?: (leaves: LeaveRequest[]) => void,
  onUpdateEmployees?: (employees: Employee[]) => void,
  onUpdateUsers?: (users: AppUser[]) => void,
  onAddNotification?: (n: NotificationLog) => void
): Promise<{ updatedLeaves: LeaveRequest[]; updatedEmployees: Employee[]; updatedUsers: AppUser[] }> {
  if (!leaveRequests || !employees) {
    return { updatedLeaves: leaveRequests || [], updatedEmployees: employees || [], updatedUsers: users || [] };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  let hasLeavesChanged = false;
  let hasEmployeesChanged = false;
  let hasUsersChanged = false;

  const currentLeaves = [...leaveRequests];
  const currentEmployees = [...employees];
  const currentUsers = [...(users || [])];

  for (let i = 0; i < currentLeaves.length; i++) {
    const leave = currentLeaves[i];
    if (leave.type !== 'mission_professionnelle') continue;

    const start = leave.approvedStartDate || leave.startDate;
    const end = leave.approvedEndDate || leave.endDate;
    const currentHour = new Date().getHours();
    const isPastEnd = todayStr > end;
    const isSameDayEnded = todayStr === end && currentHour >= 18;
    const isActiveStatus = leave.status === 'approved' || leave.status === 'modified';

    if (isActiveStatus && (isPastEnd || isSameDayEnded)) {
      const finishedLeave: LeaveRequest = {
        ...leave,
        status: 'terminee',
        updatedAt: new Date().toISOString(),
      };
      currentLeaves[i] = finishedLeave;
      hasLeavesChanged = true;
      await saveDocument(COLLECTIONS.LEAVE_REQUESTS, finishedLeave);

      if (!hasOtherActiveMissionForEmployee(currentLeaves, leave.id, leave.employeeId, todayStr)) {
        const res = await restoreEmployeeAndUserToPost({
          leave,
          employees: currentEmployees,
          users: currentUsers,
          start,
          end,
          actorName: 'Système Automatique RH',
          isManual: false,
          onAddNotification,
        });
        if (res.employeeUpdated) hasEmployeesChanged = true;
        if (res.userUpdated) hasUsersChanged = true;
      }
    } else if (isActiveStatus && todayStr >= start && todayStr <= end) {
      const res = await activateEmployeeMissionStatus(leave, currentEmployees, currentUsers);
      if (res.employeeUpdated) hasEmployeesChanged = true;
      if (res.userUpdated) hasUsersChanged = true;
    }
  }

  if (hasLeavesChanged && onUpdateLeaveRequests) onUpdateLeaveRequests(currentLeaves);
  if (hasEmployeesChanged && onUpdateEmployees) onUpdateEmployees(currentEmployees);
  if (hasUsersChanged && onUpdateUsers) onUpdateUsers(currentUsers);

  return { updatedLeaves: currentLeaves, updatedEmployees: currentEmployees, updatedUsers: currentUsers };
}

export async function terminateMission(
  leaveId: string,
  leaveRequests: LeaveRequest[],
  employees: Employee[],
  users: AppUser[],
  actorName: string = 'Responsable RH',
  onUpdateLeaveRequests?: (leaves: LeaveRequest[]) => void,
  onUpdateEmployees?: (employees: Employee[]) => void,
  onUpdateUsers?: (users: AppUser[]) => void,
  onAddNotification?: (n: NotificationLog) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    const leaveIndex = leaveRequests.findIndex((l) => l.id === leaveId);
    if (leaveIndex < 0) return { success: false, error: 'Mission introuvable.' };

    const leave = leaveRequests[leaveIndex];
    const now = new Date().toISOString();
    const finishedLeave: LeaveRequest = { ...leave, status: 'terminee', updatedAt: now };

    const updatedLeaves = [...leaveRequests];
    updatedLeaves[leaveIndex] = finishedLeave;
    await saveDocument(COLLECTIONS.LEAVE_REQUESTS, finishedLeave);
    if (onUpdateLeaveRequests) onUpdateLeaveRequests(updatedLeaves);

    const todayStr = now.split('T')[0];
    if (!hasOtherActiveMissionForEmployee(updatedLeaves, leave.id, leave.employeeId, todayStr)) {
      const updatedEmps = [...employees];
      const updatedUsers = [...users];
      const res = await restoreEmployeeAndUserToPost({
        leave,
        employees: updatedEmps,
        users: updatedUsers,
        start: leave.startDate,
        end: leave.endDate,
        actorName,
        isManual: true,
        onAddNotification,
      });
      if (res.employeeUpdated && onUpdateEmployees) onUpdateEmployees(updatedEmps);
      if (res.userUpdated && onUpdateUsers) onUpdateUsers(updatedUsers);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Erreur lors de la clôture de mission:', err);
    return { success: false, error: err?.message || 'Erreur lors de la clôture.' };
  }
}
