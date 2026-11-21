export type ComplianceAxis = 'general' | 'org' | 'rh' | 'phy' | 'tech' | 'access';

export type ComplianceStatus =
  | 'a_preparer'
  | 'en_cours'
  | 'conforme'
  | 'non_conforme'
  | 'non_existant'
  | 'non_applicable';

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
  totalApplicable: number;
  conformeCount: number;
  enCoursCount: number;
  nonConformeCount: number;
  nonExistantCount: number;
  aPreparerCount: number;
  nonApplicableCount: number;
  subItemsDone: number;
  subItemsTotal: number;
  readinessPercent: number;
}

export interface ComplianceMetrics {
  totalItems: number;
  totalApplicable: number;
  conformeCount: number;
  enCoursCount: number;
  nonConformeCount: number;
  aPreparerCount: number;
  nonExistantCount: number;
  nonApplicableCount: number;
  subItemsDone: number;
  subItemsTotal: number;
  readinessPercent: number;
  byAxis: ComplianceAxisSummary[];
}
