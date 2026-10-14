/**
 * Utilitaire de sécurité cryptographique avec l'API Web Crypto native du navigateur.
 * Utilise l'algorithme PBKDF2 avec SHA-256, 100 000 itérations et un sel aléatoire de 16 octets par utilisateur.
 */

/**
 * Génère un mot de passe fort respectant les exigences de sécurité :
 * - Au moins 10 caractères (12 par défaut)
 * - Contient majuscules, minuscules, chiffres et caractères spéciaux
 */
function getCrypto(): Crypto {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any).crypto) {
    return (globalThis as any).crypto;
  }
  throw new Error('Web Crypto API non disponible');
}

export function generateStrongPassword(length = 12): string {
  const actualLength = Math.max(10, length);
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowers = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const specials = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const password = [
    uppers.charAt(Math.floor(Math.random() * uppers.length)),
    lowers.charAt(Math.floor(Math.random() * lowers.length)),
    digits.charAt(Math.floor(Math.random() * digits.length)),
    specials.charAt(Math.floor(Math.random() * specials.length)),
    specials.charAt(Math.floor(Math.random() * specials.length))
  ];

  const allChars = uppers + lowers + digits + specials;
  while (password.length < actualLength) {
    password.push(allChars.charAt(Math.floor(Math.random() * allChars.length)));
  }

  for (let i = password.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join('');
}

export async function hashPassword(password: string, saltHex?: string): Promise<string> {
  if (!password) return '';
  const cryptoInstance = getCrypto();
  const encoder = new TextEncoder();
  
  let saltBytes: Uint8Array;
  if (saltHex) {
    saltBytes = hexToBytes(saltHex);
  } else {
    saltBytes = new Uint8Array(16);
    cryptoInstance.getRandomValues(saltBytes);
  }
  
  const saltStr = bytesToHex(saltBytes);
  const passwordBuffer = encoder.encode(password);

  const baseKey = await cryptoInstance.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedKey = await cryptoInstance.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    256
  );

  const hashHex = bytesToHex(new Uint8Array(derivedKey));
  return `pbkdf2:${saltStr}:${hashHex}`;
}

/**
 * Vérifie un mot de passe en clair par rapport au mot de passe stocké.
 * Supporte le format haché ("pbkdf2:salt:hash") et effectue une migration automatique transparente si l'ancien mot de passe était en clair.
 */
export async function verifyPassword(
  passwordInput: string,
  storedHashOrPlain?: string
): Promise<{ valid: boolean; needsMigration: boolean; newHash?: string }> {
  if (!storedHashOrPlain || !passwordInput) {
    return { valid: false, needsMigration: false };
  }

  // Format sécurisé PBKDF2
  if (storedHashOrPlain.startsWith('pbkdf2:')) {
    const parts = storedHashOrPlain.split(':');
    if (parts.length === 3) {
      const saltHex = parts[1];
      const computedHash = await hashPassword(passwordInput, saltHex);
      return {
        valid: computedHash === storedHashOrPlain,
        needsMigration: false
      };
    }
  }

  // Support de migration pour anciens mots de passe en clair strictement identiques
  const isDirectMatch = passwordInput === storedHashOrPlain;

  if (isDirectMatch) {
    const newHash = await hashPassword(passwordInput);
    return {
      valid: true,
      needsMigration: true,
      newHash
    };
  }

  return { valid: false, needsMigration: false };
}

/**
 * Génère une signature d'intégrité de session pour empêcher la modification arbitraire
 * du rôle ou de l'ID utilisateur dans le localStorage.
 */
export async function createSessionChecksum(userId: string | number, role: string, email: string): Promise<string> {
  const normId = String(userId || '').trim();
  const normRole = String(role || '').trim().toLowerCase();
  const normEmail = String(email || '').trim().toLowerCase();
  const payload = `${normId}:${normRole}:${normEmail}:citrine-salt-2026`;
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const hashBuffer = await getCrypto().subtle.digest('SHA-256', data);
  return bytesToHex(new Uint8Array(hashBuffer));
}

export async function verifySessionChecksum(userId: string | number, role: string, email: string, signature: string): Promise<boolean> {
  if (!signature) return false;
  const expected = await createSessionChecksum(userId, role, email);
  if (expected === signature) return true;
  // Also check non-lowercased role fallback for backward-compatibility:
  try {
    const rawPayload = `${String(userId).trim()}:${String(role).trim()}:${String(email).trim()}:citrine-salt-2026`;
    const encoder = new TextEncoder();
    const hashBuffer = await getCrypto().subtle.digest('SHA-256', encoder.encode(rawPayload));
    if (bytesToHex(new Uint8Array(hashBuffer)) === signature) return true;
  } catch {}
  return false;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(Math.floor(hex.length / 2));
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}
