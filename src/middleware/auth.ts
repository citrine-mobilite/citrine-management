import { Request, Response, NextFunction } from 'express';
import { createHash } from 'node:crypto';
import { getMariaDbPool } from '../db/mariadb';
import type { RowDataPacket } from 'mysql2/promise';

export interface AuthRequest extends Request { user?: any; }

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return res.status(401).json({ success: false, error: 'Authentification requise.' });

  try {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const [rows] = await getMariaDbPool().execute<RowDataPacket[]>(
      `SELECT u.id, u.uid, u.doc_id, u.email, u.name, u.role_id, u.status,
              u.department, u.phone, u.avatar_url, u.raw_data, r.code AS role_code, s.id AS session_id
       FROM auth_sessions s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN roles r ON r.id = u.role_id
       WHERE s.token_hash = ? AND s.expires_at > NOW(3) AND s.revoked_at IS NULL
       LIMIT 1`,
      [tokenHash]
    );
    const row = rows[0];
    if (!row || !(row.status === true || row.status === 1)) {
      return res.status(401).json({ success: false, error: 'Session invalide ou compte désactivé.' });
    }
    req.user = {
      id: String(row.id), uid: row.uid, email: row.email, name: row.name,
      roleId: Number(row.role_id || 3),
      role: String(row.role_code || '').toUpperCase().includes('ADMIN') || Number(row.role_id) === 1 ? 'administrateur' : String(row.role_code || '').toUpperCase().includes('RESPONSABLE') || Number(row.role_id) === 2 ? 'responsable' : 'employé',
      sessionId: row.session_id,
    };
    return next();
  } catch (error) {
    console.error('[Auth middleware]', error);
    return res.status(503).json({ success: false, error: 'Service d’authentification indisponible.' });
  }
};
