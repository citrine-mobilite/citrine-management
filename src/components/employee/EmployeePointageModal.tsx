import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Camera, 
  RefreshCw, 
  X, 
  QrCode, 
  AlertCircle, 
  ShieldCheck, 
  DoorClosed, 
  KeyRound, 
  MapPin, 
  Check, 
  ArrowLeft,
  Sparkles,
  Upload,
  CheckCircle2
} from 'lucide-react';
import jsQR from 'jsqr';
import { ClockingMethod, Employee, CompanyModuleConfig } from '../../types';
import { getCurrentUserLocation } from '../../utils/geolocation';
import { dynamicQrService } from '../../services/dynamicQrService';
import { badgeCodeService } from '../../services/badgeCodeService';
import { haptic } from '../../services/hapticService';

interface EmployeePointageModalProps {
  showClockingModal: boolean;
  setShowClockingModal: (val: boolean) => void;
  pendingClockAction: 'arrival' | 'pauseStart' | 'pauseEnd' | 'departure' | null;
  selectedClockMethod: ClockingMethod;
  setSelectedClockMethod: (val: ClockingMethod) => void;
  qrCodeError: string | null;
  setQrCodeError: (val: string | null) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stopCameraScan: () => void;
  startCameraScan: () => void;
  isLocating: boolean;
  employeeProfile: Employee;
  onConfirmClocking: (
    method: ClockingMethod, 
    customLocation?: { latitude?: number; longitude?: number; locationName?: string }
  ) => void;
  showToast?: (title: string, desc: string, type?: 'success' | 'warning' | 'info') => void;
  moduleConfig?: CompanyModuleConfig;
}

