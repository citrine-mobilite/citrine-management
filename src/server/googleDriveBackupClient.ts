import crypto from 'node:crypto';
import type { DriveBackupFileItem } from '../types/backupTypes';
import { BACKUP_FILE_PREFIX, isManagedBackupFileName } from '../utils/backupIntegrityHelpers';

export interface GoogleDriveConfigStatus {
  ready: boolean;
  authMode: 'service_account' | 'oauth_refresh_token' | 'unconfigured';
  folderId: string | null;
}

interface ParsedServiceAccount {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

function parseServiceAccountFromEnv(): ParsedServiceAccount | null {
  const rawJson = (process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON || '').trim();
  if (rawJson) {
    try {
      const normalized = rawJson.startsWith('{')
        ? rawJson
        : Buffer.from(rawJson, 'base64').toString('utf8');
      const parsed = JSON.parse(normalized);
      if (parsed?.client_email && parsed?.private_key) {
        return {
          client_email: String(parsed.client_email).trim(),
          private_key: String(parsed.private_key).replace(/\\n/g, '\n'),
          token_uri: parsed.token_uri ? String(parsed.token_uri) : undefined,
        };
      }
    } catch {
      return null;
    }
  }

  const email = (process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL || '').trim();
  const key = (process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_PRIVATE_KEY || '').trim();
  if (email && key) {
    return {
      client_email: email,
      private_key: key.replace(/\\n/g, '\n'),
    };
  }
  return null;
}

export function getGoogleDriveConfigStatus(): GoogleDriveConfigStatus {
  const folderId = (process.env.GOOGLE_DRIVE_BACKUP_FOLDER_ID || '').trim() || null;
  const serviceAccount = parseServiceAccountFromEnv();

  const refreshToken = (process.env.GOOGLE_DRIVE_REFRESH_TOKEN || '').trim();
  const clientId = (process.env.GOOGLE_DRIVE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GOOGLE_DRIVE_CLIENT_SECRET || '').trim();
  const hasOauthRefresh = Boolean(refreshToken && clientId && clientSecret);

  // Prefer OAuth refresh token when explicitly set (essential for personal @gmail.com quota),
  // otherwise use Service Account (ideal for Google Workspace Shared Drives).
  if (hasOauthRefresh) {
    return {
      ready: Boolean(folderId),
      authMode: 'oauth_refresh_token',
      folderId,
    };
  }

  if (serviceAccount) {
    return {
      ready: Boolean(folderId),
      authMode: 'service_account',
      folderId,
    };
  }

  return {
    ready: false,
    authMode: 'unconfigured',
    folderId,
  };
}

function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/**
 * Obtains a fresh Google Drive API v3 access token via either:
 * 1) Background OAuth refresh_token grant (for personal Gmail / Google Drive quota)
 * 2) Service Account RS256 JWT assertion (for Google Workspace Shared Drives)
 */
export async function getDriveAccessToken(): Promise<{ accessToken: string; authMode: string }> {
  const status = getGoogleDriveConfigStatus();
  if (status.authMode === 'unconfigured') {
    throw new Error(
      'Authentification Google Drive non configurée (définissez GOOGLE_DRIVE_REFRESH_TOKEN + CLIENT_ID/SECRET pour Gmail, ou GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON pour un Drive partagé).'
    );
  }

  if (status.authMode === 'oauth_refresh_token') {
    const body = new URLSearchParams({
      client_id: (process.env.GOOGLE_DRIVE_CLIENT_ID || '').trim(),
      client_secret: (process.env.GOOGLE_DRIVE_CLIENT_SECRET || '').trim(),
      refresh_token: (process.env.GOOGLE_DRIVE_REFRESH_TOKEN || '').trim(),
      grant_type: 'refresh_token',
    });

    const resp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const json: any = await resp.json().catch(() => ({}));
    if (!resp.ok || !json.access_token) {
      throw new Error(
        `Échec d'obtention du token Google Drive (refresh_token) : ${json.error_description || json.error || resp.status}`
      );
    }
    return { accessToken: json.access_token, authMode: 'oauth_refresh_token' };
  }

  const sa = parseServiceAccountFromEnv();
  if (!sa) {
    throw new Error('Clé JSON du compte de service Google Drive invalide.');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claimSet = base64UrlEncode(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/drive',
      aud: sa.token_uri || 'https://oauth2.googleapis.com/token',
      iat: nowSec,
      exp: nowSec + 3600,
    })
  );

  const unsignedJwt = `${header}.${claimSet}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedJwt);
  signer.end();
  const signature = base64UrlEncode(signer.sign(sa.private_key));
  const assertion = `${unsignedJwt}.${signature}`;

  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  });

  const resp = await fetch(sa.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const json: any = await resp.json().catch(() => ({}));
  if (!resp.ok || !json.access_token) {
    throw new Error(
      `Échec d'authentification Service Account Google Drive : ${json.error_description || json.error || resp.status}`
    );
  }
  return { accessToken: json.access_token, authMode: 'service_account' };
}

export async function verifyDriveFolderAccess(folderId: string): Promise<{
  ok: boolean;
  folderName?: string;
  authMode: string;
  message: string;
}> {
  const { accessToken, authMode } = await getDriveAccessToken();
  const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(folderId)}?fields=id,name,mimeType,trashed&supportsAllDrives=true`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json: any = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    return {
      ok: false,
      authMode,
      message: `Impossible d'accéder au dossier Google Drive (${resp.status}) : ${json?.error?.message || 'Accès refusé ou ID invalide'}`,
    };
  }
  if (json.trashed) {
    return {
      ok: false,
      authMode,
      folderName: json.name,
      message: `Le dossier Google Drive "${json.name}" est dans la corbeille.`,
    };
  }
  if (json.mimeType !== 'application/vnd.google-apps.folder') {
    return {
      ok: false,
      authMode,
      folderName: json.name,
      message: `L'identifiant cible ("${json.name}") n'est pas un dossier Google Drive.`,
    };
  }
  return {
    ok: true,
    authMode,
    folderName: json.name,
    message: `Dossier "${json.name}" accessible (${authMode === 'service_account' ? 'Compte de service' : 'OAuth Refresh Token'}).`,
  };
}

