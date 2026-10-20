import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { showSuccessAlert, showErrorAlert } from '../../utils/sweetAlert';

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
  showToast,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [resultState, setResultState] = useState<'success' | 'error' | null>(null);

  if (!isOpen) return null;

  const handleExecuteDelete = async () => {
    setIsDeleting(true);
    setResultState(null);
    const deletedName = itemName;
    try {
      await onConfirm();
      setResultState('success');
      setTimeout(async () => {
        setIsDeleting(false);
        setResultState(null);
        onClose();
        await showSuccessAlert(
          'Suppression réussie !',
          deletedName ? `"${deletedName}" a été supprimé avec succès.` : 'L\'élément a été supprimé avec succès.'
        );
      }, 600);
    } catch (err: any) {
      setResultState('error');
      setTimeout(async () => {
        setIsDeleting(false);
        setResultState(null);
        onClose();
        await showErrorAlert(
          'Échec de la suppression',
          err?.message || 'Une erreur est survenue lors de la suppression.'
        );
      }, 600);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-5 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
              <Trash2 className="h-5 w-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-stone-900">{title}</h3>
          </div>
          {!isDeleting && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:bg-stone-100 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content / States */}
        {isDeleting && resultState === null ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center">
            <Loader2 className="h-10 w-10 text-[#2A7B76] animate-spin" />
            <span className="text-xs font-bold text-stone-700">Suppression en cours...</span>
            <span className="text-[10px] text-stone-400">Veuillez patienter pendant la synchronisation.</span>
          </div>
        ) : resultState === 'success' ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center animate-in zoom-in duration-300">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-200">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <span className="text-sm font-bold text-emerald-900">Suppression réussie !</span>
            <span className="text-[10px] text-emerald-700">L'élément a été supprimé avec succès.</span>
          </div>
        ) : resultState === 'error' ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center animate-in zoom-in duration-300">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center border border-rose-200">
              <AlertCircle className="h-7 w-7" />
            </div>
            <span className="text-sm font-bold text-rose-900">Échec de la suppression</span>
            <span className="text-[10px] text-rose-700">Une erreur est survenue lors de l'opération.</span>
          </div>
        ) : (
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
        )}

        {/* Footer actions */}
        {!isDeleting && resultState === null && (
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
        )}

      </div>
    </div>
  );
};
