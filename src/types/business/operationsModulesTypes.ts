// MODULE 1 : RECRUTEMENT & VIVIER DE CANDIDATURES (ATS)
export type JobContractType = 'CDI' | 'CDD' | 'Stage' | 'Prestation' | 'Temps Partiel';
export type JobOfferStatus = 'ouvert' | 'en_cours' | 'cloture' | 'suspendu';

export interface JobOffer {
  id: string;
  title: string;
  department: string;
  location: string;
  contractType: JobContractType;
  openingsCount: number;
  description: string;
  requirements: string[];
  salaryRange?: string;
  deadline?: string;
  status: JobOfferStatus;
  createdAt: string;
  createdBy: string;
}

export type ApplicationStage =
  | 'nouveau'
  | 'en_revue'
  | 'entretien_rh'
  | 'entretien_technique'
  | 'offre_proposee'
  | 'embauche'
  | 'rejete';

export interface JobApplication {
  id: string;
  jobOfferId: string;
  jobOfferTitle: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  candidateCity: string;
  currentPosition?: string;
  experienceYears: number;
  educationLevel?: string;
  stage: ApplicationStage;
  rating?: number;
  notes?: string;
  interviewDate?: string;
  interviewFeedback?: string;
  resumeFileName?: string;
  tags?: string[];
  appliedAt: string;
  updatedAt?: string;
}

// MODULE 2 : NOTES DE FRAIS & DÉPENSES DE MISSION
export type ExpenseCategory =
  | 'transport'
  | 'carburant'
  | 'hebergement'
  | 'restauration'
  | 'peage'
  | 'materiel_urgence'
  | 'telecom'
  | 'autre';

export type ExpenseClaimStatus =
  | 'soumis'
  | 'en_verification'
  | 'approuve'
  | 'rejete'
  | 'rembourse';

export type PaymentMode = 'virement' | 'cash' | 'orange_money' | 'mtn_momo';

export interface ExpenseClaim {
  id: string;
  reference: string;
  employeeId: string;
  employeeName: string;
  employeeDepartment?: string;
  title: string;
  missionLocation?: string;
  expenseDate: string;
  category: ExpenseCategory;
  amount: number;
  receiptNumber?: string;
  receiptDescription?: string;
  paymentMode: PaymentMode;
  status: ExpenseClaimStatus;
  approvedBy?: string;
  approvedAt?: string;
  reimbursedAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
}

// MODULE 3 : REGISTRE HYGIÈNE, SÉCURITÉ & ENVIRONNEMENT (HSE)
export type HseIncidentType =
  | 'presque_accident'
  | 'situation_dangereuse'
  | 'accident_sans_arret'
  | 'accident_avec_arret'
  | 'deversement_chimique'
  | 'degradation_materiel'
  | 'incendie_debut';

export type HseSeverity = 'faible' | 'modere' | 'grave' | 'critique';
export type HseStatus = 'signale' | 'en_cours_analyse' | 'actions_lancees' | 'cloture';

export interface HseCorrectiveAction {
  id: string;
  action: string;
  assigneeName: string;
  deadline: string;
  isCompleted: boolean;
  completedAt?: string;
}

export interface HseIncident {
  id: string;
  reference: string;
  site: string;
  zonePrecise?: string;
  type: HseIncidentType;
  severity: HseSeverity;
  date: string;
  time?: string;
  title: string;
  description: string;
  reportedBy: string;
  reportedByRole?: string;
  victimName?: string;
  victimInjury?: string;
  daysLost?: number;
  immediateActionTaken?: string;
  rootCause?: string;
  status: HseStatus;
  correctiveActions: HseCorrectiveAction[];
  createdAt: string;
}

// MODULE 4 : REGISTRE D'ACCUEIL & VISITEURS DU SIÈGE (JAPOMA / AKWA)
export type VisitorPurpose =
  | 'rdv_commercial'
  | 'entretien_embauche'
  | 'livraison_colis'
  | 'prestataire_technique'
  | 'partenaire_institutionnel'
  | 'reunion_direction'
  | 'autre';

export type VisitorStatus = 'sur_site' | 'sorti' | 'attendu' | 'attente_validation' | 'refuse';

export type PersonType = 'visiteur' | 'travailleur';
export type WorkerDomain = 'electricite' | 'plomberie' | 'maconnerie' | 'climatisation_maintenance' | 'autre';

export const BUILDING_SUPERVISORS = [
  { domain: 'electricite', label: 'Électricité', supervisorName: 'Ing. Mbah (Superviseur Électricité)' },
  { domain: 'plomberie', label: 'Plomberie', supervisorName: 'Jean-Pierre Tientcheu (Superviseur Plomberie)' },
  { domain: 'maconnerie', label: 'Maçonnerie / BTP', supervisorName: 'Marc Kouam (Superviseur Maçonnerie)' },
  { domain: 'climatisation_maintenance', label: 'Climatisation & Maintenance', supervisorName: 'Ibrahim Aboubakar (Superviseur Maintenance)' },
  { domain: 'autre', label: 'Autre Intervention', supervisorName: 'Direction Technique Générale' },
];

export interface VisitorLog {
  id: string;
  docId?: string;
  personType?: PersonType;
  workerDomain?: WorkerDomain;
  supervisorName?: string;
  interventionPerimeter?: string;
  isPreAuthorized?: boolean;
  authorizationConfirmed?: boolean;
  visitorName: string;
  visitorCompany?: string;
  visitorPhone: string;
  idCardNumber?: string;
  siteLocation: string;
  purpose: VisitorPurpose;
  hostEmployeeId?: string;
  hostEmployeeName: string;
  hostDepartment?: string;
  badgeNumber: string;
  vehiclePlate?: string;
  checkInTime: string;
  checkInDate: string;
  checkOutTime?: string;
  status: VisitorStatus;
  notes?: string;
  createdAt: string;
}

// MODULE 5 : BOÎTE À IDÉES, SIGNALEMENTS & SONDAGES D'ENTREPRISE
export type IdeaCategory =
  | 'innovation_logistique'
  | 'vie_au_bureau'
  | 'processus_outils'
  | 'bien_etre_securite'
  | 'environnement_rse';

export type IdeaStatus = 'soumise' | 'a_letude' | 'retenue_test' | 'deployee' | 'archivee';

export interface IdeaSuggestion {
  id: string;
  title: string;
  description: string;
  category: IdeaCategory;
  isAnonymous: boolean;
  authorName?: string;
  authorDepartment?: string;
  authorId?: string;
  status: IdeaStatus;
  likesCount: number;
  likedUserIds: string[];
  managementResponse?: string;
  createdAt: string;
}

export interface SurveyOption {
  id: string;
  text: string;
  votesCount: number;
}

export interface EnterpriseSurvey {
  id: string;
  title: string;
  description: string;
  category?: string;
  status: 'actif' | 'clos';
  deadline?: string;
  createdBy: string;
  options: SurveyOption[];
  votedUserIds: string[];
  createdAt: string;
}
