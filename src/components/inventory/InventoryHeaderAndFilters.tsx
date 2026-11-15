import React from 'react';
import { Package, Search, Plus, LayoutGrid, Table } from 'lucide-react';
import { HumaanFinance } from '../illustrations/HumaanIllustrations';

interface InventoryBannerProps {
  totalItems: number;
  onCreateNew: () => void;
}

export const InventoryBanner: React.FC<InventoryBannerProps> = ({
  totalItems,
  onCreateNew,
}) => (
  <div className="bg-gradient-to-r from-[#2A7B76] via-[#216762] to-emerald-900 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
    <div className="space-y-2 z-10 w-full md:w-auto text-center md:text-left">
      <div className="flex items-center justify-center md:justify-start gap-2.5">
        <Package className="h-6 w-6 text-emerald-200" />
        <h2 className="font-serif font-bold text-2xl md:text-3xl text-white">
          Gestion du Matériel &amp; Inventaires
        </h2>
      </div>
      <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-xl text-xs font-semibold text-emerald-100 border border-white/15">
        <span>{totalItems} article{totalItems > 1 ? 's' : ''} répertorié{totalItems > 1 ? 's' : ''}</span>
      </div>
    </div>

    <div className="shrink-0 z-10 hidden sm:flex items-center justify-center">
      <HumaanFinance className="w-40 h-28 md:w-48 md:h-32 drop-shadow-md" />
    </div>

    <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 shrink-0 z-10 w-full md:w-auto">
      <button
        onClick={onCreateNew}
        className="px-5 py-2.5 bg-[#D4A82F] hover:bg-[#c39b28] text-stone-950 rounded-2xl text-xs font-extrabold transition shadow-md cursor-pointer flex items-center gap-2 active:scale-95"
      >
        <Plus className="h-4 w-4" />
        <span>Nouveau Matériel</span>
      </button>
    </div>
  </div>
);

interface InventoryFiltersBarProps {
  searchTerm: string;
  statusFilter: string;
  categoryFilter: string;
  locationFilter: string;
  uniqueLocations: string[];
  viewMode: 'cards' | 'table';
  onSearchChange: (val: string) => void;
  onStatusChange: (val: string) => void;
  onCategoryChange: (val: string) => void;
  onLocationChange: (val: string) => void;
  onViewModeChange: (mode: 'cards' | 'table') => void;
}

export const InventoryFiltersBar: React.FC<InventoryFiltersBarProps> = ({
  searchTerm,
  statusFilter,
  categoryFilter,
  locationFilter,
  uniqueLocations,
  viewMode,
  onSearchChange,
  onStatusChange,
  onCategoryChange,
  onLocationChange,
  onViewModeChange,
}) => (
  <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <input
          type="text"
          placeholder="Rechercher désignation, réf, lieu..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-3 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
        />
      </div>

      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 outline-none"
      >
        <option value="all">Tous les États</option>
        <option value="neuf">Neuf</option>
        <option value="bon_etat">Bon état</option>
        <option value="usage">Usagé / Moyen</option>
        <option value="endommage">Endommagé</option>
        <option value="en_reparation">En réparation</option>
        <option value="hors_service">Hors service</option>
      </select>

      <select
        value={categoryFilter}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 outline-none"
      >
        <option value="all">Toutes les Catégories</option>
        <option value="Matériel Informatique">Matériel Informatique</option>
        <option value="Mobilier & Bureau">Mobilier & Bureau</option>
        <option value="Outillage">Outillage Chantier</option>
        <option value="Véhicules">Véhicules & Transport</option>
        <option value="Téléphonie">Téléphonie & Réseaux</option>
      </select>

      <select
        value={locationFilter}
        onChange={(e) => onLocationChange(e.target.value)}
        className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 outline-none"
      >
        <option value="all">Tous les Emplacements</option>
        {uniqueLocations.map((loc) => (
          <option key={loc} value={loc}>
            {loc}
          </option>
        ))}
      </select>
    </div>

    <div className="flex items-center justify-end bg-stone-100 p-1 rounded-2xl border border-stone-200 text-xs shrink-0 self-end lg:self-auto">
      <button
        onClick={() => onViewModeChange('table')}
        className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer ${
          viewMode === 'table' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
        }`}
      >
        <Table className="h-3.5 w-3.5" /> Tableau
      </button>
      <button
        onClick={() => onViewModeChange('cards')}
        className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer ${
          viewMode === 'cards' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
        }`}
      >
        <LayoutGrid className="h-3.5 w-3.5" /> Cartes
      </button>
    </div>
  </div>
);
