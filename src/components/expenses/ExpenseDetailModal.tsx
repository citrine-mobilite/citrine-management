import React from 'react';
import { X } from 'lucide-react';
import { ExpenseClaim, ExpenseClaimStatus, ExpenseCategory } from '../../types';

interface ExpenseDetailModalProps {
  claim: ExpenseClaim;
  isAdminOrManager: boolean;
  onClose: () => void;
  onUpdateStatus: (claim: ExpenseClaim, status: ExpenseClaimStatus, reason?: string) => Promise<void>;
  formatCFA: (amount: number) => string;
  getCategoryLabel: (cat: ExpenseCategory) => string;
}

export const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({
  claim,
  isAdminOrManager,
  onClose,
  onUpdateStatus,
  formatCFA,
  getCategoryLabel,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-stone-200 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-mono font-bold text-[#2A7B76]">{claim.reference}</span>
            <h3 className="text-base font-bold text-stone-900 mt-0.5">{claim.title}</h3>
            <p className="text-xs text-stone-500">Engagé par {claim.employeeName}</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-stone-50 rounded-xl space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-stone-500">Montant total réclamé :</span>
            <span className="font-bold text-sm text-stone-900 font-mono">{formatCFA(claim.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Nature de dépense :</span>
            <span className="font-medium text-stone-800">{getCategoryLabel(claim.category)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Mode de versement :</span>
            <span className="font-medium text-stone-800 capitalize">{claim.paymentMode.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Date de la dépense :</span>
            <span className="font-medium text-stone-800">{claim.expenseDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Lieu de la mission :</span>
            <span className="font-medium text-stone-800">{claim.missionLocation || 'Douala'}</span>
          </div>
          {claim.receiptNumber && (
            <div className="flex justify-between">
              <span className="text-stone-500">N° Ticket / Reçu :</span>
              <span className="font-mono text-stone-800">{claim.receiptNumber}</span>
            </div>
          )}
        </div>

        {claim.receiptDescription && (
          <div className="text-xs space-y-1">
            <span className="font-semibold text-stone-700">Description du justificatif :</span>
            <p className="bg-stone-50 p-2.5 rounded-lg text-stone-600 border border-stone-100">
              {claim.receiptDescription}
            </p>
          </div>
        )}

        {isAdminOrManager && (
          <div className="pt-3 border-t border-stone-200 space-y-2">
            <p className="text-xs font-semibold text-stone-700">Actions d'arbitrage hiérarchique :</p>
            <div className="flex flex-wrap gap-2">
              {claim.status === 'soumis' && (
                <button
                  onClick={() => onUpdateStatus(claim, 'en_verification')}
                  className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition cursor-pointer"
                >
                  Mettre en vérification pièces
                </button>
              )}

              {(claim.status === 'soumis' || claim.status === 'en_verification') && (
                <button
                  onClick={() => onUpdateStatus(claim, 'approuve')}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#2A7B76] hover:bg-[#236863] rounded-lg transition cursor-pointer"
                >
                  Approuver (Bon à décaisser)
                </button>
              )}

              {claim.status === 'approuve' && (
                <button
                  onClick={() => onUpdateStatus(claim, 'rembourse')}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition cursor-pointer"
                >
                  Confirmer le décaissement / virement fait
                </button>
              )}

              {claim.status !== 'rejete' && claim.status !== 'rembourse' && (
                <button
                  onClick={() => {
                    const reason = prompt('Motif du rejet de la note de frais :');
                    if (reason) onUpdateStatus(claim, 'rejete', reason);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                >
                  Rejeter
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
