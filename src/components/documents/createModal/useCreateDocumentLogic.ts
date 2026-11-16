import React, { useState, useEffect } from 'react';
import { Employee, GeneratedDocument, DocumentCategory } from '../../../types';
import { DOC_TEMPLATES, DocTemplate } from '../../DocTemplates';

interface UseCreateDocumentLogicProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDocument: (doc: GeneratedDocument) => Promise<void> | void;
  employees: Employee[];
  initialTemplate?: DocTemplate;
  templates?: DocTemplate[];
  showToast?: (msg: string) => void;
}

export function useCreateDocumentLogic({
  isOpen,
  onClose,
  onSaveDocument,
  employees,
  initialTemplate,
  templates,
  showToast,
}: UseCreateDocumentLogicProps) {
  const availableTemplates = templates && templates.length > 0 ? templates : DOC_TEMPLATES;

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    initialTemplate?.id || availableTemplates[0].id
  );
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [refNumber, setRefNumber] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [customContent, setCustomContent] = useState<string>('');
  const [sentences, setSentences] = useState<string[]>([]);
  const [bodyMode, setBodyMode] = useState<'sentences' | 'text'>('sentences');
  const [includeSignature, setIncludeSignature] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const activeTemplate =
    availableTemplates.find((t) => t.id === selectedTemplateId) || availableTemplates[0];

  useEffect(() => {
    if (initialTemplate) {
      setSelectedTemplateId(initialTemplate.id);
    }
  }, [initialTemplate]);

  useEffect(() => {
    if (!isOpen) return;

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const year = new Date().getFullYear();
    setRefNumber(`N° ${year}/RH-CIT/${randomNum}`);

    const initialValues: Record<string, any> = {};
    activeTemplate.fields.forEach((f) => {
      initialValues[f.key] = f.defaultValue;
    });
    setFieldValues(initialValues);
    setTitle(activeTemplate.name);
    setIncludeSignature(false);

    const rendered = activeTemplate.renderText(initialValues);
    setCustomContent(rendered);

    const parsedSentences = rendered
      .split(/\n\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('===='));

    setSentences(parsedSentences.length > 0 ? parsedSentences : [rendered]);
    setError(null);
  }, [isOpen, selectedTemplateId]);

  const syncRenderedText = (values: Record<string, any>) => {
    const newText = activeTemplate.renderText(values);
    setCustomContent(newText);
    const parsed = newText
      .split(/\n\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('===='));
    setSentences(parsed.length > 0 ? parsed : [newText]);
  };

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
      syncRenderedText(updatedValues);
    }
  };

  const handleFieldChange = (key: string, val: any) => {
    const updated = { ...fieldValues, [key]: val };
    setFieldValues(updated);
    syncRenderedText(updated);
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Veuillez renseigner le titre ou objet du document.');
      return;
    }

    const finalContent =
      bodyMode === 'sentences'
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
      isGeneric: activeTemplate.isGeneric,
      saveToDatabase: true,
      includeSignature,
      signatureType: includeSignature ? 'direction_only' : 'none',
    };

    await onSaveDocument(newDoc);
    onClose();
  };

  return {
    availableTemplates, selectedTemplateId, setSelectedTemplateId,
    selectedEmployeeId, refNumber, setRefNumber, title, setTitle,
    fieldValues, customContent, sentences, bodyMode, setBodyMode,
    includeSignature, setIncludeSignature, error, setError, activeTemplate,
    handleEmployeeChange, handleFieldChange, handleSentenceChange,
    handleAddSentence, handleRemoveSentence, handleMoveSentence,
    handleTextareaChange, handleSubmit,
  };
}
