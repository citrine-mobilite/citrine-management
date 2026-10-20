import { 
  pgTable, 
  serial, 
  bigserial,
  bigint,
  text, 
  integer, 
  boolean, 
  timestamp, 
  numeric,
  jsonb,
  uuid,
  primaryKey
} from 'drizzle-orm/pg-core';

// ==============================================================================
// 1. Table des Rôles (Gestion centralisée des rôles & permissions)
// ==============================================================================
export const roles = pgTable('roles', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  docId: text('doc_id').notNull().unique(),
  name: text('name').notNull().unique(),
  code: text('code').notNull().unique(),
  description: text('description'),
  permissions: jsonb('permissions'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// 2. Table des Utilisateurs & Comptes d'Accès
// ==============================================================================
export const users = pgTable('users', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  docId: text('doc_id'),
  uid: uuid('uid').notNull().unique(),
  email: text('email').notNull().unique(),
  name: text('name'),
  roleId: bigint('role_id', { mode: 'number' }),
  status: boolean('status').default(true),
  department: text('department'),
  phone: text('phone').unique(),
  avatarUrl: text('avatar_url'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// 3. Table des Employés / Collaborateurs RH
// ==============================================================================
export const employees = pgTable('employees', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  docId: text('doc_id').notNull().unique(),
  userId: uuid('user_id'),
  roleId: bigint('role_id', { mode: 'number' }),
  name: text('name'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email').unique(),
  phone: text('phone').unique(),
  roleType: text('role_type'),
  department: text('department'),
  position: text('position'),
  status: boolean('status').default(true),
  hireDate: text('hire_date'),
  departureDate: text('departure_date'),
  salary: numeric('salary').default('0'),
  avatarUrl: text('avatar_url'),
  managerId: text('manager_id'),
  team: text('team'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// 3. Table des Tâches Opérationnelles & Jalons
// ==============================================================================
export const tasks = pgTable('tasks', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  docId: text('doc_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  date: text('date'),
  time: text('time'),
  status: text('status').default('todo'),
  priority: text('priority').default('medium'),
  assignedTo: text('assigned_to'),
  employeeId: text('employee_id'),
  department: text('department'),
  projectId: text('project_id'),
  dueDate: text('due_date'),
  isMilestone: boolean('is_milestone').default(false),
  milestoneProgress: numeric('milestone_progress').default('0'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// 4. Table des Projets de Tâches
// ==============================================================================
export const taskProjects = pgTable('task_projects', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  docId: text('doc_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color'),
  icon: text('icon'),
  memberIds: jsonb('member_ids'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// 5. Table des Rappels & Notifications Planifiées
// ==============================================================================
export const reminders = pgTable('reminders', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  docId: text('doc_id').notNull(),
  title: text('title').notNull(),
  note: text('note'),
  date: text('date'),
  time: text('time'),
  location: text('location'),
  employeeId: text('employee_id'),
  allEmployees: boolean('all_employees').default(false),
  triggerBefore: text('trigger_before'),
  triggered: boolean('triggered').default(false),
  stopped: boolean('stopped').default(false),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// 6. Table des Pointages & Présences
// ==============================================================================
export const presences = pgTable('presences', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  docId: text('doc_id').notNull(),
  employeeId: text('employee_id'),
  date: text('date'),
  status: boolean('status').default(true),
  arrivalTime: text('arrival_time'),
  pauseStart: text('pause_start'),
  pauseEnd: text('pause_end'),
  departureTime: text('departure_time'),
  clockingMethod: text('clocking_method'),
  location: text('location'),
  siteName: text('site_name'),
  latitude: numeric('latitude'),
  longitude: numeric('longitude'),
  correctionReason: text('correction_reason'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// 7. Table des Incidents de Pointage & Justifications
// ==============================================================================
export const attendanceIncidents = pgTable('attendance_incidents', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  docId: text('doc_id').notNull(),
  employeeId: text('employee_id'),
  employeeName: text('employee_name'),
  date: text('date'),
  timeString: text('time_string'),
  type: text('type'),
  origin: text('origin'),
  reason: text('reason'),
  isDeclaredInAdvance: boolean('is_declared_in_advance').default(false),
  isJustified: boolean('is_justified').default(false),
  status: text('status').default('en_attente'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// 8. Table des Codes de Badges Sécurisés 16 Caractères
// ==============================================================================
export const badgeCodes16 = pgTable('badge_codes_16', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  docId: text('doc_id').notNull(),
  code: text('code').notNull(),
  formattedCode: text('formatted_code'),
  generatedBy: text('generated_by'),
  targetMonth: text('target_month'),
  isUsed: boolean('is_used').default(false),
  usedByEmployeeId: text('used_by_employee_id'),
  usedByEmployeeName: text('used_by_employee_name'),
  usedAt: text('used_at'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// 9. Table des Sessions QR Code Dynamiques
// ==============================================================================
export const dynamicQrSessions = pgTable('dynamic_qr_sessions', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  docId: text('doc_id').notNull(),
  sessionId: text('session_id'),
  token: text('token'),
  generatedBy: text('generated_by'),
  status: boolean('status').default(true),
  expiresAt: text('expires_at'),
  usedByEmployeeId: text('used_by_employee_id'),
  action: text('action'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// 10. Table de l'Inventaire & Équipements
// ==============================================================================
export const inventory = pgTable('inventory', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  docId: text('doc_id').notNull(),
  name: text('name').notNull(),
  designation: text('designation'),
  category: text('category'),
  quantity: integer('quantity').default(0),
  status: boolean('status').default(true),
  location: text('location'),
  reference: text('reference'),
  serialNumber: text('serial_number'),
  unitPrice: numeric('unit_price').default('0'),
  assignedToId: text('assigned_to_id'),
  isDonated: boolean('is_donated').default(false),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// 11. Table du Conseil de Discipline & Sanctions
// ==============================================================================
export const disciplinaryIncidents = pgTable('disciplinary_incidents', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  docId: text('doc_id').notNull(),
  employeeId: text('employee_id'),
  employeeName: text('employee_name'),
  date: text('date'),
  category: text('category'),
  severity: text('severity'),
  title: text('title'),
  description: text('description'),
  reportedBy: text('reported_by'),
  sanctionType: text('sanction_type'),
  sanctionDate: text('sanction_date'),
  status: boolean('status').default(true),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// 12. Table des Départements & Organigramme
// ==============================================================================
export const departments = pgTable('departments', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  docId: text('doc_id').notNull(),
  name: text('name').notNull(),
  code: text('code'),
  description: text('description'),
  color: text('color'),
  iconName: text('icon_name'),
  managerId: text('manager_id'),
  managerName: text('manager_name'),
  parentDepartmentId: text('parent_department_id'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// 13. Table des Documents Officiels Générés RH / Juridique
// ==============================================================================
export const documents = pgTable('documents', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  docId: text('doc_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category'),
  formatType: text('format_type'),
  authorId: text('author_id'),
  templateId: text('template_id'),
  employeeId: text('employee_id'),
  employeeName: text('employee_name'),
  targetDate: text('target_date'),
  signatureType: text('signature_type'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// 14. Table des Modèles de Documents RH (Templates)
// ==============================================================================
export const rhDocumentTemplates = pgTable('rh_document_templates', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  docId: text('doc_id').notNull(),
  name: text('name').notNull(),
  category: text('category'),
  formatType: text('format_type'),
  description: text('description'),
  bodyTemplate: text('body_template'),
  isCustom: boolean('is_custom').default(false),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// 15. Table des Dettes & Avances sur Salaire
// ==============================================================================
export const processflowSalaryDebts = pgTable('processflow_salary_debts', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  docId: text('doc_id').notNull(),
  employeeId: text('employee_id'),
  employeeName: text('employee_name'),
  totalLoanAmount: numeric('total_loan_amount').default('0'),
  monthlyInstallment: numeric('monthly_installment').default('0'),
  totalMonths: integer('total_months').default(1),
  installmentNumber: integer('installment_number').default(1),
  dueDate: text('due_date'),
  status: boolean('status').default(true),
  reason: text('reason'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// 16. Table des Paiements de Salaires & Fiches de Paie
// ==============================================================================
export const salaryPayments = pgTable('salary_payments', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  docId: text('doc_id').notNull(),
  employeeId: text('employee_id'),
  period: text('period'),
  baseAmount: numeric('base_amount').default('0'),
  bonusAmount: numeric('bonus_amount').default('0'),
  advanceAmount: numeric('advance_amount').default('0'),
  deductions: numeric('deductions').default('0'),
  netAmount: numeric('net_amount').default('0'),
  status: boolean('status').default(true),
  paymentMethod: text('payment_method'),
  paidAt: text('paid_at'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// 17. Table des Transactions Financières & Trésorerie
// ==============================================================================
export const financialTransactions = pgTable('financial_transactions', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  docId: text('doc_id').notNull(),
  date: text('date'),
  type: text('type'),
  category: text('category'),
  amount: numeric('amount').default('0'),
  description: text('description'),
  recipientOrSource: text('recipient_or_source'),
  status: boolean('status').default(true),
  proofUrl: text('proof_url'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// 18. Table des Partenaires Mobilité & Prestataires
// ==============================================================================
export const partners = pgTable('partners', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  docId: text('doc_id').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  phone: text('phone'),
  email: text('email'),
  category: text('category'),
  status: boolean('status').default(true),
  address: text('address'),
  notes: text('notes'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// 19. Table des Notifications & Alertes Système
// ==============================================================================
export const notifications = pgTable('notifications', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  docId: text('doc_id').notNull(),
  title: text('title').notNull(),
  message: text('message'),
  content: text('content'),
  type: text('type'),
  recipient: text('recipient'),
  targetUserId: text('target_user_id'),
  isRead: boolean('is_read').default(false),
  payload: text('payload'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// 20. Table des Paramètres Entreprise & Feature Flags
// ==============================================================================
export const companySettings = pgTable('company_settings', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  docId: text('doc_id').notNull(),
  name: text('name'),
  companyName: text('company_name'),
  workStartTime: text('work_start_time'),
  plannedDepartureTime: text('planned_departure_time'),
  qrCodeSecret: text('qr_code_secret'),
  doorQrCodeToken: text('door_qr_code_token'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// 21. Table des Appels VoIP Audio/Vidéo WebRTC
// ==============================================================================
export const calls = pgTable('calls', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  docId: text('doc_id').notNull(),
  callerId: text('caller_id'),
  callerName: text('caller_name'),
  calleeId: text('callee_id'),
  calleeName: text('callee_name'),
  type: text('type').default('audio'),
  status: boolean('status').default(true),
  isGroupCall: boolean('is_group_call').default(false),
  durationSeconds: integer('duration_seconds').default(0),
  startedAt: text('started_at'),
  endedAt: text('ended_at'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// 22. Table des Statuts de Connexion VoIP Collaborateurs
// ==============================================================================
export const userPresences = pgTable('user_presences', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  docId: text('doc_id').notNull(),
  userId: text('user_id'),
  userName: text('user_name'),
  userEmail: text('user_email'),
  role: text('role'),
  status: boolean('status').default(true),
  lastSeen: text('last_seen'),
  currentCallId: text('current_call_id'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// 23. Table des Offres d'Emploi (Recrutement ATS)
// ==============================================================================
export const jobOffers = pgTable('job_offers', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  docId: text('doc_id').notNull(),
  title: text('title').notNull(),
  department: text('department'),
  location: text('location'),
  contractType: text('contract_type'),
  openingsCount: integer('openings_count').default(1),
  description: text('description'),
  salaryRange: text('salary_range'),
  deadline: text('deadline'),
  status: boolean('status').default(true),
  createdBy: text('created_by'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// 24. Table des Candidatures (ATS Recrutement)
// ==============================================================================
export const jobApplications = pgTable('job_applications', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  docId: text('doc_id').notNull(),
  jobOfferId: text('job_offer_id'),
  jobOfferTitle: text('job_offer_title'),
  candidateName: text('candidate_name').notNull(),
  candidateEmail: text('candidate_email'),
  candidatePhone: text('candidate_phone'),
  candidateCity: text('candidate_city'),
  stage: text('stage').default('nouveau'),
  rating: integer('rating').default(0),
  experienceYears: integer('experience_years').default(0),
  interviewDate: text('interview_date'),
  appliedAt: text('applied_at'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// 25. Table des Notes de Frais & Dépenses de Mission
// ==============================================================================
export const expenseClaims = pgTable('expense_claims', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  docId: text('doc_id').notNull(),
  reference: text('reference'),
  employeeId: text('employee_id'),
  employeeName: text('employee_name'),
  employeeDepartment: text('employee_department'),
  title: text('title').notNull(),
  missionLocation: text('mission_location'),
  expenseDate: text('expense_date'),
  category: text('category'),
  amount: numeric('amount').default('0'),
  paymentMode: text('payment_mode'),
  status: boolean('status').default(true),
  approvedBy: text('approved_by'),
  approvedAt: text('approved_at'),
  reimbursedAt: text('reimbursed_at'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// 26. Table du Registre HSE (Hygiène, Sécurité, Environnement)
// ==============================================================================
export const hseIncidents = pgTable('hse_incidents', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  docId: text('doc_id').notNull(),
  reference: text('reference'),
  site: text('site').notNull(),
  zonePrecise: text('zone_precise'),
  type: text('type'),
  severity: text('severity'),
  date: text('date'),
  time: text('time'),
  title: text('title').notNull(),
  description: text('description'),
  reportedBy: text('reported_by'),
  victimName: text('victim_name'),
  daysLost: integer('days_lost').default(0),
  status: boolean('status').default(true),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// 27. Table du Registre d'Accueil & Visiteurs
// ==============================================================================
export const visitorLogs = pgTable('visitor_logs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  docId: text('doc_id').notNull(),
  visitorName: text('visitor_name').notNull(),
  visitorCompany: text('visitor_company'),
  visitorPhone: text('visitor_phone'),
  idCardNumber: text('id_card_number'),
  siteLocation: text('site_location'),
  purpose: text('purpose'),
  hostEmployeeId: text('host_employee_id'),
  hostEmployeeName: text('host_employee_name'),
  badgeNumber: text('badge_number'),
  vehiclePlate: text('vehicle_plate'),
  checkInTime: text('check_in_time'),
  checkInDate: text('check_in_date'),
  checkOutTime: text('check_out_time'),
  status: boolean('status').default(true),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// 28. Table de la Boîte à Idées & Suggestions
// ==============================================================================
export const ideaSuggestions = pgTable('idea_suggestions', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  docId: text('doc_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category'),
  isAnonymous: boolean('is_anonymous').default(false),
  authorName: text('author_name'),
  authorDepartment: text('author_department'),
  authorId: text('author_id'),
  status: boolean('status').default(true),
  likesCount: integer('likes_count').default(0),
  likedUserIds: jsonb('liked_user_ids'),
  managementResponse: text('management_response'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// 29. Table des Sondages d'Entreprise
// ==============================================================================
export const enterpriseSurveys = pgTable('enterprise_surveys', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  docId: text('doc_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category'),
  status: boolean('status').default(true),
  deadline: text('deadline'),
  createdBy: text('created_by'),
  options: jsonb('options'),
  votedUserIds: jsonb('voted_user_ids'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// 30. Table des Collections Génériques (Stockage Polymorphique)
// ==============================================================================
export const genericCollections = pgTable('generic_collections', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  collection: text('collection').notNull(),
  docId: text('doc_id').notNull(),
  data: jsonb('data').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// 31. Table des Journaux de Connexion & Sécurité d'Accès
// ==============================================================================
export const connectionLogs = pgTable('connection_logs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  docId: text('doc_id').notNull(),
  userId: text('user_id'),
  userName: text('user_name'),
  userEmail: text('user_email'),
  timestamp: text('timestamp'),
  ipAddress: text('ip_address'),
  location: text('location'),
  authMethod: text('auth_method'),
  status: boolean('status').default(true),
  details: text('details'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==============================================================================
// 32. Table du Journal d'Audit des Opérations Administratives RH
// ==============================================================================
export const adminAuditLogs = pgTable('admin_audit_logs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  docId: text('doc_id').notNull(),
  timestamp: text('timestamp'),
  authorName: text('author_name').notNull(),
  authorRole: text('author_role'),
  targetUserId: text('target_user_id'),
  targetEmployeeId: text('target_employee_id'),
  targetName: text('target_name').notNull(),
  operationType: text('operation_type').notNull(),
  operationLabel: text('operation_label'),
  details: text('details'),
  ipAddress: text('ip_address'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==============================================================================
// 33. Table des Absences RH (Constatées / Justifiées / Non Pointées)
// ==============================================================================
export const absences = pgTable('absences', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  docId: text('doc_id').notNull(),
  employeeId: text('employee_id').notNull(),
  employeeName: text('employee_name').notNull(),
  date: text('date').notNull(),
  type: text('type').default('journee_non_pointee'),
  reason: text('reason').default('Journée non pointée au bureau'),
  status: text('status').default('non_justifie'),
  justification: text('justification'),
  justifiedAt: text('justified_at'),
  justifiedBy: text('justified_by'),
  notified: boolean('notified').default(false),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

