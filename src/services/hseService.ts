import { HseIncident } from '../types';
import { 
  COLLECTIONS, 
  subscribeToCollection, 
  saveDocument, 
  deleteDocument 
} from './dataService';

export function subscribeToHseIncidents(callback: (incidents: HseIncident[]) => void) {
  return subscribeToCollection<HseIncident>(COLLECTIONS.HSE_INCIDENTS, (data) => {
    callback(Array.isArray(data) ? data : []);
  });
}

export async function saveHseIncident(incident: HseIncident): Promise<void> {
  await saveDocument(COLLECTIONS.HSE_INCIDENTS, incident);
}

export async function deleteHseIncident(incidentId: string): Promise<void> {
  await deleteDocument(COLLECTIONS.HSE_INCIDENTS, incidentId);
}
