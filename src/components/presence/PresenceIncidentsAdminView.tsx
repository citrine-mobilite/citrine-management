import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldAlert, 
  Search, 
  Filter, 
  Check, 
  X,
  FileCheck2,
  Calendar
} from 'lucide-react';
import { AttendanceIncident, Employee } from '../../types';
import { incidentService } from '../../services/incidentService';

interface PresenceIncidentsAdminViewProps {
  attendanceIncidents: AttendanceIncident[];
  employees: Employee[];
  onUpdateAttendanceIncidents?: (incidents: AttendanceIncident[]) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export const PresenceIncidentsAdminView: React.FC<PresenceIncidentsAdminViewProps> = ({
  attendanceIncidents,
  employees,
  onUpdateAttendanceIncidents,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIncidentForJustification, setSelectedIncidentForJustification] = useState<AttendanceIncident | null>(null);
  const [adminNote, setAdminNote] = useState('');

  const filtered = attendanceIncidents.filter((inc) => {
    const matchesSearch = 
      inc.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.date.includes(searchTerm);
    const matchesType = 
      typeFilter === 'all' || 
      inc.type === typeFilter || 
      (typeFilter === 'sortie_prematuree' && (inc.type === 'sortie_prematuree' || inc.type === 'depart_anticipe'));
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'auto' && (inc.origin === 'automatique_pointage' || inc.status === 'automatique')) ||
      (statusFilter === 'declared' && (inc.isDeclaredInAdvance || inc.status === 'signale' || inc.status === 'justifie'));
    return matchesSearch && matchesType && matchesStatus;
  });

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
  );

  const handleJustifyIncident = async (incident: AttendanceIncident, justifie: boolean) => {
    const updated = {
      ...incident,
      isJustified: justifie,
      status: (justifie ? 'justifie' : 'injustifie') as AttendanceIncident['status'],
      adminComment: adminNote.trim() || (justifie ? 'Validé et justifié par la direction.' : 'Maintenu non justifié par la direction.'),
    };

    await incidentService.saveIncident(updated);
    if (onUpdateAttendanceIncidents) {
      const newList = attendanceIncidents.map((i) => (i.id === incident.id ? updated : i));
      onUpdateAttendanceIncidents(newList);
    }
    showToast?.(`Incident ${justifie ? 'validé et justifié' : 'marqué non justifié'}.`, 'success');
    setSelectedIncidentForJustification(null);
    setAdminNote('');
  };

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
        return 'Autre';
    }
  };

  const autoCount = attendanceIncidents.filter(
    (i) => i.origin === 'automatique_pointage' || i.status === 'automatique'
  ).length;
  const declaredCount = attendanceIncidents.filter(
    (i) => i.isDeclaredInAdvance || i.status === 'signale'
  ).length;

  return (
    <div className="space-y-4">
      {/* KPI mini banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1 text-[11px] font-bold">
            <span>Total des Incidents</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900">{attendanceIncidents.length}</div>
          <p className="text-[10px] text-stone-400">Toutes déclarations et détections</p>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 mb-1 text-[11px] font-bold">
            <span>Prévenus par Employés</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-emerald-950">{declaredCount}</div>
          <p className="text-[10px] text-emerald-700">Déclarations préalables acceptées</p>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-amber-800 mb-1 text-[11px] font-bold">
            <span>Incidents Automatiques</span>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-amber-950">{autoCount}</div>
          <p className="text-[10px] text-amber-700">Retards ou départs sans déclaration</p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="h-4 w-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par collaborateur, motif ou date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#2A7B76]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-700 font-semibold focus:outline-none"
          >
            <option value="all">Tous les types</option>
            <option value="retard">Retards</option>
            <option value="sortie_prematuree">Sorties prématurées</option>
            <option value="pause_anticipee">Pauses anticipées</option>
            <option value="pause_prolongee">Pauses prolongées</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-700 font-semibold focus:outline-none"
          >
            <option value="all">Tous les statuts</option>
            <option value="declared">Signalés par employés</option>
            <option value="auto">Détectés automatiquement</option>
          </select>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <h3 className="font-serif font-bold text-xs text-stone-900 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-600" /> Registre d'Assiduité des Collaborateurs ({sorted.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 text-[10px] uppercase font-bold border-b border-stone-100">
              <tr>
                <th className="py-3 px-4">Date & Heure</th>
                <th className="py-3 px-4">Collaborateur</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Origine & Statut</th>
                <th className="py-3 px-4">Motif Circonstancié</th>
                <th className="py-3 px-4 text-right">Décision RH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400 italic">
                    Aucun incident trouvé avec ces filtres.
                  </td>
                </tr>
              ) : (
                sorted.map((inc) => {
                  const isDeclared = inc.isDeclaredInAdvance || inc.status === 'signale' || inc.status === 'justifie';
                  return (
                    <tr key={inc.id} className="hover:bg-stone-50/60 transition">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-stone-900">{inc.date}</div>
                        <span className="font-mono text-[11px] text-stone-500">[{inc.timeString}]</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-stone-900 block">{inc.employeeName}</span>
                        <span className="text-[10px] text-stone-400 font-mono">ID: {inc.employeeId}</span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700">
                          {getTypeLabel(inc.type)}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {isDeclared ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="h-3 w-3" /> Signalé à l'avance
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1 w-fit">
                            <AlertCircle className="h-3 w-3" /> Incident Automatique
                          </span>
                        )}
                        {inc.status === 'justifie' && (
                          <span className="text-[9px] text-emerald-700 font-bold block mt-0.5">
                            ✓ Justifié par Direction
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 min-w-[220px]">
                        <p className="text-stone-800 text-xs">{inc.reason}</p>
                        {inc.adminComment && (
                          <p className="text-[10px] text-[#2A7B76] italic mt-0.5">
                            Observation RH : {inc.adminComment}
                          </p>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedIncidentForJustification(inc);
                            setAdminNote(inc.adminComment || '');
                          }}
                          className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 font-bold text-xs transition cursor-pointer flex items-center gap-1 ml-auto"
                        >
                          <FileCheck2 className="h-3.5 w-3.5 text-[#2A7B76]" />
                          <span>Gérer</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Justification & Review Modal */}
      {selectedIncidentForJustification && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-stone-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-[#2A7B76]" /> Décision RH sur l'Incident
              </h3>
              <button
                onClick={() => setSelectedIncidentForJustification(null)}
                className="p-1 rounded-xl text-stone-400 hover:bg-stone-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 bg-stone-50 p-3 rounded-2xl border border-stone-200/80">
              <div>
                <span className="text-[10px] text-stone-400 font-bold uppercase block">Collaborateur</span>
                <span className="font-bold text-stone-900">{selectedIncidentForJustification.employeeName}</span>
              </div>
              <div className="flex justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Date & Heure</span>
                  <span className="font-semibold text-stone-800">{selectedIncidentForJustification.date} à {selectedIncidentForJustification.timeString}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Type</span>
                  <span className="font-bold text-stone-800 uppercase text-[11px]">{getTypeLabel(selectedIncidentForJustification.type)}</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 font-bold uppercase block">Motif constaté</span>
                <p className="text-stone-700 italic">{selectedIncidentForJustification.reason}</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-stone-600 block">
                Observation de la Direction / Motif d'approbation :
              </label>
              <textarea
                rows={2}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Ex: Justificatif médical reçu, embouteillage vérifié..."
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#2A7B76] text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => handleJustifyIncident(selectedIncidentForJustification, false)}
                className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold cursor-pointer"
              >
                Classer Non Justifié
              </button>
              <button
                onClick={() => handleJustifyIncident(selectedIncidentForJustification, true)}
                className="px-4 py-2 rounded-xl bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold cursor-pointer shadow-xs"
              >
                Valider & Justifier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
