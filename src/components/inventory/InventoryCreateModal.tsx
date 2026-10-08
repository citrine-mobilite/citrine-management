import React, { useState } from 'react';
import { X, Package, Tag, MapPin, DollarSign, Barcode, ShieldAlert } from 'lucide-react';
import { InventoryItem, InventoryItemStatus } from '../../types';

interface InventoryCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: InventoryItem) => void;
  editingItem?: InventoryItem | null;
}

export const InventoryCreateModal: React.FC<InventoryCreateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingItem,
}) => {
  const [designation, setDesignation] = useState(editingItem?.designation || '');
  const [category, setCategory] = useState(editingItem?.category || 'Informatique');
  const [reference, setReference] = useState(editingItem?.reference || '');
  const [serialNumber, setSerialNumber] = useState(editingItem?.serialNumber || '');
  const [quantity, setQuantity] = useState<number>(editingItem?.quantity || 1);
  const [unitPrice, setUnitPrice] = useState<number>(editingItem?.unitPrice || 0);
  const [location, setLocation] = useState(editingItem?.location || 'Magasin Principal');
  const [status, setStatus] = useState<InventoryItemStatus>(editingItem?.status || 'neuf');
  const [notes, setNotes] = useState(editingItem?.notes || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!designation.trim()) return;

    const refCode = reference || `REF-${Math.floor(100000 + Math.random() * 900000)}`;

    const newItem: InventoryItem = {
      id: editingItem?.id || `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      designation,
      category,
      reference: refCode,
      serialNumber: serialNumber || `SN-${Math.floor(10000 + Math.random() * 90000)}`,
      quantity: Number(quantity) || 1,
      unitPrice: Number(unitPrice) || 0,
      location,
      status,
      notes,
      assignments: editingItem?.assignments || [],
      movements: editingItem?.movements || [
        {
          id: `mov-${Date.now()}`,
          type: 'entree',
          date: new Date().toISOString().split('T')[0],
          quantity: Number(quantity) || 1,
          performedBy: 'Gestionnaire Stock',
          notes: 'Entrée initiale en inventaire',
        },
      ],
      returns: editingItem?.returns || [],
      donations: editingItem?.donations || [],
      createdAt: editingItem?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSubmit(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden my-8">
        <div className="bg-gradient-to-r from-[#2A7B76] to-emerald-800 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-xs">
              <Package className="h-6 w-6 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg">
                {editingItem ? 'Modifier le Matériel' : 'Nouveau Matériel / Équipement'}
              </h3>
              <p className="text-xs text-emerald-100">Enregistrement au registre officiel d'inventaire</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-emerald-100 hover:text-white rounded-xl">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-stone-700 mb-1">Désignation du Matériel *</label>
            <input
              type="text"
              required
              placeholder="Ex: Ordinateur Portable HP ProBook G8, Martelet Pneumatique, etc."
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#2A7B76] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Catégorie *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#2A7B76] outline-none"
              >
                <option value="Informatique">Informatique & Bureautique</option>
                <option value="Outillage">Outillage & Équipement Chantier</option>
                <option value="Véhicules">Véhicules & Transport</option>
                <option value="Mobilier">Mobilier de Bureau</option>
                <option value="Téléphonie">Téléphonie & Réseaux</option>
                <option value="Sécurité">EPI & Équipements de Sécurité</option>
                <option value="Autre">Autre matériel</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">État Général *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as InventoryItemStatus)}
                className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 font-bold focus:ring-2 focus:ring-[#2A7B76] outline-none"
              >
                <option value="neuf">Neuf (Jamais utilisé)</option>
                <option value="bon_etat">Bon État (Fonctionnel)</option>
                <option value="usage">Usagé (Usure normale)</option>
                <option value="endommage">Endommagé (Nécessite contrôle)</option>
                <option value="en_reparation">En Réparation / Maintenance</option>
                <option value="hors_service">Hors Service / À réformer</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Tag className="h-3.5 w-3.5 text-[#2A7B76]" /> Référence Interne
              </label>
              <input
                type="text"
                placeholder="Ex: MAT-2026-042"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#2A7B76] outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Barcode className="h-3.5 w-3.5 text-[#2A7B76]" /> N° de Série / Châssis
              </label>
              <input
                type="text"
                placeholder="Ex: SN-5CG123456X"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#2A7B76] outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Quantité Totale *</label>
              <input
                type="number"
                min={1}
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 font-bold focus:ring-2 focus:ring-[#2A7B76] outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-emerald-600" /> Prix Unitaire (FCFA)
              </label>
              <input
                type="number"
                step="5000"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 font-mono font-bold focus:ring-2 focus:ring-[#2A7B76] outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-[#2A7B76]" /> Emplacement *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Magasin A, Bureau 102..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#2A7B76] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Observations / Remarques</label>
            <textarea
              rows={2}
              placeholder="Inscrire toute spécificité technique, garanties ou détails d'acquisition..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#2A7B76] outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#2A7B76] hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md"
            >
              Enregistrer l'Équipement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
