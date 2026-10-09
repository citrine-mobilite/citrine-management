import React, { useState } from 'react';
import { MapPin, Compass } from 'lucide-react';
import { CompanyModuleConfig } from '../../types';

interface CompanyGpsLocationCardProps {
  formData: CompanyModuleConfig;
  onChange: (key: keyof CompanyModuleConfig, val: any) => void;
  onDetectGpsDone: (lat: number, lng: number) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export const CompanyGpsLocationCard: React.FC<CompanyGpsLocationCardProps> = ({
  formData,
  onChange,
  onDetectGpsDone,
  showToast,
}) => {
  const [isLocating, setIsLocating] = useState(false);

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
        onDetectGpsDone(lat, lng);
        if (showToast) showToast(`Position GPS captée : ${lat}°, ${lng}°`, 'success');
      },
      () => {
        setIsLocating(false);
        if (showToast) showToast('Impossible de récupérer la position GPS. Vérifiez les autorisations de votre navigateur.', 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
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
              onChange('companyLatitude', val);
              onChange('hqLatitude', val);
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
              onChange('companyLongitude', val);
              onChange('hqLongitude', val);
            }}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 font-mono font-bold text-stone-800 focus:outline-none focus:border-[#2A7B76] focus:bg-white transition"
          />
          <p className="text-[10px] text-stone-400 mt-1">Exemple : 9.7678687 (Douala)</p>
        </div>
      </div>
    </div>
  );
};
