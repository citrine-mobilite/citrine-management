import React from 'react';
import { Package, CheckCircle2, Wrench, AlertCircle } from 'lucide-react';
import { InventoryItem } from '../../types';

interface InventoryStatsCardsProps {
  items: InventoryItem[];
}

export const InventoryStatsCards: React.FC<InventoryStatsCardsProps> = ({ items }) => {
  const total = items.length;
  const good = items.filter((i) => i.status === 'neuf' || i.status === 'bon_etat').length;
  const repairing = items.filter((i) => i.status === 'en_reparation').length;
  const damaged = items.filter((i) => i.status === 'endommage' || i.status === 'hors_service').length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">Total Références</span>
          <Package className="h-4 w-4 text-[#2A7B76]" />
        </div>
        <p className="text-xl font-bold text-stone-900 mt-1">{total}</p>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">Bon État / Neuf</span>
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        </div>
        <p className="text-xl font-bold text-emerald-700 mt-1">{good}</p>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">En Réparation</span>
          <Wrench className="h-4 w-4 text-amber-600" />
        </div>
        <p className="text-xl font-bold text-amber-700 mt-1">{repairing}</p>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">Hors Service / Endommagé</span>
          <AlertCircle className="h-4 w-4 text-rose-600" />
        </div>
        <p className="text-xl font-bold text-rose-700 mt-1">{damaged}</p>
      </div>
    </div>
  );
};
