import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Play,
  Copy,
  Check,
  Terminal,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { ApiEndpoint, HttpMethod } from '../../types';
import { ApiSchemaViewer } from './ApiSchemaViewer';
import { buildCurlCommand, resolveFullEndpointUrl } from '../../utils/adaptiveApiParser';

interface ApiEndpointRowProps {
  endpoint: ApiEndpoint;
  baseUrl: string;
  globalHeaders: Record<string, string>;
}

const METHOD_STYLES: Record<HttpMethod, { badge: string; border: string; rowBg: string }> = {
  GET: {
    badge: 'bg-emerald-700 text-white',
    border: 'border-emerald-200',
    rowBg: 'bg-emerald-50/40',
  },
  POST: {
    badge: 'bg-sky-700 text-white',
    border: 'border-sky-200',
    rowBg: 'bg-sky-50/40',
  },
  PUT: {
    badge: 'bg-amber-600 text-white',
    border: 'border-amber-200',
    rowBg: 'bg-amber-50/40',
  },
  PATCH: {
    badge: 'bg-indigo-600 text-white',
    border: 'border-indigo-200',
    rowBg: 'bg-indigo-50/40',
  },
  DELETE: {
    badge: 'bg-red-600 text-white',
    border: 'border-red-200',
    rowBg: 'bg-red-50/40',
  },
  HEAD: {
    badge: 'bg-stone-700 text-white',
    border: 'border-stone-200',
    rowBg: 'bg-stone-50/60',
  },
  OPTIONS: {
    badge: 'bg-stone-600 text-white',
    border: 'border-stone-200',
    rowBg: 'bg-stone-50/60',
  },
  WS: {
    badge: 'bg-teal-700 text-white',
    border: 'border-teal-200',
    rowBg: 'bg-teal-50/40',
  },
  GRAPHQL: {
    badge: 'bg-rose-700 text-white',
    border: 'border-rose-200',
    rowBg: 'bg-rose-50/40',
  },
};

