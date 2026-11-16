import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const { Pool } = pg;

let pool: any;
let db: any;

const hasSqlConfig = Boolean(process.env.SQL_HOST || process.env.DATABASE_URL);

if (hasSqlConfig) {
  try {
    pool = new Pool(
      process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
          }
        : {
            host: process.env.SQL_HOST,
            user: process.env.SQL_ADMIN_USER,
            password: process.env.SQL_ADMIN_PASSWORD,
            database: process.env.SQL_DB_NAME,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
          }
    );
    db = drizzle(pool, { schema });
  } catch (err) {
    console.warn('[AI Studio] Database not connected — using mock:', err);
  }
}

if (!pool || !db) {
  pool = {
    query: async () => ({ rows: [] }),
    connect: async () => ({ query: async () => ({ rows: [] }), release: () => {} }),
  };
  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d: any) => d?.data ?? {},
    update: async (d: any) => d?.data ?? {},
    delete: async () => ({}),
  };
  db = new Proxy(
    {},
    {
      get: (_target, prop) =>
        prop === 'query' ? new Proxy({}, { get: () => noOp }) : async () => [],
    }
  );
}

export { pool, db };
export default db;
