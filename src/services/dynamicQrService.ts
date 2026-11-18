import { DynamicQrSession } from '../types';
import { COLLECTIONS, saveDocument, subscribeToDocument, deleteDocument } from './dataService';

export class DynamicQrService {
  private activeSessionsCache: DynamicQrSession[] = [];

  constructor() {
    // Les sessions actives ne sont chargées que dans l'écran responsable.
  }

  private generateRandomSecret(): string {
    const bytes = new Uint8Array(20);
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  public clearCache(): void {
    this.activeSessionsCache = [];
  }

  // Create an active 30s dynamic QR session for the on-site manager
  public async createSession(managerId: string, managerName: string): Promise<DynamicQrSession> {
    const sessionId = `dynqr-${globalThis.crypto.randomUUID()}`;
    const randomSecret = this.generateRandomSecret();
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
    this.activeSessionsCache = [session, ...this.activeSessionsCache.filter((s) => s.id !== session.id)];
    return session;
  }

  // Renew token for an ongoing session every 30 seconds
  public async renewSessionToken(sessionId: string): Promise<DynamicQrSession | null> {
    const existing = this.activeSessionsCache.find((s) => s.id === sessionId);
    if (!existing || existing.status !== 'active') return null;

    const randomSecret = this.generateRandomSecret();
    const newToken = `CITRINE-DYN-30S-${sessionId}-${randomSecret}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30000).toISOString();

    const updatedSession: DynamicQrSession = {
      ...existing,
      token: newToken,
      expiresAt,
    };

    await saveDocument(COLLECTIONS.DYNAMIC_QR_SESSIONS, updatedSession);
    const idx = this.activeSessionsCache.findIndex((s) => s.id === sessionId);
    if (idx >= 0) {
      this.activeSessionsCache[idx] = updatedSession;
    }
    return updatedSession;
  }

  // Real-time listener for the manager's open modal
  public subscribeToSession(sessionId: string, callback: (session: DynamicQrSession | null) => void) {
    return subscribeToDocument<DynamicQrSession>(COLLECTIONS.DYNAMIC_QR_SESSIONS, sessionId, (session) => {
      if (session) {
        const index = this.activeSessionsCache.findIndex(item => item.id === session.id);
        if (index >= 0) this.activeSessionsCache[index] = session;
        else this.activeSessionsCache.push(session);
      } else {
        this.activeSessionsCache = this.activeSessionsCache.filter(item => item.id !== sessionId);
      }
      callback(session);
    });
  }

  // Prévalidation du format uniquement : le serveur vérifie l'expiration et consomme le jeton atomiquement.
  public async validateAndConsumeDynamicQr(
    scannedToken: string,
    _employeeId: string,
    _employeeName: string,
    _action?: 'arrival' | 'pauseStart' | 'pauseEnd' | 'departure'
  ): Promise<{ success: boolean; error?: string; session?: DynamicQrSession }> {
    const cleanedToken = (scannedToken || '').trim();
    if (!cleanedToken.startsWith('CITRINE-DYN-30S-') || cleanedToken.length < 32) {
      return {
        success: false,
        error: "Ce QR code n'est pas un QR code dynamique officiel de responsable Citrine.",
      };
    }
    return {
      success: true,
      session: {
        id: 'pending-server-validation',
        sessionId: 'pending-server-validation',
        token: cleanedToken,
        generatedBy: 'Responsable',
        managerId: '',
        createdAt: new Date().toISOString(),
        expiresAt: '',
        status: 'active',
      },
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
