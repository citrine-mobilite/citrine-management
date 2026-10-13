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
  AlertTriangle, 
  Building, 
  MessageSquare, 
  Check, 
  X, 
  ChevronRight,
  ShieldAlert,
  UserCheck,
  Plus,
  Send,
  Calendar
} from 'lucide-react';
import { 
  LeaveRequest, 
  LeaveType, 
  LeaveStatus, 
  Employee, 
  AppUser, 
  AttendanceIncident, 
  IncidentType,
  NotificationLog, 
  LEAVE_TYPE_LABELS, 
  LEAVE_STATUS_LABELS 
} from '../types';
import { decideLeaveRequest, calculateDaysBetween } from '../services/leaveService';
import { COLLECTIONS, saveDocument } from '../services/dataService';
import { incidentService } from '../services/incidentService';
import { pushNotificationBridgeService } from '../services/pushNotificationBridgeService';

interface LeaveManagementPanelProps {
  leaveRequests: LeaveRequest[];
  employees: Employee[];
  currentUser: AppUser | null;
  onAddAttendanceIncident?: (incident: AttendanceIncident) => void;
  onAddNotification?: (n: NotificationLog) => void;
  showToast?: (title: string, desc: string, type?: 'success' | 'warning' | 'info') => void;
}

export default function LeaveManagementPanel({
  leaveRequests,
  employees,
  currentUser,
  onAddAttendanceIncident,
  onAddNotification,
  showToast,
}: LeaveManagementPanelProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | LeaveStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'modify' | 'incident' | 'manual_incident' | null>(null);

  // Form states for modal actions
  const [managerComment, setManagerComment] = useState('');
  const [modifiedStartDate, setModifiedStartDate] = useState('');
  const [modifiedEndDate, setModifiedEndDate] = useState('');
  const [modifiedDaysCount, setModifiedDaysCount] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Incident form states
  const [manualEmployeeId, setManualEmployeeId] = useState<string>('');
  const [incidentType, setIncidentType] = useState<IncidentType>('absence_injustifiee');
  const [incidentReason, setIncidentReason] = useState('Départ sans validation préalable de la demande de congé / permission');
  const [incidentDate, setIncidentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [incidentTime, setIncidentTime] = useState(() => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
  const [adminComment, setAdminComment] = useState('Signalement consigné manuellement par la direction suite à une absence non validée.');
  const [notifyEmployee, setNotifyEmployee] = useState(true);

  // KPIs
  const stats = useMemo(() => {
    const pending = leaveRequests.filter((l) => l.status === 'pending').length;
    const approved = leaveRequests.filter((l) => l.status === 'approved').length;
    const modified = leaveRequests.filter((l) => l.status === 'modified').length;
    const rejected = leaveRequests.filter((l) => l.status === 'rejected').length;
    const totalDaysApproved = leaveRequests
      .filter((l) => l.status === 'approved' || l.status === 'modified')
      .reduce((sum, l) => sum + (l.approvedDaysCount ?? l.daysCount), 0);

    return { pending, approved, modified, rejected, totalDaysApproved, total: leaveRequests.length };
  }, [leaveRequests]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return leaveRequests.filter((l) => {
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
  }, [leaveRequests, statusFilter, searchQuery]);

  // Open Decision Modal
  const openActionModal = (req: LeaveRequest, action: 'approve' | 'reject' | 'modify' | 'incident') => {
    setSelectedRequest(req);
    setActionType(action);
    setManagerComment('');

    if (action === 'modify') {
      setModifiedStartDate(req.startDate);
      setModifiedEndDate(req.endDate);
      setModifiedDaysCount(req.daysCount);
    } else if (action === 'incident') {
      setManualEmployeeId(req.employeeId);
      setIncidentType('absence_injustifiee');
      setIncidentDate(req.startDate || new Date().toISOString().split('T')[0]);
      setIncidentTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
      setIncidentReason(`Départ en absence constaté sans validation de la direction (Demande de ${req.daysCount} jour(s) du ${req.startDate} au ${req.endDate}).`);
      setAdminComment(`L'employé a sollicité une absence de ${req.daysCount} jour(s) mais est parti sans que l'on ne valide.`);
      setNotifyEmployee(true);
    }
  };

  const openManualIncidentModal = (defaultEmpId?: string) => {
    setSelectedRequest(null);
    setActionType('manual_incident');
    setManualEmployeeId(defaultEmpId || employees[0]?.id || '');
    setIncidentType('absence_injustifiee');
    setIncidentDate(new Date().toISOString().split('T')[0]);
    setIncidentTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    setIncidentReason("Départ en absence constaté sans validation managériale préalable.");
    setAdminComment("Signalement consigné manuellement au registre RH suite à une absence non validée.");
    setNotifyEmployee(true);
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
      } else if (actionType === 'reject') {
        if (!managerComment.trim()) {
          showToast?.('Motif requis', 'Veuillez préciser le motif de refus à communiquer au collaborateur.', 'warning');
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
      }

      closeModal();
    } catch {
      showToast?.('Erreur', 'Impossible de traiter la demande.', 'warning');
      setIsProcessing(false);
    }
  };

  // Submit Manual Incident Report
  const handleConfirmIncident = async () => {
    const targetEmpId = selectedRequest?.employeeId || manualEmployeeId;
    const targetEmp = employees.find((e) => e.id === targetEmpId);
    const targetName = selectedRequest?.employeeName || targetEmp?.name || 'Employé';
    const targetEmail = selectedRequest?.employeeEmail || targetEmp?.email || '';

    if (!targetEmpId) {
      showToast?.('Employé requis', 'Veuillez sélectionner un employé pour ce signalement.', 'warning');
      return;
    }

    if (!incidentReason.trim()) {
      showToast?.('Motif requis', 'Veuillez préciser le motif du signalement.', 'warning');
      return;
    }

    setIsProcessing(true);

    try {
      const now = new Date();
      const newIncident: AttendanceIncident = {
        id: `inc-manual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        employeeId: targetEmpId,
        employeeName: targetName,
        date: incidentDate,
        timeString: incidentTime,
        type: incidentType,
        origin: 'signale_par_responsable',
        reason: incidentReason.trim(),
        isDeclaredInAdvance: false,
        isJustified: false,
        status: 'injustifie',
        createdAt: now.toISOString(),
        adminComment: adminComment.trim() || `Signalement consigné manuellement par ${currentUser?.name || 'la Direction'} suite à une absence non validée.`,
      };

      await incidentService.saveIncident(newIncident);
      if (onAddAttendanceIncident) {
        onAddAttendanceIncident(newIncident);
      }

      if (notifyEmployee) {
        // Envoi de la notification push au collaborateur
        pushNotificationBridgeService.sendPush({
          title: `🚨 Signalement RH : Absence / Manquement`,
          message: `${targetName}, un signalement d'absence non validée a été consigné pour le ${incidentDate}. Motif : ${incidentReason.trim()}`,
          senderName: currentUser?.name || 'Direction RH',
          type: 'alert',
        });

        // Envoi et archivage dans l'onglet des notifications
        const notif: NotificationLog = {
          id: `notif-inc-${newIncident.id}`,
          type: 'system',
          recipient: targetEmail || targetName,
          title: '🚨 Signalement RH d’Absence Non Autorisée',
          content: `Un signalement d'absence non validée a été consigné pour la date du ${incidentDate}. Motif : ${incidentReason.trim()}`,
          payload: JSON.stringify({
            source: 'incident_manual',
            incidentId: newIncident.id,
            employeeId: targetEmpId,
            employeeName: targetName,
            type: incidentType,
            date: incidentDate,
          }),
          timestamp: now.toISOString(),
          read: false,
        };

        await saveDocument(COLLECTIONS.NOTIFICATIONS, notif);
        if (onAddNotification) {
          onAddNotification(notif);
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('citrine:new_unread_alert'));
        }
      }

      showToast?.(
        'Signalement consigné',
        `Le signalement sur ${targetName} a été enregistré dans le registre RH avec succès.`,
        'success'
      );
      closeModal();
    } catch {
      showToast?.('Erreur', 'Impossible de consigner le signalement.', 'warning');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#2A7B76] to-emerald-900 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="h-6 w-6 text-emerald-200" />
            <h2 className="font-serif font-bold text-xl sm:text-2xl">Arbitrage des Congés & Permissions</h2>
          </div>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl">
            Gestion centralisée des demandes d'absence. Validez, refusez ou réajustez la durée accordée. Vous pouvez également consigner manuellement un signalement RH si un employé s'absente sans validation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => openManualIncidentModal()}
            className="bg-amber-400 hover:bg-amber-300 text-stone-900 font-bold px-4 py-2.5 rounded-2xl shadow-sm text-xs flex items-center gap-2 cursor-pointer transition active:scale-95"
            title="Consigner manuellement un manquement ou une absence non validée sur un employé"
          >
            <ShieldAlert className="h-4 w-4 text-stone-900" />
            <span>Nouveau Signalement Manuel</span>
          </button>

          {stats.pending > 0 && (
            <div className="bg-amber-500/20 border border-amber-300/40 text-amber-100 px-3.5 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold">
              <Clock className="h-4 w-4 text-amber-300 animate-pulse" />
              <span>{stats.pending} en attente</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">En attente</span>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-amber-600">{stats.pending}</strong>
            <span className="text-xs text-stone-400">à traiter</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Validées</span>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-emerald-600">{stats.approved}</strong>
            <span className="text-xs text-stone-400">approuvées</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Durée ajustée</span>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-indigo-600">{stats.modified}</strong>
            <span className="text-xs text-stone-400">révisées</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Jours accordés</span>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-[#2A7B76]">{stats.totalDaysApproved}</strong>
            <span className="text-xs text-stone-400">total cumulé</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, département ou motif..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'all', label: 'Toutes' },
            { id: 'pending', label: `En attente (${stats.pending})` },
            { id: 'approved', label: 'Validées' },
            { id: 'modified', label: 'Durée modifiée' },
            { id: 'rejected', label: 'Refusées' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === f.id
                  ? 'bg-[#2A7B76] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table / Requests List */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-2 text-stone-400">
            <CalendarDays className="h-10 w-10 mx-auto text-stone-300" />
            <p className="text-sm font-bold text-stone-700">Aucune demande trouvée</p>
            <p className="text-xs">Aucune demande de congé ne correspond aux filtres actuels.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredRequests.map((req) => {
              const typeCfg = LEAVE_TYPE_LABELS[req.type] || LEAVE_TYPE_LABELS.autre;
              const statusCfg = LEAVE_STATUS_LABELS[req.status] || LEAVE_STATUS_LABELS.pending;

              return (
                <div key={req.id} className="p-4 sm:p-5 hover:bg-stone-50/70 transition space-y-3">
                  {/* Row Top Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {req.employeeAvatar ? (
                        <img
                          src={req.employeeAvatar}
                          alt={req.employeeName}
                          className="w-10 h-10 rounded-2xl object-cover border border-stone-200 shadow-2xs shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-2xl bg-[#2A7B76]/10 text-[#2A7B76] flex items-center justify-center font-bold text-sm shrink-0">
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

                    {/* Status & Badges */}
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
                    {/* Requested Period */}
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">Période sollicitée</span>
                      <p className="font-bold text-stone-800">
                        Du <strong className="text-stone-900">{req.startDate}</strong> au <strong className="text-stone-900">{req.endDate}</strong>
                      </p>
                      <span className="inline-block mt-1 bg-stone-200 text-stone-700 px-2 py-0.5 rounded-md text-[10px] font-mono">
                        {req.daysCount} jour(s)
                      </span>
                    </div>

                    {/* Approved / Modified Period if applicable */}
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

                    {/* Decider Metadata */}
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

                  {/* Reason & Comment text */}
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
                      {/* Valider */}
                      <button
                        onClick={() => openActionModal(req, 'approve')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Valider</span>
                      </button>

                      {/* Modifier la durée */}
                      <button
                        onClick={() => openActionModal(req, 'modify')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                        title="Ajuster les dates ou le nombre de jours accordés"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Modifier la durée</span>
                      </button>

                      {/* Refuser */}
                      <button
                        onClick={() => openActionModal(req, 'reject')}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Refuser</span>
                      </button>
                    </div>

                    {/* ACTION MANUELLE : Créer un signalement sur l'employé */}
                    <button
                      onClick={() => openActionModal(req, 'incident')}
                      className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ml-auto"
                      title="Créer manuellement un signalement RH sur cet employé (ex: départ sans validation)"
                    >
                      <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                      <span>Signaler une absence non autorisée</span>
                    </button>
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
              <button onClick={closeModal} className="p-1 text-stone-400 hover:text-stone-700">
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
              <button onClick={closeModal} className="px-4 py-2 bg-stone-100 text-stone-700 text-xs font-bold rounded-xl">
                Annuler
              </button>
              <button
                onClick={handleConfirmDecision}
                disabled={isProcessing}
                className={`px-5 py-2 text-white text-xs font-bold rounded-xl transition ${
                  actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
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
              <button onClick={closeModal} className="p-1 text-stone-400 hover:text-stone-700">
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
              <button onClick={closeModal} className="px-4 py-2 bg-stone-100 text-stone-700 text-xs font-bold rounded-xl">
                Annuler
              </button>
              <button
                onClick={handleConfirmDecision}
                disabled={isProcessing}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition"
              >
                {isProcessing ? 'Enregistrement...' : 'Valider la durée modifiée'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3 : Création d'un signalement RH (manuel ou depuis une demande de congé) */}
      {(actionType === 'incident' || actionType === 'manual_incident') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-3 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-stone-200 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-serif font-bold text-base text-amber-900 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-600" />
                <span>
                  {actionType === 'incident'
                    ? "Consigner un signalement d'absence non validée"
                    : "Nouveau signalement manuel sur un employé"}
                </span>
              </h3>
              <button onClick={closeModal} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Context Box */}
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-xs text-amber-900 space-y-1">
              <p className="font-bold">Cas d'usage RH :</p>
              <p className="text-amber-800 leading-relaxed">
                {selectedRequest
                  ? `Si le collaborateur ${selectedRequest.employeeName} est parti en congé/permission sans validation de sa hiérarchie, ce signalement sera consigné officiellement dans son dossier et visible dans ses alertes.`
                  : "Consignez manuellement une absence constatée, un départ anticipé ou un manquement disciplinaire sur le dossier d'un collaborateur."}
              </p>
            </div>

            {/* Employee Selector */}
            <div className="space-y-1 text-xs">
              <label className="font-bold text-stone-700">Collaborateur concerné *</label>
              {actionType === 'manual_incident' ? (
                <select
                  value={manualEmployeeId}
                  onChange={(e) => setManualEmployeeId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#2A7B76]"
                >
                  <option value="">Sélectionnez un collaborateur...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.roleType || 'Employé'}) - {emp.department || 'Opérations'}
                    </option>
                  ))}
                </select>
              ) : selectedRequest ? (
                <div className="flex items-center gap-3 p-2.5 bg-stone-50 border border-stone-200 rounded-xl">
                  {selectedRequest.employeeAvatar ? (
                    <img
                      src={selectedRequest.employeeAvatar}
                      alt={selectedRequest.employeeName}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-[#2A7B76]/10 text-[#2A7B76] font-bold flex items-center justify-center text-xs">
                      {selectedRequest.employeeName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <strong className="text-stone-900 block font-bold text-xs">{selectedRequest.employeeName}</strong>
                    <span className="text-[10px] text-stone-500">
                      Demande de {selectedRequest.daysCount} jour(s) du {selectedRequest.startDate} au {selectedRequest.endDate}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Incident Type */}
            <div className="space-y-1 text-xs">
              <label className="font-bold text-stone-700">Type de signalement / anomalie</label>
              <select
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value as IncidentType)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#2A7B76]"
              >
                <option value="absence_injustifiee">Absence injustifiée / Départ sans validation</option>
                <option value="depart_sans_validation">Départ avant approbation de la demande</option>
                <option value="depart_anticipe">Départ anticipé non autorisé</option>
                <option value="sortie_prematuree">Sortie de poste non autorisée</option>
                <option value="retard">Retard constaté non justifié</option>
                <option value="autre">Autre manquement aux consignes</option>
              </select>
            </div>

            {/* Date & Time Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700">Date du constat</label>
                <input
                  type="date"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Heure du constat</label>
                <input
                  type="time"
                  value={incidentTime}
                  onChange={(e) => setIncidentTime(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-800"
                />
              </div>
            </div>

            {/* Suggestion Chips */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-stone-600 text-[11px]">Suggestions rapides de motif :</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Demande d'absence déposée mais départ constaté sans validation hiérarchique.",
                  "Absence de 2 jours constatée sans justificatif ni accord managérial.",
                  "Départ avant validation de la direction suite à demande de permission.",
                  "Absence injustifiée constatée au poste de travail.",
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setIncidentReason(preset)}
                    className="text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-700 px-2.5 py-1 rounded-lg transition text-left cursor-pointer"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason Textarea */}
            <div className="space-y-1 text-xs">
              <label className="font-bold text-stone-700">Description détaillée des faits constatés *</label>
              <textarea
                rows={3}
                value={incidentReason}
                onChange={(e) => setIncidentReason(e.target.value)}
                placeholder="Précisez les circonstances de l'absence non autorisée..."
                required
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 resize-none focus:outline-none focus:border-[#2A7B76]"
              />
            </div>

            {/* Admin Observation */}
            <div className="space-y-1 text-xs">
              <label className="font-bold text-stone-700">Mention administrative / Observation RH</label>
              <input
                type="text"
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                placeholder="Mention administrative interne..."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-[#2A7B76]"
              />
            </div>

            {/* Notify Toggle */}
            <label className="flex items-center gap-2 p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyEmployee}
                onChange={(e) => setNotifyEmployee(e.target.checked)}
                className="rounded text-[#2A7B76] focus:ring-[#2A7B76] h-4 w-4"
              />
              <span className="font-medium">
                Envoyer une alerte push et une notification formelle dans l'espace de l'employé
              </span>
            </label>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmIncident}
                disabled={isProcessing}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <ShieldAlert className="h-4 w-4" />
                <span>{isProcessing ? 'Enregistrement...' : 'Enregistrer le signalement RH'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
