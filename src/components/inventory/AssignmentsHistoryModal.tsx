import React from 'react';
import { History, X, User, RotateCcw } from 'lucide-react';
import { InventoryItem, InventoryAssignment } from '../../types';

interface AssignmentsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onOpenReturnForAssignment: (assignment: InventoryAssignment) => void;
}

export const AssignmentsHistoryModal: React.FC<AssignmentsHistoryModalProps> = ({
  isOpen,
  onClose,
  item,
  onOpenReturnForAssignment,
}) => {
  if (!isOpen || !item) return null;

  const assignments = item.assignments || [];

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-[#2A7B76]/10 text-[#2A7B76] rounded-2xl shrink-0">
              <History className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-900">
                Historique des Attributions
              </h3>
              <p className="text-xs text-stone-500 font-medium mt-0.5">
                {item.designation} ({item.reference || 'SANS-REF'})
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

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <p className="text-xs text-stone-500 italic">
            Liste triée des attributions de la plus récente à la plus ancienne :
          </p>

          {assignments.length === 0 ? (
            <div className="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200">
              <User className="h-8 w-8 text-stone-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-stone-700">
                Aucune attribution enregistrée pour ce matériel
              </p>
              <p className="text-[11px] text-stone-500 mt-1">
                Utilisez le bouton "Assigner" dans la liste du matériel pour attribuer cet équipement à un collaborateur.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map((ass) => (
                <div
                  key={ass.id}
                  className="p-4 bg-stone-50/80 rounded-2xl border border-stone-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-stone-300 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl border border-stone-200 text-[#2A7B76]">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-stone-900">{ass.employeeName}</h4>
                      <p className="text-[11px] text-stone-500">
                        Attribué le {ass.assignedAt}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="px-3 py-1 bg-white border border-stone-200/80 text-stone-800 rounded-xl text-xs font-bold font-mono">
                      {ass.quantity}x {ass.status.replace('_', ' ')}
                    </span>

                    <button
                      onClick={() => onOpenReturnForAssignment(ass)}
                      className="px-3 py-1.5 bg-[#2A7B76] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Restituer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
