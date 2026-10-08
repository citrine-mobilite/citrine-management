import React from 'react';
import { Eye, Download, User, Calendar, AlertTriangle, FileText } from 'lucide-react';
import { DisciplinaryIncident } from '../../types';
import { downloadDisciplinaryLetterPdf, exportElementToPdf } from '../../services/pdfExportService';
import { exportToExcel } from '../../services/excelExportService';

interface DisciplinaryTableViewProps {
  incidents: DisciplinaryIncident[];
  onSelectIncident: (incident: DisciplinaryIncident) => void;
}

export const DisciplinaryTableView: React.FC<DisciplinaryTableViewProps> = ({
  incidents,
  onSelectIncident,
}) => {
  const handleExportExcel = () => {
    const headers = ['ID', 'Date', 'Collaborateur', 'Poste', 'Intitulé Fait', 'Catégorie', 'Gravité', 'Statut', 'Règle Réf'];
    const rows = incidents.map((i) => [
      i.id,
      i.date,
      i.employeeName,
      i.employeeRole || '',
      i.title,
      i.category,
      i.severity,
      i.status,
      i.brokenRuleReference || '',
    ]);
    exportToExcel('registre_disciplinaire.xls', 'Registre des Faits & Sanctions Disciplinaires', headers, rows);
  };

  const handleExportPdf = () => {
    exportElementToPdf('disciplinary-table-container', 'registre_disciplinaire.pdf');
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critique':
        return 'bg-stone-100 text-stone-800 border-stone-300';
      case 'grave':
        return 'bg-amber-50 text-amber-900 border-amber-200';
      case 'moyen':
        return 'bg-stone-100 text-stone-700 border-stone-200';
      default:
        return 'bg-stone-50 text-stone-600 border-stone-200';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ouvert':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'en_instruction':
        return 'bg-stone-100 text-stone-800 border-stone-300';
      case 'sanctionne':
        return 'bg-stone-200 text-stone-900 border-stone-400 font-bold';
      case 'classe':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      default:
        return 'bg-stone-50 text-stone-600 border-stone-200';
    }
  };

  return (
    <div id="disciplinary-table-container" className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden">
      <div className="p-4 border-b border-stone-100 flex items-center justify-between gap-3 bg-stone-50/50">
        <h4 className="font-serif font-bold text-xs text-stone-900 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[#2A7B76]" />
          Registre des Faits ({incidents.length})
        </h4>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer"
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
              <th className="p-3.5 pl-5">Date</th>
              <th className="p-3.5">Collaborateur</th>
              <th className="p-3.5">Intitulé du Fait</th>
              <th className="p-3.5">Gravité</th>
              <th className="p-3.5">Statut</th>
              <th className="p-3.5">Règle / Signalé par</th>
              <th className="p-3.5 pr-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {incidents.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-stone-400 italic">
                  Aucun dossier disciplinaire trouvé.
                </td>
              </tr>
            ) : (
              incidents.map((incident) => (
                <tr
                  key={incident.id}
                  onClick={() => onSelectIncident(incident)}
                  className="hover:bg-stone-50/80 transition cursor-pointer"
                >
                  <td className="p-3.5 pl-5 font-mono text-stone-500 text-[11px]">
                    {new Date(incident.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="p-3.5 font-bold text-stone-900">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-[#2A7B76]" />
                      <span>{incident.employeeName}</span>
                    </div>
                  </td>
                  <td className="p-3.5 max-w-xs font-medium text-stone-800 truncate">
                    {incident.title}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getSeverityStyle(
                        incident.severity
                      )}`}
                    >
                      {incident.severity}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border capitalize ${getStatusStyle(
                        incident.status
                      )}`}
                    >
                      {incident.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3.5 text-stone-600 text-[11px]">
                    <span className="block font-medium truncate max-w-[150px]">
                      {incident.ruleViolated || 'Règlement Intérieur'}
                    </span>
                    <span className="text-[10px] text-stone-400">Par {incident.reportedBy}</span>
                  </td>
                  <td className="p-3.5 pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onSelectIncident(incident)}
                        className="p-1.5 bg-stone-100 hover:bg-[#2A7B76] hover:text-white text-stone-700 rounded-lg transition"
                        title="Ouvrir la page de détail"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          downloadDisciplinaryLetterPdf(
                            incident,
                            { id: incident.employeeId, name: incident.employeeName },
                            incident.sanctionType || 'avertissement'
                          )
                        }
                        className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition"
                        title="Télécharger la lettre"
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
    </div>
  );
};
