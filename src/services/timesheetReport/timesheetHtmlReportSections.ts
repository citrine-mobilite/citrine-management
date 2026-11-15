import { TimesheetReportData } from './timesheetReportTypes';
import { PreparedPlanDuJour } from './preparePlanDuJourData';

export function buildTimesheetHtmlHeaderAndStats(data: TimesheetReportData, p: PreparedPlanDuJour): string {
  const employeeName = data.employeeName || 'Collaborateur';
  const capacityBg = p.capacityStatus === 'overloaded' ? '#fff1f2' : (p.capacityStatus === 'optimal' ? '#ecfdf5' : '#f0fdfa');
  const capacityBorder = p.capacityStatus === 'overloaded' ? '#fecdd3' : (p.capacityStatus === 'optimal' ? '#a7f3d0' : '#99f6e4');
  const capacityColor = p.capacityStatus === 'overloaded' ? '#9f1239' : (p.capacityStatus === 'optimal' ? '#064e3b' : '#115e59');

  return `
    <div style="border-bottom: 2px solid #164e4b; padding-bottom: 12px; margin-bottom: 16px;">
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
        <tr>
          <td style="vertical-align: top;">
            <div style="font-family: Georgia, serif; font-size: 26px; font-weight: 900; font-style: italic; color: #164e4b; letter-spacing: 0.5px; line-height: 1;">
              CITRINE
            </div>
            <div style="font-size: 13px; font-weight: 800; color: #164e4b; margin-top: 4px; text-transform: uppercase;">
              PLAN DU JOUR — ${p.dept}
            </div>
          </td>
          <td align="right" style="vertical-align: top; font-size: 11px; color: #44403c; line-height: 1.5; font-family: monospace;">
            <div><strong>Collaborateur :</strong> ${employeeName}</div>
            <div><strong>Lieu :</strong> Douala • <strong>Département :</strong> ${p.dept}</div>
            <div><strong>Date :</strong> ${p.dateText} (${p.dayText})</div>
          </td>
        </tr>
      </table>
    </div>

    <div style="background-color: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 14px; padding: 16px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
      <div style="font-size: 12px; font-weight: 800; color: #164e4b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
        📊 STATISTIQUES &amp; POURCENTAGES DE PERFORMANCE DU JOUR
      </div>

      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: separate; border-spacing: 8px 0; margin-bottom: 12px;">
        <tr>
          <td style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center; width: 25%;">
            <div style="font-size: 9.5px; color: #64748b; font-weight: 800; text-transform: uppercase;">Avancement Tâches</div>
            <div style="font-size: 24px; font-weight: 900; color: #164e4b; margin: 4px 0 2px 0;">${p.ratePercentage}%</div>
            <div style="font-size: 10px; color: #10b981; font-weight: 700;">${p.completedTasks}/${p.totalTasks} sous-tâche(s) faites</div>
          </td>
          <td style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center; width: 25%;">
            <div style="font-size: 9.5px; color: #64748b; font-weight: 800; text-transform: uppercase;">Priorités P1-P3</div>
            <div style="font-size: 24px; font-weight: 900; color: #1d4ed8; margin: 4px 0 2px 0;">${p.prioritiesRate}%</div>
            <div style="font-size: 10px; color: #64748b; font-weight: 600;">${p.prioritiesCompleted}/${p.prioritiesTotal} finalisées (${p.prioritiesEngagementRate}% traitées)</div>
          </td>
          <td style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center; width: 25%;">
            <div style="font-size: 9.5px; color: #64748b; font-weight: 800; text-transform: uppercase;">Cadence (08h–17h)</div>
            <div style="font-size: 24px; font-weight: 900; color: #0f766e; margin: 4px 0 2px 0;">${p.hoursRate}%</div>
            <div style="font-size: 10px; color: #64748b; font-weight: 600;">${p.hoursWorkedNumber}h / 8h nettes contractuelles</div>
          </td>
          <td style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center; width: 25%;">
            <div style="font-size: 9.5px; color: #64748b; font-weight: 800; text-transform: uppercase;">Disponibilité Nette</div>
            <div style="font-size: 24px; font-weight: 900; color: ${p.totalLostMinutes > 0 ? '#b45309' : '#059669'}; margin: 4px 0 2px 0;">${p.availabilityRate}%</div>
            <div style="font-size: 10px; color: #64748b; font-weight: 600;">${p.totalLostMinutes > 0 ? `${p.totalLostMinutes} min imprévus` : 'Zéro blocage'}</div>
          </td>
        </tr>
      </table>

      <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;">
        <div style="font-size: 10px; font-weight: 700; color: #475569; margin-bottom: 6px;">
          <span>Répartition de l'effort opérationnel : </span>
          <strong style="color: #065f46;">${p.ratePercentage}% Fait</strong> • 
          <strong style="color: #92400e;">${p.taskInProgressRate}% En cours</strong> • 
          <strong style="color: #64748b;">${p.taskTodoRate}% À faire</strong>
          ${p.taskBlockedRate > 0 ? ` • <strong style="color: #b91c1c;">${p.taskBlockedRate}% Bloqué</strong>` : ''}
        </div>
        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; height: 10px; border-radius: 5px; overflow: hidden; background-color: #e2e8f0;">
          <tr>
            ${p.ratePercentage > 0 ? `<td style="width: ${p.ratePercentage}%; background-color: #10b981; height: 10px;"></td>` : ''}
            ${p.taskInProgressRate > 0 ? `<td style="width: ${p.taskInProgressRate}%; background-color: #f59e0b; height: 10px;"></td>` : ''}
            ${p.taskBlockedRate > 0 ? `<td style="width: ${p.taskBlockedRate}%; background-color: #ef4444; height: 10px;"></td>` : ''}
            ${p.taskTodoRate > 0 ? `<td style="width: ${p.taskTodoRate}%; background-color: #cbd5e1; height: 10px;"></td>` : ''}
          </tr>
        </table>
      </div>
    </div>

    <div style="padding: 12px 14px; border-radius: 12px; border: 1px solid ${capacityBorder}; background-color: ${capacityBg}; margin-bottom: 16px;">
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
        <tr>
          <td style="vertical-align: middle;">
            <div style="margin-bottom: 4px;">
              <span style="display: inline-block; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; background-color: #ffffff; padding: 2px 8px; border-radius: 6px; border: 1px solid #cbd5e1; color: #1e293b;">
                Capacité Opérationnelle du Jour
              </span>
              ${p.hasMilestone ? `<span style="display: inline-block; margin-left: 6px; font-size: 10px; font-weight: 700; background-color: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 6px; border: 1px solid #fde68a;">🏆 Jalon Clé Détecté : ${p.milestoneTitle}</span>` : ''}
            </div>
            <div style="font-size: 12px; font-weight: 700; color: ${capacityColor}; line-height: 1.4;">
              ${p.capacityAdvice}
            </div>
          </td>
          <td align="right" style="vertical-align: middle; width: 220px; font-size: 11px; background-color: #ffffff; padding: 8px 12px; border-radius: 10px; border: 1px solid #e2e8f0; line-height: 1.4; font-family: monospace;">
            <div><strong>Horaires officiels :</strong> 08h00 – 17h00</div>
            <div style="color: ${p.capacityStatus === 'overloaded' ? '#dc2626' : '#64748b'}; font-weight: ${p.capacityStatus === 'overloaded' ? '800' : 'normal'};">
              Pause obligatoire : 12h00 – 13h00
            </div>
            <div style="font-weight: 800; color: #2A7B76;">${p.totalTasks} sous-tâche(s) (${Math.round(p.plannedMinutes / 60)}h)</div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

export function buildTimesheetHtmlAttendanceSection(data: TimesheetReportData, p: PreparedPlanDuJour): string {
  const st = data.dailyAttendance?.statusType;
  const label = data.dailyAttendance?.statusLabel || (data.dailyAttendance?.arrivalTime ? 'Présent' : 'Non pointé');
  const bg = st === 'late' ? '#fef3c7' : (st === 'mission' ? '#e0e7ff' : (st === 'leave' ? '#f3e8ff' : (data.dailyAttendance?.arrivalTime ? '#d1fae5' : '#fee2e2')));
  const col = st === 'late' ? '#92400e' : (st === 'mission' ? '#3730a3' : (st === 'leave' ? '#6b21a8' : (data.dailyAttendance?.arrivalTime ? '#065f46' : '#991b1b')));
  const bor = st === 'late' ? '#fde68a' : (st === 'mission' ? '#c7d2fe' : (st === 'leave' ? '#e9d5ff' : (data.dailyAttendance?.arrivalTime ? '#a7f3d0' : '#fecaca')));

  return `
    <div style="border-radius: 12px; border: 1px solid #cbd5e1; overflow: hidden; margin-bottom: 16px; background-color: #ffffff;">
      <div style="background-color: #164e4b; color: #ffffff; padding: 8px 12px; font-weight: 800; font-size: 12px;">
        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
          <tr>
            <td>⏱️ RÉCAPITULATIF DE PRÉSENCE &amp; POINTAGE DU JOUR (08h00 – 17h00)</td>
            <td align="right" style="font-size: 11px; color: #a7f3d0; font-weight: 600;">
              Registre Officiel Citrine Pointage
            </td>
          </tr>
        </table>
      </div>
      <div style="padding: 12px 14px;">
        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
          <tr>
            <td style="width: 25%; padding: 4px 6px; vertical-align: top;">
              <div style="font-size: 9.5px; color: #64748b; font-weight: 700; text-transform: uppercase;">Statut du Jour</div>
              <div style="margin-top: 3px;">
                <span style="display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 10.5px; font-weight: 800; background-color: ${bg}; color: ${col}; border: 1px solid ${bor};">${label}</span>
              </div>
            </td>
            <td style="width: 25%; padding: 4px 6px; vertical-align: top;">
              <div style="font-size: 9.5px; color: #64748b; font-weight: 700; text-transform: uppercase;">Arrivée sur site</div>
              <div style="font-size: 14px; font-weight: 800; color: #0f172a; font-family: monospace; margin-top: 2px;">
                ${data.dailyAttendance?.arrivalTime || '—'}
              </div>
              <div style="font-size: 9.5px; color: #94a3b8; margin-top: 1px;">
                ${data.dailyAttendance?.location || 'Douala'} (Dès 08h00)
              </div>
            </td>
            <td style="width: 25%; padding: 4px 6px; vertical-align: top;">
              <div style="font-size: 9.5px; color: #64748b; font-weight: 700; text-transform: uppercase;">Pause Déjeuner (12h–13h)</div>
              <div style="font-size: 12px; font-weight: 700; color: #475569; font-family: monospace; margin-top: 2px;">
                ${data.dailyAttendance?.pauseStart && data.dailyAttendance?.pauseEnd
                  ? `${data.dailyAttendance.pauseStart} – ${data.dailyAttendance.pauseEnd}`
                  : (data.dailyAttendance?.pauseStart ? `Dès ${data.dailyAttendance.pauseStart}` : '12:00 – 13:00')}
              </div>
              <div style="font-size: 9.5px; color: #166534; margin-top: 1px;">
                ${data.dailyAttendance?.pauseStart ? 'Effectuée' : 'Pause officielle (12h–13h)'}
              </div>
            </td>
            <td style="width: 25%; padding: 4px 6px; vertical-align: top;">
              <div style="font-size: 9.5px; color: #64748b; font-weight: 700; text-transform: uppercase;">Départ / Fin de Journée</div>
              <div style="font-size: 14px; font-weight: 800; color: #164e4b; font-family: monospace; margin-top: 2px;">
                ${data.dailyAttendance?.departureTime || 'En poste (fin 17:00)'}
              </div>
              <div style="font-size: 10px; font-weight: 700; color: #0284c7; margin-top: 1px;">
                ⏱️ ${data.dailyAttendance?.hoursWorkedText || `${p.hoursWorkedNumber}h nettes`}
              </div>
            </td>
          </tr>
        </table>

        ${data.dailyAttendance?.incidentNote ? `
          <div style="margin-top: 10px; padding: 10px 14px; background-color: #fef2f2; border: 1px solid #fca5a5; border-left: 4px solid #dc2626; border-radius: 8px; font-size: 11px; color: #991b1b; font-weight: 700;">
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
              <tr>
                <td style="width: 22px; font-size: 14px; vertical-align: top;">🚨</td>
                <td style="vertical-align: middle;">
                  <span style="text-transform: uppercase; font-size: 9.5px; letter-spacing: 0.5px; background-color: #fee2e2; color: #b91c1c; padding: 2px 6px; border-radius: 4px; font-weight: 900; margin-right: 6px;">INCIDENT / ANOMALIE CONSTATÉ(E)</span>
                  <span style="color: #7f1d1d; font-weight: 800;">${data.dailyAttendance.incidentNote}</span>
                </td>
              </tr>
            </table>
          </div>
        ` : ''}
      </div>
    </div>

    <div style="border-radius: 12px; border: 1.5px solid ${p.presenceIncidents.length > 0 ? '#ea580c' : '#86efac'}; overflow: hidden; margin-bottom: 16px; background-color: #ffffff;">
      <div style="background-color: ${p.presenceIncidents.length > 0 ? '#c2410c' : '#15803d'}; color: #ffffff; padding: 8px 12px; font-weight: 800; font-size: 12px;">
        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
          <tr>
            <td>
              ${p.presenceIncidents.length > 0 ? '⚠️' : '✅'} SIGNALEMENT DES INCIDENTS &amp; ANOMALIES DE PRÉSENCE (${p.presenceIncidents.length})
            </td>
            <td align="right" style="font-size: 10px; color: #ffedd5; font-weight: 600;">
              Retards • Sorties • Départs anticipés • Permissions
            </td>
          </tr>
        </table>
      </div>
      <div style="padding: 10px 14px; background-color: ${p.presenceIncidents.length > 0 ? '#fff7ed' : '#f0fdf4'};">
        ${p.presenceIncidents.length > 0 ? `
          <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="border-bottom: 1.5px solid #fdba74; color: #9a3412; font-size: 10px; text-transform: uppercase;">
                <th style="padding: 6px 8px; text-align: left; width: 80px;">Heure</th>
                <th style="padding: 6px 8px; text-align: left; width: 150px;">Type</th>
                <th style="padding: 6px 8px; text-align: left;">Détails &amp; Motif constaté</th>
                <th style="padding: 6px 8px; text-align: center; width: 100px;">Statut</th>
              </tr>
            </thead>
            <tbody>
              ${p.presenceIncidents.map((inc) => `
                <tr style="border-bottom: 1px solid #fed7aa; background-color: #ffffff;">
                  <td style="padding: 8px 10px; font-family: monospace; font-weight: 800; color: #9a3412;">${inc.time || 'Pointage'}</td>
                  <td style="padding: 8px 10px;">
                    <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; background-color: #ffedd5; color: #c2410c; border: 1px solid #f97316;">
                      ${inc.label}
                    </span>
                  </td>
                  <td style="padding: 8px 10px; font-weight: 700; color: #431407;">${inc.description}</td>
                  <td style="padding: 8px 10px; text-align: center;">
                    <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 9.5px; font-weight: 800; ${inc.isJustified ? 'background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0;' : 'background-color: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;'}">
                      ${inc.isJustified ? '✓ Justifié' : '⚠️ Non régularisé'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : `
          <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
            <tr>
              <td style="width: 24px; font-size: 15px; vertical-align: middle;">✅</td>
              <td style="vertical-align: middle; color: #166534; font-weight: 700; font-size: 11.5px;">
                Aucun incident de présence à signaler sur cette journée : ponctualité respectée (dès 08h00), pause 12h–13h conforme, aucune sortie non justifiée.
              </td>
            </tr>
          </table>
        `}
      </div>
    </div>
  `;
}
