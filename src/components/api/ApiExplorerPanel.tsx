import React, { useState, useEffect, useMemo } from 'react';
import {
  Braces,
  Plus,
  Search,
  Trash2,
  Download,
  Globe,
  KeyRound,
  FileJson,
  Layers,
  Code2,
  Check,
  Copy,
  RefreshCw,
  GitBranch,
  FolderOpen,
} from 'lucide-react';
import { ApiSpecRecord, AppUser, HttpMethod } from '../../types';
import { COLLECTIONS, getCollection, saveDocument, deleteDocument } from '../../services/dataService';
import { ApiImportModal, ExistingApiOption } from './ApiImportModal';
import { ApiEndpointRow } from './ApiEndpointRow';
import { ApiSchemaViewer } from './ApiSchemaViewer';

interface ApiExplorerPanelProps {
  currentUser: AppUser | null;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

interface ApiCollectionGroup {
  collectionKey: string;
  title: string;
  versions: ApiSpecRecord[];
  latest: ApiSpecRecord;
}

const HTTP_FILTERS: Array<'ALL' | HttpMethod> = ['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

function getSpecCollectionKey(spec: ApiSpecRecord): string {
  return (spec.collectionKey || spec.title || 'api').trim().toLowerCase().replace(/\s+/g, ' ');
}

function formatShortDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export const ApiExplorerPanel: React.FC<ApiExplorerPanelProps> = ({
  currentUser,
  showToast,
}) => {
  const [specs, setSpecs] = useState<ApiSpecRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSpecId, setSelectedSpecId] = useState<string>('');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importTargetApi, setImportTargetApi] = useState<ExistingApiOption | null>(null);

  // Filters & view state
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'ALL' | HttpMethod>('ALL');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('ALL');
  const [activeView, setActiveView] = useState<'endpoints' | 'schemas' | 'raw'>('endpoints');

  // Interactive test environment state
  const [overrideBaseUrl, setOverrideBaseUrl] = useState('');
  const [authHeaderType, setAuthHeaderType] = useState<'none' | 'bearer' | 'apikey'>('none');
  const [authTokenValue, setAuthTokenValue] = useState('');
  const [authHeaderKey, setAuthHeaderKey] = useState('X-API-Key');
  const [copiedRaw, setCopiedRaw] = useState(false);

