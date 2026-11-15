import React from 'react';
import { Bell, Plus, Search, LayoutGrid, ListOrdered, Filter } from 'lucide-react';
import { ReminderCategory } from '../../types';
import { REMINDER_CATEGORY_META } from '../../services/reminderService';

interface ReminderToolbarAndHeaderProps {
  onOpenCreateModal: () => void;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  categoryFilter: 'all' | ReminderCategory;
  setCategoryFilter: (v: 'all' | ReminderCategory) => void;
  statusFilter: 'all' | 'actionable' | 'upcoming' | 'resolved';
  setStatusFilter: (v: 'all' | 'actionable' | 'upcoming' | 'resolved') => void;
  actionableCount: number;
  viewMode: 'cards' | 'table';
  setViewMode: (v: 'cards' | 'table') => void;
}

export const ReminderToolbarAndHeader: React.FC<ReminderToolbarAndHeaderProps> = ({
  onOpenCreateModal,
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  actionableCount,
  viewMode,
  setViewMode,
}) => {
  return (
    <>
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/85 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200/70 text-[#2A7B76] flex items-center justify-center shrink-0">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-stone-950 tracking-tight">
              Échéances, Documents & Rappels
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Suivi des cartes grises, impôts trimestriels ou annuels, contrats et rappels horaires —
              avec alerte sur la page d&apos;accueil 7 à 14 jours avant expiration.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="bg-[#2A7B76] hover:bg-[#226763] text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer active:scale-98 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Ajouter une échéance / alerte</span>
        </button>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/85 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Rechercher véhicule, impôt, réf..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-stone-400 shrink-0 hidden sm:block" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as 'all' | ReminderCategory)}
              className="px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-700 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none w-full sm:w-auto"
            >
              <option value="all">Toutes catégories</option>
              {(Object.keys(REMINDER_CATEGORY_META) as ReminderCategory[]).map((cat) => (
                <option key={cat} value={cat}>
                  {REMINDER_CATEGORY_META[cat].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200/70 text-xs overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
                statusFilter === 'all' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Toutes
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('actionable')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                statusFilter === 'actionable' ? 'bg-white text-amber-800 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>À traiter</span>
              {actionableCount > 0 && (
                <span className="font-mono tabular-nums text-[10px] text-rose-700 font-extrabold">
                  ({actionableCount})
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('upcoming')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
                statusFilter === 'upcoming' ? 'bg-white text-[#2A7B76] shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              À jour
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('resolved')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
                statusFilter === 'resolved' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Validées
            </button>
          </div>

          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200/70 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-[#2A7B76] shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Vue en cartes"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Cartes</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-[#2A7B76] shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Vue en tableau"
            >
              <ListOrdered className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Tableau</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
