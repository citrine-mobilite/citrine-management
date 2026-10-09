import React, { useState } from 'react';
import { X } from 'lucide-react';
import { VisitorLog, VisitorPurpose, Employee } from '../../types';

interface NewVisitorModalProps {
  employees: Employee[];
  visitorsCount: number;
  onClose: () => void;
  onSubmit: (visitorData: Partial<VisitorLog>) => Promise<void>;
}

export const NewVisitorModal: React.FC<NewVisitorModalProps> = ({
  employees,
  visitorsCount,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<Partial<VisitorLog>>({
    visitorName: '',
    visitorCompany: '',
    visitorPhone: '',
    idCardNumber: '',
    siteLocation: 'Base Logistique Japoma',
    purpose: 'rdv_commercial',
    hostEmployeeId: '',
    hostEmployeeName: '',
    badgeNumber: `BADGE-${String(visitorsCount + 1).padStart(2, '0')}`,
    vehiclePlate: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-stone-200 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-stone-900">Enregistrer une Entrée Visiteur</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700">Site d'accueil *</label>
              <select
                value={formData.siteLocation}
                onChange={(e) => setFormData({ ...formData, siteLocation: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl bg-white"
              >
                <option value="Base Logistique Japoma">Base Logistique Japoma</option>
                <option value="Siège Akwa">Siège Akwa (Boulevard Liberté)</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-stone-700">Numéro de Badge remis</label>
              <input
                type="text"
                placeholder="ex: BADGE-JAP-12"
                value={formData.badgeNumber}
                onChange={(e) => setFormData({ ...formData, badgeNumber: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-stone-700">Nom et Prénom du visiteur *</label>
            <input
              type="text"
              required
              placeholder="ex: Paul Biya Junior"
              value={formData.visitorName}
              onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-[#2A7B76]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700">Société / Organisme</label>
              <input
                type="text"
                placeholder="ex: Yango Cameroun / CTL"
                value={formData.visitorCompany}
                onChange={(e) => setFormData({ ...formData, visitorCompany: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700">Téléphone (WhatsApp) *</label>
              <input
                type="text"
                required
                placeholder="+237 6..."
                value={formData.visitorPhone}
                onChange={(e) => setFormData({ ...formData, visitorPhone: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700">N° Pièce Identité (CNI / Passeport)</label>
              <input
                type="text"
                placeholder="ex: 110293847"
                value={formData.idCardNumber}
                onChange={(e) => setFormData({ ...formData, idCardNumber: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700">Immatriculation Véhicule (si véhiculé)</label>
              <input
                type="text"
                placeholder="ex: LT 442 AB"
                value={formData.vehiclePlate}
                onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl uppercase font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700">Motif de la visite</label>
              <select
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value as VisitorPurpose })}
                className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl bg-white"
              >
                <option value="rdv_commercial">RDV Commercial</option>
                <option value="entretien_embauche">Entretien de Recrutement</option>
                <option value="livraison_colis">Livraison de Colis / Fret</option>
                <option value="prestataire_technique">Intervention Technique</option>
                <option value="partenaire_institutionnel">Partenaire / Institution</option>
                <option value="reunion_direction">Réunion de Direction</option>
                <option value="autre">Autre motif</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-stone-700">Collaborateur à rencontrer</label>
              <select
                value={formData.hostEmployeeId}
                onChange={(e) => {
                  const hostId = e.target.value;
                  const host = employees.find((emp) => emp.id === hostId);
                  setFormData({
                    ...formData,
                    hostEmployeeId: hostId,
                    hostEmployeeName: host?.name || '',
                  });
                }}
                className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl bg-white"
              >
                <option value="">-- Accueil général --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.department || 'Citrine'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-stone-700">Observations / Remarques</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Équipements apportés (ordinateur portable, outils, cartons...)"
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
              Valider l'émargement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
