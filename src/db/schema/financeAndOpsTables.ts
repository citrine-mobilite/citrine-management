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

// 10. Table de l'Inventaire & Équipements
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

// 15. Table des Dettes & Avances sur Salaire
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

// 16. Table des Paiements de Salaires & Fiches de Paie
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

// 17. Table des Transactions Financières & Trésorerie
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

// 18. Table des Partenaires Mobilité & Prestataires
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

// 19. Table des Notifications & Alertes Système
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

// 21. Table des Appels VoIP Audio/Vidéo WebRTC
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

// 22. Table des Statuts de Connexion VoIP Collaborateurs
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
