import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit3, 
  Calendar,
  X,
  CheckCircle2,
  Clock,
  Printer,
  Sparkles,
  Eye,
  Trash2,
  Copy,
  Loader2
} from 'lucide-react';
import { GeneratedDocument, DocumentCategory, Role, Employee } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { DOC_TEMPLATES, DocTemplate, TemplateField } from './DocTemplates';
import DocumentPreview from './DocumentPreview';
import { exportElementToPdf } from '../services/pdfExportService';
import { SearchableSelect } from './common/SearchableSelect';

interface DocumentGeneratorPanelProps {
  documents: GeneratedDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<GeneratedDocument[]>>;
  currentRole: Role;
  employees: Employee[];
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export default function DocumentGeneratorPanel({
  documents,
  setDocuments,
  currentRole,
  employees,
  showToast
}: DocumentGeneratorPanelProps) {
  // Modal states
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocTemplate>(DOC_TEMPLATES[0]);
  
  // Parameter state passed to generator
  const [formParams, setFormParams] = useState<Record<string, any>>({});
  const [docTitle, setDocTitle] = useState('');
  const [docFormatType, setDocFormatType] = useState<'word' | 'excel'>('word');
  const [editingDocId, setEditingDocId] = useState<string | null>(null);

  // Single collaborator and target reason/date linkage
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [targetDate, setTargetDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [targetReason, setTargetReason] = useState<string>('');
  const [applyStamp, setApplyStamp] = useState<boolean>(false);

  // Stamp / Signature Image stored in state & localStorage
  const [stampImage, setStampImage] = useState<string>(() => {
    return localStorage.getItem('citrine_stamp_image') || '';
  });

  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const res = event.target?.result as string;
        if (res) {
          setStampImage(res);
          localStorage.setItem('citrine_stamp_image', res);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | 'all'>('all');

  // Preview Lightbox for viewing generated documents
  const [previewingDoc, setPreviewingDoc] = useState<GeneratedDocument | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // Initialize parameters when selecting a template or opening new doc
  const handleOpenNewDocument = (tpl: DocTemplate) => {
    setSelectedTemplate(tpl);
    const initialParams: Record<string, any> = {};
    tpl.fields.forEach(f => {
      initialParams[f.key] = f.defaultValue;
    });
    setFormParams(initialParams);
    setDocTitle(tpl.name);
    setDocFormatType(tpl.formatType);
    setSelectedEmployeeId('');
    setTargetDate(new Date().toISOString().split('T')[0]);
    setTargetReason('');
    setApplyStamp(false);
    setEditingDocId(null);
    setShowEditorModal(true);
  };

  // Open existing doc for re-editing
  const handleOpenEditDocument = (doc: GeneratedDocument) => {
    const tpl = DOC_TEMPLATES.find(t => t.id === doc.templateId) || DOC_TEMPLATES[0];
    setSelectedTemplate(tpl);
    setDocTitle(doc.title);
    setDocFormatType(doc.formatType || tpl.formatType || 'word');
    setSelectedEmployeeId(doc.employeeId || '');
    setTargetDate(doc.targetDate || new Date().toISOString().split('T')[0]);
    setTargetReason(doc.targetReason || '');
    setApplyStamp(doc.metadata?.applyStamp || false);
    setEditingDocId(doc.id);
    
    // Merge saved params with defaults
    const currentParams = doc.templateParams || {};
    const mergedParams: Record<string, any> = {};
    tpl.fields.forEach(f => {
      mergedParams[f.key] = currentParams[f.key] !== undefined ? currentParams[f.key] : f.defaultValue;
    });
    setFormParams(mergedParams);
    setShowEditorModal(true);
  };

  const handleSaveDocument = (shouldDownload: boolean = false) => {
    if (!docTitle.trim()) return;

    const foundEmp = employees.find(e => e.id === selectedEmployeeId);
    const empName = foundEmp ? foundEmp.name : undefined;

    let finalDoc: GeneratedDocument;

    if (editingDocId) {
      const existing = documents.find(d => d.id === editingDocId);
      finalDoc = {
        ...(existing || {}),
        id: editingDocId,
        title: docTitle,
        description: empName ? `Collaborateur : ${empName}` : `Modèle : ${selectedTemplate.name}`,
        category: selectedTemplate.category,
        createdAt: existing ? existing.createdAt : new Date().toISOString(),
        templateId: selectedTemplate.id,
        templateParams: { ...formParams },
        formatType: docFormatType,
        employeeId: selectedEmployeeId || undefined,
        employeeName: empName,
        targetDate,
        targetReason,
        metadata: {
          ...(existing?.metadata || {}),
          applyStamp
        }
      } as GeneratedDocument;

      setDocuments(docs => docs.map(d => d.id === editingDocId ? finalDoc : d));
    } else {
      finalDoc = {
        id: `doc-${Date.now()}`,
        title: docTitle,
        description: empName ? `Collaborateur : ${empName}` : `Modèle : ${selectedTemplate.name}`,
        category: selectedTemplate.category,
        createdAt: new Date().toISOString(),
        templateId: selectedTemplate.id,
        templateParams: { ...formParams },
        formatType: docFormatType,
        employeeId: selectedEmployeeId || undefined,
        employeeName: empName,
        targetDate,
        targetReason,
        metadata: {
          applyStamp
        }
      };
      setDocuments(docs => [finalDoc, ...docs]);
    }

    if (shouldDownload) {
      downloadDoc(finalDoc);
      if (showToast) {
        showToast("Document enregistré en BD et téléchargé avec succès !", "success");
      }
    } else {
      if (showToast) {
        showToast("Document enregistré en BD avec succès !", "success");
      }
    }

    setShowEditorModal(false);
  };

  const handleDeleteDocument = (id: string) => {
    if (confirm("Voulez-vous supprimer ce document généré ?")) {
      setDocuments(docs => docs.filter(d => d.id !== id));
      if (previewingDoc?.id === id) setPreviewingDoc(null);
    }
  };

  // Helper to dynamically reconstitute document content from template and variables
  const getDocumentRenderedContent = (doc: GeneratedDocument) => {
    const tpl = DOC_TEMPLATES.find(t => t.id === doc.templateId) || DOC_TEMPLATES[0];
    let rendered = tpl.renderText(doc.templateParams || {});
    if (doc.employeeName) {
      rendered = `COLLABORATEUR CONCERNÉ : ${doc.employeeName}\n${rendered}`;
    }
    if (doc.targetDate) {
      rendered = `DATE / PÉRIODE CIBLÉE : ${doc.targetDate}\n${rendered}`;
    }
    if (doc.targetReason) {
      rendered = `MOTIF / RAISON CIBLÉE : ${doc.targetReason}\n${rendered}`;
    }
    return rendered;
  };

  const downloadDoc = (doc: GeneratedDocument) => {
    let renderedContent = getDocumentRenderedContent(doc);
    if (doc.metadata?.applyStamp) {
      renderedContent += `\n\n====================================================================\n[ CACHET ET SIGNATURE DE L'ENTREPRISE : APPLIQUÉS NUMÉRIQUEMENT ]\nDocument certifié authentique par Citrine Management.\n====================================================================`;
    } else {
      renderedContent += `\n\n====================================================================\n[ DOCUMENT GÉNÉRÉ - SIGNATURE MANUELLE ET VERSION IMPRIMÉE REQUISES ]\n====================================================================`;
    }
    const element = document.createElement("a");
    const file = new Blob([renderedContent], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${doc.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      if (searchTerm && !doc.title.toLowerCase().includes(searchTerm.toLowerCase()) && !(doc.description || '').toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (categoryFilter !== 'all' && doc.category !== categoryFilter) {
        return false;
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [documents, searchTerm, categoryFilter]);

  const getCategoryLabel = (cat: DocumentCategory) => {
    const labels: Record<DocumentCategory, string> = {
      procedure: 'Procédure',
      contract: 'Contrat',
      memo: 'Note de service',
      report: 'Rapport',
      template: 'Modèle',
      other: 'Autre'
    };
    return labels[cat] || cat;
  };

  return (
    <div className="space-y-6 text-stone-800">
      
      {/* Header and Templates Launcher */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-green-100/80 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-serif font-bold text-green-950 flex items-center gap-2">
              <FileText className="h-6 w-6 text-green-600" />
              Templates & Documents Paramétrables
            </h2>
          </div>

          {/* Persistent Company Stamp & Signature Manager Card */}
          <div className="bg-amber-50/90 border border-amber-200 p-3 rounded-xl flex items-center gap-3 shrink-0 shadow-2xs">
            <div className="h-10 w-16 bg-white border border-amber-300 rounded-lg p-1 flex items-center justify-center overflow-hidden relative">
              {stampImage ? (
                <img src={stampImage} alt="Cachet" className="max-h-8 max-w-full object-contain" />
              ) : (
                <span className="text-[8px] text-amber-800 font-bold text-center">Aucun cachet</span>
              )}
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-950 block">Cachet & Signature Officielle</span>
              <label className="text-[9px] bg-amber-600 text-white px-2.5 py-1 rounded-lg font-semibold hover:bg-amber-700 cursor-pointer inline-block mt-1 shadow-xs">
                {stampImage ? 'Changer l\'image' : 'Importer Cachet / Signature'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleStampUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Templates Selection Quick Grid */}
        <div className="pt-2 border-t border-green-50">
          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2">
            Créer à partir d'un modèle prédéfini :
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {DOC_TEMPLATES.map(tpl => (
              <button
                key={tpl.id}
                onClick={() => handleOpenNewDocument(tpl)}
                className="bg-stone-50 hover:bg-green-50/60 border border-stone-200/80 hover:border-green-200 p-3 rounded-xl text-left transition cursor-pointer flex flex-col justify-between group shadow-2xs"
              >
                <div className="space-y-1">
                  <span className="text-[8px] font-extrabold uppercase bg-white group-hover:bg-green-100 text-green-800 border border-stone-200 group-hover:border-green-200 px-1.5 py-0.5 rounded">
                    {getCategoryLabel(tpl.category)}
                  </span>
                  <h4 className="font-bold text-stone-800 text-xs leading-snug group-hover:text-green-950">{tpl.name}</h4>
                  <p className="text-[9px] text-stone-400 line-clamp-2 leading-tight">{tpl.description}</p>
                </div>
                <div className="mt-3 flex items-center justify-between text-[9px] font-bold text-green-700 group-hover:translate-x-0.5 transition-transform">
                  <span>Générer</span>
                  <Plus className="h-3.5 w-3.5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/60 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            placeholder="Rechercher dans les documents enregistrés..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-green-200/80 rounded-xl bg-white text-xs outline-none focus:border-green-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-[10px] text-stone-500 font-bold uppercase shrink-0">Catégorie :</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="text-xs font-bold border border-green-200 rounded-xl px-3 py-1.5 bg-white text-stone-800 focus:outline-green-500 cursor-pointer"
          >
            <option value="all">Toutes</option>
            <option value="procedure">Procédures</option>
            <option value="report">Rapports</option>
            <option value="memo">Notes de service</option>
            <option value="contract">Contrats</option>
          </select>
        </div>
      </div>

      {/* Generated Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDocuments.length === 0 ? (
          <div className="col-span-full bg-white p-10 rounded-2xl shadow-2xs border border-green-100 flex flex-col items-center justify-center text-center">
            <div className="bg-green-50 p-4 rounded-full mb-3 border border-green-100">
              <FileText className="h-8 w-8 text-green-400" />
            </div>
            <p className="text-stone-700 font-bold text-sm">Aucun document enregistré en base de données</p>
            <p className="text-stone-400 text-xs mt-1">Cliquez sur l'un des modèles ci-dessus pour générer votre premier document paramétré.</p>
          </div>
        ) : (
          filteredDocuments.map(doc => (
            <motion.div
              layout
              key={doc.id}
              className="bg-white rounded-2xl shadow-2xs border border-green-100/90 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="p-4 border-b border-green-50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wide bg-green-50 text-green-800 border border-green-100">
                      {getCategoryLabel(doc.category)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wide border ${
                      doc.formatType === 'excel'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        : 'bg-blue-50 text-blue-900 border-blue-200'
                    }`}>
                      {doc.formatType === 'excel' ? '📊 Excel' : '📄 Word'}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-stone-400 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-stone-300" />
                    {new Date(doc.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-stone-800 text-sm leading-snug">{doc.title}</h3>
                  <p className="text-[10px] text-stone-400 mt-1 font-medium">{doc.description}</p>
                </div>

                {/* Employee & Target Scope Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {doc.employeeName && (
                    <span className="inline-flex items-center gap-1 bg-green-50 text-green-900 border border-green-200 px-2 py-0.5 rounded-lg text-[9px] font-bold">
                      👤 {doc.employeeName}
                    </span>
                  )}
                  {doc.targetDate && (
                    <span className="inline-flex items-center gap-1 bg-stone-100 text-stone-700 border border-stone-200 px-2 py-0.5 rounded-lg text-[9px] font-medium">
                      📅 {doc.targetDate}
                    </span>
                  )}
                  {doc.targetReason && (
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-lg text-[9px] font-medium">
                      🏷️ {doc.targetReason}
                    </span>
                  )}
                </div>

                {/* Parameters Badge list */}
                {doc.templateParams && Object.keys(doc.templateParams).length > 0 && (
                  <div className="bg-stone-50 p-2 rounded-xl text-[9px] text-stone-500 font-mono space-y-0.5 border border-stone-100">
                    <span className="text-[8px] font-bold text-stone-400 uppercase tracking-wider block font-sans">Paramètres enregistrés :</span>
                    <div className="line-clamp-2">
                      {Object.entries(doc.templateParams).slice(0, 3).map(([k, v]) => (
                        <span key={k} className="inline-block mr-2 bg-white px-1.5 py-0.2 rounded border border-stone-200">
                          {k}: <strong className="text-stone-700">{String(v)}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="p-3 bg-stone-50/80 flex items-center justify-between gap-1.5 border-t border-green-50 text-xs">
                <button
                  onClick={() => setPreviewingDoc(doc)}
                  className="flex-1 bg-white hover:bg-green-50 text-stone-700 hover:text-green-900 border border-stone-200 rounded-xl py-1.5 text-[10px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer transition"
                >
                  <Eye className="h-3.5 w-3.5 text-green-600" /> Aperçu
                </button>

                <button
                  onClick={() => handleOpenEditDocument(doc)}
                  className="flex-1 bg-stone-800 hover:bg-stone-900 text-white rounded-xl py-1.5 text-[10px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer transition shadow-2xs"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Params
                </button>

                <button
                  onClick={() => setPreviewingDoc(doc)}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold inline-flex items-center gap-1 transition cursor-pointer shadow-2xs"
                  title="Télécharger en PDF A4 officiel"
                >
                  <Download className="h-3.5 w-3.5" /> PDF
                </button>

                <button
                  onClick={() => handleDeleteDocument(doc.id)}
                  className="p-1.5 text-stone-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  title="Supprimer le document"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* ----------------- SPLIT-SCREEN PARAMETER EDITOR & LIVE PREVIEW MODAL ----------------- */}
      <AnimatePresence>
        {showEditorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs"
              onClick={() => setShowEditorModal(false)}
            />

            <motion.div 
              initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col relative z-10 overflow-hidden border border-green-100"
            >
              {/* Modal Top Header */}
              <div className="bg-green-950 text-white p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="bg-green-800 p-2 rounded-xl">
                    <Sparkles className="h-5 w-5 text-green-200" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm sm:text-base">
                      {editingDocId ? 'Modifier les paramètres du document' : 'Générateur de Document Paramétré'}
                    </h3>
                    <p className="text-[10px] text-green-200/80">
                      Modèle sélectionné : <strong>{selectedTemplate.name}</strong>
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setShowEditorModal(false)}
                  className="text-stone-300 hover:text-white font-bold text-sm cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>

              {/* Main Split Screen Body */}
              <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-stone-200">
                
                {/* LEFT SIDE: Parameter Input Form (5 cols) */}
                <div className="lg:col-span-5 p-5 overflow-y-auto space-y-4 bg-stone-50/60">
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wider block">
                      Titre du document sauvegardé
                    </label>
                    <input
                      type="text"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      placeholder="Titre du document..."
                      className="w-full border border-green-200 rounded-xl px-3 py-2 text-xs font-bold bg-white focus:outline-green-500"
                    />
                  </div>

                   {/* Format de Rendu (Prédéfini selon le modèle) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wider block">
                      Format de Rendu Associé
                    </label>
                    <div className="flex items-center gap-2">
                      <span className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 ${
                        docFormatType === 'excel'
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                          : 'bg-blue-50 text-blue-900 border-blue-200'
                      }`}>
                        {docFormatType === 'excel' ? '📊 Format Excel (.xlsx)' : '📄 Format Word (.docx)'}
                      </span>
                    </div>
                    <p className="text-[9px] text-stone-400 italic text-center mt-0.5">
                      Le format de ce document est prédéfini par le modèle de base.
                    </p>
                  </div>

                  {/* 1 Collaborator & 1 Reason / Target Date Linkage Block */}
                  <div className="bg-green-50/70 border border-green-200/80 p-3.5 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-green-950 flex items-center gap-1.5">
                      👤 Liaison Unique (Collaborateur & Motif)
                    </h4>
                    <p className="text-[10px] text-stone-600 leading-tight">
                      Chaque document officiel concerne un et un seul collaborateur et/ou une seule raison/période ciblée.
                    </p>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-700 block">
                        Collaborateur Cible (1 seul) :
                      </label>
                      <select
                        value={selectedEmployeeId}
                        onChange={(e) => {
                          setSelectedEmployeeId(e.target.value);
                          const emp = employees.find(emp => emp.id === e.target.value);
                          if (emp) {
                            if (selectedTemplate.fields.some(f => f.key === 'employeeName')) {
                              setFormParams(prev => ({ ...prev, employeeName: emp.name }));
                            }
                          }
                        }}
                        className="w-full border border-green-200 rounded-xl px-3 py-2 text-xs bg-white font-bold text-stone-800 outline-none cursor-pointer"
                      >
                        <option value="">-- Aucun collaborateur spécifique (Général) --</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name} ({emp.roleType})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-700 block">
                          Date / Période :
                        </label>
                        <input
                          type="date"
                          value={targetDate}
                          onChange={(e) => setTargetDate(e.target.value)}
                          className="w-full border border-green-200 rounded-xl px-3 py-1.5 text-xs bg-white font-medium outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-700 block">
                          Motif / Raison :
                        </label>
                        <input
                          type="text"
                          value={targetReason}
                          onChange={(e) => setTargetReason(e.target.value)}
                          placeholder="Ex: Contrat CDI, Frais..."
                          className="w-full border border-green-200 rounded-xl px-3 py-1.5 text-xs bg-white font-medium outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cachet & Signature Image Configuration */}
                  <div className="bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-xl space-y-2">
                    <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      🔏 Cachet / Signature Officielle (Image)
                    </h4>
                    <p className="text-[10px] text-stone-600">
                      Importez l'image du cachet ou de la signature de l'entreprise. Elle sera enregistrée et greffée en bas du document.
                    </p>
                    <div className="flex items-center gap-3">
                      {stampImage ? (
                        <div className="h-10 w-24 bg-white border border-amber-300 rounded-lg p-1 flex items-center justify-center relative overflow-hidden">
                          <img src={stampImage} alt="Cachet" className="max-h-8 max-w-full object-contain" />
                        </div>
                      ) : (
                        <div className="h-10 w-24 bg-stone-100 border border-stone-200 rounded-lg flex items-center justify-center text-[9px] text-stone-400">
                          Aucun cachet
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleStampUpload}
                        className="text-[10px] text-stone-600 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-700 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Toggle to sign automatically */}
                  <div className="bg-emerald-50/60 border border-emerald-200/80 p-3.5 rounded-xl space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={applyStamp}
                        onChange={(e) => setApplyStamp(e.target.checked)}
                        className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-emerald-950">
                        Signer automatiquement le document ?
                      </span>
                    </label>
                    <p className="text-[10px] text-stone-600 leading-tight">
                      Si coché, le cachet et la signature importés ci-dessus seront appliqués numériquement en bas de page. Sinon, une signature manuelle papier sera attendue (par défaut).
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wider block">
                      Changer de modèle de base
                    </label>
                    <select
                      value={selectedTemplate.id}
                      onChange={(e) => {
                        const newTpl = DOC_TEMPLATES.find(t => t.id === e.target.value);
                        if (newTpl) handleOpenNewDocument(newTpl);
                      }}
                      className="w-full border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-medium bg-white outline-none cursor-pointer"
                    >
                      {DOC_TEMPLATES.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-2 border-t border-stone-200 space-y-3">
                    <h4 className="text-xs font-bold text-green-950 flex items-center gap-1.5">
                      <Edit3 className="h-3.5 w-3.5 text-green-600" />
                      Paramètres transmis au générateur :
                    </h4>

                    {selectedTemplate.fields.map(field => (
                      <div key={field.key} className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-600 block">
                          {field.label}
                        </label>

                        {field.type === 'textarea' ? (
                          <textarea
                            value={formParams[field.key] || ''}
                            onChange={(e) => setFormParams({ ...formParams, [field.key]: e.target.value })}
                            className="w-full border border-stone-200 rounded-xl p-2.5 text-xs bg-white focus:border-green-400 outline-none h-20 resize-y"
                          />
                        ) : field.type === 'select' ? (
                          <select
                            value={formParams[field.key] || field.defaultValue}
                            onChange={(e) => setFormParams({ ...formParams, [field.key]: e.target.value })}
                            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs bg-white font-medium focus:border-green-400 outline-none cursor-pointer"
                          >
                            {(field.options || []).map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type}
                            value={formParams[field.key] || ''}
                            onChange={(e) => setFormParams({ ...formParams, [field.key]: e.target.value })}
                            className="w-full border border-stone-200 rounded-xl px-3 py-1.5 text-xs bg-white focus:border-green-400 outline-none"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                </div>

                {/* RIGHT SIDE: Live Render Preview (7 cols) */}
                <div className="lg:col-span-7 p-5 bg-stone-100 overflow-y-auto flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1 text-green-800">
                        <Eye className="h-3.5 w-3.5" /> Aperçu du document en direct
                      </span>
                      <span>Modèle : {selectedTemplate.id}</span>
                    </div>

                    {/* Format Specific Representation (Word vs Excel) */}
                    {docFormatType === 'word' ? (
                      <DocumentPreview
                        docTitle={docTitle || selectedTemplate.name}
                        rawText={selectedTemplate.renderText(formParams)}
                        empName={employees.find(e => e.id === selectedEmployeeId)?.name}
                        date={targetDate}
                        reason={targetReason}
                        forceApplyStamp={applyStamp}
                        stampImage={stampImage}
                      />
                    ) : (
                      <div className="bg-white rounded-2xl shadow-xl border border-stone-200/80 p-5 space-y-3 text-[11px] text-stone-800 min-h-[420px] select-text">
                        <div className="flex justify-between items-center border-b border-emerald-200 pb-2 text-[10px] text-emerald-800 font-bold bg-emerald-50 p-3 rounded-xl">
                          <span className="flex items-center gap-1.5">
                            📊 Feuille de Calcul Microsoft Excel (.xlsx) - Feuille 1
                          </span>
                          <span className="bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded text-[9px]">Grille de Données</span>
                        </div>

                        {/* Spreadsheet Cell Grid Representation */}
                        <div className="border border-emerald-200 rounded-xl overflow-hidden bg-stone-50 text-[10px] font-mono shadow-2xs">
                          <div className="grid grid-cols-12 bg-emerald-100/80 border-b border-emerald-200 font-bold text-stone-700 text-center py-1.5">
                            <span className="col-span-1 border-r border-emerald-200 text-stone-500">N°</span>
                            <span className="col-span-11 text-left pl-3">Colonnes & Cellules de Données</span>
                          </div>
                          {selectedTemplate.renderText(formParams).split('\n').filter(line => line.trim().length > 0 && !line.includes('====')).map((line, idx) => (
                            <div key={idx} className="grid grid-cols-12 border-b border-stone-200/80 hover:bg-emerald-50/60 py-1.5 transition-colors">
                              <span className="col-span-1 text-center font-bold text-stone-400 border-r border-stone-200 bg-stone-100/80">{idx + 1}</span>
                              <span className="col-span-11 pl-3 text-stone-800 truncate font-sans font-medium">{line}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info Notice */}
                  <div className="mt-4 bg-green-50/80 border border-green-100 p-2.5 rounded-xl text-[9px] text-green-900 leading-tight">
                    ℹ️ <strong>Stockage Optimisé :</strong> Seuls les paramètres saisis ci-contre seront enregistrés en base de données. Le contenu sera régénéré à la volée lors des prochaines consultations ou modifications.
                  </div>
                </div>

              </div>

              {/* Modal Bottom Actions */}
              <div className="p-4 bg-white border-t border-stone-200 flex justify-between items-center shrink-0">
                <button
                  onClick={() => setShowEditorModal(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl transition cursor-pointer"
                >
                  Annuler
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveDocument(false)}
                    className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Enregistrer en BD
                  </button>
                  <button
                    onClick={() => handleSaveDocument(true)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold px-5 py-2 rounded-xl text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <Download className="h-4 w-4" /> Enregistrer & Télécharger (.txt)
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- LIGHTBOX PREVIEW FOR EXISTING GENERATED DOCUMENTS ----------------- */}
      {previewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-green-100 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col justify-between max-h-[90vh]">
            <div className="bg-green-950 text-white p-4 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[9px] bg-green-800 text-green-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {getCategoryLabel(previewingDoc.category)}
                </span>
                <h3 className="text-sm font-serif font-bold mt-1">
                  {previewingDoc.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewingDoc(null)}
                className="text-stone-300 hover:text-white font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div id="document-preview-container" className="p-6 overflow-y-auto bg-stone-100/80">
              {previewingDoc.formatType === 'excel' ? (
                <div className="bg-white p-8 sm:p-10 rounded-2xl border border-stone-200/80 shadow-lg space-y-5 text-stone-800 leading-relaxed font-serif relative">
                  <div className="flex items-center justify-between border-b-2 border-emerald-900/20 pb-4 font-sans">
                    <div>
                      <h4 className="font-extrabold text-emerald-950 text-xs uppercase">Feuille de Calcul Excel</h4>
                      <p className="text-[10px] text-stone-500">{previewingDoc.title}</p>
                    </div>
                  </div>
                  <div className="font-mono text-[11px] bg-stone-50 p-4 rounded-xl border border-stone-200 whitespace-pre-wrap">
                    {getDocumentRenderedContent(previewingDoc)}
                  </div>
                </div>
              ) : (
                <DocumentPreview
                  docTitle={previewingDoc.title}
                  rawText={getDocumentRenderedContent(previewingDoc)}
                  empName={previewingDoc.employeeName}
                  date={previewingDoc.targetDate}
                  reason={previewingDoc.targetReason}
                  forceApplyStamp={!!previewingDoc.metadata?.applyStamp}
                  stampImage={stampImage}
                />
              )}
            </div>

            <div className="p-4 bg-white border-t border-stone-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs shrink-0">
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <div className="text-[10px] text-stone-500 text-center sm:text-left">
                  Généré le : <strong>{new Date(previewingDoc.createdAt).toLocaleString('fr-FR')}</strong>
                </div>
                
                {/* Dynamic stamp/signature toggle on preview / download */}
                <label className="flex items-center gap-2 bg-emerald-50 text-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-200 text-[11px] cursor-pointer select-none font-bold mx-auto sm:mx-0">
                  <input
                    type="checkbox"
                    checked={!!previewingDoc.metadata?.applyStamp}
                    onChange={(e) => {
                      const updatedVal = e.target.checked;
                      const updatedDoc = {
                        ...previewingDoc,
                        metadata: {
                          ...previewingDoc.metadata,
                          applyStamp: updatedVal
                        }
                      };
                      setPreviewingDoc(updatedDoc);
                      setDocuments(docs => docs.map(d => d.id === previewingDoc.id ? updatedDoc : d));
                      if (showToast) {
                        showToast(updatedVal ? "Signature automatique activée pour ce document !" : "Signature automatique désactivée pour ce document.", "success");
                      }
                    }}
                    className="h-3.5 w-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300 cursor-pointer"
                  />
                  <span>Signer automatiquement avec le cachet officiel</span>
                </label>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={async () => {
                    setIsExportingPdf(true);
                    try {
                      const cleanTitle = previewingDoc.title.replace(/[^a-zA-Z0-9]/g, '_');
                      const ok = await exportElementToPdf('document-preview-container', `Document_${cleanTitle}_A4.pdf`);
                      if (ok && showToast) {
                        showToast("Document PDF officiel A4 téléchargé avec succès !", "success");
                      }
                    } catch (e) {
                      console.error("Erreur export PDF:", e);
                    } finally {
                      setIsExportingPdf(false);
                    }
                  }}
                  disabled={isExportingPdf}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                >
                  {isExportingPdf ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Génération PDF...
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5" /> Télécharger en PDF (A4)
                    </>
                  )}
                </button>
                <button
                  onClick={() => downloadDoc(previewingDoc)}
                  className="bg-stone-50 border border-stone-200 text-stone-700 hover:bg-stone-100 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                  title="Exporter au format brut .txt"
                >
                  <FileText className="h-3.5 w-3.5" /> .txt
                </button>
                <button
                  onClick={() => setPreviewingDoc(null)}
                  className="bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold px-4 py-1.5 rounded-xl text-xs cursor-pointer flex-1 sm:flex-none"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
