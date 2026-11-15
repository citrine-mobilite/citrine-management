import {
  AttendanceIncident,
  EmergencyDeclaration,
  EmergencyType,
  Employee,
  Presence,
} from '../../../types';
import { incidentService } from '../../../services/incidentService';
import { isSameClockEmployee } from './clockingValidationHelpers';

export interface ConfirmEmergencyParams {
  emergencyType: EmergencyType;
  emergencyReason: string;
  onSuccess: () => void;
  employeeProfile: Employee;
  presences: Presence[];
  todayStr: string;
  attendanceIncidents: AttendanceIncident[];
  onAddAttendanceIncident?: (incident: AttendanceIncident) => void;
  onUpdatePresences: (updated: Presence[]) => void;
  showToast: (title: string, desc: string, type?: 'success' | 'warning' | 'info') => void;
}

export async function executeConfirmEmergency({
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
}: ConfirmEmergencyParams): Promise<void> {
  if (!emergencyReason.trim()) return;

  if (emergencyType === 'retour_sortie_professionnelle') {
    const existingPresences = presences.find(
      (p) => p.employeeId === employeeProfile.id && p.date === todayStr
    );
    const hasStartedMission =
      existingPresences?.sortieProStart ||
      existingPresences?.emergencies?.some((e) => e.type === 'sortie_professionnelle');
    const alreadyEndedMission =
      existingPresences?.sortieProEnd ||
      existingPresences?.emergencies?.some((e) => e.type === 'retour_sortie_professionnelle');
    if (!hasStartedMission || alreadyEndedMission) {
      showToast(
        'Action Interdite',
        "Impossible de badger un retour de mission si vous n'avez pas encore pointé une sortie de mission (ou mission déjà clôturée) !",
        'warning'
      );
      return;
    }
  }

  const now = new Date();
  const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const empIdStr = String(employeeProfile.id || '');

  const isDuplicate = attendanceIncidents.some(
    (i) =>
      isSameClockEmployee(i.employeeId, employeeProfile) &&
      i.date === todayStr &&
      i.type === emergencyType &&
      (i.reason || '').trim().toLowerCase() === emergencyReason.trim().toLowerCase()
  );

  if (isDuplicate) {
    onSuccess();
    showToast('Signalement Existant', 'Cette déclaration est déjà enregistrée dans votre dossier.', 'info');
    return;
  }

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
}
