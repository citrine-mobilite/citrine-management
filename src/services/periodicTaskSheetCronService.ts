import { getCollectionData } from '../db/repository';
import { sendThreadedEmployeeEmail } from './serverMailService';
import { isStrictSuperAdminAccount } from './weeklyAttendanceReportService';
import {
  getDoualaDateInfo,
  buildTaskSheetHtmlReport,
  buildTaskSheetExcelBuffer,
  buildMonthlyTaskSheetHtmlReport,
  buildMonthlyTaskSheetExcelBuffer,
  buildYearlyTaskSheetHtmlReport,
  buildYearlyTaskSheetExcelBuffer,
} from './taskSheetReportService';
import { generateMonthlyTaskSheet, generateYearlyTaskSheet } from './taskSheet/monthlyYearlyTaskSheet';
import { buildEmployeeTasksSummary } from './taskSheet/dailyTaskSheetTasksBuilder';
import { buildEmployeeDailyAttendanceSummary } from './taskSheet/dailyTaskSheetAttendanceBuilder';

export interface PeriodicDispatchResult {
  success: boolean;
  message: string;
  processedCount: number;
  sentEmployees: string[];
  errors: string[];
  period: string;
}

function getPreviousMonthStr(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Douala',
    year: 'numeric',
    month: '2-digit',
  }).format(date);
  const [yStr, mStr] = parts.split('-');
  let y = parseInt(yStr, 10);
  let m = parseInt(mStr, 10) - 1;
  if (m <= 0) {
    m = 12;
    y -= 1;
  }
  return `${y}-${String(m).padStart(2, '0')}`;
}

function resolveAdminRecipients(users: any[]): string[] {
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
  return adminEmails;
}

/**
 * Envoie la Synthèse Mensuelle (avec calendrier & sous-tâches) pour tous les collaborateurs actifs.
 */
