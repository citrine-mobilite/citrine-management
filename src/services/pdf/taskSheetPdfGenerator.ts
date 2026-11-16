import jsPDF from 'jspdf';
import {
  DailyTaskSheetData,
  MonthlyTaskSheetData,
  YearlyTaskSheetData,
} from '../taskSheet/taskSheetTypes';
import { TaskSheetNote } from '../taskSheetNotesService';
import { drawCitrineOfficialHeader, drawCitrineOfficialFooter } from './citrinePdfHeaderFooter';
import { DEFAULT_COMPANY_INFO } from './pdfCompanyInfo';

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BOTTOM_LIMIT = PAGE_HEIGHT - 25;

const TEAL_DARK: [number, number, number] = [22, 78, 75];
const TEAL_ACCENT: [number, number, number] = [42, 123, 118];
const SLATE_TEXT: [number, number, number] = [28, 25, 23];
const MUTED_TEXT: [number, number, number] = [100, 116, 139];
const ROW_ALT: [number, number, number] = [248, 250, 252];
const BORDER_COLOR: [number, number, number] = [226, 232, 240];

function cleanPdfText(input: unknown): string {
  return String(input ?? '')
    .replace(/[\u{1F000}-\u{1FFFF}\u2600-\u27BF]/gu, '')
    .replace(/\u2192/g, '->')
    .replace(/\u2014|\u2013/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function createHeader(
  doc: jsPDF,
  title: string,
  subtitleRight: string,
  employeeName: string,
  department: string,
  periodLabel: string
): number {
  let y = drawCitrineOfficialHeader(doc, PAGE_WIDTH, MARGIN, 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TEAL_DARK);
  doc.text(cleanPdfText(title), MARGIN, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED_TEXT);
  doc.text(
    `${cleanPdfText(subtitleRight)}   |   Edite le ${new Date().toLocaleDateString('fr-FR')}`,
    PAGE_WIDTH - MARGIN,
    y,
    { align: 'right' }
  );

  y += 3.5;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...BORDER_COLOR);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 12.5, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...SLATE_TEXT);
  doc.text(`Collaborateur : ${cleanPdfText(employeeName)}`, MARGIN + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED_TEXT);
  doc.text(
    `Departement : ${cleanPdfText(department || 'General')}   |   Site : ${DEFAULT_COMPANY_INFO.city}   |   Periode : ${cleanPdfText(periodLabel)}`,
    MARGIN + 4,
    y + 9.8
  );

  return y + 16.5;
}

function drawSectionBanner(doc: jsPDF, y: number, title: string, rightNote?: string): number {
  doc.setFillColor(...TEAL_DARK);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(cleanPdfText(title), MARGIN + 3, y + 4.5);

  if (rightNote) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(209, 250, 229);
    doc.text(cleanPdfText(rightNote), PAGE_WIDTH - MARGIN - 3, y + 4.5, { align: 'right' });
  }
  return y + 6.5;
}

function drawKpiRow(
  doc: jsPDF,
  y: number,
  cards: Array<{ label: string; value: string; sub?: string }>
): number {
  const gap = 3;
  const cardWidth = (CONTENT_WIDTH - gap * (cards.length - 1)) / cards.length;
  const height = 16;

  cards.forEach((c, i) => {
    const x = MARGIN + i * (cardWidth + gap);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...BORDER_COLOR);
    doc.roundedRect(x, y, cardWidth, height, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...MUTED_TEXT);
    doc.text(cleanPdfText(c.label), x + 3, y + 4.8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...TEAL_DARK);
    doc.text(cleanPdfText(c.value), x + 3, y + 10.5);

    if (c.sub) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...MUTED_TEXT);
      doc.text(cleanPdfText(c.sub), x + 3, y + 14.3);
    }
  });

  return y + height + 5;
}

function ensureSpace(doc: jsPDF, currentY: number, neededHeight: number): number {
  if (currentY + neededHeight > BOTTOM_LIMIT) {
    doc.addPage();
    return 14;
  }
  return currentY;
}

function addPageFooters(doc: jsPDF): void {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawCitrineOfficialFooter(doc, PAGE_WIDTH, PAGE_HEIGHT, DEFAULT_COMPANY_INFO, i, totalPages);
  }
}

export interface TaskSheetPdfInput {
  mode: 'day' | 'month' | 'year';
  dailyData?: DailyTaskSheetData;
  monthlyData?: MonthlyTaskSheetData;
  yearlyData?: YearlyTaskSheetData;
  notes?: TaskSheetNote[];
}

