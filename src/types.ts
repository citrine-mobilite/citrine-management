export type Role = 'Administrateur' | 'Employé' | 'Responsable';

export type UserRole = 'administrateur' | 'responsable' | 'employé';
export type UserStatus = 'actif' | 'inactif';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  authMethod?: 'google' | 'password';
  passwordHash?: string;
  avatarUrl?: string;
  department?: string;
  phone?: string;
  createdAt: string; // ISO string
  lastLoginAt?: string;
}

export interface ConnectionLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: string; // ISO string
  ipAddress?: string;
  location?: string;
  authMethod: 'google' | 'password';
  status: 'success' | 'failed';
  userAgent?: string;
  details?: string;
}

export type EmployeeRoleType = 'employé' | 'gestionnaire de projet' | 'stagiaire' | 'gestionnaire de projet assistant' | 'sponsor' | 'informaticien' | 'comptable' | 'rh' | 'finance';

export type EmployeeStatus = 'en_poste' | 'en_conge' | 'parti' | 'renvoye' | 'suspendu' | 'maladie';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  roleType: EmployeeRoleType;
  department?: string;
  status?: EmployeeStatus;
  hireDate?: string;        // Date d'arrivée (YYYY-MM-DD)
  departureDate?: string;   // Date de départ (YYYY-MM-DD)
  departureReason?: string; // Motif de départ
  birthDate?: string;       // Date de naissance / anniversaire (YYYY-MM-DD)
  salary?: number;          // Salaire mensuel de base (€)
}

export type PresenceStatus = 'present' | 'late' | 'absent' | 'not_tracked';

export type EmergencyType = 'retard' | 'pause_anticipee' | 'rallonge_pause' | 'depart_anticipe';

export interface EmergencyDeclaration {
  id: string;
  type: EmergencyType;
  reason: string;
  timestamp: string; // ISO string
  timeString: string; // HH:MM
  status?: 'pending' | 'approved' | 'rejected'; // Status of the emergency declaration
}

export type ClockingMethod = 'qr_code' | 'gps' | 'wifi_ip' | 'site_declaration' | 'manual_admin' | 'kiosk_pin' | 'badge_code_16';

export interface BadgeSecurityCode16 {
  id: string;
  code: string; // 16 raw characters (e.g., "A9K38F2X1L7M4P9Z")
  formattedCode: string; // Formatted display (e.g., "A9K3-8F2X-1L7M-4P9Z")
  generatedBy: string; // Responsable or Admin name
  createdAt: string; // ISO string
  targetMonth: string; // YYYY-MM
  isUsed: boolean;
  usedByEmployeeId?: string;
  usedByEmployeeName?: string;
  usedAt?: string; // ISO string
  usedMonth?: string; // YYYY-MM
  notes?: string;
}

export interface Presence {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  arrivalTime: string | null;   // HH:MM
  pauseStart: string | null;    // HH:MM
  pauseEnd: string | null;      // HH:MM
  departureTime: string | null;  // HH:MM
  status: PresenceStatus;
  correctionReason?: string | null;
  correctionReasonStatus?: 'pending' | 'approved' | 'rejected' | null; // Status of correction/late reason
  departureReason?: string | null; // Motif de sortie après 17h30
  departureReasonStatus?: 'pending' | 'approved' | 'rejected' | null; // Status of departure reason
  emergencies?: EmergencyDeclaration[]; // Urgences signalées
  location?: string;            // Nom de la zone (ex: "Douala, Japoma")
  latitude?: number;            // Coordonnée GPS Latitude
  longitude?: number;           // Coordonnée GPS Longitude
  clockingMethod?: ClockingMethod;
  siteName?: string;            // Ex: "Bureau Principal (HQ)", "Site Client Akwa", "Télétravail"
  qrCodeToken?: string;         // Token QR Code validé
  ipAddress?: string;           // IP ou réseau Wi-Fi de pointage
  deviceId?: string;            // Empreinte unique de l'appareil (Anti-fraude)
  clockLocations?: {
    arrival?: { latitude: number; longitude: number; zoneName: string; time: string; method?: ClockingMethod; siteName?: string };
    pauseStart?: { latitude: number; longitude: number; zoneName: string; time: string; method?: ClockingMethod; siteName?: string };
    pauseEnd?: { latitude: number; longitude: number; zoneName: string; time: string; method?: ClockingMethod; siteName?: string };
    departure?: { latitude: number; longitude: number; zoneName: string; time: string; method?: ClockingMethod; siteName?: string };
  };
  updatedAt?: string; // ISO string
}

export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'pending_validation' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string; // ISO string
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
  size?: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  comments?: Comment[];
  subtasks?: Subtask[]; // recursive!
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  priority: TaskPriority;
  status: TaskStatus;
  comment?: string;
  difficultyAlertSent?: boolean;
  employeeId?: string; // Assigned collaborator
  comments?: Comment[];
  attachments?: Attachment[];
  incidents?: Incident[];
  subtasks?: Subtask[];
  lastUpdatedByRole?: Role;
  lastUpdatedTime?: string;
}

