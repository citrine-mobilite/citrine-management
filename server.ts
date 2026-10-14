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
  executeCollaboratorCreationTransaction
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
