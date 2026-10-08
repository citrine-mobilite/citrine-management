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

  // Rule 1: Si le départ a déjà été pointé, TOUS les boutons sont désactivés pour le reste de la journée
  const hasDeparted = Boolean(todayPresence?.departureTime);

  // Rule 2: Arrivée (active UNIQUEMENT entre 07h00 et 17h00 si pas encore badgée et pas de départ)
  const hasArrived = Boolean(todayPresence?.arrivalTime);
  const isWithinArrivalWindow = currentHHMM >= '07:00' && currentHHMM <= '17:00';
  const canClockArrival = !hasArrived && !hasDeparted && isWithinArrivalWindow;

  // Rule 3: Pause
  const hasStartedPause = Boolean(todayPresence?.pauseStart);
  const isWithinBreakWindow = currentHHMM >= breakStartTime && currentHHMM <= breakEndTime;
  const canStartPause = hasArrived && !hasStartedPause && !hasDeparted && isWithinBreakWindow;

  // Rule 4: Reprise de pause (activable UNIQUEMENT si on est allé en pause)
  const hasEndedPause = Boolean(todayPresence?.pauseEnd);
  const canEndPause = hasStartedPause && !hasEndedPause && !hasDeparted;

  // Rule 5: Départ (s'active/s'affiche uniquement à partir de 16h)
  const isAfterDepartureHour = currentHHMM >= departureActiveStartTime;
  const canDepart = hasArrived && !hasDeparted && isAfterDepartureHour;

  return (
    <div
      className={`grid gap-3 pt-2 ${
        enableBreakTracking ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'
      }`}
    >
      {/* 1. Bouton Arrivée (Accessible seulement entre 07h00 et 17h00) */}
      <button
        onClick={() => onTriggerClock('arrival')}
        disabled={isLocating || !canClockArrival || hasArrived || hasDeparted}
        className={`w-full py-3.5 px-4 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-sm ${
          hasArrived
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-not-allowed shadow-none'
            : hasDeparted
            ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed shadow-none'
            : !canClockArrival
            ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed shadow-none'
            : 'bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white cursor-pointer hover:shadow-md active:scale-98'
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
            <span>Journée terminée (Reviens demain dès 07h)</span>
          </>
        ) : !isWithinArrivalWindow ? (
          <>
            <Lock className="h-4 w-4 text-stone-400 shrink-0" />
            <span>Arrivée ({currentHHMM < '07:00' ? 'Dès 07h00' : 'Clôturé à 17h00'})</span>
          </>
        ) : (
          <>
            <Play className="h-4 w-4 fill-white shrink-0" />
            <span>Signaler mon arrivée ({liveTimeString})</span>
          </>
        )}
      </button>

      {/* 2. Bouton Pause (Actif seulement entre 12h et 15h) */}
      {enableBreakTracking && (
        <button
          onClick={() => onTriggerClock('pauseStart')}
          disabled={isLocating || !canStartPause || hasDeparted}
          className={`w-full py-3.5 px-4 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-sm ${
            hasStartedPause
              ? 'bg-amber-50 text-amber-800 border border-amber-200 cursor-not-allowed shadow-none'
              : hasDeparted
              ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed shadow-none'
              : !canStartPause
              ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed shadow-none'
              : 'bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white cursor-pointer hover:shadow-md active:scale-98'
          }`}
        >
          {hasStartedPause ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Pause badgée ({todayPresence?.pauseStart})</span>
            </>
          ) : !isWithinBreakWindow && hasArrived && !hasDeparted ? (
            <>
              <Lock className="h-4 w-4 text-stone-400 shrink-0" />
              <span>Pause ({breakStartTime} - {breakEndTime})</span>
            </>
          ) : (
            <>
              <Coffee className="h-4 w-4 shrink-0" />
              <span>Départ en pause ({liveTimeString})</span>
            </>
          )}
        </button>
      )}

      {/* 3. Bouton Retour de Pause (Actif UNIQUEMENT si on est allé en pause) */}
      {enableBreakTracking && (
        <button
          onClick={() => onTriggerClock('pauseEnd')}
          disabled={isLocating || !canEndPause || hasDeparted}
          className={`w-full py-3.5 px-4 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-sm ${
            hasEndedPause
              ? 'bg-teal-50 text-teal-800 border border-teal-200 cursor-not-allowed shadow-none'
              : hasDeparted
              ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed shadow-none'
              : !canEndPause
              ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed shadow-none'
              : 'bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white cursor-pointer hover:shadow-md active:scale-98'
          }`}
        >
          {hasEndedPause ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
              <span>Reprise badgée ({todayPresence?.pauseEnd})</span>
            </>
          ) : !hasStartedPause ? (
            <>
              <Lock className="h-4 w-4 text-stone-400 shrink-0" />
              <span>Reprise (Requiert pause)</span>
            </>
          ) : (
            <>
              <RotateCcw className="h-4 w-4 shrink-0" />
              <span>Retour de pause ({liveTimeString})</span>
            </>
          )}
        </button>
      )}

      {/* 4. Bouton Départ (S'affiche/s'active à partir de 16h) */}
      <button
        onClick={() => onTriggerClock('departure')}
        disabled={isLocating || hasDeparted || !canDepart}
        className={`w-full py-3.5 px-4 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-sm ${
          hasDeparted
            ? 'bg-stone-100 text-stone-700 border border-stone-300 font-extrabold cursor-not-allowed shadow-none'
            : !canDepart
            ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed shadow-none'
            : 'bg-[#2A7B76] hover:bg-[#20635F] disabled:opacity-50 text-white cursor-pointer hover:shadow-md active:scale-98'
        }`}
      >
        {hasDeparted ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-[#2A7B76] shrink-0" />
            <span>Départ badgé ({todayPresence?.departureTime})</span>
          </>
        ) : !isAfterDepartureHour && hasArrived ? (
          <>
            <Lock className="h-4 w-4 text-stone-400 shrink-0" />
            <span>Départ (Dès {departureActiveStartTime})</span>
          </>
        ) : (
          <>
            <Home className="h-4 w-4 shrink-0" />
            <span>Rentrer à la maison ({liveTimeString})</span>
          </>
        )}
      </button>
    </div>
  );
};
