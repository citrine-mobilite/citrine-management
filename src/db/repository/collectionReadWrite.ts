import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import { getMariaDbPool } from '../mariadb';
import { getMariaDbCollection, deleteMariaDbDocument } from '../mariaDbCollections';

export async function getCollectionData(collectionName: string): Promise<any[]> {
  return getMariaDbCollection(collectionName);
}

export async function deleteDocumentData(collectionName: string, id: string): Promise<boolean> {
  return deleteMariaDbDocument(collectionName, id);
}

export async function getOrCreateUserRecord(uid: string, email: string, name?: string, role?: string) {
  const pool = getMariaDbPool();
  const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM users WHERE uid = ? OR LOWER(email) = ? LIMIT 1', [uid, email.trim().toLowerCase()]);
  if (rows[0]) return rows[0];
  const roleId = role?.toLowerCase().includes('admin') ? 1 : role?.toLowerCase().includes('responsable') ? 2 : 3;
  const docId = uid || randomUUID();
  await pool.execute(
    'INSERT INTO users (uid, doc_id, email, name, role_id, status, raw_data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, NOW(3), NOW(3))',
    [uid || randomUUID(), docId, email.trim().toLowerCase(), name || null, roleId, JSON.stringify({ uid, email, name, role })]
  );
  const [created] = await pool.execute<RowDataPacket[]>('SELECT * FROM users WHERE doc_id = ? LIMIT 1', [docId]);
  return created[0] || null;
}
