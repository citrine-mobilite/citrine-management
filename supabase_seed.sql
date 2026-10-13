-- ==============================================================================
-- CITRINE MANAGEMENT - JEU DE DONNÉES DE DÉPART (SEEDING) IDEMPOTENT SUPABASE
-- - id  : Auto-incrémenté (BIGSERIAL)
-- - uid : UUID v4 (gen_random_uuid())
-- - Sécurisé : AUCUN mot de passe stocké en clair (gestion par Supabase Auth)
-- - Idempotent : AUCUN TRUNCATE ni suppression, ré-exécutable à chaud sans perte de données
-- - Cible : Configuration du compte Super Administrateur / IT pour citrinemobilite@gmail.com
-- ==============================================================================

BEGIN;

-- 1. Rôle Super Administrateur
INSERT INTO public.roles (uid, name, code, description, permissions, raw_data)
VALUES (
    gen_random_uuid(),
    'Super Administrateur',
    'SUPER_ADMIN',
    'Administrateur système et IT avec accès complet',
    '{"all": true}'::jsonb,
    '{"name":"Super Administrateur","code":"SUPER_ADMIN","permissions":{"all":true}}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions,
    updated_at = NOW();

-- 2. Utilisateur Super Admin
INSERT INTO public.users (uid, email, name, role_id, status, department, phone, raw_data)
VALUES (
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
    name = EXCLUDED.name, 
    role_id = EXCLUDED.role_id,
    status = EXCLUDED.status, 
    department = EXCLUDED.department, 
    phone = EXCLUDED.phone,
    raw_data = EXCLUDED.raw_data,
    updated_at = NOW();

-- 3. Employé / Collaborateur RH Super Admin
INSERT INTO public.employees (uid, user_id, role_id, name, email, phone, department, position, role_type, status, hire_date, salary, raw_data)
VALUES (
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
    '{"salary":300000,"hireDate":"2026-01-01","email":"citrinemobilite@gmail.com","roleType":"Super Administrateur","status":"en_poste","department":"IT","phone":"+237 600 000 099","name":"Citrine Mobilité"}'::jsonb
)
ON CONFLICT (email) DO UPDATE SET 
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

COMMIT;

-- ==============================================================================
-- ACCÈS ET PRIVILÈGES POSTGRESQL
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
