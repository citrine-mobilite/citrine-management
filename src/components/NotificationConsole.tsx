import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Clock, 
  CheckCircle2,
  Database,
  ChevronRight,
  Calendar,
  X,
  ArrowDown,
  Search,
  Filter,
  Printer,
  Download,
  CheckSquare,
  Square,
  Sparkles,
  Settings,
  ShieldCheck,
  ShieldAlert,
  Radio,
  Sliders,
  MapPin,
  Camera,
  ExternalLink,
  Lock
} from 'lucide-react';
import { NotificationLog } from '../types';
import { pushNotificationService, PushNotificationSettings } from '../services/pushNotificationService';

interface NotificationConsoleProps {
  notifications: NotificationLog[];
  onClearNotifications?: () => void;
  connectedUserName: string;
  onUpdateNotifications?: (newNotifs: NotificationLog[]) => void;
  onAddNotification?: (log: NotificationLog) => void;
}

export default function NotificationConsole({
  notifications,
  connectedUserName,
  onClearNotifications,
  onUpdateNotifications,
  onAddNotification,
}: NotificationConsoleProps) {
  const [filter, setFilter] = useState<'all' | 'whatsapp' | 'email' | 'system'>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null);
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);

  // Push Notification States
  const [pushSettings, setPushSettings] = useState<PushNotificationSettings>(() => pushNotificationService.getSettings());
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default');
  const [isPushConfigOpen, setIsPushConfigOpen] = useState<boolean>(false);

  // GPS & Camera permission states
  const [devicePermissions, setDevicePermissions] = useState<{
    geolocation: 'default' | 'granted' | 'denied' | 'unsupported';
    camera: 'default' | 'granted' | 'denied' | 'unsupported';
  }>({
    geolocation: 'default',
    camera: 'default'
  });

  const checkDevicePermissions = useCallback(async () => {
    const status: {
      geolocation: 'default' | 'granted' | 'denied' | 'unsupported';
      camera: 'default' | 'granted' | 'denied' | 'unsupported';
    } = {
      geolocation: 'default',
      camera: 'default'
    };

    if (navigator.permissions && navigator.permissions.query) {
      try {
        const geoPerm = await navigator.permissions.query({ name: 'geolocation' });
        status.geolocation = geoPerm.state as any;
      } catch (e) {}

      try {
        const camPerm = await navigator.permissions.query({ name: 'camera' as any });
        status.camera = camPerm.state as any;
      } catch (e) {}
    }

    if (!navigator.geolocation) status.geolocation = 'unsupported';
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) status.camera = 'unsupported';

    setDevicePermissions(status);
  }, []);

  useEffect(() => {
    if (!pushNotificationService.isSupported()) {
      setPermissionStatus('unsupported');
    } else {
      setPermissionStatus(pushNotificationService.getPermissionStatus());
    }
    checkDevicePermissions();
  }, [checkDevicePermissions]);

  const handleRequestPushPermission = async () => {
    const perm = await pushNotificationService.requestPermission();
    setPermissionStatus(perm);
    const updatedSettings = pushNotificationService.getSettings();
    setPushSettings(updatedSettings);
  };

  const handleRequestGeolocation = () => {
    if (!navigator.geolocation) {
      setDevicePermissions(prev => ({ ...prev, geolocation: 'unsupported' }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => {
        setDevicePermissions(prev => ({ ...prev, geolocation: 'granted' }));
      },
      () => {
        setDevicePermissions(prev => ({ ...prev, geolocation: 'denied' }));
      }
    );
  };

  const handleRequestCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setDevicePermissions(prev => ({ ...prev, camera: 'unsupported' }));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setDevicePermissions(prev => ({ ...prev, camera: 'granted' }));
    } catch (e) {
      setDevicePermissions(prev => ({ ...prev, camera: 'denied' }));
    }
  };

  const handleToggleSetting = (key: keyof PushNotificationSettings) => {
    const updated = { ...pushSettings, [key]: !pushSettings[key] };
    setPushSettings(updated);
    pushNotificationService.saveSettings(updated);
  };

  const handleSendTestPush = async () => {
    try {
      await pushNotificationService.requestPermission();
    } catch (e) {
      console.warn("Permission request error:", e);
    }
    await pushNotificationService.sendTestNotification();
    if (onAddNotification) {
      onAddNotification({
        id: 'test-push-' + Date.now(),
        type: 'system',
        recipient: connectedUserName || 'Administrateur',
        title: '🚀 Test Notification Push Réussi',
        content: 'Ceci est une notification push de test envoyée depuis le journal de notifications de Citrine Management.',
        payload: JSON.stringify({ test: true }),
        timestamp: new Date().toISOString(),
        read: false
      });
    }
    alert("🚀 Notification push test déclenchée et enregistrée dans le journal !");
  };

  // Determine pagination step: 100 when search or filter is active, 50 by default
  const isFilteringActive = Boolean(searchQuery || startDate || endDate || filter !== 'all' || readFilter !== 'all');
  const batchSize = isFilteringActive ? 100 : 50;

  const [visibleCount, setVisibleCount] = useState<number>(batchSize);

  const containerRef = useRef<HTMLDivElement>(null);

  // Unread count calculation
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllAsRead = () => {
    if (!onUpdateNotifications) return;
    const updated = notifications.map(n => ({ ...n, read: true }));
    onUpdateNotifications(updated);
  };

  const handleSelectLog = (log: NotificationLog) => {
    setSelectedLog(log);
    if (!log.read && onUpdateNotifications) {
      const updated = notifications.map(n => n.id === log.id ? { ...n, read: true } : n);
      onUpdateNotifications(updated);
    }
  };

  // 1. Sort notifications from newest to oldest
  const sortedLogs = [...notifications].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  // 2. Filter by type, period (startDate to endDate), read state, and search query
  const filteredLogs = sortedLogs.filter((n) => {
    const matchesType = filter === 'all' || n.type === filter;
    
    let matchesPeriod = true;
    const logDateStr = new Date(n.timestamp).toISOString().split('T')[0];
    if (startDate && logDateStr < startDate) {
      matchesPeriod = false;
    }
    if (endDate && logDateStr > endDate) {
      matchesPeriod = false;
    }

    let matchesSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = n.title.toLowerCase().includes(q);
      const recipientMatch = n.recipient.toLowerCase().includes(q);
      const contentMatch = n.content.toLowerCase().includes(q);
      matchesSearch = titleMatch || recipientMatch || contentMatch;
    }

    let matchesRead = true;
    if (readFilter === 'unread') {
      matchesRead = !n.read;
    } else if (readFilter === 'read') {
      matchesRead = !!n.read;
    }

    return matchesType && matchesPeriod && matchesSearch && matchesRead;
  });

  // 3. Paginated slice for Infinite Scroll / batch loading
  const displayedLogs = filteredLogs.slice(0, visibleCount);
  const hasMore = visibleCount < filteredLogs.length;

  // Infinite Scroll Handler
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollHeight - scrollTop - clientHeight < 40 && hasMore) {
      setVisibleCount((prev) => Math.min(prev + batchSize, filteredLogs.length));
    }
  }, [hasMore, filteredLogs.length, batchSize]);

  // Selection handlers
  const handleToggleSelectAll = () => {
    if (selectedLogIds.length === filteredLogs.length) {
      setSelectedLogIds([]);
    } else {
      setSelectedLogIds(filteredLogs.map(l => l.id));
    }
  };

  const handleToggleSelectLog = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLogIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // PDF Export function
  const handleExportPDF = (logsToExport: NotificationLog[]) => {
    if (logsToExport.length === 0) {
      alert("Aucune notification à exporter.");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Veuillez autoriser les fenêtres pop-up pour générer le PDF.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Registre des Notifications - Rapport d'Audit</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1c1917; padding: 30px; margin: 0; background: #fff; }
          .header { border-bottom: 2px solid #881337; padding-bottom: 15px; margin-bottom: 25px; }
          h1 { font-size: 22px; color: #881337; margin: 0 0 5px 0; }
          .meta { font-size: 11px; color: #57534e; }
          .log-item { background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 8px; padding: 15px; margin-bottom: 15px; page-break-inside: avoid; }
          .log-header { display: flex; justify-content: space-between; font-size: 10px; font-weight: bold; color: #78716c; margin-bottom: 6px; text-transform: uppercase; }
          .log-title { font-size: 13px; font-weight: bold; color: #1c1917; margin-bottom: 6px; }
          .log-content { font-size: 11px; color: #292524; background: #fff; padding: 10px; border-radius: 6px; border: 1px solid #f5f5f4; white-space: pre-wrap; line-height: 1.5; }
          .log-footer { font-size: 10px; color: #78716c; margin-top: 8px; display: flex; justify-content: space-between; border-top: 1px solid #f0efee; pt: 8px; }
          @media print {
            body { padding: 15px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Registre Officiel des Notifications & Alertes</h1>
          <div class="meta">
            Établi par : <strong>${connectedUserName}</strong> | Date d'édition : ${new Date().toLocaleString('fr-FR')} | Éléments exportés : <strong>${logsToExport.length} notification(s)</strong>
          </div>
        </div>
        <div>
          ${logsToExport.map(log => `
            <div class="log-item">
              <div class="log-header">
                <span>Canal : ${log.type.toUpperCase()}</span>
                <span>Date : ${new Date(log.timestamp).toLocaleString('fr-FR')}</span>
              </div>
              <div class="log-title">${log.title}</div>
              <div class="log-content">${log.content}</div>
              <div class="log-footer">
                <span>Destinataire : ${log.recipient}</span>
                <span>Statut : Délivré (200 OK)</span>
              </div>
            </div>
          `).join('')}
        </div>
        <script>
          window.onload = () => {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6" id="notification-logs">
      {/* Header & Advanced Filters */}
      <div className="bg-white p-5 rounded-3xl shadow-xs border border-green-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-green-100 pb-4">
          <div>
            <h2 className="text-xl font-serif font-semibold text-green-950 tracking-tight flex items-center gap-2">
              <Bell className="h-5 w-5 text-green-500" />
              Registre des Notifications & Alertes ({connectedUserName})
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {selectedLogIds.length > 0 && (
              <button
                onClick={() => {
                  const selectedLogs = filteredLogs.filter(l => selectedLogIds.includes(l.id));
                  handleExportPDF(selectedLogs);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Printer className="h-4 w-4 text-emerald-100" />
                <span>Exporter la sélection en PDF ({selectedLogIds.length})</span>
              </button>
            )}

            {(startDate || endDate || searchQuery || filter !== 'all') && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setSearchQuery('');
                  setFilter('all');
                  setVisibleCount(batchSize);
                }}
                className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
                <span>Réinitialiser</span>
              </button>
            )}
          </div>
        </div>

        {/* Diagnostics & Centre d'Autorisations de l'Appareil */}
        <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-4 border-b border-stone-200/60 pb-3">
            <div>
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Settings className="h-4 w-4 text-emerald-600 animate-spin-slow" />
                Centre de Diagnostics & d'Autorisations Système
              </h3>
              <p className="text-[11px] text-stone-500 mt-1">
                Configurez et certifiez l'accès aux capteurs locaux et aux notifications pour activer l'intégralité de l'expérience Citrine Management.
              </p>
            </div>
            {typeof window !== 'undefined' && window.self !== window.top && (
              <span className="text-[10px] text-amber-700 bg-amber-100/70 border border-amber-200 font-semibold px-2 py-0.5 rounded-full">
                Mode iFrame Actif
              </span>
            )}
          </div>

          {/* iFrame Notice block */}
          {typeof window !== 'undefined' && window.self !== window.top && (
            <div className="bg-amber-50/40 border border-amber-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
              <div className="space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-amber-950">
                  <ShieldAlert className="h-4 w-4 text-amber-600" />
                  Sécurité du navigateur (Aperçu intégré)
                </p>
                <p className="text-[11px] text-amber-700 leading-normal max-w-2xl">
                  Les navigateurs restreignent l'affichage des popups d'autorisations (Push, GPS, Caméra) au sein des cadres intégrés. Pour activer ou configurer ces options en toute sécurité, ouvrez l'application dans un onglet indépendant.
                </p>
              </div>

            </div>
          )}

          {/* Grid de Diagnostic des permissions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Notifications Push */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between gap-3.5 text-xs transition ${
              permissionStatus === 'granted' && pushSettings.enabled
                ? 'bg-emerald-50/20 border-emerald-200'
                : permissionStatus === 'denied'
                  ? 'bg-green-50/20 border-green-100'
                  : 'bg-white border-stone-200'
            }`}>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-stone-900 font-bold">
                    <Bell className="h-4 w-4 text-green-500" />
                    Notifications Push
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    permissionStatus === 'granted' && pushSettings.enabled
                      ? 'bg-emerald-100 text-emerald-800'
                      : permissionStatus === 'denied'
                        ? 'bg-green-100 text-green-800'
                        : permissionStatus === 'unsupported'
                          ? 'bg-stone-100 text-stone-500'
                          : 'bg-amber-100 text-amber-800'
                  }`}>
                    {permissionStatus === 'granted' && pushSettings.enabled ? 'Actives' : permissionStatus === 'denied' ? 'Bloquées' : permissionStatus === 'unsupported' ? 'Incompatible' : 'Inactives'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 leading-normal">
                  Permet à l'appareil de recevoir de vraies alertes système d'organisation (activités, affectations de tâches, alarmes) même en arrière-plan.
                </p>
              </div>

              <div className="space-y-2">
                {permissionStatus === 'default' && (
                  <button
                    type="button"
                    onClick={handleRequestPushPermission}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-[11px] transition shadow-3xs cursor-pointer"
                  >
                    Autoriser les Notifications
                  </button>
                )}
                {permissionStatus === 'granted' && (
                  <div className="flex items-center gap-1.5 w-full">
                    <button
                      type="button"
                      onClick={handleSendTestPush}
                      className="flex-1 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-lg text-[11px] transition cursor-pointer flex items-center justify-center gap-1 border border-stone-200"
                    >
                      <Sparkles className="h-3 w-3 text-green-600" />
                      <span>Tester le Push</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPushConfigOpen(!isPushConfigOpen)}
                      className={`px-2 py-1.5 font-bold rounded-lg text-[11px] transition cursor-pointer border ${
                        isPushConfigOpen ? 'bg-green-50 border-green-200 text-green-800' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <Sliders className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                {permissionStatus === 'denied' && (
                  <div className="text-[10px] text-green-700 font-bold bg-green-50 border border-green-100 p-2 rounded-lg flex items-start gap-1.5 leading-normal">
                    <Lock className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                    <span>Bloqué : Cliquez sur le cadenas 🔒 de l'URL pour débloquer.</span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Géolocalisation GPS */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between gap-3.5 text-xs transition ${
              devicePermissions.geolocation === 'granted'
                ? 'bg-emerald-50/20 border-emerald-200'
                : devicePermissions.geolocation === 'denied'
                  ? 'bg-green-50/20 border-green-100'
                  : 'bg-white border-stone-200'
            }`}>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-stone-900 font-bold">
                    <MapPin className="h-4 w-4 text-green-500" />
                    Géolocalisation GPS
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    devicePermissions.geolocation === 'granted'
                      ? 'bg-emerald-100 text-emerald-800'
                      : devicePermissions.geolocation === 'denied'
                        ? 'bg-green-100 text-green-800'
                        : devicePermissions.geolocation === 'unsupported'
                          ? 'bg-stone-100 text-stone-500'
                          : 'bg-amber-100 text-amber-800'
                  }`}>
                    {devicePermissions.geolocation === 'granted' ? 'Autorisé' : devicePermissions.geolocation === 'denied' ? 'Bloqué' : devicePermissions.geolocation === 'unsupported' ? 'Incompatible' : 'Inactif'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 leading-normal">
                  Nécessaire pour le pointage mobile sur site et pour certifier la position géographique de vos collaborateurs à l'arrivée.
                </p>
              </div>

              <div className="space-y-2">
                {devicePermissions.geolocation !== 'granted' && devicePermissions.geolocation !== 'unsupported' && (
                  <button
                    type="button"
                    onClick={handleRequestGeolocation}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-[11px] transition shadow-3xs cursor-pointer"
                  >
                    Autoriser la Géolocalisation
                  </button>
                )}
                {devicePermissions.geolocation === 'granted' && (
                  <div className="py-1.5 bg-emerald-50 text-emerald-800 font-bold rounded-lg text-[11px] text-center border border-emerald-150">
                    ✓ GPS certifié et actif
                  </div>
                )}
                {devicePermissions.geolocation === 'unsupported' && (
                  <div className="py-1.5 bg-stone-100 text-stone-500 font-bold rounded-lg text-[11px] text-center">
                    Matériel non supporté
                  </div>
                )}
              </div>
            </div>

            {/* 3. Caméra & Scanner QR */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between gap-3.5 text-xs transition ${
              devicePermissions.camera === 'granted'
                ? 'bg-emerald-50/20 border-emerald-200'
                : devicePermissions.camera === 'denied'
                  ? 'bg-green-50/20 border-green-100'
                  : 'bg-white border-stone-200'
            }`}>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-stone-900 font-bold">
                    <Camera className="h-4 w-4 text-green-500" />
                    Caméra & Scanner QR
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    devicePermissions.camera === 'granted'
                      ? 'bg-emerald-100 text-emerald-800'
                      : devicePermissions.camera === 'denied'
                        ? 'bg-green-100 text-green-800'
                        : devicePermissions.camera === 'unsupported'
                          ? 'bg-stone-100 text-stone-500'
                          : 'bg-amber-100 text-amber-800'
                  }`}>
                    {devicePermissions.camera === 'granted' ? 'Autorisé' : devicePermissions.camera === 'denied' ? 'Bloqué' : devicePermissions.camera === 'unsupported' ? 'Incompatible' : 'Inactif'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 leading-normal">
                  Nécessaire pour l'utilisation de la borne fixe de pointage et la numérisation des QR codes d'accès individuels.
                </p>
              </div>

              <div className="space-y-2">
                {devicePermissions.camera !== 'granted' && devicePermissions.camera !== 'unsupported' && (
                  <button
                    type="button"
                    onClick={handleRequestCamera}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-[11px] transition shadow-3xs cursor-pointer"
                  >
                    Autoriser la Caméra
                  </button>
                )}
                {devicePermissions.camera === 'granted' && (
                  <div className="py-1.5 bg-emerald-50 text-emerald-800 font-bold rounded-lg text-[11px] text-center border border-emerald-150">
                    ✓ Caméra connectée et prête
                  </div>
                )}
                {devicePermissions.camera === 'unsupported' && (
                  <div className="py-1.5 bg-stone-100 text-stone-500 font-bold rounded-lg text-[11px] text-center">
                    Matériel non supporté
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Collapsible Granular Configuration Grid */}
          {permissionStatus === 'granted' && isPushConfigOpen && (
            <div className="bg-white border border-stone-150 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in text-[11px] sm:text-xs">
              <div className="flex items-center justify-between p-2.5 bg-stone-50/50 rounded-xl border border-stone-100 hover:border-green-100 transition">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                    <MessageSquare className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-stone-800 block">Alertes WhatsApp</span>
                    <span className="text-[9px] text-stone-400">Rapports d'envoi API</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleSetting('notifyOnWhatsapp')}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    pushSettings.notifyOnWhatsapp ? 'bg-emerald-600' : 'bg-stone-200'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    pushSettings.notifyOnWhatsapp ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-stone-50/50 rounded-xl border border-stone-100 hover:border-green-100 transition">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                    <Mail className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-stone-800 block">Alertes Emails</span>
                    <span className="text-[9px] text-stone-400">Envois serveurs SMTP</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleSetting('notifyOnEmail')}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    pushSettings.notifyOnEmail ? 'bg-emerald-600' : 'bg-stone-200'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    pushSettings.notifyOnEmail ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-stone-50/50 rounded-xl border border-stone-100 hover:border-green-100 transition">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                    <Database className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-stone-800 block">Activités Système</span>
                    <span className="text-[9px] text-stone-400">Audit & modifications</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleSetting('notifyOnSystem')}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    pushSettings.notifyOnSystem ? 'bg-emerald-600' : 'bg-stone-200'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    pushSettings.notifyOnSystem ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-stone-50/50 rounded-xl border border-stone-100 hover:border-green-100 transition">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-green-50 text-green-600">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-stone-800 block">Rappels & Alarmes</span>
                    <span className="text-[9px] text-stone-400">Événements de l'agenda</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleSetting('notifyOnReminder')}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    pushSettings.notifyOnReminder ? 'bg-emerald-600' : 'bg-stone-200'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    pushSettings.notifyOnReminder ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Master Push Control Enable Toggle */}
              <div className="col-span-1 sm:col-span-2 md:col-span-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <span className="text-stone-500 font-medium">Activer globalement les alertes push sur ce navigateur :</span>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${pushSettings.enabled ? 'text-emerald-700' : 'text-stone-500'}`}>
                    {pushSettings.enabled ? "Activé" : "Désactivé"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleSetting('enabled')}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      pushSettings.enabled ? 'bg-emerald-600' : 'bg-stone-300'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      pushSettings.enabled ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filters Bar: Search + Period (Start / End Date) */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search by collaborator name or keyword */}
          <div className="sm:col-span-5 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Rechercher par nom de collaborateur, type, destinataire..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(isFilteringActive ? 100 : 50);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20"
            />
          </div>

          {/* Start Date */}
          <div className="sm:col-span-3 flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-2xl px-3 py-2 text-xs">
            <span className="text-[10px] font-bold text-stone-500 uppercase shrink-0">Du :</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setVisibleCount(100);
              }}
              className="bg-transparent text-stone-900 text-xs outline-none cursor-pointer font-medium w-full"
            />
            {startDate && (
              <button onClick={() => setStartDate('')} className="text-stone-400 hover:text-stone-600 p-0.5">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* End Date */}
          <div className="sm:col-span-3 flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-2xl px-3 py-2 text-xs">
            <span className="text-[10px] font-bold text-stone-500 uppercase shrink-0">Au :</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setVisibleCount(100);
              }}
              className="bg-transparent text-stone-900 text-xs outline-none cursor-pointer font-medium w-full"
            />
            {endDate && (
              <button onClick={() => setEndDate('')} className="text-stone-400 hover:text-stone-600 p-0.5">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Count Badge */}
          <div className="sm:col-span-1 flex items-center justify-center bg-green-50/70 border border-green-200 rounded-2xl px-2 py-2 text-xs font-bold text-green-900" title="Nombre total de notifications filtrées">
            {filteredLogs.length}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column: Full List of Communication Logs */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-xs border border-green-100 flex flex-col h-[580px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-green-100 pb-3 mb-4 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleToggleSelectAll}
                className="text-[11px] font-bold text-green-900 flex items-center gap-1.5 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                title="Tout sélectionner / désélectionner"
              >
                {selectedLogIds.length === filteredLogs.length && filteredLogs.length > 0 ? (
                  <CheckSquare className="h-4 w-4 text-green-700" />
                ) : (
                  <Square className="h-4 w-4 text-stone-300" />
                )}
                <span>Sélect. Tout</span>
              </button>
              
              {unreadCount > 0 && onUpdateNotifications && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition cursor-pointer border border-emerald-200"
                  title="Marquer toutes les notifications comme lues"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Tout marquer comme lu</span>
                </button>
              )}
            </div>

            {/* Read/Unread Filters Tabs */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1 bg-stone-100 p-1 rounded-xl text-[10px] font-bold">
                <button
                  onClick={() => setReadFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${readFilter === 'all' ? 'bg-white text-stone-850 shadow-xs' : 'text-stone-500 hover:text-stone-800'}`}
                >
                  TOUTES
                </button>
                <button
                  onClick={() => setReadFilter('unread')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${readFilter === 'unread' ? 'bg-green-600 text-white shadow-xs' : 'text-stone-500 hover:text-stone-800'}`}
                >
                  NON LUES
                  {unreadCount > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold leading-none ${readFilter === 'unread' ? 'bg-white text-green-600' : 'bg-green-600 text-white animate-pulse'}`}>
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setReadFilter('read')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${readFilter === 'read' ? 'bg-white text-stone-850 shadow-xs' : 'text-stone-500 hover:text-stone-800'}`}
                >
                  LUES
                </button>
              </div>

              {/* Filter channels */}
              <div className="flex gap-1 bg-green-50 p-1 rounded-xl">
                <button
                  onClick={() => {
                    setFilter('all');
                    setVisibleCount(batchSize);
                  }}
                  className={`px-2 py-1 rounded-lg text-[9px] font-bold transition cursor-pointer ${filter === 'all' ? 'bg-white text-green-800 shadow-xs' : 'text-stone-500 hover:text-stone-800'}`}
                  title="Tous les canaux"
                >
                  TOUT
                </button>
                <button
                  onClick={() => {
                    setFilter('whatsapp');
                    setVisibleCount(batchSize);
                  }}
                  className={`px-2 py-1 rounded-lg text-[9px] font-bold transition cursor-pointer ${filter === 'whatsapp' ? 'bg-white text-green-800 shadow-xs' : 'text-stone-500 hover:text-stone-800'}`}
                  title="WhatsApp"
                >
                  WA
                </button>
                <button
                  onClick={() => {
                    setFilter('email');
                    setVisibleCount(batchSize);
                  }}
                  className={`px-2 py-1 rounded-lg text-[9px] font-bold transition cursor-pointer ${filter === 'email' ? 'bg-white text-green-800 shadow-xs' : 'text-stone-500 hover:text-stone-800'}`}
                  title="Email"
                >
                  MAIL
                </button>
                <button
                  onClick={() => {
                    setFilter('system');
                    setVisibleCount(batchSize);
                  }}
                  className={`px-2 py-1 rounded-lg text-[9px] font-bold transition cursor-pointer ${filter === 'system' ? 'bg-white text-green-800 shadow-xs' : 'text-stone-500 hover:text-stone-800'}`}
                  title="Système"
                >
                  SYS
                </button>
              </div>
            </div>
          </div>

          {/* Logs List Container with Infinite Scroll / Pagination */}
          <div
            ref={containerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar"
          >
            {displayedLogs.map((log) => {
              const isSelected = selectedLog?.id === log.id;
              const isChecked = selectedLogIds.includes(log.id);
              const isUnread = !log.read;

              return (
                <div
                  key={log.id}
                  onClick={() => handleSelectLog(log)}
                  className={`p-4 rounded-2xl border transition cursor-pointer text-left relative group ${
                    isSelected 
                      ? 'bg-green-50/70 border-green-300 ring-1 ring-green-200 shadow-xs' 
                      : isUnread
                        ? 'bg-amber-50/10 border-amber-200 hover:bg-green-50/30'
                        : 'bg-white border-stone-200/80 hover:bg-green-50/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 text-[10px] mb-2">
                    <div className="flex items-center gap-2">
                      {/* Selection Checkbox */}
                      <button
                        onClick={(e) => handleToggleSelectLog(log.id, e)}
                        className="p-0.5 text-emerald-600 hover:text-emerald-700 transition animate-fade-in"
                      >
                        {isChecked ? (
                          <CheckSquare className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Square className="h-4 w-4 text-stone-300 group-hover:text-stone-400" />
                        )}
                      </button>

                      {log.type === 'whatsapp' ? (
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-bold">
                          <MessageSquare className="h-3 w-3 text-emerald-600" /> WHATSAPP
                        </span>
                      ) : log.type === 'email' ? (
                        <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-bold">
                          <Mail className="h-3 w-3 text-amber-600" /> EMAIL SMTP
                        </span>
                      ) : (
                        <span className="text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-bold">
                          <Database className="h-3 w-3 text-indigo-600" /> SYSTÈME
                        </span>
                      )}

                      {isUnread && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-amber-500 text-white animate-pulse">
                          NON LU
                        </span>
                      )}
                    </div>

                    <span className="text-stone-400 flex items-center gap-1 font-mono text-[10px]">
                      <Clock className="h-3 w-3 text-stone-300" />
                      {new Date(log.timestamp).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: '2-digit'
                      })} à {new Date(log.timestamp).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>

                  <h4 className={`text-xs mb-1.5 flex items-center justify-between ${isUnread ? 'font-black text-green-950' : 'font-bold text-stone-900'}`}>
                    <span className="truncate">{log.title}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-green-400 shrink-0" />
                  </h4>
                  
                  <p className="text-[11px] text-stone-600 font-sans line-clamp-2 leading-relaxed bg-stone-50/80 p-2.5 rounded-xl border border-stone-150">
                    {log.content}
                  </p>

                  <div className="flex justify-between items-center text-[9px] text-stone-400 pt-2 border-t border-stone-100 mt-2">
                    <span>Destinataire : <strong className="text-stone-600">{log.recipient}</strong></span>
                    <span className="text-emerald-700 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" /> ENVOYÉ (200 OK)
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Paginated Status / Trigger */}
            {filteredLogs.length > 0 && (
              <div className="py-3 text-center border-t border-stone-100 mt-2">
                <span className="text-[10px] text-stone-400 font-medium block mb-1">
                  Affichage de {displayedLogs.length} sur {filteredLogs.length} notification(s) ({isFilteringActive ? 'Mode Recherche/Filtre: par 100' : 'Mode Standard: par 50'})
                </span>
                {hasMore && (
                  <button
                    onClick={() => setVisibleCount((prev) => Math.min(prev + batchSize, filteredLogs.length))}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-green-50 text-green-800 rounded-lg text-[10px] font-bold hover:bg-green-100 transition cursor-pointer"
                  >
                    <ArrowDown className="h-3 w-3" /> Charger plus ({batchSize} suivants)
                  </button>
                )}
              </div>
            )}

            {filteredLogs.length === 0 && (
              <div className="py-24 text-center text-stone-400 text-xs italic space-y-2">
                <p>Aucun message correspondant aux filtres sélectionnés.</p>
                {isFilteringActive && (
                  <button
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                      setSearchQuery('');
                      setFilter('all');
                      setVisibleCount(50);
                    }}
                    className="text-green-600 font-bold underline not-italic text-[11px]"
                  >
                    Réinitialiser tous les filtres
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detailed View of Selected Notification */}
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col h-[580px]">
          <div className="border-b border-stone-200/60 pb-3 mb-4 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-serif font-bold text-stone-900">
                Détails de la Notification
              </h3>
            </div>
            {selectedLog && (
              <button
                onClick={() => handleExportPDF([selectedLog])}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                title="Exporter cette notification en PDF"
              >
                <Printer className="h-3 w-3" /> PDF
              </button>
            )}
          </div>

          {selectedLog ? (
            <div className="flex-1 flex flex-col justify-between overflow-y-auto custom-scrollbar">
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                    Canal & Statut
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      selectedLog.type === 'whatsapp' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : selectedLog.type === 'email' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}>
                      {selectedLog.type === 'whatsapp' ? 'WhatsApp Business API' : selectedLog.type === 'email' ? 'Serveur Email SMTP' : 'Journal Système / Audit'}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-md">
                      Délivré
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                    Destinataire
                  </span>
                  <p className="font-semibold text-stone-800 bg-stone-50 p-2.5 rounded-xl border border-stone-150">
                    {selectedLog.recipient}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                    Sujet / Titre
                  </span>
                  <p className="font-semibold text-stone-900 bg-stone-50 p-2.5 rounded-xl border border-stone-150">
                    {selectedLog.title}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                    Message transmis
                  </span>
                  <div className="bg-green-50/30 p-3 rounded-xl border border-green-100 text-stone-700 font-sans leading-relaxed whitespace-pre-wrap">
                    {selectedLog.content}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                    Horodatage
                  </span>
                  <p className="font-mono text-stone-500 text-[11px]">
                    {new Date(selectedLog.timestamp).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>

              <div className="bg-green-50/60 border border-green-100 p-3 rounded-xl text-[10px] text-green-900 space-y-1 mt-4 shrink-0">
                <span className="font-bold text-green-950 block flex items-center gap-1">
                  <Database className="h-3.5 w-3.5 text-green-500" /> Traçabilité Inaltérable HR
                </span>
                <p className="leading-relaxed">
                  L'historique des notifications est archivé de manière sécurisée et ne peut pas être effacé.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <MessageSquare className="h-10 w-10 text-green-200 mb-3" />
              <p className="text-xs italic leading-relaxed">
                Cliquez sur une notification dans le journal à gauche pour lire les détails du message envoyé.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
