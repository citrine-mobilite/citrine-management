import React from 'react';
import { Clock } from 'lucide-react';
import { CompanyModuleConfig } from '../../types';

interface CompanyWorkHoursFieldsProps {
  formData: CompanyModuleConfig;
  onChange: (key: keyof CompanyModuleConfig, val: any) => void;
}

export const CompanyWorkHoursFields: React.FC<CompanyWorkHoursFieldsProps> = ({
  formData,
  onChange,
}) => {
  return (
    <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
        <Clock className="h-4 w-4 text-[#2A7B76]" />
        <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-stone-800">
          Seuils Horaires & Calcul Automatisé des Retards
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* Arrivée */}
        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
          <label className="text-[10px] uppercase font-bold text-stone-600 block">
            1. Heure d'Arrivée normale :
          </label>
          <input
            type="time"
            value={formData.workStartTime || '08:00'}
            onChange={(e) => onChange('workStartTime', e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 font-bold text-xs text-stone-800 focus:outline-none focus:border-[#2A7B76]"
          />
          <p className="text-[10px] text-stone-400">Heure de début contractuelle de la journée.</p>
        </div>

        {/* Retard */}
        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-2">
          <label className="text-[10px] uppercase font-bold text-amber-900 block flex items-center justify-between">
            <span>2. Seuil de Retard :</span>
            <span className="text-[9px] bg-amber-200/70 text-amber-900 px-1.5 py-0.5 rounded font-bold">Variable</span>
          </label>
          <input
            type="time"
            value={formData.lateThresholdTime || '08:30'}
            onChange={(e) => onChange('lateThresholdTime', e.target.value)}
            className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 font-bold text-xs text-amber-950 focus:outline-none focus:border-amber-500"
          />
          <p className="text-[10px] text-amber-800">Badgeage après cette heure = retard comptabilisé.</p>
        </div>

        {/* Pause */}
        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
          <label className="text-[10px] uppercase font-bold text-stone-600 block">
            3. Créneau de Pause Déjeuner :
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="time"
              value={formData.breakStartTime || '12:00'}
              onChange={(e) => onChange('breakStartTime', e.target.value)}
              className="w-1/2 bg-white border border-stone-200 rounded-xl px-2 py-1.5 font-bold text-xs text-stone-800"
            />
            <span className="text-stone-400 font-bold">-</span>
            <input
              type="time"
              value={formData.breakEndTime || '15:00'}
              onChange={(e) => onChange('breakEndTime', e.target.value)}
              className="w-1/2 bg-white border border-stone-200 rounded-xl px-2 py-1.5 font-bold text-xs text-stone-800"
            />
          </div>
          <p className="text-[10px] text-stone-400">Fenêtre où le badge pause est disponible.</p>
        </div>

        {/* Départ */}
        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
          <label className="text-[10px] uppercase font-bold text-stone-600 block">
            4. Heure min. de Départ :
          </label>
          <input
            type="time"
            value={formData.departureActiveStartTime || formData.plannedDepartureTime || '16:00'}
            onChange={(e) => {
              onChange('departureActiveStartTime', e.target.value);
              onChange('plannedDepartureTime', e.target.value);
            }}
            className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 font-bold text-xs text-stone-800 focus:outline-none focus:border-[#2A7B76]"
          />
          <p className="text-[10px] text-stone-400">Le bouton de sortie s'active dès cette heure.</p>
        </div>
      </div>
    </div>
  );
};
