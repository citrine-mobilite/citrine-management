import React, { useState, useEffect } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { InventoryItem, InventoryAssignment, InventoryReturnRecord, InventoryItemStatus } from '../../types';

interface InventoryReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  targetAssignment?: InventoryAssignment | null;
  onReturn: (updatedItem: InventoryItem) => void;
  recordedBy?: string;
}

export const InventoryReturnModal: React.FC<InventoryReturnModalProps> = ({
  isOpen,
  onClose,
  item,
  targetAssignment,
  onReturn,
  recordedBy = 'Gestionnaire Stock',
}) => {
  const [selectedAssId, setSelectedAssId] = useState<string>('');
  const [returnQty, setReturnQty] = useState<number>(1);
  const [returnStatus, setReturnStatus] = useState<InventoryItemStatus>('usage');
  const [comments, setComments] = useState('');

  const activeAssignments = item?.assignments || [];
  const currentAss = targetAssignment || activeAssignments.find((a) => a.id === selectedAssId) || activeAssignments[0];

  useEffect(() => {
    if (currentAss) {
      setSelectedAssId(currentAss.id);
      setReturnQty(currentAss.quantity || 1);
      setReturnStatus(currentAss.status || 'usage');
    }
  }, [currentAss]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAss) return;

    const returnRecord: InventoryReturnRecord = {
      id: `ret-${Date.now()}`,
      employeeId: currentAss.employeeId,
      employeeName: currentAss.employeeName,
      returnDate: new Date().toISOString().split('T')[0],
      quantity: Number(returnQty),
      returnCondition: returnStatus as any,
      observations: comments,
      recordedBy,
    };

    const newMovement = {
      id: `mov-${Date.now()}`,
      type: 'restitution' as const,
      date: new Date().toISOString().split('T')[0],
      quantity: Number(returnQty),
      performedBy: recordedBy,
      recipientName: currentAss.employeeName,
      employeeId: currentAss.employeeId,
      notes: `Restitution de ${returnQty} un. par ${currentAss.employeeName} (${returnStatus.replace('_', ' ')})`,
    };

    // Update or remove assignment
    let updatedAssignments = [...activeAssignments];
    if (Number(returnQty) >= currentAss.quantity) {
      updatedAssignments = updatedAssignments.filter((a) => a.id !== currentAss.id);
    } else {
      updatedAssignments = updatedAssignments.map((a) =>
        a.id === currentAss.id ? { ...a, quantity: a.quantity - Number(returnQty) } : a
      );
    }

    const updatedItem: InventoryItem = {
      ...item,
      assignments: updatedAssignments,
      returns: [...(item.returns || []), returnRecord],
      movements: [...(item.movements || []), newMovement],
      updatedAt: new Date().toISOString(),
    };

    onReturn(updatedItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-[#2A7B76]/10 text-[#2A7B76] rounded-2xl shrink-0">
              <RotateCcw className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Restituer du matériel
              </h3>
              <p className="text-xs text-stone-500 font-medium mt-0.5">
                {currentAss ? `${currentAss.employeeName} • ${item.designation}` : item.designation}
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
          {!currentAss ? (
            <div className="p-4 text-center text-stone-500 bg-stone-50 rounded-2xl">
              Aucune attribution active sélectionnée.
            </div>
          ) : (
            <>
              {/* Field 1: Readonly initial attribution */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Attribution initiale :
                </label>
                <input
                  type="text"
                  readOnly
                  value={`${currentAss.quantity}x (${currentAss.status.replace('_', ' ')})`}
                  className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200/80 font-bold text-stone-800 outline-none cursor-not-allowed"
                />
              </div>

              {/* Field 2: Returned quantity */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Quantité restituée * (Max: {currentAss.quantity})
                </label>
                <input
                  type="number"
                  min={1}
                  max={currentAss.quantity}
                  required
                  value={returnQty}
                  onChange={(e) => setReturnQty(Number(e.target.value))}
                  className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200 font-bold focus:ring-2 focus:ring-[#2A7B76] outline-none"
                />
              </div>

              {/* Field 3: Return status */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  État au moment de la restitution *
                </label>
                <select
                  value={returnStatus}
                  onChange={(e) => setReturnStatus(e.target.value as InventoryItemStatus)}
                  className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200 font-bold focus:ring-2 focus:ring-[#2A7B76] outline-none"
                >
                  <option value="neuf">Neuf</option>
                  <option value="bon_etat">Bon état</option>
                  <option value="usage">Usagé / Moyen</option>
                  <option value="endommage">Endommagé</option>
                  <option value="en_reparation">En réparation</option>
                  <option value="hors_service">Hors service</option>
                </select>
              </div>

              {/* Field 4: Comments */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Commentaires sur l'état (Optionnel)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: RAS, rayure légère sur le boîtier..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#2A7B76] outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#2A7B76] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Valider la restitution
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
