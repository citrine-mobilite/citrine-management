import React from 'react';
import { Contact2, LogIn, Search, Settings, Calendar } from 'lucide-react';
import { BuildingSupervisor } from '../../services/supervisorService';
import { SearchableSelect, SelectOption } from '../common/SearchableSelect';
import { HumaanReception } from '../illustrations/HumaanIllustrations';

interface VisitorsHeaderAndFiltersProps {
  supervisorsCount: number;
  todayStr: string;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  personTypeFilter: string;
  setPersonTypeFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  dateFilter: string;
  setDateFilter: (v: string) => void;
  selectedDate: string;
  setSelectedDate: (v: string) => void;
  onOpenSupervisorsModal: () => void;
  onOpenNewModal: () => void;
  kpiSlot: React.ReactNode;
  supervisors?: BuildingSupervisor[];
}

export const VisitorsHeaderAndFilters: React.FC<VisitorsHeaderAndFiltersProps> = ({
  supervisorsCount,
  todayStr,
  searchTerm,
  setSearchTerm,
  personTypeFilter,
  setPersonTypeFilter,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  selectedDate,
  setSelectedDate,
  onOpenSupervisorsModal,
  onOpenNewModal,
  kpiSlot,
}) => {
  const typeFilterOptions: SelectOption[] = [
    { value: 'all', label: 'Tous les flux (Visiteurs & Travailleurs)' },
    { value: 'visiteur', label: '👤 Visiteurs uniquement', description: 'Visites de tiers / Rendez-vous' },
    { value: 'travailleur', label: '🔧 Travailleurs uniquement', description: 'Intervenants sous supervision' },
  ];

  const statusFilterOptions: SelectOption[] = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'sur_site', label: '🟢 Sur site (Autorisé)' },
    { value: 'attente_validation', label: '🟡 En attente accord accueil' },
    { value: 'sorti', label: '⚪ Sorti' },
    { value: 'attendu', label: '🔵 Attendu' },
    { value: 'refuse', label: '🔴 Accès refusé' },
  ];

  const dateFilterOptions: SelectOption[] = [
    { value: 'all', label: '📅 Toutes les dates' },
    { value: 'today', label: `📅 Aujourd'hui (${todayStr})` },
    { value: 'custom', label: '📅 Choisir une date précise...' },
  ];

  return (
    <>
      <div className="flex flex-col md:flex-row items-center justify-between gap-5 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-center md:justify-start gap-3 text-center md:text-left z-10">
          <div className="p-2.5 bg-[#2A7B76]/10 text-[#2A7B76] rounded-2xl border border-[#2A7B76]/20 shrink-0">
            <Contact2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h1 className="text-xl md:text-2xl font-serif font-bold text-stone-800">
                Contrôle des Accès & Sécurité du Bâtiment
              </h1>
              <span className="text-[10px] font-bold bg-amber-50 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200">
                Siège Japoma
              </span>
            </div>
          </div>
        </div>

        <div className="hidden lg:block shrink-0 z-10">
          <HumaanReception className="w-32 h-24 drop-shadow-sm" />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center justify-center md:justify-end gap-2.5 w-full sm:w-auto z-10">
          <button
            type="button"
            onClick={onOpenSupervisorsModal}
            className="w-full sm:w-auto justify-center inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-2xl transition cursor-pointer border border-stone-200 active:scale-98"
            title="Gérer les superviseurs enregistrés en base de données"
          >
            <Settings className="w-4 h-4 text-stone-500" />
            <span>Superviseurs ({supervisorsCount})</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewModal}
            className="w-full sm:w-auto justify-center inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-[#2A7B76] hover:bg-[#236863] rounded-2xl shadow-xs transition cursor-pointer active:scale-98"
          >
            <LogIn className="w-4 h-4" />
            <span>Arrivée</span>
          </button>
        </div>
      </div>

      {kpiSlot}

      <div className="bg-white p-3.5 rounded-xl border border-stone-200 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par nom, entreprise, badge, superviseur, CNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-[#2A7B76] bg-stone-50/50"
            />
          </div>

          <div className="w-full lg:w-64">
            <SearchableSelect
              options={typeFilterOptions}
              value={personTypeFilter}
              onChange={(val) => setPersonTypeFilter(String(val))}
              placeholder="Filtrer par type..."
              searchPlaceholder="Rechercher un type..."
              size="sm"
            />
          </div>

          <div className="w-full lg:w-56">
            <SearchableSelect
              options={statusFilterOptions}
              value={statusFilter}
              onChange={(val) => setStatusFilter(String(val))}
              placeholder="Filtrer par statut..."
              searchPlaceholder="Rechercher un statut..."
              size="sm"
            />
          </div>

          <div className="w-full lg:w-56">
            <SearchableSelect
              options={dateFilterOptions}
              value={dateFilter}
              onChange={(val) => setDateFilter(String(val))}
              placeholder="Filtrer par date..."
              searchPlaceholder="Date..."
              size="sm"
            />
          </div>

          {dateFilter === 'custom' && (
            <div className="flex items-center gap-1.5 bg-stone-50 px-3 py-1 rounded-xl border border-stone-200 animate-in fade-in">
              <Calendar className="w-4 h-4 text-[#2A7B76]" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs bg-transparent text-stone-800 font-semibold focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};
