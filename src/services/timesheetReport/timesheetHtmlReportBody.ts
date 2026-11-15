import { TimesheetReportData } from './timesheetReportTypes';
import { PreparedPlanDuJour } from './preparePlanDuJourData';

export function buildTimesheetHtmlBodyTables(data: TimesheetReportData, p: PreparedPlanDuJour): string {
  const employeeName = data.employeeName || 'Collaborateur';

  return `
    <div style="border-radius: 10px; border: 1px solid #cbd5e1; overflow: hidden; margin-bottom: 16px;">
      <div style="background-color: #164e4b; color: #ffffff; padding: 8px 12px; font-weight: 800; font-size: 12px;">
        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
          <tr>
            <td>🎯 LES 3 PRIORITÉS DU JOUR — si je ne fais que ça, la journée est réussie</td>
            <td align="right" style="font-size: 10px; color: #a7f3d0; font-weight: 600;">Piliers majeurs de la journée</td>
          </tr>
        </table>
      </div>
      <div style="background-color: #ffffff;">
        ${p.topPriorities.map((item, idx) => `
          <div style="padding: 10px 12px; ${idx < p.topPriorities.length - 1 ? 'border-bottom: 1px solid #e2e8f0;' : ''}">
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
              <tr>
                <td style="width: 28px; vertical-align: middle; font-weight: 800; color: #a8a29e;">${idx + 1}.</td>
                <td style="vertical-align: middle; padding-left: 4px;">
                  <span style="font-weight: 700; font-size: 12.5px; color: #1e40af;">${item.title}</span>
                  ${item.isMilestone ? '<span style="margin-left: 8px; background-color: #fef3c7; color: #92400e; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; border: 1px solid #fde68a;">🏆 Jalon Clé</span>' : ''}
                </td>
                <td align="right" style="vertical-align: middle; width: 140px;">
                  <span style="display: inline-block; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-right: 8px; font-family: monospace;">${item.priority || 'P2'}</span>
                  <span style="display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 10.5px; font-weight: 700; ${item.status === 'Fait' ? 'background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0;' : 'background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a;'}">${item.status}</span>
                </td>
              </tr>
            </table>
          </div>
        `).join('')}
        ${p.topPriorities.length === 0 ? `
          <div style="padding: 12px; text-align: center; color: #94a3b8; font-style: italic;">
            Aucune mission prioritaire définie pour aujourd'hui.
          </div>
        ` : ''}
      </div>
    </div>

    <div style="border-radius: 10px; border: 1px solid #cbd5e1; overflow: hidden; margin-bottom: 16px;">
      <div style="background-color: #164e4b; color: #ffffff; padding: 8px 12px; font-weight: 800; font-size: 12px;">
        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
          <tr>
            <td>📋 TÂCHES DU JOUR (Sous-tâches concrètes traitées)</td>
            <td align="right" style="font-size: 11px; color: #a7f3d0; font-weight: 700; font-family: monospace;">
              ${p.completedTasks}/${p.totalTasks} terminées (${p.ratePercentage}%)
            </td>
          </tr>
        </table>
      </div>
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; font-size: 11.5px;">
        <thead>
          <tr style="background-color: #2A7B76; color: #ffffff; font-size: 11px;">
            <th style="padding: 7px 10px; text-align: left; font-weight: 700;">Sous-Tâche</th>
            <th style="padding: 7px 10px; text-align: left; font-weight: 700;">Mission Parente (Job Description)</th>
            <th style="padding: 7px 6px; text-align: center; font-weight: 700; width: 45px;">Prio</th>
            <th style="padding: 7px 8px; text-align: right; font-weight: 700; width: 85px;">Estimé (min)</th>
            <th style="padding: 7px 8px; text-align: center; font-weight: 700; width: 85px;">Échéance</th>
            <th style="padding: 7px 8px; text-align: center; font-weight: 700; width: 85px;">Statut</th>
          </tr>
        </thead>
        <tbody>
          ${p.tasks.map((t, index) => {
            const prioColor = t.priorityLabel === 'P1' ? '#dc2626' : (t.priorityLabel === 'P2' ? '#2563eb' : '#d97706');
            const statusBadge = t.status === 'Fait'
              ? '<span style="background-color: #d1fae5; color: #065f46; font-weight: 700; font-size: 10px; padding: 2px 8px; border-radius: 4px; border: 1px solid #a7f3d0;">Fait</span>'
              : (t.status === 'Bloqué'
                ? '<span style="background-color: #fee2e2; color: #991b1b; font-weight: 700; font-size: 10px; padding: 2px 8px; border-radius: 4px; border: 1px solid #fecaca;">Bloqué</span>'
                : (t.status === 'En cours'
                  ? '<span style="background-color: #fef3c7; color: #92400e; font-weight: 700; font-size: 10px; padding: 2px 8px; border-radius: 4px; border: 1px solid #fde68a;">En cours</span>'
                  : '<span style="background-color: #f1f5f9; color: #475569; font-weight: 700; font-size: 10px; padding: 2px 8px; border-radius: 4px; border: 1px solid #cbd5e1;">À faire</span>'));
            const rowBg = index % 2 === 0 ? '#ffffff' : '#fcfbf9';

            return `
              <tr style="background-color: ${rowBg}; border-bottom: 1px solid #e7e5e4;">
                <td style="padding: 8px 10px; color: #1e40af; font-weight: 700;">
                  <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background-color: #3b82f6; margin-right: 6px; vertical-align: middle;"></span>
                  <span style="vertical-align: middle;">${t.title}</span>
                </td>
                <td style="padding: 8px 10px; color: #57534e;">${t.parentTaskTitle}</td>
                <td style="padding: 8px 6px; text-align: center; font-weight: 800; font-size: 11px; color: ${prioColor};">${t.priorityLabel}</td>
                <td style="padding: 8px 8px; text-align: right; color: #1c1917; font-family: monospace; font-weight: 600;">${t.estimatedMinutes} min</td>
                <td style="padding: 8px 8px; text-align: center; color: #78716c; font-family: monospace; font-size: 11px;">${t.dueDate}</td>
                <td style="padding: 8px 8px; text-align: center;">${statusBadge}</td>
              </tr>
            `;
          }).join('')}
          ${p.tasks.length === 0 ? `
            <tr>
              <td colspan="6" style="padding: 16px; text-align: center; color: #a8a29e; font-style: italic;">
                Aucune sous-tâche planifiée aujourd'hui.
              </td>
            </tr>
          ` : ''}
        </tbody>
        <tfoot>
          <tr style="background-color: #164e4b; color: #ffffff; font-weight: 800; font-size: 11.5px;">
            <td colspan="2" style="padding: 8px 10px;">Total sous-tâches / réalisées / avancement</td>
            <td style="text-align: center; padding: 8px 6px;">${p.totalTasks}</td>
            <td style="text-align: right; padding: 8px 8px; font-family: monospace;">${p.completedTasks} fait</td>
            <td style="text-align: center; padding: 8px 8px; font-family: monospace;">${p.ratePercentage}%</td>
            <td style="text-align: center; padding: 8px 8px; color: #fde68a; font-family: monospace;">${p.postponedCount} à suivre</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div style="border-radius: 10px; border: 1px solid #cbd5e1; overflow: hidden; margin-bottom: 16px;">
      <div style="background-color: #164e4b; color: #ffffff; padding: 8px 12px; font-weight: 800; font-size: 12px;">
        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
          <tr>
            <td>🕒 PLAN HORAIRE (08h00 – 17h00) — Pause déjeuner obligatoire 12h00 – 13h00</td>
            <td align="right">
              <span style="display: inline-block; background-color: rgba(254, 240, 138, 0.4); color: #854d0e; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 12px; border: 1px solid rgba(254, 240, 138, 0.7); font-family: monospace;">
                12:00 – 13:00 : Pause Déjeuner
              </span>
            </td>
          </tr>
        </table>
      </div>
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; font-size: 11.5px;">
        <thead>
          <tr style="background-color: #2A7B76; color: #ffffff; font-size: 11px;">
            <th style="padding: 7px 10px; text-align: left; width: 140px; font-weight: 700;">Heure</th>
            <th style="padding: 7px 10px; text-align: left; font-weight: 700;">Ce que je fais sur ce créneau</th>
          </tr>
        </thead>
        <tbody>
          ${p.scheduleSlots.map((s) => {
            const isLunchBreak = s.isBreak || (s.timeRange.startsWith('12:00') && s.timeRange.includes('13:00'));
            const rowBg = isLunchBreak ? '#fef9c3' : '#ffffff';
            const timeColor = isLunchBreak ? '#854d0e' : '#1c1917';
            const actColor = isLunchBreak ? '#854d0e' : '#1d4ed8';
            return `
              <tr style="background-color: ${rowBg}; border-bottom: 1px solid ${isLunchBreak ? '#fde047' : '#e7e5e4'};">
                <td style="padding: 8px 10px; font-family: monospace; font-weight: 700; color: ${timeColor}; width: 140px;">${s.timeRange}</td>
                <td style="padding: 8px 10px; font-weight: 700; color: ${actColor};">${isLunchBreak ? '🍽️ Pause Déjeuner Officielle (12h00 – 13h00)' : s.activity}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <div style="border-radius: 10px; border: 1px solid #cbd5e1; overflow: hidden; margin-bottom: 16px;">
      <div style="background-color: #164e4b; color: #ffffff; padding: 8px 12px; font-weight: 800; font-size: 12px;">
        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
          <tr>
            <td>⚡ IMPRÉVUS SURVENUS AUJOURD'HUI (${p.unforeseenEvents.length})</td>
            <td align="right" style="font-size: 10px; color: #a7f3d0; font-weight: 600;">— issus des blocages signalés par ${employeeName}</td>
          </tr>
        </table>
      </div>
      ${p.unforeseenEvents.length > 0 ? `
        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; font-size: 11.5px;">
          <thead>
            <tr style="background-color: #2A7B76; color: #ffffff; font-size: 11px;">
              <th style="padding: 7px 10px; text-align: left; width: 90px; font-weight: 700;">Heure</th>
              <th style="padding: 7px 10px; text-align: left; font-weight: 700;">Origine &amp; Sujet de l'imprévu (Blocage opérationnel)</th>
              <th style="padding: 7px 10px; text-align: center; width: 90px; font-weight: 700;">Statut</th>
              <th style="padding: 7px 10px; text-align: right; width: 100px; font-weight: 700;">Temps impact</th>
            </tr>
          </thead>
          <tbody>
            ${p.unforeseenEvents.map((u, idx) => `
              <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#fffbeb'}; border-bottom: 1px solid #fde68a;">
                <td style="padding: 8px 10px; font-family: monospace; font-weight: 700; color: #78716c;">${u.time}</td>
                <td style="padding: 8px 10px; color: #1c1917;">
                  <div style="font-weight: 700; color: #1c1917;">${u.subject}</div>
                  ${u.sourceTask ? `<div style="font-size: 10.5px; color: #78716c; margin-top: 2px;">Tâche source : <strong style="color: #44403c;">${u.sourceTask}</strong></div>` : ''}
                </td>
                <td style="padding: 8px 10px; text-align: center;">
                  <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; ${u.status === 'Résolu' ? 'background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0;' : 'background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca;'}">${u.status || 'Bloqué'}</span>
                </td>
                <td style="padding: 8px 10px; text-align: right; font-family: monospace; font-weight: 800; color: #dc2626;">${u.lostMinutes} min</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : `
        <div style="background-color: #ecfdf5; padding: 12px 16px; color: #065f46; font-size: 11.5px; font-weight: 600;">
          ✓ Aucun blocage ni imprévu opérationnel signalé par le collaborateur sur cette journée.
        </div>
      `}
    </div>

    <div style="border-radius: 10px; border: 1px solid #cbd5e1; overflow: hidden; margin-bottom: 16px;">
      <div style="background-color: #164e4b; color: #ffffff; padding: 8px 12px; font-weight: 800; font-size: 12px;">
        ☑️ BILAN FIN DE JOURNÉE (2 min)
      </div>
      <div style="background-color: #ffffff; padding: 14px 16px;">
        <div style="margin-bottom: 12px;">
          <div style="font-weight: 800; font-size: 11.5px; color: #44403c; margin-bottom: 4px;">À reporter à demain :</div>
          <div style="font-size: 11.5px;">
            ${p.postponedTasks.length > 0 ? `
              <ul style="margin: 0; padding-left: 18px; color: #1e40af; font-weight: 600; line-height: 1.5;">
                ${p.postponedTasks.map((t) => `<li>${t}</li>`).join('')}
              </ul>
            ` : `
              <span style="color: #059669; font-weight: 700;">✓ Toutes les sous-tâches du jour ont été clôturées avec succès !</span>
            `}
          </div>
        </div>
        <div style="border-top: 1px solid #e7e5e4; padding-top: 10px;">
          <div style="font-weight: 800; font-size: 11.5px; color: #1e293b; margin-bottom: 4px;">🚩 Points à Signaler au Manager &amp; Direction :</div>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; font-size: 11.5px; color: #334155; line-height: 1.5;">
            ${p.managerAlertPoint}
          </div>
        </div>
      </div>
    </div>
  `;
}
