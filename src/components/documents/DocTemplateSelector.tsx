import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Database, 
  FileText, 
  Briefcase, 
  Award, 
  ShieldAlert, 
  FolderPlus, 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  LayoutList, 
  LayoutGrid, 
  ChevronDown, 
  ChevronUp,
  ArrowRight
} from 'lucide-react';
import { DOC_TEMPLATES, DocTemplate } from '../DocTemplates';

interface DocTemplateSelectorProps {
  onSelectTemplate: (template: DocTemplate) => void;
  templates?: DocTemplate[];
  onCreateNewTemplate?: () => void;
}

export const DocTemplateSelector: React.FC<DocTemplateSelectorProps> = ({ 
  onSelectTemplate,
  templates,
  onCreateNewTemplate
}) => {
  const currentTemplates = templates && templates.length > 0 ? templates : DOC_TEMPLATES;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'contracts' | 'attestations' | 'discipline' | 'operations'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'table' ? 5 : 6;

  // Filter templates based on category and search query
  const filteredTemplates = useMemo(() => {
    return currentTemplates.filter((tpl) => {
      // Category filter
      if (categoryFilter === 'contracts' && tpl.category !== 'contract' && tpl.category !== 'amendment') {
        return false;
      }
      if (categoryFilter === 'attestations' && tpl.category !== 'attestation' && tpl.category !== 'certificate' && tpl.category !== 'internship') {
        return false;
      }
      if (categoryFilter === 'discipline' && tpl.category !== 'disciplinary' && tpl.category !== 'memo' && tpl.category !== 'regulation') {
        return false;
      }
      if (categoryFilter === 'operations' && tpl.category !== 'mission' && tpl.category !== 'discharge' && tpl.category !== 'job_description' && tpl.category !== 'evaluation') {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = tpl.name.toLowerCase().includes(q);
        const matchDesc = tpl.description?.toLowerCase().includes(q) || false;
        const matchCat = tpl.category.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCat) return false;
      }

      return true;
    });
  }, [currentTemplates, categoryFilter, searchTerm]);

  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage) || 1;
  const paginatedTemplates = filteredTemplates.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getCategoryBadge = (category: string) => {
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
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden transition-all duration-200">
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-stone-50/50">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100/80 text-[#2A7B76] rounded-xl shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-sm text-stone-900">
                  Bibliothèque des Modèles RH
                </h3>
                <span className="bg-[#2A7B76]/10 text-[#2A7B76] font-bold text-[10px] px-2 py-0.5 rounded-full border border-[#2A7B76]/20">
                  {currentTemplates.length} modèles BD
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                Sélectionnez un modèle pour générer un document officiel conforme CITRINE SARL
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="md:hidden p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition"
            title={isCollapsed ? 'Afficher les modèles' : 'Masquer les modèles'}
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>

        {/* Action buttons & mode toggle */}
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

          {/* Toggle DataTable vs Cards */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200/80">
            <button
              type="button"
              onClick={() => {
                setViewMode('table');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#2A7B76] shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Affichage en tableau (DataTable)"
            >
              <LayoutList className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">DataTable</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('grid');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#2A7B76] shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Affichage en cartes (Cards)"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Grille</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-xl transition cursor-pointer items-center gap-1 text-xs font-medium"
            title={isCollapsed ? 'Déplier la bibliothèque' : 'Replier la bibliothèque'}
          >
            <span>{isCollapsed ? 'Afficher' : 'Réduire'}</span>
            {isCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Controls bar: search & category pills */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search within templates */}
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
              <input
                type="text"
                placeholder="Filtrer un modèle RH..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 bg-stone-50 focus:bg-white rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none transition"
              />
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl text-xs font-semibold overflow-x-auto max-w-full scrollbar-none">
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter('all');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  categoryFilter === 'all'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <FileText className="h-3 w-3" />
                <span>Tous ({currentTemplates.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter('contracts');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  categoryFilter === 'contracts'
                    ? 'bg-white text-[#2A7B76] shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <Briefcase className="h-3 w-3" />
                <span>Contrats</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter('attestations');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  categoryFilter === 'attestations'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <Award className="h-3 w-3" />
                <span>Attestations</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter('discipline');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  categoryFilter === 'discipline'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <ShieldAlert className="h-3 w-3" />
                <span>Discipline</span>
              </button>
            </div>
          </div>

          {/* DATATABLE VIEW (Default) */}
          {viewMode === 'table' ? (
            <div className="border border-stone-200/90 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-50/90 border-b border-stone-200 text-stone-700 font-bold text-[11px] select-none">
                      <th className="py-2.5 px-4">Modèle & Description</th>
                      <th className="py-2.5 px-3">Catégorie</th>
                      <th className="py-2.5 px-3">Origine Base</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {paginatedTemplates.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-stone-400 text-xs">
                          Aucun modèle ne correspond à vos critères de recherche.
                        </td>
                      </tr>
                    ) : (
                      paginatedTemplates.map((tpl) => (
                        <tr 
                          key={tpl.id}
                          className="hover:bg-emerald-50/40 transition group cursor-pointer"
                          onClick={() => onSelectTemplate(tpl)}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-start gap-2.5">
                              <div className="p-1.5 bg-stone-100 text-[#2A7B76] group-hover:bg-[#2A7B76] group-hover:text-white rounded-lg transition shrink-0 mt-0.5">
                                <FileText className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <div className="font-bold text-stone-900 group-hover:text-[#2A7B76] transition">
                                  {tpl.name}
                                </div>
                                <div className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                                  {tpl.description}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            {getCategoryBadge(tpl.category)}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="text-[10px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                              <Database className="w-2.5 h-2.5 text-[#2A7B76]" />
                              {tpl.isCustom ? 'Personnalisé' : 'Standard'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectTemplate(tpl);
                              }}
                              className="px-3 py-1.5 bg-[#2A7B76] hover:bg-[#20635F] text-white text-[11px] font-bold rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs group-hover:shadow-xs"
                            >
                              <span>Rédiger</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-2.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
                  <span>
                    Affichage de <strong className="text-stone-900">{(currentPage - 1) * itemsPerPage + 1}</strong> à <strong className="text-stone-900">{Math.min(currentPage * itemsPerPage, filteredTemplates.length)}</strong> sur <strong className="text-stone-900">{filteredTemplates.length}</strong> modèles
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      className="p-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Précédent</span>
                    </button>
                    <span className="px-2.5 py-0.5 font-bold text-stone-800 bg-white border border-stone-200 rounded-lg text-xs">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      className="p-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition flex items-center gap-1"
                    >
                      <span className="hidden sm:inline">Suivant</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* GRID VIEW OPTION */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {paginatedTemplates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => onSelectTemplate(tpl)}
                    className="p-4 rounded-2xl border border-stone-200 hover:border-[#2A7B76] hover:bg-emerald-50/30 transition text-left group cursor-pointer flex flex-col justify-between space-y-2 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        {getCategoryBadge(tpl.category)}
                        <span className="text-[9px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Database className="h-2.5 w-2.5 text-[#2A7B76]" />
                          {tpl.isCustom ? 'Personnalisé' : 'Standard'}
                        </span>
                      </div>

                      <h4 className="font-bold text-xs text-stone-900 group-hover:text-[#2A7B76] transition mt-2">
                        {tpl.name}
                      </h4>
                      <p className="text-[10px] text-stone-500 line-clamp-2 mt-1">{tpl.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-[10px] font-bold text-[#2A7B76]">
                      <span>Rédiger & Générer</span>
                      <Plus className="h-3.5 w-3.5" />
                    </div>
                  </button>
                ))}
              </div>

              {/* Grid pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-2.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between text-xs text-stone-600">
                  <span>
                    Affichage de <strong className="text-stone-900">{(currentPage - 1) * itemsPerPage + 1}</strong> à <strong className="text-stone-900">{Math.min(currentPage * itemsPerPage, filteredTemplates.length)}</strong> sur <strong className="text-stone-900">{filteredTemplates.length}</strong> modèles
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      className="p-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Précédent</span>
                    </button>
                    <span className="px-2.5 py-0.5 font-bold text-stone-800 bg-white border border-stone-200 rounded-lg text-xs">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      className="p-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition flex items-center gap-1"
                    >
                      <span className="hidden sm:inline">Suivant</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
