import ExcelJS from 'exceljs';
import { MonthlyTaskSheetData, YearlyTaskSheetData } from '../taskSheet/taskSheetTypes';
import {
  CITRINE_XLSX_COLORS,
  applyCellBox,
  applyOfficialExcelHeaderFooter,
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

export async function buildMonthlyTaskSheetXlsxWorkbook(data: MonthlyTaskSheetData): Promise<ExcelJS.Workbook> {
  const empName = data.employee?.name || 'Collaborateur';
  const dept = data.employee?.department || 'Général';
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Citrine Mobilité RH';
  wb.created = new Date();

  const ws1 = wb.addWorksheet('Synthèse & Présences', {
    views: [{ showGridLines: true }],
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  ws1.columns = [
    { width: 14 },
    { width: 10 },
    { width: 14 },
    { width: 14 },
    { width: 12 },
    { width: 16 },
    { width: 16 },
  ];

  let r = 1;
  applyOfficialExcelHeaderFooter(ws1);
  styleBannerRow(ws1, r++, 7, 'CITRINE SARL — Société à Responsabilité Limitée · République du Cameroun (Document Officiel)', false);
  styleBannerRow(ws1, r++, 7, `FEUILLE DE TÂCHES MENSUELLE — ${data.monthName.toUpperCase()}`, true);

  const meta = ws1.getRow(r++);
  meta.values = [`Collaborateur : ${empName}`, '', `Département : ${dept}`, '', `Période : ${data.month}`, '', 'Douala'];
  ws1.mergeCells(meta.number, 1, meta.number, 2);
  ws1.mergeCells(meta.number, 3, meta.number, 4);
  ws1.mergeCells(meta.number, 5, meta.number, 6);
  for (let c = 1; c <= 7; c++) applyCellBox(meta.getCell(c), { bg: CITRINE_XLSX_COLORS.slateHeader, bold: true });
  r++;

  styleSectionHeaderRow(ws1, r++, 7, 'INDICATEURS CLÉS DU MOIS');
  const kpiRow = ws1.getRow(r++);
  const subtasksDone = data.completedSubtasksCount || data.totalTasksCompleted || 0;
  const subtasksTotal = data.totalSubtasksCount || data.totalTasksAssigned || 0;
  const workingDays = data.workingDaysInMonth || 22;
  const weekendNote = data.weekendDaysWorked > 0 ? ` (+${data.weekendDaysWorked} WE)` : '';
  kpiRow.values = [
    `Jours : ${data.totalDaysWorked}j/${workingDays}j${weekendNote}`,
    `Heures : ${data.totalHoursWorked}h`,
    `Présents : ${data.presentDays ?? 0}`,
    `Retards : ${data.lateDays ?? 0}`,
    `Absents : ${data.absentDays ?? 0}`,
    `Sous-tâches : ${subtasksDone}/${subtasksTotal}`,
    `Rendement : ${data.completionRate}%`,
  ];
  for (let c = 1; c <= 7; c++) {
    applyCellBox(kpiRow.getCell(c), {
      bg: CITRINE_XLSX_COLORS.emeraldTint,
      color: CITRINE_XLSX_COLORS.emeraldDark,
      bold: true,
      align: 'center',
    });
  }
  r++;

  styleSectionHeaderRow(ws1, r++, 7, 'JOURNAL DES PRÉSENCES & ACTIVITÉ QUOTIDIENNE');
  styleColumnHeadersRow(
    ws1,
    r++,
    ['Date', 'Jour', 'Arrivée', 'Départ', 'Heures', 'Statut', 'Sous-tâches'],
    ['center', 'center', 'center', 'center', 'right', 'center', 'right']
  );

  (data.dailyBreakdown || []).forEach((d, idx) => {
    const row = ws1.getRow(r++);
    const dayLbl = `${d.dayName.toUpperCase()}${d.isWeekend && (d.hoursWorked > 0 || d.tasksDoneCount > 0 || d.status !== '-') ? ' (WE)' : ''}`;
    row.values = [
      d.date,
      dayLbl,
      d.arrivalTime,
      d.departureTime,
      d.hoursWorked > 0 ? `${d.hoursWorked}h` : '-',
      d.status,
      d.tasksDoneCount > 0 ? d.tasksDoneCount : '-',
    ];
    const bg = idx % 2 === 1 ? CITRINE_XLSX_COLORS.slateZebra : CITRINE_XLSX_COLORS.white;
    applyCellBox(row.getCell(1), { bg, align: 'center' });
    applyCellBox(row.getCell(2), { bg, align: 'center', bold: true });
    applyCellBox(row.getCell(3), { bg, align: 'center' });
    applyCellBox(row.getCell(4), { bg, align: 'center' });
    applyCellBox(row.getCell(5), { bg, align: 'right', bold: true });
    if (d.status !== '-') applyStatusBadgeStyle(row.getCell(6), d.status);
    else applyCellBox(row.getCell(6), { bg, align: 'center', color: CITRINE_XLSX_COLORS.textMuted });
    applyCellBox(row.getCell(7), { bg, align: 'right', bold: true, color: CITRINE_XLSX_COLORS.emeraldDark });
  });
  r++;
  styleOfficialFooterRow(ws1, r++, 7);

  const ws2 = wb.addWorksheet('Tâches & Sous-Tâches', {
    views: [{ showGridLines: true }],
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  applyOfficialExcelHeaderFooter(ws2);
  ws2.columns = [
    { width: 34 },
    { width: 38 },
    { width: 12 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
  ];

  let r2 = 1;
  styleBannerRow(ws2, r2++, 6, `CITRINE SARL — RELEVÉ TÂCHES & SOUS-TÂCHES — ${empName.toUpperCase()} (${data.monthName})`, false);
  r2++;
  styleColumnHeadersRow(
    ws2,
    r2++,
    ['Mission Parente', 'Sous-Tâche', 'Priorité', 'Échéance', 'Estimé (h)', 'Statut'],
    ['left', 'left', 'center', 'center', 'right', 'center']
  );

  (data.tasksList || []).forEach((t, idx) => {
    if (t.subtasks && t.subtasks.length > 0) {
      t.subtasks.forEach((s) => {
        const row = ws2.getRow(r2++);
        const sLabel = s.completed ? 'Fait' : s.status === 'in_progress' ? 'En cours' : 'À faire';
        row.values = [
          t.title,
          s.title,
          (t.priority || 'medium').toUpperCase(),
          t.date || data.month,
          s.estimatedHours ? `${s.estimatedHours}h` : '-',
          sLabel,
        ];
        const bg = idx % 2 === 1 ? CITRINE_XLSX_COLORS.slateZebra : CITRINE_XLSX_COLORS.white;
        applyCellBox(row.getCell(1), { bg, bold: true });
        applyCellBox(row.getCell(2), { bg, color: CITRINE_XLSX_COLORS.blueText });
        applyCellBox(row.getCell(3), { bg, align: 'center' });
        applyCellBox(row.getCell(4), { bg, align: 'center' });
        applyCellBox(row.getCell(5), { bg, align: 'right' });
        applyStatusBadgeStyle(row.getCell(6), sLabel);
      });
    } else {
      const row = ws2.getRow(r2++);
      const tLabel = t.status === 'completed' ? 'Fait' : t.status === 'blocked' ? 'Bloqué' : 'En cours';
      row.values = [t.title, '(Tâche unitaire)', (t.priority || 'medium').toUpperCase(), t.date || data.month, '-', tLabel];
      const bg = idx % 2 === 1 ? CITRINE_XLSX_COLORS.slateZebra : CITRINE_XLSX_COLORS.white;
      applyCellBox(row.getCell(1), { bg, bold: true });
      applyCellBox(row.getCell(2), { bg, italic: true, color: CITRINE_XLSX_COLORS.textMuted });
      applyCellBox(row.getCell(3), { bg, align: 'center' });
      applyCellBox(row.getCell(4), { bg, align: 'center' });
      applyCellBox(row.getCell(5), { bg, align: 'right' });
      applyStatusBadgeStyle(row.getCell(6), tLabel);
    }
  });
  r2++;
  styleOfficialFooterRow(ws2, r2++, 6);

  return wb;
}

export async function buildMonthlyTaskSheetExcelBuffer(data: MonthlyTaskSheetData): Promise<Buffer> {
  const wb = await buildMonthlyTaskSheetXlsxWorkbook(data);
  const raw = await wb.xlsx.writeBuffer();
  return Buffer.from(raw as ArrayBuffer);
}

export async function buildMonthlyTaskSheetExcelBase64(data: MonthlyTaskSheetData): Promise<string> {
  const wb = await buildMonthlyTaskSheetXlsxWorkbook(data);
  const raw = await wb.xlsx.writeBuffer();
  return toBase64Universal(raw as ArrayBuffer);
}

export async function buildYearlyTaskSheetXlsxWorkbook(data: YearlyTaskSheetData): Promise<ExcelJS.Workbook> {
  const empName = data.employee?.name || 'Collaborateur';
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Citrine Mobilité RH';
  wb.created = new Date();

  const ws1 = wb.addWorksheet('Bilan Annuel', { views: [{ showGridLines: true }] });
  ws1.columns = [{ width: 18 }, { width: 18 }, { width: 18 }, { width: 22 }, { width: 16 }];

  let r = 1;
  applyOfficialExcelHeaderFooter(ws1);
  styleBannerRow(ws1, r++, 5, 'CITRINE SARL — Société à Responsabilité Limitée · République du Cameroun (Document Officiel)', false);
  styleBannerRow(ws1, r++, 5, `BILAN ANNUEL DES TÂCHES — ${data.year} (${empName.toUpperCase()})`, true);
  r++;

  styleSectionHeaderRow(ws1, r++, 5, 'SYNTHÈSE ANNUELLE');
  const kpi = ws1.getRow(r++);
  kpi.values = [
    `Jours : ${data.totalDaysPresent}j/${data.totalWorkingDays || 260}j${data.totalWeekendDaysWorked > 0 ? ` (+${data.totalWeekendDaysWorked} WE)` : ''}`,
    `Heures : ${data.totalHoursWorked}h`,
    `Tâches finies : ${data.totalTasksCompleted}`,
    `Sous-tâches : ${data.totalSubtasksCompleted ?? 0}/${data.totalSubtasksAssigned ?? 0}`,
    `Rendement : ${data.avgCompletionRate}%`,
  ];
  for (let c = 1; c <= 5; c++) {
    applyCellBox(kpi.getCell(c), {
      bg: CITRINE_XLSX_COLORS.emeraldTint,
      color: CITRINE_XLSX_COLORS.emeraldDark,
      bold: true,
      align: 'center',
    });
  }
  r++;

  styleSectionHeaderRow(ws1, r++, 5, 'DÉTAIL PAR MOIS');
  styleColumnHeadersRow(
    ws1,
    r++,
    ['Mois', 'Jours Travaillés', 'Heures Cumulées', 'Sous-Tâches Validées', 'Rendement'],
    ['left', 'center', 'right', 'center', 'right']
  );

  data.monthlyBreakdown.forEach((m, idx) => {
    const row = ws1.getRow(r++);
    row.values = [
      m.monthName,
      `${m.daysWorked}j/${m.workingDays || 22}j${m.weekendDaysWorked > 0 ? ` (+${m.weekendDaysWorked} WE)` : ''}`,
      `${m.hoursWorked}h`,
      m.subtasksTotal ? `${m.tasksCompleted}/${m.subtasksTotal}` : m.tasksCompleted,
      `${m.rendementRate}%`,
    ];
    const bg = idx % 2 === 1 ? CITRINE_XLSX_COLORS.slateZebra : CITRINE_XLSX_COLORS.white;
    applyCellBox(row.getCell(1), { bg, bold: true });
    applyCellBox(row.getCell(2), { bg, align: 'center' });
    applyCellBox(row.getCell(3), { bg, align: 'right', bold: true });
    applyCellBox(row.getCell(4), { bg, align: 'center', bold: true, color: CITRINE_XLSX_COLORS.emeraldText });
    applyCellBox(row.getCell(5), { bg, align: 'right', bold: true, color: CITRINE_XLSX_COLORS.emeraldDark });
  });
  r++;
  styleOfficialFooterRow(ws1, r++, 5);

  if (data.topTimeTasks && data.topTimeTasks.length > 0) {
    const ws2 = wb.addWorksheet('Top Missions & Sous-Tâches', { views: [{ showGridLines: true }] });
    applyOfficialExcelHeaderFooter(ws2);
    ws2.columns = [{ width: 42 }, { width: 18 }, { width: 18 }, { width: 14 }];
    styleBannerRow(ws2, 1, 4, `CITRINE SARL — PRINCIPALES MISSIONS & SOUS-TÂCHES (${data.year})`, false);
    styleColumnHeadersRow(ws2, 3, ['Mission / Tâche', 'Sous-Tâches', 'Statut', 'Temps (h)'], ['left', 'center', 'center', 'right']);
    data.topTimeTasks.forEach((t, idx) => {
      const row = ws2.getRow(4 + idx);
      row.values = [t.title, `${t.completedSubtasksCount}/${t.subtasksCount}`, t.status, `${t.hours}h`];
      const bg = idx % 2 === 1 ? CITRINE_XLSX_COLORS.slateZebra : CITRINE_XLSX_COLORS.white;
      applyCellBox(row.getCell(1), { bg, bold: true });
      applyCellBox(row.getCell(2), { bg, align: 'center' });
      applyStatusBadgeStyle(row.getCell(3), t.status === 'completed' ? 'Fait' : 'En cours');
      applyCellBox(row.getCell(4), { bg, align: 'right', bold: true });
    });
    styleOfficialFooterRow(ws2, 5 + data.topTimeTasks.length, 4);
  }

  return wb;
}

export async function buildYearlyTaskSheetExcelBuffer(data: YearlyTaskSheetData): Promise<Buffer> {
  const wb = await buildYearlyTaskSheetXlsxWorkbook(data);
  const raw = await wb.xlsx.writeBuffer();
  return Buffer.from(raw as ArrayBuffer);
}

export async function buildYearlyTaskSheetExcelBase64(data: YearlyTaskSheetData): Promise<string> {
  const wb = await buildYearlyTaskSheetXlsxWorkbook(data);
  const raw = await wb.xlsx.writeBuffer();
  return toBase64Universal(raw as ArrayBuffer);
}
