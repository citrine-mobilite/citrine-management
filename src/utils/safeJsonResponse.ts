export interface ParsedApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  errorMessage: string | null;
}

/**
 * Computes the default GitHub OAuth callback URL for a given origin.
 */
export function getDefaultGithubCallbackUrl(origin?: string | null): string {
  const cleanOrigin = (origin || '').trim().replace(/\/+$/, '');
  if (!cleanOrigin) return '/api/github/callback';
  return `${cleanOrigin}/api/github/callback`;
}

/**
 * Formats a clear French error message when a backend endpoint returns plain text or HTML
 * instead of JSON (e.g. Vercel 500 "A server error has occurred" or 502/504 gateway errors).
 */
export function formatNonJsonHttpError(status: number, rawBody: string): string {
  const snippet = rawBody
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (status >= 500) {
    if (/a server error has occurred|function_invocation_failed/i.test(snippet)) {
      return `Erreur serveur API (${status}) : la fonction serverless backend a rencontré un problème au démarrage. Vérifiez le déploiement et les variables d'environnement.`;
    }
    return `Erreur serveur API (${status}) : réponse non-JSON reçue du serveur.`;
  }

  if (status === 404) {
    return `Endpoint API introuvable (404). Vérifiez le routage /api sur le serveur.`;
  }

  return `Réponse invalide du serveur (HTTP ${status || 'inconnu'}).`;
}

/**
 * Safely parses a Fetch Response as JSON without throwing raw SyntaxErrors
 * when the server returns plain text or HTML error pages.
 */
export async function parseApiJsonResponse<T = any>(
  res: Pick<Response, 'ok' | 'status' | 'text'>
): Promise<ParsedApiResponse<T>> {
  const rawText = await res.text();
  const trimmed = rawText.trim();

  if (!trimmed) {
    return {
      ok: res.ok,
      status: res.status,
      data: null,
      errorMessage: res.ok ? null : formatNonJsonHttpError(res.status, ''),
    };
  }

  try {
    const parsed = JSON.parse(trimmed) as T;
    const serverErr =
      !res.ok && parsed && typeof parsed === 'object'
        ? ((parsed as any).error || (parsed as any).message || null)
        : null;
    return {
      ok: res.ok,
      status: res.status,
      data: parsed,
      errorMessage: serverErr ? String(serverErr) : res.ok ? null : `Erreur HTTP ${res.status}.`,
    };
  } catch {
    return {
      ok: false,
      status: res.status,
      data: null,
      errorMessage: formatNonJsonHttpError(res.status, trimmed),
    };
  }
}
