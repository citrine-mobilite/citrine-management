import React, { useState, useEffect } from 'react';
import { Clock, Save, CheckCircle2 } from 'lucide-react';
import { CompanyModuleConfig, DEFAULT_MODULE_CONFIG } from '../../types';
import { CompanyBreaksToggleCard } from './CompanyBreaksToggleCard';
import { CompanyWorkHoursFields } from './CompanyWorkHoursFields';
import { CompanyGpsLocationCard } from './CompanyGpsLocationCard';

interface CompanyScheduleSettingsProps {
  moduleConfig: CompanyModuleConfig;
  onUpdateModuleConfig: (config: CompanyModuleConfig) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export const CompanyScheduleSettings: React.FC<CompanyScheduleSettingsProps> = ({
  moduleConfig,
  onUpdateModuleConfig,
  showToast,
}) => {
  const safeConfig: CompanyModuleConfig = {
    ...DEFAULT_MODULE_CONFIG,
    ...(moduleConfig || {}),
  };

  const [formData, setFormData] = useState<CompanyModuleConfig>(safeConfig);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setFormData({
      ...DEFAULT_MODULE_CONFIG,
      ...(moduleConfig || {}),
    });
  }, [moduleConfig]);

  const isBreakTrackingEnabled = formData.enableBreakTracking !== false;

  const handleToggleBreaks = () => {
    setIsSaved(false);
    const updated = {
      ...formData,
      enableBreakTracking: !isBreakTrackingEnabled,
    };
    setFormData(updated);
    onUpdateModuleConfig(updated);
    setIsSaved(true);
    if (showToast) {
      showToast(
        `Pointage des pauses ${!isBreakTrackingEnabled ? 'activé (4 étapes)' : 'désactivé (2 étapes directes)'}`,
        'success'
      );
    }
  };

  const handleChange = (key: keyof CompanyModuleConfig, val: any) => {
    setIsSaved(false);
    setFormData((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleDetectGpsDone = (lat: number, lng: number) => {
    const updated = {
      ...formData,
      companyLatitude: lat,
      companyLongitude: lng,
      hqLatitude: lat,
      hqLongitude: lng,
    };
    setFormData(updated);
    onUpdateModuleConfig(updated);
    setIsSaved(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: CompanyModuleConfig = {
      ...formData,
      plannedDepartureTime: formData.departureActiveStartTime || formData.plannedDepartureTime || '16:30',
    };
    onUpdateModuleConfig(updated);
    setIsSaved(true);
    if (showToast) showToast('Horaires de travail et coordonnées GPS enregistrés avec succès.', 'success');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-300">
      {/* En-tête de domaine avec bouton d'enregistrement dédié */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-800 rounded-2xl border border-amber-100">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-stone-900">
              Horaires de Travail, Pauses & Périmètre GPS
            </h3>
            <p className="text-xs text-stone-500">
              Plages de présence, seuil dynamique de calcul des retards et géolocalisation de pointage.
            </p>
          </div>
        </div>

        <button
          type="submit"
          className="px-4 py-2.5 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2 self-start sm:self-auto"
        >
          {isSaved ? <CheckCircle2 className="h-4 w-4 text-emerald-200" /> : <Save className="h-4 w-4" />}
          <span>{isSaved ? 'Horaires Enregistrés' : 'Enregistrer ce Domaine'}</span>
        </button>
      </div>

      {/* 1. OPTION : POINTAGE DES PAUSES DÉJEUNER */}
      <CompanyBreaksToggleCard
        isBreakTrackingEnabled={isBreakTrackingEnabled}
        onToggleBreaks={handleToggleBreaks}
      />

      {/* 2. CONFIGURATION DES PLAGES HORAIRES & RETARDS */}
      <CompanyWorkHoursFields
        formData={formData}
        onChange={handleChange}
      />

      {/* 3. GÉOLOCALISATION & COORDONNÉES GPS DU SIÈGE */}
      <CompanyGpsLocationCard
        formData={formData}
        onChange={handleChange}
        onDetectGpsDone={handleDetectGpsDone}
        showToast={showToast}
      />
    </form>
  );
};
