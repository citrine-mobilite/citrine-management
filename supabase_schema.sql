-- ==============================================================================
-- CITRINE MANAGEMENT - SCHÉMA COMPLET SUPABASE POSTGRESQL (40 TABLES)
-- Version : 3.0 (Architecture Supabase pure - Sans Firebase)
-- Clés :
--   - id     : BIGSERIAL PRIMARY KEY (Auto-incrémenté)
--   - doc_id : TEXT UNIQUE (Identifiant chaîne unifié frontend & synchronisation)
--   - uid    : UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL (UUID v4)
--   - Intégrité : Relations avec ON DELETE CASCADE / SET NULL appropriés
--   - RLS    : Politiques d'accès ouvertes pour anon, authenticated et service_role
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- SUPPRESSION CONDITIONNELLE DES ANCIENNES TABLES
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
DROP TABLE IF EXISTS public.leave_requests CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

-- ==============================================================================
-- SECTION 1 : COMPTES, ROLES ET PERSONNEL
-- ==============================================================================

-- 1. Table des Rôles
CREATE TABLE public.roles (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    name TEXT UNIQUE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}'::jsonb,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table des Utilisateurs
CREATE TABLE public.users (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role_id BIGINT REFERENCES public.roles(id) ON DELETE SET NULL,
    status BOOLEAN DEFAULT TRUE,
    department TEXT,
    phone TEXT,
    avatar_url TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table des Collaborateurs RH / Employés
CREATE TABLE public.employees (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    user_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    role_id BIGINT REFERENCES public.roles(id) ON DELETE SET NULL,
    name TEXT,
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    department TEXT,
    position TEXT,
    role_type TEXT DEFAULT 'Employé',
    status BOOLEAN DEFAULT TRUE,
    hire_date DATE,
    salary NUMERIC DEFAULT 0,
    photo_url TEXT,
    emergency_contact TEXT,
    work_location TEXT DEFAULT 'Douala',
    badge_code TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- SECTION 2 : TÂCHES, PROJETS ET ASSIGNATIONS
-- ==============================================================================

-- 4. Table des Projets de Tâches
CREATE TABLE public.task_projects (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
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

-- 5. Membres des Projets
CREATE TABLE public.task_project_members (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    project_id BIGINT REFERENCES public.task_projects(id) ON DELETE CASCADE,
    employee_id BIGINT REFERENCES public.employees(id) ON DELETE CASCADE,
    role_in_project TEXT DEFAULT 'membre',
    added_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Table des Tâches
CREATE TABLE public.tasks (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    date DATE,
    time TEXT,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    assigned_to TEXT,
    employee_id BIGINT REFERENCES public.employees(id) ON DELETE SET NULL,
    department TEXT,
    project_id BIGINT REFERENCES public.task_projects(id) ON DELETE SET NULL,
    due_date DATE,
    is_milestone BOOLEAN DEFAULT FALSE,
    milestone_progress NUMERIC DEFAULT 0,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Affectations Multiples de Tâches
CREATE TABLE public.task_assignees (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    task_id BIGINT REFERENCES public.tasks(id) ON DELETE CASCADE,
    employee_id BIGINT REFERENCES public.employees(id) ON DELETE CASCADE,
    role_in_task TEXT DEFAULT 'contributeur',
    assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- SECTION 3 : RAPPELS & NOTIFICATIONS
-- ==============================================================================

-- 8. Table des Rappels
CREATE TABLE public.reminders (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
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

-- 9. Destinataires des Rappels
CREATE TABLE public.reminder_recipients (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    reminder_id BIGINT REFERENCES public.reminders(id) ON DELETE CASCADE,
    employee_id BIGINT REFERENCES public.employees(id) ON DELETE CASCADE,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMPTZ
);

-- 10. Notifications Système
CREATE TABLE public.notifications (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
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

-- 11. Destinataires des Notifications
CREATE TABLE public.notification_recipients (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    notification_id BIGINT REFERENCES public.notifications(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE
);

-- ==============================================================================
-- SECTION 4 : POINTAGES & PRÉSENCES
-- ==============================================================================

-- 12. Table des Présences
CREATE TABLE public.presences (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    employee_id BIGINT REFERENCES public.employees(id) ON DELETE SET NULL,
    employee_name TEXT,
    date DATE NOT NULL,
    arrival_time TEXT,
    departure_time TEXT,
    status TEXT DEFAULT 'present',
    late_minutes INTEGER DEFAULT 0,
    pause_minutes INTEGER DEFAULT 0,
    motif TEXT,
    signature TEXT,
    gps_lat NUMERIC,
    gps_lng NUMERIC,
    method TEXT DEFAULT 'kiosk',
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Pauses de Présence
CREATE TABLE public.presence_pauses (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    presence_id BIGINT REFERENCES public.presences(id) ON DELETE CASCADE,
    start_time TEXT NOT NULL,
    end_time TEXT,
    duration_minutes INTEGER DEFAULT 0,
    motif TEXT
);

-- 14. Incidents de Présence
CREATE TABLE public.attendance_incidents (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    employee_id BIGINT REFERENCES public.employees(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'en_attente',
    resolved_by BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Codes Badges 16 Caractères
CREATE TABLE public.badge_codes_16 (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    employee_id BIGINT REFERENCES public.employees(id) ON DELETE SET NULL,
    assigned_name TEXT,
    created_by TEXT,
    expires_at TIMESTAMPTZ,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Sessions QR Dynamiques
CREATE TABLE public.dynamic_qr_sessions (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    session_id TEXT UNIQUE NOT NULL,
    created_by TEXT,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- SECTION 5 : INVENTAIRE, MATÉRIEL ET DISCIPLINES
-- ==============================================================================

-- 17. Inventaire Matériel
CREATE TABLE public.inventory (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    serial_number TEXT,
    quantity INTEGER DEFAULT 1,
    status TEXT DEFAULT 'disponible',
    assigned_to_id BIGINT REFERENCES public.employees(id) ON DELETE SET NULL,
    assigned_date DATE,
    unit_price_xaf NUMERIC DEFAULT 0,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Affectations Inventaire
CREATE TABLE public.inventory_assignments (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    inventory_id BIGINT REFERENCES public.inventory(id) ON DELETE CASCADE,
    employee_id BIGINT REFERENCES public.employees(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    returned_at TIMESTAMPTZ,
    condition TEXT DEFAULT 'bon_etat'
);

-- 19. Incidents Disciplinaires
CREATE TABLE public.disciplinary_incidents (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    employee_id BIGINT REFERENCES public.employees(id) ON DELETE SET NULL,
    employee_name TEXT,
    date DATE NOT NULL,
    severity TEXT DEFAULT 'mineure',
    reason TEXT NOT NULL,
    action_taken TEXT,
    decision_by TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Départements
CREATE TABLE public.departments (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    name TEXT UNIQUE NOT NULL,
    code TEXT,
    manager_id BIGINT REFERENCES public.employees(id) ON DELETE SET NULL,
    budget_xaf NUMERIC DEFAULT 0,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Documents RH Générés
CREATE TABLE public.documents (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    employee_id BIGINT REFERENCES public.employees(id) ON DELETE SET NULL,
    file_url TEXT,
    content TEXT,
    status TEXT DEFAULT 'valide',
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. Modèles de Documents RH
CREATE TABLE public.rh_document_templates (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    content_template TEXT NOT NULL,
    required_variables JSONB,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- SECTION 6 : FINANCES, PAIES ET PARTENAIRES
-- ==============================================================================

-- 23. Dettes et Avances Salariales
CREATE TABLE public.processflow_salary_debts (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    employee_id BIGINT REFERENCES public.employees(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'en_cours',
    repaid_amount NUMERIC DEFAULT 0,
    due_date DATE,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 24. Paiements de Salaires
CREATE TABLE public.salary_payments (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    employee_id BIGINT REFERENCES public.employees(id) ON DELETE SET NULL,
    month TEXT NOT NULL,
    year INTEGER NOT NULL,
    base_salary NUMERIC NOT NULL,
    bonus NUMERIC DEFAULT 0,
    deductions NUMERIC DEFAULT 0,
    net_salary NUMERIC NOT NULL,
    payment_date DATE,
    payment_method TEXT DEFAULT 'virement',
    status TEXT DEFAULT 'paye',
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 25. Transactions Financières
CREATE TABLE public.financial_transactions (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    type TEXT NOT NULL,
    category TEXT,
    amount NUMERIC NOT NULL,
    description TEXT,
    reference TEXT,
    date DATE NOT NULL,
    beneficiary TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 26. Partenaires d'Affaires
CREATE TABLE public.partners (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    service_type TEXT,
    status TEXT DEFAULT 'actif',
    rating NUMERIC DEFAULT 5,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- SECTION 7 : CONFIGURATION, CONGÉS & OPÉRATIONS
-- ==============================================================================

-- 27. Paramètres d'Entreprise
CREATE TABLE public.company_settings (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    setting_key TEXT UNIQUE,
    setting_value JSONB,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 28. Demandes de Congés et Absences
CREATE TABLE public.leave_requests (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    employee_id BIGINT REFERENCES public.employees(id) ON DELETE SET NULL,
    employee_name TEXT,
    type TEXT DEFAULT 'conge_paye',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count NUMERIC DEFAULT 1,
    reason TEXT,
    status TEXT DEFAULT 'en_attente',
    decided_by TEXT,
    decided_at TIMESTAMPTZ,
    decision_reason TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 29. Appels et Communications
CREATE TABLE public.calls (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    caller_id TEXT,
    caller_name TEXT,
    receiver_id TEXT,
    receiver_name TEXT,
    status TEXT DEFAULT 'initiating',
    room_id TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 30. Statuts de Présence En Ligne des Utilisateurs
CREATE TABLE public.user_presences (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    user_id TEXT,
    user_name TEXT,
    status TEXT DEFAULT 'online',
    last_active TIMESTAMPTZ DEFAULT NOW(),
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 31. Offres d'Emploi
CREATE TABLE public.job_offers (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    title TEXT NOT NULL,
    department TEXT,
    description TEXT,
    requirements TEXT,
    status TEXT DEFAULT 'ouverte',
    deadline DATE,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 32. Candidatures
CREATE TABLE public.job_applications (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    job_offer_id BIGINT REFERENCES public.job_offers(id) ON DELETE CASCADE,
    candidate_name TEXT NOT NULL,
    candidate_email TEXT NOT NULL,
    candidate_phone TEXT,
    resume_url TEXT,
    status TEXT DEFAULT 'recue',
    notes TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 33. Notes de Frais
CREATE TABLE public.expense_claims (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    employee_id BIGINT REFERENCES public.employees(id) ON DELETE SET NULL,
    employee_name TEXT,
    title TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    date DATE NOT NULL,
    category TEXT,
    receipt_url TEXT,
    status TEXT DEFAULT 'soumise',
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 34. Incidents HSE
CREATE TABLE public.hse_incidents (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    title TEXT NOT NULL,
    site_location TEXT,
    zone_precise TEXT,
    type TEXT,
    severity TEXT DEFAULT 'mineur',
    date DATE NOT NULL,
    time TEXT,
    description TEXT,
    reported_by TEXT,
    victim_name TEXT,
    days_lost INTEGER DEFAULT 0,
    status TEXT DEFAULT 'signale',
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 35. Registre des Visiteurs
CREATE TABLE public.visitor_logs (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
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
    check_in_date DATE,
    check_out_time TEXT,
    status TEXT DEFAULT 'sur_site',
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 36. Boîte à Idées & Suggestions
CREATE TABLE public.idea_suggestions (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    author_name TEXT,
    author_department TEXT,
    author_id TEXT,
    status TEXT DEFAULT 'soumise',
    likes_count INTEGER DEFAULT 0,
    liked_user_ids JSONB DEFAULT '[]'::jsonb,
    management_response TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 37. Sondages d'Entreprise
CREATE TABLE public.enterprise_surveys (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    status TEXT DEFAULT 'actif',
    deadline DATE,
    created_by TEXT,
    options JSONB DEFAULT '[]'::jsonb,
    voted_user_ids JSONB DEFAULT '[]'::jsonb,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 38. Collections Génériques (Fallback)
CREATE TABLE public.generic_collections (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT NOT NULL,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    collection TEXT NOT NULL,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_generic_collection_doc UNIQUE (collection, doc_id)
);

-- 39. Journal des Connexions
CREATE TABLE public.connection_logs (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    user_id TEXT,
    user_name TEXT,
    user_email TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT,
    location TEXT,
    auth_method TEXT DEFAULT 'password',
    status TEXT DEFAULT 'success',
    details TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 40. Journal d'Audit Administrateur
CREATE TABLE public.admin_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    author_name TEXT DEFAULT 'Super Admin',
    author_role TEXT,
    target_user_id TEXT,
    target_employee_id TEXT,
    target_name TEXT,
    operation_type TEXT,
    operation_label TEXT,
    details TEXT,
    ip_address TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEX DE PERFORMANCE & RECHERCHE RAPIDE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_users_doc_id ON public.users(doc_id);
CREATE INDEX IF NOT EXISTS idx_employees_doc_id ON public.employees(doc_id);
CREATE INDEX IF NOT EXISTS idx_tasks_doc_id ON public.tasks(doc_id);
CREATE INDEX IF NOT EXISTS idx_presences_doc_id ON public.presences(doc_id);
CREATE INDEX IF NOT EXISTS idx_reminders_doc_id ON public.reminders(doc_id);
CREATE INDEX IF NOT EXISTS idx_notifications_doc_id ON public.notifications(doc_id);
CREATE INDEX IF NOT EXISTS idx_company_settings_doc_id ON public.company_settings(doc_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_doc_id ON public.leave_requests(doc_id);
CREATE INDEX IF NOT EXISTS idx_inventory_doc_id ON public.inventory(doc_id);
CREATE INDEX IF NOT EXISTS idx_disc_inc_doc_id ON public.disciplinary_incidents(doc_id);
CREATE INDEX IF NOT EXISTS idx_documents_doc_id ON public.documents(doc_id);

-- ==============================================================================
-- SÉCURITÉ & ROW LEVEL SECURITY (RLS) UNIFIÉE
-- ==============================================================================
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
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
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

-- Attribution universelle des politiques RLS (anon, authenticated, service_role)
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('
            DROP POLICY IF EXISTS "allow_all_for_all_roles" ON public.%I;
            DROP POLICY IF EXISTS "service_role_full_access" ON public.%I;
            CREATE POLICY "allow_all_for_all_roles" ON public.%I 
            FOR ALL TO anon, authenticated, service_role 
            USING (true) WITH CHECK (true);
        ', t, t, t);
    END LOOP;
END $$;

-- ACCÈS ET PRIVILÈGES POSTGRESQL
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
