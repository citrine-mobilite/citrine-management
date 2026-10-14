import { ConnectionLog } from '../types';
import { supabase, supabaseAdmin } from '../lib/supabase';

export const CONNECTION_LOGS_COLLECTION = 'connection_logs';

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

  try {
    await Promise.resolve(
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
      })
    );
  } catch (err) {
    console.warn('[connectionLogService] DB insert error:', err);
  }

  return newLog;
}

export function subscribeToConnectionLogs(callback: (logs: ConnectionLog[]) => void) {
  Promise.resolve(
    supabaseAdmin.from('connection_logs').select('*').order('id', { ascending: false }).limit(100)
  ).then(({ data }: any) => {
    if (data && Array.isArray(data)) {
      const logs = data.map((d: any) => d.raw_data || d);
      callback(logs);
    } else {
      callback([]);
    }
  }).catch(() => callback([]));

  const channelName = `realtime_conn_logs_${Date.now()}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'connection_logs' },
      async () => {
        try {
          const { data }: any = await Promise.resolve(
            supabaseAdmin.from('connection_logs').select('*').order('id', { ascending: false }).limit(100)
          );
          if (data && Array.isArray(data)) {
            callback(data.map((d: any) => d.raw_data || d));
          }
        } catch {}
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
