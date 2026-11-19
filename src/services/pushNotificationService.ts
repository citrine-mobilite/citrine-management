export interface PushNotificationSettings {
  enabled: boolean;
  notifyOnMessage: boolean;
  notifyOnEmail: boolean;
  notifyOnSystem: boolean;
  notifyOnReminder: boolean;
}

let memoryPushSettings: PushNotificationSettings = {
  enabled: false,
  notifyOnMessage: true,
  notifyOnEmail: true,
  notifyOnSystem: true,
  notifyOnReminder: true,
};

export const pushNotificationService = {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  },

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        memoryPushSettings.enabled = true;
        await this.registerServiceWorker();
      } else {
        memoryPushSettings.enabled = false;
      }
      return permission;
    } catch (error) {
      console.error("Erreur lors de la demande de permission de notification:", error);
      return 'denied';
    }
  },

  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      return registration;
    } catch (e) {
      console.error('Échec d’enregistrement du Service Worker:', e);
      return null;
    }
  },

  getSettings(): PushNotificationSettings {
    return memoryPushSettings;
  },

  saveSettings(settings: PushNotificationSettings): void {
    memoryPushSettings = { ...settings };
  },

  async sendNotification(title: string, options: NotificationOptions = {}): Promise<boolean> {
    if (!this.isSupported()) return false;
    
    const perm = this.getPermissionStatus();
    if (perm !== 'granted') {
      return false;
    }

    try {
      const defaultOptions: any = {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        dir: 'auto',
        lang: 'fr',
        tag: 'citrine-alert',
        renotify: true,
        vibrate: [100, 50, 100],
        ...options,
      };

      if ('serviceWorker' in navigator) {
        try {
          let registration = await navigator.serviceWorker.getRegistration();
          if (!registration) {
            registration = await navigator.serviceWorker.ready;
          }
          if (registration && registration.showNotification) {
            await registration.showNotification(title, defaultOptions);
            return true;
          }
        } catch (swErr) {
          console.warn("Fallback direct Notification API:", swErr);
        }
      }

      new Notification(title, defaultOptions);
      return true;
    } catch (err) {
      console.error("Erreur lors de l'envoi de la push notification:", err);
      return false;
    }
  },

  async sendTestNotification(): Promise<boolean> {
    return this.sendNotification("Test de Notification Citrine", {
      body: "Les notifications push fonctionnent parfaitement !",
    });
  },
};
