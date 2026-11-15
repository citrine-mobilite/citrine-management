import { handleCoreDataAndClockingRoutes } from './routes/coreDataAndClockingRoutes';
import { handleMailAndCronRoutes } from './routes/mailAndCronRoutes';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-citrine-auth');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawUrl = req.url || '/';
  const urlPath = rawUrl.split('?')[0].replace(/^\/api/, '') || '/';
  const method = req.method?.toUpperCase() || 'GET';

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {}
  }
  body = body || {};

  try {
    if (await handleCoreDataAndClockingRoutes(urlPath, method, rawUrl, body, res)) {
      return;
    }

    if (await handleMailAndCronRoutes(urlPath, method, req, body, res)) {
      return;
    }

    return res.status(404).json({
      success: false,
      error: `Route introuvable sur le dispatcher API : [${method}] ${rawUrl}`,
      receivedPath: urlPath,
      method,
    });
  } catch (error: any) {
    const rawMessage = error?.message || String(error);
    console.error('💥 [CITRINE API DISPATCHER UNHANDLED ERROR]:', error);
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
}
