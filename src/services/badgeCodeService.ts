import { BadgeSecurityCode16 } from '../types';
import { COLLECTIONS, saveDocument, deleteDocument, subscribeToCollection } from './dataService';

// Helper to generate a 16-character alphanumeric code
export function generate16CharCode(): { raw: string; formatted: string } {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const values = new Uint32Array(16);
  globalThis.crypto.getRandomValues(values);
  const raw = Array.from(values, value => chars[value % chars.length]).join('');
  const formatted = `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}`;
  return { raw, formatted };
}

export class BadgeCodeService {
  private codesCache: BadgeSecurityCode16[] = [];

  constructor() {
    // Les codes ne sont chargés que dans les écrans responsables/admin.
  }

  public subscribe(callback: (codes: BadgeSecurityCode16[]) => void) {
    return subscribeToCollection<BadgeSecurityCode16>(COLLECTIONS.BADGE_CODES_16, (list) => {
      this.codesCache = list || [];
      callback(this.codesCache);
    });
  }

  public getCachedCodes(): BadgeSecurityCode16[] {
    return this.codesCache;
  }

  public clearCache(): void {
    this.codesCache = [];
  }

  // Helper to match code intelligently across formatted, raw, or uppercase variations
  private findMatchingCode(list: BadgeSecurityCode16[], cleanedInput: string): BadgeSecurityCode16 | undefined {
    if (!list || !Array.isArray(list)) return undefined;
    return list.find((item) => {
      const itemRaw = String(item.code || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const itemFmt = String(item.formattedCode || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      return itemRaw === cleanedInput || itemFmt === cleanedInput;
    });
  }

  // Generate and save a new 16-character code (Action by Responsable / Admin)
  public async createBadgeCode(
    generatedBy: string,
    notes?: string,
    validityMinutes: number = 3,
    targetMonthOverride?: string
  ): Promise<BadgeSecurityCode16> {
    const { raw, formatted } = generate16CharCode();
    const currentMonth = targetMonthOverride || new Date().toISOString().slice(0, 7); // e.g. "2026-08"
    const now = new Date();
    const expiresAt = validityMinutes > 0 
      ? new Date(now.getTime() + validityMinutes * 60 * 1000).toISOString()
      : undefined;

    const newCode: BadgeSecurityCode16 = {
      id: `code16-${globalThis.crypto.randomUUID()}`,
      code: raw,
      formattedCode: formatted,
      generatedBy: generatedBy || 'Responsable',
      createdAt: now.toISOString(),
      expiresAt,
      targetMonth: currentMonth,
      isUsed: false,
      notes: notes || 'Clé de pointage temporaire 16 caractères (3 min)'
    };

    // Save to database & offline cache
    await saveDocument(COLLECTIONS.BADGE_CODES_16, newCode);

    // Keep memory cache updated immediately
    this.codesCache = [newCode, ...this.codesCache.filter((c) => c.code !== newCode.code)];

    return newCode;
  }

  // Prévalidation UX uniquement : le serveur vérifie et consomme le code dans la transaction de pointage.
  public async validateAndConsumeCode(
    inputCode: string,
    _employeeId: string,
    _employeeName: string,
    _latitude?: number,
    _longitude?: number
  ): Promise<{ success: boolean; error?: string; codeItem?: BadgeSecurityCode16 }> {
    const cleanedInput = (inputCode || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (cleanedInput.length !== 16) {
      return {
        success: false,
        error: `Le code doit comporter exactement 16 caractères (vous avez saisi ${cleanedInput.length}).`,
      };
    }
    return { success: true };
  }

  public async deleteCode(id: string): Promise<void> {
    await deleteDocument(COLLECTIONS.BADGE_CODES_16, id);
    this.codesCache = this.codesCache.filter((c) => c.id !== id);
  }
}

export const badgeCodeService = new BadgeCodeService();
