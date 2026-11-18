import { useState, useEffect, useMemo } from 'react';
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
  NotificationLog,
  Reminder,
} from '../../types';
import { useClockingActions } from './useClockingActions';
import {
  VALID_EMPLOYEE_SUBTABS,
  EmployeeSubTab,
  buildEmployeeProfile,
  computeEmployeeUnreadAlertsCount,
  calculateEmployeeTenure,
} from './portal/employeeProfileBuilder';
import { usePortalClockingAndReport } from './portal/usePortalClockingAndReport';

interface UseEmployeePortalLogicProps {
  currentUser: AppUser | null;
  employees: Employee[];
  presences: Presence[];
  onUpdatePresences: (updated: Presence[]) => void;
  tasks?: Task[];
  notifications?: NotificationLog[];
  reminders?: Reminder[];
  salaryDebts?: EmployeeSalaryDebt[];
  moduleConfig?: CompanyModuleConfig;
  attendanceIncidents?: AttendanceIncident[];
  onAddAttendanceIncident?: (incident: AttendanceIncident) => void;
  onAddNotification?: (log: NotificationLog) => void;
  initialSubTab?: string;
  showToast?: (titleOrMessage: string, descOrType?: any, type?: any) => void;
}

export function useEmployeePortalLogic(props: UseEmployeePortalLogicProps) {
  const {
    currentUser,
    employees,
    presences,
    onUpdatePresences,
    onAddNotification,
    moduleConfig,
    attendanceIncidents = [],
    onAddAttendanceIncident,
    initialSubTab,
  } = props;

  const employeeProfile = useMemo(() => buildEmployeeProfile(currentUser, employees), [currentUser, employees]);

  const [readVersion, setReadVersion] = useState(0);
  useEffect(() => {
    const handleStorage = () => setReadVersion((v) => v + 1);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('citrine:alerts_read_updated', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('citrine:alerts_read_updated', handleStorage);
    };
  }, []);

  const unreadAlertsCount = useMemo(
    () => computeEmployeeUnreadAlertsCount(props.notifications, props.reminders, employeeProfile, currentUser),
    [props.notifications, props.reminders, employeeProfile, currentUser, readVersion]
  );

  const getInitialEmployeeSubTab = (): EmployeeSubTab => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      const sub = hash.startsWith('employee/') ? hash.replace('employee/', '') : hash;
      if (VALID_EMPLOYEE_SUBTABS.includes(sub as EmployeeSubTab)) return sub as EmployeeSubTab;
    }
    if (initialSubTab && VALID_EMPLOYEE_SUBTABS.includes(initialSubTab as EmployeeSubTab)) {
      return initialSubTab as EmployeeSubTab;
    }
    return 'clocking';
  };

  const [activeTab, setActiveTabState] = useState<EmployeeSubTab>(getInitialEmployeeSubTab);
  const setActiveTab = (tab: EmployeeSubTab) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      try {
        window.history.replaceState(null, '', `#employee/${tab}`);
      } catch {}
    }
  };

  useEffect(() => {
    if (initialSubTab && VALID_EMPLOYEE_SUBTABS.includes(initialSubTab as EmployeeSubTab)) {
      setActiveTabState(initialSubTab as EmployeeSubTab);
      if (typeof window !== 'undefined') {
        try {
          window.history.replaceState(null, '', `#employee/${initialSubTab}`);
        } catch {}
      }
    }
  }, [initialSubTab]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleHash = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      const sub = hash.startsWith('employee/') ? hash.replace('employee/', '') : hash;
      if (VALID_EMPLOYEE_SUBTABS.includes(sub as EmployeeSubTab)) setActiveTabState(sub as EmployeeSubTab);
    };
    const handleCustomSwitch = (event: Event) => {
      const custom = event as CustomEvent<{ subtab: string }>;
      const target = custom.detail?.subtab;
      if (target && VALID_EMPLOYEE_SUBTABS.includes(target as EmployeeSubTab)) {
        setActiveTabState(target as EmployeeSubTab);
        try {
          window.history.replaceState(null, '', `#employee/${target}`);
        } catch {}
      }
    };
    window.addEventListener('hashchange', handleHash);
    window.addEventListener('citrine:switch_employee_subtab', handleCustomSwitch);
    return () => {
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('citrine:switch_employee_subtab', handleCustomSwitch);
    };
  }, []);

  const todayStr = getDoualaDateString();
  const currentDateStr = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Douala',
  });

  const [liveTimeString, setLiveTimeString] = useState<string>('');
  useEffect(() => {
    const update = () => {
      setLiveTimeString(
        new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Africa/Douala' })
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
    employeeProfile, presences, todayStr, onUpdatePresences, showToast,
    moduleConfig, attendanceIncidents, onAddAttendanceIncident, onAddNotification,
  });

  const myIncidents = attendanceIncidents.filter((i) => {
    const iEmpId = String(i.employeeId || '');
    return (
      iEmpId === String(employeeProfile.id || '') ||
      (employeeProfile.uid && iEmpId === String(employeeProfile.uid)) ||
      (employeeProfile._dbId && iEmpId === String(employeeProfile._dbId))
    );
  });

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
    assiduiteRate:
      myPresences.length > 0
        ? Math.round((myPresences.filter((p) => p.status === 'present').length / myPresences.length) * 100)
        : 100,
  };

  const portalActions = usePortalClockingAndReport({
    employeeProfile, presences, todayPresence, pendingClockAction, setPendingClockAction,
    setShowClockingModal, setQrCodeError, customClockHour, customClockMinute, customClockReason,
    setCustomClockError, setShowCustomClockModal, emergencyType, emergencyReason, setEmergencyReason,
    setShowEmergencyModal, triggerConfirmClocking, triggerConfirmCustomClock, triggerConfirmEmergency, showToast,
  });

  return {
    activeTab, setActiveTab, employeeProfile, todayStr, currentDateStr, liveTimeString, isLocating,
    toastMessage, showToast, showOfficeQRModal, setShowOfficeQRModal, showClockingModal, setShowClockingModal,
    pendingClockAction, setPendingClockAction, selectedClockMethod, setSelectedClockMethod, qrCodeError, setQrCodeError,
    showCustomClockModal, setShowCustomClockModal, customClockHour, setCustomClockHour, customClockMinute, setCustomClockMinute,
    customClockReason, setCustomClockReason, customClockError, setCustomClockError, showEmergencyModal, setShowEmergencyModal,
    emergencyType, setEmergencyType, emergencyReason, setEmergencyReason, showLoanModal, setShowLoanModal,
    selectedPayslip, setSelectedPayslip, myPresences, todayPresence, myIncidents, paginationMode, setPaginationMode,
    pageSize, setPageSize, presencePage, setPresencePage, infiniteCount, setInfiniteCount, totalPages,
    displayedPresences, employeeClockingStats, calculateTenure: calculateEmployeeTenure, unreadAlertsCount,
    ...portalActions,
  };
}
