import React from 'react';
import { X, Smartphone, Share, PlusSquare, Download } from 'lucide-react';

interface UniversalInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIos?: boolean;
  isAndroid?: boolean;
}

export const UniversalInstallModal: React.FC<UniversalInstallModalProps> = ({
  isOpen,
  onClose,
  isIos = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2A7B76] to-emerald-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
              <Download className="h-5 w-5 text-emerald-200 animate-bounce" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">Installer Citrine</h3>
              <p className="text-xs text-emerald-100">Application Rapide & Hors-ligne</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-full transition cursor-pointer text-white/80 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-stone-700 dark:text-stone-300">
          {isIos ? (
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-4 rounded-2xl text-xs space-y-2">
                <p className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-amber-600" /> Sur iPhone / iPad (Safari) :
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-amber-800 dark:text-amber-300 font-medium">
                  <li>Ouvrez cette page dans <strong className="text-amber-950 dark:text-white underline">Safari</strong>.</li>
                  <li>Touchez le bouton <strong className="inline-flex items-center gap-1 bg-white dark:bg-stone-800 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-700"><Share className="w-3 h-3 text-[#2A7B76]" /> Partager</strong> en bas.</li>
                  <li>Sélectionnez <strong className="inline-flex items-center gap-1 bg-white dark:bg-stone-800 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-700"><PlusSquare className="w-3 h-3 text-[#2A7B76]" /> Sur l'écran d'accueil</strong>.</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Installez Citrine directement sur votre écran d'accueil pour un accès instantané en 1 clic et un fonctionnement hors-ligne optimal.
              </p>
              
              <button
                onClick={() => {
                  // If browser supports install prompt or just instructions
                  window.dispatchEvent(new Event('beforeinstallprompt'));
                  alert("Pour installer l'application :\n\n- Sur Chrome/Android/PC : Cliquez sur l'icône d'installation dans la barre d'adresse ou le menu du navigateur.\n- Sur iPhone (Safari) : Touchez Partager > Sur l'écran d'accueil.");
                  onClose();
                }}
                className="w-full py-3 px-4 bg-gradient-to-r from-[#2A7B76] to-emerald-800 hover:from-[#23635f] hover:to-emerald-900 text-white font-bold text-sm rounded-2xl shadow-lg transition transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Installer maintenant</span>
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs font-semibold text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
