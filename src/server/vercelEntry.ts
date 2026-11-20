import express from 'express';
import { Resend } from 'resend';
import { requireAuth, AuthRequest } from '../middleware/auth';
import {
  getCollectionData,
  saveDocumentData,
  deleteDocumentData,
  getOrCreateUserRecord,
  executeCollaboratorCreationTransaction,
  executeAtomicClockingTransaction,
} from '../db/repository';
import { registerGithubRoutes } from './githubRoutes';
import { registerApiExplorerRoutes } from './apiExplorerRoutes';
import { registerMailAndCronRoutes } from './expressMailAndCronRoutes';
import { registerHerocabBackupRoutes } from './herocabBackupRoutes';

const app = express();

app.set('trust proxy', 1);
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// --- Simple Serverless Rate Limiter (resets on cold starts in Vercel) ---
const rateLimitStore = new Map<string, { count: number; lastReset: number }>();
function serverlessRateLimiter(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const rawIp = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || 'unknown';
  const ip = rawIp.split(',')[0].trim();
  const now = Date.now();
  const windowMs = 60000;
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
      success: false,
      error: 'Too Many Requests',
      message: 'Limite de requêtes dépassée. Veuillez réessayer dans une minute.',
    });
  }

  next();
}

app.use('/api', serverlessRateLimiter);

// Stricter rate limiter for external notification channels (Email / WhatsApp)
const notificationRateStore = new Map<string, { count: number; lastReset: number }>();
function notificationLimiter(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const rawIp = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || 'unknown';
  const ip = rawIp.split(',')[0].trim();
  const now = Date.now();
  const entry = notificationRateStore.get(ip);
  if (!entry || now - entry.lastReset > 60000) {
    notificationRateStore.set(ip, { count: 1, lastReset: now });
    return next();
  }
  if (entry.count >= 15) {
    return res.status(429).json({
      success: false,
      error: 'Too Many Requests',
      message: "Trop de requêtes d'envoi de notification. Veuillez patienter avant de réessayer.",
    });
  }
  entry.count++;
  next();
}

function requireClientAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const authHeader = req.headers['authorization'] || req.headers['x-citrine-auth'];
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: "Accès refusé : En-tête d'authentification manquant.",
    });
  }
  next();
}

// --- Email via Resend ---
app.post('/api/email/send', notificationLimiter, requireClientAuth, async (req, res) => {
  try {
    const { to, subject, html } = req.body || {};

    if (!to || typeof to !== 'string') {
      return res.status(400).json({ error: 'Adresse email destinataire manquante ou invalide' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanTo = to.trim();
    if (!emailRegex.test(cleanTo) || cleanTo.length > 254) {
      return res.status(400).json({ error: "Format d'adresse email invalide" });
    }

    const cleanSubject =
      typeof subject === 'string'
        ? subject.replace(/[\r\n]/g, ' ').trim().slice(0, 200)
        : 'Notification Citrine Management';
    if (!html || typeof html !== 'string' || html.length > 100000) {
      return res
        .status(400)
        .json({ error: 'Contenu du message manquant ou taille excessive (>100KB)' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'RESEND_API_KEY environment variable is missing' });
    }

    const resend = new Resend(apiKey);
    let fromEmail = (process.env.RESEND_FROM_EMAIL || '').trim();
    const isPublicProvider = /@(gmail|yahoo|hotmail|outlook|live|icloud|aol|proton|mail)\./i.test(
      fromEmail
    );
    const hasAtSymbol = fromEmail.includes('@');

    if (!fromEmail || isPublicProvider || !hasAtSymbol) {
      fromEmail = 'Citrine Management <onboarding@resend.dev>';
    }

    const { data: resData, error: resError } = await resend.emails.send({
      from: fromEmail,
      to: [cleanTo],
      subject: cleanSubject,
      html,
    });

    if (resError) {
      console.error('Resend API error:', resError);
      return res.status(400).json({
        success: false,
        error: resError.message || JSON.stringify(resError),
        type: resError.name,
      });
    }

    res.json({ success: true, data: resData });
  } catch (error: any) {
    console.error('Resend error:', error);
    res.status(500).json({ error: error?.message || 'Failed to send email' });
  }
});

// --- WhatsApp via Cloud API ---
app.post('/api/whatsapp/send', notificationLimiter, requireClientAuth, async (req, res) => {
  try {
    const { to, message } = req.body || {};

    if (!to || typeof to !== 'string') {
      return res.status(400).json({ error: 'Numéro de téléphone manquant' });
    }
    const cleanTo = to.trim().replace(/\s+/g, '');
    const phoneRegex = /^\+?[0-9]{8,20}$/;
    if (!phoneRegex.test(cleanTo)) {
      return res.status(400).json({
        error: 'Format du numéro de téléphone invalide (format international requis, ex: +237690000000)',
      });
    }

    if (!message || typeof message !== 'string' || message.length > 4096) {
      return res
        .status(400)
        .json({ error: 'Message manquant ou taille excessive (>4096 caractères)' });
    }

    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
      return res.status(500).json({ error: 'WhatsApp environment variables missing' });
    }

    const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanTo,
        type: 'text',
        text: { body: message },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('WhatsApp error:', error);
    res.status(500).json({ error: error?.message || 'Failed to send WhatsApp message' });
  }
});

// Core Data CRUD, User Sync, Collaborators & Atomic Clocking Routes (parity with server.ts)
app.get('/api/data/:collection', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { collection } = req.params;
    const data = await getCollectionData(collection);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error(`[Vercel API] Error fetching collection ${req.params.collection}:`, error);
    res.status(500).json({ success: false, error: error?.message || 'Failed to fetch data' });
  }
});

