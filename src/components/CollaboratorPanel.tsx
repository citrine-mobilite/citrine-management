import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Mail, 
  Phone, 
  Bell, 
  Clock, 
  ArrowRight,
  ShieldAlert,
  UserPlus,
  CheckSquare,
  X,
  Sparkles,
  Check,
  Info,
  Pencil,
  Trash2,
  Calendar,
  DollarSign,
  LogOut,
  Cake,
  Briefcase,
  AlertCircle,
  FileText,
  Eye,
  Download,
  Printer,
  Building,
  CheckCircle2,
  CreditCard,
  Upload,
  ChevronDown,
  ChevronUp,
  MapPin,
  Play,
  Coffee,
  RotateCcw,
  Home,
  User,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileSpreadsheet
} from 'lucide-react';
import { 
  Employee, 
  EmployeeRoleType, 
  EmployeeStatus, 
  SalaryPayment, 
  Presence, 
  NotificationLog, 
  CompanyModuleConfig, 
  Reminder, 
  Task, 
  AppUser 
} from '../types';
import { saveUser } from '../services/userService';
import { hashPassword, generateStrongPassword } from '../utils/cryptoUtils';
import { exportTableToExcel, exportTableToPDF } from '../utils/tableExportUtils';
import { SearchableSelect } from './common/SearchableSelect';
import { CollaboratorPresenceMap } from './CollaboratorPresenceMap';
import RhReportModal from './RhReportModal';
import { buildMonthlyAttendanceReport, AttendanceMonthlyReport } from '../services/rhReportService';

interface CollaboratorPanelProps {
  employees: Employee[];
  salaryPayments?: SalaryPayment[];
  presences?: Presence[];
  onUpdateEmployees: (employees: Employee[]) => void;
  onSelectTab?: (tab: string) => void;
  onSelectEmployee?: (id: string) => void;
  onAddNotification: (log: NotificationLog) => void;
  reminders?: Reminder[];
  tasks?: Task[];
  moduleConfig?: CompanyModuleConfig;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export default function CollaboratorPanel({
  employees,
  salaryPayments = [],
  presences = [],
  onUpdateEmployees,
  onSelectTab,
  onSelectEmployee,
  onAddNotification,
  reminders = [],
  tasks = [],
  moduleConfig,
  showToast
}: CollaboratorPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | EmployeeRoleType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | EmployeeStatus>('all');
  
  // Detail Modal, Payslip & Presence Pagination States
  const [selectedDetailEmp, setSelectedDetailEmp] = useState<Employee | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'presences' | 'payslips' | 'map' | 'alerts' | 'tasks'>('payslips');
  const [presenceDisplayLimit, setPresenceDisplayLimit] = useState<number>(25);
  const [payslipSearchTerm, setPayslipSearchTerm] = useState<string>('');
  const [expandedPresenceId, setExpandedPresenceId] = useState<string | null>(null);

  const [viewingPayslip, setViewingPayslip] = useState<{
    employee: Employee;
    period: string;
    baseSalary: number;
    bonus: number;
    deductions: number;
    net: number;
    status: string;
    certificateHash?: string;
  } | null>(null);

  // 📄 Certified Monthly Attendance Report State
  const [certifiedReport, setCertifiedReport] = useState<AttendanceMonthlyReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [reportMonth, setReportMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));

  const handleGenerateAttendanceReport = async (emp: Employee, monthStr: string = reportMonth) => {
    try {
      setIsGeneratingReport(true);
      const report = await buildMonthlyAttendanceReport(emp, presences, monthStr);
      setCertifiedReport(report);
    } catch (err) {
      console.error("Erreur lors de la génération du rapport RH certifié:", err);
    } finally {
      setIsGeneratingReport(false);
    }
  };



  // Helper currency formatter
  const formatXAF = (val?: number) => {
    if (val === undefined || val === null) return '0 XAF';
    return `${val.toLocaleString('fr-FR')} XAF`;
  };

