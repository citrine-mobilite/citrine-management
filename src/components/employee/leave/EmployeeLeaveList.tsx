import React from 'react';
import { Calendar, Clock, CheckCircle2, XCircle, Trash2, Plus, ArrowRight, Eye, Flag, AlertCircle } from 'lucide-react';
import { LeaveRequest, LEAVE_TYPE_LABELS } from '../../../types';
import { LeavePaginationBar } from '../../leave/LeavePaginationBar';

interface EmployeeLeaveListProps {
  filteredLeaves: LeaveRequest[];
  totalFilteredCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  viewDensity: 'compact' | 'detailed';
  searchQuery: string;
  filter: string;
  onSelectLeave: (leave: LeaveRequest) => void;
  onCancelRequest: (id: string) => void;
  onOpenCreateModal: () => void;
}

export const EmployeeLeaveList: React.FC<EmployeeLeaveListProps> = ({
  filteredLeaves,
  totalFilteredCount,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  viewDensity,
  searchQuery,
  filter,
  onSelectLeave,
  onCancelRequest,
  onOpenCreateModal,
}) => {
  if (totalFilteredCount === 0) {
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
            type="button"
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

  return (
    <div className="space-y-3">
      {viewDensity === 'compact' ? (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/90 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  <th className="py-2.5 pl-4 pr-3 whitespace-nowrap">Type</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Période</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">Durée</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Motif</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Statut</th>
                  <th className="py-2.5 pl-3 pr-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {filteredLeaves.map((leave) => {
                  const isPending = leave.status === 'pending';
                  const isApproved = leave.status === 'approved';
                  const isModified = leave.status === 'modified';
                  const isTerminee = leave.status === 'terminee';
                  const typeCfg = LEAVE_TYPE_LABELS[leave.type] || LEAVE_TYPE_LABELS.autre;
                  const effectiveDays = leave.approvedDaysCount ?? leave.daysCount;
                  const effectiveStart = isModified && leave.approvedStartDate ? leave.approvedStartDate : leave.startDate;
                  const effectiveEnd = isModified && leave.approvedEndDate ? leave.approvedEndDate : leave.endDate;

                  return (
                    <tr
                      key={leave.id}
                      onClick={() => onSelectLeave(leave)}
                      className={`transition-colors cursor-pointer ${
                        isPending ? 'bg-amber-50/25 hover:bg-amber-50/60' : 'bg-white hover:bg-stone-50/90'
                      }`}
                    >
                      <td className="py-2.5 pl-4 pr-3 whitespace-nowrap font-semibold text-stone-900">
                        {typeCfg.label}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono tabular-nums text-[11px] text-stone-700">
                        {effectiveStart} → {effectiveEnd}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-right font-mono tabular-nums font-bold text-stone-900">
                        {effectiveDays} j
                      </td>
                      <td className="py-2.5 px-3 max-w-[220px]">
                        <p className="text-stone-600 truncate" title={leave.reason}>
                          {leave.reason}
                        </p>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 font-bold text-[11px] ${
                            isPending
                              ? 'text-amber-700'
                              : isApproved
                              ? 'text-emerald-700'
                              : isModified
                              ? 'text-indigo-700'
                              : isTerminee
                              ? 'text-stone-600'
                              : 'text-rose-700'
                          }`}
                        >
                          {isPending && <Clock className="w-3.5 h-3.5 shrink-0" />}
                          {isApproved && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                          {isModified && <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                          {isTerminee && <Flag className="w-3.5 h-3.5 shrink-0" />}
                          {leave.status === 'rejected' && <XCircle className="w-3.5 h-3.5 shrink-0" />}
                          <span>
                            {isPending
                              ? 'En attente'
                              : isApproved
                              ? 'Accordée'
                              : isModified
                              ? 'Ajustée'
                              : isTerminee
                              ? 'Terminée'
                              : 'Refusée'}
                          </span>
                        </span>
                      </td>
                      <td
                        className="py-2.5 pl-3 pr-4 whitespace-nowrap text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onSelectLeave(leave)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition cursor-pointer"
                            title="Examiner la demande"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => onCancelRequest(leave.id)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Annuler cette demande"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <LeavePaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalFilteredCount}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredLeaves.map((leave) => {
              const isPending = leave.status === 'pending';
              const isApproved = leave.status === 'approved';
              const isModified = leave.status === 'modified';
              const isRejected = leave.status === 'rejected';
              const isTerminee = leave.status === 'terminee';
              const typeCfg = LEAVE_TYPE_LABELS[leave.type] || LEAVE_TYPE_LABELS.autre;

              return (
                <div
                  key={leave.id}
                  onClick={() => onSelectLeave(leave)}
                  className="bg-white rounded-2xl p-4 border border-stone-200 hover:border-stone-300 transition flex flex-col justify-between gap-3 cursor-pointer"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-stone-900">{typeCfg.label}</span>
                      <span className="text-[11px] font-mono tabular-nums text-stone-400 shrink-0">
                        {leave.createdAt ? leave.createdAt.slice(0, 10) : ''}
                      </span>
                    </div>

                    <div className="py-2 border-y border-stone-100 text-xs space-y-1">
                      <div className="flex items-center justify-between text-stone-700 font-mono tabular-nums">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-stone-900">
                          <Calendar className="w-3.5 h-3.5 text-[#2A7B76] shrink-0" />
                          <span>{leave.startDate}</span>
                          <ArrowRight className="w-3 h-3 text-stone-400 shrink-0" />
                          <span>{leave.endDate}</span>
                        </span>
                        <span className="font-bold text-stone-900">{leave.daysCount} j</span>
                      </div>

                      {(isApproved || isModified || isTerminee) && (
                        <div className="text-[11px] font-semibold text-emerald-700 flex items-center justify-between font-mono tabular-nums">
                          <span>
                            Accordé : {leave.approvedStartDate || leave.startDate} → {leave.approvedEndDate || leave.endDate}
                          </span>
                          <span>{leave.approvedDaysCount ?? leave.daysCount} j</span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      <strong className="text-stone-800 font-semibold">Motif : </strong>
                      {leave.reason}
                    </p>

                    {leave.managerComment && (
                      <p className="text-[11px] text-amber-800 line-clamp-1">
                        <strong className="text-amber-900">Observation RH : </strong>
                        {leave.managerComment}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                    <span
                      className={`text-[11px] font-bold inline-flex items-center gap-1 ${
                        isPending
                          ? 'text-amber-700'
                          : isApproved
                          ? 'text-emerald-700'
                          : isModified
                          ? 'text-indigo-700'
                          : isTerminee
                          ? 'text-stone-600'
                          : 'text-rose-700'
                      }`}
                    >
                      {isPending && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                      {isApproved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      {isModified && <AlertCircle className="w-3.5 h-3.5 text-indigo-600" />}
                      {isTerminee && <Flag className="w-3.5 h-3.5 text-stone-500" />}
                      {isRejected && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                      <span>
                        {isPending
                          ? 'En attente'
                          : isApproved
                          ? 'Validée'
                          : isModified
                          ? 'Ajustée'
                          : isTerminee
                          ? 'Terminée'
                          : 'Refusée'}
                      </span>
                    </span>
                    <span className="text-[11px] text-[#2A7B76] font-semibold hover:underline">Examiner →</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <LeavePaginationBar
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalFilteredCount}
              pageSize={pageSize}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
            />
          </div>
        </>
      )}
    </div>
  );
};
