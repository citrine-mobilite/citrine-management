import {
  pgTable,
  bigserial,
  bigint,
  text,
  boolean,
  timestamp,
  numeric,
  jsonb,
  uuid,
} from 'drizzle-orm/pg-core';

// 1. Table des Rôles (Gestion centralisée des rôles & permissions)
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

// 2. Table des Utilisateurs & Comptes d'Accès
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

// 3. Table des Employés / Collaborateurs RH
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

// 3b. Table des Tâches Opérationnelles & Jalons
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

// 4. Table des Projets de Tâches
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

// 5. Table des Rappels & Notifications Planifiées
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

// 20. Table des Paramètres Entreprise & Feature Flags
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
