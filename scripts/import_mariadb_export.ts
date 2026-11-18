import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, pbkdf2Sync, randomBytes } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import { getMariaDbPool, pingMariaDb, closeMariaDbPool } from '../src/db/mariadb';
import { saveMariaDbDocument, mapCollectionToMariaDbTable } from '../src/db/mariaDbCollections';

type ExportFile = { metadata?: any; collections?: Record<string, any[]> };

function hashLegacyPassword(value: string): string {
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(value, salt, 100000, 32, 'sha256');
  return `pbkdf2:${salt.toString('hex')}:${hash.toString('hex')}`;
}
function normalizeUser(row: any, roleIds: Record<string, number>) {
  const raw = { ...row };
  const role = String(row.role || row.roleCode || '').toUpperCase();
  const roleCode = role.includes('ADMIN') ? 'SUPER_ADMIN' : role.includes('RESPONSABLE') ? 'RESPONSABLE' : 'EMPLOYE';
  raw.roleId = Number(row.roleId || row.role_id || roleIds[roleCode] || 0) || null;
  if (typeof raw.passwordHash === 'string' && raw.passwordHash && !raw.passwordHash.startsWith('pbkdf2:')) {
    raw.passwordHash = hashLegacyPassword(raw.passwordHash);
  }
  delete raw.password_hash;
  return raw;
}
function normalizeEmployee(row: any, roleIds: Record<string, number>) {
  const raw = { ...row };
  const role = String(row.roleType || row.role || '').toUpperCase();
  const roleCode = role.includes('ADMIN') ? 'SUPER_ADMIN' : role.includes('RESPONSABLE') ? 'RESPONSABLE' : 'EMPLOYE';
  raw.roleId = Number(row.roleId || row.role_id || roleIds[roleCode] || 0) || null;
  raw.userId = null; // Re-linked by email after all users and employees are imported.
  return raw;
}

async function resolveLegacyReference(table: string, value: any, legacyMap: Map<string, number>): Promise<number | null> {
  if (value === undefined || value === null || value === '') return null;
  const key = String(value);
  if (legacyMap.has(key)) return legacyMap.get(key)!;
  const pool = getMariaDbPool();
  const [rows] = await pool.execute<any[]>(
    `SELECT id FROM \x60${table}\x60 WHERE doc_id = ? OR uid = ? OR LOWER(email) = ? LIMIT 1`,
    [key, key, key.toLowerCase()]
  );
  return rows[0]?.id ? Number(rows[0].id) : null;
}

