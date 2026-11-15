import { getCollectionData } from '../db/repository';
import { sendThreadedEmployeeEmail } from './serverMailService';
import {
  getDoualaDateInfo,
  buildTaskSheetHtmlReport,
  buildTaskSheetExcelBuffer,
} from './taskSheetReportService';
import { isStrictSuperAdminAccount } from './weeklyAttendanceReportService';
import { buildEmployeeTasksSummary } from './taskSheet/dailyTaskSheetTasksBuilder';
import { buildEmployeeDailyAttendanceSummary } from './taskSheet/dailyTaskSheetAttendanceBuilder';

export interface DailyTaskSheetDispatchResult {
  success: boolean;
  message: string;
  processedCount: number;
  sentEmployees: string[];
  errors: string[];
  timestamp: string;
}

export async function executeDailyTaskSheetDispatch(options?: {
  forceWeekday?: boolean;
}): Promise<DailyTaskSheetDispatchResult> {
  const sentEmployees: string[] = [];
  const errors: string[] = [];
  const doualaTime = getDoualaDateInfo();

  const now = new Date();
  const weekdayName = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Douala',
    weekday: 'long',
  })
    .format(now)
    .toLowerCase();
  const isWeekend = weekdayName === 'saturday' || weekdayName === 'sunday';

  if (isWeekend && !options?.forceWeekday) {
    const msg = `⏸️ [CRON TASKSHEETS] Ignoré aujourd'hui (${weekdayName}) : les TaskSheets sont strictement programmés du lundi au vendredi.`;
    return {
      success: true,
      message: msg,
      processedCount: 0,
      sentEmployees: [],
      errors: [],
      timestamp: doualaTime.fullDateStr,
    };
  }

  try {
    const [employees, users, tasks, presences, incidents, companySettingsList] = await Promise.all([
      getCollectionData('employees'),
      getCollectionData('users'),
      getCollectionData('tasks'),
      getCollectionData('presences'),
      getCollectionData('attendance_incidents'),
      getCollectionData('company_settings'),
    ]);

    const companySettings = companySettingsList && companySettingsList.length > 0 ? companySettingsList[0] : null;
    let lateThreshold = '08:00';
    if (companySettings) {
      const rawVal =
        companySettings.lateThresholdTime ||
        companySettings.late_threshold_time ||
        companySettings.workStartTime ||
        companySettings.work_start_time;
      if (typeof rawVal === 'string' && rawVal.trim().includes(':')) {
        lateThreshold = rawVal.trim();
      }
    }

    const admins = users.filter(
      (u: any) =>
        u.role_id === 1 ||
        u.role === 'administrateur' ||
        String(u.raw_data?.role).toLowerCase().includes('admin')
    );
    const adminEmails = admins.map((a: any) => a.email).filter(Boolean);
    if (adminEmails.length === 0) {
      if (process.env.HR_NOTIFICATION_EMAIL) adminEmails.push(process.env.HR_NOTIFICATION_EMAIL);
      else if (process.env.SMTP_USER) adminEmails.push(process.env.SMTP_USER);
      else adminEmails.push('citrinemobilite@gmail.com');
    }

    const activeEmployees = employees.filter((emp: any) => {
      const empName = (emp.name || '').toLowerCase();
      const empEmail = (emp.email || '').toLowerCase();
      const empId = String(emp.id || '');
      const status = String(emp.status || '').toLowerCase();
      if (status === 'archived' || status === 'inactif' || status === 'inactive') return false;
      if (isStrictSuperAdminAccount(emp, users)) return false;

      const hasTasks = tasks.some((t: any) => {
        const assigned = (t.assignedTo || '').toLowerCase();
        return assigned.includes(empName) || assigned.includes(empEmail) || String(t.employeeId || '') === empId;
      });
      const hasPresence = presences.some((p: any) => {
        const matchEmp = String(p.employeeId || p.employee_id || '') === empId;
        const pDate = String(p.date || '').split('T')[0];
        return matchEmp && pDate === doualaTime.dayIso;
      });

      return hasTasks || hasPresence;
    });

    for (const emp of activeEmployees) {
      const empName = emp.name || 'Collaborateur';
      const empEmail = emp.email || '';
      const empId = emp.id;

      try {
        const taskSummary = buildEmployeeTasksSummary({
          empId,
          empName,
          empEmail,
          tasks,
          dayIso: doualaTime.dayIso,
        });
        const attendanceSummary = buildEmployeeDailyAttendanceSummary({
          empId,
          presences,
          incidents,
          dayIso: doualaTime.dayIso,
          lateThreshold,
        });

        const taskSheetData = {
          employeeName: empName,
          employeeEmail: empEmail,
          employeeId: empId,
          department: emp.department || 'Direction Générale',
          dateStr: doualaTime.dateOnly,
          timeStr: doualaTime.timeOnly,
          dailyAttendance: attendanceSummary.dailyAttendance,
          presenceIncidents: attendanceSummary.presenceIncidents,
          items: taskSummary.items,
          blockers: taskSummary.blockers,
          managerPoints: taskSummary.managerPoints,
          totalEstimatedHours: taskSummary.totalEstimated,
          totalActualHours: taskSummary.totalActual,
          topPriorities: taskSummary.topPriorities,
          postponedTasks: taskSummary.postponedTasks,
        };

        const htmlContent = buildTaskSheetHtmlReport(taskSheetData);
        const excelBuffer = await buildTaskSheetExcelBuffer(taskSheetData);

        const safeCollabName = empName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
        const safeDate = doualaTime.dayIso.replace(/-/g, '_');
        const excelFilename = `tasksheet_${safeCollabName}_${safeDate}.xlsx`;

        await sendThreadedEmployeeEmail({
          employeeName: empName,
          employeeId: empId,
          employeeEmail: empEmail,
          eventTitle: "Feuille d'avancement des tâches (TaskSheet)",
          threadCategory: 'tasksheet',
          threadSubject: `TaskSheet - Feuille d'avancement des tâches - ${empName}`,
          htmlContent,
          recipientEmails: adminEmails,
          attachments: [
            {
              filename: excelFilename,
              content: excelBuffer,
              contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
          ],
        });

        sentEmployees.push(empName);
      } catch (empErr: any) {
        const msg = `Erreur envoi TaskSheet pour ${empName}: ${empErr?.message || String(empErr)}`;
        console.error(`[CRON TaskSheet Error]:`, msg);
        errors.push(msg);
      }
    }

    return {
      success: errors.length === 0,
      message: `TaskSheets transmis avec succès pour ${sentEmployees.length} collaborateur(s).`,
      processedCount: sentEmployees.length,
      sentEmployees,
      errors,
      timestamp: doualaTime.fullDateStr,
    };
  } catch (error: any) {
    const rawError = error?.message || String(error);
    console.error(`[executeDailyTaskSheetDispatch Critical Error]:`, error);
    return {
      success: false,
      message: `Erreur critique lors de l'exécution du cron TaskSheet : ${rawError}`,
      processedCount: sentEmployees.length,
      sentEmployees,
      errors: [rawError, ...errors],
      timestamp: doualaTime.fullDateStr,
    };
  }
}
