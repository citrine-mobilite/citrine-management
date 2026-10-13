export type LeaveType =
  | 'conge_annuel'
  | 'permission_exceptionnelle'
  | 'maladie'
  | 'sans_solde'
  | 'maternite_paternite'
  | 'recuperation'
  | 'autre';

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'modified';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail?: string;
  employeeAvatar?: string;
  department?: string;
  type: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysCount: number;
  reason: string;
  attachmentName?: string;
  status: LeaveStatus;

  // Décision et ajustements apportés par le responsable / manager
  approvedStartDate?: string;
  approvedEndDate?: string;
  approvedDaysCount?: number;
  managerComment?: string;
  decidedBy?: string;
  decidedByUserId?: string;
  decidedAt?: string;

  createdAt: string;
  updatedAt?: string;
}

export const LEAVE_TYPE_LABELS: Record<LeaveType, { label: string; badgeColor: string }> = {
  conge_annuel: {
    label: 'Congé annuel payé',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  permission_exceptionnelle: {
    label: 'Permission exceptionnelle (Famille / Événement)',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  maladie: {
    label: 'Arrêt maladie',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  sans_solde: {
    label: 'Congé sans solde',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  maternite_paternite: {
    label: 'Maternité / Paternité',
    badgeColor: 'bg-pink-50 text-pink-700 border-pink-200',
  },
  recuperation: {
    label: 'Repos compensateur / Récupération',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  autre: {
    label: 'Autre motif d’absence',
    badgeColor: 'bg-stone-50 text-stone-700 border-stone-200',
  },
};

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, { label: string; badgeColor: string }> = {
  pending: {
    label: 'En attente d’arbitrage',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  approved: {
    label: 'Validé par la direction',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  rejected: {
    label: 'Refusé',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  modified: {
    label: 'Durée ajustée par le responsable',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
};
