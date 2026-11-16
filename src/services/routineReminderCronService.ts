import { getCollectionData, saveDocumentData } from '../db/repository';
import { publishBeamsNotification } from '../server/services/pusherBeamsService';
import { Reminder } from '../types';
import {
  doesRoutineMatchMoment,
  isRoutineReminder,
  NowScheduleParts,
  resolveRecurrenceMode,
} from './reminders/routineSchedulerHelpers';

const processedRoutineKeys = new Set<string>();

function getDoualaNowScheduleParts(now: Date = new Date()): NowScheduleParts {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Douala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const year = Number(parts.find((p) => p.type === 'year')?.value || now.getFullYear());
  const month = Number(parts.find((p) => p.type === 'month')?.value || now.getMonth() + 1);
  const day = Number(parts.find((p) => p.type === 'day')?.value || now.getDate());
  const hour = Number(parts.find((p) => p.type === 'hour')?.value || now.getHours()) % 24;
  const minute = Number(parts.find((p) => p.type === 'minute')?.value || now.getMinutes());

  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const weekdayName = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Douala',
    weekday: 'short',
  })
    .format(now)
    .toLowerCase();

  const weekdayMap: Record<string, number> = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
  };
  const dayOfWeek = weekdayMap[weekdayName.slice(0, 3)] ?? now.getDay();

  return {
    dateStr,
    dayOfMonth: day,
    dayOfWeek,
    hour,
    minute,
  };
}

function getLeadLabel(period: string): string {
  if (period === '5m') return 'dans 5 min';
  if (period === '15m') return 'dans 15 min';
  if (period === '30m') return 'dans 30 min';
  if (period === '1h') return 'dans 1h';
  return 'maintenant';
}

export async function executeDueRoutineRemindersDispatch(): Promise<{
  success: boolean;
  triggeredCount: number;
  triggeredIds: string[];
}> {
  const nowParts = getDoualaNowScheduleParts();
  const reminders = ((await getCollectionData('reminders')) || []) as Reminder[];
  const triggeredIds: string[] = [];

  // Keep memory set bounded
  if (processedRoutineKeys.size > 500) {
    processedRoutineKeys.clear();
  }

  for (const r of reminders) {
    if (!r || !r.id || r.stopped || r.isResolved || !isRoutineReminder(r)) {
      continue;
    }

    const match = doesRoutineMatchMoment(r, nowParts);
    if (!match) continue;

    const dedupKey = `${r.id}::${match.triggerKey}`;
    if (
      processedRoutineKeys.has(dedupKey) ||
      r.lastTriggeredKey === match.triggerKey ||
      (Array.isArray(r.triggeredPeriods) && r.triggeredPeriods.includes(match.triggerKey))
    ) {
      continue;
    }

    processedRoutineKeys.add(dedupKey);
    triggeredIds.push(r.id);

    const leadText = getLeadLabel(match.period);
    const title = `🔔 Rappel (${leadText}) : ${r.title || 'Réunion / Rituel'}`;
    const bodyParts = [
      r.time ? `Prévu à ${r.time}` : '',
      r.location ? `Lieu : ${r.location}` : '',
      r.note || '',
    ].filter(Boolean);
    const body = bodyParts.join(' · ') || 'Votre rappel récurrent Citrine Management.';

    const shouldSendPush = r.sendPushNotification !== false;
    if (shouldSendPush) {
      const targetInterests = r.allEmployees ? ['all-collaborators'] : undefined;
      const targetEmployeeIds =
        !r.allEmployees && Array.isArray(r.employeeIds) && r.employeeIds.length > 0
          ? r.employeeIds.map((id) => String(id))
          : !r.allEmployees && r.employeeId
          ? [String(r.employeeId)]
          : undefined;

      await publishBeamsNotification({
        title,
        body,
        interests: targetInterests,
        targetEmployeeIds: targetInterests ? undefined : targetEmployeeIds,
        targetRoles:
          !targetInterests && (!targetEmployeeIds || targetEmployeeIds.length === 0)
            ? ['administrateur', 'responsable']
            : undefined,
        link: '#reminders',
        operationKey: `routine-reminder-${dedupKey}`,
        data: {
          source: 'routine_reminder',
          reminderId: r.id,
          triggerKey: match.triggerKey,
        },
      }).catch(() => {});
    }

    // Log notification in DB for in-app notification center & employee alerts
    const notifDoc = {
      id: `notif-routine-${r.id}-${Date.now()}`,
      type: 'push',
      recipient: r.allEmployees
        ? 'tous'
        : r.employeeIds && r.employeeIds.length > 0
        ? r.employeeIds.join(',')
        : 'direction',
      title,
      content: body,
      timestamp: new Date().toISOString(),
      read: false,
      payload: JSON.stringify({
        source: 'routine_reminder',
        reminderId: r.id,
        triggerKey: match.triggerKey,
      }),
    };
    await saveDocumentData('notifications', notifDoc).catch(() => {});

    // Persist trigger marker without disabling recurring reminders
    const existingPeriods = Array.isArray(r.triggeredPeriods) ? r.triggeredPeriods.slice(-20) : [];
    const mode = resolveRecurrenceMode(r);
    const updatedReminder: Reminder = {
      ...r,
      lastTriggeredKey: match.triggerKey,
      triggeredPeriods: Array.from(new Set([...existingPeriods, match.triggerKey])),
      triggered: mode === 'once' && match.period === 'exact' ? true : r.triggered,
    };
    await saveDocumentData('reminders', updatedReminder).catch(() => {});
  }

  return {
    success: true,
    triggeredCount: triggeredIds.length,
    triggeredIds,
  };
}
