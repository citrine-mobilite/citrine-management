import { AttendanceIncident, IncidentType } from '../types';
import { COLLECTIONS, saveDocument, subscribeToCollection, deleteDocument } from './dataService';

export class IncidentService {
  public async saveIncident(incident: AttendanceIncident): Promise<void> {
    await saveDocument(COLLECTIONS.ATTENDANCE_INCIDENTS, incident);
  }

  public async hasDeclaredIncidentToday(
    employeeId: string,
    date: string,
    type: IncidentType
  ): Promise<AttendanceIncident | null> {
    return null;
  }

  public getIncidentsSync(): AttendanceIncident[] {
    return [];
  }

  public subscribeToIncidents(callback: (incidents: AttendanceIncident[]) => void) {
    return subscribeToCollection<AttendanceIncident>(COLLECTIONS.ATTENDANCE_INCIDENTS, (data) => {
      callback(data || []);
    });
  }

  public async deleteIncident(incidentId: string): Promise<void> {
    await deleteDocument(COLLECTIONS.ATTENDANCE_INCIDENTS, incidentId);
  }
}

export const incidentService = new IncidentService();
