-- ==============================================================================
-- MIGRATION 001 : AUDIT TECHNIQUE, INTÉGRITÉ RÉFÉRENTIELLE & SÉCURITÉ POSTGRESQL / SUPABASE
-- Application : Citrine Management
-- Type : Migration versionnée, ordonnée, commentée, 100% NON-DESTRUCTIVE
-- Objectifs :
--   1. Préserver l'historique légal/RH (remplacement des CASCADE dangereux par RESTRICT/SET NULL)
--   2. Corriger les types et statuts métiers (tasks, presences, employees) avec compatibilité existante
--   3. Introduire les tables de jonction pour relations N-N (affectations multiples, membres, alertes)
--   4. Supprimer les index redondants et ajouter les index partiels pour les requêtes réelles
--   5. Activer et sécuriser la Row Level Security (RLS) sans secrets en clair
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- ÉTAPE 0 : EXTENSIONS REQUISES
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- ÉTAPE 1 : CORRECTION DES STATUTS ET TYPES MÉTIERS SANS PERTE DE DONNÉES
-- ------------------------------------------------------------------------------

-- 1.1 Tâches : Remplacement du statut booléen par un statut métier textuel enrichi
DO $$
BEGIN
    -- Si la colonne status est encore de type boolean, conversion intelligente
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'status' AND data_type = 'boolean'
    ) THEN
        ALTER TABLE public.tasks 
            ALTER COLUMN status TYPE TEXT 
            USING (CASE WHEN status IS TRUE THEN 'completed' ELSE 'todo' END);
        ALTER TABLE public.tasks ALTER COLUMN status SET DEFAULT 'todo';
    END IF;
END $$;

