import React from 'react';
import { X, CheckCircle2, XCircle } from 'lucide-react';
import { RequestItem } from './presenceRequestsUtils';

interface PresenceDecisionModalProps {
  item: RequestItem | null;
  action: 'approved' | 'rejected' | null;
  comment: string;
  setComment: (val: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export const PresenceDecisionModal: React.FC<PresenceDecisionModalProps> = ({
  item,
  action,
  comment,
  setComment,
  onClose,
  onConfirm,
}) => {
  if (!item || !action) return null;

  const isApproved = action === 'approved';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div
          className={`p-4 text-white flex items-center justify-between ${
            isApproved ? 'bg-[#2A7B76]' : 'bg-red-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {isApproved ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            <h3 className="font-serif font-bold text-sm">
              {isApproved ? 'Approuver la demande' : 'Rejeter la demande'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div>
            <span className="font-bold text-stone-900 block">{item.employee?.name || 'Collaborateur'}</span>
            <p className="text-stone-500 text-[11px] mt-0.5">Motif déclaré: « {item.reason} »</p>
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">
              Commentaire RH / Direction (Optionnel) :
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ex: Validé suite à justificatif médical, ou motif insuffisant..."
              rows={3}
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#2A7B76]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-white font-bold rounded-xl transition cursor-pointer shadow-xs ${
                isApproved ? 'bg-[#2A7B76] hover:bg-[#20635F]' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              Confirmer la décision
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
