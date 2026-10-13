-- ==============================================================================
-- CITRINE MANAGEMENT - SCHÉMA COMPLET SUPABASE POSTGRESQL (ID AUTO-INCRÉMENTÉS)
-- Project ID: svvgziqcdahkgyugqlvk
-- URL de l'éditeur SQL Supabase :
-- https://supabase.com/dashboard/project/svvgziqcdahkgyugqlvk/sql/new
-- ==============================================================================
-- TOUS LES IDENTIFIANTS PRINCIPAUX SONT DÉSORMAIS DES NOMBRES AUTO-INCRÉMENTÉS :
--   id BIGSERIAL PRIMARY KEY (1, 2, 3, ...) sur chacune des 30 tables !
-- 
-- Un identifiant de document applicatif 'doc_id TEXT UNIQUE' est également conservé
-- sur chaque table pour garantir la compatibilité ascendante et l'upsert sans conflit.
-- ==============================================================================

-- Extension UUID si nécessaire
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- SECTION 0 : SUPPRESSION PROPRE DES ANCIENNES TABLES (AVEC ID TEXTUELS)
-- ==============================================================================
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.task_projects CASCADE;
DROP TABLE IF EXISTS public.reminders CASCADE;
DROP TABLE IF EXISTS public.presences CASCADE;
DROP TABLE IF EXISTS public.attendance_incidents CASCADE;
DROP TABLE IF EXISTS public.badge_codes_16 CASCADE;
DROP TABLE IF EXISTS public.dynamic_qr_sessions CASCADE;
DROP TABLE IF EXISTS public.inventory CASCADE;
DROP TABLE IF EXISTS public.disciplinary_incidents CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.rh_document_templates CASCADE;
DROP TABLE IF EXISTS public.processflow_salary_debts CASCADE;
DROP TABLE IF EXISTS public.salary_payments CASCADE;
DROP TABLE IF EXISTS public.financial_transactions CASCADE;
DROP TABLE IF EXISTS public.partners CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.company_settings CASCADE;
DROP TABLE IF EXISTS public.calls CASCADE;
DROP TABLE IF EXISTS public.user_presences CASCADE;
DROP TABLE IF EXISTS public.job_offers CASCADE;
DROP TABLE IF EXISTS public.job_applications CASCADE;
DROP TABLE IF EXISTS public.expense_claims CASCADE;
DROP TABLE IF EXISTS public.hse_incidents CASCADE;
DROP TABLE IF EXISTS public.visitor_logs CASCADE;
DROP TABLE IF EXISTS public.idea_suggestions CASCADE;
DROP TABLE IF EXISTS public.enterprise_surveys CASCADE;
DROP TABLE IF EXISTS public.generic_collections CASCADE;
DROP TABLE IF EXISTS public.pricing_records CASCADE;
DROP TABLE IF EXISTS public.pricing_settings CASCADE;
DROP TABLE IF EXISTS public.connection_logs CASCADE;
DROP TABLE IF EXISTS public.admin_audit_logs CASCADE;

-- ==============================================================================
-- SECTION 1 : CRÉATION DES TABLES AVEC ID BIGSERIAL (PRIMARY KEY)
-- ==============================================================================

