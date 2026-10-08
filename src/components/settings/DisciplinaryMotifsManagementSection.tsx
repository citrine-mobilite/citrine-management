import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Pencil,
  ShieldAlert, 
  FileText,
  Search,
  Filter,
  Layers,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { 
  disciplinaryReasonsService, 
  DisciplinaryReason, 
  DisciplinaryCategory 
} from '../../services/disciplinaryReasonsService';

interface DisciplinaryMotifsManagementSectionProps {
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

const CATEGORY_MAP: Record<DisciplinaryCategory, { label: string; color: string; badgeBg: string }> = {
  renvoi: { label: 'Renvoi / Licenciement', color: 'text-rose-700', badgeBg: 'bg-rose-100 text-rose-800 border-rose-200' },
  suspension: { label: 'Suspension / Mise à pied', color: 'text-amber-700', badgeBg: 'bg-amber-100 text-amber-800 border-amber-200' },
  changement_poste: { label: 'Mutation / Changement de Poste', color: 'text-blue-700', badgeBg: 'bg-blue-100 text-blue-800 border-blue-200' },
  avertissement: { label: 'Avertissement / Recadrage', color: 'text-orange-700', badgeBg: 'bg-orange-100 text-orange-800 border-orange-200' },
  depart_volontaire: { label: 'Départ Volontaire / Démission', color: 'text-purple-700', badgeBg: 'bg-purple-100 text-purple-800 border-purple-200' },
  fin_contrat: { label: 'Fin Contrat / Période d\'essai', color: 'text-teal-700', badgeBg: 'bg-teal-100 text-teal-800 border-teal-200' },
  commun: { label: 'Général / Règlement Intérieur', color: 'text-stone-700', badgeBg: 'bg-stone-100 text-stone-800 border-stone-200' },
};

export const DisciplinaryMotifsManagementSection: React.FC<DisciplinaryMotifsManagementSectionProps> = ({
  showToast,
}) => {
  const [reasons, setReasons] = useState<DisciplinaryReason[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [newCategory, setNewCategory] = useState<DisciplinaryCategory>('renvoi');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Edit Modal State
  const [editingReason, setEditingReason] = useState<DisciplinaryReason | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editCategory, setEditCategory] = useState<DisciplinaryCategory>('renvoi');

  useEffect(() => {
    loadReasons();
  }, []);

  const loadReasons = () => {
    const list = disciplinaryReasonsService.getAllReasons();
    setReasons(list);
  };

  const handleAddReason = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    disciplinaryReasonsService.addCustomReason(newLabel.trim(), newCategory);
    setNewLabel('');
    loadReasons();
    if (showToast) showToast('Nouveau motif RH enregistré avec succès dans la table.', 'success');
  };

  const handleToggle = (id: string) => {
    const updated = disciplinaryReasonsService.toggleReasonActive(id);
    setReasons(updated);
    if (showToast) showToast('Statut du motif mis à jour.', 'success');
  };

  const handleOpenEdit = (reason: DisciplinaryReason) => {
    setEditingReason(reason);
    setEditLabel(reason.label);
    setEditCategory(reason.category);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReason || !editLabel.trim()) return;

