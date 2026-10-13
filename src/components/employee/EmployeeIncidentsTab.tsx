import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  PlusCircle, 
  ShieldAlert, 
  Calendar,
  Search,
  Filter,
  LayoutList,
  LayoutGrid,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { AttendanceIncident, Employee } from '../../types';
import { soundService } from '../../services/soundService';

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
  const [filter, setFilter] = useState<'all' | 'justified' | 'automatic'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewDensity, setViewDensity] = useState<'compact' | 'detailed'>('compact');
  const [expandedIncidentId, setExpandedIncidentId] = useState<string | null>(null);

  const declaredCount = myIncidents.filter(
    (i) => i.isDeclaredInAdvance || i.status === 'signale' || i.status === 'justifie'
  ).length;
  const autoRetardCount = myIncidents.filter(
    (i) => i.type === 'retard' && (i.origin === 'automatique_pointage' || i.status === 'automatique')
  ).length;
  const autoDepartCount = myIncidents.filter(
    (i) => (i.type === 'sortie_prematuree' || i.type === 'depart_anticipe') && (i.origin === 'automatique_pointage' || i.status === 'automatique')
  ).length;

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

  const filteredIncidents = useMemo(() => {
    return myIncidents.filter((incident) => {
      const isDeclared = incident.isDeclaredInAdvance || incident.status === 'signale' || incident.status === 'justifie';
      
      // Filter tab
      if (filter === 'justified' && !isDeclared) return false;
      if (filter === 'automatic' && isDeclared) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesType = getTypeLabel(incident.type).toLowerCase().includes(q);
        const matchesReason = (incident.reason || '').toLowerCase().includes(q);
        const matchesDate = (incident.date || '').toLowerCase().includes(q);
        if (!matchesType && !matchesReason && !matchesDate) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
  }, [myIncidents, filter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header and Action Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-emerald-800 to-stone-900 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <AlertTriangle className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg">Journal des Signalements & Assiduité</h2>
              <p className="text-xs text-amber-100/80">Suivi en temps réel de vos retards, départs et justifications</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            try { soundService.playClick(); } catch {}
            onOpenDeclareIncidentModal();
          }}
          className="bg-white text-stone-900 hover:bg-amber-50 font-bold px-4 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-lg transition cursor-pointer shrink-0 relative z-10"
        >
          <PlusCircle className="h-4 w-4 text-amber-700" />
          <span>Signaler un événement (Retard / Départ)</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs hover:border-amber-300 transition">
          <div className="flex items-center justify-between text-stone-500 mb-1 text-[11px] font-bold">
            <span>Total Signalements</span>
            <AlertCircle className="h-4 w-4 text-stone-400" />
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900">{myIncidents.length}</div>
          <p className="text-[10px] text-stone-400 mt-0.5">Historique complet</p>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/80 shadow-2xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between text-emerald-800 mb-1 text-[11px] font-bold">
            <span>Signalés & Justifiés</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-emerald-950">{declaredCount}</div>
          <p className="text-[10px] text-emerald-700 mt-0.5">Prévenus avant pointage</p>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 shadow-2xs hover:border-amber-300 transition">
          <div className="flex items-center justify-between text-amber-800 mb-1 text-[11px] font-bold">
            <span>Retards non justifiés</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-amber-950">{autoRetardCount}</div>
          <p className="text-[10px] text-amber-700 mt-0.5">Badgés sans déclaration</p>
        </div>

        <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200/80 shadow-2xs hover:border-rose-300 transition">
          <div className="flex items-center justify-between text-rose-800 mb-1 text-[11px] font-bold">
            <span>Départs anticipés auto</span>
            <ShieldAlert className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-rose-950">{autoDepartCount}</div>
          <p className="text-[10px] text-rose-700 mt-0.5">Parti avant l'heure prévue</p>
        </div>
      </div>

      {/* Toolbar: Filters, Search, and Density Toggle */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => { try { soundService.playClick(); } catch {} setFilter('all'); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              filter === 'all'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Tous ({myIncidents.length})</span>
          </button>
          <button
            onClick={() => { try { soundService.playClick(); } catch {} setFilter('justified'); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              filter === 'justified'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Justifiés ({declaredCount})</span>
          </button>
          <button
            onClick={() => { try { soundService.playClick(); } catch {} setFilter('automatic'); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              filter === 'automatic'
                ? 'bg-amber-700 text-white shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Automatiques ({myIncidents.length - declaredCount})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Bar */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un signalement..."
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            />
          </div>

          {/* Density Toggle */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => { try { soundService.playClick(); } catch {} setViewDensity('compact'); }}
              title="Vue compacte"
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                viewDensity === 'compact' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              onClick={() => { try { soundService.playClick(); } catch {} setViewDensity('detailed'); }}
              title="Vue détaillée"
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                viewDensity === 'detailed' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Signalement List Container */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <h3 className="font-serif font-bold text-xs text-stone-900 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-600" /> Historique des Signalements de {employeeProfile.name}
          </h3>
          <span className="text-[11px] font-bold text-stone-500">
            {filteredIncidents.length} affiché(s) sur {myIncidents.length}
          </span>
        </div>

        {filteredIncidents.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-stone-800 text-sm">Aucun signalement trouvé</h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Aucun événement ne correspond à vos critères de recherche actuels.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredIncidents.map((incident) => {
              const isDeclared = incident.isDeclaredInAdvance || incident.status === 'signale' || incident.status === 'justifie';
              const isExpanded = expandedIncidentId === incident.id;

              return (
                <div 
                  key={incident.id} 
                  className={`p-4 transition hover:bg-stone-50/60 ${isExpanded ? 'bg-amber-50/30' : ''}`}
                >
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
                          {getTypeLabel(incident.type)}
                        </span>
                        {isDeclared ? (
                          <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-100 text-emerald-800 flex items-center gap-1 shadow-2xs">
                            <CheckCircle2 className="h-3 w-3" /> Justifié (Signalé en avance)
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

                      {isExpanded && (
                        <div className="mt-3 p-3 bg-white rounded-2xl border border-stone-200 space-y-2 text-[11px] text-stone-600 shadow-inner">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-stone-800">Détails de l'anomalie d'assiduité :</span>
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
                          setExpandedIncidentId(isExpanded ? null : incident.id);
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
            })}
          </div>
        )}
      </div>
    </div>
  );
};
