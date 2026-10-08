import jsPDF from 'jspdf';
import { Employee, DisciplinaryIncident } from '../../types';
import { CompanyInfo, DEFAULT_COMPANY_INFO } from './pdfCompanyInfo';
import { generateCitrineOfficialDocumentPdf, OfficialDocumentData } from './citrineOfficialDocumentPdf';

export function generateDisciplinaryLetterPdf(
  incident: DisciplinaryIncident,
  employee: Employee | { id: string; name: string; roleType?: string; department?: string },
  type: 'explication' | 'avertissement' | 'mise_en_demeure',
  companyInfo: CompanyInfo = DEFAULT_COMPANY_INFO,
  includeSignature: boolean = false // La signature ne doit pas être par défaut
): jsPDF {
  const empName = employee.name || incident.employeeName || 'Collaborateur';
  const empRole = employee.roleType || incident.employeeRole || 'Collaborateur';
  const empDept = employee.department || incident.employeeDepartment || 'Direction des Opérations';
  const refCode = incident.officialLetterRef || `N° DISC-${(incident.id || '2026').slice(-4)}/RH/${new Date().getFullYear()}`;

  let subject = "Demande d'explications écrites relatives à votre activité";
  let closingText = "Dans l'attente de votre réponse écrite sous 48 heures ouvrées, nous vous prions d'agréer l'expression de nos salutations distinguées.";
  let signatoryTitle = "La Direction Générale";

  if (type === 'avertissement') {
    subject = `Notification formelle d'avertissement disciplinaire - ${incident.title || 'Manquement constaté'}`;
    closingText = "Nous vous prions de considérer ce rappel avec la plus grande rigueur et vous prions d'agréer l'expression de nos salutations distinguées.";
  } else if (type === 'mise_en_demeure') {
    subject = `Mise en demeure formelle avec mise en garde conservatoire`;
    closingText = "Faute de régularisation immédiate et sans délai, la direction se réserve le droit de prendre les mesures disciplinaires les plus fermes prévues par la législation du travail.";
  }

  const paragraphs: string[] = [
    `Par la présente, nous portons à votre attention les constats factuels relevés au sein de notre établissement concernant l'exécution de vos fonctions.`,
    incident.description || `Il a été formellement constaté le manquement suivant : ${incident.title || 'Non-respect des consignes'}.`,
    type === 'explication'
      ? `Conformément aux dispositions du Règlement Intérieur de CITRINE SARL, vous êtes invité(e) à fournir par écrit vos explications détaillées et justifications circonstanciées sur les faits susmentionnés dès réception de la présente.`
      : `Ce comportement étant préjudiciable au bon fonctionnement de l'entreprise, nous vous notifions par la présente une mesure disciplinaire officielle inscrite à votre dossier administratif.`,
  ];

  const docData: OfficialDocumentData = {
    id: incident.id,
    referenceNumber: refCode,
    date: incident.date || new Date().toISOString().split('T')[0],
    city: 'Douala',
    recipient: {
      salutation: `À Monsieur/Madame ${empName}`,
      roleOrService: empRole,
      companyOrDepartment: empDept,
      city: 'Douala',
    },
    subject,
    salutationText: `Monsieur/Madame ${empName},`,
    paragraphs,
    closingSalutation: closingText,
    signatoryCompany: 'Pour CITRINE SARL',
    signatoryTitle,
    includeSignature: includeSignature, // NON PAR DÉFAUT
  };

  return generateCitrineOfficialDocumentPdf(docData, companyInfo);
}

export function downloadDisciplinaryLetterPdf(
  incident: DisciplinaryIncident,
  employee: Employee | { id: string; name: string; roleType?: string; department?: string },
  type: 'explication' | 'avertissement' | 'mise_en_demeure',
  companyInfo: CompanyInfo = DEFAULT_COMPANY_INFO,
  includeSignature: boolean = false
): void {
  const doc = generateDisciplinaryLetterPdf(incident, employee, type, companyInfo, includeSignature);
  const cleanName = (employee.name || incident.employeeName || 'Collaborateur').replace(/[^a-zA-Z0-9]/g, '_');
  const cleanType = type;
  doc.save(`Lettre_${cleanType}_${cleanName}_${incident.date || 'date'}.pdf`);
}


