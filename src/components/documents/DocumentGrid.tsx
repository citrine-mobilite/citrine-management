import React, { useState } from 'react';
import { Eye, Trash2, Calendar, User, Database, ShieldCheck, ChevronLeft, ChevronRight, Filter, Edit3 } from 'lucide-react';
import { GeneratedDocument } from '../../types';

interface DocumentGridProps {
  documents: GeneratedDocument[];
  searchTerm: string;
  onPreview: (doc: GeneratedDocument) => void;
  onEdit?: (doc: GeneratedDocument) => void;
  onDelete: (id: string) => void;
}

export const DocumentGrid: React.FC<DocumentGridProps> = ({ documents, searchTerm, onPreview, onEdit, onDelete }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 9;

  // Extract unique categories
  const categories = ['all', ...Array.from(new Set(documents.map((d) => d.category).filter(Boolean)))];

  const filtered = documents.filter((d) => {
    if (selectedCategory !== 'all' && d.category !== selectedCategory) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = d.title.toLowerCase().includes(q);
      const matchEmp = d.employeeName && d.employeeName.toLowerCase().includes(q);
      const matchCat = d.category && d.category.toLowerCase().includes(q);
      if (!matchTitle && !matchEmp && !matchCat) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedDocuments = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
          <p className="font-semibold text-stone-600">Aucun document archivé dans la base pour le moment.</p>
          <p className="text-[11px] text-stone-400">
            Tous les documents RH enregistrés apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {paginatedDocuments.map((doc) => (
              <div
                key={doc.id}
                className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#2A7B76] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {doc.category}
                    </span>

                    {doc.includeSignature ? (
                      <span className="text-[9px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        Signé
                      </span>
                    ) : (
                      <span className="text-[9px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                        Non scellé
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-xs text-stone-900 line-clamp-1">{doc.title}</h4>

                  {doc.employeeName ? (
                    <div className="flex items-center gap-1.5 text-[11px] text-stone-600">
                      <User className="h-3.5 w-3.5 text-[#2A7B76]" />
                      <span className="font-bold">{doc.employeeName}</span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-stone-400 italic">Document d'Entreprise Général</div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(doc.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <span className="font-mono text-[9px] text-stone-400">
                      {doc.metadata?.referenceNumber || ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-100 shrink-0 gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onPreview(doc)}
                      className="px-3 py-1.5 bg-[#2A7B76] hover:bg-[#20635F] text-white text-[11px] font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
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
                  </div>

                  <button
                    type="button"
                    onClick={() => onDelete(doc.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                    title="Supprimer des archives BD"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination bar */}
          {totalPages > 1 && (
            <div className="px-4 py-3 bg-white rounded-2xl border border-stone-200/80 flex items-center justify-between text-xs text-stone-600 shadow-2xs">
              <span>
                Affichage de <strong className="text-stone-900">{(currentPage - 1) * itemsPerPage + 1}</strong> à <strong className="text-stone-900">{Math.min(currentPage * itemsPerPage, filtered.length)}</strong> sur <strong className="text-stone-900">{filtered.length}</strong> documents
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
                <span className="px-3 py-1 font-bold text-stone-800 bg-stone-50 border border-stone-200 rounded-lg">
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
