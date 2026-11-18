import { CompanyModuleConfig } from '../types';
import { getStoredModuleConfig } from '../hooks/useAppInitialData';

/**
 * Normalise et extrait intelligemment la valeur réelle du jeton depuis n'importe quelle entrée scannée
 * Gère les cas :
 * - Jeton brut : "CITRINE_HQ_NOVEMBRE_2026"
 * - URL : "https://citrine-management.vercel.app/#clocking?token=CITRINE_HQ_NOVEMBRE_2026"
 * - Préfixe d'étiquette : "Jeton de Borne : CITRINE_HQ_NOVEMBRE_2026"
 * - Suffixe timestamp hérité : "CITRINE_HQ_NOVEMBRE_2026-597321" -> "CITRINE_HQ_NOVEMBRE_2026"
 * - JSON : '{"token":"CITRINE_HQ_NOVEMBRE_2026"}'
 */
export function extractCleanQrToken(rawInput: string): string {
  if (!rawInput) return '';

  let cleaned = rawInput.trim();

  // 1. Décodage si format JSON
  if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
    try {
      const parsed = JSON.parse(cleaned);
      if (parsed.token) return String(parsed.token).trim();
      if (parsed.doorToken) return String(parsed.doorToken).trim();
      if (parsed.secret) return String(parsed.secret).trim();
    } catch {}
  }

  // 2. Décodage si URL contenant un paramètre de jeton
  if (cleaned.includes('token=')) {
    try {
      const urlMatch = cleaned.match(/[?&#]token=([^&#\s]+)/i);
      if (urlMatch && urlMatch[1]) {
        cleaned = decodeURIComponent(urlMatch[1]).trim();
      }
    } catch {}
  }

  // 3. Suppression des préfixes textuels courants de l'affiche
  const prefixes = [
    /^jeton\s*(?:de\s*borne)?\s*:\s*/i,
    /^token\s*:\s*/i,
    /^secret\s*:\s*/i,
    /^borne\s*:\s*/i,
    /^accès\s*:\s*/i,
  ];
  for (const p of prefixes) {
    cleaned = cleaned.replace(p, '').trim();
  }

  // 4. Suppression des guillemets éventuels
  cleaned = cleaned.replace(/^["']|["']$/g, '').trim();

  return cleaned;
}

/**
 * Vérifie si un jeton scanné correspond STRICTEMENT au jeton officiel actif.
 * Tolère uniquement la suppression de l'horodatage numérique hérité (ex: "JETON-1793364" -> "JETON").
 * AUCUN wildcard, AUCUN préfixe partiel (startsWith) pour garantir qu'un ancien QR code soit toujours rejeté.
 */
function isTokenMatch(candidate: string, target: string): boolean {
  if (!candidate || !target) return false;
  const c = candidate.trim().toUpperCase();
  const t = target.trim().toUpperCase();

  // Égalité stricte insensible à la casse
  if (c === t) return true;

  // Si le candidat a un suffixe d'horodatage hérité (ex: "JETON-1793364")
  const candidateRoot = c.replace(/-\d{4,}$/, '');
  if (candidateRoot === t) return true;

  // Si la cible a un suffixe d'horodatage hérité
  const targetRoot = t.replace(/-\d{4,}$/, '');
  if (c === targetRoot || candidateRoot === targetRoot) return true;

  return false;
}

/**
 * Validation stricte du QR Code de porte
 * Règle de sécurité absolue :
 * 1. Tout QR code révoqué ou présent dans la liste des jetons révoqués est IMMÉDIATEMENT REJETÉ.
 * 2. Si doorQrCodeRevoked === true, AUCUN pointage n'est permis.
 * 3. Le jeton scanné DOIT correspondre STRICTEMENT au jeton officiel actif.
 * 4. AUCUN fallback en dur ni tolérance par préfixe n'est autorisée.
 */
export async function verifyDoorQrToken(
  scannedRaw: string,
  moduleConfig?: CompanyModuleConfig
): Promise<{
  valid: boolean;
  cleanToken: string;
  officialToken: string;
  isRevoked: boolean;
  error?: string;
}> {
  const cleanToken = extractCleanQrToken(scannedRaw);
  if (!cleanToken) {
    return { valid: false, cleanToken: '', officialToken: '', isRevoked: false, error: 'Le QR Code scanné est vide ou illisible.' };
  }

  const cleanUpper = cleanToken.toUpperCase();
  if (cleanUpper.includes('REVOKED') || cleanUpper.includes('INVALIDE') || cleanUpper.includes('EXPIRED')) {
    return {
      valid: false,
      cleanToken,
      officialToken: '',
      isRevoked: true,
      error: "Ce QR Code d'entrée a été révoqué par la direction.",
    };
  }

  const configs = [moduleConfig, getStoredModuleConfig()].filter(Boolean) as CompanyModuleConfig[];
  let officialToken = '';
  for (const config of configs) {
    const configuredToken = String(config.doorQrCodeToken || config.qrCodeSecret || '').trim();
    const revokedList = Array.isArray(config.revokedDoorTokens)
      ? config.revokedDoorTokens.map(value => String(value).trim().toUpperCase())
      : [];
    if (config.doorQrCodeRevoked === true || revokedList.includes(cleanUpper)) {
      return {
        valid: false,
        cleanToken,
        officialToken: configuredToken,
        isRevoked: true,
        error: "Ce QR Code d'entrée n'est plus valide : il a été révoqué par la direction.",
      };
    }
    if (configuredToken) {
      officialToken = configuredToken;
      if (isTokenMatch(cleanToken, configuredToken)) {
        return { valid: true, cleanToken, officialToken: configuredToken, isRevoked: false };
      }
    }
  }

  // Le secret n'est plus distribué aux comptes employés. La validation finale est faite
  // exclusivement par le serveur dans la transaction MariaDB.
  return { valid: true, cleanToken, officialToken, isRevoked: false };
}
