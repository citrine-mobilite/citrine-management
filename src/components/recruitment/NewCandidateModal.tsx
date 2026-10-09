import React, { useState } from 'react';
import { X } from 'lucide-react';
import { JobOffer, JobApplication } from '../../types';

interface NewCandidateModalProps {
  offers: JobOffer[];
  onClose: () => void;
  onSubmit: (appData: Partial<JobApplication>) => Promise<void>;
}

export const NewCandidateModal: React.FC<NewCandidateModalProps> = ({ offers, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<Partial<JobApplication>>({
    jobOfferId: '',
    candidateName: '',
    candidateEmail: '',
    candidatePhone: '',
    candidateCity: 'Douala',
    currentPosition: '',
    experienceYears: 1,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto border border-stone-200 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-stone-900">Enregistrer un candidat dans le vivier</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-semibold text-stone-700">Poste ciblé</label>
            <select
              value={formData.jobOfferId}
              onChange={(e) => setFormData({ ...formData, jobOfferId: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl bg-white"
            >
              <option value="">-- Candidature spontanée / Vivier général --</option>
              {offers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-stone-700">Nom et Prénom du candidat *</label>
            <input
              type="text"
              required
              placeholder="ex: Samuel Eto'o Junior"
              value={formData.candidateName}
              onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700">Téléphone (WhatsApp) *</label>
              <input
                type="text"
                required
                placeholder="+237 6..."
                value={formData.candidatePhone}
                onChange={(e) => setFormData({ ...formData, candidatePhone: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700">Email</label>
              <input
                type="email"
                placeholder="candidat@email.com"
                value={formData.candidateEmail}
                onChange={(e) => setFormData({ ...formData, candidateEmail: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700">Poste actuel / Métier</label>
              <input
                type="text"
                placeholder="ex: Chauffeur VTC / Magasinier"
                value={formData.currentPosition}
                onChange={(e) => setFormData({ ...formData, currentPosition: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700">Années d'expérience</label>
              <input
                type="number"
                min="0"
                value={formData.experienceYears}
                onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-stone-700">Notes d'appréciation / Compétences clés</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Permis, sérieux, disponibilité, avis lors du premier contact..."
              className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl"
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
              Ajouter au vivier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
