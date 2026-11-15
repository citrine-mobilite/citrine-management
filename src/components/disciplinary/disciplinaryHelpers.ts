import { DisciplinaryIncident, DisciplinaryStatus, Employee } from '../../types';

export function filterDisciplinaryIncidents(params: {
  incidents: DisciplinaryIncident[];
  isRestricted: boolean;
  myEmpId?: string;
  myEmpName: string;
  searchTerm: string;
  statusFilter: 'all' | DisciplinaryStatus;
  severityFilter: string;
  employeeFilter: string;
  periodFilter: string;
}): DisciplinaryIncident[] {
  const {
    incidents,
    isRestricted,
    myEmpId,
    myEmpName,
    searchTerm,
    statusFilter,
    severityFilter,
    employeeFilter,
    periodFilter,
  } = params;

  return incidents.filter((i) => {
    if (isRestricted) {
      const matchesSelf =
        (myEmpId && i.employeeId === myEmpId) ||
        (myEmpName && i.employeeName.toLowerCase().includes(myEmpName));
      if (!matchesSelf) return false;
    }

    const q = searchTerm.toLowerCase();
    const matchSearch =
      !q ||
      i.title.toLowerCase().includes(q) ||
      i.employeeName.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q) ||
      (i.description && i.description.toLowerCase().includes(q)) ||
      (i.reportedBy && i.reportedBy.toLowerCase().includes(q));

    const matchStatus = statusFilter === 'all' || i.status === statusFilter;
    const matchSeverity = severityFilter === 'all' || i.severity === severityFilter;
    const matchEmployee = employeeFilter === 'all' || i.employeeId === employeeFilter;

    let matchPeriod = true;
    const iDate = new Date(i.date);
    const now = new Date();
    if (periodFilter === 'this_month') {
      matchPeriod = i.date.startsWith(now.toISOString().slice(0, 7));
    } else if (periodFilter === '3_months') {
      const diffMonths = (now.getFullYear() - iDate.getFullYear()) * 12 + (now.getMonth() - iDate.getMonth());
      matchPeriod = diffMonths <= 3;
    } else if (periodFilter === 'this_year') {
      matchPeriod = iDate.getFullYear() === now.getFullYear();
    }

    return matchSearch && matchStatus && matchSeverity && matchEmployee && matchPeriod;
  });
}

export function buildDisciplinaryStatusUpdate(
  incident: DisciplinaryIncident,
  newStatus: DisciplinaryStatus,
  authorName: string
): DisciplinaryIncident {
  return {
    ...incident,
    status: newStatus,
    updatedAt: new Date().toISOString(),
    history: [
      ...(incident.history || []),
      {
        id: `h-${Date.now()}`,
        date: new Date().toISOString(),
        action: `Changement de statut : ${newStatus.toUpperCase()}`,
        authorName,
        notes: `Statut de la procédure mis à jour vers ${newStatus}.`,
      },
    ],
  };
}

export function formatEmployeeNameForSelect(emp: Employee): string {
  return emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
}
