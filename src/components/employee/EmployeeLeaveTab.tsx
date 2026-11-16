import React from 'react';
import { Employee, AppUser, LeaveRequest, NotificationLog } from '../../types';
import { useEmployeeLeaveLogic } from './leave/useEmployeeLeaveLogic';
import { EmployeeLeaveToolbar } from './leave/EmployeeLeaveToolbar';
import { EmployeeLeaveList } from './leave/EmployeeLeaveList';
import { EmployeeLeaveDetailModal } from './leave/EmployeeLeaveDetailModal';
import { EmployeeLeaveRequestModal } from './leave/EmployeeLeaveRequestModal';

interface EmployeeLeaveTabProps {
  employeeProfile: Employee;
  currentUser?: AppUser | null;
  leaveRequests: LeaveRequest[];
  onAddNotification?: (n: NotificationLog) => void;
  showToast?: (title: string, desc: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
  onUpdateLeaveRequests?: (leaves: LeaveRequest[]) => void;
  onUpdateEmployees?: (employees: Employee[]) => void;
  onUpdateUsers?: (users: AppUser[]) => void;
  employees?: Employee[];
  users?: AppUser[];
}

export const EmployeeLeaveTab: React.FC<EmployeeLeaveTabProps> = ({
  employeeProfile,
  currentUser,
  leaveRequests = [],
  onAddNotification,
  showToast,
  onUpdateLeaveRequests,
  onUpdateEmployees,
  onUpdateUsers,
  employees = [],
  users = [],
}) => {
  const logic = useEmployeeLeaveLogic({
    employeeProfile,
    currentUser,
    leaveRequests,
    onAddNotification,
    showToast,
    onUpdateLeaveRequests,
    onUpdateEmployees,
    onUpdateUsers,
    employees,
    users,
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-300 max-w-6xl mx-auto pb-10">
      <EmployeeLeaveToolbar
        stats={logic.stats}
        viewDensity={logic.viewDensity}
        onChangeDensity={logic.setViewDensity}
        categoryFilter={logic.categoryFilter}
        onChangeCategory={logic.setCategoryFilter}
        filter={logic.filter}
        onChangeFilter={logic.setFilter}
        leaveTypeFilter={logic.leaveTypeFilter}
        onChangeLeaveType={logic.setLeaveTypeFilter}
        sortBy={logic.sortBy}
        onChangeSort={logic.setSortBy}
        searchQuery={logic.searchQuery}
        onChangeSearch={logic.setSearchQuery}
        onOpenMissionModal={logic.handleOpenMissionModal}
        onOpenLeaveModal={logic.handleOpenLeaveModal}
      />

      <EmployeeLeaveList
        filteredLeaves={logic.paginatedLeaves}
        totalFilteredCount={logic.filteredLeaves.length}
        currentPage={logic.currentPage}
        totalPages={logic.totalPages}
        pageSize={logic.pageSize}
        onPageChange={logic.setCurrentPage}
        onPageSizeChange={logic.setPageSize}
        viewDensity={logic.viewDensity}
        searchQuery={logic.searchQuery}
        filter={logic.filter}
        onSelectLeave={logic.setSelectedLeaveModal}
        onCancelRequest={logic.handleCancelRequest}
        onOpenCreateModal={() => logic.setShowModal(true)}
      />

      <EmployeeLeaveDetailModal
        leave={logic.selectedLeaveModal}
        isTerminating={logic.isTerminating}
        onClose={() => logic.setSelectedLeaveModal(null)}
        onCancelRequest={logic.handleCancelRequest}
        onTerminateMission={logic.handleTerminateMyMission}
      />

      <EmployeeLeaveRequestModal
        isOpen={logic.showModal}
        modalMode={logic.modalMode}
        leaveType={logic.leaveType}
        onChangeLeaveType={logic.setLeaveType}
        missionLocation={logic.missionLocation}
        onChangeMissionLocation={logic.setMissionLocation}
        startDate={logic.startDate}
        onChangeStartDate={logic.setStartDate}
        endDate={logic.endDate}
        onChangeEndDate={logic.setEndDate}
        currentDurationDays={logic.currentDurationDays}
        reason={logic.reason}
        onChangeReason={logic.setReason}
        attachmentName={logic.attachmentName}
        onChangeAttachmentName={logic.setAttachmentName}
        isSubmitting={logic.isSubmitting}
        onClose={() => logic.setShowModal(false)}
        onSubmit={logic.handleSubmit}
      />
    </div>
  );
};
