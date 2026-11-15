import React from 'react';
import { CalendarDays, Calendar, CheckCircle2, XCircle, FileText, Trash2, X, Hourglass, Flag } from 'lucide-react';
import { LeaveRequest, LEAVE_TYPE_LABELS } from '../../../types';

interface EmployeeLeaveDetailModalProps {
  leave: LeaveRequest | null;
  isTerminating: boolean;
  onClose: () => void;
  onCancelRequest: (id: string) => void;
  onTerminateMission: (id: string) => void;
}

export const EmployeeLeaveDetailModal: React.FC<EmployeeLeaveDetailModalProps> = ({
  leave,
  isTerminating,
  onClose,
  onCancelRequest,
  onTerminateMission,
}) => {
  if (!leave) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-3 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 border border-stone-200 shadow-2xl relative animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#2A7B76] border border-teal-100 flex items-center justify-center shrink-0">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-base">Dossier de Permission & Absence</h3>
              <p className="text-xs text-stone-500 font-mono">Réf : {leave.id}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
          leave.status === 'pending' ? 'bg-amber-50 text-amber-900 border-amber-200'
            : leave.status === 'approved' ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
            : leave.status === 'modified' ? 'bg-sky-50 text-sky-900 border-sky-200'
            : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          {leave.status === 'pending' && <Hourglass className="w-5 h-5 text-amber-600 shrink-0" />}
          {leave.status === 'approved' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
          {leave.status === 'modified' && <Calendar className="w-5 h-5 text-sky-600 shrink-0" />}
          {leave.status === 'rejected' && <XCircle className="w-5 h-5 text-rose-600 shrink-0" />}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider">
              {leave.status === 'pending' ? 'En cours d’arbitrage par la Direction RH'
                : leave.status === 'approved' ? 'Demande officiellement accordée'
                : leave.status === 'modified' ? 'Demande accordée avec aménagement de dates'
                : 'Demande non retenue'}
            </h4>
            <p className="text-[11px] opacity-80 mt-0.5">
              {leave.status === 'pending' ? 'Votre responsable hiérarchique examine votre demande.'
                : leave.status === 'approved' ? 'L’absence a été enregistrée au registre officiel des présences.'
                : leave.status === 'modified' ? 'Consultez les dates réaménagées ci-dessous.'
                : 'Cette demande n’a pas pu être validée par la direction.'}
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 space-y-2">
            <div className="flex items-center justify-between text-stone-600">
              <span className="font-semibold text-stone-500">Nature du congé :</span>
              <span className="font-bold text-stone-900">{LEAVE_TYPE_LABELS[leave.type]?.label || leave.type}</span>
            </div>
            <div className="flex items-center justify-between text-stone-600">
              <span className="font-semibold text-stone-500">Période sollicitée :</span>
              <span className="font-bold text-stone-900">
                Du {leave.startDate} au {leave.endDate} ({leave.daysCount} jour{leave.daysCount > 1 ? 's' : ''})
              </span>
            </div>
            {(leave.status === 'approved' || leave.status === 'modified') && (
              <div className="flex items-center justify-between text-emerald-800 pt-1 border-t border-stone-200 font-bold">
                <span>Période autorisée :</span>
                <span>
                  Du {leave.approvedStartDate || leave.startDate} au {leave.approvedEndDate || leave.endDate} ({leave.approvedDaysCount ?? leave.daysCount} j)
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-stone-600 pt-1 border-t border-stone-200">
              <span className="font-semibold text-stone-500">Date de dépôt :</span>
              <span className="font-mono text-stone-700">
                {leave.createdAt ? new Date(leave.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="font-bold text-stone-700 text-xs block">Motif de la demande :</span>
            <p className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-stone-800 leading-relaxed">{leave.reason}</p>
          </div>

          {leave.managerComment && (
            <div className="space-y-1">
              <span className="font-bold text-amber-800 text-xs block">
                Remarque de la hiérarchie ({leave.decidedBy || 'Responsable RH'}) :
              </span>
              <p className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 leading-relaxed">{leave.managerComment}</p>
            </div>
          )}

          {leave.attachmentName && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#2A7B76]" />
                <span className="text-stone-700 font-medium">{leave.attachmentName}</span>
              </div>
              <span className="text-[10px] bg-stone-200 px-2 py-0.5 rounded text-stone-600 font-bold">Justificatif joint</span>
            </div>
          )}
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100">
          <div className="flex items-center gap-2 flex-wrap">
            {leave.status === 'pending' && (
              <button
                type="button"
                onClick={() => onCancelRequest(leave.id)}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer border border-rose-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Annuler cette demande</span>
              </button>
            )}

            {leave.type === 'mission_professionnelle' && (leave.status === 'approved' || leave.status === 'modified') && (
              <button
                type="button"
                disabled={isTerminating}
                onClick={() => onTerminateMission(leave.id)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{isTerminating ? 'Clôture...' : '🏁 Déclarer la fin de mission (Retour en poste)'}</span>
              </button>
            )}
          </div>

          <button type="button" onClick={onClose} className="px-5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs transition cursor-pointer">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
