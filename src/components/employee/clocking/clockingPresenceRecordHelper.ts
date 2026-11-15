import {
  ClockingMethod,
  CompanyModuleConfig,
  Employee,
  Presence,
  PresenceStatus,
} from '../../../types';
import { ClockActionType } from './clockingValidationHelpers';

export function upsertPresenceForClocking(params: {
  presences: Presence[];
  employeeProfile: Employee;
  todayStr: string;
  action: ClockActionType;
  status: PresenceStatus;
  timeStr: string;
  locationName: string;
  latitude: number;
  longitude: number;
  method: ClockingMethod;
  customLocation?: { latitude?: number; longitude?: number; locationName?: string; qrCodeToken?: string };
  moduleConfig?: CompanyModuleConfig;
}): { updatedPresences: Presence[]; targetPresence: Presence } {
  const {
    presences,
    employeeProfile,
    todayStr,
    action,
    status,
    timeStr,
    locationName,
    latitude,
    longitude,
    method,
    customLocation,
    moduleConfig,
  } = params;

  const updatedPresences = [...presences];
  const existingIdx = updatedPresences.findIndex(
    (p) => p.employeeId === employeeProfile.id && p.date === todayStr
  );

  let targetPresence: Presence;
  if (existingIdx >= 0) {
    const existing = { ...updatedPresences[existingIdx] };
    existing.employeeId = employeeProfile.id;
    existing.employeeName = employeeProfile.name || existing.employeeName;

    const updatedClockLocations = { ...(existing.clockLocations || {}) };
    updatedClockLocations[action] = {
      time: timeStr,
      latitude,
      longitude,
      zoneName: locationName,
      siteName: moduleConfig?.hqName || 'Siège Citrine',
      method,
      qrCodeToken: customLocation?.qrCodeToken,
    };
    existing.clockLocations = updatedClockLocations;

    if (action === 'arrival') {
      existing.arrivalTime = timeStr;
      existing.status = status;
    } else if (action === 'pauseStart') {
      existing.pauseStart = timeStr;
    } else if (action === 'pauseEnd') {
      existing.pauseEnd = timeStr;
    } else if (action === 'departure') {
      existing.departureTime = timeStr;
    } else if (action === 'sortieProStart') {
      existing.sortieProStart = timeStr;
    } else if (action === 'sortieProEnd') {
      existing.sortieProEnd = timeStr;
    }
    existing.location = locationName;
    existing.latitude = latitude;
    existing.longitude = longitude;
    existing.clockingMethod = method;
    if (customLocation?.qrCodeToken) {
      existing.qrCodeToken = customLocation.qrCodeToken;
    }

    targetPresence = {
      ...existing,
      employeeEmail: employeeProfile.email || (existing as any).employeeEmail,
    };
    updatedPresences[existingIdx] = targetPresence;
  } else {
    const clockLocations: any = {};
    clockLocations[action] = {
      time: timeStr,
      latitude,
      longitude,
      zoneName: locationName,
      siteName: moduleConfig?.hqName || 'Siège Citrine',
      method,
      qrCodeToken: customLocation?.qrCodeToken,
    };
    targetPresence = {
      id: `pr-${Date.now()}`,
      employeeId: employeeProfile.id,
      employeeName: employeeProfile.name,
      employeeEmail: employeeProfile.email,
      date: todayStr,
      status,
      arrivalTime: action === 'arrival' ? timeStr : null,
      pauseStart: action === 'pauseStart' ? timeStr : null,
      pauseEnd: action === 'pauseEnd' ? timeStr : null,
      departureTime: action === 'departure' ? timeStr : null,
      sortieProStart: action === 'sortieProStart' ? timeStr : null,
      sortieProEnd: action === 'sortieProEnd' ? timeStr : null,
      location: locationName,
      latitude,
      longitude,
      clockingMethod: method,
      qrCodeToken: customLocation?.qrCodeToken,
      clockLocations,
    } as Presence;
    updatedPresences.push(targetPresence);
  }

  return { updatedPresences, targetPresence };
}

export function showClockingSuccessToast(
  action: ClockActionType,
  isLateArrival: boolean,
  timeStr: string,
  showToast: (title: string, desc: string, type?: 'success' | 'warning' | 'info') => void
): void {
  if (action === 'arrival') {
    if (isLateArrival) {
      showToast('Arrivée Enregistrée', `Pointage validé à ${timeStr} (retard automatique consigné).`, 'warning');
    } else {
      showToast('Pointage Réussi', `Arrivée à l'heure badgée avec succès (${timeStr}).`, 'success');
    }
  } else if (action === 'departure') {
    showToast('Départ Validé', `Départ badgé avec succès à ${timeStr}.`, 'success');
  } else if (action === 'pauseStart') {
    showToast('Début de Pause', `Pause enregistrée à ${timeStr}.`, 'info');
  } else if (action === 'pauseEnd') {
    showToast('Retour de Pause', `Reprise de poste enregistrée à ${timeStr}.`, 'success');
  } else if (action === 'sortieProStart') {
    showToast('Sortie Pro Badgée', `Départ en mission extérieure enregistré à ${timeStr}.`, 'success');
  } else if (action === 'sortieProEnd') {
    showToast('Retour Pro Badgé', `Retour de mission professionnelle enregistré à ${timeStr}.`, 'success');
  } else {
    showToast('Pointage Validé', `Votre action (${action}) a été enregistrée.`, 'success');
  }
}
