import express from "express";
import { Resend } from "resend";
import { 
  sendThreadedEmployeeEmail, 
  getEffectiveSmtpConfig, 
  parseEmailList 
} from "../src/services/serverMailService.ts";
import { 
  getCollectionData, 
  saveDocumentData 
} from "../src/db/repository.ts";

const app = express();

// Increase JSON body limit to 25MB for base64 email attachments (e.g. Excel timesheets)
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

// --- Simple Serverless Rate Limiter (Note: resets on cold starts in Vercel) ---
const rateLimitStore = new Map<string, { count: number; lastReset: number }>();
function serverlessRateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const rawIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown";
  const ip = rawIp.split(",")[0].trim();
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const limit = 200;

  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, { count: 1, lastReset: now });
    return next();
  }

  const data = rateLimitStore.get(ip)!;
  if (now - data.lastReset > windowMs) {
    data.count = 1;
    data.lastReset = now;
  } else {
    data.count++;
  }

  if (data.count > limit) {
    return res.status(429).json({
      error: "Too Many Requests",
      message: "Limite de requêtes dépassée. Veuillez réessayer dans une minute."
    });
  }

  next();
}

app.use("/api", serverlessRateLimiter);

// Dedicated rate limiter for expensive notifications (allow up to 60/min)
const notificationRateStore = new Map<string, { count: number; lastReset: number }>();
function notificationLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const rawIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown";
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
// ✉️ VERCEL SERVERLESS ENDPOINTS POUR L'ENVOI DE MAIL THREADÉ & SMTP
// -------------------------------------------------------------

// ✉️ Récupérer la configuration SMTP effective depuis la DB ou l'environnement
app.get("/api/mail/config", async (req: express.Request, res: express.Response) => {
  console.log("🔍 [VERCEL /api/mail/config GET] Demande de configuration SMTP...");
  try {
    const config = await getEffectiveSmtpConfig();
    console.log("✅ [VERCEL /api/mail/config GET] Config chargée avec succès:", {
      host: config.host,
      port: config.port,
      user: config.user,
      hasPass: Boolean(config.pass),
      from: config.from,
      hrEmail: config.hrEmail,
    });
    res.json({
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
    res.status(500).json({
      success: false,
      error: error?.message || String(error),
      stack: error?.stack,
    });
  }
});

// ✉️ Sauvegarder la configuration SMTP & RH en DB (accessible pour les non-développeurs)
app.post("/api/mail/config", async (req: express.Request, res: express.Response) => {
  console.log("💾 [VERCEL /api/mail/config POST] Sauvegarde configuration SMTP...");
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

    const settingsList = await getCollectionData("company_settings");
    const existing = (Array.isArray(settingsList) && settingsList.find((s: any) => s.id === "main_config" || s.docId === "main_config")) || {};

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

    await saveDocumentData("company_settings", updatedDoc);
    console.log("✅ [VERCEL /api/mail/config POST] Configuration sauvegardée en base de données.");
    res.json({ success: true, message: "Configuration SMTP et RH enregistrée avec succès.", config: updatedDoc });
  } catch (error: any) {
    console.error("❌ [VERCEL /api/mail/config POST ERROR]:", error);
    res.status(500).json({
      success: false,
      error: error?.message || String(error),
      stack: error?.stack,
    });
  }
});

// ✉️ Envoi d'email threadé (feuille de temps, fiche journalière, notification RH)
app.post("/api/mail/send-threaded", notificationLimiter, async (req: express.Request, res: express.Response) => {
  const startTime = Date.now();
  console.log("================================================================");
  console.log("📨 [VERCEL API /api/mail/send-threaded] Réception requête envoi email...");
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
      console.log(`✅ [VERCEL API /api/mail/send-threaded SUCCÈS en ${duration}ms]:`, {
        messageId: result.messageId,
        recipients: result.recipients,
      });
      console.log("================================================================");
      return res.json(result);
    } else {
      console.error(`❌ [VERCEL API /api/mail/send-threaded ÉCHEC en ${duration}ms]:`, result.error);
      console.log("================================================================");
      // Renvoyer l'erreur brute et exacte
      return res.status(500).json(result);
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const rawMessage = error?.message || String(error);
    console.error(`💥 [VERCEL API /api/mail/send-threaded EXCEPTION NON GÉRÉE en ${duration}ms]:`, {
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
app.post("/api/mail/test-connection", notificationLimiter, async (req: express.Request, res: express.Response) => {
  console.log("🧪 [VERCEL /api/mail/test-connection] Test de connexion SMTP démarré...");
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
app.post("/api/email/send", notificationLimiter, requireClientAuth, async (req, res) => {
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

    res.json({ success: true, data: resData });
  } catch (error: any) {
    console.error("Resend error:", error);
    res.status(500).json({ error: error?.message || "Failed to send email" });
  }
});

// --- WhatsApp via Cloud API (Existant) ---
app.post("/api/whatsapp/send", notificationLimiter, requireClientAuth, async (req, res) => {
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

    res.json({ success: true, data });
  } catch (error: any) {
    console.error("WhatsApp error:", error);
    res.status(500).json({ error: error?.message || "Failed to send WhatsApp message" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    environment: "vercel-serverless",
    timestamp: new Date().toISOString(),
    smtpHostConfigured: Boolean(process.env.SMTP_HOST),
    smtpUserConfigured: Boolean(process.env.SMTP_USER),
    hrEmailConfigured: Boolean(process.env.HR_NOTIFICATION_EMAIL),
  });
});

// Catch-all pour toutes les autres routes /api/* non trouvées afin de renvoyer du JSON explicite plutôt que du HTML 404
app.all("/api/*", (req, res) => {
  const errMsg = `Route introuvable sur le serveur Vercel : [${req.method}] ${req.originalUrl}`;
  console.warn(`⚠️ ${errMsg}`);
  res.status(404).json({
    success: false,
    error: errMsg,
    method: req.method,
    url: req.originalUrl,
  });
});

// Export pour Vercel Serverless Function
export default app;
