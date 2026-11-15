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
import {
  ClockActionType,
  isSameClockEmployee,
  validateDoorQrMethod,
  resolveClockingGpsAndZone,
  buildAttendanceIncidentForAction,
} from './clocking/clockingValidationHelpers';
import { buildClockingNotification } from './clocking/clockingNotificationHelper';
import {
  upsertPresenceForClocking,
  showClockingSuccessToast,
} from './clocking/clockingPresenceRecordHelper';
import { executeConfirmCustomClock } from './clocking/clockingCustomTimeHelper';
import { executeConfirmEmergency } from './clocking/clockingEmergencyHelper';

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
    pendingClockAction: ClockActionType | null,
    method: ClockingMethod,
    onSuccess: () => void,
    customLocation?: { latitude?: number; longitude?: number; locationName?: string; qrCodeToken?: string }
  ) => {
    if (method === 'qr_code_door') {
      const doorOk = await validateDoorQrMethod(moduleConfig, customLocation);
      if (!doorOk) return;
    }

    setIsLocating(true);
    try {
      const gps = await resolveClockingGpsAndZone(customLocation, showToast);
      if (!gps) {
        setIsLocating(false);
        return;
      }

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const lateThreshold = moduleConfig?.lateThresholdTime || '08:30';
      const plannedDeparture = moduleConfig?.plannedDepartureTime || '16:30';

      const existingToday = presences.find(
        (p) => isSameClockEmployee(p.employeeId, employeeProfile) && p.date === todayStr
      );

      const action: ClockActionType =
        pendingClockAction ||
        (!existingToday?.arrivalTime ? 'arrival' : !existingToday?.departureTime ? 'departure' : 'arrival');

      const { status, isLateArrival, targetIncident } = buildAttendanceIncidentForAction({
        action,
        timeStr,
        lateThreshold,
        plannedDeparture,
        employeeProfile,
        todayStr,
        attendanceIncidents,
      });

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

      onUpdatePresences(updatedPresences);
      if (targetIncident && onAddAttendanceIncident) {
        onAddAttendanceIncident(targetIncident);
      }
      if (targetNotification && onAddNotification) {
        onAddNotification(targetNotification);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('citrine:new_unread_alert'));
        }
      }

      realtimeSyncService.broadcastPresencePunch({
        presence: targetPresence,
        incident: targetIncident,
        notification: targetNotification,
      });

      try {
        pushNotificationBridgeService.sendPush({
          title: `Pointage de ${employeeProfile.name}`,
          message: `${employeeProfile.name} a effectué un pointage (${action}) à ${timeStr} sur le site ${gps.locationName}.`,
          senderName: employeeProfile.name,
          type: 'attendance',
          link: 'presences',
        });
      } catch (e) {
        console.warn('Failed to send push notification:', e);
      }

      showClockingSuccessToast(action, isLateArrival, timeStr, showToast);
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