    const updated = disciplinaryReasonsService.updateReason(editingReason.id, {
      label: editLabel.trim(),
      category: editCategory,
    });
    setReasons(updated);
    setEditingReason(null);
    if (showToast) showToast('Motif RH modifié avec succès.', 'success');
  };

  const handleDelete = (id: string) => {
    const updated = disciplinaryReasonsService.deleteReason(id);
    setReasons(updated);
    if (showToast) showToast('Motif personnalisé supprimé de la table.', 'success');
  };

  // Filter and limit to 15 latest created entries as requested
  const filtered = reasons.filter((r) => {
    const matchesSearch = r.label.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'all' || r.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const latest15Reasons = filtered.slice(0, 15);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-700 rounded-2xl border border-rose-100">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-stone-900">
              Registre des Motifs RH & Statuts Collaborateurs
            </h3>
            <p className="text-xs text-stone-500">
              Nomenclature des motifs réglementaires : renvois, suspensions, mutations, départs et avertissements (15 derniers motifs affichés).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl font-mono">
            {reasons.filter((r) => r.isActive).length} actifs / {reasons.length} total
          </span>
        </div>
      </div>

      {/* Formulaire d'ajout rapide de motif */}
      <form onSubmit={handleAddReason} className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-3">
        <h4 className="font-bold text-xs text-stone-900 flex items-center gap-2">
          <Plus className="h-4 w-4 text-[#2A7B76]" /> Ajouter un nouveau motif RH
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
          <div className="sm:col-span-7">
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
              Libellé circonstancié du motif :
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Insuffisance professionnelle répétée, refus de signer la feuille de pointage..."
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:border-[#2A7B76]"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
              Type / Catégorie RH :
            </label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as DisciplinaryCategory)}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 focus:outline-none focus:border-[#2A7B76]"
            >
              <option value="renvoi">Renvoi / Licenciement</option>
              <option value="suspension">Suspension / Mise à pied</option>
              <option value="changement_poste">Mutation / Poste</option>
              <option value="avertissement">Avertissement</option>
              <option value="depart_volontaire">Démission / Départ</option>
              <option value="fin_contrat">Fin Contrat / Période essai</option>
              <option value="commun">Général / Commun</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Enregistrer</span>
            </button>
          </div>
        </div>
      </form>

      {/* DataTable des 15 derniers motifs créés */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden space-y-3 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <h4 className="font-serif font-bold text-xs text-stone-900 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-[#2A7B76]" /> DataTable des 15 Derniers Motifs ({latest15Reasons.length})
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-48 sm:w-64">
              <Search className="h-3.5 w-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher un motif..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-[#2A7B76]"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 focus:outline-none"
            >
              <option value="all">Tous les types</option>
              <option value="renvoi">Renvois</option>
              <option value="suspension">Suspensions</option>
              <option value="changement_poste">Changements de poste</option>
              <option value="avertissement">Avertissements</option>
              <option value="depart_volontaire">Départs volontaires</option>
              <option value="fin_contrat">Fins de contrat</option>
            </select>
          </div>
        </div>

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
              {latest15Reasons.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-stone-400 italic">
                    Aucun motif ne correspond à ces critères.
                  </td>
                </tr>
              ) : (
                latest15Reasons.map((reason, index) => {
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
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                            Personnalisé
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${catInfo.badgeBg}`}>
                          {catInfo.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggle(reason.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold border transition cursor-pointer ${
                            reason.isActive
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : 'bg-stone-100 border-stone-200 text-stone-500'
                          }`}
                        >
                          {reason.isActive ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-600" />
                              <span>Actif</span>
                            </>
                          ) : (
                            <>
                              <X className="h-3 w-3 text-stone-400" />
                              <span>Inactif</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(reason)}
                            className="p-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 transition cursor-pointer"
                            title="Modifier ce motif"
                          >
                            <Pencil className="h-3.5 w-3.5 text-[#2A7B76]" />
                          </button>

                          {reason.isCustom && (
                            <button
                              type="button"
                              onClick={() => handleDelete(reason.id)}
                              className="p-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                              title="Supprimer ce motif"
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
      </div>

      {/* Modal de Modification d'un Motif */}
      {editingReason && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-stone-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
                <Pencil className="h-4 w-4 text-[#2A7B76]" /> Modifier le Motif RH
              </h3>
              <button
                onClick={() => setEditingReason(null)}
                className="p-1 rounded-xl text-stone-400 hover:bg-stone-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-stone-500 block">
                  Libellé du Motif :
                </label>
                <textarea
                  rows={3}
                  required
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:border-[#2A7B76]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-stone-500 block">
                  Type / Catégorie RH :
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as DisciplinaryCategory)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 focus:outline-none focus:border-[#2A7B76]"
                >
                  <option value="renvoi">Renvoi / Licenciement</option>
                  <option value="suspension">Suspension / Mise à pied</option>
                  <option value="changement_poste">Mutation / Poste</option>
                  <option value="avertissement">Avertissement</option>
                  <option value="depart_volontaire">Démission / Départ</option>
                  <option value="fin_contrat">Fin Contrat / Période essai</option>
                  <option value="commun">Général / Commun</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingReason(null)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
                >
                  Enregistrer les Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
