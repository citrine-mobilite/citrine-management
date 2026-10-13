import React from 'react';
import { HelpCircle, Clock, FileText } from 'lucide-react';
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
          className="w-full sm:w-auto bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-xs cursor-pointer active:scale-98"
          title="Déclarer une sortie professionnelle, un retard, un départ anticipé, une permission ou autre"
        >
          <HelpCircle className="h-4 w-4 text-emerald-200 shrink-0" />
          <span>*Autre* (Sortie pro, Retard, Départ, Permission)</span>
        </button>

        <button
          onClick={onOpenCustomClockModal}
          className="text-stone-600 hover:text-[#2A7B76] font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <Clock className="h-3.5 w-3.5 text-[#2A7B76]" />
          Ajuster l'horaire manuellement (Horloge 24h)
        </button>
      </div>

      {/* Display Recorded Declarations for Today */}
      {todayPresence?.emergencies && todayPresence.emergencies.length > 0 && (
        <div className="bg-stone-50/90 border border-stone-200 rounded-2xl p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-stone-700">
            <FileText className="h-3.5 w-3.5 text-[#2A7B76]" />
            <span>Déclarations transmises aujourd'hui ({todayPresence.emergencies.length}) :</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {todayPresence.emergencies.map((emg) => {
              const getLabel = () => {
                switch (emg.type) {
                  case 'sortie_professionnelle': return 'Sortie Pro';
                  case 'retour_sortie_professionnelle': return 'Retour Pro';
                  case 'retard': return 'Retard';
                  case 'depart_anticipe': return 'Départ anticipé';
                  case 'permission': return 'Permission';
                  case 'pause_anticipee': return 'Pause anticipée';
                  case 'rallonge_pause': return 'Rallonge pause';
                  case 'sortie_prematuree': return 'Sortie prématurée';
                  default: return 'Autre motif';
                }
              };

              const getBadgeColor = () => {
                switch (emg.type) {
                  case 'sortie_professionnelle':
                  case 'retour_sortie_professionnelle':
                    return 'bg-blue-100 text-blue-900 border-blue-200';
                  case 'permission':
                    return 'bg-purple-100 text-purple-900 border-purple-200';
                  case 'retard':
                    return 'bg-amber-100 text-amber-900 border-amber-200';
                  case 'depart_anticipe':
                  case 'sortie_prematuree':
                    return 'bg-rose-100 text-rose-900 border-rose-200';
                  default:
                    return 'bg-stone-100 text-stone-800 border-stone-200';
                }
              };

              return (
                <div
                  key={emg.id}
                  className={`bg-white border rounded-xl px-2.5 py-1 text-[11px] font-medium flex items-center gap-1.5 shadow-2xs ${
                    emg.status === 'rejected'
                      ? 'border-red-300 text-red-950 bg-red-50/40'
                      : emg.status === 'approved'
                      ? 'border-emerald-300 text-emerald-950 bg-emerald-50/40'
                      : 'border-stone-200 text-stone-800'
                  }`}
                >
                  <span className="font-bold text-stone-700">[{emg.timeString}]</span>
                  <span className={`font-bold uppercase text-[9px] px-1.5 py-0.5 rounded border ${getBadgeColor()}`}>
                    {getLabel()}
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
                      : 'Transmise'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
