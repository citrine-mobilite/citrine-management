import React, { useState, useMemo } from 'react';
import { 
  Eye, 
  Download, 
  User, 
  Calendar, 
  AlertTriangle, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  Scale,
  CheckCircle2,
  Clock,
  MoreVertical
} from 'lucide-react';
import { DisciplinaryIncident, DisciplinaryStatus } from '../../types';
import { downloadDisciplinaryLetterPdf, exportElementToPdf } from '../../services/pdfExportService';
import { exportToExcel } from '../../services/excelExportService';

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

  // Reset page when incidents count changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [incidents.length]);

  const totalPages = Math.max(1, Math.ceil(incidents.length / PAGE_SIZE));
  const paginatedIncidents = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return incidents.slice(start, start + PAGE_SIZE);
  }, [incidents, currentPage]);

  const handleExportExcel = () => {
    const headers = [
      'Réf Dossier', 
      'Date Commission', 
      'Collaborateur', 
      'Poste', 
      'Département', 
      'Chef d\'Accusation / Titre', 
      'Catégorie', 
      'Gravité', 
      'Statut Procédure', 
      'Sanction', 
      'Rapporteur'
    ];
    const rows = incidents.map((i) => [
      i.id,
      i.date,
      i.employeeName,
      i.employeeRole || '',
      i.employeeDepartment || '',
      i.title,
      i.category,
      i.severity.toUpperCase(),
      i.status.toUpperCase(),
      i.sanctionType || 'Non définie',
      i.reportedBy,
    ]);
    exportToExcel('registre_conseil_discipline.xls', 'Registre Officiel du Conseil de Discipline', headers, rows);
  };

  const handleExportPdf = () => {
    exportElementToPdf('disciplinary-table-container', 'registre_conseil_discipline.pdf');
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critique':
        return (
          <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
            🚨 Critique
          </span>
        );
      case 'grave':
        return (
          <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
            ⚠️ Grave
          </span>
        );
      case 'moyen':
        return (
          <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
            Moyen
          </span>
        );
      default:
        return (
          <span className="bg-stone-100 text-stone-700 border border-stone-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
            Faible
          </span>
        );
    }
  };

  const getStatusBadge = (status: DisciplinaryStatus) => {
    switch (status) {
      case 'convoque':
        return (
          <span className="bg-purple-100 text-purple-900 border border-purple-300 px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 shrink-0">
            <Scale className="h-3 w-3 text-purple-700" />
            <span>Convoqué au Conseil</span>
          </span>
        );
      case 'delibere':
        return (
          <span className="bg-sky-100 text-sky-900 border border-sky-300 px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 shrink-0">
            <Clock className="h-3 w-3 text-sky-700" />
            <span>En Délibération</span>
          </span>
        );
      case 'sanctionne':
        return (
          <span className="bg-rose-100 text-rose-900 border border-rose-300 px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 shrink-0">
            <AlertTriangle className="h-3 w-3 text-rose-700" />
            <span>Sanctionné</span>
          </span>
        );
      case 'classe':
        return (
          <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 shrink-0">
            <CheckCircle2 className="h-3 w-3 text-emerald-700" />
            <span>Classé sans suite</span>
          </span>
        );
      case 'en_instruction':
        return (
          <span className="bg-indigo-100 text-indigo-900 border border-indigo-300 px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 shrink-0">
            <span>En Instruction</span>
          </span>
        );
      default:
        return (
          <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 shrink-0">
            <span>Dossier Ouvert</span>
          </span>
        );
    }
  };

  return (
    <div id="disciplinary-table-container" className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden">
      {/* Table Header Bar */}
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
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-3xs"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleExportPdf}
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
                <tr
                  key={incident.id}
                  onClick={() => onSelectIncident(incident)}
                  className="hover:bg-stone-50/80 transition cursor-pointer"
                >
                  {/* Réf & Date */}
                  <td className="p-3.5 pl-5">
                    <span className="font-mono text-stone-900 font-bold block text-[11px]">
                      {incident.id}
                    </span>
                    <span className="font-mono text-stone-400 text-[10px]">
                      {new Date(incident.date).toLocaleDateString('fr-FR')}
                    </span>
                  </td>

                  {/* Collaborateur */}
                  <td className="p-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#2A7B76]/10 text-[#2A7B76] font-bold flex items-center justify-center text-[10px] shrink-0">
                        {incident.employeeName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-stone-900 block truncate">
                          {incident.employeeName}
                        </span>
                        <span className="text-[10px] text-stone-500 block truncate">
                          {incident.employeeRole || incident.employeeDepartment || 'Collaborateur'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Faits */}
                  <td className="p-3.5 max-w-xs">
                    <span className="font-bold text-stone-800 block truncate">
                      {incident.title}
                    </span>
                    <span className="text-[11px] text-stone-500 line-clamp-1">
                      {incident.description || incident.ruleViolated}
                    </span>
                  </td>

                  {/* Gravité */}
                  <td className="p-3.5 whitespace-nowrap">
                    {getSeverityBadge(incident.severity)}
                  </td>

                  {/* Statut */}
                  <td className="p-3.5 whitespace-nowrap">
                    {getStatusBadge(incident.status)}
                  </td>

                  {/* Sanction */}
                  <td className="p-3.5 whitespace-nowrap">
                    {incident.sanctionType ? (
                      <span className="text-[11px] font-bold text-rose-700 uppercase bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {incident.sanctionType.replace(/_/g, ' ')}
                      </span>
                    ) : (
                      <span className="text-[11px] text-stone-400 italic">
                        En attente délibéré
                      </span>
                    )}
                  </td>

                  {/* Rapporteur */}
                  <td className="p-3.5 text-stone-600 text-[11px] whitespace-nowrap">
                    <span className="block font-medium">{incident.reportedBy}</span>
                    {incident.reportedByRole && (
                      <span className="text-[10px] text-stone-400 block">{incident.reportedByRole}</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-3.5 pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Statut rapide si gestionnaire */}
                      {onUpdateStatus && (
                        <select
                          value={incident.status}
                          onChange={(e) => onUpdateStatus(incident, e.target.value as DisciplinaryStatus)}
                          className="bg-stone-50 border border-stone-200 rounded-lg text-[10px] font-bold text-stone-700 py-1 px-1.5 outline-none focus:border-[#2A7B76] cursor-pointer"
                          title="Changer le statut du dossier"
                        >
                          <option value="ouvert">Dossier Ouvert</option>
                          <option value="en_instruction">En instruction</option>
                          <option value="convoque">Convoqué au Conseil</option>
                          <option value="delibere">En délibéré</option>
                          <option value="sanctionne">Sanctionné</option>
                          <option value="classe">Classé sans suite</option>
                        </select>
                      )}

                      <button
                        onClick={() => onSelectIncident(incident)}
                        className="p-1.5 bg-stone-100 hover:bg-[#2A7B76] hover:text-white text-stone-700 rounded-lg transition cursor-pointer"
                        title="Ouvrir le dossier complet"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() =>
                          downloadDisciplinaryLetterPdf(
                            incident,
                            { id: incident.employeeId, name: incident.employeeName },
                            (incident.sanctionType as any) || 'avertissement'
                          )
                        }
                        className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition cursor-pointer"
                        title="Télécharger la notification / lettre"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls par 20 */}
      {incidents.length > 0 && (
        <div className="px-5 py-3.5 bg-stone-50/70 border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-stone-500 text-[11px]">
            Affichage de <span className="font-bold text-stone-800">{(currentPage - 1) * PAGE_SIZE + 1}</span> à{' '}
            <span className="font-bold text-stone-800">
              {Math.min(currentPage * PAGE_SIZE, incidents.length)}
            </span>{' '}
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
