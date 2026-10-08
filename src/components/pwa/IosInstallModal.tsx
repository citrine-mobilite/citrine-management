import React from 'react';
import { X, Share, PlusSquare, Smartphone } from 'lucide-react';

interface IosInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IosInstallModal: React.FC<IosInstallModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="bg-gradient-to-r from-[#2A7B76] to-emerald-800 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-emerald-200" />
            <h3 className="font-serif font-bold text-sm">Installer l'application</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition cursor-pointer text-white/80 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-stone-700 text-xs">
          <p className="font-medium">
            Pour installer Citrine sur votre iPhone ou iPad et l'utiliser comme une vraie application :
          </p>

          <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-100">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-[#2A7B76] flex items-center justify-center font-bold shrink-0">
                1
              </div>
              <div className="space-y-0.5">
                <span className="font-bold text-stone-900">Appuyez sur le bouton Partager</span>
                <p className="text-[11px] text-stone-500 flex items-center gap-1">
                  Icône <Share className="h-3.5 w-3.5 text-[#2A7B76] inline" /> en bas de Safari.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-[#2A7B76] flex items-center justify-center font-bold shrink-0">
                2
              </div>
              <div className="space-y-0.5">
                <span className="font-bold text-stone-900">Sélectionnez « Sur l'écran d'accueil »</span>
                <p className="text-[11px] text-stone-500 flex items-center gap-1">
                  Icône <PlusSquare className="h-3.5 w-3.5 text-[#2A7B76] inline" /> dans la liste.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-[#2A7B76] flex items-center justify-center font-bold shrink-0">
                3
              </div>
              <div className="space-y-0.5">
                <span className="font-bold text-stone-900">Touchez « Ajouter »</span>
                <p className="text-[11px] text-stone-500">
                  L'icône Citrine apparaîtra directement sur votre écran d'accueil.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#2A7B76] hover:bg-[#20635F] text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            J'ai compris
          </button>
        </div>
      </div>
    </div>
  );
};
