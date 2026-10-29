import { getEffectiveSmtpConfig } from "../../src/services/serverMailService.ts";
import { supabaseAdmin } from "../../src/lib/supabase.ts";

export default async function handler(req: any, res: any) {
  // CORS & Preflight handling
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-citrine-auth");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // GET: Récupérer la configuration
  if (req.method === "GET") {
    try {
      const config = await getEffectiveSmtpConfig();
      return res.status(200).json({
        success: true,
        config: {
          smtpHost: config.host || "",
          smtpPort: config.port || 587,
          smtpSecure: Boolean(config.secure),
          smtpUser: config.user || "",
          smtpPass: config.pass || "",
          smtpFrom: config.from || "",
          smtpSenderName: config.senderName || "",
          hrNotificationEmail: config.hrEmail || "",
        },
      });
    } catch (error: any) {
      console.error("❌ [VERCEL /api/mail/config GET ERROR]:", error);
      return res.status(500).json({
        success: false,
        error: error?.message || String(error),
        stack: error?.stack,
      });
    }
  }

  // POST: Sauvegarder la configuration
  if (req.method === "POST") {
    try {
      let body = req.body;
      if (typeof body === "string") {
        try {
          body = JSON.parse(body);
        } catch {
          // ignore
        }
      }
      body = body || {};

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
      } = body;

      // Lecture configuration existante
      let existing: any = {};
      try {
        const { data } = await supabaseAdmin.from("company_settings").select("*");
        if (data && Array.isArray(data) && data.length > 0) {
          const found = data.find((s: any) => s.id === "main_config" || s.doc_id === "main_config") || data[0];
          const raw = (found.raw_data && typeof found.raw_data === "object") ? found.raw_data : (found.setting_value && typeof found.setting_value === "object" ? found.setting_value : found);
          existing = { ...found, ...raw };
        }
      } catch (e) {
        console.warn("⚠️ Impossible de lire les réglages existants:", e);
      }

      const updatedDoc = {
        ...existing,
        id: "main_config",
        doc_id: "main_config",
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

      await supabaseAdmin.from("company_settings").upsert({
        id: "main_config",
        doc_id: "main_config",
        raw_data: updatedDoc,
        setting_value: updatedDoc,
        updated_at: new Date().toISOString(),
      });

      console.log("✅ [VERCEL /api/mail/config POST] Configuration enregistrée en base Supabase.");
      return res.status(200).json({
        success: true,
        message: "Configuration SMTP et RH enregistrée avec succès.",
        config: updatedDoc,
      });
    } catch (error: any) {
      console.error("❌ [VERCEL /api/mail/config POST ERROR]:", error);
      return res.status(500).json({
        success: false,
        error: error?.message || String(error),
        stack: error?.stack,
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: `Méthode ${req.method} non supportée.`,
  });
}
