import React, { useState, useRef } from 'react';
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
  Info,
  Image as ImageIcon,
  Upload,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { CompanyModuleConfig } from '../../types';
import { CITRINE_DEFAULT_LOGO_BASE64 } from '../../assets/citrineLogoBase64';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      if (showToast) showToast('Veuillez sélectionner un fichier image valide (PNG, JPEG, WebP).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      if (base64Data) {
        const updated = {
          ...formData,
          companyLogoBase64: base64Data,
        };
        setFormData(updated);
        onUpdateModuleConfig(updated);
        if (showToast) showToast('Logo de l’entreprise mis à jour et conservé en base de données.', 'success');
      }
    };
    reader.onerror = () => {
      if (showToast) showToast('Erreur lors de la lecture du fichier image.', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleResetToDefaultLogo = () => {
    const updated = {
      ...formData,
      companyLogoBase64: CITRINE_DEFAULT_LOGO_BASE64,
    };
    setFormData(updated);
    onUpdateModuleConfig(updated);
    if (showToast) showToast('Logo officiel Citrine restauré en base de données.', 'success');
  };

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

        {/* 🖼️ Logo Officiel (Conservé en BD Firestore tel quel) */}
        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-[#2A7B76]" />
              <div>
                <span className="text-xs font-bold text-stone-800">
                  Logo Officiel de l'Entreprise (Stocké tel quel en BD)
                </span>
                <p className="text-[11px] text-stone-500">
                  Image matricielle d'origine (PNG/JPEG) enregistrée dans Firestore et réutilisée sur tous les documents RH et PDF.
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
              <CheckCircle2 className="h-3.5 w-3.5" /> Enregistré en BD
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-1">
            {/* Visualisation du logo réel stocké en BD */}
            <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-2xs flex items-center justify-center min-w-[140px] h-16">
              <img
                src={formData.companyLogoBase64 || CITRINE_DEFAULT_LOGO_BASE64}
                alt="Logo Entreprise"
                className="max-h-12 max-w-[180px] object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/citrine-logo.png';
                }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Input file caché */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleLogoFileSelect}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Téléverser une image</span>
              </button>

              <button
                type="button"
                onClick={handleResetToDefaultLogo}
                className="px-3 py-2 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                title="Rétablir le logo officiel Citrine"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Rétablir Citrine</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
              Nom officiel de l'Entreprise :
            </label>
            <input
              type="text"
              value={formData.companyName || formData.hqName || 'Citrine Entreprise SARL'}
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
              value={formData.hqAddress || 'Akwa - Boulevard de la Liberté, Douala'}
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
                value={formData.companyLatitude ?? formData.hqLatitude ?? 4.051056}
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
                value={formData.companyLongitude ?? formData.hqLongitude ?? 9.7678687}
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
