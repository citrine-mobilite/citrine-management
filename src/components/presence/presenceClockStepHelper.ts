import { AttendanceIncident, CompanyModuleConfig, Employee, Presence } from '../../types';
import { realtimeSyncService } from '../../services/realtimeSyncService';
import { incidentService } from '../../services/incidentService';
import { savePresenceAtomic } from '../../services/dataService';

export interface ClockingStepInfo {
  label: string;
  desc: string;
  action: 'arrival' | 'pause_start' | 'pause_end' | 'departure' | 'done';
}

export function isActualBadgePunch(p?: Presence | null): boolean {
  if (!p) return false;
  if (p.status === 'absent') return false;
  const arr = (p.arrivalTime || '').trim();
  const dep = (p.departureTime || '').trim();
  const hasValidTime = (arr !== '' && arr !== '—' && arr !== '--:--') || (dep !== '' && dep !== '—' && dep !== '--:--');
  const hasValidStatus = p.status === 'present' || p.status === 'late';
  return Boolean(hasValidTime && hasValidStatus);
}

export function getNextPresenceStep(
  currentPresence: Presence | undefined,
  moduleConfig?: CompanyModuleConfig
): ClockingStepInfo {
  const isBreakEnabled = moduleConfig?.enableBreakTracking !== false;
  if (!currentPresence) {
    return {
      label: 'Pointer mon Arrivée ☕',
      desc: "Débuter la journée de travail et enregistrer l'arrivée",
      action: 'arrival',
    };
  }
  if (isBreakEnabled && !currentPresence.pauseStart) {
    return {
      label: 'Pointer mon début de Pause 🍲',
      desc: 'Débuter la pause déjeuner réglementaire',
      action: 'pause_start',
    };
  }
  if (isBreakEnabled && !currentPresence.pauseEnd) {
    return {
      label: 'Pointer mon retour de Pause 💻',
      desc: 'Terminer la pause déjeuner et reprendre le travail',
      action: 'pause_end',
    };
  }
  if (!currentPresence.departureTime) {
    return {
      label: 'Pointer mon Départ 🏠',
      desc: 'Terminer la journée de travail et enregistrer le départ',
      action: 'departure',
    };
  }
  return {
    label: 'Journée terminée ! ✅',
    desc: 'Tous les pointages réglementaires ont été enregistrés',
    action: 'done',
  };
}

