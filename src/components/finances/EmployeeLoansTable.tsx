import React, { useState } from 'react';
import { EmployeeSalaryDebt, Employee } from '../../types';
import { Plus, X, Save, Coins, Download, FileText } from 'lucide-react';
import { exportToExcel } from '../../services/excelExportService';
import { exportElementToPdf } from '../../services/pdfExportService';

interface EmployeeLoansTableProps {
  salaryDebts: EmployeeSalaryDebt[];
  onUpdateDebts: (updated: EmployeeSalaryDebt[]) => void;
  employees: Employee[];
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}

export const EmployeeLoansTable: React.FC<EmployeeLoansTableProps> = ({
  salaryDebts,
  onUpdateDebts,
  employees,
  showToast,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employees[0]?.id || '');
  const [loanAmount, setLoanAmount] = useState(90000);
  const [durationMonths, setDurationMonths] = useState(3);
  const [reason, setReason] = useState("Avance exceptionnelle pour urgence familiale");

  const monthlyInstallment = Math.round(loanAmount / durationMonths);

  const handleCreateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.id === selectedEmployeeId);
    if (!emp) {
      if (showToast) showToast('Veuillez sélectionner un collaborateur.', 'error');
      return;
    }

    const newLoan: EmployeeSalaryDebt = {
      id: `loan-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.name,
      totalLoanAmount: loanAmount,
      monthlyInstallment: monthlyInstallment,
      totalMonths: durationMonths,
      installmentNumber: 0,
      dueDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      reason: reason.trim(),
      createdAt: new Date().toISOString(),
    };

    onUpdateDebts([newLoan, ...salaryDebts]);
    if (showToast) showToast(`Prêt enregistré avec succès pour ${emp.name}.`, 'success');
    setIsModalOpen(false);
    setReason("Avance exceptionnelle");
  };

  const handleExportExcel = () => {
    const headers = ['Collaborateur', 'Motif', 'Montant Total (XAF)', 'Durée (Mois)', 'Mensualité (XAF)', 'Statut'];
    const rows = salaryDebts.map((d) => [
      d.employeeName,
      d.reason || '',
      d.totalLoanAmount || 0,
      d.totalMonths || 1,
      d.monthlyInstallment || 0,
      d.status === 'paid' ? 'Soldé' : 'En cours',
    ]);
    exportToExcel('prets_et_avances.xls', 'Suivi des Prêts & Avances Citrine', headers, rows);
  };

  const handleExportPdf = () => {
    exportElementToPdf('employee-loans-container', 'prets_et_avances.pdf');
  };

  return (
    <div id="employee-loans-container" className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-[#2A7B76]" />
          <h3 className="font-serif font-bold text-sm text-stone-900">Suivi des Prêts & Avances sur Salaire</h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5 text-rose-600" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 bg-[#2A7B76] text-white hover:bg-[#20635F] text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Nouveau Prêt / Avance
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-stone-200 text-stone-400 font-bold uppercase tracking-wider">
              <th className="pb-3">Collaborateur</th>
              <th className="pb-3">Motif</th>
              <th className="pb-3">Montant Total</th>
              <th className="pb-3">Durée</th>
              <th className="pb-3">Mensualité</th>
              <th className="pb-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {salaryDebts.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-stone-400">Aucun prêt ou avance en cours</td>
              </tr>
            ) : (
              salaryDebts.map((debt) => (
                <tr key={debt.id} className="hover:bg-stone-50/50">
                  <td className="py-3 font-bold text-stone-900">{debt.employeeName}</td>
                  <td className="py-3 text-stone-600">{debt.reason}</td>
                  <td className="py-3 font-bold text-stone-900">{debt.totalLoanAmount?.toLocaleString('fr-FR')} XAF</td>
                  <td className="py-3 text-stone-600">{debt.totalMonths} mois</td>
                  <td className="py-3 font-bold text-rose-600">-{debt.monthlyInstallment?.toLocaleString('fr-FR')} XAF/mois</td>
                  <td className="py-3">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${debt.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {debt.status === 'paid' ? 'Soldé' : 'En cours (Débit Auto)'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Loan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-serif font-bold text-base text-stone-900">Enregistrer un Prêt / Avance</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-stone-400 hover:bg-stone-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLoan} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Sélectionner le collaborateur *</label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2A7B76] outline-none font-medium"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} (Salaire de base: {emp.salary?.toLocaleString('fr-FR')} XAF)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Montant Total (XAF) *</label>
                  <input
                    type="number"
                    required
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2A7B76] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Remboursement sur (Mois) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={12}
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2A7B76] outline-none"
                  />
                </div>
              </div>

              <div className="bg-rose-50/60 p-3.5 rounded-2xl border border-rose-100 text-stone-800 space-y-1">
                <span className="font-bold text-[10px] text-rose-800 uppercase tracking-wide">Simulation de Retenue de Paie</span>
                <p className="text-[11px]">
                  Chaque mois, le salaire du collaborateur sera automatiquement débité de :
                  <b className="text-rose-700 block text-xs mt-1">-{monthlyInstallment.toLocaleString('fr-FR')} XAF / mois</b>
                </p>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Motif / Raison</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
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
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
