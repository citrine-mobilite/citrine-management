import React, { useEffect } from 'react';
import {
  Employee, Presence, Task, Reminder, NotificationLog, SalaryPayment,
  FinancialTransaction, EmployeeSalaryDebt, GeneratedDocument, DisciplinaryIncident,
  AttendanceIncident, InventoryItem, Partner, AppUser, CompanyModuleConfig,
  DEFAULT_MODULE_CONFIG, LeaveRequest, StrategicProject,
} from '../../types';
import { subscribeToCollection, subscribeToDocument, getCollection, COLLECTIONS } from '../../services/dataService';
import { subscribeToUsers } from '../../services/userService';
import { realtimeSyncService } from '../../services/realtimeSyncService';
import { syncMissionsAndEmployeeStatus } from '../../services/missionLifecycleService';
import { persistStoredModuleConfig } from './moduleConfigStorage';

interface UseInitialDataSubscriptionsParams {
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  setPresences: React.Dispatch<React.SetStateAction<Presence[]>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
  setSalaryPayments: React.Dispatch<React.SetStateAction<SalaryPayment[]>>;
  setFinancialTransactions: React.Dispatch<React.SetStateAction<FinancialTransaction[]>>;
  setSalaryDebts: React.Dispatch<React.SetStateAction<EmployeeSalaryDebt[]>>;
  setDocuments: React.Dispatch<React.SetStateAction<GeneratedDocument[]>>;
  setDisciplinaryIncidents: React.Dispatch<React.SetStateAction<DisciplinaryIncident[]>>;
  setAttendanceIncidents: React.Dispatch<React.SetStateAction<AttendanceIncident[]>>;
  setInventoryItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  setPartners: React.Dispatch<React.SetStateAction<Partner[]>>;
  setUsers: React.Dispatch<React.SetStateAction<AppUser[]>>;
  setLeaveRequests: React.Dispatch<React.SetStateAction<LeaveRequest[]>>;
  setStrategicProjects: React.Dispatch<React.SetStateAction<StrategicProject[]>>;
  setModuleConfig: React.Dispatch<React.SetStateAction<CompanyModuleConfig>>;
  handleIncomingNotifications: (newNotifs: NotificationLog[]) => void;
  leaveRequests: LeaveRequest[];
  employees: Employee[];
  users: AppUser[];
  handleAddNotification: (notif: any) => Promise<void>;
}

