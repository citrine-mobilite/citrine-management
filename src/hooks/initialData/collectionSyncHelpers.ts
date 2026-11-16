import React from 'react';
import {
  Employee,
  Presence,
  NotificationLog,
  AttendanceIncident,
  AppUser,
  CompanyModuleConfig,
  DEFAULT_MODULE_CONFIG,
  LeaveRequest,
  StrategicProject,
} from '../../types';
import { saveDocument, deleteDocument, getCollection, COLLECTIONS } from '../../services/dataService';
import { persistStoredModuleConfig } from './moduleConfigStorage';
import { pushNotificationBridgeService } from '../../services/pushNotificationBridgeService';

export async function syncCollectionDiff<T extends { id: string }>(
  collectionName: string,
  currentList: T[],
  updatedList: T[]
) {
  for (const item of updatedList) {
    const existing = currentList.find((x) => x.id === item.id);
    if (!existing || JSON.stringify(existing) !== JSON.stringify(item)) {
      await saveDocument(collectionName, item);
    }
  }
  for (const item of currentList) {
    if (!updatedList.some((x) => x.id === item.id)) {
      await deleteDocument(collectionName, item.id);
    }
  }
}

export async function addAttendanceIncidentWithNotification(params: {
  incident: AttendanceIncident;
  attendanceIncidents: AttendanceIncident[];
  setAttendanceIncidents: React.Dispatch<React.SetStateAction<AttendanceIncident[]>>;
  setNotifications: React.Dispatch<React.SetStateAction<NotificationLog[]>>;
}) {
  const { incident, attendanceIncidents, setAttendanceIncidents, setNotifications } = params;
  const incidentEmpIdStr = String(incident.employeeId || '');
  const incidentReasonStr = (incident.reason || (incident as any).description || '').trim().toLowerCase();

  const existingDuplicate = attendanceIncidents.find(
    (i) =>
      i.id !== incident.id &&
      String(i.employeeId || '') === incidentEmpIdStr &&
      i.date === incident.date &&
      i.type === incident.type &&
      (i.reason || (i as any).description || '').trim().toLowerCase() === incidentReasonStr
  );

  if (existingDuplicate) return;

  await saveDocument(COLLECTIONS.ATTENDANCE_INCIDENTS, incident);
  setAttendanceIncidents([incident, ...attendanceIncidents.filter((i) => i.id !== incident.id)]);

  if ((incident.employeeId || incident.employeeName) && incident.origin !== 'automatique_pointage') {
    const typeLabels: Record<string, string> = {
      retard: 'Retard constaté',
      sortie_prematuree: 'Sortie prématurée',
      depart_anticipe: 'Départ anticipé',
      absence_injustifiee: 'Absence injustifiée',
    };
    const label = typeLabels[incident.type] || 'Signalement RH';
    const notifId = `notif-inc-${incident.id}`;
    const operationKey = `incident-declared:${incident.id}`;

    if (incident.origin === 'signale_par_employe') {
      pushNotificationBridgeService.sendPush({
        operationKey,
        actionKey: operationKey,
        title: `Déclaration RH : ${label}`,
        message: `${incident.employeeName || 'Un collaborateur'} — ${incident.reason || `Déclaration pour le ${incident.date}`}`,
        senderName: incident.employeeName || 'Collaborateur',
        type: 'incident',
        link: 'presences',
        suppressLocalNative: true,
        remoteBeams: {
          targetRoles: ['administrateur', 'responsable'],
        },
      });
    } else {
      pushNotificationBridgeService.markOperationDispatched(operationKey);
    }

    const notif: NotificationLog = {
      id: notifId,
      type: 'system',
      recipient: incident.employeeName || incident.employeeId || 'Collaborateur',
      targetUserId: incident.employeeId ? String(incident.employeeId) : undefined,
      title: `Signalement RH : ${label}`,
      content: incident.reason || `Incident enregistré pour la date du ${incident.date}.`,
      payload: JSON.stringify({
        source: 'attendance_incident',
        operationKey,
        incidentId: incident.id,
        employeeId: incident.employeeId,
        type: incident.type,
        date: incident.date,
      }),
      timestamp: incident.createdAt || new Date().toISOString(),
      read: false,
    };
    try {
      await saveDocument(COLLECTIONS.NOTIFICATIONS, notif);
      setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notifId)]);
    } catch (e) {
      console.warn('Notice saving notification for incident:', e);
    }
  }
}

export async function refreshInitialCollectionsData(setters: {
  setUsers: (v: AppUser[]) => void;
  setEmployees: (v: Employee[]) => void;
  setPresences: (v: Presence[]) => void;
  setLeaveRequests: (v: LeaveRequest[]) => void;
  setNotifications: (v: NotificationLog[]) => void;
  setAttendanceIncidents: (v: AttendanceIncident[]) => void;
  setStrategicProjects: (v: StrategicProject[]) => void;
  setModuleConfig: React.Dispatch<React.SetStateAction<CompanyModuleConfig>>;
}) {
  try {
    const [
      freshUsers, freshEmployees, freshPresences, freshLeaves,
      freshNotifs, freshIncidents, freshSettings, freshStrategicProjects,
    ] = await Promise.all([
      getCollection<AppUser>(COLLECTIONS.USERS),
      getCollection<Employee>(COLLECTIONS.EMPLOYEES),
      getCollection<Presence>(COLLECTIONS.PRESENCES),
      getCollection<LeaveRequest>(COLLECTIONS.LEAVE_REQUESTS),
      getCollection<NotificationLog>(COLLECTIONS.NOTIFICATIONS),
      getCollection<AttendanceIncident>(COLLECTIONS.ATTENDANCE_INCIDENTS),
      getCollection<CompanyModuleConfig>(COLLECTIONS.COMPANY_SETTINGS),
      getCollection<StrategicProject>(COLLECTIONS.STRATEGIC_PROJECTS),
    ]);

    if (freshUsers) setters.setUsers(freshUsers);
    if (freshEmployees) setters.setEmployees(freshEmployees);
    if (freshPresences) setters.setPresences(freshPresences);
    if (freshLeaves) {
      setters.setLeaveRequests(
        [...freshLeaves].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      );
    }
    if (freshNotifs) setters.setNotifications(freshNotifs);
    if (freshIncidents) setters.setAttendanceIncidents(freshIncidents);
    if (freshStrategicProjects) setters.setStrategicProjects(freshStrategicProjects);
    if (freshSettings && freshSettings.length > 0) {
      const dbConfig = freshSettings.find((s: any) => s.id === 'main_config' || s.docId === 'main_config') || freshSettings[0];
      if (dbConfig) {
        setters.setModuleConfig((prev) => {
          const mergedConfig: CompanyModuleConfig = {
            ...DEFAULT_MODULE_CONFIG,
            ...prev,
            ...dbConfig,
            companyLogoBase64: dbConfig.companyLogoBase64 || prev.companyLogoBase64 || '/citrine-logo.png',
          };
          persistStoredModuleConfig(mergedConfig);
          return mergedConfig;
        });
      }
    }
  } catch (e) {
    console.warn('Erreur lors du rafraîchissement global:', e);
  }
}
