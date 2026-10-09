import React from 'react';
import { Coffee, ToggleLeft, ToggleRight, Info } from 'lucide-react';

interface CompanyBreaksToggleCardProps {
  isBreakTrackingEnabled: boolean;
  onToggleBreaks: () => void;
}

export const CompanyBreaksToggleCard: React.FC<CompanyBreaksToggleCardProps> = ({
  isBreakTrackingEnabled,
  onToggleBreaks,
}) => {
  return (
    <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-900 rounded-xl">
            <Coffee className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm text-stone-900">
              Mode de Pointage des Pauses Déjeuner
            </h4>
            <p className="text-xs text-stone-500">
              Activez ou désactivez l'obligation de pointer le départ en pause et la reprise.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleBreaks}
          className="cursor-pointer transition text-[#2A7B76] shrink-0"
          title={isBreakTrackingEnabled ? 'Désactiver le pointage des pauses' : 'Activer le pointage des pauses'}
        >
          {isBreakTrackingEnabled ? (
            <ToggleRight className="h-9 w-9 text-[#2A7B76]" />
          ) : (
            <ToggleLeft className="h-9 w-9 text-stone-300 hover:text-stone-400" />
          )}
        </button>
      </div>

      <div className={`p-4 rounded-2xl border transition text-xs ${
        isBreakTrackingEnabled 
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
          : 'bg-stone-50 border-stone-200 text-stone-700'
      }`}>
        <div className="flex items-start gap-2.5">
          <Info className="h-4 w-4 text-[#2A7B76] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-xs">
              {isBreakTrackingEnabled 
                ? 'Protocole Actif : Pointage en 4 Étapes' 
                : 'Protocole Actif : Pointage Simplifié en 2 Étapes'}
            </p>
            <p className="text-[11px] mt-0.5 opacity-90">
              {isBreakTrackingEnabled
                ? 'Les collaborateurs badgent : 1. Arrivée du matin ➔ 2. Départ Pause ➔ 3. Reprise Pause ➔ 4. Départ soir.'
                : 'Les collaborateurs badgent uniquement : 1. Arrivée le matin ➔ 2. Départ le soir. Les contrôles de pause sont ignorés.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
