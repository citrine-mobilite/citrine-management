import { useState, useMemo } from 'react';
import { LeaveRequest, LeaveStatus, LEAVE_TYPE_LABELS } from '../../types/leaveTypes';
import { Employee } from '../../types/employeeTypes';
import { AppUser } from '../../types/userTypes';
import { NotificationLog, CompanyModuleConfig } from '../../types/businessTypes';
import { decideLeaveRequest, calculateDaysBetween } from '../../services/leaveService';
import { terminateMission } from '../../services/missionLifecycleService';
import { clientMailService } from '../../services/clientMailService';
import { showSuccessAlert, showErrorAlert, confirmActionAlert } from '../../utils/sweetAlert';
import { useLeaveAdminCreate } from './useLeaveAdminCreate';

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
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'modify' | null>(null);

  const [managerComment, setManagerComment] = useState('');
  const [modifiedStartDate, setModifiedStartDate] = useState('');
  const [modifiedEndDate, setModifiedEndDate] = useState('');
  const [modifiedDaysCount, setModifiedDaysCount] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const adminCreate = useLeaveAdminCreate({ employees, currentUser, onAddNotification, showToast });

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
    return leaveRequests.filter((l) => {
      if (categoryFilter === 'missions' && l.type !== 'mission_professionnelle') return false;
      if (categoryFilter === 'leaves' && l.type === 'mission_professionnelle') return false;
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = l.employeeName.toLowerCase().includes(q);
        const matchDept = (l.department || '').toLowerCase().includes(q);
        const matchReason = l.reason.toLowerCase().includes(q);
        const matchType = (LEAVE_TYPE_LABELS[l.type]?.label || '').toLowerCase().includes(q);
        if (!matchName && !matchDept && !matchReason && !matchType) return false;
      }
      return true;
    });
  }, [leaveRequests, categoryFilter, statusFilter, searchQuery]);

  const handleTerminateMission = async (req: LeaveRequest) => {
    const isConfirmed = await confirmActionAlert({
      title: 'Clôturer la mission ?',
      text: `Confirmez-vous la clôture de la mission de ${req.employeeName} ?\nLe statut du collaborateur et son compte utilisateur repasseront immédiatement en « En poste ».`,
      confirmButtonText: 'Oui, clôturer la mission',
      icon: 'question',
    });
    if (!isConfirmed) return;

    try {
      const res = await terminateMission(
        req.id, leaveRequests, employees, users, currentUser?.name || 'Direction RH',
        onUpdateLeaveRequests, onUpdateEmployees, onUpdateUsers, onAddNotification
      );
      if (res.success) {
        showToast?.('Mission Terminée ✓', `La mission de ${req.employeeName} a été clôturée. Collaborateur replacé en poste.`, 'success');
        await showSuccessAlert('Mission terminée !', `La mission de ${req.employeeName} a été clôturée. Le collaborateur et son compte sont de nouveau « En poste ».`);
      } else {
        showToast?.('Erreur', res.error || 'Impossible de clôturer la mission.', 'warning');
        await showErrorAlert('Erreur', res.error || 'Impossible de clôturer la mission.');
      }
    } catch {
      showToast?.('Erreur', 'Impossible de clôturer la mission pour le moment.', 'warning');
      await showErrorAlert('Erreur', 'Impossible de clôturer la mission pour le moment.');
    }
  };

  const openActionModal = (req: LeaveRequest, action: 'approve' | 'reject' | 'modify') => {
    setSelectedRequest(req);
    setActionType(action);
    setManagerComment('');
    if (action === 'modify') {
      setModifiedStartDate(req.startDate);
      setModifiedEndDate(req.endDate);
      setModifiedDaysCount(req.daysCount);
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
    setIsProcessing(true);
    const emp = employees.find((e) => e.id === selectedRequest.employeeId);
    const deciderName = currentUser?.name || 'Responsable RH';

    try {
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
        showToast?.('Demande validée', `Le congé de ${selectedRequest.employeeName} a été validé.`, 'success');
        setIsProcessing(false);
        await showSuccessAlert('Demande validée !', `La demande de ${selectedRequest.employeeName} a été validée avec succès.`);
      } else if (actionType === 'reject') {
        if (!managerComment.trim()) {
          showToast?.('Motif requis', 'Veuillez préciser le motif de refus à communiquer au collaborateur.', 'warning');
          await showErrorAlert('Motif obligatoire', 'Veuillez préciser le motif de refus.');
          setIsProcessing(false);
          return;
        }
        await decideLeaveRequest(selectedRequest.id, {
          status: 'rejected',
          managerComment: managerComment.trim(),
          decidedBy: deciderName,
          decidedByUserId: currentUser?.id,
        }, selectedRequest, emp, onAddNotification);
        showToast?.('Demande refusée', `La demande de ${selectedRequest.employeeName} a été refusée.`, 'info');
        setIsProcessing(false);
        await showSuccessAlert('Demande refusée', `La demande de ${selectedRequest.employeeName} a été refusée.`);
      } else if (actionType === 'modify') {
        const days = modifiedDaysCount > 0 ? modifiedDaysCount : calculateDaysBetween(modifiedStartDate, modifiedEndDate);
        await decideLeaveRequest(selectedRequest.id, {
          status: 'modified',
          managerComment: managerComment.trim() || 'Durée et période ajustées selon impératifs de service.',
          approvedStartDate: modifiedStartDate,
          approvedEndDate: modifiedEndDate,
          approvedDaysCount: days,
          decidedBy: deciderName,
          decidedByUserId: currentUser?.id,
        }, selectedRequest, emp, onAddNotification);
        showToast?.('Durée ajustée', `La durée accordée a été ajustée à ${days} jour(s).`, 'success');
        setIsProcessing(false);
        await showSuccessAlert('Durée ajustée !', `La durée accordée pour ${selectedRequest.employeeName} a été ajustée à ${days} jour(s).`);
      }

      if (emp) {
        const leaveLabel = LEAVE_TYPE_LABELS[selectedRequest.type] || selectedRequest.type;
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

      closeModal();
    } catch {
      setIsProcessing(false);
      showToast?.('Erreur', 'Impossible de traiter la demande.', 'warning');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    categoryFilter, setCategoryFilter, statusFilter, setStatusFilter, searchQuery, setSearchQuery,
    selectedRequest, actionType, managerComment, setManagerComment, modifiedStartDate, setModifiedStartDate,
    modifiedEndDate, setModifiedEndDate, modifiedDaysCount, setModifiedDaysCount, isProcessing,
    ...adminCreate,
    stats, filteredRequests, handleTerminateMission, openActionModal, closeModal,
    handleConfirmDecision,
  };
}
