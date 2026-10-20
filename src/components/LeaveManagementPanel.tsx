import React, { useState, useMemo } from 'react';
import { 
  CalendarDays, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Edit3, 
  User, 
  Building, 
  MessageSquare, 
  Check, 
  X, 
  ChevronRight,
  UserCheck,
  Calendar,
  Plus,
  Compass,
  Flag
} from 'lucide-react';
import { 
  LeaveRequest, 
  LeaveType, 
  LeaveStatus, 
  LEAVE_TYPE_LABELS, 
  LEAVE_STATUS_LABELS 
} from '../types/leaveTypes';
import { Employee } from '../types/employeeTypes';
import { AppUser } from '../types/userTypes';
import { NotificationLog, CompanyModuleConfig } from '../types/businessTypes';
import { decideLeaveRequest, calculateDaysBetween, createAdminLeaveRequest } from '../services/leaveService';
import { terminateMission } from '../services/missionLifecycleService';
import { clientMailService } from '../services/clientMailService';
import { showSuccessAlert, showErrorAlert, confirmActionAlert } from '../utils/sweetAlert';

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
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'missions' | 'leaves'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | LeaveStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'modify' | null>(null);

  // Form states for modal actions
  const [managerComment, setManagerComment] = useState('');
  const [modifiedStartDate, setModifiedStartDate] = useState('');
  const [modifiedEndDate, setModifiedEndDate] = useState('');
  const [modifiedDaysCount, setModifiedDaysCount] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // State for creating leave for employee
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createEmployeeId, setCreateEmployeeId] = useState('');
  const [createLeaveType, setCreateLeaveType] = useState<LeaveType>('conge_paye');
  const [createStartDate, setCreateStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [createEndDate, setCreateEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [createDaysCount, setCreateDaysCount] = useState<number>(1);
  const [createReason, setCreateReason] = useState('');
  const [createStatus, setCreateStatus] = useState<LeaveStatus>('approved');
  const [createManagerComment, setCreateManagerComment] = useState('');
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  React.useEffect(() => {
    if (createStartDate && createEndDate) {
      const days = calculateDaysBetween(createStartDate, createEndDate);
      setCreateDaysCount(days);
    }
  }, [createStartDate, createEndDate]);

  // KPIs
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

  // Filtered requests
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

  // Clôture d'une mission par la Direction / Manager
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
        req.id,
        leaveRequests,
        employees,
        users,
        currentUser?.name || 'Direction RH',
        onUpdateLeaveRequests,
        onUpdateEmployees,
        onUpdateUsers,
        onAddNotification
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

  // Open Decision Modal
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

  // Close modals
  const closeModal = () => {
    setSelectedRequest(null);
    setActionType(null);
    setManagerComment('');
    setIsProcessing(false);
  };

  // Submit Approval / Rejection / Modification
  const handleConfirmDecision = async () => {
    if (!selectedRequest) return;
    setIsProcessing(true);

    const emp = employees.find((e) => e.id === selectedRequest.employeeId);
    const deciderName = currentUser?.name || 'Responsable RH';

    try {
      if (actionType === 'approve') {
        await decideLeaveRequest(
          selectedRequest.id,
          {
            status: 'approved',
            managerComment: managerComment.trim() || 'Demande validée conformément aux nécessités de service.',
            approvedStartDate: selectedRequest.startDate,
            approvedEndDate: selectedRequest.endDate,
            approvedDaysCount: selectedRequest.daysCount,
            decidedBy: deciderName,
            decidedByUserId: currentUser?.id,
          },
          selectedRequest,
          emp,
          onAddNotification
        );
        showToast?.('Demande validée', `Le congé de ${selectedRequest.employeeName} a été validé.`, 'success');
        await showSuccessAlert('Demande validée !', `La demande de ${selectedRequest.employeeName} a été validée avec succès.`);
      } else if (actionType === 'reject') {
        if (!managerComment.trim()) {
          showToast?.('Motif requis', 'Veuillez préciser le motif de refus à communiquer au collaborateur.', 'warning');
          await showErrorAlert('Motif obligatoire', 'Veuillez préciser le motif de refus.');
          setIsProcessing(false);
          return;
        }

        await decideLeaveRequest(
          selectedRequest.id,
          {
            status: 'rejected',
            managerComment: managerComment.trim(),
            decidedBy: deciderName,
            decidedByUserId: currentUser?.id,
          },
          selectedRequest,
          emp,
          onAddNotification
        );
        showToast?.('Demande refusée', `La demande de ${selectedRequest.employeeName} a été refusée.`, 'info');
        await showSuccessAlert('Demande refusée', `La demande de ${selectedRequest.employeeName} a été refusée.`);
      } else if (actionType === 'modify') {
        const days = modifiedDaysCount > 0 ? modifiedDaysCount : calculateDaysBetween(modifiedStartDate, modifiedEndDate);

        await decideLeaveRequest(
          selectedRequest.id,
          {
            status: 'modified',
            managerComment: managerComment.trim() || 'Durée et période ajustées selon impératifs de service.',
            approvedStartDate: modifiedStartDate,
            approvedEndDate: modifiedEndDate,
            approvedDaysCount: days,
            decidedBy: deciderName,
            decidedByUserId: currentUser?.id,
          },
          selectedRequest,
          emp,
          onAddNotification
        );
        showToast?.('Durée ajustée', `La durée accordée a été ajustée à ${days} jour(s).`, 'success');
        await showSuccessAlert('Durée ajustée !', `La durée accordée pour ${selectedRequest.employeeName} a été ajustée à ${days} jour(s).`);
      }

      // ✉️ Envoi automatique du mail groupé dans le fil du collaborateur
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
      showToast?.('Erreur', 'Impossible de traiter la demande.', 'warning');
      setIsProcessing(false);
    }
  };

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createEmployeeId) {
      showToast?.('Collaborateur requis', 'Veuillez sélectionner un collaborateur.', 'warning');
      return;
    }
    const emp = employees.find((e) => e.id === createEmployeeId);
    if (!emp) return;

    setIsSubmittingCreate(true);
    try {
      const empName = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
      await createAdminLeaveRequest(
        {
          employeeId: emp.id,
          employeeName: empName,
          employeeAvatar: emp.avatarUrl || '',
          department: emp.department || 'Opérations',
          type: createLeaveType,
          startDate: createStartDate,
          endDate: createEndDate,
          daysCount: createDaysCount,
          reason: createReason.trim() || 'Attribué par la Direction RH',
          status: createStatus,
          managerComment: createManagerComment.trim() || undefined,
        },
        currentUser,
        onAddNotification
      );

      showToast?.(
        createStatus === 'approved' ? 'Congé accordé et validé' : 'Demande enregistrée',
        `Congé / Permission créé(e) avec succès pour ${empName}.`,
        'success'
      );
      await showSuccessAlert(
        createStatus === 'approved' ? 'Congé validé !' : 'Demande enregistrée !',
        `Congé / Permission enregistré(e) avec succès pour ${empName}.`
      );
      setShowCreateModal(false);
      setCreateReason('');
      setCreateManagerComment('');
    } catch (err: any) {
      showToast?.('Erreur', 'Impossible de créer la demande de congé.', 'warning');
      await showErrorAlert('Erreur', err?.message || 'Impossible de créer la demande de congé.');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#2A7B76] via-[#20635F] to-emerald-900 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 backdrop-blur-xs rounded-xl border border-white/15">
              <CalendarDays className="h-5 w-5 text-emerald-200" />
            </div>
            <h2 className="font-serif font-bold text-xl md:text-2xl">
              Gestion des Congés & Permissions
            </h2>
          </div>
          <p className="text-xs text-emerald-100/90 pl-1 max-w-2xl">
            Arbitrage des demandes d'absences, congés payés, permissions exceptionnelles et suivi des soldes des collaborateurs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            onClick={() => {
              if (employees.length > 0 && !createEmployeeId) {
                setCreateEmployeeId(employees[0].id);
              }
              setShowCreateModal(true);
            }}
            className="px-4 py-2.5 bg-white text-[#2A7B76] hover:bg-emerald-50 rounded-2xl text-xs font-bold transition shadow-md cursor-pointer flex items-center gap-2 shrink-0"
          >
            <Plus className="h-4 w-4 text-[#2A7B76]" />
            <span>+ Créer un congé / permission</span>
          </button>

          <div className="flex items-center gap-2 bg-black/20 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-white/10 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium text-emerald-100">Module Actif</span>
          </div>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-3xs flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">En attente</span>
            <h3 className="text-base font-bold font-serif text-stone-900">{stats.pending}</h3>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-3xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Validées</span>
            <h3 className="text-base font-bold font-serif text-stone-900">{stats.approved}</h3>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-3xs flex items-center gap-3">
          <div className="p-2.5 bg-teal-50 text-[#2A7B76] rounded-xl border border-teal-100">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">🚀 Missions</span>
            <h3 className="text-base font-bold font-serif text-stone-900">{stats.missions}</h3>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-3xs flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
            <Edit3 className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Ajustées</span>
            <h3 className="text-base font-bold font-serif text-stone-900">{stats.modified}</h3>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-3xs flex items-center gap-3">
          <div className="p-2.5 bg-stone-100 text-stone-700 rounded-xl border border-stone-200">
            <Flag className="h-4 w-4 text-emerald-700" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">🏁 Terminées</span>
            <h3 className="text-base font-bold font-serif text-stone-900">{stats.terminee}</h3>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-3xs flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl border border-rose-100">
            <XCircle className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Refusées</span>
            <h3 className="text-base font-bold font-serif text-stone-900">{stats.rejected}</h3>
          </div>
        </div>
      </div>

      {/* Category Toggle Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-3xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer ${
              categoryFilter === 'all' ? 'bg-[#2A7B76] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Toutes les demandes ({stats.total})
          </button>
          <button
            onClick={() => setCategoryFilter('missions')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              categoryFilter === 'missions' ? 'bg-[#2A7B76] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>🚀 Missions Professionnelles ({stats.missions})</span>
          </button>
          <button
            onClick={() => setCategoryFilter('leaves')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              categoryFilter === 'leaves' ? 'bg-[#2A7B76] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>🏖️ Congés & Permissions ({stats.total - stats.missions})</span>
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="h-3.5 w-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, motif ou lieu..."
            className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#2A7B76]"
          />
        </div>
      </div>

      {/* Status Filter Toolbar */}
      <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl overflow-x-auto">
        {[
          { id: 'all', label: `Tous statuts (${stats.total})` },
          { id: 'pending', label: `En attente (${stats.pending})` },
          { id: 'approved', label: `Validées (${stats.approved})` },
          { id: 'modified', label: `Ajustées (${stats.modified})` },
          { id: 'terminee', label: `🏁 Terminées (${stats.terminee})` },
          { id: 'rejected', label: `Refusées (${stats.rejected})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id as any)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer ${
              statusFilter === tab.id ? 'bg-[#2A7B76] text-white shadow-2xs' : 'text-stone-500 hover:text-stone-800'
            }`}
            title={`Filtrer par statut : ${tab.label}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <h3 className="font-serif font-bold text-xs text-stone-900 flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-[#2A7B76]" />
            Registre des Demandes de Congés & Permissions ({filteredRequests.length})
          </h3>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <div className="w-12 h-12 bg-stone-100 text-stone-400 rounded-2xl flex items-center justify-center mx-auto">
              <CalendarDays className="h-6 w-6" />
            </div>
            <p className="text-xs font-bold text-stone-700">Aucune demande trouvée</p>
            <p className="text-[11px] text-stone-400">Modifiez vos filtres ou la recherche pour afficher d'autres demandes.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredRequests.map((req) => {
              const typeCfg = LEAVE_TYPE_LABELS[req.type] || { label: req.type, badgeColor: 'bg-stone-100 text-stone-800 border-stone-200' };
              const statusCfg = LEAVE_STATUS_LABELS[req.status] || { label: req.status, badgeColor: 'bg-stone-100 text-stone-800 border-stone-200' };

              return (
                <div key={req.id} className="p-5 hover:bg-stone-50/60 transition space-y-4">
                  {/* Top Row: Employee & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {req.employeeAvatar ? (
                        <img src={req.employeeAvatar} alt={req.employeeName} className="w-10 h-10 rounded-2xl object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-2xl bg-[#2A7B76]/10 text-[#2A7B76] font-bold flex items-center justify-center text-sm shrink-0">
                          {req.employeeName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-stone-900">{req.employeeName}</h4>
                          <span className="text-[10px] text-stone-500 font-mono bg-stone-100 px-2 py-0.5 rounded-md">
                            {req.department || 'Opérations'}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500">Déposée le {req.createdAt.slice(0, 10)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border ${typeCfg.badgeColor}`}>
                        {typeCfg.label}
                      </span>
                      <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border ${statusCfg.badgeColor} flex items-center gap-1`}>
                        {req.status === 'approved' && <CheckCircle2 className="h-3 w-3" />}
                        {req.status === 'rejected' && <XCircle className="h-3 w-3" />}
                        {req.status === 'modified' && <AlertCircle className="h-3 w-3" />}
                        {req.status === 'pending' && <Clock className="h-3 w-3" />}
                        {statusCfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Dates & Reason Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-stone-50/80 p-3.5 rounded-2xl border border-stone-200/60 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">Période sollicitée</span>
                      <p className="font-bold text-stone-800">
                        Du <strong className="text-stone-900">{req.startDate}</strong> au <strong className="text-stone-900">{req.endDate}</strong>
                      </p>
                      <span className="inline-block mt-1 bg-stone-200 text-stone-700 px-2 py-0.5 rounded-md text-[10px] font-mono">
                        {req.daysCount} jour(s)
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">Décision & Durée</span>
                      {req.status === 'modified' ? (
                        <div>
                          <p className="font-bold text-indigo-700">
                            Ajusté : Du {req.approvedStartDate} au {req.approvedEndDate}
                          </p>
                          <span className="inline-block mt-1 bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono">
                            {req.approvedDaysCount} jour(s) accordé(s)
                          </span>
                        </div>
                      ) : req.status === 'approved' ? (
                        <div>
                          <p className="font-bold text-emerald-700">
                            Accordé : {req.daysCount} jour(s)
                          </p>
                          <span className="inline-block mt-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold">
                            Validé à 100%
                          </span>
                        </div>
                      ) : req.status === 'rejected' ? (
                        <p className="text-rose-700 font-bold">Refusé par la direction</p>
                      ) : (
                        <p className="text-amber-700 font-medium italic">En attente d'arbitrage hiérarchique</p>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">Arbitré par</span>
                      {req.decidedBy ? (
                        <p className="text-stone-800 font-medium">
                          <strong>{req.decidedBy}</strong> le {req.decidedAt?.slice(0, 10)}
                        </p>
                      ) : (
                        <p className="text-stone-400 italic">Non encore assigné</p>
                      )}
                    </div>
                  </div>

                  {/* Reason text */}
                  <div className="space-y-1 text-xs">
                    <p className="text-stone-500 font-bold text-[11px]">Motif du collaborateur :</p>
                    <p className="bg-white p-2.5 rounded-xl border border-stone-200 text-stone-700 leading-relaxed whitespace-pre-line">
                      {req.reason}
                    </p>
                  </div>

                  {req.managerComment && (
                    <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-xs space-y-0.5">
                      <p className="font-bold text-amber-900 text-[11px] flex items-center gap-1">
                        <MessageSquare className="h-3 w-3 text-amber-700" />
                        <span>Commentaire / Décision RH ({req.decidedBy || 'Responsable'}) :</span>
                      </p>
                      <p className="text-amber-800">{req.managerComment}</p>
                    </div>
                  )}

                  {/* Manager Action Buttons Toolbar */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => openActionModal(req, 'approve')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                        title="Valider cette demande de congé"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Valider</span>
                      </button>

                      <button
                        onClick={() => openActionModal(req, 'modify')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                        title="Ajuster les dates ou le nombre de jours accordés"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Modifier la durée</span>
                      </button>

                      <button
                        onClick={() => openActionModal(req, 'reject')}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                        title="Refuser cette demande de congé"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Refuser</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1 : Validation ou Refus */}
      {(actionType === 'approve' || actionType === 'reject') && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-3">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-stone-200 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                {actionType === 'approve' ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span>Valider la demande de congé</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-rose-600" />
                    <span>Refuser la demande de congé</span>
                  </>
                )}
              </h3>
              <button onClick={closeModal} className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer" title="Fermer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Employé : <strong className="text-stone-900">{selectedRequest.employeeName}</strong> pour la période du{' '}
              <strong>{selectedRequest.startDate}</strong> au <strong>{selectedRequest.endDate}</strong> ({selectedRequest.daysCount} jours).
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">
                {actionType === 'approve' ? 'Commentaire de validation (optionnel)' : 'Motif obligatoire du refus *'}
              </label>
              <textarea
                rows={3}
                value={managerComment}
                onChange={(e) => setManagerComment(e.target.value)}
                placeholder={actionType === 'approve' ? 'Ex: Accordé. Veillez à transmettre les dossiers urgents...' : 'Ex: Effectif insuffisant cette semaine, report nécessaire...'}
                required={actionType === 'reject'}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 focus:outline-none focus:border-[#2A7B76] resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={closeModal} className="px-4 py-2 bg-stone-100 text-stone-700 text-xs font-bold rounded-xl cursor-pointer" title="Annuler">
                Annuler
              </button>
              <button
                onClick={handleConfirmDecision}
                disabled={isProcessing}
                className={`px-5 py-2 text-white text-xs font-bold rounded-xl transition cursor-pointer ${
                  actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
                title="Confirmer la décision"
              >
                {isProcessing ? 'Enregistrement...' : actionType === 'approve' ? 'Confirmer la validation' : 'Confirmer le refus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2 : Modification de la durée */}
      {actionType === 'modify' && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-3">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-stone-200 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-indigo-600" />
                <span>Adapter la durée du congé / permission</span>
              </h3>
              <button onClick={closeModal} className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer" title="Fermer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Demande initiale de <strong className="text-stone-900">{selectedRequest.employeeName}</strong> : du{' '}
              <strong className="text-stone-900">{selectedRequest.startDate}</strong> au{' '}
              <strong className="text-stone-900">{selectedRequest.endDate}</strong> ({selectedRequest.daysCount} jours).
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700">Date début accordée</label>
                <input
                  type="date"
                  value={modifiedStartDate}
                  onChange={(e) => setModifiedStartDate(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Date fin accordée</label>
                <input
                  type="date"
                  value={modifiedEndDate}
                  onChange={(e) => setModifiedEndDate(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-800"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-stone-700">Nombre de jours validés</label>
              <input
                type="number"
                min={1}
                max={60}
                value={modifiedDaysCount}
                onChange={(e) => setModifiedDaysCount(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-800"
              />
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-stone-700">Motif de l'ajustement communiqué à l'employé *</label>
              <textarea
                rows={3}
                value={managerComment}
                onChange={(e) => setManagerComment(e.target.value)}
                placeholder="Ex: Compte tenu de la livraison client prévue vendredi, accord pour 2 jours du lundi au mardi..."
                required
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={closeModal} className="px-4 py-2 bg-stone-100 text-stone-700 text-xs font-bold rounded-xl cursor-pointer" title="Annuler">
                Annuler
              </button>
              <button
                onClick={handleConfirmDecision}
                disabled={isProcessing}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                title="Valider la durée modifiée"
              >
                {isProcessing ? 'Enregistrement...' : 'Valider la durée modifiée'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CRÉATION DE CONGÉ / PERMISSION POUR UN COLLABORATEUR */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-[#2A7B76] rounded-xl">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900">
                    Attribuer un Congé ou une Permission
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Saisie administrative directe pour le compte d'un collaborateur
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLeave} className="space-y-3.5 text-xs">
              {/* Sélection du collaborateur */}
              <div className="space-y-1">
                <label className="font-bold text-stone-700">Collaborateur bénéficiaire *</label>
                <select
                  value={createEmployeeId}
                  onChange={(e) => setCreateEmployeeId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 outline-none focus:border-[#2A7B76]"
                  required
                >
                  <option value="">Sélectionner un collaborateur...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim()} — {emp.role || emp.department || 'Salarié'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type de congé / permission */}
              <div className="space-y-1">
                <label className="font-bold text-stone-700">Type de congé ou d'absence *</label>
                <select
                  value={createLeaveType}
                  onChange={(e) => setCreateLeaveType(e.target.value as LeaveType)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 outline-none focus:border-[#2A7B76]"
                >
                  <option value="conge_paye">🌴 Congé Payé Annuel</option>
                  <option value="permission_exceptionnelle">📄 Permission Exceptionnelle d'absence</option>
                  <option value="conge_maladie">🏥 Congé Maladie (justifié)</option>
                  <option value="maternite_paternite">👶 Congé Maternité / Paternité</option>
                  <option value="evenement_familial">💍 Événement Familial (mariage, décès, etc.)</option>
                  <option value="recuperation">⏱️ Récupération / Repos compensateur</option>
                  <option value="teletravail">💻 Télétravail Exceptionnel</option>
                  <option value="autre">✨ Autre motif d'absence</option>
                </select>
              </div>

              {/* Période */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Date début *</label>
                  <input
                    type="date"
                    value={createStartDate}
                    onChange={(e) => setCreateStartDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 outline-none focus:border-[#2A7B76]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Date fin *</label>
                  <input
                    type="date"
                    value={createEndDate}
                    onChange={(e) => setCreateEndDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 outline-none focus:border-[#2A7B76]"
                    required
                  />
                </div>
              </div>

              {/* Nombre de jours */}
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1">
                  <label className="font-bold text-stone-700">Nombre de jours décomptés</label>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    max={90}
                    value={createDaysCount}
                    onChange={(e) => setCreateDaysCount(parseFloat(e.target.value) || 1)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 outline-none focus:border-[#2A7B76]"
                    required
                  />
                </div>

                <div className="flex-1 space-y-1">
                  <label className="font-bold text-stone-700">Décision immédiate</label>
                  <select
                    value={createStatus}
                    onChange={(e) => setCreateStatus(e.target.value as LeaveStatus)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 outline-none focus:border-[#2A7B76]"
                  >
                    <option value="approved">✓ Validé d'office (Par la Direction)</option>
                    <option value="pending">⏳ En attente de décision</option>
                  </select>
                </div>
              </div>

              {/* Motif */}
              <div className="space-y-1">
                <label className="font-bold text-stone-700">Motif &amp; Justification *</label>
                <textarea
                  rows={2}
                  value={createReason}
                  onChange={(e) => setCreateReason(e.target.value)}
                  placeholder="Précisez le motif du congé ou de la permission accordée..."
                  required
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs text-stone-800 resize-none outline-none focus:border-[#2A7B76]"
                />
              </div>

              {/* Commentaire de la direction */}
              <div className="space-y-1">
                <label className="font-bold text-stone-700">Note ou consigne de la Direction (optionnel)</label>
                <input
                  type="text"
                  value={createManagerComment}
                  onChange={(e) => setCreateManagerComment(e.target.value)}
                  placeholder="Ex: Accord exceptionnel de la Direction Générale..."
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 outline-none focus:border-[#2A7B76]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl cursor-pointer transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="px-5 py-2 bg-[#2A7B76] hover:bg-[#20635F] text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  <span>{isSubmittingCreate ? 'Enregistrement...' : 'Enregistrer la permission'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
