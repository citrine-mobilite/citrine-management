import { DocumentCategory, DocumentFormatType } from '../types';

export interface TemplateField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'select';
  defaultValue: string;
  options?: string[];
  placeholder?: string;
}

export interface DocTemplate {
  id: string;
  name: string;
  category: DocumentCategory;
  formatType: DocumentFormatType;
  description: string;
  fields: TemplateField[];
  renderText: (params: Record<string, any>) => string;
}

export const DOC_TEMPLATES: DocTemplate[] = [
  {
    id: 'tpl-recruitment',
    name: "Procédure d'Intégration & Onboarding Collab",
    category: 'procedure',
    formatType: 'word',
    description: "Guide étape par étape pour la prise de poste d'un nouvel employé.",
    fields: [
      { key: 'companyName', label: 'Entreprise / Structure', type: 'text', defaultValue: 'Citrine Management' },
      { key: 'department', label: 'Département / Service', type: 'text', defaultValue: 'Direction des Opérations' },
      { key: 'managerName', label: 'Responsable Hiérarchique', type: 'text', defaultValue: 'Responsable des Opérations' },
      { key: 'trialPeriod', label: 'Période d\'essai (Mois)', type: 'number', defaultValue: '2' },
      { key: 'requiredEquipment', label: 'Matériel à fournir', type: 'text', defaultValue: 'PC Portable Pro, Badge d\'accès, Email Professionnel' },
      { key: 'welcomeMessage', label: 'Instructions & Mot d\'accueil', type: 'textarea', defaultValue: 'Bienvenue au sein de Citrine Management. Le respect des délais et la rigueur dans le suivi des activités constituent le socle de notre réussite.' }
    ],
    renderText: (p) => `====================================================================
${(p.companyName || 'Citrine Management').toUpperCase()} - PROCÉDURE D'INTÉGRATION
====================================================================

RÉFÉRENCE : PROC-ONB-${new Date().getFullYear()}
DÉPARTEMENT : ${p.department || 'Opérations'}
RESPONSABLE : ${p.managerName || 'Direction'}
DURÉE DE LA PÉRIODE D'ESSAI : ${p.trialPeriod || 2} mois

1. OBJET
Le présent document définit la feuille de route d'accueil et d'intégration opérationnelle.

2. LOGISTIQUE & MATÉRIEL
Les équipements suivants doivent être remis le premier jour :
- ${p.requiredEquipment || 'Poste de travail et identifiants'}

3. MOT D'ACCUEIL ET CONSIGNES
${p.welcomeMessage || 'Bienvenue dans notre organisation.'}

4. ÉTAPES VALIDÉES
- Jour 1 : Prise en main des outils et présentation de l'équipe
- Semaine 1 : Bilan avec le responsable ${p.managerName || 'hiérarchique'}
- Mois 1 : Évaluation d'étape d'intégration

Fait à Douala / Yaoundé, le ${new Date().toLocaleDateString('fr-FR')}`
  },
  {
    id: 'tpl-memo',
    name: "Note de Service / Directive Interne",
    category: 'memo',
    formatType: 'word',
    description: "Diffusion officielle de consignes, règles d'entreprise ou modifications organisationnelles.",
    fields: [
      { key: 'subject', label: 'Objet de la Note', type: 'text', defaultValue: 'Mise à jour des horaires et suivi du journal de présence' },
      { key: 'targetAudience', label: 'Destinataires', type: 'text', defaultValue: 'Ensemble des collaborateurs et responsables de pôle' },
      { key: 'urgency', label: 'Niveau d\'urgence', type: 'select', defaultValue: 'Important', options: ['Normal', 'Important', 'Urgent / Immédiat'] },
      { key: 'effectiveDate', label: 'Date d\'application', type: 'date', defaultValue: new Date().toISOString().split('T')[0] },
      { key: 'mainDirective', label: 'Texte & Consignes de la directive', type: 'textarea', defaultValue: 'À compter de la date indiquée, tout retard ou absence doit obligatoirement être signalé avant 08h30 dans le volet Présence du logiciel. Les émargements se feront quotidiennement sous la supervision des responsables.' },
      { key: 'signatory', label: 'Signataire / Émetteur', type: 'text', defaultValue: 'La Direction Générale' }
    ],
    renderText: (p) => `====================================================================
NOTE DE SERVICE INTERNE - ${p.subject ? p.subject.toUpperCase() : 'DIRECTIVE'}
====================================================================

NIVEAU D'URGENCE : ${p.urgency || 'Normal'}
DESTINATAIRES    : ${p.targetAudience || 'Tout le personnel'}
DATE D'EFFET     : ${p.effectiveDate || new Date().toLocaleDateString('fr-FR')}

OBJET : ${p.subject || 'Directive interne'}

DIRECTIVE :
${p.mainDirective || 'Merci de respecter scrupuleusement la consigne.'}

RAPPEL DE CONFORMITÉ :
L'application de cette note de service est obligatoire pour tous les collaborateurs concernés.

Pour la Direction,
${p.signatory || 'Le Directeur'}`
  },
  {
    id: 'tpl-contract',
    name: "Contrat de Travail & Lettre d'Engagement",
    category: 'contract',
    formatType: 'word',
    description: "Document contractuel définissant le poste, les responsabilités et la rémunération.",
    fields: [
      { key: 'employeeName', label: 'Nom du Collaborateur', type: 'text', defaultValue: 'Jean-Marc DUPONT' },
      { key: 'positionTitle', label: 'Intitulé du Poste', type: 'text', defaultValue: 'Développeur Full Stack Senior' },
      { key: 'monthlySalary', label: 'Rémunération Mensuelle Brute (XAF)', type: 'number', defaultValue: '450000' },
      { key: 'startDate', label: 'Date de Début de Contrat', type: 'date', defaultValue: new Date().toISOString().split('T')[0] },
      { key: 'workplace', label: 'Lieu de Travail / Régime', type: 'text', defaultValue: 'Siège social Douala + Télétravail Hybride' },
      { key: 'signatory', label: 'Représentant Légal', type: 'text', defaultValue: 'Citrine Management' }
    ],
    renderText: (p) => `====================================================================
CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE (CDI)
====================================================================

ENTRE LES SOUSSIGNÉS :
La société ${p.signatory || 'Citrine Management'}, représentée par la direction,

ET :
M./Mme ${p.employeeName || 'Le Collaborateur'}, demeurant à l'adresse enregistrée aux RH.

IL A ÉTÉ CONVENU CE QUI SUIT :

ARTICLE 1 : ENGAGEMENT ET POSTE
M./Mme ${p.employeeName || 'Le Collaborateur'} est engagé(e) en qualité de ${p.positionTitle || 'Employé'} à compter du ${p.startDate || new Date().toLocaleDateString('fr-FR')}.

ARTICLE 2 : LIEU DE TRAVAIL
Le contrat s'exécute à : ${p.workplace || 'Siège de l\'entreprise'}.

ARTICLE 3 : RÉMUNÉRATION
En contrepartie de ses services, le salarié percevra un salaire mensuel brut de ${Number(p.monthlySalary || 0).toLocaleString('fr-FR')} XAF.

Fait en deux exemplaires originaux,
Le ${new Date().toLocaleDateString('fr-FR')}

Signatures :
Pour l'Employeur                          Le Salarié`
  },
  {
    id: 'tpl-audit',
    name: "Rapport d'Audit & Contrôle de Processus",
    category: 'report',
    formatType: 'excel',
    description: "Évaluation périodique de conformité, anomalies détectées et plan d'action.",
    fields: [
      { key: 'processName', label: 'Processus Audité', type: 'text', defaultValue: 'Gestion Comptable & Suivi des Sorties de Caisse' },
      { key: 'auditorName', label: 'Nom de l\'Auditeur / Inspecteur', type: 'text', defaultValue: 'Équipe Qualité & Audit Interne' },
      { key: 'complianceScore', label: 'Score de Conformité (%)', type: 'number', defaultValue: '92' },
      { key: 'auditDate', label: 'Date de l\'Inspection', type: 'date', defaultValue: new Date().toISOString().split('T')[0] },
      { key: 'findings', label: 'Constats & Remarques', type: 'textarea', defaultValue: 'L\'ensemble des justificatifs de dépenses supérieures à 300 000 XAF sont bien scannés. Quelques retards mineurs d\'enregistrement constatés en milieu de mois.' },
      { key: 'correctiveActions', label: 'Plan d\'Actions Correctives', type: 'textarea', defaultValue: '1. Rendre le téléchargement du reçu obligatoire dès la saisie.\n2. Effectuer un rapprochement hebdomadaire par le Responsable RH.' }
    ],
    renderText: (p) => `====================================================================
RAPPORT D'AUDIT DE PROCESSUS - CITRINE MANAGEMENT
====================================================================

PROCESSUS : ${p.processName || 'Général'}
DATE D'AUDIT : ${p.auditDate || new Date().toLocaleDateString('fr-FR')}
AUDITEUR : ${p.auditorName || 'Inspecteur'}
SCORE GLOBAL DE CONFORMITÉ : ${p.complianceScore || 100} %

1. SYNTHÈSE DES CONSTATS
${p.findings || 'Aucune anomalie critique.'}

2. PLAN D'ACTIONS ET RECOMMANDATIONS
${p.correctiveActions || 'Conserver les bonnes pratiques.'}

Rapport certifié conforme par le pôle audit.`
  },
  {
    id: 'tpl-certificate',
    name: "Attestation d'Emploi & Présence Officielle",
    category: 'procedure',
    formatType: 'word',
    description: "Document officiel attestant qu'un salarié fait bien partie des effectifs de l'entreprise.",
    fields: [
      { key: 'employeeName', label: 'Nom du Salarié', type: 'text', defaultValue: 'Paul KOUASSI' },
      { key: 'hireDate', label: 'Date d\'embauche', type: 'date', defaultValue: '2024-01-15' },
      { key: 'positionTitle', label: 'Poste Occupé', type: 'text', defaultValue: 'Ingénieur DevOps & Réseaux' },
      { key: 'signatory', label: 'Nom du Signataire RH', type: 'text', defaultValue: 'Responsable des Ressources Humaines' }
    ],
    renderText: (p) => `====================================================================
ATTESTATION DE TRAVAIL ET DE PRÉSENCE
====================================================================

Je soussigné(e), ${p.signatory || 'Direction RH'}, agissant en qualité de représentant(e) officiel(le) de Citrine Management,

ATTESTE PAR LA PRÉSENTE QUE :

M./Mme ${p.employeeName || 'Le Salarié'} est employé(e) au sein de notre établissement depuis le ${p.hireDate || '01/01/2024'} en qualité de ${p.positionTitle || 'Employé'}.

L'intéressé(e) est à ce jour régulièrement en poste, libre de tout engagement envers des tiers à l'issue de ses heures de service.

Cette attestation est délivrée à la demande de l'intéressé(e) pour servir et valoir ce que de droit.

Fait à Douala / Yaoundé, le ${new Date().toLocaleDateString('fr-FR')}

Cachet & Signature RH`
  }
];
