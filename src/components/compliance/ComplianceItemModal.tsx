import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, X, AlertCircle } from 'lucide-react';
import { Employee } from '../../types';
import {
  ComplianceChecklistItem,
  ComplianceConfidentiality,
  ComplianceStatus,
  ComplianceSubItem,
} from '../../types/complianceTypes';
import { COMPLIANCE_STATUS_OPTIONS } from '../../utils/complianceHelpers';

interface ComplianceItemModalProps {
  isOpen: boolean;
  item: ComplianceChecklistItem | null;
  employees: Employee[];
  onClose: () => void;
  onSave: (updated: ComplianceChecklistItem) => Promise<void>;
  onDelete?: (itemId: string) => Promise<void>;
}

export const ComplianceItemModal: React.FC<ComplianceItemModalProps> = ({
  isOpen,
  item,
  employees,
  onClose,
  onSave,
  onDelete,
}) => {
  const [status, setStatus] = useState<ComplianceStatus>('a_preparer');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmployeeId, setOwnerEmployeeId] = useState('');
  const [documentVersion, setDocumentVersion] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [confidentiality, setConfidentiality] = useState<ComplianceConfidentiality>('Confidentiel');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [auditorNotes, setAuditorNotes] = useState('');
  const [subItems, setSubItems] = useState<ComplianceSubItem[]>([]);
  const [newSubLabel, setNewSubLabel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (item && isOpen) {
      setStatus(item.status || 'a_preparer');
      setOwnerName(item.ownerName || '');
      setOwnerEmployeeId(item.ownerEmployeeId || '');
      setDocumentVersion(item.documentVersion || '');
      setDocumentDate(item.documentDate || '');
      setConfidentiality(item.confidentiality || 'Confidentiel');
      setEvidenceUrl(item.evidenceUrl || '');
      setAuditorNotes(item.auditorNotes || '');
      setSubItems(Array.isArray(item.subItems) ? item.subItems.map((s) => ({ ...s })) : []);
      setNewSubLabel('');
      setSubmitError(null);
      setConfirmDelete(false);
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const handleEmployeeSelect = (empId: string) => {
    setOwnerEmployeeId(empId);
    if (!empId) return;
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setOwnerName(emp.name);
    }
  };

  const handleToggleSub = (subId: string) => {
    setSubItems((prev) =>
      prev.map((s) => (s.id === subId ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleAddSubItem = () => {
    const label = newSubLabel.trim();
    if (!label) return;
    setSubItems((prev) => [
      ...prev,
      {
        id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        label,
        completed: false,
      },
    ]);
    setNewSubLabel('');
  };

  const handleRemoveSubItem = (subId: string) => {
    setSubItems((prev) => prev.filter((s) => s.id !== subId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const updated: ComplianceChecklistItem = {
        ...item,
        status,
        ownerName: ownerName.trim() || undefined,
        ownerEmployeeId: ownerEmployeeId || undefined,
        documentVersion: documentVersion.trim() || undefined,
        documentDate: documentDate || undefined,
        confidentiality,
        evidenceUrl: evidenceUrl.trim() || undefined,
        auditorNotes: auditorNotes.trim() || undefined,
        subItems,
        updatedAt: new Date().toISOString(),
      };
      await onSave(updated);
      onClose();
    } catch (err: any) {
      setSubmitError(err?.message || "Impossible d'enregistrer cet élément de conformité.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!onDelete || !item.isCustom) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onDelete(item.id);
      onClose();
    } catch (err: any) {
      setSubmitError(err?.message || "Impossible de supprimer cet élément.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="compliance-edit-title"
        className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Pinned Header */}
        <div className="bg-[#2A7B76] px-6 py-4 text-white flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <p className="text-[11px] font-mono font-semibold text-emerald-200">
              {item.controlCode} · {item.sectionTitle}
            </p>
            <h3 id="compliance-edit-title" className="text-base font-bold leading-snug mt-0.5">
              {item.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="compliance-edit-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {item.description && (
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-600 leading-relaxed">
              {item.description}
            </div>
          )}

          {/* Status + Confidentiality */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="comp-status" className="block text-stone-700 font-semibold mb-1.5">
                Statut ANTIC *
              </label>
              <select
                id="comp-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ComplianceStatus)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white text-stone-800 focus:outline-none focus:border-[#2A7B76]"
              >
                {COMPLIANCE_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="comp-conf" className="block text-stone-700 font-semibold mb-1.5">
                Classification de partage
              </label>
              <select
                id="comp-conf"
                value={confidentiality}
                onChange={(e) => setConfidentiality(e.target.value as ComplianceConfidentiality)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white text-stone-800 focus:outline-none focus:border-[#2A7B76]"
              >
                <option value="Confidentiel">Confidentiel (Requis ANTIC)</option>
                <option value="Restreint">Restreint</option>
                <option value="Interne">Interne</option>
              </select>
            </div>
          </div>

          {/* Owner (Employee Picker + Free text) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="comp-owner-select" className="block text-stone-700 font-semibold mb-1.5">
                Assigner un collaborateur
              </label>
              <select
                id="comp-owner-select"
                value={ownerEmployeeId}
                onChange={(e) => handleEmployeeSelect(e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white text-stone-800 focus:outline-none focus:border-[#2A7B76]"
              >
                <option value="">-- Sélectionner ou saisir librement --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role || emp.department || 'Collaborateur'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="comp-owner-name" className="block text-stone-700 font-semibold mb-1.5">
                Nom / Fonction du responsable
              </label>
              <input
                id="comp-owner-name"
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Ex: Directeur Technique, DPO, RSSI..."
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-[#2A7B76]"
              />
            </div>
          </div>

          {/* Version + Date (Explicitly requested in ANTIC PDF) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="comp-version" className="block text-stone-700 font-semibold mb-1.5">
                Version la plus récente
              </label>
              <input
                id="comp-version"
                type="text"
                value={documentVersion}
                onChange={(e) => setDocumentVersion(e.target.value)}
                placeholder="Ex: v1.0, v2.3..."
                className="w-full px-3 py-2 border border-stone-200 rounded-lg font-mono focus:outline-none focus:border-[#2A7B76]"
              />
            </div>

            <div>
              <label htmlFor="comp-date" className="block text-stone-700 font-semibold mb-1.5">
                Date du document / dernière revue
              </label>
              <input
                id="comp-date"
                type="date"
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg font-mono focus:outline-none focus:border-[#2A7B76]"
              />
            </div>
          </div>

          {/* Evidence URL */}
          <div>
            <label htmlFor="comp-evidence" className="block text-stone-700 font-semibold mb-1.5">
              Lien sécurisé / Référence de la preuve (Drive, Git, Confluence...)
            </label>
            <input
              id="comp-evidence"
              type="text"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="https://drive.google.com/... ou Réf. interne"
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-[#2A7B76]"
            />
          </div>

          {/* Sub-items CRUD */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-700">
                Sous-éléments &amp; livrables détaillés ({subItems.filter((s) => s.completed).length}/{subItems.length})
              </span>
            </div>

            <div className="border border-stone-200 rounded-xl divide-y divide-stone-100 bg-stone-50/50">
              {subItems.length === 0 ? (
                <p className="p-3 text-stone-500 text-center">Aucun sous-élément défini.</p>
              ) : (
                subItems.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between gap-2 px-3 py-2">
                    <label className="flex items-start gap-2.5 flex-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={Boolean(sub.completed)}
                        onChange={() => handleToggleSub(sub.id)}
                        className="mt-0.5 h-4 w-4 rounded border-stone-300 text-[#2A7B76] focus:ring-[#2A7B76] cursor-pointer"
                      />
                      <span className={sub.completed ? 'line-through text-stone-400' : 'text-stone-800'}>
                        {sub.label}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubItem(sub.id)}
                      aria-label={`Supprimer le sous-élément ${sub.label}`}
                      className="p-1 text-stone-400 hover:text-red-600 rounded transition cursor-pointer shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSubLabel}
                onChange={(e) => setNewSubLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubItem();
                  }
                }}
                placeholder="Ajouter un sous-élément ou livrable supplémentaire..."
                className="flex-1 px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-[#2A7B76]"
              />
              <button
                type="button"
                onClick={handleAddSubItem}
                className="inline-flex items-center gap-1 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-lg border border-stone-200 transition whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Ajouter</span>
              </button>
            </div>
          </div>

          {/* Auditor Notes */}
          <div>
            <label htmlFor="comp-notes" className="block text-stone-700 font-semibold mb-1.5">
              Commentaires / Précisions pour l’auditeur ANTIC
            </label>
            <textarea
              id="comp-notes"
              rows={3}
              value={auditorNotes}
              onChange={(e) => setAuditorNotes(e.target.value)}
              placeholder="Ex: Document en cours de validation DG, ou justification si non existant à ce stade..."
              className="w-full px-3 py-2 border border-stone-200 rounded-lg resize-none focus:outline-none focus:border-[#2A7B76]"
            />
          </div>
        </form>

        {/* Pinned Footer */}
        <div className="shrink-0 bg-white border-t border-stone-200 px-6 py-4 space-y-2.5">
          {submitError && (
            <div role="alert" className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <div>
              {item.isCustom && onDelete && (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{confirmDelete ? 'Confirmer la suppression' : 'Supprimer'}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                form="compliance-edit-form"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#2A7B76] hover:bg-[#22625E] rounded-lg transition disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{isSubmitting ? 'Enregistrement...' : 'Enregistrer'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
