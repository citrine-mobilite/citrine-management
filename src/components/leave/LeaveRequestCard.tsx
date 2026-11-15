import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, Clock, Edit3, MessageSquare, Check, X } from 'lucide-react';
import { LeaveRequest, LEAVE_TYPE_LABELS, LEAVE_STATUS_LABELS } from '../../types/leaveTypes';

interface LeaveRequestCardProps {
  req: LeaveRequest;
  onOpenAction: (req: LeaveRequest, action: 'approve' | 'reject' | 'modify') => void;
}

export const LeaveRequestCard: React.FC<LeaveRequestCardProps> = ({ req, onOpenAction }) => {
  const typeCfg = LEAVE_TYPE_LABELS[req.type] || { label: req.type, badgeColor: 'bg-stone-100 text-stone-800 border-stone-200' };
  const statusCfg = LEAVE_STATUS_LABELS[req.status] || { label: req.status, badgeColor: 'bg-stone-100 text-stone-800 border-stone-200' };

  return (
    <div className="p-5 hover:bg-stone-50/60 transition space-y-4">
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
          <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border ${typeCfg.badgeColor}`}>{typeCfg.label}</span>
          <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border ${statusCfg.badgeColor} flex items-center gap-1`}>
            {req.status === 'approved' && <CheckCircle2 className="h-3 w-3" />}
            {req.status === 'rejected' && <XCircle className="h-3 w-3" />}
            {req.status === 'modified' && <AlertCircle className="h-3 w-3" />}
            {req.status === 'pending' && <Clock className="h-3 w-3" />}
            {statusCfg.label}
          </span>
        </div>
      </div>

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
              <p className="font-bold text-indigo-700">Ajusté : Du {req.approvedStartDate} au {req.approvedEndDate}</p>
              <span className="inline-block mt-1 bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono">
                {req.approvedDaysCount} jour(s) accordé(s)
              </span>
            </div>
          ) : req.status === 'approved' ? (
            <div>
              <p className="font-bold text-emerald-700">Accordé : {req.daysCount} jour(s)</p>
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
            <p className="text-stone-800 font-medium"><strong>{req.decidedBy}</strong> le {req.decidedAt?.slice(0, 10)}</p>
          ) : (
            <p className="text-stone-400 italic">Non encore assigné</p>
          )}
        </div>
      </div>

      <div className="space-y-1 text-xs">
        <p className="text-stone-500 font-bold text-[11px]">Motif du collaborateur :</p>
        <p className="bg-white p-2.5 rounded-xl border border-stone-200 text-stone-700 leading-relaxed whitespace-pre-line">{req.reason}</p>
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

      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => onOpenAction(req, 'approve')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Valider cette demande de congé"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Valider</span>
          </button>

          <button
            onClick={() => onOpenAction(req, 'modify')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Ajuster les dates ou le nombre de jours accordés"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Modifier la durée</span>
          </button>

          <button
            onClick={() => onOpenAction(req, 'reject')}
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
};
