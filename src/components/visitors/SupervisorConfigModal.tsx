import React, { useState } from 'react';
import { X, Save, Users, Wrench, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { BuildingSupervisor, saveBuildingSupervisor, removeBuildingSupervisor } from '../../services/supervisorService';

interface SupervisorConfigModalProps {
  currentSupervisors: BuildingSupervisor[];
  onClose: () => void;
  onSaved?: (updated: BuildingSupervisor[]) => void;
}

export const SupervisorConfigModal: React.FC<SupervisorConfigModalProps> = ({
  currentSupervisors,
  onClose,
  onSaved,
}) => {
  const [list, setList] = useState<BuildingSupervisor[]>(currentSupervisors);
  const [statusState, setStatusState] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUpdate = (index: number, field: keyof BuildingSupervisor, value: string) => {
    setList((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleAddSupervisor = () => {
    const newSup: BuildingSupervisor = {
      id: `sup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      domain: 'nouveau_domaine',
      label: 'Nouveau Domaine Technique',
      supervisorName: '',
      phone: '',
      createdAt: new Date().toISOString(),
    };
    setList((prev) => [...prev, newSup]);
  };

  const handleDelete = async (index: number) => {
    const target = list[index];
    if (target.id) {
      try {
        setStatusState('pending');
        await removeBuildingSupervisor(target.id);
        setStatusState('idle');
      } catch (err: any) {
        console.error('Error removing supervisor from DB:', err);
        setStatusState('error');
        setErrorMessage(err?.message || 'Erreur lors de la suppression en base de données');
        return;
      }
    }
    setList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusState('pending');
    setErrorMessage(null);
    try {
      const validList = list.filter((s) => s.supervisorName.trim());
      const results = await Promise.all(validList.map((sup) => saveBuildingSupervisor(sup)));

      setStatusState('success');
      onSaved?.(results);
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      console.error('Error saving supervisors to DB:', err);
      setStatusState('error');
      setErrorMessage(err?.message || 'Erreur lors de l\'enregistrement en base de données');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 border border-stone-200 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-50 text-amber-800 rounded-xl">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-stone-900">Gestion des Superviseurs (Base de Données)</h3>
              <p className="text-xs text-stone-500">
                Ajoutez autant de superviseurs que nécessaire pour tous les corps de métier
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-3">
            {list.map((sup, idx) => (
              <div
                key={sup.id || idx}
                className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 space-y-2.5 relative group"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-1">
                    <Wrench className="w-4 h-4 text-amber-700 shrink-0" />
                    <input
                      type="text"
                      required
                      placeholder="Intitulé du Domaine (ex: Électricité, Plomberie...)"
                      value={sup.label}
                      onChange={(e) => {
                        handleUpdate(idx, 'label', e.target.value);
                        if (!sup.domain || sup.domain === 'nouveau_domaine') {
                          handleUpdate(idx, 'domain', e.target.value.toLowerCase().replace(/\s+/g, '_'));
                        }
                      }}
                      className="font-bold text-stone-900 bg-white px-2.5 py-1 rounded-lg border border-stone-200 text-xs w-full max-w-xs focus:outline-none focus:border-[#2A7B76]"
                    />
                  </div>

                  {list.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDelete(idx)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Supprimer ce superviseur"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-semibold text-stone-600 block mb-0.5">
                      Nom & Prénom du Superviseur :
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ex: Ing. Mbah"
                      value={sup.supervisorName}
                      onChange={(e) => handleUpdate(idx, 'supervisorName', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-stone-900 font-semibold focus:outline-none focus:border-[#2A7B76]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-stone-600 block mb-0.5">
                      Téléphone / WhatsApp :
                    </label>
                    <input
                      type="text"
                      placeholder="+237 6..."
                      value={sup.phone || ''}
                      onChange={(e) => handleUpdate(idx, 'phone', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:border-[#2A7B76]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddSupervisor}
            className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded-xl border border-dashed border-amber-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-700" />
            <span>Ajouter un Superviseur supplémentaire</span>
          </button>

          <div className="flex items-center justify-between pt-3 border-t border-stone-100">
            {statusState === 'success' && (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Succès : Superviseurs enregistrés en base de données !
              </span>
            )}
            {statusState === 'pending' && (
              <span className="text-amber-600 font-semibold flex items-center gap-1 animate-pulse">
                ⏳ En attente : Enregistrement en cours en base de données...
              </span>
            )}
            {statusState === 'error' && (
              <span className="text-rose-600 font-semibold flex items-center gap-1">
                ❌ Erreur : {errorMessage || 'Échec de l\'enregistrement'}
              </span>
            )}
            {statusState === 'idle' && (
              <span className="text-[11px] text-stone-400">
                {list.length} superviseur(s) configuré(s)
              </span>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl font-bold hover:bg-stone-200 transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={statusState === 'pending'}
                className="px-5 py-2 bg-[#2A7B76] text-white rounded-xl font-bold hover:bg-[#236863] transition cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{statusState === 'pending' ? 'Enregistrement...' : 'Enregistrer en Base de Données'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
