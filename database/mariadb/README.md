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
