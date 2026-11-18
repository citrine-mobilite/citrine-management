import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Client } from 'pg';

const TABLES = [
  'roles', 'users', 'employees', 'task_projects', 'task_project_members', 'tasks',
  'task_assignees', 'reminders', 'reminder_recipients', 'notifications',
  'notification_recipients', 'presences', 'presence_pauses', 'attendance_incidents',
  'badge_codes_16', 'dynamic_qr_sessions', 'inventory', 'inventory_assignments',
  'disciplinary_incidents', 'departments', 'documents', 'rh_document_templates',
  'processflow_salary_debts', 'salary_payments', 'financial_transactions', 'partners',
  'company_settings', 'leave_requests', 'calls', 'user_presences', 'job_offers',
  'job_applications', 'expense_claims', 'hse_incidents', 'visitor_logs',
  'idea_suggestions', 'enterprise_surveys', 'generic_collections',
  'connection_logs', 'admin_audit_logs',
] as const;

function parseJson(value: unknown): Record<string, any> {
  if (value && typeof value === 'object') return value as Record<string, any>;
  if (typeof value === 'string') { try { return JSON.parse(value); } catch {} }
  return {};
}

function mapSqlRow(row: any): Record<string, any> {
  const raw = parseJson(row.raw_data);
  const item = { ...raw, ...row };
  delete item.raw_data;
  item.id = String(row.doc_id || raw.id || row.id);
  item.docId = row.doc_id || raw.docId || item.id;
  item.uid = row.uid || raw.uid;
  item._dbId = row.id;
  return item;
}

async function main() {
  const connectionString = process.env.SUPABASE_DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error('SUPABASE_DATABASE_URL est requis. Utilise la chaîne PostgreSQL du projet Supabase, sans la committer.');
  }
  const outputArg = process.argv[2] || 'citrine-supabase-export.json';
  const outputPath = path.resolve(process.cwd(), outputArg);
  try {
    await fs.access(outputPath);
    throw new Error(`Le fichier existe déjà : ${outputPath}. Choisis un autre nom pour éviter un écrasement.`);
  } catch (error: any) {
    if (error?.code !== 'ENOENT') throw error;
  }

  const client = new Client({
    connectionString,
    ssl: process.env.SUPABASE_DB_SSL === 'disable' ? false : { rejectUnauthorized: true },
    connectionTimeoutMillis: 20000,
    query_timeout: 120000,
    statement_timeout: 120000,
    application_name: 'citrine-management-migration-export',
  });

  await client.connect();
  const collections: Record<string, any[]> = {};
  const rowCounts: Record<string, number> = {};
  let authRows: any[] = [];
  let authReadable = false;

  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    for (const table of TABLES) {
      const result = await client.query(`SELECT * FROM public."${table}" ORDER BY id`);
      rowCounts[table] = result.rows.length;

      if (table === 'generic_collections') {
        for (const row of result.rows) {
          const collectionName = String(row.collection || '').trim();
          if (!collectionName) continue;
          const data = parseJson(row.data);
          const item = {
            ...data,
            id: String(row.doc_id || data.id || row.id),
            docId: row.doc_id || data.docId || String(row.id),
            uid: row.uid || data.uid,
            _dbId: row.id,
          };
          (collections[collectionName] ||= []).push(item);
        }
        continue;
      }

      collections[table] = result.rows.map(mapSqlRow);
    }

    await client.query('SAVEPOINT auth_export');
    try {
      const auth = await client.query(
        `SELECT id, email, encrypted_password, created_at, updated_at
         FROM auth.users WHERE deleted_at IS NULL AND email IS NOT NULL`
      );
      authRows = auth.rows;
      authReadable = true;
      await client.query('RELEASE SAVEPOINT auth_export');
    } catch (error: any) {
      await client.query('ROLLBACK TO SAVEPOINT auth_export');
      await client.query('RELEASE SAVEPOINT auth_export');
      console.warn('[Export] auth.users inaccessible; les comptes sans hash dans public.users devront réinitialiser leur mot de passe.');
      console.warn('[Export] Détail :', error?.message || String(error));
    }

    const users = collections.users ||= [];
    const byEmail = new Map<string, any>(users.map(user => [String(user.email || '').trim().toLowerCase(), user] as [string, any]));
    for (const authUser of authRows) {
      const email = String(authUser.email || '').trim().toLowerCase();
      if (!email) continue;
      let user = byEmail.get(email);
      if (!user) {
        user = {
          id: String(authUser.id), docId: String(authUser.id), uid: String(authUser.id),
          email, name: email.split('@')[0], roleId: 3, role: 'employé', status: 'actif',
        };
        users.push(user);
        byEmail.set(email, user);
      } else if (!user.uid) {
        user.uid = String(authUser.id);
      }
      if (authUser.encrypted_password) {
        user.passwordHash = String(authUser.encrypted_password);
      }
    }

    await client.query('COMMIT');

    const usersWithoutPassword = users.filter(user => !String(user.passwordHash || user.password_hash || '').trim()).length;
    const payload = {
      metadata: {
        exportDate: new Date().toISOString(),
        source: 'Supabase PostgreSQL',
        tables: TABLES.length,
        rowCounts,
        authUsers: authRows.length,
        authUsersReadable: authReadable,
        usersExported: users.length,
        usersWithoutPasswordHash: usersWithoutPassword,
      },
      collections,
    };
    await fs.writeFile(outputPath, JSON.stringify(payload), { encoding: 'utf8', flag: 'wx', mode: 0o600 });
    console.log(`Export terminé : ${outputPath}`);
    console.log(`Tables PostgreSQL : ${TABLES.length} | lignes exportées : ${Object.values(rowCounts).reduce((a,b) => a+b, 0)}`);
    console.log(`Comptes Auth Supabase : ${authRows.length} | utilisateurs sans hash : ${usersWithoutPassword}`);
    if (usersWithoutPassword > 0) {
      console.warn('ATTENTION : ces utilisateurs devront réinitialiser leur mot de passe avant leur première connexion MariaDB.');
    }
    console.log('Le fichier contient des hashes de mots de passe. Garde-le hors de Git et supprime-le après migration.');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

main().catch(error => {
  console.error('[Export Supabase]', error?.message || error);
  process.exitCode = 1;
});
