-- ==============================================================================
-- DÉBLOCAGE IMMÉDIAT DES PERMISSIONS ET AJOUT DE DOC_ID (À EXÉCUTER DANS SUPABASE)
-- Lien : https://supabase.com/dashboard/project/svvgziqcdahkgyugqlvk/sql/new
-- ==============================================================================

-- 1. Ajout sécurisé et idempotent de la colonne doc_id sur toutes les tables
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'roles', 'users', 'employees', 'task_projects', 'task_project_members', 
        'tasks', 'task_assignees', 'reminders', 'reminder_recipients', 'notifications', 
        'notification_recipients', 'presences', 'presence_pauses', 'attendance_incidents', 
        'badge_codes_16', 'dynamic_qr_sessions', 'inventory', 'inventory_assignments', 
        'disciplinary_incidents', 'departments', 'documents', 'rh_document_templates', 
        'processflow_salary_debts', 'salary_payments', 'financial_transactions', 
        'partners', 'company_settings', 'leave_requests', 'calls', 'user_presences', 
        'job_offers', 'job_applications', 'expense_claims', 'hse_incidents', 
        'visitor_logs', 'idea_suggestions', 'enterprise_surveys', 'connection_logs', 
        'admin_audit_logs'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS doc_id TEXT;', tbl);
            EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS %I ON public.%I (doc_id);', 'idx_unique_' || tbl || '_doc_id', tbl);
        END IF;
    END LOOP;
END $$;

-- 2. Configuration des Politiques RLS (Lecture / Écriture totale pour anon, authenticated, service_role)
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

-- 3. Accorder tous les droits de lecture / écriture
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
