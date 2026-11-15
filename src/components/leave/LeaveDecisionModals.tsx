import React from 'react';
import { CheckCircle2, XCircle, Edit3, X } from 'lucide-react';
import { LeaveRequest } from '../../types/leaveTypes';

interface LeaveDecisionModalsProps {
  selectedRequest: LeaveRequest | null;
  actionType: 'approve' | 'reject' | 'modify' | null;
  managerComment: string;
  onChangeComment: (val: string) => void;
  modifiedStartDate: string;
  onChangeModifiedStart: (val: string) => void;
  modifiedEndDate: string;
  onChangeModifiedEnd: (val: string) => void;
  modifiedDaysCount: number;
  onChangeModifiedDays: (val: number) => void;
  isProcessing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LeaveDecisionModals: React.FC<LeaveDecisionModalsProps> = ({
  selectedRequest,
  actionType,
  managerComment,
  onChangeComment,
  modifiedStartDate,
  onChangeModifiedStart,
  modifiedEndDate,
  onChangeModifiedEnd,
  modifiedDaysCount,
  onChangeModifiedDays,
  isProcessing,
  onClose,
  onConfirm,
}) => {
  if (!selectedRequest || !actionType) return null;

  if (actionType === 'approve' || actionType === 'reject') {
    return (
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
            <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer" title="Fermer">
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
              onChange={(e) => onChangeComment(e.target.value)}
              placeholder={actionType === 'approve' ? 'Ex: Accordé. Veillez à transmettre les dossiers urgents...' : 'Ex: Effectif insuffisant cette semaine, report nécessaire...'}
              required={actionType === 'reject'}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 focus:outline-none focus:border-[#2A7B76] resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2 bg-stone-100 text-stone-700 text-xs font-bold rounded-xl cursor-pointer" title="Annuler">
              Annuler
            </button>
            <button
              onClick={onConfirm}
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
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-3">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-stone-200 shadow-2xl">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-indigo-600" />
            <span>Adapter la durée du congé / permission</span>
          </h3>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer" title="Fermer">
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
            <input type="date" value={modifiedStartDate} onChange={(e) => onChangeModifiedStart(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-800" />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-stone-700">Date fin accordée</label>
            <input type="date" value={modifiedEndDate} onChange={(e) => onChangeModifiedEnd(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-800" />
          </div>
        </div>

        <div className="space-y-1 text-xs">
          <label className="font-bold text-stone-700">Nombre de jours validés</label>
          <input type="number" min={1} max={60} value={modifiedDaysCount} onChange={(e) => onChangeModifiedDays(parseInt(e.target.value, 10) || 1)} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-800" />
        </div>

        <div className="space-y-1 text-xs">
          <label className="font-bold text-stone-700">Motif de l'ajustement communiqué à l'employé *</label>
          <textarea
            rows={3}
            value={managerComment}
            onChange={(e) => onChangeComment(e.target.value)}
            placeholder="Ex: Compte tenu de la livraison client prévue vendredi, accord pour 2 jours du lundi au mardi..."
            required
            className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 bg-stone-100 text-stone-700 text-xs font-bold rounded-xl cursor-pointer" title="Annuler">
            Annuler
          </button>
          <button onClick={onConfirm} disabled={isProcessing} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer" title="Valider la durée modifiée">
            {isProcessing ? 'Enregistrement...' : 'Valider la durée modifiée'}
          </button>
        </div>
      </div>
    </div>
  );
};
