import ExcelJS from 'exceljs';
import { TaskSheetReportData } from './taskSheetReportTypes';
import { preparePlanDuJourData } from './preparePlanDuJourData';
import {
  CITRINE_XLSX_COLORS,
  applyCellBox,
  applyOfficialExcelHeaderFooter,
  applyPriorityStyle,
  applyStatusBadgeStyle,
  styleBannerRow,
  styleColumnHeadersRow,
  styleOfficialFooterRow,
  styleSectionHeaderRow,
} from './taskSheetXlsxStyles';

function toBase64Universal(raw: ArrayBuffer | Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(raw as any).toString('base64');
  }
  const bytes = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export async function buildTaskSheetXlsxWorkbook(data: TaskSheetReportData): Promise<ExcelJS.Workbook> {
  const p = preparePlanDuJourData(data);
  const employeeName = data.employeeName || 'Collaborateur';
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Citrine Mobilité RH';
  wb.created = new Date();

  const ws1 = wb.addWorksheet('TaskSheet', {
    views: [{ showGridLines: true }],
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  ws1.columns = [{ width: 32 }, { width: 34 }, { width: 12 }, { width: 16 }, { width: 16 }, { width: 18 }];

  let r = 1;
  applyOfficialExcelHeaderFooter(ws1);
  styleBannerRow(ws1, r++, 6, 'CITRINE SARL — Société à Responsabilité Limitée · République du Cameroun (Document Officiel)', false);
  styleBannerRow(ws1, r++, 6, `FEUILLE DE TÂCHES JOURNALIÈRE — ${p.dept}`, true);

  const metaRow = ws1.getRow(r++);
  metaRow.height = 20;
  metaRow.values = [`Collaborateur : ${employeeName}`, `Lieu : ${p.locationText || 'Douala'}`, `Jour : ${p.dayText}`, '', `Date : ${p.dateText}`, p.dept];
  for (let c = 1; c <= 6; c++) applyCellBox(metaRow.getCell(c), { bg: CITRINE_XLSX_COLORS.slateHeader, bold: c === 1 || c === 5 });
  r++;

  styleSectionHeaderRow(ws1, r++, 6, 'STATISTIQUES DE PERFORMANCE DU JOUR');
  const kpiLabels = ws1.getRow(r++);
  kpiLabels.height = 18;
  kpiLabels.values = ['Avancement Tâches', 'Priorités P1–P3', 'Cadence (08h–17h)', 'Disponibilité Nette', 'Sous-tâches traitées', 'Charge estimée'];
  for (let c = 1; c <= 6; c++) applyCellBox(kpiLabels.getCell(c), { bg: CITRINE_XLSX_COLORS.slateBg, color: CITRINE_XLSX_COLORS.textMuted, bold: true, align: 'center', size: 9 });

  const kpiValues = ws1.getRow(r++);
  kpiValues.height = 24;
  kpiValues.values = [`${p.ratePercentage}%`, `${p.prioritiesRate}%`, `${p.hoursRate}%`, `${p.availabilityRate}%`, `${p.completedTasks}/${p.totalTasks}`, `${Math.round(p.plannedMinutes / 60)}h (${p.plannedMinutes}m)`];
  for (let c = 1; c <= 6; c++) applyCellBox(kpiValues.getCell(c), { bg: CITRINE_XLSX_COLORS.emeraldTint, color: CITRINE_XLSX_COLORS.emeraldDark, bold: true, align: 'center', size: 12 });
  r++;

  styleSectionHeaderRow(ws1, r++, 6, 'LES 3 PRIORITÉS DU JOUR — si je ne fais que ça, la journée est réussie');
  if (p.topPriorities.length > 0) {
    p.topPriorities.forEach((item, idx) => {
      const row = ws1.getRow(r++);
      row.height = 20;
      row.values = [`Priorité ${idx + 1}`, item.title, item.priority || 'P2', item.isMilestone ? 'Jalon clé' : 'Standard', p.dateText, item.status];
      for (let c = 1; c <= 5; c++) applyCellBox(row.getCell(c), { bg: idx % 2 === 1 ? CITRINE_XLSX_COLORS.slateZebra : CITRINE_XLSX_COLORS.white, bold: c <= 2, align: c === 3 || c === 5 ? 'center' : 'left' });
      applyStatusBadgeStyle(row.getCell(6), item.status);
    });
  } else {
    const emptyRow = ws1.getRow(r++);
    emptyRow.values = ['—', p.totalTasks === 0 ? "N'a rien fait de la journée" : "Aucune priorité définie pour aujourd'hui."];
    ws1.mergeCells(emptyRow.number, 2, emptyRow.number, 6);
    for (let c = 1; c <= 6; c++) applyCellBox(emptyRow.getCell(c), { bg: CITRINE_XLSX_COLORS.slateBg, italic: true, color: CITRINE_XLSX_COLORS.textMuted });
  }
  r++;

  styleSectionHeaderRow(ws1, r++, 6, 'TÂCHES DU JOUR (DÉTAIL DES SOUS-TÂCHES)');
  styleColumnHeadersRow(ws1, r++, ['Sous-tâche', 'Mission Parente', 'Prio', 'Estimé (min)', 'Échéance', 'Statut'], ['left', 'left', 'center', 'right', 'center', 'center']);
  if (p.tasks.length > 0) {
    p.tasks.forEach((t, idx) => {
      const row = ws1.getRow(r++);
      row.height = 22;
      row.values = [t.title, t.parentTaskTitle || 'Autre', t.priorityLabel || 'P2', `${t.estimatedMinutes} min`, t.dueDate || p.dateText, t.status];
      const bg = idx % 2 === 1 ? CITRINE_XLSX_COLORS.slateZebra : CITRINE_XLSX_COLORS.white;
      applyCellBox(row.getCell(1), { bg, bold: true, color: CITRINE_XLSX_COLORS.blueText });
      applyCellBox(row.getCell(2), { bg, color: CITRINE_XLSX_COLORS.textMuted });
      applyPriorityStyle(row.getCell(3), t.priorityLabel || 'P2');
      applyCellBox(row.getCell(4), { bg, align: 'right', bold: true });
      applyCellBox(row.getCell(5), { bg, align: 'center', color: CITRINE_XLSX_COLORS.textMuted });
      applyStatusBadgeStyle(row.getCell(6), t.status);
    });
  } else {
    const emptyT = ws1.getRow(r++);
    emptyT.getCell(1).value = "Aucune sous-tâche planifiée aujourd'hui.";
    ws1.mergeCells(emptyT.number, 1, emptyT.number, 6);
    applyCellBox(emptyT.getCell(1), { bg: CITRINE_XLSX_COLORS.slateBg, italic: true, align: 'center', color: CITRINE_XLSX_COLORS.textMuted });
  }
  const footRow = ws1.getRow(r++);
  footRow.height = 22;
  footRow.values = ['Total / réalisées / taux', '', `${p.totalTasks} tâches`, `${p.completedTasks} faites`, `${p.ratePercentage}%`, `${p.postponedCount} à suivre`];
  for (let c = 1; c <= 6; c++) applyCellBox(footRow.getCell(c), { bg: CITRINE_XLSX_COLORS.emeraldDark, color: CITRINE_XLSX_COLORS.white, bold: true, align: c >= 3 ? 'center' : 'left' });
  r++;

  styleSectionHeaderRow(ws1, r++, 6, 'PLAN HORAIRE (08:00 – 17:00) — Pause déjeuner 12h00 – 13h00');
  styleColumnHeadersRow(ws1, r++, ['Créneau Horaire', 'Activité réalisée sur le créneau', '', '', '', 'Observation'], ['left', 'left', 'left', 'left', 'left', 'center']);
  ws1.mergeCells(r - 1, 2, r - 1, 5);
  p.scheduleSlots.forEach((s) => {
    const row = ws1.getRow(r++);
    row.height = 20;
    const isLunch = s.isBreak || (s.timeRange.startsWith('12:00') && s.timeRange.includes('13:00'));
    const bg = isLunch ? CITRINE_XLSX_COLORS.yellowLunchBg : CITRINE_XLSX_COLORS.white;
    const fg = isLunch ? CITRINE_XLSX_COLORS.yellowLunchText : CITRINE_XLSX_COLORS.textDark;
    row.getCell(1).value = s.timeRange;
    row.getCell(2).value = isLunch ? 'Pause Déjeuner Officielle (12h00 – 13h00)' : s.activity;
    row.getCell(6).value = s.resolutionNote || (isLunch ? 'Pause' : 'Suivi');
    ws1.mergeCells(row.number, 2, row.number, 5);
    applyCellBox(row.getCell(1), { bg, color: fg, bold: true });
    for (let c = 2; c <= 5; c++) applyCellBox(row.getCell(c), { bg, color: fg, bold: true });
    applyCellBox(row.getCell(6), { bg, color: CITRINE_XLSX_COLORS.textMuted, align: 'center', size: 9 });
  });
  r++;

  styleSectionHeaderRow(ws1, r++, 6, 'INCIDENTS DE PRÉSENCE & BLOCAGES OPÉRATIONNELS');
  const incRows = p.presenceIncidents.length > 0
    ? p.presenceIncidents.map((inc) => [inc.time || 'Pointage', inc.label, inc.description, inc.isJustified ? 'Justifié' : 'Non régularisé'])
    : [['Journée', 'Aucun incident', 'Ponctualité et plage horaire conformes', 'Normal']];
  incRows.forEach((vals) => {
    const row = ws1.getRow(r++);
    row.height = 20;
    row.getCell(1).value = vals[0];
    row.getCell(2).value = vals[1];
    row.getCell(3).value = vals[2];
    row.getCell(6).value = vals[3];
    ws1.mergeCells(row.number, 3, row.number, 5);
    applyCellBox(row.getCell(1), { bold: true });
    applyCellBox(row.getCell(2), { bold: true });
    for (let c = 3; c <= 5; c++) applyCellBox(row.getCell(c), {});
    applyStatusBadgeStyle(row.getCell(6), vals[3]);
  });
  r++;

  styleSectionHeaderRow(ws1, r++, 6, 'BILAN FIN DE JOURNÉE');
  const postRow = ws1.getRow(r++);
  postRow.height = 24;
  postRow.getCell(1).value = 'À reporter à demain :';
  postRow.getCell(2).value = p.postponedTasks.length > 0 ? p.postponedTasks.join(' • ') : 'Toutes les sous-tâches du jour ont été clôturées !';
  ws1.mergeCells(postRow.number, 2, postRow.number, 6);
  applyCellBox(postRow.getCell(1), { bg: CITRINE_XLSX_COLORS.slateHeader, bold: true });
  for (let c = 2; c <= 6; c++) applyCellBox(postRow.getCell(c), {});

  const mgrRow = ws1.getRow(r++);
  mgrRow.height = 26;
  mgrRow.getCell(1).value = 'Points manager :';
  mgrRow.getCell(2).value = p.managerAlertPoint || 'Aucun blocage particulier à signaler.';
  ws1.mergeCells(mgrRow.number, 2, mgrRow.number, 6);
  applyCellBox(mgrRow.getCell(1), { bg: CITRINE_XLSX_COLORS.slateHeader, bold: true });
  for (let c = 2; c <= 6; c++) applyCellBox(mgrRow.getCell(c), {});

  r++;
  styleOfficialFooterRow(ws1, r++, 6);

  const ws2 = wb.addWorksheet('Suivi manager', { views: [{ showGridLines: true }] });
  applyOfficialExcelHeaderFooter(ws2);
  ws2.columns = [{ width: 32 }, { width: 42 }, { width: 22 }, { width: 16 }, { width: 16 }];
  styleBannerRow(ws2, 1, 5, 'CITRINE SARL — SUIVI MANAGER & PILOTAGE OPÉRATIONNEL', false);
  const m2 = ws2.getRow(2);
  m2.values = [`Collaborateur : ${employeeName}`, `Département : ${p.dept}`, 'Douala', p.dateText, p.dayText];
  for (let c = 1; c <= 5; c++) applyCellBox(m2.getCell(c), { bg: CITRINE_XLSX_COLORS.slateHeader, bold: true });
  styleSectionHeaderRow(ws2, 4, 5, 'DIAGNOSTIC DE CHARGE & REMONTÉES');
  const diagRows: [string, string][] = [
    ['Temps planifié (sous-tâches)', `${Math.round(p.plannedMinutes / 60)}h (${p.plannedMinutes} min)`],
    ['Statut capacitaire', p.capacityStatus === 'overloaded' ? 'Surcharge (> 10h/jour)' : p.capacityStatus === 'optimal' ? 'Charge nominale (7h–10h)' : 'Capacité disponible (< 7h)'],
    ['Conseil opérationnel', p.capacityAdvice],
    ['Synthèse manager', p.managerAlertPoint || 'Aucun blocage particulier à signaler.'],
  ];
  diagRows.forEach(([k, v], i) => {
    const row = ws2.getRow(5 + i);
    row.height = 22;
    row.getCell(1).value = k;
    row.getCell(2).value = v;
    ws2.mergeCells(row.number, 2, row.number, 5);
    applyCellBox(row.getCell(1), { bg: CITRINE_XLSX_COLORS.slateBg, bold: true });
    for (let c = 2; c <= 5; c++) applyCellBox(row.getCell(c), {});
  });
  styleOfficialFooterRow(ws2, 10, 5);

  return wb;
}

export async function buildTaskSheetExcelBuffer(data: TaskSheetReportData): Promise<Buffer> {
  const wb = await buildTaskSheetXlsxWorkbook(data);
  const raw = await wb.xlsx.writeBuffer();
  return Buffer.from(raw as ArrayBuffer);
}

export async function buildTaskSheetExcelBase64(data: TaskSheetReportData): Promise<string> {
  const wb = await buildTaskSheetXlsxWorkbook(data);
  const raw = await wb.xlsx.writeBuffer();
  return toBase64Universal(raw as ArrayBuffer);
}
