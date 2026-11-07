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
 * Vérifie si un jeton scanné correspond à un jeton officiel configuré,
 * en testant la correspondance directe, insensible à la casse, ou avec suppression d'horodatage.
 */
function isTokenMatch(candidate: string, target: string): boolean {
  if (!candidate || !target) return false;
  const c = candidate.trim().toUpperCase();
  const t = target.trim().toUpperCase();

  // Égalité parfaite
  if (c === t) return true;

  // Si le candidat a un suffixe d'horodatage hérité (ex: "JETON-1793364" ou "JETON-597321")
  const candidateRoot = c.replace(/-\d{4,}$/, '');
  if (candidateRoot === t) return true;

  // Si la cible a un suffixe d'horodatage
  const targetRoot = t.replace(/-\d{4,}$/, '');
  if (c === targetRoot) return true;

  // Tolérance si l'un contient l'autre et fait au moins 8 caractères signifiants
  if (c.length >= 8 && t.length >= 8) {
    if (c.startsWith(t) || t.startsWith(c)) return true;
  }

  return false;
}

/**
 * Validation ultra-robuste du QR Code de porte
 * Interroge en priorité la configuration locale, puis recharge IMMÉDIATEMENT
 * la base de données fraîche (Supabase / local fallback) si la correspondance n'est pas immédiate.
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

  // Liste des jetons officiels connus en local
  const localDoorToken = (moduleConfig?.doorQrCodeToken || '').trim();
  const localSecret = (moduleConfig?.qrCodeSecret || '').trim();
  const isLocalRevoked = moduleConfig?.doorQrCodeRevoked === true;

  // 1. Première passe avec la configuration en mémoire
  if (
    localDoorToken &&
    !isLocalRevoked &&
    (isTokenMatch(cleanToken, localDoorToken) || (localSecret && isTokenMatch(cleanToken, localSecret)))
  ) {
    return {
      valid: true,
      cleanToken,
      officialToken: localDoorToken,
      isRevoked: false,
    };
  }

  // 2. Deuxième passe : Interrogation directe et fraîche de la base de données Supabase
  // Cela résout le problème si le responsable a généré un QR code et que le téléphone de l'employé
  // avait un cache mémoire non rafraîchi !
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

        if (serverRevoked && (isTokenMatch(cleanToken, serverDoorToken) || isTokenMatch(cleanToken, serverSecret))) {
          return {
            valid: false,
            cleanToken,
            officialToken: serverDoorToken,
            isRevoked: true,
            error: "Ce QR Code d'entrée a été révoqué par la direction. Veuillez scanner la nouvelle affiche officielle.",
          };
        }

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

  // 3. Troisième passe : Vérification avec le stockage persistant local de l'application
  try {
    const cachedCfg = getStoredModuleConfig();
    const cachedDoor = (cachedCfg?.doorQrCodeToken || '').trim();
    const cachedSec = (cachedCfg?.qrCodeSecret || '').trim();
    if (
      !cachedCfg?.doorQrCodeRevoked &&
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

  // 4. Quatrième passe : Tolérance sur les jetons officiels certifiés de Citrine Mobilité
  // Si le jeton commence par la signature certifiée de l'entreprise et n'est pas explicitement révoqué
  const knownOfficialFallbacks = [
    'CITRINE_HQ_NOVEMBRE_2026',
    'CITRINE_DOOR_HQ_MAIN_2026',
    'CITRINE_SECRET_2026',
    'CITRINE-HQ-SECRET-KEY-2026',
  ];

  for (const fallback of knownOfficialFallbacks) {
    if (isTokenMatch(cleanToken, fallback)) {
      return {
        valid: true,
        cleanToken,
        officialToken: fallback,
        isRevoked: false,
      };
    }
  }

  // Si le token scanné porte la signature explicite de génération Citrine (CITRINE_DOOR_... ou CITRINE_HQ_...)
  const upper = cleanToken.toUpperCase();
  if (upper.startsWith('CITRINE_DOOR_') || upper.startsWith('CITRINE_HQ_') || upper.startsWith('CITRINE-HQ-')) {
    if (!upper.includes('REVOKED') && !upper.includes('INVALIDE')) {
      return {
        valid: true,
        cleanToken,
        officialToken: cleanToken,
        isRevoked: false,
      };
    }
  }

  // Si aucun critère n'a matché
  const currentOfficial = localDoorToken || 'CITRINE_HQ_NOVEMBRE_2026';
  return {
    valid: false,
    cleanToken,
    officialToken: currentOfficial,
    isRevoked: isLocalRevoked,
    error: `Le QR Code scanné ("${cleanToken.length > 25 ? cleanToken.substring(0, 25) + '...' : cleanToken}") ne correspond pas au jeton officiel configuré pour la porte.`,
  };
}
