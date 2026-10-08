import React, { useState } from 'react';
import { KeyRound, RefreshCw, Copy, Check } from 'lucide-react';
import { generateKioskPinCode } from '../../utils/geolocation';
import { saveDocument, COLLECTIONS } from '../../services/firestoreService';
import { CompanyModuleConfig } from '../../types';

interface KioskPinBannerProps {
  kioskPin: string;
  setKioskPin: (pin: string) => void;
  moduleConfig?: CompanyModuleConfig;
}

export const KioskPinBanner: React.FC<KioskPinBannerProps> = ({
  kioskPin,
  setKioskPin,
  moduleConfig,
}) => {
  const [copiedPin, setCopiedPin] = useState(false);

  const handleRegeneratePin = async () => {
    const newPin = generateKioskPinCode();
    setKioskPin(newPin);
    if (moduleConfig) {
      await saveDocument(COLLECTIONS.COMPANY_SETTINGS, {
        ...moduleConfig,
        kioskPin: newPin,
        id: 'main_config',
      });
    }
  };

  const handleCopyPin = () => {
    navigator.clipboard.writeText(kioskPin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  return (
    <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
      <div className="flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-[#2A7B76]" />
        <span className="text-stone-600 font-bold">Code PIN Borne :</span>
        <span className="font-mono font-extrabold text-sm tracking-widest text-[#2A7B76] bg-white px-2.5 py-0.5 rounded-lg border border-stone-200">
          {kioskPin}
        </span>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        <button
          onClick={handleCopyPin}
          className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-xl font-bold text-[10px] flex items-center gap-1 transition cursor-pointer"
        >
          {copiedPin ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
          <span>{copiedPin ? 'Copié' : 'Copier'}</span>
        </button>

        <button
          onClick={handleRegeneratePin}
          className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-xl font-bold text-[10px] flex items-center gap-1 transition cursor-pointer"
        >
          <RefreshCw className="h-3 w-3 text-[#2A7B76]" />
          <span>Régénérer</span>
        </button>
      </div>
    </div>
  );
};
