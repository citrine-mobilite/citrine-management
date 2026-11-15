import { TimesheetReportData } from './timesheetReportTypes';
import { preparePlanDuJourData } from './preparePlanDuJourData';
import {
  buildTimesheetHtmlAttendanceSection,
  buildTimesheetHtmlHeaderAndStats,
} from './timesheetHtmlReportSections';
import { buildTimesheetHtmlBodyTables } from './timesheetHtmlReportBody';

export function buildTimesheetHtmlReport(data: TimesheetReportData): string {
  const p = preparePlanDuJourData(data);

  return `
    <div style="font-family: Calibri, 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif; background-color: #f5f5f4; padding: 20px 10px; color: #1c1917;">
      <div style="max-width: 780px; margin: 0 auto; background-color: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid #d6d3d1; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05); font-size: 12px; color: #1c1917;">
        ${buildTimesheetHtmlHeaderAndStats(data, p)}
        ${buildTimesheetHtmlAttendanceSection(data, p)}
        ${buildTimesheetHtmlBodyTables(data, p)}
        <div style="text-align: center; margin-top: 14px; font-size: 10.5px; color: #78716c;">
          📎 <em>Le classeur officiel Microsoft Excel (.xlsx) complet est joint à ce fil de discussion pour exploitation tabulaire.</em>
        </div>
      </div>
    </div>
  `;
}
