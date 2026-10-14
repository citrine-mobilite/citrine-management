import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  X, 
  Save, 
  Eye, 
  Pencil, 
  FileText, 
  Clock, 
  MapPin, 
  Bell, 
  CheckSquare, 
  Printer, 
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  KeyRound,
  Sparkles,
  Camera,
  AlertCircle,
  ShieldAlert,
  History,
  UserCheck,
  ShieldCheck
} from 'lucide-react';
import { 
  Employee, 
  EmployeeStatus,
  Presence, 
  Task, 
  SalaryPayment, 
  EmployeeSalaryDebt, 
  NotificationLog,
  AppUser,
  UserRole
} from '../types';
import { CollaboratorPresenceMap } from './CollaboratorPresenceMap';
import { getEmployeeSoftColor } from '../utils/colorUtils';
import { downloadPayslipPdf } from '../services/pdfExportService';
import { saveUser } from '../services/userService';
import { generateUuidV4 } from '../services/employeeService';
import { supabaseAdmin } from '../lib/supabase';
import { CollaboratorAvatarPickerModal } from './collaborators/CollaboratorAvatarPickerModal';
import { CollaboratorStatusReasonModal } from './collaborators/CollaboratorStatusReasonModal';
import { disciplinaryReasonsService } from '../services/disciplinaryReasonsService';
import { logAdminOperation, getAdminAuditOperations, AdminAccountOperation } from '../services/adminAuditService';
import { exportToExcel } from '../services/excelExportService';
import { exportElementToPdf } from '../services/pdfExportService';
import RhReportModal from './RhReportModal';
import { buildMonthlyAttendanceReport, AttendanceMonthlyReport } from '../services/rhReportService';

interface CollaboratorPanelProps {
  employees: Employee[];
  presences?: Presence[];
  tasks?: Task[];
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
}

type ViewMode = 'list' | 'detail';
type DetailTabType = 'payslips' | 'presences' | 'map' | 'alerts' | 'tasks';

