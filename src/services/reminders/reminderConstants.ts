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
  note: string;
}

export const DEADLINE_TEMPLATES: DeadlineTemplate[] = [
  {
    id: 'carte_grise',
    label: 'Carte grise véhicule',
    title: 'Renouvellement Carte Grise',
    category: 'vehicule',
    renewalCycle: 'annual',
    alertLeadDays: 14,
    note: 'Vérifier la validité et préparer le dossier de renouvellement.',
  },
  {
    id: 'visite_technique',
    label: 'Assurance / Visite technique',
    title: 'Assurance & Visite Technique Véhicule',
    category: 'vehicule',
    renewalCycle: 'annual',
    alertLeadDays: 14,
    note: 'Contrôle technique périodique et attestation d’assurance.',
  },
  {
    id: 'impots_trimestriels',
    label: 'Impôts trimestriels (3 mois)',
    title: 'Déclaration & Paiement Impôts Trimestriels',
    category: 'fiscalite',
    renewalCycle: 'quarterly',
    alertLeadDays: 10,
    note: 'Préparer les états fiscaux et effectuer le règlement avant échéance.',
  },
  {
    id: 'impots_annuels',
    label: 'Patente / Impôt annuel',
    title: 'Patente & Déclaration Fiscale Annuelle',
    category: 'fiscalite',
    renewalCycle: 'annual',
    alertLeadDays: 14,
    note: 'Renouvellement annuel de la patente et quittance fiscale.',
  },
  {
    id: 'contrat_bail',
    label: 'Contrat / Loyer / Agrément',
    title: 'Échéance Contrat / Agrément Officiel',
    category: 'administratif',
    renewalCycle: 'annual',
    alertLeadDays: 14,
    note: 'Vérifier les conditions de reconduction ou renouveler l’agrément.',
  },
];
