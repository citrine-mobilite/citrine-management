import React from 'react';
import {
  AppUser,
  CompanyModuleConfig,
  Employee,
  EmployeeSalaryDebt,
  NotificationLog,
  Presence,
  Reminder,
  SalaryPayment,
  StrategicProject,
  Task,
} from '../types';
import { CollaboratorAvatarPickerModal } from './collaborators/CollaboratorAvatarPickerModal';
import { CollaboratorStatusReasonModal } from './collaborators/CollaboratorStatusReasonModal';
import { CollaboratorAuditHistoryModal } from './collaborators/CollaboratorAuditHistoryModal';
import { CollaboratorFormModal } from './collaborators/CollaboratorFormModal';
import { CollaboratorDetailView } from './collaborators/CollaboratorDetailView';
import { CollaboratorTable } from './collaborators/CollaboratorTable';
import { CollaboratorListHeaderAndFilters } from './collaborators/CollaboratorListHeaderAndFilters';
import { AVAILABLE_TEAMS } from './collaborators/collaboratorConstants';
import { useCollaboratorPanelLogic } from './collaborators/useCollaboratorPanelLogic';
import RhReportModal from './RhReportModal';

export { AVAILABLE_TEAMS };

interface CollaboratorPanelProps {
  employees: Employee[];
  presences?: Presence[];
  tasks?: Task[];
  reminders?: Reminder[];
  notifications?: NotificationLog[];
  strategicProjects?: StrategicProject[];
  salaryPayments?: SalaryPayment[];
  salaryDebts?: EmployeeSalaryDebt[];
  onUpdateEmployees: (employees: Employee[]) => void;
  onUpdatePresences?: (presences: Presence[]) => void;
  onUpdateTasks?: (tasks: Task[]) => void;
  onUpdateSalaryPayments?: (payments: SalaryPayment[]) => void;
  onAddNotification?: (log: NotificationLog) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
  users?: AppUser[];
  onUpdateUsers?: (users: AppUser[]) => void;
  moduleConfig?: CompanyModuleConfig;
  selectedEmployeeId?: string;
}

export default function CollaboratorPanel({
  employees,
  presences = [],
  tasks = [],
  reminders = [],
  notifications = [],
  strategicProjects = [],
  salaryPayments = [],
  onUpdateEmployees,
  onAddNotification,
  showToast,
  users = [],
  onUpdateUsers,
  moduleConfig,
  selectedEmployeeId: initialSelectedEmployeeId,
}: CollaboratorPanelProps) {
  const logic = useCollaboratorPanelLogic({
    employees,
    presences,
    users,
    moduleConfig,
    initialSelectedEmployeeId,
    onUpdateEmployees,
    onUpdateUsers,
    onAddNotification,
    showToast,
  });

  return (
    <div className={logic.viewMode === 'detail' ? '' : 'space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300'}>
      {logic.viewMode === 'detail' && logic.selectedEmployeeObj ? (
        <CollaboratorDetailView
          emp={logic.selectedEmployeeObj}
          employees={employees}
          presences={presences}
          salaryPayments={salaryPayments}
          tasks={tasks}
          reminders={reminders}
          notifications={notifications}
          strategicProjects={strategicProjects}
          activeDetailTab={logic.activeDetailTab}
          setActiveDetailTab={logic.setActiveDetailTab}
          rhReportMonth={logic.rhReportMonth}
          setRhReportMonth={logic.setRhReportMonth}
          isGeneratingRhReport={logic.isGeneratingRhReport}
          onGenerateMonthlyReport={logic.handleGenerateEmpMonthlyReport}
          onBackToList={() => logic.setViewMode('list')}
          onEdit={logic.handleOpenEdit}
          onPrint={() => window.print()}
        />
      ) : (
        <>
          <CollaboratorListHeaderAndFilters
            employees={employees}
            auditCount={logic.auditOpsList.length}
            searchTerm={logic.searchTerm}
            setSearchTerm={logic.setSearchTerm}
            teamFilter={logic.teamFilter}
            setTeamFilter={logic.setTeamFilter}
            managerFilter={logic.managerFilter}
            setManagerFilter={logic.setManagerFilter}
            roleFilter={logic.roleFilter}
            setRoleFilter={logic.setRoleFilter}
            statusFilter={logic.statusFilter}
            setStatusFilter={logic.setStatusFilter}
            onResetPage={() => logic.setCurrentPage(1)}
            onOpenAudit={() => logic.setIsAuditHistoryModalOpen(true)}
            onExportExcel={logic.handleExportExcel}
            onExportPDF={logic.handleExportPDF}
            onOpenAdd={logic.handleOpenAdd}
          />
          <CollaboratorTable
            paginatedEmployees={logic.paginatedEmployees}
            allEmployees={employees}
            startIndex={logic.startIndex}
            itemsPerPage={logic.itemsPerPage}
            totalItems={logic.totalItems}
            currentPage={logic.currentPage}
            totalPages={logic.totalPages}
            setCurrentPage={logic.setCurrentPage}
            onStatusChangeQuick={logic.handleStatusChangeQuick}
            onSelectDetail={(id) => {
              logic.setSelectedEmployeeId(id);
              logic.setViewMode('detail');
            }}
            onEdit={logic.handleOpenEdit}
          />
        </>
      )}

      <CollaboratorFormModal
        isOpen={logic.isModalOpen}
        onClose={() => logic.setIsModalOpen(false)}
        onSubmit={logic.handleSave}
        editingEmployee={logic.editingEmployee}
        formData={logic.formData}
        setFormData={logic.setFormData}
        employees={employees}
        users={users}
        isSaving={logic.isSaving}
        onOpenAvatarPicker={() => logic.setIsAvatarPickerOpen(true)}
      />

      <CollaboratorAvatarPickerModal
        isOpen={logic.isAvatarPickerOpen}
        onClose={() => logic.setIsAvatarPickerOpen(false)}
        currentAvatarUrl={logic.formData.avatarUrl}
        collaboratorName={logic.formData.name}
        onSelectAvatar={(url) => logic.setFormData({ ...logic.formData, avatarUrl: url })}
        showToast={showToast}
      />

      <CollaboratorStatusReasonModal
        isOpen={Boolean(logic.statusReasonModalTarget)}
        onClose={() => logic.setStatusReasonModalTarget(null)}
        employee={logic.statusReasonModalTarget?.emp || null}
        targetStatus={logic.statusReasonModalTarget?.targetStatus || 'renvoye'}
        onConfirm={logic.handleConfirmStatusReason}
        showToast={showToast}
      />

      <CollaboratorAuditHistoryModal
        isOpen={logic.isAuditHistoryModalOpen}
        onClose={() => logic.setIsAuditHistoryModalOpen(false)}
        auditOpsList={logic.auditOpsList}
      />

      {logic.rhReportModal && (
        <RhReportModal
          isOpen={Boolean(logic.rhReportModal)}
          report={logic.rhReportModal}
          selectedMonth={logic.rhReportMonth}
          onMonthChange={(m) => {
            logic.setRhReportMonth(m);
            const targetEmp =
              employees.find((e) => e.id === logic.rhReportModal?.employee.id) ||
              logic.rhReportModal!.employee;
            logic.handleGenerateEmpMonthlyReport(targetEmp, m);
          }}
          onClose={() => logic.setRhReportModal(null)}
        />
      )}
    </div>
  );
}
