import React from 'react';
import { AlertOctagon, AlertTriangle, CalendarCheck2, CheckCircle2 } from 'lucide-react';
import { Reminder } from '../../types';
import { computeReminderUrgency } from '../../services/reminderService';

interface ReminderStatsCardsProps {
  reminders: Reminder[];
}

export const ReminderStatsCards: React.FC<ReminderStatsCardsProps> = ({ reminders }) => {
  const stats = React.useMemo(() => {
    let expiredCount = 0;
    let soonCount = 0;
    let upcomingCount = 0;
    let resolvedCount = 0;

    for (const r of reminders) {
      const { level } = computeReminderUrgency(r);
      if (level === 'expired') expiredCount += 1;
      else if (level === 'critical' || level === 'warning') soonCount += 1;
      else if (level === 'resolved') resolvedCount += 1;
      else upcomingCount += 1;
    }

    return { expiredCount, soonCount, upcomingCount, resolvedCount };
  }, [reminders]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="bg-white p-4 rounded-2xl border border-stone-200/85 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">
            Expirés / En retard
          </span>
          <AlertOctagon className="h-4 w-4 text-rose-600" />
        </div>
        <p className="text-2xl font-bold font-mono tabular-nums text-rose-700 mt-1.5">
          {stats.expiredCount}
        </p>
        <p className="text-[11px] text-stone-400 mt-0.5">Action immédiate requise</p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-stone-200/85 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">
            À renouveler bientôt
          </span>
          <AlertTriangle className="h-4 w-4 text-amber-600" />
        </div>
        <p className="text-2xl font-bold font-mono tabular-nums text-amber-700 mt-1.5">
          {stats.soonCount}
        </p>
        <p className="text-[11px] text-stone-400 mt-0.5">Dans la fenêtre d&apos;alerte</p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-stone-200/85 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">
            Planifiés & À jour
          </span>
          <CalendarCheck2 className="h-4 w-4 text-[#2A7B76]" />
        </div>
        <p className="text-2xl font-bold font-mono tabular-nums text-stone-900 mt-1.5">
          {stats.upcomingCount}
        </p>
        <p className="text-[11px] text-stone-400 mt-0.5">Hors urgence actuelle</p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-stone-200/85 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">
            Validés
          </span>
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        </div>
        <p className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1.5">
          {stats.resolvedCount}
        </p>
        <p className="text-[11px] text-stone-400 mt-0.5">Clôturés / réglés</p>
      </div>
    </div>
  );
};
