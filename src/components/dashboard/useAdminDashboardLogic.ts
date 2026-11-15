import { useState, useEffect, useMemo } from 'react';
import { Employee, Presence, Task, Reminder } from '../../types';
import { isEmployeeOnlyRole } from '../../utils/roleUtils';
import {
  formatDeadlineFrenchDate,
  getHomeUrgentReminders,
  sortRemindersByUrgency,
} from '../../services/reminderService';

interface UseAdminDashboardLogicProps {
  employees: Employee[];
  presences: Presence[];
  tasks: Task[];
  reminders: Reminder[];
  onUpdateReminders?: (updated: Reminder[]) => void;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}

export function useAdminDashboardLogic({
  employees,
  presences,
  tasks,
  reminders,
  onUpdateReminders,
  showToast,
}: UseAdminDashboardLogicProps) {
  const [realTime, setRealTime] = useState(() =>
    new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setRealTime(
        new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const clockableEmployees = useMemo(() => {
    return employees.filter((e) => {
      const isRoleOk = isEmployeeOnlyRole(e.roleType || e.role || e.position);
      const st = e.employmentStatus || (typeof e.status === 'string' ? e.status : (e.status ? 'en_poste' : 'parti'));
      const isInPoste = st === 'en_poste' || st === ('true' as any);
      return isRoleOk && isInPoste;
    });
  }, [employees]);

  const clockableEmployeeIds = useMemo(
    () => new Set(clockableEmployees.map((e) => String(e.id))),
    [clockableEmployees]
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const todayPresences = presences.filter(
    (p) => p.date === todayStr && clockableEmployeeIds.has(String(p.employeeId))
  );
  const presentCount = todayPresences.filter((p) => p.status === 'present' && p.arrivalTime).length;
  const lateCount = todayPresences.filter((p) => p.status === 'late' && p.arrivalTime).length;

  const pendingTasks = tasks.filter((t) => t.status !== 'completed');
  const urgentReminders = useMemo(() => getHomeUrgentReminders(reminders), [reminders]);
  const sortedReminders = useMemo(() => sortRemindersByUrgency(reminders), [reminders]);
  const activeRemindersCount = urgentReminders.length;

  const handleRenewOrResolveFromHome = (renewedReminder: Reminder) => {
    if (!onUpdateReminders) return;
    onUpdateReminders(reminders.map((r) => (r.id === renewedReminder.id ? renewedReminder : r)));
    if (showToast) {
      const nextDate = renewedReminder.expirationDate || renewedReminder.date;
      showToast(
        renewedReminder.isResolved
          ? `"${renewedReminder.title}" validé avec succès.`
          : `"${renewedReminder.title}" renouvelé jusqu'au ${formatDeadlineFrenchDate(nextDate)}.`,
        'success'
      );
    }
  };

  const attendanceRate =
    clockableEmployees.length > 0 ? Math.round((presentCount / clockableEmployees.length) * 100) : 0;

  return {
    realTime,
    clockableEmployees,
    todayPresences,
    presentCount,
    lateCount,
    pendingTasks,
    sortedReminders,
    activeRemindersCount,
    attendanceRate,
    handleRenewOrResolveFromHome,
  };
}
