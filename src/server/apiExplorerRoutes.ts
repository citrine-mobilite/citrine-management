import express from 'express';

export function registerApiExplorerRoutes(app: express.Express) {
  // Fetch remote Swagger/OpenAPI/JSON spec URL (CORS bypass)
  app.post('/api/api-explorer/fetch-spec', async (req, res) => {
    try {
      const { url } = req.body || {};
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ success: false, error: 'URL JSON requise.' });
      }
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch {
        return res.status(400).json({ success: false, error: 'URL invalide.' });
      }
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return res.status(400).json({ success: false, error: 'Protocole HTTP/HTTPS requis.' });
      }
      if (parsedUrl.hostname === '169.254.169.254') {
        return res.status(403).json({ success: false, error: 'Adresse bloquée.' });
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(parsedUrl.toString(), {
        headers: { Accept: 'application/json, */*' },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const text = await response.text();
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: `Erreur HTTP ${response.status} lors du chargement de la spécification.`,
        });
      }
      const json = JSON.parse(text);
      res.json({ success: true, data: json, rawJson: text });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error?.message || 'Impossible de récupérer ou parser le JSON distant.',
      });
    }
  });

  // Execute live HTTP request from Swagger Try-It-Out (CORS bypass)
  app.post('/api/api-explorer/execute', async (req, res) => {
    try {
      const { url, method = 'GET', headers = {}, body } = req.body || {};
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ success: false, error: 'URL cible manquante.' });
      }
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch {
        return res.status(400).json({ success: false, error: 'URL cible invalide.' });
      }
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return res.status(400).json({ success: false, error: 'Protocole non supporté.' });
      }
      if (parsedUrl.hostname === '169.254.169.254') {
        return res.status(403).json({ success: false, error: 'Adresse bloquée.' });
      }

      const upperMethod = String(method).toUpperCase();
      const forwardHeaders: Record<string, string> = {};
      if (headers && typeof headers === 'object') {
        for (const [k, v] of Object.entries(headers)) {
          if (v !== undefined && v !== null && String(k).trim()) {
            const lowerKey = k.toLowerCase();
            if (!['host', 'content-length', 'connection'].includes(lowerKey)) {
              forwardHeaders[k] = String(v);
            }
          }
        }
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const start = Date.now();
      const hasBody =
        !['GET', 'HEAD'].includes(upperMethod) &&
        body !== undefined &&
        body !== null &&
        body !== '';
      const response = await fetch(parsedUrl.toString(), {
        method: upperMethod,
        headers: forwardHeaders,
        body: hasBody ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const durationMs = Date.now() - start;

      const respHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        respHeaders[key] = value;
      });
      const contentType = response.headers.get('content-type') || '';
      const rawText = await response.text();

      let parsedBody: any = rawText;
      if (
        contentType.includes('application/json') ||
        rawText.trim().startsWith('{') ||
        rawText.trim().startsWith('[')
      ) {
        try {
          parsedBody = JSON.parse(rawText);
        } catch {
          parsedBody = rawText;
        }
      }

      res.json({
        success: true,
        status: response.status,
        statusText: response.statusText,
        durationMs,
        contentType,
        headers: respHeaders,
        body: parsedBody,
        rawText,
      });
    } catch (error: any) {
      res.status(502).json({
        success: false,
        error: error?.message || "Erreur réseau lors de l'appel API.",
      });
    }
  });
}
