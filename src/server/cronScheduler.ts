import { executeDailyTaskSheetDispatch } from '../services/dailyTaskSheetCronService';
import { executeMonthlyTaskSheetDispatch } from '../services/periodicTaskSheetCronService';
import { sendWeeklyConsolidatedReport } from '../services/weeklyAttendanceReportService';
import { sendMondayGreetingToAllEmployees } from '../services/mondayGreetingMailService';

export function startScheduledCronJobs(): NodeJS.Timeout {
  return setInterval(async () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Africa/Douala',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    };
    const parts = new Intl.DateTimeFormat('en-GB', options).formatToParts(now);
    const dayOfMonth = parseInt(parts.find((p) => p.type === 'day')?.value || '0', 10);
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);

    const weekdayName = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Douala',
      weekday: 'long',
    })
      .format(now)
      .toLowerCase();
    const isWeekday = weekdayName !== 'saturday' && weekdayName !== 'sunday';
    const todayStr = now.toISOString().split('T')[0];

    const mondayGreetingKey = `monday_greeting_cron_sent_${todayStr}`;
    if (weekdayName === 'monday' && hour === 8 && minute === 0 && !(global as any)[mondayGreetingKey]) {
      (global as any)[mondayGreetingKey] = true;
      try {
        await sendMondayGreetingToAllEmployees({ forceMonday: true });
      } catch (err) {
        console.error('[CRON LUNDI 08:00 Error]:', err);
      }
    }

    const monthlyTaskSheetKey = `monthly_tasksheet_cron_sent_${todayStr.slice(0, 7)}`;
    if (dayOfMonth === 1 && hour === 8 && minute === 30 && !(global as any)[monthlyTaskSheetKey]) {
      (global as any)[monthlyTaskSheetKey] = true;
      try {
        await executeMonthlyTaskSheetDispatch();
      } catch (err) {
        console.error('[CRON MENSUEL 1er 08:30 Error]:', err);
      }
    }

    const dailyTaskSheetKey = `tasksheet_cron_sent_${todayStr}`;
    if (isWeekday && hour === 19 && minute === 30 && !(global as any)[dailyTaskSheetKey]) {
      (global as any)[dailyTaskSheetKey] = true;
      try {
        await executeDailyTaskSheetDispatch();
      } catch (cronErr) {
        console.error('[CRON 19:30 TaskSheet Error]:', cronErr);
      }
    }

    const fridayRecapKey = `weekly_recap_cron_sent_${todayStr}`;
    if (weekdayName === 'friday' && hour === 20 && minute === 0 && !(global as any)[fridayRecapKey]) {
      (global as any)[fridayRecapKey] = true;
      try {
        await sendWeeklyConsolidatedReport({ forceFriday: true });
      } catch (err) {
        console.error('[CRON VENDREDI 20:00 Error]:', err);
      }
    }
  }, 60000);
}
