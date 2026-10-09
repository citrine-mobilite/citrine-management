import React, { useState } from 'react';
import { X } from 'lucide-react';
import { HseIncident, HseIncidentType, HseSeverity } from '../../types';

interface NewHseIncidentModalProps {
  onClose: () => void;
  onSubmit: (incidentData: Partial<HseIncident>) => Promise<void>;
}

export const NewHseIncidentModal: React.FC<NewHseIncidentModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState<Partial<HseIncident>>({
    site: 'Base Logistique Japoma',
    zonePrecise: '',
    type: 'presque_accident',
    severity: 'faible',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    title: '',
    description: '',
    immediateActionTaken: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-stone-200 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-stone-900">Déclarer un Incident / Danger HSE</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-semibold text-stone-700">Titre de l'événement *</label>
            <input
              type="text"
              required
              placeholder="ex: Câble électrique dénudé près du quai Japoma"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-[#2A7B76]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700">Site d'occurrence</label>
              <select
                value={formData.site}
                onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl bg-white"
              >
                <option value="Base Logistique Japoma">Base Logistique Japoma</option>
                <option value="Siège Akwa">Siège Akwa</option>
                <option value="Atelier Mécanique Japoma">Atelier Mécanique Japoma</option>
                <option value="Chantier / Route">Chantier / Route Douala</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-stone-700">Zone précise</label>
              <input
                type="text"
                placeholder="ex: Fosse vidange / Parking"
                value={formData.zonePrecise}
                onChange={(e) => setFormData({ ...formData, zonePrecise: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700">Nature de l'événement</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as HseIncidentType })}
                className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl bg-white"
              >
                <option value="presque_accident">Presque-accident (Near-miss)</option>
                <option value="situation_dangereuse">Situation dangereuse</option>
                <option value="accident_sans_arret">Accident sans arrêt</option>
                <option value="accident_avec_arret">Accident avec arrêt</option>
                <option value="deversement_chimique">Déversement / Fuite huile</option>
                <option value="incendie_debut">Risque Incendie</option>
                <option value="degradation_materiel">Dommage matériel</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-stone-700">Niveau de gravité</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as HseSeverity })}
                className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl bg-white"
              >
                <option value="faible">Faible (Aucune séquelle)</option>
                <option value="modere">Modéré</option>
                <option value="grave">Grave</option>
                <option value="critique">Critique (Arrêt d'activité)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700">Heure approximative</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-stone-700">Description détaillée des faits *</label>
            <textarea
              rows={3}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Que s'est-il passé exactement ? Qui était présent ? Comment le danger a-t-il été découvert ?"
              className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700">Action d'urgence prise immédiatement</label>
            <input
              type="text"
              value={formData.immediateActionTaken}
              onChange={(e) => setFormData({ ...formData, immediateActionTaken: e.target.value })}
              placeholder="ex: Balisage avec ruban, coupure disjoncteur..."
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
              className="px-4 py-2 font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs cursor-pointer"
            >
              Enregistrer le signalement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