export const EmployeePointageModal: React.FC<EmployeePointageModalProps> = ({
  showClockingModal,
  setShowClockingModal,
  pendingClockAction,
  videoRef,
  stopCameraScan,
  startCameraScan,
  employeeProfile,
  onConfirmClocking,
  showToast,
  moduleConfig,
}) => {
  // Mode dans le modal : 'select_method' | 'scan_door' | 'scan_dynamic' | 'code_16'
  const [currentStep, setCurrentStep] = useState<'select_method' | 'scan_door' | 'scan_dynamic' | 'code_16'>('select_method');
  
  // 16-character code state
  const [code16Input, setCode16Input] = useState<string>('');
  const [isValidatingCode16, setIsValidatingCode16] = useState<boolean>(false);

  // Manual token simulation input for QR fallback
  const [manualTokenInput, setManualTokenInput] = useState<string>('');
  
  // Specific error messages and GPS blocking
  const [actionError, setActionError] = useState<string | null>(null);
  const [isCapturingGps, setIsCapturingGps] = useState<boolean>(false);
  const [detectedQrCode, setDetectedQrCode] = useState<string | null>(null);
  const [isProcessingDetection, setIsProcessingDetection] = useState<boolean>(false);

  // Canvas caché pour analyse jsQR
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanIntervalRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const officialDoorToken = moduleConfig?.doorQrCodeToken || moduleConfig?.qrCodeSecret || 'CITRINE_DOOR_HQ_MAIN_2026';
  const officialSiteName = moduleConfig?.doorQrSiteName || moduleConfig?.hqName || 'Entrée Principale (HQ Siège)';
  const requireGpsStrict = moduleConfig?.doorQrRequireGps === true;

  // Réinitialisation de l'état à l'ouverture
  useEffect(() => {
    if (showClockingModal) {
      setCurrentStep('select_method');
      setCode16Input('');
      setManualTokenInput('');
      setActionError(null);
      setIsCapturingGps(false);
      setDetectedQrCode(null);
      setIsProcessingDetection(false);
    } else {
      stopCameraScan();
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    }
  }, [showClockingModal, stopCameraScan]);

  const getActionTitle = () => {
    switch (pendingClockAction) {
      case 'arrival':
        return 'Badger mon Arrivée';
      case 'pauseStart':
        return 'Badger mon Début de Pause';
      case 'pauseEnd':
        return 'Badger mon Retour de Pause';
      case 'departure':
        return 'Badger mon Départ';
      default:
        return 'Pointage de Présence';
    }
  };

  const handleClose = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    stopCameraScan();
    setShowClockingModal(false);
  };

  // Traitement centralisé et intelligent du QR Code décodé
  const handleProcessScannedQrCode = useCallback(async (scannedRaw: string) => {
    if (!scannedRaw || isProcessingDetection) return;
    setIsProcessingDetection(true);
    setDetectedQrCode(scannedRaw);
    haptic.success();

    let cleanToken = scannedRaw.trim();
    // Si c'est une URL contenant un paramètre token
    if (cleanToken.includes('token=')) {
      try {
        const urlObj = new URL(cleanToken, window.location.origin);
        const urlToken = urlObj.searchParams.get('token');
        if (urlToken) cleanToken = urlToken;
      } catch {
        const match = cleanToken.match(/token=([^&]+)/);
        if (match && match[1]) cleanToken = decodeURIComponent(match[1]);
      }
    }

    // 1. CAS QR CODE DYNAMIQUE (Généré par le responsable sur son écran)
    if (cleanToken.startsWith('CITRINE-DYN') || cleanToken.startsWith('DYN-') || currentStep === 'scan_dynamic') {
      try {
        const result = await dynamicQrService.validateAndConsumeDynamicQr(
          cleanToken,
          employeeProfile.id,
          employeeProfile.name,
          pendingClockAction || 'arrival'
        );

        if (result.success) {
          stopCameraScan();
          if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
          onConfirmClocking('qr_code_dynamic', {
            locationName: `Validé par Responsable (${result.session?.generatedBy || 'Sur place'})`
          });
          if (showToast) {
            showToast('Pointage Réussi !', `Présence attestée par ${result.session?.generatedBy || 'le responsable'}.`, 'success');
          }
          setShowClockingModal(false);
          return;
        } else if (currentStep === 'scan_dynamic') {
          setActionError(result.error || "QR Code dynamique expiré ou invalide.");
          setIsProcessingDetection(false);
          return;
        }
      } catch {
        // Poursuite si non dynamique
      }
    }

    // 2. CAS QR CODE DE PORTE / ENTRÉE FIXE
    setIsCapturingGps(true);
    let capturedLat = moduleConfig?.companyLatitude || moduleConfig?.hqLatitude || 4.051056;
    let capturedLng = moduleConfig?.companyLongitude || moduleConfig?.hqLongitude || 9.7678687;
    let locationLabel = officialSiteName;

    try {
      // Tentative rapide de géolocalisation sans blocage si non strict
      const locPromise = getCurrentUserLocation();
      const timeoutPromise = new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
        setTimeout(() => resolve(null), 2500); // 2.5s max pour ne pas faire attendre le salarié
      });

      const locResult = await Promise.race([locPromise, timeoutPromise]);
      if (locResult && locResult.latitude && locResult.longitude) {
        capturedLat = locResult.latitude;
        capturedLng = locResult.longitude;
        locationLabel = `${officialSiteName} (Certifié GPS)`;
      } else if (requireGpsStrict) {
        setIsCapturingGps(false);
        setIsProcessingDetection(false);
        setActionError("⛔ La configuration de l'entreprise exige un signal GPS pour ce QR code. Veuillez autoriser la localisation sur votre smartphone.");
        return;
      }
    } catch (gpsErr) {
      if (requireGpsStrict) {
        setIsCapturingGps(false);
        setIsProcessingDetection(false);
        setActionError("⛔ Impossible d'acquérir votre position GPS. Veuillez autoriser la localisation.");
        return;
      }
    }

    // Validation du badgeage
    stopCameraScan();
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

    onConfirmClocking('qr_code_door', {
      latitude: capturedLat,
      longitude: capturedLng,
      locationName: locationLabel,
    });

    if (showToast) {
      showToast('Badgeage Validé !', `Votre présence a été enregistrée à la borne : ${officialSiteName}.`, 'success');
    }
    setShowClockingModal(false);
  }, [
    isProcessingDetection,
    currentStep,
    employeeProfile.id,
    employeeProfile.name,
    pendingClockAction,
    stopCameraScan,
    onConfirmClocking,
    showToast,
    moduleConfig,
    officialSiteName,
    requireGpsStrict,
    setShowClockingModal
  ]);

  // Boucle de scan continu avec jsQR sur la vidéo
  useEffect(() => {
    if (currentStep !== 'scan_door' && currentStep !== 'scan_dynamic') {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      return;
    }

    // Création du canvas d'analyse si inexistant
    if (!hiddenCanvasRef.current) {
      hiddenCanvasRef.current = document.createElement('canvas');
    }

    // Lancement de la boucle de détection à ~8-10 scans/seconde
    scanIntervalRef.current = setInterval(() => {
      if (isProcessingDetection) return;
      const video = videoRef.current;
      const canvas = hiddenCanvasRef.current;

      if (!video || !canvas || video.readyState < 2) return;
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Détection QR Code avec jsQR
      const qrResult = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (qrResult && qrResult.data) {
        const found = qrResult.data.trim();
        if (found.length > 2) {
          handleProcessScannedQrCode(found);
        }
      }
    }, 120);

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    };
  }, [currentStep, isProcessingDetection, videoRef, handleProcessScannedQrCode]);

  // Gestion du choix d'option
  const handleSelectOption = (option: 'scan_door' | 'scan_dynamic' | 'code_16') => {
    setActionError(null);
    setCurrentStep(option);
    setDetectedQrCode(null);
    setIsProcessingDetection(false);

    if (option === 'scan_door' || option === 'scan_dynamic') {
      startCameraScan();
    } else {
      stopCameraScan();
    }
  };

  // Traitement d'une image/photo de QR code importée (si la caméra webRTC est bloquée)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrResult = jsQR(imageData.data, imageData.width, imageData.height);

        if (qrResult && qrResult.data) {
          handleProcessScannedQrCode(qrResult.data);
        } else {
          setActionError("Aucun QR Code valide n'a été détecté sur cette photo. Veuillez prendre une image plus nette.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Traitement validation 16 caractères
  const handleValidateCode16 = async () => {
    const rawClean = code16Input.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (rawClean.length !== 16) {
      setActionError(`Le code doit comporter exactement 16 caractères (vous avez saisi ${rawClean.length}).`);
      return;
    }

    setActionError(null);
    setIsValidatingCode16(true);

    try {
      let userLocation: any = null;
      try {
        userLocation = await getCurrentUserLocation();
      } catch {
        // Repli coordonnées siège si GPS inaccessible
        userLocation = {
          latitude: moduleConfig?.companyLatitude || 4.051056,
          longitude: moduleConfig?.companyLongitude || 9.7678687
        };
      }

      const res = await badgeCodeService.validateAndConsumeCode(
        rawClean,
        employeeProfile.id,
        employeeProfile.name,
        userLocation.latitude,
        userLocation.longitude
      );

      if (!res.success) {
        setActionError(res.error || "Code invalide.");
        setIsValidatingCode16(false);
        return;
      }

      onConfirmClocking('badge_code_16', {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        locationName: 'Bureau (Validé par Clé 16 Caractères)'
      });

      if (showToast) {
        showToast('Clé 16 Caractères Validée !', 'Votre pointage a été enregistré avec succès.', 'success');
      }
      setShowClockingModal(false);
    } catch (err: any) {
      setActionError(err.message || "Erreur de validation de la clé.");
    } finally {
      setIsValidatingCode16(false);
    }
  };

  const handleFormatCode16Input = (val: string) => {
    const cleaned = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 16);
    let formatted = '';
    for (let i = 0; i < cleaned.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += '-';
      formatted += cleaned[i];
    }
    setCode16Input(formatted);
    setActionError(null);
  };

  if (!showClockingModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2A7B76] to-emerald-800 p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            {currentStep !== 'select_method' && (
              <button
                type="button"
                onClick={() => {
                  stopCameraScan();
                  if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
                  setCurrentStep('select_method');
                  setActionError(null);
                  setDetectedQrCode(null);
                }}
                className="p-1 hover:bg-white/20 rounded-full transition cursor-pointer text-white/80 hover:text-white"
                title="Retour au choix des méthodes"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div>
              <h3 className="font-serif font-bold text-sm">{getActionTitle()}</h3>
              <p className="text-[10px] text-emerald-100">
                {currentStep === 'select_method'
                  ? "Sélectionnez votre option de pointage"
                  : currentStep === 'scan_door'
                  ? "QR Code Fixe de la Porte (Détection Automatique)"
                  : currentStep === 'scan_dynamic'
                  ? "QR Code Dynamique du Responsable (Sans GPS)"
                  : "Clé Temporaire 16 Caractères"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 hover:bg-white/20 rounded-full transition cursor-pointer text-white/80 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Messages d'erreur */}
          {actionError && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs animate-in slide-in-from-top duration-200">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{actionError}</div>
            </div>
          )}

          {/* STEP 1: CHOIX DU POINTAGE */}
          {currentStep === 'select_method' && (
            <div className="space-y-3.5">
              <div className="text-center space-y-1">
                <span className="text-[10px] font-bold text-[#2A7B76] uppercase tracking-wider block">
                  Procédure Officielle de Pointage
                </span>
                <h4 className="text-sm font-bold text-stone-900">
                  Comment souhaitez-vous badger votre présence ?
                </h4>
                <p className="text-xs text-stone-500">
                  Le système scanne et valide immédiatement dès que le QR Code apparaît :
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                {/* Option 1: Door QR Code (Le plus utilisé à l'entrée) */}
                <button
                  type="button"
                  onClick={() => handleSelectOption('scan_door')}
                  className="w-full text-left p-4 rounded-2xl border-2 border-stone-200 hover:border-[#2A7B76] bg-stone-50/70 hover:bg-emerald-50/40 transition-all cursor-pointer group flex items-start gap-3.5 shadow-2xs hover:shadow-sm"
                >
                  <div className="p-2.5 bg-white rounded-xl border border-stone-200 group-hover:border-[#2A7B76] text-[#2A7B76] shrink-0 mt-0.5 shadow-3xs">
                    <DoorClosed className="h-5 w-5" />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-stone-900 group-hover:text-[#2A7B76] transition">
                        1. Scanner le QR Code de l'Entrée (Porte des Locaux)
                      </span>
                      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5" /> Auto-Badge
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-relaxed">
                      Pointez votre caméra vers l'affiche à l'entrée. Le scan détecte le QR Code et badge automatiquement votre présence !
                    </p>
                  </div>
                </button>

                {/* Option 2: Dynamic QR Code on Manager Screen */}
                <button
                  type="button"
                  onClick={() => handleSelectOption('scan_dynamic')}
                  className="w-full text-left p-4 rounded-2xl border-2 border-stone-200 hover:border-[#2A7B76] bg-stone-50/70 hover:bg-emerald-50/40 transition-all cursor-pointer group flex items-start gap-3.5 shadow-2xs hover:shadow-sm"
                >
                  <div className="p-2.5 bg-white rounded-xl border border-stone-200 group-hover:border-[#2A7B76] text-[#2A7B76] shrink-0 mt-0.5 shadow-3xs">
                    <RefreshCw className="h-5 w-5" />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-stone-900 group-hover:text-[#2A7B76] transition">
                        2. QR Code Dynamique (Écran Responsable)
                      </span>
                      <span className="text-[9px] font-bold bg-teal-100 text-[#2A7B76] px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                        <ShieldCheck className="h-2.5 w-2.5" /> Sans GPS
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-relaxed">
                      Scannez le QR Code affiché sur l'écran du manager (renouvelé toutes les 30s).
                    </p>
                  </div>
                </button>

                {/* Option 3: 16-character code */}
                <button
                  type="button"
                  onClick={() => handleSelectOption('code_16')}
                  className="w-full text-left p-4 rounded-2xl border-2 border-stone-200 hover:border-[#2A7B76] bg-stone-50/70 hover:bg-emerald-50/40 transition-all cursor-pointer group flex items-start gap-3.5 shadow-2xs hover:shadow-sm"
                >
                  <div className="p-2.5 bg-white rounded-xl border border-stone-200 group-hover:border-[#2A7B76] text-[#2A7B76] shrink-0 mt-0.5 shadow-3xs">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-stone-900 group-hover:text-[#2A7B76] transition">
                        3. Saisie d'une Clé à 16 Caractères
                      </span>
                      <span className="text-[9px] font-bold bg-stone-200 text-stone-800 px-2 py-0.5 rounded-full shrink-0">
                        Secours
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-relaxed">
                      Saisissez la clé générée par votre responsable (format XXXX-XXXX-XXXX-XXXX).
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2A / 2B: SCANNER AVEC DÉTECTION EN DIRECT */}
          {(currentStep === 'scan_door' || currentStep === 'scan_dynamic') && (
            <div className="space-y-4">
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-center space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                  <Camera className="h-3 w-3" /> Scanner en Direct Actif
                </span>
                <p className="text-xs text-stone-600 font-medium">
                  {currentStep === 'scan_door'
                    ? `Pointez la caméra vers l'affiche collée à l'entrée (${officialSiteName}).`
                    : "Pointez la caméra vers le QR Code sur l'écran du responsable."}
                </p>
              </div>

              {/* Viseur Caméra avec Animation de Détection */}
              <div className="relative aspect-square max-h-[250px] mx-auto bg-stone-950 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-stone-300 shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Laser de Scan Continu */}
                {!isProcessingDetection && (
                  <div className="absolute inset-x-6 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-[bounce_2s_infinite]" />
                )}

                {/* Cadre de Viseur */}
                <div className={`absolute inset-0 pointer-events-none border-2 rounded-2xl m-6 transition-all duration-300 ${
                  isProcessingDetection ? 'border-emerald-400 bg-emerald-500/20 scale-105' : 'border-emerald-400/80 animate-pulse'
                }`} />

                {/* Statut flottant */}
                <div className="absolute bottom-2.5 bg-black/75 backdrop-blur-xs text-white text-[11px] px-3.5 py-1.5 rounded-full font-medium flex items-center gap-2">
                  {isProcessingDetection ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 animate-spin" />
                      <span className="text-emerald-200 font-bold">QR Code Détecté ! Validation du badgeage...</span>
                    </>
                  ) : isCapturingGps ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-300" />
                      <span>Vérification de localisation...</span>
                    </>
                  ) : (
                    <>
                      <QrCode className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Alignez le QR Code au centre pour badger</span>
                    </>
                  )}
                </div>
              </div>

              {/* Bouton de secours : valider directement ou téléverser photo */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                {/* Valider manuellement le scan de porte sans attendre si nécessaire */}
                <button
                  type="button"
                  onClick={() => handleProcessScannedQrCode(officialDoorToken)}
                  disabled={isProcessingDetection}
                  className="flex-1 py-2.5 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  <span>Valider mon Badgeage Présentiel</span>
                </button>

                {/* Téléverser une photo du QR Code */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs rounded-xl border border-stone-200 transition cursor-pointer flex items-center justify-center gap-1.5"
                  title="Si la caméra web ne capte pas le QR Code"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Photo QR</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              {/* Champ d'entrée manuelle en repli absolu */}
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
                <label className="block text-[10px] font-bold text-stone-500 uppercase">
                  Ou saisie directe du code (si appareil photo non disponible) :
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualTokenInput}
                    onChange={(e) => setManualTokenInput(e.target.value)}
                    placeholder={currentStep === 'scan_door' ? officialDoorToken : "CITRINE-DYN-..."}
                    className="flex-1 px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs font-mono outline-none focus:border-[#2A7B76]"
                  />
                  <button
                    type="button"
                    onClick={() => handleProcessScannedQrCode(manualTokenInput.trim() || officialDoorToken)}
                    className="px-3.5 py-1.5 bg-[#2A7B76] hover:bg-[#20635F] text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Valider
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2C: CLÉ 16 CARACTÈRES */}
          {currentStep === 'code_16' && (
            <div className="space-y-4">
              <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-1 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                  <KeyRound className="h-3 w-3" /> Clé de Sécurité Temporaire
                </span>
                <h4 className="text-xs font-bold text-stone-900 mt-1">
                  Saisie de la clé d'accès à 16 caractères
                </h4>
                <p className="text-[11px] text-stone-500">
                  Cette clé est à usage unique et valable pendant 3 minutes après sa génération par le responsable.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-stone-600 uppercase">
                  Clé d'accès à 16 caractères (Format XXXX-XXXX-XXXX-XXXX) :
                </label>
                <input
                  type="text"
                  value={code16Input}
                  onChange={(e) => handleFormatCode16Input(e.target.value)}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  maxLength={19}
                  className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 rounded-xl font-mono text-center text-sm font-bold tracking-wider text-stone-900 uppercase focus:border-[#2A7B76] focus:bg-white transition outline-none shadow-inner"
                />
              </div>

              <button
                type="button"
                onClick={handleValidateCode16}
                disabled={isValidatingCode16 || code16Input.replace(/-/g, '').length !== 16}
                className="w-full py-3 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isValidatingCode16 ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Validation du code en cours...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Valider mon Badgeage par Clé</span>
                  </>
                )}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
export default EmployeePointageModal;
