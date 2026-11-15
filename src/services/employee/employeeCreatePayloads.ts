import { Employee, AppUser, NotificationLog } from '../../types';
import { TransactionalCollaboratorInput } from './employeeHelpers';

export function buildCreateEmployeePayload(
  input: TransactionalCollaboratorInput,
  empDocId: string,
  empName: string,
  userEmail: string,
  empDepartment: string
) {
  return {
    doc_id: empDocId,
    name: empName,
    first_name: input.firstName || null,
    last_name: input.lastName || null,
    email: userEmail,
    phone: input.phone || null,
    role_type: input.roleType || 'Employé',
    department: empDepartment,
    position: input.position || input.roleType || 'Employé',
    status: true,
    hire_date: input.hireDate ? String(input.hireDate).split('T')[0] : null,
    salary: Math.max(0, Number(input.salary) || 0),
    photo_url: input.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(empName)}`,
    emergency_contact: null,
    work_location: 'Douala',
    user_id: null,
    role_id: null,
    raw_data: {
      doc_id: empDocId,
      team: input.team || (input.teams ? input.teams.join(', ') : null),
      teams: input.teams || (input.team ? [input.team] : null),
      managerId: input.managerId || null,
      birthDate: input.birthDate || null,
      avatarUrl: input.avatarUrl || null,
      departureReason: input.departureReason || null,
      suspensionReason: input.suspensionReason || null,
      allowEarlyDeparture15_17: input.allowEarlyDeparture15_17 || false,
      allowLateArrival8_930: input.allowLateArrival8_930 || false,
    },
  };
}

export function buildFinalCreatedModels(params: {
  input: TransactionalCollaboratorInput;
  empDocId: string;
  empUid: string;
  createdEmployeeDbId: number;
  createdUserId: number;
  computedRoleId: number;
  resolvedRole: string;
  empName: string;
  userEmail: string;
  empDepartment: string;
  photoUrl: string;
  userDocId: string;
  userUid: string;
}) {
  const {
    input, empDocId, empUid, createdEmployeeDbId, createdUserId, computedRoleId, resolvedRole,
    empName, userEmail, empDepartment, photoUrl, userDocId, userUid,
  } = params;

  const finalEmployee: Employee = {
    id: empDocId,
    doc_id: empDocId,
    uid: empUid,
    _dbId: createdEmployeeDbId,
    userId: String(createdUserId),
    roleId: computedRoleId,
    name: empName,
    firstName: input.firstName,
    lastName: input.lastName,
    email: userEmail,
    phone: input.phone,
    roleType: input.roleType || 'Employé',
    role: input.position || input.roleType || 'Employé',
    department: empDepartment,
    managerId: input.managerId,
    team: input.team || (input.teams ? input.teams.join(', ') : undefined),
    teams: input.teams || (input.team ? [input.team] : undefined),
    hireDate: input.hireDate,
    birthDate: input.birthDate,
    salary: Number(input.salary) || 0,
    status: 'en_poste',
    employmentStatus: 'en_poste',
    avatarUrl: photoUrl,
    allowEarlyDeparture15_17: input.allowEarlyDeparture15_17 || false,
    allowLateArrival8_930: input.allowLateArrival8_930 || false,
  };

  const finalUser: AppUser = {
    id: String(createdUserId),
    doc_id: userDocId,
    uid: userUid,
    name: empName,
    email: userEmail,
    role: resolvedRole as AppUser['role'],
    roleId: computedRoleId,
    status: 'actif',
    department: empDepartment,
    phone: input.phone || '',
    birthDate: input.birthDate,
    team: input.team || (input.teams ? input.teams.join(', ') : undefined),
    teams: input.teams || (input.team ? [input.team] : undefined),
    managerId: input.managerId,
    employeeId: empDocId,
    avatarUrl: photoUrl,
    allowEarlyDeparture15_17: input.allowEarlyDeparture15_17 || false,
    allowLateArrival8_930: input.allowLateArrival8_930 || false,
    createdAt: new Date().toISOString(),
  };

  return { finalEmployee, finalUser };
}

export async function rollbackCreatedEntities(
  client: any,
  createdNotifDbId: number | null,
  createdUserId: number | null,
  createdEmployeeDbId: number | null
) {
  if (createdNotifDbId) {
    try {
      console.log(`⏪ [ROLLBACK] Suppression de la notification orpheline (ID: ${createdNotifDbId})...`);
      await client.from('notifications').delete().eq('id', createdNotifDbId);
      console.log(`✓ [ROLLBACK] Notification (ID: ${createdNotifDbId}) supprimée`);
    } catch (rbNotifErr: any) {
      console.error(`❌ [ROLLBACK ERREUR] Échec suppression notification ${createdNotifDbId}:`, rbNotifErr?.message);
    }
  }
  if (createdUserId) {
    try {
      console.log(`⏪ [ROLLBACK] Suppression de l'utilisateur orphelin (ID: ${createdUserId})...`);
      await client.from('users').delete().eq('id', createdUserId);
      console.log(`✓ [ROLLBACK] Utilisateur (ID: ${createdUserId}) supprimé`);
    } catch (rbUserErr: any) {
      console.error(`❌ [ROLLBACK ERREUR] Échec suppression user ${createdUserId}:`, rbUserErr?.message);
    }
  }
  if (createdEmployeeDbId) {
    try {
      console.log(`⏪ [ROLLBACK] Suppression du collaborateur orphelin (ID: ${createdEmployeeDbId})...`);
      await client.from('employees').delete().eq('id', createdEmployeeDbId);
      console.log(`✓ [ROLLBACK] Collaborateur (ID: ${createdEmployeeDbId}) supprimé`);
    } catch (rbEmpErr: any) {
      console.error(`❌ [ROLLBACK ERREUR] Échec suppression employé ${createdEmployeeDbId}:`, rbEmpErr?.message);
    }
  }
}

export function buildCreateNotifObject(
  empDocId: string,
  createdEmployeeDbId: number,
  createdUserId: number,
  userEmail: string,
  empDepartment: string,
  resolvedRole: string,
  empName: string
): NotificationLog {
  const notifDocId = `notif-collab-${Date.now()}`;
  const notifPayload = {
    employeeId: empDocId,
    employeeDbId: createdEmployeeDbId,
    userId: createdUserId,
    userEmail,
    department: empDepartment,
    role: resolvedRole,
    createdAt: new Date().toISOString(),
  };

  return {
    id: notifDocId,
    type: 'system',
    title: 'Nouveau collaborateur enregistré',
    content: `Le collaborateur ${empName} (${empDepartment}) a été créé et lié à son compte utilisateur (${userEmail}).`,
    recipient: 'Administrateurs & RH',
    payload: JSON.stringify(notifPayload),
    timestamp: new Date().toISOString(),
    read: false,
  };
}
