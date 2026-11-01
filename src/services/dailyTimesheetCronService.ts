import { getCollectionData } from '../db/repository';
import { sendThreadedEmployeeEmail } from './serverMailService';
import { 
  getDoualaDateInfo, 
  buildTimesheetHtmlReport, 
  buildTimesheetExcelBuffer,
  TimesheetItem,
  TimesheetBlocker,
  TimesheetManagerPoint
} from './timesheetReportService';
import { 
  isStrictSuperAdminAccount, 
  isArrivalAfterThreshold 
} from './weeklyAttendanceReportService';

export interface DailyTimesheetDispatchResult {
  success: boolean;
  message: string;
  processedCount: number;
  sentEmployees: string[];
  errors: string[];
  timestamp: string;
}

/**
 * Service centralisé pour l'exécution automatique de la feuille de temps quotidienne (19h30 Douala)
 * Utilisé à la fois par :
 * - Le cron local (Node.js setInterval dans server.ts)
 * - Le cron Vercel Serverless (Route /api/cron/daily-timesheet)
 * - Les déclenchements manuels de test
 */
export async function executeDailyTimesheetDispatch(options?: { forceWeekday?: boolean }): Promise<DailyTimesheetDispatchResult> {
  const sentEmployees: string[] = [];
  const errors: string[] = [];
  const doualaTime = getDoualaDateInfo();

  // 🛑 RÈGLE STRICTE : Les feuilles de temps ne sont transmises QUE du lundi au vendredi
  const now = new Date();
  const weekdayName = new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Douala', weekday: 'long' }).format(now).toLowerCase();
  const isWeekend = weekdayName === 'saturday' || weekdayName === 'sunday';

  if (isWeekend && !options?.forceWeekday) {
    const msg = `⏸️ [CRON FEUILLES DE TEMPS] Ignoré aujourd'hui (${weekdayName}) : les feuilles de temps sont strictement programmées du lundi au vendredi.`;
    console.log(msg);
    return {
      success: true,
      message: msg,
      processedCount: 0,
      sentEmployees: [],
      errors: [],
      timestamp: doualaTime.fullDateStr,
    };
  }

  console.log(`⏰ [CRON FEUILLES DE TEMPS 19:30] Début d'exécution (${doualaTime.fullDateStr})...`);

  try {
    const employees = await getCollectionData('employees');
    const users = await getCollectionData('users');
    const tasks = await getCollectionData('tasks');
    const presences = await getCollectionData('presences');
    const incidents = await getCollectionData('attendance_incidents');
    const companySettingsList = await getCollectionData('company_settings');

    // Récupération de l'heure limite de retard paramétrée (ex: 08:30 ou repli 08:00)
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

    // Destinataires administrateurs / RH pour la réception
    const admins = users.filter((u: any) => u.role_id === 1 || u.role === 'administrateur' || String(u.raw_data?.role).toLowerCase().includes('admin'));
    const adminEmails = admins.map((a: any) => a.email).filter(Boolean);
    if (adminEmails.length === 0) {
      if (process.env.HR_NOTIFICATION_EMAIL) adminEmails.push(process.env.HR_NOTIFICATION_EMAIL);
      else if (process.env.SMTP_USER) adminEmails.push(process.env.SMTP_USER);
      else adminEmails.push('citrinemobilite@gmail.com');
    }

    // Filtrer les collaborateurs actifs (exclusion stricte des superadmins)
    // Sont inclus tous les collaborateurs qui ont des tâches assignées OU qui ont pointé aujourd'hui
    const activeEmployees = employees.filter((emp: any) => {
      const empName = (emp.name || '').toLowerCase();
      const empEmail = (emp.email || '').toLowerCase();
      const empId = String(emp.id || '');
      const status = String(emp.status || '').toLowerCase();
      if (status === 'archived' || status === 'inactif' || status === 'inactive') return false;

      // Exclusion stricte des comptes Super Administrateurs
      if (isStrictSuperAdminAccount(emp, users)) return false;

      // A des tâches assignées
      const hasTasks = tasks.some((t: any) => {
        const assigned = (t.assignedTo || '').toLowerCase();
        return assigned.includes(empName) || assigned.includes(empEmail) || String(t.employeeId || '') === empId;
      });

      // Ou a pointé aujourd'hui
      const hasPresence = presences.some((p: any) => {
        const matchEmp = String(p.employeeId || p.employee_id || '') === empId;
        const pDate = String(p.date || '').split('T')[0];
        return matchEmp && pDate === doualaTime.dayIso;
      });

      return hasTasks || hasPresence;
    });

    console.log(`📋 [CRON 19:30] ${activeEmployees.length} collaborateurs éligibles identifiés pour la transmission.`);

    for (const emp of activeEmployees) {
      const empName = emp.name || 'Collaborateur';
      const empEmail = emp.email || '';
      const empId = emp.id;

      try {
        const empTasks = tasks.filter((t: any) => {
          const assigned = (t.assignedTo || '').toLowerCase();
          return assigned.includes(empName.toLowerCase()) || assigned.includes(empEmail.toLowerCase()) || String(t.employeeId || '') === String(empId);
        });

        let itemIndex = 1;
        const items: TimesheetItem[] = [];
        const blockers: TimesheetBlocker[] = [];
        const managerPoints: TimesheetManagerPoint[] = [];

        empTasks.forEach((t: any) => {
          // Blocages sur la tâche principale
          if (t.incidents && Array.isArray(t.incidents) && t.incidents.length > 0) {
            t.incidents.forEach((inc: any) => {
              blockers.push({
                sourceTask: t.title,
                reason: inc.title || inc.description || 'Incident signalé',
                status: inc.resolved ? 'Résolu' : 'Bloqué',
              });
            });
          } else if (t.status === 'blocked') {
            blockers.push({
              sourceTask: t.title,
              reason: 'Tâche déclarée bloquée',
              status: 'Bloqué',
            });
          }

          // Commentaires
          if (t.comment && typeof t.comment === 'string' && t.comment.trim()) {
            managerPoints.push({
              sourceTask: t.title,
              content: t.comment.trim(),
              author: empName,
            });
          }
          if (Array.isArray(t.comments) && t.comments.length > 0) {
            t.comments.forEach((c: any) => {
              managerPoints.push({
                sourceTask: t.title,
                content: c.text || c.content || '',
                author: c.author || empName,
                time: c.timestamp || '',
              });
            });
          }

          // Sous-tâches ou tâche principale
          if (Array.isArray(t.subtasks) && t.subtasks.length > 0) {
            t.subtasks.forEach((sub: any) => {
              const isBlocked = sub.status === 'blocked' || sub.isBlocked || Boolean(sub.blockerReason);
              items.push({
                index: itemIndex++,
                taskTitle: t.title,
                subTitle: sub.title,
                status: sub.status || (sub.completed ? 'completed' : 'todo'),
                statusLabel: sub.completed ? 'Fait' : (sub.status === 'in_progress' ? 'En cours' : 'À faire'),
                estimatedHours: Number(sub.estimatedHours) || 0,
                actualHours: Number(sub.actualHours) || 0,
                blockerReason: sub.blockerReason,
                isBlocked,
              });

              if (isBlocked) {
                blockers.push({
                  sourceTask: `${sub.title} (sur "${t.title}")`,
                  reason: sub.blockerReason || 'Difficulté opérationnelle signalée',
                  status: 'Bloqué',
                });
              }

              if (Array.isArray(sub.comments)) {
                sub.comments.forEach((c: any) => {
                  managerPoints.push({
                    sourceTask: `${sub.title} (sur "${t.title}")`,
                    content: c.text || c.content || '',
                    author: c.author || empName,
                    time: c.timestamp || '',
                  });
                });
              }
            });
          } else {
            const isBlocked = t.status === 'blocked';
            items.push({
              index: itemIndex++,
              taskTitle: t.title,
              subTitle: t.title,
              status: t.status || 'todo',
              statusLabel: t.status === 'completed' ? 'Fait' : (t.status === 'in_progress' ? 'En cours' : 'À faire'),
              estimatedHours: Number(t.estimatedHours) || 1,
              actualHours: Number(t.actualHours) || 0,
              blockerReason: isBlocked ? 'Tâche bloquée' : undefined,
              isBlocked,
            });
          }
        });

        const totalEstimated = items.reduce((sum, i) => sum + i.estimatedHours, 0);
        const totalActual = items.reduce((sum, i) => sum + i.actualHours, 0);

        const topPriorities = empTasks.slice(0, 3).map((t: any, idx: number) => ({
          id: t.id,
          title: t.title,
          priority: (idx === 0 ? 'P1' : idx === 1 ? 'P2' : 'P3') as 'P1' | 'P2' | 'P3',
          status: t.status === 'completed' ? 'Fait' : (t.status === 'in_progress' ? 'En cours' : 'À faire'),
          isMilestone: !!t.isMilestone,
        }));

        const postponedTasks = empTasks
          .filter((t: any) => t.status !== 'completed')
          .map((t: any) => t.title);

        // Récapitulatif de présence du jour
        const userPres = presences.find((p: any) => {
          const matchEmp = String(p.employeeId || p.employee_id || '') === String(empId);
          const pDate = String(p.date || '').split('T')[0];
          return matchEmp && pDate === doualaTime.dayIso;
        });

        const userIncs = incidents.filter((inc: any) => {
          const matchEmp = String(inc.employeeId || inc.employee_id || '') === String(empId);
          const incDate = String(inc.date || '').split('T')[0];
          return matchEmp && incDate === doualaTime.dayIso;
        });

        const presenceIncidents: any[] = [];
        userIncs.forEach((inc: any) => {
          let label = "Incident de présence";
          if (inc.type === 'retard') label = "Retard à l'arrivée";
          else if (inc.type === 'sortie_professionnelle' || inc.type === 'sortie_prematuree') label = "Sortie en cours de journée";
          else if (inc.type === 'depart_anticipe') label = "Départ anticipé";
          else if (inc.type === 'permission') label = "Permission d'absence";
          else if (inc.type === 'pause_anticipee' || inc.type === 'rallonge_pause') label = "Anomalie pause";
          else if (inc.type === 'absence_injustifiee') label = "Absence non justifiée";

          presenceIncidents.push({
            time: inc.timeString || 'Pointage',
            type: inc.type || 'autre',
            label,
            description: inc.reason || inc.description || 'Anomalie signalée',
            isJustified: inc.isJustified || inc.status === 'justifie',
          });
        });

        let dailyAttendance: any = undefined;
        if (userPres) {
          const isLate = userPres.status === 'late' || isArrivalAfterThreshold(userPres.arrivalTime, lateThreshold);
          const workedH = userPres.hoursWorked ? `${userPres.hoursWorked}h` : undefined;

          // Retard constaté
          if (isLate && !presenceIncidents.some((p) => p.type === 'retard')) {
            presenceIncidents.push({
              time: userPres.arrivalTime || 'Matin',
              type: 'retard',
              label: "Retard à l'arrivée",
              description: `Arrivée constatée à ${userPres.arrivalTime || 'retard'} (au lieu de ${lateThreshold})${userPres.correctionReason ? ` — Motif : ${userPres.correctionReason}` : ''}`,
              isJustified: Boolean(userPres.correctionReason && userPres.correctionReasonStatus === 'approved'),
            });
          }

          // Sortie temporaire
          if (userPres.sortieProStart && !presenceIncidents.some((p) => p.type.includes('sortie'))) {
            presenceIncidents.push({
              time: userPres.sortieProStart,
              type: 'sortie',
              label: "Sortie temporaire",
              description: `Sortie de ${userPres.sortieProStart} à ${userPres.sortieProEnd || 'en cours'}${userPres.sortieProReason ? ` — Motif : ${userPres.sortieProReason}` : ''}`,
              isJustified: true,
            });
          }

          // Départ anticipé
          if (userPres.departureTime && userPres.departureTime < '17:00' && userPres.departureReason && !presenceIncidents.some((p) => p.type.includes('depart'))) {
            presenceIncidents.push({
              time: userPres.departureTime,
              type: 'depart_anticipe',
              label: "Départ anticipé",
              description: `Départ enregistré à ${userPres.departureTime} (avant 17h00) — Motif : ${userPres.departureReason}`,
              isJustified: userPres.departureReasonStatus === 'approved',
            });
          }

          dailyAttendance = {
            statusLabel: isLate ? 'Retard' : (userPres.status === 'mission' ? 'En mission' : 'Présent'),
            statusType: isLate ? 'late' : (userPres.status || 'present'),
            arrivalTime: userPres.arrivalTime,
            pauseStart: userPres.pauseStart || '12:00',
            pauseEnd: userPres.pauseEnd || '13:00',
            departureTime: userPres.departureTime || '17:00',
            hoursWorkedText: workedH,
            location: userPres.location || 'Douala',
            incidentNote: userPres.correctionReason || userPres.adminBadgeReason,
            incidents: presenceIncidents,
          };
        } else {
          dailyAttendance = {
            statusLabel: 'Non pointé',
            statusType: 'absent',
            pauseStart: '12:00',
            pauseEnd: '13:00',
            location: 'Douala',
            incidents: presenceIncidents,
          };
        }

        const timesheetData = {
          employeeName: empName,
          employeeEmail: empEmail,
          employeeId: empId,
          department: emp.department || 'Direction Générale',
          dateStr: doualaTime.dateOnly,
          timeStr: doualaTime.timeOnly,
          dailyAttendance,
          presenceIncidents,
          items,
          blockers,
          managerPoints,
          totalEstimatedHours: totalEstimated,
          totalActualHours: totalActual,
          topPriorities,
          postponedTasks,
        };

        const htmlContent = buildTimesheetHtmlReport(timesheetData);
        const excelBuffer = buildTimesheetExcelBuffer(timesheetData);

        const safeCollabName = empName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
        const safeDate = doualaTime.dayIso.replace(/-/g, '_');
        const excelFilename = `feuille_de_temps_${safeCollabName}_${safeDate}.xlsx`;

        await sendThreadedEmployeeEmail({
          employeeName: empName,
          employeeId: empId,
          employeeEmail: empEmail,
          eventTitle: `Feuille de temps`,
          threadCategory: 'timesheet',
          threadSubject: `Feuille de temps - ${empName}`,
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
        console.log(`✅ [CRON 19:30] Feuille de temps envoyée pour ${empName} (${empEmail}).`);
      } catch (empErr: any) {
        const msg = `Erreur envoi feuille pour ${empName}: ${empErr?.message || String(empErr)}`;
        console.error(`❌ [CRON 19:30 Error]:`, msg);
        errors.push(msg);
      }
    }

    return {
      success: errors.length === 0,
      message: `Feuilles de temps transmises avec succès pour ${sentEmployees.length} collaborateur(s).`,
      processedCount: sentEmployees.length,
      sentEmployees,
      errors,
      timestamp: doualaTime.fullDateStr,
    };
  } catch (error: any) {
    const rawError = error?.message || String(error);
    console.error(`💥 [executeDailyTimesheetDispatch Critical Error]:`, error);
    return {
      success: false,
      message: `Erreur critique lors de l'exécution du cron : ${rawError}`,
      processedCount: sentEmployees.length,
      sentEmployees,
      errors: [rawError, ...errors],
      timestamp: doualaTime.fullDateStr,
    };
  }
}
