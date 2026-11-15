import React from 'react';
import { CalendarDays, Search, CheckCircle2, XCircle, Clock, Edit3, Calendar, Plus, Compass, Flag } from 'lucide-react';
import { LeaveStatus } from '../../types/leaveTypes';
import { HumaanLeaves } from '../illustrations/HumaanIllustrations';

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
  searchQuery: string;
  onChangeSearch: (q: string) => void;
  onOpenCreateModal: () => void;
}

export const LeaveManagementHeaderAndFilters: React.FC<LeaveManagementHeaderAndFiltersProps> = ({
  stats,
  categoryFilter,
  onChangeCategory,
  statusFilter,
  onChangeStatus,
  searchQuery,
  onChangeSearch,
  onOpenCreateModal,
}) => {
  return (
    <>
      <div className="bg-gradient-to-r from-[#2A7B76] via-[#20635F] to-emerald-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 z-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs text-emerald-100 font-semibold shadow-2xs">
            <Calendar className="h-3.5 w-3.5 text-[#F3D079]" />
            <span>Gestion des Absences & Missions</span>
          </div>
          <div className="flex items-center gap-2.5 justify-center md:justify-start">
            <div className="p-2 bg-white/10 backdrop-blur-xs rounded-xl border border-white/15">
              <CalendarDays className="h-5 w-5 text-emerald-200" />
            </div>
            <h2 className="font-serif font-bold text-xl md:text-2xl">
              Gestion des Congés & Permissions
            </h2>
          </div>
        </div>

        <div className="hidden lg:block shrink-0 z-10">
          <HumaanLeaves className="w-40 h-28 drop-shadow-md" />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center justify-center md:justify-end gap-2.5 shrink-0 z-10 w-full sm:w-auto">
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="w-full sm:w-auto justify-center px-4 py-2.5 bg-white text-[#2A7B76] hover:bg-emerald-50 rounded-2xl text-xs font-bold transition shadow-md cursor-pointer flex items-center gap-2 shrink-0 active:scale-98"
          >
            <Plus className="h-4 w-4 text-[#2A7B76]" />
            <span>Créer un congé</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-3xs flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-100"><Clock className="h-4 w-4" /></div>
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">En attente</span>
            <h3 className="text-base font-bold font-serif text-stone-900">{stats.pending}</h3>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-3xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100"><CheckCircle2 className="h-4 w-4" /></div>
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Validées</span>
            <h3 className="text-base font-bold font-serif text-stone-900">{stats.approved}</h3>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-3xs flex items-center gap-3">
          <div className="p-2.5 bg-teal-50 text-[#2A7B76] rounded-xl border border-teal-100"><Compass className="h-4 w-4" /></div>
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">🚀 Missions</span>
            <h3 className="text-base font-bold font-serif text-stone-900">{stats.missions}</h3>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-3xs flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100"><Edit3 className="h-4 w-4" /></div>
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Ajustées</span>
            <h3 className="text-base font-bold font-serif text-stone-900">{stats.modified}</h3>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-3xs flex items-center gap-3">
          <div className="p-2.5 bg-stone-100 text-stone-700 rounded-xl border border-stone-200"><Flag className="h-4 w-4 text-emerald-700" /></div>
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">🏁 Terminées</span>
            <h3 className="text-base font-bold font-serif text-stone-900">{stats.terminee}</h3>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-3xs flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl border border-rose-100"><XCircle className="h-4 w-4" /></div>
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Refusées</span>
            <h3 className="text-base font-bold font-serif text-stone-900">{stats.rejected}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-3xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl">
          <button
            onClick={() => onChangeCategory('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer ${categoryFilter === 'all' ? 'bg-[#2A7B76] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'}`}
          >
            Toutes les demandes ({stats.total})
          </button>
          <button
            onClick={() => onChangeCategory('missions')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${categoryFilter === 'missions' ? 'bg-[#2A7B76] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'}`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>🚀 Missions Professionnelles ({stats.missions})</span>
          </button>
          <button
            onClick={() => onChangeCategory('leaves')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${categoryFilter === 'leaves' ? 'bg-[#2A7B76] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'}`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>🏖️ Congés & Permissions ({stats.total - stats.missions})</span>
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="h-3.5 w-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onChangeSearch(e.target.value)}
            placeholder="Rechercher par nom, motif ou lieu..."
            className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#2A7B76]"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl overflow-x-auto">
        {[
          { id: 'all', label: `Tous statuts (${stats.total})` },
          { id: 'pending', label: `En attente (${stats.pending})` },
          { id: 'approved', label: `Validées (${stats.approved})` },
          { id: 'modified', label: `Ajustées (${stats.modified})` },
          { id: 'terminee', label: `🏁 Terminées (${stats.terminee})` },
          { id: 'rejected', label: `Refusées (${stats.rejected})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChangeStatus(tab.id as any)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer ${statusFilter === tab.id ? 'bg-[#2A7B76] text-white shadow-2xs' : 'text-stone-500 hover:text-stone-800'}`}
            title={`Filtrer par statut : ${tab.label}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </>
  );
};
