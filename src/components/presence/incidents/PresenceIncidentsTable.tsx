import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  FileCheck2,
} from 'lucide-react';
import { AttendanceIncident, Employee } from '../../../types';
import { getIncidentTypeLabel } from './usePresenceIncidentsLogic';

interface PresenceIncidentsTableProps {
  sorted: AttendanceIncident[];
  employees: Employee[];
  onSelectForJustification: (incident: AttendanceIncident) => void;
}

export const PresenceIncidentsTable: React.FC<PresenceIncidentsTableProps> = ({
  sorted,
  employees,
  onSelectForJustification,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
        <h3 className="font-serif font-bold text-xs text-stone-900 flex items-center gap-1.5">
          <AlertTriangle className="h-4 w-4 text-amber-600" /> Registre d&apos;Assiduité des Collaborateurs ({sorted.length})
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-stone-50 text-stone-500 text-[10px] uppercase font-bold border-b border-stone-100">
            <tr>
              <th className="py-3 px-4">Date & Heure</th>
              <th className="py-3 px-4">Collaborateur</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Origine & Statut</th>
              <th className="py-3 px-4">Motif Circonstancié</th>
              <th className="py-3 px-4 text-right">Décision RH</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 font-medium">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-stone-400 italic">
                  Aucun incident trouvé avec ces filtres.
                </td>
              </tr>
            ) : (
              sorted.map((inc) => {
                const isDeclared =
                  inc.isDeclaredInAdvance || inc.status === 'signale' || inc.status === 'justifie';
                return (
                  <tr key={inc.id} className="hover:bg-stone-50/60 transition">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-stone-900">{inc.date}</div>
                      <span className="font-mono text-[11px] text-stone-500">[{inc.timeString || '08:30'}]</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-stone-900 block">
                        {inc.employeeName ||
                          employees.find((e) => String(e.id) === String(inc.employeeId))?.name ||
                          'Collaborateur'}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">ID: {inc.employeeId || inc.id}</span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700">
                        {getIncidentTypeLabel(inc.type)}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {inc.status === 'injustifie' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1 w-fit">
                          <X className="h-3 w-3 text-rose-600" /> Rejeté / Non justifié
                        </span>
                      ) : inc.status === 'justifie' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Validé & Justifié
                        </span>
                      ) : isDeclared ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 flex items-center gap-1 w-fit">
                          <Clock className="h-3 w-3 text-blue-600" /> Signalé (En attente)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1 w-fit">
                          <AlertCircle className="h-3 w-3 text-amber-600" /> Incident Automatique
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 min-w-[220px]">
                      <p className="text-stone-800 text-xs">{inc.reason || inc.description || 'Incident consigné'}</p>
                      {inc.adminComment && (
                        <p className="text-[10px] text-[#2A7B76] italic mt-0.5">
                          Observation RH : {inc.adminComment}
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onSelectForJustification(inc)}
                        className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 font-bold text-xs transition cursor-pointer flex items-center gap-1 ml-auto"
                      >
                        <FileCheck2 className="h-3.5 w-3.5 text-[#2A7B76]" />
                        <span>Gérer</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
