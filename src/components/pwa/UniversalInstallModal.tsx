import React, { useState, useEffect } from 'react';
import { X, Smartphone, Share, Download, Monitor, Laptop, Terminal, ExternalLink, Copy, Check, Info } from 'lucide-react';
import { CMLogo } from '../CMLogo';
import { haptic } from '../../services/hapticService';
import { ModalPortal } from '../common/ModalPortal';
import { InstallPlatformGuides } from './InstallPlatformGuides';
import { PwaPlatform } from './usePwaInstall';

interface UniversalInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform?: PwaPlatform;
  isIos?: boolean;
  isAndroid?: boolean;
  isSafari?: boolean;
  hasNativePrompt?: boolean;
  onTriggerNativePrompt?: () => Promise<boolean> | void;
}

export const UniversalInstallModal: React.FC<UniversalInstallModalProps> = ({
  isOpen,
  onClose,
  platform,
  isIos = false,
  isAndroid = false,
  isSafari = false,
  hasNativePrompt = false,
  onTriggerNativePrompt,
}) => {
  const [activeTab, setActiveTab] = useState<PwaPlatform>('android');
  const [copied, setCopied] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }

    if (platform) {
      setActiveTab(platform);
    } else if (isIos) {
      setActiveTab('ios');
    } else if (isAndroid) {
      setActiveTab('android');
    } else {
      setActiveTab('windows');
    }
  }, [platform, isIos, isAndroid, isOpen]);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = async () => {
    haptic.light();
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-200">
        <div
          className="w-full max-w-lg rounded-3xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl border border-stone-200/80 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
        >
          <div className="bg-gradient-to-r from-[#144643] via-[#2A7B76] to-[#D4A82F] p-4 sm:p-5 text-white flex items-center justify-between shrink-0 relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-inner">
                <CMLogo size="sm" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 id="pwa-install-title" className="font-bold text-base sm:text-lg tracking-tight text-white font-serif">
                    Installer Citrine Management
                  </h3>
                  <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold text-amber-200">
                    PWA
                  </span>
                </div>
                <p className="text-xs text-emerald-100 flex items-center gap-1">
                  Application autonome pour Android, iPhone, Windows, Mac &amp; Linux
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                haptic.light();
                onClose();
              }}
              className="p-1.5 hover:bg-white/20 rounded-full transition cursor-pointer text-white/80 hover:text-white relative z-10"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
            {hasNativePrompt && onTriggerNativePrompt && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                  Installation directe en 1 clic disponible sur votre appareil :
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    haptic.medium();
                    await onTriggerNativePrompt();
                    onClose();
                  }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-[#2A7B76] to-emerald-700 hover:from-[#20615d] hover:to-emerald-800 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 animate-bounce" />
                  <span>Installer l&apos;application maintenant</span>
                </button>
              </div>
            )}

            {isInIframe && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Aperçu intégré détecté</p>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                      Les navigateurs bloquent le bouton d&apos;installation natif à l&apos;intérieur d&apos;un cadre d&apos;aperçu. Ouvrez Citrine dans son propre onglet pour installer l&apos;application en 1 clic sur Android, Windows, Mac ou Linux :
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={currentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => haptic.medium()}
                    className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ouvrir dans un onglet pour installer</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="py-2 px-3 bg-white dark:bg-stone-800 border border-amber-300 dark:border-amber-700 hover:bg-amber-50 text-amber-900 dark:text-amber-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                    title="Copier le lien"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copié !' : 'Copier'}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-5 gap-1 p-1 bg-stone-100 dark:bg-stone-800/80 rounded-2xl border border-stone-200/60 dark:border-stone-700 text-[11px]">
              {[
                { id: 'android', label: 'Android', icon: Smartphone },
                { id: 'ios', label: 'iPhone', icon: Share },
                { id: 'windows', label: 'Windows', icon: Monitor },
                { id: 'mac', label: 'Mac', icon: Laptop },
                { id: 'linux', label: 'Linux', icon: Terminal },
              ].map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      haptic.light();
                      setActiveTab(tab.id as PwaPlatform);
                    }}
                    className={`py-1.5 px-1.5 rounded-xl font-bold transition flex items-center justify-center gap-1 cursor-pointer truncate ${
                      activeTab === tab.id
                        ? 'bg-white dark:bg-stone-700 text-[#2A7B76] shadow-xs'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <InstallPlatformGuides activeTab={activeTab} isSafari={isSafari} />

            <div className="flex items-center justify-around text-center border-t border-stone-200/60 dark:border-stone-700/60 pt-3">
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-stone-800 dark:text-stone-200">Hors-ligne</p>
                <p className="text-[9px] text-stone-500">Cache local actif</p>
              </div>
              <div className="h-6 w-px bg-stone-200 dark:bg-stone-700" />
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-stone-800 dark:text-stone-200">Fenêtre native</p>
                <p className="text-[9px] text-stone-500">Bureau, Dock &amp; Mobile</p>
              </div>
              <div className="h-6 w-px bg-stone-200 dark:bg-stone-700" />
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-stone-800 dark:text-stone-200">Pusher Beams</p>
                <p className="text-[9px] text-stone-500">Push même app fermée</p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-stone-100/80 dark:bg-stone-800/80 border-t border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              className="text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Lien copié !' : "Copier l'URL de l'app"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                haptic.light();
                onClose();
              }}
              className="px-4 py-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:bg-stone-800 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default UniversalInstallModal;
