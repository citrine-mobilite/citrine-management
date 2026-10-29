import { 
  sendThreadedEmployeeEmail, 
  getEffectiveSmtpConfig, 
  parseEmailList 
} from "../src/services/serverMailService.ts";
import { supabaseAdmin } from "../src/lib/supabase.ts";
import { Resend } from "resend";

/**
 * Gestionnaire Serverless Vercel universel.
 * Conçu spécifiquement pour le runtime AWS Lambda / Vercel sans bloquer sur les flux déjà consommés (zéro blocage express.json).
 */
export default async function handler(req: any, res: any) {
  // CORS & Preflight handling
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-citrine-auth");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Normalisation du chemin URL
  const rawUrl = req.url || "/";
  const urlPath = rawUrl.split("?")[0].replace(/^\/api/, "") || "/";
  const method = req.method?.toUpperCase() || "GET";

  console.log(`🌐 [VERCEL API DISPATCHER] ${method} ${rawUrl} (Route: ${urlPath})`);

  // Parsing sécurisé du corps de la requête (évite le hang de express.json sur Vercel)
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      // conserver body tel quel
    }
  }
  body = body || {};

  try {
    // 1. Health check
    if (urlPath === "/health" || urlPath === "/api/health") {
      return res.status(200).json({
        status: "ok",
        environment: "vercel-serverless",
        timestamp: new Date().toISOString(),
        smtpHostConfigured: Boolean(process.env.SMTP_HOST),
        smtpUserConfigured: Boolean(process.env.SMTP_USER),
        hrEmailConfigured: Boolean(process.env.HR_NOTIFICATION_EMAIL),
      });
    }

    // 2. GET /mail/config
    if (urlPath === "/mail/config" && method === "GET") {
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
    }

    // 3. POST /mail/config
    if (urlPath === "/mail/config" && method === "POST") {
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

      return res.status(200).json({
        success: true,
        message: "Configuration SMTP et RH enregistrée avec succès.",
        config: updatedDoc,
      });
    }

    // 4. POST /mail/send-threaded
    if (urlPath === "/mail/send-threaded" && method === "POST") {
      const {
        employeeName,
        employeeId,
        eventTitle,
        htmlContent,
        attachments,
        smtpConfig,
        threadCategory,
        threadSubject,
        overrideRecipients,
      } = body;

      if (!employeeName || !eventTitle || !htmlContent) {
        const missingFields = [
          !employeeName && "employeeName",
          !eventTitle && "eventTitle",
          !htmlContent && "htmlContent",
        ].filter(Boolean).join(", ");

        return res.status(400).json({
          success: false,
          error: `Paramètres obligatoires manquants : ${missingFields}`,
        });
      }

      const result = await sendThreadedEmployeeEmail(
        {
          employeeName,
          employeeId,
          eventTitle,
          threadCategory,
          threadSubject,
          htmlContent,
          attachments,
          overrideRecipients,
        },
        smtpConfig
      );

      return res.status(result.success ? 200 : 500).json(result);
    }

    // 5. POST /mail/test-connection
    if (urlPath === "/mail/test-connection" && method === "POST") {
      const { testRecipient, smtpConfig } = body;
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

      const result = await sendThreadedEmployeeEmail(
        {
          employeeName: "Test Connexion Citrine",
          employeeId: "citrine-test",
          eventTitle: "Test Connexion SMTP - Citrine Mobilité",
          htmlContent: `<p>Bonjour,</p><p>Ce message confirme que la configuration SMTP de votre application Citrine Mobilité sur Vercel est <strong>100% opérationnelle</strong>.</p><p>Destinataire(s) RH configuré(s) : <code>${targetRecipients.join(", ")}</code></p>`,
          overrideRecipients: targetRecipients,
        },
        smtpConfig
      );

      return res.status(result.success ? 200 : 500).json(result);
    }

    // 6. POST /email/send (Resend fallback)
    if (urlPath === "/email/send" && method === "POST") {
      const { to, subject, html } = body;
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "RESEND_API_KEY environment variable is missing" });
      }
      const resend = new Resend(apiKey);
      const { data: resData, error: resError } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "Citrine Management <onboarding@resend.dev>",
        to: [to],
        subject: subject || "Notification Citrine Management",
        html: html,
      });
      if (resError) {
        return res.status(400).json({ success: false, error: resError.message || JSON.stringify(resError) });
      }
      return res.status(200).json({ success: true, data: resData });
    }

    // 7. Route inconnue
    return res.status(404).json({
      success: false,
      error: `Route introuvable sur le dispatcher Vercel : [${method}] ${rawUrl}`,
      receivedPath: urlPath,
      method,
    });
  } catch (error: any) {
    const rawMessage = error?.message || String(error);
    console.error("💥 [VERCEL DISPATCHER UNHANDLED ERROR]:", error);
    return res.status(500).json({
      success: false,
      error: rawMessage,
      code: error?.code,
      command: error?.command,
      response: error?.response,
      responseCode: error?.responseCode,
      stack: error?.stack,
    });
  }
}
