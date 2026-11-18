import { Employee, Presence, NotificationLog, CompanyModuleConfig, AttendanceIncident } from '../../types';
import { savePresenceAtomic } from '../../services/dataService';
import { realtimeSyncService } from '../../services/realtimeSyncService';
import { getDoualaDateTime } from '../../utils/doualaTime';
import { pushNotificationBridgeService } from '../../services/pushNotificationBridgeService';
import { COMPANY_HQ_LOCATION } from '../../utils/geolocation';
import { isLate } from '../../utils/dateUtils';
import { executeOperationWithLoading } from '../../utils/sweetAlert';

export async function executeKioskClockAction(params: {
  emp: Employee;
  action: 'arrival' | 'pauseStart' | 'pauseEnd' | 'departure';
  presences: Presence[];
  moduleConfig?: CompanyModuleConfig;
  onUpdatePresences: (presences: Presence[]) => void;
  onAddNotification?: (log: NotificationLog) => void;
  onAddAttendanceIncident?: (incident: AttendanceIncident) => void;
  setToastMessage: (msg: string | null) => void;
}): Promise<void> {
  const { emp, action, presences, moduleConfig, onUpdatePresences, onAddNotification, onAddAttendanceIncident, setToastMessage } = params;
  const { date: todayStr, time: timeStr } = getDoualaDateTime();
  const scheduleStart = moduleConfig?.lateThresholdTime || '08:30';
  const plannedDeparture = moduleConfig?.plannedDepartureTime || '16:30';
  const exemptLate = emp.allowLateArrival8_930 === true && timeStr >= '08:00' && timeStr <= '09:30';
  const late = action === 'arrival' && !exemptLate && isLate(timeStr, scheduleStart);

  let targetIncident: AttendanceIncident | null = null;
  if (action === 'arrival' && late) {
    targetIncident = {
      id: `inc-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.name,
      date: todayStr,
      timeString: timeStr,
      type: 'retard',
      origin: 'automatique_pointage',
      reason: `Retard automatique constaté sur la borne à ${timeStr} (seuil: ${scheduleStart})`,
      isDeclaredInAdvance: false,
      isJustified: false,
      status: 'automatique',
      createdAt: new Date().toISOString(),
    };
  } else if (action === 'departure') {
    const exemptEarly = emp.allowEarlyDeparture15_17 === true && timeStr >= '15:00' && timeStr <= '17:00';
    if (!exemptEarly && timeStr < plannedDeparture) {
      targetIncident = {
        id: `inc-${Date.now()}`,
        employeeId: emp.id,
        employeeName: emp.name,
        date: todayStr,
        timeString: timeStr,
        type: 'sortie_prematuree',
        origin: 'automatique_pointage',
        reason: `Sortie prématurée constatée sur la borne à ${timeStr} avant 16h30 (horaire de référence: ${plannedDeparture})`,
        isDeclaredInAdvance: false,
        isJustified: false,
        status: 'automatique',
        createdAt: new Date().toISOString(),
      };
    }
  }

  const kioskLat = COMPANY_HQ_LOCATION.latitude;
  const kioskLng = COMPANY_HQ_LOCATION.longitude;
  const kioskLocation = `${moduleConfig?.hqName || 'Siège Citrine'} (Borne d'accueil - Japoma HQ)`;

  const updatedPresences = [...presences];
  const existingIdx = updatedPresences.findIndex((p) => p.employeeId === emp.id && p.date === todayStr);
  let targetPresence: Presence;

  if (existingIdx >= 0) {
    const existing = { ...updatedPresences[existingIdx] };
    existing.employeeId = emp.id;
    existing.employeeName = emp.name;
    const updatedClockLocations = { ...(existing.clockLocations || {}) };
    updatedClockLocations[action] = {
      time: timeStr,
      latitude: kioskLat,
      longitude: kioskLng,
      zoneName: kioskLocation,
      siteName: moduleConfig?.hqName || 'Siège Citrine',
      method: 'kiosk_pin',
    };
    existing.clockLocations = updatedClockLocations;
    if (action === 'arrival') {
      existing.arrivalTime = timeStr;
      existing.status = late ? 'late' : 'present';
    } else if (action === 'pauseStart') existing.pauseStart = timeStr;
    else if (action === 'pauseEnd') existing.pauseEnd = timeStr;
    else if (action === 'departure') existing.departureTime = timeStr;

    existing.location = kioskLocation;
    existing.latitude = kioskLat;
    existing.longitude = kioskLng;
    existing.clockingMethod = 'kiosk_pin';
    targetPresence = existing;
    updatedPresences[existingIdx] = existing;
  } else {
    const clockLocations: any = {
      [action]: {
        time: timeStr,
        latitude: kioskLat,
        longitude: kioskLng,
        zoneName: kioskLocation,
        siteName: moduleConfig?.hqName || 'Siège Citrine',
        method: 'kiosk_pin',
      },
    };
    targetPresence = {
      id: `pr-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.name,
      date: todayStr,
      status: late ? 'late' : 'present',
      arrivalTime: action === 'arrival' ? timeStr : null,
      pauseStart: action === 'pauseStart' ? timeStr : null,
      pauseEnd: action === 'pauseEnd' ? timeStr : null,
      departureTime: action === 'departure' ? timeStr : null,
      location: kioskLocation,
      latitude: kioskLat,
      longitude: kioskLng,
      clockingMethod: 'kiosk_pin',
      clockLocations,
    };
    updatedPresences.push(targetPresence);
  }

  const actionLabels: Record<string, string> = {
    arrival: 'Arrivée (Pointage)',
    pauseStart: 'Début Pause',
    pauseEnd: 'Fin Pause',
    departure: 'Départ (Pointage)',
  };

  let targetNotification: NotificationLog | null = null;
  if (onAddNotification) {
    targetNotification = {
      id: `notif-kiosk-${Date.now()}-${emp.id}`,
      type: 'system',
      recipient: emp.id,
      targetUserId: emp.id,
      title: `Pointage sur Borne : ${actionLabels[action] || action}`,
      content: `Pointage (${actionLabels[action] || action}) validé sur la borne daccueil à ${timeStr}.`,
      message: `Pointage (${actionLabels[action] || action}) validé sur la borne daccueil à ${timeStr}.`,
      payload: JSON.stringify({
        source: 'kiosk',
        employeeId: emp.id,
        employeeName: emp.name,
        action,
        time: timeStr,
        date: todayStr,
      }),
      timestamp: new Date().toISOString(),
      read: false,
    };
  }

  await executeOperationWithLoading({
    loadingTitle: 'Validation sur borne...',
    loadingText: `Enregistrement du pointage de ${emp.name}, veuillez patienter...`,
    action: async () => {
      const res = await savePresenceAtomic(targetPresence, targetIncident, targetNotification, action);
      if (!res.success) {
        throw new Error(res.error || 'Erreur lors de la transaction atomique sur borne.');
      }

      const persisted = res.data || {};
      const persistedPresence = persisted.presence || targetPresence;
      const persistedIncident = persisted.incident || null;
      const persistedNotification = persisted.notification || null;
      const persistedTime = persistedPresence.clockLocations?.[action]?.time ||
        persistedPresence[action === 'arrival' ? 'arrivalTime' : action === 'departure' ? 'departureTime' : action] || timeStr;
      const clockOpKey = `clock:${persistedPresence.id}:${action}:${persistedTime}`;
      pushNotificationBridgeService.markOperationDispatched(clockOpKey);

      const persistedPresences = [...presences];
      const persistedIndex = persistedPresences.findIndex(p =>
        String(p.employeeId) === String(persistedPresence.employeeId) && p.date === persistedPresence.date
      );
      if (persistedIndex >= 0) persistedPresences[persistedIndex] = persistedPresence;
      else persistedPresences.push(persistedPresence);
      onUpdatePresences(persistedPresences);

      if (persistedIncident && onAddAttendanceIncident) onAddAttendanceIncident(persistedIncident);
      if (persistedNotification && onAddNotification) {
        onAddNotification({
          ...persistedNotification,
          payload: JSON.stringify({
            source: 'kiosk',
            operationKey: clockOpKey,
            employeeId: emp.id,
            employeeName: emp.name,
            action,
            time: persistedTime,
            date: persistedPresence.date,
          }),
        });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('citrine:new_unread_alert'));
        }
      }

      realtimeSyncService.broadcastPresencePunch({
        presence: persistedPresence,
        incident: persistedIncident,
        notification: persistedNotification,
      });
      setToastMessage(null);
    },
    successTitle: 'Pointage sur borne validé !',
    successMessage: `${emp.name} — ${actionLabels[action] || action} enregistré à ${timeStr}.`,
    errorMessage: 'Impossible de valider le pointage sur la borne.',
  });
}
