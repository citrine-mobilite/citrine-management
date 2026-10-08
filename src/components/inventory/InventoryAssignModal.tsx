import React, { useState } from 'react';
import { X, User } from 'lucide-react';
import { InventoryItem, Employee, InventoryItemStatus } from '../../types';

interface InventoryAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  employees: Employee[];
  onAssign: (updatedItem: InventoryItem) => void;
  performedBy?: string;
}

export const InventoryAssignModal: React.FC<InventoryAssignModalProps> = ({
  isOpen,
  onClose,
  item,
  employees,
  onAssign,
  performedBy = 'Responsable Matériel',
}) => {
  const [employeeId, setEmployeeId] = useState('');
  const [statusToAssign, setStatusToAssign] = useState<InventoryItemStatus>('neuf');
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState('');

  if (!isOpen || !item) return null;

  // Calculate quantities by status
  const quantitiesByStatus = item.quantitiesByStatus || {
    neuf: item.status === 'neuf' ? item.quantity : 0,
    bon_etat: item.status === 'bon_etat' ? item.quantity : 0,
    usage: item.status === 'usage' ? item.quantity : 0,
    endommage: item.status === 'endommage' ? item.quantity : 0,
    en_reparation: item.status === 'en_reparation' ? item.quantity : 0,
    hors_service: item.status === 'hors_service' ? item.quantity : 0,
  };

  // Calculate available quantity for selected status
  const currentAssignedQty = (item.assignments || []).reduce((acc, a) => acc + a.quantity, 0);
  const totalAvailable = Math.max(0, item.quantity - currentAssignedQty);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return;

    if (quantity > totalAvailable) {
      alert(`La quantité disponible en stock est limitée à ${totalAvailable}.`);
      return;
    }

    const empName = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim();

    const newAssignment = {
      id: `ass-${Date.now()}`,
      employeeId: emp.id,
      employeeName: empName,
      quantity: Number(quantity),
      status: statusToAssign,
      assignedAt: new Date().toISOString().split('T')[0],
      notes,
    };

    const newMovement = {
      id: `mov-${Date.now()}`,
      type: 'affectation' as const,
      date: new Date().toISOString().split('T')[0],
      quantity: Number(quantity),
      performedBy,
      recipientName: empName,
      employeeId: emp.id,
      itemStatus: statusToAssign,
      notes: notes || `Dotation matériel (${statusToAssign.replace('_', ' ')}) à ${empName}`,
    };

    const updatedItem: InventoryItem = {
      ...item,
      assignments: [...(item.assignments || []), newAssignment],
      movements: [...(item.movements || []), newMovement],
      assignedToId: emp.id,
      updatedAt: new Date().toISOString(),
    };

    onAssign(updatedItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-[#2A7B76]/10 text-[#2A7B76] rounded-2xl shrink-0">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Attribuer du matériel
              </h3>
              <p className="text-xs text-stone-500 font-medium mt-0.5">
                {item.designation}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Field 1: Collaborateur */}
          <div>
            <label className="block font-bold text-stone-700 mb-1">
              Sélectionner le Collaborateur *
            </label>
            <select
              required
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200 font-bold focus:ring-2 focus:ring-[#2A7B76] outline-none"
            >
              <option value="">-- Sélectionner un employé --</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name || `${e.firstName || ''} ${e.lastName || ''}`.trim()} ({e.role || e.roleType || 'Collaborateur'})
                </option>
              ))}
            </select>
          </div>

          {/* Field 2: Status choice with stock count */}
          <div>
            <label className="block font-bold text-stone-700 mb-1">
              État du matériel à assigner *
            </label>
            <select
              value={statusToAssign}
              onChange={(e) => setStatusToAssign(e.target.value as InventoryItemStatus)}
              className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200 font-bold focus:ring-2 focus:ring-[#2A7B76] outline-none"
            >
              <option value="neuf">Neuf (Disponible en stock : {quantitiesByStatus.neuf || totalAvailable})</option>
              <option value="bon_etat">Bon état (Disponible en stock : {quantitiesByStatus.bon_etat || totalAvailable})</option>
              <option value="usage">Usagé / Moyen (Disponible en stock : {quantitiesByStatus.usage || totalAvailable})</option>
            </select>
          </div>

          {/* Field 3: Quantity */}
          <div>
            <label className="block font-bold text-stone-700 mb-1">
              Quantité à assigner *
            </label>
            <input
              type="number"
              min={1}
              max={totalAvailable || 1}
              required
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200 font-bold focus:ring-2 focus:ring-[#2A7B76] outline-none"
            />
          </div>

          {/* Field 4: Notes / Motif */}
          <div>
            <label className="block font-bold text-stone-700 mb-1">
              Notes / Motif d'attribution (Optionnel)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Dotation poste de travail, mission externe..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#2A7B76] outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={totalAvailable <= 0}
              className="px-5 py-2.5 bg-[#2A7B76] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
            >
              Confirmer l'attribution
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
