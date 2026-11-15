import { getEffectiveSmtpConfig, parseEmailList } from '../serverMailService';
import { isArrivalAfterThreshold } from '../weeklyAttendanceReportService';

export interface ClockingAppearance {
  actionLabel: string;
  actionDescription: string;
  actionTime: string;
  themeColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  iconEmoji: string;
  methodClean: string;
  locationClean: string;
}

const METHOD_LABELS: Record<string, string> = {
  qr_code_dynamic: 'Scan QR Code Dynamique Tournant',
  qr_code_door: 'Scan QR Code de Porte',
  qr_code_mobile: 'Scan Mobile Sécurisé',
  kiosk_pin: 'Borne Tactile Kiosque (Code PIN)',
  badge_code_16: 'Carte / Badge Numérique 16 Chiffres',
  manual_admin: 'Validation Administrative par le Responsable',
  admin_on_behalf: 'Pointage par Délégation RH',
  gps: 'Application Collaborateur (Géolocalisation GPS)',
};

export function resolveClockingAppearance(params: {
  presence: any;
  action?: string;
  notification?: any;
  companySettings: any;
  timeOnly: string;
}): ClockingAppearance {
  const { presence, action, notification, companySettings, timeOnly } = params;

  let lateThreshold = '08:30';
  if (companySettings) {
    const rawVal =
      companySettings.lateThresholdTime ||
      companySettings.late_threshold_time ||
      companySettings.workStartTime ||
      companySettings.work_start_time;
    if (typeof rawVal === 'string' && rawVal.trim().includes(':')) {
      lateThreshold = rawVal.trim();
    }
  }

  let actionKey = action;
  if (!actionKey && notification?.payload) {
    try {
      const parsedPayload =
        typeof notification.payload === 'string'
          ? JSON.parse(notification.payload)
          : notification.payload;
      if (parsedPayload?.action) actionKey = parsedPayload.action;
    } catch {}
  }

  if (!actionKey) {
    if (presence.departureTime) actionKey = 'departure';
    else if (presence.pauseEnd) actionKey = 'pauseEnd';
    else if (presence.pauseStart) actionKey = 'pauseStart';
    else if (presence.sortieProEnd) actionKey = 'sortieProEnd';
    else if (presence.sortieProStart) actionKey = 'sortieProStart';
    else actionKey = 'arrival';
  }

  actionKey = String(actionKey).replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

  let actionLabel = 'Pointage';
  let actionDescription = 'Pointage enregistré';
  let actionTime = timeOnly;
  let themeColor = '#1F625E';
  let badgeBg = '#ecfdf5';
  let badgeBorder = '#a7f3d0';
  let badgeText = '#065f46';
  let iconEmoji = '⏱️';

  if (actionKey === 'arrival') {
    actionTime = presence.arrivalTime || timeOnly;
    const isLate = presence.status === 'late' || isArrivalAfterThreshold(actionTime, lateThreshold);
    if (isLate) {
      actionLabel = 'Arrivée (Retard constaté)';
      actionDescription = `Arrivée badgée après le seuil officiel de ${lateThreshold}`;
      themeColor = '#d97706';
      badgeBg = '#fffbeb';
      badgeBorder = '#fde68a';
      badgeText = '#92400e';
      iconEmoji = '⚠️';
    } else {
      actionLabel = 'Arrivée au poste';
      actionDescription = 'Prise de service ponctuelle au bureau';
      iconEmoji = '🟢';
    }
  } else if (actionKey === 'pauseStart') {
    actionTime = presence.pauseStart || timeOnly;
    actionLabel = 'Début de Pause Déjeuner';
    actionDescription = 'Mise en pause journalière (plage officielle : 12h00 – 13h00)';
    themeColor = '#2563eb';
    badgeBg = '#eff6ff';
    badgeBorder = '#bfdbfe';
    badgeText = '#1e40af';
    iconEmoji = '☕';
  } else if (actionKey === 'pauseEnd') {
    actionTime = presence.pauseEnd || timeOnly;
    actionLabel = 'Fin de Pause / Reprise';
    actionDescription = 'Reprise de poste opérationnelle après pause';
    themeColor = '#059669';
    badgeBg = '#ecfdf5';
    badgeBorder = '#a7f3d0';
    badgeText = '#065f46';
    iconEmoji = '💼';
  } else if (actionKey === 'departure') {
    actionTime = presence.departureTime || timeOnly;
    const plannedDeparture = companySettings?.plannedDepartureTime || '17:00';
    const isEarly = actionTime < plannedDeparture;
    if (isEarly) {
      actionLabel = 'Départ (Sortie Prématurée)';
      actionDescription = `Départ badgé avant l'horaire contractuel de ${plannedDeparture}`;
      themeColor = '#e11d48';
      badgeBg = '#fff1f2';
      badgeBorder = '#fecdd3';
      badgeText = '#9f1239';
      iconEmoji = '🚪';
    } else {
      actionLabel = 'Départ de fin de journée';
      actionDescription = 'Clôture de journée de travail effectuée';
      themeColor = '#475569';
      badgeBg = '#f1f5f9';
      badgeBorder = '#cbd5e1';
      badgeText = '#334155';
      iconEmoji = '🏁';
    }
  } else if (actionKey === 'sortieProStart') {
    actionTime = presence.sortieProStart || timeOnly;
    actionLabel = 'Départ en Mission Professionnelle';
    actionDescription = 'Sortie extérieure pour motif professionnel';
    themeColor = '#7c3aed';
    badgeBg = '#f5f3ff';
    badgeBorder = '#ddd6fe';
    badgeText = '#5b21b6';
    iconEmoji = '🚗';
  } else if (actionKey === 'sortieProEnd') {
    actionTime = presence.sortieProEnd || timeOnly;
    actionLabel = 'Retour de Mission Professionnelle';
    actionDescription = 'Réintégration au bureau après mission extérieure';
    themeColor = '#7c3aed';
    badgeBg = '#f5f3ff';
    badgeBorder = '#ddd6fe';
    badgeText = '#5b21b6';
    iconEmoji = '🏢';
  }

  const rawMethod = presence.clockingMethod || presence.method || 'Standard';
  const methodClean = METHOD_LABELS[rawMethod] || rawMethod;
  const locationClean = presence.location || 'Siège Citrine - Japoma Carrefour Matango';

  return {
    actionLabel,
    actionDescription,
    actionTime,
    themeColor,
    badgeBg,
    badgeBorder,
    badgeText,
    iconEmoji,
    methodClean,
    locationClean,
  };
}

