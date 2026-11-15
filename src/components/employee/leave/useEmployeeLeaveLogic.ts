import React, { useState, useMemo } from 'react';
import { Employee, AppUser, LeaveRequest, LeaveType, NotificationLog, LEAVE_TYPE_LABELS } from '../../../types';
import { createLeaveRequest, deleteLeaveRequest, calculateDaysBetween } from '../../../services/leaveService';
import { terminateMission } from '../../../services/missionLifecycleService';
import { showSuccessAlert, showErrorAlert, confirmActionAlert, executeDeleteWithSweetAlert } from '../../../utils/sweetAlert';

interface UseEmployeeLeaveLogicParams {
  employeeProfile: Employee;
  currentUser?: AppUser | null;
  leaveRequests: LeaveRequest[];
  onAddNotification?: (n: NotificationLog) => void;
  showToast?: (title: string, desc: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
  onUpdateLeaveRequests?: (leaves: LeaveRequest[]) => void;
  onUpdateEmployees?: (employees: Employee[]) => void;
  onUpdateUsers?: (users: AppUser[]) => void;
  employees: Employee[];
  users: AppUser[];
}

export function useEmployeeLeaveLogic({
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
}: UseEmployeeLeaveLogicParams) {
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'mission' | 'leave'>('mission');
  const [selectedLeaveModal, setSelectedLeaveModal] = useState<LeaveRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);
  const [viewDensity, setViewDensity] = useState<'compact' | 'detailed'>('compact');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'missions' | 'leaves'>('all');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'modified' | 'terminee' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [leaveType, setLeaveType] = useState<LeaveType>('mission_professionnelle');
  const [missionLocation, setMissionLocation] = useState('');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [reason, setReason] = useState('');
  const [attachmentName, setAttachmentName] = useState('');

  const handleOpenMissionModal = () => {
    setModalMode('mission');
    setLeaveType('mission_professionnelle');
    setReason('');
    setMissionLocation('');
    setShowModal(true);
  };

  const handleOpenLeaveModal = () => {
    setModalMode('leave');
    setLeaveType('conge_annuel');
    setReason('');
    setMissionLocation('');
    setShowModal(true);
  };

  const myLeaves = useMemo(
    () => (leaveRequests || []).filter((l) => l.employeeId === employeeProfile.id || l.employeeEmail === employeeProfile.email),
    [leaveRequests, employeeProfile]
  );

  const stats = useMemo(() => {
    const missions = myLeaves.filter((l) => l.type === 'mission_professionnelle').length;
    const pending = myLeaves.filter((l) => l.status === 'pending').length;
    const approved = myLeaves.filter((l) => l.status === 'approved').length;
    const modified = myLeaves.filter((l) => l.status === 'modified').length;
    const terminee = myLeaves.filter((l) => l.status === 'terminee').length;
    const rejected = myLeaves.filter((l) => l.status === 'rejected').length;
    const totalDaysTaken = myLeaves
      .filter((l) => l.status === 'approved' || l.status === 'modified' || l.status === 'terminee')
      .reduce((sum, l) => sum + (l.approvedDaysCount ?? l.daysCount), 0);
    return { missions, pending, approved, modified, terminee, rejected, totalDaysTaken, total: myLeaves.length };
  }, [myLeaves]);

  const filteredLeaves = useMemo(() => {
    return myLeaves.filter((leave) => {
      if (categoryFilter === 'missions' && leave.type !== 'mission_professionnelle') return false;
      if (categoryFilter === 'leaves' && leave.type === 'mission_professionnelle') return false;
      if (filter !== 'all' && leave.status !== filter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const typeLabel = (LEAVE_TYPE_LABELS[leave.type]?.label || '').toLowerCase();
        const reasonText = (leave.reason || '').toLowerCase();
        const dates = `${leave.startDate} ${leave.endDate}`.toLowerCase();
        const comment = (leave.managerComment || '').toLowerCase();
        if (!typeLabel.includes(q) && !reasonText.includes(q) && !dates.includes(q) && !comment.includes(q)) return false;
      }
      return true;
    });
  }, [myLeaves, categoryFilter, filter, searchQuery]);

