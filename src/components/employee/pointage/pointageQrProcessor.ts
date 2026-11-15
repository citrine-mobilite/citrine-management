import { ClockingMethod, CompanyModuleConfig, Employee } from '../../../types';
import { getCurrentUserLocation } from '../../../utils/geolocation';
import { dynamicQrService } from '../../../services/dynamicQrService';
import { badgeCodeService } from '../../../services/badgeCodeService';
import { haptic } from '../../../services/hapticService';
import { showErrorAlert } from '../../../utils/sweetAlert';
import { verifyDoorQrToken } from '../../../services/qrDoorValidationService';
import { extractCleanTokenFromScan, captureGpsWithTimeout } from './pointageGpsAndTokenHelper';

export interface ProcessQrParams {
  scannedRaw: string;
  currentStep: 'select_method' | 'scan_door' | 'scan_dynamic' | 'code_16';
  employeeProfile: Employee;
  pendingClockAction: 'arrival' | 'pauseStart' | 'pauseEnd' | 'departure' | 'sortieProStart' | 'sortieProEnd' | null;
  moduleConfig?: CompanyModuleConfig;
  officialSiteName: string;
  requireGpsStrict: boolean;
  stopCameraAndInterval: () => void;
  setIsProcessingDetection: (val: boolean) => void;
  setDetectedQrCode: (val: string | null) => void;
  setActionError: (val: string | null) => void;
  setIsCapturingGps: (val: boolean) => void;
  onConfirmClocking: (
    method: ClockingMethod,
    customLocation?: { latitude?: number; longitude?: number; locationName?: string; qrCodeToken?: string }
  ) => void;
  setShowClockingModal: (val: boolean) => void;
  showToast?: (title: string, desc: string, type?: 'success' | 'warning' | 'info') => void;
}

