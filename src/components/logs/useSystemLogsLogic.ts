import { useState, useEffect, useMemo } from 'react';
import { AppUser, Employee, NotificationLog } from '../../types';
import { getAdminAuditOperations, AdminAccountOperation } from '../../services/adminAuditService';
import { exportElementToPdf } from '../../services/pdfExportService';
import { canSeeAllNotifications, findMatchingEmployee } from '../../utils/roleUtils';
import { INITIAL_SESSION_LOGS, LogSubTab, SessionLogItem } from './sessionLogsConstants';
import { exportSystemLogsToExcel } from './logBadgesAndExport';

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
  const [auditList, setAuditList] = useState<AdminAccountOperation[]>(() => getAdminAuditOperations());
  const [auditPage, setAuditPage] = useState(1);
  const AUDIT_PER_PAGE = 25;

  useEffect(() => {
    const handleAuditUpdate = () => setAuditList(getAdminAuditOperations());
    window.addEventListener('citrine:audit_updated', handleAuditUpdate);
    return () => window.removeEventListener('citrine:audit_updated', handleAuditUpdate);
  }, []);

  const handleRefresh = () => setAuditList(getAdminAuditOperations());

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

  const [sessionLogs] = useState<SessionLogItem[]>(INITIAL_SESSION_LOGS);
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

  const canSeeAll = canSeeAllNotifications(currentUser);
  const matchedEmp = useMemo(() => findMatchingEmployee(employees || [], currentUser), [employees, currentUser]);
  const myName = (matchedEmp?.name || currentUser?.name || '').toLowerCase();
  const myId = matchedEmp?.id || currentUser?.id;
  const myEmail = (matchedEmp?.email || currentUser?.email || '').toLowerCase();

  const filteredNotifs = useMemo(() => {
    return notifications.filter((n) => {
      if (!canSeeAll) {
        const recip = (n.recipient || '').toLowerCase();
        const title = (n.title || '').toLowerCase();
        const content = (n.content || '').toLowerCase();
        const isForMe =
          recip === 'tous' || recip === 'équipe' || recip === 'equipe' || recip === 'all' ||
          (myName && (recip.includes(myName) || title.includes(myName) || content.includes(myName))) ||
          (myId && recip === myId.toLowerCase()) ||
          (myEmail && recip.includes(myEmail));
        if (!isForMe) return false;
      }
      const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) || n.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = notifFilter === 'all' ? true : notifFilter === 'read' ? n.read : !n.read;
      return matchesSearch && matchesFilter;
    });
  }, [notifications, canSeeAll, myName, myId, myEmail, searchTerm, notifFilter]);

  const totalNotifPages = Math.max(1, Math.ceil(filteredNotifs.length / NOTIFS_PER_PAGE));
  const paginatedNotifs = useMemo(() => {
    const start = (notifPage - 1) * NOTIFS_PER_PAGE;
    return filteredNotifs.slice(start, start + NOTIFS_PER_PAGE);
  }, [filteredNotifs, notifPage]);

  const handleExportExcel = () => exportSystemLogsToExcel(activeSubTab, sessionLogs, auditList, notifications);
  const handleExportPdf = () => exportElementToPdf('system-logs-container', `journaux_audit_${activeSubTab}.pdf`);

  return {
    activeSubTab, setActiveSubTab, searchTerm, setSearchTerm,
    auditFilterType, setAuditFilterType, auditFilterStatus, setAuditFilterStatus,
    auditFilterPeriod, setAuditFilterPeriod, auditStartDate, setAuditStartDate,
    auditEndDate, setAuditEndDate, auditList, auditPage, setAuditPage, AUDIT_PER_PAGE,
    filteredAuditOps, totalAuditPages, paginatedAuditOps,
    sessionLogs, sessionDateFilter, setSessionDateFilter, sessionLevelFilter, setSessionLevelFilter,
    sessionPage, setSessionPage, SESSIONS_PER_PAGE, filteredSessionLogs, totalSessionPages, paginatedSessionLogs,
    notifFilter, setNotifFilter, notifPage, setNotifPage, selectedDetailNotif, setSelectedDetailNotif,
    NOTIFS_PER_PAGE, filteredNotifs, totalNotifPages, paginatedNotifs,
    handleRefresh, handleExportExcel, handleExportPdf,
  };
}
