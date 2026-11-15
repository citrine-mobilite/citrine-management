import React, { useState, useMemo } from 'react';
import { Download, FileText, ChevronLeft, ChevronRight, Scale } from 'lucide-react';
import { DisciplinaryIncident, DisciplinaryStatus } from '../../types';
import { exportElementToPdf } from '../../services/pdfExportService';
import { exportDisciplinaryRegistryToExcel } from './disciplinaryTableBadges';
import { DisciplinaryTableRow } from './DisciplinaryTableRow';

interface DisciplinaryTableViewProps {
  incidents: DisciplinaryIncident[];
  onSelectIncident: (incident: DisciplinaryIncident) => void;
  onUpdateStatus?: (incident: DisciplinaryIncident, newStatus: DisciplinaryStatus) => void;
}

export const DisciplinaryTableView: React.FC<DisciplinaryTableViewProps> = ({
  incidents,
  onSelectIncident,
  onUpdateStatus,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [incidents.length]);

  const totalPages = Math.max(1, Math.ceil(incidents.length / PAGE_SIZE));
  const paginatedIncidents = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return incidents.slice(start, start + PAGE_SIZE);
  }, [incidents, currentPage]);

  return (
    <div
      id="disciplinary-table-container"
      className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden"
    >
      <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/70">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#2A7B76]/10 text-[#2A7B76] rounded-xl">
            <Scale className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-xs text-stone-900">
              Registre &amp; Délibérations du Conseil de Discipline
            </h4>
            <p className="text-[11px] text-stone-500">
              {incidents.length} dossier(s) répertorié(s) • Affichage paginé par 20
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => exportDisciplinaryRegistryToExcel(incidents)}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-3xs"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => exportElementToPdf('disciplinary-table-container', 'registre_conseil_discipline.pdf')}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-3xs"
          >
            <FileText className="h-3.5 w-3.5 text-rose-600" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50/80 text-stone-500 font-bold uppercase text-[10px] tracking-wider">
              <th className="p-3.5 pl-5">Réf &amp; Date</th>
              <th className="p-3.5">Collaborateur</th>
              <th className="p-3.5">Chef d'Accusation / Faits</th>
              <th className="p-3.5">Gravité</th>
              <th className="p-3.5">Statut Procédure</th>
              <th className="p-3.5">Sanction / Décision</th>
              <th className="p-3.5">Rapporteur</th>
              <th className="p-3.5 pr-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 font-medium">
            {paginatedIncidents.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-stone-400 italic">
                  Aucun dossier disciplinaire ne correspond aux critères de filtre.
                </td>
              </tr>
            ) : (
              paginatedIncidents.map((incident) => (
                <DisciplinaryTableRow
                  key={incident.id}
                  incident={incident}
                  onSelectIncident={onSelectIncident}
                  onUpdateStatus={onUpdateStatus}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {incidents.length > 0 && (
        <div className="px-5 py-3.5 bg-stone-50/70 border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-stone-500 text-[11px]">
            Affichage de <span className="font-bold text-stone-800">{(currentPage - 1) * PAGE_SIZE + 1}</span> à{' '}
            <span className="font-bold text-stone-800">{Math.min(currentPage * PAGE_SIZE, incidents.length)}</span>{' '}
            sur <span className="font-bold text-[#2A7B76]">{incidents.length}</span> dossiers ({PAGE_SIZE} par page)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center gap-1 cursor-pointer transition text-[11px] shadow-2xs"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Précédent</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                const isCurrent = p === currentPage;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    className={`min-w-[30px] h-7 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                      isCurrent
                        ? 'bg-[#2A7B76] text-white shadow-xs'
                        : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100/80'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center gap-1 cursor-pointer transition text-[11px] shadow-2xs"
            >
              <span>Suivant</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
