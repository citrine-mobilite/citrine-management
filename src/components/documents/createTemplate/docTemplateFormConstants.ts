import { DocumentCategory, TemplateField } from '../../../types';

export const TEMPLATE_CATEGORY_OPTIONS: { label: string; value: DocumentCategory }[] = [
  { label: 'Attestation & Certificat', value: 'attestation' },
  { label: 'Contrat & Avenant', value: 'contract' },
  { label: 'Note de service & Consignes', value: 'memo' },
  { label: 'Ordre de mission & Déplacement', value: 'mission' },
  { label: 'Sanction & Discipline', value: 'disciplinary' },
  { label: 'Fin de contrat & Sortie', value: 'certificate' },
  { label: 'Stage & Formation', value: 'internship' },
  { label: 'Décharge & Équipement', value: 'discharge' },
  { label: 'Fiche de poste & Organisation', value: 'job_description' },
  { label: 'Règlement & Charte', value: 'regulation' },
  { label: 'Évaluation & Bilan', value: 'evaluation' },
  { label: 'Autre Document RH', value: 'other' },
];

export const createInitialTemplateFields = (): TemplateField[] => [
  { key: 'employeeName', label: 'Nom du Salarié', type: 'text', defaultValue: 'Jean DUPONT' },
  { key: 'positionTitle', label: 'Poste Occupé', type: 'text', defaultValue: 'Collaborateur' },
  { key: 'effectiveDate', label: "Date d'application", type: 'date', defaultValue: new Date().toISOString().split('T')[0] },
  { key: 'purpose', label: 'Objet ou Motif', type: 'textarea', defaultValue: 'Raison officielle de la demande' },
];

export const DEFAULT_TEMPLATE_BODY = `ATTESTATION OFFICIELLE

Nous soussignés, Direction de CITRINE SARL, attestons par la présente que :

M./Mme {{employeeName}}, exerçant les fonctions de {{positionTitle}}, au sein de notre établissement, bénéficie des présentes dispositions à compter du {{effectiveDate}}.

OBJET / MOTIF :
{{purpose}}

La présente pièce lui est délivrée pour servir et valoir ce que de droit.`;
