import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import {
  ComplianceChecklistItem,
  ComplianceSubItemStatus,
} from '../types/complianceTypes';
import {
  computeComplianceMetrics,
  computeParentComplianceStatus,
  formatSubItemCommentsText,
  getComplianceStatusMeta,
  prepareComplianceSubItemReportRows,
  resolveSubItemStatus,
} from '../utils/complianceHelpers';
import {
  drawCitrineOfficialFooter,
  drawCitrineOfficialHeader,
} from './pdf/citrinePdfHeaderFooter';
import { DEFAULT_COMPANY_INFO } from './pdf/pdfCompanyInfo';
import { ensurePublicLogoLoaded } from './pdf/publicLogoLoader';

export interface ComplianceExportOptions {
  generatedBy?: string;
  filterLabel?: string;
}

const EXCEL_STATUS_COLORS: Record<ComplianceSubItemStatus, { fill: string; font: string }> = {
  conforme: { fill: 'FFE8F7EE', font: 'FF166534' },
  partiellement_conforme: { fill: 'FFE0F2FE', font: 'FF0369A1' },
  en_cours: { fill: 'FFFEF3C7', font: 'FFB45309' },
  a_verifier: { fill: 'FFE0E7FF', font: 'FF4338CA' },
  a_preparer: { fill: 'FFF5F5F4', font: 'FF44403C' },
  non_conforme: { fill: 'FFFEE2E2', font: 'FFB91C1C' },
  non_existant: { fill: 'FFFFE4E6', font: 'FF9F1239' },
  non_applicable: { fill: 'FFFAFAF9', font: 'FF78716C' },
};

const PDF_STATUS_RGB: Record<ComplianceSubItemStatus, [number, number, number]> = {
  conforme: [22, 163, 74],
  partiellement_conforme: [2, 132, 199],
  en_cours: [217, 119, 6],
  a_verifier: [79, 70, 229],
  a_preparer: [87, 83, 78],
  non_conforme: [220, 38, 38],
  non_existant: [153, 27, 27],
  non_applicable: [120, 113, 108],
};

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Exports the ANTIC compliance report into a formatted multi-sheet Excel (.xlsx) workbook
 * detailing binary parent readiness and granular sub-element statuses + comments.
 */
