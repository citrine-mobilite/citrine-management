import React from 'react';
import { Download } from 'lucide-react';
import { usePwaInstall } from './usePwaInstall';
import { UniversalInstallModal } from './UniversalInstallModal';

export const PWAInstallButton: React.FC = () => {
  const { isInstalled, isIos, isAndroid, showInstallModal, setShowInstallModal, triggerInstall } = usePwaInstall();

  if (isInstalled) return null;

  return (
    <>
      <button
        onClick={triggerInstall}
        className="px-2.5 sm:px-3 py-1.5 bg-[#D4A82F] hover:bg-[#B8860B] text-stone-900 font-bold text-xs rounded-xl transition shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
        title="Installer l'application Citrine sur votre appareil (Mobile / PC)"
      >
        <Download className="h-3.5 w-3.5" />
        <span className="inline">Installer</span>
      </button>

      <UniversalInstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        isIos={isIos}
        isAndroid={isAndroid}
      />
    </>
  );
};

export default PWAInstallButton;
