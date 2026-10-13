import { supabase, supabaseAdmin } from '../lib/supabase';
import { offlineService } from './offlineService';

// Mapper to map collection name to Supabase table name
export function mapCollectionToTable(collectionName: string): string {
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

// Convert Firestore/App item into Supabase row format
function itemToSupabaseRow(collectionName: string, item: any): any {
  const table = mapCollectionToTable(collectionName);
  const docId = String(item.id || item.docId || `doc_${Date.now()}`);

  if (table === 'generic_collections') {
    return {
      collection: collectionName,
      doc_id: docId,
      data: item,
      updated_at: new Date().toISOString(),
    };
  }

  const base: any = {
    doc_id: docId,
    raw_data: item,
    updated_at: new Date().toISOString(),
  };

  // Only assign numeric id if explicitly provided as an integer, otherwise let BIGSERIAL auto-increment
  if (typeof item.id === 'number' || (typeof item.id === 'string' && /^\d+$/.test(item.id))) {
    base.id = Number(item.id);
  }

  switch (table) {
    case 'users':
      return {
        ...base,
        uid: item.uid || docId,
        email: item.email || '',
        name: item.name || null,
        role: item.role || 'Employé',
        status: item.status || 'actif',
        department: item.department || null,
        phone: item.phone || null,
        avatar_url: item.avatarUrl || null,
        employee_id: item.employeeId || null,
      };
    case 'employees':
      return {
        ...base,
        name: item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim() || null,
        first_name: item.firstName || null,
        last_name: item.lastName || null,
        email: item.email || null,
        phone: item.phone || null,
        role: item.role || 'Employé',
        role_type: item.roleType || null,
        department: item.department || null,
        position: item.position || null,
        status: item.status || 'en_poste',
        hire_date: item.hireDate || null,
        departure_date: item.departureDate || null,
        salary: typeof item.salary === 'number' ? item.salary : 0,
        avatar_url: item.avatarUrl || null,
        user_id: item.userId || null,
        manager_id: item.managerId || null,
        team: item.team || null,
      };
    case 'tasks':
      return {
        ...base,
        title: item.title || 'Sans titre',
        description: item.description || null,
        date: item.date || null,
        time: item.time || null,
        status: item.status || 'todo',
        priority: item.priority || 'medium',
        assigned_to: item.assignedTo || null,
        employee_id: item.employeeId || null,
        department: item.department || null,
        project_id: item.projectId || null,
        due_date: item.dueDate || null,
        is_milestone: Boolean(item.isMilestone),
        milestone_progress: item.milestoneProgress || 0,
      };
    case 'task_projects':
      return {
        ...base,
        name: item.name || 'Projet',
        description: item.description || null,
        color: item.color || null,
        icon: item.icon || null,
        member_ids: item.memberIds || [],
      };
    case 'reminders':
      return {
        ...base,
        title: item.title || 'Rappel',
        note: item.note || null,
        date: item.date || null,
        time: item.time || null,
        location: item.location || null,
        employee_id: item.employeeId || null,
        all_employees: Boolean(item.allEmployees),
        trigger_before: item.triggerBefore || null,
        triggered: Boolean(item.triggered),
        stopped: Boolean(item.stopped),
      };
    case 'presences':
      return {
        ...base,
        employee_id: item.employeeId || null,
        date: item.date || null,
        status: item.status || 'present',
        arrival_time: item.arrivalTime || null,
        pause_start: item.pauseStart || null,
        pause_end: item.pauseEnd || null,
        departure_time: item.departureTime || null,
        clocking_method: item.clockingMethod || null,
        location: item.location || null,
        site_name: item.siteName || null,
        latitude: item.latitude || null,
        longitude: item.longitude || null,
        correction_reason: item.correctionReason || null,
      };
    case 'attendance_incidents':
      return {
        ...base,
        employee_id: item.employeeId || null,
        employee_name: item.employeeName || null,
        date: item.date || null,
        time_string: item.timeString || null,
        type: item.type || null,
        origin: item.origin || null,
        reason: item.reason || null,
        is_declared_in_advance: Boolean(item.isDeclaredInAdvance),
        is_justified: Boolean(item.isJustified),
        status: item.status || 'signale',
      };
    case 'badge_codes_16':
      return {
        ...base,
        code: item.code || '',
        formatted_code: item.formattedCode || null,
        generated_by: item.generatedBy || null,
        target_month: item.targetMonth || null,
        is_used: Boolean(item.isUsed),
        used_by_employee_id: item.usedByEmployeeId || null,
        used_by_employee_name: item.usedByEmployeeName || null,
        used_at: item.usedAt || null,
      };
    case 'dynamic_qr_sessions':
      return {
        ...base,
        session_id: item.sessionId || null,
        token: item.token || '',
        generated_by: item.generatedBy || null,
        status: item.status || 'active',
        expires_at: item.expiresAt || null,
        used_by_employee_id: item.usedByEmployeeId || null,
        action: item.action || null,
      };
    case 'inventory':
      return {
        ...base,
        name: item.name || item.designation || 'Matériel',
        designation: item.designation || item.name || null,
        category: item.category || null,
        quantity: typeof item.quantity === 'number' ? item.quantity : 0,
        status: item.status || 'bon_etat',
        location: item.location || null,
        reference: item.reference || null,
        serial_number: item.serialNumber || null,
        unit_price: item.unitPrice || 0,
        assigned_to_id: item.assignedToId || null,
        is_donated: Boolean(item.isDonated),
      };
    case 'disciplinary_incidents':
      return {
        ...base,
        employee_id: item.employeeId || null,
        employee_name: item.employeeName || null,
        date: item.date || null,
        category: item.category || null,
        severity: item.severity || null,
        title: item.title || null,
        description: item.description || null,
        reported_by: item.reportedBy || null,
        sanction_type: item.sanctionType || null,
        sanction_date: item.sanctionDate || null,
        status: item.status || 'ouvert',
      };
    case 'departments':
      return {
        ...base,
        name: item.name || '',
        code: item.code || null,
        description: item.description || null,
        color: item.color || null,
        icon_name: item.iconName || null,
        manager_id: item.managerId || null,
        manager_name: item.managerName || null,
        parent_department_id: item.parentDepartmentId || null,
      };
    case 'documents':
      return {
        ...base,
        title: item.title || 'Document',
        description: item.description || null,
        category: item.category || null,
        format_type: item.formatType || null,
        author_id: item.authorId || null,
        template_id: item.templateId || null,
        employee_id: item.employeeId || null,
        employee_name: item.employeeName || null,
        target_date: item.targetDate || null,
        signature_type: item.signatureType || null,
      };
    case 'rh_document_templates':
      return {
        ...base,
        name: item.name || 'Template RH',
        category: item.category || null,
        format_type: item.formatType || null,
        description: item.description || null,
        body_template: item.bodyTemplate || null,
        is_custom: Boolean(item.isCustom),
      };
    case 'processflow_salary_debts':
      return {
        ...base,
        employee_id: item.employeeId || null,
        employee_name: item.employeeName || null,
        total_loan_amount: item.totalLoanAmount || 0,
        monthly_installment: item.monthlyInstallment || 0,
        total_months: item.totalMonths || 1,
        installment_number: item.installmentNumber || 1,
        due_date: item.dueDate || null,
        status: item.status || 'pending',
        reason: item.reason || null,
      };
    case 'salary_payments':
      return {
        ...base,
        employee_id: item.employeeId || null,
        period: item.period || null,
        base_amount: item.baseAmount || 0,
        bonus_amount: item.bonusAmount || 0,
        advance_amount: item.advanceAmount || 0,
        deductions: item.deductions || 0,
        net_amount: item.netAmount || 0,
        status: item.status || 'draft',
        payment_method: item.paymentMethod || null,
        paid_at: item.paidAt || null,
      };
    case 'financial_transactions':
      return {
        ...base,
        date: item.date || null,
        type: item.type || 'expense',
        category: item.category || null,
        amount: item.amount || 0,
        description: item.description || null,
        recipient_or_source: item.recipientOrSource || null,
        status: item.status || 'validated',
        proof_url: item.proofUrl || null,
      };
    case 'partners':
      return {
        ...base,
        first_name: item.firstName || null,
        last_name: item.lastName || null,
        phone: item.phone || null,
        email: item.email || null,
        category: item.category || null,
        status: item.status || 'actif',
        address: item.address || null,
        notes: item.notes || null,
      };
    case 'notifications':
      return {
        ...base,
        title: item.title || 'Notification',
        message: item.message || item.content || null,
        content: item.content || item.message || null,
        type: item.type || null,
        recipient: item.recipient || null,
        target_user_id: item.targetUserId || null,
        is_read: Boolean(item.isRead || item.read),
        payload: typeof item.payload === 'string' ? item.payload : JSON.stringify(item.payload || {}),
      };
    case 'company_settings':
      return {
        ...base,
        name: item.name || item.companyName || null,
        company_name: item.companyName || null,
        work_start_time: item.workStartTime || null,
        planned_departure_time: item.plannedDepartureTime || null,
        qr_code_secret: item.qrCodeSecret || null,
        door_qr_code_token: item.doorQrCodeToken || null,
      };
    case 'calls':
      return {
        ...base,
        caller_id: item.callerId || null,
        caller_name: item.callerName || null,
        callee_id: item.calleeId || null,
        callee_name: item.calleeName || null,
        type: item.type || 'audio',
        status: item.status || 'ringing',
        is_group_call: Boolean(item.isGroupCall),
        duration_seconds: item.durationSeconds || 0,
        started_at: item.startedAt || null,
        ended_at: item.endedAt || null,
      };
    case 'user_presences':
      return {
        ...base,
        user_id: item.userId || null,
        user_name: item.userName || null,
        user_email: item.userEmail || null,
        role: item.role || null,
        status: item.status || 'offline',
        last_seen: item.lastSeen || null,
        current_call_id: item.currentCallId || null,
      };
    case 'job_offers':
      return {
        ...base,
        title: item.title || 'Poste à pourvoir',
        department: item.department || null,
        location: item.location || null,
        contract_type: item.contractType || null,
        openings_count: item.openingsCount || 1,
        description: item.description || null,
        salary_range: item.salaryRange || null,
        deadline: item.deadline || null,
        status: item.status || 'ouvert',
        created_by: item.createdBy || null,
      };
    case 'job_applications':
      return {
        ...base,
        job_offer_id: item.jobOfferId || null,
        job_offer_title: item.jobOfferTitle || null,
        candidate_name: item.candidateName || 'Candidat',
        candidate_email: item.candidateEmail || null,
        candidate_phone: item.candidatePhone || null,
        candidate_city: item.candidateCity || null,
        stage: item.stage || 'nouveau',
        rating: item.rating || 0,
        experience_years: item.experienceYears || 0,
        interview_date: item.interviewDate || null,
        applied_at: item.appliedAt || null,
      };
    case 'expense_claims':
      return {
        ...base,
        reference: item.reference || null,
        employee_id: item.employeeId || null,
        employee_name: item.employeeName || null,
        employee_department: item.employeeDepartment || null,
        title: item.title || 'Note de frais',
        mission_location: item.missionLocation || null,
        expense_date: item.expenseDate || null,
        category: item.category || null,
        amount: item.amount || 0,
        payment_mode: item.paymentMode || null,
        status: item.status || 'soumis',
        approved_by: item.approvedBy || null,
        approved_at: item.approvedAt || null,
        reimbursed_at: item.reimbursedAt || null,
      };
    case 'hse_incidents':
      return {
        ...base,
        reference: item.reference || null,
        site: item.site || 'Site',
        zone_precise: item.zonePrecise || null,
        type: item.type || null,
        severity: item.severity || null,
        date: item.date || null,
        time: item.time || null,
        title: item.title || 'Incident HSE',
        description: item.description || null,
        reported_by: item.reportedBy || null,
        victim_name: item.victimName || null,
        days_lost: item.daysLost || 0,
        status: item.status || 'signale',
      };
    case 'visitor_logs':
      return {
        ...base,
        visitor_name: item.visitorName || 'Visiteur',
        visitor_company: item.visitorCompany || null,
        visitor_phone: item.visitorPhone || null,
        id_card_number: item.idCardNumber || null,
        site_location: item.siteLocation || null,
        purpose: item.purpose || null,
        host_employee_id: item.hostEmployeeId || null,
        host_employee_name: item.hostEmployeeName || null,
        badge_number: item.badgeNumber || null,
        vehicle_plate: item.vehiclePlate || null,
        check_in_time: item.checkInTime || null,
        check_in_date: item.checkInDate || null,
        check_out_time: item.checkOutTime || null,
        status: item.status || 'sur_site',
      };
    case 'idea_suggestions':
      return {
        ...base,
        title: item.title || 'Idée',
        description: item.description || null,
        category: item.category || null,
        is_anonymous: Boolean(item.isAnonymous),
        author_name: item.authorName || null,
        author_department: item.authorDepartment || null,
        author_id: item.authorId || null,
        status: item.status || 'soumise',
        likes_count: item.likesCount || 0,
        liked_user_ids: item.likedUserIds || [],
        management_response: item.managementResponse || null,
      };
    case 'enterprise_surveys':
      return {
        ...base,
        title: item.title || 'Sondage',
        description: item.description || null,
        category: item.category || null,
        status: item.status || 'actif',
        deadline: item.deadline || null,
        created_by: item.createdBy || null,
        options: item.options || [],
        voted_user_ids: item.votedUserIds || [],
      };
    case 'connection_logs':
      return {
        ...base,
        user_id: item.userId || null,
        user_name: item.userName || null,
        user_email: item.userEmail || null,
        timestamp: item.timestamp || new Date().toISOString(),
        ip_address: item.ipAddress || null,
        location: item.location || null,
        auth_method: item.authMethod || 'password',
        status: item.status || 'success',
        details: item.details || null,
      };
    case 'admin_audit_logs':
      return {
        ...base,
        timestamp: item.timestamp || new Date().toISOString(),
        author_name: item.authorName || 'Super Admin',
        author_role: item.authorRole || null,
        target_user_id: item.targetUserId || null,
        target_employee_id: item.targetEmployeeId || null,
        target_name: item.targetName || 'Collaborateur',
        operation_type: item.operationType || 'creation',
        operation_label: item.operationLabel || null,
        details: item.details || null,
        ip_address: item.ipAddress || null,
      };
    default:
      return base;
  }
}

// Convert Supabase row back into App item format
function supabaseRowToItem(collectionName: string, row: any): any {
  if (row.collection && row.doc_id && row.data) {
    return { ...row.data, id: row.doc_id, _dbId: row.id };
  }
  if (row.raw_data && typeof row.raw_data === 'object') {
    return { ...row.raw_data, id: row.doc_id || String(row.id), _dbId: row.id };
  }
  return { ...row, id: row.doc_id || String(row.id), _dbId: row.id };
}

// Fetch collection from Supabase
export async function fetchCollection<T>(collectionName: string): Promise<T[]> {
  try {
    const table = mapCollectionToTable(collectionName);
    let query = supabase.from(table).select('*');
    
    if (table === 'generic_collections') {
      query = query.eq('collection', collectionName);
    }

    const { data, error } = await query;
    if (error) {
      console.warn(`[Supabase Notice] Table ${table} not yet queryable, falling back to local store:`, error.message);
      return [];
    }

    return (data || []).map((row) => supabaseRowToItem(collectionName, row) as T);
  } catch (err) {
    console.warn(`[Supabase] Erreur de récupération pour ${collectionName}:`, err);
    return [];
  }
}

// Save document to Supabase with upsert
export async function saveDocument<T extends { id: string }>(collectionName: string, item: T): Promise<T> {
  try {
    const table = mapCollectionToTable(collectionName);
    const row = itemToSupabaseRow(collectionName, item);

    const onConflict = table === 'generic_collections' ? 'collection,doc_id' : 'doc_id';
    const { error } = await supabaseAdmin.from(table).upsert(row, { onConflict });
    if (error) {
      console.warn(`[Supabase Save Notice] Could not upsert into ${table}:`, error.message);
    }
    return item;
  } catch (err) {
    console.warn(`[Supabase Save] Exception saving to ${collectionName}:`, err);
    return item;
  }
}

// Delete document from Supabase
export async function deleteDocument(collectionName: string, id: string): Promise<boolean> {
  try {
    const table = mapCollectionToTable(collectionName);
    if (table === 'generic_collections') {
      await supabaseAdmin.from(table).delete().match({ collection: collectionName, doc_id: String(id) });
    } else {
      if (/^\d+$/.test(String(id))) {
        await supabaseAdmin.from(table).delete().or(`doc_id.eq.${id},id.eq.${id}`);
      } else {
        await supabaseAdmin.from(table).delete().match({ doc_id: String(id) });
      }
    }
    return true;
  } catch (err) {
    console.warn(`[Supabase Delete] Exception deleting from ${collectionName}:`, err);
    return false;
  }
}

// Subscribe in real-time to table changes via Supabase Realtime
export function subscribeToCollection<T>(collectionName: string, callback: (data: T[]) => void) {
  const table = mapCollectionToTable(collectionName);
  
  // Initial fetch
  fetchCollection<T>(collectionName).then((items) => {
    if (items.length > 0) {
      offlineService.cacheListLocally(collectionName, items as any);
      callback(items);
    }
  });

  // Realtime channel
  const channelName = `realtime_${table}_${collectionName}_${Date.now()}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      async () => {
        // Re-fetch collection on change
        const updated = await fetchCollection<T>(collectionName);
        if (updated.length > 0) {
          offlineService.cacheListLocally(collectionName, updated as any);
          callback(updated);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export const supabaseService = {
  fetchCollection,
  saveDocument,
  deleteDocument,
  subscribeToCollection,
  mapCollectionToTable,
};
