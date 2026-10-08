import React from 'react';
import { Eye, Trash2, Calendar, User, Database, ShieldCheck, ShieldAlert } from 'lucide-react';
import { GeneratedDocument } from '../../types';

interface DocumentGridProps {
  documents: GeneratedDocument[];
  searchTerm: string;
  onPreview: (doc: GeneratedDocument) => void;
  onDelete: (id: string) => void;
}

export const DocumentGrid: React.FC<DocumentGridProps> = ({ documents, searchTerm, onPreview, onDelete }) => {
  const filtered = documents.filter(
    (d) =>
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.employeeName && d.employeeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.category && d.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (filtered.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-10 border border-stone-200 text-center text-stone-500 text-xs space-y-2">
        <Database className="h-6 w-6 text-stone-300 mx-auto" />
        <p className="font-semibold text-stone-600">Aucun document archivé dans la base pour le moment.</p>
        <p className="text-[11px] text-stone-400">
          Tous les documents RH enregistrés dans la base Firestore apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {filtered.map((doc) => (
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
                <span className="text-[9px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                  Sans signature pré-apposée
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

          <div className="flex items-center justify-between pt-2 border-t border-stone-100 shrink-0">
            <button
              onClick={() => onPreview(doc)}
              className="px-3 py-1.5 bg-[#2A7B76] hover:bg-[#20635F] text-white text-[11px] font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Aperçu PDF</span>
            </button>

            <button
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
  );
};
