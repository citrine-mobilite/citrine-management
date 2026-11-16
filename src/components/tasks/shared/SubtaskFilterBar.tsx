import React from 'react';
import { ArrowDownWideNarrow, Calendar, CalendarRange, History } from 'lucide-react';
import { getCurrentWeekBounds, SubtaskFilterPeriod } from '../../../utils/subtaskFilterUtils';

interface SubtaskFilterBarProps {
  period: SubtaskFilterPeriod;
  onChangePeriod: (p: SubtaskFilterPeriod) => void;
  specificDate: string;
  onChangeSpecificDate: (d: string) => void;
  rangeStart: string;
  onChangeRangeStart: (d: string) => void;
  rangeEnd: string;
  onChangeRangeEnd: (d: string) => void;
  totalCount?: number;
  compact?: boolean;
}

export const SubtaskFilterBar: React.FC<SubtaskFilterBarProps> = ({
  period,
  onChangePeriod,
  specificDate,
  onChangeSpecificDate,
  rangeStart,
  onChangeRangeStart,
  rangeEnd,
  onChangeRangeEnd,
  totalCount,
  compact = false,
}) => {
  const weekBounds = getCurrentWeekBounds();

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex flex-wrap items-center gap-1 bg-stone-100 p-0.5 rounded-xl border border-stone-200/80 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => onChangePeriod('current_week')}
            className={`px-2 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              period === 'current_week'
                ? 'bg-white text-[#2A7B76] shadow-2xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
            title={`Afficher uniquement la semaine en cours (${weekBounds.labelFr})`}
          >
            <Calendar className="h-3 w-3" />
            <span>Semaine en cours</span>
          </button>

          <button
            type="button"
            onClick={() => onChangePeriod('specific_date')}
            className={`px-2 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              period === 'specific_date'
                ? 'bg-white text-[#2A7B76] shadow-2xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
            title="Filtrer sur une date précise"
          >
            <span>Par date</span>
          </button>

          <button
            type="button"
            onClick={() => onChangePeriod('date_range')}
            className={`px-2 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              period === 'date_range' || period === 'last_week' || period === 'current_month'
                ? 'bg-white text-[#2A7B76] shadow-2xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
            title="Filtrer sur une période (du ... au ...)"
          >
            <CalendarRange className="h-3 w-3" />
            <span>Par période</span>
          </button>

          <button
            type="button"
            onClick={() => onChangePeriod('all')}
            className={`px-2 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              period === 'all'
                ? 'bg-white text-[#2A7B76] shadow-2xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
            title="Afficher toutes les sous-tâches"
          >
            <History className="h-3 w-3" />
            <span>{typeof totalCount === 'number' ? `Toutes (${totalCount})` : 'Toutes'}</span>
          </button>
        </div>

        {!compact && (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-500"
            title="Classées de la sous-tâche la plus récente à la plus ancienne"
          >
            <ArrowDownWideNarrow className="h-3 w-3 text-[#2A7B76]" />
            <span>Plus récentes d&apos;abord</span>
          </span>
        )}
      </div>

      {period === 'specific_date' && (
        <div className="flex flex-wrap items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-[11px]">
          <span className="font-semibold text-stone-600">Date exacte :</span>
          <input
            type="date"
            value={specificDate}
            onChange={(e) => onChangeSpecificDate(e.target.value)}
            className="px-2 py-1 rounded-lg border border-stone-200 bg-white font-mono text-stone-800 cursor-pointer outline-none focus:border-[#2A7B76]"
          />
          <button
            type="button"
            onClick={() => onChangeSpecificDate(new Date().toISOString().split('T')[0])}
            className="text-[#2A7B76] font-semibold hover:underline cursor-pointer"
          >
            Aujourd&apos;hui
          </button>
        </div>
      )}

      {(period === 'date_range' || period === 'last_week' || period === 'current_month') && (
        <div className="flex flex-wrap items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-[11px]">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onChangePeriod('last_week')}
              className={`px-2 py-0.5 rounded-md border cursor-pointer transition ${
                period === 'last_week'
                  ? 'bg-[#2A7B76] text-white border-[#2A7B76] font-bold'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
              }`}
            >
              Semaine dernière
            </button>
            <button
              type="button"
              onClick={() => onChangePeriod('current_month')}
              className={`px-2 py-0.5 rounded-md border cursor-pointer transition ${
                period === 'current_month'
                  ? 'bg-[#2A7B76] text-white border-[#2A7B76] font-bold'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
              }`}
            >
              Ce mois
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-stone-500 font-semibold">Du</span>
            <input
              type="date"
              value={rangeStart}
              onChange={(e) => {
                onChangePeriod('date_range');
                onChangeRangeStart(e.target.value);
              }}
              className="px-2 py-0.5 rounded-lg border border-stone-200 bg-white font-mono text-stone-800 cursor-pointer outline-none focus:border-[#2A7B76]"
            />
            <span className="text-stone-500 font-semibold">au</span>
            <input
              type="date"
              value={rangeEnd}
              onChange={(e) => {
                onChangePeriod('date_range');
                onChangeRangeEnd(e.target.value);
              }}
              className="px-2 py-0.5 rounded-lg border border-stone-200 bg-white font-mono text-stone-800 cursor-pointer outline-none focus:border-[#2A7B76]"
            />
          </div>
        </div>
      )}
    </div>
  );
};
