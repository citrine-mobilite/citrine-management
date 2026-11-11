import { CompanyModuleConfig } from '../types';
import { supabase, supabaseAdmin } from '../lib/supabase';
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
    return {
      valid: false,
      cleanToken: '',
      officialToken: '',
      isRevoked: false,
      error: 'Le QR Code scanné est vide ou illisible.',
    };
  }

  const cleanUpper = cleanToken.toUpperCase();

  // Vérification immédiate si le jeton porte une signature de révocation
  if (cleanUpper.includes('REVOKED') || cleanUpper.includes('INVALIDE') || cleanUpper.includes('EXPIRED')) {
    return {
      valid: false,
      cleanToken,
      officialToken: '',
      isRevoked: true,
      error: "Ce QR Code d'entrée a été révoqué par la direction. Veuillez scanner la nouvelle affiche officielle.",
    };
  }

  // 1. Récupération des paramètres en mémoire / configuration locale
  const localDoorToken = (moduleConfig?.doorQrCodeToken || '').trim();
  const localSecret = (moduleConfig?.qrCodeSecret || '').trim();
  const isLocalRevoked = moduleConfig?.doorQrCodeRevoked === true;
  const localRevokedList: string[] = Array.isArray(moduleConfig?.revokedDoorTokens)
    ? moduleConfig.revokedDoorTokens.map((t) => String(t).toUpperCase().trim())
    : [];

  // Si le QR code est explicitement révoqué en local
  if (isLocalRevoked || localRevokedList.includes(cleanUpper)) {
    return {
      valid: false,
      cleanToken,
      officialToken: localDoorToken,
      isRevoked: true,
      error: "Ce QR Code d'entrée n'est plus valide : il a été révoqué par la direction.",
    };
  }

  // 2. Première passe : correspondance stricte avec la configuration en mémoire
  if (
    localDoorToken &&
    (isTokenMatch(cleanToken, localDoorToken) || (localSecret && isTokenMatch(cleanToken, localSecret)))
  ) {
    return {
      valid: true,
      cleanToken,
      officialToken: localDoorToken,
      isRevoked: false,
    };
  }

  // 3. Deuxième passe : Interrogation directe et fraîche de la base de données Supabase
  // (permet de synchroniser instantanément si le responsable vient de changer le QR code)
  try {
    const client = supabaseAdmin || supabase;
    const { data: dbRows, error: dbErr } = await client
      .from('company_settings')
      .select('*')
      .order('id', { ascending: false })
      .limit(3);

    if (!dbErr && dbRows && dbRows.length > 0) {
      for (const row of dbRows) {
        const raw = (row.raw_data && typeof row.raw_data === 'object') ? row.raw_data : row;
        const serverDoorToken = (raw.doorQrCodeToken || raw.qrCodeSecret || '').trim();
        const serverSecret = (raw.qrCodeSecret || '').trim();
        const serverRevoked = raw.doorQrCodeRevoked === true;
        const serverRevokedList: string[] = Array.isArray(raw.revokedDoorTokens)
          ? raw.revokedDoorTokens.map((t: string) => String(t).toUpperCase().trim())
          : [];

        // Révocation détectée sur le serveur
        if (
          serverRevoked ||
          serverRevokedList.includes(cleanUpper) ||
          (serverRevoked && (isTokenMatch(cleanToken, serverDoorToken) || isTokenMatch(cleanToken, serverSecret)))
        ) {
          return {
            valid: false,
            cleanToken,
            officialToken: serverDoorToken,
            isRevoked: true,
            error: "Ce QR Code d'entrée n'est plus valide : il a été révoqué par la direction. Veuillez scanner la nouvelle affiche officielle.",
          };
        }

        // Correspondance stricte avec le jeton actif en base
        if (
          !serverRevoked &&
          (isTokenMatch(cleanToken, serverDoorToken) || (serverSecret && isTokenMatch(cleanToken, serverSecret)))
        ) {
          return {
            valid: true,
            cleanToken,
            officialToken: serverDoorToken || cleanToken,
            isRevoked: false,
          };
        }
      }
    }
  } catch (netErr) {
    console.warn('[verifyDoorQrToken] Erreur vérification directe base Supabase:', netErr);
  }

  // 4. Troisième passe : Vérification avec le stockage persistant local de l'application
  try {
    const cachedCfg = getStoredModuleConfig();
    const cachedDoor = (cachedCfg?.doorQrCodeToken || '').trim();
    const cachedSec = (cachedCfg?.qrCodeSecret || '').trim();
    const cachedRevoked = cachedCfg?.doorQrCodeRevoked === true;
    const cachedRevokedList: string[] = Array.isArray(cachedCfg?.revokedDoorTokens)
      ? cachedCfg.revokedDoorTokens.map((t) => String(t).toUpperCase().trim())
      : [];

    if (cachedRevoked || cachedRevokedList.includes(cleanUpper)) {
      return {
        valid: false,
        cleanToken,
        officialToken: cachedDoor,
        isRevoked: true,
        error: "Ce QR Code d'entrée a été révoqué par la direction.",
      };
    }

    if (
      !cachedRevoked &&
      (isTokenMatch(cleanToken, cachedDoor) || (cachedSec && isTokenMatch(cleanToken, cachedSec)))
    ) {
      return {
        valid: true,
        cleanToken,
        officialToken: cachedDoor || cleanToken,
        isRevoked: false,
      };
    }
  } catch {}

  // 5. Tout autre jeton est STRICTEMENT INVALIDE (plus aucun fallback en dur ni acceptation par préfixe)
  const currentOfficial = localDoorToken || 'QR Code non configuré';
  return {
    valid: false,
    cleanToken,
    officialToken: currentOfficial,
    isRevoked: isLocalRevoked,
    error: `QR Code invalide ou expiré ("${cleanToken.length > 25 ? cleanToken.substring(0, 25) + '...' : cleanToken}"). Seul le QR Code officiel affiché à la porte est accepté.`,
  };
}
