import React, { useState } from 'react';
import { Download, Sparkles } from 'lucide-react';
import { usePwaInstall } from './usePwaInstall';
import { UniversalInstallModal } from './UniversalInstallModal';
import { haptic } from '../../services/hapticService';

interface PWAInstallButtonProps {
  className?: string;
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  className = '', 
  compact = false 
}) => {
  const { 
    isInstalled, 
    hasNativePrompt, 
    isIos, 
    isAndroid, 
    triggerInstall 
  } = usePwaInstall();
  
  const [modalOpen, setModalOpen] = useState(false);

  // Si l'application est déjà exécutée en mode standalone installé
  if (isInstalled) return null;

  const handleClick = async () => {
    haptic.medium();
    if (hasNativePrompt) {
      await triggerInstall();
    } else {
      // Si pas de prompt direct (ex: iOS Safari, iFrame, ou prompt déjà différé), ouvrir le guide d'installation
      setModalOpen(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-[#D4A82F] to-amber-500 hover:from-[#c29624] hover:to-amber-600 text-stone-950 font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 border border-amber-300/40 select-none ${className}`}
        title="Installer l'application sur votre écran d'accueil"
      >
        <Download className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{compact ? "Installer" : "Installer l'App"}</span>
        <Sparkles className="h-2.5 w-2.5 text-amber-900 hidden sm:inline shrink-0" />
      </button>

      {/* Modal d'installation universel & guide */}
      <UniversalInstallModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        isIos={isIos}
        isAndroid={isAndroid}
        hasNativePrompt={hasNativePrompt}
        onTriggerNativePrompt={triggerInstall}
      />
    </>
  );
};

export default PWAInstallButton;
