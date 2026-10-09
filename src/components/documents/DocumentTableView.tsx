import React, { useState } from 'react';
import { Eye, Trash2, Calendar, User, Database, ShieldCheck, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { GeneratedDocument } from '../../types';

interface DocumentTableViewProps {
  documents: GeneratedDocument[];
  searchTerm: string;
  onPreview: (doc: GeneratedDocument) => void;
  onDelete: (id: string) => void;
}

type SortField = 'title' | 'category' | 'employeeName' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export const DocumentTableView: React.FC<DocumentTableViewProps> = ({
  documents,
  searchTerm,
  onPreview,
  onDelete,
}) => {
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const filtered = documents.filter(
    (d) =>
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.employeeName && d.employeeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.category && d.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.metadata?.referenceNumber && d.metadata.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

  if (filtered.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-10 border border-stone-200 text-center text-stone-500 text-xs space-y-2">
        <Database className="h-6 w-6 text-stone-300 mx-auto" />
        <p className="font-semibold text-stone-600">Aucun document trouvé dans les archives BD.</p>
        <p className="text-[11px] text-stone-400">
          Modifiez vos critères de recherche ou générez un nouveau document officiel.
        </p>
      </div>
    );
  }

  return (
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
            {sortedDocuments.map((doc) => (
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

                {/* Date */}
                <td className="py-3 px-3 whitespace-nowrap text-stone-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-stone-400" />
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
                    <span className="text-[9.5px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1 w-fit">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      Signé Électronique
                    </span>
                  ) : (
                    <span className="text-[9.5px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md w-fit">
                      Signature Manuelle
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onPreview(doc)}
                      className="px-2.5 py-1.5 bg-[#2A7B76] hover:bg-[#20635F] text-white text-[11px] font-bold rounded-xl transition flex items-center gap-1 shadow-2xs cursor-pointer"
                      title="Consulter et exporter en PDF"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Aperçu PDF</span>
                    </button>
                    <button
                      onClick={() => onDelete(doc.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      title="Supprimer des archives BD"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="py-2.5 px-4 bg-stone-50 border-t border-stone-200/80 text-[11px] text-stone-500 flex items-center justify-between">
        <span>Affichage de <strong>{sortedDocuments.length}</strong> document(s) archivé(s)</span>
        <span className="flex items-center gap-1 text-[#2A7B76] font-semibold">
          <Database className="h-3 w-3" />
          Synchronisé avec Firestore
        </span>
      </div>
    </div>
  );
};
