export type IncidentSeverity = 'faible' | 'moyen' | 'grave' | 'critique';
export type IncidentCategory =
  | 'absence_injustifiee'
  | 'retard_repete'
  | 'insubordination'
  | 'negligence_materiel'
  | 'faute_professionnelle'
  | 'comportement_inadapte'
  | 'autre';

export type SanctionType =
  | 'explication_ecrite'
  | 'rappel_a_l_ordre'
  | 'avertissement'
  | 'mise_en_demeure'
  | 'mise_a_pied'
  | 'licenciement_faute'
  | 'classe_sans_suite';

export type DisciplinaryStatus = 'ouvert' | 'en_instruction' | 'convoque' | 'delibere' | 'sanctionne' | 'classe';

export interface DisciplinaryComment {
  id: string;
  authorName: string;
  authorRole?: string;
  content: string;
  timestamp: string;
}

export interface DisciplinaryHistoryEntry {
  id: string;
  date: string;
  action: string;
  authorName: string;
  notes?: string;
}

export interface EmployeeRecognition {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole?: string;
  type: 'employe_du_mois' | 'trophee' | 'felicitations' | 'prime_performance' | 'autre';
  title: string;
  description: string;
  period: string;
  awardedAt: string;
  awardedBy: string;
  bonusAmount?: number;
  badgeIcon?: string;
}

export interface DisciplinaryIncident {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole?: string;
  employeeDepartment?: string;
  date: string;
  incidentTime?: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  title: string;
  description: string;
  location?: string;
  witnesses?: string;
  reportedBy: string;
  reportedByRole?: string;
  employeeResponse?: string;
  sanctionType?: SanctionType;
  sanctionDate?: string;
  sanctionDetails?: string;
  status: DisciplinaryStatus;
  legalDeadlineDays?: number;
  officialLetterGenerated?: boolean;
  officialLetterRef?: string;
  ruleViolated?: string;
  explanationDeadline?: string;
  comments?: DisciplinaryComment[];
  history?: DisciplinaryHistoryEntry[];
  createdAt: string;
  updatedAt?: string;
}

export interface DepartmentNode {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  iconName?: string;
  managerId?: string;
  managerName?: string;
  parentDepartmentId?: string | null;
}
