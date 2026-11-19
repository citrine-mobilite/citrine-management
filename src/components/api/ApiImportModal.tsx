import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, FileJson, Globe, CheckCircle2, AlertCircle, Code2 } from 'lucide-react';
import { ApiSpecRecord } from '../../types';
import { parseAnyApiJson } from '../../utils/adaptiveApiParser';

export interface ExistingApiOption {
  collectionKey: string;
  title: string;
}

interface ApiImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSpec: (spec: ApiSpecRecord) => Promise<void>;
  importedBy?: string;
  existingApis?: ExistingApiOption[];
  defaultTargetApi?: ExistingApiOption | null;
}

const SAMPLE_OPENAPI = {
  openapi: '3.0.3',
  info: {
    title: 'API Paiements & Facturation',
    version: '2.1.0',
    description: 'Interface REST de gestion des factures et transactions clients.',
  },
  servers: [{ url: 'https://jsonplaceholder.typicode.com', description: 'Environnement de test public' }],
  tags: [
    { name: 'Utilisateurs', description: 'Gestion des comptes' },
    { name: 'Publications', description: 'Ressources de démonstration' },
  ],
  paths: {
    '/users': {
      get: {
        tags: ['Utilisateurs'],
        summary: 'Lister les utilisateurs',
        parameters: [{ name: '_limit', in: 'query', schema: { type: 'integer', example: 5 }, description: 'Nombre maximal de résultats' }],
        responses: {
          '200': {
            description: 'Liste récupérée avec succès',
            content: {
              'application/json': {
                example: [{ id: 1, name: 'Amadou Diallo', email: 'amadou@citrine.cm' }],
              },
            },
          },
        },
      },
    },
    '/posts': {
      post: {
        tags: ['Publications'],
        summary: 'Créer une publication',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'body', 'userId'],
                properties: {
                  title: { type: 'string', example: 'Nouvelle note' },
                  body: { type: 'string', example: 'Contenu de la requête JSON' },
                  userId: { type: 'integer', example: 1 },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Ressource créée' },
        },
      },
    },
  },
};

const SAMPLE_CUSTOM_JSON = {
  apiName: 'Passerelle Mobile Money & SMS',
  version: '1.4.0',
  baseUrl: 'https://api.partenaire.cm/v1',
  endpoints: [
    {
      group: 'Paiements',
      method: 'POST',
      path: '/transactions/init',
      title: 'Initier un paiement mobile',
      headers: { Authorization: 'Bearer <token>' },
      body: { phone: '+237690000000', amount: 15000, currency: 'XAF', reference: 'CMD-2026-01' },
      response: { status: 'pending', transactionId: 'TXN_998811', fee: 150 },
    },
    {
      group: 'Paiements',
      method: 'GET',
      path: '/transactions/{id}',
      title: 'Vérifier le statut d’une transaction',
      params: [{ name: 'id', in: 'path', required: true, type: 'string', example: 'TXN_998811' }],
      response: { transactionId: 'TXN_998811', status: 'success', amount: 15000 },
    },
  ],
};

function normalizeCollectionKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export const ApiImportModal: React.FC<ApiImportModalProps> = ({
  isOpen,
  onClose,
  onSaveSpec,
  importedBy,
  existingApis = [],
  defaultTargetApi = null,
}) => {
  const [importMode, setImportMode] = useState<'file' | 'paste' | 'url'>('file');
  const [rawText, setRawText] = useState('');
  const [remoteUrl, setRemoteUrl] = useState('');
  const [fileName, setFileName] = useState<string | undefined>(undefined);
  const [previewSpec, setPreviewSpec] = useState<ApiSpecRecord | null>(null);
  const [targetType, setTargetType] = useState<'new' | 'existing'>('new');
  const [selectedExistingKey, setSelectedExistingKey] = useState<string>('');
  const [customTitle, setCustomTitle] = useState('');
  const [customVersion, setCustomVersion] = useState('');
  const [customBaseUrl, setCustomBaseUrl] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (defaultTargetApi) {
      setTargetType('existing');
      setSelectedExistingKey(defaultTargetApi.collectionKey);
      setCustomTitle(defaultTargetApi.title);
    } else {
      setTargetType('new');
      setSelectedExistingKey(existingApis[0]?.collectionKey || '');
    }
  }, [isOpen, defaultTargetApi, existingApis]);

  if (!isOpen) return null;

  const processJsonString = (text: string, sourceFileName?: string) => {
    setRawText(text);
    setFileName(sourceFileName);
    setParseError(null);
    if (!text.trim()) {
      setPreviewSpec(null);
      return;
    }
    try {
      const parsed = parseAnyApiJson(text, {
        fileName: sourceFileName,
        importedBy,
      });
      setPreviewSpec(parsed);
      if (targetType === 'existing' && selectedExistingKey) {
        const match = existingApis.find((a) => a.collectionKey === selectedExistingKey);
        setCustomTitle(match?.title || parsed.title);
      } else {
        setCustomTitle(parsed.title);
      }
      setCustomVersion(parsed.version || '1.0.0');
      setCustomBaseUrl(parsed.baseUrl);
    } catch (err: any) {
      setPreviewSpec(null);
      setParseError(err?.message || 'Format JSON invalide');
    }
  };

  const handleFileSelected = async (file: File) => {
    try {
      const content = await file.text();
      processJsonString(content, file.name);
    } catch {
      setParseError('Impossible de lire le fichier sélectionné.');
    }
  };

  const handleFetchRemoteUrl = async () => {
    if (!remoteUrl.trim()) return;
    setIsFetchingUrl(true);
    setParseError(null);
    try {
      const res = await fetch('/api/api-explorer/fetch-spec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: remoteUrl.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Échec de récupération du JSON');
      }
      const raw = json.rawJson || JSON.stringify(json.data, null, 2);
      processJsonString(raw, remoteUrl.trim().split('/').pop() || 'remote-api.json');
    } catch (err: any) {
      setParseError(err?.message || 'Erreur lors du chargement depuis l’URL.');
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleConfirmSave = async () => {
    if (!previewSpec) return;
    setIsSaving(true);
    try {
      const existingMatch =
        targetType === 'existing'
          ? existingApis.find((a) => a.collectionKey === selectedExistingKey)
          : null;

      const finalTitle = existingMatch?.title || customTitle.trim() || previewSpec.title;
      const finalCollectionKey = existingMatch?.collectionKey || normalizeCollectionKey(finalTitle);

      const finalSpec: ApiSpecRecord = {
        ...previewSpec,
        collectionKey: finalCollectionKey,
        title: finalTitle,
        version: customVersion.trim() || previewSpec.version || '1.0.0',
        baseUrl: customBaseUrl.trim(),
        updatedAt: new Date().toISOString(),
      };
      await onSaveSpec(finalSpec);
      setRawText('');
      setRemoteUrl('');
      setFileName(undefined);
      setPreviewSpec(null);
      setParseError(null);
      onClose();
    } catch (err: any) {
      setParseError(err?.message || 'Erreur lors de l’enregistrement en base de données.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-stone-200 w-full max-w-3xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-[#2A7B76] border border-emerald-100">
              <FileJson className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-stone-900">
                Importer une documentation JSON
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Import Mode Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
              <button
                type="button"
                onClick={() => setImportMode('file')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  importMode === 'file' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Fichier JSON</span>
              </button>
              <button
                type="button"
                onClick={() => setImportMode('paste')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  importMode === 'paste' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Code2 className="h-3.5 w-3.5" />
                <span>Coller du JSON</span>
              </button>
              <button
                type="button"
                onClick={() => setImportMode('url')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  importMode === 'url' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                <span>URL distante</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setImportMode('paste');
                  processJsonString(JSON.stringify(SAMPLE_OPENAPI, null, 2), 'openapi-exemple.json');
                }}
                className="px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium cursor-pointer whitespace-nowrap shrink-0"
              >
                Exemple OpenAPI
              </button>
              <button
                type="button"
                onClick={() => {
                  setImportMode('paste');
                  processJsonString(JSON.stringify(SAMPLE_CUSTOM_JSON, null, 2), 'custom-api.json');
                }}
                className="px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium cursor-pointer whitespace-nowrap shrink-0"
              >
                Exemple JSON Custom
              </button>
            </div>
          </div>

          {/* Mode: File Upload */}
          {importMode === 'file' && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const dropped = e.dataTransfer.files?.[0];
                if (dropped) handleFileSelected(dropped);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer ${
                isDragging
                  ? 'border-[#2A7B76] bg-emerald-50/40'
                  : 'border-stone-300 hover:border-[#2A7B76] bg-stone-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelected(file);
                }}
              />
              <Upload className="h-8 w-8 text-[#2A7B76] mx-auto mb-3" />
              <p className="text-sm font-medium text-stone-800">
                {fileName ? `Fichier chargé : ${fileName}` : 'Sélectionnez ou déposez un fichier .json'}
              </p>
            </div>
          )}

          {/* Mode: Paste JSON */}
          {importMode === 'paste' && (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-stone-700">
                Contenu JSON
              </label>
              <textarea
                value={rawText}
                onChange={(e) => processJsonString(e.target.value, fileName)}
                rows={8}
                placeholder='{"openapi": "3.0.0", "paths": { ... }}'
                className="w-full rounded-xl border border-stone-200 bg-stone-50 p-3 font-mono text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#2A7B76]/30 focus:border-[#2A7B76]"
              />
            </div>
          )}

          {/* Mode: Remote URL */}
          {importMode === 'url' && (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-stone-700">
                URL du fichier JSON
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={remoteUrl}
                  onChange={(e) => setRemoteUrl(e.target.value)}
                  placeholder="https://petstore3.swagger.io/api/v3/openapi.json"
                  className="flex-1 rounded-xl border border-stone-200 px-3.5 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2A7B76]/30 focus:border-[#2A7B76]"
                />
                <button
                  type="button"
                  onClick={handleFetchRemoteUrl}
                  disabled={isFetchingUrl || !remoteUrl.trim()}
                  className="px-4 py-2 rounded-xl bg-[#2A7B76] text-white text-xs font-semibold hover:bg-[#226460] disabled:opacity-50 transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  {isFetchingUrl ? 'Chargement...' : 'Analyser URL'}
                </button>
              </div>
            </div>
          )}

          {/* Error Feedback */}
          {parseError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Parsed Adaptive Preview */}
          {previewSpec && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span className="text-xs font-semibold">
                    {previewSpec.formatLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-600 font-mono tabular-nums">
                  <span>{previewSpec.endpoints.length} endpoints</span>
                  <span aria-hidden="true">·</span>
                  <span>{previewSpec.tags.length} groupes</span>
                  <span aria-hidden="true">·</span>
                  <span>{previewSpec.schemas.length} modèles</span>
                </div>
              </div>

              {/* Target: New API vs New Version of Existing API */}
              {existingApis.length > 0 && (
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1 p-1 bg-white border border-stone-200 rounded-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setTargetType('new');
                        setCustomTitle(previewSpec.title);
                      }}
                      className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition ${
                        targetType === 'new'
                          ? 'bg-[#2A7B76] text-white'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Nouvelle collection
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetType('existing');
                        const firstKey = selectedExistingKey || existingApis[0]?.collectionKey || '';
                        setSelectedExistingKey(firstKey);
                        const match = existingApis.find((a) => a.collectionKey === firstKey);
                        if (match) setCustomTitle(match.title);
                      }}
                      className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition ${
                        targetType === 'existing'
                          ? 'bg-[#2A7B76] text-white'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Ajouter une version
                    </button>
                  </div>

                  {targetType === 'existing' && (
                    <div>
                      <label className="block text-[11px] font-medium text-stone-600 mb-1">
                        Collection cible
                      </label>
                      <select
                        value={selectedExistingKey}
                        onChange={(e) => {
                          setSelectedExistingKey(e.target.value);
                          const match = existingApis.find((a) => a.collectionKey === e.target.value);
                          if (match) setCustomTitle(match.title);
                        }}
                        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-[#2A7B76]"
                      >
                        {existingApis.map((api) => (
                          <option key={api.collectionKey} value={api.collectionKey}>
                            {api.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">
                    Nom de l'API
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    disabled={targetType === 'existing'}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-900 disabled:bg-stone-100 disabled:text-stone-500 focus:outline-none focus:border-[#2A7B76]"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">
                    Version JSON
                  </label>
                  <input
                    type="text"
                    value={customVersion}
                    onChange={(e) => setCustomVersion(e.target.value)}
                    placeholder="1.0.0"
                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-mono text-stone-900 focus:outline-none focus:border-[#2A7B76]"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">
                    URL de base
                  </label>
                  <input
                    type="text"
                    value={customBaseUrl}
                    onChange={(e) => setCustomBaseUrl(e.target.value)}
                    placeholder="https://api.exemple.com/v1"
                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-mono text-stone-900 focus:outline-none focus:border-[#2A7B76]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-stone-200 bg-white text-xs font-medium text-stone-700 hover:bg-stone-100 transition cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirmSave}
            disabled={!previewSpec || isSaving}
            className="px-5 py-2 rounded-xl bg-[#2A7B76] text-white text-xs font-semibold hover:bg-[#226460] disabled:opacity-50 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer en base de données'}
          </button>
        </div>
      </div>
    </div>
  );
};
