import type ExcelJS from 'exceljs';
import { DEFAULT_COMPANY_INFO } from '../pdf/pdfCompanyInfo';

export const CITRINE_XLSX_COLORS = {
  emeraldDark: 'FF164E4B',
  emeraldMid: 'FF2A7B76',
  emeraldTint: 'FFECFDF5',
  emeraldBorder: 'FFA7F3D0',
  emeraldText: 'FF065F46',
  goldAccent: 'FFD4A82F',
  slateHeader: 'FFF1F5F9',
  slateBg: 'FFF8FAFC',
  slateZebra: 'FFFCFBF9',
  border: 'FFCBD5E1',
  textDark: 'FF0F172A',
  textMuted: 'FF475569',
  white: 'FFFFFFFF',
  amberBg: 'FFFEF3C7',
  amberText: 'FF92400E',
  roseBg: 'FFFEE2E2',
  roseText: 'FF991B1B',
  blueText: 'FF1D4ED8',
  yellowLunchBg: 'FFFEF9C3',
  yellowLunchText: 'FF854D0E',
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: CITRINE_XLSX_COLORS.border } },
  left: { style: 'thin', color: { argb: CITRINE_XLSX_COLORS.border } },
  bottom: { style: 'thin', color: { argb: CITRINE_XLSX_COLORS.border } },
  right: { style: 'thin', color: { argb: CITRINE_XLSX_COLORS.border } },
};

export function styleBannerRow(
  ws: ExcelJS.Worksheet,
  rowIdx: number,
  colCount: number,
  text: string,
  sub?: boolean
) {
  const row = ws.getRow(rowIdx);
  row.getCell(1).value = text;
  ws.mergeCells(rowIdx, 1, rowIdx, colCount);
  row.height = sub ? 22 : 28;
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: sub ? CITRINE_XLSX_COLORS.emeraldMid : CITRINE_XLSX_COLORS.emeraldDark },
    };
    cell.font = {
      name: sub ? 'Calibri' : 'Georgia',
      size: sub ? 11 : 15,
      bold: true,
      color: { argb: CITRINE_XLSX_COLORS.white },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    if (sub) {
      cell.border = {
        bottom: { style: 'medium', color: { argb: CITRINE_XLSX_COLORS.goldAccent } },
      };
    }
  }
}

export function styleOfficialFooterRow(
  ws: ExcelJS.Worksheet,
  rowIdx: number,
  colCount: number
) {
  const row = ws.getRow(rowIdx);
  row.getCell(1).value =
    `${DEFAULT_COMPANY_INFO.name} · ${DEFAULT_COMPANY_INFO.address} (${DEFAULT_COMPANY_INFO.city}, ${DEFAULT_COMPANY_INFO.country}) · Tél. ${DEFAULT_COMPANY_INFO.phone} · ${DEFAULT_COMPANY_INFO.email} · Capital ${DEFAULT_COMPANY_INFO.capital} · NUI : ${DEFAULT_COMPANY_INFO.nui} · RCCM : ${DEFAULT_COMPANY_INFO.rccm}`;
  ws.mergeCells(rowIdx, 1, rowIdx, colCount);
  row.height = 24;
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: CITRINE_XLSX_COLORS.slateHeader },
    };
    cell.font = {
      name: 'Calibri',
      size: 8.5,
      bold: true,
      color: { argb: CITRINE_XLSX_COLORS.textMuted },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'medium', color: { argb: CITRINE_XLSX_COLORS.goldAccent } },
      bottom: { style: 'thin', color: { argb: CITRINE_XLSX_COLORS.border } },
    };
  }
}

export function applyOfficialExcelHeaderFooter(ws: ExcelJS.Worksheet) {
  ws.headerFooter = {
    oddHeader: `&L&B${DEFAULT_COMPANY_INFO.name}&B — ${DEFAULT_COMPANY_INFO.subTitle}&RRépublique du Cameroun · Document Officiel`,
    oddFooter: `&C${DEFAULT_COMPANY_INFO.name} · ${DEFAULT_COMPANY_INFO.address} · NUI : ${DEFAULT_COMPANY_INFO.nui} · RCCM : ${DEFAULT_COMPANY_INFO.rccm} · Page &P / &N`,
  };
}

export function styleSectionHeaderRow(
  ws: ExcelJS.Worksheet,
  rowIdx: number,
  colCount: number,
  title: string
) {
  const row = ws.getRow(rowIdx);
  row.getCell(1).value = title;
  ws.mergeCells(rowIdx, 1, rowIdx, colCount);
  row.height = 22;
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: CITRINE_XLSX_COLORS.emeraldDark },
    };
    cell.font = {
      name: 'Calibri',
      size: 10.5,
      bold: true,
      color: { argb: CITRINE_XLSX_COLORS.white },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  }
}

export function styleColumnHeadersRow(
  ws: ExcelJS.Worksheet,
  rowIdx: number,
  headers: string[],
  alignments?: Array<'left' | 'center' | 'right'>
) {
  const row = ws.getRow(rowIdx);
  row.height = 21;
  headers.forEach((h, i) => {
    const cell = row.getCell(i + 1);
    cell.value = h;
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: CITRINE_XLSX_COLORS.emeraldMid },
    };
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: CITRINE_XLSX_COLORS.white } };
    cell.alignment = { vertical: 'middle', horizontal: alignments?.[i] || 'left', wrapText: true };
    cell.border = THIN_BORDER;
  });
}

export function applyCellBox(
  cell: ExcelJS.Cell,
  options?: {
    bg?: string;
    color?: string;
    bold?: boolean;
    italic?: boolean;
    align?: 'left' | 'center' | 'right';
    size?: number;
  }
) {
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: options?.bg || CITRINE_XLSX_COLORS.white },
  };
  cell.font = {
    name: 'Calibri',
    size: options?.size || 10,
    bold: Boolean(options?.bold),
    italic: Boolean(options?.italic),
    color: { argb: options?.color || CITRINE_XLSX_COLORS.textDark },
  };
  cell.alignment = {
    vertical: 'middle',
    horizontal: options?.align || 'left',
    wrapText: true,
  };
  cell.border = THIN_BORDER;
}

export function applyStatusBadgeStyle(cell: ExcelJS.Cell, status: string) {
  const s = (status || '').toLowerCase();
  if (s.includes('fait') || s.includes('justifi') || s.includes('résolu') || s.includes('normal')) {
    applyCellBox(cell, { bg: CITRINE_XLSX_COLORS.emeraldTint, color: CITRINE_XLSX_COLORS.emeraldText, bold: true, align: 'center' });
  } else if (s.includes('bloqu') || s.includes('non régul') || s.includes('surcharge')) {
    applyCellBox(cell, { bg: CITRINE_XLSX_COLORS.roseBg, color: CITRINE_XLSX_COLORS.roseText, bold: true, align: 'center' });
  } else if (s.includes('cours')) {
    applyCellBox(cell, { bg: CITRINE_XLSX_COLORS.amberBg, color: CITRINE_XLSX_COLORS.amberText, bold: true, align: 'center' });
  } else {
    applyCellBox(cell, { bg: CITRINE_XLSX_COLORS.slateHeader, color: CITRINE_XLSX_COLORS.textMuted, bold: true, align: 'center' });
  }
}

export function applyPriorityStyle(cell: ExcelJS.Cell, prio: string) {
  const color = prio === 'P1' ? CITRINE_XLSX_COLORS.roseText : prio === 'P2' ? CITRINE_XLSX_COLORS.blueText : CITRINE_XLSX_COLORS.amberText;
  applyCellBox(cell, { color, bold: true, align: 'center' });
}
