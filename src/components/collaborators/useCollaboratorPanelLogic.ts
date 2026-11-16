import React, { useEffect, useState } from 'react';
import {
  AppUser,
  CompanyModuleConfig,
  Employee,
  EmployeeStatus,
  NotificationLog,
  Presence,
} from '../../types';
import {
  CollaboratorDetailTab,
  CollaboratorFormData,
  CollaboratorViewMode,
  buildEditCollaboratorFormData,
  createEmptyCollaboratorFormData,
  getEmployeeStatusKey,
} from './collaboratorConstants';
import { persistCreatedCollaborator } from './collaboratorCreateHelper';
import { persistEditedCollaborator } from './collaboratorEditHelper';
import {
  applyQuickEnPosteStatus,
  applyStatusReasonChange,
} from './collaboratorStatusHelpers';
import { AdminAccountOperation, getAdminAuditOperations } from '../../services/adminAuditService';
import { exportToExcel } from '../../services/excelExportService';
import { exportElementToPdf } from '../../services/pdfExportService';
import {
  AttendanceMonthlyReport,
  buildMonthlyAttendanceReport,
} from '../../services/rhReportService';
import { executeOperationWithLoading } from '../../utils/sweetAlert';

export function useCollaboratorPanelLogic(params: {
  employees: Employee[];
  presences: Presence[];
  users: AppUser[];
  moduleConfig?: CompanyModuleConfig;
  initialSelectedEmployeeId?: string;
  onUpdateEmployees: (employees: Employee[]) => Promise<void> | void;
  onUpdateUsers?: (users: AppUser[]) => Promise<void> | void;
  onAddNotification?: (log: NotificationLog) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}) {
  const {
    employees,
    presences,
    users,
    moduleConfig,
    initialSelectedEmployeeId,
    onUpdateEmployees,
    onUpdateUsers,
    onAddNotification,
    showToast,
  } = params;

  const [viewMode, setViewMode] = useState<CollaboratorViewMode>(
    initialSelectedEmployeeId ? 'detail' : 'list'
  );
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(
    initialSelectedEmployeeId || null
  );
  const [activeDetailTab, setActiveDetailTab] = useState<CollaboratorDetailTab>('statistics');

  useEffect(() => {
    if (initialSelectedEmployeeId) {
      setSelectedEmpId(initialSelectedEmployeeId);
      setViewMode('detail');
    }
  }, [initialSelectedEmployeeId]);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [managerFilter, setManagerFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [statusReasonModalTarget, setStatusReasonModalTarget] = useState<{
    emp: Employee;
    targetStatus: EmployeeStatus;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAuditHistoryModalOpen, setIsAuditHistoryModalOpen] = useState(false);
  const [auditOpsList, setAuditOpsList] = useState<AdminAccountOperation[]>(() =>
    getAdminAuditOperations()
  );
  const [rhReportModal, setRhReportModal] = useState<AttendanceMonthlyReport | null>(null);
  const [rhReportMonth, setRhReportMonth] = useState<string>('2026-10');
  const [isGeneratingRhReport, setIsGeneratingRhReport] = useState<boolean>(false);
  const [formData, setFormData] = useState<CollaboratorFormData>(() =>
    createEmptyCollaboratorFormData()
  );

  const handleGenerateEmpMonthlyReport = async (targetEmp: Employee, monthStr?: string) => {
    setIsGeneratingRhReport(true);
    try {
      const m = monthStr || rhReportMonth || '2026-10';
      const cleanMonth = m < '2026-10' ? '2026-10' : m;
      const report = await buildMonthlyAttendanceReport(targetEmp, presences, cleanMonth);
      setRhReportModal(report);
    } catch (e) {
      console.warn('Erreur génération rapport:', e);
    } finally {
      setIsGeneratingRhReport(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setFormData(createEmptyCollaboratorFormData());
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData(buildEditCollaboratorFormData(emp, users));
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast?.('Le nom du collaborateur est requis.', 'error');
      return;
    }
    const isEdit = Boolean(editingEmployee);
    const trimmedName = formData.name.trim();
    setIsSaving(true);
    try {
      const res = await executeOperationWithLoading({
        loadingTitle: isEdit ? 'Mise à jour du collaborateur...' : 'Création du collaborateur...',
        loadingText: isEdit
          ? `Modification de la fiche de "${trimmedName}" en cours, veuillez patienter...`
          : `Création de la fiche et des accès de "${trimmedName}", veuillez patienter...`,
        action: async () => {
          if (editingEmployee) {
            await persistEditedCollaborator({
              editingEmployee,
              formData,
              employees,
              users,
              onUpdateEmployees,
              onUpdateUsers,
              onAddNotification,
            });
          } else {
            await persistCreatedCollaborator({
              formData,
              employees,
              users,
              onUpdateEmployees,
              onUpdateUsers,
              onAddNotification,
            });
          }
          setAuditOpsList(getAdminAuditOperations());
        },
        successTitle: isEdit ? 'Fiche modifiée !' : 'Collaborateur créé !',
        successMessage: isEdit
          ? `La fiche de "${trimmedName}" et ses accès associés ont été mis à jour avec succès.`
          : `Le collaborateur "${trimmedName}" et son compte d'accès ont été créés avec succès.`,
        errorMessage: isEdit
          ? 'Erreur lors de la modification du collaborateur.'
          : 'Erreur lors de la création du collaborateur.',
      });
      if (res.success) {
        setIsModalOpen(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChangeQuick = async (empId: string, newStatus: Employee['status']) => {
    const emp = employees.find((item) => item.id === empId);
    if (!emp) return;
    if (newStatus !== 'en_poste') {
      setStatusReasonModalTarget({ emp, targetStatus: newStatus });
      return;
    }
    await executeOperationWithLoading({
      loadingTitle: 'Mise à jour du statut...',
      loadingText: `Passage de "${emp.name}" en statut « En poste », veuillez patienter...`,
      action: async () => {
        await Promise.resolve(
          applyQuickEnPosteStatus({ emp, newStatus, employees, users, onUpdateEmployees, onUpdateUsers })
        );
      },
      successTitle: 'Statut mis à jour !',
      successMessage: `Le statut de "${emp.name}" et son compte utilisateur ont été mis à jour.`,
      errorMessage: 'Impossible de mettre à jour le statut du collaborateur.',
    });
  };

  const handleConfirmStatusReason = async (
    empId: string, status: Employee['status'], reason: string, startDate: string, endDate: string
  ) => {
    const emp = employees.find((item) => item.id === empId);
    await executeOperationWithLoading({
      loadingTitle: 'Mise à jour du statut...',
      loadingText: `Enregistrement du changement de statut${emp ? ` pour "${emp.name}"` : ''}, veuillez patienter...`,
      action: async () => {
        await Promise.resolve(
          applyStatusReasonChange({
            empId, status, reason, startDate, endDate, employees, users, moduleConfig, onUpdateEmployees, onUpdateUsers,
          })
        );
        setAuditOpsList(getAdminAuditOperations());
      },
      successTitle: 'Statut mis à jour !',
      successMessage: `Statut et compte utilisateur mis à jour avec le motif : "${reason}".`,
      errorMessage: 'Impossible de modifier le statut du collaborateur.',
    });
  };

  const filtered = employees.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.email && e.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.phone && e.phone.includes(searchTerm));
    const matchesRole = roleFilter === 'all' || e.roleType === roleFilter;
    const matchesStatus = statusFilter === 'all' || getEmployeeStatusKey(e) === statusFilter;
    const matchesTeam =
      teamFilter === 'all' ||
      (Array.isArray(e.teams) && e.teams.includes(teamFilter)) ||
      (typeof e.team === 'string' && e.team.includes(teamFilter));
    const matchesManager = managerFilter === 'all' || String(e.managerId || '') === String(managerFilter);
    return matchesSearch && matchesRole && matchesStatus && matchesTeam && matchesManager;
  });

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handleExportExcel = () => {
    const headers = ['Matricule', 'Nom', 'Email', 'Téléphone', 'Fonction', 'Département', 'Équipe', 'Statut', 'Salaire (XAF)'];
    const rows = employees.map((e) => [e.id, e.name, e.email, e.phone, e.roleType, e.department || '', e.team || '', e.status || 'en_poste', e.salary || 0]);
    exportToExcel('annuaire_collaborateurs.xls', 'Annuaire Général des Collaborateurs Citrine', headers, rows);
    showToast?.('Export Excel des collaborateurs téléchargé.', 'success');
  };

  const handleExportPDF = () => {
    exportElementToPdf('collaborators-table-container', 'annuaire_collaborateurs.pdf');
    showToast?.("Génération du rapport PDF de l'effectif...", 'success');
  };

  return {
    viewMode, setViewMode, selectedEmployeeObj: employees.find((e) => e.id === selectedEmpId),
    setSelectedEmployeeId: setSelectedEmpId, activeDetailTab, setActiveDetailTab,
    searchTerm, setSearchTerm, roleFilter, setRoleFilter, statusFilter, setStatusFilter,
    teamFilter, setTeamFilter, managerFilter, setManagerFilter, currentPage, setCurrentPage,
    itemsPerPage, isModalOpen, setIsModalOpen, editingEmployee, isAvatarPickerOpen,
    setIsAvatarPickerOpen, statusReasonModalTarget, setStatusReasonModalTarget, isSaving,
    isAuditHistoryModalOpen, setIsAuditHistoryModalOpen, auditOpsList, rhReportModal,
    setRhReportModal, rhReportMonth, setRhReportMonth, isGeneratingRhReport, formData,
    setFormData, handleGenerateEmpMonthlyReport, handleOpenAdd, handleOpenEdit, handleSave,
    handleStatusChangeQuick, handleConfirmStatusReason, totalItems, totalPages, startIndex,
    paginatedEmployees, handleExportExcel, handleExportPDF,
  };
}
