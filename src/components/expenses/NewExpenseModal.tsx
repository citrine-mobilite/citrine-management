import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ExpenseClaim, ExpenseCategory, PaymentMode, Employee } from '../../types';

interface NewExpenseModalProps {
  employees: Employee[];
  isAdminOrManager: boolean;
  onClose: () => void;
  onSubmit: (claimData: Partial<ExpenseClaim>) => Promise<void>;
}

export const NewExpenseModal: React.FC<NewExpenseModalProps> = ({
  employees,
  isAdminOrManager,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<Partial<ExpenseClaim>>({
    employeeId: '',
    title: '',
    missionLocation: 'Douala (Base Japoma)',
    expenseDate: new Date().toISOString().split('T')[0],
    category: 'carburant',
    amount: 15000,
    receiptNumber: '',
    receiptDescription: '',
    paymentMode: 'orange_money',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-stone-200 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-stone-900">Soumettre une Note de Frais Citrine</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {isAdminOrManager && (
            <div>
              <label className="font-semibold text-stone-700">Collaborateur concerné</label>
              <select
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl bg-white"
              >
                <option value="">-- Choisir un collaborateur --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.department || 'Citrine'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="font-semibold text-stone-700">Motif de la dépense *</label>
            <input
              type="text"
              required
              placeholder="ex: Carburant mission livraison Limbé"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-[#2A7B76]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700">Montant (XAF) *</label>
              <input
                type="number"
                min="100"
                step="100"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700">Nature de la dépense</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl bg-white"
              >
                <option value="carburant">Carburant & Gazole</option>
                <option value="transport">Transport & Taxi</option>
                <option value="peage">Péages & Parking</option>
                <option value="restauration">Restauration</option>
                <option value="hebergement">Hébergement</option>
                <option value="materiel_urgence">Matériel / Pièce d'urgence</option>
                <option value="autre">Autre débours</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700">Date du débours</label>
              <input
                type="date"
                value={formData.expenseDate}
                onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700">Lieu de la mission</label>
              <input
                type="text"
                value={formData.missionLocation}
                onChange={(e) => setFormData({ ...formData, missionLocation: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700">N° Facture / Reçu</label>
              <input
                type="text"
                placeholder="ex: TOTAL-88912"
                value={formData.receiptNumber}
                onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700">Mode de remboursement</label>
              <select
                value={formData.paymentMode}
                onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value as PaymentMode })}
                className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl bg-white"
              >
                <option value="orange_money">Orange Money</option>
                <option value="mtn_momo">MTN Mobile Money</option>
                <option value="cash">Espèces (Caisse)</option>
                <option value="virement">Virement bancaire</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-stone-700">Détails justificatif / Observations</label>
            <textarea
              rows={2}
              value={formData.receiptDescription}
              onChange={(e) => setFormData({ ...formData, receiptDescription: e.target.value })}
              placeholder="Détails du fournisseur, contexte du débours..."
              className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-medium text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-[#2A7B76] hover:bg-[#236863] rounded-xl shadow-xs cursor-pointer"
            >
              Envoyer la note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
