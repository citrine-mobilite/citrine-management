import React, { useState } from 'react';
import { AlertCircle, Loader2, Plus, Trash2, X } from 'lucide-react';
import { COMPLIANCE_AXES_META } from '../../data/anticChecklistSeed';
import { ComplianceAxis, ComplianceChecklistItem } from '../../types/complianceTypes';

interface ComplianceCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (item: ComplianceChecklistItem) => Promise<void>;
  nextOrderIndex: number;
}

export const ComplianceCreateModal: React.FC<ComplianceCreateModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  nextOrderIndex,
}) => {
  const [axis, setAxis] = useState<ComplianceAxis>('tech');
  const [controlCode, setControlCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subLabels, setSubLabels] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const axisMeta = COMPLIANCE_AXES_META.find((a) => a.axis === axis) || COMPLIANCE_AXES_META[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !controlCode.trim()) {
      setErrorMsg('Veuillez renseigner un code contrôle et un intitulé.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const id = `custom_antic_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const cleanedSubs = subLabels
        .map((l) => l.trim())
        .filter(Boolean)
        .map((label, idx) => ({
          id: `${id}_s${idx + 1}`,
          label,
          completed: false,
          status: 'a_preparer' as const,
          comments: [],
        }));

      const newItem: ComplianceChecklistItem = {
        id,
        axis,
        sectionCode: axisMeta.shortCode,
        sectionTitle: `${axisMeta.label} — Exigences complémentaires`,
        controlCode: controlCode.trim().toUpperCase(),
        title: title.trim(),
        description: description.trim() || undefined,
        status: 'non_conforme',
        confidentiality: 'Confidentiel',
        subItems: cleanedSubs,
        isCustom: true,
        orderIndex: nextOrderIndex,
        updatedAt: new Date().toISOString(),
      };

      await onCreate(newItem);
      setTitle('');
      setControlCode('');
      setDescription('');
      setSubLabels(['']);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Impossible de créer cette exigence.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="compliance-create-title"
        className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="bg-[#2A7B76] px-6 py-4 text-white flex items-center justify-between shrink-0">
          <h3 id="compliance-create-title" className="text-base font-bold">
            Ajouter une exigence de conformité
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form id="compliance-create-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="create-comp-axis" className="block font-semibold text-stone-700 mb-1.5">
                Axe ANTIC *
              </label>
              <select
                id="create-comp-axis"
                value={axis}
                onChange={(e) => setAxis(e.target.value as ComplianceAxis)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-[#2A7B76]"
              >
                {COMPLIANCE_AXES_META.map((meta) => (
                  <option key={meta.axis} value={meta.axis}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="create-comp-code" className="block font-semibold text-stone-700 mb-1.5">
                Code contrôle *
              </label>
              <input
                id="create-comp-code"
                type="text"
                required
                value={controlCode}
                onChange={(e) => setControlCode(e.target.value)}
                placeholder="Ex: SEC_TECH_8.1"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg font-mono focus:outline-none focus:border-[#2A7B76]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="create-comp-title" className="block font-semibold text-stone-700 mb-1.5">
              Intitulé du document ou contrôle *
            </label>
            <input
              id="create-comp-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Attestation de conformité PCI-DSS prestataire paiement"
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-[#2A7B76]"
            />
          </div>

          <div>
            <label htmlFor="create-comp-desc" className="block font-semibold text-stone-700 mb-1.5">
              Description / Attendus
            </label>
            <textarea
              id="create-comp-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Précisions demandées par l'audit..."
              className="w-full px-3 py-2 border border-stone-200 rounded-lg resize-none focus:outline-none focus:border-[#2A7B76]"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-700">Sous-éléments / livrables</span>
              <button
                type="button"
                onClick={() => setSubLabels((prev) => [...prev, ''])}
                className="inline-flex items-center gap-1 text-[#2A7B76] font-semibold hover:underline cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Ajouter une ligne
              </button>
            </div>
            {subLabels.map((val, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={val}
                  onChange={(e) =>
                    setSubLabels((prev) => prev.map((v, i) => (i === idx ? e.target.value : v)))
                  }
                  placeholder={`Sous-livrable ${idx + 1}...`}
                  className="flex-1 px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-[#2A7B76]"
                />
                {subLabels.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setSubLabels((prev) => prev.filter((_, i) => i !== idx))}
                    aria-label="Retirer cette ligne"
                    className="p-1.5 text-stone-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </form>

        <div className="shrink-0 bg-white border-t border-stone-200 px-6 py-4 space-y-2.5">
          {errorMsg && (
            <div role="alert" className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
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
              form="compliance-create-form"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#2A7B76] hover:bg-[#22625E] rounded-lg transition disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Créer l’exigence</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
