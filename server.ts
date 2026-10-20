import express from "express";
import http from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { 
  getCollectionData, 
  saveDocumentData, 
  deleteDocumentData, 
  getOrCreateUserRecord,
  executeCollaboratorCreationTransaction,
  executeAtomicClockingTransaction
} from "./src/db/repository.ts";
import { sendThreadedEmployeeEmail } from "./src/services/serverMailService.ts";

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  app.use(express.json({ limit: "1mb" }));

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
        clientRes.write(payload);
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

  // ✉️ API Envoi d'Email Threadé par Collaborateur (Point 1 & Point 2)
  app.post("/api/mail/send-threaded", async (req: express.Request, res: express.Response) => {
    try {
      const { employeeName, employeeId, employeeEmail, eventTitle, htmlContent, recipientEmails, smtpConfig } = req.body;
      if (!employeeName || !eventTitle || !htmlContent) {
        return res.status(400).json({
          success: false,
          error: "Paramètres obligatoires manquants: employeeName, eventTitle, htmlContent",
        });
      }

      const result = await sendThreadedEmployeeEmail(
        {
          employeeName,
          employeeId,
          employeeEmail,
          eventTitle,
          htmlContent,
          recipientEmails,
        },
        smtpConfig || {}
      );

      res.json(result);
    } catch (error: any) {
      console.error("[API Mail Send Threaded Error]:", error);
      res.status(500).json({ success: false, error: error.message || "Échec d'envoi du mail threadé." });
    }
  });

  // Test de connexion SMTP directe
  app.post("/api/mail/test-connection", async (req: express.Request, res: express.Response) => {
    try {
      const { smtpConfig, testRecipient } = req.body;
      const targetEmail = testRecipient || smtpConfig?.user || process.env.SMTP_USER || "direction@citrine-mobilite.com";
      
      const result = await sendThreadedEmployeeEmail(
        {
          employeeName: "Test Système",
          employeeId: "test-001",
          employeeEmail: targetEmail,
          eventTitle: "Vérification Connexion SMTP Citrine RH",
          htmlContent: `
            <p>Bonjour,</p>
            <p>Ce message confirme que la connexion SMTP de votre serveur <strong>Citrine SARL</strong> est parfaitement opérationnelle.</p>
            <p>Toutes les futures notifications RH concernant ce fil seront regroupées automatiquement sous cette même conversation.</p>
          `,
        },
        smtpConfig || {}
      );

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

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
