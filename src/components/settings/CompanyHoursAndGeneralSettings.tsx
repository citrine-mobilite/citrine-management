import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Clock, 
  Coffee, 
  Compass, 
  Save, 
  ShieldCheck, 
  ToggleLeft, 
  ToggleRight,
  Sparkles,
  Info
} from 'lucide-react';
import { CompanyModuleConfig } from '../../types';

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

  const handleChange = (key: keyof CompanyModuleConfig, val: any) => {
    const updated = {
      ...formData,
      [key]: val,
    };
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
        const updated = {
          ...formData,
          companyLatitude: lat,
          companyLongitude: lng,
          hqLatitude: lat,
          hqLongitude: lng,
        };
        setFormData(updated);
        onUpdateModuleConfig(updated);
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
      
      {/* Header Banner */}
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

      {/* ☕ COMMUTATEUR : ACTIVATION / DÉSACTIVATION DU POINTAGE DES PAUSES */}
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

        <div className={`p-4 rounded-2xl border transition ${
          isBreakTrackingEnabled ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' : 'bg-stone-50 border-stone-200 text-stone-700'
        }`}>
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

      {/* 🏢 IDENTITÉ & COORDONNÉES GPS */}
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
              onChange={(e) => {
                handleChange('companyName', e.target.value);
                handleChange('hqName', e.target.value);
              }}
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
              onChange={(e) => handleChange('hqAddress', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:border-[#2A7B76]"
            />
          </div>
        </div>

        {/* GPS Box */}
        <div className="bg-stone-50/80 p-4 rounded-2xl border border-stone-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase font-bold text-stone-600 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#2A7B76]" /> Coordonnées GPS de Référence :
            </label>
            <button
              type="button"
              onClick={handleDetectGPS}
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
                  handleChange('companyLatitude', val);
                  handleChange('hqLatitude', val);
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
                  handleChange('companyLongitude', val);
                  handleChange('hqLongitude', val);
                }}
                className="w-full bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-stone-800 focus:outline-none focus:border-[#2A7B76]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ⏰ HORAIRES ET SEUILS DE POINTAGE */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-4">
        <h4 className="font-serif font-bold text-xs text-stone-900 flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#2A7B76]" /> Configuration des Seuils Horaires de Travail
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* 1. Arrivée */}
          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-1">
            <label className="text-[10px] uppercase font-bold text-stone-600 block">
              Heure d'Arrivée normale :
            </label>
            <input
              type="time"
              value={formData.workStartTime || '08:00'}
              onChange={(e) => handleChange('workStartTime', e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-xl px-3 py-1.5 font-bold text-xs text-stone-800 focus:outline-none focus:border-[#2A7B76]"
            />
            <p className="text-[9px] text-stone-400">Heure de début contractuelle.</p>
          </div>

          {/* 2. Retard (Paramétrable - Pas 9h fixe) */}
          <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/80 space-y-1">
            <label className="text-[10px] uppercase font-bold text-amber-900 block">
              Seuil de Retard (Variable) :
            </label>
            <input
              type="time"
              value={formData.lateThresholdTime || '08:30'}
              onChange={(e) => handleChange('lateThresholdTime', e.target.value)}
              className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 font-bold text-xs text-amber-950 focus:outline-none focus:border-amber-500"
            />
            <p className="text-[9px] text-amber-700">Badgeage au-delà = retard automatique.</p>
          </div>

          {/* 3. Pause (12h - 15h) */}
          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-1">
            <label className="text-[10px] uppercase font-bold text-stone-600 block">
              Plage de Pause (12h - 15h) :
            </label>
            <div className="flex items-center gap-1">
              <input
                type="time"
                value={formData.breakStartTime || '12:00'}
                onChange={(e) => handleChange('breakStartTime', e.target.value)}
                className="w-1/2 bg-white border border-stone-200 rounded-xl px-2 py-1 font-bold text-xs text-stone-800"
              />
              <span className="text-stone-400">-</span>
              <input
                type="time"
                value={formData.breakEndTime || '15:00'}
                onChange={(e) => handleChange('breakEndTime', e.target.value)}
                className="w-1/2 bg-white border border-stone-200 rounded-xl px-2 py-1 font-bold text-xs text-stone-800"
              />
            </div>
            <p className="text-[9px] text-stone-400">Bouton pause actif dans ce créneau.</p>
          </div>

          {/* 4. Départ (dès 16h) */}
          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-1">
            <label className="text-[10px] uppercase font-bold text-stone-600 block">
              Heure minimale de Départ :
            </label>
            <input
              type="time"
              value={formData.departureActiveStartTime || formData.plannedDepartureTime || '16:00'}
              onChange={(e) => {
                handleChange('departureActiveStartTime', e.target.value);
                handleChange('plannedDepartureTime', e.target.value);
              }}
              className="w-full bg-white border border-stone-200 rounded-xl px-3 py-1.5 font-bold text-xs text-stone-800 focus:outline-none focus:border-[#2A7B76]"
            />
            <p className="text-[9px] text-stone-400">Bouton départ actif dès cette heure.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
