import React, { useState, useEffect, useCallback, Suspense, lazy, useRef } from 'react';
import { 
  Employee, 
  Presence, 
  Task, 
  Reminder, 
  NotificationLog, 
  Role,
  UserRole,
  UserStatus,
  GeneratedDocument,
  EmployeeSalaryDebt,
  SalaryPayment,
  FinancialTransaction,
  AppUser,
  InventoryItem,
  Partner,
  VoIPCall,
  UserOnlinePresence,
  CallType,
  DisciplinaryIncident,
  DepartmentNode
} from './types';
import {
  PresencePanel,
  TaskPanel,
  ReminderPanel,
  NotificationConsole,
  CollaboratorPanel,
  EmployeePortal,
  IncomingCallModal,
  ActiveCallModal,
  LoginModal,
  ProfilePage,
  OfflineStatusBanner,
  ToastContainer,
  ModuleSkeletonLoader,
  PullToRefreshContainer,
  CMLogo,
  Sidebar,
  AdminDashboardOverview,
  PWAInstallButton,
  PushNotificationManagerModal
} from './components';
import type { TabType, ToastMessage } from './components';
import { safeStorage } from './utils/safeStorage';
import { callSignalingService } from './services/callSignalingService';
import { webRTCService } from './services/webRTCService';
import { soundService } from './services/soundService';
import { haptic } from './services/hapticService';
import { dataSaverService } from './services/dataSaverService';

// Code Splitting (1.1) : Lazy-loaded heavy modules for maximum initial startup speed
const TeamCallsPanel = lazy(() => import('./components/TeamCallsPanel').then(m => ({ default: m.TeamCallsPanel })));
const DocumentGeneratorPanel = lazy(() => import('./components/DocumentGeneratorPanel'));
const UserManagementPanel = lazy(() => import('./components/UserManagementPanel'));
const FinancePanel = lazy(() => import('./components/FinancePanel'));
const InventoryPanel = lazy(() => import('./components/InventoryPanel'));
const PartnersPanel = lazy(() => import('./components/PartnersPanel'));
const CompanySettingsPanel = lazy(() => import('./components/CompanySettingsPanel'));
const CommunicationPanel = lazy(() => import('./components/CommunicationPanel'));
const KioskClockingModal = lazy(() => import('./components/KioskClockingModal'));
const DisciplinaryPanel = lazy(() => import('./components/DisciplinaryPanel'));
import { 
  User, 
  Shield, 
  Calendar, 
  Users, 
  Bell, 
  BellRing,
  Terminal, 
  Clock,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  Info,
  
  ChevronRight,
  Sparkle,
  FileText,
  Send,
  DollarSign,
  Database,
  QrCode,
  Tablet,
  Settings,
  CheckCircle2,
  LayoutDashboard,
  BarChart3,
  Package,
  Menu,
  MapPin,
  Camera,
  ExternalLink,
  Wifi,
  WifiOff,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CompanyModuleConfig, DEFAULT_MODULE_CONFIG } from './types';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './lib/firebase';
import {
  subscribeToCollection,
  subscribeToRecentCollection,
  saveDocument,
  saveEmployeeSalaryDebt,
  syncListToFirestore,
  deleteDocument,
  COLLECTIONS
} from './services/firestoreService';
import { updateCompanyHQLocation, generateKioskPinCode } from './utils/geolocation';
import { seedUsersIfEmpty, subscribeToUsers, saveUser, deleteUser } from './services/userService';
import { pushNotificationService } from './services/pushNotificationService';
import { useDevicePermissions } from './hooks/useDevicePermissions';
import { offlineService } from './services/offlineService';
import {
  storeSecureSession,
  loadSecureSession,
  clearSecureSession,
  validateSessionIntegrity,
  normalizeRole,
  canAccessTab
} from './services/sessionService';

