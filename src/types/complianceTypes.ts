export type ComplianceAxis = 'general' | 'org' | 'rh' | 'phy' | 'tech' | 'access';

/**
 * Granular maturity statuses live on each sub-element so teams know precisely where things stand.
 */
export type ComplianceSubItemStatus =
  | 'a_preparer'
  | 'en_cours'
  | 'partiellement_conforme'
  | 'a_verifier'
  | 'conforme'
  | 'non_conforme'
  | 'non_existant'
  | 'non_applicable';

/**
 * Parent requirement status is strictly binary and automatically computed from its sub-elements
 * (legacy values remain accepted on historical records and normalized automatically).
 */
export type ComplianceParentStatus = 'conforme' | 'non_conforme';

export type ComplianceStatus = ComplianceSubItemStatus;

export type ComplianceConfidentiality = 'Confidentiel' | 'Restreint' | 'Interne';

export interface ComplianceComment {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface ComplianceSubItem {
  id: string;
  label: string;
  completed: boolean;
  status?: ComplianceSubItemStatus;
  comments?: ComplianceComment[];
  notes?: string;
}

export interface ComplianceCitrineLink {
  tab: string;
  label: string;
}

export interface ComplianceChecklistItem {
  id: string;
  axis: ComplianceAxis;
  sectionCode: string;
  sectionTitle: string;
  controlCode: string;
  title: string;
  description?: string;
  conditionalIfApplicable?: boolean;
  status: ComplianceStatus;
  ownerName?: string;
  ownerRole?: string;
  ownerEmployeeId?: string;
  documentVersion?: string;
  documentDate?: string;
  evidenceUrl?: string;
  confidentiality?: ComplianceConfidentiality;
  auditorNotes?: string;
  comments?: ComplianceComment[];
  subItems: ComplianceSubItem[];
  citrineModuleHint?: ComplianceCitrineLink;
  isCustom?: boolean;
  orderIndex: number;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ComplianceAxisSummary {
  axis: ComplianceAxis;
  shortCode: string;
  label: string;
  totalItems: number;
  conformeCount: number;
  nonConformeCount: number;
  subItemsConforme: number;
  subItemsInProgress: number;
  subItemsNonConforme: number;
  subItemsPending: number;
  subItemsApplicable: number;
  subItemsDone: number;
  subItemsTotal: number;
  readinessPercent: number;
}

export interface ComplianceMetrics {
  totalItems: number;
  totalApplicable: number;
  conformeCount: number;
  nonConformeCount: number;
  enCoursCount: number;
  partiellementConformeCount: number;
  aVerifierCount: number;
  aPreparerCount: number;
  subNonConformeCount: number;
  nonExistantCount: number;
  nonApplicableCount: number;
  subItemsDone: number;
  subItemsTotal: number;
  subItemsApplicable: number;
  readinessPercent: number;
  byAxis: ComplianceAxisSummary[];
}
