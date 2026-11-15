import React, { useState, useEffect, useMemo } from 'react';
import { Employee, Presence, CompanyModuleConfig, AppUser, AttendanceIncident } from '../../types';
import { MapLayerType } from './map/MapLayerControls';
import { extractPresenceRequests } from './requests/presenceRequestsUtils';
import { isSelfOnlyUser, findMatchingEmployee, shouldEmployeeClock } from '../../utils/roleUtils';
import { realtimeSyncService } from '../../services/realtimeSyncService';
import { savePresenceAtomic } from '../../services/dataService';
import { showErrorAlert, executeOperationWithLoading } from '../../utils/sweetAlert';
import { isActualBadgePunch, getNextPresenceStep, executePresenceClockingStep } from './presenceClockStepHelper';
import { buildFilteredPresencesList, splitClockingEmployeesByRole } from './presenceFiltersHelper';
import { logSystemAudit } from '../../services/adminAuditService';

interface UsePresencePanelLogicParams {
  employees: Employee[];
  presences: Presence[];
  onUpdatePresences: (updated: Presence[]) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
  currentUser?: AppUser;
  currentRole: 'Administrateur' | 'Employé' | 'Responsable';
  moduleConfig?: CompanyModuleConfig;
  attendanceIncidents: AttendanceIncident[];
  onUpdateAttendanceIncidents?: (incidents: AttendanceIncident[]) => void;
  onAddAttendanceIncident?: (incident: AttendanceIncident) => void;
}

