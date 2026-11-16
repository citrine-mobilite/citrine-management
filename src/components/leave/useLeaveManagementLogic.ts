import { useState, useMemo, useEffect } from 'react';
import { LeaveRequest, LeaveStatus, LeaveType, LEAVE_TYPE_LABELS } from '../../types/leaveTypes';
import { Employee } from '../../types/employeeTypes';
import { AppUser } from '../../types/userTypes';
import { NotificationLog, CompanyModuleConfig } from '../../types/businessTypes';
import { decideLeaveRequest, calculateDaysBetween } from '../../services/leaveService';
import { terminateMission } from '../../services/missionLifecycleService';
import { clientMailService } from '../../services/clientMailService';
import { confirmActionAlert, executeOperationWithLoading } from '../../utils/sweetAlert';
import { useLeaveAdminCreate } from './useLeaveAdminCreate';

export type LeaveSortOption = 'pending_first' | 'recent' | 'start_desc' | 'duration_desc';

interface UseLeaveManagementLogicParams {
  leaveRequests: LeaveRequest[];
  employees: Employee[];
  currentUser: AppUser | null;
  users: AppUser[];
  onUpdateLeaveRequests?: (leaves: LeaveRequest[]) => void;
  onUpdateEmployees?: (employees: Employee[]) => void;
  onUpdateUsers?: (users: AppUser[]) => void;
  onAddNotification?: (n: NotificationLog) => void;
  showToast?: (title: string, desc: string, type?: 'success' | 'warning' | 'info') => void;
  moduleConfig?: CompanyModuleConfig;
}

