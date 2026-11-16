import React from 'react';
import { Employee, Presence, NotificationLog, CompanyModuleConfig, AppUser, AttendanceIncident } from '../types';
import DynamicQrManagerModal from './presence/DynamicQrManagerModal';
import AdminOnBehalfClockModal from './presence/AdminOnBehalfClockModal';
import { PersonalAccessKeyModal } from './presence/PersonalAccessKeyModal';
import { StaticDoorQrModal } from './presence/StaticDoorQrModal';
import { PresenceIncidentsAdminView } from './presence/PresenceIncidentsAdminView';
import PresenceRequestsView from './PresenceRequestsView';
import WeeklyAttendanceRecapModal from './presence/WeeklyAttendanceRecapModal';
import { usePresencePanelLogic } from './presence/usePresencePanelLogic';
import { PresenceQuickActionsBar } from './presence/PresenceQuickActionsBar';
import { PresenceSidebarWidget } from './presence/PresenceSidebarWidget';
import { PresenceFiltersBar } from './presence/PresenceFiltersBar';
import { PresenceRegistersCard } from './presence/PresenceRegistersCard';
import { PresenceMapCard } from './presence/PresenceMapCard';
import { PresenceManualEditModal } from './presence/PresenceManualEditModal';

interface PresencePanelProps {
  employees: Employee[];
  presences: Presence[];
  onUpdatePresences: (updated: Presence[]) => void;
  onAddNotification: (log: NotificationLog) => void;
  currentRole: 'Administrateur' | 'Employé' | 'Responsable';
  selectedEmployeeId: string;
  onSelectEmployee: (id: string) => void;
  currentTime: string;
  onSelectTab?: (tab: any) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
  moduleConfig?: CompanyModuleConfig;
  onUpdateModuleConfig?: (config: CompanyModuleConfig) => Promise<void> | void;
  currentUser?: AppUser;
  attendanceIncidents?: AttendanceIncident[];
  onUpdateAttendanceIncidents?: (incidents: AttendanceIncident[]) => void;
  onAddAttendanceIncident?: (incident: AttendanceIncident) => void;
}

