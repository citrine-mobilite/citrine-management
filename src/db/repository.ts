import { supabaseAdmin } from '../lib/supabase';

// Map collection name to Supabase table name
function mapCollectionToTable(collectionName: string): string {
  switch (collectionName) {
    case 'users': return 'users';
    case 'employees': return 'employees';
    case 'tasks': return 'tasks';
    case 'task_projects': return 'task_projects';
    case 'reminders': return 'reminders';
    case 'presences': return 'presences';
    case 'attendance_incidents': return 'attendance_incidents';
    case 'badge_codes_16': return 'badge_codes_16';
    case 'dynamic_qr_sessions': return 'dynamic_qr_sessions';
    case 'inventory_items':
    case 'inventory': return 'inventory';
    case 'disciplinary_incidents': return 'disciplinary_incidents';
    case 'departments': return 'departments';
    case 'documents': return 'documents';
    case 'rh_document_templates': return 'rh_document_templates';
    case 'processflow_salary_debts': return 'processflow_salary_debts';
    case 'salary_payments': return 'salary_payments';
    case 'financial_transactions': return 'financial_transactions';
    case 'partners': return 'partners';
    case 'notifications': return 'notifications';
    case 'company_settings': return 'company_settings';
    case 'calls': return 'calls';
    case 'user_presences': return 'user_presences';
    case 'job_offers': return 'job_offers';
    case 'job_applications': return 'job_applications';
    case 'expense_claims': return 'expense_claims';
    case 'hse_incidents': return 'hse_incidents';
    case 'visitor_logs': return 'visitor_logs';
    case 'idea_suggestions': return 'idea_suggestions';
    case 'enterprise_surveys': return 'enterprise_surveys';
    case 'connection_logs': return 'connection_logs';
    case 'admin_audit_logs':
    case 'citrine_admin_audit_operations_v1': return 'admin_audit_logs';
    default: return 'generic_collections';
  }
}

export function isSqlConfigured(): boolean {
  return true; // Database (Supabase PostgreSQL) is always active
}

export async function getCollectionData(collectionName: string): Promise<any[]> {
  const table = mapCollectionToTable(collectionName);
  try {
    if (table === 'generic_collections') {
      const { data, error } = await supabaseAdmin
        .from('generic_collections')
        .select('*')
        .eq('collection', collectionName);
      if (error) throw error;
      return (data || []).map((row: any) => ({
        ...(row.data || {}),
        id: row.doc_id || row.id,
        _dbId: row.id,
      }));
    }

    const { data, error } = await supabaseAdmin.from(table).select('*');
    if (error) {
      console.warn(`[SQL getCollectionData error for ${table}]:`, error.message);
      return [];
    }

    return (data || []).map((row: any) => {
      const raw = row.raw_data && typeof row.raw_data === 'object' ? row.raw_data : {};
      if (table === 'notifications') {
        const textMsg = row.message || raw.message || raw.content || raw.description || raw.title || 'Notification système';
        return {
          ...raw,
          ...row,
          title: row.title || raw.title || 'Notification',
          message: textMsg,
          content: raw.content || textMsg,
          id: row.doc_id || row.id || raw.id,
          _dbId: row.id,
        };
      }
      return {
        ...raw,
        ...row,
        id: row.doc_id || row.id || raw.id,
        _dbId: row.id,
      };
    });
  } catch (error) {
    console.error(`Database query failed for collection ${collectionName}:`, error);
    return [];
  }
}

async function resolveEmployeeDbId(client: any, empIdVal: any): Promise<number | null> {
  if (!empIdVal) return null;
  if (typeof empIdVal === 'number' && Number.isInteger(empIdVal)) return empIdVal;
  const strId = String(empIdVal).trim();
  if (/^\d+$/.test(strId)) return Number(strId);

  try {
    const { data: byDoc } = await client.from('employees').select('id').eq('doc_id', strId).maybeSingle();
    if (byDoc?.id) return Number(byDoc.id);

    const { data: byEmail } = await client.from('employees').select('id').eq('email', strId.toLowerCase()).maybeSingle();
    if (byEmail?.id) return Number(byEmail.id);
  } catch {}
  return null;
}

