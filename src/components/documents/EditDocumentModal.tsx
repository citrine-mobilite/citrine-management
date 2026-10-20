import React, { useState, useEffect } from 'react';
import { X, FileText, User, Hash, CheckCircle2, Shield, Edit3, Save, Calendar } from 'lucide-react';
import { Employee, GeneratedDocument, DocumentCategory } from '../../types';

interface EditDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: GeneratedDocument | null;
  onSave: (updatedDocument: GeneratedDocument) => void;
  employees: Employee[];
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}

const DOCUMENT_CATEGORIES: { id: DocumentCategory; label: string }[] = [
  { id: 'contract' as DocumentCategory, label: 'Contrat de Travail' },
  { id: 'attestation' as DocumentCategory, label: 'Attestation / Certificat' },
  { id: 'mission' as DocumentCategory, label: 'Ordre de Mission' },
  { id: 'disciplinary' as DocumentCategory, label: 'Note Disciplinaire' },
  { id: 'memo' as DocumentCategory, label: 'Note de Service' },
  { id: 'attestation' as DocumentCategory, label: 'Autre Document RH' },
];

export const EditDocumentModal: React.FC<EditDocumentModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  onSave,
  employees,
  showToast,
}) => {
  const [title, setTitle] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('autre');
  const [content, setContent] = useState('');
  const [targetReason, setTargetReason] = useState('');
  const [includeSignature, setIncludeSignature] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (doc) {
      setTitle(doc.title || '');
      setRefNumber(doc.metadata?.referenceNumber || '');
      setSelectedEmployeeId(doc.employeeId || '');
      setCategory(doc.category || 'autre');
      setContent(doc.content || '');
      setTargetReason(doc.targetReason || '');
      setIncludeSignature(Boolean(doc.includeSignature));
    }
  }, [doc]);

  if (!isOpen || !doc) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      if (showToast) showToast('Le titre du document est obligatoire.', 'error');
      return;
    }
    if (!content.trim()) {
      if (showToast) showToast('Le contenu du document ne peut pas être vide.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedEmp = employees.find((e) => String(e.id) === String(selectedEmployeeId));
      const updatedDoc: GeneratedDocument = {
        ...doc,
        title: title.trim(),
        category,
        content: content.trim(),
        targetReason: targetReason.trim() || undefined,
        employeeId: selectedEmployeeId || undefined,
        employeeName: selectedEmp ? selectedEmp.name : doc.employeeName,
        includeSignature,
        metadata: {
          ...(doc.metadata || {}),
          referenceNumber: refNumber.trim() || doc.metadata?.referenceNumber || 'RÉF-OFFICIELLE',
          updatedAt: new Date().toISOString(),
        },
        saveToDatabase: true,
      };

      onSave(updatedDoc);
      if (showToast) showToast('Document modifié et enregistré en base de données avec succès.', 'success');
      onClose();
    } catch (err) {
      console.error('Erreur mise à jour document:', err);
      if (showToast) showToast('Erreur lors de la modification du document.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-3xl shadow-2xl border border-stone-200 space-y-4 my-auto max-h-[92vh] flex flex-col text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-[#2A7B76] rounded-xl border border-emerald-100">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-stone-900">
                Modifier le Document Enregistré en BD
              </h3>
              <p className="text-[10px] text-stone-400 font-mono">
                {doc.metadata?.referenceNumber || doc.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Titre & Référence */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[10px] uppercase font-bold text-stone-600 block flex items-center gap-1">
                <FileText className="h-3 w-3 text-[#2A7B76]" /> Titre du Document *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Ordre de mission - Mission Kribi"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-semibold text-stone-900 text-xs focus:outline-none focus:border-[#2A7B76] focus:bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-stone-600 block flex items-center gap-1">
                <Hash className="h-3 w-3 text-[#2A7B76]" /> N° Référence
              </label>
              <input
                type="text"
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                placeholder="CITRINE-DOC-..."
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono font-medium text-stone-700 text-xs focus:outline-none focus:border-[#2A7B76] focus:bg-white"
              />
            </div>
          </div>

          {/* Catégorie & Collaborateur */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-stone-600 block">
                Catégorie RH *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-semibold text-stone-800 text-xs focus:outline-none focus:border-[#2A7B76] cursor-pointer"
              >
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-stone-600 block flex items-center gap-1">
                <User className="h-3 w-3 text-[#2A7B76]" /> Collaborateur Associé
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-semibold text-stone-800 text-xs focus:outline-none focus:border-[#2A7B76] cursor-pointer"
              >
                <option value="">-- Aucun (Document Général d'Entreprise) --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.roleType || 'Employé'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Motif / Objet */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-stone-600 block">
              Objet / Motif de l'Acte
            </label>
            <input
              type="text"
              value={targetReason}
              onChange={(e) => setTargetReason(e.target.value)}
              placeholder="Ex: Déplacement professionnel, régularisation de situation, etc."
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-800 text-xs focus:outline-none focus:border-[#2A7B76] focus:bg-white"
            />
          </div>

          {/* Contenu textuel complet du document */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-stone-600 block">
                Texte & Clauses du Document * (Modifiable)
              </label>
              <span className="text-[10px] text-stone-400">
                {content.length} caractères
              </span>
            </div>
            <textarea
              required
              rows={11}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Saisissez ou modifiez le contenu intégral du document officiel..."
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl font-mono text-[11px] leading-relaxed text-stone-800 focus:outline-none focus:border-[#2A7B76] focus:bg-white resize-y"
            />
          </div>

          {/* Options de scellage / signature */}
          <div className="bg-stone-50/80 p-3 rounded-2xl border border-stone-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#2A7B76]" />
              <div>
                <span className="font-bold text-stone-800 text-xs block">
                  Scellé officiel & Signature numérique
                </span>
                <span className="text-[10px] text-stone-500 block">
                  Inclure le bloc d'émargement et la signature de la Direction
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeSignature}
                onChange={(e) => setIncludeSignature(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2A7B76]"></div>
            </label>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Enregistrement...' : 'Enregistrer en Base de Données'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
