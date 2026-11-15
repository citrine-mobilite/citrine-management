export type LogSubTab = 'system_events' | 'audit_logs' | 'notifications';

export interface SessionLogItem {
  id: string;
  title: string;
  timestamp: string;
  dateKey: string;
  author: string;
  level: 'info' | 'success' | 'warning' | 'error';
  details: string;
  ipAddress?: string;
}

export const INITIAL_SESSION_LOGS: SessionLogItem[] = [
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
    title: "Clé d'Accès 16 caractères générée",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    dateKey: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    author: 'Super Admin',
    level: 'info',
    details: "Génération d'un code à usage unique de secours pour émargement.",
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
    details: "Déconnexion automatique après 90 minutes d'inactivité prolongée.",
    ipAddress: '197.234.221.10 (Douala, CM)',
  },
  {
    id: 'sess-7',
    title: 'Authentification multifacteur activée',
    timestamp: new Date(Date.now() - 86400000 * 2.5).toISOString(),
    dateKey: new Date(Date.now() - 86400000 * 2.5).toISOString().split('T')[0],
    author: 'Responsable RH',
    level: 'success',
    details: "Validation de l'intégrité des paramètres de connexion.",
    ipAddress: '197.234.221.22 (Bafoussam, CM)',
  },
  {
    id: 'sess-8',
    title: 'Tentative de connexion refusée (Rôle non autorisé)',
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
    dateKey: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    author: 'Inconnu',
    level: 'error',
    details: "Bloqué par le pare-feu applicatif : tentative d'accès non autorisée.",
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
    details: "Émargement physique vérifié sur l'horodateur Kiosk 01.",
    ipAddress: '197.234.221.14 (Douala, CM)',
  },
  {
    id: 'sess-11',
    title: 'Session utilisateur synchronisée avec le cloud',
    timestamp: new Date(Date.now() - 86400000 * 6).toISOString(),
    dateKey: new Date(Date.now() - 86400000 * 6).toISOString().split('T')[0],
    author: 'Service Worker PWA',
    level: 'info',
    details: "Mise à jour du statut réseau et file d'attente hors-ligne résolue.",
    ipAddress: '197.234.221.14 (Douala, CM)',
  },
  {
    id: 'sess-12',
    title: 'Connexion Administrateur Adjoint',
    timestamp: new Date(Date.now() - 86400000 * 7).toISOString(),
    dateKey: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0],
    author: 'Admin Adjoint',
    level: 'info',
    details: "Connexion à partir de l'application mobile PWA Android.",
    ipAddress: '197.234.221.99 (Garoua, CM)',
  },
];
