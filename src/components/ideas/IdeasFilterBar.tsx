import React from 'react';
import { Search } from 'lucide-react';

interface IdeasFilterBarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
}

export const IdeasFilterBar: React.FC<IdeasFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  statusFilter,
  onStatusFilterChange,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center gap-3 bg-white p-3.5 rounded-xl border border-stone-200">
      <div className="relative flex-1 w-full">
        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Rechercher une idée, un sujet..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-stone-200 focus:outline-none focus:border-[#2A7B76]"
        />
      </div>

      <select
        value={categoryFilter}
        onChange={(e) => onCategoryFilterChange(e.target.value)}
        className="px-3 py-2 text-xs rounded-lg border border-stone-200 bg-white text-stone-700"
      >
        <option value="all">Toutes les thématiques</option>
        <option value="innovation_logistique">Innovation Logistique</option>
        <option value="vie_au_bureau">Vie au Bureau</option>
        <option value="processus_outils">Processus & Outils</option>
        <option value="bien_etre_securite">Bien-être & Sécurité</option>
        <option value="environnement_rse">RSE & Environnement</option>
      </select>

      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value)}
        className="px-3 py-2 text-xs rounded-lg border border-stone-200 bg-white text-stone-700"
      >
        <option value="all">Tous les statuts</option>
        <option value="soumise">Soumise</option>
        <option value="a_letude">À l'étude</option>
        <option value="retenue_test">Retenue pour test</option>
        <option value="deployee">Déployée</option>
      </select>
    </div>
  );
};
