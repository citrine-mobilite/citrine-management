import React from 'react';
import { Download, History, Plus, Search, Users } from 'lucide-react';
import { Employee } from '../../types';
import { HumaanPeople } from '../illustrations/HumaanIllustrations';

interface CollaboratorListHeaderAndFiltersProps {
  employees: Employee[];
  auditCount: number;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  teamFilter: string;
  setTeamFilter: (v: string) => void;
  managerFilter: string;
  setManagerFilter: (v: string) => void;
  roleFilter: string;
  setRoleFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  onResetPage: () => void;
  onOpenAudit: () => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
  onOpenAdd: () => void;
}

export const CollaboratorListHeaderAndFilters: React.FC<
  CollaboratorListHeaderAndFiltersProps
> = ({
  employees,
  auditCount,
  searchTerm,
  setSearchTerm,
  teamFilter,
  setTeamFilter,
  managerFilter,
  setManagerFilter,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  onResetPage,
  onOpenAudit,
  onExportExcel,
  onExportPDF,
  onOpenAdd,
}) => {
  return (
    <>
      <div className="bg-gradient-to-r from-[#2A7B76] via-[#216762] to-emerald-900 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10 w-full md:w-auto text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <Users className="h-5 w-5 text-emerald-200" />
            <h2 className="font-serif font-bold text-2xl md:text-3xl">
              Gestion des Collaborateurs & Effectifs
            </h2>
          </div>
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-xl text-xs font-semibold text-emerald-100 border border-white/15">
            <span>{employees.length} collaborateurs enregistrés</span>
          </div>
        </div>

        <div className="shrink-0 z-10 hidden sm:flex items-center justify-center">
          <HumaanPeople className="w-40 h-28 md:w-48 md:h-32 drop-shadow-md" />
        </div>

        <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 shrink-0 z-10 w-full md:w-auto">
          <button
            onClick={onOpenAudit}
            className="bg-white/15 hover:bg-white/25 border border-white/20 text-white px-3 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
            title="Historique des opérations administratives sur les comptes"
          >
            <History className="h-4 w-4 text-amber-300" />
            <span>Audit Comptes ({auditCount})</span>
          </button>
          <button
            onClick={onExportExcel}
            className="bg-white/15 hover:bg-white/25 border border-white/20 text-white px-3 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
          >
            <Download className="h-4 w-4 text-emerald-200" />
            Excel
          </button>
          <button
            onClick={onExportPDF}
            className="bg-white/15 hover:bg-white/25 border border-white/20 text-white px-3 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
          >
            <Download className="h-4 w-4 text-rose-300" />
            PDF
          </button>
          <button
            onClick={onOpenAdd}
            className="bg-[#D4A82F] hover:bg-[#c39b28] text-stone-950 px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 shadow-md transition cursor-pointer active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Créer un collaborateur
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email, tél..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              onResetPage();
            }}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <select
            value={teamFilter}
            onChange={(e) => {
              setTeamFilter(e.target.value);
              onResetPage();
            }}
            className="px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-medium focus:ring-2 focus:ring-[#2A7B76] outline-none cursor-pointer"
          >
            <option value="all">Toutes les équipes</option>
            <option value="Équipe IT & Développement">Équipe IT & Développement</option>
            <option value="Équipe Commerciale & Partenariats">Équipe Commerciale & Partenariats</option>
            <option value="Équipe RH, Paie & Administration">Équipe RH, Paie & Admin</option>
            <option value="Équipe Finance & Comptabilité">Équipe Finance</option>
            <option value="Équipe Support & Opérations">Équipe Support</option>
          </select>

          <select
            value={managerFilter}
            onChange={(e) => {
              setManagerFilter(e.target.value);
              onResetPage();
            }}
            className="px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-medium focus:ring-2 focus:ring-[#2A7B76] outline-none cursor-pointer"
          >
            <option value="all">Tous les responsables</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                Resp: {emp.name}
              </option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              onResetPage();
            }}
            className="px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-medium focus:ring-2 focus:ring-[#2A7B76] outline-none cursor-pointer"
          >
            <option value="all">Tous les rôles</option>
            <option value="employé">Employé</option>
            <option value="gestionnaire de projet">Gestionnaire de Projet</option>
            <option value="stagiaire">Stagiaire</option>
            <option value="informaticien">Informaticien</option>
            <option value="comptable">Comptable</option>
            <option value="rh">RH</option>
            <option value="finance">Finance</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              onResetPage();
            }}
            className="px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-medium focus:ring-2 focus:ring-[#2A7B76] outline-none cursor-pointer"
          >
            <option value="all">Tous les statuts</option>
            <option value="en_poste">En poste</option>
            <option value="en_conge">En congés</option>
            <option value="en_permission">Permission</option>
            <option value="en_mission">En mission</option>
            <option value="maladie">Maladie</option>
            <option value="suspendu">Suspendu</option>
            <option value="parti">Départ</option>
            <option value="renvoye">Renvoyé</option>
          </select>
        </div>
      </div>
    </>
  );
};
