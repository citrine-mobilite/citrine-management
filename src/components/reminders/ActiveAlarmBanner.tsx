import React from 'react';
import { BellRing, BellOff, Volume2, Clock, AlertTriangle } from 'lucide-react';
import { Reminder } from '../../types';

interface ActiveAlarmBannerProps {
  ringingReminder: Reminder | null;
  onStopAlarm: () => void;
  onSnooze5m?: () => void;
}

export const ActiveAlarmBanner: React.FC<ActiveAlarmBannerProps> = ({
  ringingReminder,
  onStopAlarm,
  onSnooze5m,
}) => {
  if (!ringingReminder) return null;

  return (
    <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 rounded-3xl p-5 text-white shadow-xl shadow-rose-500/25 border-2 border-white/30 animate-pulse transition-all">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Icon and Details */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/40 animate-bounce">
            <BellRing className="h-6 w-6 text-white" />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-white text-rose-700 font-extrabold text-[10px] uppercase px-2 py-0.5 rounded-full shadow-2xs tracking-wider">
                Sonnerie active en continu
              </span>
              {ringingReminder.time && (
                <span className="text-white/90 text-xs font-semibold flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Heure prévue : {ringingReminder.time}
                </span>
              )}
            </div>

            <h3 className="font-serif font-black text-base md:text-lg text-white truncate">
              {ringingReminder.title || ringingReminder.note || 'Alerte & Rappel'}
            </h3>

            {ringingReminder.note && ringingReminder.note !== ringingReminder.title && (
              <p className="text-xs text-white/90 line-clamp-1 italic">
                {ringingReminder.note}
              </p>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end shrink-0">
          {onSnooze5m && (
            <button
              type="button"
              onClick={onSnooze5m}
              className="px-3.5 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-sm transition cursor-pointer border border-white/30"
            >
              Reporter (+5 min)
            </button>
          )}

          <button
            type="button"
            onClick={onStopAlarm}
            className="px-5 py-2.5 rounded-2xl bg-white text-rose-700 hover:bg-rose-50 font-black text-xs shadow-lg transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <BellOff className="h-4 w-4 text-rose-700" />
            <span>ARRÊTER LA SONNERIE (STOP)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
