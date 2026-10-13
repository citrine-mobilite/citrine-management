-- ==============================================================================
-- DÉBLOCAGE IMMÉDIAT DES PERMISSIONS SUPABASE (À EXÉCUTER EN 1 CLIC DANS SUPABASE)
-- Lien : https://supabase.com/dashboard/project/svvgziqcdahkgyugqlvk/sql/new
-- ==============================================================================

-- 1. Accorder l'usage du schéma public
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Accorder tous les droits de lecture / écriture sur toutes les tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

-- 3. Accorder tous les droits sur les séquences (pour les IDs auto-incrémentés BIGSERIAL)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 4. Accorder tous les droits sur les fonctions
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 5. Configurer les privilèges par défaut pour toutes les futures tables créées
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