export function useLeaveManagementLogic({
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
}: UseLeaveManagementLogicParams) {
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'missions' | 'leaves'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | LeaveStatus>('all');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<'all' | LeaveType>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<LeaveSortOption>('pending_first');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const [detailRequest, setDetailRequest] = useState<LeaveRequest | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'modify' | null>(null);

  const [managerComment, setManagerComment] = useState('');
  const [modifiedStartDate, setModifiedStartDate] = useState('');
  const [modifiedEndDate, setModifiedEndDate] = useState('');
  const [modifiedDaysCount, setModifiedDaysCount] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const adminCreate = useLeaveAdminCreate({ employees, currentUser, onAddNotification, showToast });

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, statusFilter, leaveTypeFilter, departmentFilter, monthFilter, sortBy, searchQuery, pageSize]);

  const availableDepartments = useMemo(() => {
    const depts = new Set<string>();
    leaveRequests.forEach((l) => {
      if (l.department && l.department.trim()) depts.add(l.department.trim());
    });
    return Array.from(depts).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [leaveRequests]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    leaveRequests.forEach((l) => {
      const m = (l.startDate || l.createdAt || '').slice(0, 7);
      if (/^\d{4}-\d{2}$/.test(m)) months.add(m);
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [leaveRequests]);

  const stats = useMemo(() => {
    const missions = leaveRequests.filter((l) => l.type === 'mission_professionnelle').length;
    const activeMissions = leaveRequests.filter(
      (l) => l.type === 'mission_professionnelle' && (l.status === 'approved' || l.status === 'modified')
    ).length;
    const pending = leaveRequests.filter((l) => l.status === 'pending').length;
    const approved = leaveRequests.filter((l) => l.status === 'approved').length;
    const modified = leaveRequests.filter((l) => l.status === 'modified').length;
    const terminee = leaveRequests.filter((l) => l.status === 'terminee').length;
    const rejected = leaveRequests.filter((l) => l.status === 'rejected').length;
    const totalDaysApproved = leaveRequests
      .filter((l) => l.status === 'approved' || l.status === 'modified' || l.status === 'terminee')
      .reduce((sum, l) => sum + (l.approvedDaysCount ?? l.daysCount), 0);
    return { missions, activeMissions, pending, approved, modified, terminee, rejected, totalDaysApproved, total: leaveRequests.length };
  }, [leaveRequests]);

  const filteredRequests = useMemo(() => {
    const filtered = leaveRequests.filter((l) => {
      if (categoryFilter === 'missions' && l.type !== 'mission_professionnelle') return false;
      if (categoryFilter === 'leaves' && l.type === 'mission_professionnelle') return false;
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (leaveTypeFilter !== 'all' && l.type !== leaveTypeFilter) return false;
      if (departmentFilter !== 'all' && (l.department || 'Opérations').trim() !== departmentFilter) return false;
      if (monthFilter !== 'all') {
        const startM = (l.startDate || '').slice(0, 7);
        const createdM = (l.createdAt || '').slice(0, 7);
        if (startM !== monthFilter && createdM !== monthFilter) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = l.employeeName.toLowerCase().includes(q);
        const matchDept = (l.department || '').toLowerCase().includes(q);
        const matchReason = l.reason.toLowerCase().includes(q);
        const matchType = (LEAVE_TYPE_LABELS[l.type]?.label || '').toLowerCase().includes(q);
        const matchComment = (l.managerComment || '').toLowerCase().includes(q);
        if (!matchName && !matchDept && !matchReason && !matchType && !matchComment) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'pending_first') {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'start_desc') {
        return (b.startDate || '').localeCompare(a.startDate || '');
      }
      if (sortBy === 'duration_desc') {
        const dA = a.approvedDaysCount ?? a.daysCount;
        const dB = b.approvedDaysCount ?? b.daysCount;
        return dB - dA;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [
    leaveRequests,
    categoryFilter,
    statusFilter,
    leaveTypeFilter,
    departmentFilter,
    monthFilter,
    searchQuery,
    sortBy,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRequests = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, safeCurrentPage, pageSize]);

  const hasActiveFilters =
    categoryFilter !== 'all' ||
    statusFilter !== 'all' ||
    leaveTypeFilter !== 'all' ||
    departmentFilter !== 'all' ||
    monthFilter !== 'all' ||
    searchQuery.trim().length > 0;

  const resetFilters = () => {
    setCategoryFilter('all');
    setStatusFilter('all');
    setLeaveTypeFilter('all');
    setDepartmentFilter('all');
    setMonthFilter('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const exportFilteredCsv = () => {
    if (filteredRequests.length === 0) {
      showToast?.('Export impossible', 'Aucune demande à exporter pour les filtres actuels.', 'warning');
      return;
    }
    const headers = [
      'Collaborateur',
      'Service',
      'Type',
      'Statut',
      'Date début',
      'Date fin',
      'Jours demandés',
      'Jours accordés',
      'Motif',
      'Observation RH',
      'Arbitré par',
      'Créée le',
    ];
    const escapeCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
    const rows = filteredRequests.map((r) => [
      r.employeeName,
      r.department || 'Opérations',
      LEAVE_TYPE_LABELS[r.type]?.label || r.type,
      r.status,
      r.approvedStartDate || r.startDate,
      r.approvedEndDate || r.endDate,
      r.daysCount,
      r.approvedDaysCount ?? (r.status === 'rejected' ? 0 : r.daysCount),
      r.reason,
      r.managerComment || '',
      r.decidedBy || '',
      (r.createdAt || '').slice(0, 10),
    ]);
    const csv = '\uFEFF' + [headers.map(escapeCell).join(';'), ...rows.map((r) => r.map(escapeCell).join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conges-permissions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast?.('Export généré', `${filteredRequests.length} demande(s) exportée(s) au format CSV.`, 'success');
  };

  const handleTerminateMission = async (req: LeaveRequest) => {
    const isConfirmed = await confirmActionAlert({
      title: 'Clôturer la mission ?',
      text: `Confirmez-vous la clôture de la mission de ${req.employeeName} ?\nLe statut du collaborateur et son compte utilisateur repasseront immédiatement en « En poste ».`,
      confirmButtonText: 'Oui, clôturer la mission',
      icon: 'question',
    });
    if (!isConfirmed) return;

    await executeOperationWithLoading({
      loadingTitle: 'Clôture de la mission...',
      loadingText: `Mise à jour de la mission de ${req.employeeName}, veuillez patienter...`,
      action: async () => {
        const res = await terminateMission(
          req.id, leaveRequests, employees, users, currentUser?.name || 'Direction RH',
          onUpdateLeaveRequests, onUpdateEmployees, onUpdateUsers, onAddNotification
        );
        if (!res.success) {
          throw new Error(res.error || 'Impossible de clôturer la mission.');
        }
      },
      successTitle: 'Mission terminée !',
      successMessage: `La mission de ${req.employeeName} a été clôturée. Le collaborateur et son compte sont de nouveau « En poste ».`,
      errorMessage: 'Impossible de clôturer la mission pour le moment.',
    });
  };

  const openActionModal = (req: LeaveRequest, action: 'approve' | 'reject' | 'modify') => {
    setSelectedRequest(req);
    setActionType(action);
    setManagerComment('');
    if (action === 'modify') {
      setModifiedStartDate(req.approvedStartDate || req.startDate);
      setModifiedEndDate(req.approvedEndDate || req.endDate);
      setModifiedDaysCount(req.approvedDaysCount ?? req.daysCount);
    }
  };

  const closeModal = () => {
    setSelectedRequest(null);
    setActionType(null);
    setManagerComment('');
    setIsProcessing(false);
  };

  const handleConfirmDecision = async () => {
    if (!selectedRequest) return;
    if (actionType === 'reject' && !managerComment.trim()) {
      showToast?.('Motif requis', 'Veuillez préciser le motif de refus à communiquer au collaborateur.', 'warning');
      return;
    }

    setIsProcessing(true);
    const emp = employees.find((e) => e.id === selectedRequest.employeeId);
    const deciderName = currentUser?.name || 'Responsable RH';

    try {
      const days =
        actionType === 'modify'
          ? modifiedDaysCount > 0
            ? modifiedDaysCount
            : calculateDaysBetween(modifiedStartDate, modifiedEndDate)
          : selectedRequest.daysCount;

      const successTitle =
        actionType === 'approve'
          ? 'Demande validée !'
          : actionType === 'reject'
          ? 'Demande refusée'
          : 'Durée ajustée !';

      const successMessage =
        actionType === 'approve'
          ? `La demande de ${selectedRequest.employeeName} a été validée avec succès.`
          : actionType === 'reject'
          ? `La demande de ${selectedRequest.employeeName} a été refusée.`
          : `La durée accordée pour ${selectedRequest.employeeName} a été ajustée à ${days} jour(s).`;

      const res = await executeOperationWithLoading({
        loadingTitle: 'Traitement de la décision...',
        loadingText: `Enregistrement de la décision pour ${selectedRequest.employeeName}, veuillez patienter...`,
        action: async () => {
          if (actionType === 'approve') {
            await decideLeaveRequest(selectedRequest.id, {
              status: 'approved',
              managerComment: managerComment.trim() || 'Demande validée conformément aux nécessités de service.',
              approvedStartDate: selectedRequest.startDate,
              approvedEndDate: selectedRequest.endDate,
              approvedDaysCount: selectedRequest.daysCount,
              decidedBy: deciderName,
              decidedByUserId: currentUser?.id,
            }, selectedRequest, emp, onAddNotification);
          } else if (actionType === 'reject') {
            await decideLeaveRequest(selectedRequest.id, {
              status: 'rejected',
              managerComment: managerComment.trim(),
              decidedBy: deciderName,
              decidedByUserId: currentUser?.id,
            }, selectedRequest, emp, onAddNotification);
          } else if (actionType === 'modify') {
            await decideLeaveRequest(selectedRequest.id, {
              status: 'modified',
              managerComment: managerComment.trim() || 'Durée et période ajustées selon impératifs de service.',
              approvedStartDate: modifiedStartDate,
              approvedEndDate: modifiedEndDate,
              approvedDaysCount: days,
              decidedBy: deciderName,
              decidedByUserId: currentUser?.id,
            }, selectedRequest, emp, onAddNotification);
          }

          if (emp) {
            const leaveLabel = LEAVE_TYPE_LABELS[selectedRequest.type]?.label || selectedRequest.type;
            clientMailService.notifyLeaveDecision({
              employeeName: emp.name || selectedRequest.employeeName,
              employeeEmail: emp.email || selectedRequest.employeeEmail,
              employeeId: emp.id || selectedRequest.employeeId,
              leaveType: leaveLabel,
              startDate: actionType === 'modify' ? modifiedStartDate : selectedRequest.startDate,
              endDate: actionType === 'modify' ? modifiedEndDate : selectedRequest.endDate,
              status: actionType === 'approve' ? 'approved' : actionType === 'reject' ? 'rejected' : 'modified',
              reason: managerComment.trim() || undefined,
              moduleConfig,
            }).catch((err) => console.warn('[LeaveManagement] Notice email décision congé:', err));
          }
        },
        successTitle,
        successMessage,
        errorMessage: 'Impossible de traiter la demande.',
      });

      if (res.success) {
        closeModal();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    categoryFilter, setCategoryFilter,
    statusFilter, setStatusFilter,
    leaveTypeFilter, setLeaveTypeFilter,
    departmentFilter, setDepartmentFilter,
    monthFilter, setMonthFilter,
    sortBy, setSortBy,
    viewMode, setViewMode,
    searchQuery, setSearchQuery,
    currentPage: safeCurrentPage, setCurrentPage,
    pageSize, setPageSize,
    totalPages,
    availableDepartments, availableMonths,
    hasActiveFilters, resetFilters, exportFilteredCsv,
    detailRequest, setDetailRequest,
    selectedRequest, actionType, managerComment, setManagerComment, modifiedStartDate, setModifiedStartDate,
    modifiedEndDate, setModifiedEndDate, modifiedDaysCount, setModifiedDaysCount, isProcessing,
    ...adminCreate,
    stats, filteredRequests, paginatedRequests,
    handleTerminateMission, openActionModal, closeModal, handleConfirmDecision,
  };
}
