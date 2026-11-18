import express from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { getMariaDbPool } from '../db/mariadb';
import type { RowDataPacket } from 'mysql2/promise';

const sseClients: Map<string, express.Response> = new Map();

export function broadcastRealtimeEvent(event: string, data: any): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const [id, clientRes] of sseClients.entries()) {
    try {
      if (!clientRes.writableEnded && !clientRes.destroyed) clientRes.write(payload);
      else sseClients.delete(id);
    } catch {
      sseClients.delete(id);
    }
  }
}

export function registerRealtimeRoutes(app: express.Express): void {
  app.get('/api/realtime/events', requireAuth, (req: AuthRequest, res: express.Response) => {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    sseClients.set(clientId, res);
    res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: Date.now() })}\n\n`);

    const keepAlive = setInterval(() => {
      try { res.write(': keepalive\n\n'); }
      catch { clearInterval(keepAlive); sseClients.delete(clientId); }
    }, 25000);

    req.on('close', () => {
      clearInterval(keepAlive);
      sseClients.delete(clientId);
    });
  });

  app.post('/api/realtime/broadcast', requireAuth, async (req: AuthRequest, res: express.Response) => {
    const { event, data } = req.body || {};
    if (event !== 'presence_update' || !data?.presence || typeof data.presence !== 'object') {
      return res.status(400).json({ success: false, error: 'Événement temps réel non autorisé.' });
    }
    try {
      const payloadSize = Buffer.byteLength(JSON.stringify(data), 'utf8');
      if (payloadSize > 256 * 1024) return res.status(413).json({ success: false, error: 'Événement trop volumineux.' });

      if (!['administrateur', 'responsable'].includes(String(req.user?.role || '').toLowerCase())) {
        const [employees] = await getMariaDbPool().execute<RowDataPacket[]>(
          'SELECT id, doc_id, uid, email FROM employees WHERE user_id = ? LIMIT 1',
          [Number(req.user?.id)]
        );
        const employee = employees[0];
        const requestedId = String(data.presence.employeeId || data.presence.employee_id || data.presence.employeeEmail || '');
        const allowedIds = employee
          ? [employee.id, employee.doc_id, employee.uid, employee.email].filter(Boolean).map(String)
          : [];
        if (!requestedId || !allowedIds.includes(requestedId)) {
          return res.status(403).json({ success: false, error: 'Tu ne peux diffuser que ton propre pointage.' });
        }
      }

      broadcastRealtimeEvent('presence_update', data);
      return res.json({ success: true, clientsNotified: sseClients.size });
    } catch (error) {
      console.error('[Realtime broadcast]', error);
      return res.status(503).json({ success: false, error: 'Diffusion temps réel indisponible.' });
    }
  });
}
