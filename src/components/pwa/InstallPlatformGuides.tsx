import React from 'react';
import { Smartphone, Share, PlusSquare, Monitor } from 'lucide-react';

interface InstallPlatformGuidesProps {
  activeTab: 'auto' | 'ios' | 'android' | 'desktop';
}

export const InstallPlatformGuides: React.FC<InstallPlatformGuidesProps> = ({ activeTab }) => {
  if (activeTab === 'android') {
    return (
      <div className="space-y-3 bg-stone-50 dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-200/60 dark:border-stone-700/60 text-xs">
        <h4 className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
          <Smartphone className="w-4 h-4 text-[#2A7B76]" />
          Sur Google Chrome ou Samsung Internet :
        </h4>
        <ol className="space-y-2.5 text-stone-700 dark:text-stone-300">
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-[#2A7B76] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
            <span>Ouvrez le menu du navigateur (les <strong>3 petits points</strong> en haut à droite).</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-[#2A7B76] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
            <span>Sélectionnez <strong className="text-emerald-700 dark:text-emerald-400">« Installer l&apos;application »</strong> ou « Ajouter à l&apos;écran d&apos;accueil ».</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-[#2A7B76] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
            <span>Confirmez : l&apos;icône de l&apos;application Citrine apparaît immédiatement avec vos autres applications.</span>
          </li>
        </ol>
      </div>
    );
  }

  if (activeTab === 'ios') {
    return (
      <div className="space-y-3 bg-stone-50 dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-200/60 dark:border-stone-700/60 text-xs">
        <div className="p-2.5 bg-amber-500/15 border border-amber-400/40 rounded-xl text-[11px] text-amber-900 dark:text-amber-200 font-medium">
          💡 Apple impose d&apos;utiliser <strong>Safari</strong> (les autres navigateurs sur iOS ne peuvent pas ajouter à l&apos;écran d&apos;accueil).
        </div>
        <ol className="space-y-2.5 text-stone-700 dark:text-stone-300">
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-[#2A7B76] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
            <span>Dans Safari, appuyez sur le bouton <strong className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-300"><Share className="w-3.5 h-3.5" /> Partager</strong> (carré avec la flèche vers le haut au centre de la barre).</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-[#2A7B76] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
            <span>Faites défiler la liste vers le bas et appuyez sur <strong className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-300"><PlusSquare className="w-3.5 h-3.5" /> Sur l&apos;écran d&apos;accueil</strong>.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-[#2A7B76] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
            <span>Touchez <strong className="text-emerald-700 dark:text-emerald-400">« Ajouter »</strong> en haut à droite. L&apos;application se lance désormais en plein écran comme une application native.</span>
          </li>
        </ol>
      </div>
    );
  }

  return (
    <div className="space-y-3 bg-stone-50 dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-200/60 dark:border-stone-700/60 text-xs">
      <h4 className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
        <Monitor className="w-4 h-4 text-[#2A7B76]" />
        Sur Google Chrome ou Microsoft Edge :
      </h4>
      <ol className="space-y-2.5 text-stone-700 dark:text-stone-300">
        <li className="flex items-start gap-2.5">
          <span className="w-5 h-5 rounded-full bg-[#2A7B76] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
          <span>Regardez tout à droite de la barre d&apos;adresse de votre navigateur : une petite icône avec un écran et une flèche ou un <strong className="text-stone-900 dark:text-white">(+)</strong> apparaît.</span>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="w-5 h-5 rounded-full bg-[#2A7B76] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
          <span>Cliquez sur <strong className="text-emerald-700 dark:text-emerald-400">« Installer Citrine Management »</strong>.</span>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="w-5 h-5 rounded-full bg-[#2A7B76] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
          <span>L&apos;application s&apos;ouvre dans une fenêtre autonome et un raccourci est placé sur votre bureau.</span>
        </li>
      </ol>
    </div>
  );
};
