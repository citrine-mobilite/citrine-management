import React from 'react';
import { X, Check } from 'lucide-react';
import { DisciplinaryReason, DisciplinaryCategory } from '../../services/disciplinaryReasonsService';

interface DisciplinaryMotifEditModalProps {
  editingReason: DisciplinaryReason | null;
  editLabel: string;
  setEditLabel: (val: string) => void;
  editCategory: DisciplinaryCategory;
  setEditCategory: (cat: DisciplinaryCategory) => void;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
}

export const DisciplinaryMotifEditModal: React.FC<DisciplinaryMotifEditModalProps> = ({
  editingReason,
  editLabel,
  setEditLabel,
  editCategory,
  setEditCategory,
  onClose,
  onSave,
}) => {
  if (!editingReason) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-stone-200 space-y-4 animate-in fade-in duration-200">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h4 className="font-serif font-bold text-sm text-stone-900">
            Modifier le Motif Réglementaire
          </h4>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-4 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
              Libellé officiel :
            </label>
            <textarea
              rows={3}
              required
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-[#2A7B76]"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
              Catégorie :
            </label>
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value as DisciplinaryCategory)}
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 focus:outline-none"
            >
              <option value="renvoi">Renvoi / Licenciement</option>
              <option value="suspension">Suspension / Mise à pied</option>
              <option value="changement_poste">Mutation / Changement de Poste</option>
              <option value="avertissement">Avertissement / Recadrage</option>
              <option value="depart_volontaire">Départ Volontaire / Démission</option>
              <option value="fin_contrat">Fin Contrat / Période d'essai</option>
              <option value="commun">Général / Règlement Intérieur</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="h-4 w-4" />
              <span>Enregistrer les modifications</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
