import { getCollectionData } from '../db/repository';
import { sendThreadedEmployeeEmail } from './serverMailService';
import { getDoualaDateInfo } from './taskSheetReportService';
import {
  resolveClockingAppearance,
  resolveClockingRecipients,
} from './mail/clockingNotificationHelpers';
import { buildClockingNotificationHtml } from './mail/clockingNotificationHtml';

export interface ClockingEmailNotificationInput {
  presence: any;
  action?: 'arrival' | 'pauseStart' | 'pauseEnd' | 'departure' | 'sortieProStart' | 'sortieProEnd' | string;
  incident?: any;
  notification?: any;
  employeeName?: string;
  employeeEmail?: string;
  employeeId?: string | number;
}

export async function sendClockingNotificationEmail(input: ClockingEmailNotificationInput): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const presence = input.presence || {};
  const doualaTime = getDoualaDateInfo();

  try {
    const [employees, users, companySettingsList] = await Promise.all([
      getCollectionData('employees'),
      getCollectionData('users'),
      getCollectionData('company_settings'),
    ]);

    const empId = String(input.employeeId || presence.employeeId || presence.employee_id || '');
    const empMatch = employees.find((e: any) => {
      const eId = String(e.id || '');
      const eUid = String(e.uid || '');
      const eDbId = String(e._dbId || '');
      return (
        (empId && (eId === empId || eUid === empId || eDbId === empId)) ||
        (input.employeeEmail && (e.email || '').toLowerCase() === input.employeeEmail.toLowerCase()) ||
        (input.employeeName && (e.name || '').toLowerCase() === input.employeeName.toLowerCase())
      );
    });

    const userMatch = users.find((u: any) => {
      const uId = String(u.id || '');
      return (
        (empId && uId === empId) ||
        (empMatch?.email && (u.email || '').toLowerCase() === empMatch.email.toLowerCase()) ||
        (input.employeeEmail && (u.email || '').toLowerCase() === input.employeeEmail.toLowerCase())
      );
    });

    const employeeName =
      input.employeeName || empMatch?.name || presence.employeeName || userMatch?.name || 'Collaborateur Citrine';
    const employeeEmail =
      input.employeeEmail || empMatch?.email || userMatch?.email || presence.employeeEmail || '';
    const department = empMatch?.department || 'Direction Générale';
    const position = empMatch?.position || empMatch?.jobTitle || 'Collaborateur';

    const companySettings = companySettingsList && companySettingsList.length > 0 ? companySettingsList[0] : null;
    const appearance = resolveClockingAppearance({
      presence,
      action: input.action,
      notification: input.notification,
      companySettings,
      timeOnly: doualaTime.timeOnly,
    });

    const recipientList = await resolveClockingRecipients(users, employeeEmail);
    const htmlContent = buildClockingNotificationHtml({
      appearance,
      employeeName,
      department,
      position,
      fullDateStr: doualaTime.fullDateStr,
      presence,
      incident: input.incident,
    });

    const result = await sendThreadedEmployeeEmail({
      employeeName,
      employeeId: empId,
      employeeEmail,
      eventTitle: `Pointage : ${appearance.actionLabel}`,
      threadCategory: 'attendance',
      threadSubject: `Pointage & Présence - ${employeeName}`,
      htmlContent,
      recipientEmails: recipientList,
    });

    if (!result.success) {
      console.warn(`⚠️ [MAIL POINTAGE AVERTISSEMENT] Résultat :`, result.error);
    }

    return result;
  } catch (error: any) {
    const rawError = error?.message || String(error);
    console.error(`❌ [sendClockingNotificationEmail Error]:`, error);
    return {
      success: false,
      error: rawError,
    };
  }
}
