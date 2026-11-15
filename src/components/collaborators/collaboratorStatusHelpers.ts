import { AppUser, CompanyModuleConfig, Employee } from '../../types';
import {
  isEmployeeActive,
  updateCollaboratorWithUserTransactional,
} from '../../services/employeeService';
import { logAdminOperation } from '../../services/adminAuditService';
import { clientMailService } from '../../services/clientMailService';

function syncLinkedUserStatus(
  target: Employee,
  updatedEmp: Employee,
  status: Employee['status'],
  users?: AppUser[],
  onUpdateUsers?: (users: AppUser[]) => void
) {
  if (!users || !onUpdateUsers) return;
  const isAct = isEmployeeActive(updatedEmp);
  const targetEmail = (target.email || '').toLowerCase().trim();
  const uIdx = users.findIndex(
    (u) =>
      (target.userId && (String(u.id) === String(target.userId) || u.uid === String(target.userId))) ||
      (targetEmail && u.email && u.email.toLowerCase() === targetEmail) ||
      (u.employeeId && (String(u.employeeId) === String(target.id) || u.employeeId === target.uid))
  );
  if (uIdx >= 0) {
    const nextU: AppUser = {
      ...users[uIdx],
      status: isAct ? 'actif' : 'inactif',
      employmentStatus: status as any,
    };
    onUpdateUsers(users.map((u, i) => (i === uIdx ? nextU : u)));
  }
}

export function applyQuickEnPosteStatus(params: {
  emp: Employee;
  newStatus: Employee['status'];
  employees: Employee[];
  users?: AppUser[];
  onUpdateEmployees: (employees: Employee[]) => void;
  onUpdateUsers?: (users: AppUser[]) => void;
}) {
  const { emp, newStatus, employees, users, onUpdateEmployees, onUpdateUsers } = params;
  const updatedEmp: Employee = { ...emp, status: newStatus, employmentStatus: newStatus as any };
  onUpdateEmployees(employees.map((e) => (e.id === emp.id ? updatedEmp : e)));
  syncLinkedUserStatus(emp, updatedEmp, newStatus, users, onUpdateUsers);
  updateCollaboratorWithUserTransactional({
    employee: updatedEmp,
    previousEmployee: emp,
  }).catch(() => {});
}

export function applyStatusReasonChange(params: {
  empId: string;
  status: Employee['status'];
  reason: string;
  startDate: string;
  endDate: string;
  employees: Employee[];
  users?: AppUser[];
  moduleConfig?: CompanyModuleConfig;
  onUpdateEmployees: (employees: Employee[]) => void;
  onUpdateUsers?: (users: AppUser[]) => void;
}) {
  const {
    empId,
    status,
    reason,
    startDate,
    endDate,
    employees,
    users,
    moduleConfig,
    onUpdateEmployees,
    onUpdateUsers,
  } = params;

  let targetUpdatedEmp: Employee | null = null;
  const updated = employees.map((emp) => {
    if (emp.id !== empId) return emp;
    const copy: Employee = {
      ...emp,
      status,
      employmentStatus: status as any,
      statusReason: reason,
      statusStartDate: startDate,
      statusEndDate: endDate,
    };
    if (status === 'renvoye' || status === 'parti') {
      copy.departureReason = reason;
      copy.departureDate = startDate || new Date().toISOString().split('T')[0];
    } else if (status === 'suspendu') {
      copy.suspensionReason = reason;
      copy.suspensionDate = startDate || new Date().toISOString().split('T')[0];
    } else if (status === 'en_mission') {
      const startD = new Date(startDate || Date.now());
      const endD = new Date(endDate || Date.now());
      const diffDays = Math.ceil(Math.abs(endD.getTime() - startD.getTime()) / 86400000) || 1;
      copy.missionHistory = [
        {
          id: `mission-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          reason,
          startDate: startDate || new Date().toISOString().split('T')[0],
          endDate: endDate || new Date().toISOString().split('T')[0],
          durationDays: diffDays,
          createdAt: new Date().toISOString(),
        },
        ...(emp.missionHistory || []),
      ];
    }
    targetUpdatedEmp = copy;
    return copy;
  });

  const target = employees.find((e) => e.id === empId);
  if (target) {
    logAdminOperation({
      authorName: 'Administrateur',
      targetEmployeeId: empId,
      targetName: target.name,
      operationType: 'status_change',
      operationLabel:
        status === 'renvoye'
          ? 'Renvoi RH notifié'
          : status === 'suspendu'
          ? 'Suspension conservatoire'
          : "Départ de l'entreprise",
      details: `Statut passé à "${status}" avec motif : "${reason}"`,
    });
  }

  onUpdateEmployees(updated);

  if (targetUpdatedEmp && target) {
    syncLinkedUserStatus(target, targetUpdatedEmp, status, users, onUpdateUsers);
    updateCollaboratorWithUserTransactional({
      employee: targetUpdatedEmp,
      previousEmployee: target,
    }).catch(() => {});
  }

  if (status === 'en_mission' && target) {
    const startD = new Date(startDate || Date.now());
    const endD = new Date(endDate || Date.now());
    const diffDays = Math.ceil(Math.abs(endD.getTime() - startD.getTime()) / 86400000) || 1;
    clientMailService
      .notifyMissionAssigned({
        employeeName: target.name,
        employeeEmail: target.email,
        employeeId: target.id,
        destinationOrReason: reason,
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || new Date().toISOString().split('T')[0],
        durationDays: diffDays,
        moduleConfig,
      })
      .catch((err) => console.warn('[CollaboratorPanel] Notice envoi email mission:', err));
  }
}
