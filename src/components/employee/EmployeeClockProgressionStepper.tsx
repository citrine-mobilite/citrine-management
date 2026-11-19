import React from 'react';
import { SlidersHorizontal, Check, Play, Coffee, RotateCcw, Home } from 'lucide-react';
import { Presence } from '../../types';

interface EmployeeClockProgressionStepperProps {
  todayPresence?: Presence;
  enableBreakTracking?: boolean;
}

export const EmployeeClockProgressionStepper: React.FC<EmployeeClockProgressionStepperProps> = ({
  todayPresence,
  enableBreakTracking = true,
}) => {
  const steps = enableBreakTracking
    ? [
        { label: 'Arrivée', time: todayPresence?.arrivalTime, icon: Play },
        { label: 'Pause', time: todayPresence?.pauseStart, icon: Coffee },
        { label: 'Reprise', time: todayPresence?.pauseEnd, icon: RotateCcw },
        { label: 'Départ', time: todayPresence?.departureTime, icon: Home },
      ]
    : [
        { label: 'Arrivée', time: todayPresence?.arrivalTime, icon: Play },
        { label: 'Départ', time: todayPresence?.departureTime, icon: Home },
      ];

  const getStatusText = () => {
    if (!todayPresence?.arrivalTime) return 'Non démarré';
    if (!enableBreakTracking) {
      if (!todayPresence?.departureTime) return 'En poste (Présent)';
      return 'Journée terminée';
    }
    if (!todayPresence?.pauseStart) return 'En poste (Présent)';
    if (!todayPresence?.pauseEnd) return 'En pause';
    if (!todayPresence?.departureTime) return 'De retour au poste';
    return 'Journée terminée';
  };

  const getProgressWidth = () => {
    if (!todayPresence?.arrivalTime) return '0%';
    if (!enableBreakTracking) {
      if (!todayPresence?.departureTime) return '50%';
      return '100%';
    }
    if (!todayPresence?.pauseStart) return '33%';
    if (!todayPresence?.pauseEnd) return '66%';
    if (!todayPresence?.departureTime) return '85%';
    return '100%';
  };

  return (
    <div className="bg-stone-50/70 rounded-2xl p-4 border border-stone-200/70 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] uppercase font-bold text-stone-500 tracking-wider flex items-center gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5 text-[#2A7B76]" /> Étape de votre parcours aujourd'hui
        </h3>
        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full">
          {getStatusText()}
        </span>
      </div>

      <div className="relative pt-4 pb-2 px-1">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-stone-200 -translate-y-1/2 rounded-full" />
        <div
          className="absolute top-1/2 left-0 h-0.5 bg-[#2A7B76] -translate-y-1/2 rounded-full transition-all duration-500"
          style={{ width: getProgressWidth() }}
        />

        <div className="relative flex justify-between">
          {steps.map((step, idx) => {
            const isDone = Boolean(step.time);
            const StepIcon = step.icon;
            return (
              <div key={idx} className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 z-10 ${
                    isDone
                      ? 'bg-[#2A7B76] text-white shadow-sm ring-4 ring-emerald-100'
                      : 'bg-white text-stone-400 border border-stone-200'
                  }`}
                >
                  {isDone ? (
                    <Check className="h-3.5 w-3.5 stroke-[3px]" />
                  ) : (
                    <StepIcon className="h-3.5 w-3.5" />
                  )}
                </div>
                <span className={`text-[10px] font-bold mt-1.5 ${isDone ? 'text-stone-900' : 'text-stone-400'}`}>
                  {step.label}
                </span>
                <span className="text-[9px] font-mono font-bold text-stone-500 mt-0.5">
                  {step.time || '--:--'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
