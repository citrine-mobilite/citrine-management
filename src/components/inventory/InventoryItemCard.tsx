import React from 'react';
import { MapPin, Tag, Trash2, Package, User, Barcode } from 'lucide-react';
import { InventoryItem } from '../../types';

interface InventoryItemCardProps {
  item: InventoryItem;
  onSelect: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}

export const InventoryItemCard: React.FC<InventoryItemCardProps> = ({ item, onSelect, onDelete }) => {
  const currentAssignedQty = (item.assignments || []).reduce((acc, a) => acc + a.quantity, 0);
  const availableQty = Math.max(0, item.quantity - currentAssignedQty);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'neuf':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'bon_etat':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'usage':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'endommage':
      case 'en_reparation':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'hors_service':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  return (
    <div
      onClick={() => onSelect(item)}
      className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-3"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#2A7B76] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            {item.category || 'Matériel'}
          </span>
          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border ${getStatusBadge(item.status)}`}>
            {item.status.replace('_', ' ')}
          </span>
        </div>

        <h4 className="font-bold text-xs text-stone-900 line-clamp-1">{item.designation}</h4>

        <div className="grid grid-cols-2 gap-2 text-[10px] text-stone-500 pt-1">
          <div className="flex items-center gap-1">
            <Package className="h-3.5 w-3.5 text-stone-400" />
            <span className="font-bold text-stone-800">{availableQty} dispo / {item.quantity} tot.</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-stone-400" />
            <span className="truncate">{item.location}</span>
          </div>
        </div>

        {item.reference && (
          <div className="flex items-center gap-1 text-[10px] font-mono text-stone-400">
            <Tag className="h-3 w-3" /> Réf: {item.reference}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-[10px]">
        {item.unitPrice ? (
          <span className="font-bold text-emerald-800 font-mono">
            {(item.unitPrice * item.quantity).toLocaleString('fr-FR')} FCFA
          </span>
        ) : (
          <span className="text-stone-400 italic">Valeur non spé.</span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
          title="Supprimer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
