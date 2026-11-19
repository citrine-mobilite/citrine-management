import React from 'react';
import { Download } from 'lucide-react';
import { usePwaInstall } from './usePwaInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstalled, triggerInstall } = usePwaInstall();

  if (isInstalled) return null;

  return (
    <button
      onClick={triggerInstall}
      className="px-2.5 sm:px-3 py-1.5 bg-[#D4A82F] hover:bg-[#B8860B] text-stone-900 font-bold text-xs rounded-xl transition shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
      title="Installer l'application"
    >
      <Download className="h-3.5 w-3.5" />
      <span>Installer l'app</span>
    </button>
  );
};

export default PWAInstallButton;
