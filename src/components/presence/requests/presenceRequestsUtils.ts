import { Presence, Employee, EmergencyDeclaration, EmergencyType } from '../../../types';

export type RequestItemType = 'emergency' | 'correction' | 'departure';

export interface RequestItem {
  id: string;
  presenceId: string;
  employeeId: string;
  employee: Employee | null;
  date: string;
  type: RequestItemType;
  subType?: string;
  details: string;
  reason: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  rawEmergency?: EmergencyDeclaration;
}

export function extractPresenceRequests(presences: Presence[], employees: Employee[]): RequestItem[] {
  const items: RequestItem[] = [];

  presences.forEach((p) => {
    const emp = employees.find((e) => e.id === p.employeeId) || null;

    // 1. Emergencies
    if (p.emergencies && p.emergencies.length > 0) {
      p.emergencies.forEach((emg) => {
        items.push({
          id: `${p.id}-emg-${emg.id}`,
          presenceId: p.id,
          employeeId: p.employeeId,
          employee: emp,
          date: p.date,
          type: 'emergency',
          subType: emg.type,
          details: `Heure déclarée: ${emg.timeString}`,
          reason: emg.reason,
          timestamp: emg.timestamp,
          status: emg.status || 'pending',
          rawEmergency: emg,
        });
      });
    }

    // 2. Correction reason
    if (p.correctionReason) {
      items.push({
        id: `${p.id}-corr`,
        presenceId: p.id,
        employeeId: p.employeeId,
        employee: emp,
        date: p.date,
        type: 'correction',
        details: `Arrivée: ${p.arrivalTime || '--:--'}`,
        reason: p.correctionReason,
        timestamp: p.date,
        status: p.correctionReasonStatus || 'pending',
      });
    }

    // 3. Departure reason
    if (p.departureReason) {
      items.push({
        id: `${p.id}-dep`,
        presenceId: p.id,
        employeeId: p.employeeId,
        employee: emp,
        date: p.date,
        type: 'departure',
        details: `Départ: ${p.departureTime || '--:--'}`,
        reason: p.departureReason,
        timestamp: p.date,
        status: p.departureReasonStatus || 'pending',
      });
    }
  });

  return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
