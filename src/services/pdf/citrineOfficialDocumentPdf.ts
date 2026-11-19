import jsPDF from 'jspdf';
import { CompanyInfo, DEFAULT_COMPANY_INFO } from './pdfCompanyInfo';
import { CITRINE_DEFAULT_LOGO_BASE64 } from '../../assets/citrineLogoBase64';

export interface OfficialDocumentData {
  id?: string;
  referenceNumber?: string;
  date?: string;
  city?: string;
  logoBase64?: string; // Image matricielle (PNG/JPEG base64) stockée en base de données Firestore
  recipient: {
    salutation?: string; // ex: "À Monsieur/Madame le Directeur" ou "À Monsieur Kouam Marc"
    roleOrService?: string; // ex: "d'Agence BFI" ou "Conducteur d'Engins"
    companyOrDepartment?: string; // ex: "BFI Bank" ou "Direction des Travaux"
    city?: string; // ex: "Douala"
  };
  subject: string; // Objet : ...
  salutationText?: string; // ex: "Monsieur/Madame le Directeur," ou "Cher collaborateur,"
  paragraphs: string[]; // Corps du document découpé en paragraphes
  closingSalutation?: string; // Formule de politesse
  signatoryTitle?: string; // ex: "Le Directeur Général" ou "Le Responsable des Ressources Humaines"
  signatoryCompany?: string; // Défaut: "Pour CITRINE SARL"
  includeSignature?: boolean; // IMPORTANT : FALSE par défaut (la signature ne doit pas être par défaut)
  signatureType?: 'none' | 'collaborator_only' | 'direction_only' | 'both';
  collaboratorSignatureLabel?: string;
}

/**
 * Dessine l'en-tête officiel de CITRINE SARL en utilisant l'image matricielle (PNG)
 * stockée en base de données ou l'image officielle, sans jamais générer de SVG.
 */
