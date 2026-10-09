import React, { useState, useEffect } from 'react';
import { Plus, ShieldAlert, Search, Layers } from 'lucide-react';
import { 
  disciplinaryReasonsService, 
  DisciplinaryReason, 
  DisciplinaryCategory 
} from '../../services/disciplinaryReasonsService';
import { DisciplinaryMotifsTable, CATEGORY_MAP } from './DisciplinaryMotifsTable';
import { DisciplinaryMotifEditModal } from './DisciplinaryMotifEditModal';

interface DisciplinaryMotifsManagementSectionProps {
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

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
          <Plus className="h-4 w-4 text-[#2A7B76]" /> Ajouter un Nouveau Motif Réglementaire
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-7">
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
              Libellé du motif :
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

        <DisciplinaryMotifsTable
          reasons={latest15Reasons}
          onToggle={handleToggle}
          onOpenEdit={handleOpenEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Edit Modal */}
      <DisciplinaryMotifEditModal
        editingReason={editingReason}
        editLabel={editLabel}
        setEditLabel={setEditLabel}
        editCategory={editCategory}
        setEditCategory={setEditCategory}
        onClose={() => setEditingReason(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
};
