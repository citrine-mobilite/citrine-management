import { TaskSheetReportData } from './taskSheetReportTypes';
import { PreparedPlanDuJour } from './preparePlanDuJourData';
import { buildOfficialEmailCompanyHeaderHtml } from './citrineOfficialEmailHeaderFooter';

export function buildTaskSheetHtmlHeaderAndStats(data: TaskSheetReportData, p: PreparedPlanDuJour): string {
  const employeeName = data.employeeName || 'Collaborateur';
  const capacityBg = p.capacityStatus === 'overloaded' ? '#fff1f2' : (p.capacityStatus === 'optimal' ? '#ecfdf5' : '#f0fdfa');
  const capacityBorder = p.capacityStatus === 'overloaded' ? '#fecdd3' : (p.capacityStatus === 'optimal' ? '#a7f3d0' : '#99f6e4');
  const capacityColor = p.capacityStatus === 'overloaded' ? '#9f1239' : (p.capacityStatus === 'optimal' ? '#064e3b' : '#115e59');

  const officialHeaderHtml = buildOfficialEmailCompanyHeaderHtml(
    `FEUILLE DE TÂCHES JOURNALIÈRE — ${p.dept}`,
    `<div><strong>Collaborateur :</strong> ${employeeName}</div>
     <div><strong>Lieu :</strong> Douala • <strong>Département :</strong> ${p.dept}</div>
     <div><strong>Date :</strong> ${p.dateText} (${p.dayText})</div>`
  );

  return `
    ${officialHeaderHtml}

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f8fafc" style="width: 100%; background-color: #f8fafc; border: 1px solid #cbd5e1; margin-bottom: 16px;">
      <tr>
        <td style="padding: 14px 16px;">
          <div style="font-size: 12px; font-weight: 800; color: #164e4b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
            STATISTIQUES &amp; POURCENTAGES DE PERFORMANCE DU JOUR
          </div>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin-bottom: 10px;">
            <tr>
              <td width="23%" align="center" bgcolor="#ffffff" class="email-kpi-cell" style="background-color: #ffffff; border: 1px solid #cbd5e1; padding: 10px 6px; text-align: center;">
                <div style="font-size: 9.5px; color: #64748b; font-weight: 800; text-transform: uppercase;">Avancement</div>
                <div style="font-size: 22px; font-weight: 900; color: #164e4b; margin: 4px 0 2px 0;">${p.ratePercentage}%</div>
                <div style="font-size: 10px; color: #059669; font-weight: 700;">${p.completedTasks}/${p.totalTasks} sous-tâches</div>
              </td>
              <td width="10" class="email-kpi-spacer" style="width: 10px; font-size: 1px;">&nbsp;</td>
              <td width="23%" align="center" bgcolor="#ffffff" class="email-kpi-cell" style="background-color: #ffffff; border: 1px solid #cbd5e1; padding: 10px 6px; text-align: center;">
                <div style="font-size: 9.5px; color: #64748b; font-weight: 800; text-transform: uppercase;">Priorités P1-P3</div>
                <div style="font-size: 22px; font-weight: 900; color: #1d4ed8; margin: 4px 0 2px 0;">${p.prioritiesRate}%</div>
                <div style="font-size: 10px; color: #64748b; font-weight: 600;">${p.prioritiesCompleted}/${p.prioritiesTotal} finalisées</div>
              </td>
              <td width="10" class="email-kpi-spacer" style="width: 10px; font-size: 1px;">&nbsp;</td>
              <td width="23%" align="center" bgcolor="#ffffff" class="email-kpi-cell" style="background-color: #ffffff; border: 1px solid #cbd5e1; padding: 10px 6px; text-align: center;">
                <div style="font-size: 9.5px; color: #64748b; font-weight: 800; text-transform: uppercase;">Cadence 08h–17h</div>
                <div style="font-size: 22px; font-weight: 900; color: #0f766e; margin: 4px 0 2px 0;">${p.hoursRate}%</div>
                <div style="font-size: 10px; color: #64748b; font-weight: 600;">${p.hoursWorkedNumber}h / 8h nettes</div>
              </td>
              <td width="10" class="email-kpi-spacer" style="width: 10px; font-size: 1px;">&nbsp;</td>
              <td width="23%" align="center" bgcolor="#ffffff" class="email-kpi-cell" style="background-color: #ffffff; border: 1px solid #cbd5e1; padding: 10px 6px; text-align: center;">
                <div style="font-size: 9.5px; color: #64748b; font-weight: 800; text-transform: uppercase;">Disponibilité</div>
                <div style="font-size: 22px; font-weight: 900; color: ${p.totalLostMinutes > 0 ? '#b45309' : '#059669'}; margin: 4px 0 2px 0;">${p.availabilityRate}%</div>
                <div style="font-size: 10px; color: #64748b; font-weight: 600;">${p.totalLostMinutes > 0 ? `${p.totalLostMinutes}m imprévus` : 'Zéro blocage'}</div>
              </td>
            </tr>
          </table>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="width: 100%; background-color: #ffffff; border: 1px solid #cbd5e1;">
            <tr>
              <td style="padding: 10px 12px;">
                <div style="font-size: 10.5px; font-weight: 700; color: #475569; margin-bottom: 6px;">
                  Répartition : <strong style="color: #065f46;">${p.ratePercentage}% Fait</strong> •
                  <strong style="color: #92400e;">${p.taskInProgressRate}% En cours</strong> •
                  <strong style="color: #64748b;">${p.taskTodoRate}% À faire</strong>
                  ${p.taskBlockedRate > 0 ? ` • <strong style="color: #b91c1c;">${p.taskBlockedRate}% Bloqué</strong>` : ''}
                </div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#e2e8f0" style="width: 100%; background-color: #e2e8f0;">
                  <tr>
                    ${p.ratePercentage > 0 ? `<td width="${p.ratePercentage}%" height="8" bgcolor="#10b981" style="background-color: #10b981; font-size: 1px; line-height: 8px;">&nbsp;</td>` : ''}
                    ${p.taskInProgressRate > 0 ? `<td width="${p.taskInProgressRate}%" height="8" bgcolor="#f59e0b" style="background-color: #f59e0b; font-size: 1px; line-height: 8px;">&nbsp;</td>` : ''}
                    ${p.taskBlockedRate > 0 ? `<td width="${p.taskBlockedRate}%" height="8" bgcolor="#ef4444" style="background-color: #ef4444; font-size: 1px; line-height: 8px;">&nbsp;</td>` : ''}
                    ${p.taskTodoRate > 0 ? `<td width="${p.taskTodoRate}%" height="8" bgcolor="#cbd5e1" style="background-color: #cbd5e1; font-size: 1px; line-height: 8px;">&nbsp;</td>` : ''}
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${capacityBg}" style="width: 100%; background-color: ${capacityBg}; border: 1px solid ${capacityBorder}; margin-bottom: 16px;">
      <tr>
        <td class="email-stack" style="padding: 12px 14px; vertical-align: middle;">
          <div style="margin-bottom: 4px;">
            <span style="display: inline-block; font-size: 10px; font-weight: 800; text-transform: uppercase; background-color: #ffffff; padding: 2px 8px; border: 1px solid #cbd5e1; color: #1e293b;">
              Capacité Opérationnelle du Jour
            </span>
            ${p.hasMilestone ? `<span style="display: inline-block; margin-left: 6px; font-size: 10px; font-weight: 700; background-color: #fef3c7; color: #92400e; padding: 2px 8px; border: 1px solid #fde68a;">Jalon Clé : ${p.milestoneTitle}</span>` : ''}
          </div>
          <div style="font-size: 12px; font-weight: 700; color: ${capacityColor}; line-height: 1.4;">${p.capacityAdvice}</div>
        </td>
        <td align="right" width="215" class="email-stack-left" style="padding: 12px 14px; vertical-align: middle;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="background-color: #ffffff; border: 1px solid #cbd5e1;">
            <tr>
              <td style="padding: 8px 10px; font-size: 10.5px; line-height: 1.4; font-family: Consolas, monospace;">
                <div><strong>Horaires :</strong> 08h00 – 17h00</div>
                <div style="color: ${p.capacityStatus === 'overloaded' ? '#dc2626' : '#64748b'};">Pause : 12h00 – 13h00</div>
                <div style="font-weight: 800; color: #2A7B76;">${p.totalTasks} sous-tâche(s) (${Math.round((p.plannedMinutes / 60) * 10) / 10}h)</div>
                ${p.importantPointsCount > 0 ? `<div style="font-weight: 700; color: #b45309; font-size: 10px; margin-top: 2px;">${p.importantPointsCount} pt(s) important(s) (${p.importantPointsMinutes}m hors-tâches)</div>` : ''}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

export function buildTaskSheetHtmlAttendanceSection(data: TaskSheetReportData, p: PreparedPlanDuJour): string {
  const st = data.dailyAttendance?.statusType;
  const label = data.dailyAttendance?.statusLabel || (data.dailyAttendance?.arrivalTime ? 'Présent' : 'Non pointé');
  const bg = st === 'late' ? '#fef3c7' : (st === 'mission' ? '#e0e7ff' : (st === 'leave' ? '#f3e8ff' : (data.dailyAttendance?.arrivalTime ? '#d1fae5' : '#fee2e2')));
  const col = st === 'late' ? '#92400e' : (st === 'mission' ? '#3730a3' : (st === 'leave' ? '#6b21a8' : (data.dailyAttendance?.arrivalTime ? '#065f46' : '#991b1b')));
  const bor = st === 'late' ? '#fde68a' : (st === 'mission' ? '#c7d2fe' : (st === 'leave' ? '#e9d5ff' : (data.dailyAttendance?.arrivalTime ? '#a7f3d0' : '#fecaca')));

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="width: 100%; background-color: #ffffff; border: 1px solid #cbd5e1; margin-bottom: 16px;">
      <tr>
        <td bgcolor="#164e4b" style="background-color: #164e4b; color: #ffffff; padding: 8px 12px; font-weight: 800; font-size: 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td class="email-stack" style="color: #ffffff;">RÉCAPITULATIF DE PRÉSENCE &amp; POINTAGE (08h00 – 17h00)</td>
              <td align="right" class="email-stack-left" style="font-size: 10.5px; color: #a7f3d0; font-weight: 600;">Registre Citrine</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 14px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td width="25%" class="email-kpi-cell" style="padding: 4px 6px; vertical-align: top;">
                <div style="font-size: 9.5px; color: #64748b; font-weight: 700; text-transform: uppercase;">Statut du Jour</div>
                <div style="margin-top: 4px;">
                  <span style="display: inline-block; padding: 3px 8px; font-size: 10.5px; font-weight: 800; background-color: ${bg}; color: ${col}; border: 1px solid ${bor};">${label}</span>
                </div>
              </td>
              <td width="25%" class="email-kpi-cell" style="padding: 4px 6px; vertical-align: top;">
                <div style="font-size: 9.5px; color: #64748b; font-weight: 700; text-transform: uppercase;">Arrivée</div>
                <div style="font-size: 14px; font-weight: 800; color: #0f172a; font-family: Consolas, monospace; margin-top: 2px;">${data.dailyAttendance?.arrivalTime || '—'}</div>
                <div style="font-size: 9.5px; color: #64748b; margin-top: 1px;">${data.dailyAttendance?.location || 'Douala'}</div>
              </td>
              <td width="25%" class="email-kpi-cell" style="padding: 4px 6px; vertical-align: top;">
                <div style="font-size: 9.5px; color: #64748b; font-weight: 700; text-transform: uppercase;">Pause (12h–13h)</div>
                <div style="font-size: 12px; font-weight: 700; color: #475569; font-family: Consolas, monospace; margin-top: 2px;">
                  ${data.dailyAttendance?.pauseStart && data.dailyAttendance?.pauseEnd ? `${data.dailyAttendance.pauseStart} – ${data.dailyAttendance.pauseEnd}` : (data.dailyAttendance?.pauseStart ? `Dès ${data.dailyAttendance.pauseStart}` : '12:00 – 13:00')}
                </div>
              </td>
              <td width="25%" class="email-kpi-cell" style="padding: 4px 6px; vertical-align: top;">
                <div style="font-size: 9.5px; color: #64748b; font-weight: 700; text-transform: uppercase;">Départ &amp; Heures</div>
                <div style="font-size: 14px; font-weight: 800; color: #164e4b; font-family: Consolas, monospace; margin-top: 2px;">${data.dailyAttendance?.departureTime || 'En poste (17h00)'}</div>
                <div style="font-size: 10px; font-weight: 700; color: #0284c7;">${data.dailyAttendance?.hoursWorkedText || `${p.hoursWorkedNumber}h nettes`}</div>
              </td>
            </tr>
          </table>
          ${data.dailyAttendance?.incidentNote ? `
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#fef2f2" style="width: 100%; background-color: #fef2f2; border: 1px solid #fca5a5; border-left: 4px solid #dc2626; margin-top: 10px;">
              <tr>
                <td style="padding: 8px 12px; font-size: 11px; color: #7f1d1d; font-weight: 700;">
                  INCIDENT CONSTATÉ : ${data.dailyAttendance.incidentNote}
                </td>
              </tr>
            </table>
          ` : ''}
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="width: 100%; background-color: #ffffff; border: 1px solid ${p.presenceIncidents.length > 0 ? '#ea580c' : '#86efac'}; margin-bottom: 16px;">
      <tr>
        <td bgcolor="${p.presenceIncidents.length > 0 ? '#c2410c' : '#15803d'}" style="background-color: ${p.presenceIncidents.length > 0 ? '#c2410c' : '#15803d'}; color: #ffffff; padding: 8px 12px; font-weight: 800; font-size: 12px;">
          SIGNALEMENT DES INCIDENTS &amp; ANOMALIES DE PRÉSENCE (${p.presenceIncidents.length})
        </td>
      </tr>
      <tr>
        <td bgcolor="${p.presenceIncidents.length > 0 ? '#fff7ed' : '#f0fdf4'}" style="padding: 10px 14px; background-color: ${p.presenceIncidents.length > 0 ? '#fff7ed' : '#f0fdf4'};">
          ${p.presenceIncidents.length > 0 ? `
            <div class="email-scroll-x">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="email-mobile-table" style="width: 100%; font-size: 11px;">
                <thead>
                  <tr style="border-bottom: 1px solid #fdba74; color: #9a3412; font-size: 10px; text-transform: uppercase;">
                    <th align="left" style="padding: 6px 8px;">Heure</th>
                    <th align="left" style="padding: 6px 8px;">Type</th>
                    <th align="left" style="padding: 6px 8px;">Détails &amp; Motif</th>
                    <th align="center" style="padding: 6px 8px;">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  ${p.presenceIncidents.map((inc) => `
                    <tr bgcolor="#ffffff" style="background-color: #ffffff; border-bottom: 1px solid #fed7aa;">
                      <td style="padding: 8px; font-family: Consolas, monospace; font-weight: 800; color: #9a3412;">${inc.time || 'Pointage'}</td>
                      <td style="padding: 8px; font-weight: 700; color: #c2410c;">${inc.label}</td>
                      <td style="padding: 8px; font-weight: 700; color: #431407;">${inc.description}</td>
                      <td align="center" style="padding: 8px; font-weight: 700; color: ${inc.isJustified ? '#065f46' : '#991b1b'};">${inc.isJustified ? 'Justifié' : 'Non régularisé'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `<div style="color: #166534; font-weight: 700; font-size: 11.5px;">Aucun incident de présence sur cette journée : ponctualité respectée.</div>`}
        </td>
      </tr>
    </table>
  `;
}
