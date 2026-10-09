import React from 'react';
import { Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import { DisciplinaryReason, DisciplinaryCategory } from '../../services/disciplinaryReasonsService';

export const CATEGORY_MAP: Record<DisciplinaryCategory, { label: string; color: string; badgeBg: string }> = {
  renvoi: { label: 'Renvoi / Licenciement', color: 'text-rose-700', badgeBg: 'bg-rose-100 text-rose-800 border-rose-200' },
  suspension: { label: 'Suspension / Mise à pied', color: 'text-amber-700', badgeBg: 'bg-amber-100 text-amber-800 border-amber-200' },
  changement_poste: { label: 'Mutation / Changement de Poste', color: 'text-blue-700', badgeBg: 'bg-blue-100 text-blue-800 border-blue-200' },
  avertissement: { label: 'Avertissement / Recadrage', color: 'text-orange-700', badgeBg: 'bg-orange-100 text-orange-800 border-orange-200' },
  depart_volontaire: { label: 'Départ Volontaire / Démission', color: 'text-purple-700', badgeBg: 'bg-purple-100 text-purple-800 border-purple-200' },
  fin_contrat: { label: 'Fin Contrat / Période d\'essai', color: 'text-teal-700', badgeBg: 'bg-teal-100 text-teal-800 border-teal-200' },
  commun: { label: 'Général / Règlement Intérieur', color: 'text-stone-700', badgeBg: 'bg-stone-100 text-stone-800 border-stone-200' },
};

interface DisciplinaryMotifsTableProps {
  reasons: DisciplinaryReason[];
  onToggle: (id: string) => void;
  onOpenEdit: (reason: DisciplinaryReason) => void;
  onDelete: (id: string) => void;
}

export const DisciplinaryMotifsTable: React.FC<DisciplinaryMotifsTableProps> = ({
  reasons,
  onToggle,
  onOpenEdit,
  onDelete,
}) => {
  return (
    <div className="overflow-x-auto rounded-2xl border border-stone-100">
      <table className="w-full text-left text-xs">
        <thead className="bg-stone-50 text-stone-500 text-[10px] uppercase font-bold border-b border-stone-100">
          <tr>
            <th className="py-3 px-4 w-12 text-center">N°</th>
            <th className="py-3 px-4">Libellé du Motif RH</th>
            <th className="py-3 px-4">Type / Catégorie</th>
            <th className="py-3 px-4 text-center">Statut</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 font-medium">
          {reasons.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-8 text-center text-stone-400 italic">
                Aucun motif ne correspond à ces critères.
              </td>
            </tr>
          ) : (
            reasons.map((reason, index) => {
              const catInfo = CATEGORY_MAP[reason.category] || CATEGORY_MAP.commun;
              return (
                <tr
                  key={reason.id}
                  className={`hover:bg-stone-50/70 transition ${
                    !reason.isActive ? 'bg-stone-50/40 opacity-60' : ''
                  }`}
                >
                  <td className="py-3 px-4 text-center font-mono text-stone-400 text-[11px]">
                    {index + 1}
                  </td>

                  <td className="py-3 px-4 font-semibold text-stone-900">
                    <span>{reason.label}</span>
                    {reason.isCustom && (
                      <span className="ml-2 px-1.5 py-0.2 text-[9px] font-bold bg-amber-50 text-amber-700 rounded border border-amber-200">
                        Personnalisé
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${catInfo.badgeBg}`}
                    >
                      {catInfo.label}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => onToggle(reason.id)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition cursor-pointer ${
                        reason.isActive
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                      }`}
                    >
                      {reason.isActive ? 'Actif' : 'Désactivé'}
                    </button>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenEdit(reason)}
                        className="p-1.5 text-stone-500 hover:text-[#2A7B76] hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                        title="Modifier ce motif"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>

                      {reason.isCustom && (
                        <button
                          type="button"
                          onClick={() => onDelete(reason.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Supprimer ce motif personnalisé"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
