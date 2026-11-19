import React, { useState } from 'react';
import { Download, Plus, X, Save, FileText } from 'lucide-react';
import { SalaryPayment, Employee, EmployeeSalaryDebt } from '../../types';
import { downloadPayslipPdf, exportElementToPdf } from '../../services/pdfExportService';
import { exportToExcel } from '../../services/excelExportService';

interface SalaryPaymentsTableProps {
  salaryPayments: SalaryPayment[];
  employees: Employee[];
  salaryDebts?: EmployeeSalaryDebt[];
  onUpdatePayments?: (updated: SalaryPayment[]) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export const SalaryPaymentsTable: React.FC<SalaryPaymentsTableProps> = ({
  salaryPayments,
  employees,
  salaryDebts = [],
  onUpdatePayments,
  showToast,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employees[0]?.id || '');
  const [period, setPeriod] = useState(() => {
    const d = new Date();
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  });
  const [bonusAmount, setBonusAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'cash' | 'check' | 'other'>('transfer');
  const [notes, setNotes] = useState('');

  const getEmpName = (empId: string) => {
    return employees.find((e) => e.id === empId)?.name || 'Collaborateur';
  };

  const getEmpObj = (empId: string) => {
    return (
      employees.find((e) => e.id === empId) || {
        id: empId,
        name: 'Collaborateur',
        email: '',
        phone: '',
        avatarUrl: '',
        roleType: 'employé' as const,
      }
    );
  };

  const formatXAF = (val: number) => `${val.toLocaleString('fr-FR')} XAF`;

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId) || employees[0];
  const currentBaseSalary = selectedEmployee?.salary || 250000;
  const activeLoanForForm = salaryDebts.find((d) => d.employeeId === selectedEmployee?.id && d.status !== 'paid');
  const activeLoanDeduction = activeLoanForForm ? activeLoanForForm.monthlyInstallment : 0;
  const calculatedNetSalary = Math.max(0, currentBaseSalary + bonusAmount - activeLoanDeduction);

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdatePayments) return;

    if (!selectedEmployee) {
      if (showToast) showToast('Veuillez sélectionner un collaborateur.', 'error');
      return;
    }

    const newPayment: SalaryPayment = {
      id: `pay-${Date.now()}`,
      employeeId: selectedEmployee.id,
      period: period,
      baseAmount: currentBaseSalary,
      bonusAmount: bonusAmount,
      advanceAmount: activeLoanDeduction,
      deductions: activeLoanDeduction,
      netAmount: calculatedNetSalary,
      status: 'paid',
      paymentMethod: paymentMethod,
      paidAt: new Date().toISOString().split('T')[0],
      notes: notes.trim(),
    };

