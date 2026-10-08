import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Sparkles, 
  User, 
  Hash, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  Shield, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  ListOrdered, 
  AlignLeft,
  Copy
} from 'lucide-react';
import { Employee, GeneratedDocument, DocumentCategory } from '../../types';
import { DOC_TEMPLATES, DocTemplate } from '../DocTemplates';

interface CreateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDocument: (doc: GeneratedDocument) => void;
  employees: Employee[];
  initialTemplate?: DocTemplate;
  templates?: DocTemplate[];
  showToast?: (msg: string) => void;
}

export const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({
  isOpen,
  onClose,
  onSaveDocument,
  employees,
  initialTemplate,
  templates,
  showToast,
}) => {
  const availableTemplates = templates && templates.length > 0 ? templates : DOC_TEMPLATES;

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    initialTemplate?.id || availableTemplates[0].id
  );
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [refNumber, setRefNumber] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [customContent, setCustomContent] = useState<string>('');
  
  // Gestion par phrases/paragraphes individuels avec bouton "+ Ajouter"
  const [sentences, setSentences] = useState<string[]>([]);
  const [bodyMode, setBodyMode] = useState<'sentences' | 'text'>('sentences');

  // Option 1 : Signature (RÈGLE : NON PAR DÉFAUT)
  const [includeSignature, setIncludeSignature] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);

  const activeTemplate =
    availableTemplates.find((t) => t.id === selectedTemplateId) || availableTemplates[0];

  useEffect(() => {
    if (initialTemplate) {
      setSelectedTemplateId(initialTemplate.id);
    }
  }, [initialTemplate]);

  // Initialisation à l'ouverture ou changement de modèle
  useEffect(() => {
    if (!isOpen) return;

    // Référence normalisée
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const year = new Date().getFullYear();
    setRefNumber(`N° ${year}/RH-CIT/${randomNum}`);

    // Initialiser les valeurs du template
    const initialValues: Record<string, any> = {};
    activeTemplate.fields.forEach((f) => {
      initialValues[f.key] = f.defaultValue;
    });
    setFieldValues(initialValues);

    // Titre par défaut
    setTitle(activeTemplate.name);

    // RÈGLE FORMELLE : La signature ne doit JAMAIS être par défaut
    setIncludeSignature(false);

    // Texte initial rendu
    const rendered = activeTemplate.renderText(initialValues);
    setCustomContent(rendered);

    // Découpage automatique en phrases / paragraphes éditables
    const parsedSentences = rendered
      .split(/\n\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('===='));

    setSentences(parsedSentences.length > 0 ? parsedSentences : [rendered]);
    setError(null);
  }, [isOpen, selectedTemplateId]);

  // Sélection d'un employé
  const handleEmployeeChange = (empId: string) => {
    setSelectedEmployeeId(empId);
    if (!empId) return;

    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      const updatedValues = { ...fieldValues };
      if ('employeeName' in updatedValues || activeTemplate.fields.some((f) => f.key === 'employeeName')) {
        updatedValues.employeeName = emp.name;
      }
      if ('positionTitle' in updatedValues || activeTemplate.fields.some((f) => f.key === 'positionTitle')) {
        updatedValues.positionTitle = emp.roleType || 'Collaborateur';
      }
      if ('department' in updatedValues || activeTemplate.fields.some((f) => f.key === 'department')) {
        updatedValues.department = emp.department || 'Opérations';
      }
      setFieldValues(updatedValues);
      setTitle(`${activeTemplate.name} - ${emp.name}`);
      
      const newText = activeTemplate.renderText(updatedValues);
      setCustomContent(newText);
      const parsed = newText
        .split(/\n\n+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('===='));
      setSentences(parsed.length > 0 ? parsed : [newText]);
    }
  };

  const handleFieldChange = (key: string, val: any) => {
    const updated = { ...fieldValues, [key]: val };
    setFieldValues(updated);
    const newText = activeTemplate.renderText(updated);
    setCustomContent(newText);
    const parsed = newText
      .split(/\n\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('===='));
    setSentences(parsed.length > 0 ? parsed : [newText]);
  };

  // --- Gestion dynamique des phrases / éléments du corps ---
  const handleSentenceChange = (index: number, value: string) => {
    const updated = [...sentences];
    updated[index] = value;
    setSentences(updated);
    setCustomContent(updated.join('\n\n'));
  };

  const handleAddSentence = () => {
    const updated = [...sentences, ''];
    setSentences(updated);
    setCustomContent(updated.join('\n\n'));
  };

  const handleRemoveSentence = (index: number) => {
    if (sentences.length <= 1) {
      // Conserver au moins une phrase vide
      setSentences(['']);
      setCustomContent('');
      return;
    }
    const updated = sentences.filter((_, idx) => idx !== index);
    setSentences(updated);
    setCustomContent(updated.join('\n\n'));
  };

  const handleMoveSentence = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === sentences.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...sentences];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setSentences(updated);
    setCustomContent(updated.join('\n\n'));
  };

  const handleTextareaChange = (value: string) => {
    setCustomContent(value);
    const parsed = value
      .split(/\n\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    setSentences(parsed.length > 0 ? parsed : [value]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Veuillez renseigner le titre ou objet du document.');
      return;
    }

    // Le corps final provient de sentences s'il est en mode phrases
    const finalContent = bodyMode === 'sentences'
      ? sentences.filter((s) => s.trim().length > 0).join('\n\n')
      : customContent.trim();

    if (!finalContent) {
      setError('Veuillez renseigner au moins une phrase ou paragraphe pour le document.');
      return;
    }

    const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);

    const newDoc: GeneratedDocument = {
      id: `doc-${Date.now()}`,
      title: title.trim(),
      category: activeTemplate.category as DocumentCategory,
      formatType: activeTemplate.formatType,
      createdAt: new Date().toISOString(),
      content: finalContent,
      templateId: activeTemplate.id,
      templateParams: {
        ...fieldValues,
        targetAudience: selectedEmployee ? selectedEmployee.name : 'Direction & Personnel',
        department: selectedEmployee?.department || 'Services Généraux',
        role: selectedEmployee?.roleType || 'Collaborateur',
      },
      employeeId: selectedEmployee?.id,
      employeeName: selectedEmployee?.name,
      metadata: {
        referenceNumber: refNumber,
        generatedAt: new Date().toISOString(),
        templateName: activeTemplate.name,
      },
      // Respect strict des exigences : données systématiquement enregistrées en BD
      isGeneric: activeTemplate.isGeneric,
      saveToDatabase: true, // TOUJOURS true : conformité « gardes les données sur les documents rh en bd »
      includeSignature: includeSignature, // NON PAR DÉFAUT
      signatureType: includeSignature ? 'direction_only' : 'none',
    };

    onSaveDocument(newDoc);
    if (showToast) {
      showToast('Document RH officiel enregistré et synchronisé en base de données Firestore.');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-stone-200 overflow-hidden max-h-[92vh] flex flex-col my-auto">
        {/* Header */}
        <div className="p-5 border-b border-stone-200/80 bg-stone-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#2A7B76]/10 text-[#2A7B76] rounded-2xl shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Générer un Document RH Officiel
              </h3>
              <p className="text-xs text-stone-500">
                Papier à en-tête certifié CITRINE SARL & Pied de page OHADA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-xl transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Sélection du Modèle */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#2A7B76]" />
              Type de document ({availableTemplates.length} modèles disponibles en BD)
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 font-medium focus:ring-2 focus:ring-[#2A7B76] outline-none"
            >
              {availableTemplates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name} ({tpl.category.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Collaborateur concerné & Référence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-[#2A7B76]" />
                Collaborateur concerné (Optionnel)
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => handleEmployeeChange(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:ring-2 focus:ring-[#2A7B76] outline-none"
              >
                <option value="">Document Général (Ensemble du personnel)</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.roleType || 'Employé'} ({emp.department || 'Opérations'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 text-[#2A7B76]" />
                Numéro de référence officiel
              </label>
              <input
                type="text"
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-800 focus:ring-2 focus:ring-[#2A7B76] outline-none"
                placeholder="N° 2026/RH-CIT/XXXX"
              />
            </div>
          </div>

          {/* Titre / Objet */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700">
              Objet / Titre officiel du document
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:ring-2 focus:ring-[#2A7B76] outline-none"
              placeholder="Ex: Attestation d'emploi et de présence..."
            />
          </div>

          {/* Champs dynamiques du modèle si existants */}
          {activeTemplate.fields.length > 0 && (
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
              <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Paramètres du modèle ({activeTemplate.name})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeTemplate.fields.map((f) => (
                  <div key={f.key} className={f.type === 'textarea' ? 'sm:col-span-2 space-y-1' : 'space-y-1'}>
                    <label className="text-[11px] font-semibold text-stone-600">
                      {f.label}
                    </label>
                    {f.type === 'textarea' ? (
                      <textarea
                        rows={3}
                        value={fieldValues[f.key] || ''}
                        onChange={(e) => handleFieldChange(f.key, e.target.value)}
                        className="w-full p-2 bg-white border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
                      />
                    ) : f.type === 'select' && f.options ? (
                      <select
                        value={fieldValues[f.key] || ''}
                        onChange={(e) => handleFieldChange(f.key, e.target.value)}
                        className="w-full p-2 bg-white border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
                      >
                        {f.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={f.type}
                        value={fieldValues[f.key] || ''}
                        onChange={(e) => handleFieldChange(f.key, e.target.value)}
                        className="w-full p-2 bg-white border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Options de Signature et de Conservation en BD */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
            <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-[#2A7B76]" />
              Options de signature & conservation en base de données
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1 : Signature (NON PAR DÉFAUT) */}
              <label className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-stone-200 cursor-pointer hover:border-[#2A7B76]/60 transition select-none">
                <input
                  type="checkbox"
                  checked={includeSignature}
                  onChange={(e) => setIncludeSignature(e.target.checked)}
                  className="mt-0.5 rounded border-stone-300 text-[#2A7B76] focus:ring-[#2A7B76]"
                />
                <div className="text-xs">
                  <span className="font-bold text-stone-800 block">Apposer la signature officielle</span>
                  <span className="text-[10px] text-stone-500">
                    Non cochée par défaut. Si décochée, le document est généré sans signature électronique (espace neutre réservé).
                  </span>
                </div>
              </label>

              {/* Garantie formelle : Données conservées en base de données Firestore */}
              <div className="flex items-start gap-2.5 p-3 bg-emerald-50/80 rounded-xl border border-emerald-200/80 select-none">
                <Database className="h-4 w-4 text-[#2A7B76] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-stone-800 block flex items-center gap-1.5">
                    Conservation & Archivage en Base de Données
                    <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.2 rounded border border-emerald-300">
                      Firestore Actif
                    </span>
                  </span>
                  <span className="text-[10px] text-stone-600">
                    Les données du document, métadonnées, dates et clauses sont automatiquement archivées en BD.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ZONE DE CORPS DU DOCUMENT : Mode Phrases / Blocs dynamiques avec bouton "+ Ajouter une phrase" */}
          <div className="space-y-3 p-4 bg-stone-50 rounded-2xl border border-stone-200/80">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-[#2A7B76]" />
                  Corps du document ({sentences.length} {sentences.length > 1 ? 'éléments' : 'élément'})
                </label>
                <p className="text-[10px] text-stone-500">
                  Rédigez phrase par phrase ou ajoutez des éléments à votre convenance.
                </p>
              </div>

              {/* Sélecteur de mode Phrases vs Texte complet */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-200 text-[11px]">
                <button
                  type="button"
                  onClick={() => setBodyMode('sentences')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    bodyMode === 'sentences'
                      ? 'bg-[#2A7B76] text-white shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <ListOrdered className="h-3 w-3" />
                  Mode Phrases / Éléments
                </button>
                <button
                  type="button"
                  onClick={() => setBodyMode('text')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    bodyMode === 'text'
                      ? 'bg-[#2A7B76] text-white shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <AlignLeft className="h-3 w-3" />
                  Mode Texte Libre
                </button>
              </div>
            </div>

            {/* Mode 1 : Liste dynamique de phrases / paragraphes */}
            {bodyMode === 'sentences' ? (
              <div className="space-y-2.5">
                {sentences.map((sentence, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-2 group hover:border-[#2A7B76]/50 transition"
                  >
                    <div className="flex items-center justify-between text-[11px] text-stone-500">
                      <span className="font-bold text-stone-700 font-mono">
                        Phrase #{idx + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        {/* Bouton Monter */}
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveSentence(idx, 'up')}
                          className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-20 rounded hover:bg-stone-100 transition cursor-pointer"
                          title="Monter"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        {/* Bouton Descendre */}
                        <button
                          type="button"
                          disabled={idx === sentences.length - 1}
                          onClick={() => handleMoveSentence(idx, 'down')}
                          className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-20 rounded hover:bg-stone-100 transition cursor-pointer"
                          title="Descendre"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        {/* Bouton Supprimer */}
                        <button
                          type="button"
                          onClick={() => handleRemoveSentence(idx)}
                          className="p-1 text-stone-400 hover:text-rose-600 rounded hover:bg-rose-50 transition cursor-pointer"
                          title="Supprimer cette phrase"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      value={sentence}
                      onChange={(e) => handleSentenceChange(idx, e.target.value)}
                      placeholder={`Écrivez la phrase ou le paragraphe ${idx + 1}...`}
                      className="w-full p-2.5 bg-stone-50/60 border border-stone-200/80 rounded-lg text-xs text-stone-800 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none leading-relaxed resize-y"
                    />
                  </div>
                ))}

                {/* Bouton pour ajouter une phrase supplémentaire */}
                <button
                  type="button"
                  onClick={handleAddSentence}
                  className="w-full py-2.5 px-4 bg-white border-2 border-dashed border-[#2A7B76]/40 hover:border-[#2A7B76] text-[#2A7B76] hover:bg-[#2A7B76]/5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Plus className="h-4 w-4" />
                  <span>Ajouter une phrase / un paragraphe</span>
                </button>
              </div>
            ) : (
              /* Mode 2 : Texte complet libre */
              <div className="space-y-1.5">
                <textarea
                  rows={6}
                  value={customContent}
                  onChange={(e) => handleTextareaChange(e.target.value)}
                  className="w-full p-3 bg-white border border-stone-200 rounded-xl text-xs font-mono text-stone-800 focus:ring-2 focus:ring-[#2A7B76] outline-none leading-relaxed"
                  placeholder="Rédigez librement le corps du document..."
                />
              </div>
            )}

            <p className="text-[10px] text-stone-400">
              L'en-tête officiel CITRINE SARL, le logo, les mentions légales OHADA et le pied de page sont automatiquement incorporés sur l'aperçu et dans l'export PDF.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-stone-200 text-stone-600 hover:bg-stone-100 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#2A7B76] hover:bg-[#20635F] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Générer le Document Officiel</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
