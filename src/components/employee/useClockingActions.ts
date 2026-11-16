import { useState } from 'react';
import {
  Employee,
  Presence,
  ClockingMethod,
  CompanyModuleConfig,
  AttendanceIncident,
  EmergencyType,
  NotificationLog,
} from '../../types';
import { savePresenceAtomic } from '../../services/dataService';
import { pushNotificationBridgeService } from '../../services/pushNotificationBridgeService';
import { realtimeSyncService } from '../../services/realtimeSyncService';
import { executeOperationWithLoading } from '../../utils/sweetAlert';
import {
  ClockActionType,
  isSameClockEmployee,
  validateDoorQrMethod,
  resolveClockingGpsAndZone,
  buildAttendanceIncidentForAction,
} from './clocking/clockingValidationHelpers';
import { buildClockingNotification } from './clocking/clockingNotificationHelper';
import { upsertPresenceForClocking } from './clocking/clockingPresenceRecordHelper';
import { executeConfirmCustomClock } from './clocking/clockingCustomTimeHelper';
import { executeConfirmEmergency } from './clocking/clockingEmergencyHelper';

interface UseClockingActionsProps {
  employeeProfile: Employee;
  presences: Presence[];
  todayStr: string;
  onUpdatePresences: (updated: Presence[]) => Promise<void> | void;
  showToast: (title: string, desc: string, type?: 'success' | 'warning' | 'info') => void;
  moduleConfig?: CompanyModuleConfig;
  attendanceIncidents?: AttendanceIncident[];
  onAddAttendanceIncident?: (incident: AttendanceIncident) => void;
  onAddNotification?: (log: NotificationLog) => void;
}

const CLOCK_ACTION_LABELS: Record<ClockActionType, string> = {
  arrival: "Arrivée",
  pauseStart: "Début de pause",
  pauseEnd: "Reprise de pause",
  departure: "Départ",
  sortieProStart: "Sortie professionnelle",
  sortieProEnd: "Retour de mission",
};

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
    pendingClockAction: ClockActionType | null,
    method: ClockingMethod,
    onSuccess: () => void,
    customLocation?: { latitude?: number; longitude?: number; locationName?: string; qrCodeToken?: string }
  ): Promise<boolean> => {
    if (method === 'qr_code_door') {
      const doorOk = await validateDoorQrMethod(moduleConfig, customLocation, showToast);
      if (!doorOk) return false;
    }

    setIsLocating(true);
    let actionLabel = 'Pointage';
    let recordedTimeStr = '';
    let lateRecorded = false;

    const opRes = await executeOperationWithLoading({
      loadingTitle: 'Enregistrement du pointage...',
      loadingText: 'Veuillez patienter pendant la géolocalisation et la sauvegarde...',
      action: async () => {
        const gps = await resolveClockingGpsAndZone(customLocation, showToast);
        if (!gps) {
          throw new Error('Signal GPS requis pour enregistrer votre pointage.');
        }

        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        recordedTimeStr = timeStr;
        const lateThreshold = moduleConfig?.lateThresholdTime || '08:30';
        const plannedDeparture = moduleConfig?.plannedDepartureTime || '16:30';

        const existingToday = presences.find(
          (p) => isSameClockEmployee(p.employeeId, employeeProfile) && p.date === todayStr
        );

        const action: ClockActionType =
          pendingClockAction ||
          (!existingToday?.arrivalTime ? 'arrival' : !existingToday?.departureTime ? 'departure' : 'arrival');
        actionLabel = CLOCK_ACTION_LABELS[action] || 'Pointage';

        const { status, isLateArrival, targetIncident } = buildAttendanceIncidentForAction({
          action,
          timeStr,
          lateThreshold,
          plannedDeparture,
          employeeProfile,
          todayStr,
          attendanceIncidents,
        });
        lateRecorded = isLateArrival;

        const { updatedPresences, targetPresence } = upsertPresenceForClocking({
          presences,
          employeeProfile,
          todayStr,
          action,
          status,
          timeStr,
          locationName: gps.locationName,
          latitude: gps.latitude,
          longitude: gps.longitude,
          method,
          customLocation,
          moduleConfig,
        });

        const targetNotification = onAddNotification
          ? buildClockingNotification({
              action,
              timeStr,
              todayStr,
              locationName: gps.locationName,
              employeeProfile,
              isLateArrival,
              lateThreshold,
              plannedDeparture,
            })
          : null;

        const atomicResult = await savePresenceAtomic(
          targetPresence,
          targetIncident,
          targetNotification,
          action
        );
        if (!atomicResult.success) {
          throw new Error(atomicResult.error || 'Erreur lors de la transaction atomique de pointage.');
        }

        const clockOpKey = `clock:${targetPresence.id}:${action}:${timeStr}`;
        pushNotificationBridgeService.markOperationDispatched(clockOpKey);

        await onUpdatePresences(updatedPresences);
        if (targetIncident && onAddAttendanceIncident) {
          onAddAttendanceIncident(targetIncident);
        }
        if (targetNotification && onAddNotification) {
          const notifWithKey: NotificationLog = {
            ...targetNotification,
            payload: JSON.stringify({
              source: 'clocking',
              operationKey: clockOpKey,
              presenceId: targetPresence.id,
              employeeId: employeeProfile.id,
              action,
              time: timeStr,
              date: todayStr,
            }),
          };
          onAddNotification(notifWithKey);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('citrine:new_unread_alert'));
          }
        }

        realtimeSyncService.broadcastPresencePunch({
          presence: targetPresence,
          incident: targetIncident,
          notification: targetNotification,
        });

        onSuccess();
      },
      successTitle: `${actionLabel} enregistré !`,
      successMessage: lateRecorded
        ? `Pointage validé à ${recordedTimeStr} (retard consigné au registre).`
        : `Votre pointage (${actionLabel}) a été validé à ${recordedTimeStr}.`,
      errorMessage: 'Impossible de valider le pointage.',
    });

    setIsLocating(false);
    return opRes.success;
  };

  const handleConfirmCustomClock = (
    customClockHour: string,
    customClockMinute: string,
    customClockReason: string,
    setCustomClockError: (err: string | null) => void,
    onSuccess: () => void
  ) =>
    executeConfirmCustomClock({
      customClockHour,
      customClockMinute,
      customClockReason,
      setCustomClockError,
      onSuccess,
      employeeProfile,
      presences,
      todayStr,
      onUpdatePresences,
      showToast,
    });

  const handleConfirmEmergency = (
    emergencyType: EmergencyType,
    emergencyReason: string,
    onSuccess: () => void
  ) =>
    executeConfirmEmergency({
      emergencyType,
      emergencyReason,
      onSuccess,
      employeeProfile,
      presences,
      todayStr,
      attendanceIncidents,
      onAddAttendanceIncident,
      onUpdatePresences,
      showToast,
    });

  return {
    isLocating,
    handleConfirmClocking,
    handleConfirmCustomClock,
    handleConfirmEmergency,
  };
}
