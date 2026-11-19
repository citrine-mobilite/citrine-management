export const GITHUB_OAUTH_BROADCAST_CHANNEL = 'citrine_github_oauth_channel';
export const GITHUB_OAUTH_STORAGE_KEY = 'citrine_github_oauth_event';

/**
 * Validates whether a postMessage origin from the GitHub OAuth callback popup
 * should be trusted by the main application window.
 */
export function isAllowedGithubOAuthOrigin(
  eventOrigin: string,
  currentOrigin: string,
  redirectUri?: string | null
): boolean {
  const cleanOrigin = (eventOrigin || '').trim();
  if (!cleanOrigin) return true;

  if (cleanOrigin === currentOrigin) return true;

  try {
    const parsed = new URL(cleanOrigin);
    if (
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname.endsWith('.run.app')
    ) {
      return true;
    }
  } catch {
    return false;
  }

  if (redirectUri) {
    try {
      const configuredOrigin = new URL(redirectUri).origin;
      if (cleanOrigin === configuredOrigin) {
        return true;
      }
    } catch {
      // Ignore malformed redirectUri
    }
  }

  return false;
}

export interface GithubAuthorizeUrlParams {
  clientId: string;
  redirectUri: string;
  state: string;
  scope?: string;
}

/**
 * Builds the GitHub OAuth authorize URL with prompt=select_account so GitHub
 * always displays its account selection / authorization window instead of
 * silently auto-redirecting past GitHub.
 */
export function buildGithubAuthorizeUrl({
  clientId,
  redirectUri,
  state,
  scope = 'repo read:user',
}: GithubAuthorizeUrlParams): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state,
    prompt: 'select_account',
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export function getGithubCookieOptions(isHttps: boolean) {
  return {
    secure: isHttps,
    sameSite: (isHttps ? 'none' : 'lax') as 'none' | 'lax',
    httpOnly: true,
    path: '/',
  };
}
