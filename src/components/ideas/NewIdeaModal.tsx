import React, { useState } from 'react';
import { X } from 'lucide-react';
import { IdeaSuggestion, IdeaCategory } from '../../types';

interface NewIdeaModalProps {
  onClose: () => void;
  onSubmit: (ideaData: Partial<IdeaSuggestion>) => Promise<void>;
}

export const NewIdeaModal: React.FC<NewIdeaModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState<Partial<IdeaSuggestion>>({
    title: '',
    description: '',
    category: 'innovation_logistique',
    isAnonymous: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-stone-200 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-stone-900">Proposer une Idée d'Amélioration</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-semibold text-stone-700">Titre synthétique de l'idée *</label>
            <input
              type="text"
              required
              placeholder="ex: Abri de repos et fontaine à la base logistique"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-[#2A7B76]"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700">Domaine concerné</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as IdeaCategory })}
              className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl bg-white"
            >
              <option value="innovation_logistique">Innovation Logistique & Flotte</option>
              <option value="vie_au_bureau">Vie au Bureau & Confort</option>
              <option value="processus_outils">Processus & Logiciels / Outils</option>
              <option value="bien_etre_securite">Bien-être au travail & Sécurité</option>
              <option value="environnement_rse">RSE & Environnement</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-stone-700">Description détaillée de votre proposition *</label>
            <textarea
              rows={4}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Quel est le problème actuel constaté ? Quelle solution suggérez-vous ? Quels sont les bénéfices attendus ?"
              className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl"
            />
          </div>

          {/* Anonymat Toggle */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
            <div>
              <p className="font-bold text-stone-800">Déposer de manière anonyme</p>
              <p className="text-[11px] text-stone-500">Votre nom ne sera visible ni des collègues ni de la direction.</p>
            </div>
            <input
              type="checkbox"
              checked={formData.isAnonymous}
              onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
              className="w-4 h-4 text-[#2A7B76] rounded cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-medium text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-[#2A7B76] hover:bg-[#236863] rounded-xl shadow-xs cursor-pointer"
            >
              Partager l'idée
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
