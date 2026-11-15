import { getCollectionData } from '../../db/repository';
import {
  DayPresenceRecord,
  EmployeeWeeklySummary,
  WeeklyAttendanceReportData,
} from './weeklyReportTypes';
import {
  calculateHoursWorked,
  formatHours,
  getDoualaCurrentWeek,
  isArrivalAfterThreshold,
  isStrictSuperAdminAccount,
} from './weeklyDateAndHourUtils';

export async function compileWeeklyAttendanceData(options?: {
  manual?: boolean;
  forceFriday?: boolean;
  referenceDate?: Date;
}): Promise<WeeklyAttendanceReportData> {
  const weekInfo = getDoualaCurrentWeek(options?.referenceDate, { forceFriday: options?.forceFriday });

  const employees = await getCollectionData('employees');
  const presences = await getCollectionData('presences');
  const incidents = await getCollectionData('attendance_incidents');
  const companySettingsList = await getCollectionData('company_settings');
  const users = await getCollectionData('users');

  const companySettings = companySettingsList && companySettingsList.length > 0 ? companySettingsList[0] : null;
  let lateThreshold = '08:00';
  if (companySettings) {
    const candidate =
      companySettings.lateThresholdTime ||
      companySettings.late_threshold_time ||
      companySettings.workStartTime ||
      companySettings.work_start_time;
    if (typeof candidate === 'string' && candidate.trim().includes(':')) {
      lateThreshold = candidate.trim();
    }
  }

  const eligibleEmployees = employees.filter((e: any) => {
    const status = String(e.status || '').toLowerCase();
    const isActive = status !== 'archived' && status !== 'inactif' && status !== 'inactive';
    if (!isActive) return false;
    return !isStrictSuperAdminAccount(e, users);
  });

  const nowFrStr = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Africa/Douala',
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date());

  const summaries: EmployeeWeeklySummary[] = [];

  for (const emp of eligibleEmployees) {
    const empId = String(emp.id || '');
    const empName = emp.name || 'Collaborateur';
    const empEmail = emp.email || '';
    const department = emp.department || 'Opérations & Technique';
    const position = emp.position || emp.role || 'Collaborateur';

    const dayRecords: DayPresenceRecord[] = [];
    let employeeTotalHours = 0;
    let employeeDaysWorked = 0;
    let employeeLateness = 0;

    for (const d of weekInfo.days) {
      const isElapsed = d.isPastOrToday;

      const p = presences.find((item: any) => {
        const matchEmp = String(item.employeeId || item.employee_id || '') === empId;
        const pDate = String(item.date || '').split('T')[0];
        return matchEmp && pDate === d.dateIso;
      });

      const inc = incidents.find((item: any) => {
        const matchEmp = String(item.employeeId || item.employee_id || '') === empId;
        const incDate = String(item.date || '').split('T')[0];
        return matchEmp && incDate === d.dateIso;
      });

      let statusType: DayPresenceRecord['statusType'] = 'unknown';
      let statusLabel = 'Non renseigné';
      let workedHours = 0;

      if (!isElapsed) {
        statusType = 'future';
        statusLabel = 'À venir';
      } else if (p) {
        const arr = p.arrivalTime || '';
        const dep = p.departureTime || '';
        const pStart = p.pauseStart || '';
        const pEnd = p.pauseEnd || '';

        if (p.hoursWorked && Number(p.hoursWorked) > 0) {
          workedHours = Number(p.hoursWorked);
        } else {
          workedHours = calculateHoursWorked(arr, dep, pStart, pEnd);
          if (workedHours === 0 && arr && !dep && d.isToday) {
            workedHours = 4.0;
          }
        }

        const isLate =
          p.status === 'late' || isArrivalAfterThreshold(arr, lateThreshold) || (inc && inc.type === 'late');
        if (isLate) {
          statusType = 'late';
          statusLabel = 'Retard';
          employeeLateness++;
        } else if (p.status === 'mission') {
          statusType = 'mission';
          statusLabel = 'En mission';
        } else if (p.status === 'leave' || p.status === 'conge') {
          statusType = 'leave';
          statusLabel = 'Congé';
        } else {
          statusType = 'on_time';
          statusLabel = 'Présent';
        }

        if (arr) {
          employeeDaysWorked++;
          employeeTotalHours += workedHours;
        }
      } else {
        statusType = 'absent';
        statusLabel = 'Non pointé';
      }

      dayRecords.push({
        dayName: d.dayName,
        dateStr: d.dateIso,
        formattedDate: `${d.date.getDate()}/${d.date.getMonth() + 1}`,
        arrivalTime: p?.arrivalTime || (statusType === 'future' ? '' : '—'),
        pauseStart: p?.pauseStart || '',
        pauseEnd: p?.pauseEnd || '',
        departureTime: p?.departureTime || (statusType === 'future' ? '' : '—'),
        workedHoursText: workedHours > 0 ? formatHours(workedHours) : statusType === 'future' ? '—' : '0h',
        workedHoursNumber: workedHours,
        statusLabel,
        statusType,
        location: p?.location || 'Douala',
        notes: inc?.description || p?.adminBadgeReason || p?.correctionReason,
      });
    }

    const attendanceRate =
      weekInfo.targetEndDay > 0 ? Math.min(100, Math.round((employeeDaysWorked / weekInfo.targetEndDay) * 100)) : 0;

    summaries.push({
      employeeId: empId,
      employeeName: empName,
      employeeEmail: empEmail,
      department,
      position,
      days: dayRecords,
      totalWorkedHours: employeeTotalHours,
      totalWorkedHoursText: formatHours(employeeTotalHours),
      daysWorkedCount: employeeDaysWorked,
      totalDaysExpected: weekInfo.targetEndDay,
      latenessCount: employeeLateness,
      attendanceRate,
    });
  }

  const totalCollectiveHours = summaries.reduce((sum, s) => sum + s.totalWorkedHours, 0);
  const totalLateness = summaries.reduce((sum, s) => sum + s.latenessCount, 0);
  const avgAttendance =
    summaries.length > 0 ? Math.round(summaries.reduce((sum, s) => sum + s.attendanceRate, 0) / summaries.length) : 0;

  const isManual = Boolean(options?.manual);
  const title = isManual
    ? `Rapport d'Étape des Présences — Semaine en cours (${weekInfo.mondayLabel} au ${weekInfo.endLabel})`
    : `Rapport Hebdomadaire des Présences — Semaine du ${weekInfo.mondayLabel} au ${weekInfo.endLabel}`;

  return {
    title,
    startDateStr: weekInfo.mondayLabel,
    endDateStr: weekInfo.endLabel,
    isFullWeek: weekInfo.isFullWeek,
    isManualTrigger: isManual,
    generatedAtStr: nowFrStr,
    totalCollaborators: summaries.length,
    totalCollectiveHoursText: formatHours(totalCollectiveHours),
    averageAttendanceRate: avgAttendance,
    totalLateness,
    lateThreshold,
    summaries,
  };
}
