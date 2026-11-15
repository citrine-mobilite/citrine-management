import React from 'react';
import {
  Scale,
  Plus,
  Search,
  LayoutGrid,
  Table,
  ShieldAlert,
  Calendar,
  RotateCcw,
  User,
} from 'lucide-react';
import { DisciplinaryStatus, Employee } from '../../types';
import { HumaanShield } from '../illustrations/HumaanIllustrations';
import { formatEmployeeNameForSelect } from './disciplinaryHelpers';

interface DisciplinaryFilterToolbarProps {
  totalIncidentsCount: number;
  isRestricted: boolean;
  onOpenCreate: () => void;
  statusFilter: 'all' | DisciplinaryStatus;
  setStatusFilter: (v: 'all' | DisciplinaryStatus) => void;
  openCount: number;
  convoqueCount: number;
  sanctionneCount: number;
  classeCount: number;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  viewMode: 'table' | 'cards';
  setViewMode: (v: 'table' | 'cards') => void;
  severityFilter: string;
  setSeverityFilter: (v: string) => void;
  employeeFilter: string;
  setEmployeeFilter: (v: string) => void;
  periodFilter: string;
  setPeriodFilter: (v: string) => void;
  employees: Employee[];
}

export const DisciplinaryFilterToolbar: React.FC<DisciplinaryFilterToolbarProps> = ({
  totalIncidentsCount,
  isRestricted,
  onOpenCreate,
  statusFilter,
  setStatusFilter,
  openCount,
  convoqueCount,
  sanctionneCount,
  classeCount,
  searchTerm,
  setSearchTerm,
  viewMode,
  setViewMode,
  severityFilter,
  setSeverityFilter,
  employeeFilter,
  setEmployeeFilter,
  periodFilter,
  setPeriodFilter,
  employees,
}) => {
  return (
    <>
      <div className="bg-gradient-to-r from-[#2A7B76] via-[#20635F] to-emerald-950 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10 w-full md:w-auto text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2.5">
            <div className="p-2 bg-white/10 backdrop-blur-xs rounded-xl border border-white/15">
              <Scale className="h-6 w-6 text-emerald-200" />
            </div>
            <h2 className="font-serif font-bold text-2xl md:text-3xl text-white">
              Conseil de Discipline &amp; Sanctions
            </h2>
          </div>
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-xl text-xs font-semibold text-emerald-100 border border-white/15">
            <span>{totalIncidentsCount} dossier{totalIncidentsCount > 1 ? 's' : ''} au registre</span>
          </div>
        </div>

        <div className="shrink-0 z-10 hidden sm:flex items-center justify-center">
          <HumaanShield className="w-40 h-28 md:w-48 md:h-32 drop-shadow-md" />
        </div>

        {!isRestricted && (
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 shrink-0 z-10 w-full md:w-auto">
            <button
              onClick={onOpenCreate}
              className="px-5 py-2.5 bg-[#D4A82F] hover:bg-[#c39b28] text-stone-950 rounded-2xl text-xs font-extrabold transition shadow-md cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Convoquer Conseil / Consigner Fait</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: `Tous les dossiers (${totalIncidentsCount})` },
          { id: 'ouvert', label: `À instruire (${openCount})` },
          { id: 'convoque', label: `Convoqués au Conseil (${convoqueCount})` },
          { id: 'sanctionne', label: `Sanctions prononcées (${sanctionneCount})` },
          { id: 'classe', label: `Classés sans suite (${classeCount})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id as any)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
              statusFilter === tab.id
                ? 'bg-[#2A7B76] text-white shadow-sm'
                : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Rechercher par titre, motif, collaborateur, rapporteur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
            />
          </div>

          <div className="flex items-center bg-stone-100 p-1 rounded-2xl border border-stone-200 text-xs shrink-0 self-end sm:self-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Table className="h-3.5 w-3.5" /> Tableau (Conseil)
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Cartes
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100 text-xs">
          <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-stone-400" />
            <span className="text-[10px] font-bold text-stone-400">Gravité :</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent font-bold text-stone-700 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">Toutes les gravités</option>
              <option value="critique">🚨 Critique</option>
              <option value="grave">⚠️ Grave</option>
              <option value="moyen">Moyen</option>
              <option value="faible">Faible</option>
            </select>
          </div>

          {!isRestricted ? (
            <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5">
              <User className="h-3.5 w-3.5 text-stone-400" />
              <span className="text-[10px] font-bold text-stone-400">Collaborateur :</span>
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="bg-transparent font-bold text-stone-700 text-xs focus:outline-none cursor-pointer max-w-[180px]"
              >
                <option value="all">Tous les collaborateurs</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {formatEmployeeNameForSelect(emp)}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-stone-700 font-bold text-xs">
              <User className="h-3.5 w-3.5 text-stone-400" />
              <span>Mon dossier personnel</span>
            </div>
          )}

          <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5">
            <Calendar className="h-3.5 w-3.5 text-stone-400" />
            <span className="text-[10px] font-bold text-stone-400">Période :</span>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="bg-transparent font-bold text-stone-700 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">Toutes dates</option>
              <option value="this_month">Ce mois-ci</option>
              <option value="3_months">3 derniers mois</option>
              <option value="this_year">Cette année</option>
            </select>
          </div>

          {(statusFilter !== 'all' || severityFilter !== 'all' || employeeFilter !== 'all' || periodFilter !== 'all' || searchTerm) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setSeverityFilter('all');
                setEmployeeFilter('all');
                setPeriodFilter('all');
                setSearchTerm('');
              }}
              className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 font-bold transition cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Effacer filtres</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};
