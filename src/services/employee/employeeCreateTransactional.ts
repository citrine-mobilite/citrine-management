import { supabase, supabaseAdmin } from '../../lib/supabase';
import { offlineService } from '../offlineService';
import {
  EMPLOYEES_COLLECTION,
  generateUuidV4,
  TransactionalCollaboratorInput,
  TransactionalCollaboratorResult,
} from './employeeHelpers';
import {
  buildCreateEmployeePayload,
  buildFinalCreatedModels,
  rollbackCreatedEntities,
  buildCreateNotifObject,
} from './employeeCreatePayloads';

export async function createCollaboratorWithUserTransactional(
  input: TransactionalCollaboratorInput
): Promise<TransactionalCollaboratorResult> {
  const userEmail = input.email.trim();
  const empName = input.name.trim();
  const empDepartment = input.department?.trim() || 'Direction Générale';
  const initialPassword = input.userPassword?.trim() || 'Collab@2026';

  const roleTypeLower = (input.roleType || input.userRole || '').toLowerCase();
  const computedRoleId = roleTypeLower.includes('admin') ? 1 : roleTypeLower.includes('responsable') ? 2 : 3;
  const resolvedRole = computedRoleId === 1 ? 'administrateur' : computedRoleId === 2 ? 'responsable' : 'employé';

  if (typeof window !== 'undefined' && typeof fetch === 'function') {
    try {
      const response = await fetch('/api/collaborators/transactional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (response.ok) {
        const result = await response.json();
        if (result && result.success && result.employee && result.user) {
          try {
            await offlineService.cacheLocally(EMPLOYEES_COLLECTION, result.employee);
            await offlineService.cacheLocally('users', result.user);
            if (result.notification) await offlineService.cacheLocally('notifications', result.notification);
          } catch (cacheErr) {
            console.warn('[TRANSACTION] Notice cache local:', cacheErr);
          }
          return result as TransactionalCollaboratorResult;
        }
      } else {
        const errorJson = await response.json().catch(() => ({}));
        if (errorJson?.error) {
          console.warn('[TRANSACTION SERVEUR] Réponse erreur du serveur:', errorJson.error);
          throw new Error(errorJson.error);
        }
      }
    } catch (serverErr: any) {
      if (serverErr.message && !serverErr.message.includes('Failed to fetch')) {
        throw serverErr;
      }
      console.warn('[TRANSACTION] Route serveur non disponible ou hors-ligne, basculement sur la transaction directe Supabase...', serverErr.message);
    }
  }

  const client = supabaseAdmin || supabase;

  const { data: existingUser } = await client.from('users').select('id').eq('email', userEmail).maybeSingle();
  if (existingUser) throw new Error(`Un compte utilisateur avec l'email "${userEmail}" existe déjà.`);

  const { data: existingEmp } = await client.from('employees').select('id').eq('email', userEmail).maybeSingle();
  if (existingEmp) throw new Error(`Un collaborateur avec l'email "${userEmail}" existe déjà.`);

  const empUid = generateUuidV4();
  const empDocId = `emp-${Date.now()}`;
  const userUid = generateUuidV4();
  const userDocId = `user-${Date.now()}`;

  let createdEmployeeDbId: number | null = null;
  let createdUserId: number | null = null;
  let createdNotifDbId: number | null = null;

  try {
    const rawEmpData = buildCreateEmployeePayload(input, empDocId, empName, userEmail, empDepartment);
    const { data: empInserted, error: empInsertErr } = await client.from('employees').insert(rawEmpData).select().single();
    if (empInsertErr || !empInserted) {
      throw new Error(`Étape 1 échouée (Création collaborateur): ${empInsertErr?.message || 'Insertion nulle'}`);
    }

    createdEmployeeDbId = empInserted.id;

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.auth.admin.createUser({ email: userEmail, password: initialPassword, email_confirm: true });
      } catch (authErr: any) {
        console.warn('[TRANSACTION] Notice Auth Supabase (utilisateur existant ou non-bloquant):', authErr?.message);
      }
    }

    const { data: userInserted, error: userInsertErr } = await client
      .from('users')
      .insert({
        doc_id: userDocId,
        uid: userUid,
        email: userEmail,
        name: empName,
        role_id: computedRoleId,
        status: true,
        department: empDepartment,
        phone: input.phone || null,
        avatar_url: input.avatarUrl || null,
        raw_data: {
          doc_id: userDocId, role: resolvedRole, roleId: computedRoleId,
          employeeId: empDocId, employeeDbId: createdEmployeeDbId,
          department: empDepartment, passwordHash: initialPassword, createdAt: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (userInsertErr || !userInserted) {
      throw new Error(`Étape 2 échouée (Création utilisateur): ${userInsertErr?.message || 'Insertion utilisateur nulle'}`);
    }

    createdUserId = userInserted.id;

    const { data: empUpdated, error: empUpdateErr } = await client
      .from('employees')
      .update({
        user_id: createdUserId,
        role_id: computedRoleId,
        raw_data: { ...rawEmpData.raw_data, userId: createdUserId, roleId: computedRoleId },
        updated_at: new Date().toISOString(),
      })
      .eq('id', createdEmployeeDbId)
      .select()
      .single();

    if (empUpdateErr || !empUpdated) {
      throw new Error(`Étape 3 échouée (Mise à jour collaborateur avec user_id/role_id): ${empUpdateErr?.message || 'Mise à jour nulle'}`);
    }

    const notifObj = buildCreateNotifObject(empDocId, createdEmployeeDbId!, createdUserId!, userEmail, empDepartment, resolvedRole, empName);

    const { data: notifInserted, error: notifInsertErr } = await client
      .from('notifications')
      .insert({
        doc_id: notifObj.id,
        title: notifObj.title,
        message: notifObj.content,
        type: notifObj.type,
        target_user_id: createdUserId,
        is_read: false,
        raw_data: notifObj,
      })
      .select()
      .single();

    if (notifInsertErr || !notifInserted) {
      console.warn('[TRANSACTION - NOTIFICATION AVERTISSEMENT]:', notifInsertErr?.message);
    } else {
      createdNotifDbId = notifInserted.id;
    }

    const { finalEmployee, finalUser } = buildFinalCreatedModels({
      input, empDocId, empUid,
      createdEmployeeDbId: createdEmployeeDbId!,
      createdUserId: createdUserId!,
      computedRoleId, resolvedRole, empName, userEmail, empDepartment,
      photoUrl: rawEmpData.photo_url, userDocId, userUid,
    });

    try {
      await offlineService.cacheLocally(EMPLOYEES_COLLECTION, finalEmployee);
      await offlineService.cacheLocally('users', finalUser);
      await offlineService.cacheLocally('notifications', notifObj);
    } catch {}

    return { success: true, employee: finalEmployee, user: finalUser, notification: notifObj };
  } catch (error: any) {
    console.error(`🚨 [TRANSACTION ÉCHOUÉE - ROLLBACK DÉCLENCHÉ] : ${error?.message || error}`);
    await rollbackCreatedEntities(client, createdNotifDbId, createdUserId, createdEmployeeDbId);
    throw new Error(`Transaction annulée (Rollback complet) : ${error?.message || 'Erreur inconnue'}`);
  }
}
