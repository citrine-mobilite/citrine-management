import { getCollectionData } from '../db/repository';
import { 
  sendConsolidatedReportEmail, 
  parseEmailList, 
  getEffectiveSmtpConfig 
} from './serverMailService';

export interface DayPresenceRecord {
  dayName: string; // "Lundi", "Mardi", etc.
  dateStr: string; // "2026-10-26"
  formattedDate: string; // "26/10"
  arrivalTime?: string;
  pauseStart?: string;
  pauseEnd?: string;
  departureTime?: string;
  workedHoursText: string;
  workedHoursNumber: number;
  statusLabel: string;
  statusType: 'on_time' | 'late' | 'absent' | 'mission' | 'leave' | 'future' | 'unknown';
  location?: string;
  notes?: string;
}

export interface EmployeeWeeklySummary {
  employeeId: string;
  employeeName: string;
  employeeEmail?: string;
  department: string;
  position: string;
  days: DayPresenceRecord[];
  totalWorkedHours: number;
  totalWorkedHoursText: string;
  daysWorkedCount: number;
  totalDaysExpected: number;
  latenessCount: number;
  attendanceRate: number; // en %
}

export interface WeeklyAttendanceReportData {
  title: string;
  startDateStr: string; // e.g. "Lundi 26 Octobre 2026"
  endDateStr: string; // e.g. "Mercredi 28 Octobre 2026"
  isFullWeek: boolean;
  isManualTrigger: boolean;
  generatedAtStr: string;
  totalCollaborators: number;
  totalCollectiveHoursText: string;
  averageAttendanceRate: number;
  totalLateness: number;
  summaries: EmployeeWeeklySummary[];
}

/**
 * Calcule les dates de la semaine courante (du Lundi jusqu'au jour cible ou vendredi)
 * selon le fuseau horaire de Douala (WAT / UTC+1)
 */
export function getDoualaCurrentWeek(referenceDate: Date = new Date(), options?: { forceFriday?: boolean }) {
  // Convertir en heure de Douala
  const doualaFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Douala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = doualaFormatter.formatToParts(referenceDate);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '2026', 10);
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '1', 10) - 1;
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '1', 10);

  const localDate = new Date(year, month, day);
  const dayOfWeek = localDate.getDay(); // 0: Dimanche, 1: Lundi, ..., 5: Vendredi, 6: Samedi

  // Calculer le Lundi de cette même semaine
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(localDate);
  monday.setDate(localDate.getDate() + diffToMonday);

  // Déterminer la date de fin : soit Vendredi (si forceFriday ou si après vendredi), soit aujourd'hui
  let targetEndDay = dayOfWeek;
  if (options?.forceFriday || dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek >= 5) {
    targetEndDay = 5; // Vendredi
  } else if (targetEndDay < 1) {
    targetEndDay = 1;
  }

  const days: Array<{
    date: Date;
    dateIso: string;
    dayName: string;
    isToday: boolean;
    isPastOrToday: boolean;
  }> = [];

  const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);

    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const isPastOrToday = (i + 1) <= targetEndDay;
    const isToday = (i + 1) === dayOfWeek;

    days.push({
      date: d,
      dateIso: iso,
      dayName: dayNames[i],
      isToday,
      isPastOrToday,
    });
  }

  const mondayIso = days[0].dateIso;
  const endDayItem = days[Math.min(targetEndDay - 1, 4)];
  const endDateIso = endDayItem ? endDayItem.dateIso : days[4].dateIso;

  const dateFrFormatter = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return {
    mondayDate: days[0].date,
    mondayIso,
    mondayLabel: `${days[0].dayName} ${dateFrFormatter.format(days[0].date)}`,
    endDate: endDayItem.date,
    endDateIso,
    endLabel: `${endDayItem.dayName} ${dateFrFormatter.format(endDayItem.date)}`,
    targetEndDay,
    isFullWeek: targetEndDay >= 5,
    days,
  };
}

/**
 * Calcule la durée de travail en heures décimales entre arrivée et départ
 */
function calculateHoursWorked(arrival?: string, departure?: string, pauseStart?: string, pauseEnd?: string): number {
  if (!arrival) return 0;

  const parseMins = (timeStr?: string) => {
    if (!timeStr || !timeStr.includes(':')) return null;
    const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10));
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  };

  const arrMins = parseMins(arrival);
  if (arrMins === null) return 0;

  let depMins = parseMins(departure);
  if (depMins === null) {
    // Si pas encore parti (ex: en cours de journée), considérer 8h théoriques ou 0
    return 0;
  }

  let totalMins = depMins - arrMins;

  // Déduire pause si renseignée
  const pStartMins = parseMins(pauseStart);
  const pEndMins = parseMins(pauseEnd);
  if (pStartMins !== null && pEndMins !== null && pEndMins > pStartMins) {
    totalMins -= (pEndMins - pStartMins);
  }

  return Math.max(0, Math.round((totalMins / 60) * 10) / 10);
}

