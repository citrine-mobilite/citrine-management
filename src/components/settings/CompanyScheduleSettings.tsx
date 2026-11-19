import React, { useState, useEffect } from 'react';
import { Clock, Save, CheckCircle2, QrCode, Sliders } from 'lucide-react';
import { CompanyModuleConfig, DEFAULT_MODULE_CONFIG } from '../../types';
import { CompanyBreaksToggleCard } from './CompanyBreaksToggleCard';
import { CompanyWorkHoursFields } from './CompanyWorkHoursFields';
import { CompanyGpsLocationCard } from './CompanyGpsLocationCard';
import { CompanyDoorQrSettingsCard } from './CompanyDoorQrSettingsCard';

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
  const [activeSubTab, setActiveSubTab] = useState<'schedules' | 'door_qr'>('schedules');

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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Sélecteur de sous-onglets dans Horaires & Pointages */}
      <div className="bg-stone-200/70 p-1.5 rounded-2xl flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setActiveSubTab('schedules')}
          className={`flex-1 min-w-[200px] py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
            activeSubTab === 'schedules'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-white/40'
          }`}
        >
          <Sliders className="h-4 w-4 text-[#2A7B76]" />
          <span>1. Plages Horaires, Pauses & GPS Siège</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('door_qr')}
          className={`flex-1 min-w-[200px] py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
            activeSubTab === 'door_qr'
              ? 'bg-[#2A7B76] text-white shadow-xs'
              : 'text-stone-700 hover:text-stone-900 hover:bg-white/40'
          }`}
        >
          <QrCode className="h-4 w-4" />
          <span>2. Générer QR Code de Badge d'Entrée (Porte)</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
            activeSubTab === 'door_qr' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-[#2A7B76]'
          }`}>
            Borne Fixe
          </span>
        </button>
      </div>

      {activeSubTab === 'schedules' ? (
        <form onSubmit={handleSubmit} className="space-y-6">
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
      ) : (
        /* ONGLET 2: QR CODE DE BADGE D'ENTRÉE (BORNE FIXE) */
        <CompanyDoorQrSettingsCard
          moduleConfig={safeConfig}
          onUpdateModuleConfig={onUpdateModuleConfig}
          showToast={showToast}
        />
      )}
    </div>
  );
};
