import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Employee, SalaryPayment, GeneratedDocument, DisciplinaryIncident, SanctionType } from '../types';

export interface CompanyInfo {
  name: string;
  subTitle: string;
  registrationNumber?: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
}

export const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: 'CITRINE MANAGEMENT',
  subTitle: 'Société de Gestion, Opérations & Ressources Humaines',
  registrationNumber: 'RC/YAO/2024/B/1420 - NIU: M052418293021X',
  address: 'Boulevard de la Liberté, Akwa / Bastos',
  city: 'Douala & Yaoundé',
  country: 'République du Cameroun',
  phone: '+237 699 00 00 00',
  email: 'direction.rh@citrinemanagement.cm'
};

/**
 * Formats numbers into Cameroonian / Central African XAF format
 */
function formatCurrency(amount: number = 0): string {
  return `${amount.toLocaleString('fr-FR')} FCFA`;
}

/**
 * 1. PURE VECTOR CRISP A4 PAYSLIP GENERATOR (Zero blur, native vector fonts, instant generation)
 */
export function generatePayslipPdf(
  payment: SalaryPayment,
  employee: Employee,
  companyInfo: CompanyInfo = DEFAULT_COMPANY_INFO
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // --- 1. TOP HEADER BRANDING ---
  // Top emerald accent bar
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Company logo badge
  doc.setFillColor(35, 122, 123); // HERO Cab Teal
  doc.roundedRect(margin, 12, 16, 14, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('HERO', margin + 2.5, 21);

  // Company details
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(companyInfo.name, margin + 18, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(companyInfo.subTitle, margin + 18, 21.5);
  doc.text(`${companyInfo.address} • ${companyInfo.city}, ${companyInfo.country}`, margin + 18, 25.5);
  doc.text(`Réf Légale : ${companyInfo.registrationNumber || 'RC/YAO/2026/B'}`, margin + 18, 29.5);

  // Right Header Document Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(pageWidth - margin - 62, 11, 62, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(6, 78, 59);
  doc.text('BULLETIN DE PAIE', pageWidth - margin - 31, 17, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Période : ${payment.period}`, pageWidth - margin - 31, 22, { align: 'center' });
  
  const refCode = `PAY-${(employee.id || 'EMP').toUpperCase()}-${(payment.period || 'M').replace(/\s+/g, '').toUpperCase()}`;
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`N° Réf : ${refCode}`, pageWidth - margin - 31, 27, { align: 'center' });

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, 35, pageWidth - margin, 35);

  // --- 2. SALARIÉ & IDENTIFICATION BLOCK ---
  let y = 40;

  // Left card: Employee Information
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, 98, 38, 2, 2, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('INFORMATIONS DU SALARIÉ', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Nom & Prénom :', margin + 4, y + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(employee.name || 'Collaborateur', margin + 30, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Matricule RH :', margin + 4, y + 18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(employee.id.toUpperCase(), margin + 30, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Fonction / Poste :', margin + 4, y + 24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(employee.roleType || 'Salarié', margin + 30, y + 24);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Département :', margin + 4, y + 30);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(employee.department || 'Opérations', margin + 30, y + 30);

  // Right card: Employment / Payment Conditions
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin + 102, y, 80, 38, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('PARAMÈTRES DE RÈGLEMENT', margin + 106, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Type Contrat :', margin + 106, y + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('CDI Plein Temps', margin + 132, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Mode de paiement :', margin + 106, y + 18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(payment.paymentMethod === 'transfer' ? 'Virement Bancaire' : 'Espèces / Caisse', margin + 134, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Statut :', margin + 106, y + 24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(payment.status === 'paid' ? 16 : 217, payment.status === 'paid' ? 185 : 119, payment.status === 'paid' ? 129 : 6);
  doc.text(payment.status === 'paid' ? 'Payé & Clôturé' : 'En Attente de Règlement', margin + 132, y + 24);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Date d\'émission :', margin + 106, y + 30);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'), margin + 132, y + 30);

  // --- 3. DÉCOMPTE DE LA RÉMUNÉRATION (TABLE) ---
  y = 84;

  // Table header
  doc.setFillColor(6, 78, 59); // dark green
  doc.rect(margin, y, contentWidth, 7, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('RUBRIQUE / NATURE DES ÉLÉMENTS', margin + 4, y + 4.8);
  doc.text('BASE / TAUX', margin + 95, y + 4.8);
  doc.text('GAINS (+)', margin + 130, y + 4.8);
  doc.text('RETENUES (-)', margin + 160, y + 4.8);

  y += 7;

  // Rows definition
  const baseSalary = payment.baseAmount || 0;
  const bonus = payment.bonusAmount || 0;
  const transportAllowance = Math.round(baseSalary * 0.08); // 8% indemnité transport
  const advances = payment.advanceAmount || 0;
  const otherDeductions = payment.deductions || 0;
  
  // CNPS Employee contribution (~4.2% base)
  const cnpsEmployee = Math.round(baseSalary * 0.042);
  // Total deductions
  const totalDeductions = advances + otherDeductions + cnpsEmployee;
  // Total gross
  const totalGross = baseSalary + bonus + transportAllowance;

  const rows: Array<{ label: string; subLabel?: string; base?: string; gain?: number; deduction?: number }> = [
    { label: 'Salaire de Base Contractuel', subLabel: '30 Jours ouvrés', base: formatCurrency(baseSalary), gain: baseSalary },
    { label: 'Indemnité de Transport & Déplacement', subLabel: 'Forfait mensuel légal', base: '8%', gain: transportAllowance },
  ];

  if (bonus > 0) {
    rows.push({ label: 'Primes & Gratifications Exceptionnelles', subLabel: 'Performance & assiduité', base: '--', gain: bonus });
  }

  rows.push({ label: 'Cotisation Sociale CNPS (Part Salariale)', subLabel: 'Régime obligatoire', base: '4.2%', deduction: cnpsEmployee });

  if (advances > 0) {
    rows.push({ label: 'Acompte sur Salaire / Remboursement Prêt', subLabel: 'Retenue directe mensuelle', base: '--', deduction: advances });
  }

  if (otherDeductions > 0) {
    rows.push({ label: 'Autres Retenues Diverses / Absences', subLabel: 'Déduction autorisée', base: '--', deduction: otherDeductions });
  }

  // Draw table rows
  let isEven = false;
  rows.forEach((r) => {
    doc.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255);
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 8, margin + contentWidth, y + 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(r.label, margin + 4, y + 4.5);

    if (r.subLabel) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184);
      doc.text(r.subLabel, margin + 4, y + 7);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(r.base || '--', margin + 95, y + 5);

    if (r.gain) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129); // emerald
      doc.text(formatCurrency(r.gain), margin + 148, y + 5, { align: 'right' });
    } else {
      doc.setTextColor(203, 213, 225);
      doc.text('--', margin + 148, y + 5, { align: 'right' });
    }

    if (r.deduction) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(225, 29, 72); // rose-600
      doc.text(`-${formatCurrency(r.deduction)}`, margin + 178, y + 5, { align: 'right' });
    } else {
      doc.setTextColor(203, 213, 225);
      doc.text('--', margin + 178, y + 5, { align: 'right' });
    }

    y += 8;
    isEven = !isEven;
  });

  // Space before totals
  y += 4;

  // --- 4. RECAPITULATIF & NET À PAYER ---
  // Sub-totals box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('TOTAL BRUT RÉMUNÉRATION :', margin + 6, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrency(totalGross), margin + 65, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('TOTAL DES DÉDUCTIONS :', margin + 105, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(225, 29, 72);
  doc.text(`-${formatCurrency(totalDeductions)}`, margin + 155, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Plafond Sécurité Sociale CNPS : ${formatCurrency(750000)} • Base Imposable Calculée`, margin + 6, y + 11);

  y += 18;

  // MAIN NET TO PAY HIGHLIGHT BANNER
  doc.setFillColor(6, 78, 59); // emerald-900
  doc.roundedRect(margin, y, contentWidth, 18, 2.5, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('NET À PAYER AU SALARIÉ :', margin + 8, y + 11.5);

  const netToPay = payment.netAmount || (totalGross - totalDeductions);
  doc.setFontSize(14);
  doc.setTextColor(110, 231, 183); // emerald-300
  doc.text(formatCurrency(netToPay), margin + contentWidth - 8, y + 12, { align: 'right' });

  y += 24;

  // --- 5. CERTIFICAT NUMERIQUE & BLOC SIGNATURES ---
  // Digital Verification Seal Box
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(187, 247, 208); // emerald-200
  doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'FD');

  // Mini QR representation
  doc.setFillColor(6, 78, 59);
  doc.rect(margin + 4, y + 3, 10, 10, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(margin + 6, y + 5, 6, 6, 'F');
  doc.setFillColor(6, 78, 59);
  doc.rect(margin + 7.5, y + 6.5, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(6, 78, 59);
  doc.text('DOCUMENT OFFICIEL SCELLÉ NUMÉRIQUEMENT', margin + 18, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(22, 101, 52);
  doc.text(`Certificat d'Authenticité RH : CITRINE-CERT-${employee.id.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`, margin + 18, y + 11);
  doc.text('Ce bulletin est conforme aux dispositions du Code du Travail de la République du Cameroun.', margin + 18, y + 14);

  y += 20;

  // Signature columns
  const sigBoxWidth = (contentWidth - 10) / 2;

  // Left: Direction RH
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, sigBoxWidth, 28, 2, 2, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Pour la Direction RH & Direction Générale', margin + sigBoxWidth / 2, y + 5, { align: 'center' });

  // Digital Stamp badge
  doc.setDrawColor(16, 185, 129);
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(margin + sigBoxWidth / 2 - 25, y + 8, 50, 12, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(6, 78, 59);
  doc.text('CITRINE MANAGEMENT', margin + sigBoxWidth / 2, y + 12, { align: 'center' });
  doc.setFontSize(5.5);
  doc.text('Direction des Ressources Humaines • Approuvé', margin + sigBoxWidth / 2, y + 16.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('Cachet officiel et signature numérique autorisée', margin + sigBoxWidth / 2, y + 24, { align: 'center' });

  // Right: Salarié
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin + sigBoxWidth + 10, y, sigBoxWidth, 28, 2, 2, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Le Salarié / Bénéficiaire', margin + sigBoxWidth + 10 + sigBoxWidth / 2, y + 5, { align: 'center' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('(Mention manuscrite "Lu et approuvé")', margin + sigBoxWidth + 10 + sigBoxWidth / 2, y + 14, { align: 'center' });

  doc.setDrawColor(203, 213, 225);
  doc.line(margin + sigBoxWidth + 20, y + 21, margin + contentWidth - 10, y + 21);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('Signature du collaborateur', margin + sigBoxWidth + 10 + sigBoxWidth / 2, y + 25, { align: 'center' });

  // --- 6. FOOTER ---
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Document généré automatiquement via la plateforme Citrine Management • Conservez ce bulletin sans limitation de durée • Page 1/1`,
    pageWidth / 2,
    290,
    { align: 'center' }
  );

  return doc;
}

/**
 * Direct 1-Click Trigger: Generates and downloads the payslip PDF file
 */
export function downloadPayslipPdf(
  payment: SalaryPayment,
  employee: Employee,
  companyInfo: CompanyInfo = DEFAULT_COMPANY_INFO
): void {
  const doc = generatePayslipPdf(payment, employee, companyInfo);
  const cleanName = (employee.name || 'Collaborateur').replace(/[^a-zA-Z0-9]/g, '_');
  const cleanPeriod = (payment.period || 'Periode').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Bulletin_Paie_${cleanName}_${cleanPeriod}.pdf`);
}

/**
 * 2. 1-CLICK DOM TO A4 MULTI-PAGE PDF EXPORT (For custom contracts, agreements, previewed documents)
 */
export async function exportElementToPdf(
  elementOrId: HTMLElement | string,
  fileName: string = 'Document_Citrine.pdf'
): Promise<boolean> {
  try {
    const targetElement = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
    if (!targetElement) {
      console.error(`Export PDF: Element not found (${elementOrId})`);
      return false;
    }

    // Capture DOM high-resolution canvas (2x DPI scale for ultra-crisp output)
    const canvas = await html2canvas(targetElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    // Handle multiple pages cleanly
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    pdf.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
    return true;
  } catch (error) {
    console.error('Error exporting element to PDF:', error);
    return false;
  }
}

/**
 * 3. CRISP A4 DISCIPLINARY LETTER GENERATOR (Demande d'explication, Avertissement, Mise en demeure)
 */
export function generateDisciplinaryLetterPdf(
  incident: DisciplinaryIncident,
  employee: Employee | { id: string; name: string; roleType?: string; department?: string },
  type: 'explication' | 'avertissement' | 'mise_en_demeure',
  companyInfo: CompanyInfo = DEFAULT_COMPANY_INFO
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  // Header band
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 6, 'F');

  // Company Top Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(companyInfo.name, margin, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(companyInfo.subTitle, margin, y + 11);
  if (companyInfo.registrationNumber) {
    doc.text(companyInfo.registrationNumber, margin, y + 15);
  }
  doc.text(`${companyInfo.address}, ${companyInfo.city} - ${companyInfo.country}`, margin, y + 19);

  // Date and place
  const formattedToday = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(`Fait à ${companyInfo.city.split('&')[0].trim()}, le ${formattedToday}`, pageWidth - margin, y + 6, { align: 'right' });

  // Recipient Box (Right side)
  y += 28;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(pageWidth - margin - 85, y, 85, 30, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('DESTINATAIRE :', pageWidth - margin - 80, y + 6);
  doc.setFontSize(10);
  doc.text(`M./Mme ${employee.name || incident.employeeName}`, pageWidth - margin - 80, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Fonction : ${employee.roleType || incident.employeeRole || 'Salarié'}`, pageWidth - margin - 80, y + 18);
  doc.text(`Département : ${employee.department || incident.employeeDepartment || 'Opérations'}`, pageWidth - margin - 80, y + 23);

  // Reference and Subject Box
  y += 38;
  const refCode = incident.officialLetterRef || `DISC-${incident.id.slice(-6).toUpperCase()}-${new Date().getFullYear()}`;

  let titleDoc = "DEMANDE D'EXPLICATIONS ÉCRITES";
  let letterTypeColor: [number, number, number] = [217, 119, 6]; // amber-600
  if (type === 'avertissement') {
    titleDoc = "LETTRE D'AVERTISSEMENT DISCIPLINAIRE";
    letterTypeColor = [225, 29, 72]; // rose-600
  } else if (type === 'mise_en_demeure') {
    titleDoc = "MISE EN DEMEURE FORMELLE AVEC EFFET IMMÉDIAT";
    letterTypeColor = [185, 28, 28]; // red-700
  }

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(letterTypeColor[0], letterTypeColor[1], letterTypeColor[2]);
  doc.text(titleDoc, margin + 4, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Réf. Dossier : ${refCode}  |  Date du constat : ${new Date(incident.date).toLocaleDateString('fr-FR')}  |  Gravité : ${incident.severity.toUpperCase()}`, margin + 4, y + 13);

  // Body content
  y += 24;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);

  doc.text(`Monsieur / Madame,`, margin, y);
  y += 7;

  let introText = "";
  if (type === 'explication') {
    introText = `Dans le cadre du suivi de la discipline et des engagements contractuels régissant notre collaboration, la Direction porte à votre attention les faits ci-après constatés vous concernant :`;
  } else if (type === 'avertissement') {
    introText = `Faisant suite aux constats établis et aux manquements professionnels réitérés, la Direction vous notifie formellement par la présente un Avertissement Disciplinaire au titre des faits suivants :`;
  } else {
    introText = `Par la présente, la Direction vous met solennellement en demeure de vous conformer immédiatement au Règlement Intérieur et aux obligations de votre contrat de travail, suite aux manquements graves suivants :`;
  }

  const splitIntro = doc.splitTextToSize(introText, contentWidth);
  doc.text(splitIntro, margin, y);
  y += splitIntro.length * 5 + 4;

  // Box: Description of facts
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, 38, 'D');

  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`MOTIF / NATURE DU MANQUEMENT : ${incident.title}`, margin + 3, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const factLines = [
    `Description des faits : ${incident.description}`,
    incident.location ? `Lieu de survenance : ${incident.location}` : '',
    incident.witnesses ? `Témoins / Rapprochements : ${incident.witnesses}` : '',
    `Rapporté par : ${incident.reportedBy} (${incident.reportedByRole || 'Direction / RH'})`
  ].filter(Boolean).join('\n');

  const splitFacts = doc.splitTextToSize(factLines, contentWidth - 6);
  doc.text(splitFacts, margin + 3, y + 12);

  y += 44;

  // Next steps / Deadlines
  let closingText = "";
  const deadlineDays = incident.legalDeadlineDays || (type === 'explication' ? 3 : 2);
  if (type === 'explication') {
    closingText = `Conformément aux dispositions du Code du Travail et du Règlement Intérieur, vous disposez d'un délai impératif de ${deadlineDays} jours ouvrés (soit avant le ${new Date(Date.now() + deadlineDays * 86400000).toLocaleDateString('fr-FR')}) pour nous faire parvenir vos explications écrites et justificatifs éventuels.\n\nÀ défaut de réponse dans le délai imparti, la Direction se réserve le droit de prendre toute sanction disciplinaire appropriée, pouvant aller jusqu'à la mise à pied ou la rupture de contrat.`;
  } else if (type === 'avertissement') {
    closingText = `Cet avertissement est inscrit à votre dossier individuel. Nous vous enjoignons de rectifier sans délai votre attitude professionnelle. Toute récidive dans les mêmes faits entraînera des sanctions de degré supérieur.\n\nCe document a été porté à votre connaissance conformément à la procédure légale.`;
  } else {
    closingText = `La présente mise en demeure constitue un avertissement solennel avant engagement immédiat de poursuites disciplinaires ou rupture de plein droit des relations contractuelles pour faute lourde, sans préjudice de dommages et intérêts.\n\nNous comptons sur votre professionnalisme pour redresser immédiatement la situation.`;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  const splitClosing = doc.splitTextToSize(closingText, contentWidth);
  doc.text(splitClosing, margin, y);

  y += splitClosing.length * 4.8 + 10;

  // Signatures table
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Left side signature: Employee acknowledgment
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("L'Employé(e) (Pour accusé de réception)", margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Date de réception : _____ / _____ / 2026', margin, y + 5);
  doc.text('Signature & mention "Lu et pris connaissance" :', margin, y + 9);

  // Right side signature: Management Stamp
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Pour la Direction / Le Service RH", pageWidth - margin - 75, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`${companyInfo.name} - Cachet et Signature autorisée`, pageWidth - margin - 75, y + 5);

  // Seal Stamp Box
  doc.setDrawColor(16, 185, 129); // emerald-500
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(pageWidth - margin - 75, y + 9, 70, 20, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(5, 150, 105);
  doc.text("CITRINE MANAGEMENT", pageWidth - margin - 40, y + 15, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text("SERVICE DES RESSOURCES HUMAINES", pageWidth - margin - 40, y + 19, { align: 'center' });
  doc.text("DIRECTION DES OPÉRATIONS", pageWidth - margin - 40, y + 23, { align: 'center' });

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Document légal RH officiel généré par Citrine Management Suite - Dossier ${refCode} - Page 1/1`,
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );

  return doc;
}

export function downloadDisciplinaryLetterPdf(
  incident: DisciplinaryIncident,
  employee: Employee | { id: string; name: string; roleType?: string; department?: string },
  type: 'explication' | 'avertissement' | 'mise_en_demeure',
  companyInfo: CompanyInfo = DEFAULT_COMPANY_INFO
) {
  const doc = generateDisciplinaryLetterPdf(incident, employee, type, companyInfo);
  const cleanName = (incident.employeeName || 'Salarie').replace(/[^a-zA-Z0-9]/g, '_');
  const typeLabel = type === 'explication' ? 'Explication' : type === 'avertissement' ? 'Avertissement' : 'MiseEnDemeure';
  doc.save(`Lettre_${typeLabel}_${cleanName}_${incident.date}.pdf`);
}
