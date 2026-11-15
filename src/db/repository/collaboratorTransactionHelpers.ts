import { supabaseAdmin } from '../../lib/supabase';

export interface CreateCollaboratorTransactionInput {
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  roleType?: string;
  userRole?: string;
  department?: string;
  position?: string;
  managerId?: string;
  team?: string;
  teams?: string[];
  hireDate?: string;
  birthDate?: string;
  salary?: number;
  status?: string;
  departureReason?: string;
  suspensionReason?: string;
  avatarUrl?: string;
  userPassword?: string;
  allowEarlyDeparture15_17?: boolean;
  allowLateArrival8_930?: boolean;
}

export async function rollbackCollaboratorCreation(
  createdNotifDbId: number | null,
  createdUserId: number | null,
  createdEmployeeDbId: number | null
): Promise<void> {
  if (createdNotifDbId) {
    try {
      console.log(`⏪ [ROLLBACK] Suppression de la notification (ID: ${createdNotifDbId})...`);
      await supabaseAdmin.from('notifications').delete().eq('id', createdNotifDbId);
      console.log(`✓ [ROLLBACK] Notification supprimée`);
    } catch (rbNotifErr: any) {
      console.error(`❌ [ROLLBACK ERREUR] Suppression notification:`, rbNotifErr?.message);
    }
  }

  if (createdUserId) {
    try {
      console.log(`⏪ [ROLLBACK] Suppression de l'utilisateur (ID: ${createdUserId})...`);
      await supabaseAdmin.from('users').delete().eq('id', createdUserId);
      console.log(`✓ [ROLLBACK] Utilisateur (ID: ${createdUserId}) supprimé`);
    } catch (rbUserErr: any) {
      console.error(`❌ [ROLLBACK ERREUR] Suppression utilisateur:`, rbUserErr?.message);
    }
  }

  if (createdEmployeeDbId) {
    try {
      console.log(`⏪ [ROLLBACK] Suppression du collaborateur (ID: ${createdEmployeeDbId})...`);
      await supabaseAdmin.from('employees').delete().eq('id', createdEmployeeDbId);
      console.log(`✓ [ROLLBACK] Collaborateur (ID: ${createdEmployeeDbId}) supprimé`);
    } catch (rbEmpErr: any) {
      console.error(`❌ [ROLLBACK ERREUR] Suppression collaborateur:`, rbEmpErr?.message);
    }
  }
}

export async function createCollaboratorOfficialNotification(params: {
  empDocId: string;
  createdEmployeeDbId: number;
  createdUserId: number;
  userEmail: string;
  empName: string;
  empDepartment: string;
  resolvedRole: string;
}): Promise<{ notifObj: any; createdNotifDbId: number | null }> {
  const { empDocId, createdEmployeeDbId, createdUserId, userEmail, empName, empDepartment, resolvedRole } = params;
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

  const notifObj = {
    id: notifDocId,
    doc_id: notifDocId,
    type: 'system',
    title: 'Nouveau collaborateur enregistré',
    message: `Le collaborateur ${empName} (${empDepartment}) a été créé et lié à son compte utilisateur (${userEmail}).`,
    content: `Le collaborateur ${empName} (${empDepartment}) a été créé et lié à son compte utilisateur (${userEmail}).`,
    recipient: 'Administrateurs & RH',
    target_user_id: createdUserId,
    payload: JSON.stringify(notifPayload),
    timestamp: new Date().toISOString(),
    read: false,
    is_read: false,
  };

  const { data: notifInserted, error: notifInsertErr } = await supabaseAdmin
    .from('notifications')
    .insert({
      doc_id: notifDocId,
      title: notifObj.title,
      message: notifObj.message,
      type: notifObj.type,
      target_user_id: createdUserId,
      is_read: false,
      raw_data: notifObj,
    })
    .select()
    .single();

  let createdNotifDbId: number | null = null;
  if (notifInsertErr || !notifInserted) {
    console.warn('[TRANSACTION - NOTIFICATION AVERTISSEMENT]:', notifInsertErr?.message);
  } else {
    createdNotifDbId = notifInserted.id;
    console.log('🔔 [NOTIFICATION CRÉÉE ET ENREGISTRÉE AVEC SUCCÈS] :', notifObj);
    console.log('📋 [NOTIFICATION DÉTAILS] Titre:', notifObj.title, '| Message:', notifObj.message, '| User ID:', createdUserId);
  }

  return { notifObj, createdNotifDbId };
}
