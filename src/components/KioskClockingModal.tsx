import React, { useState } from 'react';
import { 
  X, 
  Search, 
  QrCode, 
  UserCheck, 
  Clock, 
  Coffee, 
  Play, 
  LogOut, 
  CheckCircle2, 
  Building, 
  ShieldCheck, 
  Sparkles,
  MapPin,
  ChevronRight,
  Copy,
  Check,
  MessageSquare
} from 'lucide-react';
import { Employee, Presence, NotificationLog, CompanyModuleConfig } from '../types';
import { COMPANY_HQ_LOCATION, getActiveKioskPinCode, generateKioskPinCode } from '../utils/geolocation';
import { saveDocument, COLLECTIONS } from '../services/firestoreService';
import { KeyRound, RefreshCw } from 'lucide-react';
import { getTimeBasedGreeting, enforceSequentialClockAction, isLate } from '../utils/dateUtils';
import { isNonWorkingDay } from '../utils/cameroonHolidays';

import { getOrCreateDeviceId } from '../utils/deviceFingerprint';
import { haptic } from '../services/hapticService';
import { playSuccessChime, playWarningChime } from '../utils/audioChime';
import { useDynamicQrCode } from '../utils/totpQrService';

interface KioskClockingModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  presences: Presence[];
  onUpdatePresences: (presences: Presence[]) => void;
  onAddNotification: (log: NotificationLog) => void;
  companyName?: string;
  qrSecret?: string;
  moduleConfig?: CompanyModuleConfig;
}

