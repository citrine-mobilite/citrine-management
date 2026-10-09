import React from 'react';
import { ShieldCheck, MapPin, Calendar, User } from 'lucide-react';
import { HseIncident, HseSeverity, HseStatus, HseIncidentType } from '../../types';

export function getSeverityBadge(sev: HseSeverity) {
  switch (sev) {
    case 'faible':
      return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Faible</span>;
    case 'modere':
      return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Modéré</span>;
    case 'grave':
      return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">Grave</span>;
    case 'critique':
      return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">Critique</span>;
  }
}

export function getTypeLabel(type: HseIncidentType) {
  switch (type) {
    case 'presque_accident': return 'Presque-accident (Near-miss)';
    case 'situation_dangereuse': return 'Situation dangereuse';
    case 'accident_sans_arret': return 'Accident bénin (Sans arrêt)';
    case 'accident_avec_arret': return 'Accident avec arrêt de travail';
    case 'deversement_chimique': return 'Déversement / Pollution';
    case 'degradation_materiel': return 'Dommage matériel / Équipement';
    case 'incendie_debut': return 'Départ de feu / Risque incendie';
    default: return type;
  }
}

export function getStatusBadge(status: HseStatus) {
  switch (status) {
    case 'signale':
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Signalé</span>;
    case 'en_cours_analyse':
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">En analyse</span>;
    case 'actions_lancees':
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">Actions en cours</span>;
    case 'cloture':
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">Clôturé</span>;
  }
}

interface HseIncidentsGridProps {
  incidents: HseIncident[];
  onSelectIncident: (inc: HseIncident) => void;
}

export const HseIncidentsGrid: React.FC<HseIncidentsGridProps> = ({ incidents, onSelectIncident }) => {
  if (incidents.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-8">
        <ShieldCheck className="w-12 h-12 text-stone-300 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-stone-700">Aucun incident à afficher</h3>
        <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
          Tous les indicateurs de sécurité sont au vert pour les filtres sélectionnés.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {incidents.map((inc) => {
        const completedCount = (inc.correctiveActions || []).filter((a) => a.isCompleted).length;
        const totalActions = (inc.correctiveActions || []).length;

        return (
          <div
            key={inc.id}
            onClick={() => onSelectIncident(inc)}
            className="bg-white p-5 rounded-xl border border-stone-200 hover:border-amber-400 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-xs font-bold text-stone-800">{inc.reference}</span>
                <div className="flex items-center gap-1.5">
                  {getSeverityBadge(inc.severity)}
                  {getStatusBadge(inc.status)}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-stone-900 line-clamp-1">{inc.title}</h4>
                <p className="text-xs text-amber-700 font-medium mt-0.5">{getTypeLabel(inc.type)}</p>
              </div>

              <p className="text-xs text-stone-600 line-clamp-2">{inc.description}</p>

              <div className="space-y-1 text-[11px] text-stone-500 pt-1">
                <p className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>
                    {inc.site} {inc.zonePrecise ? `(${inc.zonePrecise})` : ''}
                  </span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>
                    {inc.date} à {inc.time || 'Non précisé'}
                  </span>
                </p>
                <p className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>Signalé par : {inc.reportedBy}</span>
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="text-stone-500 font-medium">
                Actions CAPA :{' '}
                <strong className="text-stone-800">
                  {completedCount}/{totalActions}
                </strong>
              </span>
              <span className="text-[#2A7B76] font-semibold">Voir plan &gt;</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
