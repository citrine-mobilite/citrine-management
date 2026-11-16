import {
  AttendanceIncident,
  CompanyModuleConfig,
  Employee,
  NotificationLog,
  PresenceStatus,
} from '../../../types';
import { getCurrentUserLocation, calculateDistanceMeters, COMPANY_HQ_LOCATION } from '../../../utils/geolocation';
import { isLate } from '../../../utils/dateUtils';
import { verifyDoorQrToken } from '../../../services/qrDoorValidationService';

export type ClockActionType =
  | 'arrival'
  | 'pauseStart'
  | 'pauseEnd'
  | 'departure'
  | 'sortieProStart'
  | 'sortieProEnd';

export const isSameClockEmployee = (iEmpId: any, employeeProfile: Employee): boolean => {
  const empIdStr = String(employeeProfile.id || '');
  const empUidStr = employeeProfile.uid ? String(employeeProfile.uid) : '';
  const empDbIdStr = employeeProfile._dbId ? String(employeeProfile._dbId) : '';
  const str = String(iEmpId || '');
  return str === empIdStr || (!!empUidStr && str === empUidStr) || (!!empDbIdStr && str === empDbIdStr);
};

export async function validateDoorQrMethod(
  moduleConfig: CompanyModuleConfig | undefined,
  customLocation?: { latitude?: number; longitude?: number; locationName?: string; qrCodeToken?: string },
  showToast?: (title: string, desc: string, type?: 'success' | 'warning' | 'info') => void
): Promise<boolean> {
  const providedToken = (customLocation?.qrCodeToken || '').trim();
  const doorValidation = await verifyDoorQrToken(providedToken, moduleConfig);

  if (doorValidation.isRevoked) {
    showToast?.(
      'QR Code Révoqué',
      "Le QR Code de porte a été révoqué par la direction. Veuillez scanner la nouvelle affiche officielle.",
      'warning'
    );
    return false;
  }

  if (!doorValidation.valid) {
    showToast?.(
      'Pointage Rejeté',
      "Le jeton du QR Code ne correspond pas au jeton officiel configuré pour la porte.",
      'warning'
    );
    return false;
  }

  if (customLocation && doorValidation.cleanToken) {
    customLocation.qrCodeToken = doorValidation.cleanToken;
  }
  return true;
}

export async function resolveClockingGpsAndZone(
  customLocation: { latitude?: number; longitude?: number; locationName?: string; qrCodeToken?: string } | undefined,
  showToast: (title: string, desc: string, type?: 'success' | 'warning' | 'info') => void
): Promise<{ latitude: number; longitude: number; locationName: string } | null> {
  let latitude: number | undefined = customLocation?.latitude;
  let longitude: number | undefined = customLocation?.longitude;

  if (latitude === undefined || longitude === undefined) {
    try {
      const pos = await getCurrentUserLocation();
      latitude = pos.latitude;
      longitude = pos.longitude;
    } catch {
      showToast(
        'Pointage Refusé ❌',
        'Veuillez activer votre GPS. Le signal GPS est obligatoire pour enregistrer votre pointage (Arrivée, Pause, Reprise ou Départ).',
        'warning'
      );
      return null;
    }
  }

  if (latitude === undefined || longitude === undefined || isNaN(latitude) || isNaN(longitude)) {
    showToast(
      'Pointage Refusé ❌',
      'Position GPS introuvable. Veuillez activer votre GPS pour effectuer ce pointage.',
      'warning'
    );
    return null;
  }

  const distanceToHQ = calculateDistanceMeters(
    latitude,
    longitude,
    COMPANY_HQ_LOCATION.latitude,
    COMPANY_HQ_LOCATION.longitude
  );
  const locationName =
    distanceToHQ <= 500
      ? `Siège Citrine - Japoma Carrefour Matango (Sur site - ${Math.round(distanceToHQ)}m)`
      : `Hors site - GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)} - ${Math.round(distanceToHQ)}m du siège)`;

  return { latitude, longitude, locationName };
}

