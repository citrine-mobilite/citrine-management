import React from 'react';
import { Calendar, CheckCircle2, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { AttendanceIncident } from '../../types';
import { soundService } from '../../services/soundService';

export function getIncidentTypeLabel(type: AttendanceIncident['type']): string {
  switch (type) {
    case 'retard':
      return 'Retard';
    case 'sortie_prematuree':
    case 'depart_anticipe':
      return 'Sortie prématurée';
    case 'pause_anticipee':
      return 'Pause anticipée';
    case 'pause_prolongee':
      return 'Pause prolongée';
    default:
      return 'Autre anomalie';
  }
}

interface EmployeeIncidentRowProps {
  incident: AttendanceIncident;
  viewDensity: 'compact' | 'detailed';
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const EmployeeIncidentRow: React.FC<EmployeeIncidentRowProps> = ({
  incident,
  viewDensity,
  isExpanded,
  onToggleExpand,
}) => {
  const isDeclared = incident.isDeclaredInAdvance || incident.status === 'signale' || incident.status === 'justifie';

  return (
    <div className={`p-4 transition hover:bg-stone-50/60 ${isExpanded ? 'bg-amber-50/30' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-stone-900 flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded-md">
              <Calendar className="h-3.5 w-3.5 text-stone-500" />
              {incident.date}
            </span>
            <span className="text-stone-600 font-mono text-[11px] bg-stone-100 px-2 py-0.5 rounded-md">
              ⏰ {incident.timeString}
            </span>
            <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-amber-100 text-amber-900">
              {getIncidentTypeLabel(incident.type)}
            </span>
            {incident.status === 'injustifie' ? (
              <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-rose-100 text-rose-800 flex items-center gap-1 shadow-2xs">
                ❌ Rejeté / Non justifié
              </span>
            ) : incident.status === 'justifie' ? (
              <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-100 text-emerald-800 flex items-center gap-1 shadow-2xs">
                <CheckCircle2 className="h-3 w-3" /> Validé &amp; Justifié
              </span>
            ) : isDeclared ? (
              <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-blue-100 text-blue-800 flex items-center gap-1 shadow-2xs">
                ⏳ En attente de validation
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-amber-100 text-amber-800 flex items-center gap-1 shadow-2xs">
                <Clock className="h-3 w-3" /> Signalement automatique
              </span>
            )}
          </div>

          <p className={`text-stone-700 ${viewDensity === 'compact' ? 'truncate max-w-2xl' : ''}`}>
            {incident.reason || 'Aucun motif renseigné pour cet événement.'}
          </p>
          {incident.adminComment && (
            <p className="text-[10px] text-stone-500 italic">Observation Direction : {incident.adminComment}</p>
          )}

          {isExpanded && (
            <div className="mt-3 p-3 bg-white rounded-2xl border border-stone-200 space-y-2 text-[11px] text-stone-600 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800">Détails de l&apos;anomalie d&apos;assiduité :</span>
                <span className="font-mono text-stone-400">ID: #{incident.id}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-100">
                <div><span className="font-semibold text-stone-700">Type :</span> {incident.type}</div>
                <div><span className="font-semibold text-stone-700">Statut :</span> {incident.status || 'Enregistré'}</div>
                <div><span className="font-semibold text-stone-700">Origine :</span> {incident.origin || 'Pointage'}</div>
                <div><span className="font-semibold text-stone-700">Date enregistrement :</span> {incident.date}</div>
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => {
              try { soundService.playClick(); } catch {}
              onToggleExpand();
            }}
            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold flex items-center gap-1 transition cursor-pointer"
          >
            <span>{isExpanded ? 'Moins' : 'Détails'}</span>
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
