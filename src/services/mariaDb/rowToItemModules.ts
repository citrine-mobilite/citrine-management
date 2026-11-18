export function mapModuleMariaDbRowToItem(table: string, row: any): any | null {
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
      createdBy: row.created_by || raw.createdBy || raw.generatedBy || 'Responsable',
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
      qrCodeSecret: raw.qrCodeSecret || '',
      doorQrCodeToken: raw.doorQrCodeToken || '',
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

  if (table === 'task_projects') {
    const raw = (row.raw_data && typeof row.raw_data === 'object') ? row.raw_data : {};
    const originalId = raw.id || row.doc_id || String(row.id);
    return {
      ...raw,
      id: originalId,
      docId: row.doc_id || originalId,
      _dbId: row.id,
      name: row.name || raw.name || 'Projet',
      description: row.description ?? raw.description ?? '',
      color: row.color ?? raw.color,
      icon: row.icon ?? raw.icon ?? '📁',
      memberIds: Array.isArray(raw.memberIds)
        ? raw.memberIds
        : Array.isArray(row.member_ids)
        ? row.member_ids
        : [],
      sections: Array.isArray(raw.sections) ? raw.sections : undefined,
      customFields: Array.isArray(raw.customFields) ? raw.customFields : undefined,
      rules: Array.isArray(raw.rules) ? raw.rules : undefined,
      createdAt: row.created_at || raw.createdAt || '',
    };
  }

  return null;
}
