import React, { useState, useEffect } from 'react';
import { MapPin, Compass, Check } from 'lucide-react';
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
  
  const currentLat = formData.companyLatitude ?? formData.hqLatitude ?? 4.016246;
  const currentLng = formData.companyLongitude ?? formData.hqLongitude ?? 4.016246;

  const [latStr, setLatStr] = useState(String(currentLat));
  const [lngStr, setLngStr] = useState(String(currentLng));

  useEffect(() => {
    setLatStr(String(formData.companyLatitude ?? formData.hqLatitude ?? 4.016246));
    setLngStr(String(formData.companyLongitude ?? formData.hqLongitude ?? 9.8203514));
  }, [formData.companyLatitude, formData.companyLongitude, formData.hqLatitude, formData.hqLongitude]);

  const handleLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLatStr(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) {
      onChange('companyLatitude', parsed);
      onChange('hqLatitude', parsed);
    }
  };

  const handleLngChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLngStr(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) {
      onChange('companyLongitude', parsed);
      onChange('hqLongitude', parsed);
    }
  };

  // Allow pasting coordinate pair like "4.016246, 9.8203514" into either field
  const handlePasteCoords = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasteText = e.clipboardData.getData('text');
    if (pasteText && pasteText.includes(',')) {
      const parts = pasteText.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        const latVal = parseFloat(parts[0]);
        const lngVal = parseFloat(parts[1]);
        if (!isNaN(latVal) && !isNaN(lngVal)) {
          e.preventDefault();
          setLatStr(String(latVal));
          setLngStr(String(lngVal));
          onChange('companyLatitude', latVal);
          onChange('hqLatitude', latVal);
          onChange('companyLongitude', lngVal);
          onChange('hqLongitude', lngVal);
          if (showToast) showToast(`Coordonnées GPS collées avec succès : ${latVal}, ${lngVal}`, 'success');
        }
      }
    }
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
        setLatStr(String(lat));
        setLngStr(String(lng));
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
          <div>
            <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-stone-800">
              Coordonnées GPS & Périmètre du Siège (Champs Texte Flexibles)
            </h4>
            <p className="text-[10px] text-stone-400">
              Saisie libre au format texte/décimal (supporte le collage direct de coordonnées Google Maps).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDetectGPS}
          disabled={isLocating}
          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#2A7B76] border border-emerald-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Compass className={`h-3.5 w-3.5 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Capture GPS...' : 'Détecter ma position GPS'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1 flex items-center justify-between">
            <span>Latitude de référence :</span>
            <span className="text-[9px] text-stone-400 font-normal">Type Texte / Décimal</span>
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={latStr}
            onChange={handleLatChange}
            onPaste={handlePasteCoords}
            placeholder="ex: 4.016246"
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 font-mono font-bold text-stone-800 focus:outline-none focus:border-[#2A7B76] focus:bg-white transition"
          />
          <p className="text-[10px] text-stone-400 mt-1">Exemple : 4.016246 (ou négatif pour l'hémisphère Sud)</p>
        </div>

        <div>
          <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1 flex items-center justify-between">
            <span>Longitude de référence :</span>
            <span className="text-[9px] text-stone-400 font-normal">Type Texte / Décimal</span>
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={lngStr}
            onChange={handleLngChange}
            onPaste={handlePasteCoords}
            placeholder="ex: 9.8203514"
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 font-mono font-bold text-stone-800 focus:outline-none focus:border-[#2A7B76] focus:bg-white transition"
          />
          <p className="text-[10px] text-stone-400 mt-1">Exemple : 9.8203514 (ou coller "lat, lng" directement)</p>
        </div>
      </div>
    </div>
  );
};
