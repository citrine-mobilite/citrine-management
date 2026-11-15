import {
  pgTable,
  bigserial,
  text,
  boolean,
  timestamp,
  numeric,
  jsonb,
} from 'drizzle-orm/pg-core';

// 6. Table des Pointages & Présences
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

// 7. Table des Incidents de Pointage & Justifications
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

// 8. Table des Codes de Badges Sécurisés 16 Caractères
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

// 9. Table des Sessions QR Code Dynamiques
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

// 11. Table du Conseil de Discipline & Sanctions
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

// 12. Table des Départements & Organigramme
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

// 13. Table des Documents Officiels Générés RH / Juridique
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

// 14. Table des Modèles de Documents RH (Templates)
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

// 33. Table des Absences RH (Constatées / Justifiées / Non Pointées)
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
