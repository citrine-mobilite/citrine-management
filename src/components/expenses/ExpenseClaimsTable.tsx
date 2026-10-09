import React from 'react';
import { Clock, CheckCircle, Check, XCircle, Smartphone, CreditCard, Banknote } from 'lucide-react';
import { ExpenseClaim, ExpenseClaimStatus, ExpenseCategory, PaymentMode } from '../../types';

export function getExpenseStatusBadge(status: ExpenseClaimStatus) {
  switch (status) {
    case 'soumis':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Clock className="w-3 h-3" /> Soumis
        </span>
      );
    case 'en_verification':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3" /> En vérification
        </span>
      );
    case 'approuve':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
          <CheckCircle className="w-3 h-3" /> Approuvé
        </span>
      );
    case 'rembourse':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <Check className="w-3 h-3" /> Remboursé
        </span>
      );
    case 'rejete':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3 h-3" /> Rejeté
        </span>
      );
  }
}

export function getPaymentIcon(mode: PaymentMode) {
  switch (mode) {
    case 'orange_money':
    case 'mtn_momo':
      return <Smartphone className="w-3.5 h-3.5 text-amber-600" />;
    case 'virement':
      return <CreditCard className="w-3.5 h-3.5 text-blue-600" />;
    default:
      return <Banknote className="w-3.5 h-3.5 text-emerald-600" />;
  }
}

interface ExpenseClaimsTableProps {
  claims: ExpenseClaim[];
  onSelectClaim: (claim: ExpenseClaim) => void;
  formatCFA: (amount: number) => string;
  getCategoryLabel: (cat: ExpenseCategory) => string;
}

export const ExpenseClaimsTable: React.FC<ExpenseClaimsTableProps> = ({
  claims,
  onSelectClaim,
  formatCFA,
  getCategoryLabel,
}) => {
  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50/70 border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              <th className="py-3 px-4">Réf. & Date</th>
              <th className="py-3 px-4">Collaborateur</th>
              <th className="py-3 px-4">Objet de la dépense</th>
              <th className="py-3 px-4">Catégorie</th>
              <th className="py-3 px-4 text-right">Montant</th>
              <th className="py-3 px-4 text-center">Paiement</th>
              <th className="py-3 px-4 text-center">Statut</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-xs">
            {claims.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-stone-400">
                  Aucune note de frais trouvée.
                </td>
              </tr>
            ) : (
              claims.map((claim) => (
                <tr key={claim.id} className="hover:bg-stone-50/80 transition">
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-stone-800 text-xs">{claim.reference}</span>
                    <p className="text-[11px] text-stone-400 mt-0.5">{claim.expenseDate}</p>
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-semibold text-stone-900">{claim.employeeName}</p>
                    <p className="text-[11px] text-stone-400">{claim.employeeDepartment || 'Citrine'}</p>
                  </td>

                  <td className="py-3 px-4 max-w-xs">
                    <p className="font-medium text-stone-800 truncate">{claim.title}</p>
                    <p className="text-[11px] text-stone-400 truncate">Lieu : {claim.missionLocation || 'Douala'}</p>
                  </td>

                  <td className="py-3 px-4">
                    <span className="text-stone-700 font-medium">{getCategoryLabel(claim.category)}</span>
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-bold text-stone-900">
                    {formatCFA(claim.amount)}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex items-center gap-1 text-[11px] text-stone-600 capitalize bg-stone-100 px-2 py-0.5 rounded-md">
                      {getPaymentIcon(claim.paymentMode)}
                      {claim.paymentMode.replace('_', ' ')}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-center">{getExpenseStatusBadge(claim.status)}</td>

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onSelectClaim(claim)}
                      className="px-2.5 py-1 text-xs font-semibold text-[#2A7B76] hover:bg-teal-50 rounded-lg transition cursor-pointer"
                    >
                      Consulter
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
