import express from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { registerRealtimeRoutes } from './src/server/expressRealtimeHub';
import { registerCoreDataAndClockingRoutes } from './src/server/expressDataAndClockingRoutes';
import { registerMailAndCronRoutes } from './src/server/expressMailAndCronRoutes';
import { startScheduledCronJobs } from './src/server/cronScheduler';
import { registerAuthRoutes } from './src/server/expressAuthRoutes';
import { registerCallRoutes } from './src/server/expressCallRoutes';

dotenv.config();

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  registerAuthRoutes(app);
  registerCallRoutes(app);
  registerCoreDataAndClockingRoutes(app);
  registerRealtimeRoutes(app);
  registerMailAndCronRoutes(app);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, ws: false, allowedHosts: true },
      plugins: [
        {
          name: 'disable-vite-client-ws',
          transform(code, id) {
            if (
              (id.includes('vite/dist/client/client.mjs') || id.includes('@vite/client')) &&
              code.includes('transport.connect(createHMRHandler(handleMessage))')
            ) {
              return code
                .replace('transport.connect(createHMRHandler(handleMessage));', '/* HMR WebSocket disabled */')
                .replace('if (!invokeableTransport.send) return;', 'return;');
            }
          },
        },
      ],
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  startScheduledCronJobs();

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Server] Port ${PORT} already in use. Retrying in 1s...`);
      setTimeout(() => {
        try {
          server.close();
        } catch {}
        server.listen(PORT, '0.0.0.0');
      }, 1000);
    } else {
      console.error('[Server Error]:', err);
    }
  });

  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  process.on('uncaughtException', (err) => {
    console.error('[Server Uncaught Exception]:', err);
  });
  process.on('unhandledRejection', (reason) => {
    console.warn('[Server Unhandled Rejection]:', reason);
  });

  server.listen(PORT, '0.0.0.0');
}

startServer();
