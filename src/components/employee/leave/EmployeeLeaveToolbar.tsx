import React from 'react';
import { CalendarDays, CheckCircle2, Search, X, LayoutList, LayoutGrid, Compass, Clock } from 'lucide-react';
import { LeaveType, LEAVE_TYPE_LABELS } from '../../../types';
import { EmployeeLeaveSort } from './useEmployeeLeaveLogic';

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
  leaveTypeFilter: 'all' | LeaveType;
  onChangeLeaveType: (t: 'all' | LeaveType) => void;
  sortBy: EmployeeLeaveSort;
  onChangeSort: (s: EmployeeLeaveSort) => void;
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
  leaveTypeFilter,
  onChangeLeaveType,
  sortBy,
  onChangeSort,
  searchQuery,
  onChangeSearch,
  onOpenMissionModal,
  onOpenLeaveModal,
}) => {
  return (
    <>
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xs border border-stone-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-50 text-[#2A7B76] border border-teal-100 rounded-2xl shrink-0">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-serif font-bold text-stone-900">
                Missions, Congés & Permissions
              </h2>
              {stats.pending > 0 ? (
                <span className="text-xs font-bold text-amber-700 inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="font-mono tabular-nums">{stats.pending}</span> en attente
                </span>
              ) : (
                <span className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Toutes arbitrées
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Suivi de vos ordres de mission, congés annuels et permissions ·{' '}
              <strong className="font-mono tabular-nums text-stone-800">{stats.totalDaysTaken} j</strong> accordés au total
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-between md:justify-end">
          <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200 text-xs">
            <button
              type="button"
              onClick={() => onChangeDensity('compact')}
              title="Vue Tableau compact"
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer inline-flex items-center gap-1 whitespace-nowrap shrink-0 ${
                viewDensity === 'compact' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tableau</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeDensity('detailed')}
              title="Vue Cartes détaillées"
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer inline-flex items-center gap-1 whitespace-nowrap shrink-0 ${
                viewDensity === 'detailed' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cartes</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenMissionModal}
            className="bg-gradient-to-r from-[#2A7B76] to-emerald-800 hover:from-[#23635f] hover:to-emerald-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
            title="Déposer une demande de mission professionnelle"
          >
            <Compass className="h-4 w-4" />
            <span>Demander une Mission</span>
          </button>

          <button
            type="button"
            onClick={onOpenLeaveModal}
            className="bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
            title="Déposer une demande de congé ou permission"
          >
            <CalendarDays className="h-4 w-4 text-[#2A7B76]" />
            <span>Congé / Permission</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-stone-200 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl text-xs overflow-x-auto">
            <button
              type="button"
              onClick={() => onChangeCategory('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                categoryFilter === 'all' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Toutes ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => onChangeCategory('leaves')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                categoryFilter === 'leaves' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-[#2A7B76]" />
              <span>Congés & Permissions ({stats.total - stats.missions})</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeCategory('missions')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                categoryFilter === 'missions' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-[#2A7B76]" />
              <span>Missions ({stats.missions})</span>
            </button>
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher une mission, un motif..."
              value={searchQuery}
              onChange={(e) => onChangeSearch(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#2A7B76]"
            />
            {searchQuery && (
              <button type="button" onClick={() => onChangeSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100 text-xs">
          <select
            value={filter}
            onChange={(e) => onChangeFilter(e.target.value as any)}
            className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-stone-800 focus:outline-none focus:border-[#2A7B76] cursor-pointer"
          >
            <option value="all">Tous les statuts ({stats.total})</option>
            <option value="pending">En attente ({stats.pending})</option>
            <option value="approved">Accordées ({stats.approved})</option>
            <option value="modified">Ajustées ({stats.modified})</option>
            <option value="terminee">Terminées ({stats.terminee})</option>
            <option value="rejected">Refusées ({stats.rejected})</option>
          </select>

          <select
            value={leaveTypeFilter}
            onChange={(e) => onChangeLeaveType(e.target.value as 'all' | LeaveType)}
            className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-stone-800 focus:outline-none focus:border-[#2A7B76] cursor-pointer max-w-[200px]"
          >
            <option value="all">Tous les types</option>
            {(Object.keys(LEAVE_TYPE_LABELS) as LeaveType[]).map((key) => (
              <option key={key} value={key}>
                {LEAVE_TYPE_LABELS[key].label}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => onChangeSort(e.target.value as EmployeeLeaveSort)}
            className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-stone-800 focus:outline-none focus:border-[#2A7B76] cursor-pointer ml-auto"
          >
            <option value="pending_first">Tri : En attente en priorité</option>
            <option value="recent">Tri : Plus récentes</option>
            <option value="start_desc">Tri : Date de début</option>
          </select>
        </div>
      </div>
    </>
  );
};