export default function KioskClockingModal({
  isOpen,
  onClose,
  employees,
  presences,
  onUpdatePresences,
  onAddNotification,
  companyName = "Citrine Management HR",
  qrSecret = "",
  moduleConfig
}: KioskClockingModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [kioskPin, setKioskPin] = useState<string>(() => moduleConfig?.kioskPin || getActiveKioskPinCode());
  const [copiedPin, setCopiedPin] = useState(false);

  // Sync with Firestore module config Pin or initialize if not present
  React.useEffect(() => {
    if (moduleConfig?.kioskPin) {
      setKioskPin(moduleConfig.kioskPin);
    } else if (moduleConfig) {
      const newPin = getActiveKioskPinCode();
      setKioskPin(newPin);
      saveDocument(COLLECTIONS.COMPANY_SETTINGS, {
        ...moduleConfig,
        kioskPin: newPin,
        id: 'main_config'
      }).catch((err) => console.error("Failed to seed initial kiosk PIN:", err));
    }
  }, [moduleConfig]);

  const handleRefreshPin = async () => {
    const newPin = generateKioskPinCode();
    setKioskPin(newPin);
    haptic.success();
    if (moduleConfig) {
      try {
        await saveDocument(COLLECTIONS.COMPANY_SETTINGS, {
          ...moduleConfig,
          kioskPin: newPin,
          id: 'main_config'
        });
      } catch (err) {
        console.error("Failed to save kiosk PIN to database:", err);
      }
    }
  };

  const handleCopyPin = () => {
    navigator.clipboard.writeText(kioskPin);
    setCopiedPin(true);
    haptic.success();
    setTimeout(() => setCopiedPin(false), 3000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Bonjour, voici votre code PIN de pointage sécurisé (16 caractères) pour la borne Citrine Management :\n\n*${kioskPin}*\n\nSaisissez ce code dans votre portail collaborateur (méthode Code PIN Kiosque) pour enregistrer votre présence.`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [antiFraudError, setAntiFraudError] = useState<string | null>(null);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>(() => {
    const d = new Date();
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  // Keep live time updated
  React.useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTimeStr(d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const activeEmployees = employees.filter(e => !e.status || e.status === 'en_poste');

  const filteredEmployees = activeEmployees.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.email && emp.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (emp.roleType && emp.roleType.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getTodayPresence = (empId: string): Presence | undefined => {
    return presences.find(p => p.employeeId === empId && p.date === todayStr);
  };

  const getExactHHMM = (): string => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  const handleKioskClocking = (
    employee: Employee,
    actionType: 'arrival' | 'pauseStart' | 'pauseEnd' | 'departure'
  ) => {
    // 🛡️ ANTI-FRAUD DEVICE & IP SCAN VALIDATION
    // Check if the current device/phone has already been used today for another employee
    const currentDeviceId = getOrCreateDeviceId();
    const existingOtherEmpPresence = presences.find(
      p => p.date === todayStr &&
           p.employeeId !== employee.id &&
           p.deviceId === currentDeviceId
    );

    if (existingOtherEmpPresence) {
      const otherEmp = employees.find(e => e.id === existingOtherEmpPresence.employeeId);
      const otherEmpName = otherEmp ? otherEmp.name : 'un autre collaborateur';
      haptic.error();
      setAntiFraudError(
        `⛔ POINTAGE REFUSÉ (Détection Anti-Fraude) : Cet appareil (ou cette connexion IP) a déjà été utilisé aujourd'hui (${todayStr}) pour enregistrer le pointage de ${otherEmpName}. Il est strictly interdit d'utiliser son propre téléphone pour badger à la place d'un collègue ("pointage par procuration").`
      );
      return;
    }

    setAntiFraudError(null);
    const nowHHMM = getExactHHMM();
    const updated = [...presences];
    const recordIndex = updated.findIndex(p => p.employeeId === employee.id && p.date === todayStr);
    
    let record: Presence;
    if (recordIndex >= 0) {
      record = { ...updated[recordIndex] };
    } else {
      record = {
        id: `pres-kiosk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        employeeId: employee.id,
        date: todayStr,
        arrivalTime: null,
        pauseStart: null,
        pauseEnd: null,
        departureTime: null,
        status: 'present'
      };
    }

    // 🛡️ STRICT SEQUENTIAL CLOCKING ENFORCEMENT
    const seqResult = enforceSequentialClockAction(actionType, record);
    if (seqResult.overridden && seqResult.message) {
      setSuccessMessage(seqResult.message);
    }
    actionType = seqResult.effectiveAction;

    let actionLabel = '';

    if (actionType === 'arrival') {
      record.arrivalTime = record.arrivalTime || nowHHMM;
      actionLabel = 'Arrivée';
      const thresh = moduleConfig?.lateThresholdTime;
      if (isNonWorkingDay(record.date)) {
        record.status = 'present';
      } else if (isLate(nowHHMM, thresh)) {
        record.status = 'late';
      } else {
        record.status = 'present';
      }
    } else if (actionType === 'pauseStart') {
      record.pauseStart = nowHHMM;
      actionLabel = 'Début de Pause';
    } else if (actionType === 'pauseEnd') {
      record.pauseEnd = nowHHMM;
      actionLabel = 'Reprise du Travail';
    } else if (actionType === 'departure') {
      record.departureTime = nowHHMM;
      actionLabel = 'Départ';
    }

    // Set HQ Coordinates Douala III & Store Device Fingerprint
    record.location = `[Scan QR Porte Bureau] ${COMPANY_HQ_LOCATION.address}`;
    record.latitude = COMPANY_HQ_LOCATION.latitude;
    record.longitude = COMPANY_HQ_LOCATION.longitude;
    record.clockingMethod = 'qr_code';
    record.siteName = COMPANY_HQ_LOCATION.name;
    record.qrCodeToken = qrSecret;
    record.deviceId = currentDeviceId;
    record.updatedAt = new Date().toISOString();

    record.clockLocations = {
      ...(record.clockLocations || {}),
      [actionType]: {
        latitude: COMPANY_HQ_LOCATION.latitude,
        longitude: COMPANY_HQ_LOCATION.longitude,
        zoneName: `[Borne QR Code Reception] ${COMPANY_HQ_LOCATION.address}`,
        time: nowHHMM,
        method: 'qr_code',
        siteName: COMPANY_HQ_LOCATION.name
      }
    };

    if (recordIndex >= 0) {
      updated[recordIndex] = record;
    } else {
      updated.unshift(record);
    }

    onUpdatePresences(updated);

    // Show instant success Toast & haptic feedback & chime
    haptic.success();
    playSuccessChime();
    const msg = `✅ ${actionLabel} enregistrée pour ${employee.name} à ${nowHHMM} !`;
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 5000);

    // Notification Log
    onAddNotification({
      id: `notif-kiosk-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'whatsapp',
      recipient: employee.phone || employee.email,
      title: record.status === 'late' ? `⚠️ Retard Constaté : ${employee.name}` : `Pointage Borne QR Code : ${actionLabel}`,
      content: record.status === 'late'
        ? `Bonjour ${employee.name}, votre arrivée en retard a été enregistrée à ${nowHHMM} sur la Borne QR Code Accueil (${COMPANY_HQ_LOCATION.address}). Seuil de ponctualité : ${moduleConfig?.lateThresholdTime || 'configuré'}.`
        : `${employee.name} a enregistré [${actionLabel}] à ${nowHHMM} sur la Borne QR Code Accueil (${COMPANY_HQ_LOCATION.address}).`,
      payload: JSON.stringify({ 
        employeeId: employee.id, 
        action: actionType, 
        time: nowHHMM, 
        method: 'qr_code_kiosk',
        event: record.status === 'late' ? 'late_arrival' : undefined,
        threshold: moduleConfig?.lateThresholdTime || ''
      })
    });

    // Close employee selection popup
    setSelectedEmployee(null);
  };

  // 🔄 DYNAMIC TOTP QR CODE (Refreshes automatically every 30 seconds to prevent photo fraud)
  const { 
    currentToken: dynamicTotpToken, 
    secondsRemaining: totpSecondsRemaining, 
    progressPercent: totpProgressPercent, 
    qrImageUrl: dynamicQrImageUrl,
    isExpiringSoon 
  } = useDynamicQrCode(qrSecret || 'CITRINE-HQ-8829', 30);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm p-3 sm:p-6 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-8 space-y-6 shadow-2xl relative border border-green-100 my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition cursor-pointer"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Kiosk Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-green-900 text-green-100 text-[10px] uppercase tracking-wider font-black rounded-full flex items-center gap-1.5">
                <QrCode className="h-3.5 w-3.5 text-green-300" /> Borne d'Affichage QR Code Accueil
              </span>
              <span className="text-xs text-stone-500 font-medium flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-green-600" /> {COMPANY_HQ_LOCATION.address}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
              {companyName}
            </h2>
            <p className="text-xs text-stone-500">
              {getTimeBasedGreeting()} ! Scannez ce QR Code avec votre smartphone pour enregistrer votre pointage individuel.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-stone-900 text-white p-3.5 rounded-2xl shrink-0 border border-stone-800 shadow-md">
            <div className="p-2 bg-green-600 rounded-xl text-white">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Douala • Heure Actuelle</div>
              <div className="text-xl font-mono font-black text-white leading-none mt-0.5">{currentTimeStr}</div>
            </div>
          </div>
        </div>

        {/* Toast Notification Alert */}
        {successMessage && (
          <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-950 px-4 py-3 rounded-2xl flex items-center gap-3 animate-fade-in shadow-sm">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
            <p className="text-xs font-bold">{successMessage}</p>
          </div>
        )}

        {/* Anti-Fraud Error Alert */}
        {antiFraudError && (
          <div className="bg-green-50 border-2 border-green-400 text-green-950 px-4 py-3.5 rounded-2xl flex items-start gap-3 animate-fade-in shadow-md">
            <ShieldCheck className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-green-900">Avertissement de Sécurité & Anti-Fraude</h4>
              <p className="text-xs font-medium text-green-950 leading-relaxed">{antiFraudError}</p>
            </div>
            <button
              onClick={() => setAntiFraudError(null)}
              className="p-1 text-green-400 hover:text-green-700 ml-auto"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Dedicated QR Display Terminal */}
        <div className="bg-gradient-to-br from-green-50/70 via-stone-50 to-amber-50/40 p-6 sm:p-8 rounded-3xl border border-green-100 flex flex-col items-center justify-center text-center space-y-5">
          <div className="bg-white p-4 rounded-3xl shadow-xl border-2 border-green-200 relative group flex flex-col items-center">
            <img src={dynamicQrImageUrl} alt="QR Code Dynamique TOTP Accueil" className="w-48 h-48 object-contain" />
            <div className="absolute -top-2 -right-2 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> TOTP DYNAMIQUE
            </div>

            {/* TOTP 30-Second Progress Bar & Counter */}
            <div className="w-full mt-3 pt-3 border-t border-stone-100 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-stone-600">
                <span className="flex items-center gap-1 text-emerald-800">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Anti-Photo (Renouvelé toutes les 30s)
                </span>
                <span className={`font-mono ${isExpiringSoon ? 'text-amber-600 animate-pulse' : 'text-stone-700'}`}>
                  Expire dans {totpSecondsRemaining}s
                </span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${isExpiringSoon ? 'bg-amber-500' : 'bg-emerald-600'}`}
                  style={{ width: `${totpProgressPercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="space-y-2 max-w-md">
            <div className="text-sm font-bold text-stone-900 flex items-center justify-center gap-2">
              <QrCode className="h-4 w-4 text-green-600" />
              <span>Badgez avec l'application mobile ou votre appareil</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Ouvrez votre portail collaborateur sur votre smartphone et scannez ce code en temps réel pour enregistrer votre <strong>Arrivée</strong>, <strong>Pause</strong> ou <strong>Départ</strong>.
            </p>
            <div className="pt-2 flex flex-col items-center gap-2">
              <span className="text-[11px] text-stone-600 font-mono font-bold bg-white px-3 py-1.5 rounded-xl border border-stone-200 inline-flex items-center gap-2 shadow-2xs">
                <span>Jeton Actuel :</span>
                <span className="text-green-900 font-black tracking-wider">{dynamicTotpToken}</span>
              </span>

              {/* Dynamic 16-character PIN Code Display (4x4 blocks) */}
              <div className="w-full max-w-md bg-stone-900 text-white p-4 rounded-2xl border border-green-700/50 shadow-lg mt-2 flex flex-col items-center gap-2">
                <div className="flex items-center justify-between w-full text-xs font-bold text-green-400">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="h-4 w-4 text-green-400" />
                    <span>CODE PIN BORNE DYNAMIQUE (16 Caractères)</span>
                  </span>
                  <button
                    onClick={handleRefreshPin}
                    className="p-1 hover:bg-stone-800 rounded text-stone-300 hover:text-white transition cursor-pointer flex items-center gap-1 text-[11px]"
                    title="Actualiser et générer un nouveau PIN"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-green-400" />
                    <span>Actualiser</span>
                  </button>
                </div>
                <div className="font-mono text-lg sm:text-xl font-black text-emerald-300 tracking-widest bg-stone-950 px-4 py-2 rounded-xl border border-stone-800 w-full text-center select-all">
                  {kioskPin}
                </div>

                <div className="flex items-center gap-2 w-full pt-1">
                  <button
                    onClick={handleCopyPin}
                    className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    {copiedPin ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span>{copiedPin ? 'PIN Copié !' : 'Copier le PIN'}</span>
                  </button>
                  <button
                    onClick={handleWhatsAppShare}
                    className="flex-1 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Partager WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
