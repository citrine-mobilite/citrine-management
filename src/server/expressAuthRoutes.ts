import type { Express, Request, Response } from 'express';
import { createHash, randomBytes, pbkdf2Sync, timingSafeEqual } from 'node:crypto';
import { getMariaDbPool, pingMariaDb } from '../db/mariadb';
import type { RowDataPacket } from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { getRequestAuthToken } from '../middleware/auth';

type UserRow = RowDataPacket & {
  id: number; uid: string; doc_id: string; email: string; name: string | null;
  role_id: number | null; status: number | boolean; department: string | null;
  phone: string | null; avatar_url: string | null; raw_data: any;
};

function parseRaw(value: unknown): Record<string, any> {
  if (value && typeof value === 'object') return value as Record<string, any>;
  if (typeof value === 'string') { try { return JSON.parse(value); } catch {} }
  return {};
}

export function verifyAndMaybeUpgrade(password: string, stored: string): { valid: boolean; upgraded?: string } {
  if (/^\$2[aby]\$/.test(stored)) {
    try {
      if (!bcrypt.compareSync(password, stored)) return { valid: false };
      const salt = randomBytes(16);
      const hash = pbkdf2Sync(password, salt, 100000, 32, 'sha256');
      return { valid: true, upgraded: `pbkdf2:${salt.toString('hex')}:${hash.toString('hex')}` };
    } catch {
      return { valid: false };
    }
  }
  if (stored.startsWith('pbkdf2:')) {
    const [, saltHex, expectedHex] = stored.split(':');
    if (!/^[a-f0-9]{32}$/i.test(saltHex || '') || !/^[a-f0-9]{64}$/i.test(expectedHex || '')) return { valid: false };
    const actual = pbkdf2Sync(password, Buffer.from(saltHex, 'hex'), 100000, 32, 'sha256');
    const expected = Buffer.from(expectedHex, 'hex');
    return { valid: timingSafeEqual(actual, expected) };
  }
  if (!stored || password !== stored) return { valid: false };
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  return { valid: true, upgraded: `pbkdf2:${salt.toString('hex')}:${hash.toString('hex')}` };
}

function publicUser(row: UserRow, raw: Record<string, any>) {
  const safeRaw = { ...raw };
  for (const key of ['passwordHash', 'password_hash', 'password', 'initialPassword', 'smtpPass', 'smtpPassword', 'accessToken', 'refreshToken', 'resetToken', 'secretKey', 'serviceRoleKey']) {
    delete safeRaw[key];
  }
  const roleId = Number(row.role_id || raw.roleId || 3);
  const roleCode = String((row as any).role_code || raw.role || '').toUpperCase();
  const role = roleCode.includes('ADMIN') || roleId === 1 ? 'administrateur'
    : roleCode.includes('RESPONSABLE') || roleId === 2 ? 'responsable' : 'employé';
  return {
    ...safeRaw,
    id: String(row.id), uid: row.uid, doc_id: row.doc_id,
    name: row.name || raw.name || row.email.split('@')[0],
    email: row.email, role, roleId,
    status: row.status === true || row.status === 1 ? 'actif' : 'inactif',
    department: row.department || raw.department || 'Direction Générale',
    phone: row.phone || raw.phone || '',
    avatarUrl: row.avatar_url || raw.avatarUrl || '',
  };
}

const loginFailures = new Map<string, { count: number; resetAt: number }>();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILURES = 8;

function loginIsRateLimited(req: Request, res: Response): boolean {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  let entry = loginFailures.get(ip);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + LOGIN_WINDOW_MS };
    loginFailures.set(ip, entry);
  }
  if (entry.count < LOGIN_MAX_FAILURES) return false;
  res.setHeader('Retry-After', String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))));
  res.status(429).json({ success: false, error: 'Trop de tentatives. Réessaie dans quelques minutes.' });
  return true;
}

function recordLoginFailure(req: Request): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = loginFailures.get(ip);
  if (!entry || entry.resetAt <= now) loginFailures.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
  else entry.count += 1;
  if (loginFailures.size > 5000) {
    for (const [key, value] of loginFailures) if (value.resetAt <= now) loginFailures.delete(key);
  }
}

function clearLoginFailures(req: Request): void {
  loginFailures.delete(req.ip || req.socket.remoteAddress || 'unknown');
}

function setSessionCookie(req: Request, res: Response, token: string, maxAge: number): void {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const secure = process.env.NODE_ENV === 'production' || req.secure || forwardedProto === 'https';
  const parts = [`cm_session=${encodeURIComponent(token)}`, 'HttpOnly', 'Path=/', 'SameSite=Lax', `Max-Age=${maxAge}`];
  if (secure) parts.push('Secure');
  res.append('Set-Cookie', parts.join('; '));
}