  const handleTerminateMyMission = async (leaveId: string) => {
    const isConfirmed = await confirmActionAlert({
      title: 'Terminer votre mission ?',
      text: 'Confirmez-vous que votre mission professionnelle est terminée ?\nVotre statut et votre compte utilisateur seront immédiatement replacés en statut « En poste ».',
      confirmButtonText: 'Oui, mission terminée',
      icon: 'question',
    });
    if (!isConfirmed) return;

    setIsTerminating(true);
    try {
      const res = await terminateMission(
        leaveId,
        leaveRequests,
        employees.length > 0 ? employees : [employeeProfile],
        users.length > 0 ? users : currentUser ? [currentUser] : [],
        employeeProfile.name || 'Collaborateur',
        onUpdateLeaveRequests,
        onUpdateEmployees,
        onUpdateUsers,
        onAddNotification
      );
      if (res.success) {
        showToast?.('Mission Terminée ✓', 'La mission a été clôturée. Vous et votre compte utilisateur êtes de nouveau en statut « En poste ».', 'success');
        await showSuccessAlert('Mission clôturée !', 'Votre mission est marquée comme terminée. Votre statut et compte utilisateur sont de nouveau « En poste ».');
        if (selectedLeaveModal?.id === leaveId) setSelectedLeaveModal(null);
      } else {
        showToast?.('Erreur', res.error || 'Impossible de clôturer la mission.', 'error');
        await showErrorAlert('Erreur', res.error || 'Impossible de clôturer la mission.');
      }
    } catch {
      showToast?.('Erreur', 'Impossible de clôturer la mission pour le moment.', 'error');
      await showErrorAlert('Erreur', 'Impossible de clôturer la mission pour le moment.');
    } finally {
      setIsTerminating(false);
    }
  };

  const currentDurationDays = useMemo(() => calculateDaysBetween(startDate, endDate), [startDate, endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      const msg = modalMode === 'mission' ? "Veuillez préciser l'objectif ou le client pour cette mission." : 'Veuillez renseigner le motif explicatif.';
      showToast?.('Motif requis', msg, 'warning');
      await showErrorAlert('Motif obligatoire', msg);
      return;
    }
    if (startDate > endDate) {
      showToast?.('Dates incohérentes', 'La date de fin ne peut pas précéder la date de début.', 'warning');
      await showErrorAlert('Dates invalides', 'La date de fin ne peut pas précéder la date de début.');
      return;
    }

    setIsSubmitting(true);
    try {
      const isMission = leaveType === 'mission_professionnelle' || modalMode === 'mission';
      const typeLabel = isMission ? 'Mission Professionnelle' : LEAVE_TYPE_LABELS[leaveType]?.label || 'Congé';
      const finalReason = isMission && missionLocation.trim() ? `[Mission: ${missionLocation.trim()}] ${reason.trim()}` : reason.trim();

      await createLeaveRequest({
        employeeId: employeeProfile.id,
        employeeName: employeeProfile.name,
        employeeEmail: employeeProfile.email,
        employeeAvatar: employeeProfile.avatarUrl,
        department: employeeProfile.department || 'Opérations',
        type: isMission ? 'mission_professionnelle' : leaveType,
        startDate,
        endDate,
        daysCount: currentDurationDays,
        reason: finalReason,
        attachmentName: attachmentName.trim() || undefined,
      }, onAddNotification);

      setIsSubmitting(false);
      if (isMission) {
        showToast?.('Ordre de mission transmis 🚀', `Votre demande de mission (${currentDurationDays} j) du ${startDate} au ${endDate} a bien été enregistrée et transmise à la Direction RH.`, 'success');
        await showSuccessAlert('Demande de mission transmise !', `Votre ordre de mission (${currentDurationDays} j) du ${startDate} au ${endDate} a été transmis à la Direction RH.`);
      } else {
        showToast?.('Demande transmise', `Votre demande de ${typeLabel} (${currentDurationDays} j) du ${startDate} au ${endDate} a bien été enregistrée.`, 'success');
        await showSuccessAlert('Demande transmise !', `Votre demande de ${typeLabel} (${currentDurationDays} j) du ${startDate} au ${endDate} a été enregistrée.`);
      }
      setShowModal(false);
      setReason('');
      setMissionLocation('');
      setAttachmentName('');
    } catch (err: any) {
      setIsSubmitting(false);
      showToast?.('Échec de transmission', 'Impossible de transmettre la demande pour le moment. Veuillez vérifier votre connexion.', 'error');
      await showErrorAlert('Échec de transmission', err?.message || 'Impossible de transmettre la demande.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRequest = async (leaveId: string) => {
    await executeDeleteWithSweetAlert({
      title: 'Annuler cette demande ?',
      text: 'Voulez-vous vraiment annuler et retirer cette demande de votre dossier ?',
      action: async () => {
        await deleteLeaveRequest(leaveId);
        if (selectedLeaveModal?.id === leaveId) setSelectedLeaveModal(null);
      },
      successTitle: 'Demande annulée !',
      successMessage: 'La demande a été retirée avec succès de votre dossier.',
      errorMessage: 'Impossible d’annuler cette demande pour le moment.',
    });
  };

  return {
    showModal, setShowModal, modalMode, selectedLeaveModal, setSelectedLeaveModal,
    isSubmitting, isTerminating, viewDensity, setViewDensity, categoryFilter, setCategoryFilter,
    filter, setFilter, searchQuery, setSearchQuery, leaveType, setLeaveType,
    missionLocation, setMissionLocation, startDate, setStartDate, endDate, setEndDate,
    reason, setReason, attachmentName, setAttachmentName,
    stats, filteredLeaves, currentDurationDays,
    handleOpenMissionModal, handleOpenLeaveModal, handleTerminateMyMission, handleSubmit, handleCancelRequest,
  };
}
