import React from 'react';
import { CreditCard, Plus, CheckCircle2, Clock, Calendar, AlertCircle } from 'lucide-react';
import { EmployeeSalaryDebt } from '../../types';

interface EmployeeLoansTabProps {
  salaryDebts?: EmployeeSalaryDebt[];
  currentEmployeeId?: string;
  onRequestLoan: () => void;
  formatXAF: (amount: number) => string;
}

export default function EmployeeLoansTab({
  salaryDebts = [],
  currentEmployeeId,
  onRequestLoan,
  formatXAF
}: EmployeeLoansTabProps) {
  const myDebts = salaryDebts.filter(d => d.employeeId === currentEmployeeId);
  const totalGranted = myDebts.reduce((sum, d) => sum + d.monthlyInstallment, 0);
  const totalPaid = myDebts.filter(d => d.status === 'paid').reduce((sum, d) => sum + d.monthlyInstallment, 0);
  const remainingDebt = myDebts.filter(d => d.status === 'pending').reduce((sum, d) => sum + d.monthlyInstallment, 0);

  return (
    <div className="space-y-5" id="employee-loans-tab">
      {/* Header card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-green-100 shadow-2xs">
        <div>
          <h3 className="text-sm font-serif font-bold text-stone-900 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-emerald-600" /> Prêts & Avances sur Salaire
          </h3>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Suivi de vos échéances, remboursements et demandes d'avances sur salaire.
          </p>
        </div>

        <button
          onClick={onRequestLoan}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
        >
          <Plus className="h-4 w-4" />
          Nouvelle demande d'avance
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 space-y-1 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-stone-400 block">Total Accordé</span>
          <div className="text-xl font-mono font-extrabold text-stone-900">{formatXAF(totalGranted)}</div>
          <p className="text-[10px] text-stone-400">{myDebts.length} mensualité(s) générée(s)</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 space-y-1 shadow-2xs bg-gradient-to-br from-emerald-50/50 to-white">
          <span className="text-[10px] uppercase font-bold text-emerald-700 block">Total Remboursé</span>
          <div className="text-xl font-mono font-extrabold text-emerald-800">{formatXAF(totalPaid)}</div>
          <p className="text-[10px] text-emerald-600 font-medium">Déduit ou réglé en caisse</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 space-y-1 shadow-2xs bg-gradient-to-br from-amber-50/50 to-white">
          <span className="text-[10px] uppercase font-bold text-amber-700 block">Reste à Rembourser</span>
          <div className="text-xl font-mono font-extrabold text-amber-900">{formatXAF(remainingDebt)}</div>
          <p className="text-[10px] text-amber-700 font-medium">
            {remainingDebt === 0 ? 'Aucun encours actif' : 'En cours d\'amortissement'}
          </p>
        </div>
      </div>

      {/* Installment History Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-stone-200/80 flex items-center justify-between">
          <h4 className="text-xs font-serif font-bold text-stone-800 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-600" /> Échéancier de remboursement de vos prêts
          </h4>
          <span className="text-[10px] font-mono text-stone-400">{myDebts.length} mensualité(s)</span>
        </div>

        {myDebts.length === 0 ? (
          <div className="p-8 text-center text-stone-400 italic text-xs">
            Vous n'avez aucun prêt ou avance de salaire enregistré.
          </div>
        ) : (
          <>
            {/* Mobile Card List (sm:hidden) */}
            <div className="block sm:hidden divide-y divide-stone-100 p-2 space-y-2.5">
              {myDebts.map((debt) => {
                const isPaid = debt.status === 'paid';
                return (
                  <div key={debt.id} className="p-3.5 bg-stone-50/60 rounded-2xl border border-stone-200/80 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-stone-900 text-xs">{debt.reason || 'Prêt personnel'}</div>
                        <div className="text-[10px] text-stone-400 font-mono">ID: {debt.id} · {debt.dueDate}</div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                        isPaid 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {isPaid ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            {debt.paymentMethod === 'manual_cash' ? 'En caisse' : 'Déduit'}
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 text-amber-600" />
                            En cours
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-200/60 font-mono">
                      <div>
                        <span className="text-[10px] text-stone-500 font-sans block">Mensualité</span>
                        <span className="font-bold text-emerald-800">{formatXAF(debt.monthlyInstallment)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-stone-500 font-sans block">Total accordé ({debt.installmentNumber}/{debt.totalMonths})</span>
                        <span className="font-semibold text-stone-700">{formatXAF(debt.totalLoanAmount)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (hidden sm:block) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200/80 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                    <th className="p-3">Motif & Référence</th>
                    <th className="p-3 text-center">Échéance</th>
                    <th className="p-3 text-right">Mensualité</th>
                    <th className="p-3 text-right">Montant Global</th>
                    <th className="p-3 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-sans">
                  {myDebts.map((debt) => {
                    const isPaid = debt.status === 'paid';
                    return (
                      <tr key={debt.id} className="hover:bg-stone-50/50 transition">
                        <td className="p-3">
                          <div className="font-bold text-stone-800">{debt.reason || 'Prêt personnel'}</div>
                          <div className="text-[9px] text-stone-400 font-mono">ID: {debt.id}</div>
                        </td>
                        <td className="p-3 text-center font-mono font-medium text-stone-600 text-[11px]">
                          {debt.dueDate} ({debt.installmentNumber}/{debt.totalMonths})
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-950">
                          {formatXAF(debt.monthlyInstallment)}
                        </td>
                        <td className="p-3 text-right font-mono text-stone-500 text-[11px]">
                          {formatXAF(debt.totalLoanAmount)}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                            isPaid 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {isPaid ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                {debt.paymentMethod === 'manual_cash' ? 'Payé en caisse' : 'Déduit du salaire'}
                              </>
                            ) : (
                              <>
                                <Clock className="h-3 w-3 text-amber-600" />
                                En attente
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
