import express from 'express';
import { getCollectionData, saveDocumentData } from '../db/repository';
import { sendThreadedEmployeeEmail, getEffectiveSmtpConfig, parseEmailList } from '../services/serverMailService';
import { sendWeeklyConsolidatedReport, compileWeeklyAttendanceData } from '../services/weeklyAttendanceReportService';
import { executeDailyTaskSheetDispatch } from '../services/dailyTaskSheetCronService';
import {
  executeMonthlyTaskSheetDispatch,
  executeYearlyTaskSheetDispatch,
  sendSingleEmployeeTaskSheetEmail,
} from '../services/periodicTaskSheetCronService';
import { sendMondayGreetingToAllEmployees } from '../services/mondayGreetingMailService';
import { executeDueRoutineRemindersDispatch } from '../services/routineReminderCronService';

export function registerMailAndCronRoutes(app: express.Express): void {
  app.get('/api/mail/config', async (_req: express.Request, res: express.Response) => {
    try {
      const config = await getEffectiveSmtpConfig();
      res.json({
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
    } catch (error: any) {
      console.error('[API Mail Get Config Error]:', error);
      res.status(500).json({ success: false, error: error.message || 'Impossible de charger la configuration SMTP.' });
    }
  });

  app.post('/api/mail/config', async (req: express.Request, res: express.Response) => {
    try {
      const { smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, smtpFrom, smtpSenderName, hrNotificationEmail, enableEmailNotifications } = req.body;
      const settingsList = await getCollectionData('company_settings');
      const existing = (Array.isArray(settingsList) && settingsList.find((s: any) => s.id === 'main_config' || s.docId === 'main_config')) || {};

      const updatedDoc = {
        ...existing,
        id: 'main_config',
        docId: 'main_config',
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

      await saveDocumentData('company_settings', updatedDoc);
      res.json({ success: true, message: 'Configuration SMTP et RH enregistrée avec succès.', config: updatedDoc });
    } catch (error: any) {
      console.error('[API Mail Save Config Error]:', error);
      res.status(500).json({ success: false, error: error.message || 'Échec de sauvegarde des paramètres SMTP.' });
    }
  });

  app.post('/api/mail/send-threaded', async (req: express.Request, res: express.Response) => {
    try {
      const { employeeName, employeeId, eventTitle, htmlContent, attachments, smtpConfig, threadCategory, threadSubject, overrideRecipients } = req.body;
      if (!employeeName || !eventTitle || !htmlContent) {
        return res.status(400).json({
          success: false,
          error: 'Paramètres obligatoires manquants: employeeName, eventTitle, htmlContent',
        });
      }

      const result = await sendThreadedEmployeeEmail(
        { employeeName, employeeId, eventTitle, threadCategory, threadSubject, htmlContent, attachments, overrideRecipients },
        smtpConfig
      );
      if (!result.success) {
        console.error('[SERVER /api/mail/send-threaded ÉCHEC]:', result.error);
        return res.status(500).json(result);
      }
      res.json(result);
    } catch (error: any) {
      const rawError = error?.message || String(error);
      console.error('[SERVER /api/mail/send-threaded EXCEPTION]:', error);
      res.status(500).json({ success: false, error: rawError, stack: error?.stack, details: error });
    }
  });

  app.post('/api/mail/test-connection', async (req: express.Request, res: express.Response) => {
    try {
      const { testRecipient, smtpConfig } = req.body;
      const effective = await getEffectiveSmtpConfig(smtpConfig);
      const targetRecipients = testRecipient && testRecipient.trim() ? parseEmailList(testRecipient) : parseEmailList(effective.hrEmail);
      if (targetRecipients.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Aucun destinataire spécifié et la variable HR_NOTIFICATION_EMAIL n'est pas configurée.",
        });
      }
      const result = await sendMondayGreetingToAllEmployees({ testRecipient: targetRecipients.join(', '), forceMonday: true });
      res.status(result.success ? 200 : 500).json(result);
    } catch (error: any) {
      console.error('[API Mail Test Connection Error]:', error);
      res.status(500).json({ success: false, error: error.message || 'Échec du test de connexion SMTP.' });
    }
  });

  app.get('/api/attendance/weekly-recap', async (req: express.Request, res: express.Response) => {
    try {
      const data = await compileWeeklyAttendanceData({ manual: req.query.manual === 'true', forceFriday: req.query.forceFriday === 'true' });
      res.json({ success: true, report: data });
    } catch (error: any) {
      console.error('[API attendance/weekly-recap GET Error]:', error);
      res.status(500).json({ success: false, error: error.message || 'Erreur de compilation du récapitulatif.' });
    }
  });

  app.post('/api/attendance/weekly-recap', async (req: express.Request, res: express.Response) => {
    try {
      const { forceFriday, testRecipient } = req.body || {};
      const result = await sendWeeklyConsolidatedReport({ manual: true, forceFriday: Boolean(forceFriday), testRecipient });
      res.status(result.success ? 200 : 500).json(result);
    } catch (error: any) {
      console.error('[API attendance/weekly-recap POST Error]:', error);
      res.status(500).json({ success: false, error: error.message || "Échec de l'envoi du récapitulatif hebdomadaire." });
    }
  });

  const handleDailyTaskSheetCron = async (_req: express.Request, res: express.Response) => {
    try {
      const result = await executeDailyTaskSheetDispatch();
      res.status(result.success ? 200 : 500).json(result);
    } catch (err: any) {
      console.error('[API /api/cron/daily-tasksheet Error]:', err);
      res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  };

  app.all('/api/cron/daily-tasksheet', handleDailyTaskSheetCron);
  app.all('/api/cron/daily-timesheet', handleDailyTaskSheetCron);

  app.all('/api/cron/weekly-recap', async (_req: express.Request, res: express.Response) => {
    try {
      const result = await sendWeeklyConsolidatedReport({ forceFriday: true });
      res.status(result.success ? 200 : 500).json(result);
    } catch (err: any) {
      console.error('[API /api/cron/weekly-recap Error]:', err);
      res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.all('/api/cron/monday-greeting', async (req: express.Request, res: express.Response) => {
    try {
      const forceMonday = req.query.force === 'true' || req.body?.force === true;
      const testRecipient = (req.query.testRecipient as string) || req.body?.testRecipient;
      const result = await sendMondayGreetingToAllEmployees({ forceMonday, testRecipient });
      res.status(result.success ? 200 : 500).json(result);
    } catch (err: any) {
      console.error('[API /api/cron/monday-greeting Error]:', err);
      res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.all('/api/cron/monthly-tasksheet', async (req: express.Request, res: express.Response) => {
    try {
      const monthStr = (req.query.month as string) || req.body?.month;
      const result = await executeMonthlyTaskSheetDispatch({ monthStr });
      res.status(result.success ? 200 : 500).json(result);
    } catch (err: any) {
      console.error('[API /api/cron/monthly-tasksheet Error]:', err);
      res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.all('/api/cron/yearly-tasksheet', async (req: express.Request, res: express.Response) => {
    try {
      const rawYear = (req.query.year as string) || req.body?.year;
      const year = rawYear ? parseInt(String(rawYear), 10) : undefined;
      const result = await executeYearlyTaskSheetDispatch({ year });
      res.status(result.success ? 200 : 500).json(result);
    } catch (err: any) {
      console.error('[API /api/cron/yearly-tasksheet Error]:', err);
      res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.post('/api/reports/tasksheet/send', async (req: express.Request, res: express.Response) => {
    try {
      const { employeeId, mode, period, overrideRecipients } = req.body || {};
      if (!employeeId || !mode) {
        return res.status(400).json({ success: false, error: 'Paramètres employeeId et mode requis.' });
      }
      const result = await sendSingleEmployeeTaskSheetEmail({
        employeeId: String(employeeId),
        mode,
        period,
        overrideRecipients,
      });
      res.status(result.success ? 200 : 500).json(result);
    } catch (err: any) {
      console.error('[API /api/reports/tasksheet/send Error]:', err);
      res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.all('/api/cron/routine-reminders', async (_req: express.Request, res: express.Response) => {
    try {
      const result = await executeDueRoutineRemindersDispatch();
      res.status(result.success ? 200 : 500).json(result);
    } catch (err: any) {
      console.error('[API /api/cron/routine-reminders Error]:', err);
      res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });
}