interface ExecuteClockingStepParams {
  nextStep: ClockingStepInfo;
  activeEmployee: Employee;
  selectedDate: string;
  presences: Presence[];
  attendanceIncidents: AttendanceIncident[];
  moduleConfig?: CompanyModuleConfig;
  onUpdatePresences: (updated: Presence[]) => void;
  onAddAttendanceIncident?: (incident: AttendanceIncident) => void;
  onUpdateAttendanceIncidents?: (incidents: AttendanceIncident[]) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export function executePresenceClockingStep({
  nextStep,
  activeEmployee,
  selectedDate,
  presences,
  attendanceIncidents,
  moduleConfig,
  onUpdatePresences,
  onAddAttendanceIncident,
  onUpdateAttendanceIncidents,
  showToast,
}: ExecuteClockingStepParams): void {
  if (nextStep.action === 'done' || !activeEmployee) return;

  const updatedPresences = [...presences];
  const timeNow = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const lateThreshold = moduleConfig?.lateThresholdTime || '08:30';
  const plannedDeparture = moduleConfig?.plannedDepartureTime || '16:30';

  const persistIncident = (autoIncident: AttendanceIncident) => {
    if (onAddAttendanceIncident) {
      onAddAttendanceIncident(autoIncident);
    } else if (onUpdateAttendanceIncidents) {
      onUpdateAttendanceIncidents([autoIncident, ...attendanceIncidents]);
    } else {
      incidentService.saveIncident(autoIncident);
    }
  };

  if (nextStep.action === 'arrival') {
    const exemptLate = activeEmployee?.allowLateArrival8_930 === true && timeNow >= '08:00' && timeNow <= '09:30';
    const isLateNow = !exemptLate && timeNow > lateThreshold;
    const newPresence: Presence = {
      id: `pres-${Date.now()}`,
      employeeId: activeEmployee.id,
      date: selectedDate,
      arrivalTime: timeNow,
      pauseStart: null,
      pauseEnd: null,
      departureTime: null,
      status: isLateNow ? 'late' : 'present',
      location: 'Bureau Principal - Douala III',
      latitude: 4.0511 + (Math.random() - 0.5) * 0.01,
      longitude: 9.7679 + (Math.random() - 0.5) * 0.01,
      clockingMethod: 'manual_admin',
    };
    updatedPresences.unshift(newPresence);

    if (isLateNow) {
      const empIdStr = String(activeEmployee.id || '');
      const alreadyHasIncident = attendanceIncidents.some(
        (i) => String(i.employeeId) === empIdStr && i.date === selectedDate && i.type === 'retard'
      );
      if (!alreadyHasIncident) {
        persistIncident({
          id: `inc-${Date.now()}`,
          employeeId: empIdStr,
          employeeName: activeEmployee.name,
          date: selectedDate,
          timeString: timeNow,
          type: 'retard',
          origin: 'automatique_pointage',
          reason: `Retard automatique constaté à ${timeNow} (seuil: ${lateThreshold})`,
          isDeclaredInAdvance: false,
          isJustified: false,
          status: 'automatique',
          createdAt: new Date().toISOString(),
        });
      }
    }

    if (showToast) showToast(`Arrivée pointée à ${timeNow} pour ${activeEmployee.name}.`, isLateNow ? 'error' : 'success');
  } else {
    const existingIndex = presences.findIndex((p) => p.employeeId === activeEmployee.id && p.date === selectedDate);
    if (existingIndex >= 0) {
      const updatedObj = { ...updatedPresences[existingIndex] };
      if (nextStep.action === 'pause_start') updatedObj.pauseStart = timeNow;
      if (nextStep.action === 'pause_end') updatedObj.pauseEnd = timeNow;
      if (nextStep.action === 'departure') {
        updatedObj.departureTime = timeNow;
        const exemptEarly = activeEmployee?.allowEarlyDeparture15_17 === true && timeNow >= '15:00' && timeNow <= '17:00';
        if (!exemptEarly && timeNow < plannedDeparture) {
          updatedObj.departureReason = 'Sortie prématurée (avant 16:30)';
          if (!updatedObj.emergencies) updatedObj.emergencies = [];
          updatedObj.emergencies.push({
            id: `emg-${Date.now()}`,
            type: 'sortie_prematuree',
            reason: 'Sortie prématurée automatique (avant 16:30)',
            timestamp: new Date().toISOString(),
            timeString: timeNow,
            status: 'approved',
          });

          const empIdStr = String(activeEmployee.id || '');
          const alreadyHasEarly = attendanceIncidents.some(
            (i) => String(i.employeeId) === empIdStr && i.date === selectedDate && (i.type === 'sortie_prematuree' || i.type === 'depart_anticipe')
          );
          if (!alreadyHasEarly) {
            persistIncident({
              id: `inc-${Date.now()}`,
              employeeId: empIdStr,
              employeeName: activeEmployee.name,
              date: selectedDate,
              timeString: timeNow,
              type: 'sortie_prematuree',
              origin: 'automatique_pointage',
              reason: `Sortie prématurée constatée à ${timeNow} avant 16h30 (référence: ${plannedDeparture})`,
              isDeclaredInAdvance: false,
              isJustified: false,
              status: 'automatique',
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
      updatedPresences[existingIndex] = updatedObj;
      if (showToast) showToast(`Pointage ${nextStep.action} enregistré pour ${activeEmployee.name}.`, 'success');
    }
  }

  onUpdatePresences(updatedPresences);

  const targetedPres = updatedPresences.find((p) => p.employeeId === activeEmployee.id && p.date === selectedDate);
  if (targetedPres) {
    realtimeSyncService.broadcastPresencePunch({ presence: targetedPres });
    savePresenceAtomic(
      { ...targetedPres, employeeName: activeEmployee.name, employeeEmail: activeEmployee.email },
      null,
      null,
      nextStep.action
    ).catch((err) => console.warn('[PresencePanel] savePresenceAtomic notice:', err));
  }
}
