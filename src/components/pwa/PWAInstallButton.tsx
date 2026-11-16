import React from 'react';
import { Download } from 'lucide-react';
import { usePwaInstall } from './usePwaInstall';
import { UniversalInstallModal } from './UniversalInstallModal';
import { haptic } from '../../services/hapticService';

interface PWAInstallButtonProps {
  className?: string;
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  compact = false,
}) => {
  const {
    isInstalled,
    hasNativePrompt,
    platform,
    isIos,
    isAndroid,
    isSafari,
    showInstallModal,
    setShowInstallModal,
    triggerInstall,
  } = usePwaInstall();

  // Masquer automatiquement lorsque l'app est déjà exécutée en PWA installée
  if (isInstalled) return null;

  const handleClick = async () => {
    haptic.medium();
    await triggerInstall();
  };

  const buttonLabel = compact
    ? 'Installer'
    : hasNativePrompt
      ? "Installer l'application"
      : isIos
        ? 'Installer sur iPhone'
        : "Installer l'App";

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`px-3 py-2 bg-gradient-to-r from-[#D4A82F] to-amber-500 hover:from-[#c29624] hover:to-amber-600 text-stone-950 font-bold text-xs rounded-2xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 active:scale-95 border border-amber-300/40 select-none ${className}`}
        title={
          hasNativePrompt
            ? "Installer Citrine Management directement sur cet appareil"
            : "Installer Citrine Management sur Android, iPhone, Windows, Mac ou Linux"
        }
      >
        <Download className={`h-3.5 w-3.5 shrink-0 ${hasNativePrompt ? 'animate-bounce' : ''}`} />
        <span className="truncate">{buttonLabel}</span>
      </button>

      <UniversalInstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        platform={platform}
        isIos={isIos}
        isAndroid={isAndroid}
        isSafari={isSafari}
        hasNativePrompt={hasNativePrompt}
        onTriggerNativePrompt={triggerInstall}
      />
    </>
  );
};

export default PWAInstallButton;
