import React from 'react';
import { Smartphone, Share, PlusSquare, Monitor, Laptop, Terminal, MoreVertical } from 'lucide-react';
import { PwaPlatform } from './usePwaInstall';

interface InstallPlatformGuidesProps {
  activeTab: PwaPlatform;
  isSafari?: boolean;
}

export const InstallPlatformGuides: React.FC<InstallPlatformGuidesProps> = ({
  activeTab,
  isSafari = false,
}) => {
  if (activeTab === 'android') {
    return (
      <div className="space-y-3 bg-stone-50 dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-200/60 dark:border-stone-700/60 text-xs">
        <h4 className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
          <Smartphone className="w-4 h-4 text-[#2A7B76]" />
          Installation native sur Android (Chrome, Edge, Samsung Internet) :
        </h4>
        <ol className="space-y-2.5 text-stone-700 dark:text-stone-300">
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-[#2A7B76] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
              1
            </span>
            <span>
              Ouvrez cette page directement dans <strong>Google Chrome</strong>, <strong>Edge</strong> ou <strong>Samsung Internet</strong> (hors aperçu intégré), puis touchez le menu{' '}
              <strong className="inline-flex items-center gap-0.5 text-stone-900 dark:text-white">
                <MoreVertical className="w-3.5 h-3.5" /> 3 points
              </strong>{' '}
              en haut à droite.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-[#2A7B76] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
              2
            </span>
            <span>
              Touchez <strong className="text-emerald-700 dark:text-emerald-400">« Installer l&apos;application »</strong> (ne pas utiliser « Ajouter aux favoris »).
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-[#2A7B76] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
              3
            </span>
            <span>
              Confirmez <strong>Installer</strong> : l&apos;application Citrine est ajoutée à votre tiroir d&apos;applications et à l&apos;écran d&apos;accueil avec notifications push natives.
            </span>
          </li>
        </ol>
      </div>
    );
  }

  if (activeTab === 'ios') {
    return (
      <div className="space-y-3 bg-stone-50 dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-200/60 dark:border-stone-700/60 text-xs">
        <div className="p-2.5 bg-amber-500/15 border border-amber-400/40 rounded-xl text-[11px] text-amber-900 dark:text-amber-200 font-medium">
          Apple exige d&apos;ouvrir cette page dans <strong>Safari</strong> sur iPhone ou iPad pour installer l&apos;application et recevoir les notifications push iOS.
        </div>
        <ol className="space-y-2.5 text-stone-700 dark:text-stone-300">
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-[#2A7B76] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
              1
            </span>
            <span>
              Dans Safari, appuyez sur le bouton{' '}
              <strong className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-300">
                <Share className="w-3.5 h-3.5" /> Partager
              </strong>{' '}
              dans la barre du navigateur.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-[#2A7B76] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
              2
            </span>
            <span>
              Faites défiler vers le bas et sélectionnez{' '}
              <strong className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-300">
                <PlusSquare className="w-3.5 h-3.5" /> Sur l&apos;écran d&apos;accueil
              </strong>
              .
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-[#2A7B76] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
              3
            </span>
            <span>
              Appuyez sur <strong className="text-emerald-700 dark:text-emerald-400">« Ajouter »</strong> en haut à droite. Citrine s&apos;ouvre désormais en application autonome plein écran.
            </span>
          </li>
        </ol>
      </div>
    );
  }

  if (activeTab === 'mac') {
    return (
      <div className="space-y-3 bg-stone-50 dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-200/60 dark:border-stone-700/60 text-xs">
        <h4 className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
          <Laptop className="w-4 h-4 text-[#2A7B76]" />
          Installation en application native sur macOS :
        </h4>
        {isSafari ? (
          <ol className="space-y-2.5 text-stone-700 dark:text-stone-300">
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#2A7B76] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                1
              </span>
              <span>
                Dans la barre de menus Safari en haut de votre Mac, cliquez sur <strong>Fichier</strong> (ou l&apos;icône <Share className="w-3.5 h-3.5 inline text-[#2A7B76]" /> <strong>Partager</strong>).
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#2A7B76] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                2
              </span>
              <span>
                Sélectionnez <strong className="text-emerald-700 dark:text-emerald-400">« Ajouter au Dock... »</strong>.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#2A7B76] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                3
              </span>
              <span>
                Validez : une vraie application macOS Citrine apparaît dans votre <strong>Dock</strong> et votre Launchpad.
              </span>
            </li>
          </ol>
        ) : (
          <ol className="space-y-2.5 text-stone-700 dark:text-stone-300">
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#2A7B76] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                1
              </span>
              <span>
                Sur <strong>Chrome</strong> ou <strong>Edge</strong>, cliquez sur l&apos;icône d&apos;installation à droite de la barre d&apos;adresse (ou menu{' '}
                <strong>Enregistrer et partager &gt; Installer Citrine Management</strong>).
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#2A7B76] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                2
              </span>
              <span>
                Sur <strong>Safari (macOS Sonoma+)</strong>, cliquez sur <strong>Fichier &gt; Ajouter au Dock</strong>.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#2A7B76] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                3
              </span>
              <span>
                Citrine est installé dans <strong>Applications</strong> / le <strong>Dock</strong> comme une application Mac dédiée.
              </span>
            </li>
          </ol>
        )}
      </div>
    );
  }

  if (activeTab === 'linux') {
    return (
      <div className="space-y-3 bg-stone-50 dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-200/60 dark:border-stone-700/60 text-xs">
        <h4 className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
          <Terminal className="w-4 h-4 text-[#2A7B76]" />
          Installation en application bureautique sur Linux :
        </h4>
        <ol className="space-y-2.5 text-stone-700 dark:text-stone-300">
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-[#2A7B76] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
              1
            </span>
            <span>
              Ouvrez Citrine dans <strong>Google Chrome</strong>, <strong>Chromium</strong> ou <strong>Microsoft Edge</strong> (Firefox Linux ne prend pas en charge l&apos;installation PWA native).
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-[#2A7B76] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
              2
            </span>
            <span>
              Cliquez sur l&apos;icône d&apos;installation dans la barre d&apos;adresse (ou menu{' '}
              <strong className="text-emerald-700 dark:text-emerald-400">⋮ &gt; Installer Citrine Management...</strong>).
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-[#2A7B76] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
              3
            </span>
            <span>
              Une entrée <code>.desktop</code> est créée automatiquement dans votre menu d&apos;applications Linux (GNOME, KDE, etc.) avec fenêtre autonome.
            </span>
          </li>
        </ol>
      </div>
    );
  }

  return (
    <div className="space-y-3 bg-stone-50 dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-200/60 dark:border-stone-700/60 text-xs">
      <h4 className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
        <Monitor className="w-4 h-4 text-[#2A7B76]" />
        Installation en application Windows (Chrome ou Microsoft Edge) :
      </h4>
      <ol className="space-y-2.5 text-stone-700 dark:text-stone-300">
        <li className="flex items-start gap-2.5">
          <span className="w-5 h-5 rounded-full bg-[#2A7B76] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
            1
          </span>
          <span>
            À droite de la barre d&apos;adresse de <strong>Chrome</strong> ou <strong>Microsoft Edge</strong>, cliquez sur l&apos;icône d&apos;installation (écran avec flèche), ou ouvrez{' '}
            <strong>Menu &gt; Applications &gt; Installer ce site en tant qu&apos;application</strong>.
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="w-5 h-5 rounded-full bg-[#2A7B76] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
            2
          </span>
          <span>
            Cliquez sur <strong className="text-emerald-700 dark:text-emerald-400">« Installer »</strong>.
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="w-5 h-5 rounded-full bg-[#2A7B76] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
            3
          </span>
          <span>
            Citrine s&apos;ouvre dans sa propre fenêtre Windows et s&apos;ajoute au Menu Démarrer et à votre Bureau (épinglable à la barre des tâches).
          </span>
        </li>
      </ol>
    </div>
  );
};
