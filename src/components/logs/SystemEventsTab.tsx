import React from 'react';
import { Search, Calendar, Clock, User, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { SessionLogItem } from './sessionLogsConstants';

interface SystemEventsTabProps {
  sessionLogs: SessionLogItem[];
  filteredSessionLogs: SessionLogItem[];
  paginatedSessionLogs: SessionLogItem[];
  searchTerm: string;
  onChangeSearch: (val: string) => void;
  sessionDateFilter: string;
  onChangeDateFilter: (val: string) => void;
  sessionLevelFilter: string;
  onChangeLevelFilter: (val: string) => void;
  sessionPage: number;
  totalSessionPages: number;
  sessionsPerPage: number;
  onChangePage: (page: number) => void;
}

export const SystemEventsTab: React.FC<SystemEventsTabProps> = ({
  sessionLogs,
  filteredSessionLogs,
  paginatedSessionLogs,
  searchTerm,
  onChangeSearch,
  sessionDateFilter,
  onChangeDateFilter,
  sessionLevelFilter,
  onChangeLevelFilter,
  sessionPage,
  totalSessionPages,
  sessionsPerPage,
  onChangePage,
}) => {
  const getLevelStyle = (level: SessionLogItem['level']) => {
    if (level === 'success') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (level === 'warning') return 'bg-amber-50 text-amber-800 border-amber-200';
    if (level === 'error') return 'bg-rose-50 text-rose-800 border-rose-200';
    return 'bg-blue-50 text-blue-800 border-blue-200';
  };

  return (
    <div className="space-y-4 animate-in fade-in">
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

      <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="h-4 w-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher une notif système..."
            value={searchTerm}
            onChange={(e) => { onChangeSearch(e.target.value); onChangePage(1); }}
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#2A7B76]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-xl text-xs text-stone-700">
            <Calendar className="h-3.5 w-3.5 text-stone-400 shrink-0" />
            <input
              type="date"
              value={sessionDateFilter}
              onChange={(e) => { onChangeDateFilter(e.target.value); onChangePage(1); }}
              className="bg-transparent text-xs font-bold text-stone-800 outline-none cursor-pointer"
            />
            {sessionDateFilter && (
              <button
                onClick={() => { onChangeDateFilter(''); onChangePage(1); }}
                className="p-0.5 hover:bg-stone-200 rounded-full text-stone-500 cursor-pointer"
                title="Effacer le filtre par date"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <select
            value={sessionLevelFilter}
            onChange={(e) => { onChangeLevelFilter(e.target.value); onChangePage(1); }}
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

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden p-4 space-y-2">
        {paginatedSessionLogs.length === 0 ? (
          <div className="py-12 text-center text-stone-400 text-xs">
            Aucun événement système trouvé avec ces critères de recherche et date.
          </div>
        ) : (
          paginatedSessionLogs.map((ev) => (
            <div key={ev.id} className="p-3.5 bg-stone-50/70 hover:bg-stone-100/80 rounded-2xl border border-stone-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getLevelStyle(ev.level)}`}>
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
                  {new Date(ev.timestamp).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}

        {filteredSessionLogs.length > 0 && (
          <div className="pt-3 px-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t border-stone-100">
            <div className="text-stone-500 text-[11px]">
              Affichage de <span className="font-bold text-stone-800">{(sessionPage - 1) * sessionsPerPage + 1}</span> à{' '}
              <span className="font-bold text-stone-800">{Math.min(sessionPage * sessionsPerPage, filteredSessionLogs.length)}</span> sur{' '}
              <span className="font-bold text-[#2A7B76]">{filteredSessionLogs.length}</span> sessions (25 par page)
            </div>
            <div className="flex items-center gap-1.5">
              <button type="button" disabled={sessionPage <= 1} onClick={() => onChangePage(Math.max(1, sessionPage - 1))} className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 font-bold flex items-center gap-1 cursor-pointer text-[11px] shadow-2xs">
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Précédent</span>
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalSessionPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} type="button" onClick={() => onChangePage(p)} className={`min-w-[30px] h-7 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${p === sessionPage ? 'bg-[#2A7B76] text-white shadow-xs' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100/80'}`}>
                    {p}
                  </button>
                ))}
              </div>
              <button type="button" disabled={sessionPage >= totalSessionPages} onClick={() => onChangePage(Math.min(totalSessionPages, sessionPage + 1))} className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 font-bold flex items-center gap-1 cursor-pointer text-[11px] shadow-2xs">
                <span>Suivant</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
