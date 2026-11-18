export function mapOpsItemToRow(table: string, item: any, base: any, docId: string): any | null {
  switch (table) {
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
        session_id: item.sessionId || item.id || docId,
        created_by: item.generatedBy || 'Responsable',
        expires_at: item.expiresAt || null,
        is_active: item.status !== 'expired' && item.status !== 'closed',
        // The token and its single-use metadata live only in raw_data.
        raw_data: item,
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
    default:
      return null;
  }
}
