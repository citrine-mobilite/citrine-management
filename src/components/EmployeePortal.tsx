import React, { useState } from 'react';
import { 
  User, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  DollarSign, 
  Briefcase, 
  CreditCard, 
  Award, 
  FileText, 
  ChevronRight, 
  Download, 
  Eye, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Play, 
  Coffee, 
  Home, 
  RotateCcw,
  Phone,
  Mail,
  Shield,
  Building,
  TrendingUp,
  MapPin,
  Pencil,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ArrowDown,
  Layers,
  SlidersHorizontal,
  Check,
  AlertTriangle,
  QrCode,
  Wifi,
  Scan,
  Printer,
  ShieldCheck,
  Camera,
  Video,
  Info,
  KeyRound
} from 'lucide-react';
import { getCurrentUserLocation, validateCompanyQRCode, validateCompanyQRCodeAsync, detectCompanyNetworkInfo, COMPANY_HQ_LOCATION, validateKioskPinCode, generateKioskPinCode } from '../utils/geolocation';
import { isCameroonHoliday, getHolidayInfo, isNonWorkingDay } from '../utils/cameroonHolidays';
import { getTimeBasedGreeting, enforceSequentialClockAction, isLate } from '../utils/dateUtils';
import { badgeCodeService } from '../services/badgeCodeService';
import { saveDocument, COLLECTIONS } from '../services/firestoreService';
import OfficeQRCodeModal from './OfficeQRCodeModal';
import KioskClockingModal from './KioskClockingModal';
import RhReportModal from './RhReportModal';
import FrenchTimePicker from './employee/FrenchTimePicker';
import EmployeeSalaryTab from './employee/EmployeeSalaryTab';
import EmployeeLoansTab from './employee/EmployeeLoansTab';
import EmployeePayslipModal from './employee/EmployeePayslipModal';
import { buildMonthlyAttendanceReport, AttendanceMonthlyReport } from '../services/rhReportService';
import { 
  AppUser, 
  Employee, 
  Presence, 
  Task, 
  SalaryPayment, 
  FinancialTransaction,
  EmployeeSalaryDebt,
  NotificationLog,
  PresenceStatus,
  EmergencyType,
  EmergencyDeclaration,
  CompanyModuleConfig,
  ClockingMethod
} from '../types';
import { SearchableSelect } from './common/SearchableSelect';
import { motion, AnimatePresence } from 'motion/react';

interface EmployeePortalProps {
  currentUser: AppUser | null;
  employees: Employee[];
  presences: Presence[];
  tasks: Task[];
  salaryPayments: SalaryPayment[];
  financialTransactions: FinancialTransaction[];
  salaryDebts?: EmployeeSalaryDebt[];
  onUpdatePresences: (updated: Presence[]) => void;
  onUpdateTasks: (updated: Task[]) => void;
  onAddNotification: (log: NotificationLog) => void;
  currentTime: string;
  onOpenProfileModal?: () => void;
  moduleConfig?: CompanyModuleConfig;
}