export type ReminderTrigger = '5m' | '15m' | '30m' | '1h' | '1d' | 'none';

export interface Reminder {
  id: string;
  date?: string; // YYYY-MM-DD (optional)
  time?: string; // HH:MM (optional)
  location?: string; // optional
  duration?: string; // optional
  note: string;
  triggerBefore: ReminderTrigger;
  triggerPeriods?: string[]; // array of trigger times (e.g., '0m', '5m', '10m', '15m', '30m', '1h')
  triggeredPeriods?: string[]; // track which periods have already rung
  triggered?: boolean;
  stopped?: boolean;
  employeeId?: string;
  employeeIds?: string[];
  createdAt: string;
}

export interface NotificationLog {
  id: string;
  type: 'whatsapp' | 'email' | 'system';
  recipient: string;
  title: string;
  content: string;
  payload: string; // JSON string of simulated webhook
  timestamp: string; // ISO string
  read?: boolean;
}

export type DocumentFormatType = 'word' | 'excel';

export type DocumentCategory = 'procedure' | 'contract' | 'memo' | 'report' | 'template' | 'other';

export interface GeneratedDocument {
  id: string;
  title: string;
  description?: string;
  category: DocumentCategory;
  formatType?: DocumentFormatType; // 'word' or 'excel'
  content?: string;
  createdAt: string; // ISO string
  authorId?: string;
  templateId?: string;
  templateParams?: Record<string, any>;
  metadata?: any;
  employeeId?: string;       // Linked to 1 specific collaborator
  employeeName?: string;     // Cached employee name
  targetDate?: string;       // Specific date or month/period (e.g. 2026-08 or 2026-08-03)
  targetReason?: string;     // Specific reason or context (e.g. "Contrat CDI Initial", "Frais de déplacement")
}

export interface EmployeeSalaryDebt {
  id: string;
  employeeId: string;
  employeeName: string;
  totalLoanAmount: number;
  monthlyInstallment: number;
  totalMonths: number;
  installmentNumber: number;
  dueDate: string; // e.g. "2026-08"
  status: 'pending' | 'paid' | 'cancelled';
  reason: string;
  createdAt: string;
  paidAt?: string;
  paymentMethod?: 'salary_deduction' | 'manual_cash';
}

export interface SalaryPayment {
  id: string;
  employeeId: string;
  period: string; // e.g. "Juillet 2026"
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
  date: string; // YYYY-MM-DD
  type: 'income' | 'expense' | 'salary';
  category: string;
  amount: number;
  description: string;
  recipientOrSource?: string;
  status: 'draft' | 'validated';
  proofUrl?: string;
  proofFileName?: string;
}

// 🚨 RH & Discipline : Registre des Incidents et Sanctions
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
  | 'explication_ecrite'      // Demande d'explication
  | 'rappel_a_l_ordre'        // Rappel verbal formalisé
  | 'avertissement'           // Avertissement officiel écrit
  | 'mise_en_demeure'         // Mise en demeure légale
  | 'mise_a_pied'             // Suspension temporaire conservatoire
  | 'licenciement_faute'      // Rupture pour faute
  | 'classe_sans_suite';      // Classé sans sanction

export type DisciplinaryStatus = 'ouvert' | 'en_instruction' | 'sanctionne' | 'classe';

export interface DisciplinaryIncident {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole?: string;
  employeeDepartment?: string;
  date: string;              // YYYY-MM-DD
  incidentTime?: string;     // HH:MM
  category: IncidentCategory;
  severity: IncidentSeverity;
  title: string;
  description: string;
  location?: string;
  witnesses?: string;        // Noms des témoins
  reportedBy: string;        // Nom de l'émetteur (Responsable / RH)
  reportedByRole?: string;
  employeeResponse?: string; // Réponse ou justifications apportées par le salarié
  sanctionType?: SanctionType;
  sanctionDate?: string;
  sanctionDetails?: string;
  status: DisciplinaryStatus;
  legalDeadlineDays?: number; // Délai légal pour répondre (ex: 48h / 3 jours)
  officialLetterGenerated?: boolean;
  officialLetterRef?: string;
  createdAt: string;
  updatedAt?: string;
}

// 🏢 Organigramme & Structure Hiérarchique
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

export type InventoryItemStatus = 
  | 'neuf' 
  | 'bon_etat' 
  | 'usage' 
  | 'endommage' 
  | 'en_reparation' 
  | 'hors_service';

export interface InventoryAssignment {
  id: string;
  employeeId: string;
  employeeName: string;
  quantity: number;
  status: InventoryItemStatus; // État du matériel assigné
  assignedAt: string; // ISO date
  notes?: string;
}

