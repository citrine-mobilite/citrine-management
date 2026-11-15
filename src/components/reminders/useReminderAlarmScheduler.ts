import { useState, useEffect, useCallback } from 'react';
import { Reminder } from '../../types';
import { soundService } from '../../services/soundService';

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
      const todayStr = now.toISOString().split('T')[0];
      const currentTotalMin = now.getHours() * 60 + now.getMinutes();

      for (const r of reminders) {
        if (r.stopped || r.isResolved) continue;
        if (!r.date || !r.time) continue;
        if (r.date !== todayStr) continue;

        const [rH, rM] = r.time.split(':').map(Number);
        if (isNaN(rH) || isNaN(rM)) continue;
        const targetTotalMin = rH * 60 + rM;

        const periods =
          r.triggerPeriods && r.triggerPeriods.length > 0 ? r.triggerPeriods : ['exact'];
        const triggered = r.triggeredPeriods || [];

        for (const period of periods) {
          if (triggered.includes(period)) continue;

          let shouldRing = false;
          if (period === 'exact' && currentTotalMin === targetTotalMin) shouldRing = true;
          else if (period === '5m' && targetTotalMin - currentTotalMin === 5) shouldRing = true;
          else if (period === '15m' && targetTotalMin - currentTotalMin === 15) shouldRing = true;
          else if (period === '30m' && targetTotalMin - currentTotalMin === 30) shouldRing = true;
          else if (period === '1h' && targetTotalMin - currentTotalMin === 60) shouldRing = true;

          if (shouldRing) {
            const updated = reminders.map((rem) =>
              rem.id === r.id
                ? { ...rem, triggeredPeriods: [...(rem.triggeredPeriods || []), period] }
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
