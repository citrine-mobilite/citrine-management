import React from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { Presence } from '../../types';

interface EmployeeClockEmergencySectionProps {
  todayPresence?: Presence;
  onOpenEmergencyModal: () => void;
  onOpenCustomClockModal: () => void;
}

export const EmployeeClockEmergencySection: React.FC<EmployeeClockEmergencySectionProps> = ({
  todayPresence,
  onOpenEmergencyModal,
  onOpenCustomClockModal,
}) => {
  return (
    <div className="space-y-3">
      {/* Actions Bar */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-stone-50/80 p-3 rounded-2xl border border-stone-200/80">
        <button
          onClick={onOpenEmergencyModal}
          className="w-full sm:w-auto bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
        >
          <AlertCircle className="h-4 w-4 animate-bounce" />
          <span>🚨 Signaler une urgence (Retard, Pause, Départ)</span>
        </button>

        <button
          onClick={onOpenCustomClockModal}
          className="text-stone-600 hover:text-[#2A7B76] font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <Clock className="h-3.5 w-3.5 text-[#2A7B76]" />
          Ajuster l'horaire manuellement (Horloge 24h)
        </button>
      </div>

      {/* Display Recorded Emergencies for Today */}
      {todayPresence?.emergencies && todayPresence.emergencies.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-amber-900 block">
            🚨 Urgences signalées aujourd'hui ({todayPresence.emergencies.length}) :
          </span>
          <div className="flex flex-wrap gap-2">
            {todayPresence.emergencies.map((emg) => (
              <div
                key={emg.id}
                className={`bg-white border rounded-xl px-2.5 py-1 text-[11px] font-medium flex items-center gap-1.5 shadow-2xs ${
                  emg.status === 'rejected'
                    ? 'border-red-300 text-red-950 bg-red-50/40'
                    : emg.status === 'approved'
                    ? 'border-emerald-300 text-emerald-950 bg-emerald-50/40'
                    : 'border-amber-300 text-amber-950'
                }`}
              >
                <span className="font-bold text-stone-700">[{emg.timeString}]</span>
                <span className="font-semibold uppercase text-[10px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-800">
                  {emg.type === 'retard'
                    ? 'Retard'
                    : emg.type === 'pause_anticipee'
                    ? 'Pause anticipée'
                    : emg.type === 'rallonge_pause'
                    ? 'Rallonge pause'
                    : 'Départ anticipé'}
                </span>
                <span className="truncate max-w-[200px]" title={emg.reason}>
                  {emg.reason}
                </span>
                <span
                  className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    emg.status === 'rejected'
                      ? 'bg-red-100 text-red-700'
                      : emg.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {emg.status === 'rejected'
                    ? 'Refusée'
                    : emg.status === 'approved'
                    ? 'Validée'
                    : 'En attente'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
