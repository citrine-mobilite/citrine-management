import jsPDF from 'jspdf';
import { CompanyInfo, DEFAULT_COMPANY_INFO } from './pdfCompanyInfo';
import {
  OfficialDocumentData,
  drawCitrineOfficialHeader,
  drawCitrineOfficialFooter,
} from './citrinePdfHeaderFooter';

export type { OfficialDocumentData };
export { drawCitrineOfficialHeader, drawCitrineOfficialFooter };

export function generateCitrineOfficialDocumentPdf(
  data: OfficialDocumentData,
  companyInfo: CompanyInfo = DEFAULT_COMPANY_INFO
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  let y = drawCitrineOfficialHeader(doc, pageWidth, margin, 14, data.logoBase64);

  const leftX = margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text(companyInfo.name, leftX, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(companyInfo.address, leftX, y + 4.5);
  doc.text(`Tél. : ${companyInfo.phone}`, leftX, y + 9);

  doc.setTextColor(37, 99, 235);
  doc.text(`E-mail : ${companyInfo.email}`, leftX, y + 13.5);

  const refCode = data.referenceNumber || `N° ${String(Math.floor(100000 + Math.random() * 900000))}/Admin/${new Date().getFullYear()}`;
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.text(`Réf. : ${refCode}`, leftX, y + 21);

  const rightX = pageWidth - margin;
  const docDate = data.date
    ? new Date(data.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`${data.city || 'Douala'}, le ${docDate}`, rightX, y + 10, { align: 'right' });

  let recipientY = y + 22;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);

  if (data.recipient.salutation) {
    doc.text(data.recipient.salutation, rightX, recipientY, { align: 'right' });
    recipientY += 4.5;
  }
  if (data.recipient.roleOrService) {
    doc.text(data.recipient.roleOrService, rightX, recipientY, { align: 'right' });
    recipientY += 4.5;
  }
  if (data.recipient.companyOrDepartment) {
    doc.text(data.recipient.companyOrDepartment, rightX, recipientY, { align: 'right' });
    recipientY += 4.5;
  }
  doc.text(data.recipient.city || 'Douala', rightX, recipientY, { align: 'right' });

  y = Math.max(y + 32, recipientY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);

  const objetText = `Objet : ${data.subject}`;
  doc.text(objetText, margin, y);
  const textWidth = doc.getTextWidth(objetText);
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.line(margin, y + 1, margin + textWidth, y + 1);

  y += 9;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(data.salutationText || 'Monsieur/Madame,', margin, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);

  for (const para of data.paragraphs) {
    if (!para.trim()) {
      y += 3;
      continue;
    }
    const lines = doc.splitTextToSize(para.trim(), contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 4.8 + 4;

    if (y > pageHeight - 55) {
      drawCitrineOfficialFooter(doc, pageWidth, pageHeight, companyInfo, 1, 1);
      doc.addPage();
      y = drawCitrineOfficialHeader(doc, pageWidth, margin, 14);
    }
  }

  if (data.closingSalutation) {
    const closingLines = doc.splitTextToSize(data.closingSalutation, contentWidth);
    doc.text(closingLines, margin, y);
    y += closingLines.length * 4.8 + 8;
  } else {
    y += 4;
  }

  if (data.includeSignature) {
    if (data.signatureType === 'both') {
      const colWidth = contentWidth / 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(data.signatoryCompany || 'Pour CITRINE SARL', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(data.signatoryTitle || 'La Direction Générale', margin, y + 4.5);
      doc.text('(Signature & Cachet Officiel)', margin, y + 9);

      const col2X = margin + colWidth + 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(data.collaboratorSignatureLabel || 'Pour accord / Le Salarié', col2X, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('(Mention manuscrite "Lu et approuvé" & Signature)', col2X, y + 4.5);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(data.signatoryCompany || 'Pour CITRINE SARL', margin, y);
      y += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(data.signatoryTitle || 'La Direction Générale', margin, y);
      y += 4.5;
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7.5);
      doc.text('[Signature & Cachet Électronique Apposés]', margin, y);
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(data.signatoryCompany || 'Pour CITRINE SARL', margin, y);
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(data.signatoryTitle || 'La Direction Générale', margin, y);
    y += 18;
  }

  drawCitrineOfficialFooter(doc, pageWidth, pageHeight, companyInfo, 1, 1);
  return doc;
}
