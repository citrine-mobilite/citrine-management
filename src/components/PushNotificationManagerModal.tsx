import React, { useState } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { Bell, BellRing, Smartphone, CheckCircle2, AlertTriangle, Send, X, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const PushNotificationManagerModal: React.FC<Props> = ({ isOpen, onClose, showToast }) => {
  const { isSupported, isInIframe, permission, requestPermission, sendPushNotification } = usePushNotifications();
  const [testing, setTesting] = useState(false);

  if (!isOpen) return null;

  const handleEnable = async () => {
    const result = await requestPermission();
    if (result.granted) {
      if (showToast) showToast("Notifications Push activées avec succès !", "success");
    } else {
      if (isInIframe) {
        if (showToast) showToast("Dans l'aperçu intégré, le navigateur restreint les notifications. Ouvrez l'application dans un nouvel onglet ou installez la PWA.", "info");
      } else if (result.reason === 'denied') {
        if (showToast) showToast("Permission de notification refusée dans les paramètres de votre navigateur.", "error");
      } else {
        if (showToast) showToast("Impossible d'activer : vérifiez les autorisations de votre navigateur.", "error");
      }
    }
  };

  const handleTestNotification = () => {
    setTesting(true);
    const success = sendPushNotification({
      title: "Citrine Management",
      body: "Rappel : Réunion de coordination à 14h00. Veuillez confirmer votre disponibilité.",
      icon: "/pwa-192x192.png",
      tag: "test-push-" + Date.now()
    });

    if (success) {
      if (showToast) showToast("Notification Push envoyée ! Vérifiez le centre de notifications de votre appareil.", "success");
    } else {
      if (isInIframe) {
        if (showToast) showToast("Simulation : Pour recevoir de vraies notifications sur l'écran verrouillé du téléphone, ouvrez le lien direct dans un nouvel onglet.", "info");
      } else {
        if (showToast) showToast("Impossible d'envoyer la notification. Vérifiez que les permissions sont accordées.", "error");
      }
    }
    setTimeout(() => setTesting(false), 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 relative overflow-hidden">
        {/* Header Decor */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-emerald-600" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 mb-5">
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl shrink-0 border border-emerald-200/60">
            <BellRing className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-stone-900">Notifications Push Mobiles & Bureau</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Recevez les alertes urgentes, convocations et rappels de pointage directement sur votre smartphone ou PC, même lorsque l'application est fermée.
            </p>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 mb-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-700">Statut des Permissions :</span>
            {permission === 'granted' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Activé
              </span>
            ) : permission === 'denied' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5" /> Bloqué
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                <Bell className="w-3.5 h-3.5" /> En attente d'autorisation
              </span>
            )}
          </div>

          {isInIframe && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200/70 rounded-xl text-xs text-blue-900 flex items-start gap-2">
              <Smartphone className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Aperçu dans un cadre (iFrame)</p>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  Les navigateurs restreignent les notifications dans les cadres intégrés. Pour recevoir les notifications sur votre smartphone, ouvrez l'application directement dans un nouvel onglet ou installez la PWA sur votre écran d'accueil.
                </p>
              </div>
            </div>
          )}

          <div className="mt-3 text-xs text-stone-600 space-y-1.5">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p>Service Worker actif en arrière-plan pour délivrer les alertes hors-ligne et en veille.</p>
            </div>
            <div className="flex items-start gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p>Compatible Android (Chrome), iOS 16.4+ (Safari PWA), Mac, Windows & Linux.</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {permission !== 'granted' ? (
            <button
              onClick={handleEnable}
              className="w-full cursor-pointer flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all active:scale-98"
            >
              <Bell className="w-4 h-4" />
              <span>Autoriser les Notifications Push</span>
            </button>
          ) : (
            <button
              onClick={handleTestNotification}
              disabled={testing}
              className="w-full cursor-pointer flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-xs transition-all active:scale-98 disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-emerald-400" />
              <span>{testing ? "Envoi en cours..." : "Envoyer une Notification Test"}</span>
            </button>
          )}

          <p className="text-[11px] text-center text-stone-400">
            Une fois autorisées, vous recevrez les alertes même lorsque l'application est minimisée ou fermée.
          </p>
        </div>

        <div className="mt-5 pt-3 border-t border-stone-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
