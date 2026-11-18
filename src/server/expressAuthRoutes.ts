import type { Express, Request, Response } from 'express';
import { createHash, randomBytes, pbkdf2Sync, timingSafeEqual } from 'node:crypto';
import { getMariaDbPool, pingMariaDb } from '../db/mariadb';
import type { RowDataPacket } from 'mysql2/promise';

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

function verifyAndMaybeUpgrade(password: string, stored: string): { valid: boolean; upgraded?: string } {
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
  const roleId = Number(row.role_id || raw.roleId || 3);
  const roleCode = String((row as any).role_code || raw.role || '').toUpperCase();
  const role = roleCode.includes('ADMIN') || roleId === 1 ? 'administrateur'
    : roleCode.includes('RESPONSABLE') || roleId === 2 ? 'responsable' : 'employé';
  return {
    ...raw,
    id: String(row.id), uid: row.uid, doc_id: row.doc_id,
    name: row.name || raw.name || row.email.split('@')[0],
    email: row.email, role, roleId,
    status: row.status === true || row.status === 1 ? 'actif' : 'inactif',
    department: row.department || raw.department || 'Direction Générale',
    phone: row.phone || raw.phone || '',
    avatarUrl: row.avatar_url || raw.avatarUrl || '',
    passwordHash: undefined, password_hash: undefined,
  };
}

export function registerAuthRoutes(app: Express): void {
  app.get('/api/health', async (_req: Request, res: Response) => {
    try { await pingMariaDb(); return res.json({ success: true, service: 'citrine-management' }); }
    catch { return res.status(503).json({ success: false, error: 'MariaDB indisponible.' }); }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase();
      const password = String(req.body?.password || '');
      if (!email || !password) return res.status(400).json({ success: false, error: 'Adresse email et mot de passe requis.' });

      const pool = getMariaDbPool();
      const [rows] = await pool.execute<UserRow[]>(
        'SELECT u.*, r.code AS role_code FROM users u LEFT JOIN roles r ON r.id = u.role_id WHERE LOWER(u.email) = ? LIMIT 1', [email]
      );
      const row = rows[0];
      if (!row) return res.status(401).json({ success: false, error: 'Identifiants incorrects.' });

      const raw = parseRaw(row.raw_data);
      const stored = String(raw.passwordHash || raw.password_hash || '');
      const check = verifyAndMaybeUpgrade(password, stored);
      if (!check.valid) return res.status(401).json({ success: false, error: 'Identifiants incorrects.' });
      if (!(row.status === true || row.status === 1)) return res.status(403).json({ success: false, error: 'Ce compte est désactivé.' });

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

      return res.json({ success: true, token, expiresAt: expiresAt.toISOString(), user: publicUser(row, raw) });
    } catch (error: any) {
      console.error('[Auth login]', error);
      return res.status(500).json({ success: false, error: 'Erreur interne lors de la connexion.' });
    }
  });

  app.get('/api/auth/me', async (req: Request, res: Response) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
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
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (token) {
      const hash = createHash('sha256').update(token).digest('hex');
      await getMariaDbPool().execute('UPDATE auth_sessions SET revoked_at = NOW(3) WHERE token_hash = ?', [hash]);
    }
    return res.json({ success: true });
  });
}
