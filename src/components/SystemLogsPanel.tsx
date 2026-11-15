import React from 'react';
import { Terminal, ShieldCheck, Bell, Download, RefreshCw, FileText } from 'lucide-react';
import { NotificationLog, AppUser, Employee } from '../types';
import { NotificationDetailModal } from './notifications/NotificationDetailModal';
import { HumaanAudit } from './illustrations/HumaanIllustrations';
import { SessionLogItem } from './logs/sessionLogsConstants';
import { useSystemLogsLogic } from './logs/useSystemLogsLogic';
import { SystemEventsTab } from './logs/SystemEventsTab';
import { AuditLogsTab } from './logs/AuditLogsTab';
import { NotificationsLogsTab } from './logs/NotificationsLogsTab';

export type { SessionLogItem };

interface SystemLogsPanelProps {
  notifications: NotificationLog[];
  currentUser: AppUser;
  employees?: Employee[];
  users?: AppUser[];
  onUpdateNotifications?: (newNotifs: NotificationLog[]) => void;
  onAddNotification?: (log: NotificationLog) => void;
}

export default function SystemLogsPanel({
  notifications,
  currentUser,
  employees = [],
}: SystemLogsPanelProps) {
  const logic = useSystemLogsLogic(notifications, currentUser, employees);

  return (
    <div id="system-logs-container" className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      <div className="bg-gradient-to-r from-[#2A7B76] to-emerald-800 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden">
        <div className="z-10 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <Terminal className="h-5 w-5 text-emerald-200" />
            <h2 className="font-serif font-bold text-xl sm:text-2xl">Journaux et Audit</h2>
          </div>
        </div>

        <div className="hidden lg:block shrink-0 z-10">
          <HumaanAudit className="w-36 h-28 drop-shadow-md" />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center justify-center md:justify-end gap-2.5 z-10 w-full sm:w-auto">
          <button
            onClick={logic.handleRefresh}
            className="w-auto p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer active:scale-98 border border-white/15"
            title="Rafraîchir les journaux"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={logic.handleExportExcel}
            className="w-full sm:w-auto justify-center flex items-center gap-1.5 bg-white text-[#2A7B76] hover:bg-emerald-50 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-98"
          >
            <Download className="h-3.5 w-3.5 text-[#2A7B76]" />
            <span>Excel</span>
          </button>
          <button
            onClick={logic.handleExportPdf}
            className="w-full sm:w-auto justify-center flex items-center gap-1.5 bg-emerald-900/60 hover:bg-emerald-900/80 text-white border border-emerald-400/30 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-98"
          >
            <FileText className="h-3.5 w-3.5 text-rose-300" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-stone-200/80 pb-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => logic.setActiveSubTab('system_events')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer shrink-0 ${
            logic.activeSubTab === 'system_events' ? 'bg-[#2A7B76] text-white shadow-sm' : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200/80'
          }`}
        >
          <Terminal className="h-4 w-4" />
          <span>1. Notifs Systèmes</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${logic.activeSubTab === 'system_events' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'}`}>
            {logic.sessionLogs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => logic.setActiveSubTab('audit_logs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer shrink-0 ${
            logic.activeSubTab === 'audit_logs' ? 'bg-[#2A7B76] text-white shadow-sm' : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200/80'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>2. Logs d'Audit</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${logic.activeSubTab === 'audit_logs' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'}`}>
            {logic.auditList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => logic.setActiveSubTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer shrink-0 ${
            logic.activeSubTab === 'notifications' ? 'bg-[#2A7B76] text-white shadow-sm' : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200/80'
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>3. Notifications</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${logic.activeSubTab === 'notifications' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'}`}>
            {notifications.length}
          </span>
        </button>
      </div>

      {logic.activeSubTab === 'system_events' && (
        <SystemEventsTab
          sessionLogs={logic.sessionLogs}
          filteredSessionLogs={logic.filteredSessionLogs}
          paginatedSessionLogs={logic.paginatedSessionLogs}
          searchTerm={logic.searchTerm}
          onChangeSearch={logic.setSearchTerm}
          sessionDateFilter={logic.sessionDateFilter}
          onChangeDateFilter={logic.setSessionDateFilter}
          sessionLevelFilter={logic.sessionLevelFilter}
          onChangeLevelFilter={logic.setSessionLevelFilter}
          sessionPage={logic.sessionPage}
          totalSessionPages={logic.totalSessionPages}
          sessionsPerPage={logic.SESSIONS_PER_PAGE}
          onChangePage={logic.setSessionPage}
        />
      )}

      {logic.activeSubTab === 'audit_logs' && (
        <AuditLogsTab
          auditList={logic.auditList}
          filteredAuditOps={logic.filteredAuditOps}
          paginatedAuditOps={logic.paginatedAuditOps}
          searchTerm={logic.searchTerm}
          onChangeSearch={logic.setSearchTerm}
          auditFilterType={logic.auditFilterType}
          onChangeFilterType={logic.setAuditFilterType}
          auditFilterStatus={logic.auditFilterStatus}
          onChangeFilterStatus={logic.setAuditFilterStatus}
          auditFilterPeriod={logic.auditFilterPeriod}
          onChangeFilterPeriod={logic.setAuditFilterPeriod}
          auditStartDate={logic.auditStartDate}
          onChangeStartDate={logic.setAuditStartDate}
          auditEndDate={logic.auditEndDate}
          onChangeEndDate={logic.setAuditEndDate}
          auditPage={logic.auditPage}
          totalAuditPages={logic.totalAuditPages}
          auditPerPage={logic.AUDIT_PER_PAGE}
          onChangePage={logic.setAuditPage}
        />
      )}

      {logic.activeSubTab === 'notifications' && (
        <NotificationsLogsTab
          notifications={notifications}
          filteredNotifs={logic.filteredNotifs}
          paginatedNotifs={logic.paginatedNotifs}
          searchTerm={logic.searchTerm}
          onChangeSearch={logic.setSearchTerm}
          notifFilter={logic.notifFilter}
          onChangeNotifFilter={logic.setNotifFilter}
          notifPage={logic.notifPage}
          totalNotifPages={logic.totalNotifPages}
          notifsPerPage={logic.NOTIFS_PER_PAGE}
          onChangePage={logic.setNotifPage}
          onSelectNotif={logic.setSelectedDetailNotif}
        />
      )}

      {logic.selectedDetailNotif && (
        <NotificationDetailModal
          notification={logic.selectedDetailNotif}
          onClose={() => logic.setSelectedDetailNotif(null)}
        />
      )}
    </div>
  );
}
