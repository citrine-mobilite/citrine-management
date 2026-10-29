import express from "express";
import http from "http";
import path from "path";
import dotenv from "dotenv";

dotenv.config();
import { createServer as createViteServer } from "vite";
import { requireAuth, AuthRequest } from "./src/middleware/auth";
import { 
  getCollectionData, 
  saveDocumentData, 
  deleteDocumentData, 
  getOrCreateUserRecord,
  executeCollaboratorCreationTransaction,
  executeAtomicClockingTransaction
} from "./src/db/repository";
import { 
  sendThreadedEmployeeEmail, 
  getEffectiveSmtpConfig, 
  parseEmailList 
} from "./src/services/serverMailService";
import {
  getDoualaDateInfo,
  buildTimesheetHtmlReport,
  buildTimesheetExcelBuffer,
  TimesheetItem,
  TimesheetBlocker,
  TimesheetManagerPoint
} from "./src/services/timesheetReportService";

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  // Health check & Database Diagnostics
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/database/status", async (req, res) => {
    try {
      const isSql = Boolean(process.env.SQL_HOST || process.env.DATABASE_URL);
      res.json({
        success: true,
        isSqlConfigured: isSql,
        localPersistence: true,
        message: isSql ? "Base de données SQL active" : "Persistance disque locale active",
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });


  // Cloud SQL Data Routes
  app.get("/api/data/:collection", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { collection } = req.params;
      const data = await getCollectionData(collection);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error(`Error fetching collection ${req.params.collection}:`, error);
      res.status(500).json({ success: false, error: error.message || "Failed to fetch data" });
    }
  });

  app.post("/api/data/:collection", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { collection } = req.params;
      const item = req.body;
      const saved = await saveDocumentData(collection, item);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      console.error(`Error saving to collection ${req.params.collection}:`, error);
      res.status(500).json({ success: false, error: error.message || "Failed to save data" });
    }
  });

  app.delete("/api/data/:collection/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { collection, id } = req.params;
      await deleteDocumentData(collection, id);
      res.json({ success: true });
    } catch (error: any) {
      console.error(`Error deleting from collection ${req.params.collection}:`, error);
      res.status(500).json({ success: false, error: error.message || "Failed to delete data" });
    }
  });

  // User Profile Sync
  app.post("/api/users/sync", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid, email, name, role } = req.body;
      if (!uid || !email) {
        return res.status(400).json({ success: false, error: "Missing uid or email" });
      }
      const user = await getOrCreateUserRecord(uid, email, name, role);
      res.json({ success: true, data: user });
    } catch (error: any) {
      console.error("Error syncing user:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to sync user" });
    }
  });

  // Transactional Collaborator Creation
  app.post("/api/collaborators/transactional", async (req: express.Request, res: express.Response) => {
    try {
      const input = req.body;
      if (!input?.name || !input?.email) {
        return res.status(400).json({ success: false, error: "Nom et adresse email requis." });
      }
      const result = await executeCollaboratorCreationTransaction(input);
      res.json(result);
    } catch (error: any) {
      console.error("[API Collaborator Transaction Error]:", error);
      res.status(500).json({ success: false, error: error.message || "Échec de la transaction." });
    }
  });

  // Realtime Server-Sent Events (SSE) Hub for instant real-time sync (Presences, Incidents, Notifs)
  const sseClients: Map<string, express.Response> = new Map();

  function broadcastRealtimeEvent(event: string, data: any) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const [id, clientRes] of sseClients.entries()) {
      try {
        if (!clientRes.writableEnded && !clientRes.destroyed) {
          clientRes.write(payload);
        } else {
          sseClients.delete(id);
        }
      } catch {
        sseClients.delete(id);
      }
    }
  }

  // SSE Stream endpoint for real-time frontend listener (Manager dashboard, Employee portal, etc.)
  app.get("/api/realtime/events", (req: express.Request, res: express.Response) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    sseClients.set(clientId, res);

    res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: Date.now() })}\n\n`);

    const keepAlive = setInterval(() => {
      try {
        res.write(": keepalive\n\n");
      } catch {
        clearInterval(keepAlive);
        sseClients.delete(clientId);
      }
    }, 25000);

    req.on("close", () => {
      clearInterval(keepAlive);
      sseClients.delete(clientId);
    });
  });

  // Client broadcast trigger (allows any client action to notify all other open windows/sessions)
  app.post("/api/realtime/broadcast", (req: express.Request, res: express.Response) => {
    const { event, data } = req.body;
    if (event && data) {
      broadcastRealtimeEvent(event, data);
    }
    res.json({ success: true, clientsNotified: sseClients.size });
  });

  // Transactional Atomic Clocking (Presence + Incident + Notification)
  app.post("/api/clocking/atomic", async (req: express.Request, res: express.Response) => {
    try {
      const input = req.body;
      if (!input?.presence) {
        return res.status(400).json({ success: false, error: "Données de présence manquantes." });
      }
      const result = await executeAtomicClockingTransaction(input);

      // DIFFUSION INSTANTANÉE TEMPS RÉEL (Vers le Responsable, l'Admin, etc.)
      if (result.success) {
        broadcastRealtimeEvent("presence_update", {
          presence: result.presence,
          incident: result.incident,
          notification: result.notification,
          timestamp: new Date().toISOString(),
        });
      }

      res.json(result);
    } catch (error: any) {
      console.error("[API Atomic Clocking Error]:", error);
      res.status(500).json({ success: false, error: error.message || "Échec du pointage atomique." });
    }
  });

  // ✉️ Récupérer la configuration SMTP active (Priorité Base de données, puis .env)
  app.get("/api/mail/config", async (req: express.Request, res: express.Response) => {
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
      console.error("[API Mail Get Config Error]:", error);
      res.status(500).json({ success: false, error: error.message || "Impossible de charger la configuration SMTP." });
    }
  });

  // ✉️ Enregistrer la configuration SMTP & RH en base de données (modifiable directement par les non-développeurs)
  app.post("/api/mail/config", async (req: express.Request, res: express.Response) => {
    try {
      const {
        smtpHost,
        smtpPort,
        smtpSecure,
        smtpUser,
        smtpPass,
        smtpFrom,
        smtpSenderName,
        hrNotificationEmail,
        enableEmailNotifications,
      } = req.body;

      // Récupérer le document existant pour ne pas écraser les autres paramètres d'entreprise
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
      console.log("💾 [SMTP CONFIG SAUVEGARDÉE] Paramètres SMTP mis à jour en base de données.");
      res.json({ success: true, message: "Configuration SMTP et RH enregistrée avec succès.", config: updatedDoc });
    } catch (error: any) {
      console.error("[API Mail Save Config Error]:", error);
      res.status(500).json({ success: false, error: error.message || "Échec de sauvegarde des paramètres SMTP." });
    }
  });

  // ✉️ API Envoi d'Email Threadé par Collaborateur (strictement vers HR_NOTIFICATION_EMAIL)
  app.post("/api/mail/send-threaded", async (req: express.Request, res: express.Response) => {
    console.log("📨 [SERVER /api/mail/send-threaded] Requête reçue:", {
      employeeName: req.body?.employeeName,
      employeeId: req.body?.employeeId,
      eventTitle: req.body?.eventTitle,
      threadCategory: req.body?.threadCategory,
      attachmentsCount: req.body?.attachments?.length || 0,
    });
    try {
      const { employeeName, employeeId, eventTitle, htmlContent, attachments, smtpConfig, threadCategory, threadSubject, overrideRecipients } = req.body;
      if (!employeeName || !eventTitle || !htmlContent) {
        return res.status(400).json({
          success: false,
          error: "Paramètres obligatoires manquants: employeeName, eventTitle, htmlContent",
        });
      }

      const result = await sendThreadedEmployeeEmail({
        employeeName,
        employeeId,
        eventTitle,
        threadCategory,
        threadSubject,
        htmlContent,
        attachments,
        overrideRecipients,
      }, smtpConfig);

      if (!result.success) {
        console.error("❌ [SERVER /api/mail/send-threaded ÉCHEC]:", result.error);
        return res.status(500).json(result);
      }

      console.log("✅ [SERVER /api/mail/send-threaded SUCCÈS]:", result);
      res.json(result);
    } catch (error: any) {
      const rawError = error?.message || String(error);
      console.error("💥 [SERVER /api/mail/send-threaded EXCEPTION]:", {
        message: rawError,
        stack: error?.stack,
        error,
      });
      res.status(500).json({ success: false, error: rawError, stack: error?.stack, details: error });
    }
  });

  // Test de connexion SMTP directe (permet de tester avec les paramètres fournis ou enregistrés)
  app.post("/api/mail/test-connection", async (req: express.Request, res: express.Response) => {
    try {
      const { testRecipient, smtpConfig } = req.body;
      const effective = await getEffectiveSmtpConfig(smtpConfig);
      
      const targetRecipients = testRecipient && testRecipient.trim()
        ? parseEmailList(testRecipient)
        : parseEmailList(effective.hrEmail);

      if (targetRecipients.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Aucun destinataire spécifié et la variable HR_NOTIFICATION_EMAIL n'est pas configurée.",
        });
      }
      
      const result = await sendThreadedEmployeeEmail({
        employeeName: "Test Connexion Citrine",
        employeeId: "citrine-test",
        eventTitle: "Test Connexion SMTP - Citrine Mobilité",
        htmlContent: `<p>Bonjour,</p><p>Ce message confirme que la configuration SMTP de votre application Citrine Mobilité est <strong>100% opérationnelle</strong>.</p><p>Destinataire(s) RH configuré(s) : <code>${targetRecipients.join(', ')}</code></p>`,
        overrideRecipients: targetRecipients,
      }, smtpConfig);

      res.json(result);
    } catch (error: any) {
      console.error("[API Mail Test Connection Error]:", error);
      res.status(500).json({ success: false, error: error.message || "Échec du test de connexion SMTP." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const isHmrDisabled = process.env.DISABLE_HMR === "true";
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // ⏰ Tâche planifiée quotidienne (19h30) : Envoi automatique des feuilles de temps
  setInterval(async () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { timeZone: 'Africa/Douala', hour: 'numeric', minute: 'numeric', hour12: false };
    const formatter = new Intl.DateTimeFormat('en-GB', options);
    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);

    const todayStr = now.toISOString().split('T')[0];
    const cronKey = `timesheet_cron_sent_${todayStr}`;

    if (hour === 19 && minute === 30 && !(global as any)[cronKey]) {
      (global as any)[cronKey] = true;
      console.log(`⏰ [CRON 19:30] Exécution de l'envoi automatique des feuilles de temps...`);
      try {
        const employees = await getCollectionData('employees');
        const users = await getCollectionData('users');
        const tasks = await getCollectionData('tasks');

        const admins = users.filter((u: any) => u.role_id === 1 || u.role === 'administrateur' || String(u.raw_data?.role).toLowerCase().includes('admin'));
        const adminEmails = admins.map((a: any) => a.email).filter(Boolean);
        if (adminEmails.length === 0) {
          if (process.env.HR_NOTIFICATION_EMAIL) adminEmails.push(process.env.HR_NOTIFICATION_EMAIL);
          else if (process.env.SMTP_USER) adminEmails.push(process.env.SMTP_USER);
        }

        const activeEmployees = employees.filter((emp: any) => {
          const empName = (emp.name || '').toLowerCase();
          const empEmail = (emp.email || '').toLowerCase();
          const empId = String(emp.id || '');

          const hasSubtasks = tasks.some((t: any) => {
            const assigned = (t.assignedTo || '').toLowerCase();
            const isAssigned = assigned.includes(empName) || assigned.includes(empEmail) || t.employeeId === empId;
            const hasSubs = Array.isArray(t.subtasks) && t.subtasks.length > 0;
            return isAssigned && hasSubs;
          });

          return hasSubtasks;
        });

        const doualaTime = getDoualaDateInfo();

        for (const emp of activeEmployees) {
          const empName = emp.name || 'Collaborateur';
          const empEmail = emp.email || '';
          const empId = emp.id;

          const empTasks = tasks.filter((t: any) => {
            const assigned = (t.assignedTo || '').toLowerCase();
            return assigned.includes(empName.toLowerCase()) || assigned.includes(empEmail.toLowerCase()) || t.employeeId === String(empId);
          });

          let itemIndex = 1;
          const items: TimesheetItem[] = [];
          const blockers: TimesheetBlocker[] = [];
          const managerPoints: TimesheetManagerPoint[] = [];

          empTasks.forEach((t: any) => {
            // Blocages sur la tâche principale
            if (t.incidents && Array.isArray(t.incidents) && t.incidents.length > 0) {
              t.incidents.forEach((inc: any) => {
                blockers.push({
                  sourceTask: t.title,
                  reason: inc.title || inc.description || 'Incident signalé',
                  status: inc.resolved ? 'Résolu' : 'Bloqué',
                });
              });
            } else if (t.status === 'blocked') {
              blockers.push({
                sourceTask: t.title,
                reason: 'Tâche déclarée bloquée',
                status: 'Bloqué',
              });
            }

            // Commentaires / Points de la tâche principale
            if (t.comment && typeof t.comment === 'string' && t.comment.trim()) {
              managerPoints.push({
                sourceTask: t.title,
                content: t.comment.trim(),
                author: empName,
              });
            }
            if (Array.isArray(t.comments) && t.comments.length > 0) {
              t.comments.forEach((c: any) => {
                managerPoints.push({
                  sourceTask: t.title,
                  content: c.text || c.content || '',
                  author: c.author || empName,
                  time: c.timestamp || '',
                });
              });
            }

            // Sous-tâches
            if (Array.isArray(t.subtasks)) {
              t.subtasks.forEach((sub: any) => {
                const isBlocked = sub.status === 'blocked' || sub.isBlocked || Boolean(sub.blockerReason);
                items.push({
                  index: itemIndex++,
                  taskTitle: t.title,
                  subTitle: sub.title,
                  status: sub.status || (sub.completed ? 'completed' : 'todo'),
                  statusLabel: sub.completed ? 'TERMINÉ' : (sub.status === 'in_progress' ? 'EN COURS' : 'À FAIRE'),
                  estimatedHours: Number(sub.estimatedHours) || 0,
                  actualHours: Number(sub.actualHours) || 0,
                  blockerReason: sub.blockerReason,
                  isBlocked,
                });

                if (isBlocked) {
                  blockers.push({
                    sourceTask: `${sub.title} (sur "${t.title}")`,
                    reason: sub.blockerReason || 'Difficulté opérationnelle signalée',
                    status: 'Bloqué',
                  });
                }

                if (Array.isArray(sub.comments)) {
                  sub.comments.forEach((c: any) => {
                    managerPoints.push({
                      sourceTask: `${sub.title} (sur "${t.title}")`,
                      content: c.text || c.content || '',
                      author: c.author || empName,
                      time: c.timestamp || '',
                    });
                  });
                }
              });
            } else {
              const isBlocked = t.status === 'blocked';
              items.push({
                index: itemIndex++,
                taskTitle: t.title,
                subTitle: t.title,
                status: t.status || 'todo',
                statusLabel: t.status === 'completed' ? 'TERMINÉ' : (t.status === 'in_progress' ? 'EN COURS' : 'À FAIRE'),
                estimatedHours: Number(t.estimatedHours) || 1,
                actualHours: Number(t.actualHours) || 0,
                blockerReason: isBlocked ? 'Tâche bloquée' : undefined,
                isBlocked,
              });
            }
          });

          const totalEstimated = items.reduce((sum, i) => sum + i.estimatedHours, 0);
          const totalActual = items.reduce((sum, i) => sum + i.actualHours, 0);

          const topPriorities = empTasks.slice(0, 3).map((t: any, idx: number) => ({
            id: t.id,
            title: t.title,
            priority: (idx === 0 ? 'P1' : idx === 1 ? 'P2' : 'P3') as 'P1' | 'P2' | 'P3',
            status: t.status === 'completed' ? 'Fait' : (t.status === 'in_progress' ? 'En cours' : 'À faire'),
            isMilestone: !!t.isMilestone,
          }));

          const postponedTasks = empTasks
            .filter((t: any) => t.status !== 'completed')
            .map((t: any) => t.title);

          const timesheetData = {
            employeeName: empName,
            employeeEmail: empEmail,
            employeeId: empId,
            department: emp.department || 'Direction Générale',
            dateStr: doualaTime.dateOnly,
            timeStr: doualaTime.timeOnly,
            items,
            blockers,
            managerPoints,
            totalEstimatedHours: totalEstimated,
            totalActualHours: totalActual,
            topPriorities,
            postponedTasks,
          };

          const htmlContent = buildTimesheetHtmlReport(timesheetData);
          const excelBuffer = buildTimesheetExcelBuffer(timesheetData);

          const safeCollabName = empName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
          const safeDate = doualaTime.dayIso.replace(/-/g, '_');
          const excelFilename = `feuille_de_temps_${safeCollabName}_${safeDate}.xlsx`;

          await sendThreadedEmployeeEmail({
            employeeName: empName,
            employeeId: empId,
            employeeEmail: empEmail,
            eventTitle: `Feuille de temps`,
            threadCategory: 'timesheet',
            threadSubject: `Feuille de temps - ${empName}`,
            htmlContent,
            recipientEmails: adminEmails,
            attachments: [
              {
                filename: excelFilename,
                content: excelBuffer,
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              },
            ],
          });
        }

        console.log(`✅ [CRON 19:30] Feuilles de temps envoyées avec succès pour ${activeEmployees.length} collaborateurs.`);
      } catch (cronErr) {
        console.error(`❌ [CRON 19:30 Error]:`, cronErr);
      }
    }
  }, 60000);

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Server] Port ${PORT} already in use. Retrying in 1s...`);
      setTimeout(() => {
        try {
          server.close();
        } catch {}
        server.listen(PORT, "0.0.0.0");
      }, 1000);
    } else {
      console.error('[Server Error]:', err);
    }
  });

  const shutdown = () => {
    console.log('[Server] Gracefully shutting down...');
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  process.on('uncaughtException', (err) => {
    console.error('[Server Uncaught Exception]:', err);
  });
  process.on('unhandledRejection', (reason) => {
    console.warn('[Server Unhandled Rejection]:', reason);
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
