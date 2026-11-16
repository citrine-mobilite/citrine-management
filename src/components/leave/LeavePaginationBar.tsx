import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface LeavePaginationBarProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  itemLabel?: string;
}

export const LeavePaginationBar: React.FC<LeavePaginationBarProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  itemLabel = 'demande',
}) => {
  if (totalItems === 0) return null;

  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalItems);

  const getVisiblePages = (): Array<number | 'ellipsis'> => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: Array<number | 'ellipsis'> = [1];
    if (currentPage > 3) pages.push('ellipsis');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let p = start; p <= end; p++) pages.push(p);
    if (currentPage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="px-4 py-3 border-t border-stone-200/80 bg-stone-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-3 flex-wrap text-stone-600">
        <span className="font-mono tabular-nums text-[11px]">
          Affichage <strong className="text-stone-900">{startIdx}–{endIdx}</strong> sur{' '}
          <strong className="text-stone-900">{totalItems}</strong> {itemLabel}
          {totalItems > 1 ? 's' : ''}
        </span>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-stone-500">Par page :</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-white border border-stone-200 rounded-lg px-2 py-1 text-[11px] font-mono tabular-nums font-semibold text-stone-800 focus:outline-none focus:border-[#2A7B76] cursor-pointer"
            aria-label="Nombre de lignes par page"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition inline-flex items-center gap-1 font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            aria-label="Page précédente"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Précédent</span>
          </button>

          <div className="flex items-center gap-1">
            {getVisiblePages().map((entry, idx) =>
              entry === 'ellipsis' ? (
                <span key={`e-${idx}`} className="px-1.5 text-stone-400 font-mono">
                  …
                </span>
              ) : (
                <button
                  key={entry}
                  type="button"
                  onClick={() => onPageChange(entry)}
                  className={`min-w-[30px] h-7 px-2 rounded-lg font-mono tabular-nums text-[11px] font-bold transition cursor-pointer ${
                    entry === currentPage
                      ? 'bg-[#2A7B76] text-white shadow-2xs'
                      : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {entry}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition inline-flex items-center gap-1 font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            aria-label="Page suivante"
          >
            <span className="hidden sm:inline">Suivant</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