export interface InventoryItem {
  id: string;
  designation: string;    // Désignation du produit / matériel
  quantity: number;       // Quantité totale en stock (disponible)
  quantitiesByStatus?: Partial<Record<InventoryItemStatus, number>>; // Répartition par état (ex: { neuf: 4, usage: 10 })
  status: InventoryItemStatus; // État par défaut ou principal
  location: string;       // Emplacement (bureau, dépôt, etc.)
  category?: string;      // Ex: Matériel Informatique, Mobilier, Outillage, Fournitures
  reference?: string;     // SKU / Code de suivi
  unitPrice?: number;     // Prix unitaire estimé (FCFA)
  assignedToId?: string;  // ID de l'employé détenteur principal (rétrocompatibilité)
  assignments?: InventoryAssignment[]; // Liste des attributions en cours aux employés
  notes?: string;         // Remarques ou historique
  createdAt: string;      // ISO Date
  updatedAt: string;      // ISO Date
}

export type PartnerCategory = 'Motoman' | 'Taximan' | 'Particulier' | 'Fournisseur' | 'Prestataire' | 'Autre';
export type PartnerStatus = 'actif' | 'inactif' | 'futur_partenaire';

export interface Partner {
  id: string;
  lastName: string;       // Nom
  firstName: string;      // Prénom
  phone: string;          // Numéro de téléphone
  email?: string;         // Email (optionnel)
  category: PartnerCategory; // Type / Catégorie
  status: PartnerStatus;  // Statut
  address?: string;       // Adresse / Ville
  notes?: string;         // Notes ou détails
  createdAt: string;      // ISO Date
}

export interface CompanyModuleConfig {
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
  qrCodeSecret: string;
  officeWifiSsid?: string;
  allowedOfficeIPs: string[];
  siteLocations: Array<{ name: string; address: string; lat: number; lng: number }> | any[];
  hqName?: string;
  hqAddress?: string;
  hqLatitude?: number;
  hqLongitude?: number;
  workStartTime?: string;      // Ex. "08:00"
  lateThresholdTime?: string;  // Ex. "08:15"
  defaultSalary?: number;      // Salaire de base par défaut
  kioskPin?: string;           // Code PIN de pointage borne dynamique stocké en BD
}

export const DEFAULT_MODULE_CONFIG: CompanyModuleConfig = {
  enableFinances: false,
  enableDocuments: false,
  enableCommunications: false,
  enableLogs: false,
  enableInventory: false,
  enablePartners: false,
  enableDiscipline: true,
  enableOrgChart: true,
  enableStatistics: true,
  enableTeamCalls: true,
  enableCalls: true,
  qrCodeSecret: "",
  officeWifiSsid: "",
  allowedOfficeIPs: [],
  siteLocations: [],
  hqName: "",
  hqAddress: "",
  hqLatitude: 0,
  hqLongitude: 0,
  workStartTime: "08:00",
  lateThresholdTime: "08:15",
  defaultSalary: 0
};

// 📞 VoIP & Inter-Colleague Call Types
export type CallType = 'audio' | 'video';

export type CallStatus = 
  | 'ringing'      // L'appel sonne chez le destinataire
  | 'connected'    // Les collègues sont en communication
  | 'rejected'     // Le destinataire a refusé l'appel
  | 'ended'        // Appel terminé normalement
  | 'missed'       // Non répondu après le délai de sonnerie
  | 'busy';        // Le collègue est déjà en ligne

export interface VoIPCallCandidate {
  fromUserId?: string;
  toUserId?: string;
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
  timestamp: number;
}

export interface VoIPCallSignal {
  id?: string;
  fromUserId: string;
  fromUserName?: string;
  toUserId: string;
  type: 'offer' | 'answer';
  sdp: string;
  timestamp: number;
}

export interface VoIPCallParticipant {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  role?: string;
  status: 'joined' | 'ringing' | 'rejected' | 'left';
  joinedAt?: string;
  isMuted?: boolean;
  isVideoOff?: boolean;
}

export interface VoIPCall {
  id: string;
  callerId: string;
  callerName: string;
  callerEmail?: string;
  callerAvatar?: string;
  callerRole?: string;
  calleeId: string;
  calleeName: string;
  calleeEmail?: string;
  calleeAvatar?: string;
  calleeRole?: string;
  invitedBy?: string;
  isGroupCall?: boolean;
  participants?: VoIPCallParticipant[];
  type: CallType;
  status: CallStatus;
  createdAt: string;       // ISO Date
  startedAt?: string;     // ISO Date when accepted
  endedAt?: string;       // ISO Date when ended
  durationSeconds?: number;
  offer?: {
    type: 'offer';
    sdp: string;
  };
  answer?: {
    type: 'answer';
    sdp: string;
  };
  callerCandidates?: VoIPCallCandidate[];
  calleeCandidates?: VoIPCallCandidate[];
  isScreenSharing?: boolean;
}

export interface UserOnlinePresence {
  id: string;           // userId
  userId: string;
  userName: string;
  userEmail: string;
  avatarUrl?: string;
  role: string;
  status: 'online' | 'in_call' | 'away' | 'offline';
  lastSeen: string;     // ISO Date
  currentCallId?: string;
  device?: string;
}


