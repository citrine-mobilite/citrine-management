import React from 'react';
import { Eye, Download } from 'lucide-react';
import { DisciplinaryIncident, DisciplinaryStatus } from '../../types';
import { downloadDisciplinaryLetterPdf } from '../../services/pdfExportService';
import {
  getDisciplinarySeverityBadge,
  getDisciplinaryStatusBadge,
} from './disciplinaryTableBadges';

interface DisciplinaryTableRowProps {
  incident: DisciplinaryIncident;
  onSelectIncident: (incident: DisciplinaryIncident) => void;
  onUpdateStatus?: (incident: DisciplinaryIncident, newStatus: DisciplinaryStatus) => void;
}

export const DisciplinaryTableRow: React.FC<DisciplinaryTableRowProps> = ({
  incident,
  onSelectIncident,
  onUpdateStatus,
}) => {
  return (
    <tr
      onClick={() => onSelectIncident(incident)}
      className="hover:bg-stone-50/80 transition cursor-pointer"
    >
      <td className="p-3.5 pl-5">
        <span className="font-mono text-stone-900 font-bold block text-[11px]">{incident.id}</span>
        <span className="font-mono text-stone-400 text-[10px]">
          {new Date(incident.date).toLocaleDateString('fr-FR')}
        </span>
      </td>

      <td className="p-3.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#2A7B76]/10 text-[#2A7B76] font-bold flex items-center justify-center text-[10px] shrink-0">
            {incident.employeeName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <span className="font-bold text-stone-900 block truncate">{incident.employeeName}</span>
            <span className="text-[10px] text-stone-500 block truncate">
              {incident.employeeRole || incident.employeeDepartment || 'Collaborateur'}
            </span>
          </div>
        </div>
      </td>

      <td className="p-3.5 max-w-xs">
        <span className="font-bold text-stone-800 block truncate">{incident.title}</span>
        <span className="text-[11px] text-stone-500 line-clamp-1">
          {incident.description || incident.ruleViolated}
        </span>
      </td>

      <td className="p-3.5 whitespace-nowrap">{getDisciplinarySeverityBadge(incident.severity)}</td>
      <td className="p-3.5 whitespace-nowrap">{getDisciplinaryStatusBadge(incident.status)}</td>

      <td className="p-3.5 whitespace-nowrap">
        {incident.sanctionType ? (
          <span className="text-[11px] font-bold text-rose-700 uppercase bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            {incident.sanctionType.replace(/_/g, ' ')}
          </span>
        ) : (
          <span className="text-[11px] text-stone-400 italic">En attente délibéré</span>
        )}
      </td>

      <td className="p-3.5 text-stone-600 text-[11px] whitespace-nowrap">
        <span className="block font-medium">{incident.reportedBy}</span>
        {incident.reportedByRole && (
          <span className="text-[10px] text-stone-400 block">{incident.reportedByRole}</span>
        )}
      </td>

      <td className="p-3.5 pr-5 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1.5">
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
  );
};
