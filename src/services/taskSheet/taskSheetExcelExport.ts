import { DailyTaskSheetData } from './taskSheetTypes';
import { DEFAULT_COMPANY_INFO } from '../pdf/pdfCompanyInfo';

export function exportDailyTaskSheetToExcel(data: DailyTaskSheetData) {
  const safeName = data.employee.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const safeDate = data.date.replace(/[^a-z0-9_-]/g, '_');
  const fileName = `tasksheet_${safeName}_${safeDate}.xls`;

  const excelHtml = `
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
        .prio-p2, .prio-p3 { color: #2563eb; font-weight: bold; text-align: center; }
        .status-fait { background-color: #d1fae5; color: #065f46; font-weight: bold; text-align: center; border: 1px solid #a7f3d0; }
        .status-encours { background-color: #fef3c7; color: #92400e; font-weight: bold; text-align: center; border: 1px solid #fde68a; }
        .status-afaire { background-color: #f1f5f9; color: #475569; font-weight: bold; text-align: center; }
        .summary-row { background-color: #0e3d2f; color: #ffffff; font-weight: bold; }
        .tampon-row { background-color: #fef9c3; color: #854d0e; font-weight: bold; }
      </style>
    </head>
    <body>
      <table border="0" style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
        <tr>
          <td colspan="4" class="company-header" style="border: none; padding-bottom: 2px;">${DEFAULT_COMPANY_INFO.name}</td>
          <td colspan="2" style="border: none; text-align: right; font-size: 9pt; font-weight: bold; color: #104c38;">RÉPUBLIQUE DU CAMEROUN · DOCUMENT OFFICIEL</td>
        </tr>
        <tr><td colspan="6" style="border: none; font-size: 9pt; color: #64748b; padding-top: 0;">${DEFAULT_COMPANY_INFO.subTitle} — ${DEFAULT_COMPANY_INFO.baseline}</td></tr>
        <tr><td colspan="6" class="subtitle" style="border-top: none; border-left: none; border-right: none; margin-bottom: 8px;">FEUILLE DE TÂCHES JOURNALIÈRE (${data.department.toUpperCase()})</td></tr>
        <tr><td colspan="6" style="height: 6px; border: none;"></td></tr>
        <tr>
          <td style="border: none; width: 140px;"><strong>Date :</strong> ${data.date}</td>
          <td style="border: none; width: 120px;" class="blue-text">${data.location}</td>
          <td style="border: none; width: 80px;"><strong>Jour :</strong> ${data.dayName}</td>
          <td style="border: none;" colspan="2"></td>
          <td style="border: none; text-align: right;" class="blue-text">${data.date}</td>
        </tr>
        <tr><td colspan="6" style="height: 6px; border: none;"></td></tr>
      </table>

      <table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 12px; border: 1.5px solid ${data.presenceIncidents && data.presenceIncidents.length > 0 ? '#ea580c' : '#86efac'};">
        <tr>
          <td colspan="6" style="background-color: ${data.presenceIncidents && data.presenceIncidents.length > 0 ? '#c2410c' : '#15803d'}; color: #ffffff; font-weight: bold; font-size: 10.5pt; padding: 6px 10px;">
            ${data.presenceIncidents && data.presenceIncidents.length > 0 ? '⚠️ SIGNALEMENT DES INCIDENTS DE PRÉSENCE & HORAIRES' : '✅ PONCTUALITÉ & HORAIRES DE PRÉSENCE'} (${data.presenceIncidents ? data.presenceIncidents.length : 0})
          </td>
        </tr>
        ${data.presenceIncidents && data.presenceIncidents.length > 0 ? `
          <tr style="background-color: #fdba74; color: #7c2d12; font-weight: bold;">
            <td style="width: 15%; padding: 5px;">Heure</td>
            <td style="width: 25%; padding: 5px;">Type</td>
            <td colspan="3" style="padding: 5px;">Détails & Motif constaté</td>
            <td style="width: 15%; text-align: center; padding: 5px;">Statut</td>
          </tr>
          ${data.presenceIncidents.map((inc) => `
            <tr style="background-color: #fff7ed; color: #7c2d12;">
              <td style="font-weight: bold; font-family: monospace;">${inc.time || 'Pointage'}</td>
              <td style="font-weight: bold; color: #c2410c;">${inc.label}</td>
              <td colspan="3">${inc.description}</td>
              <td style="text-align: center; font-weight: bold; ${inc.isJustified ? 'color: #065f46;' : 'color: #991b1b;'}">
                ${inc.isJustified ? '✓ Justifié' : '⚠️ Non régularisé'}
              </td>
            </tr>
          `).join('')}
        ` : `
          <tr style="background-color: #f0fdf4;">
            <td colspan="6" style="color: #166534; font-weight: bold; padding: 7px 10px;">
              ✓ Aucun incident de présence : ponctualité respectée (dès 08h00), pause 12h–13h conforme, aucune sortie irrégulière.
            </td>
          </tr>
        `}
      </table>

      <table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <tr><td colspan="6" class="section-header">🎯 LES 3 PRIORITÉS DU JOUR — si je ne fais que ça, la journée est réussie</td></tr>
        ${data.topPriorities.map((item, idx) => `
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
        ${data.tasks.map((t) => {
          const prioClass = t.priorityLabel === 'P1' ? 'prio-p1' : 'prio-p2';
          const statusClass = t.status === 'Fait' ? 'status-fait' : (t.status === 'En cours' ? 'status-encours' : 'status-afaire');
          return `
            <tr>
              <td class="blue-text">${t.title}</td>
              <td class="blue-text">${t.parentTaskTitle || t.domain}</td>
              <td class="${prioClass}">${t.priorityLabel}</td>
              <td style="text-align: right;">${t.estimatedMinutes}</td>
              <td style="text-align: center;">${t.dueDate}</td>
              <td class="${statusClass}">${t.status}</td>
            </tr>
          `;
        }).join('')}
        <tr class="summary-row">
          <td colspan="2" style="border: 1px solid #0e3d2f; padding: 6px 10px;">Total / réalisées / taux</td>
          <td style="border: 1px solid #0e3d2f; text-align: center;">${data.totalTasks}</td>
          <td style="border: 1px solid #0e3d2f; text-align: center;">${data.completedTasks}</td>
          <td style="border: 1px solid #0e3d2f; text-align: center;">${data.ratePercentage}%</td>
          <td style="border: 1px solid #0e3d2f; text-align: center;">${data.postponedCount} report.</td>
        </tr>
      </table>

      <table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <tr><td colspan="6" style="background-color: #92400e; color: #ffffff; font-weight: bold; font-size: 11pt; padding: 6px 10px; border: 1px solid #78350f;">📌 POINTS IMPORTANTS (ALERTES, RAPPELS &amp; PETITS MOUVEMENTS) — HORS TÂCHES (${(data.importantPoints || []).length})</td></tr>
        <tr>
          <td class="col-header" style="width: 12%; background-color: #b45309;">Heure</td>
          <td class="col-header" style="width: 18%; background-color: #b45309;">Catégorie</td>
          <td class="col-header" colspan="2" style="background-color: #b45309;">Sujet &amp; Détails</td>
          <td class="col-header" style="width: 12%; text-align: center; background-color: #b45309;">Durée</td>
          <td class="col-header" style="width: 14%; text-align: center; background-color: #b45309;">Statut</td>
        </tr>
        ${(data.importantPoints && data.importantPoints.length > 0) ? data.importantPoints.map((pt) => `
          <tr>
            <td style="font-weight: bold; font-family: monospace;">${pt.time}</td>
            <td style="font-weight: bold; color: #92400e;">${pt.categoryLabel}</td>
            <td colspan="2"><strong>${pt.title}</strong>${pt.detail ? ` — ${pt.detail}` : ''}</td>
            <td style="text-align: right;">${pt.durationMinutes} min</td>
            <td style="text-align: center; font-weight: bold;">${pt.statusLabel}</td>
          </tr>
        `).join('') : `<tr><td colspan="6" style="text-align: center; color: #64748b; font-style: italic; padding: 8px;">Aucun point important relevé ce jour.</td></tr>`}
      </table>

      <table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <tr><td colspan="6" class="section-header">🕒 PLAN HORAIRE (08:00 – 17:00) — Pause déjeuner officielle 12h00 – 13h00</td></tr>
        <tr><td class="col-header" style="width: 25%;">Heure</td><td class="col-header" colspan="5">Ce que je fais sur ce créneau</td></tr>
        ${data.scheduleSlots.map((s) => {
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
        ${data.unforeseenEvents.length > 0 ? data.unforeseenEvents.map((u) => `
          <tr><td>${u.time}</td><td colspan="4" class="blue-text">${u.subject}</td><td style="text-align: right;">${u.lostMinutes} min</td></tr>
        `).join('') : `<tr><td colspan="6" style="text-align: center; color: #64748b; font-style: italic; padding: 8px;">Aucun imprévu signalé aujourd'hui.</td></tr>`}
      </table>

      <table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <tr><td colspan="6" class="section-header">☑️ BILAN FIN DE JOURNÉE (2 min)</td></tr>
        <tr>
          <td style="width: 28%; font-weight: bold; vertical-align: top; background-color: #f8fafc;">À reporter à demain :</td>
          <td colspan="5" class="blue-text" style="vertical-align: top;">${data.postponedTasks.length > 0 ? data.postponedTasks.map((t) => `<div>${t}</div>`).join('') : 'Toutes les tâches du jour ont été clôturées !'}</td>
        </tr>
        <tr>
          <td style="width: 28%; font-weight: bold; background-color: #f8fafc;">Point à signaler au manager :</td>
          <td colspan="5" class="blue-text">${data.managerAlertPoint || 'Aucun point bloquant majeur à signaler.'}</td>
        </tr>
      </table>

      <table border="0" style="width: 100%; border-collapse: collapse; border-top: 2px solid #D4A82F; margin-top: 10px;">
        <tr>
          <td colspan="6" style="border: none; text-align: center; font-size: 9pt; color: #475569; padding-top: 8px;">
            <strong>${DEFAULT_COMPANY_INFO.name}</strong> · ${DEFAULT_COMPANY_INFO.address} (${DEFAULT_COMPANY_INFO.city}, ${DEFAULT_COMPANY_INFO.country}) · Tél. ${DEFAULT_COMPANY_INFO.phone} · ${DEFAULT_COMPANY_INFO.email}<br/>
            SARL au capital de ${DEFAULT_COMPANY_INFO.capital} — NUI : ${DEFAULT_COMPANY_INFO.nui} — RCCM : ${DEFAULT_COMPANY_INFO.rccm}
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