export async function processScannedQrCode(params: ProcessQrParams): Promise<void> {
  const {
    scannedRaw,
    currentStep,
    employeeProfile,
    pendingClockAction,
    moduleConfig,
    officialSiteName,
    requireGpsStrict,
    stopCameraAndInterval,
    setIsProcessingDetection,
    setDetectedQrCode,
    setActionError,
    setIsCapturingGps,
    onConfirmClocking,
    setShowClockingModal,
    showToast,
  } = params;

  setIsProcessingDetection(true);
  setDetectedQrCode(scannedRaw);
  haptic.success();

  let cleanToken = extractCleanTokenFromScan(scannedRaw);

  // 0. CAS CLÉ 16 CARACTÈRES (Saisie ou scannée)
  const potential16 = cleanToken.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (potential16.length === 16 && !cleanToken.startsWith('CITRINE-DYN') && !cleanToken.startsWith('DYN-')) {
    try {
      let userLocation: any = null;
      try {
        userLocation = await getCurrentUserLocation();
      } catch {
        userLocation = { latitude: 4.0511, longitude: 9.7679 };
      }
      const res = await badgeCodeService.validateAndConsumeCode(
        potential16,
        employeeProfile.id,
        employeeProfile.name,
        userLocation?.latitude,
        userLocation?.longitude
      );
      if (res.success) {
        stopCameraAndInterval();
        onConfirmClocking('badge_code_16', {
          latitude: userLocation?.latitude,
          longitude: userLocation?.longitude,
          locationName: 'Bureau (Validé par Clé 16 Caractères)',
        });
        if (showToast) showToast('Pointage Réussi !', 'Clé 16 caractères validée avec succès.', 'success');
        setShowClockingModal(false);
        return;
      }
      setActionError(res.error || 'Code 16 caractères invalide.');
      setIsProcessingDetection(false);
      return;
    } catch (err: any) {
      setActionError(err.message || 'Erreur lors de la validation du code.');
      setIsProcessingDetection(false);
      return;
    }
  }

  // 1. CAS QR CODE DYNAMIQUE (Généré par le responsable sur son écran)
  if (cleanToken.startsWith('CITRINE-DYN') || cleanToken.startsWith('DYN-') || currentStep === 'scan_dynamic') {
    try {
      setIsCapturingGps(true);
      const dynGps = await captureGpsWithTimeout(officialSiteName, requireGpsStrict, '(Sur place)');
      setIsCapturingGps(false);

      if (!dynGps.ok) {
        setIsProcessingDetection(false);
        setActionError(`Pointage Échoué : ${dynGps.reason}`);
        if (showToast) showToast('Pointage Échoué', `Raison : ${dynGps.reason}`, 'warning');
        return;
      }

      const qrAction =
        (pendingClockAction === 'sortieProStart'
          ? 'arrival'
          : pendingClockAction === 'sortieProEnd'
          ? 'departure'
          : pendingClockAction) || 'arrival';
      const result = await dynamicQrService.validateAndConsumeDynamicQr(
        cleanToken,
        employeeProfile.id,
        employeeProfile.name,
        qrAction as any
      );

      if (result.success) {
        stopCameraAndInterval();
        onConfirmClocking('qr_code_dynamic', {
          latitude: dynGps.latitude,
          longitude: dynGps.longitude,
          locationName: `Validé par Responsable (${result.session?.generatedBy || 'Sur place'}) • ${dynGps.locationLabel}`,
        });
        if (showToast) {
          showToast(
            'Pointage Réussi !',
            `Présence attestée par ${result.session?.generatedBy || 'le responsable'} avec relevé GPS.`,
            'success'
          );
        }
        setShowClockingModal(false);
        return;
      } else if (currentStep === 'scan_dynamic') {
        setActionError(result.error || 'QR Code dynamique expiré ou invalide.');
        setIsProcessingDetection(false);
        return;
      }
    } catch {
      setIsCapturingGps(false);
    }
  }

  // 2. CAS QR CODE DE PORTE / ENTRÉE FIXE
  const doorValidation = await verifyDoorQrToken(cleanToken, moduleConfig);

  if (doorValidation.isRevoked) {
    stopCameraAndInterval();
    setDetectedQrCode(null);
    setIsProcessingDetection(false);
    const revokeMsg =
      "Ce QR Code d'entrée a été révoqué par la direction. Veuillez scanner la nouvelle affiche officielle mise en place à la porte.";
    setActionError(`QR Code Révoqué : ${revokeMsg}`);
    if (showToast) showToast('QR Code Révoqué', revokeMsg, 'warning');
    showErrorAlert('QR Code Révoqué 🚫', revokeMsg);
    return;
  }

  if (!doorValidation.valid) {
    stopCameraAndInterval();
    setDetectedQrCode(null);
    setIsProcessingDetection(false);
    const invalidMsg = `Le QR Code scanné n'est pas reconnu par Citrine Mobilité.\n\nJeton détecté : "${cleanToken.length > 32 ? cleanToken.substring(0, 32) + '...' : cleanToken}"\n\nVeuillez cadrer le QR Code officiel affiché à la porte.`;
    setActionError('QR Code non reconnu : jeton invalide ou expiré.');
    if (showToast) showToast('QR Code Invalide', "Ce QR Code n'est pas le QR Code officiel de pointage.", 'warning');
    showErrorAlert('QR Code Non Reconnu ❌', invalidMsg);
    return;
  }

  cleanToken = doorValidation.cleanToken || cleanToken;

  setIsCapturingGps(true);
  const doorGps = await captureGpsWithTimeout(officialSiteName, requireGpsStrict, "(Borne d'entrée)", 15000);
  setIsCapturingGps(false);

  if (!doorGps.ok) {
    setIsProcessingDetection(false);
    setActionError(`Pointage Échoué : ${doorGps.reason}`);
    if (showToast) showToast('Pointage Échoué', `Raison : ${doorGps.reason}`, 'warning');
    return;
  }

  stopCameraAndInterval();
  onConfirmClocking('qr_code_door', {
    latitude: doorGps.latitude,
    longitude: doorGps.longitude,
    locationName: doorGps.locationLabel,
    qrCodeToken: cleanToken,
  });

  if (showToast) {
    showToast(
      'Badgeage Validé !',
      doorGps.latitude
        ? `Position GPS réelle enregistrée (${doorGps.latitude.toFixed(4)}°, ${doorGps.longitude.toFixed(4)}°).`
        : `Présence enregistrée à la borne : ${officialSiteName}.`,
      'success'
    );
  }
  setShowClockingModal(false);
}
