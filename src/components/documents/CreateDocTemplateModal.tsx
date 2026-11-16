import React, { useState } from 'react';
import { X, CheckCircle2, FileText, AlignLeft, Info } from 'lucide-react';
import { RHDocTemplate, TemplateField, DocumentCategory } from '../../types';
import { saveRHDocumentTemplate } from '../../services/rhDocumentTemplateService';
import { executeOperationWithLoading } from '../../utils/sweetAlert';
import {
  createInitialTemplateFields,
  DEFAULT_TEMPLATE_BODY,
} from './createTemplate/docTemplateFormConstants';
import { TemplateBasicInfoFields } from './createTemplate/TemplateBasicInfoFields';
import { TemplateDynamicFieldsSection } from './createTemplate/TemplateDynamicFieldsSection';

interface CreateDocTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateCreated?: (newTemplate: RHDocTemplate) => void;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}

export const CreateDocTemplateModal: React.FC<CreateDocTemplateModalProps> = ({
  isOpen,
  onClose,
  onTemplateCreated,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('attestation');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<TemplateField[]>(createInitialTemplateFields);
  const [bodyTemplate, setBodyTemplate] = useState(DEFAULT_TEMPLATE_BODY);

  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'date' | 'textarea'>('text');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddField = () => {
    const cleanKey = newFieldKey.trim().replace(/[^a-zA-Z0-9_]/g, '');
    if (!cleanKey) {
      setError("Veuillez renseigner un identifiant pour la variable (ex: 'lieu', 'salaire').");
      return;
    }
    if (fields.some((f) => f.key === cleanKey)) {
      setError(`La variable '{{${cleanKey}}}' existe déjà.`);
      return;
    }

    const fieldToAdd: TemplateField = {
      key: cleanKey,
      label: newFieldLabel.trim() || cleanKey,
      type: newFieldType,
      defaultValue: '',
    };

    setFields([...fields, fieldToAdd]);
    setNewFieldKey('');
    setNewFieldLabel('');
    setError(null);
  };

  const handleRemoveField = (key: string) => {
    setFields(fields.filter((f) => f.key !== key));
  };

  const insertTagIntoBody = (key: string) => {
    setBodyTemplate((prev) => prev + ` {{${key}}}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Veuillez renseigner le nom du modèle.');
      return;
    }
    if (!bodyTemplate.trim()) {
      setError('Veuillez saisir le contenu du modèle.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const templateId = `tpl-custom-${Date.now()}`;
      const newTemplate: RHDocTemplate = {
        id: templateId,
        name: name.trim(),
        category,
        formatType: 'word',
        description: description.trim() || `Modèle officiel personnalisé de type ${category}`,
        fields,
        bodyTemplate: bodyTemplate.trim(),
        defaultSignature: false,
        isCustom: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const res = await executeOperationWithLoading({
        loadingTitle: 'Création du modèle RH...',
        loadingText: `Enregistrement de "${newTemplate.name}" en cours, veuillez patienter...`,
        action: async () => {
          await saveRHDocumentTemplate(newTemplate);
        },
        successTitle: 'Modèle enregistré !',
        successMessage: `Le modèle officiel "${newTemplate.name}" a été enregistré avec succès en base de données.`,
        errorMessage: "Impossible d'enregistrer le modèle.",
      });

      if (res.success) {
        if (onTemplateCreated) {
          onTemplateCreated(newTemplate);
        }
        onClose();
      } else {
        setError(res.error?.message || "Erreur lors de l'enregistrement du modèle en base de données.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-stone-200 overflow-hidden max-h-[92vh] flex flex-col my-auto">
        <div className="p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100/80 rounded-2xl text-[#2A7B76]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Créer un Nouveau Type de Document RH
              </h3>
              <p className="text-xs text-stone-500">
                Enregistré directement en base de données Supabase · Zéro modification de code nécessaire
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-xl transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <TemplateBasicInfoFields
            name={name}
            setName={setName}
            category={category}
            setCategory={setCategory}
            description={description}
            setDescription={setDescription}
          />

          <TemplateDynamicFieldsSection
            fields={fields}
            newFieldKey={newFieldKey}
            setNewFieldKey={setNewFieldKey}
            newFieldLabel={newFieldLabel}
            setNewFieldLabel={setNewFieldLabel}
            newFieldType={newFieldType}
            setNewFieldType={setNewFieldType}
            onInsertTag={insertTagIntoBody}
            onRemoveField={handleRemoveField}
            onAddField={handleAddField}
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <AlignLeft className="h-3.5 w-3.5 text-[#2A7B76]" />
                Texte du Modèle avec balises dynamiques <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-stone-400">
                Cliquez sur « + Insérer » au-dessus pour placer une variable
              </span>
            </div>

            <textarea
              rows={8}
              required
              value={bodyTemplate}
              onChange={(e) => setBodyTemplate(e.target.value)}
              placeholder="Rédigez ici le corps officiel du document en utilisant les balises {{variable}}..."
              className="w-full p-3.5 bg-white border border-stone-200 rounded-2xl text-xs font-mono text-stone-800 focus:ring-2 focus:ring-[#2A7B76] outline-none leading-relaxed"
            />
            <p className="text-[10px] text-stone-400">
              Note : L'en-tête officiel CITRINE SARL, le logo d'entreprise et le pied de page réglementaire OHADA seront automatiquement ajoutés autour de ce corps.
            </p>
          </div>

          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-stone-200 text-stone-600 hover:bg-stone-100 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#2A7B76] hover:bg-[#20635F] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? 'Enregistrement en BD...' : 'Enregistrer le Modèle en BD'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
