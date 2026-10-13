import { ConnectionLog } from '../types';
import { supabase, supabaseAdmin } from '../lib/supabase';

export const CONNECTION_LOGS_COLLECTION = 'connection_logs';
const LOCAL_STORAGE_KEY = 'citrine_connection_logs';

// Get fallback local connection logs
function getLocalLogs(): ConnectionLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse local connection logs:', e);
  }
  return [];
}

// Save fallback local connection logs
function saveLocalLogs(logs: ConnectionLog[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(logs.slice(0, 100)));
  } catch (e) {
    console.warn('Failed to save local connection logs:', e);
  }
}

// Record a connection log with instant local save and Supabase sync
export async function recordConnectionLog(data: {
  userId: string;
  userName: string;
  userEmail: string;
  authMethod: 'google' | 'password';
  status: 'success' | 'failed';
  ipAddress?: string;
  location?: string;
  details?: string;
}): Promise<ConnectionLog> {
  const newLog: ConnectionLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId: data.userId,
    userName: data.userName,
    userEmail: data.userEmail.toLowerCase(),
    timestamp: new Date().toISOString(),
    ipAddress: data.ipAddress || 'IP Locale',
    location: data.location || 'Douala, Cameroun',
    authMethod: data.authMethod,
    status: data.status,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Navigateur Web',
    details: data.details || (data.status === 'success' ? 'Connexion authentifiée avec succès' : 'Échec de la tentative de connexion')
  };

  // 1. Sauvegarde locale immédiate (< 1ms)
  const local = getLocalLogs();
  const updatedLocal = [newLog, ...local];
  saveLocalLogs(updatedLocal);

  // 2. Synchronisation non-bloquante avec Supabase
  Promise.race([
    supabaseAdmin.from('connection_logs').insert({
      user_name: newLog.userName,
      user_email: newLog.userEmail,
      timestamp: newLog.timestamp,
      ip_address: newLog.ipAddress,
      location: newLog.location,
      auth_method: newLog.authMethod,
      status: newLog.status,
      details: newLog.details,
      raw_data: newLog
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
  ]).catch(() => {});

  return newLog;
}

// Subscribe to real-time connection logs via Supabase Realtime & Local storage
export function subscribeToConnectionLogs(callback: (logs: ConnectionLog[]) => void) {
  // 1. Livrer les logs locaux immédiatement
  callback(getLocalLogs());

  // 2. Écouter via Supabase Realtime
  const channelName = `realtime_conn_logs_${Date.now()}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'connection_logs' },
      () => {
        callback(getLocalLogs());
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
