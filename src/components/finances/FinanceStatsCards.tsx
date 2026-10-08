import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Wallet, Coins } from 'lucide-react';
import { FinancialTransaction, SalaryPayment, EmployeeSalaryDebt } from '../../types';

interface FinanceStatsCardsProps {
  salaryPayments: SalaryPayment[];
  financialTransactions: FinancialTransaction[];
  salaryDebts: EmployeeSalaryDebt[];
}

export const FinanceStatsCards: React.FC<FinanceStatsCardsProps> = ({
  salaryPayments,
  financialTransactions,
  salaryDebts,
}) => {
  const totalSalaries = salaryPayments.reduce((acc, p) => acc + (p.netAmount || 0), 0);
  const totalIncome = financialTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalExpenses = financialTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + (t.amount || 0), 0);
  const pendingLoans = salaryDebts
    .filter((d) => d.status === 'pending')
    .reduce((acc, d) => acc + (d.totalLoanAmount || 0), 0);

  const formatXAF = (val: number) => `${val.toLocaleString('fr-FR')} XAF`;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">Masse Salariale</span>
          <Coins className="h-4 w-4 text-[#2A7B76]" />
        </div>
        <p className="text-lg font-bold text-stone-900 mt-1">{formatXAF(totalSalaries)}</p>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">Recettes Encaissées</span>
          <TrendingUp className="h-4 w-4 text-emerald-600" />
        </div>
        <p className="text-lg font-bold text-emerald-700 mt-1">{formatXAF(totalIncome)}</p>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">Dépenses Opérationnelles</span>
          <TrendingDown className="h-4 w-4 text-rose-600" />
        </div>
        <p className="text-lg font-bold text-rose-700 mt-1">{formatXAF(totalExpenses)}</p>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">Prêts / Avances En Cours</span>
          <Wallet className="h-4 w-4 text-amber-600" />
        </div>
        <p className="text-lg font-bold text-amber-700 mt-1">{formatXAF(pendingLoans)}</p>
      </div>
    </div>
  );
};
