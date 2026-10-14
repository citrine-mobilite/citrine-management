-- ==============================================================================
-- CITRINE MANAGEMENT - JEU DE DONNÉES DE DÉPART (SEEDING) IDEMPOTENT SUPABASE
-- ==============================================================================

BEGIN;

-- 1. Rôles Système
INSERT INTO public.roles (doc_id, uid, name, code, description, permissions, raw_data)
VALUES 
(
    'role_super_admin',
    gen_random_uuid(),
    'Super Administrateur',
    'SUPER_ADMIN',
    'Administrateur système et IT avec accès complet',
    '{"all": true}'::jsonb,
    '{"name":"Super Administrateur","code":"SUPER_ADMIN","permissions":{"all":true}}'::jsonb
),
(
    'role_responsable',
    gen_random_uuid(),
    'Responsable d''Unité',
    'RESPONSABLE',
    'Responsable de département et validation des pointages et congés',
    '{"manage_tasks": true, "validate_presences": true, "view_team": true}'::jsonb,
    '{"name":"Responsable d''Unité","code":"RESPONSABLE","permissions":{"manage_tasks":true,"validate_presences":true}}'::jsonb
),
(
    'role_employe',
    gen_random_uuid(),
    'Collaborateur / Employé',
    'EMPLOYE',
    'Accès collaborateur : pointage, tâches assignées, fiches de paie',
    '{"self_clocking": true, "view_assigned_tasks": true}'::jsonb,
    '{"name":"Collaborateur / Employé","code":"EMPLOYE","permissions":{"self_clocking":true}}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    doc_id = EXCLUDED.doc_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions,
    updated_at = NOW();

-- 2. Départements d'Entreprise
INSERT INTO public.departments (doc_id, uid, name, code, budget_xaf, raw_data)
VALUES
    ('dept_direction', gen_random_uuid(), 'Direction Générale', 'DIR', 10000000, '{"name":"Direction Générale","code":"DIR"}'::jsonb),
    ('dept_it', gen_random_uuid(), 'Systèmes d''Information & IT', 'IT', 5000000, '{"name":"Systèmes d''Information & IT","code":"IT"}'::jsonb),
    ('dept_rh', gen_random_uuid(), 'Ressources Humaines', 'RH', 4000000, '{"name":"Ressources Humaines","code":"RH"}'::jsonb),
    ('dept_logistique', gen_random_uuid(), 'Logistique & Opérations', 'LOG', 8000000, '{"name":"Logistique & Opérations","code":"LOG"}'::jsonb),
    ('dept_finance', gen_random_uuid(), 'Comptabilité & Finances', 'FIN', 6000000, '{"name":"Comptabilité & Finances","code":"FIN"}'::jsonb)
ON CONFLICT (name) DO UPDATE SET
    doc_id = EXCLUDED.doc_id,
    code = EXCLUDED.code,
    budget_xaf = EXCLUDED.budget_xaf,
    updated_at = NOW();

-- 3. Utilisateur Super Admin
INSERT INTO public.users (doc_id, uid, email, name, role_id, status, department, phone, raw_data)
VALUES (
    'user_citrinemobilite',
    gen_random_uuid(),
    'citrinemobilite@gmail.com',
    'Citrine Mobilité',
    (SELECT id FROM public.roles WHERE code = 'SUPER_ADMIN' LIMIT 1),
    TRUE,
    'IT',
    '+237 600 000 099',
    '{"role":"SUPER_ADMIN","department":"IT","name":"Citrine Mobilité","status":"actif","createdAt":"2026-01-01T00:00:00.000Z","email":"citrinemobilite@gmail.com","phone":"+237 600 000 099"}'::jsonb
)
ON CONFLICT (email) DO UPDATE SET 
    doc_id = EXCLUDED.doc_id,
    name = EXCLUDED.name, 
    role_id = EXCLUDED.role_id,
    status = EXCLUDED.status, 
    department = EXCLUDED.department, 
    phone = EXCLUDED.phone,
    raw_data = EXCLUDED.raw_data,
    updated_at = NOW();

-- 4. Collaborateur RH Associé au Super Admin
INSERT INTO public.employees (doc_id, uid, user_id, role_id, name, email, phone, department, position, role_type, status, hire_date, salary, work_location, raw_data)
VALUES (
    'emp_citrinemobilite',
    gen_random_uuid(),
    (SELECT id FROM public.users WHERE email = 'citrinemobilite@gmail.com' LIMIT 1),
    (SELECT id FROM public.roles WHERE code = 'SUPER_ADMIN' LIMIT 1),
    'Citrine Mobilité',
    'citrinemobilite@gmail.com',
    '+237 600 000 099',
    'IT',
    'Super Administrateur',
    'Super Administrateur',
    TRUE,
    '2026-01-01',
    300000,
    'Douala',
    '{"salary":300000,"hireDate":"2026-01-01","email":"citrinemobilite@gmail.com","roleType":"Super Administrateur","status":"en_poste","department":"IT","phone":"+237 600 000 099","name":"Citrine Mobilité"}'::jsonb
)
ON CONFLICT (email) DO UPDATE SET 
    doc_id = EXCLUDED.doc_id,
    user_id = EXCLUDED.user_id,
    role_id = EXCLUDED.role_id,
    name = EXCLUDED.name, 
    department = EXCLUDED.department,
    position = EXCLUDED.position,
    role_type = EXCLUDED.role_type,
    status = EXCLUDED.status,
    salary = EXCLUDED.salary, 
    raw_data = EXCLUDED.raw_data,
    updated_at = NOW();

-- 5. Paramètres d'Entreprise
INSERT INTO public.company_settings (doc_id, uid, setting_key, setting_value, raw_data)
VALUES (
    'main_config',
    gen_random_uuid(),
    'main_config',
    '{"companyName":"Citrine SARL","currency":"XAF","workHoursPerWeek":40,"autoLateThresholdMinutes":15}'::jsonb,
    '{"id":"main_config","companyName":"Citrine SARL","currency":"XAF"}'::jsonb
)
ON CONFLICT (setting_key) DO UPDATE SET
    doc_id = EXCLUDED.doc_id,
    setting_value = EXCLUDED.setting_value,
    raw_data = EXCLUDED.raw_data,
    updated_at = NOW();

COMMIT;

-- ACCÈS ET PRIVILÈGES POSTGRESQL
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
