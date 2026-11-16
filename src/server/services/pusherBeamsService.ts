import PushNotifications from '@pusher/push-notifications-server';

export interface BeamsPublishInput {
  title: string;
  body: string;
  interests?: string[];
  targetRoles?: string[];
  targetUserIds?: string[];
  targetEmployeeIds?: string[];
  targetEmails?: string[];
  link?: string;
  origin?: string;
  operationKey?: string;
  data?: Record<string, any>;
}

export interface BeamsPublishResult {
  success: boolean;
  configured: boolean;
  deduplicated?: boolean;
  publishId?: string;
  interests?: string[];
  error?: string;
}

const recentPublishedKeys = new Map<string, number>();
const DEDUP_WINDOW_MS = 15000;
let missingCredsWarned = false;

export function normalizeBeamsInterest(raw: string): string {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_\-=@,.;]/g, '_')
    .slice(0, 150);
}

export function getBeamsCredentials(): { instanceId: string; secretKey: string } {
  const instanceId = (
    process.env.PUSHER_BEAMS_INSTANCE_ID ||
    process.env.VITE_PUSHER_BEAMS_INSTANCE_ID ||
    ''
  ).trim();
  const secretKey = (process.env.PUSHER_BEAMS_SECRET_KEY || '').trim();
  return { instanceId, secretKey };
}

function resolveBeamsClient(): PushNotifications | null {
  const { instanceId, secretKey } = getBeamsCredentials();
  if (!instanceId || !secretKey) {
    if (!missingCredsWarned) {
      missingCredsWarned = true;
      console.warn(
        '[Pusher Beams] Credentials non configurés (PUSHER_BEAMS_INSTANCE_ID / PUSHER_BEAMS_SECRET_KEY). Envoi distant ignoré.'
      );
    }
    return null;
  }

  const PushNotificationsCtor: any = (PushNotifications as any)?.default || PushNotifications;
  return new PushNotificationsCtor({
    instanceId,
    secretKey,
  });
}

function buildDeepLink(origin?: string, link?: string): string | undefined {
  const candidateOrigin = (
    origin ||
    process.env.APP_URL ||
    process.env.SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
  ).trim();

  if (!candidateOrigin || !/^https?:\/\//i.test(candidateOrigin)) {
    return undefined;
  }

  if (!link) return candidateOrigin;
  const cleanLink = link.startsWith('#') || link.startsWith('/') ? link : `/#${link}`;
  return `${candidateOrigin.replace(/\/+$/, '')}${cleanLink.startsWith('/') ? cleanLink : `/${cleanLink}`}`;
}

export function buildTargetInterests(input: {
  interests?: string[];
  targetRoles?: string[];
  targetUserIds?: string[];
  targetEmployeeIds?: string[];
  targetEmails?: string[];
}): string[] {
  const set = new Set<string>();

  (input.interests || []).forEach((item) => {
    const clean = normalizeBeamsInterest(item);
    if (clean) set.add(clean);
  });

  (input.targetRoles || []).forEach((role) => {
    const clean = normalizeBeamsInterest(role);
    if (clean) set.add(clean.startsWith('role-') ? clean : `role-${clean}`);
  });

  (input.targetUserIds || []).forEach((uid) => {
    const clean = normalizeBeamsInterest(uid);
    if (clean) set.add(`user-${clean}`);
  });

  (input.targetEmployeeIds || []).forEach((empId) => {
    const clean = normalizeBeamsInterest(empId);
    if (clean) set.add(`emp-${clean}`);
  });

  (input.targetEmails || []).forEach((email) => {
    const clean = normalizeBeamsInterest(email);
    if (clean) set.add(`email-${clean}`);
  });

  return Array.from(set).slice(0, 100);
}

