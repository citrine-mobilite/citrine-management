import { supabaseAdmin } from '../../lib/supabase';

export async function resolveClockingDerogations(
  resolvedEmpDbId: number | null,
  employeeEmail?: string
): Promise<{ allowEarlyDeparture15_17: boolean; allowLateArrival8_930: boolean }> {
  let dbAllowEarlyDeparture15_17 = false;
  let dbAllowLateArrival8_930 = false;
  try {
    let empRow: any = null;
    if (resolvedEmpDbId) {
      const { data } = await supabaseAdmin.from('employees').select('*').eq('id', resolvedEmpDbId).maybeSingle();
      empRow = data;
    } else if (employeeEmail) {
      const { data } = await supabaseAdmin.from('employees').select('*').ilike('email', String(employeeEmail).trim()).maybeSingle();
      empRow = data;
    }
    const empRaw = (empRow?.raw_data && typeof empRow.raw_data === 'object') ? empRow.raw_data : {};
    let userRow: any = null;
    if (empRow?.user_id) {
      const { data } = await supabaseAdmin.from('users').select('*').eq('id', empRow.user_id).maybeSingle();
      userRow = data;
    } else if (employeeEmail || empRow?.email) {
      const { data } = await supabaseAdmin.from('users').select('*').ilike('email', String(employeeEmail || empRow.email).trim()).maybeSingle();
      userRow = data;
    }
    const userRaw = (userRow?.raw_data && typeof userRow.raw_data === 'object') ? userRow.raw_data : {};

    dbAllowEarlyDeparture15_17 = Boolean(empRaw.allowEarlyDeparture15_17 || userRaw.allowEarlyDeparture15_17);
    dbAllowLateArrival8_930 = Boolean(empRaw.allowLateArrival8_930 || userRaw.allowLateArrival8_930);
  } catch (permErr) {
    console.warn('[repository] Notice vérification dérogations pointage:', permErr);
  }

  return {
    allowEarlyDeparture15_17: dbAllowEarlyDeparture15_17,
    allowLateArrival8_930: dbAllowLateArrival8_930,
  };
}

export async function verifyDoorQrTokenOnServer(clockMethod: string, qrCodeToken?: string): Promise<void> {
  if (clockMethod !== 'qr_code_door') return;

  try {
    const { data: settingsData } = await supabaseAdmin.from('company_settings').select('*');
    if (settingsData && settingsData.length > 0) {
      const cfg = settingsData.find((s: any) => s.id === 'main_config' || s.doc_id === 'main_config') || settingsData[0];
      const rawCfg = (cfg.raw_data && typeof cfg.raw_data === 'object')
        ? cfg.raw_data
        : (cfg.setting_value && typeof cfg.setting_value === 'object' ? cfg.setting_value : cfg);
      const serverDoorToken = (rawCfg.doorQrCodeToken || rawCfg.qrCodeSecret || '').trim();
      const serverRevoked = rawCfg.doorQrCodeRevoked === true;
      const serverRevokedList: string[] = Array.isArray(rawCfg.revokedDoorTokens)
        ? rawCfg.revokedDoorTokens.map((t: string) => String(t).toUpperCase().trim())
        : [];

      const clientToken = (qrCodeToken || '').trim();
      if (clientToken) {
        const cUpper = clientToken.toUpperCase();
        const sUpper = serverDoorToken.toUpperCase();
        const secUpper = (rawCfg.qrCodeSecret || '').trim().toUpperCase();
        const cRoot = cUpper.replace(/-\d{4,}$/, '');

        if (serverRevoked || serverRevokedList.includes(cUpper) || cUpper.includes('REVOKED') || cUpper.includes('INVALIDE')) {
          throw new Error("Pointage rejeté : Ce QR Code d'entrée n'est plus valide (révoqué par la direction).");
        }

        const matches =
          (sUpper && (cUpper === sUpper || cRoot === sUpper)) ||
          (secUpper && (cUpper === secUpper || cRoot === secUpper));

        if (!matches) {
          throw new Error(`Pointage rejeté : Le jeton QR Code ("${clientToken}") n'est plus valide ou ne correspond pas au jeton officiel actif.`);
        }
      }
    }
  } catch (checkErr: any) {
    if (checkErr.message?.includes('Pointage rejeté')) {
      throw checkErr;
    }
    console.warn('[repository] Notice vérification token serveur:', checkErr?.message);
  }
}

export async function rollbackAtomicClocking(
  notificationCreatedDbId: number | null,
  incidentCreatedDbId: number | null,
  presenceCreatedDbId: number | null
): Promise<void> {
  if (notificationCreatedDbId) {
    try {
      await supabaseAdmin.from('notifications').delete().eq('id', notificationCreatedDbId);
    } catch (rbErr: any) {
      console.error(`❌ [ROLLBACK ERREUR] Suppression notification:`, rbErr?.message);
    }
  }
  if (incidentCreatedDbId) {
    try {
      await supabaseAdmin.from('attendance_incidents').delete().eq('id', incidentCreatedDbId);
    } catch (rbErr: any) {
      console.error(`❌ [ROLLBACK ERREUR] Suppression incident:`, rbErr?.message);
    }
  }
  if (presenceCreatedDbId) {
    try {
      await supabaseAdmin.from('presences').delete().eq('id', presenceCreatedDbId);
    } catch (rbErr: any) {
      console.error(`❌ [ROLLBACK ERREUR] Suppression présence:`, rbErr?.message);
    }
  }
}
