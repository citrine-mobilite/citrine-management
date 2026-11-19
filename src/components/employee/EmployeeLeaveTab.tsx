import React, { useState, useMemo } from 'react';
import { 
  CalendarDays, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  FileText, 
  Trash2, 
  Plus, 
  Search, 
  X, 
  ArrowRight, 
  MessageSquare, 
  Sparkles, 
  LayoutList, 
  LayoutGrid,
  Info,
  CheckCheck,
  Eye,
  ShieldCheck,
  Hourglass,
  Tag
} from 'lucide-react';
import { SearchableSelect } from '../common/SearchableSelect';
import { 
  Employee, 
  AppUser, 
  LeaveRequest, 
  LeaveType, 
  NotificationLog, 
  LEAVE_TYPE_LABELS 
} from '../../types';
import { createLeaveRequest, deleteLeaveRequest, calculateDaysBetween } from '../../services/leaveService';

interface EmployeeLeaveTabProps {
  employeeProfile: Employee;
  currentUser?: AppUser | null;
  leaveRequests: LeaveRequest[];
  onAddNotification?: (n: NotificationLog) => void;
  showToast?: (title: string, desc: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export const EmployeeLeaveTab: React.FC<EmployeeLeaveTabProps> = ({
  employeeProfile,
  currentUser,
  leaveRequests = [],
  onAddNotification,
  showToast,
}) => {
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedLeaveModal, setSelectedLeaveModal] = useState<LeaveRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View density: 'compact' or 'detailed' (exact same as in EmployeeAlertsTab)
  const [viewDensity, setViewDensity] = useState<'compact' | 'detailed'>('compact');

  // Filters & search query
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'modified' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [leaveType, setLeaveType] = useState<LeaveType>('conge_annuel');
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

  // Demandes de l'employé connecté
  const myLeaves = useMemo(() => {
    return (leaveRequests || []).filter(
      (l) => l.employeeId === employeeProfile.id || l.employeeEmail === employeeProfile.email
    );
  }, [leaveRequests, employeeProfile]);

  // Statistiques pour les pastilles et le ruban
  const stats = useMemo(() => {
    const pending = myLeaves.filter((l) => l.status === 'pending').length;
    const approved = myLeaves.filter((l) => l.status === 'approved').length;
    const modified = myLeaves.filter((l) => l.status === 'modified').length;
    const rejected = myLeaves.filter((l) => l.status === 'rejected').length;
    const totalDaysTaken = myLeaves
      .filter((l) => l.status === 'approved' || l.status === 'modified')
      .reduce((sum, l) => sum + (l.approvedDaysCount ?? l.daysCount), 0);

    return { pending, approved, modified, rejected, totalDaysTaken, total: myLeaves.length };
  }, [myLeaves]);

  // Demandes filtrées
  const filteredLeaves = useMemo(() => {
    return myLeaves.filter((leave) => {
      // Filtre statut
      if (filter !== 'all' && leave.status !== filter) {
        return false;
      }

      // Recherche texte
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const typeLabel = (LEAVE_TYPE_LABELS[leave.type]?.label || '').toLowerCase();
        const reasonText = (leave.reason || '').toLowerCase();
        const dates = `${leave.startDate} ${leave.endDate}`.toLowerCase();
        const comment = (leave.managerComment || '').toLowerCase();
        if (
          !typeLabel.includes(q) &&
          !reasonText.includes(q) &&
          !dates.includes(q) &&
          !comment.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [myLeaves, filter, searchQuery]);

  // Durée calculée en jours ouvrés estimés
  const currentDurationDays = useMemo(() => {
    return calculateDaysBetween(startDate, endDate);
  }, [startDate, endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      showToast?.(
        'Motif requis',
        'Veuillez renseigner le motif explicatif de votre demande de permission.',
        'warning'
      );
      return;
    }

    if (startDate > endDate) {
      showToast?.(
        'Dates incohérentes',
        'La date de fin ne peut pas précéder la date de début.',
        'warning'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const typeLabel = LEAVE_TYPE_LABELS[leaveType]?.label || 'Congé';
      await createLeaveRequest(
        {
          employeeId: employeeProfile.id,
          employeeName: employeeProfile.name,
          employeeEmail: employeeProfile.email,
          employeeAvatar: employeeProfile.avatarUrl,
          department: employeeProfile.department || 'Opérations',
          type: leaveType,
          startDate,
          endDate,
          daysCount: currentDurationDays,
          reason: reason.trim(),
          attachmentName: attachmentName.trim() || undefined,
        },
        onAddNotification
      );

      showToast?.(
        'Demande de permission transmise',
        `Votre demande de ${typeLabel} (${currentDurationDays} jour${currentDurationDays > 1 ? 's' : ''}) du ${startDate} au ${endDate} a bien été enregistrée et transmise à la Direction RH.`,
        'success'
      );
      setShowModal(false);
      setReason('');
      setAttachmentName('');
    } catch {
      showToast?.(
        'Échec de transmission',
        'Impossible de transmettre la demande pour le moment. Veuillez vérifier votre connexion.',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRequest = async (leaveId: string) => {
    if (confirm('Voulez-vous vraiment annuler cette demande de permission ?')) {
      try {
        await deleteLeaveRequest(leaveId);
        if (selectedLeaveModal?.id === leaveId) {
          setSelectedLeaveModal(null);
        }
        showToast?.(
          'Demande annulée',
          'La demande de permission a été retirée avec succès de votre dossier.',
          'info'
        );
      } catch {
        showToast?.(
          'Erreur d’annulation',
          'Impossible d’annuler cette demande pour le moment.',
          'error'
        );
      }
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 max-w-5xl mx-auto pb-10">
      {/* Top Header Card (IDENTICAL TO EMPLOYEE ALERTS TAB) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-stone-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-50 text-[#2A7B76] border border-teal-100 rounded-2xl shrink-0">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-serif font-bold text-stone-900">
                Demandes de Permission & Congés
              </h2>
              {stats.pending > 0 ? (
                <span className="bg-amber-100 text-amber-800 border border-amber-300 text-xs px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                  {stats.pending} en attente
                </span>
              ) : (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2 py-0.5 rounded-full font-semibold">
                  Toutes arbitrées ✓
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Suivi des autorisations d&apos;absence, congés payés, permissions et soldes de jours
            </p>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-between md:justify-end">
          {/* Total Days Count Ribbon */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 border border-stone-200 text-xs text-stone-700 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#2A7B76]" />
            <span>Accordé : <strong className="font-mono text-stone-900">{stats.totalDaysTaken} j</strong></span>
          </div>

          {/* Density Switcher */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200 text-xs">
            <button
              type="button"
              onClick={() => setViewDensity('compact')}
              title="Vue Compacte (en liste synthétique)"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewDensity === 'compact'
                  ? 'bg-white text-stone-900 shadow-2xs font-bold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewDensity('detailed')}
              title="Vue Détaillée (en cartes spatiales)"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewDensity === 'detailed'
                  ? 'bg-white text-stone-900 shadow-2xs font-bold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Create Request button */}
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="bg-[#2A7B76] hover:bg-[#20615d] text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Nouvelle demande</span>
          </button>
        </div>
      </div>

      {/* Filter and Quick Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Filter Pills with Counts */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-stone-100 rounded-2xl border border-stone-200 text-xs scrollbar-none">
          {[
            { id: 'all', label: 'Toutes', count: stats.total },
            { id: 'pending', label: 'En attente', count: stats.pending },
            { id: 'approved', label: 'Accordées', count: stats.approved },
            { id: 'modified', label: 'Ajustées', count: stats.modified },
            { id: 'rejected', label: 'Rejetées', count: stats.rejected },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                filter === item.id
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>{item.label}</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                filter === item.id ? 'bg-stone-100 text-stone-800' : 'bg-stone-200/70 text-stone-600'
              }`}>
                {item.count}
              </span>
            </button>
          ))}
        </div>

        {/* Quick Search */}
        <div className="relative sm:w-64">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher une demande..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#2A7B76]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Leave Request List */}
      {filteredLeaves.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-stone-200 shadow-2xs space-y-3">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-stone-800 text-sm">Aucune demande trouvée</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {searchQuery
              ? `Aucun résultat pour "${searchQuery}". Essayez un autre terme de recherche.`
              : 'Toutes vos demandes de congé et permission sont synchronisées.'}
          </p>
          {!searchQuery && filter === 'all' && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2A7B76] text-white text-xs font-bold shadow-xs hover:bg-[#20615d] transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Créer une première demande</span>
            </button>
          )}
        </div>
      ) : viewDensity === 'compact' ? (
        /* ================= VUE COMPACTE (EXACTEMENT COMME DANS ALERTE) ================= */
        <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100 shadow-2xs overflow-hidden">
          {filteredLeaves.map((leave) => {
            const isPending = leave.status === 'pending';
            const isApproved = leave.status === 'approved';
            const isModified = leave.status === 'modified';
            const isRejected = leave.status === 'rejected';
            const typeCfg = LEAVE_TYPE_LABELS[leave.type] || LEAVE_TYPE_LABELS.autre;

            return (
              <div
                key={leave.id}
                onClick={() => setSelectedLeaveModal(leave)}
                className={`group px-4 py-3 transition-colors cursor-pointer flex flex-col ${
                  isPending
                    ? 'bg-amber-50/30 hover:bg-amber-50/60'
                    : isApproved
                      ? 'bg-emerald-50/20 hover:bg-emerald-50/40'
                      : isModified
                        ? 'bg-sky-50/20 hover:bg-sky-50/40'
                        : 'bg-white hover:bg-stone-50/80'
                }`}
              >
                {/* One-line compact row */}
                <div className="flex items-center justify-between gap-3 text-xs">
                  {/* Left: Indicator Dot & Icon */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isPending
                          ? 'bg-amber-500 ring-4 ring-amber-200/60 animate-pulse'
                          : isApproved
                            ? 'bg-emerald-500 ring-4 ring-emerald-200/60'
                            : isModified
                              ? 'bg-sky-500 ring-4 ring-sky-200/60'
                              : 'bg-rose-500'
                      }`}
                      title={leave.status}
                    />

                    <div className="p-1 rounded-lg bg-stone-100 text-stone-600 shrink-0">
                      <CalendarDays className="w-3.5 h-3.5 text-[#2A7B76]" />
                    </div>

                    {/* Title & Preview */}
                    <div className="min-w-0 flex items-center gap-2 truncate">
                      <span className={`truncate text-xs ${isPending ? 'font-bold text-stone-900' : 'font-medium text-stone-700'}`}>
                        {typeCfg.label}
                      </span>
                      <span className="hidden sm:inline font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-stone-100 text-stone-700">
                        {leave.approvedDaysCount ?? leave.daysCount} j
                      </span>
                      <span className="hidden md:inline text-stone-400">·</span>
                      <span className="hidden md:inline text-[11px] text-stone-500 truncate max-w-sm">
                        Du {leave.startDate} au {leave.endDate} • {leave.reason}
                      </span>
                    </div>

                    {/* Category / Status Pill */}
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                        isPending
                          ? 'bg-amber-100 text-amber-800'
                          : isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : isModified
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isPending
                        ? 'En attente'
                        : isApproved
                          ? 'Accordée'
                          : isModified
                            ? 'Ajustée'
                            : 'Rejetée'}
                    </span>
                  </div>

                  {/* Right: Timestamp & Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-stone-400">
                      {leave.createdAt ? leave.createdAt.slice(0, 10) : ''}
                    </span>

                    {/* View Eye Icon */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLeaveModal(leave);
                      }}
                      className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                      title="Examiner la demande"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {/* Cancel action if pending */}
                    {isPending && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelRequest(leave.id);
                        }}
                        className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Annuler cette demande"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= VUE DÉTAILLÉE (CARTES SPATIALES POLIES) ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredLeaves.map((leave) => {
            const isPending = leave.status === 'pending';
            const isApproved = leave.status === 'approved';
            const isModified = leave.status === 'modified';
            const isRejected = leave.status === 'rejected';
            const typeCfg = LEAVE_TYPE_LABELS[leave.type] || LEAVE_TYPE_LABELS.autre;

            return (
              <div
                key={leave.id}
                onClick={() => setSelectedLeaveModal(leave)}
                className={`bg-white rounded-2xl p-4 border shadow-2xs transition flex flex-col justify-between gap-3 cursor-pointer hover:shadow-xs ${
                  isPending
                    ? 'border-amber-300 bg-amber-50/20'
                    : isApproved
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : isModified
                        ? 'border-sky-300 bg-sky-50/20'
                        : 'border-rose-300 bg-rose-50/20'
                }`}
              >
                <div className="space-y-2.5">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isPending
                            ? 'bg-amber-500 ring-4 ring-amber-200/60 animate-pulse'
                            : isApproved
                              ? 'bg-emerald-500 ring-4 ring-emerald-200/60'
                              : isModified
                                ? 'bg-sky-500 ring-4 ring-sky-200/60'
                                : 'bg-rose-500'
                        }`}
                      />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md">
                        {typeCfg.label}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-stone-200/70 text-stone-700">
                        {leave.daysCount} j
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-stone-400">
                      {leave.createdAt ? leave.createdAt.slice(0, 10) : ''}
                    </span>
                  </div>

                  {/* Dates Box */}
                  <div className="bg-stone-50/90 p-2.5 rounded-xl border border-stone-200/70 text-xs space-y-1">
                    <div className="flex items-center justify-between text-stone-700">
                      <span className="text-[10px] uppercase font-bold text-stone-400">Période sollicitée</span>
                      <span className="font-mono text-[10px] text-stone-500">{leave.daysCount} jour(s)</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-bold text-stone-900 text-xs">
                      <Calendar className="w-3.5 h-3.5 text-[#2A7B76] shrink-0" />
                      <span>Du {leave.startDate}</span>
                      <ArrowRight className="w-3 h-3 text-stone-400 shrink-0" />
                      <span>Au {leave.endDate}</span>
                    </div>

                    {(isApproved || isModified) && (
                      <div className="pt-1 mt-1 border-t border-stone-200/60">
                        <span className="text-[10px] uppercase font-bold text-emerald-600 block">
                          {isModified ? 'Période réaménagée accordée' : 'Période validée'}
                        </span>
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Du {leave.approvedStartDate || leave.startDate} au {leave.approvedEndDate || leave.endDate}</span>
                          <span className="bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded text-[10px] font-mono">
                            {leave.approvedDaysCount ?? leave.daysCount} j
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reason Preview */}
                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed bg-white/80 p-2 rounded-xl border border-stone-100">
                    <strong className="text-stone-800 font-semibold">Motif : </strong>
                    {leave.reason}
                  </p>

                  {/* Manager Feedback */}
                  {leave.managerComment && (
                    <div className="bg-amber-50/70 p-2 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-0.5">
                      <span className="font-bold text-[10px] uppercase block tracking-wider text-amber-800">
                        Décision Direction ({leave.decidedBy || 'Responsable RH'}) :
                      </span>
                      <p className="text-amber-800 leading-relaxed text-[11px]">{leave.managerComment}</p>
                    </div>
                  )}
                </div>

                {/* Footer of card */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                  <span
                    className={`text-[11px] font-bold flex items-center gap-1 ${
                      isPending
                        ? 'text-amber-700'
                        : isApproved
                          ? 'text-emerald-700'
                          : isModified
                            ? 'text-sky-700'
                            : 'text-rose-700'
                    }`}
                  >
                    {isPending && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                    {isApproved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    {isModified && <Sparkles className="w-3.5 h-3.5 text-sky-600" />}
                    {isRejected && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                    <span>
                      {isPending
                        ? 'En attente d’arbitrage'
                        : isApproved
                          ? 'Validée officiellement'
                          : isModified
                            ? 'Période réaménagée'
                            : 'Demande non retenue'}
                    </span>
                  </span>

                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-[#2A7B76] font-semibold hover:underline">
                      Examiner →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL DE DÉTAIL D'UNE DEMANDE (IDENTIQUE AUX ALERTES) ================= */}
      {selectedLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-3 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 border border-stone-200 shadow-2xl relative animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#2A7B76] border border-teal-100 flex items-center justify-center shrink-0">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-stone-900 text-base">
                    Dossier de Permission & Absence
                  </h3>
                  <p className="text-xs text-stone-500 font-mono">
                    Réf : {selectedLeaveModal.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLeaveModal(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Status Banner */}
            <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
              selectedLeaveModal.status === 'pending'
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : selectedLeaveModal.status === 'approved'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : selectedLeaveModal.status === 'modified'
                    ? 'bg-sky-50 text-sky-900 border-sky-200'
                    : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}>
              {selectedLeaveModal.status === 'pending' && <Hourglass className="w-5 h-5 text-amber-600 shrink-0" />}
              {selectedLeaveModal.status === 'approved' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
              {selectedLeaveModal.status === 'modified' && <Sparkles className="w-5 h-5 text-sky-600 shrink-0" />}
              {selectedLeaveModal.status === 'rejected' && <XCircle className="w-5 h-5 text-rose-600 shrink-0" />}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider">
                  {selectedLeaveModal.status === 'pending'
                    ? 'En cours d’arbitrage par la Direction RH'
                    : selectedLeaveModal.status === 'approved'
                      ? 'Demande officiellement accordée'
                      : selectedLeaveModal.status === 'modified'
                        ? 'Demande accordée avec aménagement de dates'
                        : 'Demande non retenue'}
                </h4>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {selectedLeaveModal.status === 'pending'
                    ? 'Votre responsable hiérarchique examine votre demande.'
                    : selectedLeaveModal.status === 'approved'
                      ? 'L’absence a été enregistrée au registre officiel des présences.'
                      : selectedLeaveModal.status === 'modified'
                        ? 'Consultez les dates réaménagées ci-dessous.'
                        : 'Cette demande n’a pas pu être validée par la direction.'}
                </p>
              </div>
            </div>

            {/* Request Details Grid */}
            <div className="space-y-3 text-xs">
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between text-stone-600">
                  <span className="font-semibold text-stone-500">Nature du congé :</span>
                  <span className="font-bold text-stone-900">
                    {LEAVE_TYPE_LABELS[selectedLeaveModal.type]?.label || selectedLeaveModal.type}
                  </span>
                </div>
                <div className="flex items-center justify-between text-stone-600">
                  <span className="font-semibold text-stone-500">Période sollicitée :</span>
                  <span className="font-bold text-stone-900">
                    Du {selectedLeaveModal.startDate} au {selectedLeaveModal.endDate} ({selectedLeaveModal.daysCount} jour{selectedLeaveModal.daysCount > 1 ? 's' : ''})
                  </span>
                </div>
                {(selectedLeaveModal.status === 'approved' || selectedLeaveModal.status === 'modified') && (
                  <div className="flex items-center justify-between text-emerald-800 pt-1 border-t border-stone-200 font-bold">
                    <span>Période autorisée :</span>
                    <span>
                      Du {selectedLeaveModal.approvedStartDate || selectedLeaveModal.startDate} au {selectedLeaveModal.approvedEndDate || selectedLeaveModal.endDate} ({selectedLeaveModal.approvedDaysCount ?? selectedLeaveModal.daysCount} j)
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-stone-600 pt-1 border-t border-stone-200">
                  <span className="font-semibold text-stone-500">Date de dépôt :</span>
                  <span className="font-mono text-stone-700">
                    {selectedLeaveModal.createdAt ? new Date(selectedLeaveModal.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Employee Reason */}
              <div className="space-y-1">
                <span className="font-bold text-stone-700 text-xs block">Motif de la demande :</span>
                <p className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-stone-800 leading-relaxed">
                  {selectedLeaveModal.reason}
                </p>
              </div>

              {/* Manager decision commentary if any */}
              {selectedLeaveModal.managerComment && (
                <div className="space-y-1">
                  <span className="font-bold text-amber-800 text-xs block">
                    Remarque de la hiérarchie ({selectedLeaveModal.decidedBy || 'Responsable RH'}) :
                  </span>
                  <p className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 leading-relaxed">
                    {selectedLeaveModal.managerComment}
                  </p>
                </div>
              )}

              {/* Attachment if any */}
              {selectedLeaveModal.attachmentName && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#2A7B76]" />
                    <span className="text-stone-700 font-medium">{selectedLeaveModal.attachmentName}</span>
                  </div>
                  <span className="text-[10px] bg-stone-200 px-2 py-0.5 rounded text-stone-600 font-bold">
                    Justificatif joint
                  </span>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-stone-100">
              {selectedLeaveModal.status === 'pending' ? (
                <button
                  type="button"
                  onClick={() => handleCancelRequest(selectedLeaveModal.id)}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer border border-rose-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Annuler cette demande</span>
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={() => setSelectedLeaveModal(null)}
                className="px-5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL : NOUVELLE DEMANDE ================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-3 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 border border-stone-200 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#2A7B76] border border-teal-100 flex items-center justify-center">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-stone-900 text-base">
                    Déposer une demande de permission / congé
                  </h3>
                  <p className="text-[11px] text-stone-500">Transmise directement à votre responsable hiérarchique</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Type de congé */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">Type de congé / permission *</label>
                <SearchableSelect
                  options={[
                    { value: 'conge_annuel', label: '🌴 Congé annuel payé' },
                    { value: 'permission_exceptionnelle', label: '💍 Permission exceptionnelle (Mariage, Décès, Naissance)' },
                    { value: 'maladie', label: '🏥 Arrêt maladie / Rendez-vous médical' },
                    { value: 'recuperation', label: '⏰ Repos compensateur / Récupération' },
                    { value: 'sans_solde', label: '📋 Congé sans solde' },
                    { value: 'maternite_paternite', label: '👶 Maternité / Paternité' },
                    { value: 'autre', label: '📝 Autre motif personnel' },
                  ]}
                  value={leaveType}
                  onChange={(val) => setLeaveType(val as LeaveType)}
                  placeholder="Sélectionner le type de congé"
                  searchPlaceholder="Rechercher un type..."
                />
              </div>

              {/* Date début & fin */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Date de début *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 focus:outline-none focus:border-[#2A7B76]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Date de fin *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 focus:outline-none focus:border-[#2A7B76]"
                  />
                </div>
              </div>

              {/* Durée calculée */}
              <div className="bg-emerald-50/80 border border-emerald-200/60 p-3 rounded-2xl flex items-center justify-between text-emerald-900">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  <span className="font-bold text-xs">Durée estimée :</span>
                </div>
                <span className="text-sm font-black text-emerald-800 font-mono">
                  {currentDurationDays} jour{currentDurationDays > 1 ? 's' : ''}
                </span>
              </div>

              {/* Motif */}
              <div className="space-y-1">
                <label className="font-bold text-stone-700">Motif explicatif précis *</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Expliquez la raison de votre demande de permission..."
                  required
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-800 focus:outline-none focus:border-[#2A7B76] resize-none"
                />
              </div>

              {/* Justificatif optionnel */}
              <div className="space-y-1">
                <label className="font-bold text-stone-700">Référence justificatif (facultatif)</label>
                <input
                  type="text"
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                  placeholder="Ex: Certificat médical #492, Faire-part..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-[#2A7B76]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold rounded-xl text-xs transition shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isSubmitting ? 'Envoi...' : 'Transmettre ma demande'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
