import React, { useState } from 'react';
import { Eye, Trash2, Calendar, User, Database, ShieldCheck, ArrowUpDown, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Filter, Edit3 } from 'lucide-react';
import { GeneratedDocument } from '../../types';

interface DocumentTableViewProps {
  documents: GeneratedDocument[];
  searchTerm: string;
  onPreview: (doc: GeneratedDocument) => void;
  onEdit?: (doc: GeneratedDocument) => void;
  onDelete: (id: string) => void;
}

type SortField = 'title' | 'category' | 'employeeName' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export const DocumentTableView: React.FC<DocumentTableViewProps> = ({
  documents,
  searchTerm,
  onPreview,
  onEdit,
  onDelete,
}) => {
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Extract unique categories
  const categories = ['all', ...Array.from(new Set(documents.map((d) => d.category).filter(Boolean)))];

  const filtered = documents.filter((d) => {
    if (selectedCategory !== 'all' && d.category !== selectedCategory) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = d.title.toLowerCase().includes(q);
      const matchEmp = d.employeeName && d.employeeName.toLowerCase().includes(q);
      const matchCat = d.category && d.category.toLowerCase().includes(q);
      const matchRef = d.metadata?.referenceNumber && d.metadata.referenceNumber.toLowerCase().includes(q);
      if (!matchTitle && !matchEmp && !matchCat && !matchRef) return false;
    }
    return true;
  });

  const sortedDocuments = [...filtered].sort((a, b) => {
    let aVal = a[sortField] || '';
    let bVal = b[sortField] || '';

    if (sortField === 'createdAt') {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    }

    if (typeof aVal === 'string') {
      return sortOrder === 'asc' 
        ? aVal.localeCompare(String(bVal), 'fr', { sensitivity: 'base' })
        : String(bVal).localeCompare(aVal, 'fr', { sensitivity: 'base' });
    }

    return 0;
  });

  const totalPages = Math.ceil(sortedDocuments.length / itemsPerPage) || 1;
  const paginatedDocuments = sortedDocuments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-stone-300 ml-1 inline opacity-60" />;
    }
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-3 w-3 text-[#2A7B76] ml-1 inline" />
    ) : (
      <ChevronDown className="h-3 w-3 text-[#2A7B76] ml-1 inline" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Category Pills Filter */}
      {categories.length > 2 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
            <Filter className="w-3.5 h-3.5" /> Catégories :
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                selectedCategory === cat
                  ? 'bg-[#2A7B76] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat === 'all' ? 'Toutes' : cat}
            </button>
          ))}
        </div>
      )}

      {paginatedDocuments.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-stone-200 text-center text-stone-500 text-xs space-y-2">
          <Database className="h-6 w-6 text-stone-300 mx-auto" />
          <p className="font-semibold text-stone-600">Aucun document trouvé dans les archives BD.</p>
          <p className="text-[11px] text-stone-400">
            Modifiez vos critères de recherche ou sélectionnez une autre catégorie.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600 border-collapse">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-700 font-bold text-[11px] select-none">
                  <th 
                    onClick={() => handleSort('title')} 
                    className="py-3 px-4 cursor-pointer hover:bg-stone-100 transition whitespace-nowrap"
                  >
                    Document & Référence {renderSortIndicator('title')}
                  </th>
                  <th 
                    onClick={() => handleSort('category')} 
                    className="py-3 px-3 cursor-pointer hover:bg-stone-100 transition whitespace-nowrap"
                  >
                    Catégorie {renderSortIndicator('category')}
                  </th>
                  <th 
                    onClick={() => handleSort('employeeName')} 
                    className="py-3 px-3 cursor-pointer hover:bg-stone-100 transition whitespace-nowrap"
                  >
                    Collaborateur {renderSortIndicator('employeeName')}
                  </th>
                  <th 
                    onClick={() => handleSort('createdAt')} 
                    className="py-3 px-3 cursor-pointer hover:bg-stone-100 transition whitespace-nowrap"
                  >
                    Date d'Émission {renderSortIndicator('createdAt')}
                  </th>
                  <th className="py-3 px-3 whitespace-nowrap">Signature</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-normal">
                {paginatedDocuments.map((doc) => (
                  <tr 
                    key={doc.id}
                    className="hover:bg-emerald-50/30 transition group"
                  >
                    {/* Document & Ref */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-900 group-hover:text-[#2A7B76] transition line-clamp-1 max-w-xs">
                        {doc.title}
                      </div>
                      <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                        {doc.metadata?.referenceNumber || 'RÉF-OFFICIELLE'}
                      </div>
                    </td>

                    {/* Catégorie */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#2A7B76] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {doc.category}
                      </span>
                    </td>

                    {/* Collaborateur */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {doc.employeeName ? (
                        <div className="flex items-center gap-1.5 text-stone-800 font-medium">
                          <User className="h-3.5 w-3.5 text-[#2A7B76] shrink-0" />
                          <span>{doc.employeeName}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-stone-400 italic">Diffusion Générale</span>
                      )}
                    </td>

                    {/* Date d'émission */}
                    <td className="py-3 px-3 whitespace-nowrap text-stone-500 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-stone-400" />
                        <span>
                          {new Date(doc.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Signature */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {doc.includeSignature ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <ShieldCheck className="h-3 w-3 text-emerald-600" />
                          Signé & Scellé
                        </span>
                      ) : (
                        <span className="text-[10px] text-stone-400 italic">Non scellé</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onPreview(doc)}
                          className="px-3 py-1.5 bg-[#2A7B76] hover:bg-[#20635F] text-white text-[11px] font-bold rounded-xl transition flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Aperçu PDF</span>
                        </button>
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(doc)}
                            className="px-2.5 py-1.5 bg-stone-100 hover:bg-[#2A7B76] hover:text-white text-stone-700 text-[11px] font-bold rounded-xl transition flex items-center gap-1 cursor-pointer border border-stone-200"
                            title="Modifier ce document en base de données"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>Modifier</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onDelete(doc.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Supprimer des archives BD"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          {totalPages > 1 && (
            <div className="px-4 py-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
              <span>
                Affichage de <strong className="text-stone-900">{(currentPage - 1) * itemsPerPage + 1}</strong> à <strong className="text-stone-900">{Math.min(currentPage * itemsPerPage, sortedDocuments.length)}</strong> sur <strong className="text-stone-900">{sortedDocuments.length}</strong> documents
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Précédent</span>
                </button>
                <span className="px-3 py-1 font-bold text-stone-800 bg-white border border-stone-200 rounded-lg">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Suivant</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
