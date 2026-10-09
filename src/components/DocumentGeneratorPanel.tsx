import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  Database, 
  RotateCcw, 
  Sparkles, 
  LayoutGrid, 
  Table as TableIcon,
  FolderPlus
} from 'lucide-react';
import { GeneratedDocument, Role, Employee, AppUser, CompanyModuleConfig } from '../types';
import { DocTemplateSelector } from './documents/DocTemplateSelector';
import { DocumentGrid } from './documents/DocumentGrid';
import { DocumentTableView } from './documents/DocumentTableView';
import { 
  DocTemplate, 
  DOC_TEMPLATES, 
  convertRHTemplateToDocTemplate, 
  subscribeToRHDocumentTemplates, 
  resetRHDocumentTemplatesToDefaults 
} from './DocTemplates';
import { OfficialDocumentModal } from './documents/OfficialDocumentModal';
import { CreateDocumentModal } from './documents/CreateDocumentModal';
import { CreateDocTemplateModal } from './documents/CreateDocTemplateModal';

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
  const [isCreateTemplateModalOpen, setIsCreateTemplateModalOpen] = useState(false);
  const [isResettingTemplates, setIsResettingTemplates] = useState(false);

  // Commutateur de vue : Cards (Grille) vs DataTable (Tableau)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    try {
      const saved = localStorage.getItem('citrine_documents_view_mode');
      if (saved === 'grid' || saved === 'table') return saved;
    } catch {}
    return 'table'; // Vue DataTable par défaut pour une ergonomie optimale
  });

  const handleToggleViewMode = (mode: 'grid' | 'table') => {
    setViewMode(mode);
    try {
      localStorage.setItem('citrine_documents_view_mode', mode);
    } catch {}
  };

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
    if (!window.confirm("Voulez-vous synchroniser et actualiser l'ensemble des modèles RH en base de données Firestore ?")) {
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
            Papier officiel CITRINE SARL · Modèles & Données 100% conservés en base Firestore · Affichage Cards ou DataTable.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Bouton pour ajouter un type de modèle sans modifier le code */}
          <button
            type="button"
            onClick={() => setIsCreateTemplateModalOpen(true)}
            className="px-3.5 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-xs text-white text-xs font-bold rounded-2xl transition flex items-center gap-1.5 border border-white/20 cursor-pointer shadow-xs"
            title="Créer un nouveau type de document RH stocké en base de données Firestore"
          >
            <FolderPlus className="h-4 w-4 text-emerald-200" />
            <span>+ Nouveau Type de Modèle</span>
          </button>

          <button
            type="button"
            disabled={isResettingTemplates}
            onClick={handleResetTemplates}
            className="px-3 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-xs text-white text-xs font-semibold rounded-2xl transition flex items-center gap-1.5 border border-white/15 cursor-pointer disabled:opacity-50"
            title="Synchroniser les modèles RH en base Firestore"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isResettingTemplates ? 'animate-spin' : ''}`} />
            <span className="hidden lg:inline">Restaurer Modèles</span>
          </button>

          <button
            onClick={() => {
              setSelectedTemplateForModal(null);
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2.5 bg-[#D4A82F] hover:bg-[#b88f24] text-stone-900 text-xs font-bold rounded-2xl transition flex items-center gap-2 shrink-0 cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Générer un Document</span>
          </button>
        </div>
      </div>

      {/* Templates Selector (alimenté en temps réel par Firestore) */}
      <DocTemplateSelector 
        templates={dbTemplates}
        onSelectTemplate={handleSelectTemplate}
        onCreateNewTemplate={() => setIsCreateTemplateModalOpen(true)}
      />

      {/* Barre de recherche, Commutateur Cards vs DataTable, Statistiques BD */}
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

        <div className="flex items-center gap-3 justify-between sm:justify-end">
          {/* Commutateur de mode d'affichage : Cards vs DataTable */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200/80">
            <button
              type="button"
              onClick={() => handleToggleViewMode('table')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#2A7B76] shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Affichage en tableau (DataTable)"
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Tableau</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleViewMode('grid')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#2A7B76] shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Affichage en fiches (Cards)"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Cards</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-emerald-50 text-[#2A7B76] px-3 py-1.5 rounded-xl border border-emerald-200/60 font-semibold text-xs shrink-0">
            <Database className="h-3.5 w-3.5" />
            <span>{documents.length} document(s)</span>
          </div>
        </div>
      </div>

      {/* Affichage conditionnel : Cards (Grille) ou DataTable (Tableau) */}
      {viewMode === 'grid' ? (
        <DocumentGrid
          documents={documents}
          searchTerm={searchTerm}
          onPreview={(doc) => setPreviewDoc(doc)}
          onDelete={handleDeleteDoc}
        />
      ) : (
        <DocumentTableView
          documents={documents}
          searchTerm={searchTerm}
          onPreview={(doc) => setPreviewDoc(doc)}
          onDelete={handleDeleteDoc}
        />
      )}

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

      {/* Modal d'Ajout d'un Nouveau Type de Modèle RH (Zéro code / 100% Firestore) */}
      <CreateDocTemplateModal
        isOpen={isCreateTemplateModalOpen}
        onClose={() => setIsCreateTemplateModalOpen(false)}
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
