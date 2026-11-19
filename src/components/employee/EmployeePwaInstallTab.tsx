import React, { useState } from 'react';
import { 
  Smartphone, 
  Download, 
  Share, 
  PlusSquare, 
  MoreVertical, 
  Monitor, 
  CheckCircle2, 
  ShieldCheck, 
  Wifi, 
  Bell, 
  ArrowRight
} from 'lucide-react';
import { usePwaInstall } from '../pwa/usePwaInstall';

export const EmployeePwaInstallTab: React.FC = () => {
  const { isInstalled, isIos, isAndroid, triggerInstall } = usePwaInstall();
  const [activeGuide, setActiveGuide] = useState<'android' | 'ios' | 'desktop'>(() => {
    if (isIos) return 'ios';
    if (isAndroid) return 'android';
    return 'android';
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300 pb-8">
      {/* Hero Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#2A7B76] text-xs font-bold border border-emerald-200/60">
            <Smartphone className="w-3.5 h-3.5" />
            <span>PWA - Application Web Mobile</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
            Installer l'App sur votre Téléphone
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 max-w-xl leading-relaxed">
            Citrine peut être installée directement sur votre smartphone comme une application,
            sans passer par l'App Store ou Google Play, avec accès instantané et notifications push.
          </p>
        </div>

        {/* Primary Install Trigger Button */}
        <div className="flex flex-col items-center gap-2 shrink-0 w-full sm:w-auto">
          {isInstalled ? (
            <div className="px-5 py-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Application déjà installée sur cet appareil</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={triggerInstall}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-[#2A7B76] to-emerald-700 hover:from-[#20615d] hover:to-emerald-800 text-white font-bold text-sm rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Installer l'app en 1 clic maintenant</span>
            </button>
          )}
          <span className="text-[11px] text-stone-400 font-medium">100% gratuit · Zéro téléchargement lourd</span>
        </div>
      </div>

      {/* Benefits grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-800">Alertes Push Système</h4>
            <p className="text-[11px] text-stone-500 mt-0.5">Recevez vos rappels de pointage même quand le navigateur est fermé.</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
            <Wifi className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-800">Support Hors-Ligne</h4>
            <p className="text-[11px] text-stone-500 mt-0.5">Badgez et consultez vos données même avec une connexion instable.</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-800">Accès Instantané</h4>
            <p className="text-[11px] text-stone-500 mt-0.5">Icône sur votre écran d'accueil avec démarrage plein écran ultra-rapide.</p>
          </div>
        </div>
      </div>

      {/* Step by Step Platform Guides */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-stone-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <h3 className="font-bold text-stone-800 text-base">Guide d'installation pas à pas</h3>
            <p className="text-xs text-stone-500">Sélectionnez le système de votre téléphone ou appareil :</p>
          </div>

          {/* Guide switcher tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200 text-xs">
            <button
              type="button"
              onClick={() => setActiveGuide('android')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeGuide === 'android' ? 'bg-white text-[#2A7B76] shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveGuide('ios')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeGuide === 'ios' ? 'bg-white text-[#2A7B76] shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Share className="w-3.5 h-3.5" />
              <span>iPhone / iOS</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveGuide('desktop')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeGuide === 'desktop' ? 'bg-white text-[#2A7B76] shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>PC / Mac</span>
            </button>
          </div>
        </div>

        {/* Android Guide */}
        {activeGuide === 'android' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-700">
              <span className="w-6 h-6 rounded-full bg-[#2A7B76] text-white flex items-center justify-center text-xs">1</span>
              <span>Sur Google Chrome, Edge ou Samsung Internet :</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
                <div className="flex items-center gap-2 text-stone-800 font-bold text-xs">
                  <MoreVertical className="w-4 h-4 text-[#2A7B76]" />
                  <span>Étape 1</span>
                </div>
                <p className="text-xs text-stone-600">
                  Appuyez sur le menu <strong className="text-stone-800">3 points</strong> en haut à droite de Chrome.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
                <div className="flex items-center gap-2 text-stone-800 font-bold text-xs">
                  <Download className="w-4 h-4 text-[#2A7B76]" />
                  <span>Étape 2</span>
                </div>
                <p className="text-xs text-stone-600">
                  Sélectionnez <strong className="text-stone-800">« Installer l'application »</strong> ou « Ajouter à l'écran d'accueil ».
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
                <div className="flex items-center gap-2 text-stone-800 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Étape 3</span>
                </div>
                <p className="text-xs text-stone-600">
                  Validez : l'icône de l'espace collaborateur est ajoutée immédiatement sur votre écran d'accueil.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* iOS Guide */}
        {activeGuide === 'ios' && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
              <span className="font-bold">Important pour iPhone :</span>
              <span>Ouvrez impérativement cette page dans <strong>Safari</strong> (Apple ne permet pas l'installation depuis Chrome sur iOS).</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
                <div className="flex items-center gap-2 text-stone-800 font-bold text-xs">
                  <Share className="w-4 h-4 text-[#2A7B76]" />
                  <span>Étape 1 : Partager</span>
                </div>
                <p className="text-xs text-stone-600">
                  Appuyez sur le bouton <strong className="text-stone-800">Partager</strong> (le carré avec la flèche vers le haut au centre en bas).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
                <div className="flex items-center gap-2 text-stone-800 font-bold text-xs">
                  <PlusSquare className="w-4 h-4 text-[#2A7B76]" />
                  <span>Étape 2 : Écran d'accueil</span>
                </div>
                <p className="text-xs text-stone-600">
                  Faites défiler le menu vers le bas et touchez <strong className="text-stone-800">« Sur l'écran d'accueil »</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
                <div className="flex items-center gap-2 text-stone-800 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Étape 3 : Confirmer</span>
                </div>
                <p className="text-xs text-stone-600">
                  Appuyez sur <strong className="text-stone-800">« Ajouter »</strong> en haut à droite. Les push notifications sont alors activées !
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Guide */}
        {activeGuide === 'desktop' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
                <div className="flex items-center gap-2 text-stone-800 font-bold text-xs">
                  <Monitor className="w-4 h-4 text-[#2A7B76]" />
                  <span>Dans la barre d'adresse</span>
                </div>
                <p className="text-xs text-stone-600">
                  Sur Chrome ou Edge, cliquez sur l'icône <strong className="text-stone-800">« Installer l'application »</strong> située à droite de l'URL.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
                <div className="flex items-center gap-2 text-stone-800 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Lancement en fenêtre dédiée</span>
                </div>
                <p className="text-xs text-stone-600">
                  L'application s'ouvre dans sa propre fenêtre indépendante avec raccourci sur votre bureau ou dock.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
