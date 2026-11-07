import React, { useState } from 'react';
import { DollarSign, Wallet, Coins, Receipt, Sparkles } from 'lucide-react';
import { Employee, EmployeeSalaryDebt, SalaryPayment, FinancialTransaction, Role } from '../types';
import { FinanceStatsCards } from './finances/FinanceStatsCards';
import { SalaryPaymentsTable } from './finances/SalaryPaymentsTable';
import { FinancialLedgerTable } from './finances/FinancialLedgerTable';
import { EmployeeLoansTable } from './finances/EmployeeLoansTable';
import { HumaanFinance } from './illustrations/HumaanIllustrations';

interface FinancePanelProps {
  employees: Employee[];
  salaryDebts: EmployeeSalaryDebt[];
  onUpdateSalaryDebts: (debts: EmployeeSalaryDebt[]) => void;
  salaryPayments: SalaryPayment[];
  onUpdateSalaryPayments: (payments: SalaryPayment[]) => void;
  financialTransactions: FinancialTransaction[];
  onUpdateFinancialTransactions: (transactions: FinancialTransaction[]) => void;
  currentRole: Role;
  onAddNotification?: (log: any) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export default function FinancePanel({
  employees,
  salaryDebts = [],
  onUpdateSalaryDebts,
  salaryPayments,
  onUpdateSalaryPayments,
  financialTransactions,
  onUpdateFinancialTransactions,
  showToast,
}: FinancePanelProps) {
  const [activeTab, setActiveTab] = useState<'salaries' | 'ledger' | 'loans'>('salaries');

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#2A7B76] via-[#216762] to-emerald-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 z-10 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs text-emerald-100 font-semibold shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-[#F3D079]" />
            <span>Trésorerie, Paie & Prêts Collaborateurs</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-emerald-200" />
            <h2 className="font-serif font-bold text-2xl">Gestion Financière & Rémunérations</h2>
          </div>
        </div>

        <div className="shrink-0 z-10">
          <HumaanFinance className="w-44 h-32 drop-shadow-md" />
        </div>

        {/* Tab Switcher with Options */}
        <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/20 shrink-0 gap-1">
          <button
            onClick={() => setActiveTab('salaries')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'salaries' ? 'bg-white text-[#2A7B76] shadow-2xs' : 'text-white/80 hover:text-white'
            }`}
          >
            <Receipt className="h-3.5 w-3.5" />
            Fiches de Paie
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ledger' ? 'bg-white text-[#2A7B76] shadow-2xs' : 'text-white/80 hover:text-white'
            }`}
          >
            <Wallet className="h-3.5 w-3.5" />
            Grand Livre
          </button>
          <button
            onClick={() => setActiveTab('loans')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'loans' ? 'bg-white text-[#2A7B76] shadow-2xs' : 'text-white/80 hover:text-white'
            }`}
          >
            <Coins className="h-3.5 w-3.5" />
            Prêts & Avances
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <FinanceStatsCards
        salaryPayments={salaryPayments}
        financialTransactions={financialTransactions}
        salaryDebts={salaryDebts}
      />

      {/* Active Tab View */}
      {activeTab === 'salaries' && (
        <SalaryPaymentsTable
          salaryPayments={salaryPayments}
          employees={employees}
          salaryDebts={salaryDebts}
          onUpdatePayments={onUpdateSalaryPayments}
          showToast={showToast}
        />
      )}

      {activeTab === 'ledger' && (
        <FinancialLedgerTable
          transactions={financialTransactions}
          onUpdateTransactions={onUpdateFinancialTransactions}
          showToast={showToast}
        />
      )}

      {activeTab === 'loans' && (
        <EmployeeLoansTable
          salaryDebts={salaryDebts}
          onUpdateDebts={onUpdateSalaryDebts}
          employees={employees}
          showToast={showToast}
        />
      )}
    </div>
  );
}