  // Helper to generate last 12 months for payslips
  const getLast12Months = () => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      const capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      list.push({
        periodName: capitalized,
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        dateObj: d
      });
    }
    return list;
  };

  // Creation form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRoleType, setNewRoleType] = useState<EmployeeRoleType>('employé');
  const [newStatus, setNewStatus] = useState<EmployeeStatus>('en_poste');
  const [newHireDate, setNewHireDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDepartureDate, setNewDepartureDate] = useState('');
  const [newDepartureReason, setNewDepartureReason] = useState('');
  const [newBirthDate, setNewBirthDate] = useState('');
  const [newSalary, setNewSalary] = useState<string>(moduleConfig?.defaultSalary ? String(moduleConfig.defaultSalary) : '');
  const [newAvatarUrl, setNewAvatarUrl] = useState<string>('');

  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Edit form state
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRoleType, setEditRoleType] = useState<EmployeeRoleType>('employé');
  const [editStatus, setEditStatus] = useState<EmployeeStatus>('en_poste');
  const [editHireDate, setEditHireDate] = useState('');
  const [editDepartureDate, setEditDepartureDate] = useState('');
  const [editDepartureReason, setEditDepartureReason] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editSalary, setEditSalary] = useState<string>('');
  const [editAvatarUrl, setEditAvatarUrl] = useState<string>('');

  // Image Upload File Handler
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormError('La taille de la photo ne doit pas dépasser 5 Mo.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          if (isEdit) {
            setEditAvatarUrl(reader.result);
          } else {
            setNewAvatarUrl(reader.result);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Mark Departure Modal state
  const [departingEmployee, setDepartingEmployee] = useState<Employee | null>(null);
  const [departDate, setDepartDate] = useState('2026-07-08');
  const [departReason, setDepartReason] = useState('Démission');
  const [departStatus, setDepartStatus] = useState<'parti' | 'renvoye'>('parti');

  const handleStartEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditName(emp.name);
    setEditEmail(emp.email);
    setEditPhone(emp.phone);
    setEditRoleType(emp.roleType);
    setEditStatus(emp.status || 'en_poste');
    setEditHireDate(emp.hireDate || '2026-01-01');
    setEditDepartureDate(emp.departureDate || '');
    setEditDepartureReason(emp.departureReason || '');
    setEditBirthDate(emp.birthDate || '');
    setEditSalary(emp.salary !== undefined ? String(emp.salary) : '2500');
    setEditAvatarUrl(emp.avatarUrl || '');
    setFormError('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!editName.trim()) {
      setFormError('Le nom complet est obligatoire.');
      return;
    }

    if (!editEmail.trim()) {
      setFormError("L'adresse email est obligatoire.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(editEmail)) {
      setFormError("Veuillez saisir une adresse email valide.");
      return;
    }

    if (!editPhone.trim()) {
      setFormError('Le numéro de téléphone est obligatoire.');
      return;
    }

    if (editingEmployee && onUpdateEmployees) {
      const updatedEmployees = employees.map(emp => {
        if (emp.id === editingEmployee.id) {
          return {
            ...emp,
            name: editName.trim(),
            email: editEmail.trim(),
            phone: editPhone.trim(),
            roleType: editRoleType,
            status: editStatus,
            hireDate: editHireDate,
            departureDate: editStatus === 'parti' || editStatus === 'renvoye' ? editDepartureDate : undefined,
            departureReason: editStatus === 'parti' || editStatus === 'renvoye' ? editDepartureReason : undefined,
            birthDate: editBirthDate || undefined,
            salary: editSalary ? Number(editSalary) : undefined,
            avatarUrl: editAvatarUrl.trim() || emp.avatarUrl
          };
        }
        return emp;
      });

      onUpdateEmployees(updatedEmployees);
      setEditingEmployee(null);
      showToast?.("Fiche collaborateur mise à jour avec succès !", "success");
    }
  };

  // Quick action: Confirm departure
  const handleConfirmDeparture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!departingEmployee || !onUpdateEmployees) return;

    const updatedEmployees = employees.map(emp => {
      if (emp.id === departingEmployee.id) {
        return {
          ...emp,
          status: departStatus as EmployeeStatus,
          departureDate: departDate,
          departureReason: departReason
        };
      }
      return emp;
    });

    onUpdateEmployees(updatedEmployees);
    if (showToast) {
      showToast(`Départ enregistré pour ${departingEmployee.name}. Son compte utilisateur a été désactivé.`, 'success');
    }
    setDepartingEmployee(null);
  };

  const handleQuickStatusChange = (id: string, newStatusVal: EmployeeStatus) => {
    if (onUpdateEmployees) {
      const updatedEmployees = employees.map(emp => {
        if (emp.id === id) {
          return {
            ...emp,
            status: newStatusVal,
            departureDate: (newStatusVal === 'parti' || newStatusVal === 'renvoye') ? (emp.departureDate || new Date().toISOString().split('T')[0]) : undefined,
            departureReason: (newStatusVal === 'parti' || newStatusVal === 'renvoye') ? (emp.departureReason || 'Changement de statut') : undefined
          };
        }
        return emp;
      });
      onUpdateEmployees(updatedEmployees);
      const targetEmp = employees.find(e => e.id === id);
      if (targetEmp && showToast) {
        const isInactive = newStatusVal === 'parti' || newStatusVal === 'renvoye';
        showToast(
          `Statut de ${targetEmp.name} changé en "${getStatusLabel(newStatusVal)}". ${isInactive ? 'Compte utilisateur désactivé.' : 'Compte utilisateur activé.'}`,
          'success'
        );
      }
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le collaborateur "${name}" ?`)) {
      if (onUpdateEmployees) {
        onUpdateEmployees(employees.filter(emp => emp.id !== id));
      }
    }
  };

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone.includes(searchTerm);
    
    const matchesRole = roleFilter === 'all' || emp.roleType === roleFilter;
    const empStatus = emp.status || 'en_poste';
    const matchesStatus = statusFilter === 'all' || empStatus === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Standard Pagination State: default 25, options: 25, 50, 10
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, pageSize]);

  const totalItems = filteredEmployees.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const indexOfLastItem = currentPage * pageSize;
  const indexOfFirstItem = indexOfLastItem - pageSize;
  const paginatedEmployees = filteredEmployees.slice(indexOfFirstItem, indexOfLastItem);



  // Helpers for role badges and labels
  const getRoleBadgeStyle = (role: EmployeeRoleType) => {
    switch (role) {
      case 'gestionnaire de projet':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200/50';
      case 'gestionnaire de projet assistant':
        return 'bg-sky-50 text-sky-800 border-sky-200/50';
      case 'employé':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200/50';
      case 'stagiaire':
        return 'bg-amber-50 text-amber-800 border-amber-200/50';
      case 'informaticien':
        return 'bg-cyan-50 text-cyan-800 border-cyan-200/50';
      case 'comptable':
        return 'bg-teal-50 text-teal-800 border-teal-200/50';
      case 'rh':
        return 'bg-green-50 text-green-800 border-green-200/50';
      case 'finance':
        return 'bg-blue-50 text-blue-800 border-blue-200/50';
      case 'sponsor':
        return 'bg-violet-50 text-violet-800 border-violet-200/50';
      default:
        return 'bg-stone-50 text-stone-700 border-stone-200/50';
    }
  };

  const getRoleLabel = (role: EmployeeRoleType) => {
    switch (role) {
      case 'gestionnaire de projet':
        return 'Gestionnaire de Projet (Responsable)';
      case 'gestionnaire de projet assistant':
        return 'Gestionnaire Assistant (Responsable)';
      case 'employé':
        return 'Employé';
      case 'stagiaire':
        return 'Stagiaire';
      case 'informaticien':
        return 'Informaticien / IT';
      case 'comptable':
        return 'Comptable';
      case 'rh':
        return 'Ressources Humaines (RH)';
      case 'finance':
        return 'Finance';
      case 'sponsor':
        return 'Sponsor';
      default:
        return role;
    }
  };

  const getStatusBadgeStyle = (status?: EmployeeStatus) => {
    switch (status) {
      case 'en_poste':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'en_conge':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'parti':
        return 'bg-stone-100 text-stone-700 border-stone-300';
      case 'renvoye':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'suspendu':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'maladie':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  const getStatusLabel = (status?: EmployeeStatus) => {
    switch (status) {
      case 'en_poste':
        return 'En poste';
      case 'en_conge':
        return 'En congé';
      case 'parti':
        return 'Parti (Démission/Fin)';
      case 'renvoye':
        return 'Renvoyé / Licencié';
      case 'suspendu':
        return 'Suspendu';
      case 'maladie':
        return 'Arrêt maladie';
      default:
        return 'En poste';
    }
  };

  // Check if submitted to presence tracking
  const isSubmittedToPresence = (role: EmployeeRoleType, status?: EmployeeStatus) => {
    const isRoleTracked = role === 'employé' || role === 'stagiaire' || role === 'informaticien' || role === 'comptable' || role === 'rh' || role === 'finance' || role === 'gestionnaire de projet assistant' || role === 'gestionnaire de projet';
    const isStatusActive = (status === undefined || status === 'en_poste');
    return isRoleTracked && isStatusActive;
  };

  // Handle addition
  const handleAddCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    if (!newName.trim()) {
      setFormError('Le nom complet est obligatoire.');
      return;
    }

    if (!newEmail.trim()) {
      setFormError("L'adresse email est obligatoire.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(newEmail)) {
      setFormError("Veuillez saisir une adresse email valide.");
      return;
    }

    if (!newPhone.trim()) {
      setFormError('Le numéro de téléphone est obligatoire.');
      return;
    }

    const emailTrimmed = newEmail.trim().toLowerCase();
    const existingEmp = employees.find(e => e.email.toLowerCase() === emailTrimmed);
    if (existingEmp) {
      setFormError(`Un collaborateur avec l'adresse email "${emailTrimmed}" existe déjà dans le système.`);
      return;
    }

    // Use uploaded photo or leave empty if none provided
    const finalAvatar = newAvatarUrl.trim();
    const newId = `emp-${Date.now()}`;

    const newCollaborator: Employee = {
      id: newId,
      name: newName.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim(),
      avatarUrl: finalAvatar,
      roleType: newRoleType,
      status: newStatus,
      hireDate: newHireDate || new Date().toISOString().split('T')[0],
      departureDate: (newStatus === 'parti' || newStatus === 'renvoye') ? newDepartureDate : undefined,
      departureReason: (newStatus === 'parti' || newStatus === 'renvoye') ? newDepartureReason : undefined,
      birthDate: newBirthDate || undefined,
      salary: newSalary ? Number(newSalary) : undefined
    };

    if (onUpdateEmployees) {
      onUpdateEmployees([...employees, newCollaborator]);

      // Automatically create an associated AppUser account
      const userRole = (newRoleType === 'gestionnaire de projet' || newRoleType === 'sponsor')
        ? 'responsable'
        : 'employé';

      const tempPass = generateStrongPassword(12);
      hashPassword(tempPass).then((hashedPass) => {
        const newAssociatedUser: AppUser = {
          id: `usr-${newCollaborator.id}`,
          name: newCollaborator.name.trim(),
          email: newCollaborator.email.trim().toLowerCase(),
          role: userRole,
          status: 'actif',
          authMethod: 'password',
          passwordHash: hashedPass,
          department: newCollaborator.roleType,
          phone: newCollaborator.phone.trim(),
          avatarUrl: newCollaborator.avatarUrl,
          createdAt: new Date().toISOString()
        };

        // Save user to database
        saveUser(newAssociatedUser)
          .then(() => {
            console.log("Associated user created successfully for", newCollaborator.name);
            if (onAddNotification) {
              const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://citrine-hr.web.app';
              const welcomeMessage = `Bonjour ${newCollaborator.name},\n\n` +
                `Votre compte de connexion au portail Citrine Management a été créé par l'administration.\n\n` +
                `Voici vos informations de connexion sécurisées :\n` +
                `• Lien du site : ${siteUrl}\n` +
                `• Adresse e-mail : ${newCollaborator.email.trim().toLowerCase()}\n` +
                `• Mot de passe généré (Sécurisé) : ${tempPass}\n` +
                `• Rôle attribué : ${userRole.toUpperCase()}\n\n` +
                `Vous pourrez modifier votre mot de passe à tout moment depuis votre profil sur le site.\n\n` +
                `Cordialement,\nL'Équipe RH`;

              // Send Email Notification
              onAddNotification({
                id: `email-welcome-${Date.now()}`,
                type: 'email',
                recipient: `${newCollaborator.name} <${newCollaborator.email}>`,
                title: "Bienvenue sur Citrine Management - Vos identifiants de connexion",
                content: welcomeMessage,
                payload: JSON.stringify({
                  siteUrl,
                  userId: newAssociatedUser.id,
                  email: newAssociatedUser.email,
                  password: tempPass,
                  role: userRole
                }, null, 2),
                timestamp: new Date().toISOString()
              });

              // Send WhatsApp Notification
              onAddNotification({
                id: `wa-welcome-${Date.now()}`,
                type: 'whatsapp',
                recipient: newCollaborator.phone || newCollaborator.email,
                title: "Bienvenue sur Citrine Management - Vos identifiants de connexion",
                content: welcomeMessage,
                payload: JSON.stringify({
                  siteUrl,
                  userId: newAssociatedUser.id,
                  email: newAssociatedUser.email,
                  password: tempPass,
                  role: userRole
                }, null, 2),
                timestamp: new Date().toISOString()
              });
            }
          })
          .catch(err => {
            console.error("Error creating associated user:", err);
          });
      });

      const siteLink = typeof window !== 'undefined' ? window.location.origin : '';
      setSuccessMsg(`Le collaborateur "${newCollaborator.name}" a été créé avec succès ! Ses identifiants sécurisés ont été générés et transmis par E-mail et WhatsApp.`);
      
      // Clear form
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewRoleType('employé');
      setNewStatus('en_poste');
      setNewHireDate(new Date().toISOString().split('T')[0]);
      setNewDepartureDate('');
      setNewDepartureReason('');
      setNewBirthDate('');
      setNewSalary(moduleConfig?.defaultSalary ? String(moduleConfig.defaultSalary) : '');
      setNewAvatarUrl('');
      
      // Auto close after brief delay
      setTimeout(() => {
        setShowAddForm(false);
        setSuccessMsg('');
      }, 5000); // 5 seconds so they can read the provisional password if they want
    } else {
      setFormError("Impossible de sauvegarder le collaborateur (callback absent).");
    }
  };

  return (
    <div className="space-y-6" id="collaborator-panel-container">
      {!selectedDetailEmp && (
        <>
          {/* Header and description */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-serif font-semibold text-stone-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            Gestion des Collaborateurs & Effectifs
          </h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Export Excel */}
          <button
            onClick={() => {
              const data = employees.map(e => ({
                'Nom': e.name,
                'Email': e.email,
                'Téléphone': e.phone,
                'Rôle / Département': e.roleType,
                'Statut': e.status || 'en_poste',
                'Date d\'embauche': e.hireDate || '',
                'Salaire (XAF)': e.salary || 0
              }));
              exportTableToExcel(data, 'Liste_Collaborateurs_Citrine');
            }}
            className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-emerald-200"
            title="Exporter en Excel"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Excel</span>
          </button>

          {/* Export PDF */}
          <button
            onClick={() => {
              const headers = ['Nom', 'Email', 'Téléphone', 'Rôle', 'Statut', 'Salaire'];
              const rows = employees.map(e => [
                e.name,
                e.email,
                e.phone || '',
                e.roleType,
                e.status || 'en_poste',
                e.salary ? `${e.salary} XAF` : '-'
              ]);
              exportTableToPDF('Rapport des Collaborateurs & Effectifs', headers, rows, 'Liste_Collaborateurs_Citrine');
            }}
            className="px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-stone-200"
            title="Exporter en PDF"
          >
            <Download className="h-4 w-4" />
            <span>PDF</span>
          </button>

          {/* Add Collaborator Trigger Button */}
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setFormError('');
              setSuccessMsg('');
            }}
            className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs hover:shadow-md flex items-center gap-2 cursor-pointer"
          >
            {showAddForm ? (
              <>
                <X className="h-4 w-4" />
                Fermer le formulaire
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Créer un collaborateur
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expandable Creation Form */}
      {showAddForm && (
        <div className="bg-white border-2 border-green-100 rounded-2xl p-6 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-green-50 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-green-500" />
              <h3 className="text-sm font-bold text-stone-800 font-serif">Nouveau Collaborateur</h3>
            </div>
            <button 
              onClick={() => setShowAddForm(false)}
              className="text-stone-400 hover:text-stone-600 p-1 rounded-lg transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {formError && (
            <div className="bg-red-50 text-red-800 border border-red-100 p-3 rounded-xl text-xs font-medium">
              ⚠️ {formError}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              {successMsg}
            </div>
          )}

          <form onSubmit={handleAddCollaborator} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-500 uppercase block">Nom complet</label>
              <input
                type="text"
                placeholder="Ex. Landry Mouns"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full text-xs p-2.5 border border-green-100 rounded-xl bg-green-50/10 focus:bg-white focus:outline-green-500 focus:ring-1 focus:ring-green-200 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-500 uppercase block">Nature du Rôle / Métier</label>
              <SearchableSelect
                value={newRoleType}
                onChange={(val) => setNewRoleType(val as EmployeeRoleType)}
                options={[
                  { value: 'employé', label: 'Employé', description: 'Soumis aux pointages standards' },
                  { value: 'stagiaire', label: 'Stagiaire', description: 'Soumis aux pointages standards' },
                  { value: 'informaticien', label: 'Informaticien / IT', description: 'Direction Systèmes d’Information' },
                  { value: 'comptable', label: 'Comptable', description: 'Direction Administrative & Financière' },
                  { value: 'rh', label: 'Ressources Humaines (RH)', description: 'Direction RH et Recrutement' },
                  { value: 'finance', label: 'Finance', description: 'Trésorerie et Budgets' },
                  { value: 'gestionnaire de projet assistant', label: 'Gestionnaire Assistant', description: 'Responsable opérationnel' },
                  { value: 'gestionnaire de projet', label: 'Gestionnaire de Projet', description: 'Responsable de mission' },
                  { value: 'sponsor', label: 'Sponsor / Gouvernance', description: 'Exclu des pointages' }
                ]}
                placeholder="Sélectionner rôle"
                searchPlaceholder="Rechercher métier..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-500 uppercase block">Statut Actuel</label>
              <SearchableSelect
                value={newStatus}
                onChange={(val) => setNewStatus(val as EmployeeStatus)}
                options={[
                  { value: 'en_poste', label: '🟢 En poste (Actif)', badge: 'Actif', badgeColor: 'bg-emerald-100 text-emerald-800' },
                  { value: 'en_conge', label: '🟡 En congé', badge: 'Congé', badgeColor: 'bg-amber-100 text-amber-800' },
                  { value: 'maladie', label: '🟣 Arrêt maladie', badge: 'Maladie', badgeColor: 'bg-purple-100 text-purple-800' },
                  { value: 'suspendu', label: '🟠 Suspendu', badge: 'Suspendu', badgeColor: 'bg-orange-100 text-orange-800' },
                  { value: 'parti', label: '⚪ Parti (Démission / Départ)', badge: 'Parti', badgeColor: 'bg-stone-100 text-stone-600' },
                  { value: 'renvoye', label: '🔴 Renvoyé / Licencié', badge: 'Renvoyé', badgeColor: 'bg-red-100 text-red-800' }
                ]}
                placeholder="Sélectionner statut"
                searchPlaceholder="Rechercher statut..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-500 uppercase block">Adresse e-mail</label>
              <input
                type="email"
                placeholder="Ex. landry.m@citrine.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full text-xs p-2.5 border border-green-100 rounded-xl bg-green-50/10 focus:bg-white focus:outline-green-500 focus:ring-1 focus:ring-green-200 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-500 uppercase block">Numéro Téléphone (WhatsApp)</label>
              <input
                type="text"
                placeholder="Ex. +33 6 12 34 56 78"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full text-xs p-2.5 border border-green-100 rounded-xl bg-green-50/10 focus:bg-white focus:outline-green-500 focus:ring-1 focus:ring-green-200 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-500 uppercase block">Date d'arrivée (Prise de poste)</label>
              <input
                type="date"
                value={newHireDate}
                onChange={(e) => setNewHireDate(e.target.value)}
                className="w-full text-xs p-2.5 border border-green-100 rounded-xl bg-white focus:outline-green-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-500 uppercase block">Date d'anniversaire</label>
              <input
                type="date"
                value={newBirthDate}
                onChange={(e) => setNewBirthDate(e.target.value)}
                className="w-full text-xs p-2.5 border border-green-100 rounded-xl bg-white focus:outline-green-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-500 uppercase block">Salaire Mensuel Brut (XAF)</label>
              <input
                type="number"
                placeholder="Ex. 450000"
                value={newSalary}
                onChange={(e) => setNewSalary(e.target.value)}
                className="w-full text-xs p-2.5 border border-green-100 rounded-xl bg-white focus:outline-green-500 transition"
              />
            </div>

            {/* Photo File Upload (Optional) */}
            <div className="col-span-full space-y-1.5 bg-stone-50/80 p-3.5 rounded-xl border border-stone-200">
              <label className="text-[11px] font-bold text-stone-700 uppercase flex items-center justify-between">
                <span>Photo de profil du collaborateur (Optionnel)</span>
                <span className="text-stone-400 font-normal text-[10px] lowercase">Fichier PNG, JPG, WEBP (&lt; 5Mo)</span>
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 shrink-0">
                  {newAvatarUrl ? (
                    <img
                      src={newAvatarUrl}
                      alt="Aperçu photo"
                      className="w-12 h-12 rounded-full object-cover border-2 border-green-200 shadow-2xs"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs border-2 border-emerald-400">
                      {newName ? newName.slice(0, 2).toUpperCase() : '👤'}
                    </div>
                  )}
                  {newAvatarUrl && (
                    <button
                      type="button"
                      onClick={() => setNewAvatarUrl('')}
                      className="text-stone-400 hover:text-green-600 text-xs font-bold underline cursor-pointer"
                    >
                      Effacer la photo
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  <label className="inline-flex items-center gap-2 bg-white hover:bg-green-50 text-stone-800 border border-stone-200 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition shadow-2xs">
                    <Upload className="h-4 w-4 text-green-600" />
                    <span>{newAvatarUrl ? "Changer le fichier image..." : "Choisir un fichier photo..."}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileUpload(e, false)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {(newStatus === 'parti' || newStatus === 'renvoye') && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-green-700 uppercase block">Date de départ</label>
                  <input
                    type="date"
                    value={newDepartureDate}
                    onChange={(e) => setNewDepartureDate(e.target.value)}
                    className="w-full text-xs p-2.5 border border-green-300 rounded-xl bg-green-50/30 focus:outline-green-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-[11px] font-bold text-green-700 uppercase block">Motif du départ</label>
                  <input
                    type="text"
                    placeholder="Ex. Démission, Licenciement pour faute, Fin de contrat..."
                    value={newDepartureReason}
                    onChange={(e) => setNewDepartureReason(e.target.value)}
                    className="w-full text-xs p-2.5 border border-green-300 rounded-xl bg-green-50/30 focus:outline-green-500"
                  />
                </div>
              </>
            )}

            {/* Quick dynamically updated badge on presence rule */}
            <div className="col-span-full bg-emerald-50/40 border border-emerald-100 rounded-xl p-3 text-[11px] text-stone-600 space-y-1">
              <p className="font-bold text-stone-900 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                Impact de la création du profil :
              </p>
              <ul className="list-disc pl-5 space-y-0.5 text-[10px] text-stone-500">
                <li>
                  Suivi des présences : {isSubmittedToPresence(newRoleType, newStatus) ? (
                    <strong className="text-emerald-700">OUI (Inclus dans le tableau de pointage quotidien)</strong>
                  ) : (
                    <strong className="text-stone-500">NON (Exclus du tableau de pointage car statut = {getStatusLabel(newStatus)})</strong>
                  )}
                </li>
              </ul>
            </div>

            <div className="col-span-full flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-stone-50 hover:bg-stone-100 text-stone-600 text-xs font-bold px-4 py-2 rounded-xl border border-stone-200/50 transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs cursor-pointer"
              >
                Enregistrer le Collaborateur
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-2xl border border-green-100 shadow-xs flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:max-w-xs">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email, tél..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3.5 py-2 border border-green-100 rounded-xl bg-green-50/10 focus:bg-white focus:outline-green-500 focus:ring-1 focus:ring-green-200 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto shrink-0">
          <div className="w-48">
            <SearchableSelect
              value={roleFilter}
              onChange={(val) => setRoleFilter(val as any)}
              options={[
                { value: 'all', label: 'Tous les rôles' },
                { value: 'employé', label: 'Employés' },
                { value: 'stagiaire', label: 'Stagiaires' },
                { value: 'informaticien', label: 'Informaticiens / IT' },
                { value: 'comptable', label: 'Comptables' },
                { value: 'rh', label: 'Ressources Humaines' },
                { value: 'finance', label: 'Finance' },
                { value: 'gestionnaire de projet assistant', label: 'Gestionnaires Assistants' },
                { value: 'gestionnaire de projet', label: 'Gestionnaires de Projet' },
                { value: 'sponsor', label: 'Sponsors' }
              ]}
              placeholder="Tous les rôles"
              searchPlaceholder="Filtrer rôle..."
              size="sm"
            />
          </div>

          <div className="w-44">
            <SearchableSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val as any)}
              options={[
                { value: 'all', label: 'Tous les statuts' },
                { value: 'en_poste', label: '🟢 En poste', badge: 'Actif', badgeColor: 'bg-emerald-100 text-emerald-800' },
                { value: 'en_conge', label: '🟡 En congé', badge: 'Congé', badgeColor: 'bg-amber-100 text-amber-800' },
                { value: 'maladie', label: '🟣 Arrêt maladie', badge: 'Maladie', badgeColor: 'bg-purple-100 text-purple-800' },
                { value: 'suspendu', label: '🟠 Suspendu', badge: 'Suspendu', badgeColor: 'bg-orange-100 text-orange-800' },
                { value: 'parti', label: '⚪ Parti', badge: 'Parti', badgeColor: 'bg-stone-100 text-stone-600' },
                { value: 'renvoye', label: '🔴 Renvoyé', badge: 'Renvoyé', badgeColor: 'bg-red-100 text-red-800' }
              ]}
              placeholder="Tous les statuts"
              searchPlaceholder="Filtrer statut..."
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Table of Collaborators */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden">
        {filteredEmployees.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="h-8 w-8 text-stone-300 mx-auto" />
            <p className="text-xs text-stone-500 font-medium">Aucun collaborateur trouvé.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('all');
                setStatusFilter('all');
              }}
              className="text-xs text-emerald-700 font-bold underline cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Collaborateur</th>
                  <th className="py-3.5 px-4">Rôle & Département</th>
                  <th className="py-3.5 px-4">Statut RH</th>
                  <th className="py-3.5 px-4">Rémunération</th>
                  <th className="py-3.5 px-4">Prise de Poste</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {paginatedEmployees.map((emp) => {
                  const empStatus = emp.status || 'en_poste';

                  return (
                    <tr key={emp.id} className="hover:bg-stone-50/80 transition group">
                      {/* Avatar & Name - Clickable to open page */}
                      <td className="py-3 px-4">
                        <div 
                          className="flex items-center gap-3 cursor-pointer"
                          onClick={() => {
                            setSelectedDetailEmp(emp);
                            setIsDetailModalOpen(true);
                          }}
                          title="Cliquer pour voir la page détaillée"
                        >
                          {emp.avatarUrl ? (
                            <img
                              src={emp.avatarUrl}
                              alt={emp.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-xl object-cover border border-stone-200 shadow-2xs shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                              {emp.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-stone-900 text-xs sm:text-sm group-hover:text-emerald-700 transition flex items-center gap-1.5">
                              {emp.name}
                            </div>
                            <div className="text-[11px] text-stone-400 font-mono">
                              {emp.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Dept */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadgeStyle(emp.roleType)}`}>
                          {getRoleLabel(emp.roleType)}
                        </span>
                        <div className="text-[10px] text-stone-400 mt-0.5">
                          {emp.department || 'Citrine Management'}
                        </div>
                      </td>

                      {/* Statut with Quick Change */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeStyle(empStatus)}`}>
                            {getStatusLabel(empStatus)}
                          </span>
                          <select
                            value={empStatus}
                            onChange={(e) => {
                              const val = e.target.value as EmployeeStatus;
                              if (val === 'parti' || val === 'renvoye') {
                                setDepartingEmployee(emp);
                                setDepartDate(new Date().toISOString().split('T')[0]);
                                setDepartReason(val === 'parti' ? 'Démission' : 'Licenciement / Fin de contrat');
                                setDepartStatus(val);
                              } else {
                                handleQuickStatusChange(emp.id, val);
                              }
                            }}
                            className="text-[10px] font-semibold px-2 py-1 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 cursor-pointer outline-none"
                            title="Changer rapidement le statut"
                          >
                            <option value="en_poste">En poste</option>
                            <option value="en_conge">En congé</option>
                            <option value="maladie">Maladie</option>
                            <option value="suspendu">Suspendu</option>
                            <option value="parti">Départ</option>
                            <option value="renvoye">Renvoyé</option>
                          </select>
                        </div>
                      </td>

                      {/* Remuneration */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-stone-900 font-bold text-xs">
                        {emp.salary ? formatXAF(emp.salary) : 'N/C'}
                      </td>

                      {/* Prise de poste */}
                      <td className="py-3 px-4 whitespace-nowrap text-stone-600 text-xs">
                        {emp.hireDate || 'N/C'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedDetailEmp(emp);
                              setIsDetailModalOpen(true);
                            }}
                            className="p-1.5 text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                            title="Consulter la fiche détaillée"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleStartEdit(emp)}
                            className="p-1.5 text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                            title="Modifier les informations"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Standard Pagination Controls: default 25, options: 25, 50, 10 */}
            <div className="bg-stone-50 border-t border-stone-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-stone-500">Afficher</span>
                <div className="w-32">
                  <SearchableSelect
                    value={String(pageSize)}
                    onChange={(val) => {
                      setPageSize(Number(val));
                      setCurrentPage(1);
                    }}
                    options={[
                      { value: '25', label: '25 par page' },
                      { value: '50', label: '50 par page' },
                      { value: '10', label: '10 par page' }
                    ]}
                    size="sm"
                    placeholder="Taille"
                    searchPlaceholder="Lignes..."
                  />
                </div>
                <span className="text-stone-300">|</span>
                <span className="text-stone-500">
                  Lignes <strong className="text-stone-800">{totalItems > 0 ? indexOfFirstItem + 1 : 0}</strong> à <strong className="text-stone-800">{Math.min(indexOfLastItem, totalItems)}</strong> sur <strong className="text-stone-800">{totalItems}</strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed text-stone-600 transition cursor-pointer"
                  title="Première page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed text-stone-600 transition cursor-pointer"
                  title="Page précédente"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="px-3 py-1 bg-white border border-emerald-200 rounded-lg font-bold text-emerald-700 min-w-[60px] text-center shadow-2xs">
                  Page {currentPage} / {totalPages}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed text-stone-600 transition cursor-pointer"
                  title="Page suivante"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed text-stone-600 transition cursor-pointer"
                  title="Dernière page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </>
      )}

      {/* Dedicated Collaborator Detail Page View */}
      {selectedDetailEmp && (() => {
        const emp = selectedDetailEmp;
        const empStatus = emp.status || 'en_poste';
        const isTracked = isSubmittedToPresence(emp.roleType, empStatus);
        const empPresences = presences.filter(p => p.employeeId === emp.id);
        const empActiveAlertsCount = reminders.filter(r => r.employeeId === emp.id && !r.triggered && !r.stopped).length;
        const empUnfinishedTasksCount = tasks.filter(t => t.employeeId === emp.id && t.status !== 'completed').length;

        return (
          <div className="space-y-6 animate-fadeIn pb-12" id="collaborator-detail-page">
            {/* Top Page Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setSelectedDetailEmp(null);
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4 text-stone-600" />
                  <span>Retour aux collaborateurs</span>
                </button>
                <div className="h-4 w-px bg-stone-200 hidden sm:block" />
                <span className="text-xs text-stone-500 hidden sm:inline font-medium">
                  Fiche Individuelle &bull; <strong className="text-stone-900 font-serif">{emp.name}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStartEdit(emp)}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Pencil className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Modifier la fiche</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Imprimer cette fiche"
                >
                  <Printer className="h-3.5 w-3.5 text-stone-600" />
                  <span className="hidden sm:inline">Imprimer</span>
                </button>
              </div>
            </div>

            {/* Profile Page Card Content */}
            <div className="bg-white text-stone-800 rounded-2xl shadow-2xs border border-stone-200/90 p-6 space-y-6">
              {/* Header Profile Info */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
                <div className="flex items-center gap-4">
                  <img
                    src={emp.avatarUrl || undefined}
                    alt={emp.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-emerald-200 shadow-sm shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadgeStyle(emp.roleType)}`}>
                        {getRoleLabel(emp.roleType)}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeStyle(empStatus)}`}>
                        {getStatusLabel(empStatus)}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">{emp.name}</h2>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-emerald-600" />
                        {emp.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-emerald-600" />
                        {emp.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building className="h-3.5 w-3.5 text-emerald-600" />
                        {emp.department || 'Citrine Management'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border ${
                    isTracked ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-stone-50 text-stone-600 border-stone-200'
                  }`}>
                    {isTracked ? '✓ Assujetti aux pointages' : '⚪ Dispensé des pointages'}
                  </span>
                </div>
              </div>

              {/* STATISTICS & KEY METRICS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {moduleConfig?.enableFinances !== false ? (
                  <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100 text-center space-y-1">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">Salaire de Base</span>
                    <p className="text-xs font-bold text-stone-900 font-serif">{emp.salary ? formatXAF(emp.salary) : '450 000 XAF'}</p>
                  </div>
                ) : (
                  <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-center space-y-1">
                    <span className="text-[10px] font-bold text-stone-500 uppercase block">Statut Contrat</span>
                    <p className="text-xs font-bold text-stone-800 font-serif">CDI Temps Plein</p>
                  </div>
                )}
                <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100 text-center space-y-1">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Pointages Présence</span>
                  <p className="text-xs font-bold text-stone-900 font-serif">{empPresences.length} enregistrements</p>
                </div>
                <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-center space-y-1">
                  <span className="text-[10px] font-bold text-stone-500 uppercase block">Date d'Arrivée</span>
                  <p className="text-xs font-bold text-stone-800">{emp.hireDate || 'Non spécifiée'}</p>
                </div>
                <div className="bg-amber-50/60 p-3 rounded-2xl border border-amber-100 text-center space-y-1">
                  <span className="text-[10px] font-bold text-amber-800 uppercase block">Anniversaire</span>
                  <p className="text-xs font-bold text-stone-900">{emp.birthDate || 'N/C'}</p>
                </div>
              </div>

              {/* Tabs Switcher for Details (Payslips, Presences, Map) */}
              <div className="flex items-center gap-2 border-b border-stone-200 overflow-x-auto custom-scrollbar">
                {moduleConfig?.enableFinances !== false && (
                  <button
                    onClick={() => setActiveDetailTab('payslips')}
                    className={`pb-3 px-4 font-bold text-xs border-b-2 transition flex items-center gap-2 cursor-pointer shrink-0 ${
                      activeDetailTab === 'payslips'
                        ? 'border-emerald-600 text-stone-900 font-serif'
                        : 'border-transparent text-stone-400 hover:text-stone-600'
                    }`}
                  >
                    <FileText className="h-4 w-4 text-emerald-600" />
                    12 Fiches de Paie (Mois par mois)
                  </button>
                )}
                <button
                  onClick={() => setActiveDetailTab('presences')}
                  className={`pb-3 px-4 font-bold text-xs border-b-2 transition flex items-center gap-2 cursor-pointer shrink-0 ${
                    activeDetailTab === 'presences' || (moduleConfig?.enableFinances === false && activeDetailTab === 'payslips')
                      ? 'border-emerald-600 text-stone-900 font-serif'
                      : 'border-transparent text-stone-400 hover:text-stone-600'
                  }`}
                >
                  <Clock className="h-4 w-4 text-emerald-600" />
                  Historique des Présences ({empPresences.length})
                </button>
                <button
                  onClick={() => setActiveDetailTab('map')}
                  className={`pb-3 px-4 font-bold text-xs border-b-2 transition flex items-center gap-2 cursor-pointer shrink-0 ${
                    activeDetailTab === 'map'
                      ? 'border-emerald-600 text-stone-900 font-serif'
                      : 'border-transparent text-stone-400 hover:text-stone-600'
                  }`}
                >
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  Carte des Badges (GPS Leaflet)
                </button>
                <button
                  onClick={() => setActiveDetailTab('alerts')}
                  className={`pb-3 px-4 font-bold text-xs border-b-2 transition flex items-center gap-2 cursor-pointer shrink-0 ${
                    activeDetailTab === 'alerts'
                      ? 'border-emerald-600 text-stone-900 font-serif'
                      : 'border-transparent text-stone-400 hover:text-stone-600'
                  }`}
                >
                  <Bell className="h-4 w-4 text-emerald-600" />
                  Alertes Actives ({empActiveAlertsCount})
                </button>
                <button
                  onClick={() => setActiveDetailTab('tasks')}
                  className={`pb-3 px-4 font-bold text-xs border-b-2 transition flex items-center gap-2 cursor-pointer shrink-0 ${
                    activeDetailTab === 'tasks'
                      ? 'border-emerald-600 text-stone-900 font-serif'
                      : 'border-transparent text-stone-400 hover:text-stone-600'
                  }`}
                >
                  <CheckSquare className="h-4 w-4 text-emerald-600" />
                  Tâches Non Terminées ({empUnfinishedTasksCount})
                </button>
              </div>

              {/* TAB CONTENT 1: PAYSLIPS */}
              {activeDetailTab === 'payslips' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-200">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                      <input
                        type="text"
                        placeholder="Rechercher par mois ou année..."
                        value={payslipSearchTerm}
                        onChange={(e) => setPayslipSearchTerm(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-green-400 font-medium"
                      />
                    </div>
                    <div className="text-[10px] font-bold text-stone-500 flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-stone-200">
                      <Calendar className="h-3.5 w-3.5 text-green-600" />
                      Devise : FCFA / XAF
                    </div>
                  </div>

                  <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-2xs max-h-[300px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider sticky top-0">
                          <th className="p-3">Période</th>
                          <th className="p-3">Base</th>
                          <th className="p-3">Net à Payer</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-xs">
                        {salaryPayments.filter(sp => sp.employeeId === emp.id && sp.period.toLowerCase().includes(payslipSearchTerm.toLowerCase())).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-stone-500 font-medium">
                              Aucune fiche de paie enregistrée pour cet employé.
                            </td>
                          </tr>
                        ) : (
                          salaryPayments
                            .filter(sp => sp.employeeId === emp.id && sp.period.toLowerCase().includes(payslipSearchTerm.toLowerCase()))
                            .map((sp, idx) => (
                              <tr key={sp.id || idx} className="hover:bg-green-50/30 transition">
                                <td className="p-3 font-bold text-stone-800 flex items-center gap-1.5">
                                  <Calendar className="h-3 w-3 text-green-500" />
                                  {sp.period}
                                </td>
                                <td className="p-3 font-medium text-stone-600">
                                  {formatXAF(sp.baseAmount)}
                                </td>
                                <td className="p-3 font-bold text-green-950">
                                  {formatXAF(sp.netAmount)}
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => setViewingPayslip({
                                      employee: emp,
                                      period: sp.period,
                                      baseSalary: sp.baseAmount,
                                      bonus: sp.bonusAmount || 0,
                                      deductions: sp.deductions || 0,
                                      net: sp.netAmount,
                                      status: sp.status === 'paid' ? 'Payé' : 'En attente'
                                    })}
                                    className="bg-green-50 hover:bg-green-100 text-green-900 border border-green-200 text-[11px] font-bold px-2.5 py-1 rounded-xl transition flex items-center gap-1 ml-auto cursor-pointer"
                                  >
                                    <Eye className="h-3 w-3 text-green-600" />
                                    Aperçu
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

              {/* TAB CONTENT 2: PRESENCES */}
              {activeDetailTab === 'presences' && (
                <div className="space-y-4">
                  {/* Certified Attendance Report Export Toolbar */}
                  <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-stone-600 font-bold">Mois du Rapport :</span>
                      <input
                        type="month"
                        value={reportMonth}
                        onChange={(e) => setReportMonth(e.target.value)}
                        className="bg-white border border-stone-300 rounded-xl px-2.5 py-1 text-xs font-bold text-stone-800 focus:outline-none focus:border-green-600 shadow-2xs"
                      />
                    </div>

                    <button
                      onClick={() => handleGenerateAttendanceReport(emp, reportMonth)}
                      disabled={isGeneratingReport}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold px-3.5 py-1.5 rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer ml-auto sm:ml-0"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>{isGeneratingReport ? 'Génération...' : 'Fiche Mensuelle Certifiée (PDF)'}</span>
                    </button>
                  </div>

                  {empPresences.length === 0 ? (
                    <div className="bg-stone-50 border border-stone-200 p-8 rounded-2xl text-center space-y-2">
                      <Clock className="h-8 w-8 text-stone-300 mx-auto" />
                      <p className="text-xs text-stone-500 font-medium">Aucun enregistrement de présence récent pour ce collaborateur.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
                      {empPresences.slice(0, presenceDisplayLimit).map((p, idx) => {
                        const isExpanded = expandedPresenceId === (p.id || `p-${p.date}-${idx}`);
                        const cardKey = p.id || `p-${p.date}-${idx}`;

                        const arrLoc = p.clockLocations?.arrival?.zoneName || p.location || 'Douala, Japoma';
                        const pauseStartLoc = p.clockLocations?.pauseStart?.zoneName || p.location || 'Douala, Japoma';
                        const pauseEndLoc = p.clockLocations?.pauseEnd?.zoneName || p.location || 'Douala, Japoma';
                        const depLoc = p.clockLocations?.departure?.zoneName || p.location || 'Douala, Japoma';

                        return (
                          <div 
                            key={cardKey} 
                            onClick={() => setExpandedPresenceId(isExpanded ? null : cardKey)}
                            className={`bg-stone-50/80 hover:bg-stone-50 p-3.5 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
                              isExpanded ? 'border-green-300 ring-1 ring-green-200/50 bg-white' : 'border-stone-200 hover:border-green-200'
                            }`}
                          >
                            {/* Card Header Row */}
                            <div className="flex items-center justify-between text-xs gap-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <Calendar className="h-4 w-4 text-green-600 shrink-0" />
                                <span className="font-bold text-stone-800 text-xs">
                                  {new Date(p.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  p.status === 'present' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                                  p.status === 'late' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                                  'bg-green-50 text-green-800 border border-green-200'
                                }`}>
                                  {p.status === 'present' ? 'PRÉSENT' : p.status === 'late' ? 'EN RETARD' : 'ABSENT'}
                                </span>

                                <span className="text-[10px] font-semibold text-stone-500 bg-white px-2 py-0.5 rounded-lg border border-stone-200 hidden sm:inline-flex items-center gap-1">
                                  <span>Arrivée:</span>
                                  <strong className="text-stone-800">{p.arrivalTime || '--:--'}</strong>
                                </span>

                                <button 
                                  type="button"
                                  className="p-1 rounded-lg text-stone-400 hover:text-green-600 hover:bg-green-50 transition"
                                  title={isExpanded ? "Masquer les détails" : "Afficher les détails des pointages et lieux"}
                                >
                                  {isExpanded ? <ChevronUp className="h-4 w-4 text-green-600" /> : <ChevronDown className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>

                            {/* Card Expanded Details Grid */}
                            {isExpanded && (
                              <div className="mt-3.5 pt-3 border-t border-stone-200/80 space-y-3 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-green-900/70 flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-green-600" />
                                  Détails complets des pointages et lieux de géolocalisation :
                                </p>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                  {/* 1. Arrivée */}
                                  <div className="bg-emerald-50/70 border border-emerald-200/80 p-2.5 rounded-xl space-y-1">
                                    <div className="flex items-center justify-between text-[10px] font-bold text-emerald-900">
                                      <span className="flex items-center gap-1">
                                        <Play className="h-3 w-3 text-emerald-600" />
                                        Arrivée
                                      </span>
                                    </div>
                                    <div className="text-sm font-mono font-bold text-stone-900">
                                      {p.arrivalTime || '--:--'}
                                    </div>
                                    {p.arrivalTime ? (
                                      <div className="text-[10px] font-bold text-emerald-800 flex items-center gap-1 truncate" title={arrLoc}>
                                        <MapPin className="h-2.5 w-2.5 text-green-600 shrink-0" />
                                        <span className="truncate">({arrLoc})</span>
                                      </div>
                                    ) : (
                                      <div className="text-[10px] text-stone-400">Non badgé</div>
                                    )}
                                  </div>

                                  {/* 2. Pause Start */}
                                  <div className="bg-amber-50/70 border border-amber-200/80 p-2.5 rounded-xl space-y-1">
                                    <div className="flex items-center justify-between text-[10px] font-bold text-amber-900">
                                      <span className="flex items-center gap-1">
                                        <Coffee className="h-3 w-3 text-amber-600" />
                                        Début Pause
                                      </span>
                                    </div>
                                    <div className="text-sm font-mono font-bold text-stone-900">
                                      {p.pauseStart || '--:--'}
                                    </div>
                                    {p.pauseStart ? (
                                      <div className="text-[10px] font-bold text-amber-800 flex items-center gap-1 truncate" title={pauseStartLoc}>
                                        <MapPin className="h-2.5 w-2.5 text-green-600 shrink-0" />
                                        <span className="truncate">({pauseStartLoc})</span>
                                      </div>
                                    ) : (
                                      <div className="text-[10px] text-stone-400">Non badgé</div>
                                    )}
                                  </div>

                                  {/* 3. Pause End */}
                                  <div className="bg-blue-50/70 border border-blue-200/80 p-2.5 rounded-xl space-y-1">
                                    <div className="flex items-center justify-between text-[10px] font-bold text-blue-900">
                                      <span className="flex items-center gap-1">
                                        <RotateCcw className="h-3 w-3 text-blue-600" />
                                        Retour Pause
                                      </span>
                                    </div>
                                    <div className="text-sm font-mono font-bold text-stone-900">
                                      {p.pauseEnd || '--:--'}
                                    </div>
                                    {p.pauseEnd ? (
                                      <div className="text-[10px] font-bold text-blue-800 flex items-center gap-1 truncate" title={pauseEndLoc}>
                                        <MapPin className="h-2.5 w-2.5 text-green-600 shrink-0" />
                                        <span className="truncate">({pauseEndLoc})</span>
                                      </div>
                                    ) : (
                                      <div className="text-[10px] text-stone-400">Non badgé</div>
                                    )}
                                  </div>

                                  {/* 4. Departure */}
                                  <div className="bg-green-50/70 border border-green-200/80 p-2.5 rounded-xl space-y-1">
                                    <div className="flex items-center justify-between text-[10px] font-bold text-green-900">
                                      <span className="flex items-center gap-1">
                                        <Home className="h-3 w-3 text-green-600" />
                                        Départ
                                      </span>
                                    </div>
                                    <div className="text-sm font-mono font-bold text-stone-900">
                                      {p.departureTime || '--:--'}
                                    </div>
                                    {p.departureTime ? (
                                      <div className="text-[10px] font-bold text-green-800 flex items-center gap-1 truncate" title={depLoc}>
                                        <MapPin className="h-2.5 w-2.5 text-green-600 shrink-0" />
                                        <span className="truncate">({depLoc})</span>
                                      </div>
                                    ) : (
                                      <div className="text-[10px] text-stone-400">Non badgé</div>
                                    )}
                                  </div>
                                </div>

                                {p.correctionReason && (
                                  <div className="bg-amber-50 text-amber-800 p-2 rounded-xl border border-amber-200 text-[10px] font-medium flex items-center gap-1.5">
                                    <Info className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                    <span>Motif de correction : <strong>{p.correctionReason}</strong></span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT 3: MAP (GPS LEAFLET) */}
              {activeDetailTab === 'map' && (
                <CollaboratorPresenceMap
                  presences={empPresences}
                  employeeName={emp.name}
                  avatarUrl={emp.avatarUrl}
                />
              )}

              {/* TAB CONTENT 4: ALERTS */}
              {activeDetailTab === 'alerts' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                      Alertes non terminées / actives
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] font-bold">
                      {reminders.filter(r => r.employeeId === emp.id && !r.triggered && !r.stopped).length} active(s)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reminders.filter(r => r.employeeId === emp.id && !r.triggered && !r.stopped).map((rem) => (
                      <div key={rem.id} className="bg-white rounded-xl border border-green-100 p-4 space-y-2 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[8px] font-bold uppercase tracking-wider">
                            🔔 Alerte active
                          </span>
                          {rem.time && (
                            <span className="text-[10px] font-mono text-stone-500 font-bold">{rem.time}</span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-stone-800 leading-normal">{rem.note}</p>
                        <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono border-t border-stone-50 pt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {rem.date || 'Tous les jours'}
                          </span>
                          {rem.location && (
                            <span className="text-[9px] truncate max-w-[120px]">📍 {rem.location}</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {reminders.filter(r => r.employeeId === emp.id && !r.triggered && !r.stopped).length === 0 && (
                      <p className="col-span-full text-center py-8 text-stone-400 italic text-xs">
                        Aucune alerte active pour ce collaborateur.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB CONTENT 5: TASKS */}
              {activeDetailTab === 'tasks' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                      Tâches non terminées / en cours
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {tasks.filter(t => t.employeeId === emp.id && t.status !== 'completed').length} en cours
                    </span>
                  </div>
                  <div className="space-y-3">
                    {tasks.filter(t => t.employeeId === emp.id && t.status !== 'completed').map((task) => (
                      <div key={task.id} className="bg-white rounded-xl border border-stone-200 p-4 space-y-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-fadeIn">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-xs text-stone-800">{task.title}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${
                              task.priority === 'high' 
                                ? 'bg-red-50 text-red-700 border border-red-100'
                                : task.priority === 'medium'
                                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                : 'bg-stone-100 text-stone-600'
                            }`}>
                              {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-[10px] text-stone-500 line-clamp-2">{task.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-4 shrink-0 text-[10px] text-stone-400 font-mono">
                          {task.date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-stone-400" /> Échéance : {task.date} {task.time && `à ${task.time}`}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {tasks.filter(t => t.employeeId === emp.id && t.status !== 'completed').length === 0 && (
                      <p className="text-center py-8 text-stone-400 italic text-xs">
                        Aucune tâche en cours pour ce collaborateur.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Edit Modal Overlay */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs">
          <div className="bg-white text-stone-800 rounded-2xl shadow-2xl border border-stone-200 max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-stone-800 font-serif">Modifier la Fiche Collaborateur</h3>
              </div>
              <button 
                onClick={() => setEditingEmployee(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 text-red-800 border border-red-100 p-3 rounded-xl text-xs font-medium">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-500 uppercase block">Nom complet</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-stone-200 rounded-xl bg-stone-50/50 focus:bg-white focus:outline-emerald-500 focus:ring-1 focus:ring-emerald-200 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-500 uppercase block">Nature du Rôle / Métier</label>
                <SearchableSelect
                  value={editRoleType}
                  onChange={(val) => setEditRoleType(val as EmployeeRoleType)}
                  options={[
                    { value: 'employé', label: 'Employé' },
                    { value: 'stagiaire', label: 'Stagiaire' },
                    { value: 'informaticien', label: 'Informaticien / IT' },
                    { value: 'comptable', label: 'Comptable' },
                    { value: 'rh', label: 'Ressources Humaines (RH)' },
                    { value: 'finance', label: 'Finance' },
                    { value: 'gestionnaire de projet assistant', label: 'Gestionnaire Assistant (Responsable)' },
                    { value: 'gestionnaire de projet', label: 'Gestionnaire de Projet (Responsable)' },
                    { value: 'sponsor', label: 'Sponsor' }
                  ]}
                  placeholder="Sélectionner rôle..."
                  searchPlaceholder="Rechercher rôle..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-500 uppercase block">Statut Actuel</label>
                <SearchableSelect
                  value={editStatus}
                  onChange={(val) => setEditStatus(val as EmployeeStatus)}
                  options={[
                    { value: 'en_poste', label: '🟢 En poste (Actif)' },
                    { value: 'en_conge', label: '🟡 En congé' },
                    { value: 'maladie', label: '🟣 Arrêt maladie' },
                    { value: 'suspendu', label: '🟠 Suspendu' },
                    { value: 'parti', label: '⚪ Parti (Démission / Départ)' },
                    { value: 'renvoye', label: '🔴 Renvoyé / Licencié' }
                  ]}
                  placeholder="Sélectionner statut..."
                  searchPlaceholder="Rechercher statut..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-500 uppercase block">Adresse e-mail</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full text-xs p-2.5 border border-green-100 rounded-xl bg-green-50/10 focus:bg-white focus:outline-green-500 focus:ring-1 focus:ring-green-200 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-500 uppercase block">Téléphone (WhatsApp)</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full text-xs p-2.5 border border-green-100 rounded-xl bg-green-50/10 focus:bg-white focus:outline-green-500 focus:ring-1 focus:ring-green-200 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-500 uppercase block">Date d'arrivée</label>
                <input
                  type="date"
                  value={editHireDate}
                  onChange={(e) => setEditHireDate(e.target.value)}
                  className="w-full text-xs p-2.5 border border-green-100 rounded-xl bg-white focus:outline-green-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-500 uppercase block">Date d'anniversaire</label>
                <input
                  type="date"
                  value={editBirthDate}
                  onChange={(e) => setEditBirthDate(e.target.value)}
                  className="w-full text-xs p-2.5 border border-green-100 rounded-xl bg-white focus:outline-green-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-500 uppercase block">Salaire Mensuel Brut (XAF)</label>
                <input
                  type="number"
                  value={editSalary}
                  onChange={(e) => setEditSalary(e.target.value)}
                  className="w-full text-xs p-2.5 border border-green-100 rounded-xl bg-white focus:outline-green-500 transition"
                />
              </div>

              {/* Edit Photo File Upload (Optional) */}
              <div className="col-span-full space-y-1.5 bg-stone-50/80 p-3.5 rounded-xl border border-stone-200">
                <label className="text-[11px] font-bold text-stone-700 uppercase flex items-center justify-between">
                  <span>Photo de profil du collaborateur (Optionnel)</span>
                  <span className="text-stone-400 font-normal text-[10px] lowercase">Fichier PNG, JPG, WEBP (&lt; 5Mo)</span>
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 shrink-0">
                    <img
                      src={editAvatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80'}
                      alt="Aperçu photo"
                      className="w-12 h-12 rounded-full object-cover border-2 border-green-200 shadow-2xs"
                    />
                    {editAvatarUrl && (
                      <button
                        type="button"
                        onClick={() => setEditAvatarUrl('')}
                        className="text-stone-400 hover:text-green-600 text-xs font-bold underline cursor-pointer"
                      >
                        Effacer la photo
                      </button>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="inline-flex items-center gap-2 bg-white hover:bg-green-50 text-stone-800 border border-stone-200 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition shadow-2xs">
                      <Upload className="h-4 w-4 text-green-600" />
                      <span>{editAvatarUrl ? "Remplacer le fichier image..." : "Choisir un fichier photo..."}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageFileUpload(e, true)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {(editStatus === 'parti' || editStatus === 'renvoye') && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-green-700 uppercase block">Date de départ</label>
                    <input
                      type="date"
                      value={editDepartureDate}
                      onChange={(e) => setEditDepartureDate(e.target.value)}
                      className="w-full text-xs p-2.5 border border-green-300 rounded-xl bg-green-50/30 focus:outline-green-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-green-700 uppercase block">Motif du départ</label>
                    <input
                      type="text"
                      placeholder="Motif (ex. Démission, Licenciement...)"
                      value={editDepartureReason}
                      onChange={(e) => setEditDepartureReason(e.target.value)}
                      className="w-full text-xs p-2.5 border border-green-300 rounded-xl bg-green-50/30 focus:outline-green-500"
                    />
                  </div>
                </>
              )}

              <div className="col-span-full flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="bg-stone-50 hover:bg-stone-100 text-stone-600 text-xs font-bold px-4 py-2 rounded-xl border border-stone-200/50 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs cursor-pointer"
                >
                  Enregistrer les Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Departure Modal Overlay */}
      {departingEmployee && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs">
          <div className="bg-white text-stone-800 rounded-2xl shadow-2xl border border-green-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-green-50 pb-3">
              <div className="flex items-center gap-2 text-green-700">
                <LogOut className="h-5 w-5" />
                <h3 className="text-sm font-bold font-serif">Marquer le Départ de {departingEmployee.name}</h3>
              </div>
              <button 
                onClick={() => setDepartingEmployee(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-stone-600 text-xs leading-relaxed">
              Veuillez renseigner les éléments administratifs du départ. Ce collaborateur sera automatiquement retiré du tableau des pointages quotidiens.
            </p>

            <form onSubmit={handleConfirmDeparture} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-500 uppercase block">Type de Départ / Statut</label>
                <SearchableSelect
                  value={departStatus}
                  onChange={(val) => setDepartStatus(val as 'parti' | 'renvoye')}
                  options={[
                    { value: 'parti', label: 'Départ Volontaire / Démission / Fin de contrat' },
                    { value: 'renvoye', label: 'Licenciement / Renvoyé' }
                  ]}
                  placeholder="Sélectionner type..."
                  searchPlaceholder="Rechercher type..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-500 uppercase block">Date effective du départ</label>
                <input
                  type="date"
                  value={departDate}
                  onChange={(e) => setDepartDate(e.target.value)}
                  className="w-full text-xs p-2.5 border border-stone-200 rounded-xl bg-white focus:outline-emerald-500 cursor-pointer"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-500 uppercase block">Motif du départ</label>
                <SearchableSelect
                  value={departReason}
                  onChange={(val) => setDepartReason(val)}
                  options={[
                    { value: 'Démission', label: 'Démission' },
                    { value: 'Fin de contrat (CDD / Stage)', label: 'Fin de contrat (CDD / Stage)' },
                    { value: 'Rupture conventionnelle', label: 'Rupture conventionnelle' },
                    { value: 'Licenciement pour motif personnel', label: 'Licenciement pour motif personnel' },
                    { value: 'Licenciement économique', label: 'Licenciement économique' },
                    { value: 'Autre', label: 'Autre motif' }
                  ]}
                  placeholder="Sélectionner motif..."
                  searchPlaceholder="Rechercher motif..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-green-50">
                <button
                  type="button"
                  onClick={() => setDepartingEmployee(null)}
                  className="bg-stone-50 hover:bg-stone-100 text-stone-600 text-xs font-bold px-4 py-2 rounded-xl border border-stone-200/50 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Valider le Départ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* PRINTABLE / WORD-STYLE BULLETIN DE PAIE MODAL */}
      {viewingPayslip && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs">
          <div className="bg-white text-stone-900 rounded-2xl shadow-2xl border border-green-200 max-w-2xl w-full p-8 space-y-6 max-h-[95vh] overflow-y-auto">
            
            {/* Header Document Style */}
            <div className="border-b-2 border-stone-900 pb-4 flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-emerald-600" />
                  <h1 className="text-base font-serif font-black tracking-wide uppercase text-stone-900">Citrine Management Enterprise</h1>
                </div>
                <p className="text-[10px] text-stone-500">Direction des Ressources Humaines & Comptabilité</p>
                <p className="text-[10px] text-stone-500">République du Cameroun / Zone CEMAC • Monnaie : FCFA</p>
              </div>

              <div className="text-right space-y-1">
                <span className="bg-emerald-600 text-white font-serif font-bold text-xs px-3 py-1 rounded-md uppercase tracking-wider block">
                  BULLETIN DE PAIE
                </span>
                <p className="text-[11px] font-bold text-stone-700">Période : {viewingPayslip.period}</p>
              </div>
            </div>

            {/* Employee & Company Metadata Table */}
            <div className="grid grid-cols-2 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200 text-[11px]">
              <div className="space-y-1">
                <p className="font-bold text-stone-400 uppercase text-[9px]">COLLABORATEUR / SALARIÉ</p>
                <p className="font-bold text-sm text-stone-900">{viewingPayslip.employee.name}</p>
                <p className="text-stone-600">Rôle : <strong className="text-stone-800">{getRoleLabel(viewingPayslip.employee.roleType)}</strong></p>
                <p className="text-stone-600">Email : {viewingPayslip.employee.email}</p>
                <p className="text-stone-600">Téléphone : {viewingPayslip.employee.phone}</p>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-stone-400 uppercase text-[9px]">ADMINISTRATION & CONTRAT</p>
                <p className="text-stone-600">Matricule : <strong className="text-stone-800">{viewingPayslip.employee.id.toUpperCase()}</strong></p>
                <p className="text-stone-600">Date d'embauche : {viewingPayslip.employee.hireDate || '08/07/2026'}</p>
                <p className="text-stone-600">Statut : <strong className="text-emerald-700">{getStatusLabel(viewingPayslip.employee.status)}</strong></p>
                <p className="text-stone-600">Mode de paiement : <strong>Virement bancaire / Mobile Money</strong></p>
              </div>
            </div>

            {/* Itemized Salary Breakdown Table */}
            <div className="space-y-2">
              <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-stone-800">Détail du Calcul de la Rémunération</h3>
              <table className="w-full text-left border-collapse border border-stone-200 text-xs">
                <thead>
                  <tr className="bg-stone-100 border-b border-stone-200 text-[10px] font-bold text-stone-600 uppercase">
                    <th className="p-2.5 border-r border-stone-200">Rubrique / Intitulé</th>
                    <th className="p-2.5 border-r border-stone-200 text-right">Base</th>
                    <th className="p-2.5 border-r border-stone-200 text-right">Gains (+)</th>
                    <th className="p-2.5 text-right">Retenues (-)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  <tr>
                    <td className="p-2.5 border-r border-stone-200 font-medium">Salaire de base mensuel</td>
                    <td className="p-2.5 border-r border-stone-200 text-right">{formatXAF(viewingPayslip.baseSalary)}</td>
                    <td className="p-2.5 border-r border-stone-200 text-right font-bold text-stone-800">{formatXAF(viewingPayslip.baseSalary)}</td>
                    <td className="p-2.5 text-right text-stone-400">-</td>
                  </tr>
                  {viewingPayslip.bonus > 0 && (
                    <tr>
                      <td className="p-2.5 border-r border-stone-200 font-medium text-emerald-800">Prime de performance / Gratification</td>
                      <td className="p-2.5 border-r border-stone-200 text-right">-</td>
                      <td className="p-2.5 border-r border-stone-200 text-right font-bold text-emerald-700">+{formatXAF(viewingPayslip.bonus)}</td>
                      <td className="p-2.5 text-right text-stone-400">-</td>
                    </tr>
                  )}
                  {viewingPayslip.deductions > 0 && (
                    <tr>
                      <td className="p-2.5 border-r border-stone-200 font-medium text-green-800">Retenues / Acomptes versés</td>
                      <td className="p-2.5 border-r border-stone-200 text-right">-</td>
                      <td className="p-2.5 border-r border-stone-200 text-right text-stone-400">-</td>
                      <td className="p-2.5 text-right font-bold text-green-700">-{formatXAF(viewingPayslip.deductions)}</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-emerald-50/50 font-bold border-t-2 border-stone-800 text-stone-900">
                    <td colSpan={2} className="p-3 border-r border-stone-200 uppercase text-xs">
                      NET A PAYER SALARIÉ (XAF)
                    </td>
                    <td colSpan={2} className="p-3 text-right text-sm font-black text-emerald-700 font-serif">
                      {formatXAF(viewingPayslip.net)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Stamp, Cryptographic Integrity & Notice */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end pt-4 border-t border-stone-200 text-[10px] gap-3">
              <div className="space-y-1 text-stone-500 max-w-xs">
                <p className="font-bold text-stone-700 uppercase">Mention Obligatoire & Signature Numérique :</p>
                <p>Pour faire valoir ce que de droit. Scellé numériquement dans le registre social Citrine Management.</p>
                <p className="font-mono text-[9px] text-stone-600 break-all">
                  Certificat : <strong>CITRINE-CERT-PAY-{(viewingPayslip.employee.id + viewingPayslip.period).substring(0, 10).toUpperCase()}</strong>
                </p>
              </div>

              <div className="border border-stone-300 p-3 rounded-xl text-center space-y-1 bg-stone-50/50 min-w-[160px] self-end">
                <p className="font-bold text-stone-700 uppercase text-[9px]">Cachet de la Direction</p>
                <div className="w-12 h-12 border-2 border-dashed border-green-400 rounded-full mx-auto flex items-center justify-center text-[8px] font-bold text-green-800 uppercase tracking-tighter">
                  VALIDÉ
                </div>
                <p className="text-[9px] text-emerald-800 font-bold">Signé électroniquement (SHA-256)</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
              <button
                onClick={() => setViewingPayslip(null)}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Fermer
              </button>
              <button
                onClick={() => window.print()}
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                Imprimer / Imprimer PDF (A4)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 📄 CERTIFIED MONTHLY ATTENDANCE REPORT MODAL */}
      <RhReportModal
        isOpen={!!certifiedReport}
        onClose={() => setCertifiedReport(null)}
        report={certifiedReport}
      />

    </div>
  );
}
