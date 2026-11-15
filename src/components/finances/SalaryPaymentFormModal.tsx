import React from 'react';
import { X, Save } from 'lucide-react';
import { Employee, EmployeeSalaryDebt } from '../../types';
import { ModalPortal } from '../common/ModalPortal';

interface SalaryPaymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  employees: Employee[];
  selectedEmployeeId: string;
  onSelectEmployee: (id: string) => void;
  period: string;
  onChangePeriod: (val: string) => void;
  bonusAmount: number;
  onChangeBonusAmount: (val: number) => void;
  paymentMethod: 'transfer' | 'cash' | 'check' | 'other';
  onChangePaymentMethod: (val: 'transfer' | 'cash' | 'check' | 'other') => void;
  notes: string;
  onChangeNotes: (val: string) => void;
  currentBaseSalary: number;
  activeLoanForForm?: EmployeeSalaryDebt;
  activeLoanDeduction: number;
  calculatedNetSalary: number;
  formatXAF: (val: number) => string;
}

export const SalaryPaymentFormModal: React.FC<SalaryPaymentFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  employees,
  selectedEmployeeId,
  onSelectEmployee,
  period,
  onChangePeriod,
  bonusAmount,
  onChangeBonusAmount,
  paymentMethod,
  onChangePaymentMethod,
  notes,
  onChangeNotes,
  currentBaseSalary,
  activeLoanForForm,
  activeLoanDeduction,
  calculatedNetSalary,
  formatXAF,
}) => {
  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
        <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] shadow-2xl border border-stone-200 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 shrink-0 bg-white">
            <h3 className="font-serif font-bold text-base text-stone-900">Enregistrer un Salaire Net</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:bg-stone-100 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col min-h-0 flex-1">
            <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Collaborateur *</label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => onSelectEmployee(e.target.value)}
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
                  onChange={(e) => onChangePeriod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2A7B76] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Primes ou Bonus (XAF)</label>
                  <input
                    type="number"
                    value={bonusAmount}
                    onChange={(e) => onChangeBonusAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2A7B76] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Méthode de paiement</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) =>
                      onChangePaymentMethod(e.target.value as 'transfer' | 'cash' | 'check' | 'other')
                    }
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2A7B76] outline-none"
                  >
                    <option value="transfer">Virement Bancaire</option>
                    <option value="cash">Espèces / Cash</option>
                    <option value="check">Chèque</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
              </div>

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
                  onChange={(e) => onChangeNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2A7B76] outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-stone-100 bg-stone-50/70 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 font-bold text-xs cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#2A7B76] text-white hover:bg-[#236864] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Save className="h-4 w-4" />
                Valider la paie
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};