const STATUS_MAP = {
  en_poste: { label: 'En poste', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  en_conge: { label: 'En congés', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  maladie: { label: 'Maladie', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  suspendu: { label: 'Suspendu', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  parti: { label: 'Départ', color: 'bg-stone-100 text-stone-700 border-stone-300' },
  renvoye: { label: 'Renvoyé', color: 'bg-red-50 text-red-700 border-red-200' },
};

function getEmployeeStatusKey(emp: Employee): keyof typeof STATUS_MAP {
  const s = emp.employmentStatus || (typeof emp.status === 'string' ? emp.status : (emp.status ? 'en_poste' : 'parti'));
  if (s && s in STATUS_MAP) {
    return s as keyof typeof STATUS_MAP;
  }
  return 'en_poste';
}

export default function CollaboratorPanel({
  employees,
  presences = [],
  tasks = [],
  salaryPayments = [],
  salaryDebts = [],
  onUpdateEmployees,
  onUpdatePresences,
  onUpdateTasks,
  onUpdateSalaryPayments,
  showToast,
  users = [],
  onUpdateUsers,
}: CollaboratorPanelProps) {
  // Navigation & View States
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedEmpId, setSelectedEmployeeId] = useState<string | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTabType>('payslips');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setPageSize] = useState(25);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [statusReasonModalTarget, setStatusReasonModalTarget] = useState<{
    emp: Employee;
    targetStatus: 'renvoye' | 'suspendu' | 'parti';
  } | null>(null);

  const [isAuditHistoryModalOpen, setIsAuditHistoryModalOpen] = useState(false);
  const [auditOpsList, setAuditOpsList] = useState<AdminAccountOperation[]>(() => getAdminAuditOperations());
  const [teamFilter, setTeamFilter] = useState('all');
  const [managerFilter, setManagerFilter] = useState('all');
  const [rhReportModal, setRhReportModal] = useState<AttendanceMonthlyReport | null>(null);
  const [rhReportMonth, setRhReportMonth] = useState<string>('2026-10');
  const [isGeneratingRhReport, setIsGeneratingRhReport] = useState<boolean>(false);

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

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    roleType: 'employé' as Employee['roleType'],
    department: 'Informatique & IT',
    managerId: '',
    team: 'Équipe IT & Développement',
    hireDate: new Date().toISOString().split('T')[0],
    birthDate: '',
    salary: 200000,
    status: 'en_poste' as EmployeeStatus,
    departureReason: '',
    suspensionReason: '',
    avatarUrl: '',
    userId: '',
    roleId: 3 as number | string,
    createUserAccount: true,
    userPassword: '',
    userRole: 'employé' as UserRole,
  });

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      roleType: 'employé',
      department: 'Informatique & IT',
      managerId: '',
      team: 'Équipe IT & Développement',
      hireDate: new Date().toISOString().split('T')[0],
      birthDate: '',
      salary: 200000,
      status: 'en_poste',
      departureReason: '',
      suspensionReason: '',
      avatarUrl: '',
      userId: '',
      roleId: 3,
      createUserAccount: true,
      userPassword: '',
      userRole: 'employé',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    const linkedUser = users?.find(u => 
      (emp.userId && (u.id === String(emp.userId) || u.uid === String(emp.userId))) || 
      (u.employeeId && u.employeeId === emp.id) || 
      (emp.email && u.email && u.email.toLowerCase() === emp.email.toLowerCase())
    );

    let resolvedRoleId: number = 3;
    if (emp.roleId !== undefined && emp.roleId !== null && emp.roleId !== '') {
      resolvedRoleId = Number(emp.roleId);
    } else if (linkedUser?.roleId) {
      resolvedRoleId = Number(linkedUser.roleId);
    } else {
      const rLower = String(emp.roleType || '').toLowerCase();
      if (rLower.includes('admin') || rLower.includes('directeur')) {
        resolvedRoleId = 1;
      } else if (rLower.includes('responsable') || rLower.includes('manager')) {
        resolvedRoleId = 2;
      } else {
        resolvedRoleId = 3;
      }
    }

    const resolvedUserRole: UserRole = resolvedRoleId === 1 ? 'administrateur' : resolvedRoleId === 2 ? 'responsable' : 'employé';

    setFormData({
      name: emp.name || '',
      email: emp.email || '',
      phone: emp.phone || '',
      roleType: emp.roleType || 'employé',
      department: emp.department || 'Informatique & IT',
      managerId: String(emp.managerId || ''),
      team: emp.team || 'Équipe IT & Développement',
      hireDate: emp.hireDate || new Date().toISOString().split('T')[0],
      birthDate: emp.birthDate || '2000-01-05',
      salary: emp.salary || 200000,
      status: (typeof emp.status === 'string' ? emp.status : 'en_poste') as any,
      departureReason: emp.departureReason || '',
      suspensionReason: emp.suspensionReason || '',
      avatarUrl: emp.avatarUrl || '',
      userId: emp.userId ? String(emp.userId) : (linkedUser ? linkedUser.id : ''),
      roleId: resolvedRoleId,
      createUserAccount: !linkedUser,
      userPassword: '',
      userRole: resolvedUserRole,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      if (showToast) showToast('Le nom du collaborateur est requis.', 'error');
      return;
    }

    const empDepartment = formData.department.trim() || 'Direction Générale';

    if (editingEmployee) {
      // Détecter et consigner les opérations administratives
      if (editingEmployee.managerId !== formData.managerId) {
        const mgrName = employees.find((x) => x.id === formData.managerId)?.name || 'Direction Générale';
        logAdminOperation({
          authorName: 'Administrateur',
          targetEmployeeId: editingEmployee.id,
          targetName: formData.name,
          operationType: 'manager_change',
          operationLabel: 'Rattachement hiérarchique modifié',
          details: `Affecté sous la responsabilité de : ${mgrName}`,
        });
      }

      if (editingEmployee.team !== formData.team) {
        logAdminOperation({
          authorName: 'Administrateur',
          targetEmployeeId: editingEmployee.id,
          targetName: formData.name,
          operationType: 'team_change',
          operationLabel: 'Changement d\'équipe',
          details: `Transféré vers : ${formData.team}`,
        });
      }

      if (editingEmployee.roleType !== formData.roleType) {
        logAdminOperation({
          authorName: 'Administrateur',
          targetEmployeeId: editingEmployee.id,
          targetName: formData.name,
          operationType: 'role_change',
          operationLabel: 'Modification de la fonction métier',
          details: `Rôle mis à jour de "${editingEmployee.roleType}" à "${formData.roleType}"`,
        });
      }

      const resolvedRoleId = formData.roleId ? Number(formData.roleId) : (formData.userRole === 'administrateur' ? 1 : formData.userRole === 'responsable' ? 2 : 3);
      const targetUserId = formData.userId || editingEmployee.userId || '';

      const updated = employees.map((emp) =>
        emp.id === editingEmployee.id
          ? {
              ...emp,
              ...formData,
              userId: targetUserId || undefined,
              roleId: resolvedRoleId,
              department: empDepartment,
            }
          : emp
      );
      onUpdateEmployees(updated);

      // Synchroniser le compte utilisateur correspondant si existant
      if (formData.email || editingEmployee.email || targetUserId) {
        const targetEmail = (formData.email || editingEmployee.email || '').trim().toLowerCase();
        const existingUser = users?.find(
          (u) =>
            (targetUserId && (u.id === targetUserId || u.uid === targetUserId)) ||
            (targetEmail && u.email && u.email.toLowerCase() === targetEmail) ||
            (u.employeeId && u.employeeId === editingEmployee.id)
        );

        if (existingUser) {
          const updatedUser: AppUser = {
            ...existingUser,
            name: formData.name.trim(),
            role: formData.userRole,
            roleId: resolvedRoleId,
            department: empDepartment,
            phone: formData.phone || existingUser.phone,
            employeeId: editingEmployee.id,
          };
          saveUser(updatedUser).catch(() => {});
          if (onUpdateUsers && users) {
            onUpdateUsers(users.map((u) => (u.id === existingUser.id ? updatedUser : u)));
          }
        }
      }

      setAuditOpsList(getAdminAuditOperations());
      if (showToast) showToast(`Fiche collaborateur mise à jour (Rôle ID: ${resolvedRoleId}).`, 'success');
    } else {
      const empUid = generateUuidV4();
      const empId = `emp-${Date.now()}`;
      const userUid = generateUuidV4();
      const userId = userUid;
      const userEmail = formData.email.trim() ? formData.email.trim().toLowerCase() : `collab_${Date.now()}@citrinemgmt.cm`;
      const initialPassword = formData.userPassword.trim() || 'Collab@2026';
      const computedRoleId = formData.userRole === 'administrateur' ? 1 : formData.userRole === 'responsable' ? 2 : 3;

      // 1. Enregistrement préalable du compte utilisateur associé
      let createdUserAccount: AppUser | null = null;
      try {
        if (supabaseAdmin) {
          try {
            await supabaseAdmin.auth.admin.createUser({
              email: userEmail,
              password: initialPassword,
              email_confirm: true,
            });
          } catch (authErr) {
            console.warn('[CollaboratorPanel] Notice création compte Auth Supabase:', authErr);
          }
        }

        createdUserAccount = {
          id: userId,
          uid: userUid,
          name: formData.name.trim(),
          email: userEmail,
          role: formData.userRole,
          roleId: computedRoleId,
          status: 'actif',
          department: empDepartment,
          phone: formData.phone || '',
          employeeId: empId,
          createdAt: new Date().toISOString(),
          passwordHash: initialPassword,
          authMethod: 'password',
        };

        await saveUser(createdUserAccount);
        if (onUpdateUsers && users) {
          onUpdateUsers([createdUserAccount, ...users]);
        }
      } catch (userErr) {
        console.warn('Erreur création compte utilisateur initial:', userErr);
      }

      // 2. Création de la fiche collaborateur avec userId et roleId déjà reliés
      const newEmp: Employee = {
        id: empId,
        uid: empUid,
        userId: userId,
        roleId: computedRoleId,
        avatarUrl: formData.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(formData.name)}`,
        name: formData.name.trim(),
        email: userEmail,
        phone: formData.phone,
        roleType: formData.roleType,
        department: empDepartment,
        managerId: formData.managerId,
        team: formData.team,
        hireDate: formData.hireDate,
        birthDate: formData.birthDate,
        salary: Number(formData.salary) || 0,
        status: formData.status,
        employmentStatus: formData.status,
        departureReason: formData.departureReason,
        suspensionReason: formData.suspensionReason,
      };

      // 3. Sauvegarder immédiatement l'employé avec userId et roleId
      onUpdateEmployees([newEmp, ...employees]);

      // Consigner l'opération de création
      logAdminOperation({
        authorName: 'Administrateur',
        targetEmployeeId: empId,
        targetUserId: userId,
        targetName: formData.name.trim(),
        operationType: 'creation',
        operationLabel: 'Création du collaborateur',
        details: `Ajout dans "${formData.team}" sous statut "${formData.status}" | User ID: ${userId} | Rôle ID: ${computedRoleId}`,
      });

      if (formData.managerId) {
        const mgrName = employees.find((x) => x.id === formData.managerId)?.name || 'Direction';
        logAdminOperation({
          authorName: 'Administrateur',
          targetEmployeeId: empId,
          targetName: formData.name.trim(),
          operationType: 'manager_change',
          operationLabel: 'Rattachement hiérarchique initial',
          details: `Responsable : ${mgrName}`,
        });
      }

      if (showToast) {
        showToast(
          `Collaborateur et compte créés et liés avec succès ! User ID: ${userId.slice(0, 8)}... | Rôle ID: ${computedRoleId}`,
          'success'
        );
      }

      setAuditOpsList(getAdminAuditOperations());
    }

    setIsModalOpen(false);
  };

  const handleStatusChangeQuick = (empId: string, newStatus: Employee['status']) => {
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;

    if (newStatus === 'renvoye' || newStatus === 'suspendu' || newStatus === 'parti') {
      setStatusReasonModalTarget({ emp, targetStatus: newStatus });
      return;
    }

    const updated = employees.map((e) =>
      e.id === empId ? { ...e, status: newStatus } : e
    );
    onUpdateEmployees(updated);
    if (showToast) showToast('Statut du collaborateur mis à jour.', 'success');
  };

  const handleConfirmStatusReason = (empId: string, status: Employee['status'], reason: string) => {
    const updated = employees.map((emp) => {
      if (emp.id !== empId) return emp;
      const copy = { ...emp, status };
      if (status === 'renvoye' || status === 'parti') {
        copy.departureReason = reason;
        copy.departureDate = new Date().toISOString().split('T')[0];
      } else if (status === 'suspendu') {
        copy.suspensionReason = reason;
        copy.suspensionDate = new Date().toISOString().split('T')[0];
      }
      return copy;
    });

    const target = employees.find((e) => e.id === empId);
    if (target) {
      logAdminOperation({
        authorName: 'Administrateur',
        targetEmployeeId: empId,
        targetName: target.name,
        operationType: 'status_change',
        operationLabel: status === 'renvoye' ? 'Renvoi RH notifié' : status === 'suspendu' ? 'Suspension conservatoire' : 'Départ de l\'entreprise',
        details: `Statut passé à "${status}" avec motif : "${reason}"`,
      });
      setAuditOpsList(getAdminAuditOperations());
    }

    onUpdateEmployees(updated);
    if (showToast) showToast(`Statut mis à jour avec le motif : "${reason}"`, 'success');
  };

  const selectedEmployeeObj = employees.find((e) => e.id === selectedEmpId);

  // Filtered employees
  const filtered = employees.filter((e) => {
    const matchesSearch = 
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.email && e.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.phone && e.phone.includes(searchTerm));
    
    const matchesRole = roleFilter === 'all' || e.roleType === roleFilter;
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination calculations
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = filtered.slice(startIndex, startIndex + itemsPerPage);

  const formatXAF = (val: number = 0) => `${val.toLocaleString('fr-FR')} XAF`;

  // Excel & PDF Exports
  const handleExportExcel = () => {
    const headers = ['Matricule', 'Nom', 'Email', 'Téléphone', 'Fonction', 'Département', 'Équipe', 'Statut', 'Salaire (XAF)'];
    const rows = employees.map((e) => [
      e.id,
      e.name,
      e.email,
      e.phone,
      e.roleType,
      e.department || '',
      e.team || '',
      e.status || 'en_poste',
      e.salary || 0,
    ]);
    exportToExcel('annuaire_collaborateurs.xls', 'Annuaire Général des Collaborateurs Citrine', headers, rows);
    if (showToast) showToast('Export Excel des collaborateurs téléchargé.', 'success');
  };

  const handleExportPDF = () => {
    exportElementToPdf('collaborators-table-container', 'annuaire_collaborateurs.pdf');
    if (showToast) showToast('Génération du rapport PDF de l\'effectif...', 'success');
  };

  const handlePrintFile = () => {
    window.print();
  };

  if (viewMode === 'detail' && selectedEmployeeObj) {
    const emp = selectedEmployeeObj;
    const empPresences = presences.filter((p) => p.employeeId === emp.id);
    const empPayslips = salaryPayments.filter((p) => p.employeeId === emp.id);
    const empTasks = tasks.filter((t) => t.assignedTo === emp.name && t.status !== 'completed');
    const empLoans = salaryDebts.filter((d) => d.employeeId === emp.id);

    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
        {/* Detail Top Header Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode('list')}
              className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer flex items-center gap-1 text-xs font-bold"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour aux collaborateurs
            </button>
            <div className="h-4 w-[1px] bg-stone-200 hidden sm:block"></div>
            <span className="text-xs text-stone-500 font-medium">
              Fiche Individuelle • <b className="text-stone-800 font-bold">{emp.name}</b>
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleOpenEdit(emp)}
              className="flex-1 sm:flex-initial px-3.5 py-2 border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5 text-[#2A7B76]" />
              Modifier la fiche
            </button>
            <button
              onClick={handlePrintFile}
              className="flex-1 sm:flex-initial px-3.5 py-2 border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 text-stone-500" />
              Imprimer
            </button>
          </div>
        </div>

        {/* Employee Overview Profiler Box */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <div className="w-20 h-20 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-2xl border border-emerald-100 shadow-3xs shrink-0 overflow-hidden">
              {emp.avatarUrl ? (
                <img src={emp.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span>{emp.name.slice(0, 2).toUpperCase()}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 rounded-lg">
                  {emp.roleType || 'Employé'}
                </span>
                <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-lg border ${
                  STATUS_MAP[getEmployeeStatusKey(emp)]?.color
                }`}>
                  {STATUS_MAP[getEmployeeStatusKey(emp)]?.label}
                </span>
              </div>

              <h2 className="font-serif font-bold text-xl text-stone-900">{emp.name}</h2>
              
              <div className="flex flex-col sm:flex-row items-center gap-x-4 gap-y-1.5 text-xs text-stone-500 font-medium pt-1">
                <div className="flex items-center gap-1">
                  <span className="text-stone-400">📧</span>
                  <span>{emp.email || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-stone-400">📞</span>
                  <span>{emp.phone || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-stone-400">🏢</span>
                  <span>{emp.department || 'Citrine Management'}</span>
                </div>
              </div>

              {emp.status === 'renvoye' && emp.departureReason && (
                <div className="mt-3 bg-red-50 border border-red-100 p-2.5 rounded-xl text-rose-800 text-[11px] font-medium">
                  ⚠️ <b>Motif de renvoi :</b> {emp.departureReason}
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 flex items-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-xs font-bold shadow-3xs">
              <Check className="h-4 w-4 text-emerald-600" />
              Assujetti aux pointages
            </span>
          </div>
        </div>

        {/* Real Metrics Pastel Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-emerald-50/50 p-5 rounded-3xl border border-emerald-100/60 shadow-3xs space-y-1.5">
            <span className="text-[10px] text-emerald-700/80 font-bold uppercase tracking-wide">Salaire de Base</span>
            <div className="text-lg font-bold text-emerald-800 font-mono">
              {formatXAF(emp.salary || 0)}
            </div>
          </div>

          <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100/60 shadow-3xs space-y-1.5">
            <span className="text-[10px] text-blue-700/80 font-bold uppercase tracking-wide">Pointages Présence</span>
            <div className="text-lg font-bold text-blue-800 font-mono">
              {empPresences.length} enregistrements
            </div>
          </div>

          <div className="bg-amber-50/40 p-5 rounded-3xl border border-amber-100/60 shadow-3xs space-y-1.5">
            <span className="text-[10px] text-amber-700/80 font-bold uppercase tracking-wide">Date d'arrivée</span>
            <div className="text-lg font-bold text-amber-800 font-mono">
              {emp.hireDate || '2026-01-01'}
            </div>
          </div>

          <div className="bg-purple-50/40 p-5 rounded-3xl border border-purple-100/60 shadow-3xs space-y-1.5">
            <span className="text-[10px] text-purple-700/80 font-bold uppercase tracking-wide">Anniversaire</span>
            <div className="text-lg font-bold text-purple-800 font-mono">
              {emp.birthDate || '2000-05-01'}
            </div>
          </div>
        </div>

        {/* Detailed Horizontal Subtabs */}
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-stone-100 rounded-2xl border border-stone-200/80">
            <button
              onClick={() => setActiveDetailTab('payslips')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeDetailTab === 'payslips' ? 'bg-[#2A7B76] text-white shadow-sm' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              {empPayslips.length} Fiches de Paie (Mois par mois)
            </button>
            <button
              onClick={() => setActiveDetailTab('presences')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeDetailTab === 'presences' ? 'bg-[#2A7B76] text-white shadow-sm' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              Historique des Présences ({empPresences.length})
            </button>
            <button
              onClick={() => setActiveDetailTab('map')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeDetailTab === 'map' ? 'bg-[#2A7B76] text-white shadow-sm' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              Carte des Badges (GPS Leaflet)
            </button>
            <button
              onClick={() => setActiveDetailTab('alerts')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeDetailTab === 'alerts' ? 'bg-[#2A7B76] text-white shadow-sm' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <Bell className="h-3.5 w-3.5" />
              Alertes Actives (0)
            </button>
            <button
              onClick={() => setActiveDetailTab('tasks')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeDetailTab === 'tasks' ? 'bg-[#2A7B76] text-white shadow-sm' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <CheckSquare className="h-3.5 w-3.5" />
              Tâches Non Terminées ({empTasks.length})
            </button>
          </div>

          {/* Subtab Content Panels */}
          <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs">
            {activeDetailTab === 'payslips' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-xs text-stone-900">Registre des bulletins d'embauche</h4>
                  <span className="text-[10px] text-stone-500 font-bold bg-stone-50 px-2 py-0.5 rounded-md border">
                    Devise : FCFA / XAF
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-stone-100 text-stone-400 font-bold pb-2 uppercase tracking-wide text-[10px]">
                        <th className="pb-3">Période</th>
                        <th className="pb-3">Base</th>
                        <th className="pb-3">Net à payer</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {empPayslips.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-10 text-stone-400 italic">
                            Aucune fiche de paie enregistrée pour cet employé.
                          </td>
                        </tr>
                      ) : (
                        empPayslips.map((p) => (
                          <tr key={p.id} className="hover:bg-stone-50/50">
                            <td className="py-3 font-bold text-stone-900">{p.period}</td>
                            <td className="py-3 font-mono text-stone-600">{formatXAF(p.baseAmount)}</td>
                            <td className="py-3 font-bold text-emerald-800 font-mono">{formatXAF(p.netAmount)}</td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => downloadPayslipPdf(p, emp)}
                                className="p-1 rounded bg-emerald-50 text-[#2A7B76] hover:bg-[#2A7B76] hover:text-white transition cursor-pointer"
                                title="Télécharger PDF"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeDetailTab === 'presences' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 border-b border-stone-100 gap-2">
                  <h4 className="font-serif font-bold text-xs text-stone-900">Historique complet des pointages</h4>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-stone-500 font-bold text-[11px]">Mois (dès Oct 2026) :</span>
                    <input
                      type="month"
                      min="2026-10"
                      value={rhReportMonth < '2026-10' ? '2026-10' : rhReportMonth}
                      onChange={(e) => setRhReportMonth(e.target.value >= '2026-10' ? e.target.value : '2026-10')}
                      className="bg-stone-50 border border-stone-200 rounded-lg px-2 py-0.5 text-xs font-bold text-stone-800"
                      title="Mois d'attestation de présence"
                    />
                    <button
                      onClick={() => handleGenerateEmpMonthlyReport(emp, rhReportMonth)}
                      disabled={isGeneratingRhReport}
                      className="bg-[#2A7B76] hover:bg-[#20635F] text-white text-xs font-bold px-3 py-1 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Télécharger la fiche de présence certifiée en PDF"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>{isGeneratingRhReport ? 'Génération...' : 'Fiche Mensuelle (PDF)'}</span>
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-stone-100 text-stone-400 font-bold pb-2 uppercase tracking-wide text-[10px]">
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Arrivée</th>
                        <th className="pb-3">Départ</th>
                        <th className="pb-3">Lieu</th>
                        <th className="pb-3">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {empPresences.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-10 text-stone-400 italic">
                            Aucun pointage de présence enregistré.
                          </td>
                        </tr>
                      ) : (
                        empPresences.map((p) => (
                          <tr key={p.id} className="hover:bg-stone-50/50">
                            <td className="py-3 font-mono font-medium">{p.date}</td>
                            <td className="py-3 font-mono text-stone-700">{p.arrivalTime || '--:--'}</td>
                            <td className="py-3 font-mono text-stone-700">{p.departureTime || '--:--'}</td>
                            <td className="py-3 text-stone-600 truncate max-w-[200px]" title={p.location}>{p.location || 'Douala III'}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${
                                p.status === 'present' ? 'bg-emerald-50 text-emerald-700' : p.status === 'late' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                              }`}>
                                {p.status === 'present' ? 'Présent' : p.status === 'late' ? 'En retard' : 'Absent'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeDetailTab === 'map' && (
              <div className="space-y-3">
                <h4 className="font-serif font-bold text-xs text-stone-900 pb-1">Positions GPS des pointages</h4>
                <CollaboratorPresenceMap presences={empPresences} employeeName={emp.name} avatarUrl={emp.avatarUrl} />
              </div>
            )}

            {activeDetailTab === 'alerts' && (
              <div className="p-8 text-center text-xs text-stone-400 italic">
                Aucune alerte ou rappel pro actif pour le moment.
              </div>
            )}

            {activeDetailTab === 'tasks' && (
              <div className="space-y-3">
                <h4 className="font-serif font-bold text-xs text-stone-900 pb-2 border-b border-stone-100 font-bold">Liste des jalons & tâches assignés</h4>
                <div className="space-y-2">
                  {empTasks.length === 0 ? (
                    <p className="text-stone-400 italic text-xs py-4 text-center">Aucune tâche assignée non terminée.</p>
                  ) : (
                    empTasks.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200/60">
                        <div className="space-y-0.5">
                          <span className="font-bold text-xs text-stone-900">{t.title}</span>
                          <p className="text-[10px] text-stone-400">Échéance : {t.date} à {t.time}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${
                          t.priority === 'high' ? 'bg-rose-50 text-rose-700' : t.priority === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {t.priority}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* List Header Banner */}
      <div className="bg-gradient-to-r from-[#2A7B76] to-emerald-800 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-200" />
            <h2 className="font-serif font-bold text-xl">Gestion des Collaborateurs & Effectifs</h2>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsAuditHistoryModalOpen(true)}
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Historique des opérations administratives sur les comptes"
          >
            <History className="h-4 w-4 text-amber-300" />
            <span>Audit Comptes ({auditOpsList.length})</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="h-4 w-4 text-emerald-200" />
            Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="h-4 w-4 text-rose-300" />
            PDF
          </button>
          <button
            onClick={handleOpenAdd}
            className="bg-[#D4A82F] hover:bg-[#c39b28] text-stone-950 px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 shadow-md transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Créer un collaborateur
          </button>
        </div>
      </div>

      {/* Modern Table Search & Select Controls (Role, Statut, Équipe, Responsable) */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email, tél..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {/* Équipe filter */}
          <select
            value={teamFilter}
            onChange={(e) => { setTeamFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-medium focus:ring-2 focus:ring-[#2A7B76] outline-none cursor-pointer"
          >
            <option value="all">Toutes les équipes</option>
            <option value="Équipe IT & Développement">Équipe IT & Développement</option>
            <option value="Équipe Commerciale & Partenariats">Équipe Commerciale & Partenariats</option>
            <option value="Équipe RH, Paie & Administration">Équipe RH, Paie & Admin</option>
            <option value="Équipe Finance & Comptabilité">Équipe Finance</option>
            <option value="Équipe Support & Opérations">Équipe Support</option>
          </select>

          {/* Manager filter */}
          <select
            value={managerFilter}
            onChange={(e) => { setManagerFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-medium focus:ring-2 focus:ring-[#2A7B76] outline-none cursor-pointer"
          >
            <option value="all">Tous les responsables</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>Resp: {emp.name}</option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-medium focus:ring-2 focus:ring-[#2A7B76] outline-none cursor-pointer"
          >
            <option value="all">Tous les rôles</option>
            <option value="employé">Employé</option>
            <option value="gestionnaire de projet">Gestionnaire de Projet</option>
            <option value="stagiaire">Stagiaire</option>
            <option value="informaticien">Informaticien</option>
            <option value="comptable">Comptable</option>
            <option value="rh">RH</option>
            <option value="finance">Finance</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-medium focus:ring-2 focus:ring-[#2A7B76] outline-none cursor-pointer"
          >
            <option value="all">Tous les statuts</option>
            <option value="en_poste">En poste</option>
            <option value="en_conge">En congés</option>
            <option value="maladie">Maladie</option>
            <option value="suspendu">Suspendu</option>
            <option value="parti">Départ</option>
            <option value="renvoye">Renvoyé</option>
          </select>
        </div>
      </div>

      {/* Image 2 Style Table Layout with Équipe & Responsable Column */}
      <div id="collaborators-table-container" className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200/80 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Collaborateur</th>
                <th className="p-4">Équipe & Responsable</th>
                <th className="p-4">Rôle & Département</th>
                <th className="p-4">Statut RH</th>
                <th className="p-4">Rémunération</th>
                <th className="p-4">Prise de Poste</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-stone-400 font-medium italic">
                    Aucun collaborateur ne correspond à ces critères.
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((emp) => {
                  const managerObj = employees.find((m) => m.id === emp.managerId);
                  return (
                    <tr key={emp.id} className="hover:bg-stone-50/50 transition">
                      {/* Collaborateur Info */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-2xs border ${getEmployeeSoftColor(emp.name)}`}>
                            {emp.avatarUrl ? (
                              <img src={emp.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span>{emp.name.slice(0, 2).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="block font-bold text-xs text-stone-900 truncate">{emp.name}</span>
                            <span className="block text-[10px] text-stone-400 truncate">{emp.email || 'Non renseigné'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Équipe & Responsable */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[10px] border border-purple-100">
                            {emp.team || 'Équipe IT & Développement'}
                          </span>
                          <span className="block text-[10px] text-stone-500 font-medium">
                            👔 Resp : {managerObj ? managerObj.name : 'Direction Générale'}
                          </span>
                        </div>
                      </td>

                      {/* Role & Dept */}
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <span className="inline-block text-[9px] font-bold uppercase tracking-wide bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                          {emp.roleType || 'Employé'}
                        </span>
                        <span className="block text-[10px] text-stone-400">{emp.department || 'Citrine Management'}</span>
                      </div>
                    </td>

                    {/* Quick RH Status Switcher */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-block text-[9px] font-bold uppercase px-2.5 py-1 rounded-lg border ${
                          STATUS_MAP[getEmployeeStatusKey(emp)]?.color
                        }`}>
                          {STATUS_MAP[getEmployeeStatusKey(emp)]?.label}
                        </span>
                        
                        <select
                          value={getEmployeeStatusKey(emp)}
                          onChange={(e) => handleStatusChangeQuick(emp.id, e.target.value as EmployeeStatus)}
                          className="px-1.5 py-1 rounded-md border border-stone-200 bg-stone-50 text-[10px] outline-none cursor-pointer focus:ring-1 focus:ring-[#2A7B76]"
                        >
                          <option value="en_poste">En poste</option>
                          <option value="en_conge">En congés</option>
                          <option value="maladie">Maladie</option>
                          <option value="suspendu">Suspendu</option>
                          <option value="parti">Départ</option>
                          <option value="renvoye">Renvoyé</option>
                        </select>
                      </div>
                    </td>

                    {/* Salary */}
                    <td className="p-4">
                      <span className="font-bold text-stone-900 font-mono">{formatXAF(emp.salary || 0)}</span>
                    </td>

                    {/* Hire Date */}
                    <td className="p-4">
                      <span className="text-stone-500 font-mono font-medium">{emp.hireDate || '2026-01-01'}</span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelectedEmployeeId(emp.id);
                            setViewMode('detail');
                          }}
                          className="p-1.5 text-stone-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition cursor-pointer"
                          title="Fiche individuelle"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="p-1.5 text-stone-400 hover:text-[#2A7B76] hover:bg-emerald-50 rounded-xl transition cursor-pointer"
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination controls - Clean, simplified premium design */}
        <div className="p-4 bg-stone-50 border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-stone-500 text-[11px] font-medium">
            Affichage des lignes <b>{startIndex + 1} à {Math.min(startIndex + itemsPerPage, totalItems)}</b> sur <b>{totalItems}</b>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 transition cursor-pointer text-[11px] font-bold"
            >
              Précédent
            </button>
            <span className="px-3 py-1.5 bg-[#2A7B76]/10 text-[#2A7B76] rounded-lg font-bold text-[11px] border border-[#2A7B76]/20 font-mono">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 transition cursor-pointer text-[11px] font-bold"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal exactly as in Image 1 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Pencil className="h-4 w-4 text-[#2A7B76]" />
                <h3 className="font-serif font-bold text-base text-stone-900">
                  {editingEmployee ? 'Modifier la Fiche Collaborateur' : 'Créer une Fiche Collaborateur'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-stone-400 hover:bg-stone-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-[10px] uppercase font-bold text-stone-600">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-stone-500">Nom complet *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2A7B76] outline-none text-stone-800 text-xs font-medium uppercase"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-stone-500">Nature du Rôle / Métier *</label>
                  <select
                    value={formData.roleType}
                    onChange={(e) => setFormData({ ...formData, roleType: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2A7B76] outline-none text-stone-800 text-xs font-semibold"
                  >
                    <option value="employé">Employé</option>
                    <option value="gestionnaire de projet">Gestionnaire de Projet</option>
                    <option value="stagiaire">Stagiaire</option>
                    <option value="informaticien">Informaticien / IT</option>
                    <option value="comptable">Comptable</option>
                    <option value="rh">RH</option>
                    <option value="finance">Finance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-stone-500">🏢 Département d'affectation *</label>
                  <input
                    type="text"
                    list="departments-suggested"
                    required
                    placeholder="Ex: Informatique & IT, RH & Paie..."
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2A7B76] outline-none text-stone-800 text-xs font-semibold"
                  />
                  <datalist id="departments-suggested">
                    <option value="Informatique & IT" />
                    <option value="Ressources Humaines" />
                    <option value="Finance & Comptabilité" />
                    <option value="Opérations & Logistique" />
                    <option value="Commercial & Partenariats" />
                    <option value="Direction Générale & Stratégie" />
                    <option value="Sécurité & HSE" />
                  </datalist>
                </div>

                <div>
                  <label className="block mb-1.5 text-stone-500">👥 Équipe de Rattachement</label>
                  <input
                    type="text"
                    list="teams-suggested"
                    placeholder="Ex: Équipe IT & Développement..."
                    value={formData.team}
                    onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2A7B76] outline-none text-stone-800 text-xs font-semibold"
                  />
                  <datalist id="teams-suggested">
                    <option value="Équipe IT & Développement" />
                    <option value="Équipe Commerciale & Partenariats" />
                    <option value="Équipe RH, Paie & Administration" />
                    <option value="Équipe Finance & Comptabilité" />
                    <option value="Équipe Support & Opérations" />
                    <option value="Équipe Direction Générale" />
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-stone-500">👔 Responsable Hiérarchique Direct</label>
                  <select
                    value={formData.managerId}
                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2A7B76] outline-none text-stone-800 text-xs font-semibold"
                  >
                    <option value="">-- Aucun / Direction Générale --</option>
                    {employees
                      .filter((e) => !editingEmployee || e.id !== editingEmployee.id)
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name} ({e.roleType || 'Collaborateur'})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1.5 text-stone-500">Statut Actuel *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2A7B76] outline-none text-stone-800 text-xs font-semibold"
                  >
                    <option value="en_poste">En poste (Actif)</option>
                    <option value="en_conge">En congés</option>
                    <option value="maladie">Maladie</option>
                    <option value="suspendu">Suspendu</option>
                    <option value="parti">Départ</option>
                    <option value="renvoye">Renvoyé</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-stone-500">Adresse E-mail</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2A7B76] outline-none text-stone-800 text-xs font-medium lowercase"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-stone-500">Téléphone (WhatsApp)</label>
                  <input
                    type="text"
                    placeholder="+237 655500443"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2A7B76] outline-none text-stone-800 text-xs font-mono font-medium"
                  />
                </div>
              </div>

              {(formData.status === 'renvoye' || formData.status === 'suspendu') && (
                <div className="animate-in slide-in-from-top duration-300 space-y-2 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                  <label className="block text-stone-700 text-xs font-bold">
                    {formData.status === 'renvoye' ? 'Motif de Renvoi RH *' : 'Motif de Suspension RH *'}
                  </label>
                  <select
                    value={
                      formData.status === 'renvoye'
                        ? formData.departureReason || ''
                        : formData.suspensionReason || ''
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (formData.status === 'renvoye') {
                        setFormData({ ...formData, departureReason: val });
                      } else {
                        setFormData({ ...formData, suspensionReason: val });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-800 text-xs font-semibold focus:ring-2 focus:ring-[#2A7B76] outline-none"
                  >
                    <option value="">-- Sélectionner un motif réglementaire --</option>
                    {disciplinaryReasonsService
                      .getActiveReasons(formData.status === 'renvoye' ? 'renvoi' : 'suspension')
                      .map((r) => (
                        <option key={r.id} value={r.label}>
                          {r.label}
                        </option>
                      ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Ou saisissez un motif personnalisé ici..."
                    value={
                      formData.status === 'renvoye'
                        ? formData.departureReason || ''
                        : formData.suspensionReason || ''
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (formData.status === 'renvoye') {
                        setFormData({ ...formData, departureReason: val });
                      } else {
                        setFormData({ ...formData, suspensionReason: val });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-800 text-xs font-medium focus:ring-2 focus:ring-[#2A7B76] outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-stone-500">Date d'arrivée</label>
                  <input
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2A7B76] outline-none text-stone-800 text-xs font-mono font-medium"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-stone-500">Date d'anniversaire</label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2A7B76] outline-none text-stone-800 text-xs font-mono font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-stone-500">Salaire Mensuel Brut (XAF)</label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2A7B76] outline-none text-stone-800 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Compte Utilisateur Associé & Rôle Système (Création et Modification) */}
              {!editingEmployee ? (
                <div className="bg-emerald-50/60 border border-[#2A7B76]/30 rounded-2xl p-4 space-y-3 normal-case">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-[#2A7B76]" />
                    <h4 className="font-serif font-bold text-xs text-stone-900">
                      Création obligatoire du Compte Utilisateur & Rôle Système
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                        Mot de passe initial de connexion *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={formData.userPassword}
                          onChange={(e) => setFormData({ ...formData, userPassword: e.target.value })}
                          placeholder="Ex: Collab@2026"
                          className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-mono font-bold text-stone-800 focus:ring-2 focus:ring-[#2A7B76] outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const randomPw = `Collab@${Math.floor(1000 + Math.random() * 9000)}`;
                            setFormData({ ...formData, userPassword: randomPw });
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#2A7B76] font-bold hover:underline"
                        >
                          Générer
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                        Rôle & Niveau d'Accès (Role ID) *
                      </label>
                      <select
                        value={formData.userRole}
                        onChange={(e) => {
                          const r = e.target.value as UserRole;
                          const rId = r === 'administrateur' ? 1 : r === 'responsable' ? 2 : 3;
                          setFormData({ ...formData, userRole: r, roleId: rId, roleType: r });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-bold text-stone-800 focus:ring-2 focus:ring-[#2A7B76] outline-none"
                      >
                        <option value="employé">Employé — Role ID 3 (Portail & Badgeage)</option>
                        <option value="responsable">Responsable — Role ID 2 (Gestion & Validation)</option>
                        <option value="administrateur">Administrateur — Role ID 1 (Contrôle total)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2 text-[11px] text-stone-600 bg-white/80 p-2.5 rounded-xl border border-stone-200/80 flex items-center justify-between gap-2">
                      <span>
                        💡 <strong>Liaison automatique :</strong> Le compte utilisateur (email: <strong>{formData.email || 'auto'}</strong>) sera créé avec <strong>User ID (UUID)</strong> et <strong>Role ID ({formData.userRole === 'administrateur' ? 1 : formData.userRole === 'responsable' ? 2 : 3})</strong> immédiatement rattachés à la fiche collaborateur.
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3 normal-case">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-[#2A7B76]" />
                      <h4 className="font-serif font-bold text-xs text-stone-900">
                        Compte Utilisateur Associé & Rôle Système (User ID & Role ID)
                      </h4>
                    </div>
                    {formData.userId ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        <Check className="h-3 w-3" /> Compte Lié
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                        <AlertCircle className="h-3 w-3" /> Non Lié
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                        Identifiant Utilisateur (User ID)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={formData.userId}
                          onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                          placeholder="Ex: 82b0325a-... ou ID compte"
                          className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-mono font-medium text-stone-800 focus:ring-2 focus:ring-[#2A7B76] outline-none truncate"
                        />
                        {users && users.length > 0 && (
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                const matched = users.find(u => u.id === e.target.value || u.uid === e.target.value);
                                if (matched) {
                                  const rId = matched.roleId || (matched.role === 'administrateur' ? 1 : matched.role === 'responsable' ? 2 : 3);
                                  setFormData({
                                    ...formData,
                                    userId: matched.id,
                                    roleId: rId,
                                    userRole: matched.role || 'employé',
                                    email: formData.email || matched.email,
                                  });
                                }
                              }
                            }}
                            className="px-2 py-2 rounded-xl border border-stone-200 bg-white text-[10px] text-stone-600 cursor-pointer"
                            title="Choisir parmi les comptes existants"
                          >
                            <option value="">Lier...</option>
                            {users.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name} ({u.email})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                        Rôle & Niveau d'Accès (Role ID) *
                      </label>
                      <select
                        value={formData.roleId}
                        onChange={(e) => {
                          const rId = Number(e.target.value);
                          const r: UserRole = rId === 1 ? 'administrateur' : rId === 2 ? 'responsable' : 'employé';
                          setFormData({ ...formData, roleId: rId, userRole: r, roleType: r });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-bold text-stone-800 focus:ring-2 focus:ring-[#2A7B76] outline-none"
                      >
                        <option value={3}>3 — Employé (Espace Personnel & Pointage)</option>
                        <option value={2}>2 — Responsable (Génération QR 30s & Validation)</option>
                        <option value={1}>1 — Administrateur (Accès et Contrôle Total)</option>
                      </select>
                    </div>

                    {!formData.userId && (
                      <div className="sm:col-span-2 flex items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                        <span className="text-[11px] text-amber-800">
                          Ce collaborateur n'a pas encore de compte utilisateur lié. Vous pouvez en générer un immédiatement.
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newUid = generateUuidV4();
                            const rId = formData.roleId ? Number(formData.roleId) : 3;
                            const r: UserRole = rId === 1 ? 'administrateur' : rId === 2 ? 'responsable' : 'employé';
                            setFormData({
                              ...formData,
                              userId: newUid,
                              roleId: rId,
                              userRole: r,
                            });
                          }}
                          className="px-3 py-1.5 bg-[#2A7B76] text-white rounded-lg text-xs font-bold whitespace-nowrap hover:bg-[#23635f] transition cursor-pointer"
                        >
                          Auto-Générer User ID
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Photo Input conforming to Image 1 & User preference (Avatar rigolos ou Vraie photo < 350 Ko) */}
              <div className="border border-stone-200/80 p-4 rounded-2xl bg-stone-50 flex items-center justify-between gap-4">
                <div>
                  <label className="block text-[10px] text-stone-500 mb-0.5">Photo de profil du collaborateur</label>
                  <span className="text-[9px] text-stone-400 font-medium normal-case">
                    Avatars stylés OU Vraie photo compressée (&lt; 350 Ko)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-stone-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-stone-500 text-xs border border-stone-300 shadow-2xs">
                    {formData.avatarUrl ? (
                      <img src={formData.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>IMG</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAvatarPickerOpen(true)}
                    className="px-3.5 py-2 border border-[#2A7B76]/30 hover:bg-[#2A7B76]/10 text-[#2A7B76] bg-white text-[11px] font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer normal-case shadow-2xs"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#2A7B76]" />
                    <span>Choisir photo / avatar</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100 normal-case">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2A7B76] text-white hover:bg-[#20635F] font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  Enregistrer les Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal pour choisir un avatar rigolo OU téléverser une vraie photo < 350 Ko */}
      <CollaboratorAvatarPickerModal
        isOpen={isAvatarPickerOpen}
        onClose={() => setIsAvatarPickerOpen(false)}
        currentAvatarUrl={formData.avatarUrl}
        collaboratorName={formData.name}
        onSelectAvatar={(url) => setFormData({ ...formData, avatarUrl: url })}
        showToast={showToast}
      />

      {/* Modal de sélection de motif RH lors d'un renvoi ou d'une suspension rapide */}
      <CollaboratorStatusReasonModal
        isOpen={Boolean(statusReasonModalTarget)}
        onClose={() => setStatusReasonModalTarget(null)}
        employee={statusReasonModalTarget?.emp || null}
        targetStatus={statusReasonModalTarget?.targetStatus || 'renvoye'}
        onConfirm={handleConfirmStatusReason}
        showToast={showToast}
      />

      {/* Modal Historique des Opérations Administratives liées aux Comptes */}
      {isAuditHistoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-4xl max-h-[85vh] overflow-y-auto shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900">
                    Historique des Opérations Administratives sur les Comptes
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Traçabilité de toutes les créations, rattachements hiérarchiques, affectations d'équipe et modifications de statut.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAuditHistoryModalOpen(false)}
                className="p-1 rounded-xl text-stone-400 hover:bg-stone-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="overflow-x-auto rounded-2xl border border-stone-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 text-[10px] uppercase font-bold border-b border-stone-200">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Auteur</th>
                      <th className="py-2.5 px-3">Collaborateur Cible</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Détails de l'Opération</th>
                      <th className="py-2.5 px-3 text-right">IP / Emplacement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium">
                    {auditOpsList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-stone-400 text-xs">
                          Aucun journal d'opération administrative consigné.
                        </td>
                      </tr>
                    ) : (
                      auditOpsList.map((op) => (
                        <tr key={op.id} className="hover:bg-stone-50/70">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-stone-600 whitespace-nowrap">
                            {new Date(op.timestamp).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-stone-900 whitespace-nowrap">
                            {op.authorName}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-stone-800 whitespace-nowrap">
                            {op.targetName}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              {op.operationLabel}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-stone-600 text-[11px]">
                            {op.details}
                          </td>
                          <td className="py-2.5 px-3 text-right text-stone-400 font-mono text-[10px] whitespace-nowrap">
                            {op.ipAddress || 'Douala, CM'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-stone-100">
              <button
                onClick={() => setIsAuditHistoryModalOpen(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {rhReportModal && (
        <RhReportModal
          isOpen={Boolean(rhReportModal)}
          report={rhReportModal}
          selectedMonth={rhReportMonth}
          onMonthChange={(m) => {
            setRhReportMonth(m);
            const targetEmp = employees.find((e) => e.id === rhReportModal.employee.id) || rhReportModal.employee;
            handleGenerateEmpMonthlyReport(targetEmp, m);
          }}
          onClose={() => setRhReportModal(null)}
        />
      )}
    </div>
  );
}
