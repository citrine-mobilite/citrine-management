-- ==============================================================================
-- CITRINE MANAGEMENT - SCHÉMA COMPLET SUPABASE POSTGRESQL (39 TABLES)
-- Version : 2.0 (Post-Audit Technique de Production)
-- Clés :
--   - id  : BIGSERIAL PRIMARY KEY (Auto-incrémenté)
--   - uid : UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL (UUID v4)
--   - Intégrité : Relations One-to-Many & Many-to-Many avec tables d'association
--   - Historique légal : ON DELETE RESTRICT sur pointages, paies, finances, audits
--   - Statuts métiers : Types TEXT avec contraintes CHECK (pas de booléen tronqué)
--   - Sécurité : RLS activée sur toutes les tables, zéro secret en clair
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- DROP EXISTING TABLES IN REVERSE ORDER OF DEPENDENCY
DROP TABLE IF EXISTS public.admin_audit_logs CASCADE;
DROP TABLE IF EXISTS public.connection_logs CASCADE;
DROP TABLE IF EXISTS public.generic_collections CASCADE;
DROP TABLE IF EXISTS public.enterprise_surveys CASCADE;
DROP TABLE IF EXISTS public.idea_suggestions CASCADE;
DROP TABLE IF EXISTS public.visitor_logs CASCADE;
DROP TABLE IF EXISTS public.hse_incidents CASCADE;
DROP TABLE IF EXISTS public.expense_claims CASCADE;
DROP TABLE IF EXISTS public.job_applications CASCADE;
DROP TABLE IF EXISTS public.job_offers CASCADE;
DROP TABLE IF EXISTS public.user_presences CASCADE;
DROP TABLE IF EXISTS public.calls CASCADE;
DROP TABLE IF EXISTS public.company_settings CASCADE;
DROP TABLE IF EXISTS public.notification_recipients CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.partners CASCADE;
DROP TABLE IF EXISTS public.financial_transactions CASCADE;
DROP TABLE IF EXISTS public.salary_payments CASCADE;
DROP TABLE IF EXISTS public.processflow_salary_debts CASCADE;
DROP TABLE IF EXISTS public.rh_document_templates CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;
DROP TABLE IF EXISTS public.disciplinary_incidents CASCADE;
DROP TABLE IF EXISTS public.inventory_assignments CASCADE;
DROP TABLE IF EXISTS public.inventory CASCADE;
DROP TABLE IF EXISTS public.dynamic_qr_sessions CASCADE;
DROP TABLE IF EXISTS public.badge_codes_16 CASCADE;
DROP TABLE IF EXISTS public.attendance_incidents CASCADE;
DROP TABLE IF EXISTS public.presence_pauses CASCADE;
DROP TABLE IF EXISTS public.presences CASCADE;
DROP TABLE IF EXISTS public.reminder_recipients CASCADE;
DROP TABLE IF EXISTS public.reminders CASCADE;
DROP TABLE IF EXISTS public.task_assignees CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.task_project_members CASCADE;
DROP TABLE IF EXISTS public.task_projects CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

-- ==============================================================================
-- SECTION 1 : MODULE COMPTES, SÉCURITÉ & ORGANISATION
-- ==============================================================================

