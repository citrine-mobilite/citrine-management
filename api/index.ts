import express from "express";
import { Resend } from "resend";
import { 
  sendThreadedEmployeeEmail, 
  getEffectiveSmtpConfig, 
  parseEmailList 
} from "../src/services/serverMailService.ts";
import { supabaseAdmin } from "../src/lib/supabase.ts";

const app = express();

// Increase JSON body limit for timesheet Excel attachments (base64)
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// CORS & Preflight handling
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-citrine-auth");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Dedicated rate limiter for expensive notifications (allow up to 60/min)
const notificationRateStore = new Map<string, { count: number; lastReset: number }>();
function notificationLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const rawIp = (req.headers["x-forwarded-for"] as string) || req.socket?.remoteAddress || "unknown";
  const ip = rawIp.split(",")[0].trim();
  const now = Date.now();
  const entry = notificationRateStore.get(ip);
  if (!entry || now - entry.lastReset > 60000) {
    notificationRateStore.set(ip, { count: 1, lastReset: now });
    return next();
  }
  if (entry.count >= 60) {
    return res.status(429).json({
      error: "Too Many Requests",
      message: "Trop de requêtes d'envoi. Veuillez patienter avant de réessayer."
    });
  }
  entry.count++;
  next();
}

function requireClientAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers["authorization"] || req.headers["x-citrine-auth"];
  if (!authHeader) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Accès refusé : En-tête d'authentification manquant."
    });
  }
  next();
}

// -------------------------------------------------------------
// ✉️ ROUTEUR UNIFIÉ POUR TOUTES LES ROUTES D'API VERCEL
// -------------------------------------------------------------
const router = express.Router();

// ✉️ Récupérer la configuration SMTP effective depuis la DB ou l'environnement
router.get("/mail/config", async (req: express.Request, res: express.Response) => {
  console.log("🔍 [VERCEL /mail/config GET] Demande de configuration SMTP...");
  try {
    const config = await getEffectiveSmtpConfig();
    console.log("✅ [VERCEL /mail/config GET] Config chargée:", {
      host: config.host,
      port: config.port,
      user: config.user,
      hasPass: Boolean(config.pass),
      from: config.from,
      hrEmail: config.hrEmail,
    });
    return res.json({
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
    console.error("❌ [VERCEL /mail/config GET ERROR]:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || String(error),
      stack: error?.stack,
    });
  }
});

// ✉️ Sauvegarder la configuration SMTP & RH en DB (accessible pour les non-développeurs)
router.post("/mail/config", async (req: express.Request, res: express.Response) => {
  console.log("💾 [VERCEL /mail/config POST] Sauvegarde configuration SMTP...");
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

    // Récupération de l'enregistrement existant dans Supabase
    let existing: any = {};
    try {
      const { data } = await supabaseAdmin.from("company_settings").select("*");
      if (data && Array.isArray(data) && data.length > 0) {
        const found = data.find((s: any) => s.id === "main_config" || s.doc_id === "main_config") || data[0];
        const raw = (found.raw_data && typeof found.raw_data === "object") ? found.raw_data : (found.setting_value && typeof found.setting_value === "object" ? found.setting_value : found);
        existing = { ...found, ...raw };
      }
    } catch (e) {
      console.warn("⚠️ Impossible de lire les réglages existants, écrasement sécurisé:", e);
    }

    const updatedDoc = {
      ...existing,
      id: "main_config",
      docId: "main_config",
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

    // Sauvegarde directe dans Supabase (table company_settings)
    await supabaseAdmin.from("company_settings").upsert({
      id: "main_config",
      doc_id: "main_config",
      raw_data: updatedDoc,
      setting_value: updatedDoc,
      updated_at: new Date().toISOString(),
    });

    console.log("✅ [VERCEL /mail/config POST] Configuration sauvegardée en base de données Supabase.");
    return res.json({ success: true, message: "Configuration SMTP et RH enregistrée avec succès.", config: updatedDoc });
  } catch (error: any) {
    console.error("❌ [VERCEL /mail/config POST ERROR]:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || String(error),
      stack: error?.stack,
    });
  }
});

