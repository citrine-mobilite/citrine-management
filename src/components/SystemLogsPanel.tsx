import React, { useState, useMemo } from 'react';
import { 
  Terminal, 
  Search, 
  ShieldCheck, 
  History, 
  Bell, 
  Download, 
  Calendar, 
  Filter, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  X,
  FileText
} from 'lucide-react';
import { NotificationLog, AppUser, Employee } from '../types';
import { getAdminAuditOperations, AdminAccountOperation } from '../services/adminAuditService';
import { NotificationStatsCards } from './notifications/NotificationStatsCards';
import { NotificationListItem } from './notifications/NotificationListItem';
import { NotificationDetailModal } from './notifications/NotificationDetailModal';
import { exportToExcel } from '../services/excelExportService';
import { exportElementToPdf } from '../services/pdfExportService';

interface SystemLogsPanelProps {
  notifications: NotificationLog[];
  currentUser: AppUser;
  employees?: Employee[];
  users?: AppUser[];
  onUpdateNotifications?: (newNotifs: NotificationLog[]) => void;
  onAddNotification?: (log: NotificationLog) => void;
}

type LogSubTab = 'system_events' | 'audit_logs' | 'notifications';

export interface SessionLogItem {
  id: string;
  title: string;
  timestamp: string;
  dateKey: string; // YYYY-MM-DD
  author: string;
  level: 'info' | 'success' | 'warning' | 'error';
  details: string;
  ipAddress?: string;
}

const INITIAL_SESSION_LOGS: SessionLogItem[] = [
  {
    id: 'sess-1',
    title: 'Connexion Super-Administrateur réussie',
    timestamp: new Date().toISOString(),
    dateKey: new Date().toISOString().split('T')[0],
    author: 'Super Admin',
    level: 'info',
    details: 'Session ouverte avec succès via authentification sécurisée.',
    ipAddress: '197.234.221.14 (Douala, CM)',
  },
  {
    id: 'sess-2',
    title: 'Sauvegarde automatique des pointages',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    dateKey: new Date(Date.now() - 3600000 * 2).toISOString().split('T')[0],
    author: 'Système Citrine',
    level: 'success',
    details: 'Synchronisation cloud effectuée sans incident.',
    ipAddress: '197.234.221.14 (Douala, CM)',
  },
  {
    id: 'sess-3',
    title: 'Session QR Dynamique initiée par le Responsable',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    dateKey: new Date(Date.now() - 3600000 * 5).toISOString().split('T')[0],
    author: 'Responsable Opérations',
    level: 'info',
    details: 'Ouverture de la borne de pointage avec renouvellement dynamique 30s.',
    ipAddress: '197.234.221.18 (Yaoundé, CM)',
  },
  {
    id: 'sess-4',
    title: 'Clé d\'Accès 16 caractères générée',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    dateKey: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    author: 'Super Admin',
    level: 'info',
    details: 'Génération d\'un code à usage unique de secours pour émargement.',
    ipAddress: '197.234.221.14 (Douala, CM)',
  },
  {
    id: 'sess-5',
    title: 'Vérification de géolocalisation stricte',
    timestamp: new Date(Date.now() - 86400000 * 1.2).toISOString(),
    dateKey: new Date(Date.now() - 86400000 * 1.2).toISOString().split('T')[0],
    author: 'Module Horaires',
    level: 'info',
    details: 'Périmètre autorisé validé pour les locaux de Douala (GPS : 4.0511, 9.7679).',
    ipAddress: '197.234.221.14 (Douala, CM)',
  },
  {
    id: 'sess-6',
    title: 'Fermeture automatique de session inactive',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    dateKey: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    author: 'Système Sécurité',
    level: 'warning',
    details: 'Déconnexion automatique après 90 minutes d\'inactivité prolongée.',
    ipAddress: '197.234.221.10 (Douala, CM)',
  },
  {
    id: 'sess-7',
    title: 'Authentification multifacteur activée',
    timestamp: new Date(Date.now() - 86400000 * 2.5).toISOString(),
    dateKey: new Date(Date.now() - 86400000 * 2.5).toISOString().split('T')[0],
    author: 'Responsable RH',
    level: 'success',
    details: 'Validation de l\'intégrité des paramètres de connexion.',
    ipAddress: '197.234.221.22 (Bafoussam, CM)',
  },
  {
    id: 'sess-8',
    title: 'Tentative de connexion refusée (Rôle non autorisé)',
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
    dateKey: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    author: 'Inconnu',
    level: 'error',
    details: 'Bloqué par le pare-feu applicatif : tentative d\'accès non autorisée.',
    ipAddress: '197.234.220.05 (Douala, CM)',
  },
  {
    id: 'sess-9',
    title: 'Renouvellement des jetons de sécurité',
    timestamp: new Date(Date.now() - 86400000 * 4).toISOString(),
    dateKey: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
    author: 'Système Citrine',
    level: 'info',
    details: 'Rotation des clés cryptographiques locale effectuée avec succès.',
    ipAddress: '127.0.0.1 (Localhost)',
  },
  {
    id: 'sess-10',
    title: 'Contrôle de présence biométrique validé',
    timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
    dateKey: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
    author: 'Super Admin',
    level: 'success',
    details: 'Émargement physique vérifié sur l\'horodateur Kiosk 01.',
    ipAddress: '197.234.221.14 (Douala, CM)',
  },
  {
    id: 'sess-11',
    title: 'Session utilisateur synchronisée avec le cloud',
    timestamp: new Date(Date.now() - 86400000 * 6).toISOString(),
    dateKey: new Date(Date.now() - 86400000 * 6).toISOString().split('T')[0],
    author: 'Service Worker PWA',
    level: 'info',
    details: 'Mise à jour du statut réseau et file d\'attente hors-ligne résolue.',
    ipAddress: '197.234.221.14 (Douala, CM)',
  },
  {
    id: 'sess-12',
    title: 'Connexion Administrateur Adjoint',
    timestamp: new Date(Date.now() - 86400000 * 7).toISOString(),
    dateKey: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0],
    author: 'Admin Adjoint',
    level: 'info',
    details: 'Connexion à partir de l\'application mobile PWA Android.',
    ipAddress: '197.234.221.99 (Garoua, CM)',
  },
];

