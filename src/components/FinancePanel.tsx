import React, { useState } from 'react';
import { DollarSign, Wallet, Coins, Receipt } from 'lucide-react';
import { Employee, EmployeeSalaryDebt, SalaryPayment, FinancialTransaction, Role } from '../types';
import { FinanceStatsCards } from './finances/FinanceStatsCards';
import { SalaryPaymentsTable } from './finances/SalaryPaymentsTable';
import { FinancialLedgerTable } from './finances/FinancialLedgerTable';
import { EmployeeLoansTable } from './finances/EmployeeLoansTable';

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
      <div className="bg-gradient-to-r from-[#2A7B76] to-emerald-800 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-200" />
            <h2 className="font-serif font-bold text-xl">Gestion Financière, Paie & Prêts</h2>
          </div>
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
