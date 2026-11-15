import {
  Reminder,
  ReminderCategory,
  ReminderRenewalCycle,
} from '../types';

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

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function parseDateOnly(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const clean = String(dateStr).split('T')[0];
  const parts = clean.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => isNaN(n))) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

export function computeReminderUrgency(
  reminder: Reminder,
  referenceDate: Date = new Date()
): ReminderUrgencyInfo {
  const leadDays = typeof reminder.alertLeadDays === 'number' && reminder.alertLeadDays >= 0
    ? reminder.alertLeadDays
    : 14;
  const targetDateStr = (reminder.expirationDate || reminder.date || '').split('T')[0];

  if (reminder.isResolved || reminder.stopped) {
    return {
      targetDateStr,
      daysRemaining: null,
      leadDays,
      level: 'resolved',
      statusLabel: 'Validé',
      shortCountdown: 'À jour',
      isActionNeeded: false,
    };
  }

  const parsedTarget = parseDateOnly(targetDateStr);
  if (!parsedTarget) {
    return {
      targetDateStr: '',
      daysRemaining: null,
      leadDays,
      level: 'unscheduled',
      statusLabel: 'Sans date',
      shortCountdown: '—',
      isActionNeeded: false,
    };
  }

  const today = startOfDay(referenceDate);
  const diffMs = parsedTarget.getTime() - today.getTime();
  const daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    const overdue = Math.abs(daysRemaining);
    return {
      targetDateStr,
      daysRemaining,
      leadDays,
      level: 'expired',
      statusLabel: `Expiré depuis ${overdue} j`,
      shortCountdown: `-${overdue} j`,
      isActionNeeded: true,
    };
  }

  if (daysRemaining === 0) {
    return {
      targetDateStr,
      daysRemaining: 0,
      leadDays,
      level: 'critical',
      statusLabel: "Expire aujourd'hui",
      shortCountdown: "Aujourd'hui",
      isActionNeeded: true,
    };
  }

  if (daysRemaining <= Math.min(7, leadDays)) {
    return {
      targetDateStr,
      daysRemaining,
      leadDays,
      level: 'critical',
      statusLabel: `Expire dans ${daysRemaining} j`,
      shortCountdown: `J-${daysRemaining}`,
      isActionNeeded: true,
    };
  }

  if (daysRemaining <= leadDays) {
    return {
      targetDateStr,
      daysRemaining,
      leadDays,
      level: 'warning',
      statusLabel: `À renouveler dans ${daysRemaining} j`,
      shortCountdown: `J-${daysRemaining}`,
      isActionNeeded: true,
    };
  }

  return {
    targetDateStr,
    daysRemaining,
    leadDays,
    level: 'upcoming',
    statusLabel: `À jour (dans ${daysRemaining} j)`,
    shortCountdown: `J-${daysRemaining}`,
    isActionNeeded: false,
  };
}

export function sortRemindersByUrgency(reminders: Reminder[]): Reminder[] {
  return [...(reminders || [])].sort((a, b) => {
    const uA = computeReminderUrgency(a);
    const uB = computeReminderUrgency(b);

    const priorityRank: Record<ReminderUrgencyLevel, number> = {
      expired: 0,
      critical: 1,
      warning: 2,
      upcoming: 3,
      unscheduled: 4,
      resolved: 5,
    };

    const rankDiff = priorityRank[uA.level] - priorityRank[uB.level];
    if (rankDiff !== 0) return rankDiff;

    if (uA.daysRemaining !== null && uB.daysRemaining !== null) {
      return uA.daysRemaining - uB.daysRemaining;
    }
    return (uA.targetDateStr || '').localeCompare(uB.targetDateStr || '');
  });
}

export function getHomeUrgentReminders(
  reminders: Reminder[],
  referenceDate: Date = new Date()
): Reminder[] {
  const urgent = (reminders || []).filter((r) => {
    const u = computeReminderUrgency(r, referenceDate);
    return u.isActionNeeded;
  });
  return sortRemindersByUrgency(urgent);
}

export function addMonthsToIsoDate(dateStr: string, monthsToAdd: number): string {
  const base = parseDateOnly(dateStr) || new Date();
  const originalDay = base.getDate();
  const target = new Date(base.getFullYear(), base.getMonth() + monthsToAdd, 1);
  const lastDayOfTargetMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(originalDay, lastDayOfTargetMonth));
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, '0');
  const d = String(target.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function renewOrResolveReminder(reminder: Reminder): Reminder {
  const nowIso = new Date().toISOString();
  const cycle: ReminderRenewalCycle = reminder.renewalCycle || 'none';
  const baseDate = (reminder.expirationDate || reminder.date || nowIso.split('T')[0]).split('T')[0];

  const monthsMap: Record<ReminderRenewalCycle, number> = {
    none: 0,
    monthly: 1,
    quarterly: 3,
    semiannual: 6,
    annual: 12,
  };

  const months = monthsMap[cycle] || 0;
  if (months > 0) {
    const nextDate = addMonthsToIsoDate(baseDate, months);
    return {
      ...reminder,
      date: nextDate,
      expirationDate: nextDate,
      lastRenewedAt: nowIso,
      triggered: false,
      triggeredPeriods: [],
      stopped: false,
      isResolved: false,
    };
  }

  return {
    ...reminder,
    lastRenewedAt: nowIso,
    isResolved: true,
    stopped: true,
  };
}

export function formatDeadlineFrenchDate(dateStr?: string): string {
  const parsed = parseDateOnly(dateStr);
  if (!parsed) return 'Non datée';
  return parsed.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getReminderCategoryLabel(category?: ReminderCategory): string {
  if (!category) return 'Échéance';
  return REMINDER_CATEGORY_META[category]?.shortLabel || 'Échéance';
}