export async function executeMonthlyTaskSheetDispatch(options?: {
  monthStr?: string;
  recipientEmails?: string[];
}): Promise<PeriodicDispatchResult> {
  const targetMonth = options?.monthStr || getPreviousMonthStr();
  const sentEmployees: string[] = [];
  const errors: string[] = [];

  try {
    const [employees, users, tasks, presences, reminders, strategicProjects, notifications] = await Promise.all([
      getCollectionData('employees'),
      getCollectionData('users'),
      getCollectionData('tasks'),
      getCollectionData('presences'),
      getCollectionData('reminders'),
      getCollectionData('strategic_projects'),
      getCollectionData('notifications'),
    ]);

    const recipients = options?.recipientEmails?.length ? options.recipientEmails : resolveAdminRecipients(users);

    const activeEmployees = employees.filter((emp: any) => {
      const status = String(emp.status || '').toLowerCase();
      if (status === 'archived' || status === 'inactif' || status === 'inactive') return false;
      if (isStrictSuperAdminAccount(emp, users)) return false;
      return true;
    });

    for (const emp of activeEmployees) {
      const empName = emp.name || 'Collaborateur';
      try {
        const monthlyData = generateMonthlyTaskSheet(emp, targetMonth, tasks, presences, reminders, strategicProjects, notifications);
        const hasActivity =
          monthlyData.totalDaysWorked > 0 ||
          (monthlyData.tasksList && monthlyData.tasksList.length > 0) ||
          (monthlyData.remindersSummary?.totalOccurrences || 0) > 0 ||
          (monthlyData.importantPointsSummary?.totalPoints || 0) > 0;
        if (!hasActivity) continue;

        const htmlContent = buildMonthlyTaskSheetHtmlReport(monthlyData);
        const excelBuffer = await buildMonthlyTaskSheetExcelBuffer(monthlyData);
        const safeName = empName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
        const filename = `feuille_taches_mensuelle_${safeName}_${targetMonth}.xlsx`;

        await sendThreadedEmployeeEmail({
          employeeName: empName,
          employeeId: emp.id,
          employeeEmail: emp.email,
          eventTitle: `Feuille de Tâches Mensuelle (${monthlyData.monthName})`,
          threadCategory: 'tasksheet',
          threadSubject: `Feuille de Tâches Mensuelle (${monthlyData.monthName}) - ${empName}`,
          htmlContent,
          recipientEmails: recipients,
          cc: emp.email || undefined,
          attachments: [
            {
              filename,
              content: excelBuffer,
              contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
          ],
        });

        sentEmployees.push(empName);
      } catch (empErr: any) {
        errors.push(`Erreur synthèse mensuelle pour ${empName}: ${empErr?.message || String(empErr)}`);
      }
    }

    return {
      success: errors.length === 0,
      message: `Synthèse mensuelle (${targetMonth}) envoyée pour ${sentEmployees.length} collaborateur(s).`,
      processedCount: sentEmployees.length,
      sentEmployees,
      errors,
      period: targetMonth,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erreur critique synthèse mensuelle : ${err?.message || String(err)}`,
      processedCount: sentEmployees.length,
      sentEmployees,
      errors: [err?.message || String(err), ...errors],
      period: targetMonth,
    };
  }
}

/**
 * Envoie le Bilan Annuel des Tâches & Sous-Tâches pour tous les collaborateurs actifs.
 */
export async function executeYearlyTaskSheetDispatch(options?: {
  year?: number;
  recipientEmails?: string[];
}): Promise<PeriodicDispatchResult> {
  const targetYear = options?.year || new Date().getFullYear();
  const sentEmployees: string[] = [];
  const errors: string[] = [];

  try {
    const [employees, users, tasks, presences, reminders, strategicProjects, notifications] = await Promise.all([
      getCollectionData('employees'),
      getCollectionData('users'),
      getCollectionData('tasks'),
      getCollectionData('presences'),
      getCollectionData('reminders'),
      getCollectionData('strategic_projects'),
      getCollectionData('notifications'),
    ]);

    const recipients = options?.recipientEmails?.length ? options.recipientEmails : resolveAdminRecipients(users);

    const activeEmployees = employees.filter((emp: any) => {
      const status = String(emp.status || '').toLowerCase();
      if (status === 'archived' || status === 'inactif' || status === 'inactive') return false;
      if (isStrictSuperAdminAccount(emp, users)) return false;
      return true;
    });

    for (const emp of activeEmployees) {
      const empName = emp.name || 'Collaborateur';
      try {
        const yearlyData = generateYearlyTaskSheet(emp, targetYear, tasks, presences, reminders, strategicProjects, notifications);
        const hasActivity =
          yearlyData.totalDaysPresent > 0 ||
          (yearlyData.totalSubtasksAssigned || 0) > 0 ||
          (yearlyData.remindersSummary?.totalOccurrences || 0) > 0 ||
          (yearlyData.importantPointsSummary?.totalPoints || 0) > 0;
        if (!hasActivity) continue;

        const htmlContent = buildYearlyTaskSheetHtmlReport(yearlyData);
        const excelBuffer = await buildYearlyTaskSheetExcelBuffer(yearlyData);
        const safeName = empName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
        const filename = `bilan_annuel_taches_${safeName}_${targetYear}.xlsx`;

        await sendThreadedEmployeeEmail({
          employeeName: empName,
          employeeId: emp.id,
          employeeEmail: emp.email,
          eventTitle: `Bilan Annuel des Tâches (${targetYear})`,
          threadCategory: 'tasksheet',
          threadSubject: `Bilan Annuel des Tâches (${targetYear}) - ${empName}`,
          htmlContent,
          recipientEmails: recipients,
          cc: emp.email || undefined,
          attachments: [
            {
              filename,
              content: excelBuffer,
              contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
          ],
        });

        sentEmployees.push(empName);
      } catch (empErr: any) {
        errors.push(`Erreur bilan annuel pour ${empName}: ${empErr?.message || String(empErr)}`);
      }
    }

    return {
      success: errors.length === 0,
      message: `Bilan annuel (${targetYear}) envoyé pour ${sentEmployees.length} collaborateur(s).`,
      processedCount: sentEmployees.length,
      sentEmployees,
      errors,
      period: String(targetYear),
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erreur critique bilan annuel : ${err?.message || String(err)}`,
      processedCount: sentEmployees.length,
      sentEmployees,
      errors: [err?.message || String(err), ...errors],
      period: String(targetYear),
    };
  }
}

/**
 * Envoie à la demande la Feuille de Tâches d'un seul collaborateur (Plan du Jour, Synthèse Mensuelle ou Bilan Annuel).
 */
export async function sendSingleEmployeeTaskSheetEmail(params: {
  employeeId: string;
  mode: 'day' | 'month' | 'year';
  period?: string;
  overrideRecipients?: string[];
}) {
  const { employeeId, mode, period, overrideRecipients } = params;
  const [employees, users, tasks, presences, incidents, reminders, strategicProjects, notifications] = await Promise.all([
    getCollectionData('employees'),
    getCollectionData('users'),
    getCollectionData('tasks'),
    getCollectionData('presences'),
    getCollectionData('attendance_incidents'),
    getCollectionData('reminders'),
    getCollectionData('strategic_projects'),
    getCollectionData('notifications'),
  ]);

  const emp = employees.find((e: any) => String(e.id) === String(employeeId));
  if (!emp) {
    return { success: false, error: 'Collaborateur introuvable.' };
  }

  const recipients = overrideRecipients?.length ? overrideRecipients : resolveAdminRecipients(users);
  const empName = emp.name || 'Collaborateur';
  const safeName = empName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');

  if (mode === 'month') {
    const monthStr = period || new Date().toISOString().slice(0, 7);
    const monthlyData = generateMonthlyTaskSheet(emp, monthStr, tasks, presences, reminders, strategicProjects, notifications);
    const htmlContent = buildMonthlyTaskSheetHtmlReport(monthlyData);
    const excelBuffer = await buildMonthlyTaskSheetExcelBuffer(monthlyData);
    return sendThreadedEmployeeEmail({
      employeeName: empName,
      employeeId: emp.id,
      employeeEmail: emp.email,
      eventTitle: `Feuille de Tâches Mensuelle (${monthlyData.monthName})`,
      threadCategory: 'tasksheet',
      threadSubject: `Feuille de Tâches Mensuelle (${monthlyData.monthName}) - ${empName}`,
      htmlContent,
      recipientEmails: recipients,
      attachments: [
        {
          filename: `feuille_taches_mensuelle_${safeName}_${monthStr}.xlsx`,
          content: excelBuffer,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      ],
    });
  }

  if (mode === 'year') {
    const yearNum = period ? parseInt(period, 10) || new Date().getFullYear() : new Date().getFullYear();
    const yearlyData = generateYearlyTaskSheet(emp, yearNum, tasks, presences, reminders, strategicProjects, notifications);
    const htmlContent = buildYearlyTaskSheetHtmlReport(yearlyData);
    const excelBuffer = await buildYearlyTaskSheetExcelBuffer(yearlyData);
    return sendThreadedEmployeeEmail({
      employeeName: empName,
      employeeId: emp.id,
      employeeEmail: emp.email,
      eventTitle: `Bilan Annuel des Tâches (${yearNum})`,
      threadCategory: 'tasksheet',
      threadSubject: `Bilan Annuel des Tâches (${yearNum}) - ${empName}`,
      htmlContent,
      recipientEmails: recipients,
      attachments: [
        {
          filename: `bilan_annuel_taches_${safeName}_${yearNum}.xlsx`,
          content: excelBuffer,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      ],
    });
  }

  const douala = getDoualaDateInfo(period ? new Date(`${period}T12:00:00`) : new Date());
  const taskSummary = buildEmployeeTasksSummary({
    empId: emp.id,
    empName,
    empEmail: emp.email || '',
    tasks,
    dayIso: douala.dayIso,
    reminders,
    strategicProjects,
    notifications,
    department: emp.department,
    roleType: emp.roleType,
  });
  const attendanceSummary = buildEmployeeDailyAttendanceSummary({
    empId: emp.id,
    presences,
    incidents,
    dayIso: douala.dayIso,
    lateThreshold: '08:00',
  });

  const dailyReportData = {
    employeeName: empName,
    employeeEmail: emp.email,
    employeeId: emp.id,
    department: emp.department || 'Direction Générale',
    dateStr: douala.dateOnly,
    timeStr: douala.timeOnly,
    dailyAttendance: attendanceSummary.dailyAttendance,
    presenceIncidents: attendanceSummary.presenceIncidents,
    items: taskSummary.items,
    blockers: taskSummary.blockers,
    managerPoints: taskSummary.managerPoints,
    importantPoints: taskSummary.importantPoints,
    totalEstimatedHours: taskSummary.totalEstimated,
    totalActualHours: taskSummary.totalActual,
    topPriorities: taskSummary.topPriorities,
    scheduleSlots: taskSummary.scheduleSlots,
    postponedTasks: taskSummary.postponedTasks,
  };

  const htmlContent = buildTaskSheetHtmlReport(dailyReportData);
  const excelBuffer = await buildTaskSheetExcelBuffer(dailyReportData);
  return sendThreadedEmployeeEmail({
    employeeName: empName,
    employeeId: emp.id,
    employeeEmail: emp.email,
    eventTitle: "Feuille d'avancement des tâches",
    threadCategory: 'tasksheet',
    threadSubject: `Feuille de Tâches - ${empName} (${douala.dateOnly})`,
    htmlContent,
    recipientEmails: recipients,
    attachments: [
      {
        filename: `feuille_taches_${safeName}_${douala.dayIso.replace(/-/g, '_')}.xlsx`,
        content: excelBuffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    ],
  });
}
