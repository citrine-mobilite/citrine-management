import { ReminderCategory, ReminderRenewalCycle } from '../../types';

export type ReminderUrgencyLevel =
  | 'resolved'
  | 'expired'
  | 'critical'
  | 'warning'
  | 'upcoming'
  | 'unscheduled';

export interface ReminderUrgencyInfo {
  targetDateStr: string;
  daysRemaining: number | null;
  leadDays: number;
  level: ReminderUrgencyLevel;
  statusLabel: string;
  shortCountdown: string;
  isActionNeeded: boolean;
}

export const REMINDER_CATEGORY_META: Record<
  ReminderCategory,
  { label: string; shortLabel: string; placeholderEntity: string }
> = {
  vehicule: {
    label: 'Véhicules & Flotte',
    shortLabel: 'Véhicule',
    placeholderEntity: 'Ex: Toyota Hilux LT-482-AA',
  },
  fiscalite: {
    label: 'Impôts & Fiscalité',
    shortLabel: 'Fiscalité',
    placeholderEntity: 'Ex: DGI · Centre des Impôts',
  },
  administratif: {
    label: 'Contrats & Administratif',
    shortLabel: 'Administratif',
    placeholderEntity: 'Ex: Bail Siège / Agrément',
  },
  rh: {
    label: 'RH & Personnel',
    shortLabel: 'RH',
    placeholderEntity: 'Ex: Collaborateur / Service',
  },
  autre: {
    label: 'Autre échéance / Rappel',
    shortLabel: 'Autre',
    placeholderEntity: 'Ex: Élément ou organisme concerné',
  },
};

export const RENEWAL_CYCLE_LABELS: Record<ReminderRenewalCycle, string> = {
  none: 'Ponctuelle (1 fois)',
  monthly: 'Tous les mois',
  quarterly: 'Tous les 3 mois (Trimestriel)',
  semiannual: 'Tous les 6 mois',
  annual: 'Tous les ans (Annuel)',
};

export const ALERT_LEAD_OPTIONS = [
  { days: 7, label: '7 jours avant (1 semaine)' },
  { days: 10, label: '10 jours avant (~1,5 semaine)' },
  { days: 14, label: '14 jours avant (2 semaines)' },
  { days: 30, label: '30 jours avant (1 mois)' },
];

export interface DeadlineTemplate {
  id: string;
  label: string;
  title: string;
  category: ReminderCategory;
  renewalCycle: ReminderRenewalCycle;
  alertLeadDays: number;
  entityName?: string;
  suggestedDayOfMonth?: number;
  group: 'paie_rh' | 'charges' | 'fiscalite' | 'flotte';
  note: string;
}

export const DEADLINE_TEMPLATE_GROUPS: Array<{
  id: DeadlineTemplate['group'];
  label: string;
}> = [
  { id: 'paie_rh', label: 'Paie & RH' },
  { id: 'charges', label: 'Factures & Charges courantes' },
  { id: 'fiscalite', label: 'Fiscalité' },
  { id: 'flotte', label: 'Véhicules & Contrats' },
];

