import React from 'react';
import { CalendarDays } from 'lucide-react';
import { LeaveRequest } from '../types/leaveTypes';
import { Employee } from '../types/employeeTypes';
import { AppUser } from '../types/userTypes';
import { NotificationLog, CompanyModuleConfig } from '../types/businessTypes';
import { useLeaveManagementLogic } from './leave/useLeaveManagementLogic';
import { LeaveManagementHeaderAndFilters } from './leave/LeaveManagementHeaderAndFilters';
import { LeaveRequestCard } from './leave/LeaveRequestCard';
import { LeaveRequestTable } from './leave/LeaveRequestTable';
import { LeaveRequestDetailModal } from './leave/LeaveRequestDetailModal';
import { LeavePaginationBar } from './leave/LeavePaginationBar';
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
    <div className="space-y-5 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      <LeaveManagementHeaderAndFilters
        stats={logic.stats}
        categoryFilter={logic.categoryFilter}
        onChangeCategory={logic.setCategoryFilter}
        statusFilter={logic.statusFilter}
        onChangeStatus={logic.setStatusFilter}
        leaveTypeFilter={logic.leaveTypeFilter}
        onChangeLeaveType={logic.setLeaveTypeFilter}
        departmentFilter={logic.departmentFilter}
        onChangeDepartment={logic.setDepartmentFilter}
        availableDepartments={logic.availableDepartments}
        monthFilter={logic.monthFilter}
        onChangeMonth={logic.setMonthFilter}
        availableMonths={logic.availableMonths}
        sortBy={logic.sortBy}
        onChangeSort={logic.setSortBy}
        viewMode={logic.viewMode}
        onChangeViewMode={logic.setViewMode}
        searchQuery={logic.searchQuery}
        onChangeSearch={logic.setSearchQuery}
        hasActiveFilters={logic.hasActiveFilters}
        onResetFilters={logic.resetFilters}
        onExportCsv={logic.exportFilteredCsv}
        onOpenCreateModal={() => {
          if (employees.length > 0 && !logic.createEmployeeId) {
            logic.setCreateEmployeeId(employees[0].id);
          }
          logic.setShowCreateModal(true);
        }}
      />

      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-200/80 flex items-center justify-between gap-2 bg-stone-50/70">
          <h3 className="font-serif font-bold text-xs text-stone-900 flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-[#2A7B76]" />
            <span>
              Registre des Demandes ({logic.filteredRequests.length})
            </span>
          </h3>
          {logic.totalPages > 1 && (
            <span className="text-[11px] font-mono tabular-nums text-stone-500">
              Page {logic.currentPage} / {logic.totalPages}
            </span>
          )}
        </div>

        {logic.filteredRequests.length === 0 ? (
          <div className="text-center py-14 px-4 space-y-3">
            <div className="w-12 h-12 bg-stone-100 text-stone-400 rounded-2xl flex items-center justify-center mx-auto">
              <CalendarDays className="h-6 w-6" />
            </div>
            <p className="text-xs font-bold text-stone-700">Aucune demande trouvée</p>
            <p className="text-[11px] text-stone-400 max-w-sm mx-auto">
              {logic.hasActiveFilters
                ? 'Modifiez ou réinitialisez vos filtres pour afficher les demandes.'
                : 'Les nouvelles demandes de congés, permissions ou missions apparaîtront ici.'}
            </p>
            {logic.hasActiveFilters && (
              <button
                type="button"
                onClick={logic.resetFilters}
                className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition cursor-pointer"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : logic.viewMode === 'table' ? (
          <LeaveRequestTable
            requests={logic.paginatedRequests}
            onOpenAction={logic.openActionModal}
            onViewDetail={logic.setDetailRequest}
            onTerminateMission={logic.handleTerminateMission}
          />
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 bg-stone-50/40">
            {logic.paginatedRequests.map((req) => (
              <LeaveRequestCard
                key={req.id}
                req={req}
                onOpenAction={logic.openActionModal}
                onViewDetail={logic.setDetailRequest}
                onTerminateMission={logic.handleTerminateMission}
              />
            ))}
          </div>
        )}

        <LeavePaginationBar
          currentPage={logic.currentPage}
          totalPages={logic.totalPages}
          totalItems={logic.filteredRequests.length}
          pageSize={logic.pageSize}
          onPageChange={logic.setCurrentPage}
          onPageSizeChange={logic.setPageSize}
        />
      </div>

      <LeaveRequestDetailModal
        request={logic.detailRequest}
        onClose={() => logic.setDetailRequest(null)}
        onOpenAction={logic.openActionModal}
        onTerminateMission={logic.handleTerminateMission}
      />

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