    onUpdatePayments([newPayment, ...salaryPayments]);
    if (showToast) showToast(`Fiche de paie enregistrée avec succès pour ${selectedEmployee.name}.`, 'success');
    setIsModalOpen(false);
    setBonusAmount(0);
    setNotes('');
  };

  const handleExportExcel = () => {
    const headers = ['Collaborateur', 'Période', 'Salaire de Base', 'Primes', 'Retenues Prêts', 'Net Perçu'];
    const rows = salaryPayments.map((p) => {
      const loanDeduction = p.deductions !== undefined ? p.deductions : (p.advanceAmount !== undefined ? p.advanceAmount : 0);
      const netAmountPaid = p.netAmount !== undefined ? p.netAmount : Math.max(0, p.baseAmount + (p.bonusAmount || 0) - loanDeduction);
      return [
        getEmpName(p.employeeId),
        p.period,
        p.baseAmount,
        p.bonusAmount || 0,
        loanDeduction,
        netAmountPaid,
      ];
    });
    exportToExcel('registre_paies.xls', 'Registre Général des Paies Citrine', headers, rows);
  };

  const handleExportPdf = () => {
    exportElementToPdf('salary-payments-table-container', 'registre_paies.pdf');
  };

  return (
    <div id="salary-payments-table-container" className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden">
      <div className="p-4 bg-stone-50/80 border-b border-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="font-serif font-bold text-sm text-stone-900">Registre Général des Paies</h3>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5 text-rose-600" />
            <span>Export PDF</span>
          </button>

          {onUpdatePayments && (
            <button
              onClick={() => {
                if (employees.length > 0) {
                  setSelectedEmployeeId(employees[0].id);
                }
                setIsModalOpen(true);
              }}
              className="px-3 py-1.5 bg-[#2A7B76] text-white hover:bg-[#20635F] text-xs font-bold rounded-xl flex items-center gap-1 transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Enregistrer un Salaire
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-stone-50 text-stone-500 font-bold border-b border-stone-200/60 uppercase text-[10px]">
            <tr>
              <th className="p-3">Collaborateur</th>
              <th className="p-3">Période</th>
              <th className="p-3">Salaire de Base</th>
              <th className="p-3">Primes</th>
              <th className="p-3">Retenues Prêts/Avances</th>
              <th className="p-3">Salaire Net Perçu</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {salaryPayments.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-stone-400">Aucun bulletin de paie enregistré</td>
              </tr>
            ) : (
              salaryPayments.map((p) => {
                const loanDeduction = p.deductions !== undefined ? p.deductions : (p.advanceAmount !== undefined ? p.advanceAmount : 0);
                const netAmountPaid = p.netAmount !== undefined ? p.netAmount : Math.max(0, p.baseAmount + (p.bonusAmount || 0) - loanDeduction);

                return (
                  <tr key={p.id} className="hover:bg-stone-50/60 transition">
                    <td className="p-3 font-bold text-stone-900">{getEmpName(p.employeeId)}</td>
                    <td className="p-3 text-stone-600 font-mono">{p.period}</td>
                    <td className="p-3 text-stone-700 font-mono">{formatXAF(p.baseAmount)}</td>
                    <td className="p-3 text-emerald-700 font-mono">+{formatXAF(p.bonusAmount || 0)}</td>
                    <td className="p-3 text-rose-700 font-mono">
                      {loanDeduction > 0 ? `-${formatXAF(loanDeduction)}` : '0 XAF'}
                    </td>
                    <td className="p-3 font-bold text-emerald-800 font-mono">{formatXAF(netAmountPaid)}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          // Create temporary modified payslip payload for correct PDF generation
                          const adjustedPayment = {
                            ...p,
                            advanceAmount: loanDeduction,
                            netAmount: netAmountPaid,
                          };
                          downloadPayslipPdf(adjustedPayment, getEmpObj(p.employeeId));
                        }}
                        className="p-1.5 rounded-lg bg-emerald-50 text-[#2A7B76] hover:bg-[#2A7B76] hover:text-white transition cursor-pointer"
                        title="Télécharger le bulletin PDF"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Register Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-serif font-bold text-base text-stone-900">Enregistrer un Salaire Net</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-stone-400 hover:bg-stone-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Collaborateur *</label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2A7B76] outline-none font-medium"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} (Base: {formatXAF(emp.salary || 250000)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Mois / Période de paie *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Octobre 2026"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2A7B76] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Primes ou Bonus (XAF)</label>
                  <input
                    type="number"
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2A7B76] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Méthode de paiement</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2A7B76] outline-none"
                  >
                    <option value="transfer">Virement Bancaire</option>
                    <option value="cash">Espèces / Cash</option>
                    <option value="check">Chèque</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
              </div>

              {/* Automatic Deduction Live Calculation Display */}
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 space-y-2">
                <div className="flex justify-between font-medium text-stone-600">
                  <span>Salaire Brut de Base:</span>
                  <span className="font-mono">{formatXAF(currentBaseSalary)}</span>
                </div>
                {bonusAmount > 0 && (
                  <div className="flex justify-between font-medium text-emerald-600">
                    <span>Primes / Bonus:</span>
                    <span className="font-mono">+{formatXAF(bonusAmount)}</span>
                  </div>
                )}
                {activeLoanDeduction > 0 && (
                  <div className="flex justify-between font-bold text-rose-600">
                    <span>Retenue Prêt ({activeLoanForForm?.reason}):</span>
                    <span className="font-mono">-{formatXAF(activeLoanDeduction)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-stone-200 flex justify-between font-bold text-sm text-emerald-850">
                  <span>Salaire Net Perçu:</span>
                  <span className="font-mono">{formatXAF(calculatedNetSalary)}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Notes internes</label>
                <textarea
                  rows={2}
                  placeholder="Informations complémentaires..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2A7B76] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#2A7B76] text-white hover:bg-[#236864] font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Save className="h-4 w-4" />
                  Valider la paie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