export default function App() {
  // 1. Auth & Navigation State
  const [users, setUsers] = useState<AppUser[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = safeStorage.getItem('citrine_current_user');
      const expiry = safeStorage.getItem('citrine_token_expiry');
      if (saved && expiry) {
        if (Date.now() < Number(expiry)) {
          return JSON.parse(saved);
        }
      }
      clearSecureSession();
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const currentUserRef = useRef<AppUser | null>(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Cryptographic integrity check on startup
  useEffect(() => {
    loadSecureSession().then((verifiedUser) => {
      if (!verifiedUser && currentUserRef.current) {
        showToast('Session altérée ou expirée. Veuillez vous reconnecter.', 'error');
        setCurrentUser(null);
      }
    });
  }, []);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      message,
      type
    };
    setToasts(prev => [...prev.slice(-4), newToast]);
    if (type === 'error') {
      soundService.playAlertNotification(0.75);
    }
  }, []);

  const handleDismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // 🛡️ BROWSER PERMISSIONS (extracted to custom hook)
  const {
    devicePermissions,
    showPermissionsBanner,
    handleDismissPermissionsBanner,
    requestGeolocationPermission,
    requestCameraPermission,
    requestNotificationsPermission
  } = useDevicePermissions(showToast);

  const handleSetCurrentUser = (user: AppUser | null) => {
    setCurrentUser(user);
    if (user) {
      storeSecureSession(user);
      const role = normalizeRole(user.role);
      setCurrentRole(role);
      if (role === 'Employé') {
        setActiveTab('employee_portal');
      } else if (role === 'Responsable') {
        setActiveTab('presences');
      } else {
        setActiveTab('dashboard');
      }
    } else {
      clearSecureSession();
    }
  };
  const [showKioskModal, setShowKioskModal] = useState<boolean>(false);
  const [isDataSaverActive, setIsDataSaverActive] = useState<boolean>(dataSaverService.isEnabled());
  const [showPushModal, setShowPushModal] = useState<boolean>(false);

  useEffect(() => {
    const unsub = dataSaverService.subscribe((enabled) => {
      setIsDataSaverActive(enabled);
    });
    return () => {
      if (typeof unsub === 'function') (unsub as any)();
    };
  }, []);

  // 🛡️ PERSISTENT STORAGE INITIALIZATION (Prevent OS/browser from purging IndexedDB)
  useEffect(() => {
    offlineService.requestPersistentStorage().catch(err => {
      console.warn("Storage persistence initialization error:", err);
    });
  }, []);

  const [currentRole, setCurrentRole] = useState<Role>('Administrateur');
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    let hash = '';
    try {
      if (typeof window !== 'undefined' && window.location && typeof window.location.hash === 'string') {
        hash = window.location.hash.replace(/^#\/?/, '');
      }
    } catch {}
    const validTabs: TabType[] = [
      'dashboard', 'employee_portal', 'calls', 'presences', 'statistics', 'tasks', 
      'reminders', 'logs', 'collaborators', 'discipline', 'documents', 'communications', 
      'finances', 'inventory', 'partners', 'users', '', 'settings', 'profile'
    ];
    if (validTabs.includes(hash as TabType)) {
      return hash as TabType;
    }
    return 'dashboard';
  });

  // Bidirectional routing via Hash URLs
  useEffect(() => {
    const handleHashChange = () => {
      let hash = '' as TabType;
      try {
        if (typeof window !== 'undefined' && window.location && typeof window.location.hash === 'string') {
          hash = window.location.hash.replace(/^#\/?/, '') as TabType;
        }
      } catch {}
      const validTabs: TabType[] = [
        'dashboard', 'employee_portal', 'calls', 'presences', 'statistics', 'tasks', 
        'reminders', 'logs', 'collaborators', 'discipline', 'documents', 'communications', 
        'finances', 'inventory', 'partners', 'users', '', 'settings', 'profile'
      ];
      if (validTabs.includes(hash)) {
        setActiveTab(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  useEffect(() => {
    if (activeTab) {
      window.location.hash = `/${activeTab}`;
    }
  }, [activeTab]);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('emp-1'); // Jean Dupont is preselected
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // 📞 VoIP Inter-Colleague Calling State
  const [incomingCall, setIncomingCall] = useState<VoIPCall | null>(null);
  const [activeCall, setActiveCall] = useState<VoIPCall | null>(null);
  const [remoteMediaStream, setRemoteMediaStream] = useState<MediaStream | null>(null);
  const [onlinePresences, setOnlinePresences] = useState<UserOnlinePresence[]>([]);
  const [callHistory, setCallHistory] = useState<VoIPCall[]>([]);

  // Module Configuration / Feature Flags state
  const [moduleConfig, setModuleConfig] = useState<CompanyModuleConfig>(() => {
    try {
      const saved = safeStorage.getItem('citrine_module_config');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      return DEFAULT_MODULE_CONFIG;
    }
    return DEFAULT_MODULE_CONFIG;
  });

  const handleUpdateModuleConfig = (newConfig: CompanyModuleConfig) => {
    setModuleConfig(newConfig);
    safeStorage.setItem('citrine_module_config', JSON.stringify(newConfig));
    saveDocument(COLLECTIONS.COMPANY_SETTINGS, { ...newConfig, id: 'main_config' });
    updateCompanyHQLocation({
      name: newConfig.hqName,
      address: newConfig.hqAddress,
      latitude: newConfig.hqLatitude,
      longitude: newConfig.hqLongitude
    });
  };

  // 2. Real Time State
  const [currentTime, setCurrentTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      const nextTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      setCurrentTime(prev => (prev !== nextTime ? nextTime : prev));
    }, 1000 * 15); // Check every 15 seconds, update only on change
    return () => clearInterval(timer);
  }, []); 

  // 3. Core Database Entities State (Backed by Firestore and localStorage cache)
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem('citrine_employees');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [presences, setPresences] = useState<Presence[]>(() => {
    try {
      const saved = localStorage.getItem('citrine_presences');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('citrine_tasks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    try {
      const saved = localStorage.getItem('citrine_reminders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [notifications, setNotifications] = useState<NotificationLog[]>(() => {
    try {
      const saved = localStorage.getItem('citrine_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [documents, setDocuments] = useState<GeneratedDocument[]>(() => {
    try {
      const saved = localStorage.getItem('citrine_documents');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [salaryDebts, setSalaryDebts] = useState<EmployeeSalaryDebt[]>(() => {
    try {
      const saved = localStorage.getItem('citrine_salary_debts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>(() => {
    try {
      const saved = localStorage.getItem('citrine_salary_payments');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('citrine_financial_transactions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('citrine_inventory_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      {
        id: 'inv-1',
        designation: 'Ordinateur Portable Dell Latitude 5420',
        quantity: 5,
        status: 'neuf',
        location: 'Bureau Principal HQ - Salle 102',
        category: 'Matériel Informatique',
        reference: 'INV-2026-001',
        unitPrice: 650000,
        notes: 'Matériel configuré avec suite bureautique et VPN.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'inv-2',
        designation: 'Fauteuil de bureau ergonomique Mesh Black',
        quantity: 12,
        status: 'bon_etat',
        location: 'Bureau Principal HQ - Open Space',
        category: 'Mobilier & Bureau',
        reference: 'INV-2026-002',
        unitPrice: 85000,
        notes: 'Acheté en 2025, parfait état de marche.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'inv-3',
        designation: 'Vidéoprojecteur Epson Full HD EB-FH52',
        quantity: 2,
        status: 'usage',
        location: 'Salle de Réunion Douala',
        category: 'Matériel Informatique',
        reference: 'INV-2026-003',
        unitPrice: 380000,
        notes: 'Lampe vérifiée en Juin 2026.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'inv-4',
        designation: 'Imprimante Multifonction HP LaserJet Pro',
        quantity: 1,
        status: 'en_reparation',
        location: 'Atelier Maintenance Akwa',
        category: 'Matériel Informatique',
        reference: 'INV-2026-004',
        unitPrice: 240000,
        notes: 'Changement du rouleau d\'entraînement de papier en cours.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  });
  const [partners, setPartners] = useState<Partner[]>(() => {
    try {
      const saved = localStorage.getItem('citrine_partners');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      {
        id: 'part-1',
        lastName: 'Fotso',
        firstName: 'Jean-Paul',
        phone: '+237 699 11 22 33',
        email: 'jeanpaul.fotso@gmail.com',
        category: 'Motoman',
        status: 'actif',
        address: 'Douala, Makepe',
        notes: 'Chauffeur moto principal pour livraisons urgentes centre-ville.',
        createdAt: new Date().toISOString()
      },
      {
        id: 'part-2',
        lastName: 'Mvondo',
        firstName: 'Emmanuel',
        phone: '+237 677 88 99 00',
        email: 'emmanuel.mvondo@yahoo.fr',
        category: 'Taximan',
        status: 'actif',
        address: 'Douala, Akwa',
        notes: 'Taxi partenaire courses direction aéroport et réunions clients.',
        createdAt: new Date().toISOString()
      },
      {
        id: 'part-3',
        lastName: 'Nkamgang',
        firstName: 'Marie Claire',
        phone: '+237 655 44 33 22',
        email: 'marieclaire@outlook.com',
        category: 'Particulier',
        status: 'futur_partenaire',
        address: 'Yaoundé, Bastos',
        notes: 'Prospect intéressé par nos services de sous-traitance administrative.',
        createdAt: new Date().toISOString()
      },
      {
        id: 'part-4',
        lastName: 'Global Service',
        firstName: 'SARL',
        phone: '+237 633 22 11 00',
        email: 'contact@globalservice.cm',
        category: 'Fournisseur',
        status: 'actif',
        address: 'Douala, Bonanjo',
        notes: 'Fournisseur de matériel bureautique et consommables.',
        createdAt: new Date().toISOString()
      },
      {
        id: 'part-5',
        lastName: 'Tchap',
        firstName: 'Eric',
        phone: '+237 688 99 00 11',
        email: 'eric.tchap@techservices.cm',
        category: 'Prestataire',
        status: 'inactif',
        address: 'Douala, Bepanda',
        notes: 'Maintenance réseau et câblage informatique.',
        createdAt: new Date().toISOString()
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('citrine_partners', JSON.stringify(partners));
  }, [partners]);

  // 🚨 Disciplinary Incidents State
  const [incidents, setIncidents] = useState<DisciplinaryIncident[]>(() => {
    try {
      const saved = localStorage.getItem('citrine_disciplinary_incidents');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      {
        id: 'disc-demo-1',
        employeeId: 'emp-1',
        employeeName: 'Jean Dupont',
        employeeRole: 'Directeur Général',
        employeeDepartment: 'Direction Générale & Stratégie',
        date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
        category: 'retard_repete',
        severity: 'faible',
        title: 'Retards répétés lors des réunions opérationnelles',
        description: 'Constat de retards systématiques de plus de 25 minutes aux réunions de coordination hebdomadaires.',
        location: 'Siège Social Douala',
        reportedBy: 'Conseil de Direction',
        reportedByRole: 'Administrateur',
        status: 'sanctionne',
        sanctionType: 'rappel_a_l_ordre',
        sanctionDate: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
        sanctionDetails: 'Rappel courtois des engagements de ponctualité de la gouvernance.',
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        officialLetterRef: 'DISC-2026-001'
      }
    ];
  });

  const handleUpdateIncidents = (newIncidents: DisciplinaryIncident[]) => {
    setIncidents(newIncidents);
    localStorage.setItem('citrine_disciplinary_incidents', JSON.stringify(newIncidents));
    syncListToFirestore(COLLECTIONS.DISCIPLINARY_INCIDENTS, newIncidents);
  };

  // 🏢 Departments State
  const [departments, setDepartments] = useState<DepartmentNode[]>(() => {
    try {
      const saved = localStorage.getItem('citrine_departments');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      {
        id: 'dept-exec',
        name: 'Direction Générale & Stratégie',
        code: 'DG',
        description: 'Pilotage stratégique, gouvernance et investissements',
        color: 'slate',
        parentDepartmentId: null
      },
      {
        id: 'dept-ops',
        name: 'Opérations, Flotte & Logistique',
        code: 'OPS',
        description: 'Gestion de la flotte, chauffeurs, régulation et terrain',
        color: 'emerald',
        parentDepartmentId: 'dept-exec'
      },
      {
        id: 'dept-tech',
        name: 'Technologie & Systèmes d\'Information',
        code: 'TECH',
        description: 'Développement d’applications, infrastructure et données',
        color: 'indigo',
        parentDepartmentId: 'dept-exec'
      },
      {
        id: 'dept-rh',
        name: 'Ressources Humaines & Juridique',
        code: 'RH',
        description: 'Gestion des talents, paie, contrats et conformité',
        color: 'amber',
        parentDepartmentId: 'dept-exec'
      },
      {
        id: 'dept-fin',
        name: 'Finance & Contrôle de Gestion',
        code: 'FIN',
        description: 'Trésorerie, comptabilité, recouvrement et budgets',
        color: 'cyan',
        parentDepartmentId: 'dept-exec'
      }
    ];
  });

  const handleUpdateDepartments = (newDepts: DepartmentNode[]) => {
    setDepartments(newDepts);
    localStorage.setItem('citrine_departments', JSON.stringify(newDepts));
    syncListToFirestore(COLLECTIONS.DEPARTMENTS, newDepts);
  };

  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(true);

  // Audio state for background alarm popups
  const [activeTriggeredAlarm, setActiveTriggeredAlarm] = useState<Reminder | null>(null);

  // Firestore initialization & real-time listeners
  useEffect(() => {
    seedUsersIfEmpty().then((fetchedUsers) => {
      if (fetchedUsers && fetchedUsers.length > 0) {
        setUsers(fetchedUsers);
      }
    });

    // Subscriptions
    const unsubUsers = subscribeToUsers((data) => {
      if (data && data.length > 0) {
        setUsers(data);

        // Synchronize employees with their user details ONLY for the logged-in current user
        // (this allows them to update their name/phone/avatar in ProfileModal, but prevents admin's edits on others from being reverted by old user accounts)
        setEmployees(prevEmployees => {
          if (!prevEmployees || prevEmployees.length === 0) return prevEmployees;
          const activeUser = currentUserRef.current;
          if (!activeUser) return prevEmployees;

          let changed = false;
          const nextEmployees = prevEmployees.map(emp => {
            // ONLY sync if the employee belongs to the currently logged in user
            if ((emp.email || '').toLowerCase() === (activeUser.email || '').toLowerCase()) {
              const matchedUser = data.find(u => (u.email || '').toLowerCase() === (emp.email || '').toLowerCase());
              if (matchedUser) {
                const cleanedPhone = matchedUser.phone || emp.phone;
                const cleanedName = matchedUser.name || emp.name;
                const cleanedAvatar = matchedUser.avatarUrl || emp.avatarUrl;
                if (emp.name !== cleanedName || emp.phone !== cleanedPhone || emp.avatarUrl !== cleanedAvatar) {
                  changed = true;
                  return {
                    ...emp,
                    name: cleanedName,
                    phone: cleanedPhone,
                    avatarUrl: cleanedAvatar
                  };
                }
              }
            }
            return emp;
          });
          if (changed) {
            // Save updated employee list to firestore
            setTimeout(() => {
              syncListToFirestore(COLLECTIONS.EMPLOYEES, nextEmployees);
            }, 0);
            return nextEmployees;
          }
          return prevEmployees;
        });

        // Sync currentUser state if they are in the fetched users list and their info changed
        setCurrentUser(prevUser => {
          if (!prevUser) return null;
          const matched = data.find(u => u.id === prevUser.id);
          if (matched) {
            if (matched.status !== 'actif') {
              clearSecureSession();
              showToast("Votre compte a été désactivé par l'administrateur.", 'error');
              return null;
            }
            // Compare fields to avoid unnecessary state triggers
            if (
              matched.name !== prevUser.name ||
              matched.department !== prevUser.department ||
              matched.phone !== prevUser.phone ||
              matched.avatarUrl !== prevUser.avatarUrl ||
              matched.role !== prevUser.role ||
              matched.status !== prevUser.status ||
              matched.passwordHash !== prevUser.passwordHash
            ) {
              storeSecureSession(matched);
              return matched;
            }
          }
          return prevUser;
        });
      }
    });

    const unsubEmp = subscribeToCollection<Employee>(COLLECTIONS.EMPLOYEES, (data) => {
      if (data) setEmployees(data);
    });
    // 🚀 VOLUMETRY OPTIMIZATION: Load recent 150 presence records instead of unbounded historical log
    const unsubPres = subscribeToRecentCollection<Presence>(COLLECTIONS.PRESENCES, 150, 'date', 'desc', (data) => {
      if (data) setPresences(data);
    });
    const unsubTasks = subscribeToCollection<Task>(COLLECTIONS.TASKS, (data) => {
      if (data) setTasks(data);
    });
    const unsubRem = subscribeToCollection<Reminder>(COLLECTIONS.REMINDERS, (data) => {
      if (data) setReminders(data);
    });
    const unsubDocs = subscribeToCollection<GeneratedDocument>(COLLECTIONS.DOCUMENTS, (data) => {
      if (data) setDocuments(data);
    });
    const unsubSalDebts = subscribeToCollection<EmployeeSalaryDebt>(COLLECTIONS.EMPLOYEE_SALARY_DEBT, (data) => {
      if (data) setSalaryDebts(data);
    });
    const unsubSalPay = subscribeToCollection<SalaryPayment>(COLLECTIONS.SALARY_PAYMENTS, (data) => {
      if (data) setSalaryPayments(data);
    });
    const unsubFinTx = subscribeToCollection<FinancialTransaction>(COLLECTIONS.FINANCIAL_TRANSACTIONS, (data) => {
      if (data) setFinancialTransactions(data);
    });
    const unsubInv = subscribeToCollection<InventoryItem>(COLLECTIONS.INVENTORY, (data) => {
      if (data && data.length > 0) setInventoryItems(data);
    });
    const unsubNotifs = subscribeToCollection<NotificationLog>(COLLECTIONS.NOTIFICATIONS, (data) => {
      if (data) setNotifications(data);
    });
    const unsubIncidents = subscribeToCollection<DisciplinaryIncident>(COLLECTIONS.DISCIPLINARY_INCIDENTS, (data) => {
      if (data && data.length > 0) setIncidents(data);
    });
    const unsubDepts = subscribeToCollection<DepartmentNode>(COLLECTIONS.DEPARTMENTS, (data) => {
      if (data && data.length > 0) setDepartments(data);
    });
    const unsubCompany = subscribeToCollection<CompanyModuleConfig & { id: string }>(COLLECTIONS.COMPANY_SETTINGS, (data) => {
      if (data && data.length > 0) {
        const main = data.find(c => c.id === 'main_config') || data[0];
        if (main) {
          setModuleConfig(main);
          localStorage.setItem('citrine_module_config', JSON.stringify(main));
          updateCompanyHQLocation({
            name: main.hqName,
            address: main.hqAddress,
            latitude: main.hqLatitude,
            longitude: main.hqLongitude
          });
        }
      } else {
        // Seed database with default config including a valid kiosk PIN
        const initialPin = generateKioskPinCode();
        const initialConfig = {
          ...DEFAULT_MODULE_CONFIG,
          kioskPin: initialPin,
          id: 'main_config'
        };
        setModuleConfig(initialConfig);
        localStorage.setItem('citrine_module_config', JSON.stringify(initialConfig));
        saveDocument(COLLECTIONS.COMPANY_SETTINGS, initialConfig).catch((err) => {
          console.error("Failed to seed initial company settings in Firestore:", err);
        });
      }
    });

    const handleDbRebuilt = () => {
      try {
        const u = localStorage.getItem('citrine_users');
        if (u) setUsers(JSON.parse(u));
        const e = localStorage.getItem('citrine_employees');
        if (e) setEmployees(JSON.parse(e));
        const p = localStorage.getItem('citrine_presences');
        if (p) setPresences(JSON.parse(p));
        const t = localStorage.getItem('citrine_tasks');
        if (t) setTasks(JSON.parse(t));
        const r = localStorage.getItem('citrine_reminders');
        if (r) setReminders(JSON.parse(r));
        const n = localStorage.getItem('citrine_notifications');
        if (n) setNotifications(JSON.parse(n));
        const d = localStorage.getItem('citrine_documents');
        if (d) setDocuments(JSON.parse(d));
        const sd = localStorage.getItem('citrine_salary_debts');
        if (sd) setSalaryDebts(JSON.parse(sd));
        const sp = localStorage.getItem('citrine_salary_payments');
        if (sp) setSalaryPayments(JSON.parse(sp));
        const ft = localStorage.getItem('citrine_financial_transactions');
        if (ft) setFinancialTransactions(JSON.parse(ft));
        const inv = localStorage.getItem('citrine_inventory_items');
        if (inv) setInventoryItems(JSON.parse(inv));
        const pt = localStorage.getItem('citrine_partners');
        if (pt) setPartners(JSON.parse(pt));
        const di = localStorage.getItem('citrine_disciplinary_incidents');
        if (di) setIncidents(JSON.parse(di));
        const dep = localStorage.getItem('citrine_departments');
        if (dep) setDepartments(JSON.parse(dep));
        const cfg = localStorage.getItem('citrine_module_config');
        if (cfg) setModuleConfig(JSON.parse(cfg));
      } catch (err) {
        console.warn('Error refreshing state after rebuild:', err);
      }
    };
    window.addEventListener('citrine_db_rebuilt', handleDbRebuilt);

    return () => {
      window.removeEventListener('citrine_db_rebuilt', handleDbRebuilt);
      unsubUsers();
      unsubEmp();
      unsubPres();
      unsubTasks();
      unsubRem();
      unsubDocs();
      unsubSalDebts();
      unsubSalPay();
      unsubFinTx();
      unsubInv();
      unsubNotifs();
      unsubIncidents();
      unsubDepts();
      unsubCompany();
    };
  }, []);

  // Sync users & current user to localStorage
  useEffect(() => {
    localStorage.setItem('citrine_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      storeSecureSession(currentUser);
      const normalized = normalizeRole(currentUser.role);
      setCurrentRole(normalized);
      if (normalized === 'Employé' && activeTab === 'dashboard') {
        setActiveTab('employee_portal');
      }
    } else {
      clearSecureSession();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && !canAccessTab(currentUser.role, activeTab)) {
      const fallbackTab: TabType = currentUser.role === 'employé' ? 'employee_portal' : 'dashboard';
      setActiveTab(fallbackTab);
      showToast('Accès restreint pour votre niveau de permission.', 'error');
      return;
    }

    // Check if current tab is disabled by module configuration
    const isTabDisabledByModule = 
      (activeTab === 'discipline' && moduleConfig.enableDiscipline === false) ||
      (activeTab === 'statistics' && moduleConfig.enableStatistics === false) ||
      (activeTab === 'calls' && (moduleConfig.enableTeamCalls === false || moduleConfig.enableCalls === false)) ||
      (activeTab === 'documents' && moduleConfig.enableDocuments === false) ||
      (activeTab === 'communications' && moduleConfig.enableCommunications === false) ||
      (activeTab === 'finances' && moduleConfig.enableFinances === false) ||
      (activeTab === 'inventory' && moduleConfig.enableInventory === false) ||
      (activeTab === 'partners' && moduleConfig.enablePartners === false) ||
      (activeTab === '' && moduleConfig.enable === false) ||
      (activeTab === 'logs' && moduleConfig.enableLogs === false);

    if (isTabDisabledByModule) {
      const fallbackTab: TabType = currentUser?.role === 'employé' ? 'employee_portal' : 'dashboard';
      setActiveTab(fallbackTab);
    }
  }, [currentUser, activeTab, moduleConfig]);

  // 📞 VoIP Subscriptions and Presence Tracking
  useEffect(() => {
    if (!currentUser) return;
    callSignalingService.setPresence(currentUser, activeCall ? 'in_call' : 'online');

    const interval = setInterval(() => {
      callSignalingService.setPresence(currentUser, activeCall ? 'in_call' : 'online');
    }, 45000);

    return () => clearInterval(interval);
  }, [currentUser, activeCall]);

  useEffect(() => {
    const unsub = callSignalingService.subscribeToPresences((presences) => {
      setOnlinePresences(presences);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;
    const unsub = callSignalingService.subscribeToIncomingCalls(currentUser.id, (call) => {
      if (activeCall) {
        callSignalingService.rejectCall(call.id);
        return;
      }
      setIncomingCall(call);
    });
    return () => unsub();
  }, [currentUser?.id, activeCall]);

  useEffect(() => {
    if (!currentUser?.id) return;
    const unsub = callSignalingService.subscribeToCallHistory(currentUser.id, (calls) => {
      setCallHistory(calls);
    });
    return () => unsub();
  }, [currentUser?.id]);

  // Real-time synchronization of the active call document (for group participants, invites, status)
  useEffect(() => {
    if (!activeCall?.id) return;
    const callDocRef = doc(db, COLLECTIONS.CALLS, activeCall.id);
    const unsub = onSnapshot(callDocRef, (snap) => {
      if (snap.exists()) {
        const updated = snap.data() as VoIPCall;
        if (updated.status === 'ended' || updated.status === 'rejected') {
          setActiveCall(null);
          setRemoteMediaStream(null);
        } else {
          setActiveCall(prev => prev ? { ...prev, ...updated } : updated);
        }
      }
    });
    return () => unsub();
  }, [activeCall?.id]);

  const handleStartCall = useCallback(async (
    target: { id: string; name: string; email?: string; avatarUrl?: string; role?: string },
    type: CallType
  ) => {
    if (!currentUser) {
      showToast('Veuillez vous connecter pour passer un appel.', 'error');
      return;
    }
    if (activeCall) {
      showToast('Vous êtes déjà en communication.', 'error');
      return;
    }
    try {
      showToast(`Appel ${type === 'video' ? 'vidéo' : 'audio'} vers ${target.name}...`, 'success');
      const initiated = await callSignalingService.initiateCall({
        caller: currentUser,
        callee: target,
        type,
        onConnected: () => {
          showToast(`Connecté avec ${target.name}`, 'success');
          setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
        },
        onEnded: (reason) => {
          showToast(`Appel terminé (${reason})`, 'success');
          setActiveCall(null);
          setRemoteMediaStream(null);
        },
        onRemoteStream: (stream) => {
          setRemoteMediaStream(stream);
        }
      });
      (initiated as any).currentUserName = currentUser.name;
      setActiveCall(initiated);
    } catch (err: any) {
      console.error('Call initiation error:', err);
      showToast(err.message || "Impossible d'accéder au micro ou à la caméra.", 'error');
      setActiveCall(null);
      setRemoteMediaStream(null);
    }
  }, [currentUser, activeCall, showToast]);

  const handleAcceptIncomingCall = useCallback(async (call: VoIPCall) => {
    if (!currentUser) return;
    setIncomingCall(null);
    (call as any).currentUserName = currentUser.name;
    setActiveCall({ ...call, status: 'connected' });

    const isGroupInvite = call.isGroupCall || (call.participants && call.participants.some(p => p.id === currentUser.id));

    try {
      if (isGroupInvite) {
        await callSignalingService.joinGroupCall(call, currentUser, {
          onConnected: () => {
            showToast(`Vous avez rejoint l'appel d'équipe`, 'success');
          },
          onEnded: (reason) => {
            showToast(`Appel terminé (${reason})`, 'success');
            setActiveCall(null);
            setRemoteMediaStream(null);
          },
          onRemoteStream: (stream) => {
            setRemoteMediaStream(stream);
          }
        });
      } else {
        await callSignalingService.answerCall(call, {
          onConnected: () => {
            showToast(`Communication établie avec ${call.callerName}`, 'success');
          },
          onEnded: (reason) => {
            showToast(`Appel terminé (${reason})`, 'success');
            setActiveCall(null);
            setRemoteMediaStream(null);
          },
          onRemoteStream: (stream) => {
            setRemoteMediaStream(stream);
          }
        });
      }
    } catch (err: any) {
      console.error('Answer call error:', err);
      showToast("Erreur lors de la prise d'appel", 'error');
      setActiveCall(null);
      setRemoteMediaStream(null);
    }
  }, [currentUser, showToast]);

  const handleRejectIncomingCall = useCallback(async (call: VoIPCall) => {
    setIncomingCall(null);
    await callSignalingService.rejectCall(call.id, currentUser?.id);
    showToast("Appel refusé", 'success');
  }, [currentUser?.id, showToast]);

  const handleEndActiveCall = useCallback(async (durationSeconds: number) => {
    if (activeCall) {
      await callSignalingService.endCall(activeCall.id, durationSeconds, currentUser?.id);
    }
    setActiveCall(null);
    setRemoteMediaStream(null);
    showToast("Appel terminé", 'success');
  }, [activeCall, currentUser?.id, showToast]);

  // Update State + Firestore Helpers
  const handleUpdateEmployees = (newEmp: Employee[]) => {
    // 1. Identify deleted employees and delete from Firestore and delete associated users
    const deleted = employees.filter(old => !newEmp.some(n => n.id === old.id));
    deleted.forEach(old => {
      deleteDocument(COLLECTIONS.EMPLOYEES, old.id);
      const matchedUser = users.find(u => (u.email || '').toLowerCase() === (old.email || '').toLowerCase());
      if (matchedUser) {
        deleteUser(matchedUser.id);
      }
    });

    // 2. Identify modifications and update corresponding users in the database
    newEmp.forEach(emp => {
      saveDocument(COLLECTIONS.EMPLOYEES, emp);
      const matchedUser = users.find(u => (u.email || '').toLowerCase() === (emp.email || '').toLowerCase());
      if (matchedUser) {
        const mappedRole: UserRole = (emp.roleType === 'sponsor')
          ? 'administrateur'
          : (emp.roleType === 'gestionnaire de projet' ? 'responsable' : 'employé');

        // Automatically deactivate user account if employee has left ('parti') or was dismissed ('renvoye')
        // Automatically reactivate user account if employee status returns to active ('en_poste', 'en_conge', 'suspendu', 'maladie', etc.)
        const targetUserStatus: UserStatus = (emp.status === 'parti' || emp.status === 'renvoye') ? 'inactif' : 'actif';

        if (
          matchedUser.name !== emp.name ||
          matchedUser.phone !== emp.phone ||
          matchedUser.avatarUrl !== emp.avatarUrl ||
          matchedUser.role !== mappedRole ||
          matchedUser.status !== targetUserStatus ||
          (matchedUser.email || '').toLowerCase() !== (emp.email || '').toLowerCase()
        ) {
          const updatedUser: AppUser = {
            ...matchedUser,
            name: emp.name,
            email: emp.email.trim().toLowerCase(),
            phone: emp.phone,
            avatarUrl: emp.avatarUrl,
            role: mappedRole,
            status: targetUserStatus
          };
          saveUser(updatedUser);
        }
      }
    });

    setEmployees(newEmp);
    syncListToFirestore(COLLECTIONS.EMPLOYEES, newEmp);
  };

  const handleUpdatePresences = (newPres: Presence[]) => {
    const deleted = presences.filter(old => !newPres.some(n => n.id === old.id));
    deleted.forEach(old => {
      deleteDocument(COLLECTIONS.PRESENCES, old.id);
    });
    setPresences(newPres);
    syncListToFirestore(COLLECTIONS.PRESENCES, newPres);
  };

  const handleUpdateUsers = (newUsers: AppUser[]) => {
    const deleted = users.filter(old => !newUsers.some(n => n.id === old.id));
    deleted.forEach(old => {
      deleteUser(old.id);
    });
    setUsers(newUsers);
    localStorage.setItem('citrine_users', JSON.stringify(newUsers));
  };

  const handleUpdateTasks = (newTasks: Task[]) => {
    const deleted = tasks.filter(old => !newTasks.some(n => n.id === old.id));
    deleted.forEach(old => {
      deleteDocument(COLLECTIONS.TASKS, old.id);
    });

    const stampedTasks = newTasks.map(newTask => {
      const existingTask = tasks.find(t => t.id === newTask.id);
      const isNew = !existingTask;
      const isModified = existingTask && JSON.stringify(existingTask) !== JSON.stringify(newTask);

      if (isNew || isModified) {
        return {
          ...newTask,
          lastUpdatedByRole: currentRole,
          lastUpdatedTime: new Date().toISOString()
        };
      }
      return newTask;
    });

    setTasks(stampedTasks);
    syncListToFirestore(COLLECTIONS.TASKS, stampedTasks);
  };

  const handleUpdateReminders = (newRem: Reminder[]) => {
    const deleted = reminders.filter(old => !newRem.some(n => n.id === old.id));
    deleted.forEach(old => {
      deleteDocument(COLLECTIONS.REMINDERS, old.id);
    });
    setReminders(newRem);
    syncListToFirestore(COLLECTIONS.REMINDERS, newRem);
  };

  const handleUpdateDocuments = (newDocs: GeneratedDocument[]) => {
    const deleted = documents.filter(old => !newDocs.some(n => n.id === old.id));
    deleted.forEach(old => {
      deleteDocument(COLLECTIONS.DOCUMENTS, old.id);
    });
    setDocuments(newDocs);
    syncListToFirestore(COLLECTIONS.DOCUMENTS, newDocs);
  };

  const handleUpdateSalaryDebts = (newDebts: EmployeeSalaryDebt[]) => {
    const deleted = salaryDebts.filter(old => !newDebts.some(n => n.id === old.id));
    deleted.forEach(old => {
      deleteDocument(COLLECTIONS.EMPLOYEE_SALARY_DEBT, old.id);
    });
    setSalaryDebts(newDebts);
    syncListToFirestore(COLLECTIONS.EMPLOYEE_SALARY_DEBT, newDebts);
  };

  const handleUpdateSalaryPayments = (newPayments: SalaryPayment[]) => {
    const deleted = salaryPayments.filter(old => !newPayments.some(n => n.id === old.id));
    deleted.forEach(old => {
      deleteDocument(COLLECTIONS.SALARY_PAYMENTS, old.id);
    });
    setSalaryPayments(newPayments);
    syncListToFirestore(COLLECTIONS.SALARY_PAYMENTS, newPayments);
  };

  const handleUpdateFinancialTransactions = (newTx: FinancialTransaction[]) => {
    const deleted = financialTransactions.filter(old => !newTx.some(n => n.id === old.id));
    deleted.forEach(old => {
      deleteDocument(COLLECTIONS.FINANCIAL_TRANSACTIONS, old.id);
    });
    setFinancialTransactions(newTx);
    syncListToFirestore(COLLECTIONS.FINANCIAL_TRANSACTIONS, newTx);
  };

  const handleUpdateInventoryItems = (newItems: InventoryItem[]) => {
    const deleted = inventoryItems.filter(old => !newItems.some(n => n.id === old.id));
    deleted.forEach(old => {
      deleteDocument(COLLECTIONS.INVENTORY, old.id);
    });
    setInventoryItems(newItems);
    syncListToFirestore(COLLECTIONS.INVENTORY, newItems);
  };

  const handleUpdateNotifications = (newNotifs: NotificationLog[]) => {
    // Find deleted
    const deleted = notifications.filter(old => !newNotifs.some(n => n.id === old.id));
    deleted.forEach(old => {
      deleteDocument(COLLECTIONS.NOTIFICATIONS, old.id);
    });
    
    // Find modified or new
    newNotifs.forEach(n => {
      saveDocument(COLLECTIONS.NOTIFICATIONS, n);
    });
    setNotifications(newNotifs);
    localStorage.setItem('citrine_notifications', JSON.stringify(newNotifs));
  };

  const handleAddNotification = (log: NotificationLog) => {
    const logWithRead: NotificationLog = {
      ...log,
      read: log.read !== undefined ? log.read : false
    };

    setNotifications(prev => {
      if (prev.some(p => p.id === logWithRead.id)) return prev;
      return [logWithRead, ...prev];
    });
    saveDocument(COLLECTIONS.NOTIFICATIONS, logWithRead);

    // Dispatch Native In-App / Browser Push Notification if enabled and permitted
    const settings = pushNotificationService.getSettings();
    if (settings.enabled && pushNotificationService.getPermissionStatus() === 'granted') {
      const titleLower = logWithRead.title.toLowerCase();
      const contentLower = logWithRead.content.toLowerCase();
      
      let isImportantEvent = false;
      let isTaskAssignmentForMe = false;

      // 1. Creation of collaborator
      if (titleLower.includes('bienvenue sur citrine') || titleLower.includes('identifiants de connexion')) {
        isImportantEvent = true;
      }
      // 2. Creation of partner
      else if (titleLower.includes('[partenaires] nouveau partenaire créé') || titleLower.includes('nouveau partenaire créé') || titleLower.includes('partenaire créé')) {
        isImportantEvent = true;
      }
      // 3. Presence Arrival / Clock-in
      else if (
        titleLower.includes('heure d\'arrivée') || 
        titleLower.includes('arrivée') || 
        titleLower.includes('arrivee') ||
        contentLower.includes('badgé [heure d\'arrivée]') ||
        contentLower.includes('enregistré [arrivée]') ||
        contentLower.includes('marqué son arrivée')
      ) {
        isImportantEvent = true;
      }
      // 4. Presence Departure / Clock-out
      else if (
        titleLower.includes('heure de départ') || 
        titleLower.includes('départ') || 
        titleLower.includes('depart') ||
        contentLower.includes('badgé [heure de départ]') ||
        contentLower.includes('enregistré [départ]') ||
        contentLower.includes('rentrer à la maison') ||
        contentLower.includes('rentrer') ||
        contentLower.includes('marqué son départ')
      ) {
        isImportantEvent = true;
      }
      // 5. Material Assignment
      else if (titleLower.includes('matériel assigné') || titleLower.includes('materiel assigne') || titleLower.includes('assigné à') || titleLower.includes('assigne a')) {
        isImportantEvent = true;
      }
      // 6. Task Completion
      else if (titleLower.includes('tâche complétée') || titleLower.includes('tache completee') || titleLower.includes('complétée') || titleLower.includes('completee') || titleLower.includes('tâche terminée') || titleLower.includes('tache terminee')) {
        isImportantEvent = true;
      }
      // 7. Task Assigned
      else if (titleLower.includes('tâche assignée') || titleLower.includes('tâche réassignée') || titleLower.includes('tache assignee') || titleLower.includes('tache reassignee')) {
        try {
          const payloadObj = JSON.parse(logWithRead.payload || '{}');
          const activeEmp = employees.find(e => (e.email || '').toLowerCase() === (currentUser?.email || '').toLowerCase());
          
          if (payloadObj && (payloadObj.event === 'task_assigned' || payloadObj.taskId)) {
            const isAssignedToMe = activeEmp && payloadObj.assignedTo === activeEmp.id;
            const assignedBySomeoneElse = payloadObj.assignedBy !== (currentUser?.name || activeEmp?.name);
            
            if (isAssignedToMe && assignedBySomeoneElse) {
              isTaskAssignmentForMe = true;
            }
          }
        } catch (e) {
          const activeEmp = employees.find(e => (e.email || '').toLowerCase() === (currentUser?.email || '').toLowerCase());
          if (activeEmp) {
            const containsMyName = (logWithRead.recipient || '').toLowerCase().includes((activeEmp.name || '').toLowerCase());
            const containsSomeoneElseCreator = !(logWithRead.content || '').toLowerCase().includes(`par ${(activeEmp.name || '').toLowerCase()}`);
            if (containsMyName && containsSomeoneElseCreator) {
              isTaskAssignmentForMe = true;
            }
          }
        }
      }

      const isManager = currentRole === 'Administrateur' || currentRole === 'Responsable';
      
      let shouldShowPush = false;
      if (isManager && isImportantEvent) {
        shouldShowPush = true;
      } else if (isTaskAssignmentForMe) {
        shouldShowPush = true;
      }

      if (shouldShowPush) {
        pushNotificationService.sendNotification(logWithRead.title, {
          body: logWithRead.content,
          tag: logWithRead.id,
          requireInteraction: isImportantEvent || isTaskAssignmentForMe
        });
      }
    }
  };

  // Sync to LocalStorage for offline cache
  useEffect(() => {
    localStorage.setItem('citrine_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('citrine_inventory_items', JSON.stringify(inventoryItems));
  }, [inventoryItems]);

  useEffect(() => {
    localStorage.setItem('citrine_presences', JSON.stringify(presences));
  }, [presences]);

  useEffect(() => {
    localStorage.setItem('citrine_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('citrine_reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem('citrine_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('citrine_documents', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('citrine_salary_debts', JSON.stringify(salaryDebts));
  }, [salaryDebts]);

  useEffect(() => {
    localStorage.setItem('citrine_salary_payments', JSON.stringify(salaryPayments));
  }, [salaryPayments]);

  useEffect(() => {
    localStorage.setItem('citrine_financial_transactions', JSON.stringify(financialTransactions));
  }, [financialTransactions]);

  // Web Audio Synth Chime for Background Alarm check
  const playSynthesizedChime = (volume = 0.5) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const playBell = (freq: number, startTime: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 1.5);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + 1.5);
      };

      const now = ctx.currentTime;
      // Beautiful modern notification chime sequence
      playBell(523.25, now);       // C5
      playBell(659.25, now + 0.1); // E5
      playBell(783.99, now + 0.2); // G5
      playBell(1046.50, now + 0.3); // C6
      
    } catch (e) {
      console.warn("Audio blocked by browser gesture", e);
    }
  };

  // Active alarm repeating alarm siren loop (Rings loud and clear until dismissed)
  useEffect(() => {
    if (activeTriggeredAlarm) {
      soundService.startAlarmLoop(2200, 0.9);
    } else {
      soundService.stopAlarmLoop();
    }
    return () => {
      soundService.stopAlarmLoop();
    };
  }, [activeTriggeredAlarm]);

  // Helper to subtract minutes from time (HH:MM)
  const getTriggerTime = (time: string, trigger: string): string => {
    if (trigger === 'none' || trigger === '0m' || trigger === 'exact') return time;
    const [h, m] = time.split(':').map(Number);
    let totalMinutes = h * 60 + m;
    
    if (trigger === '5m') totalMinutes -= 5;
    else if (trigger === '10m') totalMinutes -= 10;
    else if (trigger === '15m') totalMinutes -= 15;
    else if (trigger === '30m') totalMinutes -= 30;
    else if (trigger === '1h') totalMinutes -= 60;
    
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    const newH = Math.floor(totalMinutes / 60) % 24;
    const newM = totalMinutes % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  };

  // 4. Background Alarm Trigger Checker whenever Time updates
  useEffect(() => {
    let alarmTriggered = false;
    let triggeredRem: Reminder | null = null;
    let triggeredPeriodLabel = '';

    const updatedReminders = reminders.map((rem) => {
      // If there is no date or no time, or if stopped, it NEVER rings
      if (!rem.date || !rem.time || rem.stopped) return rem;

      // Get today's local date in YYYY-MM-DD format
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (rem.date !== todayStr) return rem;

      // Extract trigger periods (multiple) or fall back to legacy single trigger
      const periods = rem.triggerPeriods && rem.triggerPeriods.length > 0
        ? rem.triggerPeriods
        : [rem.triggerBefore || 'none'];

      const triggeredPeriods = rem.triggeredPeriods || [];
      let updatedTriggeredPeriods = [...triggeredPeriods];
      let remUpdated = false;

      periods.forEach((period) => {
        if (triggeredPeriods.includes(period)) return;

        const triggerTime = getTriggerTime(rem.time!, period);
        if (triggerTime === currentTime) {
          alarmTriggered = true;
          triggeredRem = rem;
          
          let label = "À l'échéance";
          if (period === '5m') label = "5m avant";
          else if (period === '10m') label = "10m avant";
          else if (period === '15m') label = "15m avant";
          else if (period === '30m') label = "30m avant";
          else if (period === '1h') label = "1h avant";
          
          triggeredPeriodLabel = label;
          updatedTriggeredPeriods.push(period);
          remUpdated = true;
        }
      });

      if (remUpdated) {
        const allTriggered = periods.every(p => updatedTriggeredPeriods.includes(p));
        return {
          ...rem,
          triggeredPeriods: updatedTriggeredPeriods,
          triggered: allTriggered
        };
      }

      return rem;
    });

    if (alarmTriggered && triggeredRem) {
      const activeRemWithLabel = {
        ...(triggeredRem as Reminder),
        note: `${(triggeredRem as Reminder).note} (${triggeredPeriodLabel})`
      };
      setActiveTriggeredAlarm(activeRemWithLabel);
      setReminders(updatedReminders);

      // Dispatch Native Push Notification for Reminder
      const settings = pushNotificationService.getSettings();
      if (settings.enabled && settings.notifyOnReminder && pushNotificationService.getPermissionStatus() === 'granted') {
        pushNotificationService.sendNotification("⏰ Rappel d'Événement Citrine Management", {
          body: `${activeRemWithLabel.note}${activeRemWithLabel.location ? ` | Lieu: ${activeRemWithLabel.location}` : ''}`,
          tag: `reminder-${activeRemWithLabel.id}-${Date.now()}`,
          requireInteraction: true // Keep it visible until dismissed for important reminders
        });
      }
    }
  }, [currentTime, reminders]);


  const handleResetSystem = () => {
    if (confirm("Vider le cache local et recharger les données en temps réel depuis Firestore ?")) {
      localStorage.removeItem('citrine_employees');
      localStorage.removeItem('citrine_presences');
      localStorage.removeItem('citrine_tasks');
      localStorage.removeItem('citrine_reminders');
      localStorage.removeItem('citrine_notifications');
      localStorage.removeItem('citrine_documents');
      localStorage.removeItem('citrine_salary_debts');
      localStorage.removeItem('citrine_salary_payments');
      localStorage.removeItem('citrine_financial_transactions');
      setEmployees([]);
      setPresences([]);
      setTasks([]);
      setReminders([]);
      setNotifications([]);
      setDocuments([]);
      setSalaryDebts([]);
      setSalaryPayments([]);
      setFinancialTransactions([]);
      setCurrentTime('08:45');
      alert("Cache local vidé ! Les données vont se synchroniser à nouveau depuis Firestore.");
    }
  };

  const handleDismissAlarm = (alarm: Reminder) => {
    const updated = reminders.map(r => {
      if (r.id === alarm.id) {
        const periods = r.triggerPeriods && r.triggerPeriods.length > 0
          ? r.triggerPeriods
          : [r.triggerBefore || 'none'];

        const arrivedPeriods = periods.filter(period => {
          const triggerTime = getTriggerTime(r.time!, period);
          return triggerTime <= currentTime;
        });

        const currentTriggered = r.triggeredPeriods || [];
        const updatedTriggeredPeriods = Array.from(new Set([...currentTriggered, ...arrivedPeriods]));
        const allTriggered = periods.every(p => updatedTriggeredPeriods.includes(p));

        return {
          ...r,
          triggeredPeriods: updatedTriggeredPeriods,
          triggered: allTriggered
        };
      }
      return r;
    });

    soundService.stopAlarmLoop();
    setReminders(updated);
    setActiveTriggeredAlarm(null);
  };

  const pendingPresencesRequestsCount = React.useMemo(() => {
    if (currentRole === 'Employé') return 0;
    let count = 0;
    presences.forEach(presence => {
      const pendingEmg = presence.emergencies?.filter(e => e.status === 'pending' || !e.status).length || 0;
      count += pendingEmg;

      if (presence.correctionReason && (presence.correctionReasonStatus === 'pending' || !presence.correctionReasonStatus)) {
        count += 1;
      }

      if (presence.departureReason && (presence.departureReasonStatus === 'pending' || !presence.departureReasonStatus)) {
        count += 1;
      }
    });
    return count;
  }, [presences, currentRole]);

  if (isInitialLoading) {
    return (
      <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-6 space-y-6">
        <div className="flex flex-col items-center justify-center">
          <CMLogo className="w-20 h-20 drop-shadow-md animate-pulse" />
          <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight mt-4">
            Citrine <span className="text-emerald-600 font-serif italic font-medium">Management</span>
          </h1>
          <p className="text-[11px] text-stone-400 font-bold uppercase tracking-widest mt-1.5">
            Initialisation sécurisée du portail...
          </p>
        </div>
        
        {/* Animated custom micro-spinner */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 shadow-2xs">
          <div className="w-4 h-4 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] font-bold">Synchronisation en temps réel...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginModal
        users={users}
        onLoginSuccess={(user) => handleSetCurrentUser(user)}
        onAddNotification={handleAddNotification}
      />
    );
  }

  const connectedEmployee = employees.find(
    e => (e.email || '').toLowerCase() === (currentUser?.email || '').toLowerCase() || 
         (e.name || '').toLowerCase() === (currentUser?.name || '').toLowerCase()
  );

  const syncCurrentUser = currentUser ? {
    ...currentUser,
    name: connectedEmployee?.name || currentUser.name,
    email: connectedEmployee?.email || currentUser.email,
    phone: connectedEmployee?.phone || currentUser.phone || '',
    avatarUrl: connectedEmployee?.avatarUrl || currentUser.avatarUrl || '',
    department: connectedEmployee?.department || currentUser.department || ''
  } : null;

  const userActiveRemindersCount = currentRole === 'Employé'
    ? reminders.filter(r => r.employeeId === connectedEmployee?.id && !r.triggered && !r.stopped).length
    : reminders.filter(r => !r.triggered && !r.stopped).length;

  return (
    <div className="min-h-screen bg-[#F4F9F6] text-stone-800 font-sans antialiased flex flex-col justify-between" id="app-container">
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
      
      {/* 1. Global Simulation & Alarm Popup */}
      <AnimatePresence>
        {activeTriggeredAlarm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-[100] text-xs"
          >
            <div className="bg-white text-stone-800 rounded-2xl shadow-2xl border border-emerald-100 max-w-sm w-full p-6 text-center space-y-4">
              <div className="mx-auto bg-emerald-50 text-emerald-600 p-3.5 rounded-full w-fit animate-pulse border border-emerald-200">
                <Bell className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-emerald-700 uppercase tracking-widest font-bold">Alerte Programmée Déclenchée</span>
                <h4 className="text-sm font-serif font-semibold text-stone-900 leading-snug">{activeTriggeredAlarm.note}</h4>
                <p className="text-[10px] text-stone-500">
                  Planifié à : {activeTriggeredAlarm.time} ({activeTriggeredAlarm.triggerBefore === 'none' ? 'Heure exacte' : `Pré-alarme ${activeTriggeredAlarm.triggerBefore}`})
                </p>
              </div>
              <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-xl p-2.5 text-[10px] text-stone-800 space-y-1 text-left">
                <p className="font-bold flex items-center gap-1 text-emerald-800">🔊 Carillon de rappel actif</p>
                <p className="text-[9px] text-stone-600 leading-normal">
                  💡 <strong>Règle de coordination :</strong> Éteindre cette alarme ne bloque que celle de l'heure actuelle. Les pré-alarmes suivantes restent programmées et actives, à moins que leur heure d'échéance ne soit également atteinte.
                </p>
              </div>
              <button
                onClick={() => handleDismissAlarm(activeTriggeredAlarm)}
                className="w-full bg-emerald-600 text-white hover:bg-emerald-500 font-bold py-2.5 rounded-xl transition cursor-pointer shadow-xs"
              >
                Éteindre le rappel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Top-bar Dashboard Header in Elegant Warm White Palette */}
      <header className="bg-white border-b border-stone-200/80 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-1.5 sm:py-2 gap-2 sm:gap-4">
            
            {/* Left: Mobile Menu Toggle + Logo / Title */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={() => {
                  haptic.light();
                  setMobileMenuOpen(!mobileMenuOpen);
                }}
                className="p-1.5 text-stone-700 hover:bg-emerald-50 rounded-xl md:hidden border border-stone-200 cursor-pointer transition"
                aria-label="Menu Mobile"
              >
                <Menu className="h-5 w-5 text-stone-700" />
              </button>

              <div 
                className="flex items-center gap-2 sm:gap-3 cursor-pointer"
                onClick={() => setActiveTab(currentUser?.role === 'employé' ? 'employee_portal' : 'dashboard')}
              >
                <CMLogo variant="icon" className="w-8 h-8 sm:w-11 sm:h-11 drop-shadow-sm shrink-0" />
                <div>
                  <h1 className="text-base sm:text-xl font-serif font-semibold text-stone-900 tracking-tight flex items-center gap-1">
                    Hero <span className="text-[#2A7B76] font-serif italic font-medium">Management</span>
                  </h1>
                </div>
              </div>
            </div>

            {/* Right: PWA Install, Push Notifications, Current User Profile Pill */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <PWAInstallButton compact={true} />

              <button
                onClick={() => setShowPushModal(true)}
                className="cursor-pointer px-2.5 py-1.5 sm:px-3 sm:py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 font-bold rounded-xl sm:rounded-2xl text-xs flex items-center gap-1.5 transition shadow-2xs shrink-0"
                title="Activer et tester les Notifications Push Mobile (WhatsApp-Style)"
              >
                <BellRing className="h-4 w-4 text-emerald-600 animate-pulse" />
                <span className="hidden md:inline">Notifications Push</span>
              </button>

              {(currentRole === 'Responsable' || currentRole === 'Administrateur') && (
                <button
                  onClick={() => setShowKioskModal(true)}
                  className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl sm:rounded-2xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
                  title="Ouvrir la Borne de Pointage QR Code (Mode Tablette Accueil)"
                >
                  <Tablet className="h-4 w-4 text-emerald-100" />
                  <span className="hidden sm:inline">Borne QR</span>
                </button>
              )}

              {syncCurrentUser && (
                <div 
                  className="flex items-center gap-2 sm:gap-3 bg-stone-50 hover:bg-emerald-50/70 border border-stone-200 hover:border-emerald-300 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 sm:px-3 shadow-2xs cursor-pointer transition"
                  onClick={() => {
                    haptic.light();
                    setActiveTab('profile');
                  }}
                  title="Consulter mon profil utilisateur"
                >
                  {syncCurrentUser.avatarUrl ? (
                    <img
                      src={syncCurrentUser.avatarUrl || undefined}
                      alt={syncCurrentUser.name}
                      referrerPolicy="no-referrer"
                      className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl object-cover border border-stone-200 shrink-0"
                    />
                  ) : (
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl bg-[#2A7B76] text-white font-bold flex items-center justify-center text-xs shrink-0">
                      {syncCurrentUser.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="text-left">
                    <div className="font-bold text-xs text-stone-900 flex items-center gap-1 truncate max-w-[100px] sm:max-w-none">
                      {syncCurrentUser.name}
                    </div>
                    <div className="text-[10px] text-[#2A7B76] uppercase font-semibold hidden sm:block">
                      {syncCurrentUser.role}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Auth & VoIP Modals */}
      {!currentUser && (
        <LoginModal
          users={users}
          onLoginSuccess={(user) => handleSetCurrentUser(user)}
          onAddNotification={handleAddNotification}
        />
      )}

      {/* 📞 Global VoIP Incoming Call Dialog */}
      <IncomingCallModal
        call={incomingCall}
        onAccept={handleAcceptIncomingCall}
        onReject={handleRejectIncomingCall}
      />

      {/* 📞 Active Call In-Progress Screen & Controls */}
      <ActiveCallModal
        call={activeCall}
        currentUser={currentUser}
        employees={employees}
        users={users}
        onlinePresences={onlinePresences}
        remoteStream={remoteMediaStream}
        onEndCall={handleEndActiveCall}
        showToast={showToast}
      />

      {/* 🖥️ Kiosk Tablette QR Code Modal */}
      <Suspense fallback={<ModuleSkeletonLoader type="modal" title="Chargement de la Borne QR..." />}>
        {showKioskModal && (
          <KioskClockingModal
            isOpen={showKioskModal}
            onClose={() => setShowKioskModal(false)}
            employees={employees}
            presences={presences}
            onUpdatePresences={handleUpdatePresences}
            onAddNotification={handleAddNotification}
            qrSecret={moduleConfig.qrCodeSecret}
            moduleConfig={moduleConfig}
          />
        )}
      </Suspense>

      {/* 📱 Push Notification Manager Modal */}
      <PushNotificationManagerModal
        isOpen={showPushModal}
        onClose={() => setShowPushModal(false)}
        showToast={showToast}
      />

      {/* 4. Main Body Container with Collapsible Sidebar & Content */}
      <PullToRefreshContainer>
        <div className="w-full flex-1 flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
        
        {/* Collapsible Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            haptic.light();
            setActiveTab(tab);
          }}
          isOpen={isSidebarOpen}
          onToggleOpen={() => {
            haptic.light();
            setIsSidebarOpen(!isSidebarOpen);
          }}
          unreadRemindersCount={userActiveRemindersCount}
          pendingPresencesRequestsCount={pendingPresencesRequestsCount}
          mobileMenuOpen={mobileMenuOpen}
          onToggleMobileMenu={() => {
            haptic.light();
            setMobileMenuOpen(!mobileMenuOpen);
          }}
          currentUser={currentUser}
          moduleConfig={moduleConfig}
        />

        {/* Tab Content Panel Container */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 overflow-x-hidden">
          {/* Mobile Active Tab Header Banner (Hero Colors) */}
          <div className="md:hidden bg-gradient-to-r from-[#2A7B76] via-[#236864] to-[#1E5753] text-white p-3 rounded-2xl shadow-sm border border-[#246B67] flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl bg-white/10 p-1.5 rounded-xl border border-white/10">
                {activeTab === 'dashboard' ? '📊' :
                 activeTab === 'employee_portal' ? '👤' :
                 activeTab === 'calls' ? '📞' :
                 activeTab === 'presences' ? '🕒' :
                 activeTab === 'statistics' ? '📈' :
                 activeTab === 'tasks' ? '📋' :
                 activeTab === 'reminders' ? '🔔' :
                 activeTab === 'logs' ? '📲' :
                 activeTab === 'collaborators' ? '👥' :
                 activeTab === 'discipline' ? '⚖️' :
                 activeTab === 'documents' ? '📄' :
                 activeTab === 'communications' ? '💬' :
                 activeTab === 'finances' ? '💳' :
                 activeTab === 'inventory' ? '📦' :
                 activeTab === 'partners' ? '🤝' :
                 activeTab === 'users' ? '🛡️' :
                 activeTab === 'settings' ? '⚙️' :
                 activeTab === 'profile' ? '👤' : '📌'}
              </span>
              <div>
                <span className="text-[9px] text-emerald-100 uppercase font-bold tracking-wider block">
                  Module Actif
                </span>
                <h2 className="text-sm font-bold text-white leading-tight capitalize">
                  {activeTab === 'dashboard' ? 'Vue d\'ensemble' :
                   activeTab === 'employee_portal' ? 'Vue d\'ensemble' :
                   activeTab === 'calls' ? "Appels d'Équipe" :
                   activeTab === 'presences' ? 'Suivi des Présences' :
                   activeTab === 'statistics' ? 'Statistiques & Assiduité' :
                   activeTab === 'tasks' ? 'Tâches & Activités' :
                   activeTab === 'reminders' ? 'Alertes & Rappels' :
                   activeTab === 'logs' ? 'Console Notifications' :
                   activeTab === 'collaborators' ? 'Collaborateurs & Équipe' :
                   activeTab === 'discipline' ? 'Discipline & Sanctions' :
                   activeTab === 'documents' ? 'Documents RH' :
                   activeTab === 'communications' ? 'Communications Internes' :
                   activeTab === 'finances' ? 'Paie & Finances' :
                   activeTab === 'inventory' ? 'Stock & Matériel' :
                   activeTab === 'partners' ? 'Partenaires' :
                   activeTab === 'users' ? 'Gestion des Accès' :
                   activeTab === 'settings' ? 'Paramètres & Config' :
                   activeTab === 'profile' ? 'Mon Profil' : activeTab}
                </h2>
              </div>
            </div>
            <button
              onClick={() => {
                haptic.light();
                setMobileMenuOpen(true);
              }}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-emerald-100 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1 border border-white/10 transition cursor-pointer"
            >
              <Menu className="h-4 w-4" />
              <span>Menu</span>
            </button>
          </div>

          <div className="min-h-[500px] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18, ease: "easeInOut" }}
                className="w-full"
              >
                <Suspense fallback={<ModuleSkeletonLoader title="Chargement en cours..." />}>
                  {activeTab === 'dashboard' && (
                    <AdminDashboardOverview
                      currentUser={currentUser}
                      employees={employees}
                      presences={presences}
                      tasks={tasks}
                      reminders={reminders}
                      currentTime={currentTime}
                      onSelectTab={setActiveTab}
                      onSelectEmployee={setSelectedEmployeeId}
                    />
                  )}

                  {activeTab === 'calls' && (
                    <TeamCallsPanel
                      currentUser={currentUser}
                      employees={employees}
                      users={users}
                      onlinePresences={onlinePresences}
                      callHistory={callHistory}
                      onStartCall={handleStartCall}
                      showToast={showToast}
                    />
                  )}

                  {activeTab === 'settings' && (
                    <CompanySettingsPanel
                      moduleConfig={moduleConfig}
                      onUpdateModuleConfig={handleUpdateModuleConfig}
                      employeeCount={employees.length}
                      employees={employees}
                      presences={presences}
                      onUpdatePresences={handleUpdatePresences}
                      onAddNotification={handleAddNotification}
                      showToast={showToast}
                    />
                  )}

                  {activeTab === 'employee_portal' && (
                    <EmployeePortal
                      currentUser={currentUser}
                      employees={employees}
                      presences={presences}
                      tasks={tasks}
                      salaryPayments={salaryPayments}
                      salaryDebts={salaryDebts}
                      financialTransactions={financialTransactions}
                      onUpdatePresences={handleUpdatePresences}
                      onUpdateTasks={handleUpdateTasks}
                      onAddNotification={handleAddNotification}
                      currentTime={currentTime}
                      onOpenProfileModal={() => setActiveTab('profile')}
                      moduleConfig={moduleConfig}
                    />
                  )}
                  {activeTab === 'users' && currentUser?.role === 'administrateur' && (
                    <UserManagementPanel
                      users={users}
                      onUpdateUsers={handleUpdateUsers}
                      onAddNotification={handleAddNotification}
                      currentUser={currentUser}
                      showToast={showToast}
                    />
                  )}
                  {activeTab === 'communications' && (
                    <CommunicationPanel 
                      employees={employees}
                      currentRole={currentRole}
                      showToast={showToast}
                    />
                  )}
                  {activeTab === 'documents' && (
                    <DocumentGeneratorPanel
                      documents={documents}
                      setDocuments={handleUpdateDocuments}
                      currentRole={currentRole}
                      employees={employees}
                      showToast={showToast}
                    />
                  )}
                  {(activeTab === 'presences' || activeTab === 'statistics') && (
                    <PresencePanel
                      employees={employees}
                      presences={presences}
                      onUpdatePresences={handleUpdatePresences}
                      onAddNotification={handleAddNotification}
                      currentRole={currentRole}
                      selectedEmployeeId={selectedEmployeeId}
                      onSelectEmployee={setSelectedEmployeeId}
                      currentTime={currentTime}
                      onSelectTab={setActiveTab}
                      initialTab={activeTab === 'statistics' ? 'statistics' : 'register'}
                      showToast={showToast}
                      moduleConfig={moduleConfig}
                      currentUser={syncCurrentUser}
                    />
                  )}

                  {activeTab === 'collaborators' && (
                    <CollaboratorPanel
                      employees={employees}
                      salaryPayments={salaryPayments}
                      presences={presences}
                      onUpdateEmployees={handleUpdateEmployees}
                      onSelectTab={(tab) => setActiveTab(tab as TabType)}
                      onSelectEmployee={setSelectedEmployeeId}
                      onAddNotification={handleAddNotification}
                      reminders={reminders}
                      tasks={tasks}
                      moduleConfig={moduleConfig}
                      showToast={showToast}
                    />
                  )}

                  {activeTab === 'discipline' && (
                    <DisciplinaryPanel
                      incidents={incidents}
                      onUpdateIncidents={handleUpdateIncidents}
                      employees={employees}
                      currentUser={currentUser}
                      currentRole={currentRole}
                      onAddNotification={(type, title, content) => handleAddNotification({ 
                        id: `notif-${Date.now()}`, 
                        type, 
                        title, 
                        content, 
                        recipient: 'Direction RH',
                        payload: '',
                        timestamp: new Date().toISOString() 
                      })}
                      showToast={showToast}
                    />
                  )}

                  {activeTab === 'tasks' && (
                    <TaskPanel
                      tasks={tasks}
                      onUpdateTasks={handleUpdateTasks}
                      onAddNotification={handleAddNotification}
                      currentRole={currentRole}
                      employees={employees}
                      selectedEmployeeId={currentRole === 'Employé' && connectedEmployee ? connectedEmployee.id : selectedEmployeeId}
                      showToast={showToast}
                    />
                  )}

                  {activeTab === 'reminders' && (
                    <ReminderPanel
                      reminders={reminders}
                      onUpdateReminders={handleUpdateReminders}
                      currentTime={currentTime}
                      employees={employees}
                      currentRole={currentRole}
                      connectedEmployee={connectedEmployee}
                      showToast={showToast}
                    />
                  )}

                  {activeTab === 'finances' && (
                    <FinancePanel
                      employees={employees}
                      salaryDebts={salaryDebts}
                      onUpdateSalaryDebts={handleUpdateSalaryDebts}
                      salaryPayments={salaryPayments}
                      onUpdateSalaryPayments={handleUpdateSalaryPayments}
                      financialTransactions={financialTransactions}
                      onUpdateFinancialTransactions={handleUpdateFinancialTransactions}
                      currentRole={currentRole}
                      onAddNotification={handleAddNotification}
                      showToast={showToast}
                    />
                  )}

                  {activeTab === 'inventory' && (
                    <InventoryPanel
                      inventoryItems={inventoryItems}
                      onUpdateInventoryItems={handleUpdateInventoryItems}
                      currentRole={currentRole}
                      employees={employees}
                      onAddNotification={handleAddNotification}
                      showToast={showToast}
                    />
                  )}

                  {activeTab === 'partners' && moduleConfig.enablePartners && (
                    <PartnersPanel
                      partners={partners}
                      onUpdatePartners={setPartners}
                      showToast={showToast}
                      currentRole={currentRole}
                      onAddNotification={handleAddNotification}
                    />
                  )}

                  {activeTab === 'logs' && (
                    <NotificationConsole 
                      notifications={notifications} 
                      onClearNotifications={() => setNotifications([])} 
                      connectedUserName={currentUser?.name || "Responsable RH"}
                      onUpdateNotifications={handleUpdateNotifications}
                      onAddNotification={handleAddNotification}
                    />
                  )}


                  {activeTab === 'profile' && syncCurrentUser && (
                    <ProfilePage
                      currentUser={syncCurrentUser}
                      onBackToDashboard={() => setActiveTab(currentRole === 'Employé' ? 'employee_portal' : 'dashboard')}
                      onLogout={() => handleSetCurrentUser(null)}
                      onAddNotification={handleAddNotification}
                      showToast={showToast}
                    />
                  )}
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

      </div>

      {/* Mobile Bottom Navigation Bar (Hero Mobile Experience) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#2A7B76]/20 px-2 py-1.5 flex items-center justify-around shadow-xl sm:hidden">
        <button
          onClick={() => {
            haptic.light();
            setActiveTab(currentRole === 'Employé' ? 'employee_portal' : 'dashboard');
            if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl transition ${activeTab === 'dashboard' || activeTab === 'employee_portal' ? 'bg-[#2A7B76]/10 text-[#2A7B76] font-bold border border-[#2A7B76]/30 scale-105 shadow-2xs' : 'text-stone-500 hover:text-stone-800'}`}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span className="text-[9px]">Vue d'ens.</span>
        </button>

        <button
          onClick={() => {
            haptic.light();
            setActiveTab('presences');
            if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl transition ${activeTab === 'presences' ? 'bg-[#2A7B76]/10 text-[#2A7B76] font-bold border border-[#2A7B76]/30 scale-105 shadow-2xs' : 'text-stone-500 hover:text-stone-800'}`}
        >
          <Clock className="h-4 w-4" />
          <span className="text-[9px]">Présences</span>
        </button>

        <button
          onClick={() => {
            haptic.light();
            setActiveTab('statistics');
            if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl transition ${activeTab === 'statistics' ? 'bg-[#2A7B76]/10 text-[#2A7B76] font-bold border border-[#2A7B76]/30 scale-105 shadow-2xs' : 'text-stone-500 hover:text-stone-800'}`}
        >
          <BarChart3 className="h-4 w-4" />
          <span className="text-[9px]">Assiduité</span>
        </button>

        <button
          onClick={() => {
            haptic.light();
            setActiveTab('tasks');
            if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl transition ${activeTab === 'tasks' ? 'bg-[#2A7B76]/10 text-[#2A7B76] font-bold border border-[#2A7B76]/30 scale-105 shadow-2xs' : 'text-stone-500 hover:text-stone-800'}`}
        >
          <Calendar className="h-4 w-4" />
          <span className="text-[9px]">Tâches</span>
        </button>

        <button
          onClick={() => {
            haptic.light();
            setMobileMenuOpen(true);
          }}
          className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl text-stone-500 hover:text-stone-800 transition"
        >
          <Menu className="h-4 w-4" />
          <span className="text-[9px]">Plus...</span>
        </button>
      </div>
      </PullToRefreshContainer>

      {/* Toast Notification Overlay */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

    </div>
  );
}