export function usePresencePanelLogic({
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
}: UsePresencePanelLogicParams) {
  const todayStr = new Date().toISOString().split('T')[0];
  const isRestricted = isSelfOnlyUser(currentUser, currentRole);
  const myEmp = useMemo(() => findMatchingEmployee(employees, currentUser), [employees, currentUser]);

  const clockableEmployees = useMemo(() => {
    const list = employees.filter((e) => shouldEmployeeClock(e));
    if (!isRestricted) return list;
    return myEmp ? [myEmp] : list.slice(0, 1);
  }, [employees, isRestricted, myEmp]);

  const [selectedDate] = useState(todayStr);
  const [activeSidebarEmpId, setActiveSidebarEmpId] = useState(clockableEmployees[0]?.id || employees[0]?.id || '');
  const [sidebarTime, setSidebarTime] = useState(() => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
  const [collaboratorFilter, setCollaboratorFilter] = useState('all');
  const [itemsPerPage, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPresence, setEditingPresence] = useState<Presence | null>(null);
  const [isDynamicQrModalOpen, setIsDynamicQrModalOpen] = useState(false);
  const [isStaticDoorQrOpen, setIsStaticDoorQrOpen] = useState(false);
  const [isAdminClockModalOpen, setIsAdminClockModalOpen] = useState(false);
  const [isOfficeQrModalOpen, setIsOfficeQrModalOpen] = useState(false);
  const [isWeeklyRecapModalOpen, setIsWeeklyRecapModalOpen] = useState(false);
  const [activePresenceTab, setActivePresenceTab] = useState<'presences' | 'requests' | 'incidents'>('presences');
  const [mapLayer, setMapLayer] = useState<MapLayerType>('standard');
  const [mapPeriod, setMapPeriod] = useState<'day' | 'week' | 'month' | 'all' | 'custom'>('day');
  const [mapCustomFilter, setMapCustomFilter] = useState('');
  const [mapStartDate, setMapStartDate] = useState(todayStr);
  const [mapEndDate, setMapEndDate] = useState(todayStr);
  const [recentPunchId, setRecentPunchId] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    arrivalTime: '08:00',
    pauseStart: '',
    pauseEnd: '',
    departureTime: '',
    status: 'present' as Presence['status'],
    location: 'Bureau Principal - Douala III',
    correctionReason: '',
  });

  const pendingRequestsCount = useMemo(
    () => extractPresenceRequests(presences, clockableEmployees).filter((r) => r.status === 'pending').length,
    [presences, clockableEmployees]
  );

  const activeEmployee = clockableEmployees.find((e) => e.id === activeSidebarEmpId) || clockableEmployees[0] || employees[0];
  const empPresences = presences.filter((p) => p.employeeId === activeEmployee?.id);
  const currentPresence = presences.find((p) => p.employeeId === activeEmployee?.id && p.date === selectedDate);

  const presentCount = empPresences.filter((p) => p.status === 'present').length;
  const lateCount = empPresences.filter((p) => p.status === 'late').length;
  const absentCount = empPresences.filter((p) => p.status === 'absent').length;
  const totalActDays = presentCount + lateCount + absentCount || 1;
  const punctualityRate = Math.round((presentCount / totalActDays) * 100);
  const attendanceRate = Math.round(((presentCount + lateCount) / (totalActDays + 1)) * 100) || 50;

  useEffect(() => {
    const unsub = realtimeSyncService.subscribeToPresenceUpdates((eventData) => {
      const p = eventData.presence;
      if (p) {
        const empId = String(p.employeeId || p.id);
        setRecentPunchId(empId);
        setTimeout(() => setRecentPunchId((curr) => (curr === empId ? null : curr)), 6000);
        if (showToast && p.employeeName) {
          const actionText = p.departureTime ? 'Départ' : p.pauseEnd ? 'Retour Pause' : p.pauseStart ? 'Pause' : 'Arrivée';
          showToast(`⚡ Pointage direct : ${p.employeeName} (${actionText})`, 'success');
        }
      }
    });
    return () => unsub();
  }, [showToast]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSidebarTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (clockableEmployees.length > 0 && (!activeSidebarEmpId || !clockableEmployees.some((e) => e.id === activeSidebarEmpId))) {
      setActiveSidebarEmpId(clockableEmployees[0].id);
    }
  }, [clockableEmployees]);

  const nextStep = getNextPresenceStep(currentPresence, moduleConfig);
  const handleTriggerClockingStep = () => {
    executePresenceClockingStep({
      nextStep, activeEmployee, selectedDate, presences, attendanceIncidents,
      moduleConfig, onUpdatePresences, onAddAttendanceIncident, onUpdateAttendanceIncidents, showToast,
    });
  };

  const { mandatoryClockingEmployees, managerAndAdminEmployees } = useMemo(
    () => splitClockingEmployeesByRole(employees),
    [employees]
  );

  const badgedManagersForDate = useMemo(() => {
    const targetDate = selectedDate || todayStr;
    return managerAndAdminEmployees.filter((m) =>
      isActualBadgePunch(presences.find((p) => String(p.employeeId) === String(m.id) && p.date === targetDate))
    );
  }, [managerAndAdminEmployees, presences, selectedDate, todayStr]);

  const filterSelectableEmployees = useMemo(() => {
    const combined = [...mandatoryClockingEmployees, ...badgedManagersForDate];
    if (!isRestricted) return combined;
    return myEmp ? [myEmp] : combined.slice(0, 1);
  }, [mandatoryClockingEmployees, badgedManagersForDate, isRestricted, myEmp]);

  const filteredPresences = useMemo(
    () => buildFilteredPresencesList({
      mandatoryClockingEmployees, managerAndAdminEmployees, presences,
      targetDate: selectedDate || todayStr, collaboratorFilter, isRestricted, myEmp,
    }),
    [mandatoryClockingEmployees, managerAndAdminEmployees, presences, selectedDate, todayStr, collaboratorFilter, isRestricted, myEmp]
  );

  const totalItems = filteredPresences.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPresences = filteredPresences.slice(startIndex, startIndex + itemsPerPage);

  const handleOpenEditPresence = (presence: Presence) => {
    setEditingPresence(presence);
    setEditForm({
      arrivalTime: presence.arrivalTime || '',
      pauseStart: presence.pauseStart || '',
      pauseEnd: presence.pauseEnd || '',
      departureTime: presence.departureTime || '',
      status: presence.status || 'present',
      location: presence.location || 'Bureau Principal - Douala III',
      correctionReason: presence.correctionReason || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveManualEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPresence) return;
    const isTimeModified =
      editForm.arrivalTime !== (editingPresence.arrivalTime || '') ||
      editForm.pauseStart !== (editingPresence.pauseStart || '') ||
      editForm.pauseEnd !== (editingPresence.pauseEnd || '') ||
      editForm.departureTime !== (editingPresence.departureTime || '');
    if (isTimeModified && !editForm.correctionReason.trim()) {
      await showErrorAlert('Motif obligatoire', "Un motif est obligatoire pour toute modification d'heure de pointage.");
      return;
    }
    const updated = presences.map((p) => (p.id === editingPresence.id ? { ...p, ...editForm } : p));
    setIsEditModalOpen(false);
    await executeOperationWithLoading({
      loadingTitle: 'Enregistrement de la modification...',
      loadingText: 'Synchronisation du pointage en base de données...',
      action: async () => {
        onUpdatePresences(updated);
        const targetPresence = updated.find((p) => p.id === editingPresence.id);
        if (targetPresence) {
          await savePresenceAtomic(targetPresence);
          const emp = employees.find((item) => String(item.id) === String(targetPresence.employeeId));
          logSystemAudit({
            authorName: currentUser?.name || currentRole,
            authorRole: currentUser?.role || currentRole,
            targetName: emp?.name || targetPresence.employeeId,
            targetEmployeeId: emp?.id || targetPresence.employeeId,
            operationType: 'presence_pointage',
            operationLabel: 'Correction Manuelle de Pointage',
            details: `Pointage du ${targetPresence.date} modifié (Arrivée: ${editForm.arrivalTime || '—'}, Départ: ${editForm.departureTime || '—'}). Motif: ${editForm.correctionReason || 'Ajustement RH'}`,
            level: 'info',
            metadata: { employeeEmail: emp?.email, date: targetPresence.date },
          });
        }
      },
      successTitle: 'Pointage mis à jour !',
      successMessage: 'Les modifications de pointage ont été enregistrées avec succès en base de données.',
    });
  };

  const handleExportExcel = () => {
    if (showToast) showToast('Export du registre des présences au format Excel (.xls)...', 'success');
  };

  return {
    isRestricted, myEmp, clockableEmployees, selectedDate, activeSidebarEmpId, setActiveSidebarEmpId,
    sidebarTime, collaboratorFilter, setCollaboratorFilter, itemsPerPage, setPageSize, currentPage, setCurrentPage,
    isEditModalOpen, setIsEditModalOpen, editingPresence, isDynamicQrModalOpen, setIsDynamicQrModalOpen,
    isStaticDoorQrOpen, setIsStaticDoorQrOpen, isAdminClockModalOpen, setIsAdminClockModalOpen,
    isOfficeQrModalOpen, setIsOfficeQrModalOpen, isWeeklyRecapModalOpen, setIsWeeklyRecapModalOpen,
    activePresenceTab, setActivePresenceTab, mapLayer, setMapLayer, mapPeriod, setMapPeriod,
    mapCustomFilter, setMapCustomFilter, mapStartDate, setMapStartDate, mapEndDate, setMapEndDate,
    recentPunchId, editForm, setEditForm, pendingRequestsCount, activeEmployee, currentPresence,
    presentCount, lateCount, absentCount, punctualityRate, attendanceRate, nextStep,
    handleTriggerClockingStep, filterSelectableEmployees, filteredPresences,
    totalItems, totalPages, startIndex, paginatedPresences,
    handleOpenEditPresence, handleSaveManualEdit, handleExportExcel,
  };
}
