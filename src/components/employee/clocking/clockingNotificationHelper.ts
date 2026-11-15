import { Employee, NotificationLog } from '../../../types';
import { ClockActionType } from './clockingValidationHelpers';

export function buildClockingNotification(params: {
  action: ClockActionType;
  timeStr: string;
  todayStr: string;
  locationName: string;
  employeeProfile: Employee;
  isLateArrival: boolean;
  lateThreshold: string;
  plannedDeparture: string;
}): NotificationLog {
  const {
    action,
    timeStr,
    todayStr,
    locationName,
    employeeProfile,
    isLateArrival,
    lateThreshold,
    plannedDeparture,
  } = params;

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
  const notifPayload: any = {
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

  return {
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
