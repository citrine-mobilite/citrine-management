import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

/**
 * Export array of objects to Excel (.xlsx) file
 */
export function exportTableToExcel(data: any[], filename: string, sheetName = 'Feuille1') {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch (error) {
    console.error('Error exporting table to Excel:', error);
  }
}

/**
 * Export tabular data to PDF document
 */
export function exportTableToPDF(title: string, headers: string[], data: any[][], filename: string) {
  try {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(16, 122, 79);
    doc.text(title, 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Généré le ${new Date().toLocaleString('fr-FR')} • Citrine Management`, 14, 28);

    let y = 36;
    doc.setFillColor(16, 122, 79); // emerald-700
    doc.rect(14, y, 182, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);

    const colWidth = 182 / headers.length;
    headers.forEach((h, i) => {
      doc.text(String(h).substring(0, 22), 16 + i * colWidth, y + 5.5);
    });

    y += 12;
    doc.setTextColor(40, 40, 40);
    data.forEach((row, rowIndex) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      if (rowIndex % 2 === 1) {
        doc.setFillColor(245, 247, 245);
        doc.rect(14, y - 4, 182, 7, 'F');
      }
      row.forEach((cell, i) => {
        const cellStr = cell !== null && cell !== undefined ? String(cell) : '';
        doc.text(cellStr.substring(0, 28), 16 + i * colWidth, y);
      });
      y += 7;
    });

    doc.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error exporting table to PDF:', error);
  }
}
