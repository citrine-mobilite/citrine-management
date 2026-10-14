import React, { useState } from 'react';
import { X, Bell } from 'lucide-react';

interface AlertCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAlert: (alertData: {
    title: string;
    message: string;
    type: 'urgent' | 'warning' | 'info';
    category: 'Alerte' | 'Pointage' | 'Sécurité' | 'Congés';
  }) => void;
}

export const AlertCreateModal: React.FC<AlertCreateModalProps> = ({
  isOpen,
  onClose,
  onCreateAlert,
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'urgent' | 'warning' | 'info'>('warning');
  const [category, setCategory] = useState<'Alerte' | 'Pointage' | 'Sécurité' | 'Congés'>('Alerte');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    onCreateAlert({
      title: title.trim(),
      message: message.trim(),
      type,
      category,
    });

    setTitle('');
    setMessage('');
    setType('warning');
    setCategory('Alerte');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-stone-200 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100/70 text-amber-700 rounded-xl">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Créer une Nouvelle Alerte
              </h3>
              <p className="text-[11px] text-stone-400">Émission d'une alerte ou notification personnelle</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:bg-stone-100 cursor-pointer transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-stone-700 mb-1">
              Titre de l'alerte *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Rappel réunion importante, Vérification équipement..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none text-stone-900 font-semibold"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">
              Message détaillé *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Contenu complet de l'alerte..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none text-stone-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Niveau de criticité</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none font-bold text-stone-800"
              >
                <option value="info">Information (Normale)</option>
                <option value="warning">Avertissement (Attention)</option>
                <option value="urgent">Urgent (Critique)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-stone-700 mb-1">Catégorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none font-bold text-stone-800"
              >
                <option value="Alerte">Alerte</option>
                <option value="Pointage">Pointage</option>
                <option value="Sécurité">Sécurité</option>
                <option value="Congés">Congés</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#2A7B76] hover:bg-[#20615d] text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              Diffuser l'alerte
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
