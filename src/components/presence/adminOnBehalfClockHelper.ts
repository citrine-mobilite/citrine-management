import { savePresenceAtomic } from '../../services/dataService';
import { realtimeSyncService } from '../../services/realtimeSyncService';
import { pushNotificationBridgeService } from '../../services/pushNotificationBridgeService';
import { Employee, Presence, AppUser, NotificationLog, AttendanceIncident, CompanyModuleConfig } from '../../types';

export type AdminClockAction = 'arrival' | 'pauseStart' | 'pauseEnd' | 'departure';

export const QUICK_ADMIN_CLOCK_REASONS = [
  'Oubli de téléphone / Badge',
  'Batterie de téléphone déchargée',
  'Panne réseau / problème applicatif',
  'Collaborateur en mission extérieure',
  'Pointage sur place validé par responsable',
];

interface ExecuteAdminOnBehalfClockingParams {
  targetEmployee: Employee;
  clockAction: AdminClockAction;
  timeInput: string;
  reasonInput: string;
  todayStr: string;
  presences: Presence[];
  currentUser?: AppUser | null;
  moduleConfig?: CompanyModuleConfig;
  onUpdatePresences: (updated: Presence[]) => void;
  onAddNotification?: (log: NotificationLog) => void;
  onAddAttendanceIncident?: (incident: AttendanceIncident) => void;
}

