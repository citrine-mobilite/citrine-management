import React from 'react';
import { Building2, MapPin, Compass } from 'lucide-react';
import { CompanyModuleConfig } from '../../types';

interface CompanyGpsSettingsCardProps {
  formData: CompanyModuleConfig;
  isLocating: boolean;
  onChangeField: (key: keyof CompanyModuleConfig, val: unknown) => void;
  onUpdatePair: (updates: Partial<CompanyModuleConfig>) => void;
  onDetectGPS: () => void;
}

export const CompanyGpsSettingsCard: React.FC<CompanyGpsSettingsCardProps> = ({
  formData,
  isLocating,
  onChangeField,
  onUpdatePair,
  onDetectGPS,
}) => {
  return (
    <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-4">
      <h4 className="font-serif font-bold text-xs text-stone-900 flex items-center gap-2">
        <Building2 className="h-4 w-4 text-[#2A7B76]" /> Identité & Emplacement du Bureau
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
            Nom officiel de l'Entreprise :
          </label>
          <input
            type="text"
            value={formData.companyName || formData.hqName || 'Citrine SARL'}
            onChange={(e) => onUpdatePair({ companyName: e.target.value, hqName: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-800 focus:outline-none focus:border-[#2A7B76]"
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
            Adresse physique du Siège :
          </label>
          <input
            type="text"
            value={formData.hqAddress || 'Japoma (Carrefour Matango), Douala'}
            onChange={(e) => onChangeField('hqAddress', e.target.value)}
            className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:border-[#2A7B76]"
          />
        </div>
      </div>

      <div className="bg-stone-50/80 p-4 rounded-2xl border border-stone-200/80 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] uppercase font-bold text-stone-600 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-[#2A7B76]" /> Coordonnées GPS de Référence :
          </label>
          <button
            type="button"
            onClick={onDetectGPS}
            disabled={isLocating}
            className="text-[11px] font-bold text-[#2A7B76] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Compass className="h-3.5 w-3.5" />
            <span>{isLocating ? 'Capture GPS en cours...' : 'Détecter ma position GPS'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[9px] font-bold text-stone-400 block mb-0.5">Latitude :</span>
            <input
              type="number"
              step="0.000001"
              value={formData.companyLatitude ?? formData.hqLatitude ?? 4.016246}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onUpdatePair({ companyLatitude: val, hqLatitude: val });
              }}
              className="w-full bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-stone-800 focus:outline-none focus:border-[#2A7B76]"
            />
          </div>

          <div>
            <span className="text-[9px] font-bold text-stone-400 block mb-0.5">Longitude :</span>
            <input
              type="number"
              step="0.000001"
              value={formData.companyLongitude ?? formData.hqLongitude ?? 9.8203514}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onUpdatePair({ companyLongitude: val, hqLongitude: val });
              }}
              className="w-full bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-stone-800 focus:outline-none focus:border-[#2A7B76]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
