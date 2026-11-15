import { EmployeeWeeklySummary } from './weeklyReportTypes';

export function buildEmployeeSummaryCardHtml(emp: EmployeeWeeklySummary): string {
  const initial = (emp.employeeName || 'C').substring(0, 2).toUpperCase();

  const rowsHtml = emp.days
    .map((day, dIdx) => {
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

      const rowBg = dIdx % 2 === 1 ? '#fafaf9' : '#ffffff';
      const pauseStr =
        day.pauseStart && day.pauseEnd
          ? `${day.pauseStart} - ${day.pauseEnd}`
          : day.pauseStart
          ? `Dès ${day.pauseStart}`
          : '—';

      return `
        <tr bgcolor="${rowBg}" style="background-color: ${rowBg}; border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 12px; font-weight: 700; color: #1e293b; border-bottom: 1px solid #f1f5f9;">
            ${day.dayName} <span style="font-weight: normal; color: #64748b; font-size: 10px;">(${day.formattedDate})</span>
          </td>
          <td style="padding: 8px 8px; font-family: Consolas, monospace; font-weight: 600; color: ${day.arrivalTime !== '—' ? '#0f172a' : '#94a3b8'}; border-bottom: 1px solid #f1f5f9;">
            ${day.arrivalTime}
          </td>
          <td style="padding: 8px 8px; font-family: Consolas, monospace; font-size: 10.5px; color: #64748b; border-bottom: 1px solid #f1f5f9;">
            ${pauseStr}
          </td>
          <td style="padding: 8px 8px; font-family: Consolas, monospace; font-weight: 600; color: ${day.departureTime !== '—' ? '#0f172a' : '#94a3b8'}; border-bottom: 1px solid #f1f5f9;">
            ${day.departureTime}
          </td>
          <td align="right" style="padding: 8px 10px; text-align: right; font-family: Consolas, monospace; font-weight: 700; color: #164e4b; border-bottom: 1px solid #f1f5f9;">
            ${day.workedHoursText}
          </td>
          <td align="center" style="padding: 8px 12px; text-align: center; border-bottom: 1px solid #f1f5f9;">
            <span style="display: inline-block; padding: 2px 8px; font-size: 10px; font-weight: 700; background-color: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder};">
              ${day.statusLabel}
            </span>
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="width: 100%; background-color: #ffffff; border: 1px solid #cbd5e1; margin-bottom: 18px;">
      <tr>
        <td bgcolor="#f8fafc" style="background-color: #f8fafc; padding: 12px 16px; border-bottom: 1px solid #cbd5e1;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td class="email-stack" style="vertical-align: middle;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td width="36" height="36" align="center" valign="middle" bgcolor="#164e4b" style="width: 36px; height: 36px; background-color: #164e4b; color: #ffffff; font-weight: 800; font-size: 12px; text-align: center;">
                      ${initial}
                    </td>
                    <td style="padding-left: 12px; vertical-align: middle;">
                      <div style="font-size: 14px; font-weight: 800; color: #0f172a;">${emp.employeeName}</div>
                      <div style="font-size: 11px; color: #64748b;">
                        ${emp.position} • <span style="color: #164e4b; font-weight: 700;">${emp.department}</span>
                        ${emp.employeeEmail ? ` • <span style="font-family: Consolas, monospace; font-size: 10px;">${emp.employeeEmail}</span>` : ''}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
              <td align="right" class="email-stack-left email-badge-row" style="vertical-align: middle;">
                <span style="display: inline-block; background-color: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-size: 11px; font-weight: 700; padding: 4px 8px; margin-right: 4px;">
                  Total semaine : ${emp.totalWorkedHoursText}
                </span>
                <span style="display: inline-block; background-color: #f1f5f9; border: 1px solid #cbd5e1; color: #334155; font-size: 11px; font-weight: 700; padding: 4px 8px;">
                  ${emp.daysWorkedCount}/${emp.totalDaysExpected} j. (${emp.attendanceRate}%)
                </span>
                ${
                  emp.latenessCount > 0
                    ? `<span style="display: inline-block; background-color: #fef2f2; border: 1px solid #fecaca; color: #991b1b; font-size: 11px; font-weight: 700; padding: 4px 8px; margin-left: 4px;">${emp.latenessCount} retard${emp.latenessCount > 1 ? 's' : ''}</span>`
                    : ''
                }
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 0;">
          <div class="email-scroll-x">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="email-mobile-table" style="width: 100%; font-size: 11.5px; border-collapse: collapse; text-align: left;">
              <thead>
                <tr bgcolor="#f1f5f9" style="background-color: #f1f5f9; color: #475569; font-size: 10px; font-weight: 700; text-transform: uppercase;">
                  <th align="left" style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">Jour</th>
                  <th align="left" style="padding: 8px 8px; border-bottom: 1px solid #e2e8f0;">Arrivée</th>
                  <th align="left" style="padding: 8px 8px; border-bottom: 1px solid #e2e8f0;">Pause / Reprise</th>
                  <th align="left" style="padding: 8px 8px; border-bottom: 1px solid #e2e8f0;">Départ</th>
                  <th align="right" style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">Heures</th>
                  <th align="center" style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">Statut</th>
                </tr>
              </thead>
              <tbody style="color: #334155;">${rowsHtml}</tbody>
              <tfoot>
                <tr bgcolor="#ecfdf5" style="background-color: #ecfdf5; color: #065f46; font-size: 11px; font-weight: 800;">
                  <td colspan="4" style="padding: 8px 12px; border-top: 1px solid #a7f3d0;">
                    Cumul individuel de la semaine — ${emp.employeeName}
                  </td>
                  <td align="right" style="padding: 8px 10px; border-top: 1px solid #a7f3d0; font-family: Consolas, monospace;">
                    ${emp.totalWorkedHoursText}
                  </td>
                  <td align="center" style="padding: 8px 12px; border-top: 1px solid #a7f3d0;">
                    ${emp.attendanceRate}% assiduité
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </td>
      </tr>
    </table>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td height="14" style="font-size: 1px; line-height: 14px;">&nbsp;</td></tr></table>
  `;
}
