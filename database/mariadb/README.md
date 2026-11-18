# MariaDB migration baseline

This directory contains the first MariaDB 10.11 schema draft converted from the repository's PostgreSQL schema.

## Important safeguards
- This is a migration baseline, not a production import script.
- It deliberately contains no DROP TABLE statements.
- It must be validated against the live Supabase schema and representative data before use.
- UUID values are supplied by the application (CHAR(36)); PostgreSQL RLS policies and GRANT statements are not carried over. Authorization must be enforced in the Express API.
- JSON defaults have been removed for portability; the application must supply JSON values where needed.
- Review indexes, unique constraints, nullable columns, FK behavior, and all generic_collections before loading production data.

## Apply only to an empty test database

```bash
mariadb -h localhost -u <db_user> -p <db_name> < database/mariadb/001_schema.sql
```

Do not run against the live database until the schema and data reconciliation steps are complete.

## Import des données

Le fichier `src/data/citrineDatabaseExport.json` présent dans le dépôt est un export d'exemple ancien (2 documents seulement) : **il ne représente pas la base de production**. Il ne faut pas l'utiliser comme migration réelle.

1. Générer un export complet et récent depuis l'instance Supabase de production, au format `{ "metadata": {...}, "collections": { "users": [...], "employees": [...], ... } }`.
2. Transférer ce fichier sur le serveur OVH par un canal privé (ne pas le committer dans GitHub).
3. Configurer les variables MariaDB dans le fichier `.env` privé du serveur.
4. Installer les dépendances et les outils TypeScript, puis exécuter d'abord une simulation :

```bash
npx tsx scripts/import_mariadb_export.ts /chemin/prive/export.json --dry-run
```

5. Vérifier que le nombre de documents correspond à l'export. Sur une base de test vide, lancer ensuite :

```bash
npx tsx scripts/import_mariadb_export.ts /chemin/prive/export.json
```

Le script refuse par défaut d'importer si des utilisateurs ou employés existent déjà. `--merge` est une option explicite pour fusionner des données, à réserver aux imports contrôlés. Le script n'efface aucune ligne et peut être relancé pour reprendre un import partiel.

Ordre recommandé des migrations SQL : `001_schema.sql`, `002_auth_sessions.sql`, `003_seed_reference_data.sql`, `004_call_signals.sql`, `005_presence_employee_date_index.sql`.


## Export des données Supabase (avant bascule)

Le script `scripts/export_supabase_export.ts` lit les 40 tables du schéma PostgreSQL du dépôt dans une transaction en lecture seule. Il aplatit `raw_data`, transforme les lignes de `generic_collections` en collections logiques et tente de récupérer les hashes bcrypt de `auth.users` pour préserver les mots de passe Supabase.

1. Depuis une machine de confiance, configure temporairement `SUPABASE_DATABASE_URL` avec la chaîne PostgreSQL du projet Supabase (Settings → Database). N'enregistre jamais cette chaîne dans Git.
2. Installe les dépendances de développement puis lance `npm run export:supabase -- ./citrine-supabase-export.json`.
3. Conserve le JSON en lieu sûr : il contient des hashes de mots de passe. Le fichier est ignoré par Git et créé avec des permissions privées.
4. Vérifie le nombre d'utilisateurs sans hash. Ceux-ci devront réinitialiser leur mot de passe.
5. Exécute d'abord l'import avec `--dry-run`, puis importe vers une base MariaDB de test vide.

Le script essaie aussi de lire `auth.users.encrypted_password`. Si Supabase refuse cette lecture, le rapport l'indique et les comptes sans hash devront être réinitialisés. Le script n'efface et ne modifie aucune donnée Supabase.
