import React from 'react';
import {
  CalendarDays,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Edit3,
  Plus,
  Compass,
  Download,
  LayoutList,
  LayoutGrid,
  RotateCcw,
  X,
} from 'lucide-react';
import { LeaveStatus, LeaveType, LEAVE_TYPE_LABELS } from '../../types/leaveTypes';
import { HumaanLeaves } from '../illustrations/HumaanIllustrations';
import { LeaveSortOption } from './useLeaveManagementLogic';

interface LeaveStats {
  missions: number;
  activeMissions: number;
  pending: number;
  approved: number;
  modified: number;
  terminee: number;
  rejected: number;
  totalDaysApproved: number;
  total: number;
}

interface LeaveManagementHeaderAndFiltersProps {
  stats: LeaveStats;
  categoryFilter: 'all' | 'missions' | 'leaves';
  onChangeCategory: (c: 'all' | 'missions' | 'leaves') => void;
  statusFilter: 'all' | LeaveStatus;
  onChangeStatus: (s: 'all' | LeaveStatus) => void;
  leaveTypeFilter: 'all' | LeaveType;
  onChangeLeaveType: (t: 'all' | LeaveType) => void;
  departmentFilter: string;
  onChangeDepartment: (d: string) => void;
  availableDepartments: string[];
  monthFilter: string;
  onChangeMonth: (m: string) => void;
  availableMonths: string[];
  sortBy: LeaveSortOption;
  onChangeSort: (s: LeaveSortOption) => void;
  viewMode: 'table' | 'cards';
  onChangeViewMode: (m: 'table' | 'cards') => void;
  searchQuery: string;
  onChangeSearch: (q: string) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  onExportCsv: () => void;
  onOpenCreateModal: () => void;
}

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  if (!y || !m) return ym;
  return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

