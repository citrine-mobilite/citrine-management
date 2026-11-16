export function mapHrItemToRow(table: string, item: any, base: any, docId: string): any | null {
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
        ...item,
        name: item.name || '',
        email: item.email || '',
        role: item.role || (roleId === 1 ? 'administrateur' : roleId === 2 ? 'responsable' : 'employé'),
        roleId,
        role_id: roleId,
        department: item.department ? String(item.department).trim() : 'Direction Générale',
        phone: item.phone || null,
        status: isStatusActive ? 'actif' : 'inactif',
        employeeId: item.employeeId || null,
        allowEarlyDeparture15_17: Boolean(item.allowEarlyDeparture15_17),
        allowLateArrival8_930: Boolean(item.allowLateArrival8_930),
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
        doc_id: docId,
        name: item.name || 'Projet',
        description: item.description || null,
        color: item.color || null,
        icon: item.icon || null,
        member_ids: item.memberIds || [],
        raw_data: item,
      };
    case 'reminders': {
      const empIdNumeric =
        item.employeeId && /^\d+$/.test(String(item.employeeId))
          ? Number(item.employeeId)
          : null;
      const resolvedDate = (item.expirationDate || item.date || '').trim() || null;
      return {
        ...base,
        title: item.title || 'Rappel',
        note: item.note || null,
        date: resolvedDate,
        time: item.time || null,
        location: item.location || item.entityName || null,
        employee_id: empIdNumeric,
        all_employees: Boolean(item.allEmployees),
        trigger_before: item.triggerBefore || (item.alertLeadDays ? `${item.alertLeadDays}d` : null),
        triggered: Boolean(item.triggered),
        stopped: Boolean(item.stopped || item.isResolved),
        raw_data: item,
      };
    }
    case 'presences':
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
      return null;
  }
}
