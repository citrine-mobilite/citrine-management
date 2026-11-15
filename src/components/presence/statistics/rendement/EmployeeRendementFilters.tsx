import React from 'react';
import { CheckSquare, Search, RotateCcw } from 'lucide-react';
import { StatusFilter, DurationFilter, PeriodFilter } from './useEmployeeRendementLogic';

interface EmployeeRendementFiltersProps {
  limitToTen: boolean;
  setLimitToTen: (val: boolean) => void;
  totalFilteredCount: number;
  displayedCount: number;
  statusFilter: StatusFilter;
  setStatusFilter: (val: StatusFilter) => void;
  durationFilter: DurationFilter;
  setDurationFilter: (val: DurationFilter) => void;
  periodFilter: PeriodFilter;
  setPeriodFilter: (val: PeriodFilter) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  hasActiveFilters: boolean;
  resetFilters: () => void;
}

export const EmployeeRendementFilters: React.FC<EmployeeRendementFiltersProps> = ({
  limitToTen,
  setLimitToTen,
  totalFilteredCount,
  displayedCount,
  statusFilter,
  setStatusFilter,
  durationFilter,
  setDurationFilter,
  periodFilter,
  setPeriodFilter,
  searchQuery,
  setSearchQuery,
  hasActiveFilters,
  resetFilters,
}) => (
  <>
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 text-[#2A7B76] rounded-xl border border-emerald-100">
            <CheckSquare className="h-4 w-4" />
          </div>
          <h3 className="font-serif font-bold text-base text-stone-900">Détail des Tâches &amp; Sous-Tâches</h3>
        </div>
        <p className="text-xs text-stone-500 mt-0.5">
          Gestion fine des tâches et sous-tâches. Les modifications recalculent instantanément le rendement.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="bg-stone-100 p-1 rounded-xl flex items-center border border-stone-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setLimitToTen(true)}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              limitToTen ? 'bg-white text-[#2A7B76] shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
            title="Afficher uniquement les 10 dernières tâches récentes"
          >
            10 Dernières
          </button>
          <button
            type="button"
            onClick={() => setLimitToTen(false)}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              !limitToTen ? 'bg-white text-[#2A7B76] shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
            title="Afficher la totalité des tâches de ce collaborateur"
          >
            Toutes ({totalFilteredCount})
          </button>
        </div>
      </div>
    </div>

    <div className="bg-stone-50/80 p-4 rounded-2xl border border-stone-200/80 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
        <div>
          <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Statut</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="w-full bg-white border border-stone-200 rounded-xl px-3 py-1.5 font-bold text-stone-800 outline-none cursor-pointer focus:border-[#2A7B76]"
          >
            <option value="all">Tous les statuts</option>
            <option value="todo">À faire</option>
            <option value="in_progress">En cours</option>
            <option value="pending_validation">En attente / révision</option>
            <option value="blocked">Bloquée</option>
            <option value="completed">Terminée</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Durée estimée</label>
          <select
            value={durationFilter}
            onChange={(e) => setDurationFilter(e.target.value as DurationFilter)}
            className="w-full bg-white border border-stone-200 rounded-xl px-3 py-1.5 font-bold text-stone-800 outline-none cursor-pointer focus:border-[#2A7B76]"
          >
            <option value="all">Toutes durées</option>
            <option value="short">Rapide (&lt; 2h)</option>
            <option value="medium">Moyenne (2h à 5h)</option>
            <option value="long">Longue (&gt; 5h)</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Période</label>
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
            className="w-full bg-white border border-stone-200 rounded-xl px-3 py-1.5 font-bold text-stone-800 outline-none cursor-pointer focus:border-[#2A7B76]"
          >
            <option value="all">Toutes les dates</option>
            <option value="today">Aujourd'hui</option>
            <option value="week">7 derniers jours</option>
            <option value="month">Ce mois-ci (30j)</option>
            <option value="quarter">3 derniers mois</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Rechercher</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Mot-clé, titre..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-stone-200 rounded-xl font-medium text-xs text-stone-900 outline-none focus:border-[#2A7B76]"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 text-[11px] text-stone-500">
        <span>
          Affichage de <strong className="text-stone-900 font-bold">{displayedCount}</strong> tâche(s)
          {limitToTen && totalFilteredCount > 10 && ` (sur les ${totalFilteredCount} correspondantes)`}
        </span>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-[#2A7B76] font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Réinitialiser les filtres</span>
          </button>
        )}
      </div>
    </div>
  </>
);
