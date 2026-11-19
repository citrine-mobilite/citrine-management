import crypto from 'crypto';
import express from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { buildGithubAuthorizeUrl, getGithubCookieOptions } from '../utils/githubOAuthHelpers';

interface GithubSessionRecord {
  sessionId: string;
  accessToken: string;
  scope: string;
  user: {
    login: string;
    name: string | null;
    avatarUrl: string;
    htmlUrl: string;
  };
  createdAt: string;
}

const SESSION_COOKIE_NAME = 'citrine_gh_session';
const SESSION_COLLECTION = 'github_oauth_sessions';
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

const sessionCache = new Map<string, GithubSessionRecord>();

function parseCookies(cookieHeader?: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) result[key] = decodeURIComponent(val);
  }
  return result;
}

function getGithubCredentials() {
  const clientId = (process.env.GITHUB_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GITHUB_CLIENT_SECRET || '').trim();
  const isPlaceholderId = !clientId || clientId === 'your-github-oauth-client-id';
  const isPlaceholderSecret = !clientSecret || clientSecret === 'your-github-oauth-client-secret';
  return {
    clientId,
    clientSecret,
    configured: !isPlaceholderId && !isPlaceholderSecret,
  };
}

function getGithubRedirectUri(req: express.Request): string {
  const explicitCallback = (process.env.GITHUB_CALLBACK_URL || '').trim();
  if (explicitCallback) {
    return explicitCallback;
  }

  const protoHeader = req.headers['x-forwarded-proto'];
  const proto = Array.isArray(protoHeader) ? protoHeader[0] : (protoHeader || req.protocol || 'https');
  const hostHeader = req.headers['x-forwarded-host'] || req.get('host');
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;

  if (process.env.VERCEL && host) {
    return `https://${host}/api/github/callback`;
  }

  const appUrl = (process.env.APP_URL || '').trim().replace(/\/+$/, '');
  if (appUrl && appUrl !== 'MY_APP_URL') {
    return `${appUrl}/api/github/callback`;
  }

  return `${proto}://${host}/api/github/callback`;
}

/**
 * Stateless HMAC-signed OAuth state (works across serverless Vercel instances without shared memory)
 */
