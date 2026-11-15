import { useState, useEffect, useMemo } from 'react';
import { AppUser, ConnectionLog, Employee, NotificationLog } from '../../types';
import {
  getAdminAuditOperations,
  hydrateAuditOperationsFromDb,
  AdminAccountOperation,
} from '../../services/adminAuditService';
import { subscribeToConnectionLogs } from '../../services/connectionLogService';
import { exportElementToPdf } from '../../services/pdfExportService';
import { LogSubTab, SessionLogItem } from './sessionLogsConstants';
import { exportSystemLogsToExcel } from './logBadgesAndExport';
import {
  buildUserIdentityTokens,
  isAuditOperationVisibleToUser,
  isNotificationVisibleToUser,
  isSessionLogVisibleToUser,
} from './logVisibilityFilter';

const SYSTEM_EVENT_TYPES = new Set([
  'securite_connexion',
  'systeme',
  'access_key_regenerated',
  'password_reset',
]);

export function useSystemLogsLogic(
  notifications: NotificationLog[],
  currentUser: AppUser,
  employees: Employee[]
) {
  const [activeSubTab, setActiveSubTab] = useState<LogSubTab>('system_events');
  const [searchTerm, setSearchTerm] = useState('');

  const [auditFilterType, setAuditFilterType] = useState<string>('all');
  const [auditFilterStatus, setAuditFilterStatus] = useState<string>('all');
  const [auditFilterPeriod, setAuditFilterPeriod] = useState<string>('all');
  const [auditStartDate, setAuditStartDate] = useState<string>('');
  const [auditEndDate, setAuditEndDate] = useState<string>('');
  const [rawAuditList, setRawAuditList] = useState<AdminAccountOperation[]>(() => getAdminAuditOperations());
  const [connectionLogs, setConnectionLogs] = useState<ConnectionLog[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const AUDIT_PER_PAGE = 25;

  useEffect(() => {
    const handleAuditUpdate = () => setRawAuditList(getAdminAuditOperations());
    window.addEventListener('citrine:audit_updated', handleAuditUpdate);
    void hydrateAuditOperationsFromDb().then((ops) => setRawAuditList(ops));
    const unsubConn = subscribeToConnectionLogs(setConnectionLogs);

    return () => {
      window.removeEventListener('citrine:audit_updated', handleAuditUpdate);
      unsubConn();
    };
  }, []);

  const handleRefresh = () => {
    setRawAuditList(getAdminAuditOperations());
    void hydrateAuditOperationsFromDb().then((ops) => setRawAuditList(ops));
  };

  const identityTokens = useMemo(
    () => buildUserIdentityTokens(currentUser, employees),
    [currentUser, employees]
  );

  // RBAC: hors Admins & Responsables, l'utilisateur ne voit que les logs qui le concernent
  const auditList = useMemo(
    () =>
      rawAuditList.filter((op) => {
        if (!isAuditOperationVisibleToUser(op, identityTokens)) return false;
        return op.logCategory !== 'system_event' || op.operationType === 'creation' || op.operationType === 'password_reset' || op.operationType === 'access_key_regenerated';
      }),
    [rawAuditList, identityTokens]
  );

  const filteredAuditOps = useMemo(() => {
    return auditList.filter((op) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !q ||
        op.targetName.toLowerCase().includes(q) ||
        op.authorName.toLowerCase().includes(q) ||
        op.details.toLowerCase().includes(q) ||
        op.operationLabel.toLowerCase().includes(q);
      const matchType =
        auditFilterType === 'all' ||
        op.operationType === auditFilterType ||
        (auditFilterType === 'feuille_avancement_taches' && op.operationType === 'feuille_de_temps');
      const matchStatus = auditFilterStatus === 'all' || (op.level || 'info') === auditFilterStatus;

      let matchPeriod = true;
      const opDate = new Date(op.timestamp);
      const now = new Date();
      if (auditFilterPeriod === 'today') {
        matchPeriod = op.timestamp.split('T')[0] === now.toISOString().split('T')[0];
      } else if (auditFilterPeriod === '7days') {
        matchPeriod = (now.getTime() - opDate.getTime()) / (1000 * 3600 * 24) <= 7;
      } else if (auditFilterPeriod === '30days') {
        matchPeriod = (now.getTime() - opDate.getTime()) / (1000 * 3600 * 24) <= 30;
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

  // 1. Notifs Systèmes (sécurité, connexions, synchronisations, envois cron) filtrées par RBAC
  const sessionLogs = useMemo<SessionLogItem[]>(() => {
    const fromAudit: SessionLogItem[] = rawAuditList
      .filter((op) => op.logCategory === 'system_event' || SYSTEM_EVENT_TYPES.has(op.operationType))
      .map((op) => ({
        id: op.id,
        title: op.operationLabel,
        timestamp: op.timestamp,
        dateKey: op.timestamp.split('T')[0],
        author: op.authorName,
        level: op.level || 'info',
        details: op.details,
        ipAddress: op.ipAddress,
        targetName: op.targetName,
        targetUserId: op.targetUserId,
        targetEmployeeId: op.targetEmployeeId,
      }));

    const fromConn: SessionLogItem[] = connectionLogs.map((c) => ({
      id: `conn-${c.id}`,
      title: c.status === 'failed' ? 'Tentative de connexion échouée' : `Connexion (${c.authMethod || 'password'})`,
      timestamp: c.timestamp,
      dateKey: (c.timestamp || '').split('T')[0],
      author: c.userName || c.userEmail,
      level: c.status === 'failed' ? 'error' : 'success',
      details: `${c.details} • ${c.userEmail}`,
      ipAddress: c.ipAddress || c.location,
      targetName: c.userName,
      targetUserId: c.userId,
    }));

    const seen = new Set<string>();
    return [...fromAudit, ...fromConn]
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return isSessionLogVisibleToUser(item, identityTokens);
      })
      .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
  }, [rawAuditList, connectionLogs, identityTokens]);

  const [sessionDateFilter, setSessionDateFilter] = useState<string>('');
  const [sessionLevelFilter, setSessionLevelFilter] = useState<string>('all');
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
      if (sessionDateFilter) {
        matchPeriod = s.dateKey === sessionDateFilter || s.timestamp.startsWith(sessionDateFilter);
      }
      return matchSearch && matchLevel && matchPeriod;
    });
  }, [sessionLogs, searchTerm, sessionLevelFilter, sessionDateFilter]);

  const totalSessionPages = Math.max(1, Math.ceil(filteredSessionLogs.length / SESSIONS_PER_PAGE));
  const paginatedSessionLogs = useMemo(() => {
    const start = (sessionPage - 1) * SESSIONS_PER_PAGE;
    return filteredSessionLogs.slice(start, start + SESSIONS_PER_PAGE);
  }, [filteredSessionLogs, sessionPage]);

  const [notifFilter, setNotifFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [notifPage, setNotifPage] = useState(1);
  const [selectedDetailNotif, setSelectedDetailNotif] = useState<NotificationLog | null>(null);
  const NOTIFS_PER_PAGE = 25;

  const scopedNotifs = useMemo(
    () => notifications.filter((n) => isNotificationVisibleToUser(n, identityTokens)),
    [notifications, identityTokens]
  );

  const filteredNotifs = useMemo(() => {
    return scopedNotifs.filter((n) => {
      const matchesSearch =
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = notifFilter === 'all' ? true : notifFilter === 'read' ? n.read : !n.read;
      return matchesSearch && matchesFilter;
    });
  }, [scopedNotifs, searchTerm, notifFilter]);

  const totalNotifPages = Math.max(1, Math.ceil(filteredNotifs.length / NOTIFS_PER_PAGE));
  const paginatedNotifs = useMemo(() => {
    const start = (notifPage - 1) * NOTIFS_PER_PAGE;
    return filteredNotifs.slice(start, start + NOTIFS_PER_PAGE);
  }, [filteredNotifs, notifPage]);

  const handleExportExcel = () => exportSystemLogsToExcel(activeSubTab, sessionLogs, auditList, scopedNotifs);
  const handleExportPdf = () => exportElementToPdf('system-logs-container', `journaux_audit_${activeSubTab}.pdf`);

  return {
    canViewAll: identityTokens.canSeeAll,
    activeSubTab, setActiveSubTab, searchTerm, setSearchTerm,
    auditFilterType, setAuditFilterType, auditFilterStatus, setAuditFilterStatus,
    auditFilterPeriod, setAuditFilterPeriod, auditStartDate, setAuditStartDate,
    auditEndDate, setAuditEndDate, auditList, auditPage, setAuditPage, AUDIT_PER_PAGE,
    filteredAuditOps, totalAuditPages, paginatedAuditOps,
    sessionLogs, sessionDateFilter, setSessionDateFilter, sessionLevelFilter, setSessionLevelFilter,
    sessionPage, setSessionPage, SESSIONS_PER_PAGE, filteredSessionLogs, totalSessionPages, paginatedSessionLogs,
    notifFilter, setNotifFilter, notifPage, setNotifPage, selectedDetailNotif, setSelectedDetailNotif,
    NOTIFS_PER_PAGE, scopedNotifs, filteredNotifs, totalNotifPages, paginatedNotifs,
    handleRefresh, handleExportExcel, handleExportPdf,
  };
}
