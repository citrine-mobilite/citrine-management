import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { verifyAndMaybeUpgrade } from '../src/server/expressAuthRoutes';
import { saveMariaDbDocument, getMariaDbCollection, deleteMariaDbDocument } from '../src/db/mariaDbCollections';
import { closeMariaDbPool } from '../src/db/mariadb';

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.SQL_HOST || '127.0.0.1',
    port: Number(process.env.SQL_PORT || 3306),
    user: process.env.SQL_ADMIN_USER || 'root',
    password: process.env.SQL_ADMIN_PASSWORD || '',
    database: process.env.SQL_DB_NAME || 'citrine_ci',
    multipleStatements: true,
  });
  try {
    for (const file of ['001_schema.sql','002_auth_sessions.sql','003_seed_reference_data.sql','004_call_signals.sql']) {
      const sql = await fs.readFile(path.resolve('database/mariadb', file), 'utf8');
      await connection.query(sql);
      console.log('[OK] Migration ' + file);
    }
    const [tables] = await connection.query<any[]>('SELECT COUNT(*) AS total FROM information_schema.tables WHERE table_schema = DATABASE()');
    if (Number(tables[0]?.total) < 42) throw new Error('Schéma incomplet : au moins 42 tables attendues.');
    const [roles] = await connection.query<any[]>('SELECT code FROM roles ORDER BY id');
    const codes = new Set(roles.map(row => row.code));
    for (const code of ['SUPER_ADMIN','RESPONSABLE','EMPLOYE']) if (!codes.has(code)) throw new Error('Rôle de référence manquant : ' + code);

    const bcryptPassword = 'MariaDB-CI-Password-2026!';
    const bcryptHash = bcrypt.hashSync(bcryptPassword, 4);
    const upgradedPassword = verifyAndMaybeUpgrade(bcryptPassword, bcryptHash);
    if (!upgradedPassword.valid || !upgradedPassword.upgraded?.startsWith('pbkdf2:')) {
      throw new Error('Échec de compatibilité des hashes bcrypt Supabase.');
    }
    if (!verifyAndMaybeUpgrade(bcryptPassword, upgradedPassword.upgraded).valid) {
      throw new Error('Le hash PBKDF2 migré ne peut pas être vérifié.');
    }

    const suffix = randomUUID();
    const userId = 'ci-user-' + suffix;
    const email = 'ci-' + suffix + '@example.invalid';
    const [roleRows] = await connection.query<any[]>('SELECT id FROM roles WHERE code = ? LIMIT 1', ['EMPLOYE']);
    await saveMariaDbDocument('users', {
      id: userId, uid: suffix, email, name: 'CI MariaDB User',
      roleId: Number(roleRows[0].id), status: 'actif', passwordHash: 'not-a-real-password-hash',
    });
    const found = (await getMariaDbCollection('users')).find(row => row.email === email);
    if (!found || found.name !== 'CI MariaDB User' || found.passwordHash) {
      throw new Error('Échec du test CRUD users ou fuite du champ passwordHash.');
    }
    await saveMariaDbDocument('users', { ...found, name: 'CI MariaDB Updated' });
    const updated = (await getMariaDbCollection('users')).find(row => row.email === email);
    if (updated?.name !== 'CI MariaDB Updated') throw new Error('Échec du test UPDATE users.');
    await deleteMariaDbDocument('users', String(updated.id));
    const genericId = 'ci-generic-' + suffix;
    await saveMariaDbDocument('ci_custom_collection', { id: genericId, label: 'CI generic document', enabled: true });
    const genericRows = await getMariaDbCollection('ci_custom_collection');
    if (!genericRows.some(row => row.id === genericId && row.label === 'CI generic document')) {
      throw new Error('Échec du test CRUD generic_collections.');
    }
    await deleteMariaDbDocument('ci_custom_collection', genericId);

    const absenceId = 'ci-absence-' + suffix;
    await saveMariaDbDocument('absences', { id: absenceId, label: 'CI absence generic fallback' });
    const absenceRows = await getMariaDbCollection('absences');
    if (!absenceRows.some(row => row.id === absenceId && row.label === 'CI absence generic fallback')) {
      throw new Error('La collection absences doit être conservée dans generic_collections.');
    }
    await deleteMariaDbDocument('absences', absenceId);

    const importSuffix = randomUUID();
    const importUserEmail = `ci-import-${importSuffix}@example.invalid`;
    const importReceiverEmail = `ci-receiver-${importSuffix}@example.invalid`;
    const importEmployeeEmail = importUserEmail;
    const legacyUserId = '910001';
    const legacyReceiverId = '910002';
    const legacyEmployeeId = '910003';
    const legacyTaskId = '910004';
    const legacyCallId = '910005';
    const legacyGenericId = '910006';
    const fixture = {
      metadata: { exportDate: new Date().toISOString(), source: 'CI fixture' },
      collections: {
        users: [
          { id: legacyUserId, uid: randomUUID(), email: importUserEmail, name: 'CI Imported User', role: 'employé', roleId: 3, passwordHash: 'Import-Password-2026!' },
          { id: legacyReceiverId, uid: randomUUID(), email: importReceiverEmail, name: 'CI Imported Receiver', role: 'responsable', roleId: 2, passwordHash: 'Receiver-Password-2026!' },
        ],
        employees: [
          { id: legacyEmployeeId, uid: randomUUID(), email: importEmployeeEmail, name: 'CI Imported Employee', roleType: 'Employé', roleId: 3, userId: legacyUserId, status: 'en_poste' },
        ],
        tasks: [
          { id: legacyTaskId, uid: randomUUID(), title: 'CI imported task', employeeId: legacyEmployeeId, status: 'todo' },
        ],
        calls: [
          { id: legacyCallId, uid: randomUUID(), callerId: legacyUserId, receiverId: legacyReceiverId, roomId: 'ci-room-' + importSuffix, status: 'ended' },
        ],
        ci_import_collection: [
          { id: legacyGenericId, label: 'CI imported generic record' },
        ],
      },
    };
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'citrine-mariadb-import-'));
    const exportPath = path.join(tempDir, 'fixture.json');
    try {
      await fs.writeFile(exportPath, JSON.stringify(fixture), { encoding: 'utf8', mode: 0o600 });
      execFileSync('npx', ['tsx', 'scripts/import_mariadb_export.ts', exportPath, '--merge'], {
        encoding: 'utf8', stdio: 'pipe', env: process.env,
      });
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }

    const [importedUsers] = await connection.execute<any[]>(
      'SELECT id, email, raw_data FROM users WHERE email IN (?, ?)', [importUserEmail, importReceiverEmail]
    );
    if (importedUsers.length !== 2) throw new Error('Import des utilisateurs Supabase incomplet.');
    const importedUser = importedUsers.find(row => row.email === importUserEmail);
    const importedReceiver = importedUsers.find(row => row.email === importReceiverEmail);
    const importedRaw = typeof importedUser.raw_data === 'string' ? JSON.parse(importedUser.raw_data) : importedUser.raw_data;
    if (!String(importedRaw.passwordHash || '').startsWith('pbkdf2:') || importedRaw.password) {
      throw new Error('Le mot de passe importé doit être haché et aucun champ plaintext ne doit subsister.');
    }
    const [importedEmployeeRows] = await connection.execute<any[]>(
      'SELECT id, user_id FROM employees WHERE email = ?', [importEmployeeEmail]
    );
    if (Number(importedEmployeeRows[0]?.user_id) !== Number(importedUser.id)) {
      throw new Error('La relation employee.user_id n’a pas été remappée.');
    }
    const [importedTaskRows] = await connection.execute<any[]>(
      'SELECT employee_id FROM tasks WHERE doc_id = ?', ['tasks-' + legacyTaskId]
    );
    if (Number(importedTaskRows[0]?.employee_id) !== Number(importedEmployeeRows[0]?.id)) {
      throw new Error('La relation task.employee_id n’a pas été remappée.');
    }
    const [importedCallRows] = await connection.execute<any[]>(
      'SELECT caller_id, receiver_id FROM calls WHERE doc_id = ?', ['calls-' + legacyCallId]
    );
    if (String(importedCallRows[0]?.caller_id) !== String(importedUser.id) ||
        String(importedCallRows[0]?.receiver_id) !== String(importedReceiver.id)) {
      throw new Error('Les participants de l’appel n’ont pas été remappés.');
    }
    const importedGeneric = await getMariaDbCollection('ci_import_collection');
    if (!importedGeneric.some(row => row.id === 'ci_import_collection-' + legacyGenericId && row.label === 'CI imported generic record')) {
      throw new Error('Import de generic_collections incomplet.');
    }
    await connection.execute('DELETE FROM calls WHERE doc_id = ?', ['calls-' + legacyCallId]);
    await connection.execute('DELETE FROM tasks WHERE doc_id = ?', ['tasks-' + legacyTaskId]);
    await connection.execute('DELETE FROM employees WHERE email = ?', [importEmployeeEmail]);
    await connection.execute('DELETE FROM users WHERE email IN (?, ?)', [importUserEmail, importReceiverEmail]);
    await connection.execute('DELETE FROM generic_collections WHERE collection = ? AND doc_id = ?', ['ci_import_collection', 'ci_import_collection-' + legacyGenericId]);

    const [requiredTables] = await connection.query<any[]>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN ('auth_sessions','call_signals','generic_collections')"
    );
    if (requiredTables.length !== 3) throw new Error('Tables de session, signalisation ou collections génériques manquantes.');

    console.log('[OK] MariaDB CRUD users et generic_collections');
    console.log('[OK] Masquage passwordHash');
    console.log('[OK] Compatibilité bcrypt Supabase → PBKDF2 et collection absences');
    console.log('[OK] Import Supabase : utilisateurs, relations, appels et collections génériques');
    console.log('[OK] ' + Number(tables[0].total) + ' tables, rôles, auth_sessions et call_signals');
  } finally {
    await connection.end();
    await closeMariaDbPool().catch(() => {});
  }
}

main().catch(error => {
  console.error('[MariaDB schema test]', error?.message || error);
  process.exitCode = 1;
});
