export interface NotificationLog {
  id: string;
  type: 'whatsapp' | 'email' | 'system';
  recipient: string;
  title: string;
  content: string;
  payload: string;
  timestamp: string;
  read?: boolean;
}

export type DocumentFormatType = 'word' | 'excel';
export type DocumentCategory =
  | 'memo'
  | 'contract'
  | 'attestation'
  | 'certificate'
  | 'amendment'
  | 'internship'
  | 'mission'
  | 'discharge'
  | 'disciplinary'
  | 'job_description'
  | 'regulation'
  | 'evaluation'
  | 'procedure'
  | 'report'
  | 'other';

export interface TemplateField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'select';
  defaultValue: string;
  options?: string[];
  placeholder?: string;
}

export interface RHDocTemplate {
  id: string;
  name: string;
  category: DocumentCategory;
  formatType: DocumentFormatType;
  description: string;
  fields: TemplateField[];
  bodyTemplate: string;
  defaultSignature?: boolean;
  isCustom?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GeneratedDocument {
  id: string;
  title: string;
  description?: string;
  category: DocumentCategory;
  formatType?: DocumentFormatType;
  content?: string;
  createdAt: string;
  authorId?: string;
  templateId?: string;
  templateParams?: Record<string, any>;
  metadata?: any;
  employeeId?: string;
  employeeName?: string;
  targetDate?: string;
  targetReason?: string;
  isGeneric?: boolean; // Document générique (ex: trame, note générale non stockée en BD)
  saveToDatabase?: boolean; // Indique si persisté en base Firestore
  includeSignature?: boolean; // Par défaut FALSE (la signature ne doit pas être par défaut)
  signatureType?: 'none' | 'collaborator_only' | 'direction_only' | 'both';
}

export interface EmployeeSalaryDebt {
  id: string;
  employeeId: string;
  employeeName: string;
  totalLoanAmount: number;
  monthlyInstallment: number;
  totalMonths: number;
  installmentNumber: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'cancelled';
  reason: string;
  createdAt: string;
  paidAt?: string;
  paymentMethod?: 'salary_deduction' | 'manual_cash';
}

export interface SalaryPayment {
  id: string;
  employeeId: string;
  period: string;
  baseAmount: number;
  bonusAmount: number;
  advanceAmount: number;
  deductions: number;
  netAmount: number;
  status: 'draft' | 'approved' | 'paid';
  paymentMethod: 'transfer' | 'cash' | 'check' | 'other';
  paidAt?: string;
  notes?: string;
}

export interface FinancialTransaction {
  id: string;
  date: string;
  type: 'income' | 'expense' | 'salary';
  category: string;
  amount: number;
  description: string;
  recipientOrSource?: string;
  status: 'draft' | 'validated';
  proofUrl?: string;
  proofFileName?: string;
}

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

export type DisciplinaryStatus = 'ouvert' | 'en_instruction' | 'sanctionne' | 'classe';

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
  period: string; // e.g. "Octobre 2026"
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

export type InventoryItemStatus = 'neuf' | 'bon_etat' | 'usage' | 'endommage' | 'en_reparation' | 'hors_service';

export interface InventoryAssignment {
  id: string;
  employeeId: string;
  employeeName: string;
  quantity: number;
  status: InventoryItemStatus;
  assignedAt: string;
  notes?: string;
}

export interface InventoryMovement {
  id: string;
  type: 'entree' | 'affectation' | 'restitution' | 'maintenance' | 'declassement' | 'don';
  date: string;
  quantity: number;
  performedBy: string;
  recipientName?: string;
  employeeId?: string;
  itemStatus?: InventoryItemStatus;
  notes?: string;
}

export interface InventoryReturnRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  returnDate: string;
  quantity: number;
  returnCondition: 'parfait_etat' | 'usure_normale' | 'endommage' | 'incomplet' | 'hors_service';
  observations?: string;
  recordedBy: string;
}

export interface InventoryDonationRecord {
  id: string;
  itemId: string;
  itemDesignation: string;
  beneficiaryName: string;
  beneficiaryType: 'association' | 'ecole' | 'collaborateur' | 'partenaire' | 'autre';
  donationDate: string;
  quantity: number;
  estimatedValue?: number;
  motive: string;
  approvedBy: string;
  notes?: string;
}