export function generateTaskSheetPdf({
  mode,
  dailyData,
  monthlyData,
  yearlyData,
  notes = [],
}: TaskSheetPdfInput): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  if (mode === 'day' && dailyData) {
    let y = createHeader(
      doc,
      'FEUILLE DE TACHES JOURNALIERE',
      dailyData.department,
      dailyData.employee.name,
      dailyData.department,
      `${dailyData.dayName} ${dailyData.date}`
    );

    y = drawKpiRow(doc, y, [
      {
        label: 'Rendement Jour',
        value: `${dailyData.ratePercentage}%`,
        sub: `${dailyData.completedTasks}/${dailyData.totalTasks} taches`,
      },
      {
        label: 'Priorites Majeures',
        value: `${dailyData.topPriorities.filter((p) => p.status === 'Fait').length}/${dailyData.topPriorities.length}`,
      },
      {
        label: 'Charge Planifiee',
        value: `${Math.round((dailyData.capacity.plannedMinutes || 0) / 60)}h`,
        sub: dailyData.capacity.capacityStatus,
      },
      {
        label: 'A reporter',
        value: `${dailyData.postponedCount}`,
        sub: `${dailyData.unforeseenEvents.length} imprevu(s)`,
      },
    ]);

    // Priorites du jour
    y = ensureSpace(doc, y, 22);
    y = drawSectionBanner(doc, y, 'PRIORITES DU JOUR');
    if (dailyData.topPriorities.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(...MUTED_TEXT);
      doc.text('Aucune priorite renseignee pour ce jour.', MARGIN + 3, y + 5.5);
      y += 9;
    } else {
      dailyData.topPriorities.forEach((p, idx) => {
        y = ensureSpace(doc, y, 7);
        doc.setFillColor(...(idx % 2 === 0 ? [255, 255, 255] : ROW_ALT) as [number, number, number]);
        doc.rect(MARGIN, y, CONTENT_WIDTH, 6, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...SLATE_TEXT);
        doc.text(`${idx + 1}. ${cleanPdfText(p.title)}`, MARGIN + 3, y + 4.2, { maxWidth: 135 });
        doc.setFont('helvetica', 'normal');
        doc.text(`${cleanPdfText(p.priority)} - ${cleanPdfText(p.status)}`, PAGE_WIDTH - MARGIN - 3, y + 4.2, {
          align: 'right',
        });
        y += 6;
      });
      y += 4;
    }

    // Taches du jour
    y = ensureSpace(doc, y, 22);
    y = drawSectionBanner(
      doc,
      y,
      'TACHES ET SOUS-TACHES DU JOUR',
      `${dailyData.completedTasks}/${dailyData.totalTasks} terminees (${dailyData.ratePercentage}%)`
    );

    const drawDailyTaskHeader = (posY: number) => {
      doc.setFillColor(...TEAL_ACCENT);
      doc.rect(MARGIN, posY, CONTENT_WIDTH, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text('Tache / Sous-tache', MARGIN + 2.5, posY + 4.2);
      doc.text('Mission Parente', MARGIN + 78, posY + 4.2);
      doc.text('Prio', MARGIN + 132, posY + 4.2);
      doc.text('Est.', MARGIN + 145, posY + 4.2);
      doc.text('Statut', PAGE_WIDTH - MARGIN - 2.5, posY + 4.2, { align: 'right' });
      return posY + 6;
    };

    y = drawDailyTaskHeader(y);

    if (dailyData.tasks.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(...MUTED_TEXT);
      doc.text('Aucune tache en cours ni terminee pour cette date.', MARGIN + 3, y + 5.5);
      y += 10;
    } else {
      dailyData.tasks.forEach((t, idx) => {
        if (y + 6.5 > BOTTOM_LIMIT) {
          doc.addPage();
          y = 14;
          y = drawDailyTaskHeader(y);
        }
        doc.setFillColor(...(idx % 2 === 0 ? [255, 255, 255] : ROW_ALT) as [number, number, number]);
        doc.rect(MARGIN, y, CONTENT_WIDTH, 6, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...SLATE_TEXT);
        doc.text(cleanPdfText(t.title).slice(0, 44), MARGIN + 2.5, y + 4.2);
        doc.setTextColor(...MUTED_TEXT);
        doc.text(cleanPdfText(t.parentTaskTitle).slice(0, 30), MARGIN + 78, y + 4.2);
        doc.text(t.priorityLabel, MARGIN + 132, y + 4.2);
        doc.text(`${t.estimatedMinutes}m`, MARGIN + 145, y + 4.2);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(
          t.status === 'Fait' ? 5 : 180,
          t.status === 'Fait' ? 150 : 83,
          t.status === 'Fait' ? 105 : 9
        );
        doc.text(cleanPdfText(t.status), PAGE_WIDTH - MARGIN - 2.5, y + 4.2, { align: 'right' });
        y += 6;
      });
    }
    y += 5;

    // Plan horaire
    y = ensureSpace(doc, y, 25);
    y = drawSectionBanner(doc, y, 'PLAN HORAIRE (08:00 - 17:00)');
    dailyData.scheduleSlots.forEach((s, idx) => {
      if (y + 6 > BOTTOM_LIMIT) {
        doc.addPage();
        y = 14;
      }
      const isBreak = Boolean(s.isBreak || s.timeRange.startsWith('12:00'));
      doc.setFillColor(
        ...(isBreak ? [254, 243, 199] : idx % 2 === 0 ? [255, 255, 255] : ROW_ALT) as [
          number,
          number,
          number,
        ]
      );
      doc.rect(MARGIN, y, CONTENT_WIDTH, 5.8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...SLATE_TEXT);
      doc.text(cleanPdfText(s.timeRange), MARGIN + 3, y + 4);
      doc.setFont('helvetica', 'normal');
      doc.text(
        cleanPdfText(isBreak ? 'Pause Dejeuner (12:00 - 13:00)' : s.activity).slice(0, 82),
        MARGIN + 38,
        y + 4
      );
      y += 5.8;
    });
    y += 5;

    // Imprevus & notes
    if (dailyData.unforeseenEvents.length > 0 || notes.length > 0 || dailyData.postponedTasks.length > 0) {
      y = ensureSpace(doc, y, 24);
      y = drawSectionBanner(doc, y, 'IMPREVUS, REPORTS & NOTES');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...SLATE_TEXT);

      if (dailyData.unforeseenEvents.length > 0) {
        dailyData.unforeseenEvents.forEach((u) => {
          y = ensureSpace(doc, y, 5.5);
          doc.text(
            `- [Imprevu ${u.time}] ${cleanPdfText(u.subject)} (${u.lostMinutes} min)`,
            MARGIN + 3,
            y + 4
          );
          y += 5;
        });
      }
      if (dailyData.postponedTasks.length > 0) {
        y = ensureSpace(doc, y, 5.5);
        doc.text(
          `- A reporter : ${cleanPdfText(dailyData.postponedTasks.slice(0, 4).join(' | '))}`,
          MARGIN + 3,
          y + 4,
          { maxWidth: CONTENT_WIDTH - 6 }
        );
        y += 6;
      }
      notes.forEach((n) => {
        y = ensureSpace(doc, y, 5.5);
        doc.text(
          `- [${n.category.toUpperCase()}] ${cleanPdfText(n.content)}`,
          MARGIN + 3,
          y + 4,
          { maxWidth: CONTENT_WIDTH - 6 }
        );
        y += 5.5;
      });
    }
  } else if (mode === 'month' && monthlyData) {
    const completedParentCount = (monthlyData.tasksList || []).filter(
      (t) => t.status === 'completed'
    ).length;
    const presentCount =
      monthlyData.presentDays ??
      monthlyData.dailyBreakdown.filter((d) => d.status === 'Présent' || d.status === 'Mission').length;
    const lateCount =
      monthlyData.lateDays ??
      monthlyData.dailyBreakdown.filter((d) => d.status === 'En retard').length;
    const absentCount =
      monthlyData.absentDays ??
      monthlyData.dailyBreakdown.filter((d) => d.status === 'Absent').length;

    const workingDays = monthlyData.workingDaysInMonth || 22;
    const weNote = monthlyData.weekendDaysWorked > 0 ? ` (+${monthlyData.weekendDaysWorked}j WE)` : '';

    let y = createHeader(
      doc,
      `SYNTHESE MENSUELLE - ${monthlyData.monthName.toUpperCase()}`,
      `Assiduite : ${monthlyData.totalDaysWorked}j / ${workingDays}j${weNote}`,
      monthlyData.employee.name,
      monthlyData.employee.department || 'General',
      monthlyData.monthName
    );

    y = drawKpiRow(doc, y, [
      {
        label: 'Presence & Heures',
        value: `${monthlyData.totalDaysWorked}j/${workingDays}j (${monthlyData.totalHoursWorked}h)`,
        sub: `${presentCount} P / ${lateCount} R / ${absentCount} A${weNote}`,
      },
      {
        label: 'Rendement Sous-Taches',
        value: `${monthlyData.completionRate}%`,
      },
      {
        label: 'Sous-Taches Validees',
        value: `${monthlyData.completedSubtasksCount || monthlyData.totalTasksCompleted} / ${
          monthlyData.totalSubtasksCount || monthlyData.totalTasksAssigned
        }`,
      },
      {
        label: 'Missions Achevees',
        value: `${completedParentCount} / ${(monthlyData.tasksList || []).length}`,
      },
    ]);

    // Journal synthetique des presences (jours pointes ou actifs, ou message)
    const activeDays = monthlyData.dailyBreakdown.filter(
      (d) => d.status !== '-' || d.hoursWorked > 0 || d.tasksDoneCount > 0
    );
    const rowsToPrint = activeDays.length > 0 ? activeDays : monthlyData.dailyBreakdown;

    y = ensureSpace(doc, y, 20);
    y = drawSectionBanner(
      doc,
      y,
      'SYNTHESE DES PRESENCES ET ACTIVITE DU MOIS',
      `${monthlyData.totalDaysWorked}j / ${workingDays}j ouvres${weNote}`
    );

    const drawMonthPresenceHeader = (posY: number) => {
      doc.setFillColor(...TEAL_ACCENT);
      doc.rect(MARGIN, posY, CONTENT_WIDTH, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text('Date', MARGIN + 2.5, posY + 4.2);
      doc.text('Jour', MARGIN + 30, posY + 4.2);
      doc.text('Arrivee', MARGIN + 52, posY + 4.2);
      doc.text('Depart', MARGIN + 75, posY + 4.2);
      doc.text('Heures', MARGIN + 102, posY + 4.2);
      doc.text('Statut', MARGIN + 128, posY + 4.2);
      doc.text('Sous-taches', PAGE_WIDTH - MARGIN - 2.5, posY + 4.2, { align: 'right' });
      return posY + 6;
    };

    y = drawMonthPresenceHeader(y);

    rowsToPrint.forEach((d, idx) => {
      if (y + 5.6 > BOTTOM_LIMIT) {
        doc.addPage();
        y = 14;
        y = drawMonthPresenceHeader(y);
      }
      doc.setFillColor(...(idx % 2 === 0 ? [255, 255, 255] : ROW_ALT) as [number, number, number]);
      doc.rect(MARGIN, y, CONTENT_WIDTH, 5.4, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...SLATE_TEXT);
      doc.text(d.date, MARGIN + 2.5, y + 3.8);
      doc.text(
        `${cleanPdfText(d.dayName).toUpperCase()}${d.isWeekend ? ' (WE)' : ''}`,
        MARGIN + 30,
        y + 3.8
      );
      doc.text(cleanPdfText(d.arrivalTime), MARGIN + 52, y + 3.8);
      doc.text(cleanPdfText(d.departureTime), MARGIN + 75, y + 3.8);
      doc.text(d.hoursWorked > 0 ? `${d.hoursWorked}h` : '-', MARGIN + 102, y + 3.8);
      doc.text(cleanPdfText(d.status), MARGIN + 128, y + 3.8);
      doc.text(
        d.tasksDoneCount > 0 ? `${d.tasksDoneCount}` : '-',
        PAGE_WIDTH - MARGIN - 2.5,
        y + 3.8,
        { align: 'right' }
      );
      y += 5.4;
    });

    y += 6;

    // Releve des taches et sous-taches du mois
    y = ensureSpace(doc, y, 22);
    y = drawSectionBanner(
      doc,
      y,
      'RELEVE DES TACHES & SOUS-TACHES DU MOIS',
      `${(monthlyData.tasksList || []).length} mission(s)`
    );

    if ((monthlyData.tasksList || []).length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(...MUTED_TEXT);
      doc.text('Aucune tache enregistree sur cette periode.', MARGIN + 3, y + 5.5);
      y += 9;
    } else {
      (monthlyData.tasksList || []).forEach((t, idx) => {
        y = ensureSpace(doc, y, 10);
        doc.setFillColor(...(idx % 2 === 0 ? [255, 255, 255] : ROW_ALT) as [number, number, number]);
        doc.rect(MARGIN, y, CONTENT_WIDTH, 6.2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...SLATE_TEXT);
        doc.text(cleanPdfText(t.title).slice(0, 62), MARGIN + 2.5, y + 4.3);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...TEAL_DARK);
        doc.text(
          `${t.completedSubtasks}/${t.totalSubtasks} (${t.completionPercentage}%)`,
          PAGE_WIDTH - MARGIN - 2.5,
          y + 4.3,
          { align: 'right' }
        );
        y += 6.2;

        (t.subtasks || []).forEach((s) => {
          y = ensureSpace(doc, y, 5);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.2);
          doc.setTextColor(...MUTED_TEXT);
          doc.text(
            `   ${s.completed ? '[OK]' : '[ ]'} ${cleanPdfText(s.title).slice(0, 74)}`,
            MARGIN + 5,
            y + 3.6
          );
          doc.text(s.completed ? 'Validee' : 'A faire', PAGE_WIDTH - MARGIN - 2.5, y + 3.6, {
            align: 'right',
          });
          y += 4.8;
        });
      });
    }
  } else if (mode === 'year' && yearlyData) {
    const yearWorking = yearlyData.totalWorkingDays || 260;
    const yearWeNote =
      yearlyData.totalWeekendDaysWorked > 0 ? ` (+${yearlyData.totalWeekendDaysWorked}j WE)` : '';
    let y = createHeader(
      doc,
      `BILAN ANNUEL - ${yearlyData.year}`,
      `${yearlyData.totalDaysPresent}j / ${yearWorking}j${yearWeNote}`,
      yearlyData.employee.name,
      yearlyData.employee.department || 'General',
      `Annee ${yearlyData.year}`
    );

    y = drawKpiRow(doc, y, [
      {
        label: 'Presences Annuelles',
        value: `${yearlyData.totalDaysPresent}j / ${yearWorking}j`,
        sub: yearlyData.totalWeekendDaysWorked > 0 ? `dont +${yearlyData.totalWeekendDaysWorked}j WE` : undefined,
      },
      { label: 'Volume Horaire', value: `${yearlyData.totalHoursWorked}h` },
      { label: 'Taches Achevees', value: `${yearlyData.totalTasksCompleted}` },
      { label: 'Reussite Moyenne', value: `${yearlyData.avgCompletionRate}%` },
    ]);

    y = drawSectionBanner(doc, y, `DETAIL MENSUEL (${yearlyData.year})`);

    doc.setFillColor(...TEAL_ACCENT);
    doc.rect(MARGIN, y, CONTENT_WIDTH, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('Mois', MARGIN + 3, y + 4.2);
    doc.text('Jours Travailles', MARGIN + 62, y + 4.2);
    doc.text('Heures Cumulees', MARGIN + 108, y + 4.2);
    doc.text('Taches Realisees', MARGIN + 144, y + 4.2);
    doc.text('Rendement', PAGE_WIDTH - MARGIN - 3, y + 4.2, { align: 'right' });
    y += 6;

    yearlyData.monthlyBreakdown.forEach((m, idx) => {
      doc.setFillColor(...(idx % 2 === 0 ? [255, 255, 255] : ROW_ALT) as [number, number, number]);
      doc.rect(MARGIN, y, CONTENT_WIDTH, 6.2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...SLATE_TEXT);
      doc.text(cleanPdfText(m.monthName), MARGIN + 3, y + 4.3);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `${m.daysWorked}j/${m.workingDays || 22}j${m.weekendDaysWorked > 0 ? ` (+${m.weekendDaysWorked} WE)` : ''}`,
        MARGIN + 62,
        y + 4.3
      );
      doc.text(`${m.hoursWorked}h`, MARGIN + 108, y + 4.3);
      doc.text(`${m.tasksCompleted}`, MARGIN + 144, y + 4.3);
      doc.setFont('helvetica', 'bold');
      doc.text(`${m.rendementRate}%`, PAGE_WIDTH - MARGIN - 3, y + 4.3, { align: 'right' });
      y += 6.2;
    });
  }

  addPageFooters(doc);
  return doc;
}

export function downloadTaskSheetPdf(input: TaskSheetPdfInput): boolean {
  try {
    const doc = generateTaskSheetPdf(input);
    const empName =
      input.mode === 'day'
        ? input.dailyData?.employee.name
        : input.mode === 'month'
        ? input.monthlyData?.employee.name
        : input.yearlyData?.employee.name;
    const periodPart =
      input.mode === 'day'
        ? input.dailyData?.date
        : input.mode === 'month'
        ? input.monthlyData?.month
        : String(input.yearlyData?.year || '');
    const safeName = (empName || 'Collaborateur').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safePeriod = (periodPart || input.mode).replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`Feuille_Taches_${input.mode}_${safeName}_${safePeriod}.pdf`);
    return true;
  } catch (err) {
    console.error('Error generating TaskSheet PDF:', err);
    return false;
  }
}
