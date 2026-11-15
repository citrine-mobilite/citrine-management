import React from 'react';
import { X, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Employee, GeneratedDocument } from '../../types';
import { DocTemplate } from '../DocTemplates';
import { useCreateDocumentLogic } from './createModal/useCreateDocumentLogic';
import { DocumentTemplateAndMetaFields } from './createModal/DocumentTemplateAndMetaFields';
import { DocumentBodyEditor } from './createModal/DocumentBodyEditor';

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
  const logic = useCreateDocumentLogic({
    isOpen,
    onClose,
    onSaveDocument,
    employees,
    initialTemplate,
    templates,
    showToast,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-stone-200 overflow-hidden max-h-[92vh] flex flex-col my-auto">
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

        <form onSubmit={logic.handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {logic.error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{logic.error}</span>
            </div>
          )}

          <DocumentTemplateAndMetaFields
            availableTemplates={logic.availableTemplates}
            selectedTemplateId={logic.selectedTemplateId}
            setSelectedTemplateId={logic.setSelectedTemplateId}
            selectedEmployeeId={logic.selectedEmployeeId}
            onEmployeeChange={logic.handleEmployeeChange}
            employees={employees}
            refNumber={logic.refNumber}
            setRefNumber={logic.setRefNumber}
            title={logic.title}
            setTitle={logic.setTitle}
            error={logic.error}
            setError={logic.setError}
            activeTemplate={logic.activeTemplate}
            fieldValues={logic.fieldValues}
            onFieldChange={logic.handleFieldChange}
            includeSignature={logic.includeSignature}
            setIncludeSignature={logic.setIncludeSignature}
          />

          <DocumentBodyEditor
            sentences={logic.sentences}
            bodyMode={logic.bodyMode}
            setBodyMode={logic.setBodyMode}
            customContent={logic.customContent}
            onSentenceChange={logic.handleSentenceChange}
            onAddSentence={logic.handleAddSentence}
            onRemoveSentence={logic.handleRemoveSentence}
            onMoveSentence={logic.handleMoveSentence}
            onTextareaChange={logic.handleTextareaChange}
          />

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
