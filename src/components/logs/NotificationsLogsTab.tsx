import React from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { NotificationLog } from '../../types';
import { NotificationStatsCards } from '../notifications/NotificationStatsCards';
import { NotificationListItem } from '../notifications/NotificationListItem';

interface NotificationsLogsTabProps {
  notifications: NotificationLog[];
  filteredNotifs: NotificationLog[];
  paginatedNotifs: NotificationLog[];
  searchTerm: string;
  onChangeSearch: (val: string) => void;
  notifFilter: 'all' | 'read' | 'unread';
  onChangeNotifFilter: (filter: 'all' | 'read' | 'unread') => void;
  notifPage: number;
  totalNotifPages: number;
  notifsPerPage: number;
  onChangePage: (page: number) => void;
  onSelectNotif: (notif: NotificationLog) => void;
}

export const NotificationsLogsTab: React.FC<NotificationsLogsTabProps> = ({
  notifications,
  filteredNotifs,
  paginatedNotifs,
  searchTerm,
  onChangeSearch,
  notifFilter,
  onChangeNotifFilter,
  notifPage,
  totalNotifPages,
  notifsPerPage,
  onChangePage,
  onSelectNotif,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in">
      <NotificationStatsCards notifications={notifications} />

      <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Rechercher une notification..."
            value={searchTerm}
            onChange={(e) => { onChangeSearch(e.target.value); onChangePage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'read', 'unread'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { onChangeNotifFilter(f); onChangePage(1); }}
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
          <NotificationListItem key={log.id} notification={log} onSelect={onSelectNotif} />
        ))}
        {paginatedNotifs.length === 0 && (
          <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 text-stone-400 text-xs">
            Aucune notification trouvée.
          </div>
        )}
      </div>

      {filteredNotifs.length > 0 && (
        <div className="px-5 py-3.5 bg-white rounded-2xl border border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="text-stone-500 text-[11px]">
            Affichage de <span className="font-bold text-stone-800">{(notifPage - 1) * notifsPerPage + 1}</span> à{' '}
            <span className="font-bold text-stone-800">{Math.min(notifPage * notifsPerPage, filteredNotifs.length)}</span> sur{' '}
            <span className="font-bold text-[#2A7B76]">{filteredNotifs.length}</span> notifications (25 par page)
          </div>

          <div className="flex items-center gap-1.5">
            <button type="button" disabled={notifPage <= 1} onClick={() => onChangePage(Math.max(1, notifPage - 1))} className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 font-bold flex items-center gap-1 cursor-pointer text-[11px] shadow-2xs">
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Précédent</span>
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalNotifPages }, (_, i) => i + 1).map((p) => (
                <button key={p} type="button" onClick={() => onChangePage(p)} className={`min-w-[30px] h-7 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${p === notifPage ? 'bg-[#2A7B76] text-white shadow-xs' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100/80'}`}>
                  {p}
                </button>
              ))}
            </div>
            <button type="button" disabled={notifPage >= totalNotifPages} onClick={() => onChangePage(Math.min(totalNotifPages, notifPage + 1))} className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 font-bold flex items-center gap-1 cursor-pointer text-[11px] shadow-2xs">
              <span>Suivant</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
