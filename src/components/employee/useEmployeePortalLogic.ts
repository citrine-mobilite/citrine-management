import { useState, useEffect, useRef } from 'react';
import { 
  AppUser, 
  Employee, 
  Presence, 
  SalaryPayment, 
  EmployeeSalaryDebt,
  ClockingMethod,
  CompanyModuleConfig,
  AttendanceIncident 
} from '../../types';
import { getCurrentUserLocation } from '../../utils/geolocation';
import { buildMonthlyAttendanceReport, AttendanceMonthlyReport } from '../../services/rhReportService';
import { useClockingActions } from './useClockingActions';

interface UseEmployeePortalLogicProps {
  currentUser: AppUser | null;
  employees: Employee[];
  presences: Presence[];
  onUpdatePresences: (updated: Presence[]) => void;
  salaryDebts?: EmployeeSalaryDebt[];
  moduleConfig?: CompanyModuleConfig;
  attendanceIncidents?: AttendanceIncident[];
  onAddAttendanceIncident?: (incident: AttendanceIncident) => void;
}

export function useEmployeePortalLogic({
  currentUser,
  employees,
  presences,
  onUpdatePresences,
  moduleConfig,
  attendanceIncidents = [],
  onAddAttendanceIncident,
}: UseEmployeePortalLogicProps) {
  const [activeTab, setActiveTab] = useState<'clocking' | 'presences' | 'incidents' | 'salaries' | 'loans' | 'tasks' | 'alerts' | 'profile'>('clocking');
  const [certifiedReport, setCertifiedReport] = useState<AttendanceMonthlyReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [portalReportMonth, setPortalReportMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));

  const employeeProfile: Employee = employees.find(
    (emp) => emp.email?.toLowerCase() === currentUser?.email?.toLowerCase() || emp.name === currentUser?.name
  ) || {
    id: currentUser?.id || 'unknown',
    name: currentUser?.name || 'Collaborateur',
    email: currentUser?.email || '',
    roleType: 'employé',
    department: 'Général',
    avatarUrl: currentUser?.avatarUrl || '',
    phone: currentUser?.phone || '',
    status: 'en_poste',
    hireDate: '2025-01-01',
    salary: 0,
  };

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
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 4000);
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
  const [pendingClockAction, setPendingClockAction] = useState<'arrival' | 'pauseStart' | 'pauseEnd' | 'departure' | null>(null);
  const [selectedClockMethod, setSelectedClockMethod] = useState<ClockingMethod>('qr_code');
  const [qrCodeError, setQrCodeError] = useState<string | null>(null);
  const [showCustomClockModal, setShowCustomClockModal] = useState<boolean>(false);
  const [customClockHour, setCustomClockHour] = useState<string>('08');
  const [customClockMinute, setCustomClockMinute] = useState<string>('00');
  const [customClockReason, setCustomClockReason] = useState<string>('');
  const [customClockError, setCustomClockError] = useState<string | null>(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);
  const [emergencyType, setEmergencyType] = useState<'retard' | 'pause_anticipee' | 'rallonge_pause' | 'depart_anticipe'>('retard');
  const [emergencyReason, setEmergencyReason] = useState<string>('');
  const [showLoanModal, setShowLoanModal] = useState<boolean>(false);
  const [selectedPayslip, setSelectedPayslip] = useState<SalaryPayment | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCameraScan = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setQrCodeError('Impossible d’accéder à la caméra. Vérifiez les autorisations.');
    }
  };

  const stopCameraScan = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

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
      const targetMonth = month || portalReportMonth;
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
  };
}
