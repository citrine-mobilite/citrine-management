import React from 'react';
import { Download, Mail } from 'lucide-react';
import { Employee } from '../../types';

interface PresenceFiltersBarProps {
  isRestricted: boolean;
  myEmp?: Employee;
  collaboratorFilter: string;
  onChangeCollaboratorFilter: (val: string) => void;
  filterSelectableEmployees: Employee[];
  onOpenWeeklyRecap: () => void;
  onExportExcel: () => void;
}

export const PresenceFiltersBar: React.FC<PresenceFiltersBarProps> = ({
  isRestricted,
  myEmp,
  collaboratorFilter,
  onChangeCollaboratorFilter,
  filterSelectableEmployees,
  onOpenWeeklyRecap,
  onExportExcel,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
      <div className="flex items-center gap-2 w-full md:w-auto flex-1">
        <div className="space-y-1 flex-1">
          <label className="block text-[10px] text-stone-400 font-extrabold uppercase">Collaborateur :</label>
          {!isRestricted ? (
            <select
              value={collaboratorFilter}
              onChange={(e) => onChangeCollaboratorFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-stone-200 bg-stone-50 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#2A7B76] outline-none"
            >
              <option value="all">Tous les collaborateurs</option>
              {filterSelectableEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          ) : (
            <div className="w-full px-3 py-1.5 border border-stone-200 bg-stone-50 rounded-xl text-xs font-bold text-stone-800">
              👤 {myEmp?.name || 'Mon pointage personnel'}
            </div>
          )}
        </div>

        <div className="space-y-1 flex-1">
          <label className="block text-[10px] text-stone-400 font-extrabold uppercase">Période :</label>
          <span className="block px-3 py-1.5 border border-stone-200 bg-stone-50 text-stone-500 rounded-xl text-xs font-semibold">
            Aujourd'hui uniquement
          </span>
        </div>
      </div>

      <div className="shrink-0 pt-4 md:pt-0 w-full md:w-auto flex flex-wrap items-center gap-2">
        {!isRestricted && (
          <button
            onClick={onOpenWeeklyRecap}
            className="w-full md:w-auto px-4 py-2 bg-gradient-to-r from-[#164e4b] to-[#2A7B76] text-white hover:from-[#0f3e3b] hover:to-[#20635F] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-3xs"
            title="Envoyer par e-mail le récapitulatif des présences de la semaine en cours (aux responsables, avec tous les collaborateurs en copie)"
          >
            <Mail className="h-4 w-4 text-emerald-200" />
            <span>Envoyer Récap. Semaine (en cours)</span>
          </button>
        )}
        <button
          onClick={onExportExcel}
          className="w-full md:w-auto px-4 py-2 bg-emerald-50 text-emerald-800 hover:bg-[#2A7B76] hover:text-white border border-emerald-100 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <Download className="h-4 w-4" />
          <span>Exporter vers Excel (.xls)</span>
        </button>
      </div>
    </div>
  );
};
