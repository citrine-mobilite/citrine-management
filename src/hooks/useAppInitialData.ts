import { useState, useRef, useCallback } from 'react';
import {
  Employee, Presence, Task, Reminder, NotificationLog, SalaryPayment,
  FinancialTransaction, EmployeeSalaryDebt, GeneratedDocument, DisciplinaryIncident,
  AttendanceIncident, InventoryItem, Partner, AppUser, CompanyModuleConfig,
  LeaveRequest, StrategicProject,
} from '../types';
import { saveDocument, deleteDocument, COLLECTIONS } from '../services/dataService';
import { cloudSqlService } from '../services/cloudSqlService';
import { safeStorage } from '../utils/safeStorage';
import { pushNotificationBridgeService } from '../services/pushNotificationBridgeService';
import { MODULE_CACHE_KEY, getStoredModuleConfig, persistStoredModuleConfig } from './initialData/moduleConfigStorage';
import { syncCollectionDiff, addAttendanceIncidentWithNotification, refreshInitialCollectionsData } from './initialData/collectionSyncHelpers';
import { useInitialDataSubscriptions } from './initialData/useInitialDataSubscriptions';

export { MODULE_CACHE_KEY, getStoredModuleConfig };

export function useAppInitialData() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [presences, setPresences] = useState<Presence[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([]);
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>([]);
  const [salaryDebts, setSalaryDebts] = useState<EmployeeSalaryDebt[]>([]);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [disciplinaryIncidents, setDisciplinaryIncidents] = useState<DisciplinaryIncident[]>([]);
  const [attendanceIncidents, setAttendanceIncidents] = useState<AttendanceIncident[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [strategicProjects, setStrategicProjects] = useState<StrategicProject[]>([]);
  const [moduleConfig, setModuleConfig] = useState<CompanyModuleConfig>(() => getStoredModuleConfig());

  const appStartTimeRef = useRef(Date.now());
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());
  const isInitialNotifLoadDoneRef = useRef(false);
  const recentNotifKeysRef = useRef<Map<string, number>>(new Map());

  const handleIncomingNotifications = useCallback((newNotifs: NotificationLog[]) => {
    if (!newNotifs || newNotifs.length === 0) return;
    if (!isInitialNotifLoadDoneRef.current) {
      newNotifs.forEach((n) => seenNotificationIdsRef.current.add(n.id));
      isInitialNotifLoadDoneRef.current = true;
      setNotifications(newNotifs);
      return;
    }

    let currentUser: any = null;
    try {
      const uStr = safeStorage.getItem('citrine_current_user');
      if (uStr) currentUser = JSON.parse(uStr);
    } catch {}

    const isCurrentAdmin = !currentUser || currentUser.role === 'administrateur' || currentUser.role === 'responsable';

    for (const notif of newNotifs) {
      if (!seenNotificationIdsRef.current.has(notif.id)) {
        seenNotificationIdsRef.current.add(notif.id);
        const notifTime = new Date(notif.timestamp).getTime();
        if (notifTime > appStartTimeRef.current - 5000) {
          const isTarget =
            isCurrentAdmin ||
            (currentUser && (
              notif.recipient === currentUser.name ||
              notif.recipient === currentUser.email ||
              notif.recipient === currentUser.id ||
              notif.recipient === 'Direction & RH' ||
              notif.recipient === 'Équipe' ||
              notif.recipient === 'Tous'
            ));

          if (isTarget) {
            pushNotificationBridgeService.sendPush({
              id: notif.id,
              title: notif.title || 'Notification RH Citrine',
              message: notif.content || '',
              senderName: (notif as any).senderName || 'Portail RH',
              type: (notif.type as any) || 'alert',
              timestamp: notif.timestamp || new Date().toISOString(),
              link: notif.link,
            });
          }
        }
      }
    }
    setNotifications(newNotifs);
  }, []);

  const handleAddNotification = async (notif: any) => {
    const text = notif.content || notif.message || notif.title || 'Notification';
    const recipient = notif.recipient || 'Général';
    const title = notif.title || 'Notification';
    const dedupKey = `${recipient}:${title}:${text}`;
    const now = Date.now();

    const last = recentNotifKeysRef.current.get(dedupKey);
    if (last && now - last < 3000) return;
    recentNotifKeysRef.current.set(dedupKey, now);

    for (const [key, timestamp] of recentNotifKeysRef.current.entries()) {
      if (now - timestamp > 10000) recentNotifKeysRef.current.delete(key);
    }

    const n: NotificationLog = {
      id: notif.id || `notif-${Date.now()}`,
      type: notif.type || 'system',
      recipient,
      title,
      content: text,
      message: text,
      payload: notif.payload || '',
      timestamp: notif.timestamp || new Date().toISOString(),
    };
    await saveDocument(COLLECTIONS.NOTIFICATIONS, n);
  };

  useInitialDataSubscriptions({
    setEmployees, setPresences, setTasks, setReminders, setSalaryPayments,
    setFinancialTransactions, setSalaryDebts, setDocuments, setDisciplinaryIncidents,
    setAttendanceIncidents, setInventoryItems, setPartners, setUsers, setLeaveRequests,
    setStrategicProjects, setModuleConfig, handleIncomingNotifications,
    leaveRequests, employees, users, handleAddNotification,
  });

  const handleUpdateEmployees = async (updated: Employee[]) => {
    setEmployees(updated);
    for (const emp of updated) {
      const existing = employees.find((e) => e.id === emp.id || (e.uid && emp.uid && e.uid === emp.uid));
      if (!existing || JSON.stringify(existing) !== JSON.stringify(emp)) {
        try { await saveDocument(COLLECTIONS.EMPLOYEES, emp); } catch (e) { console.warn('Database save employee notice:', e); }
      }
    }
    for (const emp of employees) {
      if (!updated.some((e) => e.id === emp.id || (e.uid && emp.uid && e.uid === emp.uid))) {
        const idToDelete = emp.id || emp.uid;
        if (idToDelete) {
          try { await deleteDocument(COLLECTIONS.EMPLOYEES, String(idToDelete)); } catch (e) { console.warn('Supabase delete employee notice:', e); }
          try { await cloudSqlService.deleteDocument(COLLECTIONS.EMPLOYEES, String(idToDelete)); } catch (e) { console.warn('Cloud SQL delete employee notice:', e); }
        }
      }
    }
    setEmployees(updated);
  };

  const handleUpdateTasks = async (updated: Task[]) => {
    setTasks(updated);
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bcast = new BroadcastChannel('citrine_cross_tab_sync');
        bcast.postMessage({ type: 'SYNC_TASKS', tasks: updated });
        bcast.close();
      }
    } catch {}
    await syncCollectionDiff(COLLECTIONS.TASKS, tasks, updated);
  };

  const handleUpdateStrategicProjects = async (updated: StrategicProject[]) => {
    setStrategicProjects(updated);
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bcast = new BroadcastChannel('citrine_cross_tab_sync');
        bcast.postMessage({ type: 'SYNC_STRATEGIC_PROJECTS', strategicProjects: updated });
        bcast.close();
      }
    } catch {}
    await syncCollectionDiff(COLLECTIONS.STRATEGIC_PROJECTS, strategicProjects, updated);
  };

  const makeUpdater = <T extends { id: string }>(col: string, cur: T[], set: (v: T[]) => void) => async (updated: T[]) => {
    await syncCollectionDiff(col, cur, updated);
    set(updated);
  };

  const handleAddAttendanceIncident = (incident: AttendanceIncident) =>
    addAttendanceIncidentWithNotification({ incident, attendanceIncidents, setAttendanceIncidents, setNotifications });

  const handleUpdateModuleConfig = (newConfig: CompanyModuleConfig) => {
    const fullConfig: CompanyModuleConfig = { ...moduleConfig, ...newConfig };
    setModuleConfig(fullConfig);
    persistStoredModuleConfig(fullConfig);
    saveDocument(COLLECTIONS.COMPANY_SETTINGS, { ...fullConfig, id: 'main_config' }).catch((err) => {
      console.warn('Erreur persistance BD company_settings:', err);
    });
  };

  const refreshAll = () =>
    refreshInitialCollectionsData({
      setUsers, setEmployees, setPresences, setLeaveRequests,
      setNotifications, setAttendanceIncidents, setStrategicProjects, setModuleConfig,
    });

  return {
    employees, presences, tasks, reminders, notifications, salaryPayments, financialTransactions,
    salaryDebts, documents, disciplinaryIncidents, attendanceIncidents, inventoryItems, partners,
    users, leaveRequests, strategicProjects, moduleConfig, refreshAll,
    setTasks: handleUpdateTasks,
    setReminders: makeUpdater(COLLECTIONS.REMINDERS, reminders, setReminders),
    setNotifications: makeUpdater(COLLECTIONS.NOTIFICATIONS, notifications, setNotifications),
    setLeaveRequests: makeUpdater(COLLECTIONS.LEAVE_REQUESTS, leaveRequests, setLeaveRequests),
    setStrategicProjects: handleUpdateStrategicProjects,
    setSalaryPayments: makeUpdater(COLLECTIONS.SALARY_PAYMENTS, salaryPayments, setSalaryPayments),
    setFinancialTransactions: makeUpdater(COLLECTIONS.FINANCIAL_TRANSACTIONS, financialTransactions, setFinancialTransactions),
    setSalaryDebts: makeUpdater(COLLECTIONS.EMPLOYEE_SALARY_DEBT, salaryDebts, setSalaryDebts),
    setDocuments: makeUpdater(COLLECTIONS.DOCUMENTS, documents, setDocuments),
    setDisciplinaryIncidents: makeUpdater(COLLECTIONS.DISCIPLINARY_INCIDENTS, disciplinaryIncidents, setDisciplinaryIncidents),
    handleUpdateAttendanceIncidents: makeUpdater(COLLECTIONS.ATTENDANCE_INCIDENTS, attendanceIncidents, setAttendanceIncidents),
    handleAddAttendanceIncident,
    setInventoryItems: makeUpdater(COLLECTIONS.INVENTORY, inventoryItems, setInventoryItems),
    setPartners: makeUpdater(COLLECTIONS.PARTNERS, partners, setPartners),
    setUsers: async (updated: AppUser[]) => setUsers(updated),
    handleUpdateEmployees,
    handleUpdatePresences: makeUpdater(COLLECTIONS.PRESENCES, presences, setPresences),
    handleAddNotification,
    handleUpdateModuleConfig,
  };
}
