import React, { useState } from 'react';
import { X, Smartphone, Share, PlusSquare, MoreVertical, Monitor, CheckCircle2, Download } from 'lucide-react';

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
  isAndroid = false,
}) => {
  const [platformTab, setPlatformTab] = useState<'android' | 'ios' | 'desktop'>(() => {
    if (isIos) return 'ios';
    if (isAndroid) return 'android';
    return 'android';
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full overflow-hidden animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2A7B76] to-emerald-800 p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Smartphone className="h-4 w-4 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm">Installer l'Application Citrine</h3>
              <p className="text-[10px] text-emerald-100">Accès rapide 1-clic & mode hors-ligne</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-full transition cursor-pointer text-white/80 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Platform Selector Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-50/80 p-1.5 gap-1 shrink-0">
          <button
            onClick={() => setPlatformTab('android')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              platformTab === 'android'
                ? 'bg-white text-[#2A7B76] shadow-xs border border-stone-200/60'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Android / Chrome</span>
          </button>
          <button
            onClick={() => setPlatformTab('ios')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              platformTab === 'ios'
                ? 'bg-white text-[#2A7B76] shadow-xs border border-stone-200/60'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Share className="h-3.5 w-3.5" />
            <span>iPhone / iPad</span>
          </button>
          <button
            onClick={() => setPlatformTab('desktop')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              platformTab === 'desktop'
                ? 'bg-white text-[#2A7B76] shadow-xs border border-stone-200/60'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>PC / Mac</span>
          </button>
        </div>

        {/* Instructions Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-stone-700">
          {platformTab === 'android' && (
            <div className="space-y-3">
              <p className="font-medium text-stone-800">
                Pour installer l'application sur votre smartphone ou tablette Android :
              </p>
              <div className="space-y-2.5 bg-stone-50 p-3.5 rounded-2xl border border-stone-100">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-[#2A7B76] flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <span className="font-bold text-stone-900">Ouvrez le menu Chrome</span>
                    <p className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                      Touchez les 3 points <MoreVertical className="h-3.5 w-3.5 inline text-stone-700" /> en haut à droite.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-[#2A7B76] flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <span className="font-bold text-stone-900">Sélectionnez « Installer l'application »</span>
                    <p className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                      ou « Ajouter à l'écran d'accueil ».
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-[#2A7B76] flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <span className="font-bold text-stone-900">Validez « Installer »</span>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Citrine se lance ensuite en plein écran comme une application native.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {platformTab === 'ios' && (
            <div className="space-y-3">
              <p className="font-medium text-stone-800">
                Sur Safari iOS (iPhone ou iPad) :
              </p>
              <div className="space-y-2.5 bg-stone-50 p-3.5 rounded-2xl border border-stone-100">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-[#2A7B76] flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <span className="font-bold text-stone-900">Touchez le bouton Partager</span>
                    <p className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                      Icône <Share className="h-3.5 w-3.5 text-[#2A7B76] inline" /> en bas de l'écran Safari.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-[#2A7B76] flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <span className="font-bold text-stone-900">Sélectionnez « Sur l'écran d'accueil »</span>
                    <p className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                      Icône <PlusSquare className="h-3.5 w-3.5 text-[#2A7B76] inline" /> dans la liste d'actions.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-[#2A7B76] flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <span className="font-bold text-stone-900">Appuyez sur « Ajouter »</span>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      L'icône apparaîtra sur votre écran d'accueil avec les notifications activées.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {platformTab === 'desktop' && (
            <div className="space-y-3">
              <p className="font-medium text-stone-800">
                Sur ordinateur (Google Chrome, Microsoft Edge, Brave) :
              </p>
              <div className="space-y-2.5 bg-stone-50 p-3.5 rounded-2xl border border-stone-100">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-[#2A7B76] flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <span className="font-bold text-stone-900">Regardez la barre d'adresse</span>
                    <p className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                      Cliquez sur l'icône <Download className="h-3.5 w-3.5 text-[#2A7B76] inline" /> ou <Monitor className="h-3.5 w-3.5 text-[#2A7B76] inline" /> à droite de l'URL.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-[#2A7B76] flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <span className="font-bold text-stone-900">Cliquez sur « Installer »</span>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      L'application s'ouvre instantanément dans sa propre fenêtre de travail.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200/60">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="text-[11px] leading-tight">
              Sans passer par l'App Store ou Play Store : installation directe & ultra-légère.
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold rounded-xl transition cursor-pointer shadow-xs"
          >
            Fermer le guide
          </button>
        </div>
      </div>
    </div>
  );
};