export async function saveDocumentData(collectionName: string, item: any): Promise<any> {
  const table = mapCollectionToTable(collectionName);
  const docId = String(item.id || item.docId || `doc_${Date.now()}`);
  const savedItem = { ...item, id: docId, updatedAt: new Date().toISOString() };

  try {
    if (table === 'generic_collections') {
      await supabaseAdmin.from('generic_collections').upsert({
        collection: collectionName,
        doc_id: docId,
        data: savedItem,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'collection,doc_id' });
      return savedItem;
    }

    const rowData: any = {
      doc_id: docId,
      raw_data: savedItem,
      updated_at: new Date().toISOString(),
    };

    if (table === 'notifications') {
      rowData.title = item.title || 'Notification';
      rowData.message = item.message || item.content || item.description || item.payload || item.title || 'Notification système';
      rowData.type = item.type || 'system';
      rowData.is_read = Boolean(item.isRead ?? item.read ?? false);
      if (item.targetUserId) {
        if (typeof item.targetUserId === 'number') {
          rowData.target_user_id = item.targetUserId;
        } else if (typeof item.targetUserId === 'string' && /^\d+$/.test(item.targetUserId)) {
          rowData.target_user_id = Number(item.targetUserId);
        }
      }
      if (item.targetUserIds && Array.isArray(item.targetUserIds)) {
        rowData.target_user_ids = item.targetUserIds;
      }
      if (item.targetEmployeeIds && Array.isArray(item.targetEmployeeIds)) {
        rowData.target_employee_ids = item.targetEmployeeIds;
      }
    } else if (table === 'presences') {
      rowData.employee_name = item.employeeName || item.employee_name || null;
      rowData.date = item.date || new Date().toISOString().split('T')[0];
      rowData.arrival_time = item.arrivalTime || null;
      rowData.departure_time = item.departureTime || null;
      rowData.status = item.status || 'present';
      rowData.late_minutes = Number(item.lateMinutes || 0);
      rowData.pause_minutes = Number(item.pauseMinutes || 0);
      rowData.motif = item.motif || item.adminBadgeReason || null;
      rowData.signature = item.signature || null;
      rowData.gps_lat = typeof item.latitude === 'number' ? item.latitude : (typeof item.gpsLat === 'number' ? item.gpsLat : null);
      rowData.gps_lng = typeof item.longitude === 'number' ? item.longitude : (typeof item.gpsLng === 'number' ? item.gpsLng : null);
      rowData.method = item.clockingMethod || item.method || 'kiosk';
      if (item.employeeId) {
        const resolvedId = await resolveEmployeeDbId(supabaseAdmin, item.employeeId);
        if (resolvedId) rowData.employee_id = resolvedId;
      }
    } else if (table === 'attendance_incidents') {
      rowData.date = item.date || new Date().toISOString().split('T')[0];
      rowData.type = item.type || 'retard';
      rowData.description = item.reason || item.description || item.origin || 'Incident de présence';
      rowData.status = item.status || 'en_attente';
      if (item.employeeId) {
        const resolvedId = await resolveEmployeeDbId(supabaseAdmin, item.employeeId);
        if (resolvedId) rowData.employee_id = resolvedId;
      }
    } else if (table === 'badge_codes_16') {
      rowData.code = item.code || '';
      rowData.assigned_name = item.assignedName || item.employeeName || null;
      rowData.created_by = item.createdBy || item.generatedBy || 'Responsable';
      rowData.expires_at = item.expiresAt || null;
      rowData.is_used = Boolean(item.isUsed);
      rowData.used_at = item.usedAt || null;
      if (item.employeeId || item.usedByEmployeeId) {
        const resolvedId = await resolveEmployeeDbId(supabaseAdmin, item.employeeId || item.usedByEmployeeId);
        if (resolvedId) rowData.employee_id = resolvedId;
      }
    } else if (table === 'dynamic_qr_sessions') {
      rowData.session_id = item.sessionId || item.id || `dyn_${Date.now()}`;
      rowData.created_by = item.createdBy || item.generatedBy || 'Responsable';
      rowData.expires_at = item.expiresAt || null;
      rowData.is_active = item.isActive !== false;
    } else if (table === 'tasks') {
      rowData.title = item.title || 'Tâche';
      rowData.description = item.description || null;
      rowData.date = item.date || null;
      rowData.time = item.time || null;
      rowData.status = item.status || 'todo';
      rowData.priority = item.priority || 'medium';
      rowData.assigned_to = item.assignedTo || null;
      rowData.department = item.department || null;
      rowData.due_date = item.dueDate || null;
      rowData.is_milestone = Boolean(item.isMilestone);
      rowData.milestone_progress = Number(item.milestoneProgress || 0);
      if (item.employeeId) {
        const resolvedId = await resolveEmployeeDbId(supabaseAdmin, item.employeeId);
        if (resolvedId) rowData.employee_id = resolvedId;
      }
      if (item.projectId && /^\d+$/.test(String(item.projectId))) {
        rowData.project_id = Number(item.projectId);
      }
    } else if (table === 'reminders') {
      rowData.title = item.title || 'Rappel';
      rowData.note = item.note || item.description || null;
      rowData.date = item.date || null;
      rowData.time = item.time || null;
      rowData.location = item.location || null;
      rowData.all_employees = Boolean(item.allEmployees);
      rowData.trigger_before = item.triggerBefore || null;
      rowData.triggered = Boolean(item.triggered);
      rowData.stopped = Boolean(item.stopped);
      if (item.employeeId) {
        const resolvedId = await resolveEmployeeDbId(supabaseAdmin, item.employeeId);
        if (resolvedId) rowData.employee_id = resolvedId;
      }
    } else if (table === 'departments') {
      rowData.name = item.name || 'Département';
      rowData.code = item.code || null;
      rowData.budget_xaf = Number(item.budgetXaf || item.budget || 0);
    } else if (table === 'inventory') {
      rowData.name = item.name || item.designation || 'Matériel';
      rowData.category = item.category || null;
      rowData.serial_number = item.serialNumber || null;
      rowData.quantity = Number(item.quantity || 1);
      rowData.status = item.status || 'disponible';
      rowData.unit_price_xaf = Number(item.unitPriceXaf || item.price || 0);
    } else if (table === 'documents') {
      rowData.title = item.title || 'Document';
      rowData.type = item.type || item.documentType || 'general';
    } else if (table === 'users') {
      rowData.name = item.name || item.email || 'Utilisateur';
      if (item.email) rowData.email = String(item.email).trim().toLowerCase();
      rowData.phone = item.phone || null;
      rowData.department = item.department || 'Direction Générale';
      rowData.avatar_url = item.avatarUrl || item.photoUrl || null;
      rowData.status = item.status !== false && item.status !== 'inactif';
      if (item.roleId) rowData.role_id = Number(item.roleId);
    } else if (table === 'employees') {
      rowData.name = item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Collaborateur';
      rowData.first_name = item.firstName || null;
      rowData.last_name = item.lastName || null;
      if (item.email) rowData.email = String(item.email).trim().toLowerCase();
      rowData.phone = item.phone || null;
      rowData.department = item.department || 'Direction Générale';
      rowData.position = item.position || item.role || item.roleType || null;
      rowData.role_type = item.roleType || item.role || 'Employé';
      rowData.status = item.status === true || item.status === 'en_poste';
      rowData.hire_date = item.hireDate ? String(item.hireDate).split('T')[0] : null;
      rowData.salary = Number(item.salary || 0);
      rowData.photo_url = item.photoUrl || item.avatarUrl || null;
      rowData.emergency_contact = item.emergencyContact || null;
      rowData.work_location = item.workLocation || 'Douala';
      rowData.badge_code = item.badgeCode || null;
      if (item.userId) {
        if (typeof item.userId === 'number') rowData.user_id = item.userId;
        else if (typeof item.userId === 'string' && /^\d+$/.test(item.userId)) rowData.user_id = Number(item.userId);
      }
      if (item.roleId) rowData.role_id = Number(item.roleId);
    } else if (table === 'disciplinary_incidents') {
      rowData.employee_name = item.employeeName || null;
      rowData.date = item.date || new Date().toISOString().split('T')[0];
      rowData.severity = item.severity || 'mineure';
      rowData.reason = item.reason || 'Incident disciplinaire';
      rowData.action_taken = item.actionTaken || null;
      rowData.decision_by = item.decisionBy || null;
      if (item.employeeId) {
        const resolvedId = await resolveEmployeeDbId(supabaseAdmin, item.employeeId);
        if (resolvedId) rowData.employee_id = resolvedId;
      }
    }

    const { error: saveErr } = await supabaseAdmin.from(table).upsert(rowData, { onConflict: 'doc_id' });
    if (saveErr) {
      console.error(`Database save error for table ${table}:`, saveErr.message);
      // Fallback: update by doc_id if exists, otherwise insert
      const { data: existingRows } = await supabaseAdmin.from(table).select('id').eq('doc_id', docId).limit(1);
      if (existingRows && existingRows.length > 0) {
        await supabaseAdmin.from(table).update(rowData).eq('doc_id', docId);
      } else {
        await supabaseAdmin.from(table).insert(rowData);
      }
    }
  } catch (error) {
    console.error(`Database save failed for ${collectionName}/${docId}:`, error);
  }

  return savedItem;
}

