import express from "express";
import { Resend } from "resend";

const app = express();

// Middleware to parse JSON
app.use(express.json());

// --- Simple Serverless Rate Limiter (Note: resets on cold starts in Vercel) ---
const rateLimitStore = new Map<string, { count: number; lastReset: number }>();
function serverlessRateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const rawIp = req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "unknown";
  const ip = rawIp.split(",")[0].trim();
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const limit = 100;

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

// Dedicated stricter rate limiters for expensive notification channels (Email / WhatsApp)
const notificationRateStore = new Map<string, { count: number; lastReset: number }>();
function notificationLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const rawIp = req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "unknown";
  const ip = rawIp.split(",")[0].trim();
  const now = Date.now();
  const entry = notificationRateStore.get(ip);
  if (!entry || now - entry.lastReset > 60000) {
    notificationRateStore.set(ip, { count: 1, lastReset: now });
    return next();
  }
  if (entry.count >= 15) {
    return res.status(429).json({
      error: "Too Many Requests",
      message: "Trop de requêtes d'envoi de notification. Veuillez patienter avant de réessayer."
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

// --- Email via Resend ---
app.post("/api/email/send", notificationLimiter, requireClientAuth, async (req, res) => {
  try {
    const { to, subject, html } = req.body;

    // 🛡️ Strict input validation & Header Injection prevention
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
    
    // Resend forbids sending from domains you don't own on production
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
    res.status(500).json({ error: error.message || "Failed to send email" });
  }
});

// --- WhatsApp via Cloud API ---
app.post("/api/whatsapp/send", notificationLimiter, requireClientAuth, async (req, res) => {
  try {
    const { to, message } = req.body;

    // 🛡️ Strict input validation & phone number format check
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
    res.status(500).json({ error: error.message || "Failed to send WhatsApp message" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// For Vercel Serverless Function export
export default app;
