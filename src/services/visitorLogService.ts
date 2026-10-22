import { VisitorLog } from '../types';
import { 
  COLLECTIONS, 
  subscribeToCollection, 
  saveDocument, 
  deleteDocument, 
  getCollection 
} from './dataService';

export function subscribeToVisitorLogs(callback: (logs: VisitorLog[]) => void) {
  return subscribeToCollection<VisitorLog>(COLLECTIONS.VISITOR_LOGS, (data) => {
    const rawList = data || [];
    const uniqueMap = new Map<string, VisitorLog>();
    for (const item of rawList) {
      const key = item.id || item.docId || `${item.visitorName}-${item.checkInDate}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    }
    callback(Array.from(uniqueMap.values()));
  });
}

export async function saveVisitorLog(log: VisitorLog): Promise<void> {
  await saveDocument(COLLECTIONS.VISITOR_LOGS, log);
}

export async function deleteVisitorLog(logId: string): Promise<void> {
  await deleteDocument(COLLECTIONS.VISITOR_LOGS, logId);
}
