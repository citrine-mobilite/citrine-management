import { isArrivalAfterThreshold } from '../weeklyAttendanceReportService';

export function buildEmployeeDailyAttendanceSummary(params: {
  empId: any;
  presences: any[];
  incidents: any[];
  dayIso: string;
  lateThreshold: string;
}) {
  const { empId, presences, incidents, dayIso, lateThreshold } = params;

  const userPres = presences.find((p: any) => {
    const matchEmp = String(p.employeeId || p.employee_id || '') === String(empId);
    const pDate = String(p.date || '').split('T')[0];
    return matchEmp && pDate === dayIso;
  });

  const userIncs = incidents.filter((inc: any) => {
    const matchEmp = String(inc.employeeId || inc.employee_id || '') === String(empId);
    const incDate = String(inc.date || '').split('T')[0];
    return matchEmp && incDate === dayIso;
  });

  const presenceIncidents: any[] = [];
  userIncs.forEach((inc: any) => {
    let label = 'Incident de présence';
    if (inc.type === 'retard') label = "Retard à l'arrivée";
    else if (inc.type === 'sortie_professionnelle' || inc.type === 'sortie_prematuree') label = 'Sortie en cours de journée';
    else if (inc.type === 'depart_anticipe') label = 'Départ anticipé';
    else if (inc.type === 'permission') label = "Permission d'absence";
    else if (inc.type === 'pause_anticipee' || inc.type === 'rallonge_pause') label = 'Anomalie pause';
    else if (inc.type === 'absence_injustifiee') label = 'Absence non justifiée';

    presenceIncidents.push({
      time: inc.timeString || 'Pointage',
      type: inc.type || 'autre',
      label,
      description: inc.reason || inc.description || 'Anomalie signalée',
      isJustified: inc.isJustified || inc.status === 'justifie',
    });
  });

  let dailyAttendance: any;
  if (userPres) {
    const isLate = userPres.status === 'late' || isArrivalAfterThreshold(userPres.arrivalTime, lateThreshold);
    const workedH = userPres.hoursWorked ? `${userPres.hoursWorked}h` : undefined;

    if (isLate && !presenceIncidents.some((p) => p.type === 'retard')) {
      presenceIncidents.push({
        time: userPres.arrivalTime || 'Matin',
        type: 'retard',
        label: "Retard à l'arrivée",
        description: `Arrivée constatée à ${userPres.arrivalTime || 'retard'} (au lieu de ${lateThreshold})${
          userPres.correctionReason ? ` — Motif : ${userPres.correctionReason}` : ''
        }`,
        isJustified: Boolean(userPres.correctionReason && userPres.correctionReasonStatus === 'approved'),
      });
    }

    if (userPres.sortieProStart && !presenceIncidents.some((p) => p.type.includes('sortie'))) {
      presenceIncidents.push({
        time: userPres.sortieProStart,
        type: 'sortie',
        label: 'Sortie temporaire',
        description: `Sortie de ${userPres.sortieProStart} à ${userPres.sortieProEnd || 'en cours'}${
          userPres.sortieProReason ? ` — Motif : ${userPres.sortieProReason}` : ''
        }`,
        isJustified: true,
      });
    }

    if (
      userPres.departureTime &&
      userPres.departureTime < '17:00' &&
      userPres.departureReason &&
      !presenceIncidents.some((p) => p.type.includes('depart'))
    ) {
      presenceIncidents.push({
        time: userPres.departureTime,
        type: 'depart_anticipe',
        label: 'Départ anticipé',
        description: `Départ enregistré à ${userPres.departureTime} (avant 17h00) — Motif : ${userPres.departureReason}`,
        isJustified: userPres.departureReasonStatus === 'approved',
      });
    }

    dailyAttendance = {
      statusLabel: isLate ? 'Retard' : userPres.status === 'mission' ? 'En mission' : 'Présent',
      statusType: isLate ? 'late' : userPres.status || 'present',
      arrivalTime: userPres.arrivalTime,
      pauseStart: userPres.pauseStart || '12:00',
      pauseEnd: userPres.pauseEnd || '13:00',
      departureTime: userPres.departureTime || '17:00',
      hoursWorkedText: workedH,
      location: userPres.location || 'Douala',
      incidentNote: userPres.correctionReason || userPres.adminBadgeReason,
      incidents: presenceIncidents,
    };
  } else {
    dailyAttendance = {
      statusLabel: 'Non pointé',
      statusType: 'absent',
      pauseStart: '12:00',
      pauseEnd: '13:00',
      location: 'Douala',
      incidents: presenceIncidents,
    };
  }

  return { dailyAttendance, presenceIncidents };
}
