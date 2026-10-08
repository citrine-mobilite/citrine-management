import React, { useState, useEffect } from 'react';
import { FileText, Search, Plus, Database, RotateCcw, Sparkles } from 'lucide-react';
import { GeneratedDocument, Role, Employee, AppUser, CompanyModuleConfig } from '../types';
import { DocTemplateSelector } from './documents/DocTemplateSelector';
import { DocumentGrid } from './documents/DocumentGrid';
import { 
  DocTemplate, 
  DOC_TEMPLATES, 
  convertRHTemplateToDocTemplate, 
  subscribeToRHDocumentTemplates, 
  resetRHDocumentTemplatesToDefaults 
} from './DocTemplates';
import { OfficialDocumentModal } from './documents/OfficialDocumentModal';
import { CreateDocumentModal } from './documents/CreateDocumentModal';

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
}: DocumentGeneratorPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [previewDoc, setPreviewDoc] = useState<GeneratedDocument | null>(null);
  const [selectedTemplateForModal, setSelectedTemplateForModal] = useState<DocTemplate | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isResettingTemplates, setIsResettingTemplates] = useState(false);

  // Synchronisation des modèles de documents RH depuis la base Firestore
  const [dbTemplates, setDbTemplates] = useState<DocTemplate[]>(DOC_TEMPLATES);

  useEffect(() => {
    const unsubscribe = subscribeToRHDocumentTemplates((rhTemplates) => {
      setDbTemplates(rhTemplates.map(convertRHTemplateToDocTemplate));
    });
    return () => unsubscribe();
  }, []);

  // Mise à jour sécurisée en base de données Firestore
  const handleUpdate = (updater: GeneratedDocument[] | ((prev: GeneratedDocument[]) => GeneratedDocument[])) => {
    const updated = typeof updater === 'function' ? updater(documents || []) : updater;
    if (setDocuments) {
      setDocuments(updated);
    }
    if (onUpdateDocuments) {
      onUpdateDocuments(updated);
    }
  };

  const handleDeleteDoc = (id: string) => {
    handleUpdate((prev) => prev.filter((d) => d.id !== id));
    if (showToast) showToast('Document supprimé des archives BD.');
  };

  // Ouverture du formulaire de création avec le modèle choisi
  const handleSelectTemplate = (tpl: DocTemplate) => {
    setSelectedTemplateForModal(tpl);
    setIsCreateModalOpen(true);
  };

  // Enregistrement systématique des documents RH en base de données
  const handleSaveDocument = (newDoc: GeneratedDocument) => {
    const docToPersist: GeneratedDocument = {
      ...newDoc,
      saveToDatabase: true
    };
    handleUpdate((prev) => [docToPersist, ...prev]);
    // Ouverture immédiate de l'aperçu PDF
    setPreviewDoc(docToPersist);
  };

  // Réinitialisation des modèles par défaut en base de données
  const handleResetTemplates = async () => {
    if (!window.confirm("Voulez-vous synchroniser et actualiser l'ensemble des modèles RH en base de données ?")) {
      return;
    }
    setIsResettingTemplates(true);
    try {
      await resetRHDocumentTemplatesToDefaults();
      if (showToast) showToast('Modèles RH synchronisés avec succès en base de données.');
    } catch {
      if (showToast) showToast('Erreur lors de la synchronisation des modèles.', 'error');
    } finally {
      setIsResettingTemplates(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#2A7B76] to-emerald-800 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-200" />
            <h2 className="font-serif font-bold text-xl">Générateur de Documents RH & Contrats</h2>
          </div>
          <p className="text-xs text-emerald-100/90 mt-1">
            Papier officiel CITRINE SARL · Modèles & Données 100% conservés en base Firestore · Signature opt-in.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={isResettingTemplates}
            onClick={handleResetTemplates}
            className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-xs text-white text-xs font-semibold rounded-2xl transition flex items-center gap-1.5 border border-white/15 cursor-pointer disabled:opacity-50"
            title="Synchroniser les modèles RH en base Firestore"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isResettingTemplates ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Synchroniser Modèles BD</span>
          </button>

          <button
            onClick={() => {
              setSelectedTemplateForModal(null);
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-xs text-white text-xs font-bold rounded-2xl transition flex items-center gap-2 shrink-0 border border-white/20 cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau Document Officiel</span>
          </button>
        </div>
      </div>

      {/* Templates Selector (alimenté par la base de données Firestore) */}
      <DocTemplateSelector 
        templates={dbTemplates}
        onSelectTemplate={handleSelectTemplate} 
      />

      {/* Barre de recherche & Statistiques BD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Rechercher dans les archives BD (titre, collaborateur, catégorie)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-stone-500 font-medium self-end sm:self-auto">
          <div className="flex items-center gap-1.5 bg-emerald-50 text-[#2A7B76] px-3 py-1 rounded-xl border border-emerald-200/60 font-semibold">
            <Database className="h-3.5 w-3.5" />
            <span>{documents.length} document(s) en BD</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-stone-400">
            <Sparkles className="h-3 w-3 text-amber-500" />
            <span>{dbTemplates.length} modèles actifs</span>
          </div>
        </div>
      </div>

      {/* Grid des documents archivés */}
      <DocumentGrid
        documents={documents}
        searchTerm={searchTerm}
        onPreview={(doc) => setPreviewDoc(doc)}
        onDelete={handleDeleteDoc}
      />

      {/* Modal de Création / Paramétrage du Document */}
      <CreateDocumentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        employees={employees}
        initialTemplate={selectedTemplateForModal}
        templates={dbTemplates}
        onSaveDocument={handleSaveDocument}
        showToast={showToast}
      />

      {/* Modal d'Aperçu Officiel conforme au papier à en-tête CITRINE SARL */}
      <OfficialDocumentModal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
        moduleConfig={moduleConfig}
      />
    </div>
  );
}
