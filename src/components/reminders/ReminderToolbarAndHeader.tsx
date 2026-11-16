import React from 'react';
import {
  Bell,
  Plus,
  Search,
  LayoutGrid,
  ListOrdered,
  Filter,
  FileText,
  Repeat,
} from 'lucide-react';
import { ReminderCategory, ReminderRoutineType } from '../../types';
import { REMINDER_CATEGORY_META, ROUTINE_TYPE_META } from '../../services/reminderService';

interface ReminderToolbarAndHeaderProps {
  activeSection: 'deadlines' | 'routines';
  setActiveSection: (section: 'deadlines' | 'routines') => void;
  deadlinesCount: number;
  routinesCount: number;
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
  routineTypeFilter: 'all' | ReminderRoutineType;
  setRoutineTypeFilter: (v: 'all' | ReminderRoutineType) => void;
  routineStatusFilter: 'all' | 'active' | 'paused';
  setRoutineStatusFilter: (v: 'all' | 'active' | 'paused') => void;
}

export const ReminderToolbarAndHeader: React.FC<ReminderToolbarAndHeaderProps> = ({
  activeSection,
  setActiveSection,
  deadlinesCount,
  routinesCount,
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
  routineTypeFilter,
  setRoutineTypeFilter,
  routineStatusFilter,
  setRoutineStatusFilter,
}) => {
  const isRoutines = activeSection === 'routines';

  return (
    <>
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/85 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200/70 text-[#2A7B76] flex items-center justify-center shrink-0">
              {isRoutines ? <Repeat className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-stone-950 tracking-tight">
                {isRoutines
                  ? 'Rituels & Rappels Récurrents'
                  : 'Échéances, Documents & Fiscalité'}
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                {isRoutines
                  ? 'Planifiez vos réunions récurrentes (ex: Lun · Mer · Ven à 09h00), points d’équipe et rappels push.'
                  : "Suivi des cartes grises, impôts périodiques, salaires et contrats — avec alerte sur l'accueil avant expiration."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="bg-[#2A7B76] hover:bg-[#226763] text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer active:scale-98 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>
              {isRoutines ? 'Créer un rappel récurrent' : 'Ajouter une échéance'}
            </span>
          </button>
        </div>

        {/* Sélecteur des 2 onglets bien séparés */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1.5 bg-stone-100 rounded-2xl border border-stone-200/70 text-xs">
          <button
            type="button"
            onClick={() => setActiveSection('deadlines')}
            className={`py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeSection === 'deadlines'
                ? 'bg-white text-stone-950 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <FileText className="h-4 w-4 text-[#2A7B76]" />
            <span>Échéances &amp; Documents</span>
            <span className="font-mono tabular-nums text-[11px] px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-700">
              {deadlinesCount}
            </span>
            {actionableCount > 0 && (
              <span className="font-mono tabular-nums text-[10px] font-extrabold text-rose-700">
                ({actionableCount} urgente{actionableCount > 1 ? 's' : ''})
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('routines')}
            className={`py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeSection === 'routines'
                ? 'bg-white text-stone-950 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Repeat className="h-4 w-4 text-[#2A7B76]" />
            <span>Rituels &amp; Rappels Récurrents</span>
            <span className="font-mono tabular-nums text-[11px] px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-700">
              {routinesCount}
            </span>
          </button>
        </div>
      </div>

      {/* Barre de recherche & filtres adaptée à l'onglet actif */}
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/85 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder={
                isRoutines
                  ? 'Rechercher réunion, brief, lieu...'
                  : 'Rechercher véhicule, impôt, réf...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-stone-400 shrink-0 hidden sm:block" />
            {isRoutines ? (
              <select
                value={routineTypeFilter}
                onChange={(e) =>
                  setRoutineTypeFilter(e.target.value as 'all' | ReminderRoutineType)
                }
                className="px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-700 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none w-full sm:w-auto"
              >
                <option value="all">Tous types de rappels</option>
                {(Object.keys(ROUTINE_TYPE_META) as ReminderRoutineType[]).map((key) => (
                  <option key={key} value={key}>
                    {ROUTINE_TYPE_META[key].label}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(e.target.value as 'all' | ReminderCategory)
                }
                className="px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-700 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none w-full sm:w-auto"
              >
                <option value="all">Toutes catégories</option>
                {(Object.keys(REMINDER_CATEGORY_META) as ReminderCategory[]).map((cat) => (
                  <option key={cat} value={cat}>
                    {REMINDER_CATEGORY_META[cat].label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
          {isRoutines ? (
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200/70 text-xs">
              <button
                type="button"
                onClick={() => setRoutineStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  routineStatusFilter === 'all'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Tous
              </button>
              <button
                type="button"
                onClick={() => setRoutineStatusFilter('active')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  routineStatusFilter === 'active'
                    ? 'bg-white text-[#2A7B76] shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Actifs
              </button>
              <button
                type="button"
                onClick={() => setRoutineStatusFilter('paused')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  routineStatusFilter === 'paused'
                    ? 'bg-white text-stone-700 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                En pause
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200/70 text-xs overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
                    statusFilter === 'all'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Toutes
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('actionable')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                    statusFilter === 'actionable'
                      ? 'bg-white text-amber-800 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
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
                    statusFilter === 'upcoming'
                      ? 'bg-white text-[#2A7B76] shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  À jour
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('resolved')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
                    statusFilter === 'resolved'
                      ? 'bg-white text-emerald-800 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
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
                    viewMode === 'cards'
                      ? 'bg-white text-[#2A7B76] shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
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
                    viewMode === 'table'
                      ? 'bg-white text-[#2A7B76] shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                  title="Vue en tableau"
                >
                  <ListOrdered className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Tableau</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};