export async function listDriveBackupFiles(
  folderId: string,
  retentionDays: number = 45
): Promise<DriveBackupFileItem[]> {
  const { accessToken } = await getDriveAccessToken();
  const q = `'${folderId.replace(/'/g, "\\'")}' in parents and trashed = false`;
  const params = new URLSearchParams({
    q,
    fields: 'files(id,name,size,createdTime,md5Checksum,webViewLink)',
    orderBy: 'createdTime desc',
    pageSize: '200',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
  });

  const resp = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json: any = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(json?.error?.message || `Erreur listing Google Drive (${resp.status})`);
  }

  const nowMs = Date.now();
  const files: any[] = Array.isArray(json.files) ? json.files : [];
  return files
    .filter((f) => isManagedBackupFileName(f.name, BACKUP_FILE_PREFIX))
    .map((f) => {
      const createdMs = new Date(f.createdTime).getTime();
      const ageDays = Number.isNaN(createdMs)
        ? 0
        : Math.max(0, Math.floor((nowMs - createdMs) / (24 * 60 * 60 * 1000)));
      return {
        id: String(f.id),
        name: String(f.name),
        sizeBytes: Number(f.size || 0),
        createdTime: String(f.createdTime || ''),
        md5Checksum: f.md5Checksum ? String(f.md5Checksum) : null,
        webViewLink: f.webViewLink ? String(f.webViewLink) : null,
        ageDays,
        eligibleForPurge: ageDays >= retentionDays,
      };
    });
}

export interface UploadDriveBackupResult {
  id: string;
  name: string;
  sizeBytes: number;
  md5Checksum: string | null;
  createdTime: string;
  webViewLink: string | null;
}

export async function uploadBackupToDrive(params: {
  folderId: string;
  fileName: string;
  buffer: Buffer;
  sha256: string;
  databaseName: string;
}): Promise<UploadDriveBackupResult> {
  const { accessToken } = await getDriveAccessToken();
  const boundary = `citrine_herocab_boundary_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;

  const metadata = {
    name: params.fileName,
    parents: [params.folderId],
    mimeType: 'application/gzip',
    description: `Sauvegarde SQL HeroCab (${params.databaseName}) — SHA256: ${params.sha256}`,
    appProperties: {
      source: 'citrine-herocab-backup',
      database: params.databaseName.slice(0, 60),
      sha256Prefix: params.sha256.slice(0, 32),
    },
  };

  const preamble = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/gzip\r\n\r\n`,
    'utf8'
  );
  const epilogue = Buffer.from(`\r\n--${boundary}--`, 'utf8');
  const multipartBody = Buffer.concat([preamble, params.buffer, epilogue]);

  const url =
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,size,md5Checksum,createdTime,webViewLink';

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
      'Content-Length': String(multipartBody.length),
    },
    body: multipartBody,
  });

  const json: any = await resp.json().catch(() => ({}));
  if (!resp.ok || !json.id) {
    const errMsg = json?.error?.message || `Erreur HTTP ${resp.status}`;
    if (errMsg.toLowerCase().includes('storage quota')) {
      throw new Error(
        `Quota Google Drive refusé (${errMsg}). Sur un compte Gmail personnel, utilisez GOOGLE_DRIVE_REFRESH_TOKEN + CLIENT_ID/SECRET ou un Drive partagé Google Workspace.`
      );
    }
    throw new Error(`Échec de l'envoi sur Google Drive : ${errMsg}`);
  }

  return {
    id: String(json.id),
    name: String(json.name || params.fileName),
    sizeBytes: Number(json.size || params.buffer.length),
    md5Checksum: json.md5Checksum ? String(json.md5Checksum) : null,
    createdTime: String(json.createdTime || new Date().toISOString()),
    webViewLink: json.webViewLink ? String(json.webViewLink) : `https://drive.google.com/file/d/${json.id}/view`,
  };
}

export async function downloadDriveFileBuffer(fileId: string): Promise<{
  buffer: Buffer;
  name: string;
  md5Checksum: string | null;
  sizeBytes: number;
}> {
  const { accessToken } = await getDriveAccessToken();
  const metaResp = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,size,md5Checksum&supportsAllDrives=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const meta: any = await metaResp.json().catch(() => ({}));
  if (!metaResp.ok) {
    throw new Error(meta?.error?.message || `Impossible de lire les métadonnées Drive (${metaResp.status})`);
  }

  const mediaResp = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!mediaResp.ok) {
    throw new Error(`Impossible de télécharger le fichier Drive (${mediaResp.status})`);
  }
  const arrayBuf = await mediaResp.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuf),
    name: String(meta.name || fileId),
    md5Checksum: meta.md5Checksum ? String(meta.md5Checksum) : null,
    sizeBytes: Number(meta.size || arrayBuf.byteLength),
  };
}

export async function deleteDriveFile(fileId: string): Promise<void> {
  const { accessToken } = await getDriveAccessToken();
  const resp = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?supportsAllDrives=true`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!resp.ok && resp.status !== 404) {
    const json: any = await resp.json().catch(() => ({}));
    throw new Error(json?.error?.message || `Suppression Drive échouée (${resp.status})`);
  }
}
