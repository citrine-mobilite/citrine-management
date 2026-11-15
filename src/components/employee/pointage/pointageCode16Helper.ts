import { ClockingMethod, Employee } from '../../../types';
import { getCurrentUserLocation } from '../../../utils/geolocation';
import { badgeCodeService } from '../../../services/badgeCodeService';

export interface ValidateCode16Params {
  code16Input: string;
  employeeProfile: Employee;
  officialSiteName: string;
  requireGpsStrict: boolean;
  setActionError: (val: string | null) => void;
  setIsValidatingCode16: (val: boolean) => void;
  onConfirmClocking: (
    method: ClockingMethod,
    customLocation?: { latitude?: number; longitude?: number; locationName?: string; qrCodeToken?: string }
  ) => void;
  setShowClockingModal: (val: boolean) => void;
  showToast?: (title: string, desc: string, type?: 'success' | 'warning' | 'info') => void;
  fallbackProcessQr: (raw: string) => Promise<void>;
}

export async function validateCode16Attendance(params: ValidateCode16Params): Promise<void> {
  const {
    code16Input,
    employeeProfile,
    officialSiteName,
    requireGpsStrict,
    setActionError,
    setIsValidatingCode16,
    onConfirmClocking,
    setShowClockingModal,
    showToast,
    fallbackProcessQr,
  } = params;

  const rawClean = code16Input.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  if (code16Input.includes('CITRINE') || code16Input.includes('DYN-') || code16Input.trim().length > 16) {
    return fallbackProcessQr(code16Input.trim());
  }

  if (rawClean.length !== 16) {
    setActionError(
      `Le code doit comporter exactement 16 caractères (vous avez saisi ${rawClean.length} caractère${rawClean.length > 1 ? 's' : ''}).`
    );
    return;
  }

  setActionError(null);
  setIsValidatingCode16(true);

  try {
    let userLocation: any = null;
    try {
      userLocation = await getCurrentUserLocation();
    } catch (gpsErr: any) {
      if (requireGpsStrict) {
        const reason = gpsErr?.message || 'Signal GPS obligatoire introuvable ou accès refusé.';
        setActionError(`Pointage Échoué : ${reason}`);
        if (showToast) {
          showToast('Pointage Échoué', `Raison : ${reason}`, 'warning');
        }
        setIsValidatingCode16(false);
        return;
      }
      userLocation = {
        latitude: 4.0511,
        longitude: 9.7679,
        zoneName: officialSiteName,
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
      setActionError(res.error || 'Code invalide.');
      setIsValidatingCode16(false);
      return;
    }

    onConfirmClocking('badge_code_16', {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      locationName: userLocation.zoneName
        ? `${officialSiteName} • ${userLocation.zoneName}`
        : 'Bureau (Validé par Clé 16 Caractères)',
    });

    if (showToast) {
      showToast('Clé 16 Caractères Validée !', 'Votre pointage a été enregistré avec succès.', 'success');
    }
    setShowClockingModal(false);
  } catch (err: any) {
    setActionError(err.message || 'Erreur de validation de la clé.');
  } finally {
    setIsValidatingCode16(false);
  }
}
