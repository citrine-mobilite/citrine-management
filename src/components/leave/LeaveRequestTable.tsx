import React from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  Flag,
  Paperclip,
  X,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { LeaveRequest, LeaveType, LEAVE_TYPE_LABELS } from '../../types/leaveTypes';

interface LeaveRequestTableProps {
  requests: LeaveRequest[];
  onOpenAction: (req: LeaveRequest, action: 'approve' | 'reject' | 'modify') => void;
  onViewDetail: (req: LeaveRequest) => void;
  onTerminateMission?: (req: LeaveRequest) => void;
}

const SHORT_TYPE_LABELS: Record<LeaveType, string> = {
  conge_annuel: 'Congé annuel',
  permission_exceptionnelle: 'Permission except.',
  maladie: 'Arrêt maladie',
  sans_solde: 'Sans solde',
  maternite_paternite: 'Maternité / Pat.',
  recuperation: 'Récupération',
  mission_professionnelle: 'Mission pro.',
  autre: 'Autre absence',
};

function formatShortDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length !== 3) return clean;
  return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`;
}

function renderStatusMeta(status: LeaveRequest['status']) {
  switch (status) {
    case 'approved':
      return {
        label: 'Validée',
        textClass: 'text-emerald-700',
        icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />,
      };
    case 'modified':
      return {
        label: 'Ajustée',
        textClass: 'text-indigo-700',
        icon: <AlertCircle className="h-3.5 w-3.5 text-indigo-600 shrink-0" />,
      };
    case 'rejected':
      return {
        label: 'Refusée',
        textClass: 'text-rose-700',
        icon: <XCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />,
      };
    case 'terminee':
      return {
        label: 'Clôturée',
        textClass: 'text-stone-600',
        icon: <Flag className="h-3.5 w-3.5 text-stone-500 shrink-0" />,
      };
    default:
      return {
        label: 'En attente',
        textClass: 'text-amber-700',
        icon: <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />,
      };
  }
}

export const LeaveRequestTable: React.FC<LeaveRequestTableProps> = ({
  requests,
  onOpenAction,
  onViewDetail,
  onTerminateMission,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-stone-200 bg-stone-50/90 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            <th className="py-2.5 pl-4 pr-3 whitespace-nowrap">Collaborateur</th>
            <th className="py-2.5 px-3 whitespace-nowrap">Type</th>
            <th className="py-2.5 px-3 whitespace-nowrap">Période</th>
            <th className="py-2.5 px-3 text-right whitespace-nowrap">Durée</th>
            <th className="py-2.5 px-3 whitespace-nowrap">Motif</th>
            <th className="py-2.5 px-3 whitespace-nowrap">Statut</th>
            <th className="py-2.5 pl-3 pr-4 text-right whitespace-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 text-xs">
          {requests.map((req) => {
            const statusMeta = renderStatusMeta(req.status);
            const fullTypeLabel = LEAVE_TYPE_LABELS[req.type]?.label || req.type;
            const shortTypeLabel = SHORT_TYPE_LABELS[req.type] || fullTypeLabel;
            const effectiveStart =
              req.status === 'modified' && req.approvedStartDate ? req.approvedStartDate : req.startDate;
            const effectiveEnd =
              req.status === 'modified' && req.approvedEndDate ? req.approvedEndDate : req.endDate;
            const effectiveDays =
              req.status === 'modified' && req.approvedDaysCount !== undefined
                ? req.approvedDaysCount
                : req.approvedDaysCount ?? req.daysCount;
            const isPending = req.status === 'pending';
            const canCloseMission =
              req.type === 'mission_professionnelle' &&
              (req.status === 'approved' || req.status === 'modified') &&
              Boolean(onTerminateMission);

            return (
              <tr
                key={req.id}
                onClick={() => onViewDetail(req)}
                className={`group transition-colors cursor-pointer ${
                  isPending
                    ? 'bg-amber-50/25 hover:bg-amber-50/60'
                    : 'bg-white hover:bg-stone-50/90'
                }`}
              >
                <td className="py-2.5 pl-4 pr-3 whitespace-nowrap">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {req.employeeAvatar ? (
                      <img
                        src={req.employeeAvatar}
                        alt={req.employeeName}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-lg object-cover shrink-0 border border-stone-200/70"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-[#2A7B76]/10 text-[#2A7B76] font-bold flex items-center justify-center text-[11px] shrink-0">
                        {req.employeeName.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-stone-900 truncate max-w-[170px] leading-tight">
                        {req.employeeName}
                      </p>
                      <p className="text-[11px] text-stone-500 truncate max-w-[170px] leading-tight">
                        {req.department || 'Opérations'} · {formatShortDate(req.createdAt)}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="py-2.5 px-3 whitespace-nowrap">
                  <span
                    className="font-semibold text-stone-800"
                    title={fullTypeLabel}
                  >
                    {shortTypeLabel}
                  </span>
                </td>

                <td className="py-2.5 px-3 whitespace-nowrap font-mono tabular-nums text-[11px] text-stone-700">
                  <span>
                    {formatShortDate(effectiveStart)} → {formatShortDate(effectiveEnd)}
                  </span>
                  {req.status === 'modified' && (
                    <span className="block text-[10px] text-stone-400 line-through">
                      {formatShortDate(req.startDate)} → {formatShortDate(req.endDate)}
                    </span>
                  )}
                </td>

                <td className="py-2.5 px-3 whitespace-nowrap text-right font-mono tabular-nums">
                  <span className="font-bold text-stone-900">{effectiveDays} j</span>
                  {req.status === 'modified' && req.daysCount !== effectiveDays && (
                    <span className="block text-[10px] text-stone-400">
                      sur {req.daysCount} j
                    </span>
                  )}
                </td>

                <td className="py-2.5 px-3 max-w-[240px]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p
                      className="text-stone-600 truncate"
                      title={req.reason}
                    >
                      {req.reason}
                    </p>
                    {req.attachmentName && (
                      <span
                        title={`Pièce jointe : ${req.attachmentName}`}
                        className="text-stone-400 shrink-0"
                      >
                        <Paperclip className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                </td>

                <td className="py-2.5 px-3 whitespace-nowrap">
                  <div className={`inline-flex items-center gap-1.5 font-bold text-[11px] ${statusMeta.textClass}`}>
                    {statusMeta.icon}
                    <span>{statusMeta.label}</span>
                  </div>
                  {req.decidedBy && (
                    <span className="block text-[10px] text-stone-400 truncate max-w-[130px]">
                      par {req.decidedBy}
                    </span>
                  )}
                </td>

                <td
                  className="py-2.5 pl-3 pr-4 whitespace-nowrap text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="inline-flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onViewDetail(req)}
                      className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer"
                      title="Consulter le détail complet"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>

                    {isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => onOpenAction(req, 'approve')}
                          className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] inline-flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0"
                          title="Valider la demande"
                        >
                          <Check className="h-3 w-3" />
                          <span className="hidden xl:inline">Valider</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenAction(req, 'modify')}
                          className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition cursor-pointer"
                          title="Ajuster les dates ou la durée"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenAction(req, 'reject')}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
                          title="Refuser la demande"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}

                    {!isPending && canCloseMission && onTerminateMission && (
                      <button
                        type="button"
                        onClick={() => onTerminateMission(req)}
                        className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-900 text-white font-bold text-[11px] inline-flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0"
                        title="Clôturer cette mission et remettre le collaborateur en poste"
                      >
                        <Flag className="h-3 w-3" />
                        <span>Clôturer</span>
                      </button>
                    )}

                    {!isPending && !canCloseMission && (
                      <button
                        type="button"
                        onClick={() => onOpenAction(req, 'modify')}
                        className="px-2 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 font-semibold text-[11px] transition cursor-pointer whitespace-nowrap shrink-0"
                        title="Réviser la décision ou ajuster la durée"
                      >
                        Réviser
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
  );
};
