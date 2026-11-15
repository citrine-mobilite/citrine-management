import React from 'react';
import { PersonType, VisitorLog } from '../../../types';

interface VisitorIdentitySectionProps {
  personType: PersonType;
  formData: Partial<VisitorLog>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<VisitorLog>>>;
  isExistingWorkerSelected: boolean;
}

export const VisitorIdentitySection: React.FC<VisitorIdentitySectionProps> = ({
  personType,
  formData,
  setFormData,
  isExistingWorkerSelected,
}) => {
  return (
    <div className="p-3 bg-stone-50/80 rounded-xl border border-stone-200/70 space-y-3">
      <p className="font-bold text-stone-800 text-[11px] uppercase tracking-wider text-stone-500">
        1. Identité de la personne
      </p>

      <div>
        <label className="font-semibold text-stone-700">Nom & Prénom *</label>
        <input
          type="text"
          required
          placeholder={personType === 'travailleur' ? 'ex: Emmanuel Ndongo' : 'ex: Patrick Manga'}
          value={formData.visitorName}
          onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
          className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl bg-white focus:outline-none focus:border-[#2A7B76]"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="font-semibold text-stone-700">
            {personType === 'travailleur' ? 'Entreprise Prestataire *' : 'Entreprise / Société'}
          </label>
          <input
            type="text"
            required={personType === 'travailleur'}
            placeholder={personType === 'travailleur' ? 'ex: SARL Élec Douala' : 'ex: CTL Logistics'}
            value={formData.visitorCompany}
            onChange={(e) => setFormData({ ...formData, visitorCompany: e.target.value })}
            className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl bg-white"
          />
        </div>

        <div>
          <label className="font-semibold text-stone-700">N° Téléphone *</label>
          <input
            type="text"
            required
            placeholder="+237 6..."
            value={formData.visitorPhone}
            onChange={(e) => setFormData({ ...formData, visitorPhone: e.target.value })}
            className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between">
            <label className="font-semibold text-stone-700">
              N° Pièce Identité (CNI / Passeport) {isExistingWorkerSelected ? '' : '*'}
            </label>
            {isExistingWorkerSelected && (
              <span className="text-[10px] text-emerald-700 font-bold">Déjà validé</span>
            )}
          </div>
          <input
            type="text"
            required={!isExistingWorkerSelected}
            placeholder={isExistingWorkerSelected ? 'CNI déjà archivée' : 'ex: 118472948'}
            value={formData.idCardNumber}
            onChange={(e) => setFormData({ ...formData, idCardNumber: e.target.value })}
            className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl bg-white font-mono"
          />
        </div>

        <div>
          <label className="font-semibold text-stone-700">Immatriculation Véhicule</label>
          <input
            type="text"
            placeholder="ex: LT 302 AD"
            value={formData.vehiclePlate}
            onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })}
            className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl bg-white uppercase font-mono"
          />
        </div>
      </div>
    </div>
  );
};
