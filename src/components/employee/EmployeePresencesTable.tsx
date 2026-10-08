import React from 'react';
import { Clock, MapPin, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, ArrowDown } from 'lucide-react';
import { Presence } from '../../types';
import { SearchableSelect } from '../common/SearchableSelect';
import { getHolidayInfo } from '../../utils/cameroonHolidays';

interface EmployeePresencesTableProps {
  myPresences: Presence[];
  displayedPresences: Presence[];
  paginationMode: 'pages' | 'infinite';
  setPaginationMode: (mode: 'pages' | 'infinite') => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  presencePage: number;
  setPresencePage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  infiniteCount: number;
  setInfiniteCount: React.Dispatch<React.SetStateAction<number>>;
}

export const EmployeePresencesTable: React.FC<EmployeePresencesTableProps> = ({
  myPresences,
  displayedPresences,
  paginationMode,
  setPaginationMode,
  pageSize,
  setPageSize,
  presencePage,
  setPresencePage,
  totalPages,
  infiniteCount,
  setInfiniteCount,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden">
      <div className="p-4 border-b border-stone-100 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-serif font-bold text-stone-900 flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-[#2A7B76]" /> Historique de Mes Pointages
          </h3>
          <span className="bg-emerald-100/80 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
            {myPresences.length} total
          </span>
        </div>

        {/* Desktop & Mobile controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200">
            <button
              onClick={() => setPaginationMode('pages')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                paginationMode === 'pages'
                  ? 'bg-white text-[#2A7B76] shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Pages
            </button>
            <button
              onClick={() => setPaginationMode('infinite')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                paginationMode === 'infinite'
                  ? 'bg-white text-[#2A7B76] shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Défilement
            </button>
          </div>

          {paginationMode === 'pages' && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-stone-500 font-bold hidden sm:inline">Lignes :</span>
              <div className="w-20">
                <SearchableSelect
                  value={pageSize}
                  onChange={(val) => {
                    setPageSize(Number(val));
                    setPresencePage(1);
                  }}
                  options={[
                    { value: 5, label: '5' },
                    { value: 10, label: '10' },
                    { value: 20, label: '20' },
                    { value: 50, label: '50' },
                  ]}
                  triggerClassName="py-1 px-2 text-[11px] h-7"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {displayedPresences.length === 0 ? (
        <div className="p-8 text-center text-stone-400 text-xs italic">
          Aucun historique de présence enregistré pour le moment.
        </div>
      ) : (
        <>
          {/* Mobile Cards Layout (< sm) */}
          <div className="sm:hidden divide-y divide-stone-100">
            {displayedPresences.map((p) => {
              const hInfo = getHolidayInfo(p.date);
              return (
                <div key={p.id} className="p-4 space-y-2 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-stone-900 font-mono">
                      {new Date(p.date).toLocaleDateString('fr-FR', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        p.status === 'present'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'retard'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {p.status === 'present' ? 'Présent' : p.status === 'retard' ? 'Retard' : 'Absent'}
                    </span>
                  </div>

                  {hInfo && (
                    <div className="text-[10px] bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md font-bold">
                      🇨🇲 Férié : {hInfo.name}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-stone-50/70 p-2.5 rounded-xl border border-stone-100">
                    <div>
                      <span className="text-[9px] text-stone-400 font-bold block uppercase">Arrivée</span>
                      <span className="font-mono font-bold text-emerald-700">{p.arrivalTime || '--:--'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-stone-400 font-bold block uppercase">Départ</span>
                      <span className="font-mono font-bold text-teal-700">{p.departureTime || '--:--'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-stone-400 font-bold block uppercase">Début Pause</span>
                      <span className="font-mono text-stone-600">{p.pauseStart || '--:--'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-stone-400 font-bold block uppercase">Fin Pause</span>
                      <span className="font-mono text-stone-600">{p.pauseEnd || '--:--'}</span>
                    </div>
                  </div>

                  {p.location && (
                    <div className="flex items-center gap-1 text-[10px] text-stone-500 pt-0.5">
                      <MapPin className="h-3 w-3 text-[#2A7B76] shrink-0" />
                      <span className="truncate">{p.location}</span>
                    </div>
                  )}

                  {p.clockingMethod === 'admin_on_behalf' && (
                    <div className="text-[10px] text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg font-bold">
                      🛡️ Badgé par <b>{p.badgedByAdminName || 'Responsable'}</b> (Motif : {p.adminBadgeReason || 'Sur place'})
                    </div>
                  )}
                  {p.clockingMethod === 'qr_code_dynamic' && (
                    <div className="text-[10px] text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-lg font-bold inline-block">
                      ⚡ QR Dynamique (Présentiel Responsable)
                    </div>
                  )}
                  {p.clockingMethod === 'qr_code_door' && (
                    <div className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg font-bold inline-block">
                      🚪 QR Code Porte (GPS Vérifié)
                    </div>
                  )}
                  {p.clockingMethod === 'badge_code_16' && (
                    <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg font-bold inline-block">
                      🔑 Clé 16 Caractères (GPS Vérifié)
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (>= sm) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 text-[10px] uppercase font-bold border-b border-stone-100 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4">Arrivée</th>
                  <th className="py-3 px-4">Début Pause</th>
                  <th className="py-3 px-4">Fin Pause</th>
                  <th className="py-3 px-4">Départ</th>
                  <th className="py-3 px-4">Lieu / Méthode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                {displayedPresences.map((p) => {
                  const hInfo = getHolidayInfo(p.date);
                  return (
                    <tr key={p.id} className="hover:bg-stone-50/60 transition">
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">
                        <div>
                          {new Date(p.date).toLocaleDateString('fr-FR', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        {hInfo && (
                          <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-sans font-bold inline-block mt-0.5">
                            🇨🇲 {hInfo.name}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            p.status === 'present'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'retard'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {p.status === 'present' ? 'Présent' : p.status === 'retard' ? 'Retard' : 'Absent'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-700 font-bold">{p.arrivalTime || '--:--'}</td>
                      <td className="py-3 px-4 font-mono text-stone-500">{p.pauseStart || '--:--'}</td>
                      <td className="py-3 px-4 font-mono text-stone-500">{p.pauseEnd || '--:--'}</td>
                      <td className="py-3 px-4 font-mono text-[#2A7B76] font-bold">{p.departureTime || '--:--'}</td>
                      <td className="py-3 px-4 text-stone-500 text-[11px]">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-[#2A7B76] shrink-0" />
                            <span className="truncate max-w-[150px] font-medium">{p.location || 'Bureau'}</span>
                          </div>
                          {p.clockingMethod === 'admin_on_behalf' && (
                            <span className="text-[9px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded truncate max-w-[180px]" title={`Badgé par ${p.badgedByAdminName || 'Responsable'} — Motif: ${p.adminBadgeReason || 'Non précisé'}`}>
                              🛡️ Badgé par {p.badgedByAdminName || 'Resp.'} : "{p.adminBadgeReason || 'Sur place'}"
                            </span>
                          )}
                          {p.clockingMethod === 'qr_code_dynamic' && (
                            <span className="text-[9px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded w-fit">
                              ⚡ QR Dynamique
                            </span>
                          )}
                          {p.clockingMethod === 'qr_code_door' && (
                            <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded w-fit">
                              🚪 QR Porte (GPS)
                            </span>
                          )}
                          {p.clockingMethod === 'badge_code_16' && (
                            <span className="text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded w-fit">
                              🔑 Clé 16 Car. (GPS)
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Pagination Footer */}
      {paginationMode === 'pages' && totalPages > 1 && (
        <div className="p-3 border-t border-stone-100 bg-stone-50/60 flex items-center justify-between text-xs">
          <span className="text-[11px] text-stone-500">
            Page <span className="font-bold text-stone-800">{presencePage}</span> sur{' '}
            <span className="font-bold text-stone-800">{totalPages}</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPresencePage(1)}
              disabled={presencePage === 1}
              className="p-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-30 cursor-pointer"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setPresencePage((prev) => Math.max(1, prev - 1))}
              disabled={presencePage === 1}
              className="p-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setPresencePage((prev) => Math.min(totalPages, prev + 1))}
              disabled={presencePage === totalPages}
              className="p-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setPresencePage(totalPages)}
              disabled={presencePage === totalPages}
              className="p-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-30 cursor-pointer"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Infinite Scroll Charger Plus */}
      {paginationMode === 'infinite' && infiniteCount < myPresences.length && (
        <div className="p-3 border-t border-stone-100 bg-stone-50/60 text-center">
          <button
            onClick={() => setInfiniteCount((prev) => prev + 10)}
            className="text-xs font-bold text-[#2A7B76] hover:text-[#20635F] inline-flex items-center gap-1.5 py-1 px-3 rounded-xl bg-white border border-stone-200 shadow-3xs cursor-pointer"
          >
            <ArrowDown className="h-3.5 w-3.5" />
            Charger 10 pointages supplémentaires ({myPresences.length - infiniteCount} restants)
          </button>
        </div>
      )}
    </div>
  );
};
