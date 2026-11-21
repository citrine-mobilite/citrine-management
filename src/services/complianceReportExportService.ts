import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import { ComplianceChecklistItem, ComplianceStatus } from '../types/complianceTypes';
import {
  computeComplianceMetrics,
  getComplianceStatusMeta,
  prepareComplianceReportRows,
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

const EXCEL_STATUS_COLORS: Record<ComplianceStatus, { fill: string; font: string }> = {
  conforme: { fill: 'FFE8F7EE', font: 'FF166534' },
  en_cours: { fill: 'FFFEF3C7', font: 'FFB45309' },
  non_conforme: { fill: 'FFFEE2E2', font: 'FFB91C1C' },
  a_preparer: { fill: 'FFF5F5F4', font: 'FF44403C' },
  non_existant: { fill: 'FFFFE4E6', font: 'FF9F1239' },
  non_applicable: { fill: 'FFFAFAF9', font: 'FF78716C' },
};

const PDF_STATUS_RGB: Record<ComplianceStatus, [number, number, number]> = {
  conforme: [22, 163, 74],
  en_cours: [217, 119, 6],
  non_conforme: [220, 38, 38],
  a_preparer: [87, 83, 78],
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
 * Exports the ANTIC compliance report into a formatted multi-sheet Excel (.xlsx) workbook.
 */
export async function exportComplianceToExcel(
  items: ComplianceChecklistItem[],
  options: ComplianceExportOptions = {}
): Promise<string> {
  const metrics = computeComplianceMetrics(items);
  const rows = prepareComplianceReportRows(items);
  const dateStamp = new Date().toISOString().split('T')[0];
  const generatedAt = new Date().toLocaleString('fr-FR');

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Citrine Management';
  workbook.created = new Date();

  // Sheet 1: Executive Summary
  const summarySheet = workbook.addWorksheet('Synthèse ANTIC');
  summarySheet.columns = [
    { width: 34 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 22 },
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

  const kpiHeader = summarySheet.addRow(['Indicateur global', 'Valeur']);
  kpiHeader.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2A7B76' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  });

  const kpiRows: Array<[string, string | number]> = [
    ['Taux de préparation (hors N/A)', `${metrics.readinessPercent}%`],
    ['Exigences applicables / Total', `${metrics.totalApplicable} / ${metrics.totalItems}`],
    ['Conforme', metrics.conformeCount],
    ['En cours de conformité', metrics.enCoursCount],
    ['Non conforme', metrics.nonConformeCount],
    ['À préparer', metrics.aPreparerCount],
    ['Non existant (à déclarer)', metrics.nonExistantCount],
    ['Non applicable (N/A)', metrics.nonApplicableCount],
    ['Sous-livrables vérifiés', `${metrics.subItemsDone} / ${metrics.subItemsTotal}`],
  ];
  for (const [label, val] of kpiRows) {
    const r = summarySheet.addRow([label, val]);
    r.getCell(1).font = { bold: true, color: { argb: 'FF292524' } };
    r.getCell(2).alignment = { horizontal: 'right' };
  }

  summarySheet.addRow([]);
  const axisHeader = summarySheet.addRow([
    'Axe ANTIC',
    'Préparation %',
    'Conforme',
    'En cours',
    'Non conforme',
    'Sous-livrables',
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
      axisStat.enCoursCount,
      axisStat.nonConformeCount,
      `${axisStat.subItemsDone}/${axisStat.subItemsTotal}`,
    ]);
  }

  // Sheet 2: Detailed Compliance Matrix
  const detailSheet = workbook.addWorksheet('Détail Conformité', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  detailSheet.columns = [
    { header: 'Code', key: 'controlCode', width: 15 },
    { header: 'Section ANTIC', key: 'sectionTitle', width: 34 },
    { header: 'Exigence / Document demandé', key: 'title', width: 42 },
    { header: 'Statut', key: 'statusLabel', width: 24 },
    { header: 'Sous-livrables', key: 'subItemsSummary', width: 15 },
    { header: 'Détail sous-livrables', key: 'subItemsDetail', width: 45 },
    { header: 'Responsable', key: 'ownerName', width: 24 },
    { header: 'Version', key: 'documentVersion', width: 12 },
    { header: 'Date doc.', key: 'documentDate', width: 14 },
    { header: 'Confidentialité', key: 'confidentiality', width: 15 },
    { header: 'Preuve / Lien', key: 'evidenceUrl', width: 28 },
    { header: 'Commentaires & Notes', key: 'commentsText', width: 46 },
  ];

  const headerRow = detailSheet.getRow(1);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2A7B76' } };
    cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  });

  for (const row of rows) {
    const added = detailSheet.addRow({
      controlCode: row.controlCode,
      sectionTitle: row.sectionTitle,
      title: row.title,
      statusLabel: row.statusLabel,
      subItemsSummary: row.subItemsSummary,
      subItemsDetail: row.subItemsDetail,
      ownerName: row.ownerName,
      documentVersion: row.documentVersion,
      documentDate: row.documentDate,
      confidentiality: row.confidentiality,
      evidenceUrl: row.evidenceUrl,
      commentsText: row.commentsText,
    });

    added.eachCell((cell) => {
      cell.alignment = { vertical: 'top', wrapText: true };
      cell.font = { size: 9.5, color: { argb: 'FF292524' } };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE7E5E4' } },
      };
    });

    const statusCell = added.getCell('statusLabel');
    const style = EXCEL_STATUS_COLORS[row.status] || EXCEL_STATUS_COLORS.a_preparer;
    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: style.fill } };
    statusCell.font = { bold: true, size: 9.5, color: { argb: style.font } };
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
 * Exports the ANTIC compliance report into a formatted Landscape A4 PDF using Citrine official branding.
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
  const rows = prepareComplianceReportRows(items);
  const dateStamp = new Date().toISOString().split('T')[0];
  const generatedAt = new Date().toLocaleString('fr-FR');

  let y = drawCitrineOfficialHeader(doc, pageWidth, margin, 10, logoBase64);

  // Report Title Banner
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

  // Compact KPI Summary Boxes
  const kpis: Array<{ label: string; value: string; color: [number, number, number] }> = [
    { label: 'Préparation', value: `${metrics.readinessPercent}%`, color: [42, 123, 118] },
    { label: 'Conforme', value: String(metrics.conformeCount), color: [22, 163, 74] },
    { label: 'En cours', value: String(metrics.enCoursCount), color: [217, 119, 6] },
    { label: 'Non conforme', value: String(metrics.nonConformeCount), color: [220, 38, 38] },
    { label: 'À préparer', value: String(metrics.aPreparerCount), color: [87, 83, 78] },
    { label: 'Sous-livrables', value: `${metrics.subItemsDone}/${metrics.subItemsTotal}`, color: [42, 123, 118] },
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
    doc.setFontSize(7);
    doc.setTextColor(120, 113, 108);
    doc.text(kpi.label, bx + 3, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...kpi.color);
    doc.text(kpi.value, bx + 3, y + 10.5);
  });

  y += 17;

  // Column widths sum = 269mm
  const colWidths = {
    code: 24,
    title: 82,
    status: 34,
    subs: 20,
    owner: 42,
    comments: 67,
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
    doc.text('Exigence / Document demandé', x, currY + 5);
    x += colWidths.title;
    doc.text('Statut', x, currY + 5);
    x += colWidths.status;
    doc.text('Livrables', x, currY + 5);
    x += colWidths.subs;
    doc.text('Resp. · Ver. · Date', x, currY + 5);
    x += colWidths.owner;
    doc.text('Commentaires & Notes', x, currY + 5);

    return currY + 7.5;
  };

  y = drawTableHeader(y);

  let currentSection = '';
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Section Banner when sectionTitle changes
    if (row.sectionTitle !== currentSection) {
      currentSection = row.sectionTitle;
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

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);

    const titleLines = doc.splitTextToSize(row.title, colWidths.title - 3);
    const statusLines = doc.splitTextToSize(
      getComplianceStatusMeta(row.status).label,
      colWidths.status - 3
    );
    const ownerMeta = [
      row.ownerName || 'Non assigné',
      [row.documentVersion, row.documentDate].filter(Boolean).join(' · '),
    ]
      .filter(Boolean)
      .join('\n');
    const ownerLines = doc.splitTextToSize(ownerMeta, colWidths.owner - 3);
    const commentStr = row.commentsText || '—';
    const commentLines = doc.splitTextToSize(commentStr, colWidths.comments - 3);

    const maxLines = Math.max(
      titleLines.length,
      statusLines.length,
      ownerLines.length,
      commentLines.length,
      1
    );
    const lineHeight = 3.7;
    const rowHeight = Math.max(7.5, maxLines * lineHeight + 3);

    if (y + rowHeight > bottomLimit) {
      doc.addPage();
      y = drawCitrineOfficialHeader(doc, pageWidth, margin, 10, logoBase64);
      y = drawTableHeader(y);
    }

    if (i % 2 === 1) {
      doc.setFillColor(250, 250, 249);
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
    }

    doc.setDrawColor(231, 229, 228);
    doc.setLineWidth(0.2);
    doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);

    const textY = y + 4.3;
    let x = margin + 2;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(42, 123, 118);
    doc.text(row.controlCode, x, textY);

    x += colWidths.code;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(28, 25, 23);
    doc.text(titleLines, x, textY);

    x += colWidths.title;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.6);
    const rgb = PDF_STATUS_RGB[row.status] || [87, 83, 78];
    doc.setTextColor(...rgb);
    doc.text(statusLines, x, textY);

    x += colWidths.status;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(68, 64, 60);
    doc.text(row.subItemsSummary, x, textY);

    x += colWidths.subs;
    doc.setFontSize(7.3);
    doc.setTextColor(68, 64, 60);
    doc.text(ownerLines, x, textY);

    x += colWidths.owner;
    doc.setFontSize(7.4);
    doc.setTextColor(41, 37, 36);
    doc.text(commentLines, x, textY);

    y += rowHeight;
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