export function drawCitrineOfficialHeader(
  doc: jsPDF,
  pageWidth: number = 210,
  margin: number = 20,
  startY: number = 14,
  logoBase64?: string
): number {
  let y = startY;
  const imageToUse = logoBase64 || CITRINE_DEFAULT_LOGO_BASE64;

  // 1. Insertion directe de l'image matricielle (PNG) stockée en BD
  let imageRendered = false;
  if (imageToUse) {
    try {
      // Dimensions harmonieuses pour l'en-tête A4 (largeur 52mm, hauteur 15.6mm)
      const logoWidth = 52;
      const logoHeight = 15.6;
      doc.addImage(imageToUse, 'PNG', margin, y, logoWidth, logoHeight, undefined, 'FAST');
      imageRendered = true;
    } catch (err) {
      console.warn('Impossible de charger le logo raster dans le PDF, fallback texte:', err);
    }
  }

  if (!imageRendered) {
    // Fallback texte sobre si indisponible
    doc.setFont('times', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text('CITRINE SARL', margin, y + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Entreprise de Mobilité & Services Spécialisés', margin, y + 13);
  }

  // Mention officielle discrète à droite
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('RÉPUBLIQUE DU CAMEROUN', pageWidth - margin, y + 5, { align: 'right' });
  doc.text('DOCUMENT ADMINISTRATIF OFFICIEL', pageWidth - margin, y + 9, { align: 'right' });

  // 2. LIGNE SÉPARATRICE HORIZONTALE DORÉE (signature visuelle de l'en-tête)
  y = y + 18;
  doc.setDrawColor(212, 168, 47); // Or Citrine #D4A82F
  doc.setLineWidth(0.9);
  doc.line(margin, y, pageWidth - margin, y);

  return y + 7;
}

/**
 * Dessine le pied de page réglementaire OHADA de CITRINE SARL
 */
export function drawCitrineOfficialFooter(
  doc: jsPDF,
  pageWidth: number = 210,
  pageHeight: number = 297,
  companyInfo: CompanyInfo = DEFAULT_COMPANY_INFO,
  currentPage: number = 1,
  totalPages: number = 1
): void {
  const footerY = pageHeight - 16;

  // Ligne de séparation discrète au-dessus du pied de page
  doc.setDrawColor(212, 168, 47); // Liseré doré Citrine
  doc.setLineWidth(0.4);
  doc.line(20, footerY - 4, pageWidth - 20, footerY - 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `${companyInfo.name}  ·  ${companyInfo.address}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Tél. ${companyInfo.phone}  ·  ${companyInfo.email}`,
    pageWidth / 2,
    footerY + 3.8,
    { align: 'center' }
  );

  doc.setFontSize(6.5);
  const legalLine = `SARL au capital de ${companyInfo.capital || '10 000 000 FRANCS CFA'} — NUI : ${companyInfo.nui || 'M012618579246S'} — RCCM : ${companyInfo.rccm || 'CM-DLA-01-2026-B13-00011'}`;
  doc.text(legalLine, pageWidth / 2, footerY + 7.5, { align: 'center' });

  // Numéro de page
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Page ${currentPage} / ${totalPages}`, pageWidth - 20, footerY + 10.5, { align: 'right' });
}

/**
 * Générateur PDF universel appliquant rigoureusement le papier à en-tête officiel CITRINE SARL
 */
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

  // 1. En-tête officiel avec l'image matricielle conservée en BD
  let y = drawCitrineOfficialHeader(doc, pageWidth, margin, 14, data.logoBase64);

  // 2. Bloc Émetteur (Gauche)
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

  doc.setTextColor(37, 99, 235); // Bleu lien email
  doc.text(`E-mail : ${companyInfo.email}`, leftX, y + 13.5);

  const refCode = data.referenceNumber || `N° ${String(Math.floor(100000 + Math.random() * 900000))}/Admin/${new Date().getFullYear()}`;
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.text(`Réf. : ${refCode}`, leftX, y + 21);

  // 3. Bloc Date & Destinataire (Droite)
  const rightX = pageWidth - margin;
  const docDate = data.date
    ? new Date(data.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`${data.city || 'Douala'}, le ${docDate}`, rightX, y + 10, { align: 'right' });

  // Destinataire
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

  // 4. Objet de la lettre (Gras & Souligné)
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

  // 5. Formule d'appel
  y += 9;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(data.salutationText || "Monsieur/Madame,", margin, y);
  y += 7;

  // 6. Corps du document (Paragraphes justifiés)
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

    // Gestion saut de page si débordement
    if (y > pageHeight - 55) {
      drawCitrineOfficialFooter(doc, pageWidth, pageHeight, companyInfo, 1, 1);
      doc.addPage();
      y = drawCitrineOfficialHeader(doc, pageWidth, margin, 14);
    }
  }

  // 7. Formule de politesse de clôture (si non incluse dans les paragraphes)
  if (data.closingSalutation) {
    const closingLines = doc.splitTextToSize(data.closingSalutation, contentWidth);
    doc.text(closingLines, margin, y);
    y += closingLines.length * 4.8 + 8;
  } else {
    y += 4;
  }

  // 8. Signature (NON PAR DÉFAUT : uniquement si data.includeSignature est vrai ou signatureType explicite)
  if (data.includeSignature) {
    if (data.signatureType === 'both') {
      // Double signature : Employeur à gauche, Salarié/Destinataire à droite
      const colWidth = contentWidth / 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);

      // Bloc Employeur
      doc.text(data.signatoryCompany || 'Pour CITRINE SARL', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(data.signatoryTitle || 'La Direction Générale', margin, y + 4.5);
      doc.text('(Signature & Cachet Officiel)', margin, y + 9);

      // Bloc Destinataire / Salarié
      const col2X = margin + colWidth + 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(data.collaboratorSignatureLabel || 'Pour accord / Le Salarié', col2X, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('(Mention manuscrite "Lu et approuvé" & Signature)', col2X, y + 4.5);
    } else {
      // Signature Direction Générale unique
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
    // Par défaut : aucune signature électronique pré-apposée
    // Intitulé officiel de la direction avec espace net sans cadre ni mention superflue
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

  // 9. Pied de page réglementaire
  drawCitrineOfficialFooter(doc, pageWidth, pageHeight, companyInfo, 1, 1);

  return doc;
}
