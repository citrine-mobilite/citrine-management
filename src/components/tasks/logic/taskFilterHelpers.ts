import { Task, Employee, TaskProject, AppUser } from '../../../types';

export function computeTaskVisibilityScope(
  employees: Employee[],
  projects: TaskProject[],
  isRestrictedStaff: boolean,
  currentUser?: AppUser | null
) {
  const currentEmployee = currentUser
    ? employees.find(
        (e) => e.email === currentUser.email || e.name === currentUser.name || e.id === currentUser.id
      ) || null
    : null;

  const visibleEmployees = !isRestrictedStaff
    ? employees
    : currentEmployee
    ? [currentEmployee]
    : (() => {
        const matched = employees.filter(
          (e) =>
            e.id === currentUser?.id ||
            (currentUser?.email && e.email === currentUser.email) ||
            (currentUser?.name && e.name === currentUser.name)
        );
        return matched.length > 0 ? matched : employees.slice(0, 1);
      })();

  const visibleProjects = !isRestrictedStaff
    ? projects
    : projects.filter((p) => {
        if (p.id === 'all') return true;
        if (!p.memberIds || p.memberIds.length === 0) return true;
        if (currentEmployee && p.memberIds.includes(currentEmployee.id)) return true;
        if (currentUser && p.memberIds.includes(currentUser.id)) return true;
        return false;
      });

  return { currentEmployee, visibleEmployees, visibleProjects };
}

export interface FilterTasksParams {
  tasks: Task[];
  projects: TaskProject[];
  isRestrictedStaff: boolean;
  currentEmployee?: Employee | null;
  currentUser?: AppUser | null;
  searchTerm: string;
  activeProjectId: string;
  filterPriority: string;
  filterAssignee: string;
  filterType: 'all' | 'tasks' | 'milestones';
  filterDatePeriod: 'all' | '3days' | 'today' | 'week' | 'month';
}

export function filterTasksByCriteria({
  tasks,
  projects,
  isRestrictedStaff,
  currentEmployee,
  currentUser,
  searchTerm,
  activeProjectId,
  filterPriority,
  filterAssignee,
  filterType,
  filterDatePeriod,
}: FilterTasksParams): Task[] {
  return tasks.filter((t) => {
    if (isRestrictedStaff) {
      const empName = currentEmployee?.name || currentUser?.name;
      const empId = currentEmployee?.id || currentUser?.id;
      const userEmail = currentUser?.email;

      const assignedField = t.assignedTo || '';
      const assignedList = assignedField.split(',').map((s) => s.trim());

      const assignedToMe =
        assignedList.some(
          (a) =>
            (empName && a.toLowerCase() === empName.toLowerCase()) ||
            (empId && a === empId) ||
            (userEmail && a.toLowerCase() === userEmail.toLowerCase()) ||
            a === 'Équipe' ||
            a === 'Tous'
        ) ||
        (t.employeeId && (t.employeeId === empId || t.employeeId === currentUser?.id));
      if (!assignedToMe) return false;
    }

    if (isRestrictedStaff && t.projectId && t.projectId !== 'general') {
      const p = projects.find((proj) => proj.id === t.projectId);
      if (p && p.memberIds && p.memberIds.length > 0) {
        const isMember =
          (currentEmployee && p.memberIds.includes(currentEmployee.id)) ||
          (currentUser && p.memberIds.includes(currentUser.id));
        if (!isMember) return false;
      }
    }

    const matchSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.milestoneTarget && t.milestoneTarget.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchProject =
      activeProjectId === 'all'
        ? true
        : t.projectId === activeProjectId || (!t.projectId && activeProjectId === 'general');

    const matchPriority = filterPriority === 'all' ? true : t.priority === filterPriority;

    const assignedList = (t.assignedTo || 'Équipe').split(',').map((s) => s.trim());
    const matchAssignee =
      filterAssignee === 'all'
        ? true
        : assignedList.includes(filterAssignee) || (!t.assignedTo && filterAssignee === 'Équipe');

    const matchType =
      filterType === 'all' ? true : filterType === 'milestones' ? !!t.isMilestone : !t.isMilestone;

    let matchDate = true;
    if (filterDatePeriod !== 'all' && t.date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const taskDate = new Date(`${t.date}T12:00:00`);

      if (filterDatePeriod === 'today') {
        const todayStr = today.toISOString().split('T')[0];
        matchDate = t.date === todayStr;
      } else if (filterDatePeriod === '3days') {
        const cutoff = new Date(today);
        cutoff.setDate(cutoff.getDate() - 2);
        matchDate = taskDate.getTime() >= cutoff.getTime();
      } else if (filterDatePeriod === 'week') {
        const weekCutoff = new Date(today);
        weekCutoff.setDate(weekCutoff.getDate() - 6);
        matchDate = taskDate.getTime() >= weekCutoff.getTime();
      } else if (filterDatePeriod === 'month') {
        const monthCutoff = new Date(today);
        monthCutoff.setDate(monthCutoff.getDate() - 29);
        matchDate = taskDate.getTime() >= monthCutoff.getTime();
      }
    }

    return matchSearch && matchProject && matchPriority && matchAssignee && matchType && matchDate;
  });
}
