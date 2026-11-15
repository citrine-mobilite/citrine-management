import React from 'react';
import { CalendarDays, Calendar, Clock, CheckCircle2, XCircle, Trash2, Plus, ArrowRight, Eye } from 'lucide-react';
import { LeaveRequest, LEAVE_TYPE_LABELS } from '../../../types';

interface EmployeeLeaveListProps {
  filteredLeaves: LeaveRequest[];
  viewDensity: 'compact' | 'detailed';
  searchQuery: string;
  filter: string;
  onSelectLeave: (leave: LeaveRequest) => void;
  onCancelRequest: (id: string) => void;
  onOpenCreateModal: () => void;
}

export const EmployeeLeaveList: React.FC<EmployeeLeaveListProps> = ({
  filteredLeaves,
  viewDensity,
  searchQuery,
  filter,
  onSelectLeave,
  onCancelRequest,
  onOpenCreateModal,
}) => {
  if (filteredLeaves.length === 0) {
    return (
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
            onClick={onOpenCreateModal}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2A7B76] text-white text-xs font-bold shadow-xs hover:bg-[#20615d] transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Créer une première demande</span>
          </button>
        )}
      </div>
    );
  }

  if (viewDensity === 'compact') {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100 shadow-2xs overflow-hidden">
        {filteredLeaves.map((leave) => {
          const isPending = leave.status === 'pending';
          const isApproved = leave.status === 'approved';
          const isModified = leave.status === 'modified';
          const typeCfg = LEAVE_TYPE_LABELS[leave.type] || LEAVE_TYPE_LABELS.autre;

          return (
            <div
              key={leave.id}
              onClick={() => onSelectLeave(leave)}
              className={`group px-4 py-3 transition-colors cursor-pointer flex flex-col ${
                isPending ? 'bg-amber-50/30 hover:bg-amber-50/60'
                  : isApproved ? 'bg-emerald-50/20 hover:bg-emerald-50/40'
                  : isModified ? 'bg-sky-50/20 hover:bg-sky-50/40'
                  : 'bg-white hover:bg-stone-50/80'
              }`}
            >
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isPending ? 'bg-amber-500 ring-4 ring-amber-200/60 animate-pulse'
                        : isApproved ? 'bg-emerald-500 ring-4 ring-emerald-200/60'
                        : isModified ? 'bg-sky-500 ring-4 ring-sky-200/60'
                        : 'bg-rose-500'
                    }`}
                    title={leave.status}
                  />
                  <div className="p-1 rounded-lg bg-stone-100 text-stone-600 shrink-0">
                    <CalendarDays className="w-3.5 h-3.5 text-[#2A7B76]" />
                  </div>
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

                  <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                    isPending ? 'bg-amber-100 text-amber-800' : isApproved ? 'bg-emerald-100 text-emerald-800' : isModified ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {isPending ? 'En attente' : isApproved ? 'Accordée' : isModified ? 'Ajustée' : 'Rejetée'}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono text-stone-400">{leave.createdAt ? leave.createdAt.slice(0, 10) : ''}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onSelectLeave(leave); }}
                    className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                    title="Examiner la demande"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  {isPending && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onCancelRequest(leave.id); }}
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
    );
  }

  return (
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
            onClick={() => onSelectLeave(leave)}
            className={`bg-white rounded-2xl p-4 border shadow-2xs transition flex flex-col justify-between gap-3 cursor-pointer hover:shadow-xs ${
              isPending ? 'border-amber-300 bg-amber-50/20'
                : isApproved ? 'border-emerald-300 bg-emerald-50/20'
                : isModified ? 'border-sky-300 bg-sky-50/20'
                : 'border-rose-300 bg-rose-50/20'
            }`}
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    isPending ? 'bg-amber-500 ring-4 ring-amber-200/60 animate-pulse'
                      : isApproved ? 'bg-emerald-500 ring-4 ring-emerald-200/60'
                      : isModified ? 'bg-sky-500 ring-4 ring-sky-200/60'
                      : 'bg-rose-500'
                  }`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md">
                    {typeCfg.label}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-stone-200/70 text-stone-700">
                    {leave.daysCount} j
                  </span>
                </div>
                <span className="text-[10px] font-mono text-stone-400">{leave.createdAt ? leave.createdAt.slice(0, 10) : ''}</span>
              </div>

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

              <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed bg-white/80 p-2 rounded-xl border border-stone-100">
                <strong className="text-stone-800 font-semibold">Motif : </strong>
                {leave.reason}
              </p>

              {leave.managerComment && (
                <div className="bg-amber-50/70 p-2 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-0.5">
                  <span className="font-bold text-[10px] uppercase block tracking-wider text-amber-800">
                    Décision Direction ({leave.decidedBy || 'Responsable RH'}) :
                  </span>
                  <p className="text-amber-800 leading-relaxed text-[11px]">{leave.managerComment}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
              <span className={`text-[11px] font-bold flex items-center gap-1 ${
                isPending ? 'text-amber-700' : isApproved ? 'text-emerald-700' : isModified ? 'text-sky-700' : 'text-rose-700'
              }`}>
                {isPending && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                {isApproved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                {isModified && <Calendar className="w-3.5 h-3.5 text-sky-600" />}
                {isRejected && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                <span>
                  {isPending ? 'En attente d’arbitrage' : isApproved ? 'Validée officiellement' : isModified ? 'Période réaménagée' : 'Demande non retenue'}
                </span>
              </span>
              <span className="text-[11px] text-[#2A7B76] font-semibold hover:underline">Examiner →</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