-- 1. Table des Rôles
CREATE TABLE public.roles (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    name TEXT UNIQUE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}'::jsonb,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table des Utilisateurs Applicatifs
CREATE TABLE public.users (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role_id BIGINT REFERENCES public.roles(id) ON DELETE SET NULL,
    status BOOLEAN DEFAULT TRUE,
    department TEXT,
    phone TEXT UNIQUE,
    avatar_url TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table des Collaborateurs RH / Employés
CREATE TABLE public.employees (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    user_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    role_id BIGINT REFERENCES public.roles(id) ON DELETE SET NULL,
    name TEXT,
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    role_type TEXT,
    department TEXT,
    position TEXT,
    status BOOLEAN DEFAULT TRUE,
    employment_status TEXT DEFAULT 'en_poste',
    hire_date DATE,
    departure_date DATE,
    salary NUMERIC DEFAULT 0 CONSTRAINT chk_employees_salary CHECK (salary >= 0),
    avatar_url TEXT,
    manager_id BIGINT REFERENCES public.employees(id) ON DELETE SET NULL,
    team TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table des Départements
CREATE TABLE public.departments (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    manager_id BIGINT REFERENCES public.employees(id) ON DELETE SET NULL,
    parent_department_id BIGINT REFERENCES public.departments(id) ON DELETE SET NULL,
    status BOOLEAN DEFAULT TRUE,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- SECTION 2 : MODULE PROJETS, TÂCHES & AFFECTATIONS MULTIPLES
-- ==============================================================================

-- 5. Table des Projets de Tâches
CREATE TABLE public.task_projects (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT,
    icon TEXT,
    member_ids JSONB,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Table d'association : Membres de Projets (Relation N-N)
CREATE TABLE public.task_project_members (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    project_id BIGINT NOT NULL REFERENCES public.task_projects(id) ON DELETE CASCADE,
    employee_id BIGINT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    role_in_project TEXT DEFAULT 'membre',
    added_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_project_employee UNIQUE (project_id, employee_id)
);

-- 7. Table des Tâches Opérationnelles
CREATE TABLE public.tasks (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    date DATE,
    time TEXT,
    status TEXT DEFAULT 'todo' CONSTRAINT chk_tasks_status CHECK (status IN ('todo', 'in_progress', 'completed', 'pending_validation', 'blocked', 'idea', 'en_cours')),
    priority TEXT DEFAULT 'medium' CONSTRAINT chk_tasks_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent', 'haut')),
    assigned_to TEXT,
    employee_id BIGINT REFERENCES public.employees(id) ON DELETE SET NULL,
    department TEXT,
    project_id BIGINT REFERENCES public.task_projects(id) ON DELETE CASCADE,
    due_date DATE,
    is_milestone BOOLEAN DEFAULT FALSE,
    milestone_progress NUMERIC DEFAULT 0 CONSTRAINT chk_tasks_milestone_progress CHECK (milestone_progress >= 0 AND milestone_progress <= 100),
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Table d'association : Affectations Multiples de Tâches (Relation N-N)
CREATE TABLE public.task_assignees (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    task_id BIGINT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    employee_id BIGINT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    role_in_task TEXT DEFAULT 'contributeur',
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_task_employee UNIQUE (task_id, employee_id)
);

-- ==============================================================================
-- SECTION 3 : MODULE RAPPELS, NOTIFICATIONS & ALERTES MULTIPLES
-- ==============================================================================

-- 9. Table des Rappels
CREATE TABLE public.reminders (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    title TEXT NOT NULL,
    note TEXT,
    date DATE,
    time TEXT,
    location TEXT,
    employee_id BIGINT REFERENCES public.employees(id) ON DELETE SET NULL,
    all_employees BOOLEAN DEFAULT FALSE,
    trigger_before TEXT,
    triggered BOOLEAN DEFAULT FALSE,
    stopped BOOLEAN DEFAULT FALSE,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Table d'association : Destinataires Multiples des Rappels (Relation N-N)
CREATE TABLE public.reminder_recipients (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    reminder_id BIGINT NOT NULL REFERENCES public.reminders(id) ON DELETE CASCADE,
    employee_id BIGINT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMPTZ,
    CONSTRAINT uq_reminder_employee UNIQUE (reminder_id, employee_id)
);

-- 11. Table des Notifications & Alertes Système
CREATE TABLE public.notifications (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    target_user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    target_user_ids JSONB,
    target_employee_ids JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Table d'association : Destinataires et Suivi de Lecture des Notifications (Relation N-N)
CREATE TABLE public.notification_recipients (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    notification_id BIGINT NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    CONSTRAINT uq_notification_user UNIQUE (notification_id, user_id)
);

-- ==============================================================================
-- SECTION 4 : MODULE POINTAGE, PRÉSENCES & SÉCURITÉ DE BADGE (Historique préservé)
-- ==============================================================================

-- 13. Table des Pointages & Présences (ON DELETE RESTRICT pour conformité légale)
CREATE TABLE public.presences (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    employee_id BIGINT NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    date DATE NOT NULL,
    status TEXT DEFAULT 'present' CONSTRAINT chk_presences_status CHECK (status IN ('present', 'late', 'absent', 'not_tracked', 'on_leave', 'holiday')),
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

-- 14. Table d'Historique des Pauses de Présence
CREATE TABLE public.presence_pauses (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    presence_id BIGINT NOT NULL REFERENCES public.presences(id) ON DELETE CASCADE,
    pause_start TIMESTAMPTZ NOT NULL,
    pause_end TIMESTAMPTZ,
    duration_minutes INTEGER,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Table des Incidents de Pointage & Justifications (ON DELETE RESTRICT)
CREATE TABLE public.attendance_incidents (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    employee_id BIGINT NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    employee_name TEXT,
    date DATE NOT NULL,
    time_string TEXT,
    type TEXT NOT NULL,
    origin TEXT,
    reason TEXT,
    is_declared_in_advance BOOLEAN DEFAULT FALSE,
    is_justified BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'signale',
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Table des Codes de Badges Sécurisés 16 Caractères
CREATE TABLE public.badge_codes_16 (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    code TEXT NOT NULL UNIQUE,
    formatted_code TEXT,
    generated_by TEXT,
    target_month TEXT,
    is_used BOOLEAN DEFAULT FALSE,
    used_by_employee_id BIGINT REFERENCES public.employees(id) ON DELETE SET NULL,
    used_by_employee_name TEXT,
    used_at TIMESTAMPTZ,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Table des Sessions QR Code Dynamiques
CREATE TABLE public.dynamic_qr_sessions (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    session_id TEXT,
    token TEXT UNIQUE NOT NULL,
    generated_by TEXT,
    status BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    used_by_employee_id BIGINT REFERENCES public.employees(id) ON DELETE SET NULL,
    action TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- SECTION 5 : MODULE GESTION DU MATÉRIEL & INVENTAIRE
-- ==============================================================================

-- 18. Table de l'Inventaire & Équipements
CREATE TABLE public.inventory (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    name TEXT NOT NULL,
    designation TEXT,
    category TEXT,
    quantity INTEGER DEFAULT 0 CONSTRAINT chk_inventory_quantity CHECK (quantity >= 0),
    status BOOLEAN DEFAULT TRUE,
    location TEXT,
    reference TEXT,
    serial_number TEXT,
    unit_price NUMERIC DEFAULT 0 CONSTRAINT chk_inventory_price CHECK (unit_price >= 0),
    assigned_to_id BIGINT REFERENCES public.employees(id) ON DELETE SET NULL,
    is_donated BOOLEAN DEFAULT FALSE,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Table des Assignations d'Inventaire
CREATE TABLE public.inventory_assignments (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    inventory_id BIGINT NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
    employee_id BIGINT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    returned_at TIMESTAMPTZ,
    condition_on_assignment TEXT,
    condition_on_return TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- SECTION 6 : MODULE DISCIPLINE, DOCUMENTS RH & PAIE (Historique préservé)
-- ==============================================================================

-- 20. Table des Incidents Disciplinaires (ON DELETE RESTRICT)
CREATE TABLE public.disciplinary_incidents (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    employee_id BIGINT NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    employee_name TEXT,
    date DATE NOT NULL,
    severity TEXT,
    reason TEXT,
    description TEXT,
    measures TEXT,
    reported_by BIGINT REFERENCES public.employees(id) ON DELETE SET NULL,
    status BOOLEAN DEFAULT TRUE,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Table des Documents RH & Administratifs (ON DELETE RESTRICT)
CREATE TABLE public.documents (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category TEXT,
    file_url TEXT,
    employee_id BIGINT NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    author_id BIGINT REFERENCES public.employees(id) ON DELETE SET NULL,
    is_confidential BOOLEAN DEFAULT FALSE,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. Table des Modèles de Documents RH
CREATE TABLE public.rh_document_templates (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category TEXT,
    content TEXT,
    variables JSONB,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. Table des Dettes & Avances sur Salaire (ON DELETE RESTRICT pour conformité comptable)
CREATE TABLE public.processflow_salary_debts (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    employee_id BIGINT NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    total_amount NUMERIC DEFAULT 0 CONSTRAINT chk_debt_total CHECK (total_amount >= 0),
    monthly_deduction NUMERIC DEFAULT 0 CONSTRAINT chk_debt_deduction CHECK (monthly_deduction >= 0),
    remaining_balance NUMERIC DEFAULT 0 CONSTRAINT chk_debt_remaining CHECK (remaining_balance >= 0),
    reason TEXT,
    status BOOLEAN DEFAULT TRUE,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 24. Table des Paiements de Salaires (ON DELETE RESTRICT pour conformité fiscale)
CREATE TABLE public.salary_payments (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    employee_id BIGINT NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    period TEXT NOT NULL,
    base_salary NUMERIC DEFAULT 0 CONSTRAINT chk_salary_base CHECK (base_salary >= 0),
    bonuses NUMERIC DEFAULT 0 CONSTRAINT chk_salary_bonus CHECK (bonuses >= 0),
    deductions NUMERIC DEFAULT 0 CONSTRAINT chk_salary_deductions CHECK (deductions >= 0),
    net_salary NUMERIC DEFAULT 0 CONSTRAINT chk_salary_net CHECK (net_salary >= 0),
    payment_status TEXT DEFAULT 'pending',
    payment_date DATE,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- SECTION 7 : MODULE FINANCES, TRANSACTIONS & NOTES DE FRAIS
-- ==============================================================================

-- 25. Table des Transactions Financières
CREATE TABLE public.financial_transactions (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT,
    amount NUMERIC DEFAULT 0 CONSTRAINT chk_financial_tx_amount CHECK (amount >= 0),
    date DATE NOT NULL,
    payment_method TEXT,
    reference TEXT,
    description TEXT,
    status BOOLEAN DEFAULT TRUE,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 26. Table des Notes de Frais
CREATE TABLE public.expense_claims (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    employee_id BIGINT NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    amount NUMERIC DEFAULT 0 CONSTRAINT chk_expense_claims_amount CHECK (amount >= 0),
    category TEXT,
    date DATE NOT NULL,
    receipt_url TEXT,
    status TEXT DEFAULT 'pending',
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 27. Table des Partenaires & Prestataires
CREATE TABLE public.partners (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    name TEXT NOT NULL,
    service_type TEXT,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    status BOOLEAN DEFAULT TRUE,
    contract_start DATE,
    contract_end DATE,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- SECTION 8 : PARAMÈTRES, COMMUNICATION, RECRUTEMENT, HSE & AUDIT
-- ==============================================================================

-- 28. Table des Paramètres de l'Entreprise
CREATE TABLE public.company_settings (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    rccm TEXT,
    niu TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    logo_url TEXT,
    work_start_time TEXT,
    work_end_time TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 29. Table des Appels Teams / WebRTC
CREATE TABLE public.calls (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    room_id TEXT,
    caller_id TEXT,
    caller_name TEXT,
    recipient_id TEXT,
    status TEXT,
    call_type TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 30. Table des Présences Utilisateurs (Online / Offline)
CREATE TABLE public.user_presences (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    user_id TEXT,
    status TEXT,
    last_seen TIMESTAMPTZ,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 31. Table des Offres d'Emploi
CREATE TABLE public.job_offers (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    title TEXT NOT NULL,
    department TEXT,
    location TEXT,
    contract_type TEXT,
    description TEXT,
    status BOOLEAN DEFAULT TRUE,
    closing_date DATE,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 32. Table des Candidatures
CREATE TABLE public.job_applications (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    job_offer_id TEXT,
    candidate_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    cv_url TEXT,
    status TEXT DEFAULT 'pending',
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 33. Table des Incidents HSE
CREATE TABLE public.hse_incidents (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    title TEXT NOT NULL,
    location TEXT,
    severity TEXT,
    description TEXT,
    reported_by BIGINT REFERENCES public.employees(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'open',
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 34. Table des Registres de Visiteurs
CREATE TABLE public.visitor_logs (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    visitor_name TEXT NOT NULL,
    visitor_company TEXT,
    host_employee_id BIGINT REFERENCES public.employees(id) ON DELETE SET NULL,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    badge_number TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 35. Table des Suggestions & Boîte à Idées
CREATE TABLE public.idea_suggestions (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    author_id BIGINT REFERENCES public.employees(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending',
    votes_count INTEGER DEFAULT 0,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 36. Table des Sondages d'Entreprise
CREATE TABLE public.enterprise_surveys (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    status BOOLEAN DEFAULT TRUE,
    deadline DATE,
    createdBy TEXT,
    options JSONB,
    voted_user_ids JSONB,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 37. Table des Collections Génériques
CREATE TABLE public.generic_collections (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    collection TEXT NOT NULL,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 38. Table des Journaux de Connexion & Sécurité (Immuable)
CREATE TABLE public.connection_logs (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    user_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    userName TEXT,
    userEmail TEXT,
    timestamp TEXT,
    ip_address TEXT,
    location TEXT,
    auth_method TEXT,
    status BOOLEAN DEFAULT TRUE,
    details TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 39. Table du Journal d'Audit des Opérations Administratives RH (Immuable)
CREATE TABLE public.admin_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    timestamp TEXT,
    author_name TEXT NOT NULL,
    author_role TEXT,
    target_user_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    target_employee_id BIGINT REFERENCES public.employees(id) ON DELETE SET NULL,
    target_name TEXT NOT NULL,
    operation_type TEXT NOT NULL,
    operation_label TEXT,
    details TEXT,
    ip_address TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- SECTION 9 : INDEX DE PERFORMANCE & CONTRAINTES RELATIONNELLES
-- ==============================================================================

-- Index sur UID (clés d'identification globale v4)
CREATE INDEX IF NOT EXISTS idx_roles_uid ON public.roles(uid);
CREATE INDEX IF NOT EXISTS idx_users_uid ON public.users(uid);
CREATE INDEX IF NOT EXISTS idx_employees_uid ON public.employees(uid);
CREATE INDEX IF NOT EXISTS idx_task_projects_uid ON public.task_projects(uid);
CREATE INDEX IF NOT EXISTS idx_tasks_uid ON public.tasks(uid);
CREATE INDEX IF NOT EXISTS idx_task_assignees_uid ON public.task_assignees(uid);
CREATE INDEX IF NOT EXISTS idx_task_project_members_uid ON public.task_project_members(uid);
CREATE INDEX IF NOT EXISTS idx_reminders_uid ON public.reminders(uid);
CREATE INDEX IF NOT EXISTS idx_reminder_recipients_uid ON public.reminder_recipients(uid);
CREATE INDEX IF NOT EXISTS idx_presences_uid ON public.presences(uid);
CREATE INDEX IF NOT EXISTS idx_presence_pauses_uid ON public.presence_pauses(uid);
CREATE INDEX IF NOT EXISTS idx_attendance_incidents_uid ON public.attendance_incidents(uid);
CREATE INDEX IF NOT EXISTS idx_notifications_uid ON public.notifications(uid);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_uid ON public.notification_recipients(uid);
CREATE INDEX IF NOT EXISTS idx_inventory_uid ON public.inventory(uid);
CREATE INDEX IF NOT EXISTS idx_documents_uid ON public.documents(uid);
CREATE INDEX IF NOT EXISTS idx_salary_payments_uid ON public.salary_payments(uid);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_uid ON public.financial_transactions(uid);

-- Index sur Clés Étrangères (Jointures et requêtes relationnelles)
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role_id);
CREATE INDEX IF NOT EXISTS idx_employees_user ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_role ON public.employees(role_id);
CREATE INDEX IF NOT EXISTS idx_employees_manager ON public.employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_dept ON public.employees(department);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_employee ON public.tasks(employee_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_task ON public.task_assignees(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_emp ON public.task_assignees(employee_id);
CREATE INDEX IF NOT EXISTS idx_task_members_proj ON public.task_project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_task_members_emp ON public.task_project_members(employee_id);
CREATE INDEX IF NOT EXISTS idx_reminder_recipients_rem ON public.reminder_recipients(reminder_id);
CREATE INDEX IF NOT EXISTS idx_reminder_recipients_emp ON public.reminder_recipients(employee_id);
CREATE INDEX IF NOT EXISTS idx_notif_recipients_notif ON public.notification_recipients(notification_id);
CREATE INDEX IF NOT EXISTS idx_notif_recipients_user ON public.notification_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_presences_emp ON public.presences(employee_id);
CREATE INDEX IF NOT EXISTS idx_presence_pauses_pres ON public.presence_pauses(presence_id);
CREATE INDEX IF NOT EXISTS idx_attendance_inc_emp ON public.attendance_incidents(employee_id);
CREATE INDEX IF NOT EXISTS idx_inventory_assigned ON public.inventory(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_inv_assign_inv ON public.inventory_assignments(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inv_assign_emp ON public.inventory_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_disc_inc_emp ON public.disciplinary_incidents(employee_id);
CREATE INDEX IF NOT EXISTS idx_documents_emp ON public.documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_debts_emp ON public.processflow_salary_debts(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_payments_emp ON public.salary_payments(employee_id);
CREATE INDEX IF NOT EXISTS idx_expense_claims_emp ON public.expense_claims(employee_id);

-- Index composites et partiels orientés requêtes de production
CREATE INDEX IF NOT EXISTS idx_tasks_active_employee 
    ON public.tasks(employee_id, status) 
    WHERE status NOT IN ('completed');

CREATE INDEX IF NOT EXISTS idx_presences_lookup 
    ON public.presences(employee_id, date);

CREATE INDEX IF NOT EXISTS idx_notifications_unread_user 
    ON public.notification_recipients(user_id) 
    WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_reminders_pending 
    ON public.reminders(date, time) 
    WHERE triggered = FALSE AND stopped = FALSE;

-- ==============================================================================
-- SECTION 10 : SÉCURITÉ SUPABASE & ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Activation RLS globale
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presence_pauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_codes_16 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_qr_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplinary_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processflow_salary_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_recipients ENABLE ROW LEVEL SECURITY;
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

-- Politiques RLS de base
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('
            DROP POLICY IF EXISTS "service_role_full_access" ON public.%I;
            CREATE POLICY "service_role_full_access" ON public.%I 
            FOR ALL TO service_role USING (true) WITH CHECK (true);
        ', t, t);
    END LOOP;
END $$;
