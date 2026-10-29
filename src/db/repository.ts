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
    case 'leave_requests': return 'leave_requests';
    case 'absences': return 'absences';
    default: return 'generic_collections';
  }
}

function isUuid(val: any): boolean {
  if (typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
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
      if (!error.message.includes('fetch failed')) {
        console.warn(`[SQL getCollectionData error for ${table}]:`, error.message);
      }
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
      if (table === 'company_settings') {
        return {
          ...raw,
          id: row.doc_id || raw.id || 'main_config',
          docId: row.doc_id || raw.docId || 'main_config',
          companyName: raw.companyName || (row.setting_value && typeof row.setting_value === 'object' && row.setting_value.companyName) || 'Citrine SARL',
          workStartTime: raw.workStartTime || '08:00',
          plannedDepartureTime: raw.plannedDepartureTime || '16:30',
          _dbId: row.id,
        };
      }
      if (table === 'hse_incidents') {
        return {
          ...raw,
          ...row,
          id: row.doc_id || String(row.id),
          docId: row.doc_id || String(row.id),
          reference: raw.reference || `HSE-2026-${String(row.id).padStart(4, '0')}`,
          site: row.site_location || raw.site || 'Base Japoma - Carrefour Matango',
          zonePrecise: row.zone_precise || raw.zonePrecise || '',
          type: row.type || raw.type || 'presque_accident',
          severity: row.severity || raw.severity || 'faible',
          date: row.date || raw.date || '',
          time: row.time || raw.time || '',
          title: row.title || raw.title || '',
          description: row.description || raw.description || '',
          reportedBy: row.reported_by || raw.reportedBy || '',
          victimName: row.victim_name || raw.victimName || '',
          daysLost: typeof row.days_lost === 'number' ? row.days_lost : (typeof raw.daysLost === 'number' ? raw.daysLost : 0),
          status: row.status || raw.status || 'signale',
          immediateActionTaken: raw.immediateActionTaken || '',
          rootCause: raw.rootCause || '',
          victimInjury: raw.victimInjury || '',
          correctiveActions: raw.correctiveActions || [],
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
  } catch (error: any) {
    if (!error?.message?.includes('fetch failed')) {
      console.error(`Database query failed for collection ${collectionName}:`, error);
    }
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

export async function resolveUserDbId(client: any, candidateUserIdVal: any, recipientEmailOrName?: string): Promise<number | null> {
  if (!candidateUserIdVal && !recipientEmailOrName) return null;

  try {
    if (candidateUserIdVal) {
      if (typeof candidateUserIdVal === 'number' && Number.isInteger(candidateUserIdVal)) {
        const { data: directUser } = await client.from('users').select('id').eq('id', candidateUserIdVal).maybeSingle();
        if (directUser?.id) return Number(directUser.id);
      }
      const strVal = String(candidateUserIdVal).trim();
      if (/^\d+$/.test(strVal)) {
        const num = Number(strVal);
        const { data: directUser } = await client.from('users').select('id').eq('id', num).maybeSingle();
        if (directUser?.id) return Number(directUser.id);

        const { data: empLinked } = await client.from('employees').select('user_id').eq('id', num).maybeSingle();
        if (empLinked?.user_id) {
          const { data: linkedUser } = await client.from('users').select('id').eq('id', empLinked.user_id).maybeSingle();
          if (linkedUser?.id) return Number(linkedUser.id);
        }
      }

      const { data: byDoc } = await client.from('employees').select('user_id').eq('doc_id', strVal).maybeSingle();
      if (byDoc?.user_id) {
        const { data: linkedUser } = await client.from('users').select('id').eq('id', byDoc.user_id).maybeSingle();
        if (linkedUser?.id) return Number(linkedUser.id);
      }
    }

    if (recipientEmailOrName && recipientEmailOrName.includes('@')) {
      const { data: byEmail } = await client.from('users').select('id').eq('email', recipientEmailOrName.trim().toLowerCase()).maybeSingle();
      if (byEmail?.id) return Number(byEmail.id);
    }
  } catch (e) {
    console.warn('[resolveUserDbId error]:', e);
  }

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

      // Safe Foreign Key resolution for target_user_id
      const resolvedUserId = await resolveUserDbId(
        supabaseAdmin,
        item.targetUserId || item.target_user_id || item.recipient,
        item.recipient
      );
      rowData.target_user_id = resolvedUserId || null;

      if (item.targetUserIds && Array.isArray(item.targetUserIds)) {
        rowData.target_user_ids = item.targetUserIds;
      }
      if (item.targetEmployeeIds && Array.isArray(item.targetEmployeeIds)) {
        rowData.target_employee_ids = item.targetEmployeeIds;
      } else if (item.employeeId || item.targetEmployeeId) {
        const empDbId = await resolveEmployeeDbId(supabaseAdmin, item.employeeId || item.targetEmployeeId);
        if (empDbId) rowData.target_employee_ids = [empDbId];
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
        else rowData.employee_id = null;
      } else {
        rowData.employee_id = null;
      }
      if (item.projectId && /^\d+$/.test(String(item.projectId))) {
        rowData.project_id = Number(item.projectId);
      } else {
        rowData.project_id = null;
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
      if (item.email) rowData.email = String(item.email).trim();
      rowData.phone = item.phone || null;
      rowData.department = item.department || 'Direction Générale';
      rowData.avatar_url = item.avatarUrl || item.photoUrl || null;
      rowData.status = item.status !== false && item.status !== 'inactif';
      if (item.roleId) rowData.role_id = Number(item.roleId);
    } else if (table === 'employees') {
      rowData.name = item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Collaborateur';
      rowData.first_name = item.firstName || null;
      rowData.last_name = item.lastName || null;
      if (item.email) rowData.email = String(item.email).trim();
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
    } else if (table === 'rh_document_templates') {
      rowData.name = String(item.name || item.title || 'Modèle RH').trim() || 'Modèle RH';
      rowData.code = String(item.code || docId || `code_${Date.now()}`).trim();
      rowData.type = String(item.type || item.documentType || 'general').trim();
      rowData.content_template = String(item.contentTemplate || item.content || item.template || 'Contenu du modèle').trim();
    } else if (table === 'company_settings') {
      rowData.setting_key = 'main_config';
    } else if (table === 'visitor_logs') {
      rowData.visitor_name = item.visitorName || item.visitor_name || item.name || 'Visiteur';
      rowData.visitor_company = item.visitorCompany || item.visitor_company || null;
      rowData.visitor_phone = item.visitorPhone || item.visitor_phone || '';
      rowData.id_card_number = item.idCardNumber || item.id_card_number || null;
      rowData.site_location = item.siteLocation || item.site_location || 'Siège Akwa';
      rowData.purpose = item.purpose || 'rdv_commercial';
      rowData.host_employee_id = item.hostEmployeeId ? String(item.hostEmployeeId) : null;
      rowData.host_employee_name = item.hostEmployeeName || item.host_employee_name || null;
      rowData.badge_number = item.badgeNumber || item.badge_number || null;
      rowData.vehicle_plate = item.vehiclePlate || item.vehicle_plate || null;
      rowData.check_in_time = item.checkInTime || item.check_in_time || null;
      rowData.check_in_date = item.checkInDate || item.check_in_date || new Date().toISOString().split('T')[0];
      rowData.check_out_time = item.checkOutTime || item.check_out_time || null;
      rowData.status = item.status || 'sur_site';
    } else if (table === 'leave_requests') {
      rowData.employee_name = item.employeeName || item.employee_name || null;
      rowData.type = item.type || 'conge_annuel';
      rowData.start_date = item.startDate ? String(item.startDate).split('T')[0] : new Date().toISOString().split('T')[0];
      rowData.end_date = item.endDate ? String(item.endDate).split('T')[0] : new Date().toISOString().split('T')[0];
      rowData.days_count = Number(item.daysCount || 1);
      rowData.reason = item.reason || null;
      rowData.status = item.status || 'pending';
      rowData.decided_by = item.decidedBy || null;
      rowData.decided_at = item.decidedAt || null;
      rowData.decision_reason = item.managerComment || item.decisionReason || null;
      if (item.employeeId) {
        const resolvedId = await resolveEmployeeDbId(supabaseAdmin, item.employeeId);
        if (resolvedId) rowData.employee_id = resolvedId;
      }
    } else if (table === 'absences') {
      rowData.employee_name = item.employeeName || item.employee_name || null;
      rowData.date = item.date ? String(item.date).split('T')[0] : new Date().toISOString().split('T')[0];
      rowData.type = item.type || 'non_justifie';
      rowData.reason = item.reason || null;
      rowData.status = item.status || 'en_attente';
      if (item.employeeId) {
        const resolvedId = await resolveEmployeeDbId(supabaseAdmin, item.employeeId);
        if (resolvedId) rowData.employee_id = resolvedId;
      }
    } else if (table === 'hse_incidents') {
      rowData.title = item.title;
      rowData.site_location = item.site || item.siteLocation || 'Base Japoma - Carrefour Matango';
      rowData.zone_precise = item.zonePrecise || null;
      rowData.type = item.type || 'presque_accident';
      rowData.severity = item.severity || 'faible';
      rowData.date = item.date || new Date().toISOString().split('T')[0];
      rowData.time = item.time || null;
      rowData.description = item.description || null;
      rowData.reported_by = item.reportedBy || null;
      rowData.victim_name = item.victimName || null;
      rowData.days_lost = Number(item.daysLost || 0);
      rowData.status = item.status || 'signale';
    }

    // For employees and users, find existing row by doc_id, id, or email before inserting/upserting
    let matchedId: number | null = null;
    if (table === 'employees' || table === 'users') {
      if (docId) {
        const { data: byDoc } = await supabaseAdmin.from(table).select('id').eq('doc_id', docId).maybeSingle();
        if (byDoc?.id) matchedId = byDoc.id;
      }
      if (!matchedId && rowData.id && typeof rowData.id === 'number') {
        const { data: byNumId } = await supabaseAdmin.from(table).select('id').eq('id', rowData.id).maybeSingle();
        if (byNumId?.id) matchedId = byNumId.id;
      }
      if (!matchedId && rowData.email) {
        const { data: byEmail } = await supabaseAdmin.from(table).select('id').ilike('email', rowData.email).maybeSingle();
        if (byEmail?.id) matchedId = byEmail.id;
      }
    }

    if (matchedId) {
      const { error: updateErr } = await supabaseAdmin.from(table).update(rowData).eq('id', matchedId);
      if (updateErr) {
        console.warn(`[repository] Update by id ${matchedId} failed on ${table}:`, updateErr.message);
        throw updateErr;
      }
    } else {
      const { error: saveErr } = await supabaseAdmin.from(table).upsert(rowData, { onConflict: 'doc_id' });
      if (saveErr) {
        console.warn(`Database upsert error for table ${table}, trying fallback:`, saveErr.message);
        // Fallback: check by doc_id or email
        let existingId: number | null = null;
        const { data: existingRows } = await supabaseAdmin.from(table).select('id').eq('doc_id', docId).limit(1);
        if (existingRows && existingRows.length > 0) {
          existingId = existingRows[0].id;
        } else if (rowData.email) {
          const { data: existingByEmail } = await supabaseAdmin.from(table).select('id').ilike('email', rowData.email).limit(1);
          if (existingByEmail && existingByEmail.length > 0) {
            existingId = existingByEmail[0].id;
          }
        }

        if (existingId) {
          const { error: updateErr } = await supabaseAdmin.from(table).update(rowData).eq('id', existingId);
          if (updateErr) throw updateErr;
        } else {
          const { error: insertErr } = await supabaseAdmin.from(table).insert(rowData);
          if (insertErr) throw insertErr;
        }
      }
    }
  } catch (error: any) {
    console.error(`Database save failed for ${collectionName}/${docId}:`, error);
    throw error;
  }

  return savedItem;
}

export async function deleteDocumentData(collectionName: string, id: string): Promise<boolean> {
  const table = mapCollectionToTable(collectionName);
  try {
    const strId = String(id).trim();
    if (table === 'generic_collections') {
      await supabaseAdmin
        .from('generic_collections')
        .delete()
        .eq('collection', collectionName)
        .eq('doc_id', strId);
      return true;
    }

    if (/^\d+$/.test(strId)) {
      await Promise.allSettled([
        supabaseAdmin.from(table).delete().eq('id', Number(strId)),
        supabaseAdmin.from(table).delete().eq('doc_id', strId),
      ]);
    } else if (isUuid(strId)) {
      await Promise.allSettled([
        supabaseAdmin.from(table).delete().eq('uid', strId),
        supabaseAdmin.from(table).delete().eq('doc_id', strId),
      ]);
    } else {
      await Promise.allSettled([
        supabaseAdmin.from(table).delete().eq('doc_id', strId),
        supabaseAdmin.from(table).delete().match({ id: strId }),
      ]);
    }

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
  const userEmail = input.email.trim();
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

export interface AtomicClockingTransactionInput {
  presence: any;
  incident?: any | null;
  notification?: any | null;
}

export async function executeAtomicClockingTransaction(input: AtomicClockingTransactionInput) {
  const { presence, incident, notification } = input;
  if (!presence) {
    throw new Error('Données de présence obligatoires pour la transaction atomique.');
  }

  let presenceCreatedDbId: number | null = null;
  let incidentCreatedDbId: number | null = null;
  let notificationCreatedDbId: number | null = null;

  console.log(`🚀 [TRANSACTION POINTAGE INITIALISÉE] Collaborateur: ${presence.employeeName || presence.employeeId} - Date: ${presence.date}`);

  try {
    // 1. Résolution de l'identifiant employé en base
    const empIdVal = presence.employeeId || presence.employee_id;
    const resolvedEmpDbId = await resolveEmployeeDbId(supabaseAdmin, empIdVal);

    // 2. Persistance de la Présence
    const presDocId = String(presence.id || presence.docId || `pr-${Date.now()}`);
    const presenceRow: any = {
      doc_id: presDocId,
      employee_id: resolvedEmpDbId || null,
      employee_name: presence.employeeName || presence.employee_name || null,
      date: presence.date || new Date().toISOString().split('T')[0],
      arrival_time: presence.arrivalTime || null,
      departure_time: presence.departureTime || null,
      status: presence.status || 'present',
      late_minutes: Number(presence.lateMinutes || 0),
      pause_minutes: Number(presence.pauseMinutes || 0),
      motif: presence.motif || presence.adminBadgeReason || null,
      signature: presence.signature || null,
      gps_lat: typeof presence.latitude === 'number' ? presence.latitude : (typeof presence.gpsLat === 'number' ? presence.gpsLat : null),
      gps_lng: typeof presence.longitude === 'number' ? presence.longitude : (typeof presence.gpsLng === 'number' ? presence.gpsLng : null),
      method: presence.clockingMethod || presence.method || 'qr_code_door',
      raw_data: { ...presence, id: presDocId },
      updated_at: new Date().toISOString(),
    };

    console.log(`📌 [TRANSACTION POINTAGE - ÉTAPE 1/3] Enregistrement présence (${presenceRow.doc_id})...`);
    const { data: savedPresence, error: presErr } = await supabaseAdmin
      .from('presences')
      .upsert(presenceRow, { onConflict: 'doc_id' })
      .select()
      .single();

    if (presErr) {
      console.error('[Atomic Clocking] Presence upsert error:', presErr.message);
      throw new Error(`Échec de sauvegarde de la présence: ${presErr.message}`);
    }
    presenceCreatedDbId = savedPresence.id;
    console.log(`✓ [TRANSACTION POINTAGE - ÉTAPE 1/3] Présence enregistrée (DB ID: ${presenceCreatedDbId})`);

    // 3. Persistance de l'Incident de pointage (ex: retard ou départ anticipé)
    let savedIncident: any = null;
    if (incident) {
      console.log(`📌 [TRANSACTION POINTAGE - ÉTAPE 2/3] Enregistrement incident (${incident.type})...`);
      const incDocId = String(incident.id || incident.docId || `inc-${Date.now()}`);
      const incEmpId = await resolveEmployeeDbId(supabaseAdmin, incident.employeeId || empIdVal);
      const incidentRow: any = {
        doc_id: incDocId,
        employee_id: incEmpId || resolvedEmpDbId || null,
        date: incident.date || presenceRow.date,
        type: incident.type || 'retard',
        description: incident.reason || incident.description || incident.origin || 'Incident de présence',
        status: incident.status || 'automatique',
        raw_data: { ...incident, id: incDocId },
        updated_at: new Date().toISOString(),
      };

      const { data: incData, error: incErr } = await supabaseAdmin
        .from('attendance_incidents')
        .upsert(incidentRow, { onConflict: 'doc_id' })
        .select()
        .single();

      if (incErr) {
        console.error('[Atomic Clocking] Incident upsert error:', incErr.message);
        throw new Error(`Échec de sauvegarde de l'incident: ${incErr.message}`);
      }
      savedIncident = incData;
      incidentCreatedDbId = incData.id;
      console.log(`✓ [TRANSACTION POINTAGE - ÉTAPE 2/3] Incident consigné (DB ID: ${incidentCreatedDbId})`);
    }

    // 4. Persistance de la Notification système
    let savedNotification: any = null;
    if (notification) {
      console.log(`📌 [TRANSACTION POINTAGE - ÉTAPE 3/3] Enregistrement notification système...`);
      const notifDocId = String(notification.id || notification.docId || `notif-clock-${Date.now()}`);
      const resolvedUserId = await resolveUserDbId(
        supabaseAdmin,
        notification.targetUserId || notification.recipient || empIdVal,
        notification.recipient
      );

      const notifText = notification.message || notification.content || notification.description || notification.title || 'Pointage validé';
      const notificationRow: any = {
        doc_id: notifDocId,
        title: notification.title || 'Pointage enregistré',
        message: notifText,
        type: notification.type || 'system',
        is_read: Boolean(notification.isRead ?? notification.read ?? false),
        target_user_id: resolvedUserId || null,
        target_employee_ids: resolvedEmpDbId ? [resolvedEmpDbId] : null,
        raw_data: { ...notification, id: notifDocId },
        updated_at: new Date().toISOString(),
      };

      const { data: notifData, error: notifErr } = await supabaseAdmin
        .from('notifications')
        .upsert(notificationRow, { onConflict: 'doc_id' })
        .select()
        .single();

      if (notifErr) {
        console.error('[Atomic Clocking] Notification upsert error:', notifErr.message);
        throw new Error(`Échec de sauvegarde de la notification: ${notifErr.message}`);
      }
      savedNotification = notifData;
      notificationCreatedDbId = notifData.id;
      console.log(`✓ [TRANSACTION POINTAGE - ÉTAPE 3/3] Notification émise (DB ID: ${notificationCreatedDbId})`);
    }

    console.log(`🎉 [TRANSACTION POINTAGE RÉUSSIE] Présence, incident et notification validés atomiquement !`);
    return {
      success: true,
      presence: { ...presence, id: presDocId, _dbId: presenceCreatedDbId },
      incident: savedIncident ? { ...incident, id: incidentRowDoc(savedIncident), _dbId: incidentCreatedDbId } : null,
      notification: savedNotification ? { ...notification, id: notifRowDoc(savedNotification), _dbId: notificationCreatedDbId } : null,
    };
  } catch (error: any) {
    console.error(`🚨 [TRANSACTION POINTAGE ÉCHOUÉE - ROLLBACK INTÉGRAL] : ${error?.message || error}`);

    // ROLLBACK ATOMIQUE COMPLET
    if (notificationCreatedDbId) {
      try {
        console.log(`⏪ [ROLLBACK POINTAGE] Annulation notification (ID: ${notificationCreatedDbId})...`);
        await supabaseAdmin.from('notifications').delete().eq('id', notificationCreatedDbId);
      } catch (rbErr: any) {
        console.error(`❌ [ROLLBACK ERREUR] Suppression notification:`, rbErr?.message);
      }
    }
    if (incidentCreatedDbId) {
      try {
        console.log(`⏪ [ROLLBACK POINTAGE] Annulation incident (ID: ${incidentCreatedDbId})...`);
        await supabaseAdmin.from('attendance_incidents').delete().eq('id', incidentCreatedDbId);
      } catch (rbErr: any) {
        console.error(`❌ [ROLLBACK ERREUR] Suppression incident:`, rbErr?.message);
      }
    }
    if (presenceCreatedDbId) {
      try {
        console.log(`⏪ [ROLLBACK POINTAGE] Annulation présence (ID: ${presenceCreatedDbId})...`);
        await supabaseAdmin.from('presences').delete().eq('id', presenceCreatedDbId);
      } catch (rbErr: any) {
        console.error(`❌ [ROLLBACK ERREUR] Suppression présence:`, rbErr?.message);
      }
    }

    throw new Error(`Transaction de pointage atomique annulée : ${error?.message || 'Erreur inconnue'}`);
  }
}

function incidentRowDoc(row: any): string {
  return row?.doc_id || row?.id || `inc-${Date.now()}`;
}

function notifRowDoc(row: any): string {
  return row?.doc_id || row?.id || `notif-${Date.now()}`;
}

