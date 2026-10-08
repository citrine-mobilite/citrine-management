import { DynamicQrSession } from '../types';
import { COLLECTIONS, saveDocument, subscribeToDocument, subscribeToCollection, deleteDocument } from './firestoreService';
import { offlineService } from './offlineService';

export class DynamicQrService {
  private activeSessionsCache: DynamicQrSession[] = [];

  constructor() {
    subscribeToCollection<DynamicQrSession>(COLLECTIONS.DYNAMIC_QR_SESSIONS, (sessions) => {
      this.activeSessionsCache = sessions || [];
    });
  }

  // Create an active 30s dynamic QR session for the on-site manager
  public async createSession(managerId: string, managerName: string): Promise<DynamicQrSession> {
    const sessionId = `dynqr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const randomSecret = Math.random().toString(36).substring(2, 9).toUpperCase();
    const token = `CITRINE-DYN-30S-${sessionId}-${randomSecret}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30000).toISOString();

    const session: DynamicQrSession = {
      id: sessionId,
      sessionId,
      token,
      generatedBy: managerName || 'Responsable',
      managerId,
      createdAt: now.toISOString(),
      expiresAt,
      status: 'active'
    };

    await saveDocument(COLLECTIONS.DYNAMIC_QR_SESSIONS, session);
    return session;
  }

  // Renew token for an ongoing session every 30 seconds
  public async renewSessionToken(sessionId: string): Promise<DynamicQrSession | null> {
    const existing = this.activeSessionsCache.find((s) => s.id === sessionId);
    if (!existing || existing.status !== 'active') return null;

    const randomSecret = Math.random().toString(36).substring(2, 9).toUpperCase();
    const newToken = `CITRINE-DYN-30S-${sessionId}-${randomSecret}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30000).toISOString();

    const updatedSession: DynamicQrSession = {
      ...existing,
      token: newToken,
      expiresAt,
    };

    await saveDocument(COLLECTIONS.DYNAMIC_QR_SESSIONS, updatedSession);
    return updatedSession;
  }

  // Real-time listener for the manager's open modal
  public subscribeToSession(sessionId: string, callback: (session: DynamicQrSession | null) => void) {
    return subscribeToDocument<DynamicQrSession>(COLLECTIONS.DYNAMIC_QR_SESSIONS, sessionId, callback);
  }

  // Validate and consume the dynamic QR token when employee scans it
  public async validateAndConsumeDynamicQr(
    scannedToken: string,
    employeeId: string,
    employeeName: string,
    action?: 'arrival' | 'pauseStart' | 'pauseEnd' | 'departure'
  ): Promise<{ success: boolean; error?: string; session?: DynamicQrSession }> {
    const cleanedToken = scannedToken.trim();

    // Check if it conforms to dynamic QR format
    if (!cleanedToken.startsWith('CITRINE-DYN-30S-')) {
      return {
        success: false,
        error: "Ce QR code n'est pas un QR code dynamique officiel de responsable Citrine."
      };
    }

    // Load from cache or offline
    let list = this.activeSessionsCache;
    if (!list || list.length === 0) {
      list = (await offlineService.getCachedCollection<DynamicQrSession>(COLLECTIONS.DYNAMIC_QR_SESSIONS)) || [];
    }

    // Match by token
    const match = list.find((s) => s.token === cleanedToken);
    if (!match) {
      return {
        success: false,
        error: "Ce QR Code dynamique est invalide ou a déjà expiré. Veuillez demander au responsable d'afficher son écran à nouveau."
      };
    }

    if (match.status === 'used') {
      return {
        success: false,
        error: `Ce QR Code dynamique a déjà été utilisé par ${match.usedByEmployeeName || 'un autre collaborateur'}. Un QR Code ne peut servir qu'une seule fois.`
      };
    }

    // Check expiration (with a 4-second safety buffer for camera scan & network trip)
    const expirationTime = new Date(match.expiresAt).getTime();
    const now = Date.now();
    if (now > expirationTime + 4000) {
      return {
        success: false,
        error: "Ce QR Code dynamique a expiré (validité de 30 secondes dépassée). Veuillez scanner le code actuellement visible sur l'écran du responsable."
      };
    }

    // Mark as consumed by employee
    const consumedSession: DynamicQrSession = {
      ...match,
      status: 'used',
      usedByEmployeeId: employeeId,
      usedByEmployeeName: employeeName,
      usedAt: new Date().toISOString(),
      action: action || 'arrival'
    };

    await saveDocument(COLLECTIONS.DYNAMIC_QR_SESSIONS, consumedSession);

    return {
      success: true,
      session: consumedSession
    };
  }

  // Delete or expire a session when manager closes modal
  public async closeSession(sessionId: string): Promise<void> {
    try {
      await deleteDocument(COLLECTIONS.DYNAMIC_QR_SESSIONS, sessionId);
    } catch (e) {
      console.warn('Error closing dynamic QR session:', e);
    }
  }
}

export const dynamicQrService = new DynamicQrService();
