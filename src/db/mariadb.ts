import mysql, { type Pool, type PoolConnection, type RowDataPacket, type ResultSetHeader } from 'mysql2/promise';

let pool: Pool | null = null;

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Configuration MariaDB manquante : ${name}`);
  return value;
}

export function getMariaDbPool(): Pool {
  if (pool) return pool;
  pool = mysql.createPool({
    host: requiredEnv('SQL_HOST'),
    port: Number(process.env.SQL_PORT || 3306),
    user: requiredEnv('SQL_ADMIN_USER'),
    password: requiredEnv('SQL_ADMIN_PASSWORD'),
    database: requiredEnv('SQL_DB_NAME'),
    waitForConnections: true,
    connectionLimit: Number(process.env.SQL_CONNECTION_LIMIT || 5),
    queueLimit: 0,
    charset: 'utf8mb4',
    timezone: 'Z',
    decimalNumbers: true,
    supportBigNumbers: true,
    bigNumberStrings: false,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });
  pool.on('connection', connection => {
    connection.query("SET time_zone = '+00:00'", error => {
      if (error) console.error('[MariaDB] Impossible de fixer le fuseau UTC de la connexion :', error);
    });
  });
  return pool;
}

export async function pingMariaDb(): Promise<{ version: string; database: string }> {
  const [rows] = await getMariaDbPool().query<RowDataPacket[]>(
    'SELECT VERSION() AS version, DATABASE() AS database_name'
  );
  const row = rows[0];
  if (!row?.version || !row?.database_name) throw new Error('Base MariaDB active introuvable.');
  return { version: String(row.version), database: String(row.database_name) };
}

export async function withMariaDbTransaction<T>(
  work: (connection: PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await getMariaDbPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    try { await connection.rollback(); }
    catch (rollbackError) { console.error('[MariaDB] Échec du rollback :', rollbackError); }
    throw error;
  } finally {
    connection.release();
  }
}

export async function closeMariaDbPool(): Promise<void> {
  if (!pool) return;
  const current = pool;
  pool = null;
  await current.end();
}

export type MariaDbRow = RowDataPacket;
export type MariaDbResult = ResultSetHeader;
