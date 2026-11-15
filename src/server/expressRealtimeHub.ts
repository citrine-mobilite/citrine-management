import express from 'express';

const sseClients: Map<string, express.Response> = new Map();

export function broadcastRealtimeEvent(event: string, data: any): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const [id, clientRes] of sseClients.entries()) {
    try {
      if (!clientRes.writableEnded && !clientRes.destroyed) {
        clientRes.write(payload);
      } else {
        sseClients.delete(id);
      }
    } catch {
      sseClients.delete(id);
    }
  }
}

export function registerRealtimeRoutes(app: express.Express): void {
  app.get('/api/realtime/events', (req: express.Request, res: express.Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    sseClients.set(clientId, res);

    res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: Date.now() })}\n\n`);

    const keepAlive = setInterval(() => {
      try {
        res.write(': keepalive\n\n');
      } catch {
        clearInterval(keepAlive);
        sseClients.delete(clientId);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(keepAlive);
      sseClients.delete(clientId);
    });
  });

  app.post('/api/realtime/broadcast', (req: express.Request, res: express.Response) => {
    const { event, data } = req.body;
    if (event && data) {
      broadcastRealtimeEvent(event, data);
    }
    res.json({ success: true, clientsNotified: sseClients.size });
  });
}
