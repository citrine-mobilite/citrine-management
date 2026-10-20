export type AbsenceType = 'non_pointe' | 'injustifiee' | 'declaree';
export type AbsenceStatus = 'injustifiee' | 'justifiee' | 'en_attente';

export interface AbsenceRecord {
  id: string;
  doc_id?: string;
  uid?: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  reason: string;
  type: AbsenceType;
  origin: 'automatique_fin_de_journee' | 'constat_rh';
  status: AbsenceStatus;
  department?: string;
  justification?: string;
  justifiedAt?: string;
  justifiedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}
