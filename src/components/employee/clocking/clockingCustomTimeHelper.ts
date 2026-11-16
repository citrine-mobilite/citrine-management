import { Employee, Presence } from '../../../types';
import { executeOperationWithLoading } from '../../../utils/sweetAlert';

export async function executeConfirmCustomClock(params: {
  customClockHour: string;
  customClockMinute: string;
  customClockReason: string;
  setCustomClockError: (err: string | null) => void;
  onSuccess: () => void;
  employeeProfile: Employee;
  presences: Presence[];
  todayStr: string;
  onUpdatePresences: (updated: Presence[]) => Promise<void> | void;
  showToast: (title: string, desc: string, type?: 'success' | 'warning' | 'info') => void;
}): Promise<void> {
  const {
    customClockHour,
    customClockMinute,
    customClockReason,
    setCustomClockError,
    onSuccess,
    employeeProfile,
    presences,
    todayStr,
    onUpdatePresences,
  } = params;

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
    existing.correctionReason = customClockReason.trim();
    existing.correctionReasonStatus = 'pending';
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
      correctionReason: customClockReason.trim(),
      correctionReasonStatus: 'pending',
    });
  }

  onSuccess();
  await executeOperationWithLoading({
    loadingTitle: "Ajustement de l'horaire...",
    loadingText: 'Enregistrement de votre demande d’ajustement, veuillez patienter...',
    action: async () => {
      await onUpdatePresences(updatedPresences);
      return { status: 'pending' as const };
    },
    pendingTitle: 'Demande en attente',
    pendingMessage: `Votre ajustement à ${timeStr} a été enregistré et transmis pour validation RH.`,
    errorMessage: "Impossible d'enregistrer l'ajustement d'horaire.",
  });
}
