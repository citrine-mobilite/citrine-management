import {
  pgTable,
  bigserial,
  text,
  integer,
  boolean,
  timestamp,
  numeric,
  jsonb,
} from 'drizzle-orm/pg-core';

// 23. Table des Offres d'Emploi (Recrutement ATS)
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

// 24. Table des Candidatures (ATS Recrutement)
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

// 25. Table des Notes de Frais & Dépenses de Mission
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

// 26. Table du Registre HSE (Hygiène, Sécurité, Environnement)
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

// 27. Table du Registre d'Accueil & Visiteurs
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

// 28. Table de la Boîte à Idées & Suggestions
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

// 29. Table des Sondages d'Entreprise
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

// 30. Table des Collections Génériques (Stockage Polymorphique)
export const genericCollections = pgTable('generic_collections', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  collection: text('collection').notNull(),
  docId: text('doc_id').notNull(),
  data: jsonb('data').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 31. Table des Journaux de Connexion & Sécurité d'Accès
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

// 32. Table du Journal d'Audit des Opérations Administratives RH
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
