import { isUuid, mapCollectionToTable } from './tableMapper';
import { mapHrItemToRow } from './itemToRowHr';
import { mapOpsItemToRow } from './itemToRowOps';

function mapModuleItemToRow(table: string, item: any, base: any): any | null {
  switch (table) {
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
    default:
      return null;
  }
}

export function itemToSupabaseRow(collectionName: string, item: any): any {
  const table = mapCollectionToTable(collectionName);
  const docId = String(item.docId || item.doc_id || item.id || (item as any)._id || `doc_${Date.now()}`);

  const base: any = {
    doc_id: docId,
    raw_data: item,
    updated_at: new Date().toISOString(),
  };

  if (typeof item.id === 'number' || (typeof item.id === 'string' && /^\d+$/.test(item.id))) {
    base.id = Number(item.id);
  }

  if (item.uid && isUuid(item.uid)) {
    base.uid = item.uid;
  } else if (typeof item.id === 'string' && isUuid(item.id)) {
    base.uid = item.id;
  }

  if (table === 'generic_collections') {
    const genericDocId = String(item.id || (item as any).docId || `doc_${Date.now()}`);
    return {
      collection: collectionName,
      doc_id: genericDocId,
      data: item,
      updated_at: new Date().toISOString(),
      ...(base.id ? { id: base.id } : {}),
      ...(base.uid ? { uid: base.uid } : {}),
    };
  }

  return (
    mapHrItemToRow(table, item, base, docId) ||
    mapOpsItemToRow(table, item, base, docId) ||
    mapModuleItemToRow(table, item, base) ||
    base
  );
}
