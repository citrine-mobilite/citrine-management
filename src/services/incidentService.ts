import { AttendanceIncident, IncidentType } from '../types';
import { COLLECTIONS, saveDocument, subscribeToCollection, deleteDocument } from './firestoreService';

const LOCAL_STORAGE_KEY = 'citrine_attendance_incidents';

export class IncidentService {
  /**
   * Save or update an incident in Firestore and LocalStorage
   */
  public async saveIncident(incident: AttendanceIncident): Promise<void> {
    try {
      await saveDocument(COLLECTIONS.ATTENDANCE_INCIDENTS, incident);
    } catch (err) {
      console.warn('Could not save incident to Firestore directly, caching locally:', err);
    }

    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      let list: AttendanceIncident[] = saved ? JSON.parse(saved) : [];
      const idx = list.findIndex((i) => i.id === incident.id);
      if (idx >= 0) {
        list[idx] = incident;
      } else {
        list = [incident, ...list];
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('LocalStorage error saving incident:', e);
    }
  }

  /**
   * Check if the employee has declared an incident in advance for today
   */
  public async hasDeclaredIncidentToday(
    employeeId: string,
    date: string,
    type: IncidentType
  ): Promise<AttendanceIncident | null> {
    const list = this.getIncidentsSync();
    const found = list.find(
      (inc) =>
        inc.employeeId === employeeId &&
        inc.date === date &&
        inc.type === type &&
        (inc.isDeclaredInAdvance || inc.status === 'signale' || inc.status === 'justifie')
    );
    return found || null;
  }

  /**
   * Get all incidents synchronously from local cache
   */
  public getIncidentsSync(): AttendanceIncident[] {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  /**
   * Subscribe to real-time changes
   */
  public subscribeToIncidents(callback: (incidents: AttendanceIncident[]) => void) {
    return subscribeToCollection<AttendanceIncident>(COLLECTIONS.ATTENDANCE_INCIDENTS, (data) => {
      if (data && data.length > 0) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        callback(data);
      } else {
        // Fallback to local
        const local = this.getIncidentsSync();
        callback(local);
      }
    });
  }

  /**
   * Delete an incident
   */
  public async deleteIncident(incidentId: string): Promise<void> {
    try {
      await deleteDocument(COLLECTIONS.ATTENDANCE_INCIDENTS, incidentId);
    } catch (err) {
      console.warn('Error deleting incident from Firestore:', err);
    }

    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const list: AttendanceIncident[] = JSON.parse(saved);
        const filtered = list.filter((i) => i.id !== incidentId);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
      }
    } catch (e) {
      console.warn('Error deleting incident from local storage:', e);
    }
  }
}

export const incidentService = new IncidentService();
