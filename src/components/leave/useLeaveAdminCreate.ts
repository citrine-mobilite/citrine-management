import React, { useState, useEffect } from 'react';
import { LeaveType, LeaveStatus } from '../../types/leaveTypes';
import { Employee } from '../../types/employeeTypes';
import { AppUser } from '../../types/userTypes';
import { NotificationLog } from '../../types/businessTypes';
import { calculateDaysBetween, createAdminLeaveRequest } from '../../services/leaveService';
import { executeOperationWithLoading } from '../../utils/sweetAlert';

interface UseLeaveAdminCreateParams {
  employees: Employee[];
  currentUser: AppUser | null;
  onAddNotification?: (n: NotificationLog) => void;
  showToast?: (title: string, desc: string, type?: 'success' | 'warning' | 'info') => void;
}

export function useLeaveAdminCreate({
  employees,
  currentUser,
  onAddNotification,
  showToast,
}: UseLeaveAdminCreateParams) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createEmployeeId, setCreateEmployeeId] = useState('');
  const [createLeaveType, setCreateLeaveType] = useState<LeaveType>('conge_annuel');
  const [createStartDate, setCreateStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [createEndDate, setCreateEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [createDaysCount, setCreateDaysCount] = useState<number>(1);
  const [createReason, setCreateReason] = useState('');
  const [createStatus, setCreateStatus] = useState<LeaveStatus>('approved');
  const [createManagerComment, setCreateManagerComment] = useState('');
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  useEffect(() => {
    if (createStartDate && createEndDate) {
      setCreateDaysCount(calculateDaysBetween(createStartDate, createEndDate));
    }
  }, [createStartDate, createEndDate]);

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createEmployeeId) {
      showToast?.('Collaborateur requis', 'Veuillez sélectionner un collaborateur.', 'warning');
      return;
    }
    const emp = employees.find((item) => item.id === createEmployeeId);
    if (!emp) return;

    setIsSubmittingCreate(true);
    try {
      const empName = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
      const res = await executeOperationWithLoading({
        loadingTitle: 'Enregistrement du congé...',
        loadingText: `Création du congé / permission pour ${empName}, veuillez patienter...`,
        action: async () => {
          await createAdminLeaveRequest({
            employeeId: emp.id, employeeName: empName, employeeAvatar: emp.avatarUrl || '',
            department: emp.department || 'Opérations', type: createLeaveType,
            startDate: createStartDate, endDate: createEndDate, daysCount: createDaysCount,
            reason: createReason.trim() || 'Attribué par la Direction RH', status: createStatus,
            managerComment: createManagerComment.trim() || undefined,
          }, currentUser, onAddNotification);
          return { status: createStatus };
        },
        successTitle: 'Congé validé !',
        successMessage: `Congé / Permission validé(e) avec succès pour ${empName}.`,
        pendingTitle: 'Demande en attente',
        pendingMessage: `La demande pour ${empName} a été enregistrée en attente de validation.`,
        errorMessage: 'Impossible de créer la demande de congé.',
      });

      if (res.success) {
        setShowCreateModal(false);
        setCreateReason('');
        setCreateManagerComment('');
      }
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  return {
    showCreateModal, setShowCreateModal,
    createEmployeeId, setCreateEmployeeId,
    createLeaveType, setCreateLeaveType,
    createStartDate, setCreateStartDate,
    createEndDate, setCreateEndDate,
    createDaysCount, setCreateDaysCount,
    createReason, setCreateReason,
    createStatus, setCreateStatus,
    createManagerComment, setCreateManagerComment,
    isSubmittingCreate, handleCreateLeave,
  };
}
