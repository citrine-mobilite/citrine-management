import { offlineService } from './offlineService';
import { supabaseService } from './supabaseService';
import { cloudSqlService } from './cloudSqlService';
import { supabase } from '../lib/supabase';
import { asyncActionTrackerService } from './asyncActionTrackerService';
import { COLLECTIONS, removeUndefined } from './dataNormalizationAndHealth';
import { logSystemAudit } from './adminAuditService';

async function rollbackDocument(collectionName: string, id: string): Promise<void> {
  try {
    const cached = await offlineService.getCachedCollection(collectionName);
    if (cached) {
      const filtered = cached.filter((c: any) => c.id !== id);
      await offlineService.cacheListLocally(collectionName, filtered as any);
    }
  } catch {}
  cloudSqlService.deleteDocument(collectionName, id).catch(() => {});
  await supabaseService.deleteDocument(collectionName, id);
}

export async function savePresenceAtomic(
  presence: any,
  incident?: any | null,
  notification?: any | null,
  action?: string
): Promise<{ success: boolean; error?: string; data?: any }> {
  return asyncActionTrackerService.track('Enregistrement du pointage...', async () => {
    try {
      const cleanedPresence = removeUndefined(presence);
      if (!cleanedPresence.date) {
        cleanedPresence.date = new Date().toISOString().split('T')[0];
      }
      const cleanedIncident = incident ? removeUndefined(incident) : null;
      const cleanedNotification = notification ? removeUndefined(notification) : null;

      if (cleanedNotification) {
        const fallbackText =
          cleanedNotification.content ||
          cleanedNotification.message ||
          cleanedNotification.description ||
          cleanedNotification.title ||
          'Notification système';
        if (!cleanedNotification.message) cleanedNotification.message = fallbackText;
        if (!cleanedNotification.content) cleanedNotification.content = fallbackText;
        if (!cleanedNotification.title) cleanedNotification.title = 'Pointage';
      }

      // 1. Tenter l'API transactionnelle atomique du serveur (/api/clocking/atomic)
      let apiSuccess = false;
      let serverResult: any = null;

      if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
        try {
          let authHeader = '';
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData?.session?.access_token) {
              authHeader = `Bearer ${sessionData.session.access_token}`;
            }
          } catch {}

          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (authHeader) headers['Authorization'] = authHeader;

          const res = await fetch('/api/clocking/atomic', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              presence: cleanedPresence,
              incident: cleanedIncident,
              notification: cleanedNotification,
              action: action || cleanedPresence?.lastAction,
              employeeName: cleanedPresence?.employeeName,
              employeeEmail: cleanedPresence?.employeeEmail,
              employeeId: cleanedPresence?.employeeId,
            }),
          });

          if (res.ok) {
            const json = await res.json();
            if (json.success) {
              apiSuccess = true;
              serverResult = json;
            } else {
              throw new Error(json.error || 'Erreur lors du pointage atomique');
            }
          } else {
            const errBody = await res.json().catch(() => ({}));
            throw new Error(errBody.error || `Erreur serveur (${res.status})`);
          }
        } catch (fetchErr: any) {
          console.warn('[savePresenceAtomic] API route notice, running direct fallback:', fetchErr?.message);
        }
      }

      // 2. Si l'API HTTP n'a pas répondu (mode offline ou test Node), exécution avec rollback strict
      if (!apiSuccess) {
        let presSaved = false;
        let incSaved = false;
        let notifSaved = false;

        try {
          await Promise.all([
            supabaseService.saveDocument(COLLECTIONS.PRESENCES, cleanedPresence),
            cloudSqlService.saveDocument(COLLECTIONS.PRESENCES, cleanedPresence).catch(() => null),
          ]);
          presSaved = true;

          if (cleanedIncident) {
            await Promise.all([
              supabaseService.saveDocument(COLLECTIONS.ATTENDANCE_INCIDENTS, cleanedIncident),
              cloudSqlService.saveDocument(COLLECTIONS.ATTENDANCE_INCIDENTS, cleanedIncident).catch(() => null),
            ]);
            incSaved = true;
          }

          if (cleanedNotification) {
            await Promise.all([
              supabaseService.saveDocument(COLLECTIONS.NOTIFICATIONS, cleanedNotification),
              cloudSqlService.saveDocument(COLLECTIONS.NOTIFICATIONS, cleanedNotification).catch(() => null),
            ]);
            notifSaved = true;
          }
        } catch (fallbackErr: any) {
          console.error('[savePresenceAtomic fallback rollback]:', fallbackErr);
          if (notifSaved && cleanedNotification?.id) {
            try { await rollbackDocument(COLLECTIONS.NOTIFICATIONS, cleanedNotification.id); } catch {}
          }
          if (incSaved && cleanedIncident?.id) {
            try { await rollbackDocument(COLLECTIONS.ATTENDANCE_INCIDENTS, cleanedIncident.id); } catch {}
          }
          if (presSaved && cleanedPresence?.id) {
            try { await rollbackDocument(COLLECTIONS.PRESENCES, cleanedPresence.id); } catch {}
          }
          return { success: false, error: fallbackErr.message || 'Échec de la transaction atomique de pointage.' };
        }
      }

      // 3. Synchronisation cache local (IndexedDB)
      await offlineService.cacheLocally(COLLECTIONS.PRESENCES, cleanedPresence);
      if (cleanedIncident) {
        await offlineService.cacheLocally(COLLECTIONS.ATTENDANCE_INCIDENTS, cleanedIncident);
      }
      if (cleanedNotification) {
        await offlineService.cacheLocally(COLLECTIONS.NOTIFICATIONS, cleanedNotification);
      }

      if (typeof window !== 'undefined') {
        const actionMap: Record<string, string> = {
          arrival: 'Pointage Arrivée',
          pause_start: 'Début de Pause',
          pause_end: 'Fin de Pause',
          departure: 'Pointage Départ',
        };
        const act = action || cleanedPresence?.lastAction || 'pointage';
        const label = actionMap[act] || 'Pointage & Présence';
        logSystemAudit({
          authorName: cleanedPresence.employeeName || 'Collaborateur',
          targetName: cleanedPresence.employeeName || cleanedPresence.employeeId || 'Collaborateur',
          targetEmployeeId: cleanedPresence.employeeId,
          operationType: 'presence_pointage',
          operationLabel: label,
          details: `${label} enregistré (${cleanedPresence.date}) • Statut : ${cleanedPresence.status || 'present'}${cleanedPresence.location ? ` • ${cleanedPresence.location}` : ''}`,
          level: cleanedPresence.status === 'late' ? 'warning' : 'success',
          metadata: { date: cleanedPresence.date, employeeEmail: cleanedPresence.employeeEmail },
        });
      }

      return { success: true, data: serverResult };
    } catch (err: any) {
      console.error('Atomic presence transaction failed:', err);
      return { success: false, error: err.message || 'Erreur lors de la transaction atomique de pointage (présence non créée)' };
    }
  });
}
