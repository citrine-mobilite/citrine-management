import React from 'react';
import { AlertTriangle, CheckCircle2, AlertCircle, Search, Plus } from 'lucide-react';
import { AttendanceIncident, Employee } from '../../types';
import { usePresenceIncidentsLogic } from './incidents/usePresenceIncidentsLogic';
import { PresenceIncidentsTable } from './incidents/PresenceIncidentsTable';
import { PresenceIncidentModals } from './incidents/PresenceIncidentModals';

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
  const logic = usePresenceIncidentsLogic({
    attendanceIncidents,
    employees,
    onUpdateAttendanceIncidents,
    showToast,
  });

  return (
    <div className="space-y-4">
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
          <div className="text-2xl font-serif font-bold text-emerald-950">{logic.declaredCount}</div>
          <p className="text-[10px] text-emerald-700">Déclarations préalables acceptées</p>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-amber-800 mb-1 text-[11px] font-bold">
            <span>Incidents Automatiques</span>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-amber-950">{logic.autoCount}</div>
          <p className="text-[10px] text-amber-700">Retards ou départs sans déclaration</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="h-4 w-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par collaborateur, motif ou date..."
            value={logic.searchTerm}
            onChange={(e) => logic.setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#2A7B76]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={logic.typeFilter}
            onChange={(e) => logic.setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-700 font-semibold focus:outline-none"
          >
            <option value="all">Tous les types</option>
            <option value="absence_injustifiee">Absences injustifiées</option>
            <option value="depart_sans_validation">Départs sans validation</option>
            <option value="retard">Retards</option>
            <option value="sortie_prematuree">Sorties prématurées</option>
            <option value="pause_anticipee">Pauses anticipées</option>
            <option value="pause_prolongee">Pauses prolongées</option>
          </select>

          <select
            value={logic.statusFilter}
            onChange={(e) => logic.setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-700 font-semibold focus:outline-none"
          >
            <option value="all">Tous les statuts</option>
            <option value="declared">Signalés par employés</option>
            <option value="auto">Détectés automatiquement</option>
          </select>

          <button
            onClick={() => {
              logic.setNewEmployeeId(employees[0]?.id || '');
              logic.setShowCreateModal(true);
            }}
            className="bg-[#2A7B76] hover:bg-[#20635F] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 ml-auto md:ml-0"
            title="Consigner manuellement un manquement ou une absence non validée"
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau signalement</span>
          </button>
        </div>
      </div>

      <PresenceIncidentsTable
        sorted={logic.sorted}
        employees={employees}
        onSelectForJustification={(inc) => {
          logic.setSelectedIncidentForJustification(inc);
          logic.setAdminNote(inc.adminComment || '');
        }}
      />

      <PresenceIncidentModals
        employees={employees}
        selectedIncidentForJustification={logic.selectedIncidentForJustification}
        onCloseJustification={() => logic.setSelectedIncidentForJustification(null)}
        adminNote={logic.adminNote}
        setAdminNote={logic.setAdminNote}
        onJustifyIncident={logic.handleJustifyIncident}
        showCreateModal={logic.showCreateModal}
        onCloseCreateModal={() => logic.setShowCreateModal(false)}
        newEmployeeId={logic.newEmployeeId}
        setNewEmployeeId={logic.setNewEmployeeId}
        newType={logic.newType}
        setNewType={logic.setNewType}
        newDate={logic.newDate}
        setNewDate={logic.setNewDate}
        newTime={logic.newTime}
        setNewTime={logic.setNewTime}
        newReason={logic.newReason}
        setNewReason={logic.setNewReason}
        newAdminNote={logic.newAdminNote}
        setNewAdminNote={logic.setNewAdminNote}
        isCreating={logic.isCreating}
        onCreateManualIncident={logic.handleCreateManualIncident}
      />
    </div>
  );
};
