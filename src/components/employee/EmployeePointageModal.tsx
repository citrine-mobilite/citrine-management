import React, { useState, useEffect } from 'react';
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
  Lock,
  Sparkles
} from 'lucide-react';
import { ClockingMethod, Employee } from '../../types';
import { getCurrentUserLocation } from '../../utils/geolocation';
import { dynamicQrService } from '../../services/dynamicQrService';
import { badgeCodeService } from '../../services/badgeCodeService';

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
}) => {
  // Step in modal: 'select_method' | 'scan_door' | 'scan_dynamic' | 'code_16'
  const [currentStep, setCurrentStep] = useState<'select_method' | 'scan_door' | 'scan_dynamic' | 'code_16'>('select_method');
  
  // 16-character code state
  const [code16Input, setCode16Input] = useState<string>('');
  const [isValidatingCode16, setIsValidatingCode16] = useState<boolean>(false);

  // Manual token simulation input for QR fallback
  const [manualTokenInput, setManualTokenInput] = useState<string>('');
  
  // Specific error messages and GPS blocking
  const [actionError, setActionError] = useState<string | null>(null);
  const [isGpsBlocked, setIsGpsBlocked] = useState<boolean>(false);
  const [isCapturingGps, setIsCapturingGps] = useState<boolean>(false);

  // Reset modal state on open
  useEffect(() => {
    if (showClockingModal) {
      setCurrentStep('select_method');
      setCode16Input('');
      setManualTokenInput('');
      setActionError(null);
      setIsGpsBlocked(false);
      setIsCapturingGps(false);
    } else {
      stopCameraScan();
    }
  }, [showClockingModal]);

  if (!showClockingModal) return null;

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
    stopCameraScan();
    setShowClockingModal(false);
  };

  const handleSelectOption = (option: 'scan_door' | 'scan_dynamic' | 'code_16') => {
    setActionError(null);
    setIsGpsBlocked(false);
    setCurrentStep(option);

    if (option === 'scan_door' || option === 'scan_dynamic') {
      startCameraScan();
    } else {
      stopCameraScan();
    }
  };

  // 1. Process Door QR Code (Fixed QR on door -> GPS REQUIRED)
  const handleValidateDoorQr = async (scannedValue?: string) => {
    setActionError(null);
    setIsGpsBlocked(false);
    setIsCapturingGps(true);

    try {
      // REQUIRE GPS
      const loc = await getCurrentUserLocation();
      if (!loc || !loc.latitude || !loc.longitude) {
        setIsGpsBlocked(true);
        setActionError("⛔ Pointage bloqué : Votre position GPS est obligatoire pour valider le QR code fixe de la porte.");
        return;
      }

      // Success
      stopCameraScan();
      onConfirmClocking('qr_code_door', {
        latitude: loc.latitude,
        longitude: loc.longitude,
        locationName: 'Porte Principale (Vérifié GPS)'
      });
      if (showToast) {
        showToast('Pointage Validé !', 'Votre badgeage via le QR code de la porte a été certifié par GPS.', 'success');
      }
      setShowClockingModal(false);
    } catch (err: any) {
      setIsGpsBlocked(true);
      setActionError(
        "⛔ Pointage bloqué : L'accès à votre position GPS a échoué ou a été refusé. Le pointage par QR code de la porte exige obligatoirement une position GPS valide."
      );
    } finally {
      setIsCapturingGps(false);
    }
  };

  // 2. Process Dynamic QR Code (30s on manager's screen -> NO GPS REQUIRED)
  const handleValidateDynamicQr = async (tokenValue: string) => {
    if (!tokenValue.trim()) {
      setActionError("Veuillez scanner ou saisir un jeton QR code dynamique valide.");
      return;
    }

    setActionError(null);

    try {
      const result = await dynamicQrService.validateAndConsumeDynamicQr(
        tokenValue.trim(),
        employeeProfile.id,
        employeeProfile.name,
        pendingClockAction || 'arrival'
      );

      if (!result.success) {
        setActionError(result.error || "QR Code dynamique invalide ou expiré.");
        return;
      }

      // Success: NO GPS required
      stopCameraScan();
      onConfirmClocking('qr_code_dynamic', {
        locationName: `Validé par Responsable (${result.session?.generatedBy || 'Sur place'})`
      });
      if (showToast) {
        showToast('Pointage Réussi !', `Votre présence a été attestée par ${result.session?.generatedBy || 'le responsable'}.`, 'success');
      }
      setShowClockingModal(false);
    } catch (err: any) {
      setActionError("Une erreur est survenue lors de la validation du QR code dynamique.");
    }
  };

  // 3. Process 16-Character Code (3 min validity -> GPS REQUIRED)
  const handleValidateCode16 = async () => {
    const rawClean = code16Input.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (rawClean.length !== 16) {
      setActionError(`Le code doit comporter exactement 16 caractères (vous avez saisi ${rawClean.length}).`);
      return;
    }

    setActionError(null);
    setIsGpsBlocked(false);
    setIsValidatingCode16(true);

    try {
      // 1. Mandatory GPS Check
      let userLocation;
      try {
        userLocation = await getCurrentUserLocation();
      } catch (gpsErr) {
        setIsGpsBlocked(true);
        setActionError("⛔ Pointage bloqué : Votre position GPS est obligatoire pour valider la clé à 16 caractères.");
        setIsValidatingCode16(false);
        return;
      }

      if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
        setIsGpsBlocked(true);
        setActionError("⛔ Pointage bloqué : Impossible d’acquérir vos coordonnées GPS. Le pointage est refusé.");
        setIsValidatingCode16(false);
        return;
      }

      // 2. Consume code in service
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

      // Success
      onConfirmClocking('badge_code_16', {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        locationName: 'Bureau (Validé par Clé 16 Caractères)'
      });

      if (showToast) {
        showToast('Clé 16 Caractères Validée !', 'Votre pointage et votre position géographique ont été enregistrés avec succès.', 'success');
      }
      setShowClockingModal(false);
    } catch (err: any) {
      setActionError(err.message || "Erreur de validation de la clé.");
    } finally {
      setIsValidatingCode16(false);
    }
  };

  // Format code 16 input nicely (XXXX-XXXX-XXXX-XXXX)
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2A7B76] to-emerald-800 p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            {currentStep !== 'select_method' && (
              <button
                onClick={() => {
                  stopCameraScan();
                  setCurrentStep('select_method');
                  setActionError(null);
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
                  ? "QR Code Imprimé sur la Porte (GPS requis)"
                  : currentStep === 'scan_dynamic'
                  ? "QR Code Dynamique du Responsable (Sans GPS)"
                  : "Clé Temporaire 16 Caractères (GPS requis)"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-white/20 rounded-full transition cursor-pointer text-white/80 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          
          {/* STEP 1: CHOICE OF METHOD */}
          {currentStep === 'select_method' && (
            <div className="space-y-3.5">
              <div className="text-center space-y-1">
                <span className="text-[10px] font-bold text-[#2A7B76] uppercase tracking-wider block">
                  Procédure Officielle de Pointage
                </span>
                <h4 className="text-sm font-bold text-stone-900">
                  Comment souhaitez-vous effectuer votre pointage ?
                </h4>
                <p className="text-xs text-stone-500">
                  Choisissez l'une des 3 options autorisées par l'entreprise :
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                {/* Option 1: Door QR Code */}
                <button
                  type="button"
                  onClick={() => handleSelectOption('scan_door')}
                  className="w-full text-left p-4 rounded-2xl border-2 border-stone-200 hover:border-[#2A7B76] bg-stone-50/60 hover:bg-emerald-50/40 transition-all cursor-pointer group flex items-start gap-3.5 shadow-2xs hover:shadow-sm"
                >
                  <div className="p-2.5 bg-white rounded-xl border border-stone-200 group-hover:border-[#2A7B76] text-[#2A7B76] shrink-0 mt-0.5 shadow-3xs">
                    <DoorClosed className="h-5 w-5" />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-stone-900 group-hover:text-[#2A7B76] transition">
                        1. QR Code Fixe (Porte d'entrée)
                      </span>
                      <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5" /> GPS Requis
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-relaxed">
                      Scannez le QR Code affiché sur la porte des locaux. Votre position GPS sera immédiatement vérifiée.
                    </p>
                  </div>
                </button>

                {/* Option 2: Dynamic QR Code on Manager Screen */}
                <button
                  type="button"
                  onClick={() => handleSelectOption('scan_dynamic')}
                  className="w-full text-left p-4 rounded-2xl border-2 border-stone-200 hover:border-[#2A7B76] bg-stone-50/60 hover:bg-emerald-50/40 transition-all cursor-pointer group flex items-start gap-3.5 shadow-2xs hover:shadow-sm"
                >
                  <div className="p-2.5 bg-white rounded-xl border border-stone-200 group-hover:border-[#2A7B76] text-[#2A7B76] shrink-0 mt-0.5 shadow-3xs">
                    <RefreshCw className="h-5 w-5" />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-stone-900 group-hover:text-[#2A7B76] transition">
                        2. QR Code Dynamique (Écran Responsable)
                      </span>
                      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                        <ShieldCheck className="h-2.5 w-2.5" /> Sans GPS
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-relaxed">
                      Scannez le QR Code affiché sur l'écran du responsable sur place (renouvelé toutes les 30s). Validation directe sans GPS.
                    </p>
                  </div>
                </button>

                {/* Option 3: 16-character code */}
                <button
                  type="button"
                  onClick={() => handleSelectOption('code_16')}
                  className="w-full text-left p-4 rounded-2xl border-2 border-stone-200 hover:border-[#2A7B76] bg-stone-50/60 hover:bg-emerald-50/40 transition-all cursor-pointer group flex items-start gap-3.5 shadow-2xs hover:shadow-sm"
                >
                  <div className="p-2.5 bg-white rounded-xl border border-stone-200 group-hover:border-[#2A7B76] text-[#2A7B76] shrink-0 mt-0.5 shadow-3xs">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-stone-900 group-hover:text-[#2A7B76] transition">
                        3. Clé Temporaire 16 Caractères (3 min)
                      </span>
                      <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5" /> GPS Requis
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-relaxed">
                      Saisissez la clé générée par votre responsable (format XXXX-XXXX-XXXX-XXXX). Votre position GPS sera obligatoirement captée.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2A: DOOR QR CODE SCANNER */}
          {currentStep === 'scan_door' && (
            <div className="space-y-4">
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-center space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Position GPS Obligatoire
                </span>
                <p className="text-xs text-stone-600">
                  Visez le QR Code fixé sur la porte d'entrée de l'agence.
                </p>
              </div>

              {/* Viewfinder */}
              <div className="relative aspect-square max-h-[240px] mx-auto bg-stone-950 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-stone-300 shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 pointer-events-none border-2 border-emerald-400 rounded-2xl m-6 animate-pulse" />
                <div className="absolute bottom-2 bg-black/70 backdrop-blur-xs text-white text-[10px] px-3 py-1 rounded-full font-medium">
                  {isCapturingGps ? "Vérification de la position GPS en cours..." : "Scannez le QR Code de la porte"}
                </div>
              </div>

              {/* Trigger Door Validation with GPS */}
              <button
                onClick={() => handleValidateDoorQr()}
                disabled={isCapturingGps}
                className="w-full py-3 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isCapturingGps ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Géolocalisation & Validation...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Confirmer le Scan avec mon GPS</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 2B: DYNAMIC QR CODE SCANNER (NO GPS REQUIRED) */}
          {currentStep === 'scan_dynamic' && (
            <div className="space-y-4">
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-center space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Sans GPS • Présentiel Responsable
                </span>
                <p className="text-xs text-stone-600">
                  Scannez le QR Code affiché sur l'écran de votre responsable.
                </p>
              </div>

              {/* Viewfinder */}
              <div className="relative aspect-square max-h-[240px] mx-auto bg-stone-950 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-stone-300 shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 pointer-events-none border-2 border-[#2A7B76] rounded-2xl m-6 animate-pulse" />
                <div className="absolute bottom-2 bg-black/70 backdrop-blur-xs text-white text-[10px] px-3 py-1 rounded-full font-medium">
                  Visez l'écran du responsable
                </div>
              </div>

              {/* Quick test/simulation fallback input for dev/preview */}
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <label className="block text-[10px] font-bold text-stone-500 uppercase">
                  Ou saisie directe du jeton dynamique (si caméra indisponible) :
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualTokenInput}
                    onChange={(e) => setManualTokenInput(e.target.value)}
                    placeholder="CITRINE-DYN-30S-..."
                    className="flex-1 px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs font-mono outline-none focus:border-[#2A7B76]"
                  />
                  <button
                    onClick={() => handleValidateDynamicQr(manualTokenInput)}
                    className="px-3 py-1.5 bg-[#2A7B76] hover:bg-[#20635F] text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Valider
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2C: 16-CHARACTER CODE (GPS REQUIRED) */}
          {currentStep === 'code_16' && (
            <div className="space-y-4">
              <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-1 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Position GPS Obligatoire
                </span>
                <h4 className="text-xs font-bold text-stone-900 mt-1">
                  Saisie de la clé d'accès à 16 caractères
                </h4>
                <p className="text-[11px] text-stone-500">
                  Ce code est valable pendant 3 minutes. Votre position GPS sera transmise pour prouver votre présence.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-stone-600 uppercase">
                  Clé d'accès à 16 caractères (Type Windows) :
                </label>
                <input
                  type="text"
                  value={code16Input}
                  onChange={(e) => handleFormatCode16Input(e.target.value)}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  maxLength={19}
                  className="w-full text-center px-4 py-3 bg-stone-50 border-2 border-stone-300 focus:border-[#2A7B76] rounded-2xl font-mono text-base font-extrabold tracking-widest text-stone-900 outline-none uppercase shadow-inner"
                  autoFocus
                />
                <div className="flex justify-between text-[10px] text-stone-400 font-mono px-1">
                  <span>Format : 4 blocs de 4 lettres/chiffres</span>
                  <span>{code16Input.replace(/-/g, '').length} / 16 caractères</span>
                </div>
              </div>

              <button
                onClick={handleValidateCode16}
                disabled={isValidatingCode16 || code16Input.replace(/-/g, '').length !== 16}
                className="w-full py-3 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isValidatingCode16 ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Contrôle GPS & Validation...</span>
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4" />
                    <span>Valider mon Pointage avec le GPS</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* ERROR & GPS BLOCKED BANNER */}
          {actionError && (
            <div className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 animate-in fade-in duration-200 ${
              isGpsBlocked 
                ? 'bg-rose-50 border-rose-300 text-rose-900' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {isGpsBlocked ? (
                <Lock className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <span className="font-bold block">
                  {isGpsBlocked ? "Pointage Bloqué par les Règles de Sécurité" : "Erreur de validation :"}
                </span>
                <p className="text-[11px] leading-relaxed">{actionError}</p>
                {isGpsBlocked && (
                  <p className="text-[10px] text-rose-700 italic pt-0.5">
                    💡 Veuillez autoriser la géolocalisation dans votre navigateur ou demander à votre responsable d'utiliser le <b>QR Code Dynamique</b> (sans GPS).
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Footer Back/Close */}
          <div className="pt-2 flex items-center justify-between border-t border-stone-100">
            {currentStep !== 'select_method' ? (
              <button
                type="button"
                onClick={() => {
                  stopCameraScan();
                  setCurrentStep('select_method');
                  setActionError(null);
                }}
                className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 font-bold transition cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Changer d'option</span>
              </button>
            ) : <div />}

            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Fermer
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EmployeePointageModal;
