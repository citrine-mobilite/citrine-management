import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  AppUser, 
  Employee, 
  Presence, 
  SalaryPayment, 
  EmployeeSalaryDebt,
  ClockingMethod,
  CompanyModuleConfig,
  AttendanceIncident,
  EmergencyType,
  Task,
  NotificationLog
} from '../../types';
import { getCurrentUserLocation } from '../../utils/geolocation';
import { buildMonthlyAttendanceReport, AttendanceMonthlyReport } from '../../services/rhReportService';
import { useClockingActions } from './useClockingActions';

interface UseEmployeePortalLogicProps {
  currentUser: AppUser | null;
  employees: Employee[];
  presences: Presence[];
  onUpdatePresences: (updated: Presence[]) => void;
  tasks?: Task[];
  notifications?: NotificationLog[];
  salaryDebts?: EmployeeSalaryDebt[];
  moduleConfig?: CompanyModuleConfig;
  attendanceIncidents?: AttendanceIncident[];
  onAddAttendanceIncident?: (incident: AttendanceIncident) => void;
  initialSubTab?: string;
  showToast?: (titleOrMessage: string, descOrType?: any, type?: any) => void;
}

export function useEmployeePortalLogic(props: UseEmployeePortalLogicProps) {
  const {
    currentUser,
    employees,
    presences,
    onUpdatePresences,
    moduleConfig,
    attendanceIncidents = [],
    onAddAttendanceIncident,
    initialSubTab,
  } = props;

  const VALID_EMPLOYEE_SUBTABS = ['clocking', 'presences', 'incidents', 'leaves', 'salaries', 'loans', 'tasks', 'alerts', 'profile', 'install_pwa'] as const;
  type EmployeeSubTab = typeof VALID_EMPLOYEE_SUBTABS[number];

  const foundEmp = employees.find((emp) => {
    if (!currentUser) return false;
    const curEmail = currentUser.email?.toLowerCase().trim();
    const curId = String(currentUser.id || '').trim();
    const curEmpId = currentUser.employeeId ? String(currentUser.employeeId).trim() : '';

    if (curEmail && emp.email?.toLowerCase().trim() === curEmail) return true;
    if (curEmpId && (String(emp.id) === curEmpId || emp.uid === curEmpId)) return true;
    if (emp.userId && String(emp.userId) === curId) return true;
    if (String(emp.id) === curId) return true;
    if (emp.name && currentUser.name && emp.name.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) return true;
    return false;
  });

  const employeeProfile: Employee = {
    id: foundEmp?.id || currentUser?.id || 'unknown',
    uid: foundEmp?.uid,
    _dbId: foundEmp?._dbId,
    userId: foundEmp?.userId || currentUser?.id,
    roleId: foundEmp?.roleId,
    managerId: foundEmp?.managerId,
    name: currentUser?.name || foundEmp?.name || 'Collaborateur',
    firstName: foundEmp?.firstName,
    lastName: foundEmp?.lastName,
    email: currentUser?.email || foundEmp?.email || '',
    roleType: (foundEmp?.roleType || currentUser?.role || 'employé') as any,
    department: currentUser?.department || foundEmp?.department || 'Général',
    position: foundEmp?.position || (foundEmp?.roleType as string),
    avatarUrl: currentUser?.avatarUrl || foundEmp?.avatarUrl || '',
    phone: currentUser?.phone || foundEmp?.phone || '',
    status: foundEmp?.status || 'en_poste',
    employmentStatus: foundEmp?.employmentStatus || 'en_poste',
    hireDate: foundEmp?.hireDate || '2025-01-01',
    salary: foundEmp?.salary || 0,
  };

  // Calcul du nombre de notifications/alertes non lues strictement pour cet employé
  // Version pour synchroniser les lectures depuis localStorage
  const [readVersion, setReadVersion] = useState(0);

  useEffect(() => {
    const handleStorage = () => setReadVersion(v => v + 1);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('citrine:alerts_read_updated', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('citrine:alerts_read_updated', handleStorage);
    };
  }, []);

  // Calcul dynamique et réactif du nombre de notifications/alertes non lues strictement pour cet employé
  const unreadAlertsCount = useMemo(() => {
    try {
      const readSet = new Set(JSON.parse(localStorage.getItem('citrine_read_alerts_ids') || '[]'));
      const deletedSet = new Set(JSON.parse(localStorage.getItem('citrine_deleted_alerts_ids') || '[]'));
      const customAlerts = JSON.parse(localStorage.getItem('citrine_custom_alerts_list') || '[]');
      
      const myIds = [
        employeeProfile.id,
        employeeProfile.uid,
        employeeProfile._dbId,
        currentUser?.id,
        currentUser?.employeeId,
        (currentUser as any)?.uid,
        (employeeProfile as any).code
      ].filter(Boolean).map(s => String(s).trim().toLowerCase());
      const myNames = [employeeProfile.name, currentUser?.name].filter(Boolean).map(s => String(s).trim().toLowerCase());
      const myEmails = [employeeProfile.email, currentUser?.email].filter(Boolean).map(s => String(s).trim().toLowerCase());

      const isMatch = (val?: string | null) => {
        if (!val) return false;
        const clean = String(val).trim().toLowerCase();
        return myIds.includes(clean) || myNames.includes(clean) || myEmails.includes(clean);
      };

      let count = 0;
      const seenIds = new Set<string>();

      // 1. Notifications persistées
      if (props.notifications) {
        props.notifications.forEach((n) => {
          let isForMe = isMatch(n.recipient);
          if (n.payload) {
            try {
              const p = typeof n.payload === 'string' ? JSON.parse(n.payload) : n.payload;
              if (p && (isMatch(p.employeeId) || isMatch(p.recipientId) || isMatch(p.assignedTo))) {
                isForMe = true;
              }
            } catch {}
          }
          if (isForMe && !deletedSet.has(n.id) && !seenIds.has(n.id)) {
            seenIds.add(n.id);
            if (!readSet.has(n.id) && !n.read) count++;
          }
        });
      }

      // 2. Tâches
      if (props.tasks) {
        props.tasks
          .filter((t) => isMatch(t.assignedTo) || isMatch(t.employeeId))
          .forEach((t) => {
            const id = `task-alert-${t.id}`;
            if (!deletedSet.has(id) && !seenIds.has(id)) {
              seenIds.add(id);
              if (!readSet.has(id)) count++;
            }
          });
      }

      // 3. Incidents
      if (attendanceIncidents) {
        attendanceIncidents
          .filter((i) => isMatch(i.employeeId) || isMatch(i.employeeName))
          .forEach((i) => {
            const id = `inc-alert-${i.id}`;
            if (!deletedSet.has(id) && !seenIds.has(id)) {
              seenIds.add(id);
              if (!readSet.has(id)) count++;
            }
          });
      }

      // 4. Presences
      if (props.presences) {
        props.presences
          .filter((p) => isMatch(p.employeeId))
          .forEach((p) => {
            const clockMappings: { key: keyof Presence; shortId: string; longId: string }[] = [
              { key: 'arrivalTime', shortId: `clock-arr-${p.id}`, longId: `clock-arrivalTime-${p.id}` },
              { key: 'pauseStart', shortId: `clock-pstart-${p.id}`, longId: `clock-pauseStart-${p.id}` },
              { key: 'pauseEnd', shortId: `clock-pend-${p.id}`, longId: `clock-pauseEnd-${p.id}` },
              { key: 'departureTime', shortId: `clock-dept-${p.id}`, longId: `clock-departureTime-${p.id}` },
            ];

            clockMappings.forEach(({ key, shortId, longId }) => {
              if (p[key]) {
                if (!deletedSet.has(shortId) && !deletedSet.has(longId) && !seenIds.has(shortId)) {
                  seenIds.add(shortId);
                  const isRead = readSet.has(shortId) || readSet.has(longId);
                  if (!isRead) count++;
                }
              }
            });

            if (p.sortieProStart || p.sortieProEnd) {
              const proId = `clock-pro-${p.id}`;
              if (!deletedSet.has(proId) && !seenIds.has(proId)) {
                seenIds.add(proId);
                if (!readSet.has(proId)) count++;
              }
            }
          });
      }

      // 5. Custom alerts
      customAlerts.forEach((a: any) => {
        if (!deletedSet.has(a.id) && !seenIds.has(a.id)) {
          seenIds.add(a.id);
          if (!readSet.has(a.id)) count++;
        }
      });

      // 6. System welcome (Ne jamais compter le message d'accueil comme alerte non lue)
      // Aucun incrément pour le message d'accueil par défaut

      return count;
    } catch {
      return 0;
    }
  }, [props.notifications, props.tasks, attendanceIncidents, props.presences, employeeProfile, currentUser, readVersion]);

  const getInitialEmployeeSubTab = (): EmployeeSubTab => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      const sub = hash.startsWith('employee/') ? hash.replace('employee/', '') : hash;
      if (VALID_EMPLOYEE_SUBTABS.includes(sub as EmployeeSubTab)) {
        return sub as EmployeeSubTab;
      }
    }
    if (initialSubTab && VALID_EMPLOYEE_SUBTABS.includes(initialSubTab as EmployeeSubTab)) {
      return initialSubTab as EmployeeSubTab;
    }
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('citrine_employee_subtab');
        if (saved && VALID_EMPLOYEE_SUBTABS.includes(saved as EmployeeSubTab)) {
          return saved as EmployeeSubTab;
        }
      } catch {}
    }
    return 'clocking';
  };

  const [activeTab, setActiveTabState] = useState<EmployeeSubTab>(getInitialEmployeeSubTab);

  const setActiveTab = (tab: EmployeeSubTab) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('citrine_employee_subtab', tab);
        window.history.replaceState(null, '', `#employee/${tab}`);
      } catch {}
    }
  };

  // Synchronisation si initialSubTab est fourni en prop (ex: via notification ou deep link)
  useEffect(() => {
    if (initialSubTab && VALID_EMPLOYEE_SUBTABS.includes(initialSubTab as EmployeeSubTab)) {
      setActiveTabState(initialSubTab as EmployeeSubTab);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('citrine_employee_subtab', initialSubTab);
          window.history.replaceState(null, '', `#employee/${initialSubTab}`);
        } catch {}
      }
    }
  }, [initialSubTab]);

  // Écouteur des changements de hash (back/forward) et d'événements personnalisés de redirection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleHash = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      const sub = hash.startsWith('employee/') ? hash.replace('employee/', '') : hash;
      if (VALID_EMPLOYEE_SUBTABS.includes(sub as EmployeeSubTab)) {
        setActiveTabState(sub as EmployeeSubTab);
        try {
          localStorage.setItem('citrine_employee_subtab', sub);
        } catch {}
      }
    };

    const handleCustomSwitch = (event: Event) => {
      const custom = event as CustomEvent<{ subtab: string }>;
      if (custom.detail && custom.detail.subtab) {
        const target = custom.detail.subtab;
        if (VALID_EMPLOYEE_SUBTABS.includes(target as EmployeeSubTab)) {
          setActiveTabState(target as EmployeeSubTab);
          try {
            localStorage.setItem('citrine_employee_subtab', target);
            window.history.replaceState(null, '', `#employee/${target}`);
          } catch {}
        }
      }
    };

    window.addEventListener('hashchange', handleHash);
    window.addEventListener('citrine:switch_employee_subtab', handleCustomSwitch);

    return () => {
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('citrine:switch_employee_subtab', handleCustomSwitch);
    };
  }, []);
  const [certifiedReport, setCertifiedReport] = useState<AttendanceMonthlyReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [portalReportMonth, setPortalReportMonth] = useState<string>('2026-10');

  const todayStr = new Date().toISOString().split('T')[0];
  const currentDateStr = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const [liveTimeString, setLiveTimeString] = useState<string>('');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setLiveTimeString(
        now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'success' | 'warning' | 'info' } | null>(null);

  const showToast = (title: string, desc: string, type: 'success' | 'warning' | 'info' = 'success') => {
    if (props.showToast) {
      props.showToast(title, desc, type);
    } else {
      setToastMessage({ title, desc, type });
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const {
    isLocating,
    handleConfirmClocking: triggerConfirmClocking,
    handleConfirmCustomClock: triggerConfirmCustomClock,
    handleConfirmEmergency: triggerConfirmEmergency,
  } = useClockingActions({
    employeeProfile,
    presences,
    todayStr,
    onUpdatePresences,
    showToast,
    moduleConfig,
    attendanceIncidents,
    onAddAttendanceIncident,
  });

  const myIncidents = attendanceIncidents.filter((i) => i.employeeId === employeeProfile.id);

  // Sensor diagnostic
  const [sensorsDiagnostic, setSensorsDiagnostic] = useState<{
    status: 'idle' | 'scanning' | 'done';
    gps: { ok: boolean; coords?: string; error?: string };
    camera: { ok: boolean; error?: string };
  }>({ status: 'idle', gps: { ok: false }, camera: { ok: false } });

  const runSensorsDiagnostic = async () => {
    setSensorsDiagnostic({ status: 'scanning', gps: { ok: false }, camera: { ok: false } });
    let gpsOk = false, gpsCoords = '', gpsError = '', cameraOk = false, cameraError = '';
    try {
      const loc = await getCurrentUserLocation();
      gpsOk = true;
      gpsCoords = `${loc.latitude.toFixed(4)}°, ${loc.longitude.toFixed(4)}°`;
    } catch (e: any) {
      gpsError = e.message || 'GPS indisponible';
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      stream.getTracks().forEach((t) => t.stop());
      cameraOk = true;
    } catch (e: any) {
      cameraError = e.message || 'Caméra inaccessible';
    }

    setSensorsDiagnostic({
      status: 'done',
      gps: { ok: gpsOk, coords: gpsCoords, error: gpsError },
      camera: { ok: cameraOk, error: cameraError },
    });
  };

  // Modals state
  const [showOfficeQRModal, setShowOfficeQRModal] = useState<boolean>(false);
  const [showClockingModal, setShowClockingModal] = useState<boolean>(false);
  const [pendingClockAction, setPendingClockAction] = useState<'arrival' | 'pauseStart' | 'pauseEnd' | 'departure' | 'sortieProStart' | 'sortieProEnd' | null>(null);
  const [selectedClockMethod, setSelectedClockMethod] = useState<ClockingMethod>('qr_code');
  const [qrCodeError, setQrCodeError] = useState<string | null>(null);
  const [showCustomClockModal, setShowCustomClockModal] = useState<boolean>(false);
  const [customClockHour, setCustomClockHour] = useState<string>('08');
  const [customClockMinute, setCustomClockMinute] = useState<string>('00');
  const [customClockReason, setCustomClockReason] = useState<string>('');
  const [customClockError, setCustomClockError] = useState<string | null>(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);
  const [emergencyType, setEmergencyType] = useState<EmergencyType>('sortie_professionnelle');
  const [emergencyReason, setEmergencyReason] = useState<string>('');
  const [showLoanModal, setShowLoanModal] = useState<boolean>(false);
  const [selectedPayslip, setSelectedPayslip] = useState<SalaryPayment | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCameraScan = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setQrCodeError('Impossible d’accéder à la caméra. Vérifiez les autorisations.');
    }
  }, []);

  const stopCameraScan = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const myPresences = presences.filter((p) => p.employeeId === employeeProfile.id);
  const todayPresence = myPresences.find((p) => p.date === todayStr);

  const [paginationMode, setPaginationMode] = useState<'pages' | 'infinite'>('pages');
  const [pageSize, setPageSize] = useState<number>(10);
  const [presencePage, setPresencePage] = useState<number>(1);
  const [infiniteCount, setInfiniteCount] = useState<number>(10);

  const sortedPresences = [...myPresences].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalPages = Math.ceil(sortedPresences.length / pageSize) || 1;
  const displayedPresences =
    paginationMode === 'pages'
      ? sortedPresences.slice((presencePage - 1) * pageSize, presencePage * pageSize)
      : sortedPresences.slice(0, infiniteCount);

  const employeeClockingStats = {
    totalDays: myPresences.length,
    presentCount: myPresences.filter((p) => p.status === 'present').length,
    lateCount: myPresences.filter((p) => p.status === 'late').length,
    assiduiteRate: myPresences.length > 0
      ? Math.round((myPresences.filter((p) => p.status === 'present').length / myPresences.length) * 100)
      : 100,
  };

  const handleGeneratePortalReport = async (month?: string) => {
    setIsGeneratingReport(true);
    try {
      let targetMonth = month || portalReportMonth || '2026-10';
      if (targetMonth < '2026-10') {
        targetMonth = '2026-10';
      }
      const report = await buildMonthlyAttendanceReport(employeeProfile, presences, targetMonth);
      setCertifiedReport(report);
    } catch {
      showToast('Erreur', 'Impossible de générer le rapport RH', 'warning');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleConfirmClocking = (
    method: ClockingMethod,
    customLocation?: { latitude?: number; longitude?: number; locationName?: string }
  ) => {
    triggerConfirmClocking(pendingClockAction, method, () => {
      stopCameraScan();
      setShowClockingModal(false);
    }, customLocation);
  };

  const handleConfirmCustomClock = () => {
    triggerConfirmCustomClock(
      customClockHour,
      customClockMinute,
      customClockReason,
      setCustomClockError,
      () => setShowCustomClockModal(false)
    );
  };

  const handleConfirmEmergency = () => {
    triggerConfirmEmergency(emergencyType, emergencyReason, () => {
      setShowEmergencyModal(false);
      setEmergencyReason('');
    });
  };

  const calculateTenure = (hireDate?: string): string => {
    if (!hireDate) return '1 an';
    const hire = new Date(hireDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - hire.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    if (years > 0) {
      return `${years} an${years > 1 ? 's' : ''}${months > 0 ? ` et ${months} mois` : ''}`;
    }
    if (months > 0) {
      return `${months} mois`;
    }
    return `${diffDays} jours`;
  };

  return {
    activeTab,
    setActiveTab,
    employeeProfile,
    todayStr,
    currentDateStr,
    liveTimeString,
    isLocating,
    toastMessage,
    showToast,
    sensorsDiagnostic,
    runSensorsDiagnostic,
    showOfficeQRModal,
    setShowOfficeQRModal,
    showClockingModal,
    setShowClockingModal,
    pendingClockAction,
    setPendingClockAction,
    selectedClockMethod,
    setSelectedClockMethod,
    qrCodeError,
    setQrCodeError,
    showCustomClockModal,
    setShowCustomClockModal,
    customClockHour,
    setCustomClockHour,
    customClockMinute,
    setCustomClockMinute,
    customClockReason,
    setCustomClockReason,
    customClockError,
    setCustomClockError,
    showEmergencyModal,
    setShowEmergencyModal,
    emergencyType,
    setEmergencyType,
    emergencyReason,
    setEmergencyReason,
    showLoanModal,
    setShowLoanModal,
    selectedPayslip,
    setSelectedPayslip,
    videoRef,
    startCameraScan,
    stopCameraScan,
    myPresences,
    todayPresence,
    myIncidents,
    paginationMode,
    setPaginationMode,
    pageSize,
    setPageSize,
    presencePage,
    setPresencePage,
    infiniteCount,
    setInfiniteCount,
    totalPages,
    displayedPresences,
    employeeClockingStats,
    portalReportMonth,
    setPortalReportMonth,
    certifiedReport,
    setCertifiedReport,
    isGeneratingReport,
    handleGeneratePortalReport,
    handleConfirmClocking,
    handleConfirmCustomClock,
    handleConfirmEmergency,
    calculateTenure,
    unreadAlertsCount,
  };
}
