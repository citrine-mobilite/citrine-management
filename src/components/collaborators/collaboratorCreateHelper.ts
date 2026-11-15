import { AppUser, Employee, NotificationLog } from '../../types';
import { createCollaboratorWithUserTransactional } from '../../services/employeeService';
import { logAdminOperation } from '../../services/adminAuditService';
import { CollaboratorFormData } from './collaboratorConstants';

interface CreateCollaboratorParams {
  formData: CollaboratorFormData;
  employees: Employee[];
  users?: AppUser[];
  onUpdateEmployees: (employees: Employee[]) => void;
  onUpdateUsers?: (users: AppUser[]) => void;
  onAddNotification?: (log: NotificationLog) => void;
}

export async function persistCreatedCollaborator({
  formData,
  employees,
  users = [],
  onUpdateEmployees,
  onUpdateUsers,
  onAddNotification,
}: CreateCollaboratorParams): Promise<void> {
  const empDepartment = formData.department.trim() || 'Direction Générale';
  const userEmail = formData.email.trim()
    ? formData.email.trim()
    : `collab_${Date.now()}@citrinemgmt.cm`;
  const initialPassword = formData.userPassword.trim() || 'Collab@2026';

  const resolvedTeams =
    formData.teams?.length > 0
      ? formData.teams
      : formData.team
      ? formData.team.split(',').map((t) => t.trim()).filter(Boolean)
      : ['Équipe IT & Développement'];
  const teamString = resolvedTeams.join(', ');

  const result = await createCollaboratorWithUserTransactional({
    name: formData.name.trim(),
    firstName: (formData as any).firstName,
    lastName: (formData as any).lastName,
    email: userEmail,
    phone: formData.phone,
    userPassword: initialPassword,
    roleType: formData.roleType,
    userRole: formData.userRole,
    department: empDepartment,
    position: (formData as any).position || formData.roleType,
    managerId: formData.managerId,
    team: teamString,
    teams: resolvedTeams,
    hireDate: formData.hireDate,
    birthDate: formData.birthDate,
    salary: Number(formData.salary) || 0,
    status: formData.status,
    departureReason: formData.departureReason,
    suspensionReason: formData.suspensionReason,
    avatarUrl: formData.avatarUrl,
    allowEarlyDeparture15_17: formData.allowEarlyDeparture15_17,
    allowLateArrival8_930: formData.allowLateArrival8_930,
  });

  onUpdateEmployees([result.employee, ...employees]);
  onUpdateUsers?.([result.user, ...users]);
  if (onAddNotification && result.notification) {
    onAddNotification(result.notification);
  }

  logAdminOperation({
    authorName: 'Administrateur',
    targetEmployeeId: result.employee.id,
    targetUserId: result.user.id,
    targetName: formData.name.trim(),
    operationType: 'creation',
    operationLabel: 'Création collaborateur (Transactionnel)',
    details: `Collaborateur ${result.employee.name} créé et lié à l'utilisateur ${result.user.email} (User ID: ${result.user.id}, Rôle ID: ${result.user.roleId})`,
  });

  if (formData.managerId) {
    const mgrName = employees.find((x) => x.id === formData.managerId)?.name || 'Direction';
    logAdminOperation({
      authorName: 'Administrateur',
      targetEmployeeId: result.employee.id,
      targetName: formData.name.trim(),
      operationType: 'manager_change',
      operationLabel: 'Rattachement hiérarchique initial',
      details: `Responsable : ${mgrName}`,
    });
  }
}
