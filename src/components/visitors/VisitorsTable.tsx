import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { VisitorLog } from '../../types';
import { VisitorsTableRow, getPurposeLabel, getWorkerDomainLabel } from './VisitorsTableRow';

export { getPurposeLabel, getWorkerDomainLabel };

interface VisitorsTableProps {
  visitors: VisitorLog[];
  onSelectVisitor: (v: VisitorLog) => void;
  onQuickCheckOut: (v: VisitorLog) => Promise<void>;
  onQuickCheckIn: (v: VisitorLog) => Promise<void>;
  onAuthorizeAccess?: (v: VisitorLog) => Promise<void>;
  onRejectAccess?: (v: VisitorLog) => Promise<void>;
}

export const VisitorsTable: React.FC<VisitorsTableProps> = ({
  visitors,
  onSelectVisitor,
  onQuickCheckOut,
  onQuickCheckIn,
  onAuthorizeAccess,
  onRejectAccess,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 25;

  const totalPages = Math.ceil(visitors.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, visitors.length);
  const currentVisitors = visitors.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50/80 border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              <th className="py-3 px-3.5">Type & Badge</th>
              <th className="py-3 px-3.5">Identité & Entreprise / CNI</th>
              <th className="py-3 px-3.5">Superviseur ou Hôte</th>
              <th className="py-3 px-3.5">Domaine & Périmètre</th>
              <th className="py-3 px-3.5">Arrivée</th>
              <th className="py-3 px-3.5">Départ</th>
              <th className="py-3 px-3.5 text-center">Statut d'Accès</th>
              <th className="py-3 px-3.5 text-right">Actions Rapides</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-xs">
            {currentVisitors.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-stone-400">
                  <p className="font-medium text-stone-500 text-sm">Aucun enregistrement trouvé</p>
                  <p className="text-xs text-stone-400 mt-1">Les flux du jour ou de la recherche s'afficheront ici.</p>
                </td>
              </tr>
            ) : (
              currentVisitors.map((v) => (
                <VisitorsTableRow
                  key={v.id}
                  visitor={v}
                  onSelectVisitor={onSelectVisitor}
                  onQuickCheckOut={onQuickCheckOut}
                  onQuickCheckIn={onQuickCheckIn}
                  onAuthorizeAccess={onAuthorizeAccess}
                  onRejectAccess={onRejectAccess}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {visitors.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-stone-50/70 border-t border-stone-200 text-xs">
          <div className="text-stone-500 font-medium">
            Affichage de <span className="font-bold text-stone-800">{visitors.length === 0 ? 0 : startIndex + 1}</span> à{' '}
            <span className="font-bold text-stone-800">{endIndex}</span> sur{' '}
            <span className="font-bold text-stone-800">{visitors.length}</span> flux enregistrés (25 par page)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={handlePrevPage}
              className={`px-3 py-1.5 rounded-lg border flex items-center gap-1 font-semibold text-xs transition cursor-pointer ${
                currentPage === 1
                  ? 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Précédent</span>
            </button>

            <span className="px-3 py-1 font-mono font-bold text-stone-700 bg-white border border-stone-200 rounded-lg">
              Page {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={handleNextPage}
              className={`px-3 py-1.5 rounded-lg border flex items-center gap-1 font-semibold text-xs transition cursor-pointer ${
                currentPage === totalPages
                  ? 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
              }`}
            >
              <span>Suivant</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
