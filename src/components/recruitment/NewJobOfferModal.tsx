import React, { useState } from 'react';
import { X } from 'lucide-react';
import { JobOffer, JobContractType } from '../../types';

interface NewJobOfferModalProps {
  onClose: () => void;
  onSubmit: (offer: Partial<JobOffer>) => Promise<void>;
}

export const NewJobOfferModal: React.FC<NewJobOfferModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState<Partial<JobOffer>>({
    title: '',
    department: 'Logistique & Exploitation',
    location: 'Base Logistique Japoma - Douala',
    contractType: 'CDI',
    openingsCount: 1,
    description: '',
    salaryRange: '',
    deadline: '',
    status: 'ouvert',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto border border-stone-200 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-stone-900">Publier une offre de poste Citrine</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-semibold text-stone-700">Intitulé du poste *</label>
            <input
              type="text"
              required
              placeholder="ex: Dispatcher Chauffeurs Japoma"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-[#2A7B76]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700">Département</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl bg-white"
              >
                <option value="Logistique & Exploitation">Logistique & Exploitation</option>
                <option value="Opérations Terrain">Opérations Terrain</option>
                <option value="Maintenance & Atelier">Maintenance & Atelier</option>
                <option value="Commercial & Partenariats">Commercial & Partenariats</option>
                <option value="Direction & Administration">Direction & Administration</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-stone-700">Type de contrat</label>
              <select
                value={formData.contractType}
                onChange={(e) => setFormData({ ...formData, contractType: e.target.value as JobContractType })}
                className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl bg-white"
              >
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="Stage">Stage</option>
                <option value="Prestation">Prestation</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700">Lieu d'affectation</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700">Nombre de postes</label>
              <input
                type="number"
                min="1"
                value={formData.openingsCount}
                onChange={(e) => setFormData({ ...formData, openingsCount: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-stone-700">Fourchette salariale indicative</label>
            <input
              type="text"
              placeholder="ex: 180 000 - 250 000 XAF"
              value={formData.salaryRange}
              onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700">Missions principales</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description des responsabilités quotidiennes..."
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
              Enregistrer l'offre
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
