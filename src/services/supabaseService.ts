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
    case 'task_assignees': return 'task_assignees';
    case 'task_project_members': return 'task_project_members';
    case 'reminder_recipients': return 'reminder_recipients';
    case 'notification_recipients': return 'notification_recipients';
    case 'presence_pauses': return 'presence_pauses';
    case 'absences': return 'absences';
    case 'leave_requests': return 'leave_requests';
    case 'building_supervisors': return 'generic_collections';
    default: return 'generic_collections';
  }
}

function isUuid(val: any): boolean {
  if (typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
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

    if (isUuid(strId)) {
      const { data: byUid } = await client.from('employees').select('id').eq('uid', strId).maybeSingle();
      if (byUid?.id) return Number(byUid.id);
    }
  } catch {}
  return null;
}

// Convert App item into Supabase row format
function itemToSupabaseRow(collectionName: string, item: any): any {
  const table = mapCollectionToTable(collectionName);
  const docId = String(item.id || item.docId || (item as any)._id || `doc_${Date.now()}`);

  const base: any = {
    doc_id: docId,
    raw_data: item,
    updated_at: new Date().toISOString(),
  };

  // 1. Only assign numeric id if explicitly provided as an integer, otherwise let BIGSERIAL auto-increment
  if (typeof item.id === 'number' || (typeof item.id === 'string' && /^\d+$/.test(item.id))) {
    base.id = Number(item.id);
  }

  // 2. Assign uid (UUID v4) if present
  if (item.uid && isUuid(item.uid)) {
    base.uid = item.uid;
  } else if (typeof item.id === 'string' && isUuid(item.id)) {
    base.uid = item.id;
  }

  if (table === 'generic_collections') {
    const docId = String(item.id || (item as any).docId || `doc_${Date.now()}`);
    return {
      collection: collectionName,
      doc_id: docId,
      data: item,
      updated_at: new Date().toISOString(),
      ...(base.id ? { id: base.id } : {}),
      ...(base.uid ? { uid: base.uid } : {}),
    };
  }

  switch (table) {
    case 'users': {
      const isStatusActive = item.status === true || item.status === 'actif' || item.status === 'en_poste';
      let roleId = 3;
      const roleStr = String(item.role || '').toLowerCase();
      if (item.role_id === 1 || item.roleId === 1 || roleStr.includes('admin') || roleStr === 'super_admin') {
        roleId = 1;
      } else if (item.role_id === 2 || item.roleId === 2 || roleStr.includes('responsable')) {
        roleId = 2;
      } else if (item.role_id === 3 || item.roleId === 3 || roleStr.includes('employé') || roleStr.includes('employe')) {
        roleId = 3;
      }

      const raw = {
        ...(item.raw_data && typeof item.raw_data === 'object' ? item.raw_data : {}),
        name: item.name || '',
        email: item.email || '',
        role: item.role || (roleId === 1 ? 'administrateur' : roleId === 2 ? 'responsable' : 'employé'),
        role_id: roleId,
        department: item.department ? String(item.department).trim() : 'Direction Générale',
        phone: item.phone || null,
        status: isStatusActive ? 'actif' : 'inactif',
        employeeId: item.employeeId || null,
        passwordHash: item.passwordHash || (item.raw_data as any)?.passwordHash,
      };

      return {
        ...base,
        ...(base.uid ? { uid: base.uid } : {}),
        email: (item.email || '').trim(),
        name: (item.name || '').trim() || null,
        role_id: roleId,
        status: isStatusActive,
        department: item.department ? String(item.department).trim() : 'Direction Générale',
        phone: item.phone ? String(item.phone).trim() : null,
        avatar_url: item.avatarUrl || null,
        raw_data: raw,
      };
    }
    case 'employees': {
      const isStatusActive = item.status === true || item.status === 'en_poste' || item.status === 'actif';
      const employmentStatus = (typeof item.status === 'string' && item.status !== 'actif' && item.status !== 'inactif')
        ? item.status
        : (item.employmentStatus || (isStatusActive ? 'en_poste' : 'parti'));
      
      const resolvedUserId = (item.userId !== undefined && item.userId !== null && item.userId !== '')
        ? item.userId
        : (item.user_id !== undefined && item.user_id !== null && item.user_id !== '' ? item.user_id : null);

      let resolvedRoleId: number | null = null;
      if (item.roleId !== undefined && item.roleId !== null && item.roleId !== '') {
        resolvedRoleId = Number(item.roleId);
      } else if (item.role_id !== undefined && item.role_id !== null && item.role_id !== '') {
        resolvedRoleId = Number(item.role_id);
      } else {
        const rLower = String(item.roleType || item.role || '').toLowerCase();
        if (rLower.includes('admin') || rLower.includes('directeur')) {
          resolvedRoleId = 1;
        } else if (rLower.includes('responsable') || rLower.includes('manager')) {
          resolvedRoleId = 2;
        } else {
          resolvedRoleId = 3;
        }
      }

      const numManagerId = (typeof item.managerId === 'number' || (typeof item.managerId === 'string' && /^\d+$/.test(item.managerId)))
        ? Number(item.managerId)
        : null;

      const empDept = item.department ? String(item.department).trim() : 'Direction Générale';
      const raw = {
        ...(item.raw_data && typeof item.raw_data === 'object' ? item.raw_data : {}),
        ...item,
        userId: resolvedUserId,
        roleId: resolvedRoleId,
        department: empDept,
        employmentStatus: employmentStatus,
        status: isStatusActive,
        avatarUrl: item.avatarUrl || item.photoUrl || null,
      };

      const numUserId = (typeof resolvedUserId === 'number' || (typeof resolvedUserId === 'string' && /^\d+$/.test(resolvedUserId)))
        ? Number(resolvedUserId)
        : null;

      return {
        ...base,
        name: item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim() || null,
        first_name: item.firstName || null,
        last_name: item.lastName || null,
        email: item.email ? String(item.email).trim() : null,
        phone: item.phone ? String(item.phone).trim() : null,
        role_type: item.roleType || item.role || null,
        department: empDept,
        position: item.position || item.role || item.roleType || null,
        status: isStatusActive,
        hire_date: item.hireDate ? String(item.hireDate).split('T')[0] : null,
        salary: Math.max(0, typeof item.salary === 'number' ? item.salary : (Number(item.salary) || 0)),
        photo_url: item.photoUrl || item.avatarUrl || null,
        emergency_contact: item.emergencyContact || null,
        work_location: item.workLocation || 'Douala',
        badge_code: item.badgeCode || null,
        user_id: numUserId,
        role_id: resolvedRoleId,
        raw_data: raw,
      };
    }
    case 'tasks': {
      let resolvedTaskEmpId: number | null = null;
      if (item.employeeId && /^\d+$/.test(String(item.employeeId))) {
        resolvedTaskEmpId = Number(item.employeeId);
      }
      let resolvedProjectId: number | null = null;
      if (item.projectId && /^\d+$/.test(String(item.projectId))) {
        resolvedProjectId = Number(item.projectId);
      }
      return {
        ...base,
        doc_id: docId,
        title: item.title || 'Sans titre',
        description: item.description || null,
        date: item.date || null,
        time: item.time || null,
        status: item.status || 'todo',
        priority: item.priority || 'medium',
        assigned_to: item.assignedTo || null,
        employee_id: resolvedTaskEmpId,
        department: item.department || null,
        project_id: resolvedProjectId,
        due_date: item.dueDate || null,
        is_milestone: Boolean(item.isMilestone),
        milestone_progress: item.milestoneProgress || 0,
        raw_data: item,
      };
    }
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
    case 'presences': {
      return {
        ...base,
        employee_id: item.employeeId || null,
        employee_name: item.employeeName || item.employee_name || null,
        date: item.date || new Date().toISOString().split('T')[0],
        arrival_time: item.arrivalTime || null,
        departure_time: item.departureTime || null,
        status: item.status || 'present',
        late_minutes: Number(item.lateMinutes || 0),
        pause_minutes: Number(item.pauseMinutes || 0),
        motif: item.motif || item.adminBadgeReason || null,
        signature: item.signature || null,
        gps_lat: typeof item.latitude === 'number' ? item.latitude : (typeof item.gpsLat === 'number' ? item.gpsLat : null),
        gps_lng: typeof item.longitude === 'number' ? item.longitude : (typeof item.gpsLng === 'number' ? item.gpsLng : null),
        method: item.clockingMethod || item.method || 'kiosk',
        raw_data: item,
      };
    }
    case 'attendance_incidents': {
      const empIdVal = item.employeeId || item.employee_id;
      const numEmpId = (typeof empIdVal === 'number' && Number.isInteger(empIdVal))
        ? empIdVal
        : (typeof empIdVal === 'string' && /^\d+$/.test(empIdVal))
          ? Number(empIdVal)
          : null;

      const dateStr = item.date ? String(item.date).split('T')[0] : new Date().toISOString().split('T')[0];
      const descStr = item.reason || item.description || item.origin || 'Incident de présence';

      return {
        ...base,
        employee_id: numEmpId,
        date: dateStr,
        type: item.type || 'retard',
        description: descStr,
        status: typeof item.status === 'string' ? item.status : 'automatique',
        raw_data: item,
      };
    }
    case 'badge_codes_16':
      return {
        ...base,
        code: item.code || '',
        assigned_name: item.assignedName || item.employeeName || null,
        created_by: item.createdBy || item.generatedBy || 'Responsable',
        expires_at: item.expiresAt || null,
        is_used: Boolean(item.isUsed),
        used_at: item.usedAt || null,
        raw_data: item,
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
        doc_id: docId,
        name: String(item.name || item.title || 'Template RH').trim() || 'Template RH',
        category: item.category || null,
        format_type: item.formatType || null,
        description: item.description || null,
        body_template: item.bodyTemplate || null,
        is_custom: Boolean(item.isCustom),
        raw_data: item,
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
        message: item.message || item.content || item.description || item.payload || item.title || 'Notification système',
        type: item.type || 'system',
        target_user_id: (typeof item.targetUserId === 'number' || (typeof item.targetUserId === 'string' && /^\d+$/.test(item.targetUserId)))
          ? Number(item.targetUserId)
          : null,
        is_read: Boolean(item.isRead || item.read),
      };
    case 'company_settings':
      return {
        ...base,
        doc_id: docId,
        setting_key: 'main_config',
        raw_data: item,
        updated_at: new Date().toISOString(),
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
    case 'hse_incidents': {
      const siteVal = item.site || item.siteLocation || item.site_location || 'Base Japoma - Carrefour Matango';
      return {
        ...base,
        reference: item.reference || null,
        site_location: siteVal,
        zone_precise: item.zonePrecise || item.zone_precise || null,
        type: item.type || null,
        severity: item.severity || null,
        date: item.date || new Date().toISOString().split('T')[0],
        time: item.time || null,
        title: item.title,
        description: item.description || null,
        reported_by: item.reportedBy || item.reported_by || null,
        victim_name: item.victimName || item.victim_name || null,
        days_lost: typeof item.daysLost === 'number' ? item.daysLost : (typeof item.days_lost === 'number' ? item.days_lost : 0),
        status: item.status || 'signale',
        raw_data: item,
      };
    }
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
    case 'leave_requests':
      return {
        ...base,
        employee_id: item.employeeId || null,
        employee_name: item.employeeName || null,
        type: item.type || 'conge_annuel',
        start_date: item.startDate || new Date().toISOString().split('T')[0],
        end_date: item.endDate || new Date().toISOString().split('T')[0],
        days_count: Number(item.daysCount || 1),
        reason: item.reason || null,
        status: item.status || 'pending',
        decided_by: item.decidedBy || null,
        decided_at: item.decidedAt || null,
        decision_reason: item.managerComment || null,
      };
    default:
      return base;
  }
}

// Convert Supabase row back into App item format
function supabaseRowToItem(collectionName: string, row: any): any {
  if (!row) return null;

  if (row.collection && row.data) {
    const dataObj = typeof row.data === 'object' ? row.data : {};
    return {
      ...dataObj,
      id: row.doc_id || dataObj.id || String(row.id),
      docId: row.doc_id,
      uid: row.uid,
      _dbId: row.id,
    };
  }

  const table = mapCollectionToTable(collectionName);
  if (table === 'employees') {
    const raw = (row.raw_data && typeof row.raw_data === 'object') ? row.raw_data : {};
    return {
      ...raw,
      id: String(row.id),
      uid: row.uid,
      _dbId: row.id,
      userId: row.user_id ? String(row.user_id) : raw.userId,
      roleId: row.role_id ? String(row.role_id) : raw.roleId,
      managerId: row.manager_id ? String(row.manager_id) : raw.managerId,
      name: row.name || `${row.first_name || ''} ${row.last_name || ''}`.trim() || raw.name || 'Collaborateur',
      firstName: row.first_name || raw.firstName,
      lastName: row.last_name || raw.lastName,
      email: row.email || raw.email || '',
      phone: row.phone || raw.phone || '',
      roleType: row.role_type || raw.roleType || 'employé',
      role: row.position || raw.role || row.role_type || 'Employé',
      position: row.position || raw.position,
      status: raw.status || raw.employmentStatus || row.employment_status || (row.status ? 'en_poste' : 'parti'),
      employmentStatus: raw.employmentStatus || (typeof raw.status === 'string' && raw.status !== 'actif' && raw.status !== 'inactif' ? raw.status : undefined) || row.employment_status || (row.status ? 'en_poste' : 'parti'),
      hireDate: row.hire_date || raw.hireDate,
      departureDate: row.departure_date || raw.departureDate,
      salary: typeof row.salary === 'number' ? row.salary : (Number(row.salary) || raw.salary || 0),
      avatarUrl: row.avatar_url || raw.avatarUrl || '',
      team: row.team || raw.team,
      departureReason: raw.departureReason,
      suspensionReason: raw.suspensionReason,
      suspensionDate: raw.suspensionDate,
      birthDate: raw.birthDate,
      createdAt: row.created_at || raw.createdAt,
      updatedAt: row.updated_at || raw.updatedAt,
    };
  }

  if (table === 'users') {
    const raw = (row.raw_data && typeof row.raw_data === 'object') ? row.raw_data : {};
    let resolvedRole: 'administrateur' | 'responsable' | 'employé' = 'employé';
    if (
      row.role_id === 1 ||
      String(raw.role).toUpperCase() === 'SUPER_ADMIN' ||
      String(raw.role).toLowerCase() === 'administrateur' ||
      String(raw.role).toLowerCase().includes('admin')
    ) {
      resolvedRole = 'administrateur';
    } else if (
      row.role_id === 2 ||
      String(raw.role).toUpperCase() === 'RESPONSABLE' ||
      String(raw.role).toLowerCase() === 'responsable'
    ) {
      resolvedRole = 'responsable';
    } else {
      resolvedRole = 'employé';
    }

    return {
      ...raw,
      id: String(row.id),
      uid: row.uid,
      _dbId: row.id,
      name: row.name || raw.name || 'Utilisateur',
      email: row.email || raw.email || '',
      phone: row.phone || raw.phone || '',
      role: resolvedRole,
      roleId: row.role_id ? Number(row.role_id) : (resolvedRole === 'administrateur' ? 1 : resolvedRole === 'responsable' ? 2 : 3),
      status: (row.status === false || row.status === 'inactif') ? 'inactif' : 'actif',
      department: row.department || raw.department || 'Direction Générale',
      avatarUrl: row.avatar_url || raw.avatarUrl || '',
      passwordHash: raw.passwordHash || raw.password_hash,
      createdAt: row.created_at || raw.createdAt,
      updatedAt: row.updated_at || raw.updatedAt,
    };
  }

  if (table === 'tasks') {
    const raw = (row.raw_data && typeof row.raw_data === 'object') ? row.raw_data : {};
    const originalId = raw.id || row.doc_id || String(row.id);
    return {
      ...raw,
      id: originalId,
      docId: row.doc_id || originalId,
      _dbId: row.id,
      title: row.title || raw.title || 'Sans titre',
      description: row.description || raw.description || '',
      date: row.date || raw.date || '',
      time: row.time || raw.time || '',
      status: (row.status || raw.status || 'todo') as any,
      priority: (row.priority || raw.priority || 'medium') as any,
      assignedTo: row.assigned_to || raw.assignedTo || 'Équipe',
      employeeId: row.employee_id || raw.employeeId || null,
      department: row.department || raw.department || null,
      projectId: row.project_id || raw.projectId || 'general',
      dueDate: row.due_date || raw.dueDate || null,
      isMilestone: row.is_milestone !== undefined ? Boolean(row.is_milestone) : Boolean(raw.isMilestone),
      milestoneProgress: row.milestone_progress !== undefined ? Number(row.milestone_progress) : Number(raw.milestoneProgress || 0),
      subtasks: raw.subtasks || [],
      comments: raw.comments || [],
      incidents: raw.incidents || [],
      reminderPeriod: raw.reminderPeriod || 'none',
      createdAt: row.created_at || raw.createdAt,
      updatedAt: row.updated_at || raw.updatedAt,
    };
  }

  if (table === 'notifications') {
    const raw = (row.raw_data && typeof row.raw_data === 'object') ? row.raw_data : {};
    const textMsg = row.message || raw.message || raw.content || raw.description || raw.title || 'Notification système';
    return {
      ...raw,
      id: raw.id || row.doc_id || String(row.id),
      uid: row.uid || raw.uid,
      _dbId: row.id,
      title: row.title || raw.title || 'Notification',
      message: textMsg,
      content: raw.content || textMsg,
      type: row.type || raw.type || 'system',
      read: Boolean(row.is_read ?? raw.read ?? false),
      timestamp: row.created_at || raw.timestamp || new Date().toISOString(),
    };
  }

  if (table === 'presences') {
    const raw = (row.raw_data && typeof row.raw_data === 'object') ? row.raw_data : {};
    const originalId = raw.id || row.doc_id || String(row.id);
    return {
      ...raw,
      id: originalId,
      docId: row.doc_id || originalId,
      uid: row.uid || raw.uid,
      _dbId: row.id,
      employeeId: raw.employeeId || (row.employee_id ? String(row.employee_id) : ''),
      employeeName: row.employee_name || raw.employeeName || '',
      date: row.date ? String(row.date).split('T')[0] : (raw.date || new Date().toISOString().split('T')[0]),
      arrivalTime: row.arrival_time || raw.arrivalTime || null,
      departureTime: row.departure_time || raw.departureTime || null,
      pauseStart: raw.pauseStart || null,
      pauseEnd: raw.pauseEnd || null,
      sortieProStart: raw.sortieProStart || null,
      sortieProEnd: raw.sortieProEnd || null,
      status: row.status || raw.status || 'present',
      lateMinutes: Number(row.late_minutes ?? raw.lateMinutes ?? 0),
      pauseMinutes: Number(row.pause_minutes ?? raw.pauseMinutes ?? 0),
      motif: row.motif || raw.motif || null,
      signature: row.signature || raw.signature || null,
      location: raw.location || 'Bureau Principal - Douala III',
      latitude: typeof row.gps_lat === 'number' ? row.gps_lat : (raw.latitude ?? null),
      longitude: typeof row.gps_lng === 'number' ? row.gps_lng : (raw.longitude ?? null),
      clockingMethod: row.method || raw.clockingMethod || 'kiosk',
      clockLocations: raw.clockLocations || undefined,
      emergencies: raw.emergencies || [],
      createdAt: row.created_at || raw.createdAt,
      updatedAt: row.updated_at || raw.updatedAt,
    };
  }

  if (table === 'attendance_incidents') {
    const raw = (row.raw_data && typeof row.raw_data === 'object') ? row.raw_data : {};
    const originalId = raw.id || row.doc_id || String(row.id);
    const empId = raw.employeeId || (row.employee_id ? String(row.employee_id) : '');
    const dateVal = raw.date || (row.date ? String(row.date).split('T')[0] : new Date().toISOString().split('T')[0]);
    const reasonVal = raw.reason || row.description || raw.motif || 'Incident de présence';
    return {
      ...raw,
      id: originalId,
      docId: row.doc_id || originalId,
      uid: row.uid || raw.uid,
      _dbId: row.id,
      employeeId: String(empId),
      employeeName: raw.employeeName || raw.employee_name || '',
      date: dateVal,
      timeString: raw.timeString || raw.time || '08:30',
      type: raw.type || row.type || 'retard',
      origin: raw.origin || (raw.status === 'automatique' || row.status === 'automatique' ? 'automatique_pointage' : 'signale_par_responsable'),
      reason: reasonVal,
      description: reasonVal,
      isDeclaredInAdvance: Boolean(raw.isDeclaredInAdvance),
      isJustified: Boolean(raw.isJustified || row.status === 'justifie'),
      status: raw.status || row.status || 'automatique',
      createdAt: row.created_at || raw.createdAt || new Date().toISOString(),
      adminComment: raw.adminComment || raw.admin_comment || undefined,
    };
  }

  if (table === 'badge_codes_16') {
    const raw = (row.raw_data && typeof row.raw_data === 'object') ? row.raw_data : {};
    const rawCode = row.code || raw.code || '';
    const cleanCode = String(rawCode).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const formatted = raw.formattedCode || (cleanCode.length === 16 
      ? `${cleanCode.slice(0, 4)}-${cleanCode.slice(4, 8)}-${cleanCode.slice(8, 12)}-${cleanCode.slice(12, 16)}` 
      : cleanCode);

    return {
      ...raw,
      id: raw.id || row.doc_id || String(row.id),
      docId: row.doc_id || raw.docId,
      code: cleanCode,
      formattedCode: formatted,
      assignedName: row.assigned_name || raw.assignedName || null,
      generatedBy: row.created_by || raw.generatedBy || raw.createdBy || 'Responsable',
      createdAt: row.created_at || raw.createdAt || new Date().toISOString(),
      expiresAt: row.expires_at || raw.expiresAt || null,
      isUsed: Boolean(row.is_used ?? raw.isUsed ?? false),
      usedAt: row.used_at || raw.usedAt || null,
      usedByEmployeeId: raw.usedByEmployeeId || (row.employee_id ? String(row.employee_id) : undefined),
      usedByEmployeeName: raw.usedByEmployeeName || undefined,
      usedLatitude: raw.usedLatitude,
      usedLongitude: raw.usedLongitude,
      notes: raw.notes,
      targetMonth: raw.targetMonth,
    };
  }

  if (table === 'dynamic_qr_sessions') {
    const raw = (row.raw_data && typeof row.raw_data === 'object') ? row.raw_data : {};
    return {
      ...raw,
      id: raw.id || row.doc_id || row.session_id || raw.sessionId || String(row.id),
      sessionId: row.session_id || raw.sessionId || String(row.id),
      token: row.token || raw.token || '',
      generatedBy: row.generated_by || raw.generatedBy || 'Responsable',
      status: row.status || raw.status || 'active',
      expiresAt: row.expires_at || raw.expiresAt || null,
      usedByEmployeeId: row.used_by_employee_id || raw.usedByEmployeeId || null,
      usedByEmployeeName: raw.usedByEmployeeName || null,
      action: row.action || raw.action || null,
      usedAt: raw.usedAt || null,
      createdAt: row.created_at || raw.createdAt || new Date().toISOString(),
    };
  }

  if (table === 'company_settings') {
    const raw = (row.raw_data && typeof row.raw_data === 'object') ? row.raw_data : {};
    return {
      ...raw,
      id: raw.id || row.doc_id || String(row.id),
      docId: row.doc_id || raw.docId || 'main_config',
      companyName: raw.companyName || (row.setting_value && typeof row.setting_value === 'object' && row.setting_value.companyName) || 'Citrine SARL',
      workStartTime: raw.workStartTime || '08:00',
      plannedDepartureTime: raw.plannedDepartureTime || '16:30',
      qrCodeSecret: raw.qrCodeSecret || 'CITRINE_SECRET_2026',
      doorQrCodeToken: raw.doorQrCodeToken || 'CITRINE_DOOR_HQ_MAIN_2026',
    };
  }

  if (table === 'leave_requests') {
    const raw = (row.raw_data && typeof row.raw_data === 'object') ? row.raw_data : {};
    return {
      ...raw,
      id: raw.id || row.doc_id || String(row.id),
      docId: row.doc_id || raw.docId,
      uid: row.uid || raw.uid,
      _dbId: row.id,
      employeeId: row.employee_id ? String(row.employee_id) : raw.employeeId,
      employeeName: row.employee_name || raw.employeeName || 'Collaborateur',
      type: row.type || raw.type || 'conge_annuel',
      startDate: row.start_date || raw.startDate,
      endDate: row.end_date || raw.endDate,
      daysCount: typeof row.days_count === 'number' ? row.days_count : (Number(row.days_count) || raw.daysCount || 1),
      reason: row.reason || raw.reason || '',
      status: row.status || raw.status || 'pending',
      decidedBy: row.decided_by || raw.decidedBy,
      decidedAt: row.decided_at || raw.decidedAt,
      managerComment: row.decision_reason || raw.managerComment || raw.decisionReason,
      createdAt: row.created_at || raw.createdAt || new Date().toISOString(),
      updatedAt: row.updated_at || raw.updatedAt,
    };
  }

  if (table === 'visitor_logs') {
    const raw = (row.raw_data && typeof row.raw_data === 'object') ? row.raw_data : {};
    return {
      ...raw,
      id: row.doc_id || raw.id || String(row.id),
      docId: row.doc_id,
      visitorName: row.visitor_name || raw.visitorName,
      visitorCompany: row.visitor_company || raw.visitorCompany,
      visitorPhone: row.visitor_phone || raw.visitorPhone,
      idCardNumber: row.id_card_number || raw.idCardNumber,
      siteLocation: row.site_location || raw.siteLocation,
      purpose: row.purpose || raw.purpose,
      hostEmployeeId: row.host_employee_id || raw.hostEmployeeId,
      hostEmployeeName: row.host_employee_name || raw.hostEmployeeName,
      badgeNumber: row.badge_number || raw.badgeNumber,
      vehiclePlate: row.vehicle_plate || raw.vehiclePlate,
      checkInTime: row.check_in_time || raw.checkInTime,
      checkInDate: row.check_in_date || raw.checkInDate,
      checkOutTime: row.check_out_time || raw.checkOutTime,
      status: row.status || raw.status,
      personType: raw.personType || 'visiteur',
      workerDomain: raw.workerDomain,
      supervisorName: raw.supervisorName,
      interventionPerimeter: raw.interventionPerimeter,
      notes: raw.notes || '',
      createdAt: row.created_at || raw.createdAt,
      updatedAt: row.updated_at || raw.updatedAt,
      _dbId: row.id,
    };
  }

  if (table === 'hse_incidents') {
    const raw = (row.raw_data && typeof row.raw_data === 'object') ? row.raw_data : {};
    return {
      ...raw,
      id: row.doc_id || raw.id || String(row.id),
      docId: row.doc_id || raw.docId,
      uid: row.uid,
      _dbId: row.id,
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
      createdAt: row.created_at || raw.createdAt,
      updatedAt: row.updated_at || raw.updatedAt,
    };
  }

  if (row.raw_data && typeof row.raw_data === 'object') {
    const raw = row.raw_data;
    return {
      ...raw,
      id: raw.id || row.doc_id || String(row.id),
      uid: row.uid || raw.uid,
      _dbId: row.id,
    };
  }
  return { ...row, id: row.doc_id || String(row.id), uid: row.uid, _dbId: row.id };
}

const getClient = () => supabaseAdmin || supabase;

// Fetch collection from Supabase
export async function fetchCollection<T>(collectionName: string): Promise<T[]> {
  try {
    const table = mapCollectionToTable(collectionName);
    const client = getClient();
    let query = client.from(table).select('*');
    
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

// Save document to Supabase with robust upsert / update / insert fallback
export async function saveDocument<T extends { id: string }>(collectionName: string, item: T): Promise<T> {
  try {
    const table = mapCollectionToTable(collectionName);
    const client = getClient();
    const row = itemToSupabaseRow(collectionName, item);

    if (table === 'generic_collections') {
      const gDocId = String(item.id || (item as any).docId || `sup-${Date.now()}`);
      const gRow: any = {
        collection: collectionName,
        doc_id: gDocId,
        data: item,
        updated_at: new Date().toISOString(),
      };

      const { data: upsertData, error: upsertErr } = await client
        .from('generic_collections')
        .upsert(gRow, { onConflict: 'collection,doc_id' })
        .select()
        .single();

      if (upsertErr) {
        console.error(`[generic_collections save error for ${collectionName}:${gDocId}]:`, upsertErr);
        throw new Error(upsertErr.message || `Échec de l'enregistrement de ${collectionName}`);
      }

      return supabaseRowToItem(collectionName, upsertData) as T;
    }

    if (table === 'users') {
      let savedResult: any = null;
      let userErr: any = null;
      if (row.id && Number.isInteger(row.id)) {
        const { data, error } = await client.from('users').upsert(row, { onConflict: 'id' }).select().single();
        if (!error && data) savedResult = data;
        else if (error) userErr = error;
      }
      if (!savedResult && row.email) {
        const { data, error } = await client.from('users').upsert(row, { onConflict: 'email' }).select().single();
        if (!error && data) savedResult = data;
        else if (error) userErr = error;
      }
      if (!savedResult) {
        const { data, error } = await client.from('users').insert(row).select().single();
        if (!error && data) savedResult = data;
        else if (error) userErr = error;
      }

      if (!savedResult) {
        throw userErr || new Error("Échec de l'enregistrement de l'utilisateur en base de données");
      }

      // Sync email to employees if linked
      if (savedResult && savedResult.email) {
        try {
          await client.from('employees').update({ email: savedResult.email }).eq('user_id', savedResult.id);
        } catch {}
      }

      return supabaseRowToItem(collectionName, savedResult) as T;
    }

    if (table === 'employees') {
      // Résolution sécurisée de user_id : doit être un BIGINT valide vers users.id
      if (!row.user_id || !Number.isInteger(row.user_id)) {
        try {
          if (row.email) {
            const { data: u } = await client.from('users').select('id').eq('email', row.email).maybeSingle();
            if (u?.id) {
              row.user_id = u.id;
            } else {
              delete row.user_id;
            }
          } else {
            delete row.user_id;
          }
        } catch {
          delete row.user_id;
        }
      }

      let savedResult: any = null;
      let empErr: any = null;

      if (row.doc_id) {
        const { data, error } = await client.from('employees').upsert(row, { onConflict: 'doc_id' }).select().single();
        if (!error && data) savedResult = data;
        else if (error) empErr = error;
      }
      if (!savedResult && row.email) {
        const { data, error } = await client.from('employees').upsert(row, { onConflict: 'email' }).select().single();
        if (!error && data) savedResult = data;
        else if (error) empErr = error;
      }
      if (!savedResult && row.id && Number.isInteger(row.id)) {
        const { data, error } = await client.from('employees').upsert(row, { onConflict: 'id' }).select().single();
        if (!error && data) savedResult = data;
        else if (error) empErr = error;
      }
      if (!savedResult && row.uid) {
        const { data, error } = await client.from('employees').upsert(row, { onConflict: 'uid' }).select().single();
        if (!error && data) savedResult = data;
        else if (error) empErr = error;
      }
      if (!savedResult) {
        const { data, error } = await client.from('employees').insert(row).select().single();
        if (!error && data) savedResult = data;
        else if (error) empErr = error;
      }

      if (!savedResult) {
        throw empErr || new Error("Échec de l'enregistrement du collaborateur en base de données");
      }

      // Sync email to users if linked by user_id
      if (savedResult && savedResult.email && savedResult.user_id) {
        try {
          await client.from('users').update({ email: savedResult.email }).eq('id', savedResult.user_id);
        } catch {}
      }

      return supabaseRowToItem(collectionName, savedResult) as T;
    }

    if (table === 'tasks') {
      const taskDocId = String(item.id || row.doc_id);
      const { data: upsertData, error: upsertErr } = await client
        .from('tasks')
        .upsert({ ...row, doc_id: taskDocId }, { onConflict: 'doc_id' })
        .select()
        .single();
      if (!upsertErr && upsertData) return supabaseRowToItem(collectionName, upsertData) as T;

      // Fallback: update if exists by doc_id, otherwise insert
      const { data: existingRows } = await client.from('tasks').select('id').eq('doc_id', taskDocId).limit(1);
      if (existingRows && existingRows.length > 0) {
        const { data: updateData } = await client.from('tasks').update({ ...row, doc_id: taskDocId }).eq('doc_id', taskDocId).select().single();
        if (updateData) return supabaseRowToItem(collectionName, updateData) as T;
      } else {
        const { data: insertData } = await client.from('tasks').insert({ ...row, doc_id: taskDocId }).select().single();
        if (insertData) return supabaseRowToItem(collectionName, insertData) as T;
      }
      return item;
    }

    if (table === 'rh_document_templates') {
      const tplDocId = String(item.id || row.doc_id || 'tpl-memo');
      const rowToSave = {
        ...row,
        doc_id: tplDocId,
        name: String(row.name || (item as any).name || (item as any).title || 'Template RH').trim() || 'Template RH',
        code: String((item as any).code || tplDocId).trim(),
        type: String((item as any).type || (item as any).documentType || 'general').trim(),
        content_template: String((item as any).contentTemplate || (item as any).content || (item as any).template || 'Contenu').trim(),
      };
      const { data: existingRows } = await client.from('rh_document_templates').select('id').eq('doc_id', tplDocId).limit(1);
      if (existingRows && existingRows.length > 0) {
        const { data: updateData, error: updateErr } = await client.from('rh_document_templates').update(rowToSave).eq('doc_id', tplDocId).select().single();
        if (!updateErr && updateData) return supabaseRowToItem(collectionName, updateData) as T;
      } else {
        const { data: insertData, error: insertErr } = await client.from('rh_document_templates').insert(rowToSave).select().single();
        if (!insertErr && insertData) return supabaseRowToItem(collectionName, insertData) as T;
      }
      return item;
    }

    if (table === 'presences') {
      try {
        const empIdVal = (item as any).employeeId || (item as any).employee_id;
        const resolvedId = await resolveEmployeeDbId(client, empIdVal);
        if (resolvedId) {
          row.employee_id = resolvedId;
        } else {
          delete row.employee_id;
        }
      } catch {
        delete row.employee_id;
      }

      const presenceDocId = String(item.id || row.doc_id || `pr-${Date.now()}`);
      row.doc_id = presenceDocId;

      const { data: upsertData, error: upsertErr } = await client
        .from('presences')
        .upsert(row, { onConflict: 'doc_id' })
        .select()
        .single();
      if (!upsertErr && upsertData) return supabaseRowToItem(collectionName, upsertData) as T;

      const { data: insertData, error: insertErr } = await client.from('presences').insert(row).select().single();
      if (!insertErr && insertData) return supabaseRowToItem(collectionName, insertData) as T;
      if (insertErr) {
        console.error('[supabaseService presences save error]:', insertErr.message);
      }
      return item;
    }

    if (table === 'attendance_incidents') {
      try {
        const empIdVal = (item as any).employeeId || (item as any).employee_id;
        const resolvedId = await resolveEmployeeDbId(client, empIdVal);
        if (resolvedId) {
          row.employee_id = resolvedId;
        } else {
          delete row.employee_id;
        }
      } catch {
        delete row.employee_id;
      }

      const incDocId = String(item.id || row.doc_id || `inc-${Date.now()}`);
      row.doc_id = incDocId;

      const { data: upsertData, error: upsertErr } = await client
        .from('attendance_incidents')
        .upsert(row, { onConflict: 'doc_id' })
        .select()
        .single();
      if (!upsertErr && upsertData) return supabaseRowToItem(collectionName, upsertData) as T;

      const { data: insertData, error: insertErr } = await client.from('attendance_incidents').insert(row).select().single();
      if (!insertErr && insertData) return supabaseRowToItem(collectionName, insertData) as T;
      return item;
    }

    if (table === 'hse_incidents') {
      const hseDocId = String(item.id || row.doc_id || `hse-${Date.now()}`);
      row.doc_id = hseDocId;
      row.title = (item as any).title || row.title;
      row.site_location = (item as any).site || (item as any).siteLocation || row.site_location || 'Base Japoma - Carrefour Matango';
      row.date = (item as any).date || row.date || new Date().toISOString().split('T')[0];

      const { data: upsertData, error: upsertErr } = await client
        .from('hse_incidents')
        .upsert(row, { onConflict: 'doc_id' })
        .select()
        .single();
      if (!upsertErr && upsertData) return supabaseRowToItem(collectionName, upsertData) as T;

      const { data: existingRows } = await client.from('hse_incidents').select('id').eq('doc_id', hseDocId).limit(1);
      if (existingRows && existingRows.length > 0) {
        const { data: updateData, error: updateErr } = await client.from('hse_incidents').update(row).eq('doc_id', hseDocId).select().single();
        if (!updateErr && updateData) return supabaseRowToItem(collectionName, updateData) as T;
      } else {
        const { data: insertData, error: insertErr } = await client.from('hse_incidents').insert(row).select().single();
        if (!insertErr && insertData) return supabaseRowToItem(collectionName, insertData) as T;
      }
      return item;
    }

    if (table === 'leave_requests') {
      try {
        const empIdVal = (item as any).employeeId || (item as any).employee_id;
        const resolvedId = await resolveEmployeeDbId(client, empIdVal);
        if (resolvedId) {
          row.employee_id = resolvedId;
        } else {
          delete row.employee_id;
        }
      } catch {
        delete row.employee_id;
      }

      const leaveDocId = String(item.id || row.doc_id || `leave-${Date.now()}`);
      row.doc_id = leaveDocId;

      const { data: upsertData, error: upsertErr } = await client
        .from('leave_requests')
        .upsert(row, { onConflict: 'doc_id' })
        .select()
        .single();
      if (!upsertErr && upsertData) return supabaseRowToItem(collectionName, upsertData) as T;

      const { data: insertData, error: insertErr } = await client.from('leave_requests').insert(row).select().single();
      if (!insertErr && insertData) return supabaseRowToItem(collectionName, insertData) as T;
      if (insertErr) {
        console.error('[supabaseService leave_requests save error]:', insertErr.message);
      }
      return item;
    }

    if (table === 'visitor_logs') {
      const visDocId = String(item.id || row.doc_id || `vis-${Date.now()}`);
      const visitorRow: any = {
        ...row,
        doc_id: visDocId,
        visitor_name: (item as any).visitorName || row.visitor_name || (item as any).name || 'Visiteur',
        visitor_company: (item as any).visitorCompany || row.visitor_company || null,
        visitor_phone: (item as any).visitorPhone || row.visitor_phone || null,
        id_card_number: (item as any).idCardNumber || row.id_card_number || null,
        site_location: (item as any).siteLocation || row.site_location || null,
        purpose: (item as any).purpose || row.purpose || null,
        host_employee_id: (item as any).hostEmployeeId || row.host_employee_id || null,
        host_employee_name: (item as any).hostEmployeeName || row.host_employee_name || null,
        badge_number: (item as any).badgeNumber || row.badge_number || null,
        vehicle_plate: (item as any).vehiclePlate || row.vehicle_plate || null,
        check_in_time: (item as any).checkInTime || row.check_in_time || null,
        check_in_date: (item as any).checkInDate && String((item as any).checkInDate).length >= 10 ? String((item as any).checkInDate).split('T')[0] : new Date().toISOString().split('T')[0],
        check_out_time: (item as any).checkOutTime || row.check_out_time || null,
        status: (item as any).status || row.status || 'sur_site',
        raw_data: item,
        updated_at: new Date().toISOString(),
      };
      delete visitorRow.id;

      const { data: upsertData, error: upsertErr } = await client
        .from('visitor_logs')
        .upsert(visitorRow, { onConflict: 'doc_id' })
        .select()
        .single();
      if (!upsertErr && upsertData) return supabaseRowToItem(collectionName, upsertData) as T;

      if (upsertErr) {
        console.error('[visitor_logs save error]:', upsertErr);
        throw new Error(upsertErr.message || "Erreur d'enregistrement du visiteur en base de données");
      }
      return item;
    }

    if (table === 'badge_codes_16') {
      const codeDocId = String(item.id || row.doc_id || `code16-${Date.now()}`);
      const cleanCode = String((item as any).code || row.code || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const codeRow: any = {
        ...row,
        doc_id: codeDocId,
        code: cleanCode,
        is_used: Boolean((item as any).isUsed ?? row.is_used ?? false),
        expires_at: (item as any).expiresAt || row.expires_at || null,
        created_by: (item as any).createdBy || (item as any).generatedBy || row.created_by || 'Responsable',
        assigned_name: (item as any).assignedName || (item as any).employeeName || row.assigned_name || null,
        used_at: (item as any).usedAt || row.used_at || null,
        raw_data: item,
        updated_at: new Date().toISOString(),
      };
      if (typeof codeRow.id !== 'number') delete codeRow.id;

      // 1. Try upsert on code
      const { data: upsertCodeData, error: upsertCodeErr } = await client
        .from('badge_codes_16')
        .upsert(codeRow, { onConflict: 'code' })
        .select()
        .single();
      if (!upsertCodeErr && upsertCodeData) {
        return supabaseRowToItem(collectionName, upsertCodeData) as T;
      }

      // 2. Try upsert on doc_id
      const { data: upsertDocData, error: upsertDocErr } = await client
        .from('badge_codes_16')
        .upsert(codeRow, { onConflict: 'doc_id' })
        .select()
        .single();
      if (!upsertDocErr && upsertDocData) {
        return supabaseRowToItem(collectionName, upsertDocData) as T;
      }

      // 3. Fallback direct update
      const { data: updateData } = await client
        .from('badge_codes_16')
        .update(codeRow)
        .or(`code.eq.${cleanCode},doc_id.eq.${codeDocId}`)
        .select()
        .single();
      if (updateData) return supabaseRowToItem(collectionName, updateData) as T;

      // 4. Fallback direct insert
      const { data: insertData } = await client.from('badge_codes_16').insert(codeRow).select().single();
      if (insertData) return supabaseRowToItem(collectionName, insertData) as T;

      return item;
    }

    if (table === 'dynamic_qr_sessions') {
      const dynDocId = String(item.id || row.doc_id || (item as any).sessionId || `dyn-${Date.now()}`);
      const dynRow: any = {
        ...row,
        doc_id: dynDocId,
        session_id: String((item as any).sessionId || (item as any).id || row.session_id || dynDocId),
        token: String((item as any).token || row.token || ''),
        status: String((item as any).status || row.status || 'active'),
        expires_at: (item as any).expiresAt || row.expires_at || null,
        raw_data: item,
        updated_at: new Date().toISOString(),
      };
      if (typeof dynRow.id !== 'number') delete dynRow.id;

      const { data: upsertData, error: upsertErr } = await client
        .from('dynamic_qr_sessions')
        .upsert(dynRow, { onConflict: 'session_id' })
        .select()
        .single();
      if (!upsertErr && upsertData) return supabaseRowToItem(collectionName, upsertData) as T;

      const { data: insertData } = await client.from('dynamic_qr_sessions').insert(dynRow).select().single();
      if (insertData) return supabaseRowToItem(collectionName, insertData) as T;

      return item;
    }

    if (table === 'notifications') {
      try {
        if (row.target_user_id) {
          const { data: u } = await client.from('users').select('id').eq('id', row.target_user_id).maybeSingle();
          if (!u?.id) {
            const { data: emp } = await client.from('employees').select('user_id').eq('id', row.target_user_id).maybeSingle();
            if (emp?.user_id) {
              row.target_user_id = emp.user_id;
            } else {
              delete row.target_user_id;
            }
          }
        }
      } catch {
        delete row.target_user_id;
      }
    }

    if (row.id) {
      const { data, error } = await client.from(table).upsert(row, { onConflict: 'id' }).select().single();
      if (!error && data) return supabaseRowToItem(collectionName, data) as T;
      if (!error) return item;
    } else if (row.uid) {
      const { data, error } = await client.from(table).upsert(row, { onConflict: 'uid' }).select().single();
      if (!error && data) return supabaseRowToItem(collectionName, data) as T;
      if (!error) return item;
    } else if (row.doc_id) {
      const { data, error } = await client.from(table).upsert(row, { onConflict: 'doc_id' }).select().single();
      if (!error && data) return supabaseRowToItem(collectionName, data) as T;
      const { data: updateData } = await client.from(table).update(row).eq('doc_id', row.doc_id).select().single();
      if (updateData) return supabaseRowToItem(collectionName, updateData) as T;
      const { data: insertData } = await client.from(table).insert(row).select().single();
      if (insertData) return supabaseRowToItem(collectionName, insertData) as T;
      return item;
    } else {
      const { data, error } = await client.from(table).insert(row).select().single();
      if (!error && data) return supabaseRowToItem(collectionName, data) as T;
      if (!error) return item;
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
    const client = supabaseAdmin || getClient();
    const strId = String(id).trim();

    if (table === 'generic_collections') {
      const { error } = await client
        .from('generic_collections')
        .delete()
        .eq('collection', collectionName)
        .eq('doc_id', strId);
      if (error) {
        console.error(`[deleteDocument generic_collections error for ${collectionName}:${strId}]:`, error);
        throw error;
      }
      return true;
    }

    if (table === 'visitor_logs') {
      const { error } = await client
        .from('visitor_logs')
        .delete()
        .eq('doc_id', strId);
      if (error) {
        console.error(`[deleteDocument visitor_logs error for ${strId}]:`, error);
        throw error;
      }
      return true;
    }

    if (/^\d+$/.test(strId)) {
      const { error } = await client.from(table).delete().eq('id', Number(strId));
      if (error) throw error;
    } else if (isUuid(strId)) {
      const { error } = await client.from(table).delete().eq('uid', strId);
      if (error) throw error;
    } else {
      const { error } = await client.from(table).delete().eq('doc_id', strId);
      if (error) throw error;
    }
    return true;
  } catch (err: any) {
    console.error(`[Supabase Delete] Exception deleting from ${collectionName}:`, err);
    throw err;
  }
}

// Subscribe in real-time to table changes via Supabase Realtime
export function subscribeToCollection<T>(collectionName: string, callback: (data: T[]) => void) {
  const table = mapCollectionToTable(collectionName);
  
  // Initial fetch
  fetchCollection<T>(collectionName).then((items) => {
    offlineService.cacheListLocally(collectionName, items as any);
    callback(items);
  });

  // Realtime channel
  const channelName = `realtime_${table}_${collectionName}_${Date.now()}_${Math.random()}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      async () => {
        // Re-fetch collection on change
        const updated = await fetchCollection<T>(collectionName);
        offlineService.cacheListLocally(collectionName, updated as any);
        callback(updated);
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
