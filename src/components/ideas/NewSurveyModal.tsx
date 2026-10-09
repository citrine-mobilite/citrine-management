import React, { useState } from 'react';
import { X } from 'lucide-react';

interface NewSurveyModalProps {
  onClose: () => void;
  onSubmit: (surveyData: {
    title: string;
    description: string;
    category: string;
    options: string[];
  }) => Promise<void>;
}

export const NewSurveyModal: React.FC<NewSurveyModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Vie d\'entreprise',
    options: ['', '', ''],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-stone-200 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-stone-900">Créer un Sondage d'Entreprise</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-semibold text-stone-700">Titre de la consultation *</label>
            <input
              type="text"
              required
              placeholder="ex: Aménagement des horaires de service"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-[#2A7B76]"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700">Contexte / Explication</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Pourquoi pose-t-on cette question aux collaborateurs..."
              className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <label className="font-semibold text-stone-700">Options de réponse (au moins 2)</label>
            {formData.options.map((opt, idx) => (
              <input
                key={idx}
                type="text"
                placeholder={`Option ${idx + 1}`}
                value={opt}
                onChange={(e) => {
                  const updated = [...formData.options];
                  updated[idx] = e.target.value;
                  setFormData({ ...formData, options: updated });
                }}
                className="w-full px-3 py-2 border border-stone-200 rounded-xl"
              />
            ))}
            <button
              type="button"
              onClick={() => setFormData({ ...formData, options: [...formData.options, ''] })}
              className="text-xs text-[#2A7B76] font-semibold hover:underline cursor-pointer"
            >
              + Ajouter une option supplémentaire
            </button>
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
              Lancer la consultation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