// ✉️ Envoi d'email threadé (feuille de temps, fiche journalière, notification RH)
router.post("/mail/send-threaded", notificationLimiter, async (req: express.Request, res: express.Response) => {
  const startTime = Date.now();
  console.log("================================================================");
  console.log("📨 [VERCEL API /mail/send-threaded] Réception requête envoi email...");
  console.log("📋 [PAYLOAD RESUME]:", {
    employeeName: req.body?.employeeName,
    employeeId: req.body?.employeeId,
    employeeEmail: req.body?.employeeEmail,
    eventTitle: req.body?.eventTitle,
    threadCategory: req.body?.threadCategory,
    threadSubject: req.body?.threadSubject,
    attachmentsCount: Array.isArray(req.body?.attachments) ? req.body.attachments.length : 0,
    hasAttachments: Boolean(req.body?.attachments?.length),
    bodyHtmlLength: req.body?.htmlContent ? req.body.htmlContent.length : 0,
  });

  console.log("🔍 [VERCEL RUNTIME ENV VARIABLES]:", {
    SMTP_HOST: process.env.SMTP_HOST ? `Défini ("${process.env.SMTP_HOST}")` : "NON DÉFINI (undefined)",
    SMTP_PORT: process.env.SMTP_PORT ? `Défini ("${process.env.SMTP_PORT}")` : "NON DÉFINI (défaut 587)",
    SMTP_SECURE: process.env.SMTP_SECURE ? `Défini ("${process.env.SMTP_SECURE}")` : "NON DÉFINI (false)",
    SMTP_USER: process.env.SMTP_USER ? `Défini ("${process.env.SMTP_USER}")` : "NON DÉFINI (undefined)",
    SMTP_PASS_STATUS: process.env.SMTP_PASS ? `Défini (Longueur: ${process.env.SMTP_PASS.length})` : "NON DÉFINI (vide)",
    SMTP_FROM: process.env.SMTP_FROM ? `Défini ("${process.env.SMTP_FROM}")` : "NON DÉFINI",
    HR_NOTIFICATION_EMAIL: process.env.HR_NOTIFICATION_EMAIL ? `Défini ("${process.env.HR_NOTIFICATION_EMAIL}")` : "NON DÉFINI",
    SUPABASE_URL_STATUS: process.env.SUPABASE_URL ? "Défini" : "Non défini",
  });

  try {
    const { employeeName, employeeId, eventTitle, htmlContent, attachments, smtpConfig, threadCategory, threadSubject, overrideRecipients } = req.body;
    
    if (!employeeName || !eventTitle || !htmlContent) {
      const missingFields = [
        !employeeName && "employeeName",
        !eventTitle && "eventTitle",
        !htmlContent && "htmlContent",
      ].filter(Boolean).join(", ");
      
      const validationError = `Paramètres obligatoires manquants pour l'envoi d'email : ${missingFields}`;
      console.error(`❌ [VERCEL VALIDATION ERROR]: ${validationError}`);
      return res.status(400).json({
        success: false,
        error: validationError,
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

    const duration = Date.now() - startTime;

    if (result.success) {
      console.log(`✅ [VERCEL API /mail/send-threaded SUCCÈS en ${duration}ms]:`, {
        messageId: result.messageId,
        recipients: result.recipients,
      });
      console.log("================================================================");
      return res.json(result);
    } else {
      console.error(`❌ [VERCEL API /mail/send-threaded ÉCHEC en ${duration}ms]:`, result.error);
      console.log("================================================================");
      // Renvoyer l'erreur brute et exacte
      return res.status(500).json(result);
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const rawMessage = error?.message || String(error);
    console.error(`💥 [VERCEL API /mail/send-threaded EXCEPTION NON GÉRÉE en ${duration}ms]:`, {
      message: rawMessage,
      code: error?.code,
      command: error?.command,
      response: error?.response,
      responseCode: error?.responseCode,
      stack: error?.stack,
    });
    console.log("================================================================");
    
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
});

// ✉️ Test direct de connexion SMTP
router.post("/mail/test-connection", notificationLimiter, async (req: express.Request, res: express.Response) => {
  console.log("🧪 [VERCEL /mail/test-connection] Test de connexion SMTP démarré...");
  try {
    const { testRecipient, smtpConfig } = req.body;
    const effective = await getEffectiveSmtpConfig(smtpConfig);
    
    const targetRecipients = testRecipient && testRecipient.trim()
      ? parseEmailList(testRecipient)
      : parseEmailList(effective.hrEmail);

    if (targetRecipients.length === 0) {
      const noRecipMsg = "Aucun destinataire spécifié et la variable HR_NOTIFICATION_EMAIL n'est pas configurée.";
      console.error("❌ [VERCEL TEST SMTP]:", noRecipMsg);
      return res.status(400).json({
        success: false,
        error: noRecipMsg,
      });
    }
    
    const result = await sendThreadedEmployeeEmail({
      employeeName: "Test Connexion Citrine",
      employeeId: "citrine-test",
      eventTitle: "Test Connexion SMTP - Citrine Mobilité",
      htmlContent: `<p>Bonjour,</p><p>Ce message confirme que la configuration SMTP de votre application Citrine Mobilité sur Vercel est <strong>100% opérationnelle</strong>.</p><p>Destinataire(s) RH configuré(s) : <code>${targetRecipients.join(", ")}</code></p>`,
      overrideRecipients: targetRecipients,
    }, smtpConfig);

    if (result.success) {
      console.log("✅ [VERCEL TEST SMTP SUCCÈS]:", result);
      return res.json(result);
    } else {
      console.error("❌ [VERCEL TEST SMTP ÉCHEC]:", result.error);
      return res.status(500).json(result);
    }
  } catch (error: any) {
    console.error("💥 [VERCEL TEST SMTP EXCEPTION]:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || String(error),
      code: error?.code,
      response: error?.response,
      stack: error?.stack,
    });
  }
});

// --- Email via Resend (Existant) ---
router.post("/email/send", notificationLimiter, requireClientAuth, async (req, res) => {
  try {
    const { to, subject, html } = req.body;

    if (!to || typeof to !== "string") {
      return res.status(400).json({ error: "Adresse email destinataire manquante ou invalide" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanTo = to.trim();
    if (!emailRegex.test(cleanTo) || cleanTo.length > 254) {
      return res.status(400).json({ error: "Format d'adresse email invalide" });
    }

    const cleanSubject = typeof subject === "string" ? subject.replace(/[\r\n]/g, " ").trim().slice(0, 200) : "Notification Citrine Management";
    if (!html || typeof html !== "string" || html.length > 100000) {
      return res.status(400).json({ error: "Contenu du message manquant ou taille excessive (>100KB)" });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "RESEND_API_KEY environment variable is missing" });
    }

    const resend = new Resend(apiKey);
    let fromEmail = (process.env.RESEND_FROM_EMAIL || "").trim();
    
    const isPublicProvider = /@(gmail|yahoo|hotmail|outlook|live|icloud|aol|proton|mail)\./i.test(fromEmail);
    const hasAtSymbol = fromEmail.includes("@");
    
    if (!fromEmail || isPublicProvider || !hasAtSymbol) {
      fromEmail = "Citrine Management <onboarding@resend.dev>";
    }
    
    const { data: resData, error: resError } = await resend.emails.send({
      from: fromEmail,
      to: [cleanTo],
      subject: cleanSubject,
      html: html,
    });

    if (resError) {
      console.error("Resend API error:", resError);
      return res.status(400).json({ success: false, error: resError.message || JSON.stringify(resError), type: resError.name });
    }

    return res.json({ success: true, data: resData });
  } catch (error: any) {
    console.error("Resend error:", error);
    return res.status(500).json({ error: error?.message || "Failed to send email" });
  }
});

// --- WhatsApp via Cloud API (Existant) ---
router.post("/whatsapp/send", notificationLimiter, requireClientAuth, async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || typeof to !== "string") {
      return res.status(400).json({ error: "Numéro de téléphone manquant" });
    }
    const cleanTo = to.trim().replace(/\s+/g, "");
    const phoneRegex = /^\+?[0-9]{8,20}$/;
    if (!phoneRegex.test(cleanTo)) {
      return res.status(400).json({ error: "Format du numéro de téléphone invalide (format international requis, ex: +237690000000)" });
    }

    if (!message || typeof message !== "string" || message.length > 4096) {
      return res.status(400).json({ error: "Message manquant ou taille excessive (>4096 caractères)" });
    }

    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
      return res.status(500).json({ error: "WhatsApp environment variables missing" });
    }

    const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: cleanTo,
        type: "text",
        text: { body: message }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("WhatsApp error:", error);
    return res.status(500).json({ error: error?.message || "Failed to send WhatsApp message" });
  }
});

// Health check
router.get("/health", (req, res) => {
  return res.json({
    status: "ok",
    environment: "vercel-serverless",
    timestamp: new Date().toISOString(),
    smtpHostConfigured: Boolean(process.env.SMTP_HOST),
    smtpUserConfigured: Boolean(process.env.SMTP_USER),
    hrEmailConfigured: Boolean(process.env.HR_NOTIFICATION_EMAIL),
  });
});

// -------------------------------------------------------------
// MONTAGE SUR LES DEUX PRÉFIXES : /api ET LA RACINE /
// Cela garantit que que Vercel conserve "/api" ou le supprime, la route est trouvée !
// -------------------------------------------------------------
app.use("/api", router);
app.use("/", router);

// Catch-all pour toutes les autres requêtes non trouvées
app.use((req, res) => {
  const errMsg = `Route introuvable sur le serveur Vercel : [${req.method}] ${req.originalUrl || req.url}`;
  console.warn(`⚠️ ${errMsg}`);
  return res.status(404).json({
    success: false,
    error: errMsg,
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
  });
});

// Gestionnaire global d'erreurs pour empêcher TOUT crash du processus serverless
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("🔥 [FATAL VERCEL API ERROR]:", err);
  if (!res.headersSent) {
    return res.status(500).json({
      success: false,
      error: "Erreur interne du serveur Vercel",
      details: err?.message || String(err),
      stack: err?.stack,
    });
  }
});

// Export standard de handler Vercel (compatible toutes versions Vercel / AWS Lambda)
export default async function handler(req: any, res: any) {
  try {
    return app(req, res);
  } catch (fatalError: any) {
    console.error("🔥 [FATAL HANDLER INVOCATION ERROR]:", fatalError);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: "Erreur fatale lors de l'exécution de la fonction serveur Vercel",
        details: fatalError?.message || String(fatalError),
        stack: fatalError?.stack,
      });
    }
  }
}

export { app };
