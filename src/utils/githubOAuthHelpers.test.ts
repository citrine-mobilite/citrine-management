import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGithubAuthorizeUrl,
  getGithubCookieOptions,
  isAllowedGithubOAuthOrigin,
} from './githubOAuthHelpers';

test('allows same-origin callback messages', () => {
  assert.equal(
    isAllowedGithubOAuthOrigin(
      'https://citrine-management.vercel.app',
      'https://citrine-management.vercel.app'
    ),
    true
  );
});

test('allows configured redirectUri origin across environments', () => {
  assert.equal(
    isAllowedGithubOAuthOrigin(
      'https://citrine-management.vercel.app',
      'https://ais-dev-example.europe-west2.run.app',
      'https://citrine-management.vercel.app/api/github/callback'
    ),
    true
  );
});

test('allows localhost and .run.app dev origins', () => {
  assert.equal(
    isAllowedGithubOAuthOrigin('http://localhost:3000', 'https://citrine-management.vercel.app'),
    true
  );
  assert.equal(
    isAllowedGithubOAuthOrigin(
      'https://ais-dev-demo.europe-west2.run.app',
      'https://citrine-management.vercel.app'
    ),
    true
  );
});

test('rejects untrusted third-party origins and malformed URLs', () => {
  assert.equal(
    isAllowedGithubOAuthOrigin(
      'https://evil.example.com',
      'https://citrine-management.vercel.app',
      'https://citrine-management.vercel.app/api/github/callback'
    ),
    false
  );
  assert.equal(
    isAllowedGithubOAuthOrigin('not-a-valid-url', 'https://citrine-management.vercel.app'),
    false
  );
  assert.equal(
    isAllowedGithubOAuthOrigin(
      'https://evil.example.com',
      'https://citrine-management.vercel.app',
      'invalid-redirect-uri'
    ),
    false
  );
});

test('buildGithubAuthorizeUrl includes prompt=select_account and OAuth parameters', () => {
  const url = buildGithubAuthorizeUrl({
    clientId: 'client_123',
    redirectUri: 'https://citrine-management.vercel.app/api/github/callback',
    state: 'signed_state_abc',
  });
  const parsed = new URL(url);
  assert.equal(parsed.origin, 'https://github.com');
  assert.equal(parsed.pathname, '/login/oauth/authorize');
  assert.equal(parsed.searchParams.get('client_id'), 'client_123');
  assert.equal(
    parsed.searchParams.get('redirect_uri'),
    'https://citrine-management.vercel.app/api/github/callback'
  );
  assert.equal(parsed.searchParams.get('scope'), 'repo read:user');
  assert.equal(parsed.searchParams.get('state'), 'signed_state_abc');
  assert.equal(parsed.searchParams.get('prompt'), 'select_account');
});

test('getGithubCookieOptions adapts secure and sameSite to HTTPS vs HTTP', () => {
  assert.deepEqual(getGithubCookieOptions(true), {
    secure: true,
    sameSite: 'none',
    httpOnly: true,
    path: '/',
  });
  assert.deepEqual(getGithubCookieOptions(false), {
    secure: false,
    sameSite: 'lax',
    httpOnly: true,
    path: '/',
  });
});
