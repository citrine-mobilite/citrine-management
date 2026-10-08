import React, { useState } from 'react';
import { Smartphone, Download, X, HelpCircle } from 'lucide-react';
import { usePwaInstall } from './usePwaInstall';
import { UniversalInstallModal } from './UniversalInstallModal';

export const PwaInstallBanner: React.FC = () => {
  const { isInstalled, isIos, isAndroid, showInstallModal, setShowInstallModal, triggerInstall } = usePwaInstall();
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return sessionStorage.getItem('pwa_banner_dismissed') === 'true';
  });

  if (isInstalled || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  return (
    <>
      <div className="bg-gradient-to-r from-[#2A7B76] to-emerald-800 text-white px-4 py-2.5 rounded-2xl shadow-md border border-emerald-500/30 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top duration-300">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
            <Smartphone className="h-4 w-4 text-emerald-200" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-xs leading-tight truncate">Installer Citrine App</h4>
            <p className="text-[10px] text-emerald-100 truncate">
              Accès rapide, hors-ligne & notifications push
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={triggerInstall}
            className="bg-[#D4A82F] hover:bg-[#B8860B] text-stone-900 font-bold text-[11px] px-3 py-1.5 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Installer</span>
          </button>
          <button
            onClick={() => setShowInstallModal(true)}
            className="p-1.5 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition cursor-pointer"
            title="Guide d'installation"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition cursor-pointer"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <UniversalInstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        isIos={isIos}
        isAndroid={isAndroid}
      />
    </>
  );
};
