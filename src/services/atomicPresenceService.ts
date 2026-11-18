import { offlineService } from './offlineService';
import { asyncActionTrackerService } from './asyncActionTrackerService';
import { COLLECTIONS, removeUndefined } from './dataNormalizationAndHealth';
import { getApiToken } from './sessionService';

export async function savePresenceAtomic(
  presence: any,
  incident?: any | null,
  notification?: any | null,
  action?: string
): Promise<{ success: boolean; error?: string; data?: any }> {
  return asyncActionTrackerService.track('Enregistrement du pointage...', async () => {
    try {
      const cleanedPresence = removeUndefined(presence);
      if (!cleanedPresence.date) cleanedPresence.date = new Date().toISOString().split('T')[0];
      const cleanedIncident = incident ? removeUndefined(incident) : null;
      const cleanedNotification = notification ? removeUndefined(notification) : null;
      if (cleanedNotification) {
        const message = cleanedNotification.message || cleanedNotification.content || cleanedNotification.description || cleanedNotification.title || 'Notification système';
        cleanedNotification.message = message;
        cleanedNotification.content = cleanedNotification.content || message;
        cleanedNotification.title = cleanedNotification.title || 'Pointage';
      }

      const token = getApiToken();
      if (!token) return { success: false, error: 'Session expirée. Veuillez vous reconnecter.' };
      const response = await fetch('/api/clocking/atomic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          presence: cleanedPresence, incident: cleanedIncident, notification: cleanedNotification,
          action: action || cleanedPresence?.lastAction,
          employeeName: cleanedPresence?.employeeName,
          employeeEmail: cleanedPresence?.employeeEmail,
          employeeId: cleanedPresence?.employeeId,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.error || `Erreur serveur (${response.status})`);

      await offlineService.cacheLocally(COLLECTIONS.PRESENCES, result.presence || cleanedPresence);
      if (result.incident || cleanedIncident) await offlineService.cacheLocally(COLLECTIONS.ATTENDANCE_INCIDENTS, result.incident || cleanedIncident);
      if (result.notification || cleanedNotification) await offlineService.cacheLocally(COLLECTIONS.NOTIFICATIONS, result.notification || cleanedNotification);

      if (typeof window !== 'undefined') {
        const payload = { presence: result.presence || cleanedPresence, incident: result.incident || cleanedIncident, notification: result.notification || cleanedNotification, timestamp: new Date().toISOString() };
        window.dispatchEvent(new CustomEvent('citrine:realtime_presence_badge', { detail: payload }));
        window.dispatchEvent(new CustomEvent('citrine:presence_updated', { detail: payload }));
      }
      return { success: true, data: result };
    } catch (error: any) {
      console.error('[savePresenceAtomic MariaDB]', error);
      return { success: false, error: error?.message || 'Échec de la transaction de pointage.' };
    }
  });
}
