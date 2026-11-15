import React from 'react';
import { Briefcase, Calendar, FileText } from 'lucide-react';
import { Employee, Presence } from '../../types';

interface CollaboratorPresencesAndMissionsTabProps {
  mode: 'presences' | 'missions';
  emp: Employee;
  empPresences: Presence[];
  rhReportMonth: string;
  setRhReportMonth: (m: string) => void;
  isGeneratingRhReport: boolean;
  onGenerateMonthlyReport: (emp: Employee, month: string) => void;
}

export const CollaboratorPresencesAndMissionsTab: React.FC<
  CollaboratorPresencesAndMissionsTabProps
> = ({
  mode,
  emp,
  empPresences,
  rhReportMonth,
  setRhReportMonth,
  isGeneratingRhReport,
  onGenerateMonthlyReport,
}) => {
  if (mode === 'presences') {
    return (
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 border-b border-stone-100 gap-2">
          <h4 className="font-serif font-bold text-xs text-stone-900">
            Historique complet des pointages
          </h4>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-stone-500 font-bold text-[11px]">Mois (dès Oct 2026) :</span>
            <input
              type="month"
              min="2026-10"
              value={rhReportMonth < '2026-10' ? '2026-10' : rhReportMonth}
              onChange={(e) =>
                setRhReportMonth(e.target.value >= '2026-10' ? e.target.value : '2026-10')
              }
              className="bg-stone-50 border border-stone-200 rounded-lg px-2 py-0.5 text-xs font-bold text-stone-800"
              title="Mois d'attestation de présence"
            />
            <button
              onClick={() => onGenerateMonthlyReport(emp, rhReportMonth)}
              disabled={isGeneratingRhReport}
              className="bg-[#2A7B76] hover:bg-[#20635F] text-white text-xs font-bold px-3 py-1 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Télécharger la fiche de présence certifiée en PDF"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>{isGeneratingRhReport ? 'Génération...' : 'Fiche Mensuelle (PDF)'}</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-100 text-stone-400 font-bold pb-2 uppercase tracking-wide text-[10px]">
                <th className="pb-3">Date</th>
                <th className="pb-3">Arrivée</th>
                <th className="pb-3">Départ</th>
                <th className="pb-3">Lieu</th>
                <th className="pb-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {empPresences.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-stone-400 italic">
                    Aucun pointage de présence enregistré.
                  </td>
                </tr>
              ) : (
                empPresences.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/50">
                    <td className="py-3 font-mono font-medium">{p.date}</td>
                    <td className="py-3 font-mono text-stone-700">{p.arrivalTime || '--:--'}</td>
                    <td className="py-3 font-mono text-stone-700">{p.departureTime || '--:--'}</td>
                    <td className="py-3 text-stone-600 truncate max-w-[200px]" title={p.location}>
                      {p.location || 'Douala III'}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${
                          p.status === 'present'
                            ? 'bg-emerald-50 text-emerald-700'
                            : p.status === 'late'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {p.status === 'present'
                          ? 'Présent'
                          : p.status === 'late'
                          ? 'En retard'
                          : 'Absent'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-stone-100">
        <h4 className="font-serif font-bold text-xs text-stone-900">
          Registre des Missions Professionnelles
        </h4>
        <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-2.5 py-1 rounded-xl border border-purple-200">
          Total : {(emp.missionHistory || []).length} mission(s) enregistrée(s)
        </span>
      </div>
      <div className="space-y-2.5">
        {!emp.missionHistory || emp.missionHistory.length === 0 ? (
          <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-100">
            <Briefcase className="h-8 w-8 text-stone-300 mx-auto mb-2" />
            <p className="text-xs text-stone-500 font-medium">
              Aucune mission professionnelle enregistrée pour ce collaborateur.
            </p>
            <p className="text-[11px] text-stone-400 mt-1">
              Changez le statut du collaborateur en &quot;En mission&quot; pour enregistrer ses affectations et durées.
            </p>
          </div>
        ) : (
          emp.missionHistory.map((m) => (
            <div
              key={m.id}
              className="p-4 bg-gradient-to-r from-purple-50/40 via-white to-stone-50/50 rounded-2xl border border-purple-100/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-lg text-[10px] font-bold">
                    Mission Professionnelle
                  </span>
                  <span className="text-[11px] text-stone-400">
                    Enregistrée le {m.createdAt?.split('T')[0] || "Aujourd'hui"}
                  </span>
                </div>
                <p className="text-xs font-bold text-stone-900">{m.reason}</p>
                <div className="flex items-center gap-3 text-[11px] text-stone-600 font-medium">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="h-3 w-3 text-[#2A7B76]" />
                    Du {m.startDate} au {m.endDate}
                  </span>
                </div>
              </div>
              <div className="bg-purple-600 text-white px-3.5 py-2 rounded-xl text-center shadow-xs shrink-0">
                <span className="text-[9px] uppercase font-bold block text-purple-200">
                  Durée Total
                </span>
                <span className="text-sm font-bold font-mono">{m.durationDays} jour(s)</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
