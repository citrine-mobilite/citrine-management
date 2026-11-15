import { supabaseAdmin } from '../../lib/supabase';
import {
  CreateCollaboratorTransactionInput,
  createCollaboratorOfficialNotification,
  rollbackCollaboratorCreation,
} from './collaboratorTransactionHelpers';

export type { CreateCollaboratorTransactionInput };

export async function executeCollaboratorCreationTransaction(input: CreateCollaboratorTransactionInput) {
  const userEmail = input.email.trim();
  const empName = input.name.trim();
  const empDepartment = input.department?.trim() || 'Direction Générale';
  const initialPassword = input.userPassword?.trim() || 'Collab@2026';

  const roleTypeLower = (input.roleType || input.userRole || '').toLowerCase();
  const computedRoleId = roleTypeLower.includes('admin') ? 1 : roleTypeLower.includes('responsable') ? 2 : 3;
  const resolvedRole = computedRoleId === 1 ? 'administrateur' : computedRoleId === 2 ? 'responsable' : 'employé';

  const empDocId = `emp-${Date.now()}`;
  const userDocId = `user-${Date.now()}`;

  const { data: existingUser } = await supabaseAdmin.from('users').select('id').eq('email', userEmail).maybeSingle();
  if (existingUser) {
    throw new Error(`Un compte utilisateur avec l'email "${userEmail}" existe déjà.`);
  }

  const { data: existingEmp } = await supabaseAdmin.from('employees').select('id').eq('email', userEmail).maybeSingle();
  if (existingEmp) {
    throw new Error(`Un collaborateur avec l'email "${userEmail}" existe déjà.`);
  }

  let createdEmployeeDbId: number | null = null;
  let createdUserId: number | null = null;
  let createdNotifDbId: number | null = null;

  try {
    const rawEmpData = {
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
        team: input.team || null,
        teams: Array.isArray(input.teams) ? input.teams : null,
        managerId: input.managerId || null,
        birthDate: input.birthDate || null,
        avatarUrl: input.avatarUrl || null,
        departureReason: input.departureReason || null,
        suspensionReason: input.suspensionReason || null,
        allowEarlyDeparture15_17: Boolean(input.allowEarlyDeparture15_17),
        allowLateArrival8_930: Boolean(input.allowLateArrival8_930),
      },
    };

    const { data: empInserted, error: empInsertErr } = await supabaseAdmin
      .from('employees')
      .insert(rawEmpData)
      .select()
      .single();

    if (empInsertErr || !empInserted) {
      throw new Error(`Étape 1 échouée (Création collaborateur): ${empInsertErr?.message || 'Insertion nulle'}`);
    }

    createdEmployeeDbId = empInserted.id;
    try {
      await supabaseAdmin.auth.admin.createUser({
        email: userEmail,
        password: initialPassword,
        email_confirm: true,
      });
    } catch (authErr: any) {
      console.warn('[TRANSACTION] Notice Auth Supabase (utilisateur existant ou non-bloquant):', authErr?.message);
    }

    const { data: userInserted, error: userInsertErr } = await supabaseAdmin
      .from('users')
      .insert({
        doc_id: userDocId,
        email: userEmail,
        name: empName,
        role_id: computedRoleId,
        status: true,
        department: empDepartment,
        phone: input.phone || null,
        avatar_url: input.avatarUrl || null,
        raw_data: {
          doc_id: userDocId,
          role: resolvedRole,
          roleId: computedRoleId,
          employeeId: empDocId,
          employeeDbId: createdEmployeeDbId,
          department: empDepartment,
          team: input.team || null,
          teams: Array.isArray(input.teams) ? input.teams : null,
          managerId: input.managerId || null,
          birthDate: input.birthDate || null,
          allowEarlyDeparture15_17: Boolean(input.allowEarlyDeparture15_17),
          allowLateArrival8_930: Boolean(input.allowLateArrival8_930),
          passwordHash: initialPassword,
          createdAt: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (userInsertErr || !userInserted) {
      throw new Error(`Étape 2 échouée (Création utilisateur): ${userInsertErr?.message || 'Insertion utilisateur nulle'}`);
    }

    createdUserId = userInserted.id;
    const { data: empUpdated, error: empUpdateErr } = await supabaseAdmin
      .from('employees')
      .update({
        user_id: createdUserId,
        role_id: computedRoleId,
        raw_data: {
          ...rawEmpData.raw_data,
          userId: createdUserId,
          roleId: computedRoleId,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', createdEmployeeDbId)
      .select()
      .single();

    if (empUpdateErr || !empUpdated) {
      throw new Error(`Étape 3 échouée (Mise à jour collaborateur avec user_id/role_id): ${empUpdateErr?.message || 'Mise à jour nulle'}`);
    }

    const notifResult = await createCollaboratorOfficialNotification({
      empDocId,
      createdEmployeeDbId: createdEmployeeDbId!,
      createdUserId: createdUserId!,
      userEmail,
      empName,
      empDepartment,
      resolvedRole,
    });
    createdNotifDbId = notifResult.createdNotifDbId;

    return {
      success: true,
      employee: {
        ...empUpdated,
        doc_id: empUpdated.doc_id || empDocId,
        _dbId: empUpdated.id,
        id: empUpdated.doc_id || String(empUpdated.id),
        userId: String(createdUserId),
        roleId: computedRoleId,
      },
      user: {
        ...userInserted,
        doc_id: userInserted.doc_id || userDocId,
        _dbId: userInserted.id,
        id: String(userInserted.id),
        role: resolvedRole,
        roleId: computedRoleId,
      },
      notification: notifResult.notifObj,
    };
  } catch (error: any) {
    console.error(`🚨 [TRANSACTION ÉCHOUÉE - ROLLBACK DÉCLENCHÉ] : ${error?.message || error}`);
    await rollbackCollaboratorCreation(createdNotifDbId, createdUserId, createdEmployeeDbId);
    throw new Error(`Transaction annulée (Rollback complet) : ${error?.message || 'Erreur inconnue'}`);
  }
}
