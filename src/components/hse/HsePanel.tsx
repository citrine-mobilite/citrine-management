import React from 'react';
import { ShieldAlert, AlertTriangle, Search } from 'lucide-react';
import { AppUser, Employee } from '../../types';
import { HseKpiBanner } from './HseKpiBanner';
import { HseIncidentsGrid } from './HseIncidentsGrid';
import { HseDetailModal } from './HseDetailModal';
import { HseIncidentModal } from './HseIncidentModal';
import { SearchableSelect, SelectOption } from '../common/SearchableSelect';
import { HumaanSecurity } from '../illustrations/HumaanIllustrations';
import { useHsePanelLogic } from './useHsePanelLogic';

interface HsePanelProps {
  currentUser?: AppUser | null;
  employees: Employee[];
  onAddNotification?: (n: any) => void;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}

const SITE_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Tous les sites' },
  { value: 'Base Japoma - Carrefour Matango', label: 'Base Japoma - Carrefour Matango' },
];

const SEVERITY_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Toutes gravités' },
  { value: 'faible', label: 'Faible' },
  { value: 'modere', label: 'Modéré' },
  { value: 'grave', label: 'Grave' },
  { value: 'critique', label: 'Critique' },
];

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'signale', label: 'Signalé' },
  { value: 'en_cours_analyse', label: "En cours d'analyse" },
  { value: 'actions_lancees', label: 'Actions lancées' },
  { value: 'cloture', label: 'Clôturé' },
];

export const HsePanel: React.FC<HsePanelProps> = ({
  currentUser,
  employees = [],
  onAddNotification,
  showToast,
}) => {
  const logic = useHsePanelLogic({ currentUser, onAddNotification, showToast });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="bg-gradient-to-r from-amber-950 via-[#2A7B76] to-emerald-950 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10 w-full md:w-auto text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2.5">
            <div className="p-2.5 bg-white/10 backdrop-blur-xs text-amber-300 rounded-2xl border border-white/15">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-white">Registre Hygiène, Sécurité &amp; Environnement (HSE)</h1>
          </div>
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-xl text-xs font-semibold text-emerald-100 border border-white/15">
            <span>{logic.incidents.length} événement{logic.incidents.length > 1 ? 's' : ''} consigné{logic.incidents.length > 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="shrink-0 z-10 hidden sm:flex items-center justify-center">
          <HumaanSecurity className="w-40 h-28 md:w-48 md:h-32 drop-shadow-md" />
        </div>

        <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 shrink-0 z-10 w-full md:w-auto">
          <button
            onClick={() => {
              logic.setEditingIncident(null);
              logic.setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold text-stone-950 bg-[#D4A82F] hover:bg-[#c39b28] rounded-2xl shadow-md transition cursor-pointer active:scale-95"
          >
            <AlertTriangle className="w-4 h-4 text-stone-950" />
            <span>Déclarer un Incident / Danger</span>
          </button>
        </div>
      </div>

      <HseKpiBanner
        daysWithoutLostTimeAccident={logic.daysWithoutLostTimeAccident}
        totalIncidentsCount={logic.incidents.length}
        nearMissesCount={logic.nearMissesCount}
        resolutionRate={logic.resolutionRate}
        completedActionsCount={logic.completedActionsCount}
        totalActionsCount={logic.allActionsCount}
        closedIncidentsCount={logic.closedCount}
      />

      <div className="flex flex-col md:flex-row items-center gap-3 bg-white p-3.5 rounded-xl border border-stone-200">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par référence, description, zone, victime, titre..."
            value={logic.searchTerm}
            onChange={(e) => logic.setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-[#2A7B76]"
          />
        </div>

        <div className="w-full md:w-48">
          <SearchableSelect options={SITE_OPTIONS} value={logic.selectedSite} onChange={(val) => logic.setSelectedSite(String(val))} placeholder="Filtrer par site..." />
        </div>

        <div className="w-full md:w-44">
          <SearchableSelect options={SEVERITY_OPTIONS} value={logic.selectedSeverity} onChange={(val) => logic.setSelectedSeverity(String(val))} placeholder="Filtrer par gravité..." />
        </div>

        <div className="w-full md:w-44">
          <SearchableSelect options={STATUS_OPTIONS} value={logic.selectedStatus} onChange={(val) => logic.setSelectedStatus(String(val))} placeholder="Filtrer par statut..." />
        </div>
      </div>

      <HseIncidentsGrid incidents={logic.filteredIncidents} onSelectIncident={logic.setSelectedIncident} />

      {logic.selectedIncident && (
        <HseDetailModal
          incident={logic.selectedIncident}
          isAdminOrManager={logic.isAdminOrManager}
          onClose={() => logic.setSelectedIncident(null)}
          onToggleAction={logic.handleToggleAction}
          onAddAction={logic.handleAddAction}
          onEdit={() => {
            logic.setEditingIncident(logic.selectedIncident);
            logic.setIsModalOpen(true);
          }}
          onDelete={async () => {
            if (logic.selectedIncident) await logic.handleDeleteIncident(logic.selectedIncident.id);
          }}
        />
      )}

      {logic.isModalOpen && (
        <HseIncidentModal
          initialIncident={logic.editingIncident}
          employees={employees}
          currentUser={currentUser}
          onClose={() => {
            logic.setIsModalOpen(false);
            logic.setEditingIncident(null);
          }}
          onSave={logic.handleSaveIncident}
        />
      )}
    </div>
  );
};

export default HsePanel;
