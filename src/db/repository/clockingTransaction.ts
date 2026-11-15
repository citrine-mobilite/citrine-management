import { supabaseAdmin } from '../../lib/supabase';
import { resolveEmployeeDbId, resolveUserDbId } from './tableHelpers';
import {
  resolveClockingDerogations,
  rollbackAtomicClocking,
  verifyDoorQrTokenOnServer,
} from './clockingTransactionHelpers';

export interface AtomicClockingTransactionInput {
  presence: any;
  incident?: any | null;
  notification?: any | null;
}

function incidentRowDoc(row: any): string {
  return row?.doc_id || row?.id || `inc-${Date.now()}`;
}

function notifRowDoc(row: any): string {
  return row?.doc_id || row?.id || `notif-${Date.now()}`;
}

export async function executeAtomicClockingTransaction(input: AtomicClockingTransactionInput) {
  const { presence, incident, notification } = input;
  if (!presence) {
    throw new Error('Données de présence obligatoires pour la transaction atomique.');
  }

  let presenceCreatedDbId: number | null = null;
  let incidentCreatedDbId: number | null = null;
  let notificationCreatedDbId: number | null = null;

  console.log(`🚀 [TRANSACTION POINTAGE INITIALISÉE] Collaborateur: ${presence.employeeName || presence.employeeId} - Date: ${presence.date}`);

  try {
    const empIdVal = presence.employeeId || presence.employee_id;
    const resolvedEmpDbId = await resolveEmployeeDbId(supabaseAdmin, empIdVal);

    const { allowEarlyDeparture15_17: dbAllowEarlyDeparture15_17, allowLateArrival8_930: dbAllowLateArrival8_930 } =
      await resolveClockingDerogations(resolvedEmpDbId, presence.employeeEmail);

    const clockMethod = presence.clockingMethod || presence.method || 'qr_code_door';
    await verifyDoorQrTokenOnServer(clockMethod, presence.qrCodeToken);

    const arrivalTimeStr = presence.arrivalTime ? String(presence.arrivalTime) : '';
    const departureTimeStr = presence.departureTime ? String(presence.departureTime) : '';
    const isExemptLateBackend = dbAllowLateArrival8_930 && arrivalTimeStr >= '08:00' && arrivalTimeStr <= '09:30';
    const isExemptEarlyBackend = dbAllowEarlyDeparture15_17 && departureTimeStr >= '15:00' && departureTimeStr <= '17:00';

    const effectivePresenceStatus = isExemptLateBackend && !departureTimeStr ? 'present' : (presence.status || 'present');
    const effectiveLateMinutes = isExemptLateBackend ? 0 : Number(presence.lateMinutes || 0);

    const presDocId = String(presence.id || presence.docId || `pr-${Date.now()}`);
    const presenceRow: any = {
      doc_id: presDocId,
      employee_id: resolvedEmpDbId || null,
      employee_name: presence.employeeName || presence.employee_name || null,
      date: presence.date || new Date().toISOString().split('T')[0],
      arrival_time: presence.arrivalTime || null,
      departure_time: presence.departureTime || null,
      status: effectivePresenceStatus,
      late_minutes: effectiveLateMinutes,
      pause_minutes: Number(presence.pauseMinutes || 0),
      motif: presence.motif || presence.adminBadgeReason || null,
      signature: presence.signature || null,
      gps_lat: typeof presence.latitude === 'number' ? presence.latitude : (typeof presence.gpsLat === 'number' ? presence.gpsLat : null),
      gps_lng: typeof presence.longitude === 'number' ? presence.longitude : (typeof presence.gpsLng === 'number' ? presence.gpsLng : null),
      method: clockMethod,
      raw_data: {
        ...presence,
        status: effectivePresenceStatus,
        lateMinutes: effectiveLateMinutes,
        id: presDocId,
        qrCodeToken: presence.qrCodeToken || null,
      },
      updated_at: new Date().toISOString(),
    };

    console.log(`📌 [TRANSACTION POINTAGE - ÉTAPE 1/3] Enregistrement présence (${presenceRow.doc_id})...`);
    const { data: savedPresence, error: presErr } = await supabaseAdmin
      .from('presences')
      .upsert(presenceRow, { onConflict: 'doc_id' })
      .select()
      .single();

    if (presErr) {
      console.error('[Atomic Clocking] Presence upsert error:', presErr.message);
      throw new Error(`Échec de sauvegarde de la présence: ${presErr.message}`);
    }
    presenceCreatedDbId = savedPresence.id;
    console.log(`✓ [TRANSACTION POINTAGE - ÉTAPE 1/3] Présence enregistrée (DB ID: ${presenceCreatedDbId})`);

    let savedIncident: any = null;
    const shouldSkipIncident =
      (incident?.type === 'retard' && isExemptLateBackend) ||
      ((incident?.type === 'sortie_prematuree' || incident?.type === 'depart_anticipe') && isExemptEarlyBackend);

    if (incident && !shouldSkipIncident) {
      console.log(`📌 [TRANSACTION POINTAGE - ÉTAPE 2/3] Enregistrement incident (${incident.type})...`);
      const incDocId = String(incident.id || incident.docId || `inc-${Date.now()}`);
      const incEmpId = await resolveEmployeeDbId(supabaseAdmin, incident.employeeId || empIdVal);
      const incidentRow: any = {
        doc_id: incDocId,
        employee_id: incEmpId || resolvedEmpDbId || null,
        date: incident.date || presenceRow.date,
        type: incident.type || 'retard',
        description: incident.reason || incident.description || incident.origin || 'Incident de présence',
        status: incident.status || 'automatique',
        raw_data: { ...incident, id: incDocId },
        updated_at: new Date().toISOString(),
      };

      const { data: incData, error: incErr } = await supabaseAdmin
        .from('attendance_incidents')
        .upsert(incidentRow, { onConflict: 'doc_id' })
        .select()
        .single();

      if (incErr) {
        console.error('[Atomic Clocking] Incident upsert error:', incErr.message);
        throw new Error(`Échec de sauvegarde de l'incident: ${incErr.message}`);
      }
      savedIncident = incData;
      incidentCreatedDbId = incData.id;
      console.log(`✓ [TRANSACTION POINTAGE - ÉTAPE 2/3] Incident consigné (DB ID: ${incidentCreatedDbId})`);
    }

    let savedNotification: any = null;
    if (notification) {
      console.log(`📌 [TRANSACTION POINTAGE - ÉTAPE 3/3] Enregistrement notification système...`);
      const notifDocId = String(notification.id || notification.docId || `notif-clock-${Date.now()}`);
      const resolvedUserId = await resolveUserDbId(
        supabaseAdmin,
        notification.targetUserId || notification.recipient || empIdVal,
        notification.recipient
      );

      const notifText = notification.message || notification.content || notification.description || notification.title || 'Pointage validé';
      const notificationRow: any = {
        doc_id: notifDocId,
        title: notification.title || 'Pointage enregistré',
        message: notifText,
        type: notification.type || 'system',
        is_read: Boolean(notification.isRead ?? notification.read ?? false),
        target_user_id: resolvedUserId || null,
        target_employee_ids: resolvedEmpDbId ? [resolvedEmpDbId] : null,
        raw_data: { ...notification, id: notifDocId },
        updated_at: new Date().toISOString(),
      };

      const { data: notifData, error: notifErr } = await supabaseAdmin
        .from('notifications')
        .upsert(notificationRow, { onConflict: 'doc_id' })
        .select()
        .single();

      if (notifErr) {
        console.error('[Atomic Clocking] Notification upsert error:', notifErr.message);
        throw new Error(`Échec de sauvegarde de la notification: ${notifErr.message}`);
      }
      savedNotification = notifData;
      notificationCreatedDbId = notifData.id;
      console.log(`✓ [TRANSACTION POINTAGE - ÉTAPE 3/3] Notification émise (DB ID: ${notificationCreatedDbId})`);
    }

    console.log(`🎉 [TRANSACTION POINTAGE RÉUSSIE] Présence, incident et notification validés atomiquement !`);
    return {
      success: true,
      presence: { ...presence, id: presDocId, _dbId: presenceCreatedDbId },
      incident: savedIncident ? { ...incident, id: incidentRowDoc(savedIncident), _dbId: incidentCreatedDbId } : null,
      notification: savedNotification ? { ...notification, id: notifRowDoc(savedNotification), _dbId: notificationCreatedDbId } : null,
    };
  } catch (error: any) {
    console.error(`🚨 [TRANSACTION POINTAGE ÉCHOUÉE - ROLLBACK INTÉGRAL] : ${error?.message || error}`);
    await rollbackAtomicClocking(notificationCreatedDbId, incidentCreatedDbId, presenceCreatedDbId);
    throw new Error(`Transaction de pointage atomique annulée : ${error?.message || 'Erreur inconnue'}`);
  }
}
