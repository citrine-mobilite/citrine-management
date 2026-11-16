import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { executeOperationWithLoading } from '../../utils/sweetAlert';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  itemName?: string;
  onClose: () => void;
  onConfirm: () => Promise<boolean | void> | void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title = 'Confirmer la suppression',
  message = 'Voulez-vous vraiment supprimer cet élément ? Cette action est irréversible.',
  itemName,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  const handleExecuteDelete = async () => {
    const deletedName = itemName;
    onClose();
    await executeOperationWithLoading({
      loadingTitle: 'Suppression en cours...',
      loadingText: 'Veuillez patienter pendant la suppression...',
      action: async () => {
        await onConfirm();
      },
      successTitle: 'Suppression réussie !',
      successMessage: deletedName
        ? `"${deletedName}" a été supprimé avec succès.`
        : "L'élément a été supprimé avec succès.",
      errorMessage: 'Une erreur est survenue lors de la suppression.',
    });
  };

  return (
    <div className="fixed inset-0 z-[120] bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
              <Trash2 className="h-5 w-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-stone-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:bg-stone-100 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed font-medium">
              {message}
              {itemName && (
                <div className="mt-1 font-bold text-amber-950">
                  Élément : "{itemName}"
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs hover:bg-stone-200 transition cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleExecuteDelete}
            className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            <span>Confirmer la suppression</span>
          </button>
        </div>
      </div>
    </div>
  );
};
