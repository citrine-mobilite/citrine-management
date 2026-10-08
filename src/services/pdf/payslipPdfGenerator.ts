import jsPDF from 'jspdf';
import { Employee, SalaryPayment } from '../../types';
import { CompanyInfo, DEFAULT_COMPANY_INFO, formatCurrency } from './pdfCompanyInfo';

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
  const contentWidth = pageWidth - margin * 2;

  // Header branding bar
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Logo badge
  doc.setFillColor(35, 122, 123);
  doc.roundedRect(margin, 12, 16, 14, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('HERO', margin + 2.5, 21);

  // Company details
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(companyInfo.name, margin + 18, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(companyInfo.subTitle, margin + 18, 21.5);
  doc.text(`${companyInfo.address} • ${companyInfo.city}, ${companyInfo.country}`, margin + 18, 25.5);
  doc.text(`Réf Légale : ${companyInfo.registrationNumber || 'RC/YAO/2026/B'}`, margin + 18, 29.5);

  // Document Card
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

  let y = 35;

  // Employee Card
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`SALARIÉ : ${employee.name.toUpperCase()}`, margin + 6, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Matricule : ${employee.id.toUpperCase()}  |  Poste : ${employee.roleType || 'Collaborateur'}`, margin + 6, y + 13);
  doc.text(`Département : ${employee.department || 'Opérations'}  |  Statut : ${employee.status}`, margin + 6, y + 18);

  y += 30;

  // Salary Table
  doc.setFillColor(6, 78, 59);
  doc.rect(margin, y, contentWidth, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('LIBELLÉ DES RUBRIQUES', margin + 6, y + 5);
  doc.text('BASE (FCFA)', margin + 90, y + 5);
  doc.text('GAINS (FCFA)', margin + 125, y + 5);
  doc.text('RETENUES (FCFA)', margin + 155, y + 5);

  y += 7;

  const items = [
    { name: 'Salaire de Base Contractuel', base: payment.baseAmount, gain: payment.baseAmount, ret: 0 },
    { name: 'Primes & Gratifications', base: payment.bonusAmount || 0, gain: payment.bonusAmount || 0, ret: 0 },
    { name: 'Retenues / Avances sur salaire', base: payment.advanceAmount || 0, gain: 0, ret: payment.advanceAmount || 0 },
  ];

  items.forEach((item, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(margin, y, contentWidth, 6, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text(item.name, margin + 6, y + 4.5);
    doc.text(formatCurrency(item.base), margin + 90, y + 4.5);
    doc.text(item.gain > 0 ? formatCurrency(item.gain) : '-', margin + 125, y + 4.5);
    doc.text(item.ret > 0 ? `-${formatCurrency(item.ret)}` : '-', margin + 155, y + 4.5);

    y += 6;
  });

  y += 8;

  // Total Banner
  doc.setFillColor(6, 78, 59);
  doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text('NET À PAYER AU SALARIÉ :', margin + 6, y + 10);

  doc.setFontSize(13);
  doc.setTextColor(110, 231, 183);
  doc.text(formatCurrency(payment.netAmount), margin + contentWidth - 6, y + 10.5, { align: 'right' });

  y += 22;

  // Official Seal
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(6, 78, 59);
  doc.text("DOCUMENT OFFICIEL SCELLÉ NUMÉRIQUEMENT - CITRINE MANAGEMENT", margin + 6, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`Certificat Authentification : CITRINE-PAY-${employee.id.toUpperCase()}-${payment.period}`, margin + 6, y + 10.5);

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text('Document généré automatiquement via Citrine Management • Conservez ce bulletin sans limitation de durée', pageWidth / 2, 290, { align: 'center' });

  return doc;
}

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