export async function executeAdminOnBehalfClocking(
  params: ExecuteAdminOnBehalfClockingParams
): Promise<{ success: boolean; error?: string; adminName?: string }> {
  const {
    targetEmployee,
    clockAction,
    timeInput,
    reasonInput,
    todayStr,
    presences,
    currentUser,
    moduleConfig,
    onUpdatePresences,
    onAddNotification,
    onAddAttendanceIncident,
  } = params;

  const adminName = currentUser?.name || 'Responsable';
  const adminId = currentUser?.id || 'admin';
  const nowTime = timeInput || new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const lateThreshold = moduleConfig?.lateThresholdTime || '08:30';
  const plannedDeparture = moduleConfig?.plannedDepartureTime || '16:30';

  const updatedPresences = [...presences];
  const existingIdx = updatedPresences.findIndex(
    (p) => p.employeeId === targetEmployee.id && p.date === todayStr
  );
  const exemptLate = targetEmployee?.allowLateArrival8_930 === true && nowTime >= '08:00' && nowTime <= '09:30';
  const isLateNow = clockAction === 'arrival' && !exemptLate && nowTime > lateThreshold;

  let targetPresence: Presence;
  if (existingIdx >= 0) {
    const existing = { ...updatedPresences[existingIdx] };
    existing.employeeId = targetEmployee.id;
    existing.employeeName = targetEmployee.name;
    if (clockAction === 'arrival') {
      existing.arrivalTime = nowTime;
      existing.status = isLateNow ? 'late' : 'present';
    } else if (clockAction === 'pauseStart') {
      existing.pauseStart = nowTime;
    } else if (clockAction === 'pauseEnd') {
      existing.pauseEnd = nowTime;
    } else if (clockAction === 'departure') {
      existing.departureTime = nowTime;
    }
    existing.clockingMethod = 'admin_on_behalf';
    existing.badgedByAdminId = adminId;
    existing.badgedByAdminName = adminName;
    existing.adminBadgeReason = reasonInput.trim();
    existing.location = `Bureau (Pointé par ${adminName})`;
    targetPresence = existing;
    updatedPresences[existingIdx] = existing;
  } else {
    targetPresence = {
      id: `pres-${Date.now()}`,
      employeeId: targetEmployee.id,
      employeeName: targetEmployee.name,
      date: todayStr,
      status: isLateNow ? 'late' : 'present',
      arrivalTime: clockAction === 'arrival' ? nowTime : null,
      pauseStart: clockAction === 'pauseStart' ? nowTime : null,
      pauseEnd: clockAction === 'pauseEnd' ? nowTime : null,
      departureTime: clockAction === 'departure' ? nowTime : null,
      clockingMethod: 'admin_on_behalf',
      badgedByAdminId: adminId,
      badgedByAdminName: adminName,
      adminBadgeReason: reasonInput.trim(),
      location: `Bureau (Pointé par ${adminName})`,
    };
    updatedPresences.unshift(targetPresence);
  }

  let targetIncident: AttendanceIncident | null = null;
  if (clockAction === 'arrival' && isLateNow) {
    targetIncident = {
      id: `inc-${Date.now()}`,
      employeeId: targetEmployee.id,
      employeeName: targetEmployee.name,
      date: todayStr,
      timeString: nowTime,
      type: 'retard',
      origin: 'signale_par_responsable',
      reason: `Retard constaté lors du pointage administratif par ${adminName} à ${nowTime} (seuil: ${lateThreshold}). Motif: ${reasonInput.trim()}`,
      isDeclaredInAdvance: false,
      isJustified: false,
      status: 'automatique',
      createdAt: new Date().toISOString(),
    };
  } else if (clockAction === 'departure') {
    const exemptEarly = targetEmployee?.allowEarlyDeparture15_17 === true && nowTime >= '15:00' && nowTime <= '17:00';
    if (!exemptEarly && nowTime < plannedDeparture) {
      targetIncident = {
        id: `inc-${Date.now()}`,
        employeeId: targetEmployee.id,
        employeeName: targetEmployee.name,
        date: todayStr,
        timeString: nowTime,
        type: 'sortie_prematuree',
        origin: 'signale_par_responsable',
        reason: `Sortie prématurée constatée lors du pointage administratif par ${adminName} à ${nowTime} avant 16h30 (horaire de référence: ${plannedDeparture}). Motif: ${reasonInput.trim()}`,
        isDeclaredInAdvance: false,
        isJustified: false,
        status: 'automatique',
        createdAt: new Date().toISOString(),
      };
    }
  }

  const clockOpKey = `clock:${targetPresence.id}:${clockAction}:${nowTime}`;
  let targetNotification: NotificationLog | null = null;
  if (onAddNotification) {
    const actionLabels: Record<string, string> = {
      arrival: 'lArrivée',
      pauseStart: 'le Début de Pause',
      pauseEnd: 'la Reprise de Pause',
      departure: 'le Départ',
    };
    targetNotification = {
      id: `notif-clock-admin-${Date.now()}-${targetEmployee.id}`,
      title: `Pointage par Responsable : ${actionLabels[clockAction] || clockAction}`,
      content: `${adminName} a validé votre pointage (${actionLabels[clockAction] || clockAction}) à ${nowTime}. Motif : ${reasonInput.trim() || 'N/A'}`,
      message: `${adminName} a validé votre pointage (${actionLabels[clockAction] || clockAction}) à ${nowTime}. Motif : ${reasonInput.trim() || 'N/A'}`,
      targetUserId: targetEmployee.id,
      recipient: targetEmployee.id,
      payload: JSON.stringify({
        source: 'admin_on_behalf',
        operationKey: clockOpKey,
        employeeId: targetEmployee.id,
        employeeName: targetEmployee.name,
        action: clockAction,
        time: nowTime,
        date: todayStr,
      }),
      timestamp: new Date().toISOString(),
      type: 'system',
      read: false,
    };
  }

  const atomicRes = await savePresenceAtomic(targetPresence, targetIncident, targetNotification, clockAction);
  if (!atomicRes.success) {
    return { success: false, error: `Erreur denregistrement atomique: ${atomicRes.error}` };
  }

  const persisted = atomicRes.data || {};
  const persistedPresence = persisted.presence || targetPresence;
  const persistedIncident = persisted.incident || null;
  const persistedNotification = persisted.notification || null;
  const persistedTime = persistedPresence.clockLocations?.[clockAction]?.time ||
    persistedPresence[clockAction === 'arrival' ? 'arrivalTime' : clockAction === 'departure' ? 'departureTime' : clockAction] || timeInput;
  const persistedOperationKey = `clock:${persistedPresence.id}:${clockAction}:${persistedTime}`;
  pushNotificationBridgeService.markOperationDispatched(persistedOperationKey);

  const persistedPresences = [...presences];
  const persistedIndex = persistedPresences.findIndex(p =>
    String(p.employeeId) === String(persistedPresence.employeeId) && p.date === persistedPresence.date
  );
  if (persistedIndex >= 0) persistedPresences[persistedIndex] = persistedPresence;
  else persistedPresences.unshift(persistedPresence);
  onUpdatePresences(persistedPresences);

  if (persistedIncident && onAddAttendanceIncident) {
    onAddAttendanceIncident(persistedIncident);
  }
  if (persistedNotification && onAddNotification) {
    onAddNotification(persistedNotification);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('citrine:new_unread_alert'));
    }
  }

  realtimeSyncService.broadcastPresencePunch({
    presence: persistedPresence,
    incident: persistedIncident,
    notification: persistedNotification,
  });

  return { success: true, adminName };
}
