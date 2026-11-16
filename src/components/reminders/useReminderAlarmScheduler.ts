import { useState, useEffect, useCallback } from 'react';
import { Reminder } from '../../types';
import { soundService } from '../../services/soundService';
import {
  doesRoutineMatchMoment,
  isRoutineReminder,
} from '../../services/reminders/routineSchedulerHelpers';

export function useReminderAlarmScheduler(
  reminders: Reminder[],
  onUpdateReminders: (updated: Reminder[]) => void,
  showToast?: (message: string, type?: 'success' | 'error') => void
) {
  const [activeRingingReminder, setActiveRingingReminder] = useState<Reminder | null>(null);

  const handleStartAlarm = useCallback(
    (reminder: Reminder) => {
      setActiveRingingReminder(reminder);
      soundService.startContinuousAlertRingtone(0.7);
      if (showToast) {
        showToast(
          `Sonnerie d'alerte activée : "${reminder.title || reminder.note || 'Alerte'}"`,
          'success'
        );
      }
    },
    [showToast]
  );

  const handleStopAlarm = useCallback(() => {
    soundService.stopContinuousAlertRingtone();
    if (activeRingingReminder && showToast) {
      showToast('Sonnerie arrêtée avec succès.', 'success');
    }
    setActiveRingingReminder(null);
  }, [activeRingingReminder, showToast]);

  const handleSnooze5m = useCallback(() => {
    soundService.stopContinuousAlertRingtone();
    if (activeRingingReminder) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 5);
      const newTime = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;
      const updated = reminders.map((r) =>
        r.id === activeRingingReminder.id ? { ...r, time: newTime } : r
      );
      onUpdateReminders(updated);
      if (showToast) showToast('Alerte reportée de 5 minutes.', 'success');
    }
    setActiveRingingReminder(null);
  }, [activeRingingReminder, reminders, onUpdateReminders, showToast]);

  useEffect(() => {
    const checkSchedule = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const dayOfMonth = now.getDate();
      const todayStr = `${year}-${String(month).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`;
      const currentTotalMin = now.getHours() * 60 + now.getMinutes();

      for (const r of reminders) {
        if (r.stopped || r.isResolved) continue;

        if (isRoutineReminder(r)) {
          // Rituels & rappels récurrents (multi-jours, quotidien, hebdo, mensuel, ponctuel)
          if (r.enableSoundAlarm === false) continue;

          const match = doesRoutineMatchMoment(r, {
            dateStr: todayStr,
            dayOfMonth,
            dayOfWeek: now.getDay(),
            hour: now.getHours(),
            minute: now.getMinutes(),
          });

          if (match) {
            const triggered = r.triggeredPeriods || [];
            if (r.lastTriggeredKey === match.triggerKey || triggered.includes(match.triggerKey)) {
              continue;
            }
            const nextPeriods = Array.from(new Set([...triggered.slice(-20), match.triggerKey]));
            const updated = reminders.map((rem) =>
              rem.id === r.id
                ? { ...rem, lastTriggeredKey: match.triggerKey, triggeredPeriods: nextPeriods }
                : rem
            );
            onUpdateReminders(updated);
            handleStartAlarm(r);
            break;
          }
          continue;
        }

        // Échéances documentaires avec sonnerie optionnelle le jour J
        if (!r.date || !r.time) continue;
        if (r.date.split('T')[0] !== todayStr) continue;

        const [rH, rM] = r.time.split(':').map(Number);
        if (isNaN(rH) || isNaN(rM)) continue;
        const targetTotalMin = rH * 60 + rM;

        const periods =
          r.triggerPeriods && r.triggerPeriods.length > 0 ? r.triggerPeriods : ['exact'];
        const triggered = r.triggeredPeriods || [];

        for (const period of periods) {
          const periodKey = `${todayStr}_${period}`;
          if (triggered.includes(period) || triggered.includes(periodKey)) continue;

          let shouldRing = false;
          if (period === 'exact' && currentTotalMin === targetTotalMin) shouldRing = true;
          else if (period === '5m' && targetTotalMin - currentTotalMin === 5) shouldRing = true;
          else if (period === '15m' && targetTotalMin - currentTotalMin === 15) shouldRing = true;
          else if (period === '30m' && targetTotalMin - currentTotalMin === 30) shouldRing = true;
          else if (period === '1h' && targetTotalMin - currentTotalMin === 60) shouldRing = true;

          if (shouldRing) {
            const updated = reminders.map((rem) =>
              rem.id === r.id
                ? { ...rem, triggeredPeriods: [...(rem.triggeredPeriods || []), periodKey] }
                : rem
            );
            onUpdateReminders(updated);
            handleStartAlarm(r);
            break;
          }
        }
      }
    };

    const interval = setInterval(checkSchedule, 10000);
    return () => clearInterval(interval);
  }, [reminders, onUpdateReminders, handleStartAlarm]);

  useEffect(() => {
    return () => {
      soundService.stopContinuousAlertRingtone();
    };
  }, []);

  return {
    activeRingingReminder,
    handleStartAlarm,
    handleStopAlarm,
    handleSnooze5m,
  };
}
