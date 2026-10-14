import { useState } from 'react';
import { 
  Employee, 
  Presence, 
  ClockingMethod, 
  EmergencyDeclaration, 
  PresenceStatus, 
  CompanyModuleConfig, 
  AttendanceIncident,
  EmergencyType,
  NotificationLog
} from '../../types';
import { getCurrentUserLocation } from '../../utils/geolocation';
import { isLate } from '../../utils/dateUtils';
import { incidentService } from '../../services/incidentService';
import { pushNotificationBridgeService } from '../../services/pushNotificationBridgeService';

interface UseClockingActionsProps {
  employeeProfile: Employee;
  presences: Presence[];
  todayStr: string;
  onUpdatePresences: (updated: Presence[]) => void;
  showToast: (title: string, desc: string, type?: 'success' | 'warning' | 'info') => void;
  moduleConfig?: CompanyModuleConfig;
  attendanceIncidents?: AttendanceIncident[];
  onAddAttendanceIncident?: (incident: AttendanceIncident) => void;
  onAddNotification?: (log: NotificationLog) => void;
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
  onAddNotification,
}: UseClockingActionsProps) {
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const handleConfirmClocking = async (
    pendingClockAction: 'arrival' | 'pauseStart' | 'pauseEnd' | 'departure' | 'sortieProStart' | 'sortieProEnd' | null,
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
          showToast('Pointage Refusé', 'La géolocalisation GPS est obligatoire et refusée ou indisponible sur cet appareil. Le badgeage est refusé.', 'warning');
          setIsLocating(false);
          return;
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
          status = 'late';

          if (declaredRetard) {
            const updatedRetard: AttendanceIncident = {
              ...declaredRetard,
              timeString: declaredRetard.timeString || timeStr,
              isJustified: true,
              status: 'justifie',
              reason: declaredRetard.reason.includes('Constaté à')
                ? declaredRetard.reason
                : `${declaredRetard.reason} (Constaté au pointage à ${timeStr})`,
            };
            await incidentService.saveIncident(updatedRetard);
            onAddAttendanceIncident?.(updatedRetard);
          } else {
            const autoIncident: AttendanceIncident = {
              id: `inc-${Date.now()}`,
              employeeId: employeeProfile.id,
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

            await incidentService.saveIncident(autoIncident);
            onAddAttendanceIncident?.(autoIncident);
          }
        }
      } else if (pendingClockAction === 'departure') {
        const isEarlyDeparture = timeStr < plannedDeparture;
        if (isEarlyDeparture) {
          if (declaredEarlyDept) {
            const updatedEarly: AttendanceIncident = {
              ...declaredEarlyDept,
              timeString: declaredEarlyDept.timeString || timeStr,
              isJustified: true,
              status: 'justifie',
              reason: declaredEarlyDept.reason.includes('Départ à')
                ? declaredEarlyDept.reason
                : `${declaredEarlyDept.reason} (Départ effectif à ${timeStr})`,
            };
            await incidentService.saveIncident(updatedEarly);
            onAddAttendanceIncident?.(updatedEarly);
          } else {
            const autoIncident: AttendanceIncident = {
              id: `inc-${Date.now()}`,
              employeeId: employeeProfile.id,
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

            await incidentService.saveIncident(autoIncident);
            onAddAttendanceIncident?.(autoIncident);
          }
        }
      }

      const updatedPresences = [...presences];
      const existingIdx = updatedPresences.findIndex(
        (p) => p.employeeId === employeeProfile.id && p.date === todayStr
      );

      if (existingIdx >= 0) {
        const existing = { ...updatedPresences[existingIdx] };
        existing.employeeId = employeeProfile.id;
        existing.employeeName = employeeProfile.name || existing.employeeName;
        if (pendingClockAction === 'arrival') {
          existing.arrivalTime = timeStr;
          existing.status = status;
        } else if (pendingClockAction === 'pauseStart') {
          existing.pauseStart = timeStr;
        } else if (pendingClockAction === 'pauseEnd') {
          existing.pauseEnd = timeStr;
        } else if (pendingClockAction === 'departure') {
          existing.departureTime = timeStr;
        } else if (pendingClockAction === 'sortieProStart') {
          existing.sortieProStart = timeStr;
        } else if (pendingClockAction === 'sortieProEnd') {
          existing.sortieProEnd = timeStr;
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
          employeeName: employeeProfile.name,
          date: todayStr,
          status,
          arrivalTime: pendingClockAction === 'arrival' ? timeStr : null,
          pauseStart: pendingClockAction === 'pauseStart' ? timeStr : null,
          pauseEnd: pendingClockAction === 'pauseEnd' ? timeStr : null,
          departureTime: pendingClockAction === 'departure' ? timeStr : null,
          sortieProStart: pendingClockAction === 'sortieProStart' ? timeStr : null,
          sortieProEnd: pendingClockAction === 'sortieProEnd' ? timeStr : null,
          location: locationName,
          latitude,
          longitude,
          clockingMethod: method,
        };
        updatedPresences.push(newPresence);
      }

      await onUpdatePresences(updatedPresences);

      if (onAddNotification) {
        const actionLabels: Record<string, string> = {
          arrival: 'Arrivée',
          pauseStart: 'Début de pause',
          pauseEnd: 'Fin de pause',
          departure: 'Départ',
          sortieProStart: 'Mission pro (Départ)',
          sortieProEnd: 'Mission pro (Retour)',
        };
        const actionLabel = actionLabels[pendingClockAction] || 'Pointage';

        let notifTitle = `Pointage enregistré : ${actionLabel}`;
        let notifContent = `Votre pointage (${actionLabel}) a été validé à ${timeStr} sur le site ${locationName}.`;
        let notifPayload: any = {
          source: 'pointage',
          employeeId: employeeProfile.id,
          employeeName: employeeProfile.name,
          action: pendingClockAction,
          time: timeStr,
          date: todayStr,
        };

        if (isLateArrival) {
          notifTitle = `Pointage validé : Arrivée (Retard constaté)`;
          notifContent = `Votre arrivée a été validée à ${timeStr} sur le site ${locationName}. Un incident de retard (après ${lateThreshold}) a été consigné automatiquement.`;
          notifPayload.incidentType = 'retard';
        } else if (pendingClockAction === 'departure' && timeStr < plannedDeparture) {
          notifTitle = `Pointage validé : Départ (Sortie prématurée)`;
          notifContent = `Départ badgé à ${timeStr} sur le site ${locationName} avant ${plannedDeparture}. Un incident de sortie anticipée a été consigné automatiquement.`;
          notifPayload.incidentType = 'sortie_prematuree';
        }

        onAddNotification({
          id: `notif-clock-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          type: 'system',
          recipient: employeeProfile.id,
          targetUserId: employeeProfile.id,
          title: notifTitle,
          content: notifContent,
          message: notifContent,
          payload: JSON.stringify(notifPayload),
          timestamp: new Date().toISOString(),
          read: false,
        });

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('citrine:new_unread_alert'));
        }
      }

      try {
        pushNotificationBridgeService.sendPush({
          title: `Pointage de ${employeeProfile.name}`,
          message: `${employeeProfile.name} a effectué un pointage (${pendingClockAction}) à ${timeStr} sur le site ${locationName}.`,
          senderName: employeeProfile.name,
          type: 'attendance',
          link: 'presences',
        });
      } catch (e) {
        console.warn('Failed to send push notification:', e);
      }
      if (!isLateArrival && pendingClockAction === 'arrival') {
        showToast('Pointage Réussi', `Arrivée à l'heure badgée avec succès (${timeStr}).`, 'success');
      } else if (pendingClockAction === 'sortieProStart') {
        showToast('Sortie Pro Badgée', `Départ en mission extérieure enregistré à ${timeStr}.`, 'success');
      } else if (pendingClockAction === 'sortieProEnd') {
        showToast('Retour Pro Badgé', `Retour de mission professionnelle enregistré à ${timeStr}.`, 'success');
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
    emergencyType: EmergencyType,
    emergencyReason: string,
    onSuccess: () => void
  ) => {
    if (!emergencyReason.trim()) return;

    if (emergencyType === 'retour_sortie_professionnelle') {
      const existingPresences = presences.find((p) => p.employeeId === employeeProfile.id && p.date === todayStr);
      const hasStartedMission = existingPresences?.sortieProStart || existingPresences?.emergencies?.some(e => e.type === 'sortie_professionnelle');
      const alreadyEndedMission = existingPresences?.sortieProEnd || existingPresences?.emergencies?.some(e => e.type === 'retour_sortie_professionnelle');
      if (!hasStartedMission || alreadyEndedMission) {
        showToast('Action Interdite', 'Impossible de badger un retour de mission si vous n\'avez pas encore pointé une sortie de mission (ou mission déjà clôturée) !', 'warning');
        return;
      }
    }

    const now = new Date();
    const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Anti-doublon : vérifier si ce signalement identique a déjà été consigné aujourd'hui
    const isDuplicate = attendanceIncidents.some(
      (i) =>
        i.employeeId === employeeProfile.id &&
        i.date === todayStr &&
        i.type === emergencyType &&
        i.reason.trim().toLowerCase() === emergencyReason.trim().toLowerCase()
    );

    if (isDuplicate) {
      onSuccess();
      showToast('Signalement Existant', 'Cette déclaration est déjà enregistrée dans votre dossier.', 'info');
      return;
    }

    // 1. Créer et sauvegarder l'AttendanceIncident officiel
    const newIncident: AttendanceIncident = {
      id: `inc-${Date.now()}`,
      employeeId: employeeProfile.id,
      employeeName: employeeProfile.name,
      date: todayStr,
      timeString,
      type: emergencyType as any,
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
      reason: emergencyReason.trim(),
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
      if (emergencyType === 'sortie_professionnelle') {
        existing.sortieProStart = timeString;
        existing.sortieProReason = emergencyReason.trim();
      } else if (emergencyType === 'retour_sortie_professionnelle') {
        existing.sortieProEnd = timeString;
      }
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
        sortieProStart: emergencyType === 'sortie_professionnelle' ? timeString : null,
        sortieProEnd: emergencyType === 'retour_sortie_professionnelle' ? timeString : null,
        sortieProReason: emergencyType === 'sortie_professionnelle' ? emergencyReason.trim() : null,
        emergencies: [newEmergency],
      });
    }

    onUpdatePresences(updatedPresences);

    onSuccess();

    if (emergencyType === 'sortie_professionnelle') {
      showToast('Sortie Pro Déclarée', `Départ en mission extérieure enregistré à ${timeString}.`, 'success');
    } else if (emergencyType === 'retour_sortie_professionnelle') {
      showToast('Retour Pro Déclaré', `Retour de mission professionnelle enregistré à ${timeString}.`, 'success');
    } else if (emergencyType === 'permission') {
      showToast('Permission Déclarée', 'Votre demande de permission exceptionnelle a été transmise aux RH.', 'info');
    } else if (emergencyType === 'retard') {
      showToast('Retard Signalé', 'Votre signalement de retard a été transmis avec succès.', 'info');
    } else if (emergencyType === 'depart_anticipe') {
      showToast('Départ Anticipé Signalé', 'Votre départ anticipé a été notifié aux responsables.', 'warning');
    } else {
      showToast(
        'Situation Signalée',
        'Votre déclaration a été enregistrée avec succès et prise en compte dans le suivi RH.',
        'info'
      );
    }
  };

  return {
    isLocating,
    handleConfirmClocking,
    handleConfirmCustomClock,
    handleConfirmEmergency,
  };
}
