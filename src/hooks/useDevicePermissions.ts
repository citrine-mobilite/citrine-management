import { useState, useEffect } from 'react';
import { pushNotificationService } from '../services/pushNotificationService';
import { safeStorage } from '../utils/safeStorage';

export interface DevicePermissionsState {
  geolocation: 'default' | 'granted' | 'denied' | 'unsupported';
  camera: 'default' | 'granted' | 'denied' | 'unsupported';
  notifications: 'default' | 'granted' | 'denied' | 'unsupported';
}

export function useDevicePermissions(showToast: (msg: string, type?: 'success' | 'error') => void) {
  const [devicePermissions, setDevicePermissions] = useState<DevicePermissionsState>({
    geolocation: 'default',
    camera: 'default',
    notifications: 'default'
  });

  const [showPermissionsBanner, setShowPermissionsBanner] = useState<boolean>(() => {
    return safeStorage.getItem('citrine_hide_permissions_banner') !== 'true';
  });

  const handleDismissPermissionsBanner = () => {
    setShowPermissionsBanner(false);
    safeStorage.setItem('citrine_hide_permissions_banner', 'true');
  };

  useEffect(() => {
    const checkPermissions = async () => {
      const status: DevicePermissionsState = {
        geolocation: 'default',
        camera: 'default',
        notifications: 'default'
      };

      // 1. Notifications
      if ('Notification' in window) {
        status.notifications = Notification.permission as any;
      } else {
        status.notifications = 'unsupported';
      }

      // 2. Geolocation & Camera via Permissions API
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const geoPerm = await navigator.permissions.query({ name: 'geolocation' });
          status.geolocation = geoPerm.state as any;
          geoPerm.onchange = () => {
            setDevicePermissions(prev => ({ ...prev, geolocation: geoPerm.state as any }));
          };
        } catch (e) {
          status.geolocation = 'default';
        }

        try {
          const camPerm = await navigator.permissions.query({ name: 'camera' as any });
          status.camera = camPerm.state as any;
          camPerm.onchange = () => {
            setDevicePermissions(prev => ({ ...prev, camera: camPerm.state as any }));
          };
        } catch (e) {
          status.camera = 'default';
        }
      } else {
        status.geolocation = 'default';
        status.camera = 'default';
      }

      if (!navigator.geolocation) {
        status.geolocation = 'unsupported';
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        status.camera = 'unsupported';
      }

      setDevicePermissions(status);

      if (status.notifications === 'granted') {
        pushNotificationService.registerServiceWorker();
      }
    };

    checkPermissions();
  }, []);

  const requestGeolocationPermission = async () => {
    if (!navigator.geolocation) {
      showToast('La géolocalisation n’est pas supportée par votre appareil.', 'error');
      return;
    }
    showToast('Veuillez accepter l\'invite de géolocalisation de votre navigateur.', 'success');
    navigator.geolocation.getCurrentPosition(
      () => {
        setDevicePermissions(prev => ({ ...prev, geolocation: 'granted' }));
        showToast('Géolocalisation activée avec succès pour le pointage.', 'success');
      },
      () => {
        setDevicePermissions(prev => ({ ...prev, geolocation: 'denied' }));
        showToast('L’accès GPS est nécessaire pour certifier les présences.', 'error');
      }
    );
  };

  const requestCameraPermission = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast('La caméra n’est pas disponible ou supportée.', 'error');
      return;
    }
    showToast('Veuillez accepter l\'accès à votre caméra pour le scanner de badges.', 'success');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setDevicePermissions(prev => ({ ...prev, camera: 'granted' }));
      showToast('Caméra prête pour la numérisation des QR Codes.', 'success');
    } catch (err) {
      setDevicePermissions(prev => ({ ...prev, camera: 'denied' }));
      showToast('L’accès caméra est requis pour utiliser le scanner QR.', 'error');
    }
  };

  const requestNotificationsPermission = async () => {
    if (!('Notification' in window)) {
      showToast('Votre navigateur ne supporte pas les notifications push.', 'error');
      return;
    }
    showToast('Veuillez accepter l\'autorisation de notifications push.', 'success');
    const perm = await pushNotificationService.requestPermission();
    setDevicePermissions(prev => ({ ...prev, notifications: perm as any }));
    if (perm === 'granted') {
      showToast('Vous recevrez les alertes administratives et rappels.', 'success');
      pushNotificationService.sendTestNotification();
    } else {
      showToast('Les notifications push sont désactivées.', 'error');
    }
  };

  return {
    devicePermissions,
    showPermissionsBanner,
    handleDismissPermissionsBanner,
    requestGeolocationPermission,
    requestCameraPermission,
    requestNotificationsPermission
  };
}
