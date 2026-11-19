import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import FrenchTimePicker from './FrenchTimePicker';
import { SearchableSelect } from '../common/SearchableSelect';
import { CompanyModuleConfig } from '../../types';

interface EmployeeCustomTimeModalProps {
  show: boolean;
  onClose: () => void;
  clockFieldToEdit: 'arrival' | 'pauseStart' | 'pauseEnd' | 'departure';
  setClockFieldToEdit: (field: 'arrival' | 'pauseStart' | 'pauseEnd' | 'departure') => void;
  customTimeValue: string;
  setCustomTimeValue: (val: string) => void;
  customClockReason: string;
  setCustomClockReason: (reason: string) => void;
  customClockError: string | null;
  moduleConfig?: CompanyModuleConfig;
  onSubmit: () => void;
}

export const EmployeeCustomTimeModal: React.FC<EmployeeCustomTimeModalProps> = ({
  show,
  onClose,
  clockFieldToEdit,
  setClockFieldToEdit,
  customTimeValue,
  setCustomTimeValue,
  customClockReason,
  setCustomClockReason,
  customClockError,
  moduleConfig,
  onSubmit,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-2xl max-w-sm w-full space-y-4 text-xs max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h3 className="font-serif font-bold text-stone-900 flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-[#2A7B76]" /> Modifier mon heure de pointage
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer rounded-lg"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-stone-500">
              Événement à consigner :
            </label>
            <SearchableSelect
              value={clockFieldToEdit}
              onChange={(val) => {
                const typedVal = val as any;
                setClockFieldToEdit(typedVal);
                if (typedVal === 'arrival') setCustomTimeValue(moduleConfig?.workStartTime || '08:00');
                else if (typedVal === 'pauseStart') setCustomTimeValue('13:00');
                else if (typedVal === 'pauseEnd') setCustomTimeValue('14:00');
                else setCustomTimeValue('17:00');
              }}
              options={[
                { value: 'arrival', label: '1. Arrivée au bureau (Défaut 08h00)' },
                { value: 'pauseStart', label: '2. Départ en pause (Défaut 13h00)' },
                { value: 'pauseEnd', label: '3. Retour de pause (Défaut 14h00)' },
                { value: 'departure', label: '4. Départ / Rentrer (Défaut 17h00)' }
              ]}
              placeholder="Sélectionner l'événement..."
              searchPlaceholder="Rechercher étape..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-stone-500">
              Saisir l'heure (Format français 24H) :
            </label>
            <FrenchTimePicker
              value={customTimeValue}
              onChange={(val) => setCustomTimeValue(val)}
              className="w-full py-2"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-stone-500">
              Motif de l'ajustement manuel (obligatoire) :
            </label>
            <textarea
              rows={2}
              value={customClockReason}
              onChange={(e) => setCustomClockReason(e.target.value)}
              placeholder="Ex: Oubli de pointage ce matin, problème de réseau 4G..."
              className="w-full p-2 border border-stone-200 rounded-xl bg-stone-50/70 font-medium focus:outline-none focus:border-[#2A7B76]"
            />
          </div>

          {customClockError && (
            <div className="p-2.5 bg-red-50 text-red-800 rounded-xl text-[11px] font-bold border border-red-200 flex items-start gap-1.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <span>{customClockError}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
          <button
            onClick={onClose}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold transition cursor-pointer"
          >
            Annuler
          </button>
          <button
            onClick={onSubmit}
            className="px-3.5 py-2 bg-[#2A7B76] hover:bg-[#20635F] text-white rounded-xl font-bold transition shadow-xs cursor-pointer"
          >
            Valider l'horaire
          </button>
        </div>
      </div>
    </div>
  );
};
