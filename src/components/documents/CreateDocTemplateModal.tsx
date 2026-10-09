import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Plus, 
  Trash2, 
  Database, 
  CheckCircle2, 
  HelpCircle, 
  FileText,
  Tag,
  AlignLeft,
  Info
} from 'lucide-react';
import { RHDocTemplate, TemplateField, DocumentCategory } from '../../types';
import { saveRHDocumentTemplate } from '../../services/rhDocumentTemplateService';

interface CreateDocTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateCreated?: (newTemplate: RHDocTemplate) => void;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}

const CATEGORY_OPTIONS: { label: string; value: DocumentCategory }[] = [
  { label: 'Attestation & Certificat', value: 'attestation' },
  { label: 'Contrat & Avenant', value: 'contract' },
  { label: 'Note de service & Consignes', value: 'memo' },
  { label: 'Ordre de mission & Déplacement', value: 'mission' },
  { label: 'Sanction & Discipline', value: 'disciplinary' },
  { label: 'Fin de contrat & Sortie', value: 'certificate' },
  { label: 'Stage & Formation', value: 'internship' },
  { label: 'Décharge & Équipement', value: 'discharge' },
  { label: 'Fiche de poste & Organisation', value: 'job_description' },
  { label: 'Règlement & Charte', value: 'regulation' },
  { label: 'Évaluation & Bilan', value: 'evaluation' },
  { label: 'Autre Document RH', value: 'other' },
];

const COMMON_PRESET_FIELDS: TemplateField[] = [
  { key: 'employeeName', label: 'Nom & Prénom du Salarié', type: 'text', defaultValue: 'Jean-Marc DUPONT' },
  { key: 'positionTitle', label: 'Fonction / Poste', type: 'text', defaultValue: 'Collaborateur' },
  { key: 'department', label: 'Département', type: 'text', defaultValue: 'Opérations' },
  { key: 'effectiveDate', label: "Date d'effet / Début", type: 'date', defaultValue: new Date().toISOString().split('T')[0] },
  { key: 'purpose', label: 'Motif / Objet', type: 'textarea', defaultValue: 'Besoins du service' },
];

