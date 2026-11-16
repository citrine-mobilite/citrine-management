import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  Share,
  Monitor,
  Laptop,
  Terminal,
  CheckCircle2,
  ShieldCheck,
  Wifi,
  Bell,
} from 'lucide-react';
import { usePwaInstall, PwaPlatform } from '../pwa/usePwaInstall';
import { UniversalInstallModal } from '../pwa/UniversalInstallModal';
import { InstallPlatformGuides } from '../pwa/InstallPlatformGuides';

export const EmployeePwaInstallTab: React.FC = () => {
  const {
    isInstalled,
    platform,
    isIos,
    isAndroid,
    isSafari,
    hasNativePrompt,
    showInstallModal,
    setShowInstallModal,
    triggerInstall,
  } = usePwaInstall();

  const [activeGuide, setActiveGuide] = useState<PwaPlatform>(platform);

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300 pb-8">
      {/* Hero Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#2A7B76] text-xs font-bold border border-emerald-200/60">
            <Smartphone className="w-3.5 h-3.5" />
            <span>PWA Multi-Plateforme</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
            Installer Citrine sur Mobile &amp; Ordinateur
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 max-w-xl leading-relaxed">
            Installez Citrine Management en tant qu&apos;application native sur{' '}
            <strong>Android, iPhone/iPad, Windows, Mac et Linux</strong>, sans passer par un store, avec notifications push même lorsque l&apos;application est fermée.
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
              <Download className={`w-4 h-4 ${hasNativePrompt ? 'animate-bounce' : ''}`} />
              <span>
                {hasNativePrompt
                  ? "Installer l'application en 1 clic"
                  : "Installer sur cet appareil"}
              </span>
            </button>
          )}
          <span className="text-[11px] text-stone-400 font-medium">
            Android · iPhone · Windows · macOS · Linux
          </span>
        </div>
      </div>

      {/* Benefits grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-800">Alertes Push Pusher Beams</h4>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Recevez les pointages et rappels de 19h30 même lorsque l&apos;application est fermée.
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
            <Wifi className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-800">Support Hors-Ligne</h4>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Badgez et consultez vos données même avec une connexion instable.
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-800">Fenêtre Dédiée</h4>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Icône dédiée sur votre bureau, Dock macOS ou écran d&apos;accueil mobile.
            </p>
          </div>
        </div>
      </div>

      {/* Step by Step Platform Guides */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-stone-200 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <h3 className="font-bold text-stone-800 text-base">Installation par système</h3>
            <p className="text-xs text-stone-500">Sélectionnez votre appareil :</p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200 text-xs">
            {[
              { id: 'android', label: 'Android', icon: Smartphone },
              { id: 'ios', label: 'iPhone / iPad', icon: Share },
              { id: 'windows', label: 'Windows', icon: Monitor },
              { id: 'mac', label: 'Mac', icon: Laptop },
              { id: 'linux', label: 'Linux', icon: Terminal },
            ].map((tab) => {
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveGuide(tab.id as PwaPlatform)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeGuide === tab.id
                      ? 'bg-white text-[#2A7B76] shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <InstallPlatformGuides activeTab={activeGuide} isSafari={isSafari} />
      </div>

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
    </div>
  );
};