export async function exportComplianceToExcel(
  items: ComplianceChecklistItem[],
  options: ComplianceExportOptions = {}
): Promise<string> {
  const metrics = computeComplianceMetrics(items);
  const subRows = prepareComplianceSubItemReportRows(items);
  const dateStamp = new Date().toISOString().split('T')[0];
  const generatedAt = new Date().toLocaleString('fr-FR');

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Citrine Management';
  workbook.created = new Date();

  // Sheet 1: Executive Summary
  const summarySheet = workbook.addWorksheet('Synthèse ANTIC');
  summarySheet.columns = [
    { width: 38 },
    { width: 18 },
    { width: 16 },
    { width: 16 },
    { width: 18 },
    { width: 20 },
  ];

  const titleRow = summarySheet.addRow([
    'RAPPORT DE CONFORMITÉ — AUDIT DE SÉCURITÉ ANTIC',
  ]);
  titleRow.font = { bold: true, size: 14, color: { argb: 'FF2A7B76' } };
  summarySheet.mergeCells('A1:F1');

  const metaRow = summarySheet.addRow([
    `Généré le ${generatedAt}${options.generatedBy ? ` par ${options.generatedBy}` : ''}${
      options.filterLabel ? ` · Périmètre : ${options.filterLabel}` : ''
    }`,
  ]);
  metaRow.font = { italic: true, size: 10, color: { argb: 'FF57534E' } };
  summarySheet.mergeCells('A2:F2');
  summarySheet.addRow([]);

  const kpiHeader = summarySheet.addRow(['Indicateur de conformité', 'Valeur']);
  kpiHeader.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2A7B76' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  });

  const kpiRows: Array<[string, string | number]> = [
    ['Taux de conformité globale (Grands éléments)', `${metrics.readinessPercent}%`],
    ['Grands éléments Conformes (automatique)', metrics.conformeCount],
    ['Grands éléments Non conformes (automatique)', metrics.nonConformeCount],
    ['Sous-éléments Conformes', `${metrics.subItemsDone} / ${metrics.subItemsApplicable}`],
    ['Sous-éléments Partiellement conformes', metrics.partiellementConformeCount],
    ['Sous-éléments En cours de conformité', metrics.enCoursCount],
    ['Sous-éléments À vérifier / Validation', metrics.aVerifierCount],
    ['Sous-éléments À initier / À préparer', metrics.aPreparerCount],
    ['Sous-éléments Non conformes', metrics.subNonConformeCount],
    ['Sous-éléments Non existants', metrics.nonExistantCount],
    ['Sous-éléments Non applicables (N/A)', metrics.nonApplicableCount],
  ];

  for (const [label, val] of kpiRows) {
    const r = summarySheet.addRow([label, val]);
    r.getCell(1).font = { bold: true, color: { argb: 'FF292524' } };
    r.getCell(2).alignment = { horizontal: 'right' };
  }

  summarySheet.addRow([]);
  const axisHeader = summarySheet.addRow([
    'Axe ANTIC',
    'Conformité %',
    'Conformes',
    'Non conformes',
    'Sous-élém. conformes',
    'Sous-élém. en cours',
  ]);
  axisHeader.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2A7B76' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  });

  for (const axisStat of metrics.byAxis) {
    summarySheet.addRow([
      axisStat.label,
      `${axisStat.readinessPercent}%`,
      axisStat.conformeCount,
      axisStat.nonConformeCount,
      `${axisStat.subItemsConforme}/${axisStat.subItemsApplicable}`,
      axisStat.subItemsInProgress,
    ]);
  }

  // Sheet 2: Granular Sub-Element Matrix
  const detailSheet = workbook.addWorksheet('Détail Sous-éléments', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  detailSheet.columns = [
    { header: 'Code', key: 'controlCode', width: 14 },
    { header: 'Section ANTIC', key: 'sectionTitle', width: 32 },
    { header: 'Exigence principale', key: 'parentTitle', width: 38 },
    { header: 'Statut Global', key: 'parentStatusLabel', width: 16 },
    { header: 'Sous-élément / Livrable', key: 'subLabel', width: 44 },
    { header: 'Statut Sous-élément', key: 'subStatusLabel', width: 24 },
    { header: 'Responsable & Fonction', key: 'ownerDisplay', width: 30 },
    { header: 'Version', key: 'documentVersion', width: 11 },
    { header: 'Date doc.', key: 'documentDate', width: 13 },
    { header: 'Confidentialité', key: 'confidentiality', width: 14 },
    { header: 'Preuve / Lien', key: 'evidenceUrl', width: 26 },
    { header: 'Commentaires sous-élément', key: 'subCommentsText', width: 48 },
  ];

  const headerRow = detailSheet.getRow(1);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2A7B76' } };
    cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  });

  for (const row of subRows) {
    const added = detailSheet.addRow(row);
    added.eachCell((cell) => {
      cell.alignment = { vertical: 'top', wrapText: true };
      cell.font = { size: 9.5, color: { argb: 'FF292524' } };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE7E5E4' } },
      };
    });

    const pStyle = EXCEL_STATUS_COLORS[row.parentStatus] || EXCEL_STATUS_COLORS.non_conforme;
    const pCell = added.getCell('parentStatusLabel');
    pCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pStyle.fill } };
    pCell.font = { bold: true, size: 9.5, color: { argb: pStyle.font } };

    const sStyle = EXCEL_STATUS_COLORS[row.subStatus] || EXCEL_STATUS_COLORS.a_preparer;
    const sCell = added.getCell('subStatusLabel');
    sCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sStyle.fill } };
    sCell.font = { bold: true, size: 9.5, color: { argb: sStyle.font } };
  }

  detailSheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 12 },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `Rapport_Conformite_ANTIC_${dateStamp}.xlsx`;
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerBlobDownload(blob, filename);
  return filename;
}

