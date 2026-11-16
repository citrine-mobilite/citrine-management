import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms?: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export type PwaPlatform = 'android' | 'ios' | 'mac' | 'windows' | 'linux';

declare global {
  interface Window {
    __citrineDeferredPrompt?: BeforeInstallPromptEvent | null;
    __citrinePwaInstalled?: boolean;
  }
}

function detectPlatform(): {
  platform: PwaPlatform;
  isIos: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isInIframe: boolean;
} {
  if (typeof window === 'undefined') {
    return { platform: 'android', isIos: false, isAndroid: false, isSafari: false, isInIframe: false };
  }

  const ua = window.navigator.userAgent.toLowerCase();
  const navPlatform = (window.navigator.platform || '').toLowerCase();
  const isIpadDesktopMode = navPlatform === 'macintel' && (window.navigator.maxTouchPoints || 0) > 1;
  const isIosDevice = /iphone|ipad|ipod/.test(ua) || isIpadDesktopMode;
  const isAndroidDevice = /android/.test(ua);
  const isMacDevice = !isIosDevice && (/macintosh|mac os x/.test(ua) || navPlatform.includes('mac'));
  const isWindowsDevice = /windows|win32|win64/.test(ua) || navPlatform.includes('win');
  const isSafariBrowser =
    /safari/.test(ua) && !/chrome|chromium|crios|fxios|edg|edga|opr|brave|samsungbrowser/.test(ua);

  let platform: PwaPlatform = 'windows';
  if (isIosDevice) platform = 'ios';
  else if (isAndroidDevice) platform = 'android';
  else if (isMacDevice) platform = 'mac';
  else if (isWindowsDevice) platform = 'windows';
  else platform = 'linux';

  let inIframe = false;
  try {
    inIframe = window.self !== window.top;
  } catch {
    inIframe = true;
  }

  return {
    platform,
    isIos: isIosDevice,
    isAndroid: isAndroidDevice,
    isSafari: isSafariBrowser,
    isInIframe: inIframe,
  };
}

function checkIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    Boolean(window.__citrinePwaInstalled) ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() =>
    typeof window !== 'undefined' ? window.__citrineDeferredPrompt || null : null
  );
  const [isInstalled, setIsInstalled] = useState<boolean>(() => checkIsStandalone());
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  const envInfo = detectPlatform();

  useEffect(() => {
    setIsInstalled(checkIsStandalone());
    if (window.__citrineDeferredPrompt) {
      setDeferredPrompt(window.__citrineDeferredPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__citrineDeferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handlePromptReady = () => {
      setDeferredPrompt(window.__citrineDeferredPrompt || null);
    };

    const handlePromptCleared = () => {
      setDeferredPrompt(null);
    };

    const handleAppInstalled = () => {
      window.__citrinePwaInstalled = true;
      window.__citrineDeferredPrompt = null;
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowInstallModal(false);
    };

    const displayMedia = window.matchMedia('(display-mode: standalone)');
    const handleDisplayChange = (ev: MediaQueryListEvent) => {
      if (ev.matches) {
        handleAppInstalled();
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('citrine:pwa-prompt-ready', handlePromptReady);
    window.addEventListener('citrine:pwa-prompt-cleared', handlePromptCleared);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('citrine:pwa-installed', handleAppInstalled);
    if (typeof displayMedia.addEventListener === 'function') {
      displayMedia.addEventListener('change', handleDisplayChange);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('citrine:pwa-prompt-ready', handlePromptReady);
      window.removeEventListener('citrine:pwa-prompt-cleared', handlePromptCleared);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('citrine:pwa-installed', handleAppInstalled);
      if (typeof displayMedia.removeEventListener === 'function') {
        displayMedia.removeEventListener('change', handleDisplayChange);
      }
    };
  }, []);

  const triggerInstall = useCallback(async (): Promise<boolean> => {
    const promptEvent = deferredPrompt || window.__citrineDeferredPrompt;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        window.__citrineDeferredPrompt = null;
        setDeferredPrompt(null);
        window.dispatchEvent(new CustomEvent('citrine:pwa-prompt-cleared'));

        if (choice.outcome === 'accepted') {
          window.__citrinePwaInstalled = true;
          setIsInstalled(true);
          setShowInstallModal(false);
          window.dispatchEvent(new CustomEvent('citrine:pwa-installed'));
          return true;
        }
        return false;
      } catch (err) {
        console.warn('[PWA] Native install prompt notice:', err);
        window.__citrineDeferredPrompt = null;
        setDeferredPrompt(null);
        setShowInstallModal(true);
        return false;
      }
    }

    setShowInstallModal(true);
    return false;
  }, [deferredPrompt]);

  const hasNativePrompt = Boolean(deferredPrompt);

  return {
    isInstallable: true,
    hasNativePrompt,
    isInstalled,
    platform: envInfo.platform,
    isIos: envInfo.isIos,
    isAndroid: envInfo.isAndroid,
    isSafari: envInfo.isSafari,
    isInIframe: envInfo.isInIframe,
    showInstallModal,
    setShowInstallModal,
    triggerInstall,
  };
}
