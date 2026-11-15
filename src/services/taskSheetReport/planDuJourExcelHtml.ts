import { TaskSheetReportData } from './taskSheetReportTypes';
import { preparePlanDuJourData } from './preparePlanDuJourData';

export function buildPlanDuJourExcelHtml(data: TaskSheetReportData): string {
  const p = preparePlanDuJourData(data);

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Calibri, Arial, sans-serif; background-color: #ffffff; color: #1e293b; padding: 16px; }
        .company-header { font-family: Georgia, serif; font-size: 22pt; font-weight: bold; font-style: italic; color: #104c38; }
        .subtitle { font-family: Georgia, Calibri, sans-serif; font-size: 13pt; font-weight: bold; color: #92400e; border-bottom: 1.5px solid #92400e; padding-bottom: 4px; }
        .section-header { background-color: #0e3d2f; color: #ffffff; font-weight: bold; font-size: 11pt; padding: 6px 10px; border: 1px solid #0e3d2f; }
        .col-header { background-color: #1f514c; color: #ffffff; font-weight: bold; font-size: 10pt; padding: 6px 10px; border: 1px solid #143e3a; }
        td { font-size: 10pt; padding: 5px 8px; border: 1px solid #cbd5e1; }
        .blue-text { color: #1d4ed8; font-weight: bold; }
        .prio-p1 { background-color: #fee2e2; color: #dc2626; font-weight: bold; text-align: center; }
        .prio-p2 { color: #2563eb; font-weight: bold; text-align: center; }
        .status-fait { background-color: #d1fae5; color: #065f46; font-weight: bold; text-align: center; border: 1px solid #a7f3d0; }
        .status-encours { background-color: #fef3c7; color: #92400e; font-weight: bold; text-align: center; border: 1px solid #fde68a; }
        .status-afaire { background-color: #f1f5f9; color: #475569; font-weight: bold; text-align: center; }
        .summary-row { background-color: #0e3d2f; color: #ffffff; font-weight: bold; }
        .tampon-row { background-color: #fef9c3; color: #854d0e; font-weight: bold; }
      </style>
    </head>
    <body>
      <table border="0" style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
        <tr><td colspan="6" class="company-header" style="border: none; padding-bottom: 2px;">CITRINE</td></tr>
        <tr><td colspan="6" class="subtitle" style="border-top: none; border-left: none; border-right: none; margin-bottom: 8px;">TASKSHEET — PLAN DU JOUR — ${p.dept}</td></tr>
        <tr><td colspan="6" style="height: 6px; border: none;"></td></tr>
        <tr>
          <td style="border: none; width: 140px;"><strong>Date :</strong> ${p.dateText}</td>
          <td style="border: none; width: 120px;" class="blue-text">${p.locationText}</td>
          <td style="border: none; width: 80px;"><strong>Jour :</strong></td>
          <td style="border: none;" colspan="2"></td>
          <td style="border: none; text-align: right;" class="blue-text">${p.dateText}</td>
        </tr>
        <tr><td colspan="6" style="height: 6px; border: none;"></td></tr>
      </table>

      <table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 12px; background-color: #f8fafc;">
        <tr><td colspan="6" class="section-header">📊 STATISTIQUES &amp; TAUX DE PERFORMANCE DU JOUR</td></tr>
        <tr style="text-align: center; font-weight: bold; background-color: #f1f5f9;">
          <td style="width: 25%; padding: 6px;">Avancement Tâches</td>
          <td style="width: 25%; padding: 6px;">Priorités P1-P3</td>
          <td style="width: 25%; padding: 6px;">Cadence (08h–17h)</td>
          <td colspan="3" style="width: 25%; padding: 6px;">Disponibilité Nette</td>
        </tr>
        <tr style="text-align: center; font-size: 14pt; font-weight: bold;">
          <td style="color: #064e3b; padding: 8px;">${p.ratePercentage}%</td>
          <td style="color: #1d4ed8; padding: 8px;">${p.prioritiesRate}%</td>
          <td style="color: #0f766e; padding: 8px;">${p.hoursRate}%</td>
          <td colspan="3" style="color: ${p.totalLostMinutes > 0 ? '#b45309' : '#059669'}; padding: 8px;">${p.availabilityRate}%</td>
        </tr>
        <tr style="text-align: center; font-size: 8.5pt; color: #64748b; background-color: #ffffff;">
          <td style="padding: 4px;">${p.completedTasks}/${p.totalTasks} sous-tâche(s) faites</td>
          <td style="padding: 4px;">${p.prioritiesCompleted}/${p.prioritiesTotal} finalisées</td>
          <td style="padding: 4px;">${p.hoursWorkedNumber}h / 8h contractuelles</td>
          <td colspan="3" style="padding: 4px;">${p.totalLostMinutes > 0 ? `${p.totalLostMinutes} min imprévus` : 'Zéro blocage'}</td>
        </tr>
      </table>

      <table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <tr><td colspan="6" class="section-header">🎯 LES 3 PRIORITÉS DU JOUR — si je ne fais que ça, la journée est réussie</td></tr>
        ${p.topPriorities.map((item, idx) => `
          <tr>
            <td style="width: 35px; text-align: center; font-weight: bold; color: #b45309;">${idx + 1}.</td>
            <td colspan="5" class="blue-text" style="text-decoration: underline;">${item.title}</td>
          </tr>
        `).join('')}
      </table>

      <table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <tr><td colspan="6" class="section-header">📋 TÂCHES DU JOUR</td></tr>
        <tr>
          <td class="col-header" style="width: 34%;">Tâche</td>
          <td class="col-header" style="width: 16%;">Domaine</td>
          <td class="col-header" style="width: 10%; text-align: center;">Prio</td>
          <td class="col-header" style="width: 14%; text-align: center;">Estimé (min)</td>
          <td class="col-header" style="width: 12%; text-align: center;">Échéance</td>
          <td class="col-header" style="width: 14%; text-align: center;">Statut</td>
        </tr>
        ${p.tasks.map((t) => {
          const prioClass = t.priorityLabel === 'P1' ? 'prio-p1' : 'prio-p2';
          const statusClass = t.status === 'Fait' ? 'status-fait' : (t.status === 'En cours' ? 'status-encours' : 'status-afaire');
          return `
            <tr>
              <td class="blue-text">${t.title}</td>
              <td class="blue-text">${t.domain}</td>
              <td class="${prioClass}">${t.priorityLabel}</td>
              <td style="text-align: right;">${t.estimatedMinutes}</td>
              <td style="text-align: center;">${t.dueDate}</td>
              <td class="${statusClass}">${t.status}</td>
            </tr>
          `;
        }).join('')}
        <tr class="summary-row">
          <td colspan="2" style="border: 1px solid #0e3d2f; padding: 6px 10px;">Total / réalisées / taux</td>
          <td style="border: 1px solid #0e3d2f; text-align: center;">${p.totalTasks}</td>
          <td style="border: 1px solid #0e3d2f; text-align: center;">${p.completedTasks}</td>
          <td style="border: 1px solid #0e3d2f; text-align: center;">${p.ratePercentage}%</td>
          <td style="border: 1px solid #0e3d2f; text-align: center;">${p.postponedCount} report.</td>
        </tr>
      </table>

      <table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <tr><td colspan="6" class="section-header">🕐 PLAN HORAIRE (08:00 – 17:00) — Pause déjeuner officielle 12h00 – 13h00</td></tr>
        <tr><td class="col-header" style="width: 25%;">Heure</td><td class="col-header" colspan="5">Ce que je fais sur ce créneau</td></tr>
        ${p.scheduleSlots.map((s) => {
          const isLunchBreak = s.isBreak || (s.timeRange.startsWith('12:00') && s.timeRange.includes('13:00'));
          const isIdleDay = s.activity.toLowerCase().includes("n'a rien fait");
          return `
            <tr class="${isLunchBreak ? 'tampon-row' : ''}">
              <td style="font-weight: bold;">${s.timeRange}</td>
              <td colspan="5" class="${isLunchBreak || isIdleDay ? '' : 'blue-text'}" style="${isIdleDay ? 'color: #64748b; font-style: italic; font-weight: bold;' : ''}">${isLunchBreak ? '🍽️ Pause Déjeuner Officielle (12h00 – 13h00)' : s.activity}</td>
            </tr>
          `;
        }).join('')}
      </table>

      <table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <tr><td colspan="6" class="section-header">⚡ IMPRÉVUS SURVENUS AUJOURD'HUI</td></tr>
        <tr><td class="col-header" style="width: 20%;">Heure</td><td class="col-header" colspan="4">Quoi ? (qui / quel sujet)</td><td class="col-header" style="width: 20%; text-align: center;">Temps perdu (min)</td></tr>
        ${p.unforeseenEvents.length > 0 ? p.unforeseenEvents.map((u) => `
          <tr><td>${u.time}</td><td colspan="4" class="blue-text">${u.subject}</td><td style="text-align: right;">${u.lostMinutes} min</td></tr>
        `).join('') : `<tr><td colspan="6" style="text-align: center; color: #64748b; font-style: italic; padding: 8px;">Aucun imprévu signalé aujourd'hui.</td></tr>`}
      </table>

      <table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <tr><td colspan="6" class="section-header">☑️ BILAN FIN DE JOURNÉE (2 min)</td></tr>
        <tr>
          <td style="width: 28%; font-weight: bold; vertical-align: top; background-color: #f8fafc;">À reporter à demain :</td>
          <td colspan="5" class="blue-text" style="vertical-align: top;">${p.postponedTasks.length > 0 ? p.postponedTasks.map((t) => `<div>${t}</div>`).join('') : 'Toutes les tâches du jour ont été clôturées !'}</td>
        </tr>
        <tr>
          <td style="width: 28%; font-weight: bold; background-color: #f8fafc;">Point à signaler au manager :</td>
          <td colspan="5" class="blue-text">${p.managerAlertPoint}</td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
