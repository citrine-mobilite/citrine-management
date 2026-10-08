import React from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import { AppUser } from '../../types';

interface UserDeleteConfirmModalProps {
  user: AppUser | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export const UserDeleteConfirmModal: React.FC<UserDeleteConfirmModalProps> = ({
  user,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-sm w-full overflow-hidden p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
          <Trash2 className="h-6 w-6" />
        </div>

        <div className="space-y-1">
          <h3 className="font-serif font-bold text-base text-stone-900">Supprimer cet utilisateur ?</h3>
          <p className="text-xs text-stone-500">
            Êtes-vous sûr de vouloir supprimer définitivement le compte de <b>{user.name}</b> ({user.email}) ?
          </p>
        </div>

        <div className="flex gap-2 justify-center pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
};
