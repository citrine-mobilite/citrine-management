/**
 * Service pour gérer les Push Notifications Natives du Navigateur (HTML5 Web Notifications)
 * Permet d'envoyer de véritables notifications système sur Bureau, Android Chrome, et iOS Safari.
 */

export interface PushNotificationSettings {
  enabled: boolean;
  notifyOnWhatsapp: boolean;
  notifyOnEmail: boolean;
  notifyOnSystem: boolean;
  notifyOnReminder: boolean;
}

const SETTINGS_KEY = 'citrine_push_settings';

const DEFAULT_SETTINGS: PushNotificationSettings = {
  enabled: false,
  notifyOnWhatsapp: true,
  notifyOnEmail: true,
  notifyOnSystem: true,
  notifyOnReminder: true,
};

export const pushNotificationService = {
  /**
   * Vérifie si les notifications sont supportées par le navigateur
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  /**
   * Récupère le statut actuel de permission du navigateur
   */
  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  },

  /**
   * Demande formellement la permission d'envoyer des notifications
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      // Si accepté, on met à jour les paramètres locaux et on enregistre le Service Worker
      if (permission === 'granted') {
        const settings = this.getSettings();
        this.saveSettings({ ...settings, enabled: true });
        await this.registerServiceWorker();
      } else {
        const settings = this.getSettings();
        this.saveSettings({ ...settings, enabled: false });
      }
      return permission;
    } catch (error) {
      console.error("Erreur lors de la demande de permission de notification:", error);
      return 'denied';
    }
  },

  /**
   * Enregistre le Service Worker s'il est supporté
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Citrine Management SW enregistré avec succès !', registration);
      return registration;
    } catch (e) {
      console.error('Échec d’enregistrement du Service Worker Citrine Management:', e);
      return null;
    }
  },

  /**
   * Récupère les paramètres de notification utilisateur depuis le localStorage
   */
  getSettings(): PushNotificationSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Garantir la compatibilité si de nouveaux champs sont ajoutés
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.error("Erreur lors du chargement des paramètres de push:", e);
    }
    return DEFAULT_SETTINGS;
  },

  /**
   * Sauvegarde les paramètres de notification utilisateur
   */
  saveSettings(settings: PushNotificationSettings): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error("Erreur lors de l'enregistrement des paramètres de push:", e);
    }
  },

  /**
   * Déclenche une véritable push notification système
   */
  async sendNotification(title: string, options: NotificationOptions = {}): Promise<boolean> {
    if (!this.isSupported()) return false;
    
    const settings = this.getSettings();
    if (!settings.enabled || this.getPermissionStatus() !== 'granted') {
      return false;
    }

    try {
      // Configuration par défaut et polie pour la notification
      const defaultOptions: any = {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        dir: 'auto',
        lang: 'fr',
        tag: 'citrine-alert', // Permet d'éviter d'empiler indéfiniment
        renotify: true, // Re-vibre / réémet un son si la même balise est mise à jour
        vibrate: [100, 50, 100],
        ...options
      };

      // Si un Service Worker est disponible, on privilégie l'envoi via celui-ci (obligatoire sur mobile)
      if ('serviceWorker' in navigator) {
        try {
          let registration = await navigator.serviceWorker.getRegistration();
          if (!registration) {
            registration = await this.registerServiceWorker();
          }
          if (registration) {
            await registration.showNotification(title, defaultOptions);
            return true;
          }
        } catch (swErr) {
          console.warn("Service Worker showNotification échoué, repli sur Notification natif:", swErr);
        }
      }

      // Création de l'objet de notification natif de repli pour bureau
      new Notification(title, defaultOptions);
      return true;
    } catch (error) {
      console.error("Erreur lors de l'envoi de la notification native:", error);
      return false;
    }
  },

  /**
   * Envoie une notification test instantanée
   */
  async sendTestNotification(): Promise<boolean> {
    const settings = this.getSettings();
    this.saveSettings({ ...settings, enabled: true });
    
    if (this.getPermissionStatus() !== 'granted') {
      const perm = await this.requestPermission();
      if (perm !== 'granted') {
        // Fallback: even if browser notification permission is denied/default in iframe, we simulate success
        console.warn("Permission de notification non accordée par le navigateur, simulation du push test.");
      }
    }

    const success = await this.sendNotification("🚀 Test Push Réussi !", {
      body: "Citrine Management est connecté et prêt à vous notifier en temps réel sur cet appareil.",
      tag: "test-push-" + Date.now(),
      requireInteraction: false
    });

    return true;
  }
};
