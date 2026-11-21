import React, { useEffect, useMemo, useState } from 'react';
import {
  ClipboardCheck,
  FileDown,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Loader2,
  Plus,
  RotateCcw,
  Search,
} from 'lucide-react';
import { AppUser, Employee } from '../../types';
import {
  ComplianceAxis,
  ComplianceChecklistItem,
  ComplianceComment,
  ComplianceStatus,
} from '../../types/complianceTypes';
import { COMPLIANCE_AXES_META } from '../../data/anticChecklistSeed';
import {
  COMPLIANCE_STATUS_OPTIONS,
  computeComplianceMetrics,
  filterComplianceItems,
} from '../../utils/complianceHelpers';
import {
  deleteComplianceItem,
  saveComplianceItem,
  subscribeToComplianceItems,
} from '../../services/complianceService';
import {
  exportComplianceToExcel,
  exportComplianceToPdf,
} from '../../services/complianceReportExportService';
import { ComplianceKpiStrip } from './ComplianceKpiStrip';
import { ComplianceItemRow } from './ComplianceItemRow';
import { ComplianceItemModal } from './ComplianceItemModal';
import { ComplianceCreateModal } from './ComplianceCreateModal';

interface CompliancePanelProps {
  currentUser?: AppUser | null;
  employees?: Employee[];
  onNavigateTab?: (tab: string) => void;
  onAddNotification?: (n: any) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

const ANTIC_REFERENCE_PDF_PATH = '/assets/aistudio/Hero_ANTIC_Liste_Documents_FR_a47c26e9.pdf';

export const CompliancePanel: React.FC<CompliancePanelProps> = ({
  currentUser,
  employees = [],
  onNavigateTab,
  showToast,
}) => {
  const [items, setItems] = useState<ComplianceChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeAxis, setActiveAxis] = useState<'all' | ComplianceAxis>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ComplianceStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyPending, setOnlyPending] = useState(false);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(['antic_gen_01']));
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [exportingFormat, setExportingFormat] = useState<'excel' | 'pdf' | null>(null);
  const [editingItem, setEditingItem] = useState<ComplianceChecklistItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const actorName = currentUser?.name || currentUser?.email || 'Administrateur';

  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTop = 0;
  }, []);

  useEffect(() => {
    let active = true;
    const unsub = subscribeToComplianceItems((mergedItems) => {
      if (!active) return;
      setItems(mergedItems);
      setLoading(false);
    });
    return () => {
      active = false;
      unsub();
    };
  }, []);

  const metrics = useMemo(() => computeComplianceMetrics(items), [items]);

  const filteredItems = useMemo(
    () =>
      filterComplianceItems(items, {
        axis: activeAxis,
        status: statusFilter,
        search: searchTerm,
        onlyPending,
      }),
    [items, activeAxis, statusFilter, searchTerm, onlyPending]
  );

  // Group filtered items preserving order by sectionTitle
  const groupedSections = useMemo(() => {
    const groups = new Map<string, { sectionTitle: string; sectionCode: string; items: ComplianceChecklistItem[] }>();
    for (const item of filteredItems) {
      const key = item.sectionTitle || item.sectionCode;
      if (!groups.has(key)) {
        groups.set(key, {
          sectionTitle: item.sectionTitle,
          sectionCode: item.sectionCode,
          items: [],
        });
      }
      groups.get(key)!.items.push(item);
    }
    return Array.from(groups.values());
  }, [filteredItems]);

  const handleToggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExpandAllVisible = (expand: boolean) => {
    if (!expand) {
      setExpandedIds(new Set());
      return;
    }
    setExpandedIds(new Set(filteredItems.map((i) => i.id)));
  };

  const handleToggleSubItem = async (item: ComplianceChecklistItem, subItemId: string) => {
    const updatedSubs = (item.subItems || []).map((s) =>
      s.id === subItemId ? { ...s, completed: !s.completed } : s
    );

    const allCompleted = updatedSubs.length > 0 && updatedSubs.every((s) => s.completed);
    const anyCompleted = updatedSubs.some((s) => s.completed);

    let nextStatus = item.status;
    if (item.status !== 'non_existant' && item.status !== 'non_applicable') {
      if (allCompleted) nextStatus = 'conforme';
      else if (anyCompleted && item.status === 'a_preparer') nextStatus = 'en_cours';
    }

    const updated: ComplianceChecklistItem = {
      ...item,
      subItems: updatedSubs,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: actorName,
    };

    setItems((prev) => prev.map((it) => (it.id === item.id ? updated : it)));
    setSavingItemId(item.id);
    try {
      await saveComplianceItem(updated);
    } catch (err: any) {
      setItems((prev) => prev.map((it) => (it.id === item.id ? item : it)));
      showToast?.(err?.message || "Erreur lors de l'enregistrement du sous-élément.", 'error');
    } finally {
      setSavingItemId(null);
    }
  };

  const handleQuickStatusChange = async (
    item: ComplianceChecklistItem,
    nextStatus: ComplianceStatus
  ) => {
    if (item.status === nextStatus) return;
    const updated: ComplianceChecklistItem = {
      ...item,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: actorName,
    };
    setItems((prev) => prev.map((it) => (it.id === item.id ? updated : it)));
    setSavingItemId(item.id);
    try {
      await saveComplianceItem(updated);
      showToast?.(`Statut de ${item.controlCode} mis à jour.`, 'success');
    } catch (err: any) {
      setItems((prev) => prev.map((it) => (it.id === item.id ? item : it)));
      showToast?.(err?.message || 'Erreur lors de la mise à jour du statut.', 'error');
    } finally {
      setSavingItemId(null);
    }
  };

  const handleAddComment = async (item: ComplianceChecklistItem, text: string) => {
    const newComment: ComplianceComment = {
      id: `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text,
      author: actorName,
      createdAt: new Date().toISOString(),
    };
    const updated: ComplianceChecklistItem = {
      ...item,
      comments: [...(item.comments || []), newComment],
      updatedAt: new Date().toISOString(),
      updatedBy: actorName,
    };
    setItems((prev) => prev.map((it) => (it.id === item.id ? updated : it)));
    setSavingItemId(item.id);
    try {
      await saveComplianceItem(updated);
      showToast?.(`Commentaire ajouté sur ${item.controlCode}.`, 'success');
    } catch (err: any) {
      setItems((prev) => prev.map((it) => (it.id === item.id ? item : it)));
      showToast?.(err?.message || "Impossible d'enregistrer le commentaire.", 'error');
    } finally {
      setSavingItemId(null);
    }
  };

  const handleDeleteComment = async (item: ComplianceChecklistItem, commentId: string) => {
    const updated: ComplianceChecklistItem = {
      ...item,
      comments: (item.comments || []).filter((c) => c.id !== commentId),
      updatedAt: new Date().toISOString(),
      updatedBy: actorName,
    };
    setItems((prev) => prev.map((it) => (it.id === item.id ? updated : it)));
    setSavingItemId(item.id);
    try {
      await saveComplianceItem(updated);
    } catch (err: any) {
      setItems((prev) => prev.map((it) => (it.id === item.id ? item : it)));
      showToast?.(err?.message || 'Erreur lors de la suppression du commentaire.', 'error');
    } finally {
      setSavingItemId(null);
    }
  };

  const handleSaveModal = async (updated: ComplianceChecklistItem) => {
    const enriched: ComplianceChecklistItem = {
      ...updated,
      updatedBy: actorName,
    };
    const saved = await saveComplianceItem(enriched);
    setItems((prev) => prev.map((it) => (it.id === saved.id ? saved : it)));
    showToast?.(`Exigence ${saved.controlCode} enregistrée avec succès.`, 'success');
  };

  const handleCreateCustom = async (newItem: ComplianceChecklistItem) => {
    const enriched: ComplianceChecklistItem = {
      ...newItem,
      updatedBy: actorName,
    };
    const saved = await saveComplianceItem(enriched);
    setItems((prev) => [...prev, saved].sort((a, b) => a.orderIndex - b.orderIndex));
    setExpandedIds((prev) => new Set(prev).add(saved.id));
    showToast?.(`Exigence ${saved.controlCode} ajoutée à la checklist.`, 'success');
  };

  const handleDeleteCustom = async (itemId: string) => {
    await deleteComplianceItem(itemId);
    setItems((prev) => prev.filter((it) => it.id !== itemId));
    showToast?.('Exigence personnalisée supprimée.', 'success');
  };

  const getExportScopeLabel = () => {
    if (activeAxis === 'all' && statusFilter === 'all' && !searchTerm && !onlyPending) {
      return 'Dossier complet ANTIC';
    }
    return `Vue filtrée (${filteredItems.length} exigences)`;
  };

  const handleExportExcel = async () => {
    if (exportingFormat) return;
    setExportingFormat('excel');
    try {
      const targetItems = filteredItems.length > 0 ? filteredItems : items;
      const filename = await exportComplianceToExcel(targetItems, {
        generatedBy: actorName,
        filterLabel: getExportScopeLabel(),
      });
      showToast?.(`Rapport Excel généré : ${filename}`, 'success');
    } catch (err: any) {
      showToast?.(err?.message || "Erreur lors de l'export Excel.", 'error');
    } finally {
      setExportingFormat(null);
    }
  };

  const handleExportPdf = async () => {
    if (exportingFormat) return;
    setExportingFormat('pdf');
    try {
      const targetItems = filteredItems.length > 0 ? filteredItems : items;
      const filename = await exportComplianceToPdf(targetItems, {
        generatedBy: actorName,
        filterLabel: getExportScopeLabel(),
      });
      showToast?.(`Rapport PDF généré : ${filename}`, 'success');
    } catch (err: any) {
      showToast?.(err?.message || "Erreur lors de l'export PDF.", 'error');
    } finally {
      setExportingFormat(null);
    }
  };

  const resetFilters = () => {
    setActiveAxis('all');
    setStatusFilter('all');
    setSearchTerm('');
    setOnlyPending(false);
  };

  const nextOrderIndex = useMemo(
    () => (items.length > 0 ? Math.max(...items.map((i) => i.orderIndex || 0)) + 1 : 100),
    [items]
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-emerald-50 text-[#2A7B76] rounded-xl border border-emerald-100 shrink-0">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold text-stone-900">
              Conformité &amp; Audit de Sécurité ANTIC
            </h1>
            <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
              Référentiel officiel (Direction de l’Audit de Sécurité) · Suivi des documents, responsables, versions, dates et sous-livrables · Marquage Confidentiel
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <a
            href={ANTIC_REFERENCE_PDF_PATH}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl transition whitespace-nowrap shrink-0"
          >
            <FileText className="h-4 w-4 text-stone-500" />
            <span>Référentiel PDF</span>
          </a>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exportingFormat !== null}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl transition whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          >
            {exportingFormat === 'excel' ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#2A7B76]" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 text-[#16A34A]" />
            )}
            <span>Exporter Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            disabled={exportingFormat !== null}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl transition whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          >
            {exportingFormat === 'pdf' ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#2A7B76]" />
            ) : (
              <FileDown className="h-4 w-4 text-[#DC2626]" />
            )}
            <span>Exporter PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2A7B76] hover:bg-[#22625E] rounded-xl transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter une exigence</span>
          </button>
        </div>
      </div>

      {/* KPI Strip + Axis Progress */}
      <ComplianceKpiStrip
        metrics={metrics}
        activeAxis={activeAxis}
        onSelectAxis={setActiveAxis}
        loading={loading}
      />

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-3">
        {/* Axis Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveAxis('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap shrink-0 cursor-pointer ${
              activeAxis === 'all'
                ? 'bg-[#2A7B76] text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Tous ({items.length})
          </button>
          {COMPLIANCE_AXES_META.map((meta) => {
            const shortAxisLabel =
              meta.axis === 'general'
                ? '0. Général'
                : meta.axis === 'org'
                  ? 'A. Organisationnel'
                  : meta.axis === 'rh'
                    ? 'B. Personnes (RH)'
                    : meta.axis === 'phy'
                      ? 'C. Physique'
                      : meta.axis === 'tech'
                        ? 'D. Technologique'
                        : 'E. Accès Tech';
            return (
              <button
                key={meta.axis}
                type="button"
                onClick={() => setActiveAxis(meta.axis)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap shrink-0 cursor-pointer ${
                  activeAxis === meta.axis
                    ? 'bg-[#2A7B76] text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {shortAxisLabel}
              </button>
            );
          })}
        </div>

        {/* Search + Status + Expand controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              aria-label="Rechercher dans la checklist ANTIC"
              placeholder="Rechercher par code (SEC_ORG_3, ACC-01), loi 2024/017, responsable ou sous-élément..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-stone-200 focus:outline-none focus:border-[#2A7B76]"
            />
          </div>

          <select
            aria-label="Filtrer par statut de conformité"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | ComplianceStatus)}
            className="px-3 py-2 text-xs rounded-lg border border-stone-200 bg-white text-stone-700 focus:outline-none focus:border-[#2A7B76]"
          >
            <option value="all">Tous les statuts</option>
            {COMPLIANCE_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <label className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-stone-700 bg-stone-50 border border-stone-200 rounded-lg cursor-pointer select-none whitespace-nowrap">
            <input
              type="checkbox"
              checked={onlyPending}
              onChange={(e) => setOnlyPending(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-stone-300 text-[#2A7B76] focus:ring-[#2A7B76]"
            />
            <span>À traiter uniquement</span>
          </label>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => handleExpandAllVisible(true)}
              className="px-2.5 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 border border-stone-200 rounded-lg transition whitespace-nowrap cursor-pointer"
            >
              Tout déplier
            </button>
            <button
              type="button"
              onClick={() => handleExpandAllVisible(false)}
              className="px-2.5 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 border border-stone-200 rounded-lg transition whitespace-nowrap cursor-pointer"
            >
              Tout replier
            </button>
          </div>
        </div>
      </div>

      {/* Checklist Sections */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((idx) => (
            <div key={idx} className="bg-white border border-stone-200 rounded-xl p-5 animate-pulse space-y-2">
              <div className="h-4 w-48 bg-stone-200 rounded" />
              <div className="h-3 w-full max-w-lg bg-stone-100 rounded" />
            </div>
          ))}
        </div>
      ) : groupedSections.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center space-y-3">
          <FolderOpen className="h-10 w-10 text-stone-300 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-stone-800">Aucune exigence ne correspond aux filtres</h3>
            <p className="text-xs text-stone-500">
              Modifiez votre recherche ou réinitialisez les filtres pour afficher l’ensemble du référentiel ANTIC.
            </p>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2A7B76] hover:bg-[#22625E] rounded-lg transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Réinitialiser les filtres</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedSections.map((group) => {
            const readyCount = group.items.filter((i) => i.status === 'conforme').length;
            return (
              <section key={group.sectionTitle} className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <h2 className="text-sm font-serif font-bold text-stone-900">
                    {group.sectionTitle}
                  </h2>
                  <span className="text-xs font-medium text-stone-500 tabular-nums">
                    {readyCount} / {group.items.length} conformes
                  </span>
                </div>

                <div className="space-y-2.5">
                  {group.items.map((item) => (
                    <ComplianceItemRow
                      key={item.id}
                      item={item}
                      isExpanded={expandedIds.has(item.id)}
                      onToggleExpand={handleToggleExpand}
                      onToggleSubItem={handleToggleSubItem}
                      onQuickStatusChange={handleQuickStatusChange}
                      onAddComment={handleAddComment}
                      onDeleteComment={handleDeleteComment}
                      onOpenEdit={setEditingItem}
                      onNavigateCitrineTab={onNavigateTab}
                      savingItemId={savingItemId}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Edit / Metadata Modal */}
      <ComplianceItemModal
        isOpen={Boolean(editingItem)}
        item={editingItem}
        employees={employees}
        authorName={actorName}
        onClose={() => setEditingItem(null)}
        onSave={handleSaveModal}
        onDelete={handleDeleteCustom}
      />

      {/* Add Custom Requirement Modal */}
      <ComplianceCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreateCustom}
        nextOrderIndex={nextOrderIndex}
      />
    </div>
  );
};

export default CompliancePanel;
