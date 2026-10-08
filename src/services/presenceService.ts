import { ClockingMethod, Presence } from '../types';
import { COLLECTIONS, saveDocument } from './firestoreService';
import { badgeCodeService } from './badgeCodeService';
import { dynamicQrService } from './dynamicQrService';

export class PresenceService {
  /**
   * Enregistre un pointage selon la méthode choisie.
   */
  public async registerPresence(
    presenceData: Omit<Presence, 'id'>,
    method: ClockingMethod,
    metadata: {
      employeeName?: string;
      gps?: { lat: number; lng: number };
      managerId?: string;
      managerName?: string;
      motif?: string;
      code?: string; // Pour alphanumeric ou QR
    }
  ): Promise<{ success: boolean; error?: string }> {
    
    // Logique métier commune : validation GPS si nécessaire
    if (['qr_code_door', 'badge_code_16'].includes(method) && (!metadata.gps)) {
      return { success: false, error: "La position GPS est requise pour ce type de pointage." };
    }

    const empName = metadata.employeeName || 'Employé';

    // Logique spécifique par méthode
    switch (method) {
      case 'badge_code_16':
        if (!metadata.code) return { success: false, error: "Code requis." };
        const validation = await badgeCodeService.validateAndConsumeCode(
          metadata.code,
          presenceData.employeeId,
          empName,
          metadata.gps?.lat,
          metadata.gps?.lng
        );
        if (!validation.success) return { success: false, error: validation.error };
        break;
      
      case 'qr_code_dynamic':
        if (!metadata.code) return { success: false, error: "Code requis." };
        const qrValidation = await dynamicQrService.validateAndConsumeDynamicQr(
          metadata.code,
          presenceData.employeeId,
          empName
        );
        if (!qrValidation.success) return { success: false, error: qrValidation.error };
        break;
      
      case 'admin_on_behalf':
        break;

      default:
        break;
    }

    // Préparation de l'objet presence conforme à l'interface
    const presence: Presence = {
      ...presenceData,
      id: `presence-${Date.now()}`,
      clockingMethod: method,
      latitude: metadata.gps?.lat,
      longitude: metadata.gps?.lng,
      badgedByAdminId: metadata.managerId,
      badgedByAdminName: metadata.managerName,
      adminBadgeReason: metadata.motif,
      updatedAt: new Date().toISOString(),
    };

    await saveDocument(COLLECTIONS.PRESENCES, presence);
    return { success: true };
  }
}

export const presenceService = new PresenceService();
