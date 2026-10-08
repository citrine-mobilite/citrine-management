import React, { useState } from 'react';
import { Package, MapPin, History, User, Edit3, Trash2, ChevronLeft, ChevronRight, Download, FileText } from 'lucide-react';
import { InventoryItem } from '../../types';
import { exportToExcel } from '../../services/excelExportService';
import { exportElementToPdf } from '../../services/pdfExportService';

interface InventoryTableViewProps {
  items: InventoryItem[];
  onOpenHistory: (item: InventoryItem) => void;
  onOpenAssign: (item: InventoryItem) => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
}

export const InventoryTableView: React.FC<InventoryTableViewProps> = ({
  items,
  onOpenHistory,
  onOpenAssign,
  onEditItem,
  onDeleteItem,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Reset to page 1 if page index exceeds total pages
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentItems = items.slice(startIndex, endIndex);

  const handleExportExcel = () => {
    const headers = ['Désignation', 'Référence', 'Catégorie', 'Prix Unit (FCFA)', 'Emplacement', 'Quantité Totale'];
    const rows = items.map((i) => [
      i.designation,
      i.reference || '',
      i.category || '',
      i.unitPrice || 0,
      i.location || '',
      i.quantity || 0,
    ]);
    exportToExcel('inventaire_materiel.xls', 'Répertoire du Matériel Citrine', headers, rows);
  };

  const handleExportPdf = () => {
    exportElementToPdf('inventory-datatable-container', 'inventaire_materiel.pdf');
  };

  return (
    <div id="inventory-datatable-container" className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden">
      {/* Table Header / Container */}
      <div className="p-5 border-b border-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
          <Package className="h-5 w-5 text-[#2A7B76]" />
          Répertoire du Matériel ({totalItems})
        </h3>

        {/* Page Size Selector & Exports */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={handleExportPdf}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5 text-rose-600" />
              <span>Export PDF</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-medium">Afficher :</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-800 outline-none focus:ring-2 focus:ring-[#2A7B76]"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50/80 text-stone-500 font-bold uppercase text-[10px] tracking-wider">
              <th className="p-4 pl-6 min-w-[280px]">Désignation & Référence</th>
              <th className="p-4 text-center">Stock Total</th>
              <th className="p-4">Répartition par État (Neuf, Bon, Endommagé...)</th>
              <th className="p-4">Emplacement</th>
              <th className="p-4 text-center">Historique Attributions</th>
              <th className="p-4 pr-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-stone-400 italic">
                  Aucun matériel trouvé correspondant aux critères.
                </td>
              </tr>
            ) : (
              currentItems.map((item) => {
                const assignmentsCount = (item.assignments || []).length;

                // Status breakdown counts
                const quantitiesByStatus = item.quantitiesByStatus || {
                  neuf: item.status === 'neuf' ? item.quantity : 0,
                  bon_etat: item.status === 'bon_etat' ? item.quantity : 0,
                  usage: item.status === 'usage' ? item.quantity : 0,
                  endommage: item.status === 'endommage' ? item.quantity : 0,
                  en_reparation: item.status === 'en_reparation' ? item.quantity : 0,
                  hors_service: item.status === 'hors_service' ? item.quantity : 0,
                };

                return (
                  <tr key={item.id} className="hover:bg-stone-50/70 transition">
                    {/* 1. Désignation & Référence */}
                    <td className="p-4 pl-6 align-top space-y-1">
                      <div className="flex items-start justify-between gap-2 max-w-sm">
                        <h4 className="font-bold text-xs text-stone-900 leading-snug">
                          {item.designation}
                        </h4>
                        <span className="px-2 py-0.5 bg-stone-100 border border-stone-200/80 rounded-md text-[10px] font-mono font-bold text-stone-700 shrink-0">
                          {item.reference || 'INV-2026-001'}
                        </span>
                      </div>

                      <div className="text-[11px] text-stone-600 flex items-center gap-2">
                        <span>Catégorie: <strong className="text-stone-800">{item.category || 'Matériel Informatique'}</strong></span>
                        <span>•</span>
                        <span>
                          Prix unit: <strong className="text-stone-800">{item.unitPrice ? `${item.unitPrice.toLocaleString('fr-FR')} FCFA` : 'N/A'}</strong>
                        </span>
                      </div>

                      {item.notes && (
                        <p className="text-[11px] text-stone-500 italic line-clamp-1">
                          {item.notes}
                        </p>
                      )}
                    </td>

                    {/* 2. Stock Total */}
                    <td className="p-4 text-center align-middle">
                      <span className="inline-block px-4 py-2 rounded-2xl border border-stone-200 text-xs font-bold text-stone-800 bg-white shadow-2xs font-mono">
                        {item.quantity} {item.quantity > 1 ? 'unités' : 'unité'}
                      </span>
                    </td>

                    {/* 3. Répartition par État */}
                    <td className="p-4 align-middle">
                      <div className="flex flex-wrap items-center gap-1.5 max-w-xs text-[10px]">
                        {quantitiesByStatus.neuf ? (
                          <span className="px-2.5 py-1 rounded-full border border-stone-200 bg-white font-medium text-stone-800">
                            Neuf: <u className="font-bold">{quantitiesByStatus.neuf}</u>
                          </span>
                        ) : null}

                        {quantitiesByStatus.bon_etat ? (
                          <span className="px-2.5 py-1 rounded-full border border-stone-200 bg-white font-medium text-stone-800">
                            Bon état: <u className="font-bold">{quantitiesByStatus.bon_etat}</u>
                          </span>
                        ) : null}

                        {quantitiesByStatus.usage ? (
                          <span className="px-2.5 py-1 rounded-full border border-stone-200 bg-white font-medium text-stone-800">
                            Usagé / Moyen: <u className="font-bold">{quantitiesByStatus.usage}</u>
                          </span>
                        ) : null}

                        {quantitiesByStatus.endommage ? (
                          <span className="px-2.5 py-1 rounded-full border border-stone-200 bg-stone-50 text-stone-800 font-medium">
                            Endommagé: <u className="font-bold">{quantitiesByStatus.endommage}</u>
                          </span>
                        ) : null}

                        {quantitiesByStatus.en_reparation ? (
                          <span className="px-2.5 py-1 rounded-full border border-amber-200 bg-amber-50/60 text-amber-900 font-medium">
                            En réparation: <u className="font-bold">{quantitiesByStatus.en_reparation}</u>
                          </span>
                        ) : null}

                        {quantitiesByStatus.hors_service ? (
                          <span className="px-2.5 py-1 rounded-full border border-stone-300 bg-stone-100 text-stone-700 font-medium">
                            Hors service: <u className="font-bold">{quantitiesByStatus.hors_service}</u>
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {/* 4. Emplacement */}
                    <td className="p-4 align-middle text-stone-700 text-xs">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                        <span className="font-medium">{item.location}</span>
                      </div>
                    </td>

                    {/* 5. Historique Attributions */}
                    <td className="p-4 align-middle text-center">
                      <button
                        onClick={() => onOpenHistory(item)}
                        className="px-3.5 py-1.5 rounded-xl border border-stone-200/80 bg-stone-50 hover:bg-stone-100 text-stone-700 font-bold text-xs transition cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <History className="h-3.5 w-3.5 text-stone-500" />
                        Historique ({assignmentsCount})
                      </button>
                    </td>

                    {/* 6. Actions */}
                    <td className="p-4 pr-6 align-middle text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenAssign(item)}
                          className="px-3 py-1.5 bg-[#2A7B76] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <User className="h-3.5 w-3.5" /> Assigner
                        </button>

                        <button
                          onClick={() => onEditItem(item)}
                          className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                          title="Modifier"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Datatable Footer & Pagination Controls (10, 25, 50, 100) */}
      <div className="p-4 bg-stone-50 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600">
        <div>
          Affichage de <strong className="text-stone-900">{totalItems === 0 ? 0 : startIndex + 1}</strong> à{' '}
          <strong className="text-stone-900">{endIndex}</strong> sur <strong className="text-stone-900">{totalItems}</strong> éléments
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safeCurrentPage <= 1}
            className="px-3 py-1.5 bg-white border border-stone-200 rounded-xl font-bold text-stone-700 disabled:opacity-40 hover:bg-stone-100 transition cursor-pointer flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Précédent
          </button>

          <span className="px-3 py-1.5 font-bold font-mono text-stone-800 bg-white border border-stone-200 rounded-xl">
            {safeCurrentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safeCurrentPage >= totalPages}
            className="px-3 py-1.5 bg-white border border-stone-200 rounded-xl font-bold text-stone-700 disabled:opacity-40 hover:bg-stone-100 transition cursor-pointer flex items-center gap-1"
          >
            Suivant <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
