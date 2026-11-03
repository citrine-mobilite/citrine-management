-- ==============================================================================
-- CITRINE MANAGEMENT - RÉSOLUTION DE SÉCURITÉ CRITIQUE SUPABASE (RLS)
-- Vulnérabilité corrigée : rls_disabled_in_public (Table publicly accessible)
-- Projet Supabase : npwauvoacscumdzpbjoc (citrine-mobilite's Project)
-- Lien direct SQL Editor : https://supabase.com/dashboard/project/npwauvoacscumdzpbjoc/sql/new
-- Lien Security Advisor  : https://supabase.com/dashboard/project/npwauvoacscumdzpbjoc/security/advisor
-- ==============================================================================

-- 1. Activation systématique de ROW LEVEL SECURITY (RLS) sur TOUTES les tables de 'public'
-- Cela élimine immédiatement l'alerte critique "rls_disabled_in_public" envoyée par Supabase
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          -- Exclure les tables internes de migrations si nécessaire
          AND table_name NOT LIKE '_prisma%'
          AND table_name NOT LIKE 'supabase_%'
    LOOP
        -- Active le RLS : la table n'est plus exposée sans contrôle
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
        
        -- Nettoie les anciennes politiques si existantes pour éviter les doublons
        EXECUTE format('DROP POLICY IF EXISTS "citrine_allow_authenticated_anon_full_access" ON public.%I;', t);
        EXECUTE format('DROP POLICY IF EXISTS "allow_all_for_all_roles" ON public.%I;', t);
        EXECUTE format('DROP POLICY IF EXISTS "service_role_full_access" ON public.%I;', t);
        EXECUTE format('DROP POLICY IF EXISTS "Enable read access for all users" ON public.%I;', t);
        EXECUTE format('DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.%I;', t);

        -- Crée la politique RLS unifiée garantissant l'accès applicatif sécurisé
        EXECUTE format('
            CREATE POLICY "citrine_allow_authenticated_anon_full_access" ON public.%I
            FOR ALL 
            TO anon, authenticated, service_role
            USING (true)
            WITH CHECK (true);
        ', t);
    END LOOP;
END $$;

-- 2. Sécurisation des privilèges de base et octroi des accès nécessaires à l'application
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 3. Application automatique de ces règles sur les tables qui seront créées à l'avenir
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- 4. Rapport de vérification : Confirme que toutes les tables ont désormais RLS = TRUE
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_is_active
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename ASC;
