import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Employee, 
  Presence, 
  Task, 
  Reminder, 
  NotificationLog, 
  SalaryPayment, 
  FinancialTransaction, 
  EmployeeSalaryDebt, 
  GeneratedDocument, 
  DisciplinaryIncident, 
  AttendanceIncident,
  InventoryItem, 
  Partner, 
  AppUser, 
  CompanyModuleConfig, 
  DEFAULT_MODULE_CONFIG,
  LeaveRequest 
} from '../types';
import { subscribeToCollection, subscribeToDocument, saveDocument, deleteDocument, getCollection, COLLECTIONS } from '../services/dataService';
import { subscribeToUsers } from '../services/userService';
import { cloudSqlService } from '../services/cloudSqlService';
import { safeStorage } from '../utils/safeStorage';
import { CITRINE_DEFAULT_LOGO_BASE64 } from '../assets/citrineLogoBase64';
import { pushNotificationBridgeService } from '../services/pushNotificationBridgeService';

interface CachedModuleConfig {
  config: CompanyModuleConfig;
  timestamp: number;
}
const MODULE_CACHE_KEY = 'citrine_module_config';
const MODULE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes max

function getCachedModuleConfig(): CompanyModuleConfig | null {
  try {
    const raw = safeStorage.getItem(MODULE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      if ('timestamp' in parsed && 'config' in parsed) {
        const age = Date.now() - (parsed.timestamp || 0);
        if (age < MODULE_CACHE_TTL_MS) {
          return parsed.config;
        } else {
          // Cache expiré (> 5 minutes)
          safeStorage.removeItem(MODULE_CACHE_KEY);
          return null;
        }
      }
      // Ancien format sans timestamp : invalider pour respecter la règle des 5 minutes
      safeStorage.removeItem(MODULE_CACHE_KEY);
      return null;
    }
  } catch {
    safeStorage.removeItem(MODULE_CACHE_KEY);
  }
  return null;
}

function setCachedModuleConfig(config: CompanyModuleConfig): void {
  try {
    const payload: CachedModuleConfig = {
      config,
      timestamp: Date.now(),
    };
    safeStorage.setItem(MODULE_CACHE_KEY, JSON.stringify(payload));
  } catch {}
}

