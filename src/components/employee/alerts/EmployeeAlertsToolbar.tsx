import React from 'react';
import { Bell, CheckCheck, Volume2, VolumeX, Plus, X, Search, LayoutList, LayoutGrid } from 'lucide-react';
import { PersonalAlert } from './employeeAlertsTypes';

interface EmployeeAlertsToolbarProps {
  allAlerts: PersonalAlert[];
  unreadCount: number;
  filter: 'all' | 'unread' | 'urgent' | 'task' | 'incident' | 'leaves';
  setFilter: (f: 'all' | 'unread' | 'urgent' | 'task' | 'incident' | 'leaves') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  viewDensity: 'compact' | 'detailed';
  setViewDensity: (d: 'compact' | 'detailed') => void;
  isRinging: boolean;
  onMarkAllAsRead: () => void;
  onToggleRingtone: () => void;
  onOpenCreateModal: () => void;
}

export const EmployeeAlertsToolbar: React.FC<EmployeeAlertsToolbarProps> = ({
  allAlerts,
  unreadCount,
  filter,
  setFilter,
  searchQuery,
  setSearchQuery,
  viewDensity,
  setViewDensity,
  isRinging,
  onMarkAllAsRead,
  onToggleRingtone,
  onOpenCreateModal,
}) => (
  <>
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-stone-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl shrink-0">
          <Bell className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-lg sm:text-xl font-serif font-bold text-stone-900">
              Centre de Notifications &amp; Alertes
            </h2>
            {unreadCount > 0 ? (
              <span className="bg-amber-100 text-amber-800 border border-amber-300 text-xs px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2 py-0.5 rounded-full font-semibold">
                Toutes lues ✓
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Tâches prioritaires, signalements de présence et rappels personnels
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
        <button
          type="button"
          onClick={onMarkAllAsRead}
          disabled={unreadCount === 0}
          className="px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200"
          title="Marquer toutes les alertes affichées comme lues"
        >
          <CheckCheck className="w-4 h-4 text-[#2A7B76]" />
          <span>Tout marquer lu</span>
        </button>

        <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200 text-xs">
          <button
            type="button"
            onClick={() => setViewDensity('compact')}
            title="Vue Compacte (gain de place)"
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              viewDensity === 'compact' ? 'bg-white text-stone-800 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewDensity('detailed')}
            title="Vue Détaillée"
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              viewDensity === 'detailed' ? 'bg-white text-stone-800 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleRingtone}
          className={`p-2 rounded-xl border transition cursor-pointer active:scale-95 ${
            isRinging
              ? 'bg-red-600 text-white border-red-700 animate-pulse'
              : 'bg-stone-100 hover:bg-stone-200 text-stone-600 border-stone-200'
          }`}
          title="Tester la sonnerie d'alerte continue"
        >
          {isRinging ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-amber-600" />}
        </button>

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="bg-[#2A7B76] hover:bg-[#20615d] text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Créer une alerte</span>
        </button>
      </div>
    </div>

    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
      <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-stone-100 rounded-2xl border border-stone-200 text-xs">
        {[
          { id: 'all', label: 'Toutes', count: allAlerts.length },
          { id: 'unread', label: 'Non lues', count: unreadCount },
          { id: 'urgent', label: 'Urgentes', count: allAlerts.filter((a) => a.type === 'urgent').length },
          { id: 'task', label: 'Tâches', count: allAlerts.filter((a) => a.category === 'Tâche').length },
          { id: 'incident', label: 'Pointage', count: allAlerts.filter((a) => a.category === 'Pointage').length },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id as any)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              filter === item.id ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>{item.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                filter === item.id ? 'bg-stone-100 text-stone-800' : 'bg-stone-200/70 text-stone-600'
              }`}
            >
              {item.count}
            </span>
          </button>
        ))}
      </div>

      <div className="relative sm:w-64">
        <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Rechercher une notification..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#2A7B76]"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  </>
);
