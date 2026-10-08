import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  PlusCircle, 
  ShieldAlert, 
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';
import { AttendanceIncident, Employee } from '../../types';

interface EmployeeIncidentsTabProps {
  employeeProfile: Employee;
  myIncidents: AttendanceIncident[];
  onOpenDeclareIncidentModal: () => void;
}

export const EmployeeIncidentsTab: React.FC<EmployeeIncidentsTabProps> = ({
  employeeProfile,
  myIncidents,
  onOpenDeclareIncidentModal,
}) => {
  const declaredCount = myIncidents.filter(
    (i) => i.isDeclaredInAdvance || i.status === 'signale' || i.status === 'justifie'
  ).length;
  const autoRetardCount = myIncidents.filter(
    (i) => i.type === 'retard' && (i.origin === 'automatique_pointage' || i.status === 'automatique')
  ).length;
  const autoDepartCount = myIncidents.filter(
    (i) => (i.type === 'sortie_prematuree' || i.type === 'depart_anticipe') && (i.origin === 'automatique_pointage' || i.status === 'automatique')
  ).length;

  const sortedIncidents = [...myIncidents].sort(
    (a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
  );

  const getTypeLabel = (type: AttendanceIncident['type']) => {
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
  };

  return (
    <div className="space-y-6">
      {/* Header and Action Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-stone-800 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-300" />
            <h2 className="font-serif font-bold text-lg">Journal des Incidents & Assiduité</h2>
          </div>
          <p className="text-xs text-amber-100 max-w-xl">
            Suivi de vos déclarations préalables et des incidents détectés automatiquement lors du pointage (retards, départs anticipés).
          </p>
        </div>

        <button
          onClick={onOpenDeclareIncidentModal}
          className="bg-white text-amber-900 hover:bg-amber-50 font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-md transition cursor-pointer shrink-0"
        >
          <PlusCircle className="h-4 w-4 text-amber-700" />
          <span>Signaler un incident (Retard / Départ)</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1 text-[11px] font-bold">
            <span>Total Incidents</span>
            <AlertCircle className="h-4 w-4 text-stone-400" />
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900">{myIncidents.length}</div>
          <p className="text-[10px] text-stone-400 mt-0.5">Historique complet</p>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 mb-1 text-[11px] font-bold">
            <span>Signalés & Justifiés</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-emerald-950">{declaredCount}</div>
          <p className="text-[10px] text-emerald-700 mt-0.5">Prévenus avant pointage</p>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-amber-800 mb-1 text-[11px] font-bold">
            <span>Retards non justifiés</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-amber-950">{autoRetardCount}</div>
          <p className="text-[10px] text-amber-700 mt-0.5">Badgés sans déclaration</p>
        </div>

        <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-rose-800 mb-1 text-[11px] font-bold">
            <span>Départs anticipés auto</span>
            <ShieldAlert className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-rose-950">{autoDepartCount}</div>
          <p className="text-[10px] text-rose-700 mt-0.5">Parti avant l'heure prévue</p>
        </div>
      </div>

      {/* Rules Notice */}
      <div className="bg-stone-50 border border-stone-200/90 rounded-2xl p-4 flex items-start gap-3 text-xs text-stone-600">
        <Info className="h-4 w-4 text-[#2A7B76] shrink-0 mt-0.5" />
        <p>
          <strong className="text-stone-800">Règle de transparence :</strong> Si vous prévenez à l'avance d'un retard ou départ anticipé via le bouton "Signaler un incident", votre pointage sera catalogué comme <span className="text-emerald-700 font-bold">incident justifié</span> et non pénalisé comme retard injustifié. En revanche, tout pointage tardif ou départ anticipé sans signalement préalable génère un <span className="text-amber-700 font-bold">incident automatique</span> au dossier.
        </p>
      </div>

      {/* Incident List */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <h3 className="font-serif font-bold text-xs text-stone-900 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-600" /> Historique des Incidents de {employeeProfile.name}
          </h3>
          <span className="text-[11px] font-bold text-stone-500">
            {myIncidents.length} enregistrement(s)
          </span>
        </div>

        {sortedIncidents.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-stone-800 text-sm">Aucun incident à signaler</h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Félicitations ! Votre assiduité est exemplaire, aucun retard non justifié ou départ anormal n'a été consigné.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {sortedIncidents.map((incident) => {
              const isDeclared = incident.isDeclaredInAdvance || incident.status === 'signale' || incident.status === 'justifie';
              return (
                <div key={incident.id} className="p-4 hover:bg-stone-50/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-stone-900 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-stone-400" />
                        {incident.date}
                      </span>
                      <span className="text-stone-500 font-mono text-[11px]">
                        [{incident.timeString}]
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700">
                        {getTypeLabel(incident.type)}
                      </span>
                      {isDeclared ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Signalé à l'avance (Justifié)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Incident Automatique (Sans préavis)
                        </span>
                      )}
                    </div>
                    <p className="text-stone-700 font-medium text-xs">
                      {incident.reason}
                    </p>
                    {incident.adminComment && (
                      <p className="text-[11px] text-[#2A7B76] italic bg-emerald-50/60 p-1.5 rounded-lg border border-emerald-100">
                        Observation RH : {incident.adminComment}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="text-[10px] text-stone-400 block">
                      Origine : {incident.origin === 'automatique_pointage' ? 'Pointage direct' : 'Signalement collaborateur'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