export interface InventoryItem {
  id: string;
  designation: string;
  quantity: number;
  quantitiesByStatus?: Partial<Record<InventoryItemStatus, number>>;
  status: InventoryItemStatus;
  location: string;
  category?: string;
  reference?: string;
  serialNumber?: string;
  unitPrice?: number;
  assignedToId?: string;
  assignments?: InventoryAssignment[];
  movements?: InventoryMovement[];
  returns?: InventoryReturnRecord[];
  donations?: InventoryDonationRecord[];
  isDonated?: boolean;
  donatedTo?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PartnerCategory = 'Motoman' | 'Taximan' | 'Particulier' | 'Fournisseur' | 'Prestataire' | 'Autre';
export type PartnerStatus = 'actif' | 'inactif' | 'futur_partenaire';

export interface Partner {
  id: string;
  lastName: string;
  firstName: string;
  phone: string;
  email?: string;
  category: PartnerCategory;
  status: PartnerStatus;
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface CompanyModuleConfig {
  enablePresences?: boolean;
  enableCollaborators?: boolean;
  enableTasks?: boolean;
  enableReminders?: boolean;
  enableFinances: boolean;
  enableDocuments: boolean;
  enableCommunications: boolean;
  enableLogs: boolean;
  enableInventory: boolean;
  enablePartners: boolean;
  enableDiscipline?: boolean;
  enableOrgChart?: boolean;
  enableStatistics?: boolean;
  enableTeamCalls?: boolean;
  enableCalls?: boolean;
  enableBreakTracking?: boolean;
  plannedDepartureTime?: string;
  breakStartTime?: string;
  breakEndTime?: string;
  departureActiveStartTime?: string;
  companyName?: string;
  companyLatitude?: number;
  companyLongitude?: number;
  qrCodeSecret: string;
  officeWifiSsid?: string;
  allowedOfficeIPs: string[];
  siteLocations: Array<{ name: string; address: string; lat: number; lng: number }> | any[];
  hqName?: string;
  hqAddress?: string;
  hqLatitude?: number;
  hqLongitude?: number;
  workStartTime?: string;
  lateThresholdTime?: string;
  defaultSalary?: number;
  kioskPin?: string;
  companyLogoBase64?: string; // Logo de l'entreprise stocké tel quel en base de données Firestore (PNG/JPEG en base64)
  companyLogoUrl?: string; // URL directe vers le fichier image (non-SVG)
  companyLegalForm?: string;
  companyBaseline?: string;
  companyNui?: string;
  companyRccm?: string;
  companyCapital?: string;
  companyCity?: string;
  companyCountry?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  enableRecruitment?: boolean;
  enableExpenseClaims?: boolean;
  enableHse?: boolean;
  enableVisitors?: boolean;
  enableIdeasSurveys?: boolean;
}

export const DEFAULT_MODULE_CONFIG: CompanyModuleConfig = {
  enablePresences: true,
  enableCollaborators: true,
  enableTasks: true,
  enableReminders: true,
  enableFinances: true,
  enableDocuments: true,
  enableCommunications: true,
  enableLogs: true,
  enableInventory: true,
  enablePartners: true,
  enableDiscipline: true,
  enableOrgChart: true,
  enableStatistics: true,
  enableTeamCalls: true,
  enableCalls: true,
  enableBreakTracking: true,
  enableRecruitment: true,
  enableExpenseClaims: true,
  enableHse: true,
  enableVisitors: true,
  enableIdeasSurveys: true,
  plannedDepartureTime: '16:30',
  breakStartTime: '12:00',
  breakEndTime: '15:00',
  departureActiveStartTime: '16:00',
  companyName: 'Citrine Entreprise SARL',
  companyLatitude: 4.051056,
  companyLongitude: 9.7678687,
  qrCodeSecret: '',
  officeWifiSsid: '',
  allowedOfficeIPs: [],
  siteLocations: [],
  hqName: 'Siège Principal Citrine - Douala',
  hqAddress: 'Akwa - Boulevard de la Liberté, Douala',
  hqLatitude: 4.051056,
  hqLongitude: 9.7678687,
  workStartTime: '08:00',
  lateThresholdTime: '08:30',
  defaultSalary: 200000,
  companyLogoUrl: '/citrine-logo.png',
  companyLegalForm: 'Société à Responsabilité Limitée (SARL)',
  companyBaseline: 'Innovating · Prospering | Improving · Inspiring',
  companyNui: 'M012618579246S',
  companyRccm: 'CM-DLA-01-2026-B13-00011',
  companyCapital: '10 000 000 FRANCS CFA',
  companyCity: 'Douala',
  companyCountry: 'Cameroun',
  companyPhone: '+237 680 59 40 77',
  companyEmail: 'info@citrine-mobilite.com',
  companyWebsite: 'https://citrine-mobilite.com',
};

// ==========================================
// MODULE 1 : RECRUTEMENT & VIVIER DE CANDIDATURES (ATS)
// ==========================================
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
  rating?: number; // 1 to 5
  notes?: string;
  interviewDate?: string;
  interviewFeedback?: string;
  resumeFileName?: string;
  tags?: string[];
  appliedAt: string;
  updatedAt?: string;
}

// ==========================================
// MODULE 2 : NOTES DE FRAIS & DÉPENSES DE MISSION
// ==========================================
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
  reference: string; // e.g. "NDF-2026-0042"
  employeeId: string;
  employeeName: string;
  employeeDepartment?: string;
  title: string;
  missionLocation?: string;
  expenseDate: string;
  category: ExpenseCategory;
  amount: number; // in XAF
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

// ==========================================
// MODULE 3 : REGISTRE HYGIÈNE, SÉCURITÉ & ENVIRONNEMENT (HSE)
// ==========================================
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
  reference: string; // e.g. "HSE-2026-0012"
  site: string; // e.g. "Base Logistique Japoma", "Siège Akwa", "Atelier Mécanique"
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

// ==========================================
// MODULE 4 : REGISTRE D'ACCUEIL & VISITEURS DU SIÈGE (JAPOMA / AKWA)
// ==========================================
export type VisitorPurpose = 
  | 'rdv_commercial' 
  | 'entretien_embauche' 
  | 'livraison_colis' 
  | 'prestataire_technique' 
  | 'partenaire_institutionnel' 
  | 'reunion_direction' 
  | 'autre';

export type VisitorStatus = 'sur_site' | 'sorti' | 'attendu';

export interface VisitorLog {
  id: string;
  visitorName: string;
  visitorCompany?: string;
  visitorPhone: string;
  idCardNumber?: string;
  siteLocation: string; // "Base Logistique Japoma" | "Siège Akwa"
  purpose: VisitorPurpose;
  hostEmployeeId?: string;
  hostEmployeeName: string;
  hostDepartment?: string;
  badgeNumber: string;
  vehiclePlate?: string;
  checkInTime: string; // ISO ou "HH:mm"
  checkInDate: string; // YYYY-MM-DD
  checkOutTime?: string;
  status: VisitorStatus;
  notes?: string;
  createdAt: string;
}

// ==========================================
// MODULE 5 : BOÎTE À IDÉES, SIGNALEMENTS & SONDAGES D'ENTREPRISE
// ==========================================
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