/**
 * Exports the ANTIC compliance report into a formatted Landscape A4 PDF with automatic binary parent status
 * and detailed sub-element statuses + comments.
 */
export async function exportComplianceToPdf(
  items: ComplianceChecklistItem[],
  options: ComplianceExportOptions = {}
): Promise<string> {
  const logoBase64 = await ensurePublicLogoLoaded().catch(() => undefined);

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const bottomLimit = pageHeight - 24;

  const metrics = computeComplianceMetrics(items);
  const dateStamp = new Date().toISOString().split('T')[0];
  const generatedAt = new Date().toLocaleString('fr-FR');

  let y = drawCitrineOfficialHeader(doc, pageWidth, margin, 10, logoBase64);

  // Title Banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(42, 123, 118);
  doc.text('RAPPORT DE CONFORMITÉ & AUDIT DE SÉCURITÉ ANTIC', margin, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(185, 28, 28);
  doc.text('CONFIDENTIEL', pageWidth - margin, y, { align: 'right' });

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(87, 83, 78);
  const subtitle = `Généré le ${generatedAt}${
    options.generatedBy ? ` · Responsable export : ${options.generatedBy}` : ''
  }${options.filterLabel ? ` · Périmètre : ${options.filterLabel}` : ''}`;
  doc.text(subtitle, margin, y);

  y += 6;

  // Compact KPI Strip
  const kpis: Array<{ label: string; value: string; color: [number, number, number] }> = [
    { label: 'Conformité globale', value: `${metrics.readinessPercent}%`, color: [42, 123, 118] },
    { label: 'Exigences Conformes', value: String(metrics.conformeCount), color: [22, 163, 74] },
    { label: 'Exigences Non conformes', value: String(metrics.nonConformeCount), color: [220, 38, 38] },
    {
      label: 'Sous-élém. Conformes',
      value: `${metrics.subItemsDone}/${metrics.subItemsApplicable}`,
      color: [22, 163, 74],
    },
    {
      label: 'En cours / Partiels / Vérif.',
      value: String(metrics.enCoursCount + metrics.partiellementConformeCount + metrics.aVerifierCount),
      color: [217, 119, 6],
    },
    {
      label: 'Non conformes / Non exist.',
      value: String(metrics.subNonConformeCount + metrics.nonExistantCount),
      color: [220, 38, 38],
    },
  ];

  const boxGap = 3;
  const boxW = (contentWidth - boxGap * (kpis.length - 1)) / kpis.length;
  kpis.forEach((kpi, idx) => {
    const bx = margin + idx * (boxW + boxGap);
    doc.setFillColor(248, 250, 249);
    doc.setDrawColor(214, 211, 209);
    doc.setLineWidth(0.25);
    doc.roundedRect(bx, y, boxW, 13, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(120, 113, 108);
    doc.text(kpi.label, bx + 2.8, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...kpi.color);
    doc.text(kpi.value, bx + 2.8, y + 10.5);
  });

  y += 17;

  // Table columns sum = 269mm
  const colWidths = {
    code: 24,
    subLabel: 112,
    status: 38,
    comment: 95,
  };

  const drawTableHeader = (currY: number): number => {
    doc.setFillColor(42, 123, 118);
    doc.rect(margin, currY, contentWidth, 7.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);

    let x = margin + 2;
    doc.text('Code', x, currY + 5);
    x += colWidths.code;
    doc.text('Exigence / Sous-élément', x, currY + 5);
    x += colWidths.subLabel;
    doc.text('Statut', x, currY + 5);
    x += colWidths.status;
    doc.text('Commentaires & observations', x, currY + 5);

    return currY + 7.5;
  };

  y = drawTableHeader(y);

  let currentSection = '';
  for (const item of items) {
    if (item.sectionTitle !== currentSection) {
      currentSection = item.sectionTitle;
      if (y + 14 > bottomLimit) {
        doc.addPage();
        y = drawCitrineOfficialHeader(doc, pageWidth, margin, 10, logoBase64);
        y = drawTableHeader(y);
      }
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, contentWidth, 6.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text(currentSection, margin + 2, y + 4.5);
      y += 6.5;
    }

    const parentStatus = computeParentComplianceStatus(item.subItems || [], item.status);
    const parentLabel = getComplianceStatusMeta(parentStatus).label.toUpperCase();
    const ownerInfo = [item.ownerName, item.ownerRole].filter(Boolean).join(' — ');
    const metaRight = [ownerInfo, item.documentVersion, item.documentDate]
      .filter(Boolean)
      .join(' · ');

    // Parent Row
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    const parentTitleLines = doc.splitTextToSize(item.title, colWidths.subLabel - 3);
    const parentMetaLines = metaRight
      ? doc.splitTextToSize(metaRight, colWidths.comment - 3)
      : [];
    const parentHeight = Math.max(7.5, Math.max(parentTitleLines.length, parentMetaLines.length) * 3.7 + 3);

    if (y + parentHeight > bottomLimit) {
      doc.addPage();
      y = drawCitrineOfficialHeader(doc, pageWidth, margin, 10, logoBase64);
      y = drawTableHeader(y);
    }

    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, contentWidth, parentHeight, 'F');
    doc.setDrawColor(214, 211, 209);
    doc.setLineWidth(0.2);
    doc.line(margin, y + parentHeight, pageWidth - margin, y + parentHeight);

    let px = margin + 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(42, 123, 118);
    doc.text(item.controlCode, px, y + 4.5);

    px += colWidths.code;
    doc.setTextColor(15, 23, 42);
    doc.text(parentTitleLines, px, y + 4.5);

    px += colWidths.subLabel;
    const pRgb = PDF_STATUS_RGB[parentStatus];
    doc.setTextColor(...pRgb);
    doc.text(parentLabel, px, y + 4.5);

    px += colWidths.status;
    if (parentMetaLines.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(100, 116, 139);
      doc.text(parentMetaLines, px, y + 4.5);
    }

    y += parentHeight;

    // Sub-Item Rows
    const subs = item.subItems || [];
    for (const sub of subs) {
      const subStatus = resolveSubItemStatus(sub);
      const subLabel = getComplianceStatusMeta(subStatus).label;
      const subComment = formatSubItemCommentsText(sub) || '—';

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      const sTitleLines = doc.splitTextToSize(`• ${sub.label}`, colWidths.subLabel - 5);
      const sStatusLines = doc.splitTextToSize(subLabel, colWidths.status - 3);
      const sCommentLines = doc.splitTextToSize(subComment, colWidths.comment - 3);

      const sHeight = Math.max(
        6.5,
        Math.max(sTitleLines.length, sStatusLines.length, sCommentLines.length) * 3.5 + 2.5
      );

      if (y + sHeight > bottomLimit) {
        doc.addPage();
        y = drawCitrineOfficialHeader(doc, pageWidth, margin, 10, logoBase64);
        y = drawTableHeader(y);
      }

      doc.setDrawColor(231, 229, 228);
      doc.setLineWidth(0.15);
      doc.line(margin, y + sHeight, pageWidth - margin, y + sHeight);

      let sx = margin + colWidths.code + 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(sTitleLines, sx, y + 4);

      sx = margin + colWidths.code + colWidths.subLabel + 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.3);
      doc.setTextColor(...(PDF_STATUS_RGB[subStatus] || [87, 83, 78]));
      doc.text(sStatusLines, sx, y + 4);

      sx += colWidths.status;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(68, 64, 60);
      doc.text(sCommentLines, sx, y + 4);

      y += sHeight;
    }
  }

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawCitrineOfficialFooter(doc, pageWidth, pageHeight, DEFAULT_COMPANY_INFO, p, totalPages);
  }

  const filename = `Rapport_Conformite_ANTIC_${dateStamp}.pdf`;
  doc.save(filename);
  return filename;
}
