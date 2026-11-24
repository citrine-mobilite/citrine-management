import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { Employee } from '../../types';
import {
  ComplianceChecklistItem,
  ComplianceConfidentiality,
  ComplianceSubItem,
  ComplianceSubItemStatus,
} from '../../types/complianceTypes';
import {
  COMPLIANCE_STATUS_OPTIONS,
  computeParentComplianceStatus,
  getComplianceStatusMeta,
  normalizeSubItem,
  resolveEmployeeFunction,
  resolveSubItemStatus,
} from '../../utils/complianceHelpers';

interface ComplianceItemModalProps {
  isOpen: boolean;
  item: ComplianceChecklistItem | null;
  employees: Employee[];
  authorName?: string;
  onClose: () => void;
  onSave: (updated: ComplianceChecklistItem) => Promise<void>;
  onDelete?: (itemId: string) => Promise<void>;
}

export const ComplianceItemModal: React.FC<ComplianceItemModalProps> = ({
  isOpen,
  item,
  employees,
  authorName = 'Administrateur',
  onClose,
  onSave,
  onDelete,
}) => {
  const [ownerEmployeeId, setOwnerEmployeeId] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerRole, setOwnerRole] = useState('');
  const [documentVersion, setDocumentVersion] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [confidentiality, setConfidentiality] = useState<ComplianceConfidentiality>('Confidentiel');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [subItems, setSubItems] = useState<ComplianceSubItem[]>([]);
  const [newSubLabel, setNewSubLabel] = useState('');
  const [subCommentInputs, setSubCommentInputs] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (item && isOpen) {
      const empId = item.ownerEmployeeId || '';
      const matchedEmp = empId
        ? employees.find((e) => e.id === empId)
        : item.ownerName
          ? employees.find((e) => e.name.toLowerCase() === item.ownerName!.toLowerCase())
          : undefined;

      setOwnerEmployeeId(empId || matchedEmp?.id || '');
      setOwnerName(item.ownerName || matchedEmp?.name || '');
      setOwnerRole(item.ownerRole || resolveEmployeeFunction(matchedEmp));
      setDocumentVersion(item.documentVersion || '');
      setDocumentDate(item.documentDate || '');
      setConfidentiality(item.confidentiality || 'Confidentiel');
      setEvidenceUrl(item.evidenceUrl || '');
      setSubItems(
        Array.isArray(item.subItems) ? item.subItems.map((s) => normalizeSubItem(s)) : []
      );
      setNewSubLabel('');
      setSubCommentInputs({});
      setSubmitError(null);
      setConfirmDelete(false);
    }
  }, [item, isOpen, employees]);

  if (!isOpen || !item) return null;

  const autoParentStatus = computeParentComplianceStatus(subItems, item.status);
  const autoParentMeta = getComplianceStatusMeta(autoParentStatus);

  const handleEmployeeSelect = (empId: string) => {
    setOwnerEmployeeId(empId);
    if (!empId) return;
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setOwnerName(emp.name);
      setOwnerRole(resolveEmployeeFunction(emp));
    }
  };

  const handleSubStatusChange = (subId: string, nextStatus: ComplianceSubItemStatus) => {
    setSubItems((prev) =>
      prev.map((s) =>
        s.id === subId
          ? { ...s, status: nextStatus, completed: nextStatus === 'conforme' }
          : s
      )
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
        status: 'a_preparer',
        comments: [],
      },
    ]);
    setNewSubLabel('');
  };

  const handleRemoveSubItem = (subId: string) => {
    setSubItems((prev) => prev.filter((s) => s.id !== subId));
  };

  const handleAddSubComment = (subId: string) => {
    const text = (subCommentInputs[subId] || '').trim();
    if (!text) return;
    setSubItems((prev) =>
      prev.map((s) =>
        s.id === subId
          ? {
              ...s,
              comments: [
                ...(s.comments || []),
                {
                  id: `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                  text,
                  author: authorName,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : s
      )
    );
    setSubCommentInputs((prev) => ({ ...prev, [subId]: '' }));
  };

  const handleDeleteSubComment = (subId: string, cmtId: string) => {
    setSubItems((prev) =>
      prev.map((s) =>
        s.id === subId
          ? { ...s, comments: (s.comments || []).filter((c) => c.id !== cmtId) }
          : s
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      // Flush any unsaved sub-item comment draft before saving
      const flushedSubs = subItems.map((s) => {
        const pending = (subCommentInputs[s.id] || '').trim();
        if (!pending) return s;
        return {
          ...s,
          comments: [
            ...(s.comments || []),
            {
              id: `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              text: pending,
              author: authorName,
              createdAt: new Date().toISOString(),
            },
          ],
        };
      });

      const computedStatus = computeParentComplianceStatus(flushedSubs, item.status);

      const updated: ComplianceChecklistItem = {
        ...item,
        status: computedStatus,
        ownerEmployeeId: ownerEmployeeId || undefined,
        ownerName: ownerName.trim() || undefined,
        ownerRole: ownerRole.trim() || undefined,
        documentVersion: documentVersion.trim() || undefined,
        documentDate: documentDate || undefined,
        confidentiality,
        evidenceUrl: evidenceUrl.trim() || undefined,
        subItems: flushedSubs,
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

          {/* Automatic Binary Status + Confidentiality */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="block text-stone-700 font-semibold mb-1.5">
                Statut global (automatique)
              </span>
              <div
                className={`w-full px-3 py-2 border rounded-lg flex items-center justify-between ${autoParentMeta.surfaceClass} ${autoParentMeta.borderClass}`}
              >
                <span className={`inline-flex items-center gap-1.5 font-bold ${autoParentMeta.textClass}`}>
                  {autoParentStatus === 'conforme' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span>{autoParentMeta.label}</span>
                </span>
                <span className="text-[11px] text-stone-500">Calculé par sous-éléments</span>
              </div>
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

          {/* Owner Assignment with Automatic Role/Function Resolution */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <option value="">-- Sélectionner --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="comp-owner-name" className="block text-stone-700 font-semibold mb-1.5">
                Nom du responsable
              </label>
              <input
                id="comp-owner-name"
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Nom du responsable"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-[#2A7B76]"
              />
            </div>

            <div>
              <label htmlFor="comp-owner-role" className="block text-stone-700 font-semibold mb-1.5">
                Fonction (auto-détectée)
              </label>
              <input
                id="comp-owner-role"
                type="text"
                value={ownerRole}
                onChange={(e) => setOwnerRole(e.target.value)}
                placeholder="Ex: Directeur Technique, RSSI..."
                className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-stone-50/70 focus:bg-white focus:outline-none focus:border-[#2A7B76]"
              />
            </div>
          </div>

          {/* Version + Date */}
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

          {/* Sub-items Status & Comments CRUD */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-700">
                Sous-éléments, statuts &amp; commentaires (
                {subItems.filter((s) => resolveSubItemStatus(s) === 'conforme').length}/{subItems.length}{' '}
                conformes)
              </span>
            </div>

            <div className="space-y-2.5">
              {subItems.length === 0 ? (
                <p className="p-3 border border-stone-200 rounded-xl text-stone-500 text-center bg-stone-50/50">
                  Aucun sous-élément défini.
                </p>
              ) : (
                subItems.map((sub) => {
                  const subStatus = resolveSubItemStatus(sub);
                  const subMeta = getComplianceStatusMeta(subStatus);
                  const subComments = sub.comments || [];

                  return (
                    <div
                      key={sub.id}
                      className="border border-stone-200 rounded-xl p-3 bg-stone-50/50 space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="font-medium text-stone-800 flex-1">{sub.label}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            aria-label={`Statut modal pour ${sub.label}`}
                            value={subStatus}
                            onChange={(e) =>
                              handleSubStatusChange(
                                sub.id,
                                e.target.value as ComplianceSubItemStatus
                              )
                            }
                            className={`px-2 py-1 text-xs font-semibold border rounded-lg cursor-pointer ${subMeta.surfaceClass} ${subMeta.borderClass} ${subMeta.textClass}`}
                          >
                            {COMPLIANCE_STATUS_OPTIONS.map((opt) => (
                              <option
                                key={opt.value}
                                value={opt.value}
                                className="bg-white text-stone-800"
                              >
                                {opt.label}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => handleRemoveSubItem(sub.id)}
                            aria-label={`Supprimer le sous-élément ${sub.label}`}
                            className="p-1 text-stone-400 hover:text-red-600 rounded transition cursor-pointer shrink-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {subComments.length > 0 && (
                        <ul className="space-y-1">
                          {subComments.map((cmt) => (
                            <li
                              key={cmt.id}
                              className="flex items-start justify-between gap-2 bg-white border border-stone-200 rounded-lg px-2.5 py-1.5"
                            >
                              <div className="min-w-0">
                                <span className="text-[11px] font-semibold text-stone-700">
                                  {cmt.author}
                                </span>{' '}
                                <span className="text-[11px] text-stone-400 font-mono">
                                  {cmt.createdAt
                                    ? new Date(cmt.createdAt).toLocaleDateString('fr-FR')
                                    : ''}
                                </span>
                                <p className="text-stone-700 mt-0.5">{cmt.text}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteSubComment(sub.id, cmt.id)}
                                className="p-1 text-stone-400 hover:text-red-600 cursor-pointer shrink-0"
                                aria-label="Supprimer commentaire"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={subCommentInputs[sub.id] || ''}
                          onChange={(e) =>
                            setSubCommentInputs((prev) => ({
                              ...prev,
                              [sub.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSubComment(sub.id);
                            }
                          }}
                          placeholder="Ajouter un commentaire sur ce sous-élément..."
                          className="flex-1 px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-[#2A7B76]"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddSubComment(sub.id)}
                          className="px-2.5 py-1.5 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg font-semibold text-stone-700 cursor-pointer shrink-0"
                        >
                          Commenter
                        </button>
                      </div>
                    </div>
                  );
                })
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
