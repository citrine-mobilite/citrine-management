import React from 'react';
import { CheckSquare, Search, RotateCcw } from 'lucide-react';
import {
  StatusFilter,
  DurationFilter,
  PeriodFilter,
  PriorityFilter,
  KindFilter,
  SortByFilter,
  RendementProjectOption,
} from './employeeRendementHelpers';

interface EmployeeRendementFiltersProps {
  limitToTen: boolean;
  setLimitToTen: (val: boolean) => void;
  totalFilteredCount: number;
  displayedCount: number;
  filteredSummary: { count: number; totalHours: number; completedCount: number; avgProgress: number };
  statusFilter: StatusFilter;
  setStatusFilter: (val: StatusFilter) => void;
  priorityFilter: PriorityFilter;
  setPriorityFilter: (val: PriorityFilter) => void;
  projectFilter: string;
  setProjectFilter: (val: string) => void;
  projectOptions: RendementProjectOption[];
  kindFilter: KindFilter;
  setKindFilter: (val: KindFilter) => void;
  durationFilter: DurationFilter;
  setDurationFilter: (val: DurationFilter) => void;
  periodFilter: PeriodFilter;
  setPeriodFilter: (val: PeriodFilter) => void;
  customStartDate: string;
  setCustomStartDate: (val: string) => void;
  customEndDate: string;
  setCustomEndDate: (val: string) => void;
  sortBy: SortByFilter;
  setSortBy: (val: SortByFilter) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  hasActiveFilters: boolean;
  resetFilters: () => void;
}

const SELECT_CLS =
  'w-full bg-white border border-stone-200 rounded-xl px-3 py-1.5 font-semibold text-stone-800 outline-none cursor-pointer focus:border-[#2A7B76]';
const LABEL_CLS = 'text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1';

export const EmployeeRendementFilters: React.FC<EmployeeRendementFiltersProps> = ({
  limitToTen,
  setLimitToTen,
  totalFilteredCount,
  displayedCount,
  filteredSummary,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  projectFilter,
  setProjectFilter,
  projectOptions,
  kindFilter,
  setKindFilter,
  durationFilter,
  setDurationFilter,
  periodFilter,
  setPeriodFilter,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  sortBy,
  setSortBy,
  searchQuery,
  setSearchQuery,
  hasActiveFilters,
  resetFilters,
}) => (
  <>
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-emerald-50 text-[#2A7B76] rounded-xl border border-emerald-100">
          <CheckSquare className="h-4 w-4" />
        </div>
        <h3 className="font-serif font-bold text-base text-stone-900">Détail des Tâches &amp; Sous-Tâches</h3>
      </div>

      <div className="bg-stone-100 p-1 rounded-xl flex items-center border border-stone-200 text-xs font-bold shrink-0">
        <button
          type="button"
          onClick={() => setLimitToTen(true)}
          className={`px-3 py-1 rounded-lg transition cursor-pointer ${
            limitToTen ? 'bg-white text-[#2A7B76]' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          10 Dernières
        </button>
        <button
          type="button"
          onClick={() => setLimitToTen(false)}
          className={`px-3 py-1 rounded-lg transition cursor-pointer tabular-nums ${
            !limitToTen ? 'bg-white text-[#2A7B76]' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Toutes ({totalFilteredCount})
        </button>
      </div>
    </div>

    <div className="bg-stone-50/80 p-4 rounded-2xl border border-stone-200/80 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
        <div>
          <label className={LABEL_CLS}>Statut</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className={SELECT_CLS}>
            <option value="all">Tous les statuts</option>
            <option value="todo">À faire</option>
            <option value="in_progress">En cours</option>
            <option value="pending_validation">En attente / révision</option>
            <option value="blocked">Bloquée</option>
            <option value="completed">Terminée</option>
          </select>
        </div>

        <div>
          <label className={LABEL_CLS}>Priorité</label>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)} className={SELECT_CLS}>
            <option value="all">Toutes priorités</option>
            <option value="urgent">Urgente</option>
            <option value="high">Haute</option>
            <option value="medium">Moyenne</option>
            <option value="low">Basse</option>
          </select>
        </div>

        <div>
          <label className={LABEL_CLS}>Projet / Pôle</label>
          <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className={SELECT_CLS}>
            <option value="all">Tous les projets</option>
            <option value="none">Sans projet rattaché</option>
            {projectOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL_CLS}>Nature &amp; Alerte</label>
          <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value as KindFilter)} className={SELECT_CLS}>
            <option value="all">Toutes les tâches</option>
            <option value="milestone">Jalons stratégiques uniquement</option>
            <option value="standard">Tâches courantes (hors jalons)</option>
            <option value="overdue">En retard (échéance dépassée)</option>
            <option value="blocked_or_incident">Bloquées / incidents actifs</option>
            <option value="with_subtasks">Avec sous-tâches détaillées</option>
          </select>
        </div>

        <div>
          <label className={LABEL_CLS}>Durée estimée</label>
          <select value={durationFilter} onChange={(e) => setDurationFilter(e.target.value as DurationFilter)} className={SELECT_CLS}>
            <option value="all">Toutes durées</option>
            <option value="short">Rapide (&lt; 2h)</option>
            <option value="medium">Moyenne (2h à 5h)</option>
            <option value="long">Longue (&gt; 5h)</option>
          </select>
        </div>

        <div>
          <label className={LABEL_CLS}>Période</label>
          <select value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)} className={SELECT_CLS}>
            <option value="all">Toutes les dates</option>
            <option value="today">Aujourd&apos;hui</option>
            <option value="week">7 derniers jours</option>
            <option value="month">Ce mois-ci (30j)</option>
            <option value="quarter">3 derniers mois</option>
            <option value="custom">Plage personnalisée</option>
          </select>
        </div>

        <div>
          <label className={LABEL_CLS}>Trier par</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortByFilter)} className={SELECT_CLS}>
            <option value="recent">Plus récentes d&apos;abord</option>
            <option value="priority">Priorité décroissante</option>
            <option value="progress_desc">Avancement décroissant</option>
            <option value="progress_asc">Avancement croissant</option>
            <option value="duration_desc">Charge estimée décroissante</option>
            <option value="due_date">Échéance la plus proche</option>
          </select>
        </div>

        <div>
          <label className={LABEL_CLS}>Rechercher (tâche / sous-tâche)</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Titre, jalon, sous-tâche..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-stone-200 rounded-xl font-medium text-xs text-stone-900 outline-none focus:border-[#2A7B76]"
            />
          </div>
        </div>
      </div>

      {periodFilter === 'custom' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
          <div>
            <label className={LABEL_CLS}>Date de début</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className={SELECT_CLS}
            />
          </div>
          <div>
            <label className={LABEL_CLS}>Date de fin</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className={SELECT_CLS}
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-200/70 text-[11px] text-stone-600 tabular-nums">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>
            Affichage : <strong className="text-stone-900 font-bold">{displayedCount}</strong> / {totalFilteredCount} tâche(s)
          </span>
          <span>
            Terminées : <strong className="text-emerald-700 font-bold">{filteredSummary.completedCount}</strong>
          </span>
          <span>
            Volume filtré : <strong className="text-stone-900 font-bold">{filteredSummary.totalHours}h</strong>
          </span>
          <span>
            Avancement moyen : <strong className="text-[#2A7B76] font-bold">{filteredSummary.avgProgress}%</strong>
          </span>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-[#2A7B76] font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Réinitialiser tous les filtres</span>
          </button>
        )}
      </div>
    </div>
  </>
);
