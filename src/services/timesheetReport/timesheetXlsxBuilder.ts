import * as XLSX from 'xlsx';
import { TimesheetReportData } from './timesheetReportTypes';
import { preparePlanDuJourData } from './preparePlanDuJourData';

export function buildTimesheetXlsxWorkbook(data: TimesheetReportData): XLSX.WorkBook {
  const p = preparePlanDuJourData(data);
  const employeeName = data.employeeName || 'Collaborateur';

  const rowsFeuil1: any[][] = [
    ['CITRINE'],
    [`PLAN DU JOUR — ${p.dept}`],
    [],
    ['📊 STATISTIQUES DU JOUR', `Avancement : ${p.ratePercentage}%`, `Priorités P1-P3 : ${p.prioritiesRate}%`, `Cadence (08h–17h) : ${p.hoursRate}%`, `Disponibilité : ${p.availabilityRate}%`],
    [],
    [`Date : ${p.dateText}`, p.locationText || 'Douala', `Jour : ${p.dayText}`, '', '', p.dateText],
    [],
    ['🎯 LES 3 PRIORITÉS DU JOUR — si je ne fais que ça, la journée est réussie'],
    ['1.', p.topPriorities[0]?.title || 'Prise de contact & revue des priorités'],
    ['2.', p.topPriorities[1]?.title || 'Exécution des actions opérationnelles majeures'],
    ['3.', p.topPriorities[2]?.title || 'Finalisation des livrables et synchronisation'],
    ['📋 TÂCHES DU JOUR'],
    ['Tâche', 'Domaine', 'Prio', 'Estimé (min)', 'Échéance', 'Statut'],
    [],
    ...p.tasks.map((t) => [
      t.title,
      t.parentTaskTitle || 'Autre',
      t.priorityLabel || 'P2',
      t.estimatedMinutes,
      t.dueDate || p.dateText,
      t.status,
    ]),
    ['Total / réalisées / taux', '', p.totalTasks, p.completedTasks, `${p.ratePercentage}%`, `${p.postponedCount} report.`],
    [],
    ['🕒 PLAN HORAIRE (08:00 – 17:00) — Pause déjeuner officielle 12h00 – 13h00'],
    ['Heure', 'Ce que je fais sur ce créneau'],
    ...p.scheduleSlots.map((s) => {
      const isLunchBreak = s.isBreak || (s.timeRange.startsWith('12:00') && s.timeRange.includes('13:00'));
      return [
        s.timeRange,
        isLunchBreak ? '🍽️ Pause Déjeuner Officielle (12h00 – 13h00)' : s.activity,
      ];
    }),
    [],
    ['🚨 INCIDENTS & ANOMALIES DE PRÉSENCE DU JOUR (Retards, Sorties...)'],
    ['Heure', 'Type incident', 'Détails & Motif constaté', 'Statut régularisation'],
    ...(p.presenceIncidents.length > 0
      ? p.presenceIncidents.map((inc) => [
          inc.time || 'Pointage',
          inc.label,
          inc.description,
          inc.isJustified ? 'Justifié' : 'Non régularisé',
        ])
      : [['Journée', 'Aucun incident', 'Ponctualité respectée dès 08h00, pause 12h–13h conforme, aucune sortie non justifiée', 'Normal']]),
    [],
    ['⚡ BLOCAGES & IMPRÉVUS OPÉRATIONNELS SIGNALÉS'],
    ['Heure', 'Quoi ? (qui / quel sujet)', 'Temps perdu (min)'],
    ...(p.unforeseenEvents.length > 0
      ? p.unforeseenEvents.map((u) => [u.time, u.subject, `${u.lostMinutes} min`])
      : [['Journée', "Aucun imprévu signalé aujourd'hui.", '0 min']]),
    [],
    ['☑️ BILAN FIN DE JOURNÉE (2 min)'],
    ['À reporter à demain :', p.postponedTasks[0] || (p.postponedTasks.length === 0 ? '✓ Toutes les sous-tâches du jour ont été clôturées !' : '')],
    ...(p.postponedTasks.slice(1).map((t) => ['', t])),
    [],
    ['Point à signaler au manager :', p.managerAlertPoint || 'Aucun blocage particulier à signaler.'],
  ];

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet(rowsFeuil1);
  ws1['!cols'] = [
    { wch: 34 },
    { wch: 38 },
    { wch: 12 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
  ];

  const rowsManager: any[][] = [
    ['CITRINE MOBILITÉ — SUIVI MANAGER & PILOTAGE OPÉRATIONNEL'],
    [`Collaborateur : ${employeeName}`, `Département : ${p.dept}`, `Lieu : Douala`, `Date : ${p.dateText} (${p.dayText})`],
    [],
    ['📊 DIAGNOSTIC DE CHARGE & SURCHARGE (CALCULÉ SUR LES SOUS-TÂCHES)'],
    ['Temps planifié sur les sous-tâches :', `${Math.round(p.plannedMinutes / 60)}h (${p.plannedMinutes} min)`],
    ['Capacité journalière maximale :', '12h max / jour'],
    ["Seuil d'alerte de surcharge :", '> 10h / jour (600 min)'],
    [
      'Statut capacitaire :',
      p.capacityStatus === 'overloaded'
        ? '⚠️ SURCHARGE DÉTECTÉE (> 10h/jour)'
        : (p.capacityStatus === 'optimal' ? '✅ CHARGE NOMINALE & RÉALISTE (7h à 10h)' : '💡 CAPACITÉ DISPONIBLE (< 7h)'),
    ],
    ['Conseil opérationnel :', p.capacityAdvice],
    [],
    ['🚩 POINTS À SIGNALER AU MANAGER & REMONTÉES'],
    ['Synthèse :', p.managerAlertPoint || 'Aucun blocage particulier à signaler.'],
    [],
    [`⚡ BLOCAGES & DIFFICULTÉS SIGNALÉS (${p.unforeseenEvents.length})`],
    ['Heure', 'Sujet du blocage', 'Tâche source', 'Statut', 'Impact'],
    ...(p.unforeseenEvents.length > 0
      ? p.unforeseenEvents.map((u) => [u.time, u.subject, u.sourceTask || 'Général', u.status || 'Bloqué', `${u.lostMinutes} min`])
      : [['Journée', 'Aucun blocage opérationnel actif.', '-', 'Nominal', '0 min']]),
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(rowsManager);
  ws2['!cols'] = [{ wch: 36 }, { wch: 42 }, { wch: 22 }, { wch: 16 }, { wch: 16 }];

  XLSX.utils.book_append_sheet(wb, ws1, 'Feuil1');
  XLSX.utils.book_append_sheet(wb, ws2, 'Suivi manager');

  return wb;
}

export function buildTimesheetExcelBuffer(data: TimesheetReportData): Buffer {
  const wb = buildTimesheetXlsxWorkbook(data);
  return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
}

export function buildTimesheetExcelBase64(data: TimesheetReportData): string {
  const wb = buildTimesheetXlsxWorkbook(data);
  return XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
}
