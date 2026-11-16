import { usePwaInstall } from '../components/pwa/usePwaInstall';

export function usePWAInstall() {
  const { hasNativePrompt, isInstalled, isIos, triggerInstall } = usePwaInstall();

  return {
    isInstallable: hasNativePrompt,
    isInstalled,
    isIOS: isIos,
    install: triggerInstall,
  };
}
