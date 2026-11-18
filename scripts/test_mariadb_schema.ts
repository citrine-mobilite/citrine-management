import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { verifyAndMaybeUpgrade } from '../src/server/expressAuthRoutes';
import { saveMariaDbDocument, getMariaDbCollection, deleteMariaDbDocument } from '../src/db/mariaDbCollections';
import { closeMariaDbPool, withMariaDbTransaction } from '../src/db/mariadb';
import { verifyDoorQrTokenOnServer } from '../src/db/repository/clockingTransactionHelpers';
import { executeAtomicClockingTransaction } from '../src/db/repository/clockingTransaction';

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
    for (const file of ['001_schema.sql','002_auth_sessions.sql','003_seed_reference_data.sql','004_call_signals.sql','005_presence_employee_date_index.sql','006_relation_raw_data.sql']) {
      const sql = await fs.readFile(path.resolve('database/mariadb', file), 'utf8');
      await connection.query(sql);
      console.log('[OK] Migration ' + file);
    }
    const [tables] = await connection.query<any[]>('SELECT COUNT(*) AS total FROM information_schema.tables WHERE table_schema = DATABASE()');
    if (Number(tables[0]?.total) < 42) throw new Error('Schéma incomplet : au moins 42 tables attendues.');
    const [presenceIndexes] = await connection.query<any[]>("SELECT index_name FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'presences' AND index_name = 'idx_presences_employee_date'");
    if (!presenceIndexes.length) throw new Error('Index de verrouillage des pointages par collaborateur/jour manquant.');
    const [relationRawData] = await connection.query<any[]>(
      "SELECT COUNT(*) AS total FROM information_schema.columns WHERE table_schema = DATABASE() AND column_name = 'raw_data' AND table_name IN ('task_project_members','task_assignees','reminder_recipients','notification_recipients','presence_pauses','inventory_assignments')"
    );
    if (Number(relationRawData[0]?.total) !== 6) throw new Error('Les tables relationnelles doivent toutes conserver raw_data.');
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
    const savedUserResponse = await saveMariaDbDocument('users', {
      id: userId, uid: suffix, email, name: 'CI MariaDB User',
      roleId: Number(roleRows[0].id), status: 'actif', passwordHash: 'not-a-real-password-hash',
      smtpPass: 'must-not-persist', accessToken: 'must-not-persist',
    });
    if (savedUserResponse.passwordHash || savedUserResponse.smtpPass || savedUserResponse.accessToken) {
      throw new Error('Une écriture utilisateur ne doit jamais renvoyer de hash ni de secret.');
    }
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

    const credentialContext = {
      employeeId: 910003,
      employeeName: 'CI Collaborateur',
      latitude: 4.016246,
      longitude: 9.8203514,
      action: 'arrival',
    };
    const employeeActor = { id: 'ci-employee', role: 'employé' };

    const dynamicSessionId = 'ci-dynamic-' + suffix;
    const dynamicToken = 'CITRINE-DYN-30S-' + suffix.toUpperCase();
    await saveMariaDbDocument('dynamic_qr_sessions', {
      id: dynamicSessionId,
      sessionId: dynamicSessionId,
      token: dynamicToken,
      generatedBy: 'CI Responsable',
      status: 'active',
      expiresAt: new Date(Date.now() + 60000).toISOString(),
    });
    await withMariaDbTransaction(connection =>
      verifyDoorQrTokenOnServer('qr_code_dynamic', dynamicToken, credentialContext, employeeActor, connection)
    );
    let dynamicReuseRejected = false;
    try {
      await withMariaDbTransaction(connection =>
        verifyDoorQrTokenOnServer('qr_code_dynamic', dynamicToken, credentialContext, employeeActor, connection)
      );
    } catch { dynamicReuseRejected = true; }
    if (!dynamicReuseRejected) throw new Error('Un QR dynamique déjà consommé doit être rejeté.');
    await deleteMariaDbDocument('dynamic_qr_sessions', dynamicSessionId);

    const badgeCode = suffix.replace(/-/g, '').slice(0, 16).toUpperCase();
    const badgeId = 'ci-badge-' + suffix;
    await saveMariaDbDocument('badge_codes_16', {
      id: badgeId,
      code: badgeCode,
      employeeId: null,
      expiresAt: new Date(Date.now() + 60000).toISOString(),
      isUsed: false,
    });
    await withMariaDbTransaction(connection =>
      verifyDoorQrTokenOnServer('badge_code_16', badgeCode, credentialContext, employeeActor, connection)
    );
    let badgeReuseRejected = false;
    try {
      await withMariaDbTransaction(connection =>
        verifyDoorQrTokenOnServer('badge_code_16', badgeCode, credentialContext, employeeActor, connection)
      );
    } catch { badgeReuseRejected = true; }
    if (!badgeReuseRejected) throw new Error('Un code temporaire de 16 caractères déjà utilisé doit être rejeté.');
    await deleteMariaDbDocument('badge_codes_16', badgeId);

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
    const legacyPresenceId = '910011';
    const legacyPauseId = '910012';
    const legacyJobOfferId = '910008';
    const legacyJobApplicationId = '910009';
    const legacyNotificationId = '910010';
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
        presences: [
          { id: legacyPresenceId, uid: randomUUID(), employeeId: legacyEmployeeId, date: '2025-01-15', arrivalTime: '08:02', status: 'present' },
        ],
        presence_pauses: [
          { id: legacyPauseId, uid: randomUUID(), presenceId: legacyPresenceId, startTime: '12:00', endTime: '12:30', durationMinutes: 30 },
        ],
        notifications: [
          { id: legacyNotificationId, uid: randomUUID(), title: 'CI notification', message: 'Imported notification', targetUserId: legacyUserId, targetUserIds: [legacyReceiverId], targetEmployeeIds: [legacyEmployeeId] },
        ],
        job_offers: [
          { id: legacyJobOfferId, uid: randomUUID(), title: 'CI job offer', description: 'Test offer', status: 'ouverte' },
        ],
        job_applications: [
          { id: legacyJobApplicationId, uid: randomUUID(), jobOfferId: legacyJobOfferId, candidateName: 'CI Candidate', candidateEmail: 'candidate@example.invalid' },
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

    const [importedPresenceRows] = await connection.execute<any[]>(
      'SELECT id, employee_id, date FROM presences WHERE doc_id = ?',
      ['presences-' + legacyPresenceId]
    );
    if (String(importedPresenceRows[0]?.date).slice(0, 10) !== '2025-01-15' ||
        Number(importedPresenceRows[0]?.employee_id) !== Number(importedEmployeeRows[0]?.id)) {
      throw new Error('La date historique du pointage ou sa relation collaborateur a été altérée.');
    }
    const [importedPauseRows] = await connection.execute<any[]>(
      'SELECT presence_id FROM presence_pauses WHERE doc_id = ?',
      ['presence_pauses-' + legacyPauseId]
    );
    if (Number(importedPauseRows[0]?.presence_id) !== Number(importedPresenceRows[0]?.id)) {
      throw new Error('La relation presence_pauses.presence_id n’a pas été remappée.');
    }
    const [importedJobRows] = await connection.execute<any[]>(
      'SELECT job_offer_id FROM job_applications WHERE doc_id = ?',
      ['job_applications-' + legacyJobApplicationId]
    );
    const [importedOfferRows] = await connection.execute<any[]>(
      'SELECT id FROM job_offers WHERE doc_id = ?',
      ['job_offers-' + legacyJobOfferId]
    );
    if (Number(importedJobRows[0]?.job_offer_id) !== Number(importedOfferRows[0]?.id)) {
      throw new Error('La relation job_applications.job_offer_id n’a pas été remappée.');
    }
    const [importedNotificationRows] = await connection.execute<any[]>(
      'SELECT target_user_id, target_user_ids, target_employee_ids FROM notifications WHERE doc_id = ?',
      ['notifications-' + legacyNotificationId]
    );
    const targetUsers = typeof importedNotificationRows[0]?.target_user_ids === 'string'
      ? JSON.parse(importedNotificationRows[0].target_user_ids) : importedNotificationRows[0]?.target_user_ids;
    const targetEmployees = typeof importedNotificationRows[0]?.target_employee_ids === 'string'
      ? JSON.parse(importedNotificationRows[0].target_employee_ids) : importedNotificationRows[0]?.target_employee_ids;
    if (Number(importedNotificationRows[0]?.target_user_id) !== Number(importedUser.id) ||
        !targetUsers?.includes(Number(importedReceiver.id)) ||
        !targetEmployees?.includes(Number(importedEmployeeRows[0]?.id))) {
      throw new Error('Les destinataires multiples de la notification n’ont pas été remappés.');
    }

    const clockSessionId1 = 'ci-clock-dynamic-1-' + importSuffix;
    const clockToken1 = 'CITRINE-DYN-30S-CI-CLOCK-1-' + importSuffix.toUpperCase();
    await saveMariaDbDocument('dynamic_qr_sessions', {
      id: clockSessionId1, sessionId: clockSessionId1, token: clockToken1,
      generatedBy: 'CI Responsable', status: 'active',
      expiresAt: new Date(Date.now() + 60000).toISOString(),
    });
    await executeAtomicClockingTransaction({
      action: 'arrival',
      presence: {
        id: 'client-forged-presence-id',
        employeeId: String(importedEmployeeRows[0].id),
        date: '2000-01-01',
        arrivalTime: '00:01',
        clockingMethod: 'qr_code_dynamic',
        qrCodeToken: clockToken1,
        latitude: 4.016246,
        longitude: 9.8203514,
        location: 'CI HQ',
      },
      actor: { id: String(importedUser.id), role: 'employé' },
    });
    const doualaParts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Douala', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date());
    const expectedDoualaDate = `${doualaParts.find(p => p.type === 'year')?.value}-${doualaParts.find(p => p.type === 'month')?.value}-${doualaParts.find(p => p.type === 'day')?.value}`;
    const [clockedRows] = await connection.execute<any[]>(
      'SELECT id, doc_id, date, arrival_time, raw_data FROM presences WHERE employee_id = ? AND date = ?',
      [importedEmployeeRows[0].id, expectedDoualaDate]
    );
    if (!clockedRows[0] || String(clockedRows[0].arrival_time) === '00:01' ||
        String(clockedRows[0].doc_id) === 'client-forged-presence-id') {
      throw new Error('Le pointage doit utiliser la date et l’heure du serveur, pas les valeurs du navigateur.');
    }
    const clockSessionId2 = 'ci-clock-dynamic-2-' + importSuffix;
    const clockToken2 = 'CITRINE-DYN-30S-CI-CLOCK-2-' + importSuffix.toUpperCase();
    await saveMariaDbDocument('dynamic_qr_sessions', {
      id: clockSessionId2, sessionId: clockSessionId2, token: clockToken2,
      generatedBy: 'CI Responsable', status: 'active',
      expiresAt: new Date(Date.now() + 60000).toISOString(),
    });
    await executeAtomicClockingTransaction({
      action: 'pauseStart',
      presence: {
        id: 'another-forged-id',
        employeeId: String(importedEmployeeRows[0].id),
        date: '2000-01-01',
        arrivalTime: '00:01',
        pauseStart: '00:02',
        clockingMethod: 'qr_code_dynamic',
        qrCodeToken: clockToken2,
        latitude: 4.016246,
        longitude: 9.8203514,
        location: 'CI HQ',
      },
      actor: { id: String(importedUser.id), role: 'employé' },
    });
    const [updatedClockRows] = await connection.execute<any[]>(
      'SELECT doc_id, date, arrival_time, raw_data FROM presences WHERE employee_id = ? AND date = ?',
      [importedEmployeeRows[0].id, expectedDoualaDate]
    );
    const clockRaw = typeof updatedClockRows[0]?.raw_data === 'string'
      ? JSON.parse(updatedClockRows[0].raw_data) : updatedClockRows[0]?.raw_data;
    if (String(updatedClockRows[0]?.arrival_time) === '00:01' ||
        String(clockRaw?.pauseStart || '') === '00:02' ||
        String(updatedClockRows[0]?.date).slice(0, 10) !== expectedDoualaDate) {
      throw new Error('Une action de pointage ne doit pas écraser les anciennes heures ni accepter les heures client.');
    }
    await connection.execute('DELETE FROM presences WHERE employee_id = ? AND date = ?', [importedEmployeeRows[0].id, expectedDoualaDate]);
    await deleteMariaDbDocument('dynamic_qr_sessions', clockSessionId1);
    await deleteMariaDbDocument('dynamic_qr_sessions', clockSessionId2);
    const importedGeneric = await getMariaDbCollection('ci_import_collection');
    if (!importedGeneric.some(row => row.id === 'ci_import_collection-' + legacyGenericId && row.label === 'CI imported generic record')) {
      throw new Error('Import de generic_collections incomplet.');
    }
    await connection.execute('DELETE FROM calls WHERE doc_id = ?', ['calls-' + legacyCallId]);
    await connection.execute('DELETE FROM job_applications WHERE doc_id = ?', ['job_applications-' + legacyJobApplicationId]);
    await connection.execute('DELETE FROM job_offers WHERE doc_id = ?', ['job_offers-' + legacyJobOfferId]);
    await connection.execute('DELETE FROM notifications WHERE doc_id = ?', ['notifications-' + legacyNotificationId]);
    await connection.execute('DELETE FROM presence_pauses WHERE doc_id = ?', ['presence_pauses-' + legacyPauseId]);
    await connection.execute('DELETE FROM presences WHERE doc_id = ?', ['presences-' + legacyPresenceId]);
    await connection.execute('DELETE FROM tasks WHERE doc_id = ?', ['tasks-' + legacyTaskId]);
    await connection.execute('DELETE FROM employees WHERE email = ?', [importEmployeeEmail]);
    await connection.execute('DELETE FROM users WHERE email IN (?, ?)', [importUserEmail, importReceiverEmail]);
    await connection.execute('DELETE FROM generic_collections WHERE collection = ? AND doc_id = ?', ['ci_import_collection', 'ci_import_collection-' + legacyGenericId]);

    const [requiredTables] = await connection.query<any[]>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN ('auth_sessions','call_signals','generic_collections')"
    );
    if (requiredTables.length !== 3) throw new Error('Tables de session, signalisation ou collections génériques manquantes.');

    console.log('[OK] MariaDB CRUD users et generic_collections');
    console.log('[OK] QR dynamique et codes 16 caractères à usage unique');
    console.log('[OK] Horodatage serveur Douala et conservation des pointages antérieurs');
    console.log('[OK] Masquage passwordHash');
    console.log('[OK] Compatibilité bcrypt Supabase → PBKDF2 et collection absences');
    console.log('[OK] Import Supabase : utilisateurs, dates historiques, pointages, pauses, notifications multi-destinataires, candidatures, appels et collections génériques');
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
