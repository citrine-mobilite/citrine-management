import React from 'react';
import { CalendarDays, CheckCircle2, Search, X, LayoutList, LayoutGrid, Compass } from 'lucide-react';

interface EmployeeLeaveStats {
  missions: number;
  pending: number;
  approved: number;
  modified: number;
  terminee: number;
  rejected: number;
  totalDaysTaken: number;
  total: number;
}

interface EmployeeLeaveToolbarProps {
  stats: EmployeeLeaveStats;
  viewDensity: 'compact' | 'detailed';
  onChangeDensity: (d: 'compact' | 'detailed') => void;
  categoryFilter: 'all' | 'missions' | 'leaves';
  onChangeCategory: (c: 'all' | 'missions' | 'leaves') => void;
  filter: 'all' | 'pending' | 'approved' | 'modified' | 'terminee' | 'rejected';
  onChangeFilter: (f: 'all' | 'pending' | 'approved' | 'modified' | 'terminee' | 'rejected') => void;
  searchQuery: string;
  onChangeSearch: (q: string) => void;
  onOpenMissionModal: () => void;
  onOpenLeaveModal: () => void;
}

export const EmployeeLeaveToolbar: React.FC<EmployeeLeaveToolbarProps> = ({
  stats,
  viewDensity,
  onChangeDensity,
  categoryFilter,
  onChangeCategory,
  filter,
  onChangeFilter,
  searchQuery,
  onChangeSearch,
  onOpenMissionModal,
  onOpenLeaveModal,
}) => {
  return (
    <>
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-stone-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-50 text-[#2A7B76] border border-teal-100 rounded-2xl shrink-0">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-serif font-bold text-stone-900">
                Missions Professionnelles & Congés
              </h2>
              {stats.pending > 0 ? (
                <span className="bg-amber-100 text-amber-800 border border-amber-300 text-xs px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                  {stats.pending} en attente
                </span>
              ) : (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2 py-0.5 rounded-full font-semibold">
                  Toutes arbitrées ✓
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Demandez et suivez vos ordres de mission, déplacements extérieurs, congés payés et autorisations d'absence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-between md:justify-end">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 border border-stone-200 text-xs text-stone-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2A7B76]" />
            <span>Accordé : <strong className="font-mono text-stone-900">{stats.totalDaysTaken} j</strong></span>
          </div>

          <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200 text-xs">
            <button
              type="button"
              onClick={() => onChangeDensity('compact')}
              title="Vue Compacte (en liste synthétique)"
              className={`p-1.5 rounded-lg transition cursor-pointer ${viewDensity === 'compact' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-800'}`}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onChangeDensity('detailed')}
              title="Vue Détaillée (en cartes spatiales)"
              className={`p-1.5 rounded-lg transition cursor-pointer ${viewDensity === 'detailed' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-800'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenMissionModal}
            className="bg-gradient-to-r from-[#2A7B76] to-emerald-800 hover:from-[#23635f] hover:to-emerald-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer active:scale-95 shrink-0"
            title="Déposer une demande de mission professionnelle"
          >
            <Compass className="h-4 w-4" />
            <span>Demander une Mission</span>
          </button>

          <button
            type="button"
            onClick={onOpenLeaveModal}
            className="bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 shrink-0"
            title="Déposer une demande de congé ou permission"
          >
            <CalendarDays className="h-4 w-4 text-[#2A7B76]" />
            <span>Congé / Permission</span>
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-2xl border border-stone-200 text-xs">
            <button
              type="button"
              onClick={() => onChangeCategory('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${categoryFilter === 'all' ? 'bg-[#2A7B76] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'}`}
            >
              Toutes ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => onChangeCategory('missions')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${categoryFilter === 'missions' ? 'bg-[#2A7B76] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'}`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>🚀 Mes Missions ({stats.missions})</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeCategory('leaves')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${categoryFilter === 'leaves' ? 'bg-[#2A7B76] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'}`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>🏖️ Congés & Permissions ({stats.total - stats.missions})</span>
            </button>
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher une mission, un motif..."
              value={searchQuery}
              onChange={(e) => onChangeSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#2A7B76]"
            />
            {searchQuery && (
              <button type="button" onClick={() => onChangeSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-stone-100 rounded-2xl border border-stone-200 text-xs scrollbar-none">
          {[
            { id: 'all', label: 'Tous statuts', count: stats.total },
            { id: 'pending', label: 'En attente', count: stats.pending },
            { id: 'approved', label: 'Accordées', count: stats.approved },
            { id: 'modified', label: 'Ajustées', count: stats.modified },
            { id: 'terminee', label: '🏁 Terminées', count: stats.terminee },
            { id: 'rejected', label: 'Refusées', count: stats.rejected },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeFilter(item.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                filter === item.id ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>{item.label}</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${filter === item.id ? 'bg-stone-100 text-stone-800' : 'bg-stone-200/70 text-stone-600'}`}>
                {item.count}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
