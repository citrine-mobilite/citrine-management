import { Employee, Presence } from '../../../types';

export function executeConfirmCustomClock(params: {
  customClockHour: string;
  customClockMinute: string;
  customClockReason: string;
  setCustomClockError: (err: string | null) => void;
  onSuccess: () => void;
  employeeProfile: Employee;
  presences: Presence[];
  todayStr: string;
  onUpdatePresences: (updated: Presence[]) => void;
  showToast: (title: string, desc: string, type?: 'success' | 'warning' | 'info') => void;
}): void {
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
    showToast,
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
}
