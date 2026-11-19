import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FolderGit2,
  Lock,
  Globe,
  ExternalLink,
  GitBranch,
  GitCommit,
  Folder,
  FileCode,
  Search,
  Bookmark,
  BookmarkCheck,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  LogOut,
  ArrowLeft,
  BookOpen,
  AlertCircle,
  Link2,
} from 'lucide-react';
import {
  AppUser,
  GithubCommitItem,
  GithubContentEntry,
  GithubRepoItem,
  GithubUserSummary,
  SavedGithubProjectLink,
} from '../../types';
import { COLLECTIONS, getCollection, saveDocument, deleteDocument } from '../../services/dataService';

interface GithubProjectsPanelProps {
  currentUser: AppUser | null;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

const GH_SESSION_STORAGE_KEY = 'citrine_gh_session_id';

function getStoredSessionHeader(): Record<string, string> {
  try {
    const sid = sessionStorage.getItem(GH_SESSION_STORAGE_KEY);
    return sid ? { 'X-GitHub-Session': sid } : {};
  } catch {
    return {};
  }
}

function saveSessionId(sid?: string | null) {
  try {
    if (sid) sessionStorage.setItem(GH_SESSION_STORAGE_KEY, sid);
    else sessionStorage.removeItem(GH_SESSION_STORAGE_KEY);
  } catch {}
}

function formatDateFr(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 o';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export const GithubProjectsPanel: React.FC<GithubProjectsPanelProps> = ({
  currentUser,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'explorer' | 'saved'>('explorer');

  // OAuth & connection state
  const [statusLoading, setStatusLoading] = useState(true);
  const [oauthConfigured, setOauthConfigured] = useState(false);
  const [connected, setConnected] = useState(false);
  const [redirectUri, setRedirectUri] = useState('');
  const [githubUser, setGithubUser] = useState<GithubUserSummary | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [copiedCallback, setCopiedCallback] = useState(false);

  // Repositories list
  const [repos, setRepos] = useState<GithubRepoItem[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [repoSearch, setRepoSearch] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'private' | 'public'>('all');
  const [selectedRepo, setSelectedRepo] = useState<GithubRepoItem | null>(null);

  // Selected repository read-only Git explorer
  const [repoView, setRepoView] = useState<'code' | 'commits'>('code');
  const [branches, setBranches] = useState<Array<{ name: string; protected: boolean }>>([]);
  const [activeBranch, setActiveBranch] = useState('');
  const [currentPath, setCurrentPath] = useState('');
  const [contents, setContents] = useState<GithubContentEntry[]>([]);
  const [contentsLoading, setContentsLoading] = useState(false);
  const [openedFile, setOpenedFile] = useState<{
    name: string;
    path: string;
    size: number;
    htmlUrl: string;
    content: string;
  } | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [readme, setReadme] = useState<{ name: string; content: string } | null>(null);
  const [commits, setCommits] = useState<GithubCommitItem[]>([]);
  const [commitsLoading, setCommitsLoading] = useState(false);
  const [copiedFile, setCopiedFile] = useState(false);

  // Saved project links in DB
  const [savedLinks, setSavedLinks] = useState<SavedGithubProjectLink[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [savedSearch, setSavedSearch] = useState('');
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  const loadSavedLinks = useCallback(async () => {
    setSavedLoading(true);
    try {
      const items = await getCollection<SavedGithubProjectLink>(COLLECTIONS.GITHUB_PROJECTS);
      const sorted = [...(items || [])].sort(
        (a, b) => new Date(b.savedAt || 0).getTime() - new Date(a.savedAt || 0).getTime()
      );
      setSavedLinks(sorted);
    } catch (err) {
      console.warn('Erreur chargement github_projects:', err);
    } finally {
      setSavedLoading(false);
    }
  }, []);

  const loadRepos = useCallback(async () => {
    setReposLoading(true);
    try {
      const res = await fetch('/api/github/repos?per_page=100', {
        credentials: 'include',
        headers: { ...getStoredSessionHeader() },
      });
      const json = await res.json();
      if (res.status === 401) {
        saveSessionId(null);
        setConnected(false);
        setGithubUser(null);
        setRepos([]);
        return;
      }
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Impossible de récupérer vos dépôts GitHub.');
      }
      const list: GithubRepoItem[] = json.data || [];
      setRepos(list);
      setSelectedRepo((prev) => {
        if (prev && list.some((r) => r.fullName === prev.fullName)) {
          return list.find((r) => r.fullName === prev.fullName) || list[0] || null;
        }
        return list[0] || null;
      });
    } catch (err: any) {
      showToast?.(err?.message || 'Erreur chargement dépôts GitHub.', 'error');
    } finally {
      setReposLoading(false);
    }
  }, [showToast]);

  const checkGithubStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await fetch('/api/github/status', {
        credentials: 'include',
        headers: { ...getStoredSessionHeader() },
      });
      const json = await res.json();
      setOauthConfigured(Boolean(json.configured));
      setRedirectUri(json.redirectUri || `${window.location.origin}/api/github/callback`);
      if (json.connected && json.user) {
        setConnected(true);
        setGithubUser(json.user);
        loadRepos();
      } else {
        setConnected(false);
        setGithubUser(null);
      }
    } catch {
      setConnected(false);
    } finally {
      setStatusLoading(false);
    }
  }, [loadRepos]);

  useEffect(() => {
    loadSavedLinks();
    checkGithubStatus();
  }, [loadSavedLinks, checkGithubStatus]);

  // Listen for OAuth popup completion
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin || '';
      if (
        origin &&
        !origin.endsWith('.run.app') &&
        !origin.includes('localhost') &&
        origin !== window.location.origin
      ) {
        return;
      }
      if (event.data?.type === 'GITHUB_OAUTH_SUCCESS') {
        if (event.data.sessionId) {
          saveSessionId(event.data.sessionId);
        }
        setAuthError(null);
        showToast?.(
          `Compte GitHub @${event.data.user?.login || ''} connecté en lecture seule.`,
          'success'
        );
        checkGithubStatus();
      } else if (event.data?.type === 'GITHUB_OAUTH_ERROR') {
        setAuthError(event.data.error || 'Connexion GitHub interrompue.');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [checkGithubStatus, showToast]);

  const handleConnectGithub = async () => {
    setAuthError(null);
    try {
      const res = await fetch('/api/github/auth-url', {
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok || !json.success || !json.url) {
        setOauthConfigured(Boolean(json.configured));
        if (json.redirectUri) setRedirectUri(json.redirectUri);
        setAuthError(json.error || 'Configuration OAuth GitHub requise.');
        return;
      }
      const popup = window.open(json.url, 'github_oauth_popup', 'width=640,height=740');
      if (!popup) {
        setAuthError('Fenêtre bloquée par le navigateur. Autorisez les popups pour connecter GitHub.');
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Impossible de lancer la connexion GitHub.');
    }
  };

  const handleDisconnectGithub = async () => {
    try {
      await fetch('/api/github/disconnect', {
        method: 'POST',
        credentials: 'include',
        headers: { ...getStoredSessionHeader() },
      });
    } finally {
      saveSessionId(null);
      setConnected(false);
      setGithubUser(null);
      setRepos([]);
      setSelectedRepo(null);
      showToast?.('Compte GitHub déconnecté.', 'success');
    }
  };

  // Load branches, root directory, and README when selected repo changes
  useEffect(() => {
    if (!connected || !selectedRepo) return;

    const owner = selectedRepo.owner;
    const repo = selectedRepo.name;
    const defaultBr = selectedRepo.defaultBranch || 'main';

    setActiveBranch(defaultBr);
    setCurrentPath('');
    setOpenedFile(null);
    setRepoView('code');

    const headers = { ...getStoredSessionHeader() };

    fetch(`/api/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches`, {
      credentials: 'include',
      headers,
    })
      .then((r) => r.json())
      .then((j) => {
        if (j.success && Array.isArray(j.data)) setBranches(j.data);
        else setBranches([{ name: defaultBr, protected: false }]);
      })
      .catch(() => setBranches([{ name: defaultBr, protected: false }]));
  }, [connected, selectedRepo?.fullName]);

  // Load directory contents & README whenever repo, branch, or path changes
  useEffect(() => {
    if (!connected || !selectedRepo || !activeBranch) return;
    const owner = selectedRepo.owner;
    const repo = selectedRepo.name;
    const headers = { ...getStoredSessionHeader() };

    setContentsLoading(true);
    setOpenedFile(null);
    fetch(
      `/api/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents?path=${encodeURIComponent(currentPath)}&ref=${encodeURIComponent(activeBranch)}`,
      { credentials: 'include', headers }
    )
      .then((r) => r.json())
      .then((j) => {
        setContents(j.success && Array.isArray(j.data) ? j.data : []);
      })
      .catch(() => setContents([]))
      .finally(() => setContentsLoading(false));

    if (currentPath === '') {
      fetch(
        `/api/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme?ref=${encodeURIComponent(activeBranch)}`,
        { credentials: 'include', headers }
      )
        .then((r) => r.json())
        .then((j) => setReadme(j.success ? j.data : null))
        .catch(() => setReadme(null));
    }
  }, [connected, selectedRepo?.fullName, activeBranch, currentPath]);

  // Load commits when commits tab is selected
  useEffect(() => {
    if (!connected || !selectedRepo || !activeBranch || repoView !== 'commits') return;
    const owner = selectedRepo.owner;
    const repo = selectedRepo.name;
    setCommitsLoading(true);
    fetch(
      `/api/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?sha=${encodeURIComponent(activeBranch)}`,
      { credentials: 'include', headers: { ...getStoredSessionHeader() } }
    )
      .then((r) => r.json())
      .then((j) => setCommits(j.success && Array.isArray(j.data) ? j.data : []))
      .catch(() => setCommits([]))
      .finally(() => setCommitsLoading(false));
  }, [connected, selectedRepo?.fullName, activeBranch, repoView]);

  const handleOpenFile = async (entry: GithubContentEntry) => {
    if (!selectedRepo) return;
    if (entry.type === 'dir') {
      setCurrentPath(entry.path);
      return;
    }
    setFileLoading(true);
    try {
      const res = await fetch(
        `/api/github/repos/${encodeURIComponent(selectedRepo.owner)}/${encodeURIComponent(selectedRepo.name)}/blob?path=${encodeURIComponent(entry.path)}&ref=${encodeURIComponent(activeBranch)}`,
        { credentials: 'include', headers: { ...getStoredSessionHeader() } }
      );
      const json = await res.json();
      if (json.success && json.data) {
        setOpenedFile(json.data);
      }
    } catch {
      showToast?.('Impossible de lire ce fichier.', 'error');
    } finally {
      setFileLoading(false);
    }
  };

  const savedByFullName = useMemo(() => {
    const map = new Map<string, SavedGithubProjectLink>();
    for (const item of savedLinks) {
      map.set(item.fullName.toLowerCase(), item);
    }
    return map;
  }, [savedLinks]);

  const handleToggleSaveProjectLink = async (repo: GithubRepoItem) => {
    const existing = savedByFullName.get(repo.fullName.toLowerCase());
    if (existing) {
      await deleteDocument(COLLECTIONS.GITHUB_PROJECTS, existing.id);
      setSavedLinks((prev) => prev.filter((item) => item.id !== existing.id));
      showToast?.(`Lien retiré : ${repo.fullName}`, 'success');
      return;
    }

    const record: SavedGithubProjectLink = {
      id: `gh_${repo.id}`,
      repoId: repo.id,
      fullName: repo.fullName,
      name: repo.name,
      owner: repo.owner,
      description: repo.description || null,
      htmlUrl: repo.htmlUrl,
      defaultBranch: repo.defaultBranch || 'main',
      isPrivate: repo.isPrivate,
      language: repo.language || null,
      updatedAtGithub: repo.updatedAt,
      savedAt: new Date().toISOString(),
      savedBy: currentUser?.name || currentUser?.email || githubUser?.login,
    };

    await saveDocument(COLLECTIONS.GITHUB_PROJECTS, record);
    setSavedLinks((prev) => [record, ...prev]);
    showToast?.(`Lien du projet "${repo.fullName}" enregistré en base.`, 'success');
  };

  const handleDeleteSavedLink = async (link: SavedGithubProjectLink) => {
    await deleteDocument(COLLECTIONS.GITHUB_PROJECTS, link.id);
    setSavedLinks((prev) => prev.filter((item) => item.id !== link.id));
    showToast?.(`Lien "${link.fullName}" supprimé.`, 'success');
  };

  const filteredRepos = useMemo(() => {
    const q = repoSearch.trim().toLowerCase();
    return repos.filter((r) => {
      if (visibilityFilter === 'private' && !r.isPrivate) return false;
      if (visibilityFilter === 'public' && r.isPrivate) return false;
      if (!q) return true;
      return (
        r.fullName.toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q) ||
        (r.language || '').toLowerCase().includes(q)
      );
    });
  }, [repos, repoSearch, visibilityFilter]);

  const filteredSavedLinks = useMemo(() => {
    const q = savedSearch.trim().toLowerCase();
    if (!q) return savedLinks;
    return savedLinks.filter(
      (l) =>
        l.fullName.toLowerCase().includes(q) ||
        (l.description || '').toLowerCase().includes(q) ||
        (l.language || '').toLowerCase().includes(q)
    );
  }, [savedLinks, savedSearch]);

  const pathSegments = currentPath ? currentPath.split('/') : [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-[#2A7B76] border border-emerald-100 shrink-0">
            <FolderGit2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-baseline gap-2.5">
              <h2 className="text-lg font-bold text-stone-900">Projets GitHub</h2>
              <span className="text-xs font-medium text-[#2A7B76]">Lecture seule</span>
            </div>
            {connected && githubUser && (
              <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-500">
                {githubUser.avatarUrl && (
                  <img
                    src={githubUser.avatarUrl}
                    alt={githubUser.login}
                    className="w-4 h-4 rounded-full"
                  />
                )}
                <span className="font-mono font-medium text-stone-700">@{githubUser.login}</span>
                {githubUser.name && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{githubUser.name}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="inline-flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('explorer')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'explorer'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <FolderGit2 className="h-3.5 w-3.5" />
              <span>Dépôts Git ({repos.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('saved')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'saved'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Link2 className="h-3.5 w-3.5" />
              <span>Liens enregistrés ({savedLinks.length})</span>
            </button>
          </div>

          {connected ? (
            <>
              <button
                type="button"
                onClick={loadRepos}
                className="px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-medium text-stone-700 hover:bg-stone-50 transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${reposLoading ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </button>
              <button
                type="button"
                onClick={handleDisconnectGithub}
                className="px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-medium text-red-600 hover:bg-red-50 transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Déconnecter</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleConnectGithub}
              className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2"
            >
              <FolderGit2 className="h-4 w-4" />
              <span>Connecter GitHub</span>
            </button>
          )}
        </div>
      </div>

      {authError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 flex items-start gap-2.5 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{authError}</span>
        </div>
      )}

      {/* TAB 1: Git Read-Only Repository Explorer */}
      {activeTab === 'explorer' && (
        <>
          {statusLoading ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-8 space-y-4">
              <div className="h-5 w-48 bg-stone-100 rounded animate-pulse" />
              <div className="h-12 w-full bg-stone-100 rounded-xl animate-pulse" />
              <div className="h-12 w-full bg-stone-100 rounded-xl animate-pulse" />
            </div>
          ) : !connected ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-800 flex items-center justify-center mx-auto">
                <FolderGit2 className="h-6 w-6" />
              </div>

              {oauthConfigured ? (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-stone-900">
                    Aucun compte GitHub connecté
                  </h3>
                  <button
                    type="button"
                    onClick={handleConnectGithub}
                    className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition cursor-pointer inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <FolderGit2 className="h-4 w-4" />
                    <span>Connecter mon compte GitHub (Lecture seule)</span>
                  </button>
                </div>
              ) : (
                <div className="max-w-xl mx-auto text-left bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-3 text-xs text-stone-700">
                  <h3 className="text-sm font-semibold text-stone-900">
                    Configuration OAuth GitHub requise
                  </h3>
                  <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                    <li>
                      Créez une <strong>OAuth App</strong> dans{' '}
                      <a
                        href="https://github.com/settings/developers"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#2A7B76] font-medium underline"
                      >
                        GitHub Developer Settings
                      </a>
                      .
                    </li>
                    <li>
                      Renseignez cette <strong>Authorization callback URL</strong> :
                      <div className="mt-1.5 flex items-center gap-2">
                        <code className="flex-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 font-mono text-[11px] text-stone-900 break-all">
                          {redirectUri}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(redirectUri);
                            setCopiedCallback(true);
                            setTimeout(() => setCopiedCallback(false), 1800);
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 cursor-pointer shrink-0 flex items-center gap-1"
                        >
                          {copiedCallback ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          <span>{copiedCallback ? 'Copié' : 'Copier'}</span>
                        </button>
                      </div>
                    </li>
                    <li>
                      Ajoutez <code className="font-mono font-semibold">GITHUB_CLIENT_ID</code> et{' '}
                      <code className="font-mono font-semibold">GITHUB_CLIENT_SECRET</code> dans les
                      secrets de l'environnement, puis cliquez sur <strong>Connecter GitHub</strong>.
                    </li>
                  </ol>
                </div>
              )}
            </div>
          ) : (
            /* Main Git-Like Read-Only Browser */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Repository List */}
              <aside className="lg:col-span-4 bg-white border border-stone-200 rounded-2xl overflow-hidden">
                <div className="p-3.5 border-b border-stone-200 space-y-2.5">
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={repoSearch}
                      onChange={(e) => setRepoSearch(e.target.value)}
                      placeholder="Rechercher un dépôt..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-xs text-stone-900 focus:outline-none focus:border-[#2A7B76]"
                    />
                  </div>
                  <div className="inline-flex items-center gap-1 p-1 bg-stone-100 rounded-lg w-full">
                    {(['all', 'private', 'public'] as const).map((vis) => (
                      <button
                        key={vis}
                        type="button"
                        onClick={() => setVisibilityFilter(vis)}
                        className={`flex-1 py-1 rounded-md text-[11px] font-medium cursor-pointer transition ${
                          visibilityFilter === vis
                            ? 'bg-white text-stone-900 shadow-2xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        {vis === 'all' ? 'Tous' : vis === 'private' ? 'Privés' : 'Publics'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="divide-y divide-stone-100 max-h-[640px] overflow-y-auto">
                  {reposLoading && repos.length === 0 ? (
                    <div className="p-6 text-center text-xs text-stone-500">Chargement des dépôts...</div>
                  ) : filteredRepos.length === 0 ? (
                    <div className="p-6 text-center text-xs text-stone-500">Aucun dépôt trouvé.</div>
                  ) : (
                    filteredRepos.map((repo) => {
                      const isSelected = selectedRepo?.fullName === repo.fullName;
                      const isSaved = savedByFullName.has(repo.fullName.toLowerCase());
                      return (
                        <div
                          key={repo.id}
                          onClick={() => setSelectedRepo(repo)}
                          className={`p-3.5 cursor-pointer transition-colors ${
                            isSelected ? 'bg-emerald-50/60' : 'hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                {repo.isPrivate ? (
                                  <Lock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                ) : (
                                  <Globe className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                                )}
                                <p
                                  className={`text-xs font-semibold truncate font-mono ${
                                    isSelected ? 'text-[#2A7B76]' : 'text-stone-900'
                                  }`}
                                >
                                  {repo.fullName}
                                </p>
                              </div>
                              {repo.description && (
                                <p className="text-[11px] text-stone-500 line-clamp-1 mt-1">
                                  {repo.description}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-400 mt-1.5 tabular-nums">
                                <span>{repo.isPrivate ? 'Privé' : 'Public'}</span>
                                {repo.language && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span>{repo.language}</span>
                                  </>
                                )}
                                <span aria-hidden="true">·</span>
                                <span>{formatDateFr(repo.updatedAt)}</span>
                              </div>
                            </div>
                            {isSaved && (
                              <span title="Lien enregistré en base" className="shrink-0 mt-0.5">
                                <BookmarkCheck className="h-4 w-4 text-[#2A7B76]" />
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </aside>

              {/* Right Git Read-Only Code & Commits Viewer */}
              {selectedRepo && (
                <section className="lg:col-span-8 space-y-4">
                  {/* Repo Header */}
                  <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {selectedRepo.isPrivate ? (
                            <Lock className="h-4 w-4 text-amber-600 shrink-0" />
                          ) : (
                            <Globe className="h-4 w-4 text-stone-500 shrink-0" />
                          )}
                          <h3 className="text-base font-bold font-mono text-stone-900 break-all">
                            {selectedRepo.fullName}
                          </h3>
                          <span className="text-xs text-stone-500">
                            · {selectedRepo.isPrivate ? 'Privé' : 'Public'}
                          </span>
                        </div>
                        {selectedRepo.description && (
                          <p className="text-xs text-stone-600 leading-relaxed">
                            {selectedRepo.description}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleSaveProjectLink(selectedRepo)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                            savedByFullName.has(selectedRepo.fullName.toLowerCase())
                              ? 'bg-emerald-50 border border-emerald-200 text-[#2A7B76]'
                              : 'bg-[#2A7B76] text-white hover:bg-[#226460]'
                          }`}
                        >
                          {savedByFullName.has(selectedRepo.fullName.toLowerCase()) ? (
                            <>
                              <BookmarkCheck className="h-3.5 w-3.5" />
                              <span>Lien enregistré</span>
                            </>
                          ) : (
                            <>
                              <Bookmark className="h-3.5 w-3.5" />
                              <span>Garder le lien en BD</span>
                            </>
                          )}
                        </button>
                        <a
                          href={selectedRepo.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-xs font-medium text-stone-700 hover:bg-stone-50 transition whitespace-nowrap shrink-0 flex items-center gap-1.5"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Ouvrir sur GitHub</span>
                        </a>
                      </div>
                    </div>

                    {/* Branch selector + Code/Commits Tabs */}
                    <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4 text-stone-500" />
                        <select
                          value={activeBranch}
                          onChange={(e) => {
                            setActiveBranch(e.target.value);
                            setCurrentPath('');
                          }}
                          className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 font-mono text-xs text-stone-900 focus:outline-none focus:border-[#2A7B76]"
                        >
                          {branches.map((b) => (
                            <option key={b.name} value={b.name}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="inline-flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setRepoView('code')}
                          className={`px-3 py-1 text-xs font-medium rounded-lg cursor-pointer flex items-center gap-1.5 ${
                            repoView === 'code'
                              ? 'bg-white text-stone-900 shadow-2xs'
                              : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          <FileCode className="h-3.5 w-3.5" />
                          <span>Fichiers</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRepoView('commits')}
                          className={`px-3 py-1 text-xs font-medium rounded-lg cursor-pointer flex items-center gap-1.5 ${
                            repoView === 'commits'
                              ? 'bg-white text-stone-900 shadow-2xs'
                              : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          <GitCommit className="h-3.5 w-3.5" />
                          <span>Commits</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Code Tree & File Preview (Read-Only) */}
                  {repoView === 'code' && (
                    <div className="space-y-4">
                      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
                        {/* Breadcrumbs */}
                        <div className="px-4 py-2.5 border-b border-stone-200 bg-stone-50 flex flex-wrap items-center gap-1.5 text-xs font-mono">
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentPath('');
                              setOpenedFile(null);
                            }}
                            className="font-semibold text-[#2A7B76] hover:underline cursor-pointer"
                          >
                            {selectedRepo.name}
                          </button>
                          {pathSegments.map((seg, idx) => {
                            const target = pathSegments.slice(0, idx + 1).join('/');
                            return (
                              <React.Fragment key={target}>
                                <span className="text-stone-400">/</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCurrentPath(target);
                                    setOpenedFile(null);
                                  }}
                                  className="text-stone-700 hover:text-[#2A7B76] hover:underline cursor-pointer"
                                >
                                  {seg}
                                </button>
                              </React.Fragment>
                            );
                          })}
                        </div>

                        {openedFile ? (
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setOpenedFile(null)}
                                  className="px-2.5 py-1 rounded-lg border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-50 cursor-pointer flex items-center gap-1"
                                >
                                  <ArrowLeft className="h-3.5 w-3.5" />
                                  <span>Retour</span>
                                </button>
                                <span className="font-mono text-xs font-semibold text-stone-800">
                                  {openedFile.path}
                                </span>
                                <span className="text-[11px] font-mono text-stone-400 tabular-nums">
                                  {formatBytes(openedFile.size)}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(openedFile.content);
                                  setCopiedFile(true);
                                  setTimeout(() => setCopiedFile(false), 1800);
                                }}
                                className="px-2.5 py-1 rounded-lg border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-50 cursor-pointer flex items-center gap-1"
                              >
                                {copiedFile ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                                <span>{copiedFile ? 'Copié' : 'Copier'}</span>
                              </button>
                            </div>

                            <pre className="rounded-xl bg-stone-900 text-stone-100 p-4 font-mono text-xs overflow-auto max-h-[540px]">
                              {openedFile.content}
                            </pre>
                          </div>
                        ) : contentsLoading || fileLoading ? (
                          <div className="p-6 text-center text-xs text-stone-500">
                            Chargement de l'arborescence...
                          </div>
                        ) : contents.length === 0 ? (
                          <div className="p-6 text-center text-xs text-stone-500">
                            Dossier vide.
                          </div>
                        ) : (
                          <div className="divide-y divide-stone-100">
                            {currentPath && (
                              <button
                                type="button"
                                onClick={() => {
                                  const parts = currentPath.split('/');
                                  parts.pop();
                                  setCurrentPath(parts.join('/'));
                                }}
                                className="w-full px-4 py-2.5 text-left text-xs font-mono text-[#2A7B76] hover:bg-stone-50 cursor-pointer flex items-center gap-2"
                              >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                <span>..</span>
                              </button>
                            )}
                            {contents.map((entry) => (
                              <button
                                key={entry.path}
                                type="button"
                                onClick={() => handleOpenFile(entry)}
                                className="w-full px-4 py-2.5 flex items-center justify-between gap-3 text-left hover:bg-stone-50 transition cursor-pointer"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {entry.type === 'dir' ? (
                                    <Folder className="h-4 w-4 text-sky-600 shrink-0" />
                                  ) : (
                                    <FileCode className="h-4 w-4 text-stone-400 shrink-0" />
                                  )}
                                  <span className="font-mono text-xs text-stone-800 truncate">
                                    {entry.name}
                                  </span>
                                </div>
                                <span className="font-mono text-[11px] text-stone-400 tabular-nums shrink-0">
                                  {entry.type === 'dir' ? 'Dossier' : formatBytes(entry.size)}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* README Viewer */}
                      {!openedFile && currentPath === '' && readme && (
                        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
                          <div className="px-4 py-2.5 border-b border-stone-200 bg-stone-50 flex items-center gap-2 text-xs font-semibold text-stone-800 font-mono">
                            <BookOpen className="h-3.5 w-3.5 text-[#2A7B76]" />
                            <span>{readme.name}</span>
                          </div>
                          <pre className="p-5 font-mono text-xs text-stone-800 whitespace-pre-wrap overflow-x-auto max-h-[420px] leading-relaxed">
                            {readme.content}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Read-Only Commits History */}
                  {repoView === 'commits' && (
                    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
                      {commitsLoading ? (
                        <div className="p-6 text-center text-xs text-stone-500">
                          Chargement des commits...
                        </div>
                      ) : commits.length === 0 ? (
                        <div className="p-6 text-center text-xs text-stone-500">
                          Aucun commit trouvé.
                        </div>
                      ) : (
                        <div className="divide-y divide-stone-100">
                          {commits.map((c) => (
                            <div
                              key={c.sha}
                              className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-stone-50"
                            >
                              <div className="min-w-0 space-y-0.5">
                                <p className="text-xs font-semibold text-stone-900 truncate">
                                  {c.message}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-500 tabular-nums">
                                  <span>{c.authorName}</span>
                                  <span aria-hidden="true">·</span>
                                  <span>{formatDateFr(c.date)}</span>
                                </div>
                              </div>
                              <a
                                href={c.htmlUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded-lg border border-stone-200 bg-white font-mono text-[11px] text-stone-700 hover:bg-stone-100 shrink-0 self-start sm:self-center flex items-center gap-1"
                              >
                                <span>{c.shortSha}</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )}
            </div>
          )}
        </>
      )}

      {/* TAB 2: Saved Project Links Only (Persisted in DB, works even for private repos) */}
      {activeTab === 'saved' && (
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-stone-900">
              Liens des projets enregistrés ({savedLinks.length})
            </h3>
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={savedSearch}
                onChange={(e) => setSavedSearch(e.target.value)}
                placeholder="Filtrer les liens..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-xs text-stone-900 w-56 focus:outline-none focus:border-[#2A7B76]"
              />
            </div>
          </div>

          {savedLoading ? (
            <div className="p-8 text-center text-xs text-stone-500">Chargement...</div>
          ) : filteredSavedLinks.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Link2 className="h-7 w-7 text-stone-300 mx-auto" />
              <p className="text-sm font-semibold text-stone-800">Aucun lien enregistré</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {filteredSavedLinks.map((link) => {
                const matchingLiveRepo = repos.find(
                  (r) => r.fullName.toLowerCase() === link.fullName.toLowerCase()
                );
                return (
                  <div
                    key={link.id}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-stone-50/70 transition"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {link.isPrivate ? (
                          <Lock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        ) : (
                          <Globe className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                        )}
                        <a
                          href={link.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-sm font-semibold text-[#2A7B76] hover:underline break-all"
                        >
                          {link.fullName}
                        </a>
                        <span className="text-xs text-stone-500">
                          · {link.isPrivate ? 'Privé' : 'Public'}
                        </span>
                      </div>

                      {link.description && (
                        <p className="text-xs text-stone-600 max-w-2xl">{link.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-500 font-mono tabular-nums">
                        <span>{link.htmlUrl}</span>
                        {link.language && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{link.language}</span>
                          </>
                        )}
                        <span aria-hidden="true">·</span>
                        <span>branche {link.defaultBranch}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {matchingLiveRepo && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRepo(matchingLiveRepo);
                            setActiveTab('explorer');
                          }}
                          className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-xs font-medium text-stone-700 hover:bg-stone-100 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Explorer
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(link.htmlUrl);
                          setCopiedLinkId(link.id);
                          setTimeout(() => setCopiedLinkId(null), 1800);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-xs font-medium text-stone-700 hover:bg-stone-100 cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1"
                      >
                        {copiedLinkId === link.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        <span>{copiedLinkId === link.id ? 'Copié' : 'Copier lien'}</span>
                      </button>
                      <a
                        href={link.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 whitespace-nowrap shrink-0 flex items-center gap-1.5"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Ouvrir</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDeleteSavedLink(link)}
                        className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer shrink-0"
                        title="Supprimer ce lien"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GithubProjectsPanel;