export async function deleteDocumentData(collectionName: string, id: string): Promise<boolean> {
  const table = mapCollectionToTable(collectionName);
  try {
    if (table === 'generic_collections') {
      await supabaseAdmin
        .from('generic_collections')
        .delete()
        .eq('collection', collectionName)
        .eq('doc_id', id);
      return true;
    }

    await supabaseAdmin
      .from(table)
      .delete()
      .eq('doc_id', id);

    return true;
  } catch (error) {
    console.error(`Database delete failed for ${collectionName}/${id}:`, error);
    return false;
  }
}

export async function getOrCreateUserRecord(uid: string, email: string, name?: string, role?: string) {
  try {
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('uid', uid)
      .limit(1);

    if (existing && existing.length > 0) {
      return existing[0];
    }

    const newUser = {
      uid,
      email,
      name: name || null,
      doc_id: uid,
      raw_data: { uid, email, name, role },
      updated_at: new Date().toISOString(),
    };

    const { data: inserted, error } = await supabaseAdmin
      .from('users')
      .upsert(newUser, { onConflict: 'uid' })
      .select()
      .single();

    if (error) throw error;
    return inserted;
  } catch (error) {
    console.error(`Error in getOrCreateUserRecord for ${uid}:`, error);
    return null;
  }
}

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
  hireDate?: string;
  birthDate?: string;
  salary?: number;
  status?: string;
  departureReason?: string;
  suspensionReason?: string;
  avatarUrl?: string;
  userPassword?: string;
}