export const DEADLINE_TEMPLATES: DeadlineTemplate[] = [
  {
    id: 'salaires_mensuels',
    label: 'Salaires équipe (Paie collective)',
    title: 'Paiement Mensuel des Salaires (Paie Collective)',
    category: 'rh',
    renewalCycle: 'monthly',
    alertLeadDays: 7,
    entityName: 'Ensemble des collaborateurs (Virement groupé)',
    suggestedDayOfMonth: 28,
    group: 'paie_rh',
    note: 'Contrôler présences, heures et variables, éditer les bulletins de paie et exécuter le virement collectif de tous les employés.',
  },
  {
    id: 'cotisations_cnps',
    label: 'Cotisations sociales (CNPS)',
    title: 'Déclaration & Paiement Cotisations CNPS',
    category: 'rh',
    renewalCycle: 'monthly',
    alertLeadDays: 10,
    entityName: 'CNPS — Caisse Nationale de Prévoyance Sociale',
    suggestedDayOfMonth: 15,
    group: 'paie_rh',
    note: 'Effectuer la télédéclaration CNPS mensuelle et régler les cotisations sociales avant le 15 du mois.',
  },
  {
    id: 'loyer_bureaux',
    label: 'Loyer des locaux',
    title: 'Règlement Mensuel du Loyer des Bureaux',
    category: 'administratif',
    renewalCycle: 'monthly',
    alertLeadDays: 7,
    entityName: 'Bailleur / Agence immobilière',
    suggestedDayOfMonth: 5,
    group: 'charges',
    note: 'Effectuer le virement du loyer des locaux professionnels et archiver la quittance.',
  },
  {
    id: 'electricite_eneo',
    label: 'Électricité (ENEO)',
    title: 'Paiement Facture Électricité (ENEO)',
    category: 'administratif',
    renewalCycle: 'monthly',
    alertLeadDays: 7,
    entityName: 'ENEO Cameroun',
    suggestedDayOfMonth: 15,
    group: 'charges',
    note: 'Vérifier la facture mensuelle d’électricité et effectuer le règlement avant date limite.',
  },
  {
    id: 'eau_camwater',
    label: 'Eau (CAMWATER)',
    title: 'Paiement Facture Eau (CAMWATER)',
    category: 'administratif',
    renewalCycle: 'monthly',
    alertLeadDays: 7,
    entityName: 'CAMWATER',
    suggestedDayOfMonth: 15,
    group: 'charges',
    note: 'Régler la facture d’eau des locaux et conserver le justificatif de paiement.',
  },
  {
    id: 'internet_telecom',
    label: 'Internet / Fibre & Télécom',
    title: 'Abonnement Internet Fibre & Flotte Téléphonique',
    category: 'administratif',
    renewalCycle: 'monthly',
    alertLeadDays: 7,
    entityName: 'Opérateur Fibre / Télécom',
    suggestedDayOfMonth: 5,
    group: 'charges',
    note: 'Renouveler l’abonnement Internet des bureaux et les forfaits téléphoniques professionnels.',
  },
  {
    id: 'logiciels_hebergement',
    label: 'Logiciels / Cloud & Domaine',
    title: 'Renouvellement Abonnements Logiciels, Cloud & Domaine',
    category: 'administratif',
    renewalCycle: 'monthly',
    alertLeadDays: 7,
    entityName: 'Fournisseurs SaaS / Hébergement',
    suggestedDayOfMonth: 1,
    group: 'charges',
    note: 'Vérifier les prélèvements des licences logicielles, serveurs, messagerie et noms de domaine.',
  },
  {
    id: 'honoraires_comptable',
    label: 'Comptable / Prestataires',
    title: 'Règlement Honoraires Comptable & Prestataires',
    category: 'administratif',
    renewalCycle: 'monthly',
    alertLeadDays: 7,
    entityName: 'Cabinet comptable / Prestataire',
    suggestedDayOfMonth: 10,
    group: 'charges',
    note: 'Valider les factures récurrentes de prestations et procéder au règlement mensuel.',
  },
  {
    id: 'entretien_securite',
    label: 'Sécurité / Nettoyage locaux',
    title: 'Facture Gardiennage & Entretien des Locaux',
    category: 'administratif',
    renewalCycle: 'monthly',
    alertLeadDays: 7,
    entityName: 'Prestataire sécurité / entretien',
    suggestedDayOfMonth: 28,
    group: 'charges',
    note: 'Régler la prestation mensuelle de sécurité/gardiennage et de nettoyage des bureaux.',
  },
  {
    id: 'impots_mensuels',
    label: 'TVA & Impôts mensuels (DGI)',
    title: 'Télédéclaration & Paiement Impôts Mensuels (TVA / IS / IRPP)',
    category: 'fiscalite',
    renewalCycle: 'monthly',
    alertLeadDays: 7,
    entityName: 'DGI · Centre des Impôts',
    suggestedDayOfMonth: 15,
    group: 'fiscalite',
    note: 'Déclarer TVA, acompte IS, IRPP et retenues salariales et effectuer le règlement avant le 15.',
  },
  {
    id: 'impots_trimestriels',
    label: 'Impôts trimestriels (3 mois)',
    title: 'Déclaration & Paiement Impôts Trimestriels',
    category: 'fiscalite',
    renewalCycle: 'quarterly',
    alertLeadDays: 10,
    entityName: 'DGI · Centre des Impôts',
    group: 'fiscalite',
    note: 'Préparer les états fiscaux et effectuer le règlement avant échéance.',
  },
  {
    id: 'impots_annuels',
    label: 'Patente / DSF / Impôt annuel',
    title: 'Patente, DSF & Déclaration Fiscale Annuelle',
    category: 'fiscalite',
    renewalCycle: 'annual',
    alertLeadDays: 14,
    entityName: 'DGI · Centre des Impôts',
    group: 'fiscalite',
    note: 'Renouvellement annuel de la patente, dépôt DSF et quittance fiscale.',
  },
  {
    id: 'assurance_entreprise',
    label: 'Assurance locaux & RC Pro',
    title: 'Renouvellement Assurance Multirisque & RC Professionnelle',
    category: 'administratif',
    renewalCycle: 'annual',
    alertLeadDays: 30,
    entityName: 'Compagnie d’assurance',
    group: 'flotte',
    note: 'Vérifier les garanties de la police d’assurance des locaux et responsabilité civile.',
  },
  {
    id: 'carte_grise',
    label: 'Carte grise véhicule',
    title: 'Renouvellement Carte Grise',
    category: 'vehicule',
    renewalCycle: 'annual',
    alertLeadDays: 14,
    entityName: 'Véhicule / Flotte Citrine',
    group: 'flotte',
    note: 'Vérifier la validité et préparer le dossier de renouvellement.',
  },
  {
    id: 'visite_technique',
    label: 'Assurance / Visite technique',
    title: 'Assurance & Visite Technique Véhicule',
    category: 'vehicule',
    renewalCycle: 'annual',
    alertLeadDays: 14,
    entityName: 'Véhicule / Flotte Citrine',
    group: 'flotte',
    note: 'Contrôle technique périodique et attestation d’assurance.',
  },
  {
    id: 'contrat_bail',
    label: 'Contrat / Agrément officiel',
    title: 'Échéance Contrat / Agrément Officiel',
    category: 'administratif',
    renewalCycle: 'annual',
    alertLeadDays: 14,
    entityName: 'Organisme / Autorité de tutelle',
    group: 'flotte',
    note: 'Vérifier les conditions de reconduction ou renouveler l’agrément.',
  },
];
