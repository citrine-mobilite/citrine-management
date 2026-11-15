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

      const pauseStr =
        day.pauseStart && day.pauseEnd
          ? `${day.pauseStart} - ${day.pauseEnd}`
          : day.pauseStart
          ? `Dès ${day.pauseStart}`
          : '—';

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
    })
    .join('');

  return `
    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; margin-bottom: 20px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.03);">
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
              ${
                emp.latenessCount > 0
                  ? `<span style="display: inline-block; background-color: #fef2f2; border: 1px solid #fecaca; color: #991b1b; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; margin-left: 6px;">⚠️ ${emp.latenessCount} retard${emp.latenessCount > 1 ? 's' : ''}</span>`
                  : ''
              }
            </td>
          </tr>
        </table>
      </div>
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
        <tbody style="color: #334155;">${rowsHtml}</tbody>
      </table>
    </div>
  `;
}