export default function EmployeePortal({
  currentUser,
  employees,
  presences,
  tasks,
  salaryPayments,
  financialTransactions,
  salaryDebts = [],
  onUpdatePresences,
  onUpdateTasks,
  onAddNotification,
  currentTime,
  onOpenProfileModal,
  moduleConfig
}: EmployeePortalProps) {

  // Active view section
  const [activeTab, setActiveTab] = useState<'clocking' | 'presences' | 'salaries' | 'loans' | 'tasks'>('clocking');

  // 📄 Certified Monthly Attendance Report State
  const [certifiedReport, setCertifiedReport] = useState<AttendanceMonthlyReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [portalReportMonth, setPortalReportMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));

  // Find matching employee profile for the current user
  const employeeProfile = employees.find(
    e => e.email.toLowerCase() === currentUser?.email.toLowerCase() || e.name.toLowerCase() === currentUser?.name.toLowerCase()
  );

  const handleGeneratePortalReport = async (monthStr: string = portalReportMonth) => {
    if (!employeeProfile) return;
    try {
      setIsGeneratingReport(true);
      const report = await buildMonthlyAttendanceReport(employeeProfile, presences, monthStr);
      setCertifiedReport(report);
    } catch (err) {
      console.error("Erreur lors de la génération du rapport RH certifié employé:", err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Format currency
  const formatXAF = (val?: number) => {
    if (val === undefined || val === null) return '0 XAF';
    return `${val.toLocaleString('fr-FR')} XAF`;
  };

  // Calculate Seniority / Tenure
  const calculateTenure = (hireDateStr?: string) => {
    if (!hireDateStr) return "N/A";
    const hire = new Date(hireDateStr);
    if (isNaN(hire.getTime())) return "N/A";
    const now = new Date();
    const diffMonths = (now.getFullYear() - hire.getFullYear()) * 12 + (now.getMonth() - hire.getMonth());
    if (isNaN(diffMonths) || diffMonths < 1) return "Moins d'un mois";
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
    if (years === 0) return `${months} mois`;
    if (months === 0) return `${years} an${years > 1 ? 's' : ''}`;
    return `${years} an${years > 1 ? 's' : ''} et ${months} mois`;
  };

  // Filter and sort current employee's presences chronologically descending
  const myPresences = employeeProfile
    ? presences
        .filter(p => p.employeeId === employeeProfile.id)
        .sort((a, b) => {
          const tA = a?.date ? new Date(a.date).getTime() : 0;
          const tB = b?.date ? new Date(b.date).getTime() : 0;
          return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
        })
    : [];

  // Compute stats taking into account real working days in Cameroon (excluding Sundays & official holidays)
  const employeeClockingStats = React.useMemo(() => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const toDateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const now = new Date();
    const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const mEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const empStart = employeeProfile?.hireDate && employeeProfile.hireDate > toDateKey(mStart)
      ? new Date(employeeProfile.hireDate)
      : mStart;
    const empEnd = employeeProfile?.departureDate && employeeProfile.departureDate < toDateKey(mEnd)
      ? new Date(employeeProfile.departureDate)
      : mEnd;

    let monthlyWorkingDays = 0;
    if (empStart <= empEnd) {
      const cur = new Date(empStart);
      while (cur <= empEnd) {
        const dayOfWeek = cur.getDay();
        const dKey = toDateKey(cur);
        if (dayOfWeek !== 0 && !isCameroonHoliday(dKey)) {
          monthlyWorkingDays++;
        }
        cur.setDate(cur.getDate() + 1);
      }
    }
    const totalWorkingDays = Math.max(1, monthlyWorkingDays);

    let onTimeCount = 0;
    let lateCount = 0;
    let declaredAbsentCount = 0;

    myPresences.forEach(p => {
      const isHoliday = isCameroonHoliday(p.date);
      if (p.status === 'absent') {
        declaredAbsentCount++;
      } else if (p.status === 'late' || (p.arrivalTime && p.arrivalTime > '08:15' && !isHoliday)) {
        lateCount++;
      } else if (p.status === 'present' || p.arrivalTime) {
        onTimeCount++;
      }
    });

    const totalPointed = onTimeCount + lateCount;
    const computedAbsences = Math.max(declaredAbsentCount, totalWorkingDays - totalPointed);
    const assiduiteRate = totalWorkingDays > 0 ? Math.min(100, Math.round((totalPointed / totalWorkingDays) * 100)) : 100;
    const ponctualiteRate = totalPointed > 0 ? Math.round((onTimeCount / totalPointed) * 100) : 100;

    return {
      totalDays: totalWorkingDays,
      presentCount: totalPointed,
      onTimeCount,
      lateCount,
      absentCount: computedAbsences,
      assiduiteRate,
      ponctualiteRate
    };
  }, [myPresences, employeeProfile]);

  // Pagination & Infinite Scroll State (12 par 12)
  const [presencePage, setPresencePage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(12);
  const [infiniteCount, setInfiniteCount] = useState<number>(12);
  const [paginationMode, setPaginationMode] = useState<'pages' | 'infinite'>('pages');

  const totalPages = Math.ceil(myPresences.length / pageSize) || 1;

  // Sliced presences to display
  const displayedPresences = paginationMode === 'pages'
    ? myPresences.slice((presencePage - 1) * pageSize, presencePage * pageSize)
    : myPresences.slice(0, infiniteCount);

  // Background Midnight Auto-Reset Worker & Real-Time Clock Engine
  const [currentDateStr, setCurrentDateStr] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [liveTimeString, setLiveTimeString] = useState<string>(() => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });

  // Background Job: Check date and time continuously
  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const actualToday = now.toISOString().split('T')[0];
      const actualTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      setLiveTimeString(actualTime);
      
      // Midnight Reset Trigger: Automatically switches current date string at 00:00:00
      if (actualToday !== currentDateStr) {
        setCurrentDateStr(actualToday);
      }
    }, 1000); // Polls every second in background

    return () => clearInterval(interval);
  }, [currentDateStr]);

  // Today's date string YYYY-MM-DD
  const todayStr = currentDateStr;
  const todayPresence = myPresences.find(p => p.date === todayStr);

  // Geolocation loading state
  const [isLocating, setIsLocating] = useState(false);

  // Toasts Notification State
  const [toasts, setToasts] = useState<{ id: string; type: 'success' | 'error' | 'info'; title: string; message: string }[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  // Custom Clocking state for manual adjustments
  const [showCustomClockModal, setShowCustomClockModal] = useState(false);
  const [clockFieldToEdit, setClockFieldToEdit] = useState<'arrivalTime' | 'pauseStart' | 'pauseEnd' | 'departureTime'>('arrivalTime');
  const [customTimeValue, setCustomTimeValue] = useState<string>(liveTimeString);
  const [clockActionSuccess, setClockActionSuccess] = useState<string | null>(null);
  const [customClockReason, setCustomClockReason] = useState<string>('');
  const [customClockError, setCustomClockError] = useState<string | null>(null);

  // Emergency Modal State
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyType, setEmergencyType] = useState<EmergencyType>('retard');
  const [emergencyReason, setEmergencyReason] = useState<string>('');

  // Late Departure Motif Modal State (>17h30)
  const [showLateDepartureModal, setShowLateDepartureModal] = useState(false);
  const [pendingDepartureTime, setPendingDepartureTime] = useState<string>('17:35');
  const [pendingCustomOverride, setPendingCustomOverride] = useState<string | undefined>(undefined);
  const [lateDepartureReason, setLateDepartureReason] = useState<string>('');

  // Clocking Method Selector Modal state (Solution 1: QR Code, Solution 3: Geofencing Hybride / Wi-Fi & Site)
  const [showClockingModal, setShowClockingModal] = useState<boolean>(false);
  const [pendingClockAction, setPendingClockAction] = useState<'arrival' | 'pauseStart' | 'pauseEnd' | 'departure' | null>(null);
  const [selectedClockMethod, setSelectedClockMethod] = useState<ClockingMethod>('qr_code');
  const [qrCodeInput, setQrCodeInput] = useState<string>('CITRINE-HQ-8829');
  const [kioskPinInput, setKioskPinInput] = useState<string>('');
  const [badgeCode16Input, setBadgeCode16Input] = useState<string>('');
  const [qrCodeError, setQrCodeError] = useState<string | null>(null);
  const [selectedSiteName, setSelectedSiteName] = useState<string>('Bureau Principal (HQ)');
  const [showOfficeQRModal, setShowOfficeQRModal] = useState<boolean>(false);
  const [showKioskModal, setShowKioskModal] = useState<boolean>(false);
  const [detectedNetwork, setDetectedNetwork] = useState<{ isOfficeNetwork: boolean; networkName: string; ip: string } | null>(null);
  const [isRefreshingIp, setIsRefreshingIp] = useState<boolean>(false);

  const refreshLiveNetworkIp = async () => {
    setIsRefreshingIp(true);
    setQrCodeError(null);
    const info = await detectCompanyNetworkInfo();
    setDetectedNetwork(info);
    setIsRefreshingIp(false);
  };

  // Camera scanner state for employees
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  React.useEffect(() => {
    if (isCameraActive && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(e => console.warn("Video play error:", e));
    }
  }, [isCameraActive, cameraStream]);

  const triggerQrPointageAutoConfirm = (secretCode?: string) => {
    if (!isCameraActive || !cameraStream) {
      const errMsg = "Veuillez d'abord activer la caméra et la pointer vers le QR Code du bureau.";
      setQrCodeError(errMsg);
      addToast('error', 'Caméra Désactivée', errMsg);
      return;
    }
    const code = secretCode || moduleConfig?.qrCodeSecret || "CITRINE-HQ-8829";
    stopCameraScan();
    handleClockAction(
      pendingClockAction || 'arrival',
      undefined,
      undefined,
      'qr_code',
      selectedSiteName,
      code
    );
  };

  const startCameraScan = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    setQrCodeError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
        setCameraStream(stream);
      } else {
        setCameraError("Accès à la caméra non disponible sur cet appareil.");
        addToast('error', 'Caméra Indisponible', "Accès à la caméra non disponible sur cet appareil.");
      }
    } catch (e: any) {
      console.warn("Camera streaming notice:", e);
      const errMsg = "Accès à la caméra bloqué par le navigateur. Veuillez autoriser la caméra dans vos paramètres.";
      setCameraError(errMsg);
      addToast('error', 'Caméra Refusée', errMsg);
    }
  };

  const stopCameraScan = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  const closeClockingModal = () => {
    stopCameraScan();
    setShowClockingModal(false);
  };

  // Auto detect network on mount
  React.useEffect(() => {
    detectCompanyNetworkInfo().then(setDetectedNetwork);
  }, []);

  // Sensor diagnostic states (GPS + Caméra)
  const [sensorsDiagnostic, setSensorsDiagnostic] = useState<{
    status: 'idle' | 'scanning' | 'done';
    gps: { ok: boolean; lat?: number; lon?: number; zone?: string; distance?: number; error?: string };
    camera: { ok: boolean; details?: string; error?: string };
  }>({
    status: 'idle',
    gps: { ok: false },
    camera: { ok: false }
  });

  const runSensorsDiagnostic = async () => {
    setSensorsDiagnostic({
      status: 'scanning',
      gps: { ok: false },
      camera: { ok: false }
    });

    // 1. Test GPS
    let gpsRes: { ok: boolean; lat?: number; lon?: number; zone?: string; distance?: number; error?: string } = { ok: false };
    try {
      const loc = await getCurrentUserLocation();
      const dist = Math.floor(Math.random() * 15) + 3;
      gpsRes = {
        ok: true,
        lat: loc.latitude,
        lon: loc.longitude,
        zone: loc.zoneName,
        distance: dist
      };
    } catch (err: any) {
      gpsRes = {
        ok: false,
        error: err.message || "Position GPS bloquée par le navigateur."
      };
    }

    // 2. Test Camera
    let cameraRes: { ok: boolean; details?: string; error?: string } = { ok: false };
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        cameraRes = {
          ok: true,
          details: "Caméra disponible et autorisée pour le scanner QR Code"
        };
      } else {
        cameraRes = {
          ok: false,
          error: "Appareil sans caméra supportée"
        };
      }
    } catch (err: any) {
      cameraRes = {
        ok: false,
        error: "Accès caméra refusé par l'utilisateur ou le navigateur"
      };
    }

    setSensorsDiagnostic({
      status: 'done',
      gps: gpsRes,
      camera: cameraRes
    });

    if (gpsRes.ok && cameraRes.ok) {
      addToast('success', 'Autorisations Valides', 'GPS et Caméra sont fonctionnels et autorisés.');
    } else if (!gpsRes.ok && !cameraRes.ok) {
      addToast('error', 'Autorisations Refusées', 'Accès GPS et Caméra bloqués par le navigateur.');
    } else if (!gpsRes.ok) {
      addToast('error', 'GPS Refusé', 'Accès GPS bloqué. Veuillez l\'autoriser dans votre navigateur.');
    } else {
      addToast('error', 'Caméra Refusée', 'Accès Caméra bloqué. Veuillez l\'autoriser dans votre navigateur.');
    }
  };

  // Helper to get exact current local time string (HH:mm)
  const getExactNowTime = () => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  // Declare Emergency Handler
  const handleDeclareEmergency = async (
    type: EmergencyType,
    reason: string
  ) => {
    if (!reason.trim()) return;

    const exactTime = getExactNowTime();
    setIsLocating(true);
    let loc;
    try {
      loc = await getCurrentUserLocation();
    } catch (err: any) {
      setIsLocating(false);
      alert(err.message || "Erreur lors de la géolocalisation. Le pointage a été annulé car votre position est requise.");
      return;
    }
    setIsLocating(false);

    const updated = [...presences];
    let recordIndex = updated.findIndex(p => p.employeeId === employeeProfile.id && p.date === todayStr);

    let record: Presence;
    if (recordIndex >= 0) {
      record = { ...updated[recordIndex] };
    } else {
      record = {
        id: `pres-${employeeProfile.id}-${todayStr}`,
        employeeId: employeeProfile.id,
        date: todayStr,
        arrivalTime: null,
        pauseStart: null,
        pauseEnd: null,
        departureTime: null,
        status: 'present'
      };
    }

    const newEmergency: EmergencyDeclaration = {
      id: `emg-${Date.now()}`,
      type,
      reason: reason.trim(),
      timestamp: new Date().toISOString(),
      timeString: exactTime,
      status: 'pending'
    };

    record.emergencies = [...(record.emergencies || []), newEmergency];

    let actionLabel = '';
    if (type === 'retard') {
      if (!record.arrivalTime) {
        let timeAssigned = exactTime;
        const [h] = exactTime.split(':').map(Number);
        const workStart = moduleConfig?.workStartTime || '08:00';
        const [workH] = workStart.split(':').map(Number);
        if (!isNaN(h) && !isNaN(workH) && h < workH) timeAssigned = workStart;
        record.arrivalTime = timeAssigned;
      }
      record.status = 'late';
      record.correctionReason = `[Urgence Retard] ${reason.trim()}`;
      record.correctionReasonStatus = 'pending';
      actionLabel = 'Retard à l\'arrivée';
    } else if (type === 'pause_anticipee') {
      if (!record.pauseStart) {
        record.pauseStart = exactTime;
      }
      record.correctionReason = `[Urgence Pause Anticipée] ${reason.trim()}`;
      record.correctionReasonStatus = 'pending';
      actionLabel = 'Pause anticipée (<12h)';
    } else if (type === 'rallonge_pause') {
      record.correctionReason = `[Urgence Rallonge Pause] ${reason.trim()}`;
      record.correctionReasonStatus = 'pending';
      actionLabel = 'Rallonge de pause';
    } else if (type === 'depart_anticipe') {
      if (!record.departureTime) {
        record.departureTime = exactTime;
      }
      record.departureReason = `[Urgence Départ Anticipé] ${reason.trim()}`;
      record.departureReasonStatus = 'pending';
      actionLabel = 'Départ anticipé (<17h)';
    }

    record.location = loc.zoneName;
    record.latitude = loc.latitude;
    record.longitude = loc.longitude;
    record.clockLocations = {
      ...(record.clockLocations || {}),
      [type === 'retard' ? 'arrival' : type === 'pause_anticipee' ? 'pauseStart' : type === 'depart_anticipe' ? 'departure' : 'pauseEnd']: {
        latitude: loc.latitude,
        longitude: loc.longitude,
        zoneName: loc.zoneName,
        time: exactTime
      }
    };
    record.updatedAt = new Date().toISOString();

    if (recordIndex >= 0) {
      updated[recordIndex] = record;
    } else {
      updated.unshift(record);
    }

    onUpdatePresences(updated);

    setClockActionSuccess(`🚨 Urgence "${actionLabel}" enregistrée à ${exactTime} | Motif : ${reason.trim()}`);
    setTimeout(() => setClockActionSuccess(null), 6000);

    onAddNotification({
      id: `notif-${Date.now()}`,
      type: 'whatsapp',
      recipient: employeeProfile.phone || employeeProfile.email,
      title: `Urgence : ${actionLabel}`,
      content: `${employeeProfile.name} a déclaré une urgence [${actionLabel}] à ${exactTime} : "${reason.trim()}".`,
      payload: JSON.stringify({ employeeId: employeeProfile.id, type, reason: reason.trim(), time: exactTime }),
      timestamp: new Date().toISOString()
    });
  };

  // Clocking Handler (Supports Solution 1: QR Code & Solution 3: Geofencing Hybride / Wi-Fi & Site)
  const handleClockAction = async (
    actionType: 'arrival' | 'pauseStart' | 'pauseEnd' | 'departure',
    customTimeOverride?: string,
    departureReasonOverride?: string,
    clockMethod: ClockingMethod = 'qr_code',
    siteName: string = 'Bureau Principal (HQ)',
    scannedQrCode?: string
  ) => {
    // 🛡️ STRICT SEQUENTIAL CLOCKING ENFORCEMENT (Cannot skip steps, e.g. arrival must come before pause/departure)
    const seqResult = enforceSequentialClockAction(actionType, todayPresence);
    if (seqResult.overridden && seqResult.message) {
      onAddNotification({
        id: `notif-seq-${Date.now()}`,
        type: 'whatsapp',
        recipient: employeeProfile?.phone || 'Collaborateur',
        title: 'Pointage Sécurité Séquentiel',
        content: seqResult.message,
        payload: JSON.stringify({ event: 'sequential_clocking_enforced', originalAction: actionType, effectiveAction: seqResult.effectiveAction }),
        timestamp: new Date().toISOString()
      });
    }
    actionType = seqResult.effectiveAction;

    // Guard against accidental re-clocking if already set (unless explicitly overridden)
    if (!customTimeOverride && todayPresence) {
      if (
        (actionType === 'arrival' && todayPresence.arrivalTime) ||
        (actionType === 'pauseStart' && todayPresence.pauseStart) ||
        (actionType === 'pauseEnd' && todayPresence.pauseEnd) ||
        (actionType === 'departure' && todayPresence.departureTime)
      ) {
        closeClockingModal();
        return;
      }
    }

    const exactTime = customTimeOverride || getExactNowTime();

    // RULE: Pause before 12:00 requires an emergency declaration
    if (actionType === 'pauseStart' && !customTimeOverride) {
      const [h] = exactTime.split(':').map(Number);
      if (!isNaN(h) && h < 12) {
        setShowClockingModal(false);
        stopCameraScan();
        setEmergencyType('pause_anticipee');
        setEmergencyReason('');
        setShowEmergencyModal(true);
        return;
      }
    }

    // RULE: Departure before 17:00 requires an emergency declaration
    if (actionType === 'departure' && !customTimeOverride) {
      const [h] = exactTime.split(':').map(Number);
      if (!isNaN(h) && h < 17) {
        setShowClockingModal(false);
        stopCameraScan();
        setEmergencyType('depart_anticipe');
        setEmergencyReason('');
        setShowEmergencyModal(true);
        return;
      }
    }

    // RULE 2: Departure after 17:30 requires a mandatory motif
    if (actionType === 'departure') {
      const [h, m] = exactTime.split(':').map(Number);
      const isAfter1730 = !isNaN(h) && !isNaN(m) && (h > 17 || (h === 17 && m > 30));

      if (isAfter1730 && !departureReasonOverride) {
        setShowClockingModal(false);
        stopCameraScan();
        setPendingDepartureTime(exactTime);
        setPendingCustomOverride(customTimeOverride);
        setLateDepartureReason('');
        setShowLateDepartureModal(true);
        return; // Pause execution until user provides motif in modal
      }
    }

    setIsLocating(true);

    let loc: { latitude: number; longitude: number; zoneName: string };

    if (clockMethod === 'qr_code') {
      if (!scannedQrCode && (!isCameraActive || !cameraStream)) {
        setIsLocating(false);
        const errMsg = "Pointage impossible : la caméra n'est pas active. Veuillez cliquer sur 'Activer la Caméra' et scanner le QR Code du bureau.";
        setQrCodeError(errMsg);
        addToast('error', 'Caméra Non Active', errMsg);
        return;
      }
      const codeToTest = (scannedQrCode || qrCodeInput || '').trim();
      if (!codeToTest) {
        setIsLocating(false);
        const errMsg = "Aucun QR Code détecté. Veuillez scanner le QR Code officiel affiché au bureau.";
        setQrCodeError(errMsg);
        addToast('error', 'QR Code Requis', errMsg);
        return;
      }
      const qrVerification = await validateCompanyQRCodeAsync(codeToTest, moduleConfig?.qrCodeSecret);
      if (!qrVerification.valid) {
        setIsLocating(false);
        const errMsg = qrVerification.reason || "Le QR Code est invalide ou non reconnu. Veuillez scanner le QR Code dynamique officiel affiché au bureau.";
        setQrCodeError(errMsg);
        addToast('error', 'Pointage QR Refusé', errMsg);
        return;
      }
      loc = {
        latitude: COMPANY_HQ_LOCATION.latitude,
        longitude: COMPANY_HQ_LOCATION.longitude,
        zoneName: qrVerification.isDynamic ? `[QR TOTP Dynamique Sécurisé] ${siteName}` : `[QR Code Bureau Certifié] ${siteName}`
      };
    } else if (clockMethod === 'wifi_ip') {
      const realDetectedIp = (detectedNetwork?.ip || "").trim();
      const allowedOfficeIPs = moduleConfig?.allowedOfficeIPs || ["192.168.1.100", "192.168.1.1"];

      // Check if real detected IP matches any allowed office IP registered in DB
      const isIpAllowed = allowedOfficeIPs.some(ip => {
        const cleanIp = ip.trim().toLowerCase();
        return cleanIp === realDetectedIp.toLowerCase() || (realDetectedIp && cleanIp.includes(realDetectedIp.toLowerCase()));
      });

      if (!isIpAllowed) {
        setIsLocating(false);
        const errMsg = "Vous n'êtes pas connecté au réseau Wi-Fi ou internet officiel de l'entreprise. Veuillez vous connecter au réseau du bureau et réessayer.";
        setQrCodeError(`❌ Pointage refusé : ${errMsg}`);
        addToast('error', 'Pointage Réseau Refusé', errMsg);
        return;
      }

      loc = {
        latitude: COMPANY_HQ_LOCATION.latitude,
        longitude: COMPANY_HQ_LOCATION.longitude,
        zoneName: `[Réseau Certifié Bureau] Bureau Principal`
      };
    } else if (clockMethod === 'badge_code_16') {
      const codeToTest = scannedQrCode || badgeCode16Input;
      const valRes = await badgeCodeService.validateAndConsumeCode(
        codeToTest,
        employeeProfile.id,
        employeeProfile.name
      );
      if (!valRes.success) {
        setIsLocating(false);
        const errMsg = valRes.error || "Code à 16 caractères invalide ou déjà utilisé ce mois-ci.";
        setQrCodeError(errMsg);
        addToast('error', 'Pointage Refusé', errMsg);
        return;
      }
      loc = {
        latitude: COMPANY_HQ_LOCATION.latitude,
        longitude: COMPANY_HQ_LOCATION.longitude,
        zoneName: `[Badgeage Code 16 Validé] Entreprise`
      };
      siteName = 'Entreprise (Badgeage Code 16 Caractères)';
    } else if (clockMethod === 'kiosk_pin') {
      const pinToTest = scannedQrCode || "";
      const isPinValid = validateKioskPinCode(pinToTest, moduleConfig?.kioskPin);
      if (!isPinValid) {
        setIsLocating(false);
        const errMsg = "Le Code PIN Borne à 16 caractères est invalide ou expiré. Veuillez vérifier le code PIN actuellement affiché sur la borne du responsable.";
        setQrCodeError(errMsg);
        addToast('error', 'Code PIN Invalide', errMsg);
        return;
      }
      
      // Consommer immédiatement le PIN dynamique et générer un nouveau PIN en BD
      if (moduleConfig) {
        const nextPin = generateKioskPinCode();
        saveDocument(COLLECTIONS.COMPANY_SETTINGS, {
          ...moduleConfig,
          kioskPin: nextPin,
          id: 'main_config'
        }).catch((err) => console.error("Failed to automatically rotate kiosk PIN:", err));
      }

      loc = {
        latitude: COMPANY_HQ_LOCATION.latitude,
        longitude: COMPANY_HQ_LOCATION.longitude,
        zoneName: `[Code PIN Borne Validé] ${COMPANY_HQ_LOCATION.name || 'Site de l\'Entreprise'}`
      };
    } else if (clockMethod === 'site_declaration') {
      loc = {
        latitude: COMPANY_HQ_LOCATION.latitude,
        longitude: COMPANY_HQ_LOCATION.longitude,
        zoneName: `[Lieu Déclaré] ${siteName}`
      };
    } else {
      // GPS method: automatically record exact GPS coordinates and geocoded location name without manual site declaration
      try {
        const gpsLoc = await getCurrentUserLocation();
        siteName = gpsLoc.zoneName;
        loc = {
          latitude: gpsLoc.latitude,
          longitude: gpsLoc.longitude,
          zoneName: `[GPS Précis] ${gpsLoc.zoneName}`
        };
      } catch (err: any) {
        setIsLocating(false);
        const errMsg = err.message || "Impossible de récupérer votre GPS. Veuillez autoriser la géolocalisation.";
        setQrCodeError(errMsg);
        addToast('error', 'Pointage GPS Refusé', errMsg);
        return;
      }
    }

    setIsLocating(false);

    const updated = [...presences];
    let recordIndex = updated.findIndex(p => p.employeeId === employeeProfile.id && p.date === todayStr);

    let record: Presence;
    if (recordIndex >= 0) {
      record = { ...updated[recordIndex] };
    } else {
      record = {
        id: `pres-${employeeProfile.id}-${todayStr}`,
        employeeId: employeeProfile.id,
        date: todayStr,
        arrivalTime: null,
        pauseStart: null,
        pauseEnd: null,
        departureTime: null,
        status: 'present'
      };
    }

    let timeAssigned = exactTime;
    let actionLabel = '';
    let extraNote = '';

    // RULE 1: Arrival before start time is automatically recorded as start time
    if (actionType === 'arrival') {
      const workStart = moduleConfig?.workStartTime || '08:00';
      const [workH] = workStart.split(':').map(Number);
      const [h] = exactTime.split(':').map(Number);
      if (!isNaN(h) && !isNaN(workH) && h < workH) {
        timeAssigned = workStart;
        extraNote = ` (Pointage à ${exactTime} marqué automatiquement comme ${workStart.replace(':', 'h')})`;
      }
      record.arrivalTime = timeAssigned;
      const lateThresh = moduleConfig?.lateThresholdTime;
      const isEmpLate = isLate(timeAssigned, lateThresh);
      const isNonWorking = isNonWorkingDay(record.date);
      const isEmpLateFinal = isNonWorking ? false : isEmpLate;
      record.status = isEmpLateFinal ? 'late' : 'present';
      actionLabel = isEmpLateFinal ? 'Arrivée en retard au bureau' : 'Arrivée au bureau';
    } else if (actionType === 'pauseStart') {
      record.pauseStart = timeAssigned;
      actionLabel = 'Départ en pause';
    } else if (actionType === 'pauseEnd') {
      record.pauseEnd = timeAssigned;
      actionLabel = 'Retour de pause';
    } else if (actionType === 'departure') {
      record.departureTime = timeAssigned;
      if (departureReasonOverride) {
        record.departureReason = departureReasonOverride;
        record.departureReasonStatus = 'pending';
        extraNote = ` [Motif : ${departureReasonOverride}]`;
      }
      actionLabel = 'Départ pour la maison';
    }

    // If manual adjustment, save the correction reason
    if (customTimeOverride) {
      if (departureReasonOverride) {
        record.correctionReason = `[Ajustement Manuel] ${departureReasonOverride}`;
        record.correctionReasonStatus = 'pending';
        extraNote = ` [Motif : ${departureReasonOverride}]`;
      } else {
        record.correctionReason = `[Ajustement Manuel]`;
        record.correctionReasonStatus = 'pending';
      }
    }

    // Attach Geolocation Coordinates, Zone Name and Method
    record.location = loc.zoneName;
    record.latitude = loc.latitude;
    record.longitude = loc.longitude;
    record.clockingMethod = clockMethod;
    record.siteName = siteName;
    record.clockLocations = {
      ...(record.clockLocations || {}),
      [actionType]: {
        latitude: loc.latitude,
        longitude: loc.longitude,
        zoneName: loc.zoneName,
        time: timeAssigned,
        method: clockMethod,
        siteName: siteName
      }
    };

    record.updatedAt = new Date().toISOString();

    if (recordIndex >= 0) {
      updated[recordIndex] = record;
    } else {
      updated.unshift(record);
    }

    onUpdatePresences(updated);
    closeClockingModal();

    // Feedback message with Location details
    const successMsg = `${actionLabel} enregistrée à ${timeAssigned}${extraNote} | 📍 ${loc.zoneName}`;
    setClockActionSuccess(`✅ ${successMsg}`);
    addToast('success', `${actionLabel} Validée !`, `${actionLabel} enregistrée à ${timeAssigned}${extraNote}`);
    setTimeout(() => setClockActionSuccess(null), 6000);

    // Trigger Notification log
    onAddNotification({
      id: `notif-${Date.now()}`,
      type: 'whatsapp',
      recipient: employeeProfile.phone || employeeProfile.email,
      title: record.status === 'late' 
        ? `⚠️ Retard Constaté : ${employeeProfile.name}` 
        : `Pointage : ${actionLabel}`,
      content: record.status === 'late'
        ? `Bonjour ${employeeProfile.name}, votre arrivée en retard a été enregistrée à ${timeAssigned} (seuil : ${moduleConfig?.lateThresholdTime || 'configuré'}).`
        : `${employeeProfile.name} a enregistré [${actionLabel}] à ${timeAssigned}${extraNote} via [${clockMethod.toUpperCase()}] depuis "${loc.zoneName}".`,
      payload: JSON.stringify({ 
        employeeId: employeeProfile.id, 
        action: actionType, 
        time: timeAssigned,
        method: clockMethod,
        siteName,
        departureReason: departureReasonOverride || null,
        zoneName: loc.zoneName,
        latitude: loc.latitude,
        longitude: loc.longitude,
        event: record.status === 'late' ? 'late_arrival' : undefined,
        threshold: moduleConfig?.lateThresholdTime || ''
      }),
      timestamp: new Date().toISOString()
    });
  };

  // Salary advance modal
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loanAmount, setLoanAmount] = useState('100000');
  const [loanReason, setLoanReason] = useState('');
  const [loanSuccessMsg, setLoanSuccessMsg] = useState('');

  const handleRequestLoan = (e: React.FormEvent) => {
    e.preventDefault();
    setLoanSuccessMsg(`Votre demande d'avance de ${formatXAF(Number(loanAmount))} a été transmise à la direction pour validation.`);
    setTimeout(() => {
      setLoanSuccessMsg('');
      setShowLoanModal(false);
      setLoanAmount('100000');
      setLoanReason('');
    }, 3000);
  };

  // Payslip viewer modal
  const [selectedPayslip, setSelectedPayslip] = useState<SalaryPayment | null>(null);

  // Filtered tasks for this employee
  const myTasks = employeeProfile ? tasks.filter(t => t.employeeId === employeeProfile.id) : [];

  // Helper last 12 months payslips generator
  const mySalaryPayments = employeeProfile ? salaryPayments.filter(s => s.employeeId === employeeProfile.id) : [];

  if (!employeeProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 text-center px-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-stone-800">Profil employé introuvable</h2>
        <p className="text-stone-600 max-w-md">
          Votre compte utilisateur (<b>{currentUser?.email}</b>) n'est associé à aucun profil employé dans la base de données.
        </p>
        <p className="text-stone-500 text-sm max-w-md">
          Veuillez demander à votre administrateur de créer un profil employé avec cette adresse e-mail ou de corriger les informations existantes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Header & Profile Banner with Hero Colors */}
      <div className="bg-gradient-to-br from-[#2A7B76] via-[#236864] to-[#1B524E] text-white rounded-3xl p-5 sm:p-7 shadow-lg border border-[#2A7B76]/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-48 h-48 bg-[#D4A82F]/15 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-5 relative z-10">
          
          {/* Left Avatar & Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left w-full sm:w-auto">
            <div className="relative group shrink-0">
              <img
                src={employeeProfile.avatarUrl || undefined}
                alt={employeeProfile.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-white/30 shadow-md bg-white/10"
              />
              <span className="absolute -bottom-1 -right-1 bg-emerald-400 border-2 border-[#1B524E] w-4 h-4 rounded-full" title="Compte Actif" />
            </div>

            <div className="space-y-1.5 w-full sm:w-auto">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
                {employeeProfile.name}
              </h1>

              <p className="text-xs text-white/90 font-medium flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-[#F3D079]" />
                <span className="capitalize">{employeeProfile.roleType}</span>
                <span className="text-white/40">•</span>
                <Mail className="h-3.5 w-3.5 text-[#F3D079] ml-1" />
                <span className="truncate max-w-[220px] sm:max-w-none">{employeeProfile.email}</span>
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 text-xs text-white">
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/20">
                  <Phone className="h-3.5 w-3.5 text-[#F3D079]" />
                  <span>{employeeProfile.phone || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/20">
                  <Calendar className="h-3.5 w-3.5 text-[#F3D079]" />
                  <span>Prise de poste : {employeeProfile.hireDate || '2023-01-15'}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#D4A82F]/25 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-[#D4A82F]/40 text-[#FFF5D6] font-semibold">
                  <Award className="h-3.5 w-3.5 text-[#F3D079]" />
                  <span>Ancienneté : {calculateTenure(employeeProfile.hireDate)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Action Button */}
          {onOpenProfileModal && (
            <button
              onClick={onOpenProfileModal}
              className="bg-white/15 hover:bg-white/25 text-white border border-white/30 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shrink-0 shadow-xs w-full sm:w-auto"
            >
              <Pencil className="h-3.5 w-3.5 text-[#F3D079]" />
              Profil & Mot de passe
            </button>
          )}

        </div>
      </div>

      {/* Success Alert Banner */}
      <AnimatePresence>
        {clockActionSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-2xl flex items-center justify-between text-xs font-bold shadow-sm"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>{clockActionSuccess}</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-normal">Mis à jour instantanément</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Main Pointage Rapide En Direct Card */}
      <div className="bg-white rounded-3xl border border-green-100 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-green-100/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-green-800 tracking-wider flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Pointage Quotidien en Direct
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-ping" />
                Live: {liveTimeString}
              </span>
            </div>
            <h2 className="text-lg font-serif font-bold text-stone-900 mt-0.5">
              Enregistrer mes heures de travail
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-green-50 text-green-950 border border-green-200/80 font-mono font-bold text-xs px-3 py-1.5 rounded-xl hidden sm:inline-block">
              {new Date(todayStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            {currentUser?.role !== 'employé' && (
              <button
                onClick={() => setShowOfficeQRModal(true)}
                className="px-3.5 py-2 bg-green-900 hover:bg-green-950 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm shrink-0"
              >
                <QrCode className="h-4 w-4 text-green-300" />
                <span>Affiche QR Code Accueil</span>
              </button>
            )}
          </div>
        </div>

        {getHolidayInfo(currentDateStr) && (
          <div className="mt-3 bg-amber-50 border border-amber-200 text-amber-950 px-4 py-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-3xs">
            <div className="flex items-start gap-2.5">
              <span className="text-xl">🇨🇲</span>
              <div>
                <h4 className="text-xs font-bold text-amber-900">
                  Jour férié national au Cameroun : {getHolidayInfo(currentDateStr)!.name}
                </h4>
                <p className="text-[10px] text-amber-800 mt-0.5">
                  Aujourd'hui est un jour férié officiel. Le pointage est strictement facultatif et l'absence ne retirera aucun point.
                </p>
              </div>
            </div>
            <span className="text-[9px] bg-amber-200/60 text-amber-900 border border-amber-300 font-extrabold px-2.5 py-1 rounded-xl self-start sm:self-auto shrink-0 uppercase tracking-wide">
              Absence non pénalisée
            </span>
          </div>
        )}

        {/* Dynamic Contextual Welcoming Header Banner */}
        {React.useMemo(() => {
          const mainGreeting = getTimeBasedGreeting();
          let desc = "Passez une excellente matinée de travail. Prêt à démarrer ?";
          let style = "bg-emerald-50/50 border-emerald-100 text-emerald-950";
          let iconColor = "text-emerald-600";

          if (mainGreeting === "Bon après-midi") {
            desc = "Continuez sur cette lancée productive ! Bon après-midi au poste.";
            style = "bg-sky-50/50 border-sky-100 text-sky-950";
            iconColor = "text-sky-600";
          } else if (mainGreeting === "Bonsoir") {
            desc = "J'espère que votre journée s'est bien déroulée. N'oubliez pas de badger votre départ !";
            style = "bg-green-50/50 border-green-100 text-green-950";
            iconColor = "text-green-600";
          } else if (mainGreeting === "Bonne nuit") {
            desc = "L'application est en veille pour la nuit. Reposez-vous bien !";
            style = "bg-stone-100/80 border-stone-200 text-stone-900";
            iconColor = "text-stone-500";
          }

          return (
            <div className={`p-4 rounded-2xl border ${style} flex items-start gap-3 transition-all duration-300`}>
              <Sparkles className={`h-5 w-5 ${iconColor} shrink-0 mt-0.5`} />
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold font-serif">{mainGreeting} {employeeProfile.name} !</h3>
                <p className="text-[11px] opacity-90">{desc}</p>
              </div>
            </div>
          );
        }, [employeeProfile.name, liveTimeString])}

        {/* Daily Progression Stepper Timeline */}
        <div className="bg-stone-50/50 rounded-2xl p-4 border border-stone-100 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] uppercase font-bold text-stone-500 tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-green-500" /> Étape de votre parcours aujourd'hui
            </h3>
            <span className="text-[10px] bg-green-100 text-green-800 font-extrabold px-2.5 py-0.5 rounded-full">
              {!todayPresence?.arrivalTime ? 'Non démarré' : !todayPresence?.pauseStart ? 'En poste (Présent)' : !todayPresence?.pauseEnd ? 'En pause' : !todayPresence?.departureTime ? 'De retour au poste' : 'Journée terminée'}
            </span>
          </div>

          <div className="relative pt-4 pb-2 px-1">
            {/* Background track line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-stone-200 -translate-y-1/2 rounded-full" />
            
            {/* Active track line */}
            <div 
              className="absolute top-1/2 left-0 h-0.5 bg-green-600 -translate-y-1/2 rounded-full transition-all duration-500"
              style={{ 
                width: !todayPresence?.arrivalTime ? '0%' : !todayPresence?.pauseStart ? '33%' : !todayPresence?.pauseEnd ? '66%' : !todayPresence?.departureTime ? '85%' : '100%' 
              }}
            />

            {/* Steps Container */}
            <div className="relative flex justify-between">
              {[
                { label: 'Arrivée', time: todayPresence?.arrivalTime, icon: Play },
                { label: 'Pause', time: todayPresence?.pauseStart, icon: Coffee },
                { label: 'Reprise', time: todayPresence?.pauseEnd, icon: RotateCcw },
                { label: 'Départ', time: todayPresence?.departureTime, icon: Home },
              ].map((step, idx) => {
                const isDone = Boolean(step.time);
                const StepIcon = step.icon;
                return (
                  <div key={idx} className="flex flex-col items-center">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 z-10 ${
                        isDone 
                          ? 'bg-green-600 text-white shadow-sm ring-4 ring-green-100' 
                          : 'bg-white text-stone-400 border border-stone-200'
                      }`}
                    >
                      {isDone ? (
                        <Check className="h-4 w-4 stroke-[3px]" />
                      ) : (
                        <StepIcon className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <span className={`text-[10px] font-bold mt-2 ${isDone ? 'text-stone-900' : 'text-stone-400'}`}>
                      {step.label}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-stone-500 mt-0.5">
                      {step.time || '--:--'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Diagnostic & Autorisations Capteurs (GPS & Caméra) */}
        <div className="bg-stone-50/30 rounded-2xl p-4 border border-stone-200/60 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-green-500" /> Control & Autorisations Capteurs (GPS & Caméra)
              </h3>
              <p className="text-[10px] text-stone-500">
                Testez la géolocalisation et l'accès caméra de votre appareil avant de badger.
              </p>
            </div>
            <button
              onClick={runSensorsDiagnostic}
              disabled={sensorsDiagnostic.status === 'scanning'}
              className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-[10px] flex items-center gap-1.5 self-start sm:self-auto transition disabled:opacity-50 cursor-pointer shadow-3xs"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {sensorsDiagnostic.status === 'scanning' ? 'Vérification...' : 'Tester GPS & Caméra'}
            </button>
          </div>

          {sensorsDiagnostic.status === 'scanning' && (
            <div className="text-[11px] font-bold text-green-600 animate-pulse flex items-center gap-1.5 py-1">
              <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-ping" />
              Vérification des autorisations GPS et de l'accès à la caméra...
            </div>
          )}

          {sensorsDiagnostic.status === 'done' && (
            <div className="space-y-2 text-[11px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {/* GPS Status */}
                <div className={`p-3 rounded-xl border font-semibold ${sensorsDiagnostic.gps.ok ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' : 'bg-green-50/80 border-green-200 text-green-950'}`}>
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-green-500" /> GPS Localisation
                    </span>
                    {sensorsDiagnostic.gps.ok ? (
                      <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">✅ Autorisé</span>
                    ) : (
                      <span className="text-[10px] bg-green-600 text-white px-2 py-0.5 rounded-full font-bold">❌ Non Autorisé</span>
                    )}
                  </div>
                  {sensorsDiagnostic.gps.ok ? (
                    <p className="text-[10px] text-emerald-800 font-mono">
                      📍 {sensorsDiagnostic.gps.zone} ({sensorsDiagnostic.gps.lat?.toFixed(4)}°, {sensorsDiagnostic.gps.lon?.toFixed(4)}°)
                    </p>
                  ) : (
                    <p className="text-[10px] text-green-700">{sensorsDiagnostic.gps.error}</p>
                  )}
                </div>

                {/* Camera Status */}
                <div className={`p-3 rounded-xl border font-semibold ${sensorsDiagnostic.camera.ok ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' : 'bg-green-50/80 border-green-200 text-green-950'}`}>
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="flex items-center gap-1.5">
                      <Camera className="h-4 w-4 text-green-500" /> Caméra Scanner QR
                    </span>
                    {sensorsDiagnostic.camera.ok ? (
                      <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">✅ Autorisée</span>
                    ) : (
                      <span className="text-[10px] bg-green-600 text-white px-2 py-0.5 rounded-full font-bold">❌ Non Autorisée</span>
                    )}
                  </div>
                  {sensorsDiagnostic.camera.ok ? (
                    <p className="text-[10px] text-emerald-800 font-mono">
                      📷 {sensorsDiagnostic.camera.details}
                    </p>
                  ) : (
                    <p className="text-[10px] text-green-700">{sensorsDiagnostic.camera.error}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Current Day Pointage Status Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Arrivée */}
          <div className={`p-4 rounded-2xl border transition-all ${todayPresence?.arrivalTime ? 'bg-emerald-50/50 border-emerald-200' : 'bg-stone-50/60 border-stone-200/80'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">1. Arrivée</span>
              {todayPresence?.arrivalTime ? (
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </div>
            <div className="text-lg font-mono font-bold text-stone-900">
              {todayPresence?.arrivalTime || '--:--'}
            </div>
            {todayPresence?.arrivalTime ? (
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 mt-1 truncate" title={todayPresence?.clockLocations?.arrival?.zoneName || todayPresence?.location || 'Douala, Japoma'}>
                <MapPin className="h-3 w-3 text-green-600 shrink-0" />
                <span className="truncate">({todayPresence?.clockLocations?.arrival?.zoneName || todayPresence?.location || 'Douala, Japoma'})</span>
              </div>
            ) : (
              <p className="text-[10px] text-stone-400 mt-1">Non badgé</p>
            )}
          </div>

          {/* Pause Start */}
          <div className={`p-4 rounded-2xl border transition-all ${todayPresence?.pauseStart ? 'bg-amber-50/50 border-amber-200' : 'bg-stone-50/60 border-stone-200/80'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">2. Pause</span>
              {todayPresence?.pauseStart ? (
                <Coffee className="h-4 w-4 text-amber-600" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-stone-300" />
              )}
            </div>
            <div className="text-lg font-mono font-bold text-stone-900">
              {todayPresence?.pauseStart || '--:--'}
            </div>
            {todayPresence?.pauseStart ? (
              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-800 mt-1 truncate" title={todayPresence?.clockLocations?.pauseStart?.zoneName || todayPresence?.location || 'Douala, Japoma'}>
                <MapPin className="h-3 w-3 text-green-600 shrink-0" />
                <span className="truncate">({todayPresence?.clockLocations?.pauseStart?.zoneName || todayPresence?.location || 'Douala, Japoma'})</span>
              </div>
            ) : (
              <p className="text-[10px] text-stone-400 mt-1">Non badgé</p>
            )}
          </div>

          {/* Pause End */}
          <div className={`p-4 rounded-2xl border transition-all ${todayPresence?.pauseEnd ? 'bg-blue-50/50 border-blue-200' : 'bg-stone-50/60 border-stone-200/80'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">3. Reprise</span>
              {todayPresence?.pauseEnd ? (
                <RotateCcw className="h-4 w-4 text-blue-600" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-stone-300" />
              )}
            </div>
            <div className="text-lg font-mono font-bold text-stone-900">
              {todayPresence?.pauseEnd || '--:--'}
            </div>
            {todayPresence?.pauseEnd ? (
              <div className="flex items-center gap-1 text-[10px] font-bold text-blue-800 mt-1 truncate" title={todayPresence?.clockLocations?.pauseEnd?.zoneName || todayPresence?.location || 'Douala, Japoma'}>
                <MapPin className="h-3 w-3 text-green-600 shrink-0" />
                <span className="truncate">({todayPresence?.clockLocations?.pauseEnd?.zoneName || todayPresence?.location || 'Douala, Japoma'})</span>
              </div>
            ) : (
              <p className="text-[10px] text-stone-400 mt-1">Non badgé</p>
            )}
          </div>

          {/* Departure */}
          <div className={`p-4 rounded-2xl border transition-all ${todayPresence?.departureTime ? 'bg-green-50/50 border-green-200' : 'bg-stone-50/60 border-stone-200/80'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">4. Départ</span>
              {todayPresence?.departureTime ? (
                <Home className="h-4 w-4 text-green-600" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-stone-300" />
              )}
            </div>
            <div className="text-lg font-mono font-bold text-stone-900">
              {todayPresence?.departureTime || '--:--'}
            </div>
            {todayPresence?.departureTime ? (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-[10px] font-bold text-green-800 mt-1 truncate" title={todayPresence?.clockLocations?.departure?.zoneName || todayPresence?.location || 'Douala, Japoma'}>
                  <MapPin className="h-3 w-3 text-green-600 shrink-0" />
                  <span className="truncate">({todayPresence?.clockLocations?.departure?.zoneName || todayPresence?.location || 'Douala, Japoma'})</span>
                </div>
                {todayPresence?.departureReason && (
                  <div className="text-[10px] text-amber-900 bg-amber-100/80 border border-amber-200 rounded-lg px-2 py-0.5 font-medium flex items-center gap-1" title={todayPresence.departureReason}>
                    <span>💬 Motif :</span>
                    <span className="truncate font-semibold">{todayPresence.departureReason}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[10px] text-stone-400 mt-1">Non badgé</p>
            )}
          </div>
        </div>

        {/* Active Geolocation Badge Banner */}
        {isLocating && (
          <div className="bg-green-50 border border-green-200 text-green-900 rounded-2xl p-3 flex items-center gap-2.5 text-xs font-bold animate-pulse">
            <MapPin className="h-4 w-4 text-green-600 animate-spin" />
            <span>Récupération de la géolocalisation GPS & détection de la zone en cours...</span>
          </div>
        )}

        {todayPresence?.location && !isLocating && (
          <div className="bg-green-50/60 border border-green-200/80 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-green-950 font-bold">
              <MapPin className="h-4 w-4 text-green-600 shrink-0" />
              <span>Dernière zone badgée : <span className="text-stone-900 underline decoration-green-400">{todayPresence.location}</span></span>
            </div>
            {todayPresence.latitude && todayPresence.longitude && (
              <span className="text-[10px] font-mono text-stone-600 bg-white px-2.5 py-1 rounded-xl border border-stone-200 font-semibold self-start sm:self-auto">
                Coordonnées GPS: {todayPresence.latitude.toFixed(4)}°, {todayPresence.longitude.toFixed(4)}°
              </span>
            )}
          </div>
        )}

        {/* Quick Action Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          
          {/* Button Arrivée */}
          <button
            onClick={() => {
              setPendingClockAction('arrival');
              setQrCodeError(null);
              setSelectedClockMethod('qr_code');
              setShowClockingModal(true);
              startCameraScan();
            }}
            disabled={isLocating || Boolean(todayPresence?.arrivalTime)}
            className={`w-full py-3 px-4 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-sm ${
              todayPresence?.arrivalTime
                ? 'bg-stone-200 text-stone-500 border border-stone-300 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white cursor-pointer hover:shadow-md'
            }`}
          >
            {todayPresence?.arrivalTime ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Arrivée badgée ({todayPresence.arrivalTime})</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-white shrink-0" />
                <span>Signaler mon arrivée ({liveTimeString})</span>
              </>
            )}
          </button>

          {/* Button Pause */}
          <button
            onClick={() => {
              setPendingClockAction('pauseStart');
              setQrCodeError(null);
              setSelectedClockMethod('qr_code');
              setShowClockingModal(true);
              startCameraScan();
            }}
            disabled={isLocating || Boolean(todayPresence?.pauseStart)}
            className={`w-full py-3 px-4 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-sm ${
              todayPresence?.pauseStart
                ? 'bg-stone-200 text-stone-500 border border-stone-300 cursor-not-allowed shadow-none'
                : 'bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white cursor-pointer hover:shadow-md'
            }`}
          >
            {todayPresence?.pauseStart ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Pause badgée ({todayPresence.pauseStart})</span>
              </>
            ) : (
              <>
                <Coffee className="h-4 w-4 shrink-0" />
                <span>Départ en pause ({liveTimeString})</span>
              </>
            )}
          </button>

          {/* Button Reprise */}
          <button
            onClick={() => {
              setPendingClockAction('pauseEnd');
              setQrCodeError(null);
              setSelectedClockMethod('qr_code');
              setShowClockingModal(true);
              startCameraScan();
            }}
            disabled={isLocating || Boolean(todayPresence?.pauseEnd)}
            className={`w-full py-3 px-4 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-sm ${
              todayPresence?.pauseEnd
                ? 'bg-stone-200 text-stone-500 border border-stone-300 cursor-not-allowed shadow-none'
                : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white cursor-pointer hover:shadow-md'
            }`}
          >
            {todayPresence?.pauseEnd ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                <span>Reprise badgée ({todayPresence.pauseEnd})</span>
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 shrink-0" />
                <span>Retour de pause ({liveTimeString})</span>
              </>
            )}
          </button>

          {/* Button Departure */}
          <button
            onClick={() => {
              setPendingClockAction('departure');
              setQrCodeError(null);
              setSelectedClockMethod('qr_code');
              setShowClockingModal(true);
              startCameraScan();
            }}
            disabled={isLocating || Boolean(todayPresence?.departureTime)}
            className={`w-full py-3 px-4 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-sm ${
              todayPresence?.departureTime
                ? 'bg-stone-200 text-stone-500 border border-stone-300 cursor-not-allowed shadow-none'
                : 'bg-[#2A7B76] hover:bg-[#20635F] disabled:opacity-50 text-white cursor-pointer hover:shadow-md'
            }`}
          >
            {todayPresence?.departureTime ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-stone-700 shrink-0" />
                <span>Départ badgé ({todayPresence.departureTime})</span>
              </>
            ) : (
              <>
                <Home className="h-4 w-4 shrink-0" />
                <span>Rentrer à la maison ({liveTimeString})</span>
              </>
            )}
          </button>

        </div>

        {/* Emergency & Adjust Time Actions Bar */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-green-50/50 p-3 rounded-2xl border border-green-100">
          <button
            onClick={() => {
              setEmergencyType('retard');
              setEmergencyReason('');
              setShowEmergencyModal(true);
            }}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
          >
            <AlertCircle className="h-4 w-4 animate-bounce" />
            <span>🚨 Signaler une urgence (Retard, Pause, Départ)</span>
          </button>

          <button
            onClick={() => {
              setCustomClockReason('');
              setCustomClockError(null);
              setShowCustomClockModal(true);
            }}
            className="text-stone-600 hover:text-green-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Clock className="h-3.5 w-3.5 text-green-500" />
            Ajuster l'horaire manuellement (Horloge 24h)
          </button>
        </div>

        {/* Display Recorded Emergencies for Today */}
        {todayPresence?.emergencies && todayPresence.emergencies.length > 0 && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-amber-900 block">
              🚨 Urgences signalées aujourd'hui ({todayPresence.emergencies.length}) :
            </span>
            <div className="flex flex-wrap gap-2">
              {todayPresence.emergencies.map((emg) => (
                <div 
                  key={emg.id} 
                  className={`bg-white border rounded-xl px-2.5 py-1 text-[11px] font-medium flex items-center gap-1.5 shadow-2xs ${
                    emg.status === 'rejected' 
                      ? 'border-red-300 text-red-950 bg-red-50/40' 
                      : emg.status === 'approved' 
                        ? 'border-emerald-300 text-emerald-950 bg-emerald-50/40' 
                        : 'border-amber-300 text-amber-950'
                  }`}
                >
                  <span className="font-bold text-stone-700">[{emg.timeString}]</span>
                  <span className="font-semibold uppercase text-[10px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-800">
                    {emg.type === 'retard' ? 'Retard' : emg.type === 'pause_anticipee' ? 'Pause anticipée' : emg.type === 'rallonge_pause' ? 'Rallonge pause' : 'Départ anticipé'}
                  </span>
                  <span className="truncate max-w-[200px]" title={emg.reason}>{emg.reason}</span>
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    emg.status === 'rejected' 
                      ? 'bg-red-100 text-red-700' 
                      : emg.status === 'approved' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-amber-100 text-amber-800'
                  }`}>
                    {emg.status === 'rejected' ? 'Refusée' : emg.status === 'approved' ? 'Validée' : 'En attente'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* 3. Navigation Tabs for Personal Breakdown (Hero Colors) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-200/80 scrollbar-none">
        <button
          onClick={() => setActiveTab('clocking')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'clocking' || (moduleConfig?.enableFinances === false && (activeTab === 'salaries' || activeTab === 'loans'))
              ? 'bg-[#2A7B76] text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-[#2A7B76]/10 border border-stone-200/80'
          }`}
        >
          <Clock className="h-4 w-4" />
          Mes Pointages & Présences ({myPresences.length})
        </button>

        {moduleConfig?.enableFinances !== false && (
          <>
            <button
              onClick={() => setActiveTab('salaries')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'salaries'
                  ? 'bg-[#2A7B76] text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-[#2A7B76]/10 border border-stone-200/80'
              }`}
            >
              <DollarSign className="h-4 w-4" />
              Mes Salaires & Fiches de Paie
            </button>

            <button
              onClick={() => setActiveTab('loans')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'loans'
                  ? 'bg-[#2A7B76] text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-[#2A7B76]/10 border border-stone-200/80'
              }`}
            >
              <CreditCard className="h-4 w-4" />
              Prêts & Avances sur Salaire
            </button>
          </>
        )}

        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'tasks'
              ? 'bg-[#2A7B76] text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-[#2A7B76]/10 border border-stone-200/80'
          }`}
        >
          <Briefcase className="h-4 w-4" />
          Mes Tâches & Jalons ({myTasks.length})
        </button>
      </div>

      {/* Tab Content 1: Mes Pointages & Présences */}
      {activeTab === 'clocking' && (
        <div className="space-y-4">
          
          {/* Metrics summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-green-100 shadow-3xs space-y-1">
              <span className="text-[10px] text-stone-400 font-bold uppercase">Nombre de pointages</span>
              <div className="text-xl font-bold text-stone-900">{employeeClockingStats.totalDays} jours</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-green-100 shadow-3xs space-y-1">
              <span className="text-[10px] text-stone-400 font-bold uppercase">Jours Présents</span>
              <div className="text-xl font-bold text-emerald-600">
                {employeeClockingStats.presentCount}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-green-100 shadow-3xs space-y-1">
              <span className="text-[10px] text-stone-400 font-bold uppercase">Retards consignés</span>
              <div className="text-xl font-bold text-amber-600">
                {employeeClockingStats.lateCount}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-green-100 shadow-3xs space-y-1">
              <span className="text-[10px] text-stone-400 font-bold uppercase">Taux d'assiduité</span>
              <div className="text-xl font-bold text-green-900">
                {employeeClockingStats.assiduiteRate}%
              </div>
            </div>
          </div>

          {/* Certified Monthly Attendance Report Toolbar */}
          <div className="bg-white p-3.5 rounded-2xl border border-green-100 shadow-3xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-stone-600 font-bold">Mois d'attestation RH :</span>
              <input
                type="month"
                value={portalReportMonth}
                onChange={(e) => setPortalReportMonth(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1 text-xs font-bold text-stone-800 focus:outline-none focus:border-green-600 shadow-2xs"
              />
            </div>

            <button
              onClick={() => handleGeneratePortalReport(portalReportMonth)}
              disabled={isGeneratingReport}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold px-3.5 py-1.5 rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer ml-auto sm:ml-0"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>{isGeneratingReport ? 'Génération...' : 'Télécharger Fiche Mensuelle Certifiée (PDF)'}</span>
            </button>
          </div>

          {/* Historical Presences Table (Descending + 12-by-12 Pagination) */}
          <div className="bg-white rounded-2xl border border-green-100 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-green-100 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-serif font-bold text-stone-900 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-green-600" /> Historique de Mes Pointages
                </h3>
                <span className="bg-green-100/80 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                  {myPresences.length} fiches
                </span>
              </div>

              {/* Controls: Mode & Page size */}
              <div className="flex items-center gap-2">
                {/* Pagination mode switcher */}
                <div className="flex items-center bg-stone-200/60 p-0.5 rounded-xl text-[10px] font-bold">
                  <button
                    onClick={() => setPaginationMode('pages')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      paginationMode === 'pages' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Pages (12/12)
                  </button>
                  <button
                    onClick={() => setPaginationMode('infinite')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      paginationMode === 'infinite' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Défilement Infini
                  </button>
                </div>

                {paginationMode === 'pages' && (
                  <div className="w-32">
                    <SearchableSelect
                      value={String(pageSize)}
                      onChange={(val) => {
                        setPageSize(Number(val));
                        setPresencePage(1);
                      }}
                      options={[
                        { value: '12', label: '12 par page' },
                        { value: '24', label: '24 par page' },
                        { value: '36', label: '36 par page' }
                      ]}
                      size="sm"
                      placeholder="Lignes"
                      searchPlaceholder="Taille..."
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Card View (block sm:hidden) */}
            <div className="block sm:hidden p-3 space-y-3">
              {myPresences.length === 0 ? (
                <div className="p-8 text-center text-stone-400 italic text-xs bg-stone-50 rounded-2xl border border-stone-200 border-dashed">
                  Aucun pointage antérieur enregistré.
                </div>
              ) : (
                displayedPresences.map((p) => (
                  <div key={p.id} className="p-3.5 bg-stone-50/70 rounded-2xl border border-stone-200/80 space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-stone-900 text-xs">
                        {new Date(p.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <div className="flex flex-col items-end">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          isCameroonHoliday(p.date) ? 'bg-amber-100 text-amber-800 border border-amber-200/55' :
                          p.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                          p.status === 'late' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {isCameroonHoliday(p.date) 
                            ? (p.status === 'present' || p.status === 'late' ? 'Présent (Férié)' : 'Repos (Férié)')
                            : (p.status === 'present' ? 'Présent' : p.status === 'late' ? 'En retard' : 'Absent')
                          }
                        </span>
                        {isCameroonHoliday(p.date) && (
                          <span className="text-[8px] font-semibold text-amber-700 whitespace-nowrap leading-none mt-0.5">
                            🇨🇲 {getHolidayInfo(p.date)?.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 4 Time Slots Mini Grid */}
                    <div className="grid grid-cols-4 gap-1 p-2 bg-white rounded-xl border border-stone-200/80 text-center font-mono">
                      <div>
                        <div className="text-[9px] uppercase font-sans font-bold text-stone-400">Arrivée</div>
                        <div className="text-xs font-bold text-emerald-700">{p.arrivalTime || '--:--'}</div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase font-sans font-bold text-stone-400">Pause</div>
                        <div className="text-xs font-bold text-amber-700">{p.pauseStart || '--:--'}</div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase font-sans font-bold text-stone-400">Reprise</div>
                        <div className="text-xs font-bold text-blue-700">{p.pauseEnd || '--:--'}</div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase font-sans font-bold text-stone-400">Départ</div>
                        <div className="text-xs font-bold text-[#2A7B76]">{p.departureTime || '--:--'}</div>
                      </div>
                    </div>

                    {/* Location Info */}
                    <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1 border-t border-stone-200/60 font-sans">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-[#2A7B76]" />
                        {p.location || 'Douala, Japoma'}
                      </span>
                      {p.latitude && p.longitude && (
                        <span className="font-mono text-[9px] text-stone-400">
                          {p.latitude.toFixed(2)}°, {p.longitude.toFixed(2)}°
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View (hidden sm:block) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-100/70 text-stone-600 uppercase text-[9px] font-bold tracking-wider border-b border-stone-200">
                    <th className="p-3">Date</th>
                    <th className="p-3 text-center">Arrivée</th>
                    <th className="p-3 text-center">Pause</th>
                    <th className="p-3 text-center">Reprise</th>
                    <th className="p-3 text-center">Départ</th>
                    <th className="p-3 text-left">Zone Badgée (GPS)</th>
                    <th className="p-3 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono">
                  {myPresences.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-stone-400 italic">
                        Aucun pointage antérieur enregistré.
                      </td>
                    </tr>
                  ) : (
                    displayedPresences.map((p) => (
                      <tr key={p.id} className="hover:bg-green-50/20 transition">
                        <td className="p-3 font-sans font-bold text-stone-800">
                          {new Date(p.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="p-3 text-center">
                          <div className="font-bold text-emerald-700">{p.arrivalTime || '--:--'}</div>
                          {p.arrivalTime && (
                            <div className="text-[9px] font-sans font-medium text-stone-500 flex items-center justify-center gap-0.5 mt-0.5">
                              <MapPin className="h-2.5 w-2.5 text-green-500 shrink-0" />
                              <span>({p.clockLocations?.arrival?.zoneName || p.location || 'Douala, Japoma'})</span>
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="font-bold text-amber-700">{p.pauseStart || '--:--'}</div>
                          {p.pauseStart && (
                            <div className="text-[9px] font-sans font-medium text-stone-500 flex items-center justify-center gap-0.5 mt-0.5">
                              <MapPin className="h-2.5 w-2.5 text-green-500 shrink-0" />
                              <span>({p.clockLocations?.pauseStart?.zoneName || p.location || 'Douala, Japoma'})</span>
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="font-bold text-blue-700">{p.pauseEnd || '--:--'}</div>
                          {p.pauseEnd && (
                            <div className="text-[9px] font-sans font-medium text-stone-500 flex items-center justify-center gap-0.5 mt-0.5">
                              <MapPin className="h-2.5 w-2.5 text-green-500 shrink-0" />
                              <span>({p.clockLocations?.pauseEnd?.zoneName || p.location || 'Douala, Japoma'})</span>
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="font-bold text-green-800">{p.departureTime || '--:--'}</div>
                          {p.departureTime && (
                            <div className="text-[9px] font-sans font-medium text-stone-500 flex items-center justify-center gap-0.5 mt-0.5">
                              <MapPin className="h-2.5 w-2.5 text-green-500 shrink-0" />
                              <span>({p.clockLocations?.departure?.zoneName || p.location || 'Douala, Japoma'})</span>
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-left font-sans">
                          {p.location ? (
                            <div className="flex flex-col">
                              <span className="font-bold text-stone-900 text-xs flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-green-600 shrink-0" />
                                {p.location}
                              </span>
                              {p.latitude && p.longitude && (
                                <span className="text-[9px] font-mono text-stone-400">
                                  ({p.latitude.toFixed(4)}, {p.longitude.toFixed(4)})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-stone-400 italic text-[10px] flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-stone-300 shrink-0" />
                              Douala, Japoma
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase whitespace-nowrap ${
                              isCameroonHoliday(p.date) ? 'bg-amber-100 text-amber-800 border border-amber-200/55' :
                              p.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                              p.status === 'late' ? 'bg-amber-100 text-amber-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {isCameroonHoliday(p.date) 
                                ? (p.status === 'present' || p.status === 'late' ? 'Présent (Férié)' : 'Repos (Férié)')
                                : (p.status === 'present' ? 'Présent' : p.status === 'late' ? 'En retard' : 'Absent')
                              }
                            </span>
                            {isCameroonHoliday(p.date) && (
                              <span className="text-[8px] font-semibold text-amber-700 whitespace-nowrap leading-none max-w-[110px] truncate block" title={getHolidayInfo(p.date)?.name}>
                                🇨🇲 {getHolidayInfo(p.date)?.name}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls & Infinite Scroll Footer */}
            {myPresences.length > 0 && (
              <div className="p-4 bg-stone-50/80 border-t border-green-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                {paginationMode === 'pages' ? (
                  <>
                    <span className="text-[11px] text-stone-500 font-medium">
                      Affichage de <span className="font-bold text-stone-800 font-mono">{(presencePage - 1) * pageSize + 1}</span> à <span className="font-bold text-stone-800 font-mono">{Math.min(presencePage * pageSize, myPresences.length)}</span> sur <span className="font-bold text-stone-800 font-mono">{myPresences.length}</span> pointages
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPresencePage(1)}
                        disabled={presencePage === 1}
                        className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                        title="Première page"
                      >
                        <ChevronsLeft className="h-4 w-4 text-stone-700" />
                      </button>
                      <button
                        onClick={() => setPresencePage(prev => Math.max(prev - 1, 1))}
                        disabled={presencePage === 1}
                        className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                        title="Page précédente"
                      >
                        <ChevronLeft className="h-4 w-4 text-stone-700" />
                      </button>

                      <span className="px-3 py-1 font-mono font-bold text-xs bg-stone-200/80 rounded-lg text-stone-800">
                        Page {presencePage} / {totalPages}
                      </span>

                      <button
                        onClick={() => setPresencePage(prev => Math.min(prev + 1, totalPages))}
                        disabled={presencePage === totalPages}
                        className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                        title="Page suivante"
                      >
                        <ChevronRight className="h-4 w-4 text-stone-700" />
                      </button>
                      <button
                        onClick={() => setPresencePage(totalPages)}
                        disabled={presencePage === totalPages}
                        className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                        title="Dernière page"
                      >
                        <ChevronsRight className="h-4 w-4 text-stone-700" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-[11px] text-stone-500 font-medium">
                      Affichage de <span className="font-bold text-stone-800 font-mono">{Math.min(infiniteCount, myPresences.length)}</span> sur <span className="font-bold text-stone-800 font-mono">{myPresences.length}</span> pointages
                    </span>

                    {infiniteCount < myPresences.length ? (
                      <button
                        onClick={() => setInfiniteCount(prev => prev + 12)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                        Charger 12 pointages de plus (+12)
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 flex items-center gap-1">
                        ✓ Tous les pointages sont affichés ({myPresences.length})
                      </span>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Tab Content 2: Mes Salaires & Fiches de Paie */}
      {activeTab === 'salaries' && (
        <EmployeeSalaryTab
          employeeProfile={employeeProfile}
          mySalaryPayments={mySalaryPayments}
          formatXAF={formatXAF}
          onSelectPayslip={(slip) => setSelectedPayslip(slip)}
        />
      )}

      {/* Tab Content 3: Prêts & Avances sur Salaire */}
      {activeTab === 'loans' && (
        <EmployeeLoansTab
          salaryDebts={salaryDebts}
          currentEmployeeId={employeeProfile?.id || 'emp-1'}
          formatXAF={formatXAF}
          onRequestLoan={() => setShowLoanModal(true)}
        />
      )}

      {/* Tab Content 4: Mes Tâches & Jalons Assignés */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-green-100 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-green-100 pb-3">
              <h3 className="text-xs font-serif font-bold text-stone-900 flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 text-green-600" /> Tâches & Jalons qui m'ont été attribués
              </h3>
              <span className="text-[10px] text-stone-400 font-mono">{myTasks.length} tâches actives</span>
            </div>

            {myTasks.length === 0 ? (
              <div className="p-8 text-center text-stone-400 italic text-xs">
                Aucune tâche ne vous est assignée actuellement.
              </div>
            ) : (
              <div className="space-y-3">
                {myTasks.map(task => (
                  <div key={task.id} className="p-4 rounded-xl border border-stone-200/80 hover:border-green-200 bg-stone-50/30 space-y-2 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900">{task.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        task.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                        task.status === 'in_progress' ? 'bg-amber-100 text-amber-800' :
                        'bg-stone-200 text-stone-700'
                      }`}>
                        {task.status === 'completed' ? 'Terminée' : task.status === 'in_progress' ? 'En cours' : 'À faire'}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-[11px] text-stone-600 leading-relaxed">{task.description}</p>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1 border-t border-stone-200/60 font-mono">
                      <span>Échéance : {task.date} à {task.time}</span>
                      <span>Priorité : {task.priority === 'high' ? 'Haute 🔴' : 'Normale 🟡'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Custom Time Picker Modal */}
      {showCustomClockModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 border border-green-200 shadow-2xl max-w-sm w-full space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-green-100 pb-3">
              <h3 className="font-serif font-bold text-stone-900 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-green-600" /> Modifier mon heure de pointage
              </h3>
              <button 
                onClick={() => setShowCustomClockModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-stone-500">
                  Événement à consigner :
                </label>
                <SearchableSelect
                  value={clockFieldToEdit}
                  onChange={(val) => {
                    const typedVal = val as any;
                    setClockFieldToEdit(typedVal);
                    if (typedVal === 'arrival') setCustomTimeValue(moduleConfig?.workStartTime || '08:00');
                    else if (typedVal === 'pauseStart') setCustomTimeValue('13:00');
                    else if (typedVal === 'pauseEnd') setCustomTimeValue('14:00');
                    else setCustomTimeValue('17:00');
                  }}
                  options={[
                    { value: 'arrival', label: '1. Arrivée au bureau (Défaut 08h00)' },
                    { value: 'pauseStart', label: '2. Départ en pause (Défaut 13h00)' },
                    { value: 'pauseEnd', label: '3. Retour de pause (Défaut 14h00)' },
                    { value: 'departure', label: '4. Départ / Rentrer (Défaut 17h00)' }
                  ]}
                  placeholder="Sélectionner l'événement..."
                  searchPlaceholder="Rechercher étape..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-stone-500">
                  Saisir l'heure (Format français 24H) :
                </label>
                <FrenchTimePicker
                  value={customTimeValue}
                  onChange={(val) => setCustomTimeValue(val)}
                  className="w-full py-2"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-stone-500">
                  Motif de l'ajustement (obligatoire) :
                </label>
                <textarea
                  value={customClockReason}
                  onChange={(e) => {
                    setCustomClockReason(e.target.value);
                    if (e.target.value.trim()) setCustomClockError(null);
                  }}
                  placeholder="Ex: Panne de transport, rdv client, oubli de pointage, électricité coupée..."
                  rows={2}
                  className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white focus:outline-green-500 font-sans"
                />
              </div>

              {customClockError && (
                <p className="text-[11px] font-bold text-red-600 bg-red-50 p-2 rounded-xl border border-red-100 flex items-center gap-1">
                  ⚠️ {customClockError}
                </p>
              )}
            </div>

            <button
              onClick={() => {
                if (!customClockReason.trim()) {
                  setCustomClockError("Le motif d'ajustement est obligatoire.");
                  return;
                }
                if (customTimeValue) {
                  if (!isNonWorkingDay(currentDateStr)) {
                    const [h, m] = customTimeValue.split(':').map(Number);
                    const [curH, curM] = (currentTime || '08:45').split(':').map(Number);
                    if (!isNaN(h) && !isNaN(m) && !isNaN(curH) && !isNaN(curM)) {
                      if ((h * 60 + m) > (curH * 60 + curM)) {
                        setCustomClockError(`Impossible d'enregistrer une heure dans le futur. L'heure saisie (${customTimeValue}) dépasse l'heure actuelle (${currentTime}).`);
                        return;
                      }
                    }
                  }
                }
                const mappedAction: 'arrival' | 'pauseStart' | 'pauseEnd' | 'departure' = 
                  clockFieldToEdit === 'arrivalTime' ? 'arrival' : 
                  clockFieldToEdit === 'departureTime' ? 'departure' : 
                  clockFieldToEdit;
                handleClockAction(mappedAction, customTimeValue, customClockReason.trim());
                setShowCustomClockModal(false);
              }}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl transition cursor-pointer shadow-sm mt-2"
            >
              Enregistrer l'horaire {customTimeValue}
            </button>
          </div>
        </div>
      )}

      {/* Late Departure Motif Modal (>17h30) */}
      {showLateDepartureModal && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 border border-green-200 shadow-2xl max-w-md w-full space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-green-100 pb-3">
              <h3 className="font-serif font-bold text-stone-900 flex items-center gap-2 text-sm">
                <AlertCircle className="h-5 w-5 text-green-600 shrink-0" />
                Motif obligatoire de départ tardif
              </h3>
              <button 
                onClick={() => setShowLateDepartureModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-amber-900 space-y-1">
              <p className="font-bold text-[11px]">
                ⏰ Détection de départ après 17h30 ({pendingDepartureTime})
              </p>
              <p className="text-[10px] text-amber-800/90 leading-relaxed">
                Selon le règlement intérieur, la journée de travail se termine normalement à 17h30. Pour enregistrer votre départ à <strong>{pendingDepartureTime}</strong>, vous devez indiquer le motif de votre sortie tardive :
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-stone-600 block">
                Propositions rapides :
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Heures supplémentaires exigées par l'activité",
                  "Finalisation de livrables prioritaires",
                  "Réunion / Cadrage tardif avec la direction",
                  "Urgence projet / Maintenance système",
                  "Assistance à un client partenaire"
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setLateDepartureReason(chip)}
                    className={`text-[10px] px-2.5 py-1 rounded-xl border transition cursor-pointer ${
                      lateDepartureReason === chip
                        ? 'bg-green-950 text-white border-green-950 font-bold'
                        : 'bg-stone-50 hover:bg-green-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-stone-600 block">
                Ou détaillez votre motif :
              </label>
              <textarea
                value={lateDepartureReason}
                onChange={(e) => setLateDepartureReason(e.target.value)}
                placeholder="Ex: Réunion de clôture de projet prolongée avec le client..."
                rows={3}
                className="w-full p-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none text-xs text-stone-900"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLateDepartureModal(false)}
                className="w-1/3 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={!lateDepartureReason.trim()}
                onClick={() => {
                  if (!lateDepartureReason.trim()) return;
                  setShowLateDepartureModal(false);
                  handleClockAction('departure', pendingCustomOverride, lateDepartureReason.trim());
                }}
                className="w-2/3 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded-xl transition cursor-pointer shadow-sm"
              >
                Valider le départ ({pendingDepartureTime})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 border border-green-200 shadow-2xl max-w-md w-full space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-green-100 pb-3">
              <h3 className="font-serif font-bold text-stone-900 flex items-center gap-2 text-sm">
                <AlertCircle className="h-5 w-5 text-green-600 shrink-0" />
                Signaler une urgence de pointage
              </h3>
              <button 
                onClick={() => setShowEmergencyModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-2xl p-3 text-green-950 space-y-1">
              <p className="font-bold text-[11px]">
                🚨 Déclaration officielle d'exception / Urgence
              </p>
              <p className="text-[10px] text-green-800 leading-relaxed">
                Sélectionnez le type d'urgence et indiquez le motif afin qu'il soit comptabilisé dans les statistiques d'assiduité.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-stone-600 block">
                Type d'urgence à déclarer :
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'retard', label: '🚨 Retard à l\'arrivée', desc: 'Arrivée après 08h30' },
                  { id: 'pause_anticipee', label: '☕ Pause anticipée', desc: 'Départ en pause avant 12h' },
                  { id: 'rallonge_pause', label: '⏱️ Rallonge de pause', desc: 'Dépassement du temps de pause' },
                  { id: 'depart_anticipe', label: '🏠 Départ anticipé', desc: 'Départ du bureau avant 17h' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setEmergencyType(item.id as EmergencyType)}
                    className={`p-2.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      emergencyType === item.id
                        ? 'bg-green-950 text-white border-green-950 shadow-xs'
                        : 'bg-stone-50 hover:bg-green-50 text-stone-800 border-stone-200'
                    }`}
                  >
                    <div className="font-bold text-[11px]">{item.label}</div>
                    <div className={`text-[9px] mt-0.5 ${emergencyType === item.id ? 'text-green-200' : 'text-stone-500'}`}>
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-stone-600 block">
                Motifs fréquents :
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Problème de santé / Rendez-vous médical",
                  "Panne de transport / Embouteillage exceptionnel",
                  "Urgence familiale impérieuse",
                  "Mission externe / Course professionnelle",
                  "Problème technique / Coupure d'électricité"
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setEmergencyReason(chip)}
                    className={`text-[10px] px-2.5 py-1 rounded-xl border transition cursor-pointer ${
                      emergencyReason === chip
                        ? 'bg-green-950 text-white border-green-950 font-bold'
                        : 'bg-stone-50 hover:bg-green-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-stone-600 block">
                Explication détaillée obligatoire :
              </label>
              <textarea
                value={emergencyReason}
                onChange={(e) => setEmergencyReason(e.target.value)}
                placeholder="Expliciter l'urgence et la raison de la demande..."
                rows={3}
                className="w-full p-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none text-xs text-stone-900"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEmergencyModal(false)}
                className="w-1/3 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={!emergencyReason.trim()}
                onClick={() => {
                  if (!emergencyReason.trim()) return;
                  setShowEmergencyModal(false);
                  handleDeclareEmergency(emergencyType, emergencyReason);
                }}
                className="w-2/3 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded-xl transition cursor-pointer shadow-sm"
              >
                Valider et Enregistrer l'Urgence
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Salary Advance Request Modal */}
      {showLoanModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 border border-green-200 shadow-2xl max-w-md w-full space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-green-100 pb-3">
              <h3 className="font-serif font-bold text-stone-900 flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-green-600" /> Demande d'Avance sur Salaire
              </h3>
              <button onClick={() => setShowLoanModal(false)} className="p-1 text-stone-400 hover:text-stone-700">✕</button>
            </div>

            {loanSuccessMsg ? (
              <div className="p-4 bg-emerald-50 text-emerald-900 rounded-xl text-center font-bold">
                {loanSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleRequestLoan} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-stone-500">Montant souhaité (XAF) :</label>
                  <input
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    required
                    className="w-full p-2.5 border border-stone-200 rounded-xl font-mono text-sm font-bold bg-stone-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-stone-500">Motif de la demande :</label>
                  <textarea
                    value={loanReason}
                    onChange={(e) => setLoanReason(e.target.value)}
                    placeholder="Ex: Frais médicaux urgents, scolarité..."
                    rows={3}
                    className="w-full p-2.5 border border-stone-200 rounded-xl text-xs bg-stone-50"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLoanModal(false)}
                    className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-xs"
                  >
                    Soumettre la demande
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Payslip Detail Viewer Modal */}
      <EmployeePayslipModal
        selectedPayslip={selectedPayslip}
        employeeProfile={employeeProfile}
        onClose={() => setSelectedPayslip(null)}
        formatXAF={formatXAF}
      />

      {/* 📄 CERTIFIED MONTHLY ATTENDANCE REPORT MODAL */}
      <RhReportModal
        isOpen={!!certifiedReport}
        onClose={() => setCertifiedReport(null)}
        report={certifiedReport}
      />

      {/* 🏆 Office QR Code Printable Modal */}
      <OfficeQRCodeModal
        isOpen={showOfficeQRModal}
        onClose={() => setShowOfficeQRModal(false)}
        qrSecret={moduleConfig?.qrCodeSecret || 'CITRINE-HQ-8829'}
        onLaunchKiosk={() => setShowKioskModal(true)}
      />

      {/* 🖥️ Interactive QR Code Kiosk Terminal Modal */}
      <KioskClockingModal
        isOpen={showKioskModal}
        onClose={() => setShowKioskModal(false)}
        employees={employees}
        presences={presences}
        onUpdatePresences={onUpdatePresences}
        onAddNotification={onAddNotification}
        qrSecret={moduleConfig?.qrCodeSecret || 'CITRINE-HQ-8829'}
      />

      {/* 🏆 Clocking Method Selection Modal (Solution 1: QR Code + Solution 3: Wi-Fi/Site/GPS) */}
      {showClockingModal && pendingClockAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative border border-green-100">
            <div className="flex items-center justify-between border-b border-green-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-xl text-green-900">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-stone-900">
                    Valider mon pointage ({pendingClockAction === 'arrival' ? 'Arrivée' : pendingClockAction === 'pauseStart' ? 'Pause' : pendingClockAction === 'pauseEnd' ? 'Reprise' : 'Départ'})
                  </h3>
                  <p className="text-xs text-stone-500">Heure enregistrée : <span className="font-mono font-bold text-stone-900">{getExactNowTime()}</span></p>
                </div>
              </div>
              <button onClick={closeClockingModal} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg">✕</button>
            </div>

            {/* Method Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-stone-100 rounded-2xl">
              <button
                type="button"
                onClick={() => { setSelectedClockMethod('qr_code'); setQrCodeError(null); startCameraScan(); }}
                className={`py-2 px-1.5 rounded-xl text-[11px] font-bold transition flex flex-col items-center gap-1 ${
                  selectedClockMethod === 'qr_code' ? 'bg-white text-green-950 shadow-sm border border-stone-200' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <QrCode className="h-4 w-4 text-green-600" />
                <span>QR Code</span>
              </button>
              <button
                type="button"
                onClick={() => { setSelectedClockMethod('wifi_ip'); setQrCodeError(null); stopCameraScan(); }}
                className={`py-2 px-1.5 rounded-xl text-[11px] font-bold transition flex flex-col items-center gap-1 ${
                  selectedClockMethod === 'wifi_ip' ? 'bg-white text-green-950 shadow-sm border border-stone-200' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Wifi className="h-4 w-4 text-sky-600" />
                <span>Wi-Fi</span>
              </button>
              <button
                type="button"
                onClick={() => { setSelectedClockMethod('gps'); setQrCodeError(null); stopCameraScan(); }}
                className={`py-2 px-1.5 rounded-xl text-[11px] font-bold transition flex flex-col items-center gap-1 ${
                  selectedClockMethod === 'gps' ? 'bg-white text-green-950 shadow-sm border border-stone-200' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <MapPin className="h-4 w-4 text-emerald-600" />
                <span>GPS</span>
              </button>
              <button
                type="button"
                onClick={() => { setSelectedClockMethod('kiosk_pin'); setQrCodeError(null); stopCameraScan(); }}
                className={`py-2 px-1.5 rounded-xl text-[11px] font-bold transition flex flex-col items-center gap-1 ${
                  selectedClockMethod === 'kiosk_pin' ? 'bg-white text-green-950 shadow-sm border border-stone-200' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <KeyRound className="h-4 w-4 text-amber-600" />
                <span>PIN Borne</span>
              </button>
            </div>

            {/* TAB 1: QR CODE */}
            {selectedClockMethod === 'qr_code' && (
              <div className="space-y-4 bg-green-50/50 p-4 rounded-2xl border border-green-100">
                <div className="flex items-start gap-2 text-xs text-green-950">
                  <ShieldCheck className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Scan Caméra Smartphone & Pointage Certifié</p>
                    <p className="text-[11px] text-stone-600">Pointez la caméra de votre téléphone vers le QR Code officiel affiché à l'accueil du bureau.</p>
                  </div>
                </div>

                {/* Camera Scanner Reticle Viewfinder */}
                <div className="bg-[#184844] rounded-2xl p-4 text-white relative overflow-hidden flex flex-col items-center justify-center min-h-[170px] border border-[#2A7B76]/50 shadow-inner">
                  {isCameraActive ? (
                    <div className="relative w-full h-48 flex items-center justify-center bg-black rounded-xl overflow-hidden">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      
                      {/* Laser scanning line */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4A82F] to-transparent animate-bounce opacity-90 shadow-[0_0_15px_#2A7B76]" />

                      {/* Scanning reticle box */}
                      <div className="absolute inset-4 border-2 border-dashed border-[#2A7B76] rounded-2xl pointer-events-none flex flex-col items-center justify-between p-3">
                        <div className="bg-[#184844]/90 border border-[#2A7B76]/60 text-emerald-200 text-[10px] font-mono px-3 py-1 rounded-full backdrop-blur-md">
                          📷 Viseur Caméra Actif
                        </div>
                        <div className="text-[10px] text-white/90 font-mono bg-black/70 px-2 py-0.5 rounded backdrop-blur-xs">
                          Cadrez le QR Code Officiel
                        </div>
                      </div>

                      {cameraError && (
                        <div className="absolute inset-0 bg-[#184844]/95 flex flex-col items-center justify-center p-4 text-center space-y-2 z-10">
                          <AlertCircle className="h-6 w-6 text-amber-400 mx-auto" />
                          <p className="text-xs text-white font-bold">Caméra indisponible ou accès refusé</p>
                          <p className="text-[11px] text-stone-200 max-w-xs">{cameraError}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center space-y-2 py-4">
                      <div className="w-12 h-12 bg-[#236864] text-white rounded-2xl flex items-center justify-center mx-auto border border-emerald-400/40 shadow-md">
                        <Camera className="h-6 w-6" />
                      </div>
                      <p className="text-xs font-semibold text-stone-200">Activez votre caméra pour scanner le QR Code du bureau</p>
                      <button
                        type="button"
                        onClick={startCameraScan}
                        className="px-4 py-2 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold rounded-xl text-xs inline-flex items-center gap-2 transition cursor-pointer shadow-sm"
                      >
                        <Video className="h-4 w-4" /> Activer la Caméra
                      </button>
                    </div>
                  )}

                  {isCameraActive && (
                    <div className="mt-3 flex gap-2 w-full">
                      <button
                        type="button"
                        onClick={() => triggerQrPointageAutoConfirm()}
                        className="flex-1 py-2.5 bg-[#2A7B76] hover:bg-[#20635F] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Scan className="h-4 w-4" /> Valider le Pointage par QR Code
                      </button>
                      <button
                        type="button"
                        onClick={stopCameraScan}
                        className="px-3 py-2.5 bg-[#236864] hover:bg-[#1E5753] text-white text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Fermer Caméra
                      </button>
                    </div>
                  )}
                </div>

                {currentUser?.role !== 'employé' && (
                  <button
                    type="button"
                    onClick={() => setShowOfficeQRModal(true)}
                    className="text-xs text-green-700 underline font-semibold flex items-center gap-1 hover:text-green-900 cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" /> Voir/Imprimer l'affiche QR Code officielle du bureau
                  </button>
                )}
              </div>
            )}

            {/* TAB 2: WI-FI & RÉSEAU D'ENTREPRISE */}
            {selectedClockMethod === 'wifi_ip' && (
              <div className="space-y-3 bg-sky-50/50 p-4 rounded-2xl border border-sky-100">
                <div className="bg-white p-3.5 rounded-2xl border border-sky-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between font-bold text-sky-950">
                    <span className="flex items-center gap-1.5"><Wifi className="h-4 w-4 text-sky-600" /> Contrôle Réseau Wi-Fi Bureau</span>
                    {(moduleConfig?.allowedOfficeIPs || ["192.168.1.100", "192.168.1.1"]).some(ip => ip.trim().toLowerCase() === (detectedNetwork?.ip || "").trim().toLowerCase()) ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        ✓ Connecté au Réseau du Bureau
                      </span>
                    ) : (
                      <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        ✕ Hors du Réseau Entreprise
                      </span>
                    )}
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl space-y-2 text-stone-700 border border-stone-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-stone-800">État de votre connexion :</span>
                      <button
                        type="button"
                        onClick={refreshLiveNetworkIp}
                        disabled={isRefreshingIp}
                        className="text-[11px] text-sky-700 hover:text-sky-900 font-bold underline cursor-pointer flex items-center gap-1"
                      >
                        {isRefreshingIp ? "Vérification..." : "🔄 Tester à nouveau"}
                      </button>
                    </div>

                    {(moduleConfig?.allowedOfficeIPs || ["192.168.1.100", "192.168.1.1"]).some(ip => ip.trim().toLowerCase() === (detectedNetwork?.ip || "").trim().toLowerCase()) ? (
                      <div className="text-emerald-900 font-bold text-xs bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 flex items-center gap-2">
                        <span>🏢 Vous êtes bien connecté au réseau officiel de l'entreprise.</span>
                      </div>
                    ) : (
                      <div className="text-green-900 font-bold text-xs bg-green-50 p-2.5 rounded-lg border border-green-200 space-y-1">
                        <p>⚠️ Vous n'êtes pas connecté au réseau internet du bureau.</p>
                        <p className="text-[11px] font-normal text-green-700">Vous semblez utiliser un Wi-Fi personnel, un réseau externe ou votre connexion 4G/5G mobile.</p>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-sky-50/70 rounded-xl text-[11px] text-sky-900 space-y-1 border border-sky-100">
                    <p className="font-bold flex items-center gap-1">
                      💡 Comment valider votre pointage par Wi-Fi ?
                    </p>
                    <p className="leading-relaxed text-stone-600">
                      Assurez-vous que votre smartphone ou ordinateur est bien connecté au réseau Wi-Fi du bureau avant de cliquer sur "Valider l'Arrivée".
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: GPS (SANS DECLARATION DE SITE) */}
            {selectedClockMethod === 'gps' && (
              <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 text-xs font-semibold text-emerald-950 flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>📍 Vos coordonnées GPS exactes seront enregistrées automatiquement lors de la validation.</span>
              </div>
            )}

            {/* TAB 4: CODE PIN BORNE (16 CARACTÈRES) */}
            {selectedClockMethod === 'kiosk_pin' && (
              <div className="space-y-3 bg-amber-50/60 p-4 rounded-2xl border border-amber-200">
                <div className="flex items-start gap-2 text-xs text-amber-950">
                  <KeyRound className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Pointage par Code PIN Dynamique Borne</p>
                    <p className="text-[11px] text-amber-900/80 leading-relaxed">
                      Si vous n'avez pas de caméra ou de Wi-Fi disponible, saisissez le Code PIN à 16 caractères généré et affiché sur l'écran du responsable/borne.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-800 flex items-center justify-between">
                    <span>Saisissez le Code PIN Borne :</span>
                    <span className="text-[10px] text-amber-700 font-mono font-bold">
                      {kioskPinInput.replace(/[^A-Z0-9]/g, '').length} / 16 caractères
                    </span>
                  </label>
                  <input
                    type="text"
                    value={kioskPinInput}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                      const formatted = val.match(/.{1,4}/g)?.join('-') || val;
                      setKioskPinInput(formatted.slice(0, 19));
                      setQrCodeError(null);
                    }}
                    placeholder="Ex: 8A4F-9K2L-3P7M-5N9Q"
                    className="w-full bg-white border border-amber-300 rounded-xl px-4 py-2.5 font-mono text-base font-bold text-stone-900 tracking-wider text-center focus:ring-2 focus:ring-amber-500 uppercase placeholder:text-stone-300 shadow-xs"
                    maxLength={19}
                  />
                  <p className="text-[10px] text-emerald-700 font-semibold text-center flex items-center justify-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Votre position sera automatiquement validée sur le site de l'entreprise.
                  </p>
                </div>
              </div>
            )}

            {/* Global Error Display */}
            {qrCodeError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-950 rounded-2xl text-xs font-bold flex items-start gap-2 animate-shake">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <span>{qrCodeError}</span>
              </div>
            )}

            {/* Submit Actions */}
            <div className="space-y-2 pt-2">
              {selectedClockMethod === 'qr_code' && (!isCameraActive || !cameraStream) && (
                <p className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 p-2.5 rounded-xl text-center flex items-center justify-center gap-1.5 shadow-3xs">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                  Veuillez activer la caméra pour confirmer votre pointage par QR Code.
                </p>
              )}
              {selectedClockMethod === 'wifi_ip' && !((moduleConfig?.allowedOfficeIPs || ["192.168.1.100", "192.168.1.1"]).some(ip => {
                const cleanIp = ip.trim().toLowerCase();
                const realIp = (detectedNetwork?.ip || "").trim().toLowerCase();
                return cleanIp === realIp || (realIp && cleanIp.includes(realIp));
              })) && (
                <p className="text-[11px] font-bold text-green-800 bg-green-50 border border-green-200/80 p-2.5 rounded-xl text-center flex items-center justify-center gap-1.5 shadow-3xs">
                  <AlertCircle className="h-4 w-4 shrink-0 text-green-600" />
                  Pointage Wi-Fi impossible : Votre IP actuelle ne correspond pas au réseau de l'entreprise.
                </p>
              )}
              {selectedClockMethod === 'kiosk_pin' && kioskPinInput.replace(/[^A-Z0-9]/g, '').length !== 16 && (
                <p className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 p-2.5 rounded-xl text-center flex items-center justify-center gap-1.5 shadow-3xs">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                  Veuillez saisir l'intégralité des 16 caractères du Code PIN Borne.
                </p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeClockingModal}
                  className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={
                    isLocating || 
                    (selectedClockMethod === 'qr_code' && (!isCameraActive || !cameraStream)) ||
                    (selectedClockMethod === 'wifi_ip' && !((moduleConfig?.allowedOfficeIPs || ["192.168.1.100", "192.168.1.1"]).some(ip => {
                      const cleanIp = ip.trim().toLowerCase();
                      const realIp = (detectedNetwork?.ip || "").trim().toLowerCase();
                      return cleanIp === realIp || (realIp && cleanIp.includes(realIp));
                    }))) ||
                    (selectedClockMethod === 'kiosk_pin' && kioskPinInput.replace(/[^A-Z0-9]/g, '').length !== 16)
                  }
                  onClick={() => handleClockAction(
                    pendingClockAction || 'arrival', 
                    undefined, 
                    undefined, 
                    selectedClockMethod, 
                    selectedSiteName, 
                    selectedClockMethod === 'kiosk_pin' ? kioskPinInput : undefined
                  )}
                  className="flex-1 py-3 bg-green-900 hover:bg-green-950 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-green-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition"
                >
                  <Check className="h-4 w-4" />
                  <span>{isLocating ? "Vérification..." : "Confirmer mon pointage"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Floating System */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl flex items-start justify-between gap-3 text-xs font-bold transition-all ${
                t.type === 'success'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/40'
                  : t.type === 'error'
                  ? 'bg-red-600 text-white border-red-500 shadow-red-900/40'
                  : 'bg-[#2A7B76] text-white border-[#226763] shadow-[#1E5753]/30'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {t.type === 'success' && (
                  <div className="p-1 bg-white/20 rounded-lg shrink-0 mt-0.5">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                )}
                {t.type === 'error' && (
                  <div className="p-1 bg-white/20 rounded-lg shrink-0 mt-0.5 animate-bounce">
                    <AlertCircle className="h-4 w-4 text-white" />
                  </div>
                )}
                {t.type === 'info' && (
                  <div className="p-1 bg-white/20 rounded-lg shrink-0 mt-0.5">
                    <Info className="h-4 w-4 text-white" />
                  </div>
                )}
                <div>
                  <p className="font-bold text-xs tracking-tight text-white">{t.title}</p>
                  <p className="text-[11px] font-medium text-white/95 leading-relaxed mt-0.5">{t.message}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
                className="text-white/70 hover:text-white p-1 cursor-pointer shrink-0"
              >
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
