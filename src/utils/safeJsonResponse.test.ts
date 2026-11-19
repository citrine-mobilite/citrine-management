import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatNonJsonHttpError,
  getDefaultGithubCallbackUrl,
  parseApiJsonResponse,
} from './safeJsonResponse';

test('getDefaultGithubCallbackUrl builds clean callback URLs', () => {
  assert.equal(
    getDefaultGithubCallbackUrl('https://citrine-management.vercel.app'),
    'https://citrine-management.vercel.app/api/github/callback'
  );
  assert.equal(
    getDefaultGithubCallbackUrl('https://citrine-management.vercel.app///'),
    'https://citrine-management.vercel.app/api/github/callback'
  );
  assert.equal(getDefaultGithubCallbackUrl(''), '/api/github/callback');
});

test('parseApiJsonResponse parses valid JSON success responses', async () => {
  const res = {
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ success: true, configured: true }),
  };
  const parsed = await parseApiJsonResponse<{ success: boolean; configured: boolean }>(res);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.status, 200);
  assert.deepEqual(parsed.data, { success: true, configured: true });
  assert.equal(parsed.errorMessage, null);
});

test('parseApiJsonResponse handles Vercel plain-text 500 crash without throwing', async () => {
  const res = {
    ok: false,
    status: 500,
    text: async () => 'A server error has occurred\n\nFUNCTION_INVOCATION_FAILED',
  };
  const parsed = await parseApiJsonResponse(res);
  assert.equal(parsed.ok, false);
  assert.equal(parsed.status, 500);
  assert.equal(parsed.data, null);
  assert.ok(parsed.errorMessage?.includes('Erreur serveur API (500)'));
  assert.ok(!parsed.errorMessage?.includes('Unexpected token'));
});

test('parseApiJsonResponse extracts structured JSON error messages', async () => {
  const res = {
    ok: false,
    status: 400,
    text: async () => JSON.stringify({ success: false, error: 'Variables GITHUB_CLIENT_ID manquantes.' }),
  };
  const parsed = await parseApiJsonResponse(res);
  assert.equal(parsed.ok, false);
  assert.equal(parsed.status, 400);
  assert.equal(parsed.errorMessage, 'Variables GITHUB_CLIENT_ID manquantes.');
});

test('formatNonJsonHttpError formats 404 HTML responses cleanly', () => {
  const msg = formatNonJsonHttpError(404, '<html><body>Not Found</body></html>');
  assert.ok(msg.includes('404'));
});
