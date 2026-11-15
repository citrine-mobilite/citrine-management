import React, { useState, useMemo } from 'react';
import { DisciplinaryIncident, Employee, AppUser, DisciplinaryStatus } from '../types';
import { DisciplinaryStats } from './disciplinary/DisciplinaryStats';
import { DisciplinaryIncidentCard } from './disciplinary/DisciplinaryIncidentCard';
import { DisciplinaryTableView } from './disciplinary/DisciplinaryTableView';
import { DisciplinaryCreateModal } from './disciplinary/DisciplinaryCreateModal';
import { DisciplinaryDetailView } from './disciplinary/DisciplinaryDetailView';
import { logSystemAudit } from '../services/adminAuditService';
import { executeOperationWithLoading } from '../utils/sweetAlert';
import { isSelfOnlyUser, findMatchingEmployee } from '../utils/roleUtils';
import { filterDisciplinaryIncidents, buildDisciplinaryStatusUpdate } from './disciplinary/disciplinaryHelpers';
import { DisciplinaryFilterToolbar } from './disciplinary/DisciplinaryFilterToolbar';

interface DisciplinaryPanelProps {
  incidents: DisciplinaryIncident[];
  onUpdateIncidents: (incidents: DisciplinaryIncident[]) => void;
  employees: Employee[];
  currentUser: AppUser | null;
  currentRole?: string;
  onAddNotification?: (type: 'whatsapp' | 'email' | 'system', title: string, content: string) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function DisciplinaryPanel({
  incidents = [],
  onUpdateIncidents,
  employees = [],
  currentUser,
  currentRole,
}: DisciplinaryPanelProps) {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DisciplinaryStatus>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [selectedIncident, setSelectedIncident] = useState<DisciplinaryIncident | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleAddIncident = async (newIncident: DisciplinaryIncident) => {
    await executeOperationWithLoading({
      loadingTitle: 'Enregistrement du dossier...',
      loadingText: 'Consignation du fait disciplinaire en base de données...',
      action: async () => {
        onUpdateIncidents([newIncident, ...incidents]);
        logSystemAudit({
          authorName: currentUser?.name || 'Responsable RH',
          authorRole: currentUser?.role || 'admin',
          targetName: newIncident.employeeName,
          targetEmployeeId: newIncident.employeeId,
          operationType: 'conseil_discipline',
          operationLabel: `Ouverture dossier disciplinaire [${newIncident.id}]`,
          details: `${newIncident.title} — Gravité: ${newIncident.severity.toUpperCase()}. Signalé par ${newIncident.reportedBy}`,
          level: newIncident.severity === 'critique' || newIncident.severity === 'grave' ? 'warning' : 'info',
        });
      },
      successTitle: 'Incident consigné !',
      successMessage: `Le dossier disciplinaire pour "${newIncident.employeeName}" a été ouvert avec succès.`,
    });
  };

  const handleUpdateIncident = async (updated: DisciplinaryIncident) => {
    await executeOperationWithLoading({
      loadingTitle: 'Mise à jour du dossier...',
      loadingText: 'Enregistrement des délibérations sur le serveur...',
      action: async () => {
        onUpdateIncidents(incidents.map((i) => (i.id === updated.id ? updated : i)));
        setSelectedIncident(updated);
        logSystemAudit({
          authorName: currentUser?.name || 'Responsable RH',
          authorRole: currentUser?.role || 'admin',
          targetName: updated.employeeName,
          targetEmployeeId: updated.employeeId,
          operationType: 'conseil_discipline',
          operationLabel: `Mise à jour dossier disciplinaire [${updated.id}]`,
          details: `Statut : ${updated.status}. Sanction : ${updated.sanctionType || 'En délibéré'}.`,
          level: updated.status === 'sanctionne' ? 'warning' : 'info',
        });
      },
      successTitle: 'Dossier mis à jour !',
      successMessage: `Le dossier disciplinaire pour "${updated.employeeName}" a été mis à jour avec succès.`,
    });
  };

  const handleUpdateStatus = (incident: DisciplinaryIncident, newStatus: DisciplinaryStatus) => {
    const updated = buildDisciplinaryStatusUpdate(incident, newStatus, currentUser?.name || 'Responsable RH');
    handleUpdateIncident(updated);
  };

  const isRestricted = isSelfOnlyUser(currentUser, currentRole);
  const myEmp = useMemo(() => findMatchingEmployee(employees, currentUser), [employees, currentUser]);
  const myEmpId = myEmp?.id || currentUser?.id;
  const myEmpName = (myEmp?.name || currentUser?.name || '').toLowerCase();

  const filteredIncidents = useMemo(
    () =>
      filterDisciplinaryIncidents({
        incidents,
        isRestricted,
        myEmpId,
        myEmpName,
        searchTerm,
        statusFilter,
        severityFilter,
        employeeFilter,
        periodFilter,
      }),
    [incidents, isRestricted, myEmpId, myEmpName, searchTerm, statusFilter, severityFilter, employeeFilter, periodFilter]
  );

  const openCount = incidents.filter((i) => i.status === 'ouvert' || i.status === 'en_instruction').length;
  const convoqueCount = incidents.filter((i) => i.status === 'convoque' || i.status === 'delibere').length;
  const sanctionneCount = incidents.filter((i) => i.status === 'sanctionne').length;
  const classeCount = incidents.filter((i) => i.status === 'classe').length;

  if (selectedIncident) {
    return (
      <DisciplinaryDetailView
        incident={selectedIncident}
        onBack={() => setSelectedIncident(null)}
        onUpdateIncident={handleUpdateIncident}
        currentUserName={currentUser?.name || 'Responsable RH'}
        currentUserRole={currentUser?.role || 'Administrateur'}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      <DisciplinaryFilterToolbar
        totalIncidentsCount={incidents.length}
        isRestricted={isRestricted}
        onOpenCreate={() => setShowCreateModal(true)}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        openCount={openCount}
        convoqueCount={convoqueCount}
        sanctionneCount={sanctionneCount}
        classeCount={classeCount}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        viewMode={viewMode}
        setViewMode={setViewMode}
        severityFilter={severityFilter}
        setSeverityFilter={setSeverityFilter}
        employeeFilter={employeeFilter}
        setEmployeeFilter={setEmployeeFilter}
        periodFilter={periodFilter}
        setPeriodFilter={setPeriodFilter}
        employees={employees}
      />

      <div className="space-y-6">
        <DisciplinaryStats incidents={filteredIncidents} />

        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredIncidents.map((incident) => (
              <DisciplinaryIncidentCard
                key={incident.id}
                incident={incident}
                onSelect={(inc) => setSelectedIncident(inc)}
              />
            ))}
            {filteredIncidents.length === 0 && (
              <div className="col-span-full bg-white p-12 rounded-3xl border border-stone-200 text-center text-stone-400 italic">
                Aucun dossier disciplinaire ne correspond à votre recherche.
              </div>
            )}
          </div>
        ) : (
          <DisciplinaryTableView
            incidents={filteredIncidents}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
      </div>

      <DisciplinaryCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        employees={employees}
        onSubmit={handleAddIncident}
        authorName={currentUser?.name || 'Responsable RH'}
      />
    </div>
  );
}
