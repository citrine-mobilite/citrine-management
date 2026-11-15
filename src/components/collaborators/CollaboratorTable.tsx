import React from 'react';
import { Eye, Pencil } from 'lucide-react';
import { Employee, EmployeeStatus } from '../../types';
import { getEmployeeSoftColor } from '../../utils/colorUtils';
import {
  COLLABORATOR_STATUS_MAP,
  formatCollaboratorXAF,
  getEmployeeStatusKey,
} from './collaboratorConstants';

interface CollaboratorTableProps {
  paginatedEmployees: Employee[];
  allEmployees: Employee[];
  startIndex: number;
  itemsPerPage: number;
  totalItems: number;
  currentPage: number;
  totalPages: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  onStatusChangeQuick: (empId: string, newStatus: Employee['status']) => void;
  onSelectDetail: (empId: string) => void;
  onEdit: (emp: Employee) => void;
}

export const CollaboratorTable: React.FC<CollaboratorTableProps> = ({
  paginatedEmployees,
  allEmployees,
  startIndex,
  itemsPerPage,
  totalItems,
  currentPage,
  totalPages,
  setCurrentPage,
  onStatusChangeQuick,
  onSelectDetail,
  onEdit,
}) => {
  return (
    <div
      id="collaborators-table-container"
      className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-stone-50 border-b border-stone-200/80 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-4">Collaborateur</th>
              <th className="p-4">Équipe & Responsable</th>
              <th className="p-4">Rôle & Département</th>
              <th className="p-4">Statut RH</th>
              <th className="p-4">Rémunération</th>
              <th className="p-4">Prise de Poste</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {paginatedEmployees.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-stone-400 font-medium italic">
                  Aucun collaborateur ne correspond à ces critères.
                </td>
              </tr>
            ) : (
              paginatedEmployees.map((emp) => {
                const managerObj = allEmployees.find((m) => m.id === emp.managerId);
                const statusKey = getEmployeeStatusKey(emp);
                const empTeams =
                  Array.isArray(emp.teams) && emp.teams.length > 0
                    ? emp.teams
                    : emp.team
                    ? emp.team.split(',').map((t) => t.trim()).filter(Boolean)
                    : ['Équipe IT & Développement'];

                return (
                  <tr key={emp.id} className="hover:bg-stone-50/50 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-2xs border ${getEmployeeSoftColor(
                            emp.name
                          )}`}
                        >
                          {emp.avatarUrl ? (
                            <img src={emp.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span>{emp.name.slice(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="block font-bold text-xs text-stone-900 truncate">
                            {emp.name}
                          </span>
                          <span className="block text-[10px] text-stone-400 truncate">
                            {emp.email || 'Non renseigné'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {empTeams.map((tName, tIdx) => (
                            <span
                              key={tIdx}
                              className="inline-block px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[10px] border border-purple-100"
                            >
                              {tName}
                            </span>
                          ))}
                        </div>
                        <span className="block text-[10px] text-stone-500 font-medium">
                          👔 Resp : {managerObj ? managerObj.name : emp.managerName || 'Direction Générale'}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="space-y-0.5">
                        <span className="inline-block text-[9px] font-bold uppercase tracking-wide bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                          {emp.roleType || 'Employé'}
                        </span>
                        <span className="block text-[10px] text-stone-400">
                          {emp.department || 'Citrine Management'}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-block text-[9px] font-bold uppercase px-2.5 py-1 rounded-lg border ${COLLABORATOR_STATUS_MAP[statusKey]?.color}`}
                        >
                          {COLLABORATOR_STATUS_MAP[statusKey]?.label}
                        </span>
                        <select
                          value={statusKey}
                          onChange={(e) =>
                            onStatusChangeQuick(emp.id, e.target.value as EmployeeStatus)
                          }
                          className="px-1.5 py-1 rounded-md border border-stone-200 bg-stone-50 text-[10px] outline-none cursor-pointer focus:ring-1 focus:ring-[#2A7B76]"
                        >
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
                    </td>

                    <td className="p-4">
                      <span className="font-bold text-stone-900 font-mono">
                        {formatCollaboratorXAF(emp.salary || 0)}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="text-stone-500 font-mono font-medium">
                        {emp.hireDate || '2026-01-01'}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onSelectDetail(emp.id)}
                          className="p-1.5 text-stone-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition cursor-pointer"
                          title="Fiche individuelle"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEdit(emp)}
                          className="p-1.5 text-stone-400 hover:text-[#2A7B76] hover:bg-emerald-50 rounded-xl transition cursor-pointer"
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-stone-50 border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <span className="text-stone-500 text-[11px] font-medium">
          Affichage des lignes{' '}
          <b>
            {startIndex + 1} à {Math.min(startIndex + itemsPerPage, totalItems)}
          </b>{' '}
          sur <b>{totalItems}</b>
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 transition cursor-pointer text-[11px] font-bold"
          >
            Précédent
          </button>
          <span className="px-3 py-1.5 bg-[#2A7B76]/10 text-[#2A7B76] rounded-lg font-bold text-[11px] border border-[#2A7B76]/20 font-mono">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 transition cursor-pointer text-[11px] font-bold"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
};
