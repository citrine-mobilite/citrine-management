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
import { getCurrentUserLocation, calculateDistanceMeters, COMPANY_HQ_LOCATION } from '../../utils/geolocation';
import { isLate } from '../../utils/dateUtils';
import { incidentService } from '../../services/incidentService';
import { savePresenceAtomic } from '../../services/dataService';
import { pushNotificationBridgeService } from '../../services/pushNotificationBridgeService';
import { realtimeSyncService } from '../../services/realtimeSyncService';

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
    pendingClockAction: "arrival" | "pauseStart" | "pauseEnd" | "departure" | "sortieProStart" | "sortieProEnd" | null,
    method: ClockingMethod,
    onSuccess: () => void,
    customLocation?: { latitude?: number; longitude?: number; locationName?: string }
  ) => {
    setIsLocating(true);
    try {
      let latitude: number | undefined = customLocation?.latitude;
      let longitude: number | undefined = customLocation?.longitude;
      let locationName = customLocation?.locationName || '';

      if (latitude === undefined || longitude === undefined) {
        try {
          const pos = await getCurrentUserLocation();
          latitude = pos.latitude;
          longitude = pos.longitude;
        } catch (geoErr) {
          showToast(
            'Pointage Refusé ❌',
            'Veuillez activer votre GPS. Le signal GPS est obligatoire pour enregistrer votre pointage (Arrivée, Pause, Reprise ou Départ).',
            'warning'
          );
          setIsLocating(false);
          return;
        }
      }

      if (latitude === undefined || longitude === undefined || isNaN(latitude) || isNaN(longitude)) {
        showToast(
          'Pointage Refusé ❌',
          'Position GPS introuvable. Veuillez activer votre GPS pour effectuer ce pointage.',
          'warning'
        );
        setIsLocating(false);
        return;
      }

      // Geofencing check: if within 500m of company HQ (Japoma Carrefour Matango), mark as "Sur site"
      const distanceToHQ = calculateDistanceMeters(latitude, longitude, COMPANY_HQ_LOCATION.latitude, COMPANY_HQ_LOCATION.longitude);
      if (distanceToHQ <= 500) {
        locationName = `Siège Citrine - Japoma Carrefour Matango (Sur site - ${Math.round(distanceToHQ)}m)`;
      } else {
        locationName = `Hors site - GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)} - ${Math.round(distanceToHQ)}m du siège)`;
      }

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const lateThreshold = moduleConfig?.lateThresholdTime || '08:30';
      const plannedDeparture = moduleConfig?.plannedDepartureTime || '16:30';

      const empIdStr = String(employeeProfile.id || '');
      const empUidStr = employeeProfile.uid ? String(employeeProfile.uid) : '';
      const empDbIdStr = employeeProfile._dbId ? String(employeeProfile._dbId) : '';
      const isSameEmp = (iEmpId: any) => {
        const str = String(iEmpId || '');
        return str === empIdStr || (empUidStr && str === empUidStr) || (empDbIdStr && str === empDbIdStr);
      };

      const declaredRetard = attendanceIncidents.find(
        (i) => isSameEmp(i.employeeId) && i.date === todayStr && i.type === 'retard'
      );
      const declaredEarlyDept = attendanceIncidents.find(
        (i) => isSameEmp(i.employeeId) && i.date === todayStr && (i.type === 'depart_anticipe' || i.type === 'sortie_prematuree')
      );

      const existingToday = presences.find(
        (p) => isSameEmp(p.employeeId) && p.date === todayStr
      );

      // Détermination résiliente de l'action de pointage (ne jamais laisser null)
      const action: 'arrival' | 'pauseStart' | 'pauseEnd' | 'departure' | 'sortieProStart' | 'sortieProEnd' =
        pendingClockAction ||
        (!existingToday?.arrivalTime
          ? 'arrival'
          : !existingToday?.departureTime
          ? 'departure'
          : 'arrival');

      let status: PresenceStatus = 'present';
      let isLateArrival = false;
      let targetIncident: AttendanceIncident | null = null;

      if (action === 'arrival') {
        isLateArrival = isLate(timeStr, lateThreshold);
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
              (i) => isSameEmp(i.employeeId) && i.date === todayStr && i.type === 'retard'
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
        const isEarlyDeparture = timeStr < plannedDeparture;
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
              (i) => isSameEmp(i.employeeId) && i.date === todayStr && (i.type === 'sortie_prematuree' || i.type === 'depart_anticipe')
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

      const updatedPresences = [...presences];
      const existingIdx = updatedPresences.findIndex(
        (p) => p.employeeId === employeeProfile.id && p.date === todayStr
      );

      let targetPresence: Presence;
      if (existingIdx >= 0) {
        const existing = { ...updatedPresences[existingIdx] };
        existing.employeeId = employeeProfile.id;
        existing.employeeName = employeeProfile.name || existing.employeeName;
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
        targetPresence = existing;
        updatedPresences[existingIdx] = existing;
      } else {
        targetPresence = {
          id: `pr-${Date.now()}`,
          employeeId: employeeProfile.id,
          employeeName: employeeProfile.name,
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
        };
        updatedPresences.push(targetPresence);
      }

      let targetNotification: NotificationLog | null = null;
      if (onAddNotification) {
        const actionLabels: Record<string, string> = {
          arrival: 'Arrivée',
          pauseStart: 'Début de pause',
          pauseEnd: 'Fin de pause',
          departure: 'Départ',
          sortieProStart: 'Mission pro (Départ)',
          sortieProEnd: 'Mission pro (Retour)',
        };
        const actionLabel = actionLabels[action] || 'Pointage';
        let notifTitle = `Pointage enregistré : ${actionLabel}`;
        let notifContent = `Votre pointage (${actionLabel}) a été validé à ${timeStr} sur le site ${locationName}.`;
        let notifPayload: any = {
          source: 'pointage',
          employeeId: employeeProfile.id,
          employeeName: employeeProfile.name,
          action,
          time: timeStr,
          date: todayStr,
        };
        if (isLateArrival && action === 'arrival') {
          notifTitle = 'Pointage validé : Arrivée (Retard constaté)';
          notifContent = `Votre arrivée a été validée à ${timeStr} sur le site ${locationName}. Un incident de retard (après ${lateThreshold}) a été consigné automatiquement.`;
          notifPayload.incidentType = 'retard';
        } else if (action === 'departure' && timeStr < plannedDeparture) {
          notifTitle = 'Pointage validé : Départ (Sortie prématurée)';
          notifContent = `Départ badgé à ${timeStr} sur le site ${locationName} avant ${plannedDeparture}. Un incident de sortie anticipée a été consigné automatiquement.`;
          notifPayload.incidentType = 'sortie_prematuree';
        }
        targetNotification = {
          id: `notif-clock-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          type: 'system',
          recipient: employeeProfile.name || employeeProfile.email || employeeProfile.id,
          targetUserId: employeeProfile.userId ? String(employeeProfile.userId) : employeeProfile.id,
          title: notifTitle,
          content: notifContent,
          message: notifContent,
          payload: JSON.stringify(notifPayload),
          timestamp: new Date().toISOString(),
          read: false,
        };
      }

      // TRANSACTION ATOMIQUE : Sauvegarde unifiée présence, incident et notification
      const atomicResult = await savePresenceAtomic(targetPresence, targetIncident, targetNotification);
      if (!atomicResult.success) {
        throw new Error(atomicResult.error || 'Erreur lors de la transaction atomique de pointage.');
      }

      onUpdatePresences(updatedPresences);
      if (targetIncident && onAddAttendanceIncident) {
        onAddAttendanceIncident(targetIncident);
      }
      if (targetNotification && onAddNotification) {
        onAddNotification(targetNotification);
        if (typeof window !== undefined) {
          window.dispatchEvent(new CustomEvent('citrine:new_unread_alert'));
        }
      }

      // Diffusion temps réel immédiate multi-appareils (Responsable, Admin, etc.)
      realtimeSyncService.broadcastPresencePunch({
        presence: targetPresence,
        incident: targetIncident,
        notification: targetNotification,
      });

      try {
        pushNotificationBridgeService.sendPush({
          title: `Pointage de ${employeeProfile.name}`,
          message: `${employeeProfile.name} a effectué un pointage (${action}) à ${timeStr} sur le site ${locationName}.`,
          senderName: employeeProfile.name,
          type: 'attendance',
          link: 'presences',
        });
      } catch (e) {
        console.warn('Failed to send push notification:', e);
      }

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

      onSuccess();
    } catch (err: any) {
      console.error('Erreur validation pointage:', err);
      showToast('Erreur', err?.message || 'Impossible de valider le pointage.', 'warning');
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

    const empIdStr = String(employeeProfile.id || '');
    const empUidStr = employeeProfile.uid ? String(employeeProfile.uid) : '';
    const empDbIdStr = employeeProfile._dbId ? String(employeeProfile._dbId) : '';

    const isSameEmp = (iEmpId: any) => {
      const str = String(iEmpId || '');
      return str === empIdStr || (empUidStr && str === empUidStr) || (empDbIdStr && str === empDbIdStr);
    };

    // Anti-doublon : vérifier si ce signalement identique a déjà été consigné aujourd'hui
    const isDuplicate = attendanceIncidents.some(
      (i) =>
        isSameEmp(i.employeeId) &&
        i.date === todayStr &&
        i.type === emergencyType &&
        (i.reason || '').trim().toLowerCase() === emergencyReason.trim().toLowerCase()
    );

    if (isDuplicate) {
      onSuccess();
      showToast('Signalement Existant', 'Cette déclaration est déjà enregistrée dans votre dossier.', 'info');
      return;
    }

    // 1. Créer et sauvegarder l'AttendanceIncident officiel
    const newIncident: AttendanceIncident = {
      id: `inc-${Date.now()}`,
      employeeId: empIdStr,
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

    if (onAddAttendanceIncident) {
      await onAddAttendanceIncident(newIncident);
    } else {
      await incidentService.saveIncident(newIncident);
    }

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
