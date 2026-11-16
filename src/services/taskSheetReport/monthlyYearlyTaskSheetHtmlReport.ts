import { MonthlyTaskSheetData, YearlyTaskSheetData } from '../taskSheet/taskSheetTypes';
import { buildOutlookHtmlDocument } from '../mail/outlookEmailShell';
import {
  buildOfficialEmailCompanyFooterHtml,
  buildOfficialEmailCompanyHeaderHtml,
} from './citrineOfficialEmailHeaderFooter';

function esc(val: unknown): string {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getCalendarCellColors(status: string, isWeekend: boolean) {
  if (status === 'Présent' || status === 'Mission') {
    return {
      code: status === 'Mission' ? 'M' : 'P',
      bg: '#ecfdf5',
      border: '#a7f3d0',
      badgeBg: '#d1fae5',
      badgeText: '#065f46',
      text: '#064e3b',
    };
  }
  if (status === 'En retard') {
    return {
      code: 'R',
      bg: '#fffbeb',
      border: '#fde68a',
      badgeBg: '#fef3c7',
      badgeText: '#92400e',
      text: '#78350f',
    };
  }
  if (status === 'Absent') {
    return {
      code: 'A',
      bg: '#fff1f2',
      border: '#fecdd3',
      badgeBg: '#ffe4e6',
      badgeText: '#9f1239',
      text: '#881337',
    };
  }
  if (isWeekend) {
    return {
      code: 'WE',
      bg: '#f8fafc',
      border: '#e2e8f0',
      badgeBg: '#f1f5f9',
      badgeText: '#94a3b8',
      text: '#94a3b8',
    };
  }
  return {
    code: '—',
    bg: '#ffffff',
    border: '#e2e8f0',
    badgeBg: '#f1f5f9',
    badgeText: '#64748b',
    text: '#64748b',
  };
}

/**
 * Génère le rapport HTML compatible Outlook/Gmail pour la Synthèse Mensuelle (avec calendrier & sous-tâches)
 */
export function buildMonthlyTaskSheetHtmlReport(data: MonthlyTaskSheetData): string {
  const employeeName = esc(data.employee?.name || 'Collaborateur');
  const dept = esc(data.employee?.department || 'Général');
  const monthLabel = esc(data.monthName || data.month);
  const days = data.dailyBreakdown || [];

  const presentCount =
    data.presentDays ?? days.filter((d) => d.status === 'Présent' || d.status === 'Mission').length;
  const lateCount = data.lateDays ?? days.filter((d) => d.status === 'En retard').length;
  const absentCount = data.absentDays ?? days.filter((d) => d.status === 'Absent').length;
  const activeDays = days.filter((d) => d.status !== '-' || d.hoursWorked > 0 || d.tasksDoneCount > 0);
  const subtasksDone = data.completedSubtasksCount || data.totalTasksCompleted || 0;
  const subtasksTotal = data.totalSubtasksCount || data.totalTasksAssigned || 0;
  const completedParents = (data.tasksList || []).filter((t) => t.status === 'completed').length;
  const totalTasksDoneInDays = days.reduce((acc, d) => acc + (d.tasksDoneCount || 0), 0);
  const workingDaysInMonth =
    data.workingDaysInMonth ||
    days.filter((d) => {
      const dow = new Date(d.date + 'T12:00:00').getDay();
      return dow >= 1 && dow <= 5;
    }).length;
  const weekendDaysWorked = data.weekendDaysWorked ?? 0;

  let leadingEmptySlots = 0;
  if (days.length > 0) {
    const firstDate = new Date(days[0].date + 'T12:00:00');
    const jsDay = firstDate.getDay();
    leadingEmptySlots = jsDay === 0 ? 6 : jsDay - 1;
  }

  const calendarCells: Array<typeof days[number] | null> = [
    ...Array.from({ length: leadingEmptySlots }, () => null),
    ...days,
  ];
  while (calendarCells.length % 7 !== 0) {
    calendarCells.push(null);
  }

  const calendarRowsHtml: string[] = [];
  for (let i = 0; i < calendarCells.length; i += 7) {
    const week = calendarCells.slice(i, i + 7);
    const tds = week
      .map((cell) => {
        if (!cell) {
          return `<td width="14%" bgcolor="#f8fafc" style="background-color: #f8fafc; border: 1px solid #e2e8f0; height: 48px; padding: 4px;">&nbsp;</td>`;
        }
        const dayNum = cell.date.slice(8, 10);
        const dateObj = new Date(cell.date + 'T12:00:00');
        const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
        const st = getCalendarCellColors(cell.status, isWeekend);
        const hoursInfo =
          cell.arrivalTime !== '-'
            ? `${esc(cell.arrivalTime)}${cell.departureTime !== '-' ? `-${esc(cell.departureTime)}` : ''}`
            : cell.hoursWorked > 0
            ? `${cell.hoursWorked}h`
            : '';

        return `
          <td width="14%" valign="top" bgcolor="${st.bg}" style="background-color: ${st.bg}; border: 1px solid ${st.border}; padding: 5px; height: 48px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="font-size: 11px; font-weight: 800; color: ${st.text};">${dayNum}</td>
                <td align="right">
                  <span style="display: inline-block; background-color: ${st.badgeBg}; color: ${st.badgeText}; font-size: 9px; font-weight: 800; padding: 1px 4px;">${st.code}</span>
                </td>
              </tr>
            </table>
            ${hoursInfo ? `<div style="font-size: 8.5px; color: ${st.text}; font-family: Consolas, monospace; margin-top: 3px;">${hoursInfo}</div>` : ''}
            ${cell.tasksDoneCount > 0 ? `<div style="font-size: 9px; font-weight: 800; color: #164e4b; margin-top: 2px;">${cell.tasksDoneCount} s.t.</div>` : ''}
          </td>
        `;
      })
      .join('');
    calendarRowsHtml.push(`<tr>${tds}</tr>`);
  }

  const tasksHtml =
    (data.tasksList || []).length > 0
      ? (data.tasksList || [])
          .map((t) => {
            const isDone = t.status === 'completed';
            const statusBg = isDone ? '#d1fae5' : t.status === 'blocked' ? '#fee2e2' : '#dbeafe';
            const statusCol = isDone ? '#065f46' : t.status === 'blocked' ? '#991b1b' : '#1e40af';
            const statusLabel = isDone ? 'Terminée' : t.status === 'blocked' ? 'Bloquée' : 'En cours';

            const subsRows =
              t.subtasks && t.subtasks.length > 0
                ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin-top: 6px; border-top: 1px solid #e2e8f0;">
                    ${t.subtasks
                      .map((s) => {
                        const subBg = s.completed ? '#ecfdf5' : s.status === 'in_progress' ? '#fffbeb' : '#f8fafc';
                        const subCol = s.completed ? '#065f46' : s.status === 'in_progress' ? '#92400e' : '#475569';
                        const subLbl = s.completed ? 'Validée' : s.status === 'in_progress' ? 'En cours' : 'À faire';
                        return `
                          <tr>
                            <td style="padding: 4px 6px 4px 12px; font-size: 11px; color: ${s.completed ? '#64748b' : '#1e293b'}; ${s.completed ? 'text-decoration: line-through;' : 'font-weight: 600;'} border-bottom: 1px solid #f1f5f9;">
                              • ${esc(s.title)}
                            </td>
                            <td align="right" width="80" style="padding: 4px 6px; font-size: 10px; color: #64748b; font-family: Consolas, monospace; border-bottom: 1px solid #f1f5f9;">
                              ${s.estimatedHours ? `${s.estimatedHours}h` : '—'}
                            </td>
                            <td align="right" width="80" style="padding: 4px 6px; border-bottom: 1px solid #f1f5f9;">
                              <span style="display: inline-block; padding: 1px 6px; font-size: 9.5px; font-weight: 700; background-color: ${subBg}; color: ${subCol};">${subLbl}</span>
                            </td>
                          </tr>
                        `;
                      })
                      .join('')}
                  </table>`
                : '';

            return `
              <tr>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; background-color: #ffffff;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td class="email-stack" style="vertical-align: middle;">
                        <span style="display: inline-block; padding: 2px 7px; font-size: 10px; font-weight: 700; background-color: ${statusBg}; color: ${statusCol}; margin-right: 6px;">${statusLabel}</span>
                        <strong style="font-size: 12px; color: #0f172a;">${esc(t.title)}</strong>
                        ${t.isMilestone ? `<span style="margin-left: 6px; font-size: 10px; font-weight: 700; color: #b45309;">[Jalon]</span>` : ''}
                      </td>
                      <td align="right" class="email-stack-left" style="vertical-align: middle; font-family: Consolas, monospace; font-size: 11px; font-weight: 700; color: #164e4b;">
                        ${t.completedSubtasks}/${t.totalSubtasks} sous-tâches (${t.completionPercentage}%)
                      </td>
                    </tr>
                  </table>
                  ${subsRows}
                </td>
              </tr>
            `;
          })
          .join('')
      : `<tr><td style="padding: 14px; text-align: center; color: #64748b; font-style: italic;">Aucune tâche enregistrée sur ce mois.</td></tr>`;

  const innerHtml = `
    <tr>
      <td bgcolor="#ffffff" class="email-pad" style="background-color: #ffffff; padding: 22px; font-size: 12px; color: #1c1917;">
        ${buildOfficialEmailCompanyHeaderHtml(
          `FEUILLE DE TÂCHES MENSUELLE — ${monthLabel}`,
          `<div><strong>Collaborateur :</strong> ${employeeName}</div>
           <div><strong>Département :</strong> ${dept} • <strong>Site :</strong> Douala</div>
           <div><strong>Période :</strong> ${esc(data.month)}</div>`
        )}

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f8fafc" style="width: 100%; background-color: #f8fafc; border: 1px solid #cbd5e1; margin-bottom: 16px;">
          <tr>
            <td width="25%" align="center" style="padding: 10px 6px; border-right: 1px solid #cbd5e1;">
              <div style="font-size: 9.5px; color: #64748b; font-weight: 800; text-transform: uppercase;">Assiduité &amp; Volume</div>
              <div style="font-size: 18px; font-weight: 900; color: #164e4b; margin: 4px 0 2px 0;">${data.totalDaysWorked}j/${workingDaysInMonth}j · ${data.totalHoursWorked}h</div>
              <div style="font-size: 10px; color: #64748b; font-weight: 600;">${presentCount} P · ${lateCount} R · ${absentCount} A${weekendDaysWorked > 0 ? ` · +${weekendDaysWorked}j WE` : ''}</div>
            </td>
            <td width="25%" align="center" style="padding: 10px 6px; border-right: 1px solid #cbd5e1;">
              <div style="font-size: 9.5px; color: #64748b; font-weight: 800; text-transform: uppercase;">Rendement Sous-Tâches</div>
              <div style="font-size: 18px; font-weight: 900; color: #2A7B76; margin: 4px 0 2px 0;">${data.completionRate}%</div>
              <div style="font-size: 10px; color: #059669; font-weight: 700;">${subtasksDone}/${subtasksTotal} validées</div>
            </td>
            <td width="25%" align="center" style="padding: 10px 6px; border-right: 1px solid #cbd5e1;">
              <div style="font-size: 9.5px; color: #64748b; font-weight: 800; text-transform: uppercase;">Sous-Tâches Clôturées</div>
              <div style="font-size: 18px; font-weight: 900; color: #059669; margin: 4px 0 2px 0;">${subtasksDone} / ${subtasksTotal}</div>
              <div style="font-size: 10px; color: #64748b; font-weight: 600;">${totalTasksDoneInDays} datées</div>
            </td>
            <td width="25%" align="center" style="padding: 10px 6px;">
              <div style="font-size: 9.5px; color: #64748b; font-weight: 800; text-transform: uppercase;">Missions Achevées</div>
              <div style="font-size: 18px; font-weight: 900; color: #b45309; margin: 4px 0 2px 0;">${completedParents} / ${(data.tasksList || []).length}</div>
              <div style="font-size: 10px; color: #64748b; font-weight: 600;">${(data.tasksList || []).filter((t) => t.isMilestone).length} jalon(s)</div>
            </td>
          </tr>
        </table>

        ${data.importantPointsSummary ? `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#fffbeb" style="width: 100%; background-color: #fffbeb; border: 1px solid #fcd34d; margin-bottom: 16px;">
          <tr>
            <td style="padding: 10px 14px; font-size: 11px; color: #78350f;">
              <strong style="text-transform: uppercase; font-size: 10px; letter-spacing: 0.4px; color: #92400e;">Points Importants (Hors tâches) :</strong>
              <strong style="font-size: 12.5px; color: #78350f; margin-left: 6px;">${data.importantPointsSummary.totalPoints} point(s)</strong>
              <span style="margin-left: 8px; color: #92400e;">(${data.importantPointsSummary.alertsCount} alerte(s) · ${data.importantPointsSummary.remindersCount} rappel(s) · ${data.importantPointsSummary.movementsCount} petit(s) mouvement(s) · ${data.importantPointsSummary.totalHours}h)</span>
            </td>
          </tr>
        </table>
        ` : ''}

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; border: 1px solid #cbd5e1; margin-bottom: 16px;">
          <tr>
            <td bgcolor="#164e4b" style="background-color: #164e4b; color: #ffffff; padding: 8px 12px; font-weight: 800; font-size: 12px;">
              CALENDRIER DES PRÉSENCES &amp; ACTIVITÉ (${monthLabel})
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; background-color: #ffffff;">
              <table role="presentation" width="100%" cellspacing="3" cellpadding="0" border="0" style="width: 100%; table-layout: fixed;">
                <thead>
                  <tr style="font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase;">
                    <th align="center" style="padding: 4px;">Lun</th>
                    <th align="center" style="padding: 4px;">Mar</th>
                    <th align="center" style="padding: 4px;">Mer</th>
                    <th align="center" style="padding: 4px;">Jeu</th>
                    <th align="center" style="padding: 4px;">Ven</th>
                    <th align="center" style="padding: 4px;">Sam</th>
                    <th align="center" style="padding: 4px;">Dim</th>
                  </tr>
                </thead>
                <tbody>
                  ${calendarRowsHtml.join('')}
                </tbody>
              </table>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; border: 1px solid #cbd5e1; margin-bottom: 16px;">
          <tr>
            <td bgcolor="#164e4b" style="background-color: #164e4b; color: #ffffff; padding: 8px 12px; font-weight: 800; font-size: 12px;">
              JOURNAL DES JOURS ACTIFS (${data.totalDaysWorked}j / ${workingDaysInMonth}j ouvrés${weekendDaysWorked > 0 ? ` · dont ${weekendDaysWorked}j WE` : ''})
            </td>
          </tr>
          <tr>
            <td style="padding: 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; font-size: 11px;">
                <thead>
                  <tr bgcolor="#2A7B76" style="background-color: #2A7B76; color: #ffffff; font-size: 10.5px;">
                    <th align="left" style="padding: 6px 8px;">Date</th>
                    <th align="center" style="padding: 6px 6px;">Jour</th>
                    <th align="center" style="padding: 6px 6px;">Arrivée</th>
                    <th align="center" style="padding: 6px 6px;">Départ</th>
                    <th align="right" style="padding: 6px 8px;">Heures</th>
                    <th align="center" style="padding: 6px 8px;">Statut</th>
                    <th align="right" style="padding: 6px 8px;">Sous-tâches</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    activeDays.length > 0
                      ? activeDays
                          .map((d, idx) => {
                            const dow = new Date(d.date + 'T12:00:00').getDay();
                            const isWe = d.isWeekend ?? (dow === 0 || dow === 6);
                            return `
                            <tr bgcolor="${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}">
                              <td style="padding: 6px 8px; font-family: Consolas, monospace; border-bottom: 1px solid #e2e8f0;">${esc(d.date)}</td>
                              <td align="center" style="padding: 6px 6px; text-transform: uppercase; font-weight: 700; border-bottom: 1px solid #e2e8f0;">${esc(d.dayName)}${isWe ? ' <span style="background-color:#fef3c7;color:#92400e;font-size:9px;padding:1px 3px;">WE</span>' : ''}</td>
                              <td align="center" style="padding: 6px 6px; font-family: Consolas, monospace; border-bottom: 1px solid #e2e8f0;">${esc(d.arrivalTime)}</td>
                              <td align="center" style="padding: 6px 6px; font-family: Consolas, monospace; border-bottom: 1px solid #e2e8f0;">${esc(d.departureTime)}</td>
                              <td align="right" style="padding: 6px 8px; font-family: Consolas, monospace; font-weight: 700; border-bottom: 1px solid #e2e8f0;">${d.hoursWorked > 0 ? `${d.hoursWorked}h` : '—'}</td>
                              <td align="center" style="padding: 6px 8px; font-weight: 700; border-bottom: 1px solid #e2e8f0;">${esc(d.status)}</td>
                              <td align="right" style="padding: 6px 8px; font-family: Consolas, monospace; font-weight: 800; color: #164e4b; border-bottom: 1px solid #e2e8f0;">${d.tasksDoneCount > 0 ? d.tasksDoneCount : '—'}</td>
                            </tr>
                          `;
                          })
                          .join('')
                      : `<tr><td colspan="7" align="center" style="padding: 12px; color: #64748b; font-style: italic;">Aucun pointage ni activité enregistrée sur ce mois.</td></tr>`
                  }
                </tbody>
              </table>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; border: 1px solid #cbd5e1; margin-bottom: 12px;">
          <tr>
            <td bgcolor="#164e4b" style="background-color: #164e4b; color: #ffffff; padding: 8px 12px; font-weight: 800; font-size: 12px;">
              RELEVÉ DÉTAILLÉ DES TÂCHES &amp; SOUS-TÂCHES DU MOIS (${(data.tasksList || []).length} mission(s))
            </td>
          </tr>
          ${tasksHtml}
        </table>

        ${data.importantPointsSummary && data.importantPointsSummary.recentItems.length > 0 ? `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; border: 1px solid #fcd34d; margin-bottom: 12px;">
          <tr>
            <td bgcolor="#92400e" style="background-color: #92400e; color: #ffffff; padding: 8px 12px; font-weight: 800; font-size: 12px;">
              POINTS IMPORTANTS DU MOIS — Alertes, Rappels &amp; Petits mouvements (${data.importantPointsSummary.totalPoints})
            </td>
          </tr>
          <tr>
            <td style="padding: 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; font-size: 11px;">
                <thead>
                  <tr bgcolor="#b45309" style="background-color: #b45309; color: #ffffff;">
                    <th align="left" style="padding: 6px 8px;">Date</th>
                    <th align="left" style="padding: 6px 8px;">Catégorie</th>
                    <th align="left" style="padding: 6px 8px;">Sujet</th>
                    <th align="right" style="padding: 6px 8px;">Durée</th>
                    <th align="center" style="padding: 6px 8px;">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.importantPointsSummary.recentItems.map((pt, idx) => `
                    <tr bgcolor="${idx % 2 === 0 ? '#ffffff' : '#fffbeb'}">
                      <td style="padding: 6px 8px; font-family: Consolas, monospace; border-bottom: 1px solid #fde68a;">${esc(pt.date)} ${esc(pt.time)}</td>
                      <td style="padding: 6px 8px; font-weight: 700; color: #92400e; border-bottom: 1px solid #fde68a;">${esc(pt.categoryLabel)}</td>
                      <td style="padding: 6px 8px; color: #1c1917; border-bottom: 1px solid #fde68a;">${esc(pt.title)}</td>
                      <td align="right" style="padding: 6px 8px; font-family: Consolas, monospace; border-bottom: 1px solid #fde68a;">${pt.durationMinutes}m</td>
                      <td align="center" style="padding: 6px 8px; font-weight: 700; border-bottom: 1px solid #fde68a;">${esc(pt.statusLabel)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </td>
          </tr>
        </table>
        ` : ''}

        ${buildOfficialEmailCompanyFooterHtml(
          'Le classeur officiel Microsoft Excel (.xlsx) complet de la synthèse mensuelle est joint à ce message.'
        )}
      </td>
    </tr>
  `;

  return buildOutlookHtmlDocument({
    title: `Feuille de Tâches Mensuelle - ${data.employee?.name || 'Collaborateur'} (${data.monthName})`,
    maxWidth: 780,
    bodyBg: '#f5f5f4',
    cardBg: '#ffffff',
    innerHtml,
  });
}

/**
 * Génère le rapport HTML compatible Outlook/Gmail pour le Bilan Annuel (avec sous-tâches)
 */
export function buildYearlyTaskSheetHtmlReport(data: YearlyTaskSheetData): string {
  const employeeName = esc(data.employee?.name || 'Collaborateur');
  const dept = esc(data.employee?.department || 'Général');
  const subtasksDone = data.totalSubtasksCompleted ?? data.totalTasksCompleted;
  const subtasksTotal = data.totalSubtasksAssigned ?? subtasksDone;
  const topTasks = data.topTimeTasks || [];

  const innerHtml = `
    <tr>
      <td bgcolor="#ffffff" class="email-pad" style="background-color: #ffffff; padding: 22px; font-size: 12px; color: #1c1917;">
        ${buildOfficialEmailCompanyHeaderHtml(
          `BILAN ANNUEL DES TÂCHES &amp; SOUS-TÂCHES — ${data.year}`,
          `<div><strong>Collaborateur :</strong> ${employeeName}</div>
           <div><strong>Département :</strong> ${dept} • <strong>Site :</strong> Douala</div>
           <div><strong>Année :</strong> ${data.year}</div>`
        )}

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f8fafc" style="width: 100%; background-color: #f8fafc; border: 1px solid #cbd5e1; margin-bottom: 16px;">
          <tr>
            <td width="25%" align="center" style="padding: 10px 6px; border-right: 1px solid #cbd5e1;">
              <div style="font-size: 9.5px; color: #64748b; font-weight: 800; text-transform: uppercase;">Présences Annuelles</div>
              <div style="font-size: 18px; font-weight: 900; color: #164e4b; margin: 4px 0;">${data.totalDaysPresent}j / ${data.totalWorkingDays || 260}j</div>
              ${data.totalWeekendDaysWorked > 0 ? `<div style="font-size: 10px; color: #b45309; font-weight: 700;">dont +${data.totalWeekendDaysWorked}j WE</div>` : ''}
            </td>
            <td width="25%" align="center" style="padding: 10px 6px; border-right: 1px solid #cbd5e1;">
              <div style="font-size: 9.5px; color: #64748b; font-weight: 800; text-transform: uppercase;">Volume Horaire</div>
              <div style="font-size: 18px; font-weight: 900; color: #0f172a; margin: 4px 0;">${data.totalHoursWorked}h</div>
            </td>
            <td width="25%" align="center" style="padding: 10px 6px; border-right: 1px solid #cbd5e1;">
              <div style="font-size: 9.5px; color: #64748b; font-weight: 800; text-transform: uppercase;">Sous-Tâches Validées</div>
              <div style="font-size: 18px; font-weight: 900; color: #2A7B76; margin: 4px 0;">${subtasksDone} / ${subtasksTotal}</div>
            </td>
            <td width="25%" align="center" style="padding: 10px 6px;">
              <div style="font-size: 9.5px; color: #64748b; font-weight: 800; text-transform: uppercase;">Réussite Moyenne</div>
              <div style="font-size: 18px; font-weight: 900; color: #059669; margin: 4px 0;">${data.avgCompletionRate}%</div>
            </td>
          </tr>
        </table>

        ${data.importantPointsSummary ? `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#fffbeb" style="width: 100%; background-color: #fffbeb; border: 1px solid #fcd34d; margin-bottom: 16px;">
          <tr>
            <td style="padding: 10px 14px; font-size: 11px; color: #78350f;">
              <strong style="text-transform: uppercase; font-size: 10px; letter-spacing: 0.4px; color: #92400e;">Points Importants Annuels (Hors tâches) :</strong>
              <strong style="font-size: 12.5px; color: #78350f; margin-left: 6px;">${data.importantPointsSummary.totalPoints} point(s)</strong>
              <span style="margin-left: 8px; color: #92400e;">(${data.importantPointsSummary.alertsCount} alerte(s) · ${data.importantPointsSummary.remindersCount} rappel(s) · ${data.importantPointsSummary.movementsCount} petit(s) mouvement(s) · ${data.importantPointsSummary.totalHours}h)</span>
            </td>
          </tr>
        </table>
        ` : ''}

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; border: 1px solid #cbd5e1; margin-bottom: 16px;">
          <tr>
            <td bgcolor="#164e4b" style="background-color: #164e4b; color: #ffffff; padding: 8px 12px; font-weight: 800; font-size: 12px;">
              VENTILATION MENSUELLE (${data.year})
            </td>
          </tr>
          <tr>
            <td style="padding: 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; font-size: 11.5px;">
                <thead>
                  <tr bgcolor="#2A7B76" style="background-color: #2A7B76; color: #ffffff; font-size: 10.5px;">
                    <th align="left" style="padding: 7px 10px;">Mois</th>
                    <th align="center" style="padding: 7px 8px;">Jours Travaillés</th>
                    <th align="right" style="padding: 7px 8px;">Heures Cumulées</th>
                    <th align="center" style="padding: 7px 8px;">Sous-Tâches Réalisées</th>
                    <th align="center" style="padding: 7px 8px;">Pt. Importants</th>
                    <th align="right" style="padding: 7px 10px;">Rendement</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.monthlyBreakdown
                    .map(
                      (m, idx) => `
                      <tr bgcolor="${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}">
                        <td style="padding: 7px 10px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${esc(m.monthName)}</td>
                        <td align="center" style="padding: 7px 8px; font-family: Consolas, monospace; border-bottom: 1px solid #e2e8f0;">${m.daysWorked}j/${m.workingDays || 22}j${m.weekendDaysWorked > 0 ? ` (+${m.weekendDaysWorked} WE)` : ''}</td>
                        <td align="right" style="padding: 7px 8px; font-family: Consolas, monospace; font-weight: 700; border-bottom: 1px solid #e2e8f0;">${m.hoursWorked}h</td>
                        <td align="center" style="padding: 7px 8px; font-family: Consolas, monospace; font-weight: 700; color: #059669; border-bottom: 1px solid #e2e8f0;">${m.tasksCompleted}${m.subtasksTotal ? ` / ${m.subtasksTotal}` : ''}</td>
                        <td align="center" style="padding: 7px 8px; font-family: Consolas, monospace; font-weight: 700; color: #b45309; border-bottom: 1px solid #e2e8f0;">${m.importantPointsCount ?? 0}</td>
                        <td align="right" style="padding: 7px 10px; font-family: Consolas, monospace; font-weight: 800; color: #164e4b; border-bottom: 1px solid #e2e8f0;">${m.rendementRate}%</td>
                      </tr>
                    `
                    )
                    .join('')}
                </tbody>
              </table>
            </td>
          </tr>
        </table>

        ${
          topTasks.length > 0
            ? `
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; border: 1px solid #cbd5e1; margin-bottom: 12px;">
            <tr>
              <td bgcolor="#164e4b" style="background-color: #164e4b; color: #ffffff; padding: 8px 12px; font-weight: 800; font-size: 12px;">
                PRINCIPALES MISSIONS &amp; SOUS-TÂCHES (${data.year})
              </td>
            </tr>
            <tr>
              <td style="padding: 0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; font-size: 11px;">
                  <thead>
                    <tr bgcolor="#2A7B76" style="background-color: #2A7B76; color: #ffffff;">
                      <th align="left" style="padding: 6px 10px;">Mission / Tâche</th>
                      <th align="center" style="padding: 6px 8px;">Sous-Tâches</th>
                      <th align="right" style="padding: 6px 10px;">Temps</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${topTasks
                      .map(
                        (t, idx) => `
                        <tr bgcolor="${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}">
                          <td style="padding: 6px 10px; font-weight: 700; color: #1e293b; border-bottom: 1px solid #e2e8f0;">${esc(t.title)}</td>
                          <td align="center" style="padding: 6px 8px; font-family: Consolas, monospace; border-bottom: 1px solid #e2e8f0;">${t.completedSubtasksCount}/${t.subtasksCount}</td>
                          <td align="right" style="padding: 6px 10px; font-family: Consolas, monospace; font-weight: 800; color: #2A7B76; border-bottom: 1px solid #e2e8f0;">${t.hours}h</td>
                        </tr>
                      `
                      )
                      .join('')}
                  </tbody>
                </table>
              </td>
            </tr>
          </table>
        `
            : ''
        }

        ${buildOfficialEmailCompanyFooterHtml(
          'Le classeur officiel Microsoft Excel (.xlsx) du bilan annuel est joint à ce message.'
        )}
      </td>
    </tr>
  `;

  return buildOutlookHtmlDocument({
    title: `Bilan Annuel des Tâches - ${data.employee?.name || 'Collaborateur'} (${data.year})`,
    maxWidth: 780,
    bodyBg: '#f5f5f4',
    cardBg: '#ffffff',
    innerHtml,
  });
}
