import type { Express, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import { getMariaDbPool } from '../db/mariadb';
import { requireAuth, type AuthRequest } from '../middleware/auth';

function parseJson(value: any): any {
  if (value && typeof value === 'object') return value;
  if (typeof value === 'string') { try { return JSON.parse(value); } catch {} }
  return {};
}
async function getParticipantCall(callId: string, userId: string) {
  const [rows] = await getMariaDbPool().execute<RowDataPacket[]>(
    'SELECT * FROM calls WHERE room_id = ? OR doc_id = ? LIMIT 1', [callId, callId]
  );
  const call = rows[0];
  if (!call || (![String(call.caller_id), String(call.receiver_id)].includes(String(userId)))) return null;
  return call;
}

export function registerCallRoutes(app: Express): void {
  app.post('/api/calls', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const call = req.body?.call || {};
      const receiverId = String(req.body?.receiverId || call.calleeId || '').trim();
      if (!receiverId || receiverId === String(req.user.id)) return res.status(400).json({ success: false, error: 'Destinataire d’appel invalide.' });
      const callId = String(call.id || `call-${randomUUID()}`);
      const payload = { ...call, id: callId, callerId: String(req.user.id), status: 'ringing' };
      await getMariaDbPool().execute(
        `INSERT INTO calls (uid, doc_id, caller_id, caller_name, receiver_id, receiver_name, status, room_id, raw_data, started_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'ringing', ?, ?, NOW(3), NOW(3), NOW(3))`,
        [randomUUID(), callId, String(req.user.id), req.user.name || '', receiverId, String(call.calleeName || ''),
         callId, JSON.stringify(payload)]
      );
      return res.json({ success: true, call: payload });
    } catch (error: any) {
      console.error('[Calls create]', error);
      return res.status(500).json({ success: false, error: 'Impossible de créer cet appel.' });
    }
  });

  app.get('/api/calls/incoming', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const [rows] = await getMariaDbPool().execute<RowDataPacket[]>(
        `SELECT raw_data, room_id, status, created_at FROM calls
         WHERE receiver_id = ? AND status IN ('ringing','connected')
         ORDER BY id DESC LIMIT 10`, [String(req.user.id)]
      );
      const calls = rows.map(row => ({ ...parseJson(row.raw_data), id: row.room_id, status: row.status, createdAt: row.created_at }));
      return res.json({ success: true, calls });
    } catch (error) {
      console.error('[Calls incoming]', error);
      return res.status(500).json({ success: false, error: 'Lecture des appels entrants impossible.' });
    }
  });

  app.post('/api/calls/:callId/signals', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const callId = String(req.params.callId);
      const call = await getParticipantCall(callId, String(req.user.id));
      if (!call) return res.status(404).json({ success: false, error: 'Appel introuvable ou accès refusé.' });
      const eventType = String(req.body?.eventType || 'signal');
      const payload = req.body?.payload ?? {};
      const toUserId = String(req.body?.toUserId || '');
      const participants = [String(call.caller_id), String(call.receiver_id)];
      if (toUserId === '*') {
        if (eventType !== 'call_ended') return res.status(400).json({ success: false, error: 'Diffusion globale non autorisée pour cet événement.' });
        for (const recipient of participants.filter(id => id !== String(req.user.id))) {
          await getMariaDbPool().execute(
            'INSERT INTO call_signals (uid, call_id, from_user_id, to_user_id, event_type, payload, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW(3))',
            [randomUUID(), callId, String(req.user.id), recipient, eventType, JSON.stringify(payload)]
          );
        }
      } else {
        if (!participants.includes(toUserId) || toUserId === String(req.user.id)) {
          return res.status(400).json({ success: false, error: 'Destinataire de signal invalide.' });
        }
        await getMariaDbPool().execute(
          'INSERT INTO call_signals (uid, call_id, from_user_id, to_user_id, event_type, payload, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW(3))',
          [randomUUID(), callId, String(req.user.id), toUserId, eventType, JSON.stringify(payload)]
        );
      }
      return res.json({ success: true });
    } catch (error) {
      console.error('[Calls signal send]', error);
      return res.status(500).json({ success: false, error: 'Transmission du signal impossible.' });
    }
  });

  app.get('/api/calls/:callId/signals', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const callId = String(req.params.callId);
      const call = await getParticipantCall(callId, String(req.user.id));
      if (!call) return res.status(404).json({ success: false, error: 'Appel introuvable ou accès refusé.' });
      const afterId = Math.max(0, Number(req.query.after || 0));
      const [rows] = await getMariaDbPool().execute<RowDataPacket[]>(
        `SELECT id, from_user_id, event_type, payload, created_at
         FROM call_signals WHERE call_id = ? AND to_user_id = ? AND id > ?
         ORDER BY id ASC LIMIT 100`,
        [callId, String(req.user.id), afterId]
      );
      return res.json({ success: true, signals: rows.map(row => ({ ...row, payload: parseJson(row.payload) })) });
    } catch (error) {
      console.error('[Calls signal read]', error);
      return res.status(500).json({ success: false, error: 'Lecture des signaux impossible.' });
    }
  });

  app.post('/api/calls/:callId/status', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const callId = String(req.params.callId);
      const call = await getParticipantCall(callId, String(req.user.id));
      if (!call) return res.status(404).json({ success: false, error: 'Appel introuvable ou accès refusé.' });
      const status = String(req.body?.status || '');
      if (!['ringing','connected','rejected','ended'].includes(status)) return res.status(400).json({ success: false, error: 'Statut d’appel invalide.' });
      await getMariaDbPool().execute(
        'UPDATE calls SET status = ?, ended_at = ?, updated_at = NOW(3) WHERE id = ?',
        [status, ['ended','rejected'].includes(status) ? new Date() : null, call.id]
      );
      return res.json({ success: true });
    } catch (error) {
      console.error('[Calls status]', error);
      return res.status(500).json({ success: false, error: 'Mise à jour de l’appel impossible.' });
    }
  });
}
