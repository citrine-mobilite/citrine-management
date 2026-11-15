import React from 'react';
import {
  FileText,
  Briefcase,
  Award,
  ShieldAlert,
  FolderPlus,
  Search,
  LayoutList,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export type TemplateCategoryFilter = 'all' | 'contracts' | 'attestations' | 'discipline' | 'operations';

export function getCategoryBadge(category: string) {
  switch (category) {
    case 'contract':
    case 'amendment':
      return <span className="text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">Contrat</span>;
    case 'attestation':
    case 'certificate':
    case 'internship':
      return <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">Attestation</span>;
    case 'disciplinary':
    case 'memo':
    case 'regulation':
      return <span className="text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">Discipline</span>;
    default:
      return <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">Opérations</span>;
  }
}

interface DocTemplateSelectorHeaderProps {
  totalTemplatesCount: number;
  viewMode: 'table' | 'grid';
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onChangeViewMode: (mode: 'table' | 'grid') => void;
  onCreateNewTemplate?: () => void;
}

export const DocTemplateSelectorHeader: React.FC<DocTemplateSelectorHeaderProps> = ({
  totalTemplatesCount,
  viewMode,
  isCollapsed,
  onToggleCollapse,
  onChangeViewMode,
  onCreateNewTemplate,
}) => {
  return (
    <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-stone-50/50">
      <div className="flex items-center justify-between w-full md:w-auto">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-100/80 text-[#2A7B76] rounded-xl shrink-0">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-sm text-stone-900">
                Bibliothèque des Modèles RH
              </h3>
              <span className="bg-[#2A7B76]/10 text-[#2A7B76] font-bold text-[10px] px-2 py-0.5 rounded-full border border-[#2A7B76]/20">
                {totalTemplatesCount} modèles BD
              </span>
            </div>
            <p className="text-[11px] text-stone-500">
              Sélectionnez un modèle pour générer un document officiel conforme CITRINE SARL
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="md:hidden p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition"
          title={isCollapsed ? 'Afficher les modèles' : 'Masquer les modèles'}
        >
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 justify-end">
        {onCreateNewTemplate && (
          <button
            type="button"
            onClick={onCreateNewTemplate}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#2A7B76] border border-emerald-200/80 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            <span>+ Nouveau Modèle BD</span>
          </button>
        )}

        <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200/80">
          <button
            type="button"
            onClick={() => onChangeViewMode('table')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
              viewMode === 'table' ? 'bg-white text-[#2A7B76] shadow-xs' : 'text-stone-500 hover:text-stone-800'
            }`}
            title="Affichage en tableau (DataTable)"
          >
            <LayoutList className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">DataTable</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeViewMode('grid')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
              viewMode === 'grid' ? 'bg-white text-[#2A7B76] shadow-xs' : 'text-stone-500 hover:text-stone-800'
            }`}
            title="Affichage en cartes (Cards)"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Grille</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-xl transition cursor-pointer items-center gap-1 text-xs font-medium"
          title={isCollapsed ? 'Déplier la bibliothèque' : 'Replier la bibliothèque'}
        >
          <span>{isCollapsed ? 'Afficher' : 'Réduire'}</span>
          {isCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
};

interface DocTemplateControlsBarProps {
  totalTemplatesCount: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter: TemplateCategoryFilter;
  onCategoryChange: (cat: TemplateCategoryFilter) => void;
}

export const DocTemplateControlsBar: React.FC<DocTemplateControlsBarProps> = ({
  totalTemplatesCount,
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
      <div className="relative w-full md:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
        <input
          type="text"
          placeholder="Filtrer un modèle RH..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 bg-stone-50 focus:bg-white rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none transition"
        />
      </div>

      <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl text-xs font-semibold overflow-x-auto max-w-full scrollbar-none">
        <button
          type="button"
          onClick={() => onCategoryChange('all')}
          className={`px-2.5 py-1 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
            categoryFilter === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <FileText className="h-3 w-3" />
          <span>Tous ({totalTemplatesCount})</span>
        </button>
        <button
          type="button"
          onClick={() => onCategoryChange('contracts')}
          className={`px-2.5 py-1 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
            categoryFilter === 'contracts' ? 'bg-white text-[#2A7B76] shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Briefcase className="h-3 w-3" />
          <span>Contrats</span>
        </button>
        <button
          type="button"
          onClick={() => onCategoryChange('attestations')}
          className={`px-2.5 py-1 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
            categoryFilter === 'attestations' ? 'bg-white text-emerald-700 shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Award className="h-3 w-3" />
          <span>Attestations</span>
        </button>
        <button
          type="button"
          onClick={() => onCategoryChange('discipline')}
          className={`px-2.5 py-1 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
            categoryFilter === 'discipline' ? 'bg-white text-rose-700 shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <ShieldAlert className="h-3 w-3" />
          <span>Discipline</span>
        </button>
      </div>
    </div>
  );
};
