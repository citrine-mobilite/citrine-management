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

const LOCAL_STORAGE_KEY = 'citrine_disciplinary_reasons';

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
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    this.saveReasons(INITIAL_DISCIPLINARY_REASONS);
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
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reasons));
    } catch {
      // ignore
    }
  }

  addCustomReason(label: string, category: DisciplinaryCategory = 'commun'): DisciplinaryReason {
    const reasons = this.getAllReasons();
    const existing = reasons.find((r) => r.label.toLowerCase() === label.trim().toLowerCase());
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        this.saveReasons(reasons);
      }
      return existing;
    }

    const newReason: DisciplinaryReason = {
      id: `reason-${Date.now()}`,
      label: label.trim(),
      category,
      isActive: true,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    const updated = [newReason, ...reasons];
    this.saveReasons(updated);
    return newReason;
  }

  updateReason(id: string, updates: Partial<Omit<DisciplinaryReason, 'id'>>): DisciplinaryReason[] {
    const reasons = this.getAllReasons();
    const updated = reasons.map((r) =>
      r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
    );
    this.saveReasons(updated);
    return updated;
  }

  toggleReasonActive(id: string): DisciplinaryReason[] {
    const reasons = this.getAllReasons();
    const updated = reasons.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r));
    this.saveReasons(updated);
    return updated;
  }

  deleteReason(id: string): DisciplinaryReason[] {
    const reasons = this.getAllReasons();
    const updated = reasons.filter((r) => r.id !== id);
    this.saveReasons(updated);
    return updated;
  }
}

export const disciplinaryReasonsService = new DisciplinaryReasonsService();
