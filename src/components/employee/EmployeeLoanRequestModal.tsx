import React from 'react';
import { CreditCard, CheckCircle2 } from 'lucide-react';

interface EmployeeLoanRequestModalProps {
  show: boolean;
  onClose: () => void;
  loanSuccess: boolean;
  loanAmount: string;
  setLoanAmount: (amount: string) => void;
  loanReason: string;
  setLoanReason: (reason: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const EmployeeLoanRequestModal: React.FC<EmployeeLoanRequestModalProps> = ({
  show,
  onClose,
  loanSuccess,
  loanAmount,
  setLoanAmount,
  loanReason,
  setLoanReason,
  onSubmit,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-2xl max-w-sm w-full space-y-4 text-xs max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h3 className="font-serif font-bold text-stone-900 flex items-center gap-1.5">
            <CreditCard className="h-4 w-4 text-[#2A7B76]" /> Demande d'Avance sur Salaire
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer rounded-lg"
          >
            ✕
          </button>
        </div>

        {loanSuccess ? (
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
            <p className="font-bold text-emerald-950 text-xs">
              Votre demande d'avance a été soumise avec succès !
            </p>
            <p className="text-[10px] text-emerald-800">
              Elle est en cours de révision par la Direction Financière.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-stone-500">
                Montant souhaité (XAF) :
              </label>
              <input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                required
                placeholder="Ex: 50000"
                className="w-full p-2.5 border border-stone-200 rounded-xl font-mono text-sm font-bold bg-stone-50/70 focus:outline-none focus:border-[#2A7B76]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-stone-500">
                Motif de la demande :
              </label>
              <textarea
                value={loanReason}
                onChange={(e) => setLoanReason(e.target.value)}
                placeholder="Ex: Frais médicaux urgents, scolarité, avance ponctuelle..."
                rows={3}
                required
                className="w-full p-2.5 border border-stone-200 rounded-xl text-xs bg-stone-50/70 font-medium focus:outline-none focus:border-[#2A7B76]"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold rounded-xl transition shadow-xs cursor-pointer"
              >
                Soumettre la demande
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
