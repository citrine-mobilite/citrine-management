import React, { useState } from 'react';
import { X, Heart, Gift, Building2, UserCheck } from 'lucide-react';
import { InventoryItem, InventoryDonationRecord } from '../../types';

interface InventoryDonateModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onDonate: (updatedItem: InventoryItem) => void;
  approvedBy?: string;
}

export const InventoryDonateModal: React.FC<InventoryDonateModalProps> = ({
  isOpen,
  onClose,
  item,
  onDonate,
  approvedBy = 'Direction Générale',
}) => {
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryType, setBeneficiaryType] = useState<'association' | 'ecole' | 'collaborateur' | 'partenaire' | 'autre'>('association');
  const [donationDate, setDonationDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState<number>(1);
  const [estimatedValue, setEstimatedValue] = useState<number>(item?.unitPrice || 0);
  const [motive, setMotive] = useState('Renouvellement de parc / Cession caritative');
  const [notes, setNotes] = useState('');

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!beneficiaryName.trim()) return;

    const donationRecord: InventoryDonationRecord = {
      id: `don-${Date.now()}`,
      itemId: item.id,
      itemDesignation: item.designation,
      beneficiaryName,
      beneficiaryType,
      donationDate,
      quantity: Number(quantity),
      estimatedValue: Number(estimatedValue),
      motive,
      approvedBy,
      notes,
    };

    const newMovement = {
      id: `mov-${Date.now()}`,
      type: 'don' as const,
      date: donationDate,
      quantity: Number(quantity),
      performedBy: approvedBy,
      recipientName: beneficiaryName,
      notes: `Don de matériel à ${beneficiaryName} (${motive})`,
    };

    const remainingQty = Math.max(0, item.quantity - Number(quantity));

    const updatedItem: InventoryItem = {
      ...item,
      quantity: remainingQty,
      isDonated: remainingQty === 0,
      donatedTo: beneficiaryName,
      donations: [...(item.donations || []), donationRecord],
      movements: [...(item.movements || []), newMovement],
      updatedAt: new Date().toISOString(),
    };

    onDonate(updatedItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-700 to-indigo-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Heart className="h-5 w-5 text-purple-200 fill-purple-200" />
            <div>
              <h3 className="font-serif font-bold text-base">Effectuer un Don de Matériel</h3>
              <p className="text-[11px] text-purple-100">{item.designation}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-purple-100 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-purple-700" /> Bénéficiaire du Don *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Orphelinat Sainte-Marie, École Publique d'Akwa, M. Mbarga..."
              value={beneficiaryName}
              onChange={(e) => setBeneficiaryName(e.target.value)}
              className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200 font-bold focus:ring-2 focus:ring-purple-600 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Type de Bénéficiaire *</label>
              <select
                value={beneficiaryType}
                onChange={(e) => setBeneficiaryType(e.target.value as any)}
                className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200 font-bold focus:ring-2 focus:ring-purple-600 outline-none"
              >
                <option value="association">Association / ONG</option>
                <option value="ecole">Établissement Scolaire</option>
                <option value="collaborateur">Collaborateur / Ancien employé</option>
                <option value="partenaire">Partenaire Institutionnel</option>
                <option value="autre">Autre organisme</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Date du Don *</label>
              <input
                type="date"
                required
                value={donationDate}
                onChange={(e) => setDonationDate(e.target.value)}
                className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200 font-bold focus:ring-2 focus:ring-purple-600 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Quantité Cédée *</label>
              <input
                type="number"
                min={1}
                max={item.quantity}
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200 font-bold focus:ring-2 focus:ring-purple-600 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Valeur Résiduelle Estimée (FCFA)</label>
              <input
                type="number"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(Number(e.target.value))}
                className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200 font-mono font-bold focus:ring-2 focus:ring-purple-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Motif / Cadre du don *</label>
            <input
              type="text"
              required
              value={motive}
              onChange={(e) => setMotive(e.target.value)}
              className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200 focus:ring-2 focus:ring-purple-600 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Observations / Numéro de convention</label>
            <textarea
              rows={2}
              placeholder="Inscrire les références du procès-verbal de cession ou détails de livraison..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200 focus:ring-2 focus:ring-purple-600 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold shadow-md"
            >
              Valider le Don
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
