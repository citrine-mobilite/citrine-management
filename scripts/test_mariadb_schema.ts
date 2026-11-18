import fs from 'node:fs/promises';
import path from 'node:path';
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

    const [requiredTables] = await connection.query<any[]>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN ('auth_sessions','call_signals','generic_collections')"
    );
    if (requiredTables.length !== 3) throw new Error('Tables de session, signalisation ou collections génériques manquantes.');

    console.log('[OK] MariaDB CRUD users et generic_collections');
    console.log('[OK] Masquage passwordHash');
    console.log('[OK] Compatibilité bcrypt Supabase → PBKDF2 et collection absences');
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
