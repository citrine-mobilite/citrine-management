import { useState } from 'react';
import { 
  Employee, 
  Presence, 
  ClockingMethod, 
  EmergencyDeclaration, 
  PresenceStatus, 
  CompanyModuleConfig, 
  AttendanceIncident 
} from '../../types';
import { getCurrentUserLocation } from '../../utils/geolocation';
import { isLate } from '../../utils/dateUtils';
import { incidentService } from '../../services/incidentService';

interface UseClockingActionsProps {
  employeeProfile: Employee;
  presences: Presence[];
  todayStr: string;
  onUpdatePresences: (updated: Presence[]) => void;
  showToast: (title: string, desc: string, type?: 'success' | 'warning' | 'info') => void;
  moduleConfig?: CompanyModuleConfig;
  attendanceIncidents?: AttendanceIncident[];
  onAddAttendanceIncident?: (incident: AttendanceIncident) => void;
}

export function useClockingActions({
  employeeProfile,
  presences,
  todayStr,
  onUpdatePresences,
  showToast,
  moduleConfig,
  attendanceIncidents = [],
  onAddAttendanceIncident,
}: UseClockingActionsProps) {
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const handleConfirmClocking = async (
    pendingClockAction: 'arrival' | 'pauseStart' | 'pauseEnd' | 'departure' | null,
    method: ClockingMethod,
    onSuccess: () => void,
    customLocation?: { latitude?: number; longitude?: number; locationName?: string }
  ) => {
    if (!pendingClockAction) return;
    setIsLocating(true);
    try {
      let locationName = customLocation?.locationName || 'Bureau';
      let latitude = customLocation?.latitude;
      let longitude = customLocation?.longitude;

      // If method is GPS or door/code and not supplied, try to acquire location
      if (latitude === undefined && method !== 'qr_code_dynamic' && method !== 'admin_on_behalf') {
        try {
          const loc = await getCurrentUserLocation();
          latitude = loc.latitude;
          longitude = loc.longitude;
        } catch {
          // If GPS fails and method strictly requires GPS, throw error
          if (method === 'qr_code_door' || method === 'badge_code_16') {
            showToast('Pointage Bloqué', 'Votre position GPS est obligatoire pour cette méthode.', 'warning');
            return;
          }
        }
      }

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const lateThreshold = moduleConfig?.lateThresholdTime || '08:30';
      const plannedDeparture = moduleConfig?.plannedDepartureTime || '16:30';

      // Check for declared incidents for today
      const declaredRetard = attendanceIncidents.find(
        (i) => i.employeeId === employeeProfile.id && i.date === todayStr && i.type === 'retard'
      );
      const declaredEarlyDept = attendanceIncidents.find(
        (i) => i.employeeId === employeeProfile.id && i.date === todayStr && (i.type === 'depart_anticipe' || i.type === 'sortie_prematuree')
      );

      let status: PresenceStatus = 'present';
      let isLateArrival = false;

      if (pendingClockAction === 'arrival') {
        isLateArrival = isLate(timeStr, lateThreshold);
        if (isLateArrival) {
          // Badger en retard crée la présence avec mention RETARD
          status = 'late';

          // Création automatique de l'incident Retard
          const autoIncident: AttendanceIncident = {
            id: `inc-${Date.now()}`,
            employeeId: employeeProfile.id,
            employeeName: employeeProfile.name,
            date: todayStr,
            timeString: timeStr,
            type: 'retard',
            origin: 'automatique_pointage',
            reason: declaredRetard
              ? `Retard automatique constaté à ${timeStr} (seuil: ${lateThreshold}) - Signalé : ${declaredRetard.reason}`
              : `Retard automatique constaté à ${timeStr} (seuil: ${lateThreshold})`,
            isDeclaredInAdvance: !!declaredRetard,
            isJustified: !!declaredRetard,
            status: declaredRetard ? 'justifie' : 'automatique',
            createdAt: new Date().toISOString(),
          };

          incidentService.saveIncident(autoIncident);
          onAddAttendanceIncident?.(autoIncident);

          if (declaredRetard) {
            showToast(
              'Arrivée en Retard Enregistrée',
              `Présence marquée "En retard" à ${timeStr} et incident de retard consigné (justifié suite à votre signalement préalable).`,
              'warning'
            );
          } else {
            showToast(
              'Retard Détecté',
              `Vous avez badgé à ${timeStr} avec la mention En retard (seuil: ${lateThreshold}). Un incident de retard a été automatiquement créé.`,
              'warning'
            );
          }
        }
      } else if (pendingClockAction === 'departure') {
        // Badger le départ avant 16h30 enregistre le départ et crée automatiquement un incident "Sortie prématurée"
        const isEarlyDeparture = timeStr < plannedDeparture;
        if (isEarlyDeparture) {
          const autoIncident: AttendanceIncident = {
            id: `inc-${Date.now()}`,
            employeeId: employeeProfile.id,
            employeeName: employeeProfile.name,
            date: todayStr,
            timeString: timeStr,
            type: 'sortie_prematuree',
            origin: 'automatique_pointage',
            reason: declaredEarlyDept
              ? `Sortie prématurée constatée à ${timeStr} avant 16h30 - Signalée : ${declaredEarlyDept.reason}`
              : `Sortie prématurée constatée à ${timeStr} avant 16h30 (horaire de référence: ${plannedDeparture})`,
            isDeclaredInAdvance: !!declaredEarlyDept,
            isJustified: !!declaredEarlyDept,
            status: declaredEarlyDept ? 'justifie' : 'automatique',
            createdAt: new Date().toISOString(),
          };

          incidentService.saveIncident(autoIncident);
          onAddAttendanceIncident?.(autoIncident);

          showToast(
            'Sortie Prématurée Enregistrée',
            `Départ badgé à ${timeStr} (avant 16h30). Un incident "Sortie prématurée" a été créé automatiquement.`,
            'warning'
          );
        } else {
          showToast(
            'Départ Enregistré',
            `Départ badgé avec succès à ${timeStr}. Bonne fin de journée !`,
            'success'
          );
        }
      }

      const updatedPresences = [...presences];
      const existingIdx = updatedPresences.findIndex(
        (p) => p.employeeId === employeeProfile.id && p.date === todayStr
      );

      if (existingIdx >= 0) {
        const existing = { ...updatedPresences[existingIdx] };
        if (pendingClockAction === 'arrival') {
          existing.arrivalTime = timeStr;
          existing.status = status;
        } else if (pendingClockAction === 'pauseStart') {
          existing.pauseStart = timeStr;
        } else if (pendingClockAction === 'pauseEnd') {
          existing.pauseEnd = timeStr;
        } else if (pendingClockAction === 'departure') {
          existing.departureTime = timeStr;
        }
        existing.location = locationName;
        existing.latitude = latitude;
        existing.longitude = longitude;
        existing.clockingMethod = method;
        updatedPresences[existingIdx] = existing;
      } else {
        const newPresence: Presence = {
          id: `pr-${Date.now()}`,
          employeeId: employeeProfile.id,
          date: todayStr,
          status,
          arrivalTime: pendingClockAction === 'arrival' ? timeStr : null,
          pauseStart: pendingClockAction === 'pauseStart' ? timeStr : null,
          pauseEnd: pendingClockAction === 'pauseEnd' ? timeStr : null,
          departureTime: pendingClockAction === 'departure' ? timeStr : null,
          location: locationName,
          latitude,
          longitude,
          clockingMethod: method,
        };
        updatedPresences.push(newPresence);
      }

      onUpdatePresences(updatedPresences);
      if (!isLateArrival && pendingClockAction === 'arrival') {
        showToast('Pointage Réussi', `Arrivée à l'heure badgée avec succès (${timeStr}).`, 'success');
      } else if (pendingClockAction !== 'arrival') {
        showToast('Pointage Validé', `Votre action (${pendingClockAction}) a été enregistrée.`, 'success');
      }
      onSuccess();
    } catch {
      showToast('Erreur', 'Impossible de valider le pointage.', 'warning');
    } finally {
      setIsLocating(false);
    }
  };

  const handleConfirmCustomClock = (
    customClockHour: string,
    customClockMinute: string,
    customClockReason: string,
    setCustomClockError: (err: string | null) => void,
    onSuccess: () => void
  ) => {
    if (!customClockReason.trim()) {
      setCustomClockError('Veuillez spécifier le motif de l’ajustement.');
      return;
    }
    const timeStr = `${customClockHour}:${customClockMinute}`;
    const updatedPresences = [...presences];
    const existingIdx = updatedPresences.findIndex(
      (p) => p.employeeId === employeeProfile.id && p.date === todayStr
    );

    if (existingIdx >= 0) {
      const existing = { ...updatedPresences[existingIdx] };
      existing.arrivalTime = timeStr;
      updatedPresences[existingIdx] = existing;
    } else {
      updatedPresences.push({
        id: `pr-${Date.now()}`,
        employeeId: employeeProfile.id,
        date: todayStr,
        status: 'present',
        arrivalTime: timeStr,
        pauseStart: null,
        pauseEnd: null,
        departureTime: null,
        location: 'Bureau (Manuel)',
        clockingMethod: 'manual_admin',
      });
    }

    onUpdatePresences(updatedPresences);
    onSuccess();
    showToast('Horaire Ajusté', `Votre pointage a été enregistré à ${timeStr}.`, 'success');
  };

  const handleConfirmEmergency = async (
    emergencyType: 'retard' | 'pause_anticipee' | 'rallonge_pause' | 'depart_anticipe',
    emergencyReason: string,
    onSuccess: () => void
  ) => {
    if (!emergencyReason.trim()) return;
    const now = new Date();
    const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // 1. Create and save official AttendanceIncident
    const newIncident: AttendanceIncident = {
      id: `inc-${Date.now()}`,
      employeeId: employeeProfile.id,
      employeeName: employeeProfile.name,
      date: todayStr,
      timeString,
      type: emergencyType,
      origin: 'signale_par_employe',
      reason: emergencyReason.trim(),
      isDeclaredInAdvance: true,
      isJustified: true,
      status: 'signale',
      createdAt: now.toISOString(),
    };

    await incidentService.saveIncident(newIncident);
    onAddAttendanceIncident?.(newIncident);

    // 2. Also register into presence emergencies for backward compatibility and badge display
    const newEmergency: EmergencyDeclaration = {
      id: `emg-${Date.now()}`,
      type: emergencyType,
      reason: emergencyReason,
      timeString,
      timestamp: now.toISOString(),
      status: 'pending',
    };

    const updatedPresences = [...presences];
    const existingIdx = updatedPresences.findIndex(
      (p) => p.employeeId === employeeProfile.id && p.date === todayStr
    );

    if (existingIdx >= 0) {
      const existing = { ...updatedPresences[existingIdx] };
      existing.emergencies = [...(existing.emergencies || []), newEmergency];
      updatedPresences[existingIdx] = existing;
    } else {
      updatedPresences.push({
        id: `pr-${Date.now()}`,
        employeeId: employeeProfile.id,
        date: todayStr,
        status: 'present',
        arrivalTime: null,
        pauseStart: null,
        pauseEnd: null,
        departureTime: null,
        emergencies: [newEmergency],
      });
    }

    onUpdatePresences(updatedPresences);
    onSuccess();
    showToast(
      'Incident Signalé',
      'Votre signalement a été enregistré avec succès et pris en compte dans le radar d\'assiduité.',
      'info'
    );
  };

  return {
    isLocating,
    handleConfirmClocking,
    handleConfirmCustomClock,
    handleConfirmEmergency,
  };
}
