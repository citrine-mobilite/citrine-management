import { useState, useEffect } from 'react';

export const TOTP_INTERVAL_SECONDS = 30;
export const DEFAULT_COMPANY_SECRET = 'CITRINE-HQ-8829';

/**
 * Calcule l'index de la tranche temporelle actuelle (time slice)
 */
export function getCurrentTimeSlice(timestampMs: number = Date.now(), intervalSeconds: number = TOTP_INTERVAL_SECONDS): number {
  return Math.floor(timestampMs / (intervalSeconds * 1000));
}

/**
 * Calcule le nombre de secondes restantes dans la tranche courante (de 30 à 0)
 */
export function getRemainingSeconds(timestampMs: number = Date.now(), intervalSeconds: number = TOTP_INTERVAL_SECONDS): number {
  const currentSecond = Math.floor(timestampMs / 1000) % intervalSeconds;
  return intervalSeconds - currentSecond;
}

/**
 * Calcule un hash déterministe SHA-256 pour une tranche horaire et un secret
 */
async function computeSliceHash(secret: string, slice: number): Promise<string> {
  const raw = `${secret.trim().toUpperCase()}:${slice}:citrine-totp-salt-2026`;
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hashBuffer);
  
  // Convertit en code hexadécimal court de 8 caractères
  return Array.from(bytes.slice(0, 4))
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join('');
}

/**
 * Génère le jeton QR Code dynamique TOTP complet pour une tranche donnée
 */
export async function generateTotpToken(secret: string = DEFAULT_COMPANY_SECRET, slice?: number): Promise<string> {
  const activeSlice = slice !== undefined ? slice : getCurrentTimeSlice();
  const hash = await computeSliceHash(secret || DEFAULT_COMPANY_SECRET, activeSlice);
  return `CITRINE-TOTP-${hash}`;
}

/**
 * Valide un code scanné avec une fenêtre de tolérance glissante (T-1, T, T+1)
 * Empêche le scan d'une vieille photo ou d'un QR code expiré.
 */
export async function validateTotpQrCode(
  scannedCode: string,
  companySecret: string = DEFAULT_COMPANY_SECRET
): Promise<{ valid: boolean; reason?: string; isDynamic: boolean }> {
  if (!scannedCode) {
    return { valid: false, reason: 'Aucun code scanné ou saisi.', isDynamic: false };
  }

  const cleaned = scannedCode.trim().toUpperCase();
  const secret = (companySecret || DEFAULT_COMPANY_SECRET).trim().toUpperCase();

  // 1. Détection format dynamique TOTP Citrine
  if (cleaned.startsWith('CITRINE-TOTP-')) {
    const currentSlice = getCurrentTimeSlice();

    // Vérifier la tranche actuelle T, la précédente T-1 (permet 30s de latence), et la suivante T+1
    const allowedSlices = [currentSlice, currentSlice - 1, currentSlice + 1];

    for (const s of allowedSlices) {
      const expectedToken = await generateTotpToken(secret, s);
      if (cleaned === expectedToken) {
        return { valid: true, isDynamic: true };
      }
    }

    // Vérifier si c'est un token récent mais expiré (tranches T-2 à T-10 => il y a 1 à 5 minutes)
    for (let s = currentSlice - 2; s >= currentSlice - 10; s--) {
      const oldToken = await generateTotpToken(secret, s);
      if (cleaned === oldToken) {
        return {
          valid: false,
          reason: 'Ce QR Code dynamique a expiré (validité de 30 secondes dépassée). Veuillez scanner le code en temps réel affiché sur la borne.',
          isDynamic: true,
        };
      }
    }

    return {
      valid: false,
      reason: 'QR Code dynamique non reconnu ou falsifié. Veuillez scanner la borne officielle.',
      isDynamic: true,
    };
  }

  // 2. Mode compatibilité rétroactive avec secret fixe
  if (secret && (cleaned === secret || cleaned.includes(secret))) {
    return { valid: true, isDynamic: false };
  }

  return {
    valid: false,
    reason: 'QR Code non conforme aux paramètres de sécurité de l’entreprise.',
    isDynamic: false,
  };
}

/**
 * Hook React pour afficher en temps réel un QR Code TOTP dynamique sur une borne Kiosque
 */
export function useDynamicQrCode(companySecret: string = DEFAULT_COMPANY_SECRET, intervalSeconds: number = TOTP_INTERVAL_SECONDS) {
  const [currentToken, setCurrentToken] = useState<string>('CITRINE-TOTP-INIT');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => getRemainingSeconds(Date.now(), intervalSeconds));
  const [sliceIndex, setSliceIndex] = useState<number>(() => getCurrentTimeSlice(Date.now(), intervalSeconds));

  useEffect(() => {
    let isMounted = true;

    // Mise à jour immédiate du token
    generateTotpToken(companySecret, sliceIndex).then((token) => {
      if (isMounted) setCurrentToken(token);
    });

    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = getRemainingSeconds(now, intervalSeconds);
      const newSlice = getCurrentTimeSlice(now, intervalSeconds);

      setSecondsRemaining(remaining);

      if (newSlice !== sliceIndex) {
        setSliceIndex(newSlice);
        generateTotpToken(companySecret, newSlice).then((token) => {
          if (isMounted) setCurrentToken(token);
        });
      }
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [companySecret, sliceIndex, intervalSeconds]);

  const progressPercent = Math.round((secondsRemaining / intervalSeconds) * 100);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(currentToken)}`;

  return {
    currentToken,
    secondsRemaining,
    progressPercent,
    qrImageUrl,
    isExpiringSoon: secondsRemaining <= 5,
  };
}
