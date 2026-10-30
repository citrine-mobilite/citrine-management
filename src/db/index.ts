import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.SQL_HOST,
  user: process.env.SQL_ADMIN_USER,
  password: process.env.SQL_ADMIN_PASSWORD,
  database: process.env.SQL_DB_NAME,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });
export default db;