export async function resolveClockingRecipients(users: any[], employeeEmail: string): Promise<string[]> {
  const admins = users.filter(
    (u: any) =>
      u.role_id === 1 ||
      u.role === 'administrateur' ||
      String(u.raw_data?.role).toLowerCase().includes('admin')
  );
  const adminEmails = admins.map((a: any) => a.email).filter(Boolean);

  const smtpConfig = await getEffectiveSmtpConfig();
  const hrEmails = parseEmailList(smtpConfig.hrEmail);

  const recipientSet = new Set<string>();
  adminEmails.forEach((e: string) => recipientSet.add(e.toLowerCase().trim()));
  hrEmails.forEach((e: string) => recipientSet.add(e.toLowerCase().trim()));

  if (employeeEmail && employeeEmail.includes('@')) {
    recipientSet.add(employeeEmail.toLowerCase().trim());
  }

  if (recipientSet.size === 0) {
    if (process.env.HR_NOTIFICATION_EMAIL) recipientSet.add(process.env.HR_NOTIFICATION_EMAIL.toLowerCase().trim());
    else if (process.env.SMTP_USER) recipientSet.add(process.env.SMTP_USER.toLowerCase().trim());
    else recipientSet.add('citrinemobilite@gmail.com');
  }

  return Array.from(recipientSet);
}
