import React, { useState, useEffect } from 'react';
import { VisitorLog, AppUser, Employee } from '../../types';
import { subscribeToVisitorLogs } from '../../services/visitorLogService';
import { subscribeToBuildingSupervisors, BuildingSupervisor } from '../../services/supervisorService';
import { VisitorsKpiCards } from './VisitorsKpiCards';
import { VisitorDetailModal } from './VisitorDetailModal';
import { NewVisitorModal } from './NewVisitorModal';
import { VisitorsTable } from './VisitorsTable';
import { SupervisorConfigModal } from './SupervisorConfigModal';
import { useVisitorsActions } from './useVisitorsActions';
import { VisitorsHeaderAndFilters } from './VisitorsHeaderAndFilters';

interface VisitorsPanelProps {
  currentUser?: AppUser | null;
  employees: Employee[];
  onAddNotification?: (n: any) => void;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}

export const VisitorsPanel: React.FC<VisitorsPanelProps> = ({
  employees,
  onAddNotification,
  showToast,
}) => {
  const [visitors, setVisitors] = useState<VisitorLog[]>([]);
  const [supervisors, setSupervisors] = useState<BuildingSupervisor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [personTypeFilter, setPersonTypeFilter] = useState<string>('all');

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isSupervisorsModalOpen, setIsSupervisorsModalOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorLog | null>(null);

  useEffect(() => {
    const unsubVisitors = subscribeToVisitorLogs(setVisitors);
    const unsubSupervisors = subscribeToBuildingSupervisors(setSupervisors);
    return () => {
      unsubVisitors();
      unsubSupervisors();
    };
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  const currentOnSite = visitors.filter((v) => v.status === 'sur_site').length;
  const todayDeparted = visitors.filter((v) => v.status === 'sorti' && v.checkInDate === todayStr).length;
  const pendingApprovals = visitors.filter((v) => v.status === 'attente_validation' || v.status === 'attendu').length;
  const todayTotal = visitors.filter((v) => v.checkInDate === todayStr).length;

  const filteredVisitors = visitors.filter((v) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      v.visitorName.toLowerCase().includes(q) ||
      (v.visitorCompany && v.visitorCompany.toLowerCase().includes(q)) ||
      v.badgeNumber.toLowerCase().includes(q) ||
      (v.vehiclePlate && v.vehiclePlate.toLowerCase().includes(q)) ||
      v.hostEmployeeName.toLowerCase().includes(q) ||
      (v.supervisorName && v.supervisorName.toLowerCase().includes(q)) ||
      (v.idCardNumber && v.idCardNumber.toLowerCase().includes(q));

    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    const matchType = personTypeFilter === 'all' || (v.personType || 'visiteur') === personTypeFilter;
    const matchDate =
      dateFilter === 'all'
        ? true
        : dateFilter === 'today'
        ? v.checkInDate === todayStr
        : v.checkInDate === selectedDate;

    return matchSearch && matchStatus && matchType && matchDate;
  });

  const {
    handleQuickCheckOut,
    handleQuickCheckIn,
    handleAuthorizeAccess,
    handleRejectAccess,
    handleCreateVisitor,
    handleDeleteVisitor,
  } = useVisitorsActions({
    employees,
    visitorsCount: visitors.length,
    setVisitors,
    setIsNewModalOpen,
    onAddNotification,
    showToast,
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <VisitorsHeaderAndFilters
        supervisorsCount={supervisors.length}
        todayStr={todayStr}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        personTypeFilter={personTypeFilter}
        setPersonTypeFilter={setPersonTypeFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        onOpenSupervisorsModal={() => setIsSupervisorsModalOpen(true)}
        onOpenNewModal={() => setIsNewModalOpen(true)}
        kpiSlot={
          <VisitorsKpiCards
            currentOnSite={currentOnSite}
            todayDeparted={todayDeparted}
            expectedVisitors={pendingApprovals}
            todayTotal={todayTotal}
          />
        }
      />

      <VisitorsTable
        visitors={filteredVisitors}
        onSelectVisitor={setSelectedVisitor}
        onQuickCheckOut={handleQuickCheckOut}
        onQuickCheckIn={handleQuickCheckIn}
        onAuthorizeAccess={handleAuthorizeAccess}
        onRejectAccess={handleRejectAccess}
      />

      {isNewModalOpen && (
        <NewVisitorModal
          employees={employees}
          visitorsCount={visitors.length}
          knownWorkers={visitors}
          onClose={() => setIsNewModalOpen(false)}
          onSubmit={handleCreateVisitor}
        />
      )}

      {isSupervisorsModalOpen && (
        <SupervisorConfigModal
          currentSupervisors={supervisors}
          onClose={() => setIsSupervisorsModalOpen(false)}
          onSaved={() => {
            showToast?.('Liste des superviseurs mise à jour en base de données.', 'success');
          }}
        />
      )}

      {selectedVisitor && (
        <VisitorDetailModal
          visitor={selectedVisitor}
          onClose={() => setSelectedVisitor(null)}
          onDelete={handleDeleteVisitor}
        />
      )}
    </div>
  );
};

export default VisitorsPanel;
