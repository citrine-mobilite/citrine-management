import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, Share, CheckCircle2, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ className?: string; compact?: boolean }> = ({ className = '', compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  if (isInstalled) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/80 ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>Application Installée</span>
      </div>
    );
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-medium text-xs shadow-sm hover:from-emerald-700 hover:to-green-700 transition-all transform active:scale-95 ${className}`}
        title="Installer Citrine sur l'écran d'accueil"
      >
        <Download className="w-4 h-4 animate-bounce" />
        <span>{compact ? "Installer App" : "Installer l'Application Mobile"}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSModal(true)}
          className={`cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium border border-stone-200 transition-all ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5 text-stone-600" />
          <span>Installer sur iPhone/iPad</span>
        </button>

        {showIOSModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-stone-100 relative">
              <button
                onClick={() => setShowIOSModal(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-4">
                <Smartphone className="w-6 h-6" />
              </div>

              <h3 className="text-base font-bold text-stone-900">Installer sur iPhone & iPad</h3>
              <p className="mt-1.5 text-xs text-stone-600 leading-relaxed">
                Suivez ces 2 étapes simples dans le navigateur Safari pour ajouter l'application Citrine sur votre écran d'accueil :
              </p>

              <div className="mt-4 space-y-3 bg-stone-50 p-3.5 rounded-xl border border-stone-200/60 text-xs text-stone-800">
                <div className="flex items-start gap-2.5">
                  <span className="flex shrink-0 w-5 h-5 rounded-full bg-emerald-600 text-white font-bold items-center justify-center text-[10px]">1</span>
                  <p>Appuyez sur le bouton <strong className="inline-flex items-center gap-1 text-emerald-800"><Share className="w-3.5 h-3.5" /> Partager</strong> dans la barre Safari.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex shrink-0 w-5 h-5 rounded-full bg-emerald-600 text-white font-bold items-center justify-center text-[10px]">2</span>
                  <p>Faites défiler vers le bas et sélectionnez <strong>« Sur l'écran d'accueil »</strong>.</p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSModal(false)}
                className="mt-5 w-full rounded-xl bg-stone-900 py-2.5 text-xs font-semibold text-white hover:bg-stone-800 transition"
              >
                Compris
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <button
      onClick={() => {
        alert("Pour installer Citrine sur mobile ou ordinateur :\n\n- Sur Chrome/Edge/Android : Cliquez sur l'icône d'installation dans la barre d'adresse ou le menu du navigateur.\n- Sur iPhone/Safari : Cliquez sur Partager > Sur l'écran d'accueil.");
      }}
      className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium border border-stone-200/80 transition-all ${className}`}
      title="Guide d'installation mobile PWA"
    >
      <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
      <span>{compact ? "Installer App" : "Guide Installation Mobile"}</span>
    </button>
  );
};
