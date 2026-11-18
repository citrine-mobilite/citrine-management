import { randomUUID } from 'node:crypto';
import { withMariaDbTransaction } from '../mariadb';
import { resolveEmployeeDbId, resolveUserDbId } from './tableHelpers';
import { resolveClockingDerogations, verifyDoorQrTokenOnServer } from './clockingTransactionHelpers';

export interface AtomicClockingTransactionInput { presence: any; incident?: any | null; notification?: any | null; actor?: { id: string; role: string }; action?: string; }

function parseRaw(value: any): any {
  if (value && typeof value === 'object') return value;
  if (typeof value === 'string') { try { return JSON.parse(value); } catch {} }
  return {};
}
function dateOnly(value: any): string {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0,10) : date.toISOString().slice(0,10);
}

export async function executeAtomicClockingTransaction(input: AtomicClockingTransactionInput) {
  const { presence, incident, notification } = input;
  if (!presence) throw new Error('Données de présence obligatoires pour la transaction atomique.');
  const employeeId = await resolveEmployeeDbId(null, presence.employeeId || presence.employee_id);
  if (!employeeId) throw new Error('Pointage rejeté : collaborateur introuvable ou non rattaché.');
  const derogations = await resolveClockingDerogations(employeeId, presence.employeeEmail);
  const method = String(presence.clockingMethod || presence.method || 'qr_code_door').toLowerCase();
  const action = String(input.action || presence.action || presence.clockAction || presence.lastAction || 'arrival');
  const actionFields: Record<string, string> = {
    arrival: 'arrivalTime',
    pauseStart: 'pauseStart',
    pauseEnd: 'pauseEnd',
    departure: 'departureTime',
    sortieProStart: 'sortieProStart',
    sortieProEnd: 'sortieProEnd',
  };
  const actionField = actionFields[action];
  if (!actionField) throw new Error('Pointage rejeté : action de pointage inconnue.');
  const now = new Date();
  const dateParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Douala', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const part = (type: string) => dateParts.find(value => value.type === type)?.value || '';
  const date = `${part('year')}-${part('month')}-${part('day')}`;
  const serverTime = `${part('hour')}:${part('minute')}`;

  return withMariaDbTransaction(async connection => {
    await verifyDoorQrTokenOnServer(method, presence.qrCodeToken, {
      employeeId,
      employeeName: presence.employeeName || presence.employee_name,
      latitude: typeof presence.latitude === 'number' ? presence.latitude : presence.gpsLat,
      longitude: typeof presence.longitude === 'number' ? presence.longitude : presence.gpsLng,
      action,
      badgedByAdminId: presence.badgedByAdminId,
      adminBadgeReason: presence.adminBadgeReason,
    }, input.actor, connection);

    const [employeeRows] = await connection.execute<any[]>(
      'SELECT id, name, first_name, last_name, email FROM employees WHERE id = ? LIMIT 1',
      [employeeId]
    );
    const employee = employeeRows[0];
    if (!employee) throw new Error('Pointage rejeté : collaborateur introuvable.');

    const [settingsRows] = await connection.execute<any[]>(
      'SELECT raw_data, setting_value FROM company_settings WHERE doc_id = ? OR setting_key = ? ORDER BY id DESC LIMIT 1',
      ['main_config', 'main_config']
    );
    const settingsRaw = parseRaw(settingsRows[0]?.raw_data);
    const settingsValue = parseRaw(settingsRows[0]?.setting_value);
    const settings = { ...settingsValue, ...settingsRaw };

    const [oldPresence] = await connection.execute<any[]>(
      'SELECT id, uid, doc_id, raw_data FROM presences WHERE employee_id = ? AND date = ? ORDER BY id DESC LIMIT 1 FOR UPDATE',
      [employeeId, date]
    );
    const oldRaw = parseRaw(oldPresence[0]?.raw_data);
    const requestedTime = String(presence[actionField] || '').trim();
    const isAdminOverride = method === 'admin_on_behalf';
    const actionTime = isAdminOverride && /^([01]\\d|2[0-3]):[0-5]\\d$/.test(requestedTime)
      ? requestedTime
      : serverTime;
    const arrivalTime = action === 'arrival' ? actionTime : String(oldRaw.arrivalTime || '');
    const departureTime = action === 'departure' ? actionTime : String(oldRaw.departureTime || '');
    const lateThreshold = String(settings.lateThresholdTime || settings.lateThreshold || '08:30');
    const exemptLate = derogations.allowLateArrival8_930 && arrivalTime >= '08:00' && arrivalTime <= '09:30';
    const lateMinutes = action === 'arrival'
      ? (exemptLate ? 0 : minutesBetweenClocks(lateThreshold, actionTime))
      : Number(oldRaw.lateMinutes || 0);
    const effectiveStatus = action === 'arrival'
      ? (lateMinutes > 0 ? 'late' : 'present')
      : (oldRaw.status || 'present');
    const presenceDocId = String(oldPresence[0]?.doc_id || oldRaw.id || `pr-${employeeId}-${date}`);
    const latitude = typeof presence.latitude === 'number' ? presence.latitude : (typeof presence.gpsLat === 'number' ? presence.gpsLat : null);
    const longitude = typeof presence.longitude === 'number' ? presence.longitude : (typeof presence.gpsLng === 'number' ? presence.gpsLng : null);
    const employeeName = employee.name || [employee.first_name, employee.last_name].filter(Boolean).join(' ') || 'Collaborateur';
    const nextPresence = {
      ...oldRaw,
      id: presenceDocId,
      employeeId: String(employeeId),
      employeeName,
      employeeEmail: employee.email || '',
      date,
      arrivalTime: arrivalTime || null,
      departureTime: departureTime || null,
      pauseStart: action === 'pauseStart' ? actionTime : (oldRaw.pauseStart || null),
      pauseEnd: action === 'pauseEnd' ? actionTime : (oldRaw.pauseEnd || null),
      sortieProStart: action === 'sortieProStart' ? actionTime : (oldRaw.sortieProStart || null),
      sortieProEnd: action === 'sortieProEnd' ? actionTime : (oldRaw.sortieProEnd || null),
      status: effectiveStatus,
      lateMinutes,
      pauseMinutes: Number(oldRaw.pauseMinutes || 0),
      location: String(presence.location || oldRaw.location || ''),
      latitude,
      longitude,
      clockingMethod: method,
      badgedByAdminId: isAdminOverride ? String(presence.badgedByAdminId || '') : undefined,
      badgedByAdminName: isAdminOverride ? String(presence.badgedByAdminName || '') : undefined,
      adminBadgeReason: isAdminOverride ? String(presence.adminBadgeReason || '') : undefined,
      clockLocations: {
        ...(oldRaw.clockLocations || {}),
        [action]: {
          time: actionTime,
          latitude,
          longitude,
          zoneName: String(presence.location || oldRaw.location || ''),
          method,
        },
      },
      credentialVerified: true,
    };
    const pFields = {
      employee_id: employeeId,
      employee_name: employeeName,
      date,
      arrival_time: nextPresence.arrivalTime,
      departure_time: nextPresence.departureTime,
      status: effectiveStatus,
      late_minutes: lateMinutes,
      pause_minutes: Number(nextPresence.pauseMinutes || 0),
      motif: isAdminOverride ? String(presence.adminBadgeReason || '') : (oldRaw.motif || null),
      signature: oldRaw.signature || null,
      gps_lat: latitude,
      gps_lng: longitude,
      method,
      raw_data: JSON.stringify(nextPresence),
      updated_at: now,
    };
    let presenceDbId: number;
    if (oldPresence[0]) {
      const columns = Object.keys(pFields);
      await connection.execute(
        `UPDATE presences SET ${columns.map(k => `\x60${k}\x60 = ?`).join(', ')} WHERE id = ?`,
        [...columns.map(k => (pFields as any)[k]), oldPresence[0].id]
      );
      presenceDbId = Number(oldPresence[0].id);
    } else {
      const [result] = await connection.execute<any>(
        `INSERT INTO presences (uid, doc_id, ${Object.keys(pFields).map(k => `\x60${k}\x60`).join(', ')}, created_at)
         VALUES (?, ?, ${Object.keys(pFields).map(() => '?').join(', ')}, NOW(3))`,
        [randomUUID(), presenceDocId, ...Object.values(pFields)]
      );
      presenceDbId = Number(result.insertId);
    }

    let savedIncident: any = null;
    const exemptEarly = derogations.allowEarlyDeparture15_17 && departureTime >= '15:00' && departureTime <= '17:00';
    const skipIncident = (incident?.type === 'retard' && exemptLate) ||
      (['sortie_prematuree','depart_anticipe'].includes(incident?.type) && exemptEarly);
    if (incident && !skipIncident) {
      const incidentId = String(incident.id || incident.docId || `inc-${randomUUID()}`);
      const incidentEmployeeId = await resolveEmployeeDbId(null, employeeId);
      const raw = {
        ...incident,
        id: incidentId,
        employeeId: String(employeeId),
        employeeName,
        date,
      };
      const [existing] = await connection.execute<any[]>(
        'SELECT id FROM attendance_incidents WHERE doc_id = ? LIMIT 1',
        [incidentId]
      );
      const fields = {
        employee_id: incidentEmployeeId || employeeId,
        date,
        type: incident.type || 'retard',
        description: incident.reason || incident.description || incident.origin || 'Incident de présence',
        status: incident.status || 'automatique',
        raw_data: JSON.stringify(raw),
        updated_at: now,
      };
      if (existing[0]) {
        const keys = Object.keys(fields);
        await connection.execute(
          `UPDATE attendance_incidents SET ${keys.map(k => `\x60${k}\x60 = ?`).join(', ')} WHERE id = ?`,
          [...keys.map(k => (fields as any)[k]), existing[0].id]
        );
      } else {
        const keys = Object.keys(fields);
        await connection.execute(
          `INSERT INTO attendance_incidents (uid, doc_id, ${keys.map(k => `\x60${k}\x60`).join(', ')}, created_at)
           VALUES (?, ?, ${keys.map(() => '?').join(', ')}, NOW(3))`,
          [randomUUID(), incidentId, ...keys.map(k => (fields as any)[k])]
        );
      }
      savedIncident = raw;
    }

    let savedNotification: any = null;
    if (notification) {
      const notifId = String(notification.id || notification.docId || `notif-clock-${randomUUID()}`);
      const userId = await resolveUserDbId(null, notification.targetUserId || notification.recipient || employeeId, notification.recipient);
      const message = notification.message || notification.content || notification.description || notification.title || 'Pointage validé';
      const raw = { ...notification, id: notifId, message };
      const [existing] = await connection.execute<any[]>(
        'SELECT id FROM notifications WHERE doc_id = ? LIMIT 1',
        [notifId]
      );
      const fields = {
        title: notification.title || 'Pointage enregistré',
        message,
        type: notification.type || 'system',
        is_read: Boolean(notification.isRead ?? notification.read ?? false),
        target_user_id: userId,
        target_employee_ids: JSON.stringify([employeeId]),
        raw_data: JSON.stringify(raw),
        updated_at: now,
      };
      if (existing[0]) {
        const keys = Object.keys(fields);
        await connection.execute(
          `UPDATE notifications SET ${keys.map(k => `\x60${k}\x60 = ?`).join(', ')} WHERE id = ?`,
          [...keys.map(k => (fields as any)[k]), existing[0].id]
        );
      } else {
        const keys = Object.keys(fields);
        await connection.execute(
          `INSERT INTO notifications (uid, doc_id, ${keys.map(k => `\x60${k}\x60`).join(', ')}, created_at)
           VALUES (?, ?, ${keys.map(() => '?').join(', ')}, NOW(3))`,
          [randomUUID(), notifId, ...keys.map(k => (fields as any)[k])]
        );
      }
      savedNotification = { ...notification, id: notifId, message };
    }

    return {
      success: true,
      presence: { ...nextPresence, id: presenceDocId, _dbId: presenceDbId },
      incident: savedIncident,
      notification: savedNotification,
    };
  });
}
