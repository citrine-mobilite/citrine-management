import React, { useState, useEffect, useMemo } from 'react';
import { GeneratedDocument, Role, Employee, AppUser, CompanyModuleConfig } from '../types';
import { DocTemplateSelector } from './documents/DocTemplateSelector';
import { DocumentGrid } from './documents/DocumentGrid';
import { DocumentTableView } from './documents/DocumentTableView';
import {
  DocTemplate,
  DOC_TEMPLATES,
  convertRHTemplateToDocTemplate,
  subscribeToRHDocumentTemplates,
  resetRHDocumentTemplatesToDefaults,
} from './DocTemplates';
import { OfficialDocumentModal } from './documents/OfficialDocumentModal';
import { CreateDocumentModal } from './documents/CreateDocumentModal';
import { CreateDocTemplateModal } from './documents/CreateDocTemplateModal';
import { EditDocumentModal } from './documents/EditDocumentModal';
import {
  DocumentGeneratorBanner,
  DocumentGeneratorArchiveToolbar,
} from './documents/DocumentGeneratorBannerAndToolbar';
import { showSuccessAlert, showErrorAlert, confirmActionAlert, executeDeleteWithSweetAlert } from '../utils/sweetAlert';
import { isSelfOnlyUser, findMatchingEmployee } from '../utils/roleUtils';
import { asyncActionTrackerService } from '../services/asyncActionTrackerService';

interface DocumentGeneratorPanelProps {
  documents: GeneratedDocument[];
  setDocuments?: React.Dispatch<React.SetStateAction<GeneratedDocument[]>>;
  onUpdateDocuments?: (docs: GeneratedDocument[]) => void;
  currentRole?: Role;
  currentUser?: AppUser | null;
  employees?: Employee[];
  moduleConfig?: CompanyModuleConfig;
  showToast?: (message: string, type?: 'success' | 'error') => void;
  onAddNotification?: (notification: any) => void;
}

