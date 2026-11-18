import { getMariaDbPool } from '../mariadb';
import { resolveEmployeeDbId } from './tableHelpers';
import type { RowDataPacket } from 'mysql2/promise';

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

export async function verifyDoorQrTokenOnServer(clockMethod: string, qrCodeToken?: string): Promise<void> {
  if (clockMethod !== 'qr_code_door') return;
  const [rows] = await getMariaDbPool().execute<RowDataPacket[]>('SELECT raw_data, setting_value FROM company_settings ORDER BY id DESC LIMIT 20');
  const row = rows.find((x: any) => x.doc_id === 'main_config' || x.setting_key === 'main_config') || rows[0];
  if (!row) return;
  const cfg = parseJson(row.raw_data).doorQrCodeToken !== undefined
    ? parseJson(row.raw_data)
    : parseJson(row.setting_value || row.raw_data);
  const official = String(cfg.doorQrCodeToken || cfg.qrCodeSecret || '').trim().toUpperCase();
  const revoked = cfg.doorQrCodeRevoked === true;
  const revokedList = Array.isArray(cfg.revokedDoorTokens) ? cfg.revokedDoorTokens.map((x: any) => String(x).trim().toUpperCase()) : [];
  const candidate = String(qrCodeToken || '').trim().toUpperCase();
  if (!candidate) throw new Error('Pointage rejeté : jeton QR Code manquant.');
  const root = candidate.replace(/-\d{4,}$/, '');
  if (revoked || revokedList.includes(candidate) || candidate.includes('REVOKED') || candidate.includes('INVALIDE')) {
    throw new Error("Pointage rejeté : ce QR Code d'entrée a été révoqué.");
  }
  if (official && candidate !== official && root !== official) {
    throw new Error('Pointage rejeté : le jeton QR Code ne correspond pas au jeton officiel actif.');
  }
}

export async function rollbackAtomicClocking(): Promise<void> {
  // Les transactions InnoDB sont désormais annulées atomiquement par withMariaDbTransaction.
}
