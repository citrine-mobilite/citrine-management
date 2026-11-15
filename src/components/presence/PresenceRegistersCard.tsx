import React from 'react';
import { Pencil, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Employee, Presence } from '../../types';
import { getEmployeeSoftColor } from '../../utils/colorUtils';

interface PresenceRegistersCardProps {
  filteredPresences: Presence[];
  paginatedPresences: Presence[];
  employees: Employee[];
  activeSidebarEmpId: string;
  recentPunchId: string | null;
  itemsPerPage: number;
  currentPage: number;
  totalPages: number;
  startIndex: number;
  totalItems: number;
  onSelectSidebarEmp: (id: string) => void;
  onOpenEditPresence: (presence: Presence) => void;
  onChangePageSize: (size: number) => void;
  onChangePage: (page: number) => void;
}

export const PresenceRegistersCard: React.FC<PresenceRegistersCardProps> = ({
  filteredPresences,
  paginatedPresences,
  employees,
  activeSidebarEmpId,
  recentPunchId,
  itemsPerPage,
  currentPage,
  totalPages,
  startIndex,
  totalItems,
  onSelectSidebarEmp,
  onOpenEditPresence,
  onChangePageSize,
  onChangePage,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden space-y-3">
      <div className="p-4 bg-stone-50/50 border-b border-stone-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h4 className="font-serif font-bold text-xs text-stone-900 uppercase tracking-wide">
            Pointages de la Journée
          </h4>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-3xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>En direct</span>
          </span>
        </div>
        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-lg border border-emerald-200">
          {filteredPresences.length} fiches trouvées
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-stone-50/80 text-stone-500 font-bold uppercase tracking-wider text-[9px] border-b border-stone-200">
            <tr>
              <th className="p-3 pl-4">Employé</th>
              <th className="p-3 text-center">Statut</th>
              <th className="p-3">Arrivée</th>
              <th className="p-3">Pause</th>
              <th className="p-3">Reprise</th>
              <th className="p-3">Départ</th>
              <th className="p-3 text-right pr-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {paginatedPresences.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-stone-400 italic">
                  Aucun pointage ne correspond aux filtres appliqués.
                </td>
              </tr>
            ) : (
              paginatedPresences.map((p) => {
                const emp = employees.find((e) => e.id === p.employeeId);
                const softTheme = getEmployeeSoftColor(emp?.name || 'Collaborateur');
                const isActive = p.employeeId === activeSidebarEmpId;
                const isRecent = recentPunchId && (recentPunchId === String(p.employeeId) || recentPunchId === String(p.id));
                return (
                  <tr
                    key={p.id}
                    onClick={() => onSelectSidebarEmp(p.employeeId)}
                    className={`transition cursor-pointer border-2 ${
                      isRecent
                        ? 'bg-emerald-50/80 border-emerald-400 animate-in fade-in duration-300'
                        : isActive
                        ? 'border-red-500 bg-red-50/50 hover:bg-stone-50/30'
                        : 'border-transparent hover:bg-stone-50/30'
                    }`}
                  >
                    <td className="p-3 pl-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="rounded border-stone-300 text-[#2A7B76] focus:ring-[#2A7B76]"
                        />
                        <div className={`w-9 h-9 rounded-2xl ${softTheme.bg} flex items-center justify-center font-bold text-xs shrink-0 border overflow-hidden shadow-3xs`}>
                          {emp?.avatarUrl ? (
                            <img src={emp.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span>{emp?.name.slice(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="block font-bold text-stone-900 text-[11px] leading-tight">{emp?.name}</span>
                            {isRecent && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[8px] font-extrabold bg-emerald-600 text-white animate-bounce shadow-xs">
                                Nouveau ⚡
                              </span>
                            )}
                          </div>
                          <span className="block text-[9px] text-stone-400 font-mono leading-none truncate max-w-[140px]">{emp?.email}</span>
                          <div className="flex flex-wrap items-center gap-1 mt-0.5">
                            <span className={`inline-flex items-center gap-0.5 text-[8px] rounded px-1.5 py-0.5 font-bold cursor-pointer border ${softTheme.badge}`}>
                              📍 {p.location || 'Bureau'}
                            </span>
                            {p.clockingMethod === 'admin_on_behalf' && (
                              <span
                                className="inline-flex items-center gap-1 text-[8px] bg-indigo-50 text-indigo-800 border border-indigo-200 rounded px-1.5 py-0.5 font-bold truncate max-w-[200px]"
                                title={`Badgé par ${p.badgedByAdminName || 'Responsable'} — Motif : ${p.adminBadgeReason || 'Non précisé'}`}
                              >
                                🛡️ Badgé par {p.badgedByAdminName || 'Resp.'} : "{p.adminBadgeReason || 'Sur place'}"
                              </span>
                            )}
                            {p.clockingMethod === 'qr_code_dynamic' && (
                              <span className="inline-flex items-center gap-1 text-[8px] bg-teal-50 text-teal-800 border border-teal-200 rounded px-1.5 py-0.5 font-bold">
                                ⚡ QR Dynamique (30s)
                              </span>
                            )}
                            {p.clockingMethod === 'qr_code_door' && (
                              <span className="inline-flex items-center gap-1 text-[8px] bg-emerald-50 text-emerald-800 border border-emerald-200 rounded px-1.5 py-0.5 font-bold">
                                🚪 QR Porte • GPS
                              </span>
                            )}
                            {p.clockingMethod === 'badge_code_16' && (
                              <span className="inline-flex items-center gap-1 text-[8px] bg-amber-50 text-amber-800 border border-amber-200 rounded px-1.5 py-0.5 font-bold">
                                🔑 Clé 16 Car. • GPS
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 text-center">
                      <span className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                        p.status === 'present'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : p.status === 'late'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-stone-100 text-stone-400 border-stone-300'
                      }`}>
                        {p.status === 'present' ? 'Présent' : p.status === 'late' ? 'Retard' : 'Non pointé'}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="font-mono font-bold text-emerald-800 text-[11px]">{p.arrivalTime || '—'}</div>
                      <span className="block text-[8px] text-stone-400 leading-none truncate max-w-[110px]">{p.location || 'Douala'}</span>
                    </td>
                    <td className="p-3 font-mono font-medium text-stone-500 text-[11px]">{p.pauseStart || '—'}</td>
                    <td className="p-3 font-mono font-medium text-stone-500 text-[11px]">{p.pauseEnd || '—'}</td>
                    <td className="p-3">
                      <div className="font-mono font-bold text-stone-800 text-[11px]">{p.departureTime || '—'}</div>
                      {p.departureTime && p.departureTime < '16:30' && (
                        <span className="inline-block text-[8px] font-bold bg-amber-50 text-amber-800 border border-amber-100 rounded px-1 mt-0.5 animate-pulse">
                          Urgence Départ Anticipé
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-right pr-4">
                      <button
                        onClick={() => onOpenEditPresence(p)}
                        className="p-1.5 text-stone-400 hover:text-[#2A7B76] hover:bg-emerald-50 rounded-xl transition cursor-pointer"
                        title="Modifier pointage"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-stone-50 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 text-[10px] font-bold">Afficher</span>
            <select
              value={itemsPerPage}
              onChange={(e) => { onChangePageSize(Number(e.target.value)); onChangePage(1); }}
              className="px-1.5 py-1 rounded-lg border border-stone-200 bg-white font-bold text-stone-850"
            >
              <option value={10}>10 par page</option>
              <option value={25}>25 par page</option>
              <option value={50}>50 par page</option>
            </select>
          </div>
          <div className="h-4 w-[1px] bg-stone-200" />
          <span className="text-stone-500 text-[10px] font-bold">
            Lignes <b>{startIndex + 1} à {Math.min(startIndex + itemsPerPage, totalItems)}</b> sur <b>{totalItems}</b>
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => onChangePage(1)} disabled={currentPage === 1} className="p-1 border border-stone-200 hover:bg-white text-stone-600 disabled:opacity-40 transition cursor-pointer" title="Première page">
            <ChevronsLeft className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onChangePage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-1 border border-stone-200 hover:bg-white text-stone-600 disabled:opacity-40 transition cursor-pointer flex items-center gap-1">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="px-3 py-1 bg-[#2A7B76] text-white rounded font-bold text-[10px] border border-[#2A7B76]">
            Page {currentPage} / {totalPages}
          </span>
          <button onClick={() => onChangePage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="p-1 border border-stone-200 hover:bg-white text-stone-600 disabled:opacity-40 transition cursor-pointer flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onChangePage(totalPages)} disabled={currentPage === totalPages} className="p-1 border border-stone-200 hover:bg-white text-stone-600 disabled:opacity-40 transition cursor-pointer" title="Dernière page">
            <ChevronsRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
