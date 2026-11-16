import React from 'react';
import { Repeat, CalendarClock, BellRing, PauseCircle } from 'lucide-react';
import { Reminder } from '../../types';
import {
  formatNextOccurrenceBadge,
  resolveRecurrenceMode,
} from '../../services/reminderService';

interface RoutineStatsCardsProps {
  routines: Reminder[];
}

export const RoutineStatsCards: React.FC<RoutineStatsCardsProps> = ({ routines }) => {
  const stats = React.useMemo(() => {
    let activeCount = 0;
    let todayCount = 0;
    let recurringCount = 0;
    let pausedCount = 0;

    for (const r of routines) {
      if (r.stopped || r.isResolved) {
        pausedCount += 1;
        continue;
      }
      activeCount += 1;
      const mode = resolveRecurrenceMode(r);
      if (mode !== 'once') {
        recurringCount += 1;
      }
      const nextBadge = formatNextOccurrenceBadge(r);
      if (nextBadge.isToday) {
        todayCount += 1;
      }
    }

    return { activeCount, todayCount, recurringCount, pausedCount };
  }, [routines]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="bg-white p-4 rounded-2xl border border-stone-200/85 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">
            Rappels actifs
          </span>
          <BellRing className="h-4 w-4 text-[#2A7B76]" />
        </div>
        <p className="text-2xl font-bold font-mono tabular-nums text-stone-900 mt-1.5">
          {stats.activeCount}
        </p>
        <p className="text-[11px] text-stone-400 mt-0.5">Notifications actives</p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-stone-200/85 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">
            Prévus aujourd&apos;hui
          </span>
          <CalendarClock className="h-4 w-4 text-amber-600" />
        </div>
        <p className="text-2xl font-bold font-mono tabular-nums text-amber-700 mt-1.5">
          {stats.todayCount}
        </p>
        <p className="text-[11px] text-stone-400 mt-0.5">Réunions &amp; points du jour</p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-stone-200/85 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">
            Récurrents
          </span>
          <Repeat className="h-4 w-4 text-emerald-600" />
        </div>
        <p className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1.5">
          {stats.recurringCount}
        </p>
        <p className="text-[11px] text-stone-400 mt-0.5">Hebdo, quotidiens, mensuels</p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-stone-200/85 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">
            En pause
          </span>
          <PauseCircle className="h-4 w-4 text-stone-400" />
        </div>
        <p className="text-2xl font-bold font-mono tabular-nums text-stone-600 mt-1.5">
          {stats.pausedCount}
        </p>
        <p className="text-[11px] text-stone-400 mt-0.5">Temporairement suspendus</p>
      </div>
    </div>
  );
};