export function useInitialDataSubscriptions({
  setEmployees, setPresences, setTasks, setReminders, setSalaryPayments,
  setFinancialTransactions, setSalaryDebts, setDocuments, setDisciplinaryIncidents,
  setAttendanceIncidents, setInventoryItems, setPartners, setUsers, setLeaveRequests,
  setStrategicProjects, setModuleConfig, handleIncomingNotifications,
  leaveRequests, employees, users, handleAddNotification,
}: UseInitialDataSubscriptionsParams) {
  useEffect(() => {
    const unsubs = [
      subscribeToCollection<Employee>(COLLECTIONS.EMPLOYEES, setEmployees),
      subscribeToCollection<Presence>(COLLECTIONS.PRESENCES, setPresences),
      subscribeToCollection<Task>(COLLECTIONS.TASKS, (data) => setTasks(data || [])),
      subscribeToCollection<Reminder>(COLLECTIONS.REMINDERS, setReminders),
      subscribeToCollection<NotificationLog>(COLLECTIONS.NOTIFICATIONS, (data) => {
        if (data) handleIncomingNotifications(data);
      }),
      subscribeToCollection<LeaveRequest>(COLLECTIONS.LEAVE_REQUESTS, (data) => {
        setLeaveRequests([...(data || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
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
          const reasonStr = (item.reason || (item as any).description || '').trim().toLowerCase();
          const key = `${item.employeeId}_${item.date}_${item.type}_${reasonStr}`;
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(item);
          }
        });
        setAttendanceIncidents(unique);
      }),
      subscribeToCollection<InventoryItem>(COLLECTIONS.INVENTORY, setInventoryItems),
      subscribeToCollection<Partner>(COLLECTIONS.PARTNERS, setPartners),
      subscribeToCollection<StrategicProject>(COLLECTIONS.STRATEGIC_PROJECTS, (data) => setStrategicProjects(data || [])),
      subscribeToUsers(setUsers),
      subscribeToDocument<CompanyModuleConfig>(COLLECTIONS.COMPANY_SETTINGS, 'main_config', (data) => {
        if (data) {
          setModuleConfig((prev) => {
            const merged: CompanyModuleConfig = {
              ...DEFAULT_MODULE_CONFIG,
              ...prev,
              ...data,
              companyLogoBase64: data.companyLogoBase64 || prev.companyLogoBase64 || '/citrine-logo.png',
            };
            persistStoredModuleConfig(merged);
            return merged;
          });
        }
      }),
    ];

    (async () => {
      try {
        const settingsList = await getCollection<CompanyModuleConfig>(COLLECTIONS.COMPANY_SETTINGS);
        if (settingsList && settingsList.length > 0) {
          const dbConfig = settingsList.find((s: any) => s.id === 'main_config' || s.docId === 'main_config') || settingsList[0];
          if (dbConfig) {
            setModuleConfig((prev) => {
              const merged: CompanyModuleConfig = {
                ...DEFAULT_MODULE_CONFIG,
                ...prev,
                ...dbConfig,
                companyLogoBase64: dbConfig.companyLogoBase64 || prev.companyLogoBase64 || '/citrine-logo.png',
              };
              persistStoredModuleConfig(merged);
              return merged;
            });
          }
        }
      } catch (err) {
        console.warn('Erreur chargement initial company_settings:', err);
      }
    })();

    const unsubRealtime = realtimeSyncService.subscribeToPresenceUpdates(async (eventData) => {
      if (eventData.presence) {
        const newPres = eventData.presence;
        setPresences((prev) => {
          const index = prev.findIndex((p) => p.id === newPres.id || (String(p.employeeId) === String(newPres.employeeId) && p.date === newPres.date));
          if (index >= 0) {
            const copy = [...prev];
            copy[index] = { ...copy[index], ...newPres };
            return copy;
          }
          return [newPres, ...prev];
        });
      }
      if (eventData.incident) {
        const newInc = eventData.incident;
        setAttendanceIncidents((prev) => {
          const index = prev.findIndex((i) => i.id === newInc.id || (String(i.employeeId) === String(newInc.employeeId) && i.date === newInc.date && i.type === newInc.type));
          if (index >= 0) {
            const copy = [...prev];
            copy[index] = { ...copy[index], ...newInc };
            return copy;
          }
          return [newInc, ...prev];
        });
      }
      if (eventData.notification) handleIncomingNotifications([eventData.notification]);
    });

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('citrine_cross_tab_sync');
        bc.onmessage = (event) => {
          if (event.data?.type === 'SYNC_TASKS' && Array.isArray(event.data.tasks)) setTasks(event.data.tasks);
          else if (event.data?.type === 'SYNC_NOTIFICATIONS' && Array.isArray(event.data.notifications)) handleIncomingNotifications(event.data.notifications);
          else if (event.data?.type === 'SYNC_PRESENCES' && Array.isArray(event.data.presences)) setPresences(event.data.presences);
          else if (event.data?.type === 'SYNC_INCIDENTS' && Array.isArray(event.data.incidents)) setAttendanceIncidents(event.data.incidents);
          else if (event.data?.type === 'SYNC_STRATEGIC_PROJECTS' && Array.isArray(event.data.strategicProjects)) setStrategicProjects(event.data.strategicProjects);
        };
      }
    } catch {}

    const onEmpUpdated = (e: any) => {
      const emp = e.detail;
      if (emp) {
        setEmployees((prev) => {
          const idx = prev.findIndex((item) => item.id === emp.id || (item.email && item.email.toLowerCase() === emp.email.toLowerCase()));
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...emp };
            return next;
          }
          return [emp, ...prev];
        });
      }
    };

    const onUserUpdated = (e: any) => {
      const user = e.detail;
      if (user) {
        setUsers((prev) => {
          const idx = prev.findIndex((item) => item.id === user.id || (item.email && item.email.toLowerCase() === user.email.toLowerCase()));
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...user };
            return next;
          }
          return [user, ...prev];
        });
      }
    };

    window.addEventListener('citrine:employee_updated', onEmpUpdated);
    window.addEventListener('citrine:user_updated', onUserUpdated);

    return () => {
      unsubs.forEach((u) => typeof u === 'function' && u());
      unsubRealtime();
      if (bc) bc.close();
      window.removeEventListener('citrine:employee_updated', onEmpUpdated);
      window.removeEventListener('citrine:user_updated', onUserUpdated);
    };
  }, []);

  useEffect(() => {
    if (leaveRequests.length > 0 && employees.length > 0) {
      syncMissionsAndEmployeeStatus(
        leaveRequests, employees, users, setLeaveRequests, setEmployees, setUsers, handleAddNotification
      ).catch((err) => console.warn('[syncMissionsAndEmployeeStatus Notice]:', err));
    }
  }, [leaveRequests.length, employees.length]);
}