export default function SystemLogsPanel({
  notifications,
  currentUser,
}: SystemLogsPanelProps) {
  // Ordre requis : 1er = Notifs Systèmes, 2e = Logs d'Audit, 3e = Notifications
  const [activeSubTab, setActiveSubTab] = useState<LogSubTab>('system_events');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Audit Comptes & Opérations Générales State (Paginated par 20)
  const [auditFilterType, setAuditFilterType] = useState<string>('all');
  const [auditFilterStatus, setAuditFilterStatus] = useState<string>('all');
  const [auditFilterPeriod, setAuditFilterPeriod] = useState<string>('all');
  const [auditStartDate, setAuditStartDate] = useState<string>('');
  const [auditEndDate, setAuditEndDate] = useState<string>('');
  const [auditList, setAuditList] = useState<AdminAccountOperation[]>(() => getAdminAuditOperations());
  const [auditPage, setAuditPage] = useState(1);
  const AUDIT_PER_PAGE = 25;

  // Auto-synchronisation dès qu'une action est consignée dans l'application
  React.useEffect(() => {
    const handleAuditUpdate = () => {
      setAuditList(getAdminAuditOperations());
    };
    window.addEventListener('citrine:audit_updated', handleAuditUpdate);
    return () => window.removeEventListener('citrine:audit_updated', handleAuditUpdate);
  }, []);

  const handleRefresh = () => {
    setAuditList(getAdminAuditOperations());
  };

  const filteredAuditOps = useMemo(() => {
    return auditList.filter((op) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !q ||
        op.targetName.toLowerCase().includes(q) ||
        op.authorName.toLowerCase().includes(q) ||
        op.details.toLowerCase().includes(q) ||
        op.operationLabel.toLowerCase().includes(q);

      const matchType = auditFilterType === 'all' || op.operationType === auditFilterType;
      const matchStatus = auditFilterStatus === 'all' || (op.level || 'info') === auditFilterStatus;

      // Filtre Période
      let matchPeriod = true;
      const opDate = new Date(op.timestamp);
      const now = new Date();
      if (auditFilterPeriod === 'today') {
        matchPeriod = op.timestamp.split('T')[0] === now.toISOString().split('T')[0];
      } else if (auditFilterPeriod === '7days') {
        const diffDays = (now.getTime() - opDate.getTime()) / (1000 * 3600 * 24);
        matchPeriod = diffDays <= 7;
      } else if (auditFilterPeriod === '30days') {
        const diffDays = (now.getTime() - opDate.getTime()) / (1000 * 3600 * 24);
        matchPeriod = diffDays <= 30;
      } else if (auditFilterPeriod === 'this_month') {
        matchPeriod = op.timestamp.startsWith(now.toISOString().slice(0, 7));
      } else if (auditFilterPeriod === 'custom') {
        const opDay = op.timestamp.split('T')[0];
        if (auditStartDate && opDay < auditStartDate) matchPeriod = false;
        if (auditEndDate && opDay > auditEndDate) matchPeriod = false;
      }

      return matchSearch && matchType && matchStatus && matchPeriod;
    });
  }, [auditList, searchTerm, auditFilterType, auditFilterStatus, auditFilterPeriod, auditStartDate, auditEndDate]);

  const totalAuditPages = Math.max(1, Math.ceil(filteredAuditOps.length / AUDIT_PER_PAGE));
  const paginatedAuditOps = useMemo(() => {
    const start = (auditPage - 1) * AUDIT_PER_PAGE;
    return filteredAuditOps.slice(start, start + AUDIT_PER_PAGE);
  }, [filteredAuditOps, auditPage]);

  // 2. Session Logs & Security State (Filterable by Date & Paginated par 20)
  const [sessionLogs] = useState<SessionLogItem[]>(INITIAL_SESSION_LOGS);
  const [sessionDateFilter, setSessionDateFilter] = useState<string>('');
  const [sessionLevelFilter, setSessionLevelFilter] = useState<string>('all');
  const [sessionPeriodFilter, setSessionPeriodFilter] = useState<string>('all');
  const [sessionPage, setSessionPage] = useState<number>(1);
  const SESSIONS_PER_PAGE = 25;

  const filteredSessionLogs = useMemo(() => {
    return sessionLogs.filter((s) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.author.toLowerCase().includes(q) ||
        s.details.toLowerCase().includes(q);

      const matchLevel = sessionLevelFilter === 'all' || s.level === sessionLevelFilter;
      
      let matchPeriod = true;
      const sDate = new Date(s.timestamp);
      const now = new Date();
      if (sessionPeriodFilter === 'today') {
        matchPeriod = s.dateKey === now.toISOString().split('T')[0];
      } else if (sessionPeriodFilter === '7days') {
        const diffDays = (now.getTime() - sDate.getTime()) / (1000 * 3600 * 24);
        matchPeriod = diffDays <= 7;
      } else if (sessionPeriodFilter === 'this_month') {
        matchPeriod = s.dateKey.startsWith(now.toISOString().slice(0, 7));
      } else if (sessionDateFilter) {
        matchPeriod = s.dateKey === sessionDateFilter || s.timestamp.startsWith(sessionDateFilter);
      }

      return matchSearch && matchLevel && matchPeriod;
    });
  }, [sessionLogs, searchTerm, sessionLevelFilter, sessionPeriodFilter, sessionDateFilter]);

  const totalSessionPages = Math.max(1, Math.ceil(filteredSessionLogs.length / SESSIONS_PER_PAGE));
  const paginatedSessionLogs = useMemo(() => {
    const start = (sessionPage - 1) * SESSIONS_PER_PAGE;
    return filteredSessionLogs.slice(start, start + SESSIONS_PER_PAGE);
  }, [filteredSessionLogs, sessionPage]);

  // 3. Notifications State (Paginated par 20)
  const [notifFilter, setNotifFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [notifPage, setNotifPage] = useState(1);
  const [selectedDetailNotif, setSelectedDetailNotif] = useState<NotificationLog | null>(null);
  const NOTIFS_PER_PAGE = 25;

  const filteredNotifs = useMemo(() => {
    return notifications.filter((n) => {
      const matchesSearch =
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = notifFilter === 'all' ? true : notifFilter === 'read' ? n.read : !n.read;
      return matchesSearch && matchesFilter;
    });
  }, [notifications, searchTerm, notifFilter]);

  const totalNotifPages = Math.max(1, Math.ceil(filteredNotifs.length / NOTIFS_PER_PAGE));
  const paginatedNotifs = useMemo(() => {
    const start = (notifPage - 1) * NOTIFS_PER_PAGE;
    return filteredNotifs.slice(start, start + NOTIFS_PER_PAGE);
  }, [filteredNotifs, notifPage]);

  const getOperationBadge = (type: AdminAccountOperation['operationType']) => {
    switch (type) {
      case 'conge_permission':
        return <span className="bg-teal-100 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full text-[10px] font-bold">🌴 Congé / Permission</span>;
      case 'conseil_discipline':
        return <span className="bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-bold">⚖️ Conseil Discipline</span>;
      case 'feuille_de_temps':
        return <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-full text-[10px] font-bold">📅 Feuille de Temps</span>;
      case 'presence_pointage':
        return <span className="bg-cyan-100 text-cyan-800 border border-cyan-200 px-2 py-0.5 rounded-full text-[10px] font-bold">⏱️ Pointage & Présence</span>;
      case 'securite_connexion':
        return <span className="bg-sky-100 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-full text-[10px] font-bold">🛡️ Sécurité & Connexion</span>;
      case 'salary_update':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">💰 Salaire & Finance</span>;
      case 'creation':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">👤 Création Compte</span>;
      case 'role_change':
        return <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">🔄 Changement de Rôle</span>;
      case 'manager_change':
        return <span className="bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-bold">👔 Responsable</span>;
      case 'team_change':
        return <span className="bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full text-[10px] font-bold">🏢 Affectation Équipe</span>;
      case 'status_change':
        return <span className="bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-bold">🛑 Statut / Suspension</span>;
      case 'password_reset':
        return <span className="bg-stone-200 text-stone-800 border border-stone-300 px-2 py-0.5 rounded-full text-[10px] font-bold">🔑 Mot de Passe</span>;
      case 'access_key_regenerated':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold">🎟️ Clé 16 Caractères</span>;
      default:
        return <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full text-[10px] font-bold">⚙️ Opération Système</span>;
    }
  };

  const getLevelBadge = (level?: string) => {
    switch (level) {
      case 'success':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">✓ Succès</span>;
      case 'warning':
        return <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">⚠️ Alerte</span>;
      case 'error':
        return <span className="bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-bold">✕ Erreur</span>;
      default:
        return <span className="bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-bold">ℹ️ Info</span>;
    }
  };

  const handleExportExcel = () => {
    if (activeSubTab === 'system_events') {
      const headers = ['ID', 'Date & Heure', 'Auteur', 'Niveau', 'Événement', 'Détails', 'IP'];
      const rows = sessionLogs.map((s) => [
        s.id,
        new Date(s.timestamp).toLocaleString('fr-FR'),
        s.author,
        s.level.toUpperCase(),
        s.title,
        s.details,
        s.ipAddress || '',
      ]);
      exportToExcel('notifications_systeme.xls', 'Notifications & Événements Système Citrine', headers, rows);
    } else if (activeSubTab === 'audit_logs') {
      const headers = ['ID', 'Date', 'Auteur', 'Compte Cible', 'Type Opération', 'Intitulé', 'Détails', 'IP'];
      const rows = auditList.map((op) => [
        op.id,
        new Date(op.timestamp).toLocaleString('fr-FR'),
        op.authorName,
        op.targetName,
        op.operationType,
        op.operationLabel,
        op.details,
        op.ipAddress || '197.234.221.14',
      ]);
      exportToExcel('journaux_audit_operations.xls', 'Audit Logs des Opérations Administratives', headers, rows);
    } else {
      const headers = ['ID', 'Date & Heure', 'Type', 'Titre', 'Contenu', 'Statut'];
      const rows = notifications.map((n) => [
        n.id,
        new Date(n.timestamp).toLocaleString('fr-FR'),
        n.type,
        n.title,
        n.content,
        n.read ? 'Lue' : 'Non lue',
      ]);
      exportToExcel('notifications_diffusees.xls', 'Notifications Diffusées aux Collaborateurs', headers, rows);
    }
  };

  const handleExportPdf = () => {
    exportElementToPdf('system-logs-container', `journaux_audit_${activeSubTab}.pdf`);
  };

  return (
    <div id="system-logs-container" className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#2A7B76] to-emerald-800 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-emerald-200" />
            <h2 className="font-serif font-bold text-xl sm:text-2xl">Journaux et Audit</h2>
          </div>
          <p className="text-xs text-emerald-100/90">
            Supervision centralisée des événements systèmes, traçabilité des opérations et diffusion des notifications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Rafraîchir les journaux"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 bg-white text-[#2A7B76] hover:bg-emerald-50 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-[#2A7B76]" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 bg-emerald-900/60 hover:bg-emerald-900/80 text-white border border-emerald-400/30 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5 text-rose-300" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* 3 Nav Tabs dans l'ordre strict demandé : 1. Notifs Systèmes, 2. Logs d'Audit, 3. Notifications */}
      <div className="flex items-center gap-2 border-b border-stone-200/80 pb-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('system_events')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer shrink-0 ${
            activeSubTab === 'system_events'
              ? 'bg-[#2A7B76] text-white shadow-sm'
              : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200/80'
          }`}
        >
          <Terminal className="h-4 w-4" />
          <span>1. Notifs Systèmes</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeSubTab === 'system_events' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
          }`}>
            {sessionLogs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('audit_logs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer shrink-0 ${
            activeSubTab === 'audit_logs'
              ? 'bg-[#2A7B76] text-white shadow-sm'
              : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200/80'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>2. Logs d'Audit</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeSubTab === 'audit_logs' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
          }`}>
            {auditList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer shrink-0 ${
            activeSubTab === 'notifications'
              ? 'bg-[#2A7B76] text-white shadow-sm'
              : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200/80'
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>3. Notifications</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeSubTab === 'notifications' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
          }`}>
            {notifications.length}
          </span>
        </button>
      </div>

      {/* ONGLET 1 (PAR DÉFAUT) : NOTIFS SYSTÈMES (Événements de session, sécurité, connexions) */}
      {activeSubTab === 'system_events' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Quick Metrics for System Events */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Total Événements</span>
              <span className="text-xl font-extrabold text-stone-900 font-mono mt-1 block">{sessionLogs.length}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Succès & Validations</span>
              <span className="text-xl font-extrabold text-emerald-700 font-mono mt-1 block">
                {sessionLogs.filter((s) => s.level === 'success').length}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Alertes & Vigies</span>
              <span className="text-xl font-extrabold text-amber-700 font-mono mt-1 block">
                {sessionLogs.filter((s) => s.level === 'warning').length}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Refus / Erreurs</span>
              <span className="text-xl font-extrabold text-rose-700 font-mono mt-1 block">
                {sessionLogs.filter((s) => s.level === 'error').length}
              </span>
            </div>
          </div>

          {/* Header & Filters */}
          <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-xs">
              <Search className="h-4 w-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher une notif système..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSessionPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#2A7B76]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Date Filter */}
              <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-xl text-xs text-stone-700">
                <Calendar className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                <input
                  type="date"
                  value={sessionDateFilter}
                  onChange={(e) => {
                    setSessionDateFilter(e.target.value);
                    setSessionPage(1);
                  }}
                  className="bg-transparent text-xs font-bold text-stone-800 outline-none cursor-pointer"
                />
                {sessionDateFilter && (
                  <button
                    onClick={() => {
                      setSessionDateFilter('');
                      setSessionPage(1);
                    }}
                    className="p-0.5 hover:bg-stone-200 rounded-full text-stone-500 cursor-pointer"
                    title="Effacer le filtre par date"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Level Filter */}
              <select
                value={sessionLevelFilter}
                onChange={(e) => {
                  setSessionLevelFilter(e.target.value);
                  setSessionPage(1);
                }}
                className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 focus:outline-none focus:border-[#2A7B76] cursor-pointer"
              >
                <option value="all">Tous les niveaux</option>
                <option value="info">Information (Info)</option>
                <option value="success">Succès</option>
                <option value="warning">Avertissement</option>
                <option value="error">Erreur / Refus</option>
              </select>
            </div>
          </div>

          {/* Session Logs List / Table */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden p-4 space-y-2">
            {paginatedSessionLogs.length === 0 ? (
              <div className="py-12 text-center text-stone-400 text-xs">
                Aucun événement système trouvé avec ces critères de recherche et date.
              </div>
            ) : (
              paginatedSessionLogs.map((ev) => {
                const getLevelStyle = () => {
                  switch (ev.level) {
                    case 'success':
                      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
                    case 'warning':
                      return 'bg-amber-50 text-amber-800 border-amber-200';
                    case 'error':
                      return 'bg-rose-50 text-rose-800 border-rose-200';
                    default:
                      return 'bg-blue-50 text-blue-800 border-blue-200';
                  }
                };

                return (
                  <div
                    key={ev.id}
                    className="p-3.5 bg-stone-50/70 hover:bg-stone-100/80 rounded-2xl border border-stone-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getLevelStyle()}`}>
                          {ev.level}
                        </span>
                        <h4 className="font-bold text-xs text-stone-900 truncate">{ev.title}</h4>
                      </div>
                      <p className="text-[11px] text-stone-600">{ev.details}</p>
                      <div className="flex items-center gap-3 text-[10px] text-stone-400 font-medium">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3 text-stone-400" />
                          {ev.author}
                        </span>
                        {ev.ipAddress && <span>IP: {ev.ipAddress}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-stone-500 shrink-0 self-end sm:self-center">
                      <Clock className="h-3.5 w-3.5 text-stone-400" />
                      <span>
                        {new Date(ev.timestamp).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            {/* Pagination Controls par 25 pour l'état des sessions */}
            {filteredSessionLogs.length > 0 && (
              <div className="pt-3 px-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t border-stone-100">
                <div className="text-stone-500 text-[11px]">
                  Affichage de <span className="font-bold text-stone-800">{(sessionPage - 1) * SESSIONS_PER_PAGE + 1}</span> à{' '}
                  <span className="font-bold text-stone-800">
                    {Math.min(sessionPage * SESSIONS_PER_PAGE, filteredSessionLogs.length)}
                  </span>{' '}
                  sur <span className="font-bold text-[#2A7B76]">{filteredSessionLogs.length}</span> sessions (25 par page)
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={sessionPage <= 1}
                    onClick={() => setSessionPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center gap-1 cursor-pointer transition text-[11px] shadow-2xs"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>Précédent</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalSessionPages }, (_, i) => i + 1).map((p) => {
                      const isCurrent = p === sessionPage;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setSessionPage(p)}
                          className={`min-w-[30px] h-7 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                            isCurrent
                              ? 'bg-[#2A7B76] text-white shadow-xs'
                              : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100/80'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    disabled={sessionPage >= totalSessionPages}
                    onClick={() => setSessionPage((p) => Math.min(totalSessionPages, p + 1))}
                    className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center gap-1 cursor-pointer transition text-[11px] shadow-2xs"
                  >
                    <span>Suivant</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ONGLET 2 : LOGS D'AUDIT (Opérations administratives sur les comptes) */}
      {activeSubTab === 'audit_logs' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Total Opérations</span>
              <span className="text-xl font-extrabold text-stone-900 font-mono mt-1 block">{auditList.length}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Rôles & Privilèges</span>
              <span className="text-xl font-extrabold text-amber-700 font-mono mt-1 block">
                {auditList.filter((o) => o.operationType === 'role_change').length}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Responsables & Équipes</span>
              <span className="text-xl font-extrabold text-blue-700 font-mono mt-1 block">
                {auditList.filter((o) => o.operationType === 'manager_change' || o.operationType === 'team_change').length}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Créations Récentes</span>
              <span className="text-xl font-extrabold text-emerald-700 font-mono mt-1 block">
                {auditList.filter((o) => o.operationType === 'creation').length}
              </span>
            </div>
          </div>

          {/* Search, Type, Statut & Periode filter toolbar */}
          <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:max-w-md">
                <Search className="h-4 w-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, auteur, cible, détails..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setAuditPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#2A7B76]"
                />
              </div>

              {/* Filters row */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* 1. FILTRE PAR TYPE */}
                <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-xl px-2 py-1 text-xs">
                  <span className="text-[10px] font-bold text-stone-400">Type :</span>
                  <select
                    value={auditFilterType}
                    onChange={(e) => {
                      setAuditFilterType(e.target.value);
                      setAuditPage(1);
                    }}
                    className="bg-transparent font-bold text-stone-700 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="all">Tous les types</option>
                    <option value="conge_permission">🌴 Congé & Permission</option>
                    <option value="conseil_discipline">⚖️ Conseil de Discipline</option>
                    <option value="feuille_de_temps">📅 Feuille de Temps</option>
                    <option value="presence_pointage">⏱️ Pointage & Présence</option>
                    <option value="securite_connexion">🛡️ Sécurité & Connexion</option>
                    <option value="creation">👤 Création de Compte</option>
                    <option value="role_change">🔄 Changement de Rôle</option>
                    <option value="manager_change">👔 Responsable</option>
                    <option value="team_change">🏢 Affectation Équipe</option>
                    <option value="status_change">🛑 Statut & Suspension</option>
                    <option value="salary_update">💰 Salaire</option>
                    <option value="password_reset">🔑 Mot de passe</option>
                  </select>
                </div>

                {/* 2. FILTRE PAR STATUT */}
                <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-xl px-2 py-1 text-xs">
                  <span className="text-[10px] font-bold text-stone-400">Statut :</span>
                  <select
                    value={auditFilterStatus}
                    onChange={(e) => {
                      setAuditFilterStatus(e.target.value);
                      setAuditPage(1);
                    }}
                    className="bg-transparent font-bold text-stone-700 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="success">✓ Succès</option>
                    <option value="info">ℹ️ Information</option>
                    <option value="warning">⚠️ Avertissement</option>
                    <option value="error">✕ Erreur / Refus</option>
                  </select>
                </div>

                {/* 3. FILTRE PAR PÉRIODE */}
                <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-xl px-2 py-1 text-xs">
                  <Calendar className="h-3 w-3 text-stone-400" />
                  <span className="text-[10px] font-bold text-stone-400">Période :</span>
                  <select
                    value={auditFilterPeriod}
                    onChange={(e) => {
                      setAuditFilterPeriod(e.target.value);
                      setAuditPage(1);
                    }}
                    className="bg-transparent font-bold text-stone-700 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="all">Toutes les périodes</option>
                    <option value="today">Aujourd'hui</option>
                    <option value="7days">7 derniers jours</option>
                    <option value="30days">30 derniers jours</option>
                    <option value="this_month">Ce mois-ci</option>
                    <option value="custom">Date personnalisée...</option>
                  </select>
                </div>

                {(auditFilterType !== 'all' || auditFilterStatus !== 'all' || auditFilterPeriod !== 'all' || searchTerm) && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuditFilterType('all');
                      setAuditFilterStatus('all');
                      setAuditFilterPeriod('all');
                      setAuditStartDate('');
                      setAuditEndDate('');
                      setSearchTerm('');
                      setAuditPage(1);
                    }}
                    className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 font-bold transition cursor-pointer"
                    title="Réinitialiser les filtres"
                  >
                    Effacer filtres
                  </button>
                )}
              </div>
            </div>

            {/* Custom Date Pickers when 'custom' is selected */}
            {auditFilterPeriod === 'custom' && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100 text-xs animate-in fade-in">
                <span className="font-bold text-stone-600 text-[11px]">Plage de dates :</span>
                <input
                  type="date"
                  value={auditStartDate}
                  onChange={(e) => setAuditStartDate(e.target.value)}
                  className="bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs"
                />
                <span className="text-stone-400">à</span>
                <input
                  type="date"
                  value={auditEndDate}
                  onChange={(e) => setAuditEndDate(e.target.value)}
                  className="bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs"
                />
              </div>
            )}
          </div>

          {/* Audit Trail Table */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 text-[10px] uppercase font-bold border-b border-stone-200/80">
                  <tr>
                    <th className="py-3 px-4">Date & Heure</th>
                    <th className="py-3 px-4">Auteur</th>
                    <th className="py-3 px-4">Cible / Collaborateur</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4">Détails & Modifications</th>
                    <th className="py-3 px-4 text-right">IP / Réseau</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {paginatedAuditOps.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-stone-400 text-xs">
                        Aucune opération administrative ou système trouvée avec ces critères de filtre.
                      </td>
                    </tr>
                  ) : (
                    paginatedAuditOps.map((op) => (
                      <tr key={op.id} className="hover:bg-stone-50/70 transition">
                        <td className="py-3 px-4 whitespace-nowrap text-stone-600 font-mono text-[11px]">
                          {new Date(op.timestamp).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-bold text-stone-900">{op.authorName}</span>
                          {op.authorRole && (
                            <span className="block text-[10px] text-stone-400 font-normal">
                              {op.authorRole}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-bold text-stone-800">
                            <span className="w-6 h-6 rounded-full bg-[#2A7B76]/10 text-[#2A7B76] flex items-center justify-center text-[10px]">
                              {op.targetName.slice(0, 2).toUpperCase()}
                            </span>
                            <span>{op.targetName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {getOperationBadge(op.operationType)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {getLevelBadge(op.level)}
                        </td>
                        <td className="py-3 px-4 text-stone-700">
                          <div className="space-y-0.5 max-w-md">
                            <span className="font-bold block text-stone-900">{op.operationLabel}</span>
                            <span className="text-[11px] text-stone-500 block leading-relaxed">{op.details}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap text-stone-400 font-mono text-[10px]">
                          {op.ipAddress || '197.234.221.14 (Douala, CM)'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls par 20 */}
            {filteredAuditOps.length > 0 && (
              <div className="px-5 py-3.5 bg-stone-50/70 border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="text-stone-500 text-[11px]">
                  Affichage de <span className="font-bold text-stone-800">{(auditPage - 1) * AUDIT_PER_PAGE + 1}</span> à{' '}
                  <span className="font-bold text-stone-800">
                    {Math.min(auditPage * AUDIT_PER_PAGE, filteredAuditOps.length)}
                  </span>{' '}
                  sur <span className="font-bold text-[#2A7B76]">{filteredAuditOps.length}</span> opérations ({AUDIT_PER_PAGE} par page)
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={auditPage <= 1}
                    onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center gap-1 cursor-pointer transition text-[11px] shadow-2xs"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>Précédent</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalAuditPages }, (_, i) => i + 1).map((p) => {
                      const isCurrent = p === auditPage;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setAuditPage(p)}
                          className={`min-w-[30px] h-7 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                            isCurrent
                              ? 'bg-[#2A7B76] text-white shadow-xs'
                              : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100/80'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    disabled={auditPage >= totalAuditPages}
                    onClick={() => setAuditPage((p) => Math.min(totalAuditPages, p + 1))}
                    className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center gap-1 cursor-pointer transition text-[11px] shadow-2xs"
                  >
                    <span>Suivant</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ONGLET 3 : NOTIFICATIONS (Notifications & alertes diffusées) */}
      {activeSubTab === 'notifications' && (
        <div className="space-y-6 animate-in fade-in">
          <NotificationStatsCards notifications={notifications} />

          <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                placeholder="Rechercher une notification..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setNotifPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              {(['all', 'read', 'unread'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setNotifFilter(f);
                    setNotifPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition cursor-pointer ${
                    notifFilter === f ? 'bg-[#2A7B76] text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {f === 'all' ? 'Toutes' : f === 'read' ? 'Lues' : 'Non lues'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {paginatedNotifs.map((log) => (
              <NotificationListItem key={log.id} notification={log} onSelect={(item) => setSelectedDetailNotif(item)} />
            ))}
            {paginatedNotifs.length === 0 && (
              <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 text-stone-400 text-xs">
                Aucune notification trouvée.
              </div>
            )}
          </div>

          {/* Pagination Controls par 25 pour les Notifications */}
          {filteredNotifs.length > 0 && (
            <div className="px-5 py-3.5 bg-white rounded-2xl border border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-2xs">
              <div className="text-stone-500 text-[11px]">
                Affichage de <span className="font-bold text-stone-800">{(notifPage - 1) * NOTIFS_PER_PAGE + 1}</span> à{' '}
                <span className="font-bold text-stone-800">
                  {Math.min(notifPage * NOTIFS_PER_PAGE, filteredNotifs.length)}
                </span>{' '}
                sur <span className="font-bold text-[#2A7B76]">{filteredNotifs.length}</span> notifications (25 par page)
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={notifPage <= 1}
                  onClick={() => setNotifPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center gap-1 cursor-pointer transition text-[11px] shadow-2xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Précédent</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalNotifPages }, (_, i) => i + 1).map((p) => {
                    const isCurrent = p === notifPage;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setNotifPage(p)}
                        className={`min-w-[30px] h-7 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                          isCurrent
                            ? 'bg-[#2A7B76] text-white shadow-xs'
                            : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100/80'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={notifPage >= totalNotifPages}
                  onClick={() => setNotifPage((p) => Math.min(totalNotifPages, p + 1))}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center gap-1 cursor-pointer transition text-[11px] shadow-2xs"
                >
                  <span>Suivant</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedDetailNotif && (
        <NotificationDetailModal
          notification={selectedDetailNotif}
          onClose={() => setSelectedDetailNotif(null)}
        />
      )}
    </div>
  );
}