export const CreateDocTemplateModal: React.FC<CreateDocTemplateModalProps> = ({
  isOpen,
  onClose,
  onTemplateCreated,
  showToast,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('attestation');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<TemplateField[]>([
    { key: 'employeeName', label: 'Nom du Salarié', type: 'text', defaultValue: 'Jean DUPONT' },
    { key: 'positionTitle', label: 'Poste Occupé', type: 'text', defaultValue: 'Collaborateur' },
    { key: 'effectiveDate', label: "Date d'application", type: 'date', defaultValue: new Date().toISOString().split('T')[0] },
    { key: 'purpose', label: 'Objet ou Motif', type: 'textarea', defaultValue: 'Raison officielle de la demande' },
  ]);
  const [bodyTemplate, setBodyTemplate] = useState(`ATTESTATION OFFICIELLE

Nous soussignés, Direction de CITRINE SARL, attestons par la présente que :

M./Mme {{employeeName}}, exerçant les fonctions de {{positionTitle}}, au sein de notre établissement, bénéficie des présentes dispositions à compter du {{effectiveDate}}.

OBJET / MOTIF :
{{purpose}}

La présente pièce lui est délivrée pour servir et valoir ce que de droit.`);

  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'date' | 'textarea'>('text');
  const [newFieldDefault, setNewFieldDefault] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Ajouter un champ personnalisé
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
      defaultValue: newFieldDefault.trim(),
    };

    setFields([...fields, fieldToAdd]);
    setNewFieldKey('');
    setNewFieldLabel('');
    setNewFieldDefault('');
    setError(null);
  };

  const handleRemoveField = (key: string) => {
    setFields(fields.filter((f) => f.key !== key));
  };

  // Insertion d'un tag {{key}} dans le texte
  const insertTagIntoBody = (key: string) => {
    const tag = `{{${key}}}`;
    setBodyTemplate((prev) => prev + ` ${tag}`);
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

      // Sauvegarde directe en Base de Données Firestore !
      await saveRHDocumentTemplate(newTemplate);

      if (showToast) {
        showToast(`Modèle "${newTemplate.name}" enregistré avec succès en base de données !`);
      }
      if (onTemplateCreated) {
        onTemplateCreated(newTemplate);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'enregistrement du modèle en base de données.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-stone-200 overflow-hidden max-h-[92vh] flex flex-col my-auto">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100/80 rounded-2xl text-[#2A7B76]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Créer un Nouveau Type de Document RH
              </h3>
              <p className="text-xs text-stone-500">
                Enregistré directement en base de données Firestore · Zéro modification de code nécessaire
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

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Bandeau d'information Firestore */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start gap-3">
            <Database className="h-4 w-4 text-[#2A7B76] shrink-0 mt-0.5" />
            <div className="text-xs text-stone-700 leading-relaxed">
              <strong className="text-emerald-900 block font-semibold">Stockage automatique en Base de Données</strong>
              Ce nouveau modèle sera stocké dans la collection Firestore <code className="bg-emerald-100/70 px-1 py-0.5 rounded text-[11px] font-mono">rh_document_templates</code>. Il sera instantanément disponible pour toute l'équipe sans redéploiement.
            </div>
          </div>

          {/* Nom & Catégorie */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-800">
                Nom du type de document <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Demande de Congé Payé, Ordre de Mutation..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-800">
                Catégorie RH <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none font-medium"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-800">Description ou objectif du modèle</label>
            <input
              type="text"
              placeholder="Ex: Formalise les demandes et autorisations d'absence pour convenance personnelle."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
            />
          </div>

          {/* Gestion des Variables / Champs du Modèle */}
          <div className="space-y-3 p-4 bg-stone-50 rounded-2xl border border-stone-200/80">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-stone-800 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-[#2A7B76]" />
                  Variables Dynamiques du Document ({fields.length})
                </h4>
                <p className="text-[10px] text-stone-500">
                  Ces champs seront demandés à l'utilisateur lors de la génération du document officiel.
                </p>
              </div>
            </div>

            {/* Liste des champs configurés */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {fields.map((f) => (
                <div
                  key={f.key}
                  className="p-2.5 bg-white rounded-xl border border-stone-200 flex items-center justify-between gap-2 shadow-2xs"
                >
                  <div className="min-w-0">
                    <span className="font-mono text-[10px] bg-emerald-50 text-[#2A7B76] px-1.5 py-0.5 rounded font-bold border border-emerald-200/60">
                      {`{{${f.key}}}`}
                    </span>
                    <p className="text-xs text-stone-800 font-medium truncate mt-0.5">{f.label}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => insertTagIntoBody(f.key)}
                      className="px-2 py-1 bg-stone-100 hover:bg-[#2A7B76] hover:text-white text-[10px] rounded-lg transition font-medium cursor-pointer"
                      title="Insérer dans le texte"
                    >
                      + Insérer
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveField(f.key)}
                      className="p-1 text-stone-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                      title="Supprimer ce champ"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Formulaire d'ajout rapide d'un champ */}
            <div className="pt-2 border-t border-stone-200 flex flex-wrap sm:flex-nowrap gap-2 items-end">
              <div className="w-full sm:w-1/3 space-y-1">
                <label className="text-[10px] font-bold text-stone-600">Nom de la variable (code)</label>
                <input
                  type="text"
                  placeholder="ex: motif, montant..."
                  value={newFieldKey}
                  onChange={(e) => setNewFieldKey(e.target.value)}
                  className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#2A7B76]"
                />
              </div>

              <div className="w-full sm:w-1/3 space-y-1">
                <label className="text-[10px] font-bold text-stone-600">Libellé affiché</label>
                <input
                  type="text"
                  placeholder="ex: Motif du congé..."
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#2A7B76]"
                />
              </div>

              <div className="w-full sm:w-1/4 space-y-1">
                <label className="text-[10px] font-bold text-stone-600">Type de champ</label>
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as any)}
                  className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs outline-none"
                >
                  <option value="text">Texte court</option>
                  <option value="textarea">Texte long</option>
                  <option value="date">Date</option>
                  <option value="number">Nombre / Montant</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleAddField}
                className="w-full sm:w-auto px-3 py-2 bg-[#2A7B76] hover:bg-[#20635F] text-white text-xs font-bold rounded-lg transition shrink-0 flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Ajouter</span>
              </button>
            </div>
          </div>

          {/* Corps du Document & Trame textuelle */}
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

          {/* Footer Actions */}
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