app.post('/api/data/:collection', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { collection } = req.params;
    const saved = await saveDocumentData(collection, req.body);
    res.json({ success: true, data: saved });
  } catch (error: any) {
    console.error(`[Vercel API] Error saving to collection ${req.params.collection}:`, error);
    res.status(500).json({ success: false, error: error?.message || 'Failed to save data' });
  }
});

app.delete('/api/data/:collection/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { collection, id } = req.params;
    await deleteDocumentData(collection, id);
    res.json({ success: true });
  } catch (error: any) {
    console.error(`[Vercel API] Error deleting from collection ${req.params.collection}:`, error);
    res.status(500).json({ success: false, error: error?.message || 'Failed to delete data' });
  }
});

app.post('/api/users/sync', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { uid, email, name, role } = req.body || {};
    if (!uid || !email) {
      return res.status(400).json({ success: false, error: 'Missing uid or email' });
    }
    const user = await getOrCreateUserRecord(uid, email, name, role);
    res.json({ success: true, data: user });
  } catch (error: any) {
    console.error('[Vercel API] Error syncing user:', error);
    res.status(500).json({ success: false, error: error?.message || 'Failed to sync user' });
  }
});

app.post('/api/collaborators/transactional', async (req: express.Request, res: express.Response) => {
  try {
    const input = req.body;
    if (!input?.name || !input?.email) {
      return res.status(400).json({ success: false, error: 'Nom et adresse email requis.' });
    }
    const result = await executeCollaboratorCreationTransaction(input);
    res.json(result);
  } catch (error: any) {
    console.error('[Vercel API Collaborator Transaction Error]:', error);
    res.status(500).json({ success: false, error: error?.message || 'Échec de la transaction.' });
  }
});

app.post('/api/clocking/atomic', async (req: express.Request, res: express.Response) => {
  try {
    const input = req.body;
    if (!input?.presence) {
      return res.status(400).json({ success: false, error: 'Données de présence manquantes.' });
    }
    const result = await executeAtomicClockingTransaction(input);
    res.json(result);
  } catch (error: any) {
    console.error('[Vercel API Atomic Clocking Error]:', error);
    res.status(500).json({ success: false, error: error?.message || 'Échec du pointage atomique.' });
  }
});

app.post('/api/realtime/broadcast', (_req: express.Request, res: express.Response) => {
  res.json({ success: true, acknowledged: true });
});

// API Explorer, Mail/Cron, HeroCab SQL Backups & GitHub Read-Only OAuth Routes (Vercel Serverless)
registerApiExplorerRoutes(app);
registerMailAndCronRoutes(app);
registerHerocabBackupRoutes(app);
registerGithubRoutes(app);

// Health & Database diagnostics
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/database/status', (_req, res) => {
  const isSql = Boolean(process.env.SQL_HOST || process.env.DATABASE_URL || process.env.SUPABASE_URL);
  res.json({
    success: true,
    isSqlConfigured: isSql,
    localPersistence: false,
    message: isSql ? 'Base de données SQL / Supabase active' : 'API serverless active (Supabase)',
  });
});

// Always return JSON for unmatched /api routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route API introuvable : [${req.method}] ${req.originalUrl}`,
  });
});

// Global JSON error handler so serverless errors stay valid JSON
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Vercel API Error]:', err);
  res.status(err?.status || 500).json({
    success: false,
    error: err?.message || 'Erreur interne du serveur API.',
  });
});

export default app;
