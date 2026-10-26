import React from 'react';
import { Clock, MapPin } from 'lucide-react';
import { Presence } from '../../types';
import { getHolidayInfo } from '../../utils/cameroonHolidays';

interface EmployeePresencesTableProps {
  myPresences: Presence[];
  displayedPresences: Presence[];
  paginationMode?: 'pages' | 'infinite';
  setPaginationMode?: (mode: 'pages' | 'infinite') => void;
  pageSize?: number;
  setPageSize?: (size: number) => void;
  presencePage?: number;
  setPresencePage?: any;
  totalPages?: number;
  infiniteCount?: number;
  setInfiniteCount?: any;
}

export const EmployeePresencesTable: React.FC<EmployeePresencesTableProps> = ({
  myPresences,
}) => {
  const sortedPresences = [...myPresences].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden">
      <div className="p-4 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-serif font-bold text-stone-900 flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-[#2A7B76]" /> Historique de Mes Pointages
          </h3>
          <span className="bg-emerald-100/80 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
            {myPresences.length} total
          </span>
        </div>
      </div>

      {sortedPresences.length === 0 ? (
        <div className="p-8 text-center text-stone-400 text-xs italic">
          Aucun historique de présence enregistré pour le moment.
        </div>
      ) : (
        <>
          {/* Mobile Cards Layout (< sm) */}
          <div className="sm:hidden divide-y divide-stone-100 max-h-[500px] overflow-y-auto">
            {sortedPresences.map((p) => {
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
                          : p.status === 'late'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {p.status === 'present' ? 'Présent' : p.status === 'late' ? 'Retard' : 'Absent'}
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
                      {p.latitude && p.longitude && (
                        <span className="font-mono text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100 font-bold shrink-0">
                          {p.latitude.toFixed(4)}°, {p.longitude.toFixed(4)}°
                        </span>
                      )}
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
          <div className="hidden sm:block overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 text-[10px] uppercase font-bold border-b border-stone-100 tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4 bg-stone-50">Date</th>
                  <th className="py-3 px-4 bg-stone-50">Statut</th>
                  <th className="py-3 px-4 bg-stone-50">Arrivée</th>
                  <th className="py-3 px-4 bg-stone-50">Début Pause</th>
                  <th className="py-3 px-4 bg-stone-50">Fin Pause</th>
                  <th className="py-3 px-4 bg-stone-50">Départ</th>
                  <th className="py-3 px-4 bg-stone-50">Lieu / Méthode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                {sortedPresences.map((p) => {
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
                              : p.status === 'late'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {p.status === 'present' ? 'Présent' : p.status === 'late' ? 'Retard' : 'Absent'}
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
                            <span className="truncate max-w-[130px] font-medium">{p.location || 'Bureau'}</span>
                            {p.latitude && p.longitude && (
                              <span className="font-mono text-[9px] text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-100 font-bold shrink-0">
                                {p.latitude.toFixed(4)}°, {p.longitude.toFixed(4)}°
                              </span>
                            )}
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
    </div>
  );
};

export default EmployeePresencesTable;
