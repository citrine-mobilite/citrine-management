import { BadgeSecurityCode16 } from '../types';
import { COLLECTIONS, saveDocument, deleteDocument, subscribeToCollection } from './firestoreService';
import { offlineService } from './offlineService';

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
    // Keep local cache up to date
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

  // Generate and save a new 16-character code (Action by Responsable / Admin)
  public async createBadgeCode(
    generatedBy: string,
    notes?: string,
    targetMonthOverride?: string
  ): Promise<BadgeSecurityCode16> {
    const { raw, formatted } = generate16CharCode();
    const currentMonth = targetMonthOverride || new Date().toISOString().slice(0, 7); // e.g. "2026-08"

    const newCode: BadgeSecurityCode16 = {
      id: `code16-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      code: raw,
      formattedCode: formatted,
      generatedBy: generatedBy || 'Responsable',
      createdAt: new Date().toISOString(),
      targetMonth: currentMonth,
      isUsed: false,
      notes: notes || 'Code de pointage entreprise 16 caractères'
    };

    await saveDocument(COLLECTIONS.BADGE_CODES_16, newCode);
    return newCode;
  }

  // Validate & consume a code when employee badges
  public async validateAndConsumeCode(
    inputCode: string,
    employeeId: string,
    employeeName: string
  ): Promise<{ success: boolean; error?: string; codeItem?: BadgeSecurityCode16 }> {
    // Clean input code (remove non-alphanumeric, convert to uppercase)
    const cleanedInput = inputCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    if (cleanedInput.length !== 16) {
      return {
        success: false,
        error: `Le code doit comporter exactement 16 caractères (vous avez saisi ${cleanedInput.length} caractère${cleanedInput.length > 1 ? 's' : ''}).`
      };
    }

    // Load fresh cached collection or offline list
    let list = this.codesCache;
    if (!list || list.length === 0) {
      list = (await offlineService.getCachedCollection<BadgeSecurityCode16>(COLLECTIONS.BADGE_CODES_16)) || [];
    }

    // Find code matching the raw 16-char string
    const match = list.find((item) => item.code.toUpperCase() === cleanedInput);

    if (!match) {
      return {
        success: false,
        error: "❌ Code à 16 caractères invalide. Aucun code correspondant n'a été trouvé. Veuillez demander un code à votre responsable."
      };
    }

    const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

    // RÈGLE MÉTIER ABSOLUE : "un code ne peut pas etre utilisé deux fois le meme mois"
    if (match.isUsed && match.usedMonth === currentMonth) {
      return {
        success: false,
        error: `❌ Ce code de 16 caractères a déjà été utilisé ce mois-ci (${match.usedMonth}) par ${match.usedByEmployeeName || 'un collaborateur'} le ${new Date(match.usedAt || '').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}. Un code ne peut pas être réutilisé deux fois le même mois.`
      };
    }

    // If code was already used in a previous month, check if it's reusable or already consumed
    if (match.isUsed) {
      return {
        success: false,
        error: `❌ Ce code de 16 caractères a déjà été utilisé le ${new Date(match.usedAt || '').toLocaleDateString('fr-FR')}. Veuillez demander un nouveau code généré pour ce mois-ci.`
      };
    }

    // Mark as consumed
    const updatedCode: BadgeSecurityCode16 = {
      ...match,
      isUsed: true,
      usedByEmployeeId: employeeId,
      usedByEmployeeName: employeeName,
      usedAt: new Date().toISOString(),
      usedMonth: currentMonth
    };

    await saveDocument(COLLECTIONS.BADGE_CODES_16, updatedCode);

    return {
      success: true,
      codeItem: updatedCode
    };
  }

  public async deleteCode(id: string): Promise<void> {
    await deleteDocument(COLLECTIONS.BADGE_CODES_16, id);
  }
}

export const badgeCodeService = new BadgeCodeService();
