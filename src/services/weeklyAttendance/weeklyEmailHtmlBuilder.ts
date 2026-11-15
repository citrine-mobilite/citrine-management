import { WeeklyAttendanceReportData } from './weeklyReportTypes';
import { buildEmployeeSummaryCardHtml } from './weeklyEmailEmployeeCardHtml';
import { buildOutlookHtmlDocument } from '../mail/outlookEmailShell';

export function buildWeeklyConsolidatedEmailHtml(data: WeeklyAttendanceReportData): string {
  const badgeText = data.isManualTrigger
    ? 'Point d’Étape en Cours de Semaine'
    : 'Bilan Hebdomadaire Officiel (Clôture)';

  const perEmployeeSummaryRows = data.summaries
    .map((emp, idx) => {
      const rowBg = idx % 2 === 1 ? '#f8fafc' : '#ffffff';
      const lateColor = emp.latenessCount > 0 ? '#b91c1c' : '#065f46';
      return `
        <tr bgcolor="${rowBg}" style="background-color: ${rowBg};">
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 700;">
            ${emp.employeeName}
            <div style="font-size: 10px; font-weight: 400; color: #64748b;">${emp.position} • ${emp.department}</div>
          </td>
          <td align="center" style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-family: Consolas, monospace; color: #334155;">
            ${emp.daysWorkedCount}/${emp.totalDaysExpected} j.
          </td>
          <td align="right" style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-family: Consolas, monospace; font-weight: 800; color: #164e4b; font-size: 12.5px;">
            ${emp.totalWorkedHoursText}
          </td>
          <td align="center" style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: ${lateColor};">
            ${emp.latenessCount}
          </td>
          <td align="right" style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-family: Consolas, monospace; font-weight: 700; color: #0369a1;">
            ${emp.attendanceRate}%
          </td>
        </tr>
      `;
    })
    .join('');

  const innerHtml = `
    <tr>
      <td bgcolor="#164e4b" class="email-pad" style="background-color: #164e4b; padding: 24px 26px; text-align: left; color: #ffffff;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td class="email-stack" style="vertical-align: middle;">
              <div style="font-family: Georgia, serif; font-size: 24px; font-weight: bold; color: #ffffff; letter-spacing: 0.5px;">CITRINE MOBILITÉ</div>
              <div style="font-size: 11px; color: #a7f3d0; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-top: 3px;">Direction des Ressources Humaines &amp; Opérations</div>
            </td>
            <td align="right" class="email-stack-left" style="vertical-align: top;">
              <span style="display: inline-block; background-color: #0d3b38; color: #ffffff; font-size: 10px; font-weight: bold; padding: 6px 12px; border: 1px solid #2A7B76;">${badgeText}</span>
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="padding-top: 16px; border-top: 1px solid #2A7B76;">
              <h1 class="email-h1" style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; line-height: 1.3;">${data.title}</h1>
              <div style="font-size: 12px; color: #ccfbf1; margin-top: 6px;">Période analysée : <strong>${data.startDateStr}</strong> au <strong>${data.endDateStr}</strong></div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td bgcolor="#f0fdf4" class="email-pad-sm" style="background-color: #f0fdf4; border-bottom: 1px solid #bbf7d0; padding: 14px 26px; font-size: 12px; color: #166534; line-height: 1.5;">
        <strong>Information Équipe :</strong> Ce rapport consolidé présente les heures individuelles et l’assiduité de chaque collaborateur pour la semaine.
        <div style="margin-top: 6px; font-size: 11px; color: #15803d; font-weight: 700;">
          Seuil de retard appliqué : ${data.lateThreshold} • Comptes Super Administrateurs exclus du récapitulatif.
        </div>
      </td>
    </tr>
    <tr>
      <td class="email-pad-sm" style="padding: 18px 26px 8px 26px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td width="32%" align="center" bgcolor="#f8fafc" class="email-kpi-cell" style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 14px 10px; text-align: center;">
              <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Collaborateurs</div>
              <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 4px;">${data.totalCollaborators}</div>
              <div style="font-size: 10px; color: #10b981; font-weight: 700; margin-top: 2px;">Actifs suivis</div>
            </td>
            <td width="12" class="email-kpi-spacer" style="width: 12px; font-size: 1px;">&nbsp;</td>
            <td width="32%" align="center" bgcolor="#f8fafc" class="email-kpi-cell" style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 14px 10px; text-align: center;">
              <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Assiduité Moy.</div>
              <div style="font-size: 20px; font-weight: 800; color: #0284c7; margin-top: 4px;">${data.averageAttendanceRate}%</div>
              <div style="font-size: 10px; color: #64748b; font-weight: 700; margin-top: 2px;">Moyenne équipe</div>
            </td>
            <td width="12" class="email-kpi-spacer" style="width: 12px; font-size: 1px;">&nbsp;</td>
            <td width="32%" align="center" bgcolor="#f8fafc" class="email-kpi-cell" style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 14px 10px; text-align: center;">
              <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Retards Signalés</div>
              <div style="font-size: 20px; font-weight: 800; color: ${data.totalLateness > 0 ? '#b91c1c' : '#10b981'}; margin-top: 4px;">${data.totalLateness}</div>
              <div style="font-size: 10px; color: #64748b; font-weight: 700; margin-top: 2px;">Seuil : &gt; ${data.lateThreshold}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td class="email-pad" style="padding: 16px 26px 8px 26px;">
        <div style="font-size: 12.5px; font-weight: 800; color: #164e4b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; border-bottom: 2px solid #164e4b; padding-bottom: 6px;">
          Synthèse Individuelle des Heures (Semaine en cours)
        </div>
        <div class="email-scroll-x">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="email-mobile-table" style="width: 100%; border: 1px solid #cbd5e1; font-size: 11.5px;">
            <thead>
              <tr bgcolor="#164e4b" style="background-color: #164e4b; color: #ffffff; font-size: 10.5px; text-transform: uppercase;">
                <th align="left" style="padding: 9px 12px; color: #ffffff;">Collaborateur &amp; Poste</th>
                <th align="center" style="padding: 9px 10px; color: #ffffff;">Jours Pointés</th>
                <th align="right" style="padding: 9px 12px; color: #ffffff;">Total Heures (Semaine)</th>
                <th align="center" style="padding: 9px 10px; color: #ffffff;">Retards</th>
                <th align="right" style="padding: 9px 12px; color: #ffffff;">Assiduité</th>
              </tr>
            </thead>
            <tbody>${perEmployeeSummaryRows}</tbody>
          </table>
        </div>
      </td>
    </tr>
    <tr>
      <td class="email-pad" style="padding: 18px 26px;">
        <div style="font-size: 12.5px; font-weight: 800; color: #164e4b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 14px; border-bottom: 2px solid #164e4b; padding-bottom: 6px;">
          Registre Individuel Détaillé par Collaborateur
        </div>
        ${data.summaries.map((emp) => buildEmployeeSummaryCardHtml(emp)).join('')}
      </td>
    </tr>
    <tr>
      <td bgcolor="#fafaf9" class="email-pad-sm" style="background-color: #fafaf9; border-top: 1px solid #e4e4e7; padding: 18px 26px; text-align: center; font-size: 11px; color: #71717a;">
        <div style="font-weight: 700; color: #3f3f46; font-size: 12px; margin-bottom: 4px;">Citrine Mobilité — Douala, Cameroun</div>
        <div>Généré automatiquement par le Système Intégré RH &amp; Pointage le ${data.generatedAtStr}</div>
        <div style="font-size: 10px; color: #a1a1aa; margin-top: 6px;">Notification interne confidentielle • Strictement réservée aux collaborateurs et à la direction</div>
      </td>
    </tr>
  `;

  return buildOutlookHtmlDocument({
    title: data.title,
    maxWidth: 840,
    bodyBg: '#f4f4f5',
    cardBg: '#ffffff',
    innerHtml,
  });
}
