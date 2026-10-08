import { useState, useEffect } from 'react';
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
  DEFAULT_MODULE_CONFIG 
} from '../types';
import { subscribeToCollection, subscribeToDocument, saveDocument, deleteDocument, COLLECTIONS } from '../services/firestoreService';
import { subscribeToUsers } from '../services/userService';
import { safeStorage } from '../utils/safeStorage';
import { CITRINE_DEFAULT_LOGO_BASE64 } from '../assets/citrineLogoBase64';

export function useAppInitialData() {
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem('citrine_employees');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [presences, setPresences] = useState<Presence[]>(() => {
    try {
      const saved = localStorage.getItem('citrine_presences');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([]);
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>([]);
  const [salaryDebts, setSalaryDebts] = useState<EmployeeSalaryDebt[]>([]);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [disciplinaryIncidents, setDisciplinaryIncidents] = useState<DisciplinaryIncident[]>([]);
  const [attendanceIncidents, setAttendanceIncidents] = useState<AttendanceIncident[]>(() => {
    try {
      const saved = localStorage.getItem('citrine_attendance_incidents');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);

  const [moduleConfig, setModuleConfig] = useState<CompanyModuleConfig>(() => {
    try {
      const saved = safeStorage.getItem('citrine_module_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_MODULE_CONFIG;
  });

  // Subscriptions to Firestore Collections
  useEffect(() => {
    const unsubs = [
      subscribeToCollection<Employee>(COLLECTIONS.EMPLOYEES, (data) => {
        setEmployees(data);
        localStorage.setItem('citrine_employees', JSON.stringify(data));
      }),
      subscribeToCollection<Presence>(COLLECTIONS.PRESENCES, (data) => {
        setPresences(data);
        localStorage.setItem('citrine_presences', JSON.stringify(data));
      }),
      subscribeToCollection<Task>(COLLECTIONS.TASKS, setTasks),
      subscribeToCollection<Reminder>(COLLECTIONS.REMINDERS, setReminders),
      subscribeToCollection<NotificationLog>(COLLECTIONS.NOTIFICATIONS, setNotifications),
      subscribeToCollection<SalaryPayment>(COLLECTIONS.SALARY_PAYMENTS, setSalaryPayments),
      subscribeToCollection<FinancialTransaction>(COLLECTIONS.FINANCIAL_TRANSACTIONS, setFinancialTransactions),
      subscribeToCollection<EmployeeSalaryDebt>(COLLECTIONS.EMPLOYEE_SALARY_DEBT, setSalaryDebts),
      subscribeToCollection<GeneratedDocument>(COLLECTIONS.DOCUMENTS, setDocuments),
      subscribeToCollection<DisciplinaryIncident>(COLLECTIONS.DISCIPLINARY_INCIDENTS, setDisciplinaryIncidents),
      subscribeToCollection<AttendanceIncident>(COLLECTIONS.ATTENDANCE_INCIDENTS, (data) => {
        setAttendanceIncidents(data);
        localStorage.setItem('citrine_attendance_incidents', JSON.stringify(data));
      }),
      subscribeToCollection<InventoryItem>(COLLECTIONS.INVENTORY, setInventoryItems),
      subscribeToCollection<Partner>(COLLECTIONS.PARTNERS, setPartners),
      subscribeToUsers(setUsers),
      // Synchronisation temps réel des paramètres de l'entreprise et du logo stocké en BD
      subscribeToDocument<CompanyModuleConfig>(COLLECTIONS.COMPANY_SETTINGS, 'main_config', (data) => {
        if (data) {
          const configWithLogo = {
            ...data,
            companyLogoBase64: data.companyLogoBase64 || CITRINE_DEFAULT_LOGO_BASE64,
          };
          setModuleConfig(configWithLogo);
          safeStorage.setItem('citrine_module_config', JSON.stringify(configWithLogo));
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

    return () => {
      unsubs.forEach((u) => typeof u === 'function' && u());
    };
  }, []);

  const handleUpdateEmployees = async (updated: Employee[]) => {
    for (const emp of updated) {
      const existing = employees.find((e) => e.id === emp.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(emp)) {
        await saveDocument(COLLECTIONS.EMPLOYEES, emp);
      }
    }
    for (const emp of employees) {
      if (!updated.some((e) => e.id === emp.id)) {
        await deleteDocument(COLLECTIONS.EMPLOYEES, emp.id);
      }
    }
    setEmployees(updated);
    localStorage.setItem('citrine_employees', JSON.stringify(updated));
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
    localStorage.setItem('citrine_presences', JSON.stringify(updated));
  };

  const handleUpdateTasks = async (updated: Task[]) => {
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
    setTasks(updated);
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
    localStorage.setItem('citrine_attendance_incidents', JSON.stringify(updated));
  };

  const handleAddAttendanceIncident = async (incident: AttendanceIncident) => {
    await saveDocument(COLLECTIONS.ATTENDANCE_INCIDENTS, incident);
    const updated = [incident, ...attendanceIncidents.filter((i) => i.id !== incident.id)];
    setAttendanceIncidents(updated);
    localStorage.setItem('citrine_attendance_incidents', JSON.stringify(updated));
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

  const handleUpdateModuleConfig = (newConfig: CompanyModuleConfig) => {
    setModuleConfig(newConfig);
    safeStorage.setItem('citrine_module_config', JSON.stringify(newConfig));
    saveDocument(COLLECTIONS.COMPANY_SETTINGS, { ...newConfig, id: 'main_config' });
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
    moduleConfig,
    setTasks: handleUpdateTasks,
    setReminders: handleUpdateReminders,
    setNotifications: handleUpdateNotifications,
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
