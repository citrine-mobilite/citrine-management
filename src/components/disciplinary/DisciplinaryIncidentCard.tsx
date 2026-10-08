import React from 'react';
import { User, Calendar, FileText, Download } from 'lucide-react';
import { DisciplinaryIncident } from '../../types';
import { downloadDisciplinaryLetterPdf } from '../../services/pdfExportService';

interface DisciplinaryIncidentCardProps {
  incident: DisciplinaryIncident;
  onSelect: (incident: DisciplinaryIncident) => void;
}

export const DisciplinaryIncidentCard: React.FC<DisciplinaryIncidentCardProps> = ({ incident, onSelect }) => {
  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critique':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'grave':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'moyen':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  return (
    <div
      onClick={() => onSelect(incident)}
      className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-3"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getSeverityStyle(
              incident.severity
            )}`}
          >
            Gravité : {incident.severity}
          </span>
          <span className="text-[10px] text-stone-400 font-mono">
            {new Date(incident.date).toLocaleDateString('fr-FR')}
          </span>
        </div>

        <h4 className="font-bold text-xs text-stone-900 line-clamp-1">{incident.title}</h4>

        <div className="flex items-center gap-1.5 text-[11px] text-stone-600">
          <User className="h-3.5 w-3.5 text-[#2A7B76]" />
          <span className="font-bold">{incident.employeeName}</span>
        </div>

        <p className="text-[11px] text-stone-500 line-clamp-2">{incident.description}</p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-[10px]">
        <span className="font-bold text-[#2A7B76] capitalize">Statut : {incident.status}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            downloadDisciplinaryLetterPdf(incident, { id: incident.employeeId, name: incident.employeeName }, 'avertissement');
          }}
          className="p-1.5 bg-stone-100 hover:bg-[#2A7B76] hover:text-white rounded-lg transition text-stone-600"
          title="Télécharger la lettre PDF"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