-- 1. Table des Rôles (Gestion centralisée des rôles & permissions)
CREATE TABLE public.roles (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,
    name TEXT UNIQUE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table des Utilisateurs & Comptes d'Accès
CREATE TABLE public.users (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role_id BIGINT REFERENCES public.roles(id),
    status BOOLEAN DEFAULT TRUE,
    department TEXT,
    phone TEXT UNIQUE,
    avatar_url TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table des Employés / Collaborateurs RH
CREATE TABLE public.employees (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.users(uid),
    role_id BIGINT REFERENCES public.roles(id),
    name TEXT,
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    role_type TEXT,
    department TEXT,
    position TEXT,
    status BOOLEAN DEFAULT TRUE,
    hire_date TEXT,
    departure_date TEXT,
    salary NUMERIC DEFAULT 0,
    avatar_url TEXT,
    manager_id TEXT,
    team TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table des Tâches Opérationnelles & Jalons Stratégiques
CREATE TABLE public.tasks (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT,
    time TEXT,
    status BOOLEAN DEFAULT TRUE,
    priority TEXT DEFAULT 'medium',
    assigned_to TEXT,
    employee_id TEXT,
    department TEXT,
    project_id TEXT,
    due_date TEXT,
    is_milestone BOOLEAN DEFAULT FALSE,
    milestone_progress NUMERIC DEFAULT 0,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table des Projets de Tâches
CREATE TABLE public.task_projects (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT,
    icon TEXT,
    member_ids JSONB,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Table des Rappels & Notifications Planifiées
CREATE TABLE public.reminders (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    note TEXT,
    date TEXT,
    time TEXT,
    location TEXT,
    employee_id TEXT,
    all_employees BOOLEAN DEFAULT FALSE,
    trigger_before TEXT,
    triggered BOOLEAN DEFAULT FALSE,
    stopped BOOLEAN DEFAULT FALSE,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Table des Pointages & Présences
CREATE TABLE public.presences (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,
    employee_id TEXT,
    date TEXT,
    status BOOLEAN DEFAULT TRUE,
    arrival_time TEXT,
    pause_start TEXT,
    pause_end TEXT,
    departure_time TEXT,
    clocking_method TEXT,
    location TEXT,
    site_name TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    correction_reason TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Table des Incidents de Pointage & Justifications
CREATE TABLE public.attendance_incidents (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,
    employee_id TEXT,
    employee_name TEXT,
    date TEXT,
    time_string TEXT,
    type TEXT,
    origin TEXT,
    reason TEXT,
    is_declared_in_advance BOOLEAN DEFAULT FALSE,
    is_justified BOOLEAN DEFAULT FALSE,
    status BOOLEAN DEFAULT TRUE,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Table des Codes de Badges Sécurisés 16 Caractères
CREATE TABLE public.badge_codes_16 (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,
    code TEXT NOT NULL,
    formatted_code TEXT,
    generated_by TEXT,
    target_month TEXT,
    is_used BOOLEAN DEFAULT FALSE,
    used_by_employee_id TEXT,
    used_by_employee_name TEXT,
    used_at TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Table des Sessions QR Code Dynamiques
CREATE TABLE public.dynamic_qr_sessions (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,
    session_id TEXT,
    token TEXT,
    generated_by TEXT,
    status BOOLEAN DEFAULT TRUE,
    expires_at TEXT,
    used_by_employee_id TEXT,
    action TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Table de l'Inventaire & Équipements
CREATE TABLE public.inventory (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    designation TEXT,
    category TEXT,
    quantity INTEGER DEFAULT 0,
    status BOOLEAN DEFAULT TRUE,
    location TEXT,
    reference TEXT,
    serial_number TEXT,
    unit_price NUMERIC DEFAULT 0,
    assigned_to_id TEXT,
    is_donated BOOLEAN DEFAULT FALSE,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Table du Conseil de Discipline & Sanctions
CREATE TABLE public.disciplinary_incidents (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,
    employee_id TEXT,
    employee_name TEXT,
    date TEXT,
    category TEXT,
    severity TEXT,
    title TEXT,
    description TEXT,
    reported_by TEXT,
    sanction_type TEXT,
    sanction_date TEXT,
    status BOOLEAN DEFAULT TRUE,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Table des Départements & Organigramme
CREATE TABLE public.departments (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    color TEXT,
    icon_name TEXT,
    manager_id TEXT,
    manager_name TEXT,
    parent_department_id TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Table des Documents Officiels Générés RH / Juridique
CREATE TABLE public.documents (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    format_type TEXT,
    author_id TEXT,
    template_id TEXT,
    employee_id TEXT,
    employee_name TEXT,
    target_date TEXT,
    signature_type TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Table des Modèles de Documents RH (Templates)
CREATE TABLE public.rh_document_templates (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    format_type TEXT,
    description TEXT,
    body_template TEXT,
    is_custom BOOLEAN DEFAULT FALSE,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Table des Dettes & Avances sur Salaire
CREATE TABLE public.processflow_salary_debts (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,
    employee_id TEXT,
    employee_name TEXT,
    total_loan_amount NUMERIC DEFAULT 0,
    monthly_installment NUMERIC DEFAULT 0,
    total_months INTEGER DEFAULT 1,
    installment_number INTEGER DEFAULT 1,
    due_date TEXT,
    status BOOLEAN DEFAULT TRUE,
    reason TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Table des Paiements de Salaires & Fiches de Paie
CREATE TABLE public.salary_payments (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,
    employee_id TEXT,
    period TEXT,
    base_amount NUMERIC DEFAULT 0,
    bonus_amount NUMERIC DEFAULT 0,
    advance_amount NUMERIC DEFAULT 0,
    deductions NUMERIC DEFAULT 0,
    net_amount NUMERIC DEFAULT 0,
    status BOOLEAN DEFAULT TRUE,
    payment_method TEXT,
    paid_at TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Table des Transactions Financières & Trésorerie
CREATE TABLE public.financial_transactions (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,
    date TEXT,
    type TEXT,
    category TEXT,
    amount NUMERIC DEFAULT 0,
    description TEXT,
    recipient_or_source TEXT,
    status BOOLEAN DEFAULT TRUE,
    proof_url TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Table des Partenaires Mobilité & Prestataires
CREATE TABLE public.partners (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    email TEXT,
    category TEXT,
    status BOOLEAN DEFAULT TRUE,
    address TEXT,
    notes TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Table des Notifications & Alertes Système
CREATE TABLE public.notifications (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    content TEXT,
    type TEXT,
    recipient TEXT,
    target_user_id TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    payload TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Table des Paramètres Entreprise & Feature Flags
CREATE TABLE public.company_settings (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,
    name TEXT,
    company_name TEXT,
    work_start_time TEXT,
    planned_departure_time TEXT,
    qr_code_secret TEXT,
    door_qr_code_token TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Table des Appels VoIP Audio/Vidéo WebRTC
CREATE TABLE public.calls (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,
    caller_id TEXT,
    caller_name TEXT,
    callee_id TEXT,
    callee_name TEXT,
    type TEXT DEFAULT 'audio',
    status BOOLEAN DEFAULT TRUE,
    is_group_call BOOLEAN DEFAULT FALSE,
    duration_seconds INTEGER DEFAULT 0,
    started_at TEXT,
    ended_at TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. Table des Statuts de Connexion VoIP Collaborateurs
CREATE TABLE public.user_presences (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,
    user_id TEXT,
    user_name TEXT,
    user_email TEXT,
    role TEXT,
    status BOOLEAN DEFAULT TRUE,
    last_seen TEXT,
    current_call_id TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. Table des Offres d'Emploi (Recrutement ATS)
CREATE TABLE public.job_offers (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    department TEXT,
    location TEXT,
    contract_type TEXT,
    openings_count INTEGER DEFAULT 1,
    description TEXT,
    salary_range TEXT,
    deadline TEXT,
    status BOOLEAN DEFAULT TRUE,
    created_by TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 24. Table des Candidatures (ATS Recrutement)
CREATE TABLE public.job_applications (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,
    job_offer_id TEXT,
    job_offer_title TEXT,
    candidate_name TEXT NOT NULL,
    candidate_email TEXT,
    candidate_phone TEXT,
    candidate_city TEXT,
    stage TEXT DEFAULT 'nouveau',
    rating INTEGER DEFAULT 0,
    experience_years INTEGER DEFAULT 0,
    interview_date TEXT,
    applied_at TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 25. Table des Notes de Frais & Dépenses de Mission
CREATE TABLE public.expense_claims (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,
    reference TEXT,
    employee_id TEXT,
    employee_name TEXT,
    employee_department TEXT,
    title TEXT NOT NULL,
    mission_location TEXT,
    expense_date TEXT,
    category TEXT,
    amount NUMERIC DEFAULT 0,
    payment_mode TEXT,
    status BOOLEAN DEFAULT TRUE,
    approved_by TEXT,
    approved_at TEXT,
    reimbursed_at TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 26. Table du Registre HSE (Hygiène, Sécurité, Environnement)
CREATE TABLE public.hse_incidents (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,
    reference TEXT,
    site TEXT NOT NULL,
    zone_precise TEXT,
    type TEXT,
    severity TEXT,
    date TEXT,
    time TEXT,
    title TEXT NOT NULL,
    description TEXT,
    reported_by TEXT,
    victim_name TEXT,
    days_lost INTEGER DEFAULT 0,
    status BOOLEAN DEFAULT TRUE,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 27. Table du Registre d'Accueil & Visiteurs
CREATE TABLE public.visitor_logs (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,
    visitor_name TEXT NOT NULL,
    visitor_company TEXT,
    visitor_phone TEXT,
    id_card_number TEXT,
    site_location TEXT,
    purpose TEXT,
    host_employee_id TEXT,
    host_employee_name TEXT,
    badge_number TEXT,
    vehicle_plate TEXT,
    check_in_time TEXT,
    check_in_date TEXT,
    check_out_time TEXT,
    status BOOLEAN DEFAULT TRUE,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 28. Table de la Boîte à Idées & Suggestions
CREATE TABLE public.idea_suggestions (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    author_name TEXT,
    author_department TEXT,
    author_id TEXT,
    status BOOLEAN DEFAULT TRUE,
    likes_count INTEGER DEFAULT 0,
    liked_user_ids JSONB,
    management_response TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 29. Table des Sondages d'Entreprise
CREATE TABLE public.enterprise_surveys (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    status BOOLEAN DEFAULT TRUE,
    deadline TEXT,
    created_by TEXT,
    options JSONB,
    voted_user_ids JSONB,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 30. Table des Collections Génériques & Stockage Polymorphique
CREATE TABLE public.generic_collections (
    id BIGSERIAL PRIMARY KEY,
    collection TEXT NOT NULL,
    doc_id TEXT NOT NULL,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_generic_col_doc UNIQUE (collection, doc_id)
);

-- 31. Table des Journaux de Connexion & Sécurité d'Accès
CREATE TABLE public.connection_logs (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,
    user_id TEXT,
    user_name TEXT,
    user_email TEXT,
    timestamp TEXT,
    ip_address TEXT,
    location TEXT,
    auth_method TEXT,
    status BOOLEAN DEFAULT TRUE,
    details TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 34. Table du Journal d'Audit des Opérations Administratives RH
CREATE TABLE public.admin_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,
    timestamp TEXT,
    author_name TEXT NOT NULL,
    author_role TEXT,
    target_user_id TEXT,
    target_employee_id TEXT,
    target_name TEXT NOT NULL,
    operation_type TEXT NOT NULL,
    operation_label TEXT,
    details TEXT,
    ip_address TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- SECTION 2 : INDEXATION HAUTE PERFORMANCE
-- ==============================================================================

-- 1. Index sur 'users'
CREATE INDEX idx_users_doc_id ON public.users(doc_id);
CREATE INDEX idx_users_uid ON public.users(uid);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role_id);
CREATE INDEX idx_users_status ON public.users(status);
CREATE INDEX idx_users_created_at ON public.users(created_at DESC);

-- 2. Index sur 'employees'
CREATE INDEX idx_employees_doc_id ON public.employees(doc_id);
CREATE INDEX idx_employees_email ON public.employees(email);
CREATE INDEX idx_employees_phone ON public.employees(phone);
CREATE INDEX idx_employees_department ON public.employees(department);
CREATE INDEX idx_employees_status ON public.employees(status);
CREATE INDEX idx_employees_role ON public.employees(role_id);
CREATE INDEX idx_employees_role_type ON public.employees(role_type);
CREATE INDEX idx_employees_manager_id ON public.employees(manager_id);
CREATE INDEX idx_employees_user_id ON public.employees(user_id);
CREATE INDEX idx_employees_hire_date ON public.employees(hire_date);
CREATE INDEX idx_employees_dept_status ON public.employees(department, status);

-- 3. Index sur 'tasks'
CREATE INDEX idx_tasks_doc_id ON public.tasks(doc_id);
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_employee_id ON public.tasks(employee_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_priority ON public.tasks(priority);
CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_tasks_date ON public.tasks(date DESC);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_tasks_is_milestone ON public.tasks(is_milestone);
CREATE INDEX idx_tasks_assignee_status ON public.tasks(assigned_to, status);
CREATE INDEX idx_tasks_project_status ON public.tasks(project_id, status);

-- 4. Index sur 'task_projects'
CREATE INDEX idx_task_projects_doc_id ON public.task_projects(doc_id);
CREATE INDEX idx_task_projects_created_at ON public.task_projects(created_at DESC);

-- 5. Index sur 'reminders'
CREATE INDEX idx_reminders_doc_id ON public.reminders(doc_id);
CREATE INDEX idx_reminders_date ON public.reminders(date);
CREATE INDEX idx_reminders_employee_id ON public.reminders(employee_id);
CREATE INDEX idx_reminders_triggered ON public.reminders(triggered);
CREATE INDEX idx_reminders_stopped ON public.reminders(stopped);
CREATE INDEX idx_reminders_emp_date ON public.reminders(employee_id, date);

-- 6. Index sur 'presences'
CREATE INDEX idx_presences_doc_id ON public.presences(doc_id);
CREATE INDEX idx_presences_employee_id ON public.presences(employee_id);
CREATE INDEX idx_presences_date ON public.presences(date DESC);
CREATE INDEX idx_presences_status ON public.presences(status);
CREATE INDEX idx_presences_clocking_method ON public.presences(clocking_method);
CREATE INDEX idx_presences_created_at ON public.presences(created_at DESC);
CREATE INDEX idx_presences_emp_date ON public.presences(employee_id, date);

-- 7. Index sur 'attendance_incidents'
CREATE INDEX idx_attendance_incidents_doc_id ON public.attendance_incidents(doc_id);
CREATE INDEX idx_attendance_incidents_emp ON public.attendance_incidents(employee_id);
CREATE INDEX idx_attendance_incidents_date ON public.attendance_incidents(date DESC);
CREATE INDEX idx_attendance_incidents_status ON public.attendance_incidents(status);
CREATE INDEX idx_attendance_incidents_type ON public.attendance_incidents(type);
CREATE INDEX idx_attendance_incidents_is_justified ON public.attendance_incidents(is_justified);
CREATE INDEX idx_attendance_incidents_emp_date ON public.attendance_incidents(employee_id, date);

-- 8. Index sur 'badge_codes_16'
CREATE INDEX idx_badge_codes_doc_id ON public.badge_codes_16(doc_id);
CREATE INDEX idx_badge_codes_code ON public.badge_codes_16(code);
CREATE INDEX idx_badge_codes_target_month ON public.badge_codes_16(target_month);
CREATE INDEX idx_badge_codes_is_used ON public.badge_codes_16(is_used);
CREATE INDEX idx_badge_codes_used_by ON public.badge_codes_16(used_by_employee_id);

-- 9. Index sur 'dynamic_qr_sessions'
CREATE INDEX idx_dynamic_qr_doc_id ON public.dynamic_qr_sessions(doc_id);
CREATE INDEX idx_dynamic_qr_token ON public.dynamic_qr_sessions(token);
CREATE INDEX idx_dynamic_qr_session_id ON public.dynamic_qr_sessions(session_id);
CREATE INDEX idx_dynamic_qr_status ON public.dynamic_qr_sessions(status);
CREATE INDEX idx_dynamic_qr_used_by ON public.dynamic_qr_sessions(used_by_employee_id);
CREATE INDEX idx_dynamic_qr_expires_at ON public.dynamic_qr_sessions(expires_at);

-- 10. Index sur 'inventory'
CREATE INDEX idx_inventory_doc_id ON public.inventory(doc_id);
CREATE INDEX idx_inventory_category ON public.inventory(category);
CREATE INDEX idx_inventory_status ON public.inventory(status);
CREATE INDEX idx_inventory_assigned_to ON public.inventory(assigned_to_id);
CREATE INDEX idx_inventory_is_donated ON public.inventory(is_donated);
CREATE INDEX idx_inventory_reference ON public.inventory(reference);
CREATE INDEX idx_inventory_location ON public.inventory(location);

-- 11. Index sur 'disciplinary_incidents'
CREATE INDEX idx_disc_incidents_doc_id ON public.disciplinary_incidents(doc_id);
CREATE INDEX idx_disc_incidents_emp ON public.disciplinary_incidents(employee_id);
CREATE INDEX idx_disc_incidents_date ON public.disciplinary_incidents(date DESC);
CREATE INDEX idx_disc_incidents_status ON public.disciplinary_incidents(status);
CREATE INDEX idx_disc_incidents_severity ON public.disciplinary_incidents(severity);
CREATE INDEX idx_disc_incidents_category ON public.disciplinary_incidents(category);
CREATE INDEX idx_disc_incidents_emp_status ON public.disciplinary_incidents(employee_id, status);

-- 12. Index sur 'departments'
CREATE INDEX idx_departments_doc_id ON public.departments(doc_id);
CREATE INDEX idx_departments_code ON public.departments(code);
CREATE INDEX idx_departments_manager ON public.departments(manager_id);
CREATE INDEX idx_departments_parent ON public.departments(parent_department_id);

-- 13. Index sur 'documents'
CREATE INDEX idx_documents_doc_id ON public.documents(doc_id);
CREATE INDEX idx_documents_employee_id ON public.documents(employee_id);
CREATE INDEX idx_documents_category ON public.documents(category);
CREATE INDEX idx_documents_author_id ON public.documents(author_id);
CREATE INDEX idx_documents_template_id ON public.documents(template_id);
CREATE INDEX idx_documents_created_at ON public.documents(created_at DESC);

-- 14. Index sur 'rh_document_templates'
CREATE INDEX idx_rh_templates_doc_id ON public.rh_document_templates(doc_id);
CREATE INDEX idx_rh_templates_category ON public.rh_document_templates(category);
CREATE INDEX idx_rh_templates_format ON public.rh_document_templates(format_type);
CREATE INDEX idx_rh_templates_custom ON public.rh_document_templates(is_custom);

-- 15. Index sur 'processflow_salary_debts'
CREATE INDEX idx_salary_debts_doc_id ON public.processflow_salary_debts(doc_id);
CREATE INDEX idx_salary_debts_emp ON public.processflow_salary_debts(employee_id);
CREATE INDEX idx_salary_debts_status ON public.processflow_salary_debts(status);
CREATE INDEX idx_salary_debts_due_date ON public.processflow_salary_debts(due_date);
CREATE INDEX idx_salary_debts_emp_status ON public.processflow_salary_debts(employee_id, status);

-- 16. Index sur 'salary_payments'
CREATE INDEX idx_salary_payments_doc_id ON public.salary_payments(doc_id);
CREATE INDEX idx_salary_payments_emp ON public.salary_payments(employee_id);
CREATE INDEX idx_salary_payments_period ON public.salary_payments(period DESC);
CREATE INDEX idx_salary_payments_status ON public.salary_payments(status);
CREATE INDEX idx_salary_payments_emp_period ON public.salary_payments(employee_id, period);

-- 17. Index sur 'financial_transactions'
CREATE INDEX idx_fin_transactions_doc_id ON public.financial_transactions(doc_id);
CREATE INDEX idx_fin_transactions_date ON public.financial_transactions(date DESC);
CREATE INDEX idx_fin_transactions_type ON public.financial_transactions(type);
CREATE INDEX idx_fin_transactions_category ON public.financial_transactions(category);
CREATE INDEX idx_fin_transactions_status ON public.financial_transactions(status);
CREATE INDEX idx_fin_transactions_type_date ON public.financial_transactions(type, date DESC);

-- 18. Index sur 'partners'
CREATE INDEX idx_partners_doc_id ON public.partners(doc_id);
CREATE INDEX idx_partners_category ON public.partners(category);
CREATE INDEX idx_partners_status ON public.partners(status);
CREATE INDEX idx_partners_phone ON public.partners(phone);
CREATE INDEX idx_partners_email ON public.partners(email);

-- 19. Index sur 'notifications'
CREATE INDEX idx_notifications_doc_id ON public.notifications(doc_id);
CREATE INDEX idx_notifications_target ON public.notifications(target_user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_user_unread ON public.notifications(target_user_id, is_read);

-- 20. Index sur 'company_settings'
CREATE INDEX idx_company_settings_doc_id ON public.company_settings(doc_id);
CREATE INDEX idx_company_settings_name ON public.company_settings(name);

-- 21. Index sur 'calls'
CREATE INDEX idx_calls_doc_id ON public.calls(doc_id);
CREATE INDEX idx_calls_caller_id ON public.calls(caller_id);
CREATE INDEX idx_calls_callee_id ON public.calls(callee_id);
CREATE INDEX idx_calls_status ON public.calls(status);
CREATE INDEX idx_calls_type ON public.calls(type);
CREATE INDEX idx_calls_created_at ON public.calls(created_at DESC);
CREATE INDEX idx_calls_callee_status ON public.calls(callee_id, status);

-- 22. Index sur 'user_presences'
CREATE INDEX idx_user_presences_doc_id ON public.user_presences(doc_id);
CREATE INDEX idx_user_presences_user_id ON public.user_presences(user_id);
CREATE INDEX idx_user_presences_status ON public.user_presences(status);
CREATE INDEX idx_user_presences_last_seen ON public.user_presences(last_seen DESC);

-- 23. Index sur 'job_offers'
CREATE INDEX idx_job_offers_doc_id ON public.job_offers(doc_id);
CREATE INDEX idx_job_offers_status ON public.job_offers(status);
CREATE INDEX idx_job_offers_department ON public.job_offers(department);
CREATE INDEX idx_job_offers_contract ON public.job_offers(contract_type);
CREATE INDEX idx_job_offers_created_at ON public.job_offers(created_at DESC);

-- 24. Index sur 'job_applications'
CREATE INDEX idx_job_apps_doc_id ON public.job_applications(doc_id);
CREATE INDEX idx_job_apps_offer_id ON public.job_applications(job_offer_id);
CREATE INDEX idx_job_apps_stage ON public.job_applications(stage);
CREATE INDEX idx_job_apps_email ON public.job_applications(candidate_email);
CREATE INDEX idx_job_apps_applied_at ON public.job_applications(applied_at DESC);
CREATE INDEX idx_job_apps_offer_stage ON public.job_applications(job_offer_id, stage);

-- 25. Index sur 'expense_claims'
CREATE INDEX idx_expense_claims_doc_id ON public.expense_claims(doc_id);
CREATE INDEX idx_expense_claims_emp ON public.expense_claims(employee_id);
CREATE INDEX idx_expense_claims_status ON public.expense_claims(status);
CREATE INDEX idx_expense_claims_date ON public.expense_claims(expense_date DESC);
CREATE INDEX idx_expense_claims_category ON public.expense_claims(category);
CREATE INDEX idx_expense_claims_emp_status ON public.expense_claims(employee_id, status);

-- 26. Index sur 'hse_incidents'
CREATE INDEX idx_hse_incidents_doc_id ON public.hse_incidents(doc_id);
CREATE INDEX idx_hse_site ON public.hse_incidents(site);
CREATE INDEX idx_hse_severity ON public.hse_incidents(severity);
CREATE INDEX idx_hse_status ON public.hse_incidents(status);
CREATE INDEX idx_hse_date ON public.hse_incidents(date DESC);
CREATE INDEX idx_hse_type ON public.hse_incidents(type);

-- 27. Index sur 'visitor_logs'
CREATE INDEX idx_visitor_logs_doc_id ON public.visitor_logs(doc_id);
CREATE INDEX idx_visitor_logs_date ON public.visitor_logs(check_in_date DESC);
CREATE INDEX idx_visitor_logs_status ON public.visitor_logs(status);
CREATE INDEX idx_visitor_logs_site ON public.visitor_logs(site_location);
CREATE INDEX idx_visitor_logs_host ON public.visitor_logs(host_employee_id);

-- 28. Index sur 'idea_suggestions'
CREATE INDEX idx_ideas_doc_id ON public.idea_suggestions(doc_id);
CREATE INDEX idx_ideas_status ON public.idea_suggestions(status);
CREATE INDEX idx_ideas_category ON public.idea_suggestions(category);
CREATE INDEX idx_ideas_author ON public.idea_suggestions(author_id);
CREATE INDEX idx_ideas_created_at ON public.idea_suggestions(created_at DESC);

-- 29. Index sur 'enterprise_surveys'
CREATE INDEX idx_surveys_doc_id ON public.enterprise_surveys(doc_id);
CREATE INDEX idx_surveys_status ON public.enterprise_surveys(status);
CREATE INDEX idx_surveys_category ON public.enterprise_surveys(category);
CREATE INDEX idx_surveys_created_at ON public.enterprise_surveys(created_at DESC);

-- 30. Index sur 'generic_collections'
CREATE INDEX idx_generic_col ON public.generic_collections(collection);
CREATE INDEX idx_generic_doc_id ON public.generic_collections(doc_id);
CREATE INDEX idx_generic_updated_at ON public.generic_collections(updated_at DESC);

-- 31. Index sur 'connection_logs'
CREATE INDEX idx_conn_logs_doc_id ON public.connection_logs(doc_id);
CREATE INDEX idx_conn_logs_user_id ON public.connection_logs(user_id);
CREATE INDEX idx_conn_logs_user_email ON public.connection_logs(user_email);
CREATE INDEX idx_conn_logs_status ON public.connection_logs(status);
CREATE INDEX idx_conn_logs_created_at ON public.connection_logs(created_at DESC);

-- 32. Index sur 'admin_audit_logs'
CREATE INDEX idx_audit_logs_doc_id ON public.admin_audit_logs(doc_id);
CREATE INDEX idx_audit_logs_target_emp ON public.admin_audit_logs(target_employee_id);
CREATE INDEX idx_audit_logs_target_user ON public.admin_audit_logs(target_user_id);
CREATE INDEX idx_audit_logs_op_type ON public.admin_audit_logs(operation_type);
CREATE INDEX idx_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);

-- ------------------------------------------------------------------------------
-- Index GIN sur les colonnes JSONB pour requêtes ultra-performantes
-- ------------------------------------------------------------------------------
CREATE INDEX idx_generic_collections_gin ON public.generic_collections USING gin(data);
CREATE INDEX idx_tasks_raw_data_gin ON public.tasks USING gin(raw_data);
CREATE INDEX idx_employees_raw_data_gin ON public.employees USING gin(raw_data);
CREATE INDEX idx_presences_raw_data_gin ON public.presences USING gin(raw_data);
CREATE INDEX idx_inventory_raw_data_gin ON public.inventory USING gin(raw_data);
CREATE INDEX idx_disc_incidents_raw_data_gin ON public.disciplinary_incidents USING gin(raw_data);
CREATE INDEX idx_salary_payments_raw_data_gin ON public.salary_payments USING gin(raw_data);
CREATE INDEX idx_fin_trans_raw_data_gin ON public.financial_transactions USING gin(raw_data);
CREATE INDEX idx_notifications_raw_data_gin ON public.notifications USING gin(raw_data);
CREATE INDEX idx_hse_raw_data_gin ON public.hse_incidents USING gin(raw_data);
CREATE INDEX idx_conn_logs_raw_data_gin ON public.connection_logs USING gin(raw_data);
CREATE INDEX idx_audit_logs_raw_data_gin ON public.admin_audit_logs USING gin(raw_data);

-- ==============================================================================
-- SECTION 3 : ROW LEVEL SECURITY (RLS) & POLITIQUES DE SÉCURITÉ
-- ==============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_codes_16 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_qr_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplinary_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processflow_salary_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hse_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generic_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'users', 'employees', 'tasks', 'task_projects', 'reminders',
        'presences', 'attendance_incidents', 'badge_codes_16', 'dynamic_qr_sessions',
        'inventory', 'disciplinary_incidents', 'departments', 'documents',
        'rh_document_templates', 'processflow_salary_debts', 'salary_payments',
        'financial_transactions', 'partners', 'notifications', 'company_settings',
        'calls', 'user_presences', 'job_offers', 'job_applications',
        'expense_claims', 'hse_incidents', 'visitor_logs', 'idea_suggestions',
        'enterprise_surveys', 'generic_collections',
        'connection_logs', 'admin_audit_logs'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Allow all for authenticated/anon on %I" ON public.%I', tbl, tbl);
        EXECUTE format('CREATE POLICY "Allow all for authenticated/anon on %I" ON public.%I FOR ALL USING (true) WITH CHECK (true)', tbl, tbl);
    END LOOP;
END $$;

-- ==============================================================================
-- SECTION 4 : SUPABASE REALTIME REPLICATION (Synchronisation temps réel)
-- ==============================================================================

DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'employees', 'tasks', 'task_projects', 'reminders',
        'presences', 'attendance_incidents', 'badge_codes_16', 'dynamic_qr_sessions',
        'inventory', 'disciplinary_incidents', 'departments', 'documents',
        'rh_document_templates', 'processflow_salary_debts', 'salary_payments',
        'financial_transactions', 'partners', 'notifications', 'company_settings',
        'calls', 'user_presences', 'job_offers', 'job_applications',
        'expense_claims', 'hse_incidents', 'visitor_logs', 'idea_suggestions',
        'enterprise_surveys', 'generic_collections',
        'connection_logs', 'admin_audit_logs'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        BEGIN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
        EXCEPTION
            WHEN duplicate_object THEN
                NULL;
        END;
    END LOOP;
END $$;

-- ==============================================================================
-- SECTION 5 : ACCÈS ET PRIVILÈGES OBLIGATOIRES POSTGRESQL (ANON, AUTHENTICATED, SERVICE_ROLE)
-- Sans ces GRANTs, Supabase / PostgREST renvoie l'erreur 42501 "permission denied for table ..."
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
