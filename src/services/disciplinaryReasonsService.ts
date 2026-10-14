export type DisciplinaryCategory =
  | 'renvoi'
  | 'suspension'
  | 'changement_poste'
  | 'avertissement'
  | 'depart_volontaire'
  | 'fin_contrat'
  | 'commun';

export interface DisciplinaryReason {
  id: string;
  label: string;
  category: DisciplinaryCategory;
  isActive: boolean;
  isCustom?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export const INITIAL_DISCIPLINARY_REASONS: DisciplinaryReason[] = [
  {
    id: 'reason-1',
    label: 'Insuffisance professionnelle répétée et non atteinte des objectifs contractuels',
    category: 'renvoi',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'reason-2',
    label: 'Absences répétées non justifiées et manquements constatés à l\'assiduité',
    category: 'commun',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'reason-3',
    label: 'Faute lourde, insubordination ou refus de se conformer aux consignes hiérarchiques',
    category: 'renvoi',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'reason-4',
    label: 'Retards chroniques répétés sans motif valable ni signalement préalable',
    category: 'suspension',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'reason-5',
    label: 'Mesure conservatoire temporaire dans l\'attente d\'une enquête disciplinaire',
    category: 'suspension',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'reason-6',
    label: 'Mutation interne pour réorganisation de service ou besoins opérationnels',
    category: 'changement_poste',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'reason-7',
    label: 'Promotion ou évolution de compétences vers un poste à responsabilités',
    category: 'changement_poste',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'reason-8',
    label: 'Avertissement écrit pour négligence dans l\'exécution des tâches',
    category: 'avertissement',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'reason-9',
    label: 'Rappel à l\'ordre formel pour non-respect des horaires et pauses',
    category: 'avertissement',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'reason-10',
    label: 'Démission volontaire notifiée par écrit pour projet personnel',
    category: 'depart_volontaire',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'reason-11',
    label: 'Fin de période d\'essai à l\'initiative de l\'employeur ou du collaborateur',
    category: 'fin_contrat',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'reason-12',
    label: 'Arrivée à terme normal du contrat à durée déterminée (CDD)',
    category: 'fin_contrat',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'reason-13',
    label: 'Abandon de poste prolongé constaté formellement par la direction',
    category: 'renvoi',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'reason-14',
    label: 'Manquement grave aux règles d\'hygiène, de santé ou de sécurité au travail',
    category: 'commun',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'reason-15',
    label: 'Rupture conventionnelle d\'un commun accord entre les deux parties',
    category: 'renvoi',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
];

class DisciplinaryReasonsService {
  getAllReasons(): DisciplinaryReason[] {
    return INITIAL_DISCIPLINARY_REASONS;
  }

  getActiveReasons(category?: DisciplinaryCategory): DisciplinaryReason[] {
    const reasons = this.getAllReasons();
    return reasons.filter((r) => {
      if (!r.isActive) return false;
      if (!category) return true;
      return r.category === category || r.category === 'commun';
    });
  }

  saveReasons(reasons: DisciplinaryReason[]): void {
    // No-op (database authority)
  }

  addCustomReason(label: string, category: DisciplinaryCategory): DisciplinaryReason {
    const newReason: DisciplinaryReason = {
      id: `reason-${Date.now()}`,
      label,
      category,
      isActive: true,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };
    INITIAL_DISCIPLINARY_REASONS.push(newReason);
    return newReason;
  }

  toggleReasonActive(id: string): DisciplinaryReason[] {
    const r = INITIAL_DISCIPLINARY_REASONS.find(item => item.id === id);
    if (r) r.isActive = !r.isActive;
    return [...INITIAL_DISCIPLINARY_REASONS];
  }

  updateReason(id: string, updates: Partial<DisciplinaryReason>): DisciplinaryReason[] {
    const r = INITIAL_DISCIPLINARY_REASONS.find(item => item.id === id);
    if (r) {
      Object.assign(r, updates, { updatedAt: new Date().toISOString() });
    }
    return [...INITIAL_DISCIPLINARY_REASONS];
  }

  deleteReason(id: string): DisciplinaryReason[] {
    const idx = INITIAL_DISCIPLINARY_REASONS.findIndex(item => item.id === id);
    if (idx >= 0) INITIAL_DISCIPLINARY_REASONS.splice(idx, 1);
    return [...INITIAL_DISCIPLINARY_REASONS];
  }
}

export const disciplinaryReasonsService = new DisciplinaryReasonsService();
