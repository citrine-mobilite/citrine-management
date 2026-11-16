import {
  sendThreadedEmployeeEmail,
  getEffectiveSmtpConfig,
  parseEmailList,
} from '../../services/serverMailService';
import { supabaseAdmin } from '../../lib/supabase';
import { Resend } from 'resend';
import {
  sendWeeklyConsolidatedReport,
  compileWeeklyAttendanceData,
} from '../../services/weeklyAttendanceReportService';
import { executeDailyTaskSheetDispatch } from '../../services/dailyTaskSheetCronService';
import { sendMondayGreetingToAllEmployees } from '../../services/mondayGreetingMailService';
import { executeDueRoutineRemindersDispatch } from '../../services/routineReminderCronService';

export async function handleMailAndCronRoutes(
  urlPath: string,
  method: string,
  req: any,
  body: any,
  res: any
): Promise<boolean> {
  if (urlPath === '/mail/config' && method === 'GET') {
    const config = await getEffectiveSmtpConfig();
    res.status(200).json({
      success: true,
      config: {
        smtpHost: config.host || '',
        smtpPort: config.port || 587,
        smtpSecure: Boolean(config.secure),
        smtpUser: config.user || '',
        smtpPass: config.pass || '',
        smtpFrom: config.from || '',
        smtpSenderName: config.senderName || '',
        hrNotificationEmail: config.hrEmail || '',
      },
    });
    return true;
  }

  if (urlPath === '/mail/config' && method === 'POST') {
    const {
      smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass,
      smtpFrom, smtpSenderName, hrNotificationEmail, enableEmailNotifications,
    } = body;

    let existing: any = {};
    try {
      const { data } = await supabaseAdmin.from('company_settings').select('*');
      if (data && Array.isArray(data) && data.length > 0) {
        const found = data.find((s: any) => s.id === 'main_config' || s.doc_id === 'main_config') || data[0];
        const raw = found.raw_data && typeof found.raw_data === 'object' ? found.raw_data : found.setting_value && typeof found.setting_value === 'object' ? found.setting_value : found;
        existing = { ...found, ...raw };
      }
    } catch (e) {
      console.warn('⚠️ Impossible de lire les réglages existants:', e);
    }

    const updatedDoc = {
      ...existing,
      id: 'main_config',
      doc_id: 'main_config',
      enableEmailNotifications: enableEmailNotifications !== undefined ? Boolean(enableEmailNotifications) : true,
      smtpHost: smtpHost !== undefined ? String(smtpHost).trim() : existing.smtpHost,
      smtpPort: smtpPort !== undefined ? Number(smtpPort) : existing.smtpPort,
      smtpSecure: smtpSecure !== undefined ? Boolean(smtpSecure) : existing.smtpSecure,
      smtpUser: smtpUser !== undefined ? String(smtpUser).trim() : existing.smtpUser,
      smtpPass: smtpPass !== undefined ? String(smtpPass).trim() : existing.smtpPass,
      smtpFrom: smtpFrom !== undefined ? String(smtpFrom).trim() : existing.smtpFrom,
      smtpSenderName: smtpSenderName !== undefined ? String(smtpSenderName).trim() : existing.smtpSenderName,
      hrNotificationEmail: hrNotificationEmail !== undefined ? String(hrNotificationEmail).trim() : existing.hrNotificationEmail,
      updatedAt: new Date().toISOString(),
    };

    await supabaseAdmin.from('company_settings').upsert({
      id: 'main_config',
      doc_id: 'main_config',
      raw_data: updatedDoc,
      setting_value: updatedDoc,
      updated_at: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      message: 'Configuration SMTP et RH enregistrée avec succès.',
      config: updatedDoc,
    });
    return true;
  }

  if (urlPath === '/mail/send-threaded' && method === 'POST') {
    const {
      employeeName, employeeId, employeeEmail, eventTitle, htmlContent,
      attachments, smtpConfig, threadCategory, threadSubject, overrideRecipients, recipientEmails,
    } = body;

    if (!employeeName || !eventTitle || !htmlContent) {
      const missingFields = [!employeeName && 'employeeName', !eventTitle && 'eventTitle', !htmlContent && 'htmlContent'].filter(Boolean).join(', ');
      res.status(400).json({ success: false, error: `Paramètres obligatoires manquants : ${missingFields}` });
      return true;
    }

    const targetRecipients = overrideRecipients || recipientEmails;
    const result = await sendThreadedEmployeeEmail(
      {
        employeeName, employeeId, employeeEmail, eventTitle, threadCategory, threadSubject,
        htmlContent, attachments, overrideRecipients: targetRecipients, recipientEmails: targetRecipients,
      },
      smtpConfig
    );
    res.status(result.success ? 200 : 500).json(result);
    return true;
  }

  if (urlPath === '/mail/test-connection' && method === 'POST') {
    const { testRecipient, smtpConfig } = body;
    const effective = await getEffectiveSmtpConfig(smtpConfig);
    const targetRecipients = testRecipient && testRecipient.trim() ? parseEmailList(testRecipient) : parseEmailList(effective.hrEmail);

    if (targetRecipients.length === 0) {
      res.status(400).json({
        success: false,
        error: "Aucun destinataire spécifié et la variable HR_NOTIFICATION_EMAIL n'est pas configurée.",
      });
      return true;
    }

    const result = await sendMondayGreetingToAllEmployees({ testRecipient: targetRecipients.join(', '), forceMonday: true });
    res.status(result.success ? 200 : 500).json(result);
    return true;
  }

  if (urlPath === '/email/send' && method === 'POST') {
    const { to, subject, html } = body;
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'RESEND_API_KEY environment variable is missing' });
      return true;
    }
    const resend = new Resend(apiKey);
    const { data: resData, error: resError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Citrine Management <onboarding@resend.dev>',
      to: [to],
      subject: subject || 'Notification Citrine Management',
      html,
    });
    if (resError) {
      res.status(400).json({ success: false, error: resError.message || JSON.stringify(resError) });
      return true;
    }
    res.status(200).json({ success: true, data: resData });
    return true;
  }

  if (urlPath === '/attendance/weekly-recap' && method === 'GET') {
    try {
      const data = await compileWeeklyAttendanceData({ manual: true, forceFriday: req.query?.forceFriday === 'true' });
      res.status(200).json({ success: true, report: data });
    } catch (error: any) {
      console.error('[API /attendance/weekly-recap GET Error]:', error);
      res.status(500).json({ success: false, error: error.message || 'Erreur de compilation du récapitulatif.' });
    }
    return true;
  }

  if (urlPath === '/attendance/weekly-recap' && method === 'POST') {
    try {
      const { forceFriday, testRecipient } = body;
      const result = await sendWeeklyConsolidatedReport({ manual: true, forceFriday: Boolean(forceFriday), testRecipient });
      res.status(result.success ? 200 : 500).json(result);
    } catch (error: any) {
      console.error('[API /attendance/weekly-recap POST Error]:', error);
      res.status(500).json({ success: false, error: error.message || "Échec de l'envoi du récapitulatif hebdomadaire." });
    }
    return true;
  }

  if (
    urlPath === '/cron/daily-tasksheet' ||
    urlPath === '/api/cron/daily-tasksheet' ||
    urlPath === '/cron/daily-timesheet' ||
    urlPath === '/api/cron/daily-timesheet'
  ) {
    try {
      const result = await executeDailyTaskSheetDispatch();
      res.status(result.success ? 200 : 500).json(result);
    } catch (error: any) {
      console.error('[API /cron/daily-tasksheet Error]:', error);
      res.status(500).json({ success: false, error: error.message || String(error) });
    }
    return true;
  }

  if (urlPath === '/cron/weekly-recap' || urlPath === '/api/cron/weekly-recap') {
    try {
      const result = await sendWeeklyConsolidatedReport({ forceFriday: true });
      res.status(result.success ? 200 : 500).json(result);
    } catch (error: any) {
      console.error('[API /cron/weekly-recap Error]:', error);
      res.status(500).json({ success: false, error: error.message || String(error) });
    }
    return true;
  }

  if (urlPath === '/cron/monday-greeting' || urlPath === '/api/cron/monday-greeting') {
    try {
      const forceMonday = req.query?.force === 'true' || body?.force === true;
      const testRecipient = (req.query?.testRecipient as string) || body?.testRecipient;
      const result = await sendMondayGreetingToAllEmployees({ forceMonday, testRecipient });
      res.status(result.success ? 200 : 500).json(result);
    } catch (error: any) {
      console.error('[API /cron/monday-greeting Error]:', error);
      res.status(500).json({ success: false, error: error.message || String(error) });
    }
    return true;
  }

  if (urlPath === '/cron/routine-reminders' || urlPath === '/api/cron/routine-reminders') {
    try {
      const result = await executeDueRoutineRemindersDispatch();
      res.status(result.success ? 200 : 500).json(result);
    } catch (error: any) {
      console.error('[API /cron/routine-reminders Error]:', error);
      res.status(500).json({ success: false, error: error.message || String(error) });
    }
    return true;
  }

  return false;
}
