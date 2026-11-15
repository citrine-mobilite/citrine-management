import React, { useState } from 'react';
import { Building2, Coffee, Save, ToggleLeft, ToggleRight, Info } from 'lucide-react';
import { CompanyModuleConfig } from '../../types';
import { CompanyGpsSettingsCard } from './CompanyGpsSettingsCard';
import { CompanyWorkScheduleCard } from './CompanyWorkScheduleCard';

interface CompanyHoursAndGeneralSettingsProps {
  moduleConfig: CompanyModuleConfig;
  onUpdateModuleConfig: (config: CompanyModuleConfig) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export const CompanyHoursAndGeneralSettings: React.FC<CompanyHoursAndGeneralSettingsProps> = ({
  moduleConfig,
  onUpdateModuleConfig,
  showToast,
}) => {
  const [formData, setFormData] = useState<CompanyModuleConfig>({ ...moduleConfig });
  const [isLocating, setIsLocating] = useState(false);

  const isBreakTrackingEnabled = formData.enableBreakTracking !== false;

  const handleToggleBreaks = () => {
    const updated = {
      ...formData,
      enableBreakTracking: !isBreakTrackingEnabled,
    };
    setFormData(updated);
    onUpdateModuleConfig(updated);
    if (showToast) {
      showToast(
        `Pointage des pauses ${!isBreakTrackingEnabled ? 'activé (4 étapes)' : 'désactivé (2 étapes)'}`,
        'success'
      );
    }
  };

  const handleChange = (key: keyof CompanyModuleConfig, val: unknown) => {
    const updated = { ...formData, [key]: val };
    setFormData(updated);
    onUpdateModuleConfig(updated);
  };

  const handleUpdatePair = (updates: Partial<CompanyModuleConfig>) => {
    const updated = { ...formData, ...updates };
    setFormData(updated);
    onUpdateModuleConfig(updated);
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      if (showToast) showToast('Géolocalisation non supportée par votre navigateur.', 'error');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        handleUpdatePair({
          companyLatitude: lat,
          companyLongitude: lng,
          hqLatitude: lat,
          hqLongitude: lng,
        });
        if (showToast) showToast(`Position GPS captée : ${lat}°, ${lng}°`, 'success');
      },
      () => {
        setIsLocating(false);
        if (showToast) showToast('Impossible de récupérer la position GPS.', 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-[#2A7B76] rounded-2xl border border-emerald-100">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-stone-900">
              Paramètres de l'Entreprise & Horaires de Travail
            </h3>
            <p className="text-xs text-stone-500">
              Configuration de l'identité de l'entreprise, coordonnées GPS du siège et seuils d'assiduité.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onUpdateModuleConfig(formData);
            if (showToast) showToast('Tous les paramètres ont été sauvegardés.', 'success');
          }}
          className="px-4 py-2 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2 self-start sm:self-auto"
        >
          <Save className="h-4 w-4" />
          <span>Enregistrer</span>
        </button>
      </div>

      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 text-amber-800 rounded-xl">
              <Coffee className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-stone-900">
                Option : Pointage des Pauses (Début Pause & Reprise)
              </h4>
              <p className="text-xs text-stone-500">
                Définissez si les collaborateurs doivent badger leurs pauses déjeuner en milieu de journée.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleBreaks}
            className="cursor-pointer transition text-[#2A7B76]"
          >
            {isBreakTrackingEnabled ? (
              <ToggleRight className="h-8 w-8 text-[#2A7B76]" />
            ) : (
              <ToggleLeft className="h-8 w-8 text-stone-400" />
            )}
          </button>
        </div>

        <div
          className={`p-4 rounded-2xl border transition ${
            isBreakTrackingEnabled ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' : 'bg-stone-50 border-stone-200 text-stone-700'
          }`}
        >
          <div className="flex items-start gap-2.5 text-xs font-medium">
            <Info className="h-4 w-4 text-[#2A7B76] shrink-0 mt-0.5" />
            <div>
              <strong>Mode Actuel : {isBreakTrackingEnabled ? 'Pointage en 4 Étapes Activé' : 'Pointage Direct en 2 Étapes'}</strong>
              <p className="text-[11px] mt-0.5 opacity-90">
                {isBreakTrackingEnabled
                  ? 'Les collaborateurs badgent : 1. Arrivée ➔ 2. Pause ➔ 3. Reprise ➔ 4. Départ.'
                  : 'Les collaborateurs badgent uniquement : 1. Arrivée ➔ 2. Départ. Les boutons de pause sont masqués.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <CompanyGpsSettingsCard
        formData={formData}
        isLocating={isLocating}
        onChangeField={handleChange}
        onUpdatePair={handleUpdatePair}
        onDetectGPS={handleDetectGPS}
      />

      <CompanyWorkScheduleCard
        formData={formData}
        onChangeField={handleChange}
        onUpdatePair={handleUpdatePair}
      />
    </div>
  );
};
