import { AppUser, Employee, NotificationLog } from '../../types';
import {
  isEmployeeActive,
  updateCollaboratorWithUserTransactional,
} from '../../services/employeeService';
import { COLLECTIONS, saveDocument } from '../../services/dataService';
import { logAdminOperation } from '../../services/adminAuditService';
import { CollaboratorFormData } from './collaboratorConstants';

interface EditCollaboratorParams {
  editingEmployee: Employee;
  formData: CollaboratorFormData;
  employees: Employee[];
  users?: AppUser[];
  onUpdateEmployees: (employees: Employee[]) => void;
  onUpdateUsers?: (users: AppUser[]) => void;
  onAddNotification?: (log: NotificationLog) => void;
}

export async function persistEditedCollaborator({
  editingEmployee,
  formData,
  employees,
  users = [],
  onUpdateEmployees,
  onUpdateUsers,
  onAddNotification,
}: EditCollaboratorParams): Promise<void> {
  const empDepartment = formData.department.trim() || 'Direction Générale';

  if (editingEmployee.managerId !== formData.managerId) {
    const mgrName =
      employees.find((x) => x.id === formData.managerId)?.name || 'Direction Générale';
    logAdminOperation({
      authorName: 'Administrateur',
      targetEmployeeId: editingEmployee.id,
      targetName: formData.name,
      operationType: 'manager_change',
      operationLabel: 'Rattachement hiérarchique modifié',
      details: `Affecté sous la responsabilité de : ${mgrName}`,
    });
  }

  if (editingEmployee.team !== formData.team) {
    logAdminOperation({
      authorName: 'Administrateur',
      targetEmployeeId: editingEmployee.id,
      targetName: formData.name,
      operationType: 'team_change',
      operationLabel: "Changement d'équipe",
      details: `Transféré vers : ${formData.team}`,
    });
  }

  if (editingEmployee.roleType !== formData.roleType) {
    logAdminOperation({
      authorName: 'Administrateur',
      targetEmployeeId: editingEmployee.id,
      targetName: formData.name,
      operationType: 'role_change',
      operationLabel: 'Modification de la fonction métier',
      details: `Rôle mis à jour de "${editingEmployee.roleType}" à "${formData.roleType}"`,
    });
  }

  const resolvedRoleId = formData.roleId
    ? Number(formData.roleId)
    : formData.userRole === 'administrateur'
    ? 1
    : formData.userRole === 'responsable'
    ? 2
    : 3;
  const targetUserId = formData.userId || editingEmployee.userId || '';
  const isEmpActive = isEmployeeActive({ status: formData.status });
  const resolvedTeams =
    formData.teams?.length > 0
      ? formData.teams
      : formData.team
      ? formData.team.split(',').map((t) => t.trim()).filter(Boolean)
      : ['Équipe IT & Développement'];
  const teamString = resolvedTeams.join(', ');
  const managerName =
    employees.find((x) => String(x.id) === String(formData.managerId))?.name || undefined;

  const updatedEmp: Employee = {
    ...editingEmployee,
    ...formData,
    team: teamString,
    teams: resolvedTeams,
    managerId: formData.managerId || undefined,
    managerName,
    birthDate: formData.birthDate,
    userId: targetUserId || undefined,
    roleId: resolvedRoleId,
    department: empDepartment,
    status: formData.status,
    employmentStatus: formData.status as any,
  };

  onUpdateEmployees(
    employees.map((emp) => (emp.id === editingEmployee.id ? updatedEmp : emp))
  );

  const targetEmail = (formData.email || '').trim();
  const targetEmailLower = targetEmail.toLowerCase();
  const oldEmail = (editingEmployee.email || '').trim();
  const oldEmailLower = oldEmail.toLowerCase();

  const matchedUserIndex = users.findIndex(
    (u) =>
      (u.employeeId && String(u.employeeId) === String(editingEmployee.id)) ||
      (targetUserId && (String(u.id) === String(targetUserId) || u.uid === String(targetUserId))) ||
      (oldEmailLower && u.email && u.email.toLowerCase() === oldEmailLower) ||
      (targetEmailLower && u.email && u.email.toLowerCase() === targetEmailLower)
  );

  if (matchedUserIndex >= 0) {
    const existingUser = users[matchedUserIndex];
    const updatedUserObj: AppUser = {
      ...existingUser,
      name: formData.name.trim(),
      email: targetEmail || existingUser.email,
      phone: formData.phone || existingUser.phone || '',
      department: empDepartment,
      role: formData.userRole,
      roleId: resolvedRoleId,
      team: teamString,
      teams: resolvedTeams,
      managerId: formData.managerId || undefined,
      managerName,
      birthDate: formData.birthDate,
      status: isEmpActive ? 'actif' : 'inactif',
      employmentStatus: formData.status as any,
      avatarUrl: formData.avatarUrl || existingUser.avatarUrl || '',
      employeeId: String(editingEmployee.id),
    };
    onUpdateUsers?.(users.map((u, i) => (i === matchedUserIndex ? updatedUserObj : u)));
  } else {
    const createdUserObj: AppUser = {
      id: String(targetUserId || `user-${Date.now()}`),
      name: formData.name.trim(),
      email: targetEmail || oldEmail || `collab_${editingEmployee.id}@citrinemgmt.cm`,
      phone: formData.phone || '',
      department: empDepartment,
      role: formData.userRole,
      roleId: resolvedRoleId,
      team: teamString,
      teams: resolvedTeams,
      managerId: formData.managerId || undefined,
      managerName,
      birthDate: formData.birthDate,
      status: isEmpActive ? 'actif' : 'inactif',
      employmentStatus: formData.status as any,
      avatarUrl: formData.avatarUrl || '',
      employeeId: String(editingEmployee.id),
      createdAt: new Date().toISOString(),
      passwordHash: 'Collab@2026',
    };
    onUpdateUsers?.([createdUserObj, ...users]);
  }

  try {
    const syncResult = await updateCollaboratorWithUserTransactional({
      employee: updatedEmp,
      previousEmployee: editingEmployee,
      userRole: formData.userRole,
      userPassword: formData.userPassword,
    });
    const finalEmp = syncResult.employee || updatedEmp;
    onUpdateEmployees(
      employees.map((emp) => (emp.id === editingEmployee.id ? finalEmp : emp))
    );
    if (syncResult.user && onUpdateUsers) {
      const finalU = syncResult.user;
      const uIdx = users.findIndex(
        (u) =>
          String(u.id) === String(finalU.id) ||
          (oldEmail && u.email && u.email.toLowerCase() === oldEmail) ||
          (targetEmail && u.email && u.email.toLowerCase() === targetEmail) ||
          (u.employeeId &&
            (String(u.employeeId) === String(editingEmployee.id) ||
              u.employeeId === editingEmployee.uid))
      );
      if (uIdx >= 0) {
        const nextUsers = [...users];
        nextUsers[uIdx] = finalU;
        onUpdateUsers(nextUsers);
      } else {
        onUpdateUsers([finalU, ...users]);
      }
    }
  } catch (err) {
    console.warn('[CollaboratorPanel] Notice persistance collaborateur/user:', err);
  }

  if (onAddNotification) {
    const updateNotif: NotificationLog = {
      id: `notif-collab-upd-${Date.now()}`,
      type: 'system',
      title: 'Fiche collaborateur modifiée',
      content: `La fiche de ${formData.name.trim()} (${formData.email}) a été mise à jour avec son compte utilisateur associé.`,
      recipient: 'Administrateurs & RH',
      payload: JSON.stringify({ employeeId: editingEmployee.id, updatedFields: formData }),
      timestamp: new Date().toISOString(),
      read: false,
    };
    onAddNotification(updateNotif);
    saveDocument(COLLECTIONS.NOTIFICATIONS, updateNotif).catch(() => {});
  }
}
