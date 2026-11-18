import { ConnectionLog } from '../types';
import { mariaDbService } from './mariaDbService';

export const CONNECTION_LOGS_COLLECTION = 'connection_logs';

export async function recordConnectionLog(data: {
  userId: string; userName: string; userEmail: string;
  authMethod: 'google' | 'password'; status: 'success' | 'failed';
  ipAddress?: string; location?: string; details?: string;
}): Promise<ConnectionLog> {
  const log: ConnectionLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
    userId: data.userId, userName: data.userName, userEmail: data.userEmail.toLowerCase(),
    timestamp: new Date().toISOString(), ipAddress: data.ipAddress || 'IP Locale',
    location: data.location || 'Douala, Cameroun', authMethod: data.authMethod,
    status: data.status, userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Navigateur Web',
    details: data.details || (data.status === 'success' ? 'Connexion authentifiée avec succès' : 'Échec de la tentative de connexion'),
  };
  try { await mariaDbService.saveDocument(CONNECTION_LOGS_COLLECTION, log as any); }
  catch (error) { console.warn('[connectionLogService MariaDB]', error); }
  return log;
}

export function subscribeToConnectionLogs(callback: (logs: ConnectionLog[]) => void) {
  return mariaDbService.subscribeToCollection<any>(CONNECTION_LOGS_COLLECTION, rows => {
    callback(rows.slice().sort((a,b) => String(b.timestamp || '').localeCompare(String(a.timestamp || ''))).slice(0,100));
  });
}
