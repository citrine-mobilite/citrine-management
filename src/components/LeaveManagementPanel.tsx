import React from 'react';
import { CalendarDays } from 'lucide-react';
import { LeaveRequest } from '../types/leaveTypes';
import { Employee } from '../types/employeeTypes';
import { AppUser } from '../types/userTypes';
import { NotificationLog, CompanyModuleConfig } from '../types/businessTypes';
import { useLeaveManagementLogic } from './leave/useLeaveManagementLogic';
import { LeaveManagementHeaderAndFilters } from './leave/LeaveManagementHeaderAndFilters';
import { LeaveRequestCard } from './leave/LeaveRequestCard';
import { LeaveDecisionModals } from './leave/LeaveDecisionModals';
import { LeaveAdminCreateModal } from './leave/LeaveAdminCreateModal';

interface LeaveManagementPanelProps {
  leaveRequests: LeaveRequest[];
  employees: Employee[];
  currentUser: AppUser | null;
  users?: AppUser[];
  onUpdateLeaveRequests?: (leaves: LeaveRequest[]) => void;
  onUpdateEmployees?: (employees: Employee[]) => void;
  onUpdateUsers?: (users: AppUser[]) => void;
  onAddNotification?: (n: NotificationLog) => void;
  showToast?: (title: string, desc: string, type?: 'success' | 'warning' | 'info') => void;
  moduleConfig?: CompanyModuleConfig;
}

export default function LeaveManagementPanel({
  leaveRequests,
  employees,
  currentUser,
  users = [],
  onUpdateLeaveRequests,
  onUpdateEmployees,
  onUpdateUsers,
  onAddNotification,
  showToast,
  moduleConfig,
}: LeaveManagementPanelProps) {
  const logic = useLeaveManagementLogic({
    leaveRequests,
    employees,
    currentUser,
    users,
    onUpdateLeaveRequests,
    onUpdateEmployees,
    onUpdateUsers,
    onAddNotification,
    showToast,
    moduleConfig,
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      <LeaveManagementHeaderAndFilters
        stats={logic.stats}
        categoryFilter={logic.categoryFilter}
        onChangeCategory={logic.setCategoryFilter}
        statusFilter={logic.statusFilter}
        onChangeStatus={logic.setStatusFilter}
        searchQuery={logic.searchQuery}
        onChangeSearch={logic.setSearchQuery}
        onOpenCreateModal={() => {
          if (employees.length > 0 && !logic.createEmployeeId) {
            logic.setCreateEmployeeId(employees[0].id);
          }
          logic.setShowCreateModal(true);
        }}
      />

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <h3 className="font-serif font-bold text-xs text-stone-900 flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-[#2A7B76]" />
            Registre des Demandes de Congés & Permissions ({logic.filteredRequests.length})
          </h3>
        </div>

        {logic.filteredRequests.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <div className="w-12 h-12 bg-stone-100 text-stone-400 rounded-2xl flex items-center justify-center mx-auto">
              <CalendarDays className="h-6 w-6" />
            </div>
            <p className="text-xs font-bold text-stone-700">Aucune demande trouvée</p>
            <p className="text-[11px] text-stone-400">Modifiez vos filtres ou la recherche pour afficher d'autres demandes.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {logic.filteredRequests.map((req) => (
              <LeaveRequestCard key={req.id} req={req} onOpenAction={logic.openActionModal} />
            ))}
          </div>
        )}
      </div>

      <LeaveDecisionModals
        selectedRequest={logic.selectedRequest}
        actionType={logic.actionType}
        managerComment={logic.managerComment}
        onChangeComment={logic.setManagerComment}
        modifiedStartDate={logic.modifiedStartDate}
        onChangeModifiedStart={logic.setModifiedStartDate}
        modifiedEndDate={logic.modifiedEndDate}
        onChangeModifiedEnd={logic.setModifiedEndDate}
        modifiedDaysCount={logic.modifiedDaysCount}
        onChangeModifiedDays={logic.setModifiedDaysCount}
        isProcessing={logic.isProcessing}
        onClose={logic.closeModal}
        onConfirm={logic.handleConfirmDecision}
      />

      <LeaveAdminCreateModal
        isOpen={logic.showCreateModal}
        employees={employees}
        createEmployeeId={logic.createEmployeeId}
        onChangeEmployeeId={logic.setCreateEmployeeId}
        createLeaveType={logic.createLeaveType}
        onChangeLeaveType={logic.setCreateLeaveType}
        createStartDate={logic.createStartDate}
        onChangeStartDate={logic.setCreateStartDate}
        createEndDate={logic.createEndDate}
        onChangeEndDate={logic.setCreateEndDate}
        createDaysCount={logic.createDaysCount}
        onChangeDaysCount={logic.setCreateDaysCount}
        createStatus={logic.createStatus}
        onChangeStatus={logic.setCreateStatus}
        createReason={logic.createReason}
        onChangeReason={logic.setCreateReason}
        createManagerComment={logic.createManagerComment}
        onChangeManagerComment={logic.setCreateManagerComment}
        isSubmitting={logic.isSubmittingCreate}
        onClose={() => logic.setShowCreateModal(false)}
        onSubmit={logic.handleCreateLeave}
      />
    </div>
  );
}