// (Zero localStorage architecture)

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

  const [moduleConfig, setModuleConfig] = useState<CompanyModuleConfig>(DEFAULT_MODULE_CONFIG);

  const seenNotificationIdsRef = useRef<Set<string>>(new Set());
  const isInitialNotifLoadDoneRef = useRef(false);

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

        const ageMs = Date.now() - new Date(notif.timestamp).getTime();
        // Déclencher le push si la notification est récente (< 5 minutes)
        if (ageMs < 5 * 60 * 1000) {
          const isTarget = isCurrentAdmin || (
            currentUser && (
              notif.recipient === currentUser.name ||
              notif.recipient === currentUser.email ||
              notif.recipient === currentUser.id ||
              notif.recipient === 'Direction & RH' ||
              notif.recipient === 'Équipe' ||
              notif.recipient === 'Tous'
            )
          );

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

  // Subscriptions to Supabase Tables
  useEffect(() => {
    const unsubs = [
      subscribeToCollection<Employee>(COLLECTIONS.EMPLOYEES, setEmployees),
      subscribeToCollection<Presence>(COLLECTIONS.PRESENCES, setPresences),
      subscribeToCollection<Task>(COLLECTIONS.TASKS, (data) => setTasks(data || [])),
      subscribeToCollection<Reminder>(COLLECTIONS.REMINDERS, setReminders),
      subscribeToCollection<NotificationLog>(COLLECTIONS.NOTIFICATIONS, (data) => {
        if (data) {
          handleIncomingNotifications(data);
        }
      }),
      subscribeToCollection<LeaveRequest>(COLLECTIONS.LEAVE_REQUESTS, (data) => {
        const sorted = [...(data || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setLeaveRequests(sorted);
      }),
      subscribeToCollection<SalaryPayment>(COLLECTIONS.SALARY_PAYMENTS, setSalaryPayments),
      subscribeToCollection<FinancialTransaction>(COLLECTIONS.FINANCIAL_TRANSACTIONS, setFinancialTransactions),
      subscribeToCollection<EmployeeSalaryDebt>(COLLECTIONS.EMPLOYEE_SALARY_DEBT, setSalaryDebts),
      subscribeToCollection<GeneratedDocument>(COLLECTIONS.DOCUMENTS, setDocuments),
      subscribeToCollection<DisciplinaryIncident>(COLLECTIONS.DISCIPLINARY_INCIDENTS, setDisciplinaryIncidents),
      subscribeToCollection<AttendanceIncident>(COLLECTIONS.ATTENDANCE_INCIDENTS, (data) => {
        const unique: AttendanceIncident[] = [];
        const seen = new Set<string>();
        (data || []).forEach((item) => {
          const key = `${item.employeeId}_${item.date}_${item.type}_${item.reason?.trim().toLowerCase()}`;
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(item);
          }
        });
        setAttendanceIncidents(unique);
      }),
      subscribeToCollection<InventoryItem>(COLLECTIONS.INVENTORY, setInventoryItems),
      subscribeToCollection<Partner>(COLLECTIONS.PARTNERS, setPartners),
      subscribeToUsers(setUsers),
      // Synchronisation temps réel des paramètres de l'entreprise et du logo stocké en BD
      subscribeToDocument<CompanyModuleConfig>(COLLECTIONS.COMPANY_SETTINGS, 'main_config', (data) => {
        if (data) {
          const configWithLogo = {
            ...DEFAULT_MODULE_CONFIG,
            ...data,
            companyLogoBase64: data.companyLogoBase64 || CITRINE_DEFAULT_LOGO_BASE64,
          };
          setModuleConfig(configWithLogo);
        } else {
          // Premier démarrage : initialisation de l'image de marque officielle en BD
          const initialConfig: CompanyModuleConfig = {
            ...DEFAULT_MODULE_CONFIG,
            companyLogoBase64: CITRINE_DEFAULT_LOGO_BASE64,
          };
          saveDocument(COLLECTIONS.COMPANY_SETTINGS, { ...initialConfig, id: 'main_config' });
        }
      }),
    ];

    // Cross-tab synchronization via BroadcastChannel
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('citrine_cross_tab_sync');
        bc.onmessage = (event) => {
          if (event.data?.type === 'SYNC_TASKS' && Array.isArray(event.data.tasks)) {
            setTasks(event.data.tasks);
          } else if (event.data?.type === 'SYNC_NOTIFICATIONS' && Array.isArray(event.data.notifications)) {
            handleIncomingNotifications(event.data.notifications);
          }
        };
      }
    } catch {}

    // Polling interval strictly on database
    const pollTimer = setInterval(async () => {
      try {
        const freshTasks = await getCollection<Task>(COLLECTIONS.TASKS);
        if (freshTasks) {
          setTasks(freshTasks);
        }

        const freshNotifs = await getCollection<NotificationLog>(COLLECTIONS.NOTIFICATIONS);
        if (freshNotifs && freshNotifs.length > 0) {
          handleIncomingNotifications(freshNotifs);
        }
      } catch {}
    }, 6000);

    return () => {
      unsubs.forEach((u) => typeof u === 'function' && u());
      if (bc) bc.close();
      clearInterval(pollTimer);
    };
  }, []);

  const handleUpdateEmployees = async (updated: Employee[]) => {
    for (const emp of updated) {
      const existing = employees.find((e) => e.id === emp.id || (e.uid && emp.uid && e.uid === emp.uid));
      if (!existing || JSON.stringify(existing) !== JSON.stringify(emp)) {
        try {
          await saveDocument(COLLECTIONS.EMPLOYEES, emp);
        } catch (e) {
          console.warn('Supabase save employee notice:', e);
        }
        try {
          await cloudSqlService.saveDocument(COLLECTIONS.EMPLOYEES, emp);
        } catch (e) {
          console.warn('Cloud SQL save employee notice:', e);
        }
      }
    }
    for (const emp of employees) {
      if (!updated.some((e) => e.id === emp.id || (e.uid && emp.uid && e.uid === emp.uid))) {
        const idToDelete = emp.id || emp.uid;
        if (idToDelete) {
          try {
            await deleteDocument(COLLECTIONS.EMPLOYEES, String(idToDelete));
          } catch (e) {
            console.warn('Supabase delete employee notice:', e);
          }
          try {
            await cloudSqlService.deleteDocument(COLLECTIONS.EMPLOYEES, String(idToDelete));
          } catch (e) {
            console.warn('Cloud SQL delete employee notice:', e);
          }
        }
      }
    }
    setEmployees(updated);
  };

  const handleUpdatePresences = async (updated: Presence[]) => {
    for (const pres of updated) {
      const existing = presences.find((p) => p.id === pres.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(pres)) {
        await saveDocument(COLLECTIONS.PRESENCES, pres);
      }
    }
    for (const pres of presences) {
      if (!updated.some((p) => p.id === pres.id)) {
        await deleteDocument(COLLECTIONS.PRESENCES, pres.id);
      }
    }
    setPresences(updated);
  };

  const handleUpdateTasks = async (updated: Task[]) => {
    setTasks(updated);

    // Broadcast immediately across open tabs/windows
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bcast = new BroadcastChannel('citrine_cross_tab_sync');
        bcast.postMessage({ type: 'SYNC_TASKS', tasks: updated });
        bcast.close();
      }
    } catch {}

    for (const t of updated) {
      const existing = tasks.find((x) => x.id === t.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(t)) {
        await saveDocument(COLLECTIONS.TASKS, t);
      }
    }
    for (const t of tasks) {
      if (!updated.some((x) => x.id === t.id)) {
        await deleteDocument(COLLECTIONS.TASKS, t.id);
      }
    }
  };

  const handleUpdateReminders = async (updated: Reminder[]) => {
    for (const r of updated) {
      const existing = reminders.find((x) => x.id === r.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(r)) {
        await saveDocument(COLLECTIONS.REMINDERS, r);
      }
    }
    for (const r of reminders) {
      if (!updated.some((x) => x.id === r.id)) {
        await deleteDocument(COLLECTIONS.REMINDERS, r.id);
      }
    }
    setReminders(updated);
  };

  const handleUpdateNotifications = async (updated: NotificationLog[]) => {
    for (const n of updated) {
      const existing = notifications.find((x) => x.id === n.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(n)) {
        await saveDocument(COLLECTIONS.NOTIFICATIONS, n);
      }
    }
    for (const n of notifications) {
      if (!updated.some((x) => x.id === n.id)) {
        await deleteDocument(COLLECTIONS.NOTIFICATIONS, n.id);
      }
    }
    setNotifications(updated);
  };

  const handleUpdateSalaryPayments = async (updated: SalaryPayment[]) => {
    for (const s of updated) {
      const existing = salaryPayments.find((x) => x.id === s.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(s)) {
        await saveDocument(COLLECTIONS.SALARY_PAYMENTS, s);
      }
    }
    for (const s of salaryPayments) {
      if (!updated.some((x) => x.id === s.id)) {
        await deleteDocument(COLLECTIONS.SALARY_PAYMENTS, s.id);
      }
    }
    setSalaryPayments(updated);
  };

  const handleUpdateFinancialTransactions = async (updated: FinancialTransaction[]) => {
    for (const f of updated) {
      const existing = financialTransactions.find((x) => x.id === f.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(f)) {
        await saveDocument(COLLECTIONS.FINANCIAL_TRANSACTIONS, f);
      }
    }
    for (const f of financialTransactions) {
      if (!updated.some((x) => x.id === f.id)) {
        await deleteDocument(COLLECTIONS.FINANCIAL_TRANSACTIONS, f.id);
      }
    }
    setFinancialTransactions(updated);
  };

  const handleUpdateSalaryDebts = async (updated: EmployeeSalaryDebt[]) => {
    for (const d of updated) {
      const existing = salaryDebts.find((x) => x.id === d.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(d)) {
        await saveDocument(COLLECTIONS.EMPLOYEE_SALARY_DEBT, d);
      }
    }
    for (const d of salaryDebts) {
      if (!updated.some((x) => x.id === d.id)) {
        await deleteDocument(COLLECTIONS.EMPLOYEE_SALARY_DEBT, d.id);
      }
    }
    setSalaryDebts(updated);
  };

  const handleUpdateDocuments = async (updated: GeneratedDocument[]) => {
    for (const docItem of updated) {
      const existing = documents.find((x) => x.id === docItem.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(docItem)) {
        await saveDocument(COLLECTIONS.DOCUMENTS, docItem);
      }
    }
    for (const docItem of documents) {
      if (!updated.some((x) => x.id === docItem.id)) {
        await deleteDocument(COLLECTIONS.DOCUMENTS, docItem.id);
      }
    }
    setDocuments(updated);
  };

  const handleUpdateDisciplinaryIncidents = async (updated: DisciplinaryIncident[]) => {
    for (const d of updated) {
      const existing = disciplinaryIncidents.find((x) => x.id === d.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(d)) {
        await saveDocument(COLLECTIONS.DISCIPLINARY_INCIDENTS, d);
      }
    }
    for (const d of disciplinaryIncidents) {
      if (!updated.some((x) => x.id === d.id)) {
        await deleteDocument(COLLECTIONS.DISCIPLINARY_INCIDENTS, d.id);
      }
    }
    setDisciplinaryIncidents(updated);
  };

  const handleUpdateAttendanceIncidents = async (updated: AttendanceIncident[]) => {
    for (const item of updated) {
      const existing = attendanceIncidents.find((x) => x.id === item.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(item)) {
        await saveDocument(COLLECTIONS.ATTENDANCE_INCIDENTS, item);
      }
    }
    for (const item of attendanceIncidents) {
      if (!updated.some((x) => x.id === item.id)) {
        await deleteDocument(COLLECTIONS.ATTENDANCE_INCIDENTS, item.id);
      }
    }
    setAttendanceIncidents(updated);
  };

  const handleAddAttendanceIncident = async (incident: AttendanceIncident) => {
    // Éviter d'insérer un incident s'il en existe déjà un identique pour ce collaborateur
    const existingDuplicate = attendanceIncidents.find(
      (i) =>
        i.id !== incident.id &&
        i.employeeId === incident.employeeId &&
        i.date === incident.date &&
        i.type === incident.type &&
        i.reason?.trim().toLowerCase() === incident.reason?.trim().toLowerCase()
    );

    if (existingDuplicate) {
      return;
    }

    await saveDocument(COLLECTIONS.ATTENDANCE_INCIDENTS, incident);
    const updated = [incident, ...attendanceIncidents.filter((i) => i.id !== incident.id)];
    setAttendanceIncidents(updated);

    if ((incident.employeeId || incident.employeeName) && incident.origin !== 'automatique_pointage') {
      const typeLabels: Record<string, string> = {
        retard: 'Retard constaté',
        sortie_prematuree: 'Sortie prématurée',
        depart_anticipe: 'Départ anticipé',
        absence_injustifiee: 'Absence injustifiée',
      };
      const label = typeLabels[incident.type] || 'Signalement RH';
      const notifId = `notif-inc-${incident.id}`;
      const notif: NotificationLog = {
        id: notifId,
        type: 'system',
        recipient: incident.employeeId || incident.employeeName || 'Collaborateur',
        title: `Signalement RH : ${label}`,
        content: incident.reason || `Incident enregistré pour la date du ${incident.date}.`,
        payload: JSON.stringify({
          source: 'attendance_incident',
          incidentId: incident.id,
          employeeId: incident.employeeId,
          type: incident.type,
          date: incident.date,
        }),
        timestamp: incident.createdAt || new Date().toISOString(),
        read: false,
      };
      await saveDocument(COLLECTIONS.NOTIFICATIONS, notif);
      setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notifId)]);
    }
  };

  const handleUpdateInventoryItems = async (updated: InventoryItem[]) => {
    for (const i of updated) {
      const existing = inventoryItems.find((x) => x.id === i.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(i)) {
        await saveDocument(COLLECTIONS.INVENTORY, i);
      }
    }
    for (const i of inventoryItems) {
      if (!updated.some((x) => x.id === i.id)) {
        await deleteDocument(COLLECTIONS.INVENTORY, i.id);
      }
    }
    setInventoryItems(updated);
  };

  const handleUpdatePartners = async (updated: Partner[]) => {
    for (const p of updated) {
      const existing = partners.find((x) => x.id === p.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(p)) {
        await saveDocument(COLLECTIONS.PARTNERS, p);
      }
    }
    for (const p of partners) {
      if (!updated.some((x) => x.id === p.id)) {
        await deleteDocument(COLLECTIONS.PARTNERS, p.id);
      }
    }
    setPartners(updated);
  };

  const handleUpdateUsers = async (updated: AppUser[]) => {
    setUsers(updated);
  };

  const handleAddNotification = async (notif: any) => {
    const n: NotificationLog = {
      id: notif.id || `notif-${Date.now()}`,
      type: notif.type || 'system',
      recipient: notif.recipient || 'Général',
      title: notif.title || 'Notification',
      content: notif.content || '',
      payload: notif.payload || '',
      timestamp: notif.timestamp || new Date().toISOString(),
    };
    await saveDocument(COLLECTIONS.NOTIFICATIONS, n);
  };

  const handleUpdateLeaveRequests = async (updated: LeaveRequest[]) => {
    for (const l of updated) {
      const existing = leaveRequests.find((x) => x.id === l.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(l)) {
        await saveDocument(COLLECTIONS.LEAVE_REQUESTS, l);
      }
    }
    for (const l of leaveRequests) {
      if (!updated.some((x) => x.id === l.id)) {
        await deleteDocument(COLLECTIONS.LEAVE_REQUESTS, l.id);
      }
    }
    setLeaveRequests(updated);
  };

  const handleUpdateModuleConfig = (newConfig: CompanyModuleConfig) => {
    setModuleConfig(newConfig);
    saveDocument(COLLECTIONS.COMPANY_SETTINGS, { ...newConfig, id: 'main_config' });
  };

  const refreshAll = async () => {
    try {
      const [
        freshUsers,
        freshEmployees,
        freshPresences,
        freshLeaves,
        freshNotifs,
        freshIncidents,
      ] = await Promise.all([
        getCollection<AppUser>(COLLECTIONS.USERS),
        getCollection<Employee>(COLLECTIONS.EMPLOYEES),
        getCollection<Presence>(COLLECTIONS.PRESENCES),
        getCollection<LeaveRequest>(COLLECTIONS.LEAVE_REQUESTS),
        getCollection<NotificationLog>(COLLECTIONS.NOTIFICATIONS),
        getCollection<AttendanceIncident>(COLLECTIONS.ATTENDANCE_INCIDENTS),
      ]);

      if (freshUsers) {
        setUsers(freshUsers);
      }
      if (freshEmployees) {
        setEmployees(freshEmployees);
      }
      if (freshPresences) {
        setPresences(freshPresences);
      }
      if (freshLeaves) {
        const sorted = [...freshLeaves].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setLeaveRequests(sorted);
      }
      if (freshNotifs) {
        setNotifications(freshNotifs);
      }
      if (freshIncidents) {
        setAttendanceIncidents(freshIncidents);
      }
    } catch (e) {
      console.warn('Erreur lors du rafraîchissement global:', e);
    }
  };

  return {
    employees,
    presences,
    tasks,
    reminders,
    notifications,
    salaryPayments,
    financialTransactions,
    salaryDebts,
    documents,
    disciplinaryIncidents,
    attendanceIncidents,
    inventoryItems,
    partners,
    users,
    leaveRequests,
    moduleConfig,
    refreshAll,
    setTasks: handleUpdateTasks,
    setReminders: handleUpdateReminders,
    setNotifications: handleUpdateNotifications,
    setLeaveRequests: handleUpdateLeaveRequests,
    setSalaryPayments: handleUpdateSalaryPayments,
    setFinancialTransactions: handleUpdateFinancialTransactions,
    setSalaryDebts: handleUpdateSalaryDebts,
    setDocuments: handleUpdateDocuments,
    setDisciplinaryIncidents: handleUpdateDisciplinaryIncidents,
    handleUpdateAttendanceIncidents,
    handleAddAttendanceIncident,
    setInventoryItems: handleUpdateInventoryItems,
    setPartners: handleUpdatePartners,
    setUsers: handleUpdateUsers,
    handleUpdateEmployees,
    handleUpdatePresences,
    handleAddNotification,
    handleUpdateModuleConfig,
  };
}