export function buildAttendanceIncidentForAction(params: {
  action: ClockActionType;
  timeStr: string;
  lateThreshold: string;
  plannedDeparture: string;
  employeeProfile: Employee;
  todayStr: string;
  attendanceIncidents: AttendanceIncident[];
}): { status: PresenceStatus; isLateArrival: boolean; targetIncident: AttendanceIncident | null } {
  const {
    action,
    timeStr,
    lateThreshold,
    plannedDeparture,
    employeeProfile,
    todayStr,
    attendanceIncidents,
  } = params;

  const empIdStr = String(employeeProfile.id || '');
  const declaredRetard = attendanceIncidents.find(
    (i) => isSameClockEmployee(i.employeeId, employeeProfile) && i.date === todayStr && i.type === 'retard'
  );
  const declaredEarlyDept = attendanceIncidents.find(
    (i) =>
      isSameClockEmployee(i.employeeId, employeeProfile) &&
      i.date === todayStr &&
      (i.type === 'depart_anticipe' || i.type === 'sortie_prematuree')
  );

  let status: PresenceStatus = 'present';
  let isLateArrival = false;
  let targetIncident: AttendanceIncident | null = null;

  if (action === 'arrival') {
    const exemptLate =
      employeeProfile.allowLateArrival8_930 === true && timeStr >= '08:00' && timeStr <= '09:30';
    isLateArrival = !exemptLate && isLate(timeStr, lateThreshold);
    if (isLateArrival) {
      status = 'late';
      if (declaredRetard) {
        const reasonBase = declaredRetard.reason || 'Retard';
        targetIncident = {
          ...declaredRetard,
          timeString: declaredRetard.timeString || timeStr,
          isJustified: true,
          status: 'justifie',
          reason: reasonBase.includes('Constaté à')
            ? reasonBase
            : `${reasonBase} (Constaté au pointage à ${timeStr})`,
        };
      } else {
        const existingAutoRetard = attendanceIncidents.find(
          (i) => isSameClockEmployee(i.employeeId, employeeProfile) && i.date === todayStr && i.type === 'retard'
        );
        if (!existingAutoRetard) {
          targetIncident = {
            id: `inc-${Date.now()}`,
            employeeId: empIdStr,
            employeeName: employeeProfile.name,
            date: todayStr,
            timeString: timeStr,
            type: 'retard',
            origin: 'automatique_pointage',
            reason: `Retard automatique constaté à ${timeStr} (seuil: ${lateThreshold})`,
            isDeclaredInAdvance: false,
            isJustified: false,
            status: 'automatique',
            createdAt: new Date().toISOString(),
          };
        }
      }
    }
  } else if (action === 'departure') {
    const exemptEarly =
      employeeProfile.allowEarlyDeparture15_17 === true && timeStr >= '15:00' && timeStr <= '17:00';
    const isEarlyDeparture = !exemptEarly && timeStr < plannedDeparture;
    if (isEarlyDeparture) {
      if (declaredEarlyDept) {
        const reasonBase = declaredEarlyDept.reason || 'Sortie prématurée';
        targetIncident = {
          ...declaredEarlyDept,
          timeString: declaredEarlyDept.timeString || timeStr,
          isJustified: true,
          status: 'justifie',
          reason: reasonBase.includes('Départ à')
            ? reasonBase
            : `${reasonBase} (Départ effectif à ${timeStr})`,
        };
      } else {
        const existingAutoEarly = attendanceIncidents.find(
          (i) =>
            isSameClockEmployee(i.employeeId, employeeProfile) &&
            i.date === todayStr &&
            (i.type === 'sortie_prematuree' || i.type === 'depart_anticipe')
        );
        if (!existingAutoEarly) {
          targetIncident = {
            id: `inc-${Date.now()}`,
            employeeId: empIdStr,
            employeeName: employeeProfile.name,
            date: todayStr,
            timeString: timeStr,
            type: 'sortie_prematuree',
            origin: 'automatique_pointage',
            reason: `Sortie prématurée constatée à ${timeStr} avant ${plannedDeparture}`,
            isDeclaredInAdvance: false,
            isJustified: false,
            status: 'automatique',
            createdAt: new Date().toISOString(),
          };
        }
      }
    }
  }

  return { status, isLateArrival, targetIncident };
}
