import React from 'react';
import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Edit3,
  Flag,
  MessageSquare,
  Paperclip,
  X,
  XCircle,
} from 'lucide-react';
import { LeaveRequest, LEAVE_STATUS_LABELS, LEAVE_TYPE_LABELS } from '../../types/leaveTypes';

interface LeaveRequestDetailModalProps {
  request: LeaveRequest | null;
  onClose: () => void;
  onOpenAction: (req: LeaveRequest, action: 'approve' | 'reject' | 'modify') => void;
  onTerminateMission?: (req: LeaveRequest) => void;
}

export const LeaveRequestDetailModal: React.FC<LeaveRequestDetailModalProps> = ({
  request,
  onClose,
  onOpenAction,
  onTerminateMission,
}) => {
  if (!request) return null;

  const typeCfg = LEAVE_TYPE_LABELS[request.type] || {
    label: request.type,
    badgeColor: 'bg-stone-100 text-stone-800 border-stone-200',
  };
  const statusCfg = LEAVE_STATUS_LABELS[request.status] || {
    label: request.status,
    badgeColor: 'bg-stone-100 text-stone-800 border-stone-200',
  };

  const canCloseMission =
    request.type === 'mission_professionnelle' &&
    (request.status === 'approved' || request.status === 'modified') &&
    Boolean(onTerminateMission);

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/55 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3 min-w-0">
            {request.employeeAvatar ? (
              <img
                src={request.employeeAvatar}
                alt={request.employeeName}
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-2xl object-cover shrink-0 border border-stone-200"
              />
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-[#2A7B76]/10 text-[#2A7B76] font-bold flex items-center justify-center text-base shrink-0">
                {request.employeeName.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-serif font-bold text-base text-stone-900 truncate">
                {request.employeeName}
              </h3>
              <p className="text-xs text-stone-500">
                {request.department || 'Opérations'} · Déposée le{' '}
                <span className="font-mono tabular-nums">{request.createdAt.slice(0, 10)}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer shrink-0"
            title="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-stone-700">
            <CalendarDays className="h-4 w-4 text-[#2A7B76] shrink-0" />
            <span className="font-bold text-stone-900">{typeCfg.label}</span>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${statusCfg.badgeColor}`}
          >
            {request.status === 'approved' && <CheckCircle2 className="h-3.5 w-3.5" />}
            {request.status === 'rejected' && <XCircle className="h-3.5 w-3.5" />}
            {request.status === 'modified' && <AlertCircle className="h-3.5 w-3.5" />}
            {request.status === 'pending' && <Clock className="h-3.5 w-3.5" />}
            {request.status === 'terminee' && <Flag className="h-3.5 w-3.5" />}
            <span>{statusCfg.label}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3 border-y border-stone-100 text-xs">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              Période sollicitée
            </span>
            <p className="font-bold text-stone-900 font-mono tabular-nums">
              Du {request.startDate} au {request.endDate}
            </p>
            <p className="text-stone-600 font-mono tabular-nums">
              Durée demandée : <strong>{request.daysCount} jour(s)</strong>
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              Arbitrage RH
            </span>
            {request.status === 'modified' ? (
              <>
                <p className="font-bold text-indigo-700 font-mono tabular-nums">
                  Du {request.approvedStartDate || request.startDate} au{' '}
                  {request.approvedEndDate || request.endDate}
                </p>
                <p className="text-indigo-700 font-mono tabular-nums">
                  Accordé : <strong>{request.approvedDaysCount ?? request.daysCount} jour(s)</strong>
                </p>
              </>
            ) : request.status === 'approved' || request.status === 'terminee' ? (
              <>
                <p className="font-bold text-emerald-700 font-mono tabular-nums">
                  {request.approvedDaysCount ?? request.daysCount} jour(s) validé(s)
                </p>
                {request.decidedBy && (
                  <p className="text-stone-500">
                    Par {request.decidedBy} le{' '}
                    <span className="font-mono tabular-nums">{request.decidedAt?.slice(0, 10) || '—'}</span>
                  </p>
                )}
              </>
            ) : request.status === 'rejected' ? (
              <p className="font-bold text-rose-700">
                Refusée{request.decidedBy ? ` par ${request.decidedBy}` : ''}
              </p>
            ) : (
              <p className="text-amber-700 font-semibold">En attente de validation hiérarchique</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5 text-xs">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
            Motif du collaborateur
          </span>
          <p className="text-stone-800 leading-relaxed whitespace-pre-line bg-stone-50 p-3 rounded-xl border border-stone-200/70">
            {request.reason}
          </p>
          {request.attachmentName && (
            <p className="text-[11px] text-stone-600 inline-flex items-center gap-1.5 pt-1">
              <Paperclip className="h-3.5 w-3.5 text-[#2A7B76]" />
              <span>Justificatif joint : <strong>{request.attachmentName}</strong></span>
            </p>
          )}
        </div>

        {request.managerComment && (
          <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-xl text-xs space-y-1">
            <p className="font-bold text-amber-900 text-[11px] flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-amber-700" />
              <span>Observation RH ({request.decidedBy || 'Responsable'})</span>
            </p>
            <p className="text-amber-900 leading-relaxed">{request.managerComment}</p>
          </div>
        )}

        <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAction(request, 'approve');
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Valider</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAction(request, 'modify');
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Modifier la durée</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAction(request, 'reject');
              }}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs px-3.5 py-2 rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <X className="h-3.5 w-3.5" />
              <span>Refuser</span>
            </button>

            {canCloseMission && onTerminateMission && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onTerminateMission(request);
                }}
                className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Flag className="h-3.5 w-3.5" />
                <span>Clôturer la mission</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition cursor-pointer whitespace-nowrap shrink-0"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
