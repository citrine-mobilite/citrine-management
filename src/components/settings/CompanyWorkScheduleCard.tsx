import React from 'react';
import { Clock } from 'lucide-react';
import { CompanyModuleConfig } from '../../types';

interface CompanyWorkScheduleCardProps {
  formData: CompanyModuleConfig;
  onChangeField: (key: keyof CompanyModuleConfig, val: unknown) => void;
  onUpdatePair: (updates: Partial<CompanyModuleConfig>) => void;
}

export const CompanyWorkScheduleCard: React.FC<CompanyWorkScheduleCardProps> = ({
  formData,
  onChangeField,
  onUpdatePair,
}) => {
  return (
    <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-4">
      <h4 className="font-serif font-bold text-xs text-stone-900 flex items-center gap-2">
        <Clock className="h-4 w-4 text-[#2A7B76]" /> Configuration des Seuils Horaires de Travail
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-1">
          <label className="text-[10px] uppercase font-bold text-stone-600 block">
            Heure d'Arrivée normale :
          </label>
          <input
            type="time"
            value={formData.workStartTime || '08:00'}
            onChange={(e) => onChangeField('workStartTime', e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-xl px-3 py-1.5 font-bold text-xs text-stone-800 focus:outline-none focus:border-[#2A7B76]"
          />
          <p className="text-[9px] text-stone-400">Heure de début contractuelle.</p>
        </div>

        <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/80 space-y-1">
          <label className="text-[10px] uppercase font-bold text-amber-900 block">
            Seuil de Retard (Variable) :
          </label>
          <input
            type="time"
            value={formData.lateThresholdTime || '08:30'}
            onChange={(e) => onChangeField('lateThresholdTime', e.target.value)}
            className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 font-bold text-xs text-amber-950 focus:outline-none focus:border-amber-500"
          />
          <p className="text-[9px] text-amber-700">Badgeage au-delà = retard automatique.</p>
        </div>

        <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-1">
          <label className="text-[10px] uppercase font-bold text-stone-600 block">
            Plage de Pause (12h - 15h) :
          </label>
          <div className="flex items-center gap-1">
            <input
              type="time"
              value={formData.breakStartTime || '12:00'}
              onChange={(e) => onChangeField('breakStartTime', e.target.value)}
              className="w-1/2 bg-white border border-stone-200 rounded-xl px-2 py-1 font-bold text-xs text-stone-800"
            />
            <span className="text-stone-400">-</span>
            <input
              type="time"
              value={formData.breakEndTime || '15:00'}
              onChange={(e) => onChangeField('breakEndTime', e.target.value)}
              className="w-1/2 bg-white border border-stone-200 rounded-xl px-2 py-1 font-bold text-xs text-stone-800"
            />
          </div>
          <p className="text-[9px] text-stone-400">Bouton pause actif dans ce créneau.</p>
        </div>

        <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-1">
          <label className="text-[10px] uppercase font-bold text-stone-600 block">
            Heure minimale de Départ :
          </label>
          <input
            type="time"
            value={formData.departureActiveStartTime || formData.plannedDepartureTime || '16:00'}
            onChange={(e) =>
              onUpdatePair({
                departureActiveStartTime: e.target.value,
                plannedDepartureTime: e.target.value,
              })
            }
            className="w-full bg-white border border-stone-200 rounded-xl px-3 py-1.5 font-bold text-xs text-stone-800 focus:outline-none focus:border-[#2A7B76]"
          />
          <p className="text-[9px] text-stone-400">Bouton départ actif dès cette heure.</p>
        </div>
      </div>
    </div>
  );
};
