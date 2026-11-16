import { TaskSheetReportData } from './taskSheetReportTypes';
import { preparePlanDuJourData } from './preparePlanDuJourData';
import {
  buildTaskSheetHtmlAttendanceSection,
  buildTaskSheetHtmlHeaderAndStats,
} from './taskSheetHtmlReportSections';
import { buildTaskSheetHtmlBodyTables } from './taskSheetHtmlReportBody';
import { buildOutlookHtmlDocument } from '../mail/outlookEmailShell';
import { buildOfficialEmailCompanyFooterHtml } from './citrineOfficialEmailHeaderFooter';

export function buildTaskSheetHtmlReport(data: TaskSheetReportData): string {
  const p = preparePlanDuJourData(data);
  const employeeName = data.employeeName || 'Collaborateur';

  const innerHtml = `
    <tr>
      <td bgcolor="#ffffff" class="email-pad" style="background-color: #ffffff; padding: 22px; font-size: 12px; color: #1c1917;">
        ${buildTaskSheetHtmlHeaderAndStats(data, p)}
        ${buildTaskSheetHtmlAttendanceSection(data, p)}
        ${buildTaskSheetHtmlBodyTables(data, p)}
        ${buildOfficialEmailCompanyFooterHtml(
          'Le classeur officiel Microsoft Excel (.xlsx) stylisé de la Feuille de Tâches est joint à ce message.'
        )}
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