async function main() {
  const args = process.argv.slice(2);
  const inputArg = args.find(x => !x.startsWith('--'));
  const dryRun = args.includes('--dry-run');
  const allowExisting = args.includes('--merge');
  if (!inputArg) throw new Error('Usage: npx tsx scripts/import_mariadb_export.ts <export.json> [--dry-run] [--merge]');
  const inputPath = path.resolve(process.cwd(), inputArg);
  const parsed = JSON.parse(await fs.readFile(inputPath, 'utf8')) as ExportFile;
  if (!parsed || !parsed.collections || typeof parsed.collections !== 'object') {
    throw new Error('Fichier invalide : format attendu { metadata, collections }.');
  }

  const pool = getMariaDbPool();
  const info = await pingMariaDb();
  const [counts] = await pool.query<RowDataPacket[]>('SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM employees) AS employees');
  if (!allowExisting && (Number(counts[0]?.users || 0) > 0 || Number(counts[0]?.employees || 0) > 0)) {
    throw new Error('La base contient déjà des utilisateurs ou collaborateurs. Ajoute --merge uniquement si tu souhaites fusionner les données.');
  }

  const entries = Object.entries(parsed.collections).filter(([, rows]) => Array.isArray(rows));
  const total = entries.reduce((sum, [, rows]) => sum + rows.length, 0);
  console.log(`MariaDB cible : ${info.database} (${info.version})`);
  console.log(`Export : ${parsed.metadata?.exportDate || 'date inconnue'} | ${entries.length} collections | ${total} documents`);
  if (dryRun) {
    for (const [name, rows] of entries) console.log(`[DRY RUN] ${name}: ${rows.length}`);
    return;
  }

  const [roles] = await pool.query<RowDataPacket[]>('SELECT id, code FROM roles');
  const roleIds = Object.fromEntries(roles.map(row => [String(row.code), Number(row.id)]));
  const priority = ['roles','departments','users','employees','task_projects','presences','tasks','reminders','notifications','inventory'];
  entries.sort(([a], [b]) => {
    const ai = priority.indexOf(a), bi = priority.indexOf(b);
    return (ai < 0 ? 100 : ai) - (bi < 0 ? 100 : bi);
  });

  const imported: Record<string, number> = {};
  const legacyIds: Record<string, Map<string, number>> = {};
  for (const [collection, rows] of entries) {
    let count = 0;
    for (const original of rows) {
      if (!original || typeof original !== 'object') continue;
      const row = collection === 'users'
        ? normalizeUser(original, roleIds)
        : collection === 'employees'
          ? normalizeEmployee(original, roleIds)
          : { ...original };
      const legacyId = String(row.legacyId || row._dbId || row.id || row.docId || row.doc_id || '').trim();
      const stableDocId = String(row.docId || row.doc_id || (legacyId && /^\\d+$/.test(legacyId) ? collection + '-' + legacyId : legacyId) ||
        ('import-' + collection + '-' + createHash('sha256').update(JSON.stringify(row)).digest('hex').slice(0,24)));
      row.legacyId = legacyId || null;
      row.id = stableDocId;
      row.docId = stableDocId;

      const employeeMap = legacyIds.employees || new Map<string, number>();
      const userMap = legacyIds.users || new Map<string, number>();
      const projectMap = legacyIds.task_projects || new Map<string, number>();
      const presenceMap = legacyIds.presences || new Map<string, number>();
      const taskMap = legacyIds.tasks || new Map<string, number>();
      const reminderMap = legacyIds.reminders || new Map<string, number>();
      const notificationMap = legacyIds.notifications || new Map<string, number>();
      const inventoryMap = legacyIds.inventory || new Map<string, number>();

      if (collection === 'employees') row.userId = null;
      if (collection !== 'employees' && collection !== 'users') {
        if (row.employeeId !== undefined || row.employee_id !== undefined) {
          const value = row.employeeId ?? row.employee_id;
          row.employeeId = await resolveLegacyReference('employees', value, employeeMap);
          row.employee_id = row.employeeId;
        }
        if (row.userId !== undefined || row.user_id !== undefined) {
          const value = row.userId ?? row.user_id;
          row.userId = await resolveLegacyReference('users', value, userMap);
        }
        if (row.projectId !== undefined || row.project_id !== undefined) {
          const value = row.projectId ?? row.project_id;
          row.projectId = await resolveLegacyReference('task_projects', value, projectMap);
        }
        if (row.presenceId !== undefined || row.presence_id !== undefined) {
          const value = row.presenceId ?? row.presence_id;
          row.presenceId = await resolveLegacyReference('presences', value, presenceMap);
        }
        if (row.taskId !== undefined || row.task_id !== undefined) {
          const value = row.taskId ?? row.task_id;
          row.taskId = await resolveLegacyReference('tasks', value, taskMap);
        }
        if (row.reminderId !== undefined || row.reminder_id !== undefined) {
          const value = row.reminderId ?? row.reminder_id;
          row.reminderId = await resolveLegacyReference('reminders', value, reminderMap);
        }
        if (row.notificationId !== undefined || row.notification_id !== undefined) {
          const value = row.notificationId ?? row.notification_id;
          row.notificationId = await resolveLegacyReference('notifications', value, notificationMap);
        }
        if (row.inventoryId !== undefined || row.inventory_id !== undefined) {
          const value = row.inventoryId ?? row.inventory_id;
          row.inventoryId = await resolveLegacyReference('inventory', value, inventoryMap);
        }
        if (row.targetUserId !== undefined || row.target_user_id !== undefined) {
          const value = row.targetUserId ?? row.target_user_id;
          row.targetUserId = await resolveLegacyReference('users', value, userMap);
        }
      }

      await saveMariaDbDocument(collection, row);
      const table = mapCollectionToMariaDbTable(collection);
      if (table !== 'generic_collections') {
        const [savedRows] = await pool.execute<any[]>(
          `SELECT id FROM \x60${table}\x60 WHERE doc_id = ? LIMIT 1`, [stableDocId]
        );
        if (savedRows[0] && legacyId) {
          legacyIds[collection] ||= new Map<string, number>();
          legacyIds[collection].set(legacyId, Number(savedRows[0].id));
        }
      }
      count++;
    }
    imported[collection] = count;
    console.log(`[OK] ${collection}: ${count} document(s)`);
  }

  const [link] = await pool.execute(
    `UPDATE employees e
     INNER JOIN users u ON LOWER(u.email) = LOWER(e.email)
     SET e.user_id = u.id, e.role_id = COALESCE(e.role_id, u.role_id)`
  );
  console.log(`Liaisons utilisateurs/collaborateurs par email : ${(link as any).affectedRows || 0}`);
  console.log('Import terminé. Aucune ligne n’a été supprimée.');
  console.log(JSON.stringify(imported, null, 2));
}

main()
  .catch(error => { console.error('[Import MariaDB]', error?.message || error); process.exitCode = 1; })
  .finally(async () => { await closeMariaDbPool().catch(() => {}); });