  const loadSpecs = async () => {
    setIsLoading(true);
    try {
      const items = await getCollection<ApiSpecRecord>(COLLECTIONS.API_SPECS);
      const sorted = [...(items || [])].sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0).getTime() -
          new Date(a.updatedAt || a.createdAt || 0).getTime()
      );
      setSpecs(sorted);
      if (sorted.length > 0) {
        setSelectedSpecId((prev) =>
          prev && sorted.some((s) => s.id === prev) ? prev : sorted[0].id
        );
      } else {
        setSelectedSpecId('');
      }
    } catch (err) {
      console.warn('Erreur chargement api_specs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSpecs();
  }, []);

  // Group all saved JSON specs by collectionKey so multiple versions appear under the same API
  const apiCollections = useMemo<ApiCollectionGroup[]>(() => {
    const map = new Map<string, ApiSpecRecord[]>();
    for (const spec of specs) {
      const key = getSpecCollectionKey(spec);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(spec);
    }

    const groups: ApiCollectionGroup[] = [];
    for (const [collectionKey, versions] of map.entries()) {
      const sortedVersions = [...versions].sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0).getTime() -
          new Date(a.updatedAt || a.createdAt || 0).getTime()
      );
      groups.push({
        collectionKey,
        title: sortedVersions[0].title,
        versions: sortedVersions,
        latest: sortedVersions[0],
      });
    }

    return groups.sort(
      (a, b) =>
        new Date(b.latest.updatedAt || b.latest.createdAt || 0).getTime() -
        new Date(a.latest.updatedAt || a.latest.createdAt || 0).getTime()
    );
  }, [specs]);

  const existingApiOptions = useMemo<ExistingApiOption[]>(
    () =>
      apiCollections.map((g) => ({
        collectionKey: g.collectionKey,
        title: g.title,
      })),
    [apiCollections]
  );

  const activeSpec = useMemo(
    () => specs.find((s) => s.id === selectedSpecId) || specs[0] || null,
    [specs, selectedSpecId]
  );

  const activeCollection = useMemo(() => {
    if (!activeSpec) return null;
    const key = getSpecCollectionKey(activeSpec);
    return apiCollections.find((g) => g.collectionKey === key) || null;
  }, [activeSpec, apiCollections]);

  useEffect(() => {
    if (activeSpec) {
      setOverrideBaseUrl(activeSpec.baseUrl || '');
      setSelectedTagFilter('ALL');
    } else {
      setOverrideBaseUrl('');
      setSelectedTagFilter('ALL');
    }
  }, [activeSpec?.id]);

  const handleOpenNewImport = (targetApi: ExistingApiOption | null = null) => {
    setImportTargetApi(targetApi);
    setIsImportOpen(true);
  };

  const handleSaveSpec = async (spec: ApiSpecRecord) => {
    await saveDocument(COLLECTIONS.API_SPECS, spec);
    setSpecs((prev) => {
      const exists = prev.some((s) => s.id === spec.id);
      return exists ? prev.map((s) => (s.id === spec.id ? spec : s)) : [spec, ...prev];
    });
    setSelectedSpecId(spec.id);
    showToast?.(
      `${spec.title} (v${spec.version}) enregistrée en base de données.`,
      'success'
    );
  };

  const handleUpdateBaseUrlInDb = async () => {
    if (!activeSpec) return;
    const updated: ApiSpecRecord = {
      ...activeSpec,
      baseUrl: overrideBaseUrl.trim(),
      updatedAt: new Date().toISOString(),
    };
    await saveDocument(COLLECTIONS.API_SPECS, updated);
    setSpecs((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    showToast?.('URL de base sauvegardée en BD.', 'success');
  };

  const handleDeleteVersion = async (spec: ApiSpecRecord) => {
    await deleteDocument(COLLECTIONS.API_SPECS, spec.id);
    setSpecs((prev) => {
      const remaining = prev.filter((s) => s.id !== spec.id);
      if (selectedSpecId === spec.id) {
        const sameGroupNext = remaining.find(
          (r) => getSpecCollectionKey(r) === getSpecCollectionKey(spec)
        );
        setSelectedSpecId(sameGroupNext?.id || remaining[0]?.id || '');
      }
      return remaining;
    });
    showToast?.(`Version v${spec.version} de "${spec.title}" supprimée.`, 'success');
  };

  const handleDownloadJson = (spec: ApiSpecRecord) => {
    const blob = new Blob([spec.rawJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download =
      spec.fileName ||
      `${spec.title.toLowerCase().replace(/\s+/g, '-')}-v${spec.version}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const globalHeaders = useMemo(() => {
    const hdrs: Record<string, string> = {};
    if (authHeaderType === 'bearer' && authTokenValue.trim()) {
      hdrs['Authorization'] = authTokenValue.trim().startsWith('Bearer ')
        ? authTokenValue.trim()
        : `Bearer ${authTokenValue.trim()}`;
    } else if (authHeaderType === 'apikey' && authHeaderKey.trim() && authTokenValue.trim()) {
      hdrs[authHeaderKey.trim()] = authTokenValue.trim();
    }
    return hdrs;
  }, [authHeaderType, authTokenValue, authHeaderKey]);

  const availableTags = useMemo(() => {
    if (!activeSpec) return [];
    const set = new Set<string>();
    for (const ep of activeSpec.endpoints) {
      set.add(ep.tag || 'Général');
    }
    return Array.from(set);
  }, [activeSpec]);

  const groupedEndpoints = useMemo(() => {
    if (!activeSpec) return [];
    const q = searchQuery.trim().toLowerCase();
    const filtered = activeSpec.endpoints.filter((ep) => {
      if (methodFilter !== 'ALL' && ep.method !== methodFilter) return false;
      const epTag = ep.tag || 'Général';
      if (selectedTagFilter !== 'ALL' && epTag !== selectedTagFilter) return false;
      if (!q) return true;
      return (
        ep.path.toLowerCase().includes(q) ||
        (ep.summary || '').toLowerCase().includes(q) ||
        (ep.description || '').toLowerCase().includes(q) ||
        epTag.toLowerCase().includes(q)
      );
    });

    const groups = new Map<string, typeof filtered>();
    for (const ep of filtered) {
      const key = ep.tag || 'Général';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(ep);
    }
    return Array.from(groups.entries());
  }, [activeSpec, searchQuery, methodFilter, selectedTagFilter]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-[#2A7B76] border border-emerald-100 shrink-0">
            <Braces className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900">
              Documentation API
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={loadSpecs}
            className="px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-medium text-stone-700 hover:bg-stone-50 transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5"
            title="Actualiser depuis la base de données"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenNewImport(null)}
            className="px-4 py-2 rounded-xl bg-[#2A7B76] text-white text-xs font-semibold hover:bg-[#226460] transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Importer un JSON</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && specs.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-8 space-y-4">
          <div className="h-5 w-48 bg-stone-100 rounded animate-pulse" />
          <div className="h-12 w-full bg-stone-100 rounded-xl animate-pulse" />
          <div className="h-12 w-full bg-stone-100 rounded-xl animate-pulse" />
        </div>
      ) : specs.length === 0 ? (
        /* Clean Empty State without explanatory comments */
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#2A7B76] border border-emerald-100 flex items-center justify-center mx-auto">
            <FileJson className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-stone-900">
            Aucune doc enregistrée
          </h3>
          <button
            type="button"
            onClick={() => handleOpenNewImport(null)}
            className="px-5 py-2.5 rounded-xl bg-[#2A7B76] text-white text-xs font-semibold hover:bg-[#226460] transition cursor-pointer inline-flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Importer un JSON</span>
          </button>
        </div>
      ) : (
        /* Main Workspace: Left Collections List + Right Version Selector & Collection Viewer */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left API Collections Library */}
          <aside className="lg:col-span-3 bg-white border border-stone-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-800">
                Collections ({apiCollections.length})
              </span>
            </div>
            <div className="divide-y divide-stone-100 max-h-[640px] overflow-y-auto">
              {apiCollections.map((group) => {
                const isSelected = activeCollection?.collectionKey === group.collectionKey;
                const displaySpec = isSelected && activeSpec ? activeSpec : group.latest;
                return (
                  <div
                    key={group.collectionKey}
                    onClick={() => setSelectedSpecId(group.latest.id)}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      isSelected ? 'bg-emerald-50/60' : 'hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-xs font-semibold truncate ${
                            isSelected ? 'text-[#2A7B76]' : 'text-stone-900'
                          }`}
                        >
                          {group.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500 mt-1 font-mono tabular-nums">
                          <span>
                            {group.versions.length} version{group.versions.length > 1 ? 's' : ''}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>v{displaySpec.version}</span>
                          <span aria-hidden="true">·</span>
                          <span>{displaySpec.endpoints.length} routes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Right Active Version & Collection Workspace */}
          {activeSpec && activeCollection && (
            <section className="lg:col-span-9 space-y-5">
              {/* Version Picker Bar (choose downloaded/imported JSON version -> displays its collection) */}
              <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 shrink-0">
                      <GitBranch className="h-4 w-4 text-[#2A7B76]" />
                      <span>Version JSON :</span>
                    </div>
                    <select
                      value={activeSpec.id}
                      onChange={(e) => setSelectedSpecId(e.target.value)}
                      className="flex-1 min-w-[200px] max-w-md rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-mono text-stone-900 focus:outline-none focus:border-[#2A7B76] cursor-pointer"
                    >
                      {activeCollection.versions.map((ver) => (
                        <option key={ver.id} value={ver.id}>
                          v{ver.version}
                          {ver.fileName ? ` — ${ver.fileName}` : ''}
                          {ver.updatedAt ? ` (${formatShortDate(ver.updatedAt)})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenNewImport({
                          collectionKey: activeCollection.collectionKey,
                          title: activeCollection.title,
                        })
                      }
                      className="px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 text-[#2A7B76] text-xs font-semibold hover:bg-emerald-100/70 transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Nouvelle version</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadJson(activeSpec)}
                      className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-xs font-medium text-stone-700 hover:bg-stone-50 transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Exporter JSON</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteVersion(activeSpec)}
                      className="px-3 py-1.5 rounded-lg border border-red-200 bg-white text-xs font-medium text-red-600 hover:bg-red-50 transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5"
                      title="Supprimer cette version JSON"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>

                {/* Quick clickable version switcher tabs when multiple JSON versions exist */}
                {activeCollection.versions.length > 1 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-stone-100">
                    {activeCollection.versions.map((ver) => {
                      const isCurrent = ver.id === activeSpec.id;
                      return (
                        <button
                          key={ver.id}
                          type="button"
                          onClick={() => setSelectedSpecId(ver.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono transition cursor-pointer whitespace-nowrap shrink-0 ${
                            isCurrent
                              ? 'bg-[#2A7B76] text-white font-semibold'
                              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                          }`}
                        >
                          v{ver.version}
                          {ver.fileName ? ` · ${ver.fileName}` : ''}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Spec Header & Controls */}
              <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-baseline gap-2.5">
                    <h3 className="text-xl font-bold text-stone-900">{activeSpec.title}</h3>
                    <span className="text-xs font-mono text-[#2A7B76] font-semibold">
                      v{activeSpec.version}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                    <span>{activeSpec.formatLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{activeSpec.endpoints.length} endpoints</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{activeSpec.schemas.length} modèles</span>
                    {activeSpec.fileName && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{activeSpec.fileName}</span>
                      </>
                    )}
                  </div>
                  {activeSpec.description && (
                    <p className="text-xs text-stone-600 pt-1 leading-relaxed max-w-3xl">
                      {activeSpec.description}
                    </p>
                  )}
                </div>

                {/* Server Base URL & Global Auth Config */}
                <div className="pt-4 border-t border-stone-100 grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-6 space-y-1">
                    <label className="text-[11px] font-medium text-stone-600 flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-stone-400" />
                      <span>Serveur / URL de base</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={overrideBaseUrl}
                        onChange={(e) => setOverrideBaseUrl(e.target.value)}
                        placeholder="https://api.exemple.com/v1"
                        className="flex-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 font-mono text-xs text-stone-900 focus:outline-none focus:border-[#2A7B76]"
                      />
                      {overrideBaseUrl !== (activeSpec.baseUrl || '') && (
                        <button
                          type="button"
                          onClick={handleUpdateBaseUrlInDb}
                          className="px-3 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Sauvegarder
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-6 space-y-1">
                    <label className="text-[11px] font-medium text-stone-600 flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5 text-stone-400" />
                      <span>Authentification de test (Bearer / API Key)</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={authHeaderType}
                        onChange={(e) => setAuthHeaderType(e.target.value as any)}
                        className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-[#2A7B76]"
                      >
                        <option value="none">Aucune</option>
                        <option value="bearer">Bearer Token</option>
                        <option value="apikey">API Key Header</option>
                      </select>
                      {authHeaderType === 'apikey' && (
                        <input
                          type="text"
                          value={authHeaderKey}
                          onChange={(e) => setAuthHeaderKey(e.target.value)}
                          placeholder="X-API-Key"
                          className="w-28 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 font-mono text-xs text-stone-900 focus:outline-none focus:border-[#2A7B76]"
                        />
                      )}
                      {authHeaderType !== 'none' && (
                        <input
                          type="password"
                          value={authTokenValue}
                          onChange={(e) => setAuthTokenValue(e.target.value)}
                          placeholder={authHeaderType === 'bearer' ? 'eyJhbGciOi...' : 'Clé secrète...'}
                          className="flex-1 min-w-0 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 font-mono text-xs text-stone-900 focus:outline-none focus:border-[#2A7B76]"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* View Switcher + Search & Method Filter */}
                <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-1 p-1 bg-stone-100 rounded-xl self-start">
                    <button
                      type="button"
                      onClick={() => setActiveView('endpoints')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                        activeView === 'endpoints'
                          ? 'bg-white text-stone-900 shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <Layers className="h-3.5 w-3.5" />
                      <span>Collection ({activeSpec.endpoints.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveView('schemas')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                        activeView === 'schemas'
                          ? 'bg-white text-stone-900 shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <Braces className="h-3.5 w-3.5" />
                      <span>Modèles ({activeSpec.schemas.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveView('raw')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                        activeView === 'raw'
                          ? 'bg-white text-stone-900 shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <Code2 className="h-3.5 w-3.5" />
                      <span>JSON Brut</span>
                    </button>
                  </div>

                  {activeView === 'endpoints' && (
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative">
                        <Search className="h-3.5 w-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Filtrer route ou mot-clé..."
                          className="pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-xs text-stone-900 w-48 focus:outline-none focus:border-[#2A7B76]"
                        />
                      </div>
                      <div className="inline-flex items-center gap-1 p-1 bg-stone-100 rounded-lg">
                        {HTTP_FILTERS.map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setMethodFilter(m)}
                            className={`px-2 py-1 rounded-md text-[11px] font-mono font-semibold cursor-pointer ${
                              methodFilter === m
                                ? 'bg-white text-stone-900 shadow-2xs'
                                : 'text-stone-600 hover:text-stone-900'
                            }`}
                          >
                            {m === 'ALL' ? 'Tous' : m}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Folder / Tag Filter Bar for the Collection */}
                {activeView === 'endpoints' && availableTags.length > 1 && (
                  <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-medium text-stone-500 flex items-center gap-1 mr-1">
                      <FolderOpen className="h-3.5 w-3.5" />
                      <span>Dossiers :</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedTagFilter('ALL')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition ${
                        selectedTagFilter === 'ALL'
                          ? 'bg-stone-900 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      Tous
                    </button>
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSelectedTagFilter(tag)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition ${
                          selectedTagFilter === tag
                            ? 'bg-stone-900 text-white'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Active View Content */}
              {activeView === 'endpoints' && (
                <div className="space-y-6">
                  {groupedEndpoints.length === 0 ? (
                    <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center text-xs text-stone-500">
                      Aucun endpoint dans cette sélection.
                    </div>
                  ) : (
                    groupedEndpoints.map(([tagName, eps]) => {
                      const tagMeta = activeSpec.tags.find((t) => t.name === tagName);
                      return (
                        <div key={`${activeSpec.id}_${tagName}`} className="space-y-2.5">
                          <div className="flex items-baseline justify-between px-1">
                            <div className="flex items-baseline gap-2.5">
                              <h4 className="text-sm font-bold text-stone-900">{tagName}</h4>
                              {tagMeta?.description && (
                                <span className="text-xs text-stone-500">{tagMeta.description}</span>
                              )}
                            </div>
                            <span className="text-xs font-mono tabular-nums text-stone-400">
                              {eps.length} route{eps.length > 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {eps.map((ep) => (
                              <ApiEndpointRow
                                key={`${activeSpec.id}_${ep.id}`}
                                endpoint={ep}
                                baseUrl={overrideBaseUrl}
                                globalHeaders={globalHeaders}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeView === 'schemas' && (
                <div className="space-y-3">
                  {activeSpec.schemas.length === 0 ? (
                    <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center text-xs text-stone-500">
                      Aucun modèle déclaré dans cette version JSON.
                    </div>
                  ) : (
                    activeSpec.schemas.map((schema) => (
                      <div
                        key={schema.name}
                        className="bg-white border border-stone-200 rounded-2xl p-4 space-y-2"
                      >
                        <div className="flex items-baseline justify-between border-b border-stone-100 pb-2">
                          <span className="font-mono text-sm font-bold text-stone-900">
                            {schema.name}
                          </span>
                          <span className="font-mono text-xs text-[#2A7B76]">
                            {schema.type || 'object'}
                          </span>
                        </div>
                        {schema.description && (
                          <p className="text-xs text-stone-500">{schema.description}</p>
                        )}
                        <ApiSchemaViewer schema={schema.raw} />
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeView === 'raw' && (
                <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-700 font-mono">
                      v{activeSpec.version}
                      {activeSpec.fileName ? ` · ${activeSpec.fileName}` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(activeSpec.rawJson);
                        setCopiedRaw(true);
                        setTimeout(() => setCopiedRaw(false), 1800);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-50 cursor-pointer flex items-center gap-1.5"
                    >
                      {copiedRaw ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedRaw ? 'JSON copié' : 'Copier tout'}</span>
                    </button>
                  </div>
                  <pre className="rounded-xl bg-stone-900 text-stone-100 p-4 font-mono text-xs overflow-auto max-h-[600px]">
                    {activeSpec.rawJson}
                  </pre>
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* Import Modal */}
      <ApiImportModal
        isOpen={isImportOpen}
        onClose={() => {
          setIsImportOpen(false);
          setImportTargetApi(null);
        }}
        onSaveSpec={handleSaveSpec}
        importedBy={currentUser?.name || currentUser?.email}
        existingApis={existingApiOptions}
        defaultTargetApi={importTargetApi}
      />
    </div>
  );
};

export default ApiExplorerPanel;
