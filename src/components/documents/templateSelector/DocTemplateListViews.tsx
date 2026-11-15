import React from 'react';
import {
  Database,
  FileText,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { DocTemplate } from '../../DocTemplates';
import { getCategoryBadge } from './DocTemplateSelectorHeader';

interface DocTemplateListViewsProps {
  viewMode: 'table' | 'grid';
  paginatedTemplates: DocTemplate[];
  totalFilteredCount: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onSelectTemplate: (template: DocTemplate) => void;
  onPageChange: (updater: (prev: number) => number) => void;
}

const PaginationFooter: React.FC<{
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalFilteredCount: number;
  onPageChange: (updater: (prev: number) => number) => void;
  className: string;
}> = ({ currentPage, totalPages, itemsPerPage, totalFilteredCount, onPageChange, className }) => {
  if (totalPages <= 1) return null;
  return (
    <div className={className}>
      <span>
        Affichage de <strong className="text-stone-900">{(currentPage - 1) * itemsPerPage + 1}</strong> à{' '}
        <strong className="text-stone-900">{Math.min(currentPage * itemsPerPage, totalFilteredCount)}</strong> sur{' '}
        <strong className="text-stone-900">{totalFilteredCount}</strong> modèles
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange((p) => Math.max(p - 1, 1))}
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
          onClick={() => onPageChange((p) => Math.min(p + 1, totalPages))}
          className="p-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition flex items-center gap-1"
        >
          <span className="hidden sm:inline">Suivant</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export const DocTemplateListViews: React.FC<DocTemplateListViewsProps> = ({
  viewMode,
  paginatedTemplates,
  totalFilteredCount,
  currentPage,
  totalPages,
  itemsPerPage,
  onSelectTemplate,
  onPageChange,
}) => {
  if (viewMode === 'table') {
    return (
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

        <PaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalFilteredCount={totalFilteredCount}
          onPageChange={onPageChange}
          className="px-4 py-2.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600"
        />
      </div>
    );
  }

  return (
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

      <PaginationFooter
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalFilteredCount={totalFilteredCount}
        onPageChange={onPageChange}
        className="px-4 py-2.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between text-xs text-stone-600"
      />
    </div>
  );
};
