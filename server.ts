import express from "express";
import http from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { 
  getCollectionData, 
  saveDocumentData, 
  deleteDocumentData, 
  getOrCreateUserRecord 
} from "./src/db/repository.ts";

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

  // Helper pour créer une notification sur chaque action employé (hors GET)
  async function triggerEmployeeNotification(
    method: 'POST' | 'DELETE',
    collection: string,
    docId: string,
    payload: any,
    user?: any
  ) {
    if (collection === 'notifications') return;
    try {
      const empName = user?.user_metadata?.name || user?.name || payload?.employeeName || payload?.name || payload?.userName || 'Collaborateur';
      const role = user?.user_metadata?.role || user?.role || payload?.role;
      const isEmployee = (role && /employ/i.test(role)) || Boolean(payload?.employeeId);

      const targetCollections = [
        'presences', 
        'attendance_incidents', 
        'leave_requests', 
        'expense_claims', 
        'tasks', 
        'reminders', 
        'hse_incidents', 
        'idea_suggestions',
        'processflow_salary_debts'
      ];

      if (isEmployee || targetCollections.includes(collection)) {
        const verb = method === 'DELETE' ? 'Suppression' : 'Mise à jour / Enregistrement';
        const notifItem = {
          id: `notif-emp-action-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          type: 'system',
          recipient: 'Direction & RH',
          title: `Action employé : ${empName}`,
          content: `${empName} a validé une action (${verb}) sur le module [${collection}].`,
          payload: JSON.stringify({
            source: 'employee_action',
            method,
            collection,
            docId,
            empName,
            timestamp: new Date().toISOString(),
          }),
          timestamp: new Date().toISOString(),
          read: false,
        };
        await saveDocumentData('notifications', notifItem);
      }
    } catch (err) {
      console.warn('Erreur lors de la notification automatique employé:', err);
    }
  }

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