function formatHours(hours: number): string {
  if (hours <= 0) return '0h';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, '0')}`;
}

/**
 * Analyse et consolide les données de présence pour tous les collaborateurs
 */
export async function compileWeeklyAttendanceData(options?: {
  manual?: boolean;
  forceFriday?: boolean;
  referenceDate?: Date;
}): Promise<WeeklyAttendanceReportData> {
  const weekInfo = getDoualaCurrentWeek(options?.referenceDate, { forceFriday: options?.forceFriday });
  
  const employees = await getCollectionData('employees');
  const presences = await getCollectionData('presences');
  const incidents = await getCollectionData('attendance_incidents');

  // Filtrer les employés actifs
  const activeEmployees = employees.filter((e: any) => {
    const status = String(e.status || '').toLowerCase();
    return status !== 'archived' && status !== 'inactif' && status !== 'inactive';
  });

  const nowFrStr = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Africa/Douala',
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date());

  const summaries: EmployeeWeeklySummary[] = [];

  for (const emp of activeEmployees) {
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
      // Ne considérer pour les totaux attendus que les jours jusqu'à la date cible
      const isElapsed = d.isPastOrToday;

      // Recherche du pointage du jour pour cet employé
      const p = presences.find((item: any) => {
        const matchEmp = String(item.employeeId || item.employee_id || '') === empId;
        const pDate = String(item.date || '').split('T')[0];
        return matchEmp && pDate === d.dateIso;
      });

      // Recherche d'incident éventuel
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

        // Calcul des heures
        if (p.hoursWorked && Number(p.hoursWorked) > 0) {
          workedHours = Number(p.hoursWorked);
        } else {
          workedHours = calculateHoursWorked(arr, dep, pStart, pEnd);
          if (workedHours === 0 && arr && !dep && d.isToday) {
            // En cours aujourd'hui
            workedHours = 4.0; // estimation provisoire de journée en cours
          }
        }

        const isLate = p.status === 'late' || (arr && arr > '08:00') || (inc && inc.type === 'late');
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
        // Jour passé mais aucun pointage enregistré
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
        workedHoursText: workedHours > 0 ? formatHours(workedHours) : (statusType === 'future' ? '—' : '0h'),
        workedHoursNumber: workedHours,
        statusLabel,
        statusType,
        location: p?.location || 'Douala',
        notes: inc?.description || p?.adminBadgeReason || p?.correctionReason,
      });
    }

    const attendanceRate = weekInfo.targetEndDay > 0
      ? Math.min(100, Math.round((employeeDaysWorked / weekInfo.targetEndDay) * 100))
      : 0;

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

  // Statistiques collectives
  const totalCollectiveHours = summaries.reduce((sum, s) => sum + s.totalWorkedHours, 0);
  const totalLateness = summaries.reduce((sum, s) => sum + s.latenessCount, 0);
  const avgAttendance = summaries.length > 0
    ? Math.round(summaries.reduce((sum, s) => sum + s.attendanceRate, 0) / summaries.length)
    : 0;

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
    summaries,
  };
}

/**
 * Construit l'e-mail HTML officiel Citrine consolidé pour toute l'équipe
 * UN SEUL MAIL avec le rapport détaillé de chaque collaborateur (X, Y, Z...)
 */
export function buildWeeklyConsolidatedEmailHtml(data: WeeklyAttendanceReportData): string {
  const badgeColor = data.isManualTrigger ? '#0284c7' : '#164e4b';
  const badgeText = data.isManualTrigger 
    ? 'Point d’Étape en Cours de Semaine' 
    : 'Bilan Hebdomadaire Officiel (Clôture)';

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 30px 10px;">
    <tr>
      <td align="center">
        
        <table role="presentation" width="100%" style="max-width: 860px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e4e4e7; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);" cellspacing="0" cellpadding="0">
          
          <!-- EN-TÊTE SUPÉRIEUR CITRINE MOBILITÉ -->
          <tr>
            <td style="background: linear-gradient(135deg, #164e4b 0%, #064e3b 100%); padding: 30px; text-align: left; color: #ffffff;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-family: Georgia, serif; font-size: 24px; font-weight: bold; letter-spacing: 0.5px;">
                      CITRINE MOBILITÉ
                    </div>
                    <div style="font-size: 11px; color: #a7f3d0; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-top: 3px;">
                      Direction des Ressources Humaines &amp; Opérations
                    </div>
                  </td>
                  <td align="right" style="vertical-align: top;">
                    <span style="display: inline-block; background-color: rgba(255,255,255,0.18); color: #ffffff; font-size: 10px; font-weight: bold; padding: 6px 12px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.3);">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
              </table>
              
              <div style="margin-top: 22px; padding-top: 18px; border-top: 1px solid rgba(255,255,255,0.2);">
                <h1 style="margin: 0; font-size: 20px; font-weight: 800; line-height: 1.3;">
                  ${data.title}
                </h1>
                <div style="font-size: 12px; color: #ccfbf1; margin-top: 6px;">
                  Période analysée : <strong>${data.startDateStr}</strong> au <strong>${data.endDateStr}</strong>
                </div>
              </div>
            </td>
          </tr>

          <!-- NOTE D'ENVOI CONSOLIDÉ & COPIE GÉNÉRALE -->
          <tr>
            <td style="background-color: #f0fdf4; border-bottom: 1px solid #bbf7d0; padding: 14px 30px; font-size: 12px; color: #166534; line-height: 1.5;">
              📢 <strong>Information Équipe :</strong> Ce rapport unique consolidé regroupe l’assiduité de l’ensemble des collaborateurs pour la semaine. Les responsables ont reçu le rapport en destinataires principaux et l’ensemble des collaborateurs sont en copie (CC) pour transparence opérationnelle.
            </td>
          </tr>

          <!-- KPI FLASH COLLECTIFS -->
          <tr>
            <td style="padding: 24px 30px 10px 30px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: separate; border-spacing: 10px 0;">
                <tr>
                  <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: center; width: 25%;">
                    <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Collaborateurs</div>
                    <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 4px;">${data.totalCollaborators}</div>
                    <div style="font-size: 10px; color: #10b981; font-weight: 600; margin-top: 2px;">Actifs suivis</div>
                  </td>
                  <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: center; width: 25%;">
                    <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Heures Équipe</div>
                    <div style="font-size: 20px; font-weight: 800; color: #164e4b; margin-top: 4px;">${data.totalCollectiveHoursText}</div>
                    <div style="font-size: 10px; color: #64748b; font-weight: 600; margin-top: 2px;">Temps cumulé</div>
                  </td>
                  <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: center; width: 25%;">
                    <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Assiduité Moy.</div>
                    <div style="font-size: 20px; font-weight: 800; color: #0284c7; margin-top: 4px;">${data.averageAttendanceRate}%</div>
                    <div style="font-size: 10px; color: #64748b; font-weight: 600; margin-top: 2px;">Présence globale</div>
                  </td>
                  <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: center; width: 25%;">
                    <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Retards Signalés</div>
                    <div style="font-size: 20px; font-weight: 800; color: ${data.totalLateness > 0 ? '#b91c1c' : '#10b981'}; margin-top: 4px;">${data.totalLateness}</div>
                    <div style="font-size: 10px; color: #64748b; font-weight: 600; margin-top: 2px;">Sur la période</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CORPS PRINCIPAL : DÉTAIL PAR COLLABORATEUR (COLLABORATEUR X, COLLABORATEUR Y...) -->
          <tr>
            <td style="padding: 20px 30px;">
              
              <div style="font-size: 13px; font-weight: 800; color: #164e4b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; border-bottom: 2px solid #164e4b; padding-bottom: 6px;">
                📋 Registre Individuel Détaillé par Collaborateur
              </div>

              ${data.summaries.map((emp, idx) => {
                const initial = (emp.employeeName || 'C').substring(0, 2).toUpperCase();
                const rateColor = emp.attendanceRate >= 80 ? '#10b981' : emp.attendanceRate >= 50 ? '#d97706' : '#ef4444';

                return `
                  <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; margin-bottom: 20px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.03);">
                    
                    <!-- En-tête fiche collaborateur -->
                    <div style="background-color: #f8fafc; padding: 12px 16px; border-bottom: 1px solid #e2e8f0;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="vertical-align: middle;">
                            <table role="presentation" cellspacing="0" cellpadding="0">
                              <tr>
                                <td style="width: 36px; height: 36px; background-color: #164e4b; color: #ffffff; font-weight: 800; font-size: 12px; border-radius: 10px; text-align: center; vertical-align: middle;">
                                  ${initial}
                                </td>
                                <td style="padding-left: 12px; vertical-align: middle;">
                                  <div style="font-size: 14px; font-weight: 800; color: #0f172a;">
                                    ${emp.employeeName}
                                  </div>
                                  <div style="font-size: 11px; color: #64748b;">
                                    ${emp.position} • <span style="color: #164e4b; font-weight: 600;">${emp.department}</span>
                                    ${emp.employeeEmail ? ` • <span style="font-family: monospace; font-size: 10px;">${emp.employeeEmail}</span>` : ''}
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td align="right" style="vertical-align: middle;">
                            <span style="display: inline-block; background-color: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; margin-right: 6px;">
                              ⏱️ ${emp.totalWorkedHoursText}
                            </span>
                            <span style="display: inline-block; background-color: #f1f5f9; border: 1px solid #cbd5e1; color: #334155; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px;">
                              📅 ${emp.daysWorkedCount}/${emp.totalDaysExpected} j. (${emp.attendanceRate}%)
                            </span>
                            ${emp.latenessCount > 0 ? `
                              <span style="display: inline-block; background-color: #fef2f2; border: 1px solid #fecaca; color: #991b1b; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; margin-left: 6px;">
                                ⚠️ ${emp.latenessCount} retard${emp.latenessCount > 1 ? 's' : ''}
                              </span>
                            ` : ''}
                          </td>
                        </tr>
                      </table>
                    </div>

                    <!-- Grille des pointages Lundi -> Vendredi -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 11.5px; border-collapse: collapse; text-align: left;">
                      <thead>
                        <tr style="background-color: #f1f5f9; color: #475569; font-size: 10px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">
                          <th style="padding: 8px 14px;">Jour</th>
                          <th style="padding: 8px 10px;">Arrivée</th>
                          <th style="padding: 8px 10px;">Pause / Reprise</th>
                          <th style="padding: 8px 10px;">Départ</th>
                          <th style="padding: 8px 10px; text-align: right;">Heures</th>
                          <th style="padding: 8px 14px; text-align: center;">Statut</th>
                        </tr>
                      </thead>
                      <tbody style="color: #334155;">
                        ${emp.days.map((day, dIdx) => {
                          let badgeBg = '#f1f5f9';
                          let badgeColor = '#475569';
                          let badgeBorder = '#cbd5e1';

                          if (day.statusType === 'on_time') {
                            badgeBg = '#d1fae5';
                            badgeColor = '#065f46';
                            badgeBorder = '#a7f3d0';
                          } else if (day.statusType === 'late') {
                            badgeBg = '#fef3c7';
                            badgeColor = '#92400e';
                            badgeBorder = '#fde68a';
                          } else if (day.statusType === 'mission') {
                            badgeBg = '#e0e7ff';
                            badgeColor = '#3730a3';
                            badgeBorder = '#c7d2fe';
                          } else if (day.statusType === 'leave') {
                            badgeBg = '#f3e8ff';
                            badgeColor = '#6b21a8';
                            badgeBorder = '#e9d5ff';
                          } else if (day.statusType === 'absent') {
                            badgeBg = '#fee2e2';
                            badgeColor = '#991b1b';
                            badgeBorder = '#fecaca';
                          } else if (day.statusType === 'future') {
                            badgeBg = '#f8fafc';
                            badgeColor = '#94a3b8';
                            badgeBorder = '#e2e8f0';
                          }

                          const pauseStr = day.pauseStart && day.pauseEnd
                            ? `${day.pauseStart} - ${day.pauseEnd}`
                            : (day.pauseStart ? `Dès ${day.pauseStart}` : '—');

                          return `
                            <tr style="border-bottom: 1px solid #f1f5f9; ${dIdx % 2 === 1 ? 'background-color: #fafaf9;' : ''}">
                              <td style="padding: 8px 14px; font-weight: 700; color: #1e293b;">
                                ${day.dayName} <span style="font-weight: normal; color: #64748b; font-size: 10px;">(${day.formattedDate})</span>
                              </td>
                              <td style="padding: 8px 10px; font-family: monospace; font-weight: 600; color: ${day.arrivalTime !== '—' ? '#0f172a' : '#94a3b8'};">
                                ${day.arrivalTime}
                              </td>
                              <td style="padding: 8px 10px; font-family: monospace; font-size: 10.5px; color: #64748b;">
                                ${pauseStr}
                              </td>
                              <td style="padding: 8px 10px; font-family: monospace; font-weight: 600; color: ${day.departureTime !== '—' ? '#0f172a' : '#94a3b8'};">
                                ${day.departureTime}
                              </td>
                              <td style="padding: 8px 10px; text-align: right; font-family: monospace; font-weight: 700; color: #164e4b;">
                                ${day.workedHoursText}
                              </td>
                              <td style="padding: 8px 14px; text-align: center;">
                                <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 9.5px; font-weight: 700; background-color: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder};">
                                  ${day.statusLabel}
                                </span>
                              </td>
                            </tr>
                          `;
                        }).join('')}
                      </tbody>
                    </table>

                  </div>
                `;
              }).join('')}

            </td>
          </tr>

          <!-- PIED DE PAGE OFFICIEL -->
          <tr>
            <td style="background-color: #fafaf9; border-top: 1px solid #e4e4e7; padding: 24px 30px; text-align: center; font-size: 11px; color: #71717a;">
              <div style="font-weight: 700; color: #3f3f46; font-size: 12px; margin-bottom: 4px;">
                Citrine Mobilité — Douala, Cameroun
              </div>
              <div>
                Généré automatiquement par le Système Intégré RH &amp; Pointage le ${data.generatedAtStr}
              </div>
              <div style="font-size: 10px; color: #a1a1aa; margin-top: 6px;">
                Notification interne confidentielle • Strictement réservée aux collaborateurs et à la direction
              </div>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Orchestrateur complet pour générer et expédier le récapitulatif hebdomadaire :
 * - Destinataires : Managers / Responsables RH
 * - Copie (CC) : TOUS les collaborateurs actifs
 */
export async function sendWeeklyConsolidatedReport(options?: {
  manual?: boolean;
  forceFriday?: boolean;
  referenceDate?: Date;
  testRecipient?: string;
}): Promise<{
  success: boolean;
  message: string;
  recipients?: string[];
  ccCount?: number;
  ccRecipients?: string[];
  reportData?: WeeklyAttendanceReportData;
  error?: string;
  details?: any;
}> {
  try {
    const reportData = await compileWeeklyAttendanceData(options);
    const htmlContent = buildWeeklyConsolidatedEmailHtml(reportData);

    const config = await getEffectiveSmtpConfig();
    const employees = await getCollectionData('employees');
    const users = await getCollectionData('users');

    // Destinataires principaux : RH / Administrateurs
    let recipients: string[] = [];
    if (options?.testRecipient) {
      recipients = parseEmailList(options.testRecipient);
    } else {
      const admins = users.filter((u: any) => u.role_id === 1 || u.role === 'administrateur' || String(u.raw_data?.role).toLowerCase().includes('admin'));
      const adminEmails = admins.map((a: any) => a.email).filter(Boolean);
      recipients = Array.from(new Set([...adminEmails, ...parseEmailList(config.hrEmail)]));
    }

    if (recipients.length === 0) {
      if (process.env.SMTP_USER) recipients.push(process.env.SMTP_USER);
      else recipients.push('citrinemobilite@gmail.com');
    }

    // Copie (CC) : TOUS les collaborateurs actifs possédant une adresse email
    const activeEmployees = employees.filter((e: any) => {
      const status = String(e.status || '').toLowerCase();
      return status !== 'archived' && status !== 'inactif' && status !== 'inactive' && Boolean(e.email);
    });

    const ccEmails = activeEmployees
      .map((e: any) => (e.email || '').trim())
      .filter((mail: string) => mail && mail.includes('@'));

    console.log(`📧 [RAPPORT HEBDO PRÉSENCES] Préparation envoi : To: ${recipients.join(', ')} | CC: ${ccEmails.length} collaborateurs.`);

    const sendRes = await sendConsolidatedReportEmail({
      subject: reportData.title,
      title: reportData.title,
      htmlContent,
      recipientEmails: recipients,
      ccEmails,
    });

    if (!sendRes.success) {
      return {
        success: false,
        message: sendRes.error || "Échec de l'envoi de l'e-mail du rapport hebdomadaire.",
        error: sendRes.error,
        details: sendRes.details,
      };
    }

    return {
      success: true,
      message: `Rapport hebdomadaire des présences envoyé avec succès aux responsables, et mis en copie à ${ccEmails.length} collaborateurs.`,
      recipients: sendRes.recipients,
      ccCount: ccEmails.length,
      ccRecipients: sendRes.ccRecipients,
      reportData,
    };
  } catch (err: any) {
    const rawError = err?.message || String(err);
    console.error(`💥 [sendWeeklyConsolidatedReport EXCEPTION]:`, err);
    return {
      success: false,
      message: `Erreur inattendue lors de la génération du rapport : ${rawError}`,
      error: rawError,
      details: err,
    };
  }
}
