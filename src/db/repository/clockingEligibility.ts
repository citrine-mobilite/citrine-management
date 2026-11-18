import { getMariaDbPool } from '../mariadb';
import type { RowDataPacket } from 'mysql2/promise';

function parseJson(value: any): any {
  if (value && typeof value === 'object') return value;
  if (typeof value === 'string') { try { return JSON.parse(value); } catch {} }
  return {};
}

export async function checkClockingEligibilityBackend(params: { employeeId?: string; userId?: string; email?: string }) {
  const employeeId = String(params.employeeId || '').trim();
  const userId = String(params.userId || '').trim();
  const email = String(params.email || '').trim().toLowerCase();
  let employee: any = null;
  let user: any = null;

  if (employeeId) {
    const [rows] = await getMariaDbPool().execute<RowDataPacket[]>(
      /^\d+$/.test(employeeId)
        ? 'SELECT * FROM employees WHERE id = ? LIMIT 1'
        : 'SELECT * FROM employees WHERE doc_id = ? OR uid = ? LIMIT 1',
      /^\d+$/.test(employeeId) ? [Number(employeeId)] : [employeeId, employeeId]
    );
    employee = rows[0];
  }
  if (!employee && email) {
    const [rows] = await getMariaDbPool().execute<RowDataPacket[]>('SELECT * FROM employees WHERE LOWER(email) = ? LIMIT 1', [email]);
    employee = rows[0];
  }
  if (!employee && /^\d+$/.test(userId)) {
    const [rows] = await getMariaDbPool().execute<RowDataPacket[]>('SELECT * FROM employees WHERE user_id = ? LIMIT 1', [Number(userId)]);
    employee = rows[0];
  }

  if (/^\d+$/.test(userId)) {
    const [rows] = await getMariaDbPool().execute<RowDataPacket[]>('SELECT * FROM users WHERE id = ? LIMIT 1', [Number(userId)]);
    user = rows[0];
  } else if (userId) {
    const [rows] = await getMariaDbPool().execute<RowDataPacket[]>('SELECT * FROM users WHERE doc_id = ? OR uid = ? LIMIT 1', [userId, userId]);
    user = rows[0];
  }
  if (!user && employee?.user_id) {
    const [rows] = await getMariaDbPool().execute<RowDataPacket[]>('SELECT * FROM users WHERE id = ? LIMIT 1', [employee.user_id]);
    user = rows[0];
  }
  if (!user && email) {
    const [rows] = await getMariaDbPool().execute<RowDataPacket[]>('SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1', [email]);
    user = rows[0];
  }

  const empRaw = parseJson(employee?.raw_data);
  const userRaw = parseJson(user?.raw_data);
  const allowEarlyDeparture15_17 = Boolean(empRaw.allowEarlyDeparture15_17 || userRaw.allowEarlyDeparture15_17);
  const allowLateArrival8_930 = Boolean(empRaw.allowLateArrival8_930 || userRaw.allowLateArrival8_930);

  let departureActiveStartTime = '16:00';
  const [settings] = await getMariaDbPool().execute<RowDataPacket[]>('SELECT raw_data, setting_value, setting_key, doc_id FROM company_settings ORDER BY id DESC LIMIT 20');
  const setting = settings.find((x: any) => x.setting_key === 'main_config' || x.doc_id === 'main_config') || settings[0];
  if (setting) {
    const cfg = parseJson(setting.raw_data);
    const values = Object.keys(cfg).length ? cfg : parseJson(setting.setting_value);
    departureActiveStartTime = String(values.departureActiveStartTime || values.plannedDepartureTime || departureActiveStartTime);
  }

  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Douala', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
  const hh = parts.find(p => p.type === 'hour')?.value || '00';
  const mm = parts.find(p => p.type === 'minute')?.value || '00';
  const serverTimeHHMM = `${hh === '24' ? '00' : hh}:${mm}`;
  const effectiveDepartureStartTime = allowEarlyDeparture15_17 && '15:00' < departureActiveStartTime ? '15:00' : departureActiveStartTime;
  return {
    success: true, allowEarlyDeparture15_17, allowLateArrival8_930,
    canActivateDepartureButton: serverTimeHHMM >= departureActiveStartTime || (allowEarlyDeparture15_17 && serverTimeHHMM >= '15:00'),
    isEarlyWindow15_17: serverTimeHHMM >= '15:00' && serverTimeHHMM <= '17:00',
    serverTimeHHMM, departureActiveStartTime, effectiveDepartureStartTime,
  };
}