export const ApiEndpointRow: React.FC<ApiEndpointRowProps> = ({
  endpoint,
  baseUrl,
  globalHeaders,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [bodyTab, setBodyTab] = useState<'example' | 'schema'>('example');
  const [selectedResponseIdx, setSelectedResponseIdx] = useState(0);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedResp, setCopiedResp] = useState(false);

  // Try-it-out state initialized lazily
  const [paramValues, setParamValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const p of endpoint.parameters) {
      const def = p.example ?? p.default ?? '';
      if (def !== '') {
        init[`${p.in}:${p.name}`] = String(def);
      }
    }
    return init;
  });

  const [requestBodyText, setRequestBodyText] = useState<string>(() => {
    if (endpoint.requestBody?.example !== undefined) {
      return typeof endpoint.requestBody.example === 'string'
        ? endpoint.requestBody.example
        : JSON.stringify(endpoint.requestBody.example, null, 2);
    }
    return '';
  });

  const [isExecuting, setIsExecuting] = useState(false);
  const [execResult, setExecResult] = useState<{
    status: number;
    statusText: string;
    durationMs: number;
    body: any;
    headers: Record<string, string>;
    error?: string;
  } | null>(null);

  const styles = METHOD_STYLES[endpoint.method] || METHOD_STYLES.GET;

  const mergedHeaders = useMemo(() => {
    const hdrs: Record<string, string> = { ...globalHeaders };
    if (endpoint.requestBody?.contentType && !['GET', 'HEAD'].includes(endpoint.method)) {
      hdrs['Content-Type'] = hdrs['Content-Type'] || endpoint.requestBody.contentType;
    }
    for (const p of endpoint.parameters) {
      if (p.in === 'header') {
        const val = paramValues[`header:${p.name}`];
        if (val) hdrs[p.name] = val;
      }
    }
    return hdrs;
  }, [globalHeaders, endpoint, paramValues]);

  const resolvedUrl = useMemo(
    () => resolveFullEndpointUrl(baseUrl, endpoint.path, paramValues, endpoint.parameters),
    [baseUrl, endpoint.path, paramValues, endpoint.parameters]
  );

  const curlCommand = useMemo(
    () => buildCurlCommand(resolvedUrl, endpoint.method, mergedHeaders, requestBodyText),
    [resolvedUrl, endpoint.method, mergedHeaders, requestBodyText]
  );

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 1800);
  };

  const handleExecuteRequest = async () => {
    if (!resolvedUrl || !resolvedUrl.startsWith('http')) {
      setExecResult({
        status: 0,
        statusText: 'URL incomplète',
        durationMs: 0,
        body: null,
        headers: {},
        error: 'Définissez une URL de base valide (ex: https://api.exemple.com) en haut de la page.',
      });
      return;
    }

    setIsExecuting(true);
    setExecResult(null);

    try {
      const res = await fetch('/api/api-explorer/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: resolvedUrl,
          method: endpoint.method,
          headers: mergedHeaders,
          body: !['GET', 'HEAD'].includes(endpoint.method) ? requestBodyText : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setExecResult({
          status: res.status || 502,
          statusText: 'Erreur Proxy',
          durationMs: 0,
          body: null,
          headers: {},
          error: json.error || 'Échec de l’appel HTTP',
        });
      } else {
        setExecResult({
          status: json.status,
          statusText: json.statusText,
          durationMs: json.durationMs,
          body: json.body,
          headers: json.headers || {},
        });
      }
    } catch (err: any) {
      setExecResult({
        status: 0,
        statusText: 'Erreur Réseau',
        durationMs: 0,
        body: null,
        headers: {},
        error: err?.message || 'Impossible de contacter le serveur.',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const activeResponse = endpoint.responses[selectedResponseIdx] || endpoint.responses[0];

  return (
    <div className={`rounded-xl border ${styles.border} overflow-hidden bg-white transition-colors`}>
      {/* Collapsed Header Row */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full px-4 py-3 flex items-center justify-between gap-3 text-left cursor-pointer transition-colors ${
          isOpen ? styles.rowBg : 'hover:bg-stone-50/80'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold tracking-wide w-20 text-center shrink-0 ${styles.badge}`}
          >
            {endpoint.method}
          </span>
          <span
            className={`font-mono text-xs sm:text-sm font-semibold text-stone-900 truncate ${
              endpoint.deprecated ? 'line-through text-stone-400' : ''
            }`}
          >
            {endpoint.path}
          </span>
          {endpoint.summary && (
            <span className="hidden md:inline text-xs text-stone-500 truncate">
              {endpoint.summary}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {endpoint.deprecated && (
            <span className="text-[11px] font-medium text-amber-700">Obsolète</span>
          )}
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-stone-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-stone-400" />
          )}
        </div>
      </button>

      {/* Expanded Swagger Body */}
      {isOpen && (
        <div className="border-t border-stone-200 p-4 sm:p-5 space-y-5 bg-white">
          {/* Description + Try It Out Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-1">
              {endpoint.summary && (
                <h4 className="text-sm font-semibold text-stone-900">{endpoint.summary}</h4>
              )}
              {endpoint.description && (
                <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-line">
                  {endpoint.description}
                </p>
              )}
              {endpoint.operationId && (
                <p className="text-[11px] font-mono text-stone-400">
                  operationId: {endpoint.operationId}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyCurl}
                className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-xs font-medium text-stone-700 hover:bg-stone-50 transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5"
              >
                {copiedCurl ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Terminal className="h-3.5 w-3.5" />}
                <span>{copiedCurl ? 'cURL copié' : 'Copier cURL'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsTesting((prev) => !prev)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  isTesting
                    ? 'bg-stone-900 text-white hover:bg-stone-800'
                    : 'bg-[#2A7B76] text-white hover:bg-[#226460]'
                }`}
              >
                <Play className="h-3.5 w-3.5" />
                <span>{isTesting ? 'Fermer le test' : 'Tester (Try it out)'}</span>
              </button>
            </div>
          </div>

          {/* Parameters Section */}
          <div className="space-y-2.5">
            <h5 className="text-xs font-semibold text-stone-800 border-b border-stone-100 pb-1.5">
              Paramètres ({endpoint.parameters.length})
            </h5>
            {endpoint.parameters.length === 0 ? (
              <p className="text-xs text-stone-400 italic">Aucun paramètre déclaré.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-medium">
                      <th className="py-2 pr-3">Nom</th>
                      <th className="py-2 px-3">Source</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 pl-3">
                        {isTesting ? 'Valeur de test' : 'Description'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {endpoint.parameters.map((param, idx) => {
                      const key = `${param.in}:${param.name}`;
                      return (
                        <tr key={`${key}_${idx}`} className="align-top">
                          <td className="py-2.5 pr-3 font-mono font-semibold text-stone-900 whitespace-nowrap">
                            {param.name}
                            {param.required && <span className="text-red-600 ml-0.5">*</span>}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-stone-500 whitespace-nowrap">
                            {param.in}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[#2A7B76] whitespace-nowrap">
                            {param.type}
                          </td>
                          <td className="py-2.5 pl-3 text-stone-600">
                            {isTesting ? (
                              <input
                                type="text"
                                value={paramValues[key] ?? ''}
                                onChange={(e) =>
                                  setParamValues((prev) => ({ ...prev, [key]: e.target.value }))
                                }
                                placeholder={
                                  param.example !== undefined
                                    ? String(param.example)
                                    : param.description || `Valeur pour ${param.name}`
                                }
                                className="w-full max-w-sm rounded-lg border border-stone-300 px-2.5 py-1 font-mono text-xs text-stone-900 focus:outline-none focus:border-[#2A7B76]"
                              />
                            ) : (
                              <div>
                                {param.description && <span>{param.description}</span>}
                                {param.example !== undefined && (
                                  <span className="block font-mono text-[11px] text-stone-400 mt-0.5">
                                    Exemple : {String(param.example)}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Request Body Section */}
          {(endpoint.requestBody || !['GET', 'HEAD'].includes(endpoint.method)) && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-1.5">
                <div className="flex items-center gap-2">
                  <h5 className="text-xs font-semibold text-stone-800">
                    Corps de la requête (Request Body)
                  </h5>
                  {endpoint.requestBody?.required && (
                    <span className="text-[11px] font-medium text-red-600">Requis</span>
                  )}
                  <span className="text-[11px] font-mono text-stone-400">
                    {endpoint.requestBody?.contentType || 'application/json'}
                  </span>
                </div>

                {!isTesting && endpoint.requestBody?.schema && (
                  <div className="inline-flex items-center gap-1 p-0.5 bg-stone-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setBodyTab('example')}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-md cursor-pointer ${
                        bodyTab === 'example' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600'
                      }`}
                    >
                      Exemple JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => setBodyTab('schema')}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-md cursor-pointer ${
                        bodyTab === 'schema' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600'
                      }`}
                    >
                      Schéma
                    </button>
                  </div>
                )}
              </div>

              {isTesting ? (
                <textarea
                  value={requestBodyText}
                  onChange={(e) => setRequestBodyText(e.target.value)}
                  rows={6}
                  placeholder='{"clé": "valeur"}'
                  className="w-full rounded-xl border border-stone-300 bg-stone-900 text-emerald-100 p-3 font-mono text-xs focus:outline-none focus:border-[#2A7B76]"
                />
              ) : bodyTab === 'schema' && endpoint.requestBody?.schema ? (
                <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-3">
                  <ApiSchemaViewer schema={endpoint.requestBody.schema} />
                </div>
              ) : (
                <pre className="rounded-xl bg-stone-900 text-stone-100 p-3.5 font-mono text-xs overflow-x-auto max-h-72">
                  {requestBodyText || 'Aucun payload exemple défini'}
                </pre>
              )}
            </div>
          )}

          {/* Execute Action & Live Response */}
          {isTesting && (
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[11px] font-medium text-stone-500 block">
                    URL cible résolue
                  </span>
                  <span className="font-mono text-xs text-stone-900 break-all">
                    {endpoint.method} {resolvedUrl || '(baseUrl non définie)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleExecuteRequest}
                  disabled={isExecuting}
                  className="px-4 py-2 rounded-xl bg-[#2A7B76] text-white text-xs font-semibold hover:bg-[#226460] disabled:opacity-50 transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2"
                >
                  {isExecuting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="h-3.5 w-3.5" />
                  )}
                  <span>{isExecuting ? 'Exécution...' : 'Exécuter la requête'}</span>
                </button>
              </div>

              {execResult && (
                <div className="pt-3 border-t border-stone-200 space-y-2.5">
                  {execResult.error ? (
                    <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{execResult.error}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
                          <span
                            className={`font-bold ${
                              execResult.status >= 200 && execResult.status < 300
                                ? 'text-emerald-700'
                                : execResult.status >= 400
                                ? 'text-red-600'
                                : 'text-amber-700'
                            }`}
                          >
                            HTTP {execResult.status} {execResult.statusText}
                          </span>
                          <span aria-hidden="true" className="text-stone-300">·</span>
                          <span className="text-stone-600">{execResult.durationMs} ms</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const txt =
                              typeof execResult.body === 'string'
                                ? execResult.body
                                : JSON.stringify(execResult.body, null, 2);
                            navigator.clipboard.writeText(txt);
                            setCopiedResp(true);
                            setTimeout(() => setCopiedResp(false), 1800);
                          }}
                          className="text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedResp ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                          <span>{copiedResp ? 'Copié' : 'Copier JSON'}</span>
                        </button>
                      </div>

                      <pre className="rounded-xl bg-stone-900 text-emerald-100 p-3.5 font-mono text-xs overflow-x-auto max-h-80">
                        {typeof execResult.body === 'string'
                          ? execResult.body
                          : JSON.stringify(execResult.body, null, 2)}
                      </pre>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Documented Responses Section */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-1.5">
              <h5 className="text-xs font-semibold text-stone-800">
                Réponses documentées
              </h5>
              {endpoint.responses.length > 1 && (
                <div className="inline-flex items-center gap-1 p-0.5 bg-stone-100 rounded-lg">
                  {endpoint.responses.map((resp, idx) => (
                    <button
                      key={`${resp.statusCode}_${idx}`}
                      type="button"
                      onClick={() => setSelectedResponseIdx(idx)}
                      className={`px-2.5 py-1 text-[11px] font-mono font-semibold rounded-md cursor-pointer ${
                        selectedResponseIdx === idx
                          ? 'bg-white text-stone-900 shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {resp.statusCode}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {activeResponse && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`font-mono font-bold tabular-nums ${
                      activeResponse.statusCode.startsWith('2')
                        ? 'text-emerald-700'
                        : activeResponse.statusCode.startsWith('4') || activeResponse.statusCode.startsWith('5')
                        ? 'text-red-600'
                        : 'text-stone-700'
                    }`}
                  >
                    Code {activeResponse.statusCode}
                  </span>
                  {activeResponse.description && (
                    <>
                      <span aria-hidden="true" className="text-stone-300">·</span>
                      <span className="text-stone-600">{activeResponse.description}</span>
                    </>
                  )}
                </div>

                {activeResponse.example !== undefined && (
                  <pre className="rounded-xl bg-stone-900 text-stone-100 p-3.5 font-mono text-xs overflow-x-auto max-h-72">
                    {typeof activeResponse.example === 'string'
                      ? activeResponse.example
                      : JSON.stringify(activeResponse.example, null, 2)}
                  </pre>
                )}

                {activeResponse.example === undefined && activeResponse.schema && (
                  <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-3">
                    <ApiSchemaViewer schema={activeResponse.schema} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