function createSignedOAuthState(clientSecret: string): string {
  const nonce = crypto.randomBytes(12).toString('hex');
  const ts = Date.now().toString(36);
  const payload = `${nonce}.${ts}`;
  const sig = crypto.createHmac('sha256', clientSecret).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function verifySignedOAuthState(state: string, clientSecret: string): boolean {
  const parts = state.split('.');
  if (parts.length !== 3) return false;
  const [nonce, ts, sig] = parts;
  const timestamp = parseInt(ts, 36);
  if (!nonce || Number.isNaN(timestamp) || Date.now() - timestamp > OAUTH_STATE_TTL_MS) {
    return false;
  }
  const payload = `${nonce}.${ts}`;
  const expected = crypto.createHmac('sha256', clientSecret).update(payload).digest('hex');
  if (sig.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

async function saveGithubSession(record: GithubSessionRecord): Promise<void> {
  sessionCache.set(record.sessionId, record);
  try {
    await supabaseAdmin.from('generic_collections').upsert(
      {
        collection: SESSION_COLLECTION,
        doc_id: record.sessionId,
        data: record,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'collection,doc_id' }
    );
  } catch (err) {
    console.warn('[GitHub OAuth] Failed to persist session to Supabase:', err);
  }
}

async function loadGithubSession(sessionId?: string | null): Promise<GithubSessionRecord | null> {
  if (!sessionId) return null;
  const cached = sessionCache.get(sessionId);
  if (cached) return cached;

  try {
    const { data, error } = await supabaseAdmin
      .from('generic_collections')
      .select('data')
      .eq('collection', SESSION_COLLECTION)
      .eq('doc_id', sessionId)
      .maybeSingle();

    if (!error && data?.data?.accessToken) {
      const record = data.data as GithubSessionRecord;
      sessionCache.set(sessionId, record);
      return record;
    }
  } catch (err) {
    console.warn('[GitHub OAuth] Session lookup notice:', err);
  }
  return null;
}

async function deleteGithubSession(sessionId?: string | null): Promise<void> {
  if (!sessionId) return;
  sessionCache.delete(sessionId);
  try {
    await supabaseAdmin
      .from('generic_collections')
      .delete()
      .eq('collection', SESSION_COLLECTION)
      .eq('doc_id', sessionId);
  } catch (err) {
    console.warn('[GitHub OAuth] Session delete notice:', err);
  }
}

function resolveSessionId(req: express.Request): string | null {
  const headerToken = req.headers['x-github-session'];
  if (typeof headerToken === 'string' && headerToken.trim()) {
    return headerToken.trim();
  }
  const cookies = parseCookies(req.headers.cookie);
  return cookies[SESSION_COOKIE_NAME] || null;
}

function isValidRepoSegment(seg: string): boolean {
  return /^[a-zA-Z0-9._-]+$/.test(seg) && seg !== '.' && seg !== '..';
}

function isSecureRequest(req: express.Request): boolean {
  const protoHeader = req.headers['x-forwarded-proto'];
  const proto = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader;
  return Boolean(req.secure || proto === 'https' || process.env.VERCEL);
}

/**
 * Revokes the GitHub OAuth App grant for the disconnected token so GitHub
 * genuinely disconnects this application without affecting any other app session.
 */
async function revokeGithubOAuthGrant(
  clientId: string,
  clientSecret: string,
  accessToken: string
): Promise<boolean> {
  if (!clientId || !clientSecret || !accessToken) return false;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await fetch(
      `https://api.github.com/applications/${encodeURIComponent(clientId)}/grant`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'Citrine-Management-ReadOnly',
        },
        body: JSON.stringify({ access_token: accessToken }),
        signal: controller.signal,
      }
    );
    return res.status === 204 || (res.status >= 200 && res.status < 300);
  } catch (err) {
    console.warn('[GitHub OAuth] Failed to revoke grant on GitHub:', err);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Strict Read-Only GitHub API GET caller.
 * No write HTTP methods (POST/PUT/PATCH/DELETE) exist anywhere in this module.
 */
async function githubApiGet(path: string, accessToken: string): Promise<{ status: number; data: any }> {
  const url = `https://api.github.com${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Citrine-Management-ReadOnly',
      },
      signal: controller.signal,
    });
    const text = await res.text();
    let parsed: any = text;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }
    return { status: res.status, data: parsed };
  } finally {
    clearTimeout(timeout);
  }
}

export function registerGithubRoutes(app: express.Express) {
  // 1. Connection status & configuration readiness
  app.get('/api/github/status', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const { configured } = getGithubCredentials();
    const redirectUri = getGithubRedirectUri(req);
    const sessionId = resolveSessionId(req);
    const session = await loadGithubSession(sessionId);

    if (!session) {
      return res.json({
        success: true,
        configured,
        connected: false,
        readOnly: true,
        redirectUri,
      });
    }

    res.json({
      success: true,
      configured,
      connected: true,
      readOnly: true,
      redirectUri,
      user: session.user,
    });
  });

  // 2. Construct GitHub OAuth authorization URL
  app.get('/api/github/auth-url', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const { clientId, clientSecret, configured } = getGithubCredentials();
    const redirectUri = getGithubRedirectUri(req);

    if (!configured) {
      return res.status(400).json({
        success: false,
        configured: false,
        redirectUri,
        error: 'Variables GITHUB_CLIENT_ID et GITHUB_CLIENT_SECRET non configurées.',
      });
    }

    const state = createSignedOAuthState(clientSecret);

    res.json({
      success: true,
      configured: true,
      redirectUri,
      url: buildGithubAuthorizeUrl({
        clientId,
        redirectUri,
        state,
      }),
    });
  });

  // 3. OAuth Callback (handles both /api/github/callback and /api/github/callback/)
  const callbackHandler = async (req: express.Request, res: express.Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    const oauthError = typeof req.query.error === 'string' ? req.query.error : '';

    const renderPopupClose = (payload: Record<string, any>, message: string) => {
      const enrichedPayload = { ...payload, ts: Date.now() };
      const safeJson = JSON.stringify(enrichedPayload).replace(/</g, '\\u003c');
      const isSuccess = payload.type === 'GITHUB_OAUTH_SUCCESS';
      const safeMsg = String(message).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(`<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Connexion GitHub — Citrine Management</title>
  </head>
  <body style="font-family: system-ui, -apple-system, sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; color:#1c1917; background:#fafaf9; padding:24px; box-sizing:border-box;">
    <div style="max-width:420px; width:100%; background:#ffffff; border:1px solid #e7e5e4; border-radius:16px; padding:24px; text-align:center; box-shadow:0 4px 20px rgba(0,0,0,0.05);">
      <div style="width:44px; height:44px; border-radius:999px; margin:0 auto 12px; display:flex; align-items:center; justify-content:center; font-size:20px; background:${isSuccess ? '#ecfdf5' : '#fef2f2'}; color:${isSuccess ? '#047857' : '#b91c1c'};">
        ${isSuccess ? '✓' : '!'}
      </div>
      <p style="font-size:15px; font-weight:700; margin:0 0 8px;">${safeMsg}</p>
      <p style="font-size:12px; color:#78716c; margin:0 0 18px; line-height:1.5;">
        ${isSuccess ? 'Vous pouvez revenir sur Citrine Management. Cette fenêtre va se fermer automatiquement.' : 'Vous pouvez fermer cette fenêtre et réessayer depuis Citrine Management.'}
      </p>
      <button type="button" onclick="window.close()" style="cursor:pointer; border:none; border-radius:10px; padding:10px 18px; font-size:13px; font-weight:600; background:#1c1917; color:#ffffff;">
        Fermer cette fenêtre
      </button>
    </div>
    <script>
      (function () {
        var payload = ${safeJson};
        try {
          if (typeof BroadcastChannel !== 'undefined') {
            var ch = new BroadcastChannel('citrine_github_oauth_channel');
            ch.postMessage(payload);
            ch.close();
          }
        } catch (e) {}
        try {
          localStorage.setItem('citrine_github_oauth_event', JSON.stringify(payload));
        } catch (e) {}
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(payload, '*');
          }
        } catch (e) {}
        setTimeout(function () {
          try { window.close(); } catch (e) {}
        }, 350);
      })();
    </script>
  </body>
</html>`);
    };

    if (oauthError) {
      return renderPopupClose(
        { type: 'GITHUB_OAUTH_ERROR', error: 'Autorisation GitHub refusée ou annulée.' },
        'Connexion GitHub annulée. Vous pouvez fermer cette fenêtre.'
      );
    }

    const { clientId, clientSecret, configured } = getGithubCredentials();
    if (!configured) {
      return renderPopupClose(
        { type: 'GITHUB_OAUTH_ERROR', error: 'Identifiants OAuth serveur manquants.' },
        'Configuration OAuth serveur manquante.'
      );
    }

    if (!code || !state || !verifySignedOAuthState(state, clientSecret)) {
      return renderPopupClose(
        { type: 'GITHUB_OAUTH_ERROR', error: 'Paramètres OAuth invalides ou expirés.' },
        'Session OAuth invalide ou expirée.'
      );
    }

    try {
      const redirectUri = getGithubRedirectUri(req);
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
        }),
      });
      const tokenJson: any = await tokenRes.json();
      if (!tokenRes.ok || !tokenJson?.access_token) {
        return renderPopupClose(
          { type: 'GITHUB_OAUTH_ERROR', error: tokenJson?.error_description || 'Échec d’échange du code GitHub.' },
          'Échec de connexion à GitHub.'
        );
      }

      const accessToken = String(tokenJson.access_token);
      const userResp = await githubApiGet('/user', accessToken);
      if (userResp.status !== 200 || !userResp.data?.login) {
        return renderPopupClose(
          { type: 'GITHUB_OAUTH_ERROR', error: 'Impossible de lire le profil GitHub.' },
          'Impossible de récupérer votre profil GitHub.'
        );
      }

      const sessionId = crypto.randomBytes(24).toString('hex');
      const userSummary = {
        login: String(userResp.data.login),
        name: userResp.data.name || null,
        avatarUrl: userResp.data.avatar_url || '',
        htmlUrl: userResp.data.html_url || `https://github.com/${userResp.data.login}`,
      };

      await saveGithubSession({
        sessionId,
        accessToken,
        scope: String(tokenJson.scope || 'repo read:user'),
        user: userSummary,
        createdAt: new Date().toISOString(),
      });

      res.cookie(SESSION_COOKIE_NAME, sessionId, {
        ...getGithubCookieOptions(isSecureRequest(req)),
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      return renderPopupClose(
        { type: 'GITHUB_OAUTH_SUCCESS', sessionId, user: userSummary },
        'Compte GitHub connecté en lecture seule. Fermeture...'
      );
    } catch (err: any) {
      return renderPopupClose(
        { type: 'GITHUB_OAUTH_ERROR', error: err?.message || 'Erreur OAuth GitHub.' },
        'Erreur lors de la connexion GitHub.'
      );
    }
  };

  app.get(['/api/github/callback', '/api/github/callback/'], callbackHandler);

  // 4. Disconnect GitHub session only (also revokes OAuth grant on GitHub)
  app.post('/api/github/disconnect', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const sessionId = resolveSessionId(req);
    const existingSession = await loadGithubSession(sessionId);
    let revokedOnGithub = false;

    if (existingSession?.accessToken) {
      const { clientId, clientSecret, configured } = getGithubCredentials();
      if (configured) {
        revokedOnGithub = await revokeGithubOAuthGrant(
          clientId,
          clientSecret,
          existingSession.accessToken
        );
      }
    }

    await deleteGithubSession(sessionId);
    res.clearCookie(SESSION_COOKIE_NAME, getGithubCookieOptions(isSecureRequest(req)));
    res.json({
      success: true,
      disconnected: true,
      hadSession: Boolean(existingSession),
      revokedOnGithub,
    });
  });

  // 5. List repositories (public & private, strict read-only)
  app.get('/api/github/repos', async (req, res) => {
    const session = await loadGithubSession(resolveSessionId(req));
    if (!session) {
      return res.status(401).json({ success: false, error: 'Compte GitHub non connecté.' });
    }

    const page = Math.max(1, Number(req.query.page || 1));
    const perPage = Math.min(100, Math.max(10, Number(req.query.per_page || 100)));
    const visibility = ['all', 'public', 'private'].includes(String(req.query.visibility))
      ? String(req.query.visibility)
      : 'all';

    try {
      const ghRes = await githubApiGet(
        `/user/repos?visibility=${visibility}&affiliation=owner,collaborator,organization_member&sort=updated&direction=desc&per_page=${perPage}&page=${page}`,
        session.accessToken
      );

      if (ghRes.status === 401) {
        await deleteGithubSession(session.sessionId);
        return res.status(401).json({ success: false, error: 'Session GitHub expirée. Reconnectez votre compte.' });
      }
      if (ghRes.status < 200 || ghRes.status >= 300 || !Array.isArray(ghRes.data)) {
        return res.status(ghRes.status || 502).json({
          success: false,
          error: ghRes.data?.message || 'Erreur lors du chargement des dépôts GitHub.',
        });
      }

      const repos = ghRes.data.map((r: any) => ({
        id: r.id,
        name: r.name,
        fullName: r.full_name,
        owner: r.owner?.login || '',
        description: r.description || null,
        isPrivate: Boolean(r.private),
        htmlUrl: r.html_url,
        defaultBranch: r.default_branch || 'main',
        language: r.language || null,
        stargazersCount: Number(r.stargazers_count || 0),
        forksCount: Number(r.forks_count || 0),
        updatedAt: r.updated_at,
        pushedAt: r.pushed_at || null,
        topics: Array.isArray(r.topics) ? r.topics : [],
      }));

      res.json({ success: true, data: repos });
    } catch (err: any) {
      res.status(502).json({ success: false, error: err?.message || 'Erreur réseau GitHub.' });
    }
  });

  // 6. List branches (read-only)
  app.get('/api/github/repos/:owner/:repo/branches', async (req, res) => {
    const session = await loadGithubSession(resolveSessionId(req));
    if (!session) return res.status(401).json({ success: false, error: 'Non connecté à GitHub.' });
    const { owner, repo } = req.params;
    if (!isValidRepoSegment(owner) || !isValidRepoSegment(repo)) {
      return res.status(400).json({ success: false, error: 'Dépôt invalide.' });
    }

    try {
      const ghRes = await githubApiGet(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches?per_page=50`, session.accessToken);
      if (ghRes.status !== 200 || !Array.isArray(ghRes.data)) {
        return res.status(ghRes.status || 502).json({ success: false, error: ghRes.data?.message || 'Branches indisponibles.' });
      }
      res.json({
        success: true,
        data: ghRes.data.map((b: any) => ({ name: b.name, protected: Boolean(b.protected) })),
      });
    } catch (err: any) {
      res.status(502).json({ success: false, error: err?.message || 'Erreur branches GitHub.' });
    }
  });

  // 7. Browse repository directory contents (read-only)
  app.get('/api/github/repos/:owner/:repo/contents', async (req, res) => {
    const session = await loadGithubSession(resolveSessionId(req));
    if (!session) return res.status(401).json({ success: false, error: 'Non connecté à GitHub.' });
    const { owner, repo } = req.params;
    if (!isValidRepoSegment(owner) || !isValidRepoSegment(repo)) {
      return res.status(400).json({ success: false, error: 'Dépôt invalide.' });
    }

    const rawPath = typeof req.query.path === 'string' ? req.query.path.replace(/^\/+|\/+$/g, '') : '';
    const ref = typeof req.query.ref === 'string' && req.query.ref.trim() ? `?ref=${encodeURIComponent(req.query.ref.trim())}` : '';
    const encodedPath = rawPath
      ? '/' + rawPath.split('/').map((s) => encodeURIComponent(s)).join('/')
      : '';

    try {
      const ghRes = await githubApiGet(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents${encodedPath}${ref}`, session.accessToken);
      if (ghRes.status !== 200) {
        return res.status(ghRes.status || 502).json({ success: false, error: ghRes.data?.message || 'Contenu introuvable.' });
      }
      const list = Array.isArray(ghRes.data) ? ghRes.data : [ghRes.data];
      const entries = list
        .map((item: any) => ({
          name: item.name,
          path: item.path,
          sha: item.sha,
          size: Number(item.size || 0),
          type: item.type || 'file',
          htmlUrl: item.html_url,
        }))
        .sort((a: any, b: any) => {
          if (a.type === 'dir' && b.type !== 'dir') return -1;
          if (a.type !== 'dir' && b.type === 'dir') return 1;
          return a.name.localeCompare(b.name);
        });
      res.json({ success: true, data: entries });
    } catch (err: any) {
      res.status(502).json({ success: false, error: err?.message || 'Erreur lecture dossier GitHub.' });
    }
  });

  // 8. Read-only single file preview
  app.get('/api/github/repos/:owner/:repo/blob', async (req, res) => {
    const session = await loadGithubSession(resolveSessionId(req));
    if (!session) return res.status(401).json({ success: false, error: 'Non connecté à GitHub.' });
    const { owner, repo } = req.params;
    const rawPath = typeof req.query.path === 'string' ? req.query.path.replace(/^\/+|\/+$/g, '') : '';
    if (!isValidRepoSegment(owner) || !isValidRepoSegment(repo) || !rawPath) {
      return res.status(400).json({ success: false, error: 'Chemin de fichier invalide.' });
    }

    const ref = typeof req.query.ref === 'string' && req.query.ref.trim() ? `?ref=${encodeURIComponent(req.query.ref.trim())}` : '';
    const encodedPath = rawPath.split('/').map((s) => encodeURIComponent(s)).join('/');

    try {
      const ghRes = await githubApiGet(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}${ref}`, session.accessToken);
      if (ghRes.status !== 200 || Array.isArray(ghRes.data)) {
        return res.status(ghRes.status || 404).json({ success: false, error: ghRes.data?.message || 'Fichier introuvable.' });
      }

      const file = ghRes.data;
      if (file.size > 350 * 1024) {
        return res.json({
          success: true,
          data: {
            name: file.name,
            path: file.path,
            size: file.size,
            htmlUrl: file.html_url,
            truncated: true,
            content: 'Fichier trop volumineux pour la prévisualisation en lecture seule (> 350 Ko). Ouvrez-le sur GitHub.',
          },
        });
      }

      const content =
        file.encoding === 'base64' && typeof file.content === 'string'
          ? Buffer.from(file.content, 'base64').toString('utf8')
          : String(file.content || '');

      res.json({
        success: true,
        data: {
          name: file.name,
          path: file.path,
          size: Number(file.size || 0),
          htmlUrl: file.html_url,
          truncated: false,
          content,
        },
      });
    } catch (err: any) {
      res.status(502).json({ success: false, error: err?.message || 'Erreur lecture fichier GitHub.' });
    }
  });

  // 9. Read-only README
  app.get('/api/github/repos/:owner/:repo/readme', async (req, res) => {
    const session = await loadGithubSession(resolveSessionId(req));
    if (!session) return res.status(401).json({ success: false, error: 'Non connecté à GitHub.' });
    const { owner, repo } = req.params;
    if (!isValidRepoSegment(owner) || !isValidRepoSegment(repo)) {
      return res.status(400).json({ success: false, error: 'Dépôt invalide.' });
    }
    const ref = typeof req.query.ref === 'string' && req.query.ref.trim() ? `?ref=${encodeURIComponent(req.query.ref.trim())}` : '';

    try {
      const ghRes = await githubApiGet(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme${ref}`, session.accessToken);
      if (ghRes.status === 404) {
        return res.json({ success: true, data: null });
      }
      if (ghRes.status !== 200) {
        return res.status(ghRes.status || 502).json({ success: false, error: ghRes.data?.message || 'README indisponible.' });
      }
      const content =
        ghRes.data?.encoding === 'base64' && typeof ghRes.data?.content === 'string'
          ? Buffer.from(ghRes.data.content, 'base64').toString('utf8')
          : '';
      res.json({
        success: true,
        data: {
          name: ghRes.data.name || 'README.md',
          content,
        },
      });
    } catch (err: any) {
      res.status(502).json({ success: false, error: err?.message || 'Erreur README GitHub.' });
    }
  });

  // 10. Read-only commits history
  app.get('/api/github/repos/:owner/:repo/commits', async (req, res) => {
    const session = await loadGithubSession(resolveSessionId(req));
    if (!session) return res.status(401).json({ success: false, error: 'Non connecté à GitHub.' });
    const { owner, repo } = req.params;
    if (!isValidRepoSegment(owner) || !isValidRepoSegment(repo)) {
      return res.status(400).json({ success: false, error: 'Dépôt invalide.' });
    }
    const sha = typeof req.query.sha === 'string' && req.query.sha.trim() ? `&sha=${encodeURIComponent(req.query.sha.trim())}` : '';

    try {
      const ghRes = await githubApiGet(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?per_page=25${sha}`, session.accessToken);
      if (ghRes.status !== 200 || !Array.isArray(ghRes.data)) {
        return res.status(ghRes.status || 502).json({ success: false, error: ghRes.data?.message || 'Commits indisponibles.' });
      }

      const commits = ghRes.data.map((c: any) => ({
        sha: c.sha,
        shortSha: String(c.sha || '').slice(0, 7),
        message: String(c.commit?.message || '').split('\n')[0],
        authorName: c.commit?.author?.name || c.author?.login || 'Auteur',
        date: c.commit?.author?.date || '',
        htmlUrl: c.html_url,
      }));
      res.json({ success: true, data: commits });
    } catch (err: any) {
      res.status(502).json({ success: false, error: err?.message || 'Erreur commits GitHub.' });
    }
  });
}
