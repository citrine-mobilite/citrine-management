import { TaskSheetReportData } from './taskSheetReportTypes';
import { PreparedPlanDuJour } from './preparePlanDuJourData';

function escHtml(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildTaskSheetHtmlBodyTables(data: TaskSheetReportData, p: PreparedPlanDuJour): string {
  const employeeName = data.employeeName || 'Collaborateur';

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="width: 100%; background-color: #ffffff; border: 1px solid #cbd5e1; margin-bottom: 16px;">
      <tr>
        <td bgcolor="#164e4b" style="background-color: #164e4b; color: #ffffff; padding: 8px 12px; font-weight: 800; font-size: 12px;">
          LES 3 PRIORITÉS DU JOUR — si je ne fais que ça, la journée est réussie
        </td>
      </tr>
      <tr>
        <td bgcolor="#ffffff" style="background-color: #ffffff;">
          ${p.topPriorities.length > 0 ? `
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%;">
              ${p.topPriorities.map((item, idx) => `
                <tr>
                  <td class="email-stack" style="padding: 10px 12px; ${idx < p.topPriorities.length - 1 ? 'border-bottom: 1px solid #e2e8f0;' : ''} vertical-align: middle;">
                    <span style="font-weight: 800; color: #78716c; margin-right: 6px;">${idx + 1}.</span>
                    <span style="font-weight: 700; font-size: 12.5px; color: #1e40af;">${item.title}</span>
                    ${item.isMilestone ? '<span style="margin-left: 8px; background-color: #fef3c7; color: #92400e; font-size: 10px; font-weight: 700; padding: 2px 6px; border: 1px solid #fde68a;">Jalon Clé</span>' : ''}
                  </td>
                  <td align="right" class="email-stack-left" style="padding: 10px 12px; ${idx < p.topPriorities.length - 1 ? 'border-bottom: 1px solid #e2e8f0;' : ''} vertical-align: middle; width: 140px;">
                    <span style="display: inline-block; font-size: 10px; font-weight: 700; color: #64748b; margin-right: 8px; font-family: Consolas, monospace;">${item.priority || 'P2'}</span>
                    <span style="display: inline-block; padding: 3px 10px; font-size: 10.5px; font-weight: 700; ${item.status === 'Fait' ? 'background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0;' : 'background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a;'}">${item.status}</span>
                  </td>
                </tr>
              `).join('')}
            </table>
          ` : `<div style="padding: 12px; text-align: center; color: #64748b; font-style: italic;">Aucune mission prioritaire définie pour aujourd&apos;hui.</div>`}
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="width: 100%; background-color: #ffffff; border: 1px solid #cbd5e1; margin-bottom: 16px;">
      <tr>
        <td bgcolor="#164e4b" style="background-color: #164e4b; color: #ffffff; padding: 8px 12px; font-weight: 800; font-size: 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td class="email-stack" style="color: #ffffff;">TÂCHES DU JOUR (Sous-tâches traitées)</td>
              <td align="right" class="email-stack-left" style="font-size: 11px; color: #a7f3d0; font-weight: 700; font-family: Consolas, monospace;">
                ${p.completedTasks}/${p.totalTasks} terminées (${p.ratePercentage}%)
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 0;">
          <div class="email-scroll-x">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="email-mobile-table" style="width: 100%; font-size: 11.5px;">
              <thead>
                <tr bgcolor="#2A7B76" style="background-color: #2A7B76; color: #ffffff; font-size: 11px;">
                  <th align="left" style="padding: 7px 10px; color: #ffffff; font-weight: 700;">Sous-Tâche</th>
                  <th align="left" style="padding: 7px 10px; color: #ffffff; font-weight: 700;">Mission Parente</th>
                  <th align="center" style="padding: 7px 6px; color: #ffffff; font-weight: 700; width: 45px;">Prio</th>
                  <th align="right" style="padding: 7px 8px; color: #ffffff; font-weight: 700; width: 85px;">Estimé</th>
                  <th align="center" style="padding: 7px 8px; color: #ffffff; font-weight: 700; width: 85px;">Échéance</th>
                  <th align="center" style="padding: 7px 8px; color: #ffffff; font-weight: 700; width: 85px;">Statut</th>
                </tr>
              </thead>
              <tbody>
                ${p.tasks.map((t, index) => {
                  const prioColor = t.priorityLabel === 'P1' ? '#dc2626' : (t.priorityLabel === 'P2' ? '#2563eb' : '#d97706');
                  const statusBadge = t.status === 'Fait'
                    ? '<span style="background-color: #d1fae5; color: #065f46; font-weight: 700; font-size: 10px; padding: 2px 8px; border: 1px solid #a7f3d0;">Fait</span>'
                    : (t.status === 'Bloqué'
                      ? '<span style="background-color: #fee2e2; color: #991b1b; font-weight: 700; font-size: 10px; padding: 2px 8px; border: 1px solid #fecaca;">Bloqué</span>'
                      : (t.status === 'En cours'
                        ? '<span style="background-color: #fef3c7; color: #92400e; font-weight: 700; font-size: 10px; padding: 2px 8px; border: 1px solid #fde68a;">En cours</span>'
                        : '<span style="background-color: #f1f5f9; color: #475569; font-weight: 700; font-size: 10px; padding: 2px 8px; border: 1px solid #cbd5e1;">À faire</span>'));
                  const rowBg = index % 2 === 0 ? '#ffffff' : '#fcfbf9';

                  return `
                    <tr bgcolor="${rowBg}" style="background-color: ${rowBg};">
                      <td style="padding: 8px 10px; color: #1e40af; font-weight: 700; border-bottom: 1px solid #e7e5e4;">${t.title}</td>
                      <td style="padding: 8px 10px; color: #57534e; border-bottom: 1px solid #e7e5e4;">${t.parentTaskTitle}</td>
                      <td align="center" style="padding: 8px 6px; font-weight: 800; font-size: 11px; color: ${prioColor}; border-bottom: 1px solid #e7e5e4;">${t.priorityLabel}</td>
                      <td align="right" style="padding: 8px 8px; color: #1c1917; font-family: Consolas, monospace; font-weight: 600; border-bottom: 1px solid #e7e5e4;">${t.estimatedMinutes} min</td>
                      <td align="center" style="padding: 8px 8px; color: #78716c; font-family: Consolas, monospace; font-size: 11px; border-bottom: 1px solid #e7e5e4;">${t.dueDate}</td>
                      <td align="center" style="padding: 8px 8px; border-bottom: 1px solid #e7e5e4;">${statusBadge}</td>
                    </tr>
                  `;
                }).join('')}
                ${p.tasks.length === 0 ? `<tr><td colspan="6" align="center" style="padding: 16px; text-align: center; color: #78716c; font-style: italic;">Aucune sous-tâche planifiée aujourd&apos;hui.</td></tr>` : ''}
              </tbody>
              <tfoot>
                <tr bgcolor="#164e4b" style="background-color: #164e4b; color: #ffffff; font-weight: 800; font-size: 11.5px;">
                  <td colspan="2" style="padding: 8px 10px; color: #ffffff;">Total sous-tâches / réalisées / avancement</td>
                  <td align="center" style="padding: 8px 6px; color: #ffffff;">${p.totalTasks}</td>
                  <td align="right" style="padding: 8px 8px; color: #ffffff; font-family: Consolas, monospace;">${p.completedTasks} fait</td>
                  <td align="center" style="padding: 8px 8px; color: #ffffff; font-family: Consolas, monospace;">${p.ratePercentage}%</td>
                  <td align="center" style="padding: 8px 8px; color: #fde68a; font-family: Consolas, monospace;">${p.postponedCount} à suivre</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="width: 100%; background-color: #ffffff; border: 1px solid #fcd34d; margin-bottom: 16px;">
      <tr>
        <td bgcolor="#92400e" style="background-color: #92400e; color: #ffffff; padding: 8px 12px; font-weight: 800; font-size: 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td class="email-stack" style="color: #ffffff;">POINTS IMPORTANTS (Alertes, Rappels &amp; Petits mouvements) — Hors tâches</td>
              <td align="right" class="email-stack-left" style="font-size: 10.5px; color: #fef3c7; font-weight: 700; font-family: Consolas, monospace;">
                ${p.importantPointsCount} pt(s) · ${p.alertsCount} alerte(s) · ${p.remindersCount} rappel(s) · ${p.movementsCount} mvt(s)
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 0;">
          ${p.importantPoints.length > 0 ? `
            <div class="email-scroll-x">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="email-mobile-table" style="width: 100%; font-size: 11px;">
                <thead>
                  <tr bgcolor="#b45309" style="background-color: #b45309; color: #ffffff; font-size: 10.5px;">
                    <th align="left" style="padding: 6px 10px; color: #ffffff; width: 65px;">Heure</th>
                    <th align="left" style="padding: 6px 8px; color: #ffffff; width: 125px;">Catégorie</th>
                    <th align="left" style="padding: 6px 10px; color: #ffffff;">Sujet &amp; Détails</th>
                    <th align="right" style="padding: 6px 8px; color: #ffffff; width: 65px;">Durée</th>
                    <th align="center" style="padding: 6px 8px; color: #ffffff; width: 90px;">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  ${p.importantPoints.map((pt, idx) => {
                    const catBg = pt.category === 'alerte' ? '#ffe4e6' : pt.category === 'mouvement' ? '#e0e7ff' : '#ccfbf1';
                    const catCol = pt.category === 'alerte' ? '#9f1239' : pt.category === 'mouvement' ? '#3730a3' : '#115e59';
                    const stBg = pt.isResolved ? '#d1fae5' : pt.isOverdue ? '#fee2e2' : '#fef3c7';
                    const stCol = pt.isResolved ? '#065f46' : pt.isOverdue ? '#991b1b' : '#92400e';
                    const rowBg = idx % 2 === 0 ? '#ffffff' : '#fffbeb';
                    return `
                      <tr bgcolor="${rowBg}" style="background-color: ${rowBg};">
                        <td style="padding: 7px 10px; font-family: Consolas, monospace; font-weight: 700; color: #78350f; border-bottom: 1px solid #fde68a;">${escHtml(pt.time)}</td>
                        <td style="padding: 7px 8px; border-bottom: 1px solid #fde68a;">
                          <span style="display: inline-block; padding: 2px 7px; font-size: 9.5px; font-weight: 800; background-color: ${catBg}; color: ${catCol};">${escHtml(pt.categoryLabel)}</span>
                        </td>
                        <td style="padding: 7px 10px; color: #1c1917; border-bottom: 1px solid #fde68a;">
                          <strong>${escHtml(pt.title)}</strong>
                          ${pt.detail ? `<div style="font-size: 10px; color: #64748b; margin-top: 2px;">${escHtml(pt.detail)}</div>` : ''}
                          ${pt.location ? `<div style="font-size: 9.5px; color: #92400e; margin-top: 1px;">Lieu : ${escHtml(pt.location)}</div>` : ''}
                        </td>
                        <td align="right" style="padding: 7px 8px; font-family: Consolas, monospace; font-weight: 700; color: #78350f; border-bottom: 1px solid #fde68a;">${pt.durationMinutes} min</td>
                        <td align="center" style="padding: 7px 8px; border-bottom: 1px solid #fde68a;">
                          <span style="display: inline-block; padding: 2px 7px; font-size: 9.5px; font-weight: 700; background-color: ${stBg}; color: ${stCol};">${escHtml(pt.statusLabel)}</span>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          ` : `<div style="padding: 10px 14px; color: #78716c; font-style: italic; font-size: 11px;">Aucun point important (alerte, rappel ou petit mouvement) relevé ce jour.</div>`}
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="width: 100%; background-color: #ffffff; border: 1px solid #cbd5e1; margin-bottom: 16px;">
      <tr>
        <td bgcolor="#164e4b" style="background-color: #164e4b; color: #ffffff; padding: 8px 12px; font-weight: 800; font-size: 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td class="email-stack" style="color: #ffffff;">PLAN HORAIRE (08h00 – 17h00)</td>
              <td align="right" class="email-stack-left">
                <span style="display: inline-block; background-color: #fef08a; color: #854d0e; font-size: 10px; font-weight: 700; padding: 2px 8px; font-family: Consolas, monospace;">Pause : 12h00 – 13h00</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 0;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="email-mobile-table" style="width: 100%; font-size: 11.5px;">
            <thead>
              <tr bgcolor="#2A7B76" style="background-color: #2A7B76; color: #ffffff; font-size: 11px;">
                <th align="left" style="padding: 7px 10px; color: #ffffff; width: 165px;">Heure</th>
                <th align="left" style="padding: 7px 10px; color: #ffffff;">Activité sur le créneau</th>
              </tr>
            </thead>
            <tbody>
              ${p.scheduleSlots.map((s) => {
                const isLunchBreak = s.isBreak || (s.timeRange.startsWith('12:00') && s.timeRange.includes('13:00'));
                const isIdleDay = s.activity.toLowerCase().includes("n'a rien fait");
                const rowBg = isIdleDay ? '#f8fafc' : (isLunchBreak ? '#fef9c3' : '#ffffff');
                const timeColor = isIdleDay ? '#64748b' : (isLunchBreak ? '#854d0e' : '#1c1917');
                const actColor = isIdleDay ? '#64748b' : (isLunchBreak ? '#854d0e' : '#1d4ed8');
                return `
                  <tr bgcolor="${rowBg}" style="background-color: ${rowBg};">
                    <td style="padding: 8px 10px; font-family: Consolas, monospace; font-weight: 700; color: ${timeColor}; border-bottom: 1px solid #e7e5e4;">${s.timeRange}</td>
                    <td style="padding: 8px 10px; font-weight: 700; ${isIdleDay ? 'font-style: italic;' : ''} color: ${actColor}; border-bottom: 1px solid #e7e5e4;">${isLunchBreak ? 'Pause Déjeuner Officielle (12h00 – 13h00)' : s.activity}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="width: 100%; background-color: #ffffff; border: 1px solid #cbd5e1; margin-bottom: 16px;">
      <tr>
        <td bgcolor="#164e4b" style="background-color: #164e4b; color: #ffffff; padding: 8px 12px; font-weight: 800; font-size: 12px;">
          IMPRÉVUS &amp; BLOCAGES (${p.unforeseenEvents.length}) — ${employeeName}
        </td>
      </tr>
      <tr>
        <td bgcolor="${p.unforeseenEvents.length > 0 ? '#ffffff' : '#ecfdf5'}" style="padding: ${p.unforeseenEvents.length > 0 ? '0' : '12px 16px'}; color: #065f46; font-size: 11.5px; font-weight: 600;">
          ${p.unforeseenEvents.length > 0 ? `
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="email-mobile-table" style="width: 100%; font-size: 11.5px;">
              <thead>
                <tr bgcolor="#2A7B76" style="background-color: #2A7B76; color: #ffffff; font-size: 11px;">
                  <th align="left" style="padding: 7px 10px; color: #ffffff;">Heure</th>
                  <th align="left" style="padding: 7px 10px; color: #ffffff;">Origine &amp; Sujet</th>
                  <th align="center" style="padding: 7px 10px; color: #ffffff;">Statut</th>
                  <th align="right" style="padding: 7px 10px; color: #ffffff;">Impact</th>
                </tr>
              </thead>
              <tbody>
                ${p.unforeseenEvents.map((u, idx) => `
                  <tr bgcolor="${idx % 2 === 0 ? '#ffffff' : '#fffbeb'}" style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#fffbeb'};">
                    <td style="padding: 8px 10px; font-family: Consolas, monospace; font-weight: 700; color: #78716c; border-bottom: 1px solid #fde68a;">${u.time}</td>
                    <td style="padding: 8px 10px; color: #1c1917; border-bottom: 1px solid #fde68a;"><strong>${u.subject}</strong>${u.sourceTask ? ` (${u.sourceTask})` : ''}</td>
                    <td align="center" style="padding: 8px 10px; font-weight: 700; color: ${u.status === 'Résolu' ? '#065f46' : '#991b1b'}; border-bottom: 1px solid #fde68a;">${u.status || 'Bloqué'}</td>
                    <td align="right" style="padding: 8px 10px; font-family: Consolas, monospace; font-weight: 800; color: #dc2626; border-bottom: 1px solid #fde68a;">${u.lostMinutes} min</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : `Aucun blocage ni imprévu opérationnel signalé par le collaborateur sur cette journée.`}
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="width: 100%; background-color: #ffffff; border: 1px solid #cbd5e1;">
      <tr>
        <td bgcolor="#164e4b" style="background-color: #164e4b; color: #ffffff; padding: 8px 12px; font-weight: 800; font-size: 12px;">
          BILAN FIN DE JOURNÉE
        </td>
      </tr>
      <tr>
        <td style="padding: 14px 16px; background-color: #ffffff;">
          <div style="font-weight: 800; font-size: 11.5px; color: #44403c; margin-bottom: 4px;">À reporter à demain :</div>
          <div style="font-size: 11.5px; margin-bottom: 10px;">
            ${p.postponedTasks.length > 0 ? `<ul style="margin: 0; padding-left: 18px; color: #1e40af; font-weight: 600; line-height: 1.5;">${p.postponedTasks.map((t) => `<li>${t}</li>`).join('')}</ul>` : `<span style="color: #059669; font-weight: 700;">Toutes les sous-tâches du jour ont été clôturées avec succès !</span>`}
          </div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f8fafc" style="width: 100%; background-color: #f8fafc; border: 1px solid #e2e8f0;">
            <tr>
              <td style="padding: 10px 12px; font-size: 11.5px; color: #334155; line-height: 1.5;">
                <div style="font-weight: 800; color: #1e293b; margin-bottom: 3px;">Points à Signaler au Manager &amp; Direction :</div>
                ${p.managerAlertPoint}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}