export const LeaveManagementHeaderAndFilters: React.FC<LeaveManagementHeaderAndFiltersProps> = ({
  stats,
  categoryFilter,
  onChangeCategory,
  statusFilter,
  onChangeStatus,
  leaveTypeFilter,
  onChangeLeaveType,
  departmentFilter,
  onChangeDepartment,
  availableDepartments,
  monthFilter,
  onChangeMonth,
  availableMonths,
  sortBy,
  onChangeSort,
  viewMode,
  onChangeViewMode,
  searchQuery,
  onChangeSearch,
  hasActiveFilters,
  onResetFilters,
  onExportCsv,
  onOpenCreateModal,
}) => {
  const kpiCards: Array<{
    id: string;
    label: string;
    value: number;
    sub?: string;
    icon: React.ReactNode;
    iconBg: string;
    isActive: boolean;
    onClick: () => void;
  }> = [
    {
      id: 'pending',
      label: 'En attente',
      value: stats.pending,
      sub: 'À arbitrer',
      icon: <Clock className="h-4 w-4" />,
      iconBg: 'bg-amber-50 text-amber-700 border-amber-200/70',
      isActive: statusFilter === 'pending',
      onClick: () => onChangeStatus(statusFilter === 'pending' ? 'all' : 'pending'),
    },
    {
      id: 'approved',
      label: 'Validées',
      value: stats.approved,
      sub: 'Accordées',
      icon: <CheckCircle2 className="h-4 w-4" />,
      iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
      isActive: statusFilter === 'approved',
      onClick: () => onChangeStatus(statusFilter === 'approved' ? 'all' : 'approved'),
    },
    {
      id: 'modified',
      label: 'Ajustées',
      value: stats.modified,
      sub: 'Durée modifiée',
      icon: <Edit3 className="h-4 w-4" />,
      iconBg: 'bg-indigo-50 text-indigo-700 border-indigo-200/70',
      isActive: statusFilter === 'modified',
      onClick: () => onChangeStatus(statusFilter === 'modified' ? 'all' : 'modified'),
    },
    {
      id: 'missions',
      label: 'Missions',
      value: stats.missions,
      sub: `${stats.activeMissions} active${stats.activeMissions > 1 ? 's' : ''}`,
      icon: <Compass className="h-4 w-4" />,
      iconBg: 'bg-teal-50 text-[#2A7B76] border-teal-200/70',
      isActive: categoryFilter === 'missions',
      onClick: () => onChangeCategory(categoryFilter === 'missions' ? 'all' : 'missions'),
    },
    {
      id: 'rejected',
      label: 'Refusées',
      value: stats.rejected,
      sub: 'Non retenues',
      icon: <XCircle className="h-4 w-4" />,
      iconBg: 'bg-rose-50 text-rose-700 border-rose-200/70',
      isActive: statusFilter === 'rejected',
      onClick: () => onChangeStatus(statusFilter === 'rejected' ? 'all' : 'rejected'),
    },
  ];

  return (
    <>
      <div className="bg-gradient-to-r from-[#2A7B76] via-[#20635F] to-emerald-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="space-y-1.5 z-10 text-center md:text-left">
          <div className="flex items-center gap-2.5 justify-center md:justify-start">
            <div className="p-2 bg-white/10 backdrop-blur-xs rounded-xl border border-white/15">
              <CalendarDays className="h-5 w-5 text-emerald-200" />
            </div>
            <h2 className="font-serif font-bold text-xl md:text-2xl tracking-tight">
              Gestion des Congés, Permissions & Missions
            </h2>
          </div>
          <p className="text-xs text-emerald-100/90">
            <span className="font-mono tabular-nums font-bold text-white">{stats.total}</span> dossier{stats.total > 1 ? 's' : ''} au registre
            <span className="mx-2 text-white/40">·</span>
            <span className="font-mono tabular-nums font-bold text-white">{stats.totalDaysApproved}</span> jour{stats.totalDaysApproved > 1 ? 's' : ''} accordé{stats.totalDaysApproved > 1 ? 's' : ''}
          </p>
        </div>

        <div className="hidden lg:block shrink-0 z-10">
          <HumaanLeaves className="w-36 h-24 drop-shadow-md" />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center justify-center md:justify-end gap-2 shrink-0 z-10 w-full sm:w-auto">
          <button
            type="button"
            onClick={onExportCsv}
            className="px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-2xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            title="Exporter la liste filtrée au format CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exporter CSV</span>
          </button>

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="px-4 py-2.5 bg-white text-[#2A7B76] hover:bg-emerald-50 rounded-2xl text-xs font-bold transition shadow-md cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 active:scale-98"
          >
            <Plus className="h-4 w-4 text-[#2A7B76]" />
            <span>Créer un congé</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpiCards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={card.onClick}
            className={`text-left bg-white p-3.5 rounded-2xl border transition flex items-center gap-3 cursor-pointer ${
              card.isActive
                ? 'border-[#2A7B76] ring-2 ring-[#2A7B76]/15 bg-emerald-50/20'
                : 'border-stone-200 hover:border-stone-300'
            }`}
          >
            <div className={`p-2.5 rounded-xl border shrink-0 ${card.iconBg}`}>{card.icon}</div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-stone-500 block truncate">
                {card.label}
              </span>
              <div className="flex items-baseline gap-2">
                <h3 className="text-lg font-bold font-mono tabular-nums text-stone-900">
                  {card.value}
                </h3>
                {card.sub && (
                  <span className="text-[10px] text-stone-400 truncate">{card.sub}</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-stone-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl overflow-x-auto">
            <button
              type="button"
              onClick={() => onChangeCategory('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap shrink-0 cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Toutes ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => onChangeCategory('leaves')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap shrink-0 cursor-pointer inline-flex items-center gap-1.5 ${
                categoryFilter === 'leaves'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-[#2A7B76]" />
              <span>Congés & Permissions ({stats.total - stats.missions})</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeCategory('missions')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap shrink-0 cursor-pointer inline-flex items-center gap-1.5 ${
                categoryFilter === 'missions'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-[#2A7B76]" />
              <span>Missions ({stats.missions})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
            <div className="relative flex-1 sm:w-64">
              <Search className="h-3.5 w-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onChangeSearch(e.target.value)}
                placeholder="Rechercher nom, motif, service..."
                className="w-full pl-8 pr-7 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#2A7B76]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onChangeSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200 shrink-0">
              <button
                type="button"
                onClick={() => onChangeViewMode('table')}
                title="Vue Tableau compact (recommandé)"
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0 ${
                  viewMode === 'table'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <LayoutList className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Tableau</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeViewMode('cards')}
                title="Vue Cartes détaillées"
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0 ${
                  viewMode === 'cards'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Cartes</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100 text-xs">
          <select
            value={statusFilter}
            onChange={(e) => onChangeStatus(e.target.value as 'all' | LeaveStatus)}
            className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-stone-800 focus:outline-none focus:border-[#2A7B76] cursor-pointer"
            aria-label="Filtrer par statut"
          >
            <option value="all">Tous les statuts ({stats.total})</option>
            <option value="pending">En attente ({stats.pending})</option>
            <option value="approved">Validées ({stats.approved})</option>
            <option value="modified">Durée ajustée ({stats.modified})</option>
            <option value="terminee">Missions terminées ({stats.terminee})</option>
            <option value="rejected">Refusées ({stats.rejected})</option>
          </select>

          <select
            value={leaveTypeFilter}
            onChange={(e) => onChangeLeaveType(e.target.value as 'all' | LeaveType)}
            className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-stone-800 focus:outline-none focus:border-[#2A7B76] cursor-pointer max-w-[200px]"
            aria-label="Filtrer par type d'absence"
          >
            <option value="all">Tous les types</option>
            {(Object.keys(LEAVE_TYPE_LABELS) as LeaveType[]).map((key) => (
              <option key={key} value={key}>
                {LEAVE_TYPE_LABELS[key].label}
              </option>
            ))}
          </select>

          {availableDepartments.length > 0 && (
            <select
              value={departmentFilter}
              onChange={(e) => onChangeDepartment(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-stone-800 focus:outline-none focus:border-[#2A7B76] cursor-pointer"
              aria-label="Filtrer par service"
            >
              <option value="all">Tous les services</option>
              {availableDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          )}

          {availableMonths.length > 0 && (
            <select
              value={monthFilter}
              onChange={(e) => onChangeMonth(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-stone-800 focus:outline-none focus:border-[#2A7B76] cursor-pointer capitalize"
              aria-label="Filtrer par mois"
            >
              <option value="all">Toutes les périodes</option>
              {availableMonths.map((ym) => (
                <option key={ym} value={ym}>
                  {formatMonthLabel(ym)}
                </option>
              ))}
            </select>
          )}

          <select
            value={sortBy}
            onChange={(e) => onChangeSort(e.target.value as LeaveSortOption)}
            className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-stone-800 focus:outline-none focus:border-[#2A7B76] cursor-pointer"
            aria-label="Trier les demandes"
          >
            <option value="pending_first">Tri : En attente en priorité</option>
            <option value="recent">Tri : Plus récentes</option>
            <option value="start_desc">Tri : Date de début</option>
            <option value="duration_desc">Tri : Durée décroissante</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#2A7B76] hover:bg-emerald-50 border border-emerald-200/70 inline-flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0 ml-auto"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Réinitialiser</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};
