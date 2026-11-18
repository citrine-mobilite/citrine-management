import { getCurrentUserLocation } from '../../../utils/geolocation';

export interface GpsCaptureResult {
  ok: boolean;
  latitude?: number;
  longitude?: number;
  locationLabel?: string;
  reason?: string;
}

export function extractCleanTokenFromScan(scannedRaw: string): string {
  let cleanToken = scannedRaw.trim();
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
  return cleanToken;
}

export async function captureGpsWithTimeout(
  officialSiteName: string,
  _requireGpsStrict: boolean,
  fallbackSuffix: string,
  withTimeoutMs?: number
): Promise<GpsCaptureResult> {
  try {
    const locPromise = getCurrentUserLocation();
    const locResult = withTimeoutMs
      ? await Promise.race([
          locPromise,
          new Promise<{ latitude: number; longitude: number; zoneName?: string } | null>((_, reject) => {
            setTimeout(() => reject(new Error("Délai GPS de 15s dépassé : impossible d'obtenir votre position.")), withTimeoutMs);
          }),
        ])
      : await locPromise;

    if (!locResult || typeof locResult.latitude !== 'number' || typeof locResult.longitude !== 'number') {
      throw new Error('Signal GPS introuvable sur votre appareil.');
    }

    const locationLabel = locResult.zoneName
      ? `${officialSiteName} • ${locResult.zoneName}`
      : `${officialSiteName} (GPS certifié)`;

    return { ok: true, latitude: locResult.latitude, longitude: locResult.longitude, locationLabel };
  } catch (gpsErr: any) {
    const reason = gpsErr?.message || 'Signal GPS introuvable ou accès refusé.';
    return { ok: false, reason };
  }
}
