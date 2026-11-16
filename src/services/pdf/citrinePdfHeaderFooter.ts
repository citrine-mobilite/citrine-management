import jsPDF from 'jspdf';
import { CompanyInfo, DEFAULT_COMPANY_INFO } from './pdfCompanyInfo';
import { getCachedPublicLogoDataUrl } from './publicLogoLoader';

export interface OfficialDocumentData {
  id?: string;
  referenceNumber?: string;
  date?: string;
  city?: string;
  logoBase64?: string;
  recipient: {
    salutation?: string;
    roleOrService?: string;
    companyOrDepartment?: string;
    city?: string;
  };
  subject: string;
  salutationText?: string;
  paragraphs: string[];
  closingSalutation?: string;
  signatoryTitle?: string;
  signatoryCompany?: string;
  includeSignature?: boolean;
  signatureType?: 'none' | 'collaborator_only' | 'direction_only' | 'both';
  collaboratorSignatureLabel?: string;
}

export function drawCitrineOfficialHeader(
  doc: jsPDF,
  pageWidth: number = 210,
  margin: number = 20,
  startY: number = 14,
  logoBase64?: string
): number {
  let y = startY;
  const resolvedCandidate =
    logoBase64 && logoBase64.startsWith('data:image/') ? logoBase64 : undefined;
  const imageToUse = resolvedCandidate || getCachedPublicLogoDataUrl();

  let imageRendered = false;
  if (imageToUse) {
    try {
      doc.addImage(imageToUse, 'PNG', margin, y, 52, 15.6, undefined, 'FAST');
      imageRendered = true;
    } catch (err) {
      console.warn('Impossible de charger le logo raster dans le PDF, fallback texte:', err);
    }
  }

  if (!imageRendered) {
    doc.setFont('times', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text('CITRINE SARL', margin, y + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Entreprise de Mobilité & Services Spécialisés', margin, y + 13);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('RÉPUBLIQUE DU CAMEROUN', pageWidth - margin, y + 5, { align: 'right' });
  doc.text('DOCUMENT ADMINISTRATIF OFFICIEL', pageWidth - margin, y + 9, { align: 'right' });

  y = y + 18;
  doc.setDrawColor(212, 168, 47);
  doc.setLineWidth(0.9);
  doc.line(margin, y, pageWidth - margin, y);

  return y + 7;
}

export function drawCitrineOfficialFooter(
  doc: jsPDF,
  pageWidth: number = 210,
  pageHeight: number = 297,
  companyInfo: CompanyInfo = DEFAULT_COMPANY_INFO,
  currentPage: number = 1,
  totalPages: number = 1
): void {
  const footerY = pageHeight - 16;

  doc.setDrawColor(212, 168, 47);
  doc.setLineWidth(0.4);
  doc.line(20, footerY - 4, pageWidth - 20, footerY - 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`${companyInfo.name}  ·  ${companyInfo.address}`, pageWidth / 2, footerY, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Tél. ${companyInfo.phone}  ·  ${companyInfo.email}`, pageWidth / 2, footerY + 3.8, { align: 'center' });

  doc.setFontSize(6.5);
  const legalLine = `SARL au capital de ${companyInfo.capital || '10 000 000 FRANCS CFA'} — NUI : ${companyInfo.nui || 'M012618579246S'} — RCCM : ${companyInfo.rccm || 'CM-DLA-01-2026-B13-00011'}`;
  doc.text(legalLine, pageWidth / 2, footerY + 7.5, { align: 'center' });

  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Page ${currentPage} / ${totalPages}`, pageWidth - 20, footerY + 10.5, { align: 'right' });
}
