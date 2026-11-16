import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Edit3,
  MessageSquare,
  Check,
  X,
  Eye,
  Flag,
} from 'lucide-react';
import { LeaveRequest, LEAVE_TYPE_LABELS, LEAVE_STATUS_LABELS } from '../../types/leaveTypes';

interface LeaveRequestCardProps {
  req: LeaveRequest;
  onOpenAction: (req: LeaveRequest, action: 'approve' | 'reject' | 'modify') => void;
  onViewDetail?: (req: LeaveRequest) => void;
  onTerminateMission?: (req: LeaveRequest) => void;
}

export const LeaveRequestCard: React.FC<LeaveRequestCardProps> = ({
  req,
  onOpenAction,
  onViewDetail,
  onTerminateMission,
}) => {
  const typeCfg = LEAVE_TYPE_LABELS[req.type] || {
    label: req.type,
    badgeColor: 'bg-stone-100 text-stone-800 border-stone-200',
  };
  const statusCfg = LEAVE_STATUS_LABELS[req.status] || {
    label: req.status,
    badgeColor: 'bg-stone-100 text-stone-800 border-stone-200',
  };

  const effectiveStart =
    req.status === 'modified' && req.approvedStartDate ? req.approvedStartDate : req.startDate;
  const effectiveEnd =
    req.status === 'modified' && req.approvedEndDate ? req.approvedEndDate : req.endDate;
  const effectiveDays =
    req.status === 'modified' && req.approvedDaysCount !== undefined
      ? req.approvedDaysCount
      : req.approvedDaysCount ?? req.daysCount;
  const canCloseMission =
    req.type === 'mission_professionnelle' &&
    (req.status === 'approved' || req.status === 'modified') &&
    Boolean(onTerminateMission);

  return (
    <div
      onClick={() => onViewDetail?.(req)}
      className={`p-4 bg-white rounded-2xl border border-stone-200/90 hover:border-stone-300 transition flex flex-col justify-between gap-3 ${
        onViewDetail ? 'cursor-pointer' : ''
      }`}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {req.employeeAvatar ? (
              <img
                src={req.employeeAvatar}
                alt={req.employeeName}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-xl object-cover shrink-0 border border-stone-200"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-[#2A7B76]/10 text-[#2A7B76] font-bold flex items-center justify-center text-xs shrink-0">
                {req.employeeName.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h4 className="font-bold text-sm text-stone-900 truncate">{req.employeeName}</h4>
              <p className="text-[11px] text-stone-500 truncate">
                {req.department || 'Opérations'} · Déposée le{' '}
                <span className="font-mono tabular-nums">{req.createdAt.slice(0, 10)}</span>
              </p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border shrink-0 ${statusCfg.badgeColor}`}
          >
            {req.status === 'approved' && <CheckCircle2 className="h-3 w-3" />}
            {req.status === 'rejected' && <XCircle className="h-3 w-3" />}
            {req.status === 'modified' && <AlertCircle className="h-3 w-3" />}
            {req.status === 'pending' && <Clock className="h-3 w-3" />}
            {req.status === 'terminee' && <Flag className="h-3 w-3" />}
            <span>
              {req.status === 'pending'
                ? 'En attente'
                : req.status === 'approved'
                ? 'Validée'
                : req.status === 'modified'
                ? 'Ajustée'
                : req.status === 'terminee'
                ? 'Clôturée'
                : 'Refusée'}
            </span>
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs py-2 border-y border-stone-100">
          <span className="font-semibold text-stone-800 truncate">{typeCfg.label}</span>
          <span className="font-mono tabular-nums text-[11px] text-stone-700 font-semibold shrink-0">
            {effectiveStart} → {effectiveEnd} · <strong className="text-stone-900">{effectiveDays} j</strong>
          </span>
        </div>

        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">{req.reason}</p>

        {req.managerComment && (
          <div className="text-[11px] text-amber-800 flex items-start gap-1.5 pt-0.5">
            <MessageSquare className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="line-clamp-1">
              <strong className="text-amber-900">{req.decidedBy || 'RH'} :</strong> {req.managerComment}
            </p>
          </div>
        )}
      </div>

      <div
        className="pt-2.5 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onOpenAction(req, 'approve')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Check className="h-3 w-3" />
            <span>Valider</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenAction(req, 'modify')}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[11px] px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Edit3 className="h-3 w-3" />
            <span>Ajuster</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenAction(req, 'reject')}
            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
          >
            <X className="h-3 w-3" />
            <span>Refuser</span>
          </button>

          {canCloseMission && onTerminateMission && (
            <button
              type="button"
              onClick={() => onTerminateMission(req)}
              className="bg-stone-800 hover:bg-stone-900 text-white font-bold text-[11px] px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Flag className="h-3 w-3" />
              <span>Clôturer</span>
            </button>
          )}
        </div>

        {onViewDetail && (
          <button
            type="button"
            onClick={() => onViewDetail(req)}
            className="text-[11px] font-bold text-[#2A7B76] hover:underline inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Eye className="h-3 w-3" />
            <span>Détails</span>
          </button>
        )}
      </div>
    </div>
  );
};
