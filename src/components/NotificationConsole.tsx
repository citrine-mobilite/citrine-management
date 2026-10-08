import React, { useState } from 'react';
import { Bell, Search, CheckCircle } from 'lucide-react';
import { NotificationLog, AppUser } from '../types';
import { NotificationStatsCards } from './notifications/NotificationStatsCards';
import { NotificationListItem } from './notifications/NotificationListItem';

interface NotificationConsoleProps {
  notifications: NotificationLog[];
  currentUser: AppUser;
  onUpdateNotifications?: (newNotifs: NotificationLog[]) => void;
  onAddNotification?: (log: NotificationLog) => void;
}

export default function NotificationConsole({ notifications, currentUser, onUpdateNotifications }: NotificationConsoleProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Filter notifications for the current user
  const userNotifications = notifications.filter(
    (n) => n.recipient === currentUser.name || n.recipient === currentUser.email
  );

  const filtered = userNotifications.filter(
    (n) => {
      const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            n.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filter === 'all' ? true : (filter === 'read' ? n.read : !n.read);
      return matchesSearch && matchesFilter;
    }
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedNotifications = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleMarkAllAsRead = () => {
    if (onUpdateNotifications) {
      const updated = notifications.map((n) => 
        (n.recipient === currentUser.name || n.recipient === currentUser.email) ? { ...n, read: true } : n
      );
      onUpdateNotifications(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#2A7B76] to-emerald-800 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bell className="h-5 w-5 text-emerald-200" />
            <h2 className="font-serif font-bold text-xl">Console des Notifications & Alertes Push</h2>
          </div>
          <p className="text-xs text-emerald-100">
            Journaux d'envoi WhatsApp, emails & notifications système en temps réel.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <NotificationStatsCards notifications={notifications} />

      {/* Search Bar & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Rechercher une notification..."
            value={searchTerm}
            onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'read', 'unread'] as const).map((f) => (
            <button
              key={f}
              onClick={() => {setFilter(f); setCurrentPage(1);}}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                filter === f ? 'bg-[#2A7B76] text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {f === 'all' ? 'Toutes' : (f === 'read' ? 'Lues' : 'Non lues')}
            </button>
          ))}
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Tout marquer lues
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {paginatedNotifications.map((log) => (
          <NotificationListItem key={log.id} notification={log} onSelect={() => {}} />
        ))}
        {paginatedNotifications.length === 0 && (
          <div className="text-center py-10 text-stone-500 text-sm">Aucune notification trouvée.</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="px-3 py-1 text-xs rounded-lg bg-white border border-stone-200 disabled:opacity-50"
          >
            Précédent
          </button>
          <span className="text-xs text-stone-600">Page {currentPage} sur {totalPages}</span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="px-3 py-1 text-xs rounded-lg bg-white border border-stone-200 disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