export async function publishBeamsNotification(input: BeamsPublishInput): Promise<BeamsPublishResult> {
  const now = Date.now();
  for (const [k, ts] of recentPublishedKeys.entries()) {
    if (now - ts > 60000) recentPublishedKeys.delete(k);
  }

  const dedupKey = (input.operationKey || `${input.title}::${input.body}`).trim();
  const prevTs = recentPublishedKeys.get(dedupKey);
  if (prevTs && now - prevTs < DEDUP_WINDOW_MS) {
    return {
      success: true,
      configured: Boolean(getBeamsCredentials().instanceId && getBeamsCredentials().secretKey),
      deduplicated: true,
    };
  }
  recentPublishedKeys.set(dedupKey, now);

  const client = resolveBeamsClient();
  if (!client) {
    return {
      success: false,
      configured: false,
      error: 'Pusher Beams credentials missing',
    };
  }

  const targetInterests = buildTargetInterests(input);
  if (targetInterests.length === 0) {
    return {
      success: false,
      configured: true,
      error: 'No valid Pusher Beams interests resolved',
    };
  }

  const deepLink = buildDeepLink(input.origin, input.link);
  const customData = {
    link: input.link || '',
    operationKey: dedupKey,
    timestamp: new Date().toISOString(),
    ...(input.data || {}),
  };

  try {
    const webNotification: Record<string, any> = {
      title: input.title,
      body: input.body,
      icon: '/pwa-192x192.png',
      hide_notification_if_site_has_focus: false,
    };
    if (deepLink) {
      webNotification.deep_link = deepLink;
    }

    const response = await client.publishToInterests(targetInterests, {
      web: {
        time_to_live: 86400,
        notification: webNotification,
        data: customData,
      },
      fcm: {
        time_to_live: 86400,
        priority: 'high',
        notification: {
          title: input.title,
          body: input.body,
          icon: '/pwa-192x192.png',
          tag: dedupKey.slice(0, 80),
        },
        data: customData,
      },
      apns: {
        aps: {
          alert: {
            title: input.title,
            body: input.body,
          },
          sound: 'default',
        },
        data: customData,
      },
    });

    return {
      success: true,
      configured: true,
      publishId: response?.publishId,
      interests: targetInterests,
    };
  } catch (error: any) {
    console.error('[Pusher Beams Publish Error]:', error?.message || error);
    return {
      success: false,
      configured: true,
      error: error?.message || String(error),
    };
  }
}

const CLOCK_ACTION_LABELS: Record<string, string> = {
  arrival: 'Arrivée',
  pauseStart: 'Début de pause',
  pause_start: 'Début de pause',
  pauseEnd: 'Fin de pause',
  pause_end: 'Fin de pause',
  departure: 'Départ',
  sortieProStart: 'Sortie professionnelle',
  sortieProEnd: 'Retour de mission',
};

export async function publishClockingBeamsNotification(params: {
  presence: any;
  action?: string;
  origin?: string;
}): Promise<BeamsPublishResult> {
  const { presence, action, origin } = params;
  if (!presence) {
    return { success: false, configured: false, error: 'Presence manquante' };
  }

  const empName = presence.employeeName || presence.employee_name || 'Un collaborateur';
  const resolvedAction =
    action ||
    (presence.departureTime
      ? 'departure'
      : presence.pauseEnd
      ? 'pauseEnd'
      : presence.pauseStart
      ? 'pauseStart'
      : 'arrival');
  const actionLabel = CLOCK_ACTION_LABELS[resolvedAction] || 'Pointage';
  const timeStr =
    (resolvedAction === 'departure'
      ? presence.departureTime
      : resolvedAction === 'pauseEnd' || resolvedAction === 'pause_end'
      ? presence.pauseEnd
      : resolvedAction === 'pauseStart' || resolvedAction === 'pause_start'
      ? presence.pauseStart
      : resolvedAction === 'sortieProStart'
      ? presence.sortieProStart
      : resolvedAction === 'sortieProEnd'
      ? presence.sortieProEnd
      : presence.arrivalTime) ||
    new Date().toLocaleTimeString('fr-FR', { timeZone: 'Africa/Douala', hour: '2-digit', minute: '2-digit' });

  const statusNote = presence.status === 'late' ? ' — Retard signalé' : '';
  const locationNote = presence.location ? ` (${presence.location})` : '';
  const presenceId = presence.id || presence.docId || `${presence.employeeId || empName}-${presence.date || ''}`;

  return publishBeamsNotification({
    title: `Pointage ${actionLabel} : ${empName}`,
    body: `${empName} a badgé (${actionLabel}) à ${timeStr}${statusNote}${locationNote}.`,
    targetRoles: ['administrateur', 'responsable'],
    link: 'presences',
    origin,
    operationKey: `clock:${presenceId}:${resolvedAction}:${timeStr}`,
    data: {
      source: 'clocking',
      presenceId,
      employeeId: presence.employeeId,
      action: resolvedAction,
    },
  });
}

export async function publishDailyTaskSheetBeamsNotification(params: {
  sentCount: number;
  dateStr: string;
  timeStr: string;
  dayIso: string;
}): Promise<BeamsPublishResult> {
  const { sentCount, dateStr, timeStr, dayIso } = params;
  return publishBeamsNotification({
    title: 'Feuilles de tâches (TaskSheets) transmises',
    body: `Les TaskSheets journaliers du ${dateStr} (${sentCount} collaborateur${sentCount > 1 ? 's' : ''}) ont été envoyés à ${timeStr}.`,
    interests: ['all-collaborators'],
    targetRoles: ['administrateur', 'responsable'],
    link: 'tasks',
    operationKey: `daily-tasksheet:${dayIso}`,
    data: {
      source: 'daily_tasksheet_cron',
      dayIso,
      sentCount,
    },
  });
}
