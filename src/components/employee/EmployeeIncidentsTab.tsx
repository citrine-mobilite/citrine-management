import React, { useState, useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Search, Filter, LayoutList, LayoutGrid } from 'lucide-react';
import { AttendanceIncident, Employee } from '../../types';
import { soundService } from '../../services/soundService';
import { EmployeeIncidentsSummary } from './EmployeeIncidentsSummary';
import { EmployeeIncidentRow, getIncidentTypeLabel } from './EmployeeIncidentRow';

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

  const filteredIncidents = useMemo(() => {
    return myIncidents
      .filter((incident) => {
        const isDeclared = incident.isDeclaredInAdvance || incident.status === 'signale' || incident.status === 'justifie';
        if (filter === 'justified' && !isDeclared) return false;
        if (filter === 'automatic' && isDeclared) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesType = getIncidentTypeLabel(incident.type).toLowerCase().includes(q);
          const matchesReason = (incident.reason || '').toLowerCase().includes(q);
          const matchesDate = (incident.date || '').toLowerCase().includes(q);
          if (!matchesType && !matchesReason && !matchesDate) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
  }, [myIncidents, filter, searchQuery]);

  return (
    <div className="space-y-6">
      <EmployeeIncidentsSummary
        totalCount={myIncidents.length}
        declaredCount={declaredCount}
        autoRetardCount={autoRetardCount}
        autoDepartCount={autoDepartCount}
        onOpenDeclareIncidentModal={onOpenDeclareIncidentModal}
      />

      <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { key: 'all', label: `Tous (${myIncidents.length})`, activeClass: 'bg-stone-900 text-white shadow-sm', Icon: Filter },
            { key: 'justified', label: `Justifiés (${declaredCount})`, activeClass: 'bg-emerald-700 text-white shadow-sm', Icon: CheckCircle2 },
            { key: 'automatic', label: `Automatiques (${myIncidents.length - declaredCount})`, activeClass: 'bg-amber-700 text-white shadow-sm', Icon: Clock },
          ].map(({ key, label, activeClass, Icon }) => (
            <button
              key={key}
              onClick={() => { try { soundService.playClick(); } catch {} setFilter(key as any); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                filter === key ? activeClass : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
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

          <div className="flex items-center bg-stone-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => { try { soundService.playClick(); } catch {} setViewDensity('compact'); }}
              title="Vue compacte"
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${viewDensity === 'compact' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'}`}
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              onClick={() => { try { soundService.playClick(); } catch {} setViewDensity('detailed'); }}
              title="Vue détaillée"
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${viewDensity === 'detailed' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

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
            <p className="text-xs text-stone-500 max-w-sm mx-auto">Aucun événement ne correspond à vos critères de recherche actuels.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredIncidents.map((incident) => (
              <EmployeeIncidentRow
                key={incident.id}
                incident={incident}
                viewDensity={viewDensity}
                isExpanded={expandedIncidentId === incident.id}
                onToggleExpand={() => setExpandedIncidentId(expandedIncidentId === incident.id ? null : incident.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
