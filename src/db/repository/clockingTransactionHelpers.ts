import { createHash } from 'node:crypto';
import { getMariaDbPool } from '../mariadb';
import { resolveEmployeeDbId } from './tableHelpers';
import type { PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

function parseJson(value: any): any {
  if (value && typeof value === 'object') return value;
  if (typeof value === 'string') { try { return JSON.parse(value); } catch {} }
  return {};
}

export async function resolveClockingDerogations(
  employeeId: number | null,
  employeeEmail?: string
): Promise<{ allowEarlyDeparture15_17: boolean; allowLateArrival8_930: boolean }> {
  try {
    let emp: any = null;
    if (employeeId) {
      const [rows] = await getMariaDbPool().execute<RowDataPacket[]>('SELECT user_id, email, raw_data FROM employees WHERE id = ? LIMIT 1', [employeeId]);
      emp = rows[0];
    } else if (employeeEmail) {
      const [rows] = await getMariaDbPool().execute<RowDataPacket[]>('SELECT user_id, email, raw_data FROM employees WHERE LOWER(email) = ? LIMIT 1', [employeeEmail.trim().toLowerCase()]);
      emp = rows[0];
    }
    const empRaw = parseJson(emp?.raw_data);
    let user: any = null;
    if (emp?.user_id) {
      const [rows] = await getMariaDbPool().execute<RowDataPacket[]>('SELECT raw_data FROM users WHERE id = ? LIMIT 1', [emp.user_id]);
      user = rows[0];
    } else if (employeeEmail || emp?.email) {
      const [rows] = await getMariaDbPool().execute<RowDataPacket[]>('SELECT raw_data FROM users WHERE LOWER(email) = ? LIMIT 1', [String(employeeEmail || emp.email).trim().toLowerCase()]);
      user = rows[0];
    }
    const userRaw = parseJson(user?.raw_data);
    return {
      allowEarlyDeparture15_17: Boolean(empRaw.allowEarlyDeparture15_17 || userRaw.allowEarlyDeparture15_17),
      allowLateArrival8_930: Boolean(empRaw.allowLateArrival8_930 || userRaw.allowLateArrival8_930),
    };
  } catch (error) {
    console.warn('[MariaDB] Vérification dérogations pointage :', error);
    return { allowEarlyDeparture15_17: false, allowLateArrival8_930: false };
  }
}

export interface ClockingCredentialContext {
  employeeId: number;
  employeeName?: string;
  latitude?: number;
  longitude?: number;
  action?: string;
  badgedByAdminId?: string;
  adminBadgeReason?: string;
}

export interface ClockingActor {
  id: string;
  role: string;
}

export async function verifyDoorQrTokenOnServer(
  clockMethod: string,
  qrCodeToken: string | undefined,
  context: ClockingCredentialContext,
  actor: ClockingActor | undefined,
  connection: PoolConnection
): Promise<void> {
  const method = String(clockMethod || '').toLowerCase();
  const candidate = String(qrCodeToken || '').trim().toUpperCase();
  const actorRole = String(actor?.role || '').toLowerCase();
  const isPrivileged = ['administrateur', 'responsable'].includes(actorRole);

  if (method === 'qr_code_door' || method === 'qr_code') {
    if (!candidate) throw new Error('Pointage rejeté : jeton QR Code manquant.');
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT doc_id, setting_key, raw_data, setting_value FROM company_settings ORDER BY id DESC LIMIT 20'
    );
    const row = rows.find((item: any) => item.doc_id === 'main_config' || item.setting_key === 'main_config') || rows[0];
    if (!row) throw new Error('Pointage rejeté : aucun jeton QR officiel n’est configuré.');
    const cfg = { ...parseJson(row.setting_value), ...parseJson(row.raw_data) };
    const official = String(cfg.doorQrCodeToken || cfg.qrCodeSecret || '').trim().toUpperCase();
    if (!official) throw new Error('Pointage rejeté : le jeton QR officiel doit être configuré par un administrateur.');
    const revokedList = Array.isArray(cfg.revokedDoorTokens)
      ? cfg.revokedDoorTokens.map((value: any) => String(value).trim().toUpperCase())
      : [];
    if (cfg.doorQrCodeRevoked === true || revokedList.includes(candidate) || candidate.includes('REVOKED') || candidate.includes('INVALIDE')) {
      throw new Error("Pointage rejeté : ce QR Code d'entrée a été révoqué.");
    }
    const timedSuffix = candidate.match(/-(\d{6,})$/);
    if (timedSuffix) {
      const candidateBase = candidate.slice(0, -timedSuffix[0].length);
      const officialBase = official.replace(/-\d{6,}$/, '');
      const scannedSlot = Number(timedSuffix[1]);
      const currentSlot = Math.floor(Date.now() / 30000);
      if (candidateBase !== official && candidateBase !== officialBase) {
        throw new Error('Pointage rejeté : le jeton QR Code ne correspond pas au jeton officiel actif.');
      }
      if (!Number.isSafeInteger(scannedSlot) || ![currentSlot, currentSlot - 1].includes(scannedSlot)) {
        throw new Error('Pointage rejeté : ce QR Code rotatif a expiré. Scannez le code actuellement affiché.');
      }
      return;
    }
    if (candidate !== official) {
      throw new Error('Pointage rejeté : le jeton QR Code ne correspond pas au jeton officiel actif.');
    }
    return;
  }

  if (method === 'qr_code_dynamic') {
    if (!candidate.startsWith('CITRINE-DYN-30S-')) throw new Error('Pointage rejeté : format de QR dynamique invalide.');
    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT id, expires_at, is_active, raw_data
       FROM dynamic_qr_sessions
       WHERE JSON_UNQUOTE(JSON_EXTRACT(raw_data, '$.token')) = ?
         AND is_active = 1 AND expires_at > NOW(3)
       ORDER BY id DESC LIMIT 1 FOR UPDATE`,
      [candidate]
    );
    const session = rows[0];
    if (!session) throw new Error('Pointage rejeté : QR dynamique expiré, déjà utilisé ou inconnu.');
    const raw = parseJson(session.raw_data);
    const tokenHash = createHash('sha256').update(candidate).digest('hex');
    if (String(raw.lastConsumedTokenHash || '') === tokenHash) {
      throw new Error('Pointage rejeté : ce QR dynamique a déjà été utilisé. Attendez le renouvellement du code par le responsable.');
    }
    const updatedRaw = {
      ...raw,
      status: 'active',
      lastConsumedTokenHash: tokenHash,
      lastConsumedAt: new Date().toISOString(),
      lastUsedByEmployeeId: String(context.employeeId),
      lastUsedByEmployeeName: context.employeeName || '',
      lastAction: context.action || 'arrival',
    };
    const [result] = await connection.execute<ResultSetHeader>(
      "UPDATE dynamic_qr_sessions SET raw_data = ?, updated_at = NOW(3) WHERE id = ? AND is_active = 1 AND expires_at > NOW(3) AND JSON_UNQUOTE(JSON_EXTRACT(raw_data, '$.token')) = ?",
      [JSON.stringify(updatedRaw), session.id, candidate]
    );
    if (result.affectedRows !== 1) throw new Error('Pointage rejeté : ce QR dynamique vient d’être renouvelé, consommé ou a expiré.');
    return;
  }

  if (method === 'badge_code_16' || method === 'alpha_numeric_code') {
    const code = candidate.replace(/[^A-Z0-9]/g, '');
    if (code.length !== 16) throw new Error('Pointage rejeté : le code temporaire doit contenir 16 caractères.');
    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT id, employee_id, expires_at, is_used, raw_data
       FROM badge_codes_16
       WHERE UPPER(REPLACE(code, '-', '')) = ?
         AND is_used = 0 AND (expires_at IS NULL OR expires_at > NOW(3))
       ORDER BY id DESC LIMIT 1 FOR UPDATE`,
      [code]
    );
    const badge = rows[0];
    if (!badge) throw new Error('Pointage rejeté : code temporaire introuvable, expiré ou déjà utilisé.');
    if (badge.employee_id && Number(badge.employee_id) !== Number(context.employeeId)) {
      throw new Error('Pointage rejeté : ce code temporaire n’est pas attribué à ce collaborateur.');
    }
    const raw = parseJson(badge.raw_data);
    const updatedRaw = {
      ...raw,
      isUsed: true,
      usedByEmployeeId: String(context.employeeId),
      usedByEmployeeName: context.employeeName || '',
      usedAt: new Date().toISOString(),
      usedMonth: new Date().toISOString().slice(0, 7),
      usedLatitude: context.latitude ?? null,
      usedLongitude: context.longitude ?? null,
    };
    const [result] = await connection.execute<ResultSetHeader>(
      'UPDATE badge_codes_16 SET is_used = 1, used_at = NOW(3), raw_data = ?, updated_at = NOW(3) WHERE id = ? AND is_used = 0 AND (expires_at IS NULL OR expires_at > NOW(3))',
      [JSON.stringify(updatedRaw), badge.id]
    );
    if (result.affectedRows !== 1) throw new Error('Pointage rejeté : ce code temporaire vient d’être consommé ou a expiré.');
    return;
  }

  if (method === 'admin_on_behalf') {
    if (!isPrivileged || !actor?.id || String(context.badgedByAdminId || '') !== String(actor.id)) {
      throw new Error('Pointage rejeté : seul le responsable connecté peut pointer au nom d’un collaborateur.');
    }
    if (String(context.adminBadgeReason || '').trim().length < 3) {
      throw new Error('Pointage rejeté : un motif est obligatoire pour le pointage effectué au nom d’un collaborateur.');
    }
    return;
  }

  if (['manual_admin', 'kiosk_pin', 'gps', 'wifi_ip', 'site_declaration'].includes(method)) {
    if (!isPrivileged) throw new Error('Pointage rejeté : cette méthode est réservée aux responsables et administrateurs.');
    return;
  }

  throw new Error(`Pointage rejeté : méthode de pointage non autorisée (${method || 'vide'}).`);
}

export async function rollbackAtomicClocking(): Promise<void> {
  // Les transactions InnoDB sont désormais annulées atomiquement par withMariaDbTransaction.
}