export function registerAuthRoutes(app: Express): void {
  // Liveness: doit rester disponible même si MariaDB est momentanément indisponible.
  app.get('/api/health', (_req: Request, res: Response) => {
    return res.status(200).json({
      success: true,
      service: 'citrine-management',
      uptimeSeconds: Math.floor(process.uptime()),
    });
  });

  // Readiness: vérifie que le service peut réellement accéder à MariaDB.
  app.get('/api/ready', async (_req: Request, res: Response) => {
    try {
      const database = await pingMariaDb();
      return res.status(200).json({ success: true, database: 'mariadb' });
    } catch {
      return res.status(503).json({ success: false, error: 'MariaDB indisponible.' });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase();
      const password = String(req.body?.password || '');
      if (!email || !password) return res.status(400).json({ success: false, error: 'Adresse email et mot de passe requis.' });
      if (password.length > 256) return res.status(400).json({ success: false, error: 'Mot de passe trop long.' });
      if (loginIsRateLimited(req, res)) return;

      const pool = getMariaDbPool();
      const [rows] = await pool.execute<UserRow[]>(
        'SELECT u.*, r.code AS role_code FROM users u LEFT JOIN roles r ON r.id = u.role_id WHERE LOWER(u.email) = ? LIMIT 1', [email]
      );
      const row = rows[0];
      if (!row) { recordLoginFailure(req); return res.status(401).json({ success: false, error: 'Identifiants incorrects.' }); }

      const raw = parseRaw(row.raw_data);
      const stored = String(raw.passwordHash || raw.password_hash || '');
      const check = verifyAndMaybeUpgrade(password, stored);
      if (!check.valid) { recordLoginFailure(req); return res.status(401).json({ success: false, error: 'Identifiants incorrects.' }); }
      if (!(row.status === true || row.status === 1)) { recordLoginFailure(req); return res.status(403).json({ success: false, error: 'Ce compte est désactivé.' }); }

      const [employees] = await pool.execute<RowDataPacket[]>(
        'SELECT status, raw_data FROM employees WHERE user_id = ? OR LOWER(email) = ? LIMIT 1',
        [row.id, email]
      );
      const employee = employees[0];
      const empRaw = parseRaw(employee?.raw_data);
      const empStatus = String(empRaw.employmentStatus || empRaw.status || '').toLowerCase();
      if (['renvoye', 'demissionne', 'parti', 'suspendu'].includes(empStatus) || employee?.status === 0) {
        return res.status(403).json({ success: false, error: 'Connexion refusée : situation du collaborateur non autorisée.' });
      }

      if (check.upgraded) {
        raw.passwordHash = check.upgraded;
        delete raw.password_hash;
        await pool.execute('UPDATE users SET raw_data = ?, updated_at = NOW(3) WHERE id = ?', [JSON.stringify(raw), row.id]);
      }

      await pool.execute('DELETE FROM auth_sessions WHERE expires_at < NOW(3) OR revoked_at < DATE_SUB(NOW(3), INTERVAL 30 DAY)');
      const token = randomBytes(32).toString('base64url');
      const tokenHash = createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
      await pool.execute(
        'INSERT INTO auth_sessions (user_id, token_hash, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
        [row.id, tokenHash, expiresAt, req.ip || null, String(req.headers['user-agent'] || '').slice(0, 500)]
      );

      clearLoginFailures(req);
      setSessionCookie(req, res, token, 12 * 60 * 60);
      return res.json({ success: true, token, expiresAt: expiresAt.toISOString(), user: publicUser(row, raw) });
    } catch (error: any) {
      console.error('[Auth login]', error);
      return res.status(500).json({ success: false, error: 'Erreur interne lors de la connexion.' });
    }
  });

  app.get('/api/auth/me', async (req: Request, res: Response) => {
    const token = getRequestAuthToken(req);
    if (!token) return res.status(401).json({ success: false, error: 'Session absente.' });
    try {
      const hash = createHash('sha256').update(token).digest('hex');
      const [rows] = await getMariaDbPool().execute<RowDataPacket[]>(
        `SELECT u.*, r.code AS role_code FROM auth_sessions s
         JOIN users u ON u.id = s.user_id
         LEFT JOIN roles r ON r.id = u.role_id
         WHERE s.token_hash = ? AND s.expires_at > NOW(3) AND s.revoked_at IS NULL LIMIT 1`,
        [hash]
      );
      if (!rows[0]) return res.status(401).json({ success: false, error: 'Session expirée ou invalide.' });
      const row = rows[0] as UserRow;
      return res.json({ success: true, user: publicUser(row, parseRaw(row.raw_data)) });
    } catch (error) {
      console.error('[Auth me]', error);
      return res.status(500).json({ success: false, error: 'Vérification de session impossible.' });
    }
  });

  app.post('/api/auth/logout', async (req: Request, res: Response) => {
    const token = getRequestAuthToken(req);
    try {
      if (token) {
        const hash = createHash('sha256').update(token).digest('hex');
        await getMariaDbPool().execute('UPDATE auth_sessions SET revoked_at = NOW(3) WHERE token_hash = ?', [hash]);
      }
    } catch (error) {
      console.error('[Auth logout]', error);
    }
    setSessionCookie(req, res, '', 0);
    return res.json({ success: true });
  });
}
