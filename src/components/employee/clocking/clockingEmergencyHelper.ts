import {
  AttendanceIncident,
  EmergencyDeclaration,
  EmergencyType,
  Employee,
  Presence,
} from '../../../types';
import { incidentService } from '../../../services/incidentService';
import { isSameClockEmployee } from './clockingValidationHelpers';
import { executeOperationWithLoading } from '../../../utils/sweetAlert';

export interface ConfirmEmergencyParams {
  emergencyType: EmergencyType;
  emergencyReason: string;
  onSuccess: () => void;
  employeeProfile: Employee;
  presences: Presence[];
  todayStr: string;
  attendanceIncidents: AttendanceIncident[];
  onAddAttendanceIncident?: (incident: AttendanceIncident) => Promise<void> | void;
  onUpdatePresences: (updated: Presence[]) => Promise<void> | void;
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

  const requiresHrApproval =
    emergencyType !== 'sortie_professionnelle' && emergencyType !== 'retour_sortie_professionnelle';

  onSuccess();

  await executeOperationWithLoading({
    loadingTitle: 'Enregistrement de la déclaration...',
    loadingText: 'Synchronisation de votre signalement avec les RH, veuillez patienter...',
    action: async () => {
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
        status: requiresHrApproval ? 'pending' : 'approved',
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

      await onUpdatePresences(updatedPresences);
      return { status: requiresHrApproval ? 'pending' : 'ok' };
    },
    pendingTitle: 'Déclaration en attente de validation',
    pendingMessage:
      'Votre signalement a bien été enregistré et transmis aux RH pour examen et validation.',
    successTitle:
      emergencyType === 'sortie_professionnelle'
        ? 'Sortie Pro enregistrée !'
        : 'Retour Pro enregistré !',
    successMessage:
      emergencyType === 'sortie_professionnelle'
        ? `Départ en mission extérieure enregistré à ${timeString}.`
        : `Retour de mission professionnelle enregistré à ${timeString}.`,
    errorMessage: "Impossible d'enregistrer votre déclaration.",
  });
}