export default function DocumentGeneratorPanel({
  documents = [],
  setDocuments,
  onUpdateDocuments,
  employees = [],
  moduleConfig,
  showToast,
  currentUser,
  currentRole,
}: DocumentGeneratorPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [previewDoc, setPreviewDoc] = useState<GeneratedDocument | null>(null);
  const [editingDoc, setEditingDoc] = useState<GeneratedDocument | null>(null);
  const [selectedTemplateForModal, setSelectedTemplateForModal] = useState<DocTemplate | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateTemplateModalOpen, setIsCreateTemplateModalOpen] = useState(false);
  const [isResettingTemplates, setIsResettingTemplates] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  const isRestricted = isSelfOnlyUser(currentUser, currentRole);
  const myEmp = useMemo(() => findMatchingEmployee(employees, currentUser), [employees, currentUser]);
  const myEmpId = myEmp?.id || currentUser?.id;
  const myEmpName = (myEmp?.name || currentUser?.name || '').toLowerCase();

  const effectiveDocuments = useMemo(() => {
    if (!isRestricted) return documents;
    return documents.filter((d) => {
      const dEmpId = (d.employeeId || '').toLowerCase();
      const dEmpName = (d.employeeName || '').toLowerCase();
      const dTitle = (d.title || '').toLowerCase();
      return (myEmpId && dEmpId === myEmpId.toLowerCase()) ||
             (myEmpName && (dEmpName.includes(myEmpName) || dTitle.includes(myEmpName)));
    });
  }, [documents, isRestricted, myEmpId, myEmpName]);

  const [dbTemplates, setDbTemplates] = useState<DocTemplate[]>(DOC_TEMPLATES);

  useEffect(() => {
    const unsubscribe = subscribeToRHDocumentTemplates((rhTemplates) => {
      setDbTemplates(rhTemplates.map(convertRHTemplateToDocTemplate));
    });
    return () => unsubscribe();
  }, []);

  const handleUpdate = (updater: GeneratedDocument[] | ((prev: GeneratedDocument[]) => GeneratedDocument[])) => {
    const updated = typeof updater === 'function' ? updater(documents || []) : updater;
    if (setDocuments) setDocuments(updated);
    if (onUpdateDocuments) onUpdateDocuments(updated);
  };

  const handleDeleteDoc = async (id: string) => {
    const target = documents.find((d) => d.id === id);
    await executeDeleteWithSweetAlert({
      title: 'Supprimer ce document ?',
      text: 'Voulez-vous vraiment supprimer ce document des archives RH ?',
      itemName: target?.title,
      action: async () => {
        handleUpdate((prev) => prev.filter((d) => d.id !== id));
      },
      successTitle: 'Document supprimé !',
      successMessage: target?.title ? `"${target.title}" a été supprimé des archives.` : 'Document supprimé des archives.',
    });
  };

  const handleSelectTemplate = (tpl: DocTemplate) => {
    setSelectedTemplateForModal(tpl);
    setIsCreateModalOpen(true);
  };

  const handleSaveDocument = async (newDoc: GeneratedDocument) => {
    const docToPersist: GeneratedDocument = { ...newDoc, saveToDatabase: true };
    handleUpdate((prev) => [docToPersist, ...prev]);
    setPreviewDoc(docToPersist);
    await showSuccessAlert('Document généré !', `Le document "${newDoc.title}" a été généré et archivé avec succès.`);
  };

  const handleSaveEditedDoc = async (updatedDoc: GeneratedDocument) => {
    handleUpdate((prev) => prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)));
    await showSuccessAlert('Modifications enregistrées !', `Le document "${updatedDoc.title}" a été mis à jour.`);
  };

  const handleResetTemplates = async () => {
    const isConfirmed = await confirmActionAlert({
      title: 'Synchroniser les modèles RH ?',
      text: 'Voulez-vous synchroniser et actualiser l\'ensemble des modèles RH en base de données Supabase ?',
      confirmButtonText: 'Oui, synchroniser',
      icon: 'question',
    });
    if (!isConfirmed) return;

    setIsResettingTemplates(true);
    try {
      await asyncActionTrackerService.track('Synchronisation des modèles RH...', async () => {
        await resetRHDocumentTemplatesToDefaults();
      });
      if (showToast) showToast('Modèles RH synchronisés avec succès en base de données.');
      await showSuccessAlert('Modèles synchronisés !', 'L\'ensemble des modèles officiels RH a été actualisé.');
    } catch (err: any) {
      if (showToast) showToast('Erreur lors de la synchronisation des modèles.', 'error');
      await showErrorAlert('Erreur', err?.message || 'Erreur lors de la synchronisation des modèles.');
    } finally {
      setIsResettingTemplates(false);
    }
  };

  return (
    <div className="space-y-6">
      <DocumentGeneratorBanner
        totalDocumentsCount={documents.length}
        isRestricted={isRestricted}
        isResettingTemplates={isResettingTemplates}
        onOpenCreateTemplate={() => setIsCreateTemplateModalOpen(true)}
        onResetTemplates={handleResetTemplates}
        onOpenGenerateDoc={() => {
          setSelectedTemplateForModal(null);
          setIsCreateModalOpen(true);
        }}
      />

      {!isRestricted && (
        <DocTemplateSelector
          templates={dbTemplates}
          onSelectTemplate={handleSelectTemplate}
          onCreateNewTemplate={() => setIsCreateTemplateModalOpen(true)}
        />
      )}

      <DocumentGeneratorArchiveToolbar
        isRestricted={isRestricted}
        effectiveCount={effectiveDocuments.length}
        searchTerm={searchTerm}
        viewMode={viewMode}
        onSearchChange={setSearchTerm}
        onToggleViewMode={setViewMode}
      />

      {viewMode === 'grid' ? (
        <DocumentGrid
          documents={effectiveDocuments}
          searchTerm={searchTerm}
          onPreview={(doc) => setPreviewDoc(doc)}
          onEdit={(doc) => setEditingDoc(doc)}
          onDelete={handleDeleteDoc}
        />
      ) : (
        <DocumentTableView
          documents={effectiveDocuments}
          searchTerm={searchTerm}
          onPreview={(doc) => setPreviewDoc(doc)}
          onEdit={(doc) => setEditingDoc(doc)}
          onDelete={handleDeleteDoc}
        />
      )}

      <CreateDocumentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        employees={employees}
        initialTemplate={selectedTemplateForModal}
        templates={dbTemplates}
        onSaveDocument={handleSaveDocument}
        showToast={showToast}
      />

      <EditDocumentModal
        isOpen={Boolean(editingDoc)}
        onClose={() => setEditingDoc(null)}
        document={editingDoc}
        onSave={handleSaveEditedDoc}
        employees={employees}
        showToast={showToast}
      />

      <CreateDocTemplateModal
        isOpen={isCreateTemplateModalOpen}
        onClose={() => setIsCreateTemplateModalOpen(false)}
        showToast={showToast}
      />

      <OfficialDocumentModal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
        moduleConfig={moduleConfig}
      />
    </div>
  );
}
