import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  onSnapshot,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ConnectionLog } from '../types';

export const CONNECTION_LOGS_COLLECTION = 'connection_logs';

const LOCAL_STORAGE_KEY = 'processflow_connection_logs';

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

// Record a real connection log
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
    ipAddress: data.ipAddress || 'IP Inconnue',
    location: data.location || 'Non spécifiée',
    authMethod: data.authMethod,
    status: data.status,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Navigateur Web',
    details: data.details || (data.status === 'success' ? 'Connexion authentifiée avec succès' : 'Échec de la tentative de connexion')
  };

  // Save to LocalStorage
  const local = getLocalLogs();
  const updatedLocal = [newLog, ...local];
  saveLocalLogs(updatedLocal);

  // Save to Firestore
  try {
    const docRef = doc(db, CONNECTION_LOGS_COLLECTION, newLog.id);
    await setDoc(docRef, newLog);
  } catch (err) {
    console.warn('Firestore connection_logs write offline, saved locally:', err);
  }

  return newLog;
}

// Subscribe to real-time connection logs
export function subscribeToConnectionLogs(callback: (logs: ConnectionLog[]) => void) {
  try {
    const q = query(
      collection(db, CONNECTION_LOGS_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const list: ConnectionLog[] = [];
        snapshot.forEach((d) => list.push(d.data() as ConnectionLog));
        if (list.length > 0) {
          saveLocalLogs(list);
          callback(list);
        } else {
          callback(getLocalLogs());
        }
      },
      (err) => {
        console.warn('Firestore subscription error for connection logs, falling back to local:', err);
        callback(getLocalLogs());
      }
    );
  } catch (err) {
    console.warn('Error setting up connection logs snapshot, using local:', err);
    callback(getLocalLogs());
    return () => {};
  }
}
