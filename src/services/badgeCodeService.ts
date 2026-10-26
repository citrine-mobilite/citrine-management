import { BadgeSecurityCode16 } from '../types';
import { COLLECTIONS, saveDocument, deleteDocument, subscribeToCollection, getCollection } from './dataService';
import { offlineService } from './offlineService';
import { supabase } from '../lib/supabase';

// Helper to generate a 16-character alphanumeric code
export function generate16CharCode(): { raw: string; formatted: string } {
  // Use easily readable uppercase alphanumeric chars (excluding confusing chars like 0, O, 1, I)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let raw = '';
  for (let i = 0; i < 16; i++) {
    raw += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const formatted = `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}`;
  return { raw, formatted };
}

export class BadgeCodeService {
  private codesCache: BadgeSecurityCode16[] = [];

  constructor() {
    // Keep local cache up to date via realtime subscription
    subscribeToCollection<BadgeSecurityCode16>(COLLECTIONS.BADGE_CODES_16, (list) => {
      this.codesCache = list || [];
    });
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
      id: `code16-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
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

  // Validate & consume a code when employee badges
  public async validateAndConsumeCode(
    inputCode: string,
    employeeId: string,
    employeeName: string,
    latitude?: number,
    longitude?: number
  ): Promise<{ success: boolean; error?: string; codeItem?: BadgeSecurityCode16 }> {
    // Clean input code (remove non-alphanumeric, convert to uppercase)
    const cleanedInput = (inputCode || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    if (cleanedInput.length !== 16) {
      return {
        success: false,
        error: `Le code doit comporter exactement 16 caractères (vous avez saisi ${cleanedInput.length} caractère${cleanedInput.length > 1 ? 's' : ''}).`
      };
    }

    // Coordonnées GPS : si non fournies ou invalides, utiliser les coordonnées officielles de l'entreprise
    const validLat = (typeof latitude === 'number' && !isNaN(latitude) && latitude !== 0) ? latitude : 4.0511;
    const validLng = (typeof longitude === 'number' && !isNaN(longitude) && longitude !== 0) ? longitude : 9.7679;

    // 1. Recherche dans le cache mémoire local
    let match = this.findMatchingCode(this.codesCache, cleanedInput);

    // 2. Recherche directe ultra-rapide et ciblée dans Supabase (table badge_codes_16)
    if (!match) {
      try {
        const { data: supaRows } = await supabase
          .from('badge_codes_16')
          .select('*')
          .or(`code.eq.${cleanedInput},code.ilike.%${cleanedInput}%`)
          .limit(10);

        if (supaRows && supaRows.length > 0) {
          for (const row of supaRows) {
            const raw = (row.raw_data && typeof row.raw_data === 'object' ? row.raw_data : {}) as Partial<BadgeSecurityCode16>;
            const rowCode = String(row.code || raw.code || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            if (rowCode === cleanedInput) {
              match = {
                id: raw.id || row.doc_id || String(row.id),
                code: rowCode,
                formattedCode: raw.formattedCode || `${rowCode.slice(0, 4)}-${rowCode.slice(4, 8)}-${rowCode.slice(8, 12)}-${rowCode.slice(12, 16)}`,
                generatedBy: row.created_by || raw.generatedBy || 'Responsable',
                createdAt: row.created_at || raw.createdAt || new Date().toISOString(),
                expiresAt: row.expires_at || raw.expiresAt,
                isUsed: Boolean(row.is_used ?? raw.isUsed ?? false),
                usedAt: row.used_at || raw.usedAt,
                usedByEmployeeId: raw.usedByEmployeeId || (row.employee_id ? String(row.employee_id) : undefined),
                usedByEmployeeName: raw.usedByEmployeeName || row.assigned_name,
                notes: raw.notes,
                targetMonth: raw.targetMonth,
              };
              // Mise à jour immédiate du cache local
              this.codesCache = [match, ...this.codesCache.filter((c) => c.code !== match!.code)];
              break;
            }
          }
        }
      } catch (err) {
        console.warn('[BadgeCodeService] Direct Supabase lookup error:', err);
      }
    }

    // 3. Si toujours non trouvé, interroger la collection globale complète (Supabase + Serveur API)
    if (!match) {
      try {
        const remoteList = await getCollection<BadgeSecurityCode16>(COLLECTIONS.BADGE_CODES_16);
        if (Array.isArray(remoteList) && remoteList.length > 0) {
          this.codesCache = remoteList;
          match = this.findMatchingCode(remoteList, cleanedInput);
        }
      } catch (err) {
        console.warn('[BadgeCodeService] Error fetching collection:', err);
      }
    }

    // 4. Dernier repli : cache local persistant IndexedDB
    if (!match) {
      const offlineList = (await offlineService.getCachedCollection<BadgeSecurityCode16>(COLLECTIONS.BADGE_CODES_16)) || [];
      match = this.findMatchingCode(offlineList, cleanedInput);
    }

    if (!match) {
      return {
        success: false,
        error: "❌ Code à 16 caractères introuvable. Aucun code correspondant n'a été trouvé. Veuillez vérifier les caractères saisis ou demander un nouveau code à votre responsable."
      };
    }

    // Check expiration (3 minutes rule)
    if (match.expiresAt && new Date(match.expiresAt).getTime() < Date.now()) {
      return {
        success: false,
        error: "❌ Ce code temporaire à 16 caractères a expiré (validité de 3 minutes dépassée). Veuillez demander à votre responsable de générer un nouveau code."
      };
    }

    const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

    // Single-use rule: code cannot be used twice
    if (match.isUsed) {
      const usedTime = match.usedAt 
        ? new Date(match.usedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) 
        : 'récemment';
      return {
        success: false,
        error: `❌ Ce code de 16 caractères a déjà été utilisé par ${match.usedByEmployeeName || 'un collaborateur'} le ${usedTime}. Ce code est à usage unique.`
      };
    }

    // Mark as consumed with GPS position
    const updatedCode: BadgeSecurityCode16 = {
      ...match,
      isUsed: true,
      usedByEmployeeId: employeeId,
      usedByEmployeeName: employeeName,
      usedAt: new Date().toISOString(),
      usedMonth: currentMonth,
      usedLatitude: validLat,
      usedLongitude: validLng
    };

    await saveDocument(COLLECTIONS.BADGE_CODES_16, updatedCode);

    // Mettre à jour le cache local immédiatement
    const existingIndex = this.codesCache.findIndex((c) => c.code.toUpperCase() === cleanedInput || c.id === updatedCode.id);
    if (existingIndex >= 0) {
      this.codesCache[existingIndex] = updatedCode;
    } else {
      this.codesCache.push(updatedCode);
    }

    return {
      success: true,
      codeItem: updatedCode
    };
  }

  public async deleteCode(id: string): Promise<void> {
    await deleteDocument(COLLECTIONS.BADGE_CODES_16, id);
    this.codesCache = this.codesCache.filter((c) => c.id !== id);
  }
}

export const badgeCodeService = new BadgeCodeService();
