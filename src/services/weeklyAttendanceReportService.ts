import { getCollectionData, saveDocumentData } from '../db/repository';
import {
  sendConsolidatedReportEmail,
  parseEmailList,
  getEffectiveSmtpConfig,
} from './serverMailService';
import {
  WeeklyAttendanceReportData,
} from './weeklyAttendance/weeklyReportTypes';
import { isStrictSuperAdminAccount } from './weeklyAttendance/weeklyDateAndHourUtils';
import { compileWeeklyAttendanceData } from './weeklyAttendance/weeklyCompilerService';
import { buildWeeklyConsolidatedEmailHtml } from './weeklyAttendance/weeklyEmailHtmlBuilder';

export * from './weeklyAttendance/weeklyReportTypes';
export {
  isStrictSuperAdminAccount,
  isArrivalAfterThreshold,
  getDoualaCurrentWeek,
} from './weeklyAttendance/weeklyDateAndHourUtils';
export { compileWeeklyAttendanceData } from './weeklyAttendance/weeklyCompilerService';
export { buildWeeklyConsolidatedEmailHtml } from './weeklyAttendance/weeklyEmailHtmlBuilder';

export async function sendWeeklyConsolidatedReport(options?: {
  manual?: boolean;
  forceFriday?: boolean;
  referenceDate?: Date;
  testRecipient?: string;
}): Promise<{
  success: boolean;
  message: string;
  recipients?: string[];
  ccCount?: number;
  ccRecipients?: string[];
  reportData?: WeeklyAttendanceReportData;
  error?: string;
  details?: any;
}> {
  try {
    const reportData = await compileWeeklyAttendanceData(options);
    const htmlContent = buildWeeklyConsolidatedEmailHtml(reportData);

    const config = await getEffectiveSmtpConfig();
    const employees = await getCollectionData('employees');
    const users = await getCollectionData('users');

    let recipients: string[] = [];
    if (options?.testRecipient) {
      recipients = parseEmailList(options.testRecipient);
    } else {
      const admins = users.filter(
        (u: any) =>
          u.role_id === 1 ||
          u.role === 'administrateur' ||
          String(u.raw_data?.role).toLowerCase().includes('admin')
      );
      const adminEmails = admins.map((a: any) => a.email).filter(Boolean);
      recipients = Array.from(new Set([...adminEmails, ...parseEmailList(config.hrEmail)]));
    }

    if (recipients.length === 0) {
      if (process.env.SMTP_USER) recipients.push(process.env.SMTP_USER);
      else recipients.push('citrinemobilite@gmail.com');
    }

    const activeEmployees = employees.filter((e: any) => {
      const status = String(e.status || '').toLowerCase();
      const isActive = status !== 'archived' && status !== 'inactif' && status !== 'inactive' && Boolean(e.email);
      return isActive && !isStrictSuperAdminAccount(e, users);
    });

    const ccEmails = activeEmployees
      .map((e: any) => (e.email || '').trim())
      .filter((mail: string) => mail && mail.includes('@'));

    const sendRes = await sendConsolidatedReportEmail({
      subject: reportData.title,
      title: reportData.title,
      htmlContent,
      recipientEmails: recipients,
      ccEmails,
    });

    if (!sendRes.success) {
      return {
        success: false,
        message: sendRes.error || "Échec de l'envoi de l'e-mail du rapport hebdomadaire.",
        error: sendRes.error,
        details: sendRes.details,
      };
    }

    const auditId = `audit-weekly-${Date.now()}`;
    void saveDocumentData('admin_audit_logs', {
      id: auditId,
      timestamp: new Date().toISOString(),
      authorName: 'Automate RH Citrine',
      authorRole: 'system',
      targetName: `Équipe (${reportData.totalCollaborators} collaborateurs)`,
      operationType: 'systeme',
      logCategory: 'system_event',
      operationLabel: options?.manual ? 'Envoi manuel rapport hebdomadaire' : 'Envoi hebdomadaire des présences',
      details: `${reportData.title} — ${recipients.length} destinataire(s), ${ccEmails.length} copie(s).`,
      level: 'success',
    }).catch(() => undefined);

    return {
      success: true,
      message: `Rapport hebdomadaire des présences envoyé avec succès aux responsables, et mis en copie à ${ccEmails.length} collaborateurs.`,
      recipients: sendRes.recipients,
      ccCount: ccEmails.length,
      ccRecipients: sendRes.ccRecipients,
      reportData,
    };
  } catch (err: any) {
    const rawError = err?.message || String(err);
    console.error('💥 [sendWeeklyConsolidatedReport EXCEPTION]:', err);
    return {
      success: false,
      message: `Erreur inattendue lors de la génération du rapport : ${rawError}`,
      error: rawError,
      details: err,
    };
  }
}
