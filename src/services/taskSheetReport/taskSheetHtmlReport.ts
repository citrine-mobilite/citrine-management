import { TaskSheetReportData } from './taskSheetReportTypes';
import { preparePlanDuJourData } from './preparePlanDuJourData';
import {
  buildTaskSheetHtmlAttendanceSection,
  buildTaskSheetHtmlHeaderAndStats,
} from './taskSheetHtmlReportSections';
import { buildTaskSheetHtmlBodyTables } from './taskSheetHtmlReportBody';
import { buildOutlookHtmlDocument } from '../mail/outlookEmailShell';

export function buildTaskSheetHtmlReport(data: TaskSheetReportData): string {
  const p = preparePlanDuJourData(data);
  const employeeName = data.employeeName || 'Collaborateur';

  const innerHtml = `
    <tr>
      <td bgcolor="#ffffff" class="email-pad" style="background-color: #ffffff; padding: 22px; font-size: 12px; color: #1c1917;">
        ${buildTaskSheetHtmlHeaderAndStats(data, p)}
        ${buildTaskSheetHtmlAttendanceSection(data, p)}
        ${buildTaskSheetHtmlBodyTables(data, p)}
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td align="center" style="padding-top: 10px; font-size: 11px; color: #78716c; text-align: center;">
              <em>Le classeur officiel Microsoft Excel (.xlsx) stylisé du TaskSheet est joint à ce message.</em>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;

  return buildOutlookHtmlDocument({
    title: `TaskSheet - ${employeeName} (${p.dateText})`,
    maxWidth: 780,
    bodyBg: '#f5f5f4',
    cardBg: '#ffffff',
    innerHtml,
  });
}
