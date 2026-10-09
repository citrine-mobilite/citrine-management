import React from 'react';

interface ExpenseKpiCardsProps {
  totalAmount: number;
  pendingAmount: number;
  approvedToPay: number;
  reimbursedTotal: number;
  claimsCount: number;
  formatCFA: (amount: number) => string;
}

export const ExpenseKpiCards: React.FC<ExpenseKpiCardsProps> = ({
  totalAmount,
  pendingAmount,
  approvedToPay,
  reimbursedTotal,
  claimsCount,
  formatCFA,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-4.5 rounded-xl border border-stone-200 shadow-xs">
        <p className="text-xs font-medium text-stone-500">Total Déclaré</p>
        <p className="text-xl font-bold text-stone-800 mt-1">{formatCFA(totalAmount)}</p>
        <p className="text-[11px] text-stone-400 mt-0.5">{claimsCount} note(s) au total</p>
      </div>

      <div className="bg-white p-4.5 rounded-xl border border-stone-200 shadow-xs">
        <p className="text-xs font-medium text-stone-500">En Attente Validation</p>
        <p className="text-xl font-bold text-amber-600 mt-1">{formatCFA(pendingAmount)}</p>
        <p className="text-[11px] text-amber-700 mt-0.5">Vérification manager / DAF</p>
      </div>

      <div className="bg-white p-4.5 rounded-xl border border-stone-200 shadow-xs">
        <p className="text-xs font-medium text-stone-500">Approuvé (À décaisser)</p>
        <p className="text-xl font-bold text-[#2A7B76] mt-1">{formatCFA(approvedToPay)}</p>
        <p className="text-[11px] text-teal-700 mt-0.5">Prêt pour paiement caisse</p>
      </div>

      <div className="bg-white p-4.5 rounded-xl border border-stone-200 shadow-xs">
        <p className="text-xs font-medium text-stone-500">Remboursé</p>
        <p className="text-xl font-bold text-emerald-600 mt-1">{formatCFA(reimbursedTotal)}</p>
        <p className="text-[11px] text-emerald-700 mt-0.5">Fonds virés aux collaborateurs</p>
      </div>
    </div>
  );
};
