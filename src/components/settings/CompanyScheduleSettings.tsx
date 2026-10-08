import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Coffee, 
  MapPin, 
  Compass, 
  Save, 
  CheckCircle2, 
  Info, 
  ToggleLeft, 
  ToggleRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { CompanyModuleConfig } from '../../types';

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
  const [formData, setFormData] = useState<CompanyModuleConfig>({ ...moduleConfig });
  const [isLocating, setIsLocating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setFormData({ ...moduleConfig });
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
        setIsSaved(true);
        if (showToast) showToast(`Position GPS captée : ${lat}°, ${lng}°`, 'success');
      },
      () => {
        setIsLocating(false);
        if (showToast) showToast('Impossible de récupérer la position GPS. Vérifiez les autorisations de votre navigateur.', 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
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
            onClick={handleToggleBreaks}
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

      {/* 2. CONFIGURATION DES PLAGES HORAIRES & RETARDS */}
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
              onChange={(e) => handleChange('workStartTime', e.target.value)}
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
              onChange={(e) => handleChange('lateThresholdTime', e.target.value)}
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
                onChange={(e) => handleChange('breakStartTime', e.target.value)}
                className="w-1/2 bg-white border border-stone-200 rounded-xl px-2 py-1.5 font-bold text-xs text-stone-800"
              />
              <span className="text-stone-400 font-bold">-</span>
              <input
                type="time"
                value={formData.breakEndTime || '15:00'}
                onChange={(e) => handleChange('breakEndTime', e.target.value)}
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
                handleChange('departureActiveStartTime', e.target.value);
                handleChange('plannedDepartureTime', e.target.value);
              }}
              className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 font-bold text-xs text-stone-800 focus:outline-none focus:border-[#2A7B76]"
            />
            <p className="text-[10px] text-stone-400">Le bouton de sortie s'active dès cette heure.</p>
          </div>
        </div>
      </div>

      {/* 3. GÉOLOCALISATION & COORDONNÉES GPS DU SIÈGE */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between gap-4 pb-2 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#2A7B76]" />
            <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-stone-800">
              Coordonnées GPS & Périmètre du Siège
            </h4>
          </div>

          <button
            type="button"
            onClick={handleDetectGPS}
            disabled={isLocating}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#2A7B76] border border-emerald-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Compass className={`h-3.5 w-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Capture GPS...' : 'Détecter ma position GPS'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
              Latitude de référence :
            </label>
            <input
              type="number"
              step="0.000001"
              value={formData.companyLatitude ?? formData.hqLatitude ?? 4.051056}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                handleChange('companyLatitude', val);
                handleChange('hqLatitude', val);
              }}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 font-mono font-bold text-stone-800 focus:outline-none focus:border-[#2A7B76] focus:bg-white transition"
            />
            <p className="text-[10px] text-stone-400 mt-1">Exemple : 4.051056 (Douala)</p>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
              Longitude de référence :
            </label>
            <input
              type="number"
              step="0.000001"
              value={formData.companyLongitude ?? formData.hqLongitude ?? 9.7678687}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                handleChange('companyLongitude', val);
                handleChange('hqLongitude', val);
              }}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 font-mono font-bold text-stone-800 focus:outline-none focus:border-[#2A7B76] focus:bg-white transition"
            />
            <p className="text-[10px] text-stone-400 mt-1">Exemple : 9.7678687 (Douala)</p>
          </div>
        </div>
      </div>
    </form>
  );
};