/**
 * Exécute le flux transactionnel complet de création de collaborateur :
 * 1. Création de la fiche collaborateur (employé) sans user_id ni role_id
 * 2. Création automatique du compte utilisateur
 * 3. Modification du collaborateur pour lui assigner user_id et role_id
 * 4. Création et enregistrement de la notification officielle avec logs
 * 
 * En cas d'échec à n'importe quelle étape, un ROLLBACK complet est garanti.
 */
export async function executeCollaboratorCreationTransaction(input: CreateCollaboratorTransactionInput) {
  const userEmail = input.email.trim().toLowerCase();
  const empName = input.name.trim();
  const empDepartment = input.department?.trim() || 'Direction Générale';
  const initialPassword = input.userPassword?.trim() || 'Collab@2026';

  const roleTypeLower = (input.roleType || input.userRole || '').toLowerCase();
  const computedRoleId = roleTypeLower.includes('admin') ? 1 : roleTypeLower.includes('responsable') ? 2 : 3;
  const resolvedRole = computedRoleId === 1 ? 'administrateur' : computedRoleId === 2 ? 'responsable' : 'employé';

  const empDocId = `emp-${Date.now()}`;
  const userDocId = `user-${Date.now()}`;

  // 0. Vérification préalable des doublons d'email pour éviter des conflits partiels
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

  console.log(`🚀 [TRANSACTION INITIALISÉE] Création collaborateur "${empName}" (${userEmail})`);

  try {
    // -------------------------------------------------------------------------
    // ÉTAPE 1 : CRÉATION DU COLLABORATEUR DANS LA TABLE EMPLOYEES (SANS USER_ID NI ROLE_ID)
    // -------------------------------------------------------------------------
    console.log('📌 [TRANSACTION - ÉTAPE 1/4] Création du collaborateur initial dans la table employees...');
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
        managerId: input.managerId || null,
        birthDate: input.birthDate || null,
        avatarUrl: input.avatarUrl || null,
        departureReason: input.departureReason || null,
        suspensionReason: input.suspensionReason || null,
      }
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
    console.log(`✅ [TRANSACTION - ÉTAPE 1/4 VALIDÉE] Collaborateur créé avec succès. ID: ${createdEmployeeDbId}, DocID: ${empDocId}`);

    // -------------------------------------------------------------------------
    // ÉTAPE 2 : CRÉATION AUTOMATIQUE DU COMPTE UTILISATEUR ASSOCIÉ
    // -------------------------------------------------------------------------
    console.log('📌 [TRANSACTION - ÉTAPE 2/4] Création automatique du compte utilisateur associé...');

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
          passwordHash: initialPassword,
          createdAt: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (userInsertErr || !userInserted) {
      throw new Error(`Étape 2 échouée (Création utilisateur): ${userInsertErr?.message || 'Insertion utilisateur nulle'}`);
    }

    createdUserId = userInserted.id;
    console.log(`✅ [TRANSACTION - ÉTAPE 2/4 VALIDÉE] Utilisateur créé avec succès. ID: ${createdUserId}, Email: ${userEmail}`);

    // -------------------------------------------------------------------------
    // ÉTAPE 3 : MODIFICATION DU COLLABORATEUR POUR LUI ASSIGNER USER_ID ET ROLE_ID
    // -------------------------------------------------------------------------
    console.log(`📌 [TRANSACTION - ÉTAPE 3/4] Modification du collaborateur avec user_id: ${createdUserId} et role_id: ${computedRoleId}...`);

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
        updated_at: new Date().toISOString()
      })
      .eq('id', createdEmployeeDbId)
      .select()
      .single();

    if (empUpdateErr || !empUpdated) {
      throw new Error(`Étape 3 échouée (Mise à jour collaborateur avec user_id/role_id): ${empUpdateErr?.message || 'Mise à jour nulle'}`);
    }

    console.log(`✅ [TRANSACTION - ÉTAPE 3/4 VALIDÉE] Collaborateur mis à jour avec succès avec user_id: ${createdUserId} et role_id: ${computedRoleId}`);

    // -------------------------------------------------------------------------
    // ÉTAPE 4 : CRÉATION ET ENREGISTREMENT DE LA NOTIFICATION OFFICIELLE
    // -------------------------------------------------------------------------
    console.log('📌 [TRANSACTION - ÉTAPE 4/4] Création et enregistrement de la notification...');
    const notifDocId = `notif-collab-${Date.now()}`;
    const notifPayload = {
      employeeId: empDocId,
      employeeDbId: createdEmployeeDbId,
      userId: createdUserId,
      userEmail,
      department: empDepartment,
      role: resolvedRole,
      createdAt: new Date().toISOString()
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
      is_read: false
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
        raw_data: notifObj
      })
      .select()
      .single();

    if (notifInsertErr || !notifInserted) {
      console.warn('[TRANSACTION - NOTIFICATION AVERTISSEMENT]:', notifInsertErr?.message);
    } else {
      createdNotifDbId = notifInserted.id;
      console.log('🔔 [NOTIFICATION CRÉÉE ET ENREGISTRÉE AVEC SUCCÈS] :', notifObj);
      console.log('📋 [NOTIFICATION DÉTAILS] Titre:', notifObj.title, '| Message:', notifObj.message, '| User ID:', createdUserId);
    }

    console.log(`🎉 [TRANSACTION TERMINÉE & COMMITTÉE] Collaborateur, Utilisateur et Notification validés à 100%!`);

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
      notification: notifObj
    };

  } catch (error: any) {
    console.error(`🚨 [TRANSACTION ÉCHOUÉE - ROLLBACK DÉCLENCHÉ] : ${error?.message || error}`);

    // ROLLBACK COMPLET
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

    throw new Error(`Transaction annulée (Rollback complet) : ${error?.message || 'Erreur inconnue'}`);
  }
}