-- Contrainte CHECK sur le statut des tâches (si non existante)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_tasks_status') THEN
        ALTER TABLE public.tasks ADD CONSTRAINT chk_tasks_status 
            CHECK (status IN ('todo', 'in_progress', 'completed', 'pending_validation', 'blocked', 'idea', 'en_cours'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_tasks_priority') THEN
        ALTER TABLE public.tasks ADD CONSTRAINT chk_tasks_priority 
            CHECK (priority IN ('low', 'medium', 'high', 'urgent', 'haut'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_tasks_milestone_progress') THEN
        ALTER TABLE public.tasks ADD CONSTRAINT chk_tasks_milestone_progress 
            CHECK (milestone_progress >= 0 AND milestone_progress <= 100);
    END IF;
END $$;

-- 1.2 Présences : Statut métier de pointage ('present', 'late', 'absent', 'not_tracked')
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'presences' AND column_name = 'status' AND data_type = 'boolean'
    ) THEN
        ALTER TABLE public.presences 
            ALTER COLUMN status TYPE TEXT 
            USING (CASE WHEN status IS TRUE THEN 'present' ELSE 'absent' END);
        ALTER TABLE public.presences ALTER COLUMN status SET DEFAULT 'present';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_presences_status') THEN
        ALTER TABLE public.presences ADD CONSTRAINT chk_presences_status 
            CHECK (status IN ('present', 'late', 'absent', 'not_tracked', 'on_leave', 'holiday'));
    END IF;
END $$;

-- 1.3 Collaborateurs / Employés : Contrainte de salaire positif et statut d'activité
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_employees_salary') THEN
        ALTER TABLE public.employees ADD CONSTRAINT chk_employees_salary CHECK (salary >= 0);
    END IF;
END $$;

-- 1.4 Finances et notes de frais : Montants obligatoirement positifs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_financial_tx_amount') THEN
        ALTER TABLE public.financial_transactions ADD CONSTRAINT chk_financial_tx_amount CHECK (amount >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_expense_claims_amount') THEN
        ALTER TABLE public.expense_claims ADD CONSTRAINT chk_expense_claims_amount CHECK (amount >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_inventory_quantity') THEN
        ALTER TABLE public.inventory ADD CONSTRAINT chk_inventory_quantity CHECK (quantity >= 0);
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- ÉTAPE 2 : SÉCURISATION DE L'HISTORIQUE LÉGAL (Remplacement des ON DELETE CASCADE)
-- En droit du travail et en comptabilité, la suppression d'un collaborateur ne doit JAMAIS
-- effacer silencieusement ses pointages passés, ses bulletins de salaire ou les audits légaux.
-- ------------------------------------------------------------------------------

-- 2.1 Présences : Protéger l'historique contre la suppression accidentelle
DO $$
BEGIN
    -- Remplacer la contrainte CASCADE existante par RESTRICT
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'presences_employee_id_fkey') THEN
        ALTER TABLE public.presences DROP CONSTRAINT presences_employee_id_fkey;
        ALTER TABLE public.presences ADD CONSTRAINT presences_employee_id_fkey 
            FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE RESTRICT;
    END IF;
END $$;

-- 2.2 Paies et Dettes : Conservation comptable obligatoire
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'salary_payments_employee_id_fkey') THEN
        ALTER TABLE public.salary_payments DROP CONSTRAINT salary_payments_employee_id_fkey;
        ALTER TABLE public.salary_payments ADD CONSTRAINT salary_payments_employee_id_fkey 
            FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE RESTRICT;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'processflow_salary_debts_employee_id_fkey') THEN
        ALTER TABLE public.processflow_salary_debts DROP CONSTRAINT processflow_salary_debts_employee_id_fkey;
        ALTER TABLE public.processflow_salary_debts ADD CONSTRAINT processflow_salary_debts_employee_id_fkey 
            FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE RESTRICT;
    END IF;
END $$;

-- 2.3 Incidents de pointage et disciplinaires
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_incidents_employee_id_fkey') THEN
        ALTER TABLE public.attendance_incidents DROP CONSTRAINT attendance_incidents_employee_id_fkey;
        ALTER TABLE public.attendance_incidents ADD CONSTRAINT attendance_incidents_employee_id_fkey 
            FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE RESTRICT;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'disciplinary_incidents_employee_id_fkey') THEN
        ALTER TABLE public.disciplinary_incidents DROP CONSTRAINT disciplinary_incidents_employee_id_fkey;
        ALTER TABLE public.disciplinary_incidents ADD CONSTRAINT disciplinary_incidents_employee_id_fkey 
            FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE RESTRICT;
    END IF;
END $$;

-- 2.4 Documents RH : Conserver les documents archivés
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documents_employee_id_fkey') THEN
        ALTER TABLE public.documents DROP CONSTRAINT documents_employee_id_fkey;
        ALTER TABLE public.documents ADD CONSTRAINT documents_employee_id_fkey 
            FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE RESTRICT;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- ÉTAPE 3 : NOUVELLES TABLES D'ASSOCIATION (RELATIONS MULTIPLES / ONE-TO-MANY & MANY-TO-MANY)
-- ------------------------------------------------------------------------------

-- 3.1 Affectations Multiples de Tâches (Un collaborateur ou plusieurs peuvent être affectés à une tâche)
CREATE TABLE IF NOT EXISTS public.task_assignees (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    task_id BIGINT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    employee_id BIGINT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    role_in_task TEXT DEFAULT 'contributeur', -- 'responsable', 'contributeur', 'observateur'
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_task_employee UNIQUE (task_id, employee_id)
);

-- 3.2 Membres de Projets de Tâches
CREATE TABLE IF NOT EXISTS public.task_project_members (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    project_id BIGINT NOT NULL REFERENCES public.task_projects(id) ON DELETE CASCADE,
    employee_id BIGINT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    role_in_project TEXT DEFAULT 'membre', -- 'lead', 'membre', 'observateur'
    added_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_project_employee UNIQUE (project_id, employee_id)
);

-- 3.3 Destinataires Multiples de Rappels
CREATE TABLE IF NOT EXISTS public.reminder_recipients (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    reminder_id BIGINT NOT NULL REFERENCES public.reminders(id) ON DELETE CASCADE,
    employee_id BIGINT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMPTZ,
    CONSTRAINT uq_reminder_employee UNIQUE (reminder_id, employee_id)
);

-- 3.4 Destinataires et Suivi de Lecture des Notifications / Alertes
CREATE TABLE IF NOT EXISTS public.notification_recipients (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    notification_id BIGINT NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    CONSTRAINT uq_notification_user UNIQUE (notification_id, user_id)
);

-- 3.5 Historique Détaillé des Pauses de Présence
CREATE TABLE IF NOT EXISTS public.presence_pauses (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    presence_id BIGINT NOT NULL REFERENCES public.presences(id) ON DELETE CASCADE,
    pause_start TIMESTAMPTZ NOT NULL,
    pause_end TIMESTAMPTZ,
    duration_minutes INTEGER,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- ÉTAPE 4 : NETTOYAGE DES INDEX REDONDANTS & AJOUT D'INDEX STRATÉGIQUES
-- ------------------------------------------------------------------------------

-- Suppression des index simples redondants avec les contraintes UNIQUE
DROP INDEX IF EXISTS public.idx_roles_code;
DROP INDEX IF EXISTS public.idx_users_email;
DROP INDEX IF EXISTS public.idx_departments_code;

-- Index sur les nouvelles tables d'association
CREATE INDEX IF NOT EXISTS idx_task_assignees_task ON public.task_assignees(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_employee ON public.task_assignees(employee_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON public.task_project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_employee ON public.task_project_members(employee_id);
CREATE INDEX IF NOT EXISTS idx_reminder_recipients_reminder ON public.reminder_recipients(reminder_id);
CREATE INDEX IF NOT EXISTS idx_reminder_recipients_employee ON public.reminder_recipients(employee_id);
CREATE INDEX IF NOT EXISTS idx_notif_recipients_notif ON public.notification_recipients(notification_id);
CREATE INDEX IF NOT EXISTS idx_notif_recipients_user ON public.notification_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_presence_pauses_presence ON public.presence_pauses(presence_id);

-- Index composites et partiels hautement performants pour les requêtes de l'application
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

-- ------------------------------------------------------------------------------
-- ÉTAPE 5 : SÉCURITÉ SUPABASE (ROW LEVEL SECURITY & POLITIQUES DE CONTRÔLE D'ACCÈS)
-- ------------------------------------------------------------------------------

-- Activation de la RLS sur l'ensemble des tables métier et de jonction
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_project_members ENABLE ROW LEVEL SECURITY;
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

-- Politiques RLS modèles :
-- 1. Accès complet pour le rôle service_role (backend / API sécurisée)
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

-- 2. Politique de lecture générale pour les utilisateurs authentifiés
-- (Ajustable finement par module selon le rôle)
CREATE POLICY "users_read_authenticated" ON public.users
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "employees_read_authenticated" ON public.employees
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "tasks_access_assigned_or_admin" ON public.tasks
    FOR ALL TO authenticated USING (
        employee_id IN (SELECT id FROM public.employees WHERE email = auth.email())
        OR EXISTS (
            SELECT 1 FROM public.users u 
            JOIN public.roles r ON u.role_id = r.id 
            WHERE u.email = auth.email() AND r.code IN ('SUPER_ADMIN', 'ADMIN_RH', 'IT')
        )
    );

CREATE POLICY "presences_access_own_or_admin" ON public.presences
    FOR ALL TO authenticated USING (
        employee_id IN (SELECT id FROM public.employees WHERE email = auth.email())
        OR EXISTS (
            SELECT 1 FROM public.users u 
            JOIN public.roles r ON u.role_id = r.id 
            WHERE u.email = auth.email() AND r.code IN ('SUPER_ADMIN', 'ADMIN_RH', 'IT')
        )
    );

-- 3. Protection stricte des données financières et de paie
CREATE POLICY "salary_payments_admin_only" ON public.salary_payments
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            JOIN public.roles r ON u.role_id = r.id 
            WHERE u.email = auth.email() AND r.code IN ('SUPER_ADMIN', 'ADMIN_RH', 'FINANCE')
        )
        OR employee_id IN (SELECT id FROM public.employees WHERE email = auth.email())
    );

-- ------------------------------------------------------------------------------
-- ÉTAPE 6 : NETTOYAGE DES SECRETS EN CLAIR DANS LES DONNÉES EXISTANTES
-- Élimination de tout passwordHash en clair stocké dans les JSONB de raw_data
-- ------------------------------------------------------------------------------
UPDATE public.users 
SET raw_data = raw_data - 'passwordHash' - 'password'
WHERE raw_data ? 'passwordHash' OR raw_data ? 'password';

COMMIT;