export default function PresencePanel({
  employees = [],
  presences = [],
  onUpdatePresences,
  onAddNotification,
  onSelectTab,
  showToast,
  currentUser,
  currentRole,
  moduleConfig,
  onUpdateModuleConfig,
  attendanceIncidents = [],
  onUpdateAttendanceIncidents,
  onAddAttendanceIncident,
}: PresencePanelProps) {
  const logic = usePresencePanelLogic({
    employees,
    presences,
    onUpdatePresences,
    showToast,
    currentUser,
    currentRole,
    moduleConfig,
    attendanceIncidents,
    onUpdateAttendanceIncidents,
    onAddAttendanceIncident,
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      <PresenceQuickActionsBar
        isRestricted={logic.isRestricted}
        activePresenceTab={logic.activePresenceTab}
        onSelectTab={logic.setActivePresenceTab}
        pendingRequestsCount={logic.pendingRequestsCount}
        incidentsCount={attendanceIncidents.length}
        onOpenDynamicQr={() => logic.setIsDynamicQrModalOpen(true)}
        onOpenStaticDoorQr={() => logic.setIsStaticDoorQrOpen(true)}
        onOpenAdminClock={() => logic.setIsAdminClockModalOpen(true)}
        onOpenOfficeQr={() => logic.setIsOfficeQrModalOpen(true)}
        onOpenWeeklyRecap={() => logic.setIsWeeklyRecapModalOpen(true)}
      />

      {logic.activePresenceTab === 'requests' ? (
        <PresenceRequestsView
          presences={presences}
          employees={employees}
          onUpdatePresences={onUpdatePresences}
          showToast={showToast}
          attendanceIncidents={attendanceIncidents}
          onUpdateAttendanceIncidents={onUpdateAttendanceIncidents}
        />
      ) : logic.activePresenceTab === 'incidents' ? (
        <PresenceIncidentsAdminView
          attendanceIncidents={attendanceIncidents}
          employees={employees}
          onUpdateAttendanceIncidents={onUpdateAttendanceIncidents}
          showToast={showToast}
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <PresenceSidebarWidget
            sidebarTime={logic.sidebarTime}
            activeSidebarEmpId={logic.activeSidebarEmpId}
            onChangeSidebarEmpId={logic.setActiveSidebarEmpId}
            clockableEmployees={logic.clockableEmployees}
            activeEmployee={logic.activeEmployee}
            selectedDate={logic.selectedDate}
            currentPresence={logic.currentPresence}
            moduleConfig={moduleConfig}
            nextStep={logic.nextStep}
            isRestricted={logic.isRestricted}
            punctualityRate={logic.punctualityRate}
            attendanceRate={logic.attendanceRate}
            presentCount={logic.presentCount}
            lateCount={logic.lateCount}
            absentCount={logic.absentCount}
            onTriggerClockingStep={logic.handleTriggerClockingStep}
            onOpenAdminClock={() => logic.setIsAdminClockModalOpen(true)}
            onSelectTab={onSelectTab}
          />

          <div className="xl:col-span-2 space-y-6">
            <PresenceFiltersBar
              isRestricted={logic.isRestricted}
              myEmp={logic.myEmp}
              collaboratorFilter={logic.collaboratorFilter}
              onChangeCollaboratorFilter={logic.setCollaboratorFilter}
              filterSelectableEmployees={logic.filterSelectableEmployees}
              onOpenWeeklyRecap={() => logic.setIsWeeklyRecapModalOpen(true)}
              onExportExcel={logic.handleExportExcel}
            />

            <PresenceRegistersCard
              filteredPresences={logic.filteredPresences}
              paginatedPresences={logic.paginatedPresences}
              employees={employees}
              activeSidebarEmpId={logic.activeSidebarEmpId}
              recentPunchId={logic.recentPunchId}
              itemsPerPage={logic.itemsPerPage}
              currentPage={logic.currentPage}
              totalPages={logic.totalPages}
              startIndex={logic.startIndex}
              totalItems={logic.totalItems}
              onSelectSidebarEmp={logic.setActiveSidebarEmpId}
              onOpenEditPresence={logic.handleOpenEditPresence}
              onChangePageSize={logic.setPageSize}
              onChangePage={logic.setCurrentPage}
            />

            <PresenceMapCard
              isRestricted={logic.isRestricted}
              myEmp={logic.myEmp}
              presences={presences}
              filteredPresences={logic.filteredPresences}
              employees={employees}
              clockableEmployees={logic.clockableEmployees}
              selectedDate={logic.selectedDate}
              mapLayer={logic.mapLayer}
              onChangeMapLayer={logic.setMapLayer}
              mapPeriod={logic.mapPeriod}
              onChangeMapPeriod={logic.setMapPeriod}
              mapCustomFilter={logic.mapCustomFilter}
              onChangeMapCustomFilter={logic.setMapCustomFilter}
              mapStartDate={logic.mapStartDate}
              onChangeMapStartDate={logic.setMapStartDate}
              mapEndDate={logic.mapEndDate}
              onChangeMapEndDate={logic.setMapEndDate}
            />
          </div>
        </div>
      )}

      <PresenceManualEditModal
        isOpen={logic.isEditModalOpen}
        editingPresence={logic.editingPresence}
        editForm={logic.editForm}
        onChangeForm={logic.setEditForm}
        onClose={() => logic.setIsEditModalOpen(false)}
        onSubmit={logic.handleSaveManualEdit}
      />

      {logic.isDynamicQrModalOpen && (
        <DynamicQrManagerModal
          isOpen={logic.isDynamicQrModalOpen}
          onClose={() => logic.setIsDynamicQrModalOpen(false)}
          managerName={currentUser?.name || 'Responsable'}
          managerId={currentUser?.id || 'admin'}
          onSessionUsed={(empName) => {
            if (showToast) showToast(`Pointage validé avec succès pour ${empName} !`, 'success');
          }}
        />
      )}

      {logic.isAdminClockModalOpen && (
        <AdminOnBehalfClockModal
          isOpen={logic.isAdminClockModalOpen}
          onClose={() => logic.setIsAdminClockModalOpen(false)}
          employees={employees}
          presences={presences}
          currentUser={currentUser}
          defaultEmployeeId={logic.activeSidebarEmpId}
          onUpdatePresences={onUpdatePresences}
          onAddNotification={onAddNotification}
          showToast={showToast}
          moduleConfig={moduleConfig}
          onAddAttendanceIncident={
            onAddAttendanceIncident ||
            (onUpdateAttendanceIncidents ? (inc) => onUpdateAttendanceIncidents([inc, ...attendanceIncidents]) : undefined)
          }
        />
      )}

      {logic.isOfficeQrModalOpen && (
        <PersonalAccessKeyModal
          isOpen={logic.isOfficeQrModalOpen}
          onClose={() => logic.setIsOfficeQrModalOpen(false)}
          managerName={currentUser?.name || 'Responsable'}
          companyName={moduleConfig?.companyName || 'Citrine SARL'}
          showToast={showToast}
        />
      )}

      {logic.isStaticDoorQrOpen && (
        <StaticDoorQrModal
          isOpen={logic.isStaticDoorQrOpen}
          onClose={() => logic.setIsStaticDoorQrOpen(false)}
          moduleConfig={moduleConfig}
          onUpdateModuleConfig={onUpdateModuleConfig}
          showToast={showToast}
        />
      )}

      {logic.isWeeklyRecapModalOpen && (
        <WeeklyAttendanceRecapModal
          isOpen={logic.isWeeklyRecapModalOpen}
          onClose={() => logic.setIsWeeklyRecapModalOpen(false)}
          employees={employees}
          presences={presences}
          showToast={showToast}
        />
      )}
    </div>
  );
}
