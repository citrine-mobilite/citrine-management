import React from 'react';
import { Play, Coffee, RotateCcw, Home, CheckCircle2, Lock } from 'lucide-react';
import { Presence, CompanyModuleConfig } from '../../types';

interface EmployeeClockActionButtonsProps {
  todayPresence?: Presence;
  liveTimeString: string;
  isLocating: boolean;
  onTriggerClock: (action: 'arrival' | 'pauseStart' | 'pauseEnd' | 'departure') => void;
  enableBreakTracking?: boolean;
  moduleConfig?: CompanyModuleConfig;
}

export const EmployeeClockActionButtons: React.FC<EmployeeClockActionButtonsProps> = ({
  todayPresence,
  liveTimeString,
  isLocating,
  onTriggerClock,
  enableBreakTracking = true,
  moduleConfig,
}) => {
  // Extract current HH:mm from liveTimeString (or real Date)
  const now = new Date();
  const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const breakStartTime = moduleConfig?.breakStartTime || '12:00';
  const breakEndTime = moduleConfig?.breakEndTime || '15:00';
  const departureActiveStartTime = moduleConfig?.departureActiveStartTime || moduleConfig?.plannedDepartureTime || '16:00';

  const hasDeparted = Boolean(todayPresence?.departureTime);
  const hasArrived = Boolean(todayPresence?.arrivalTime);
  const isWithinArrivalWindow = currentHHMM >= '07:00' && currentHHMM <= '17:00';
  const canClockArrival = !hasArrived && !hasDeparted && isWithinArrivalWindow;

  const hasStartedPause = Boolean(todayPresence?.pauseStart);
  const isWithinBreakWindow = currentHHMM >= breakStartTime && currentHHMM <= breakEndTime;
  const canStartPause = hasArrived && !hasStartedPause && !hasDeparted && isWithinBreakWindow;

  const hasEndedPause = Boolean(todayPresence?.pauseEnd);
  const canEndPause = hasStartedPause && !hasEndedPause && !hasDeparted;

  const isAfterDepartureHour = currentHHMM >= departureActiveStartTime;
  const canDepart = hasArrived && !hasDeparted && isAfterDepartureHour;

  return (
    <div className="space-y-4 pt-1">
      {/* Principal Daily Clock Grid */}
      <div className="bg-stone-50/70 p-3.5 rounded-2xl border border-stone-200/80 space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
            Assiduité & Pointage Journalier
          </span>
          <span className="text-[11px] font-mono font-medium text-stone-500">
            {liveTimeString}
          </span>
        </div>

        <div className={`grid gap-3 ${enableBreakTracking ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'}`}>
          {/* 1. Arrivée */}
          <button
            onClick={() => onTriggerClock('arrival')}
            disabled={isLocating || !canClockArrival || hasArrived || hasDeparted}
            className={`w-full py-3.5 px-4 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-xs ${
              hasArrived
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-not-allowed shadow-none'
                : hasDeparted
                ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed shadow-none'
                : !canClockArrival
                ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-98'
            }`}
          >
            {hasArrived ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Arrivée badgée ({todayPresence?.arrivalTime})</span>
              </>
            ) : hasDeparted ? (
              <>
                <Lock className="h-4 w-4 text-stone-400 shrink-0" />
                <span>Journée terminée</span>
              </>
            ) : !isWithinArrivalWindow ? (
              <>
                <Lock className="h-4 w-4 text-stone-400 shrink-0" />
                <span>Arrivée ({currentHHMM < '07:00' ? 'Dès 07h00' : 'Clôturé'})</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-white shrink-0" />
                <span>Signaler mon Arrivée</span>
              </>
            )}
          </button>

          {/* 2. Pause */}
          {enableBreakTracking && (
            <button
              onClick={() => onTriggerClock('pauseStart')}
              disabled={isLocating || !canStartPause || hasDeparted}
              className={`w-full py-3.5 px-4 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-xs ${
                hasStartedPause
                  ? 'bg-amber-50 text-amber-800 border border-amber-200 cursor-not-allowed shadow-none'
                  : hasDeparted || !canStartPause
                  ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed shadow-none'
                  : 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer active:scale-98'
              }`}
            >
              {hasStartedPause ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Pause ({todayPresence?.pauseStart})</span>
                </>
              ) : (
                <>
                  <Coffee className="h-4 w-4 shrink-0" />
                  <span>Départ en Pause</span>
                </>
              )}
            </button>
          )}

          {/* 3. Reprise de Pause */}
          {enableBreakTracking && (
            <button
              onClick={() => onTriggerClock('pauseEnd')}
              disabled={isLocating || !canEndPause || hasDeparted}
              className={`w-full py-3.5 px-4 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-xs ${
                hasEndedPause
                  ? 'bg-teal-50 text-teal-800 border border-teal-200 cursor-not-allowed shadow-none'
                  : hasDeparted || !canEndPause
                  ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed shadow-none'
                  : 'bg-teal-600 hover:bg-teal-700 text-white cursor-pointer active:scale-98'
              }`}
            >
              {hasEndedPause ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                  <span>Reprise ({todayPresence?.pauseEnd})</span>
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 shrink-0" />
                  <span>Retour de Pause</span>
                </>
              )}
            </button>
          )}

          {/* 4. Départ */}
          <button
            onClick={() => onTriggerClock('departure')}
            disabled={isLocating || hasDeparted || !canDepart}
            className={`w-full py-3.5 px-4 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-xs ${
              hasDeparted
                ? 'bg-stone-100 text-stone-700 border border-stone-300 font-extrabold cursor-not-allowed shadow-none'
                : !canDepart
                ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed shadow-none'
                : 'bg-[#2A7B76] hover:bg-[#20635F] text-white cursor-pointer active:scale-98'
            }`}
          >
            {hasDeparted ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-[#2A7B76] shrink-0" />
                <span>Départ ({todayPresence?.departureTime})</span>
              </>
            ) : (
              <>
                <Home className="h-4 w-4 shrink-0" />
                <span>Rentrer à la maison</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
