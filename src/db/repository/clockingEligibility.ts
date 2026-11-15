import { supabaseAdmin } from '../../lib/supabase';

export async function checkClockingEligibilityBackend(params: {
  employeeId?: string;
  userId?: string;
  email?: string;
}) {
  const empId = params.employeeId ? String(params.employeeId).trim() : '';
  const userId = params.userId ? String(params.userId).trim() : '';
  const email = params.email ? String(params.email).trim().toLowerCase() : '';

  let empRow: any = null;
  let userRow: any = null;

  try {
    if (empId) {
      if (/^\d+$/.test(empId)) {
        const { data } = await supabaseAdmin.from('employees').select('*').eq('id', Number(empId)).maybeSingle();
        empRow = data;
      }
      if (!empRow) {
        const { data } = await supabaseAdmin.from('employees').select('*').eq('doc_id', empId).maybeSingle();
        empRow = data;
      }
    }
    if (!empRow && email) {
      const { data } = await supabaseAdmin.from('employees').select('*').ilike('email', email).maybeSingle();
      empRow = data;
    }
    if (!empRow && userId && /^\d+$/.test(userId)) {
      const { data } = await supabaseAdmin.from('employees').select('*').eq('user_id', Number(userId)).maybeSingle();
      empRow = data;
    }

    if (userId) {
      if (/^\d+$/.test(userId)) {
        const { data } = await supabaseAdmin.from('users').select('*').eq('id', Number(userId)).maybeSingle();
        userRow = data;
      }
      if (!userRow) {
        const { data } = await supabaseAdmin.from('users').select('*').eq('doc_id', userId).maybeSingle();
        userRow = data;
      }
    } else if (empRow?.user_id) {
      const { data } = await supabaseAdmin.from('users').select('*').eq('id', empRow.user_id).maybeSingle();
      userRow = data;
    }
    if (!userRow && email) {
      const { data } = await supabaseAdmin.from('users').select('*').ilike('email', email).maybeSingle();
      userRow = data;
    } else if (!userRow && empRow?.email) {
      const { data } = await supabaseAdmin.from('users').select('*').ilike('email', String(empRow.email).trim()).maybeSingle();
      userRow = data;
    }
    if (!empRow && userRow?.raw_data?.employeeId) {
      const linkedEmpId = String(userRow.raw_data.employeeId).trim();
      if (/^\d+$/.test(linkedEmpId)) {
        const { data } = await supabaseAdmin.from('employees').select('*').eq('id', Number(linkedEmpId)).maybeSingle();
        empRow = data;
      } else if (linkedEmpId) {
        const { data } = await supabaseAdmin.from('employees').select('*').eq('doc_id', linkedEmpId).maybeSingle();
        empRow = data;
      }
    }
  } catch (e) {
    console.warn('[checkClockingEligibilityBackend] Lookup notice:', e);
  }

  const empRaw = (empRow?.raw_data && typeof empRow.raw_data === 'object') ? empRow.raw_data : {};
  const userRaw = (userRow?.raw_data && typeof userRow.raw_data === 'object') ? userRow.raw_data : {};

  const allowEarlyDeparture15_17 = Boolean(empRaw.allowEarlyDeparture15_17 || userRaw.allowEarlyDeparture15_17);
  const allowLateArrival8_930 = Boolean(empRaw.allowLateArrival8_930 || userRaw.allowLateArrival8_930);

  let departureActiveStartTime = '16:00';
  try {
    const { data: settingsData } = await supabaseAdmin.from('company_settings').select('*');
    if (settingsData && settingsData.length > 0) {
      const cfg = settingsData.find((s: any) => s.id === 'main_config' || s.doc_id === 'main_config') || settingsData[0];
      const rawCfg = (cfg.raw_data && typeof cfg.raw_data === 'object')
        ? cfg.raw_data
        : (cfg.setting_value && typeof cfg.setting_value === 'object' ? cfg.setting_value : cfg);
      departureActiveStartTime = rawCfg.departureActiveStartTime || rawCfg.plannedDepartureTime || '16:00';
    }
  } catch {}

  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Douala',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const hh = parts.find((p) => p.type === 'hour')?.value || String(now.getHours()).padStart(2, '0');
  const mm = parts.find((p) => p.type === 'minute')?.value || String(now.getMinutes()).padStart(2, '0');
  const serverTimeHHMM = `${hh === '24' ? '00' : hh}:${mm}`;

  const effectiveDepartureStartTime = allowEarlyDeparture15_17 && '15:00' < departureActiveStartTime
    ? '15:00'
    : departureActiveStartTime;

  const canActivateDepartureButton =
    serverTimeHHMM >= departureActiveStartTime ||
    (allowEarlyDeparture15_17 && serverTimeHHMM >= '15:00');

  return {
    success: true,
    allowEarlyDeparture15_17,
    allowLateArrival8_930,
    canActivateDepartureButton,
    isEarlyWindow15_17: serverTimeHHMM >= '15:00' && serverTimeHHMM <= '17:00',
    serverTimeHHMM,
    departureActiveStartTime,
    effectiveDepartureStartTime,
  };
}
