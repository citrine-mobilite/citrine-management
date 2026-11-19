import React, { useState, useEffect } from 'react';
import { Database, AlertTriangle, CheckCircle2, Copy, Check, ExternalLink, RefreshCw, X } from 'lucide-react';
import { checkDatabaseHealth, DatabaseHealthStatus } from '../../services/dataService';

export const UNLOCK_SQL_SCRIPT = `-- ==============================================================================
-- DÉBLOCAGE IMMÉDIAT DES PERMISSIONS SUPABASE (À EXÉCUTER DANS LE SQL EDITOR)
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;`;

export const SUPABASE_SQL_URL = 'https://supabase.com/dashboard/project/svvgziqcdahkgyugqlvk/sql/new';

export function DatabaseHealthBanner() {
  const [status, setStatus] = useState<DatabaseHealthStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const performCheck = async () => {
    setChecking(true);
    try {
      const res = await checkDatabaseHealth();
      setStatus(res);
    } catch {
      // Ignored
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    performCheck();
    // Re-check periodically every 60 seconds
    const interval = setInterval(performCheck, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyScript = () => {
    navigator.clipboard.writeText(UNLOCK_SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (!status || dismissed) return null;

  // Si Supabase a une erreur de permission
  if (status.hasPermissionError) {
    return (
      <>
        <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-950 px-3 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="font-semibold text-amber-900">
              Supabase : Permissions d&apos;écriture verrouillées (Erreur 42501).
            </span>
            <span className="hidden sm:inline text-amber-800">
              Vos données sont temporairement enregistrées sur le serveur local en attendant l&apos;activation SQL.
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowModal(true)}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-[11px] transition flex items-center gap-1 cursor-pointer"
            >
              <Database className="h-3 w-3" />
              <span>Résoudre (1 clic)</span>
            </button>

            <button
              onClick={performCheck}
              disabled={checking}
              className="p-1 hover:bg-amber-500/20 rounded text-amber-800 transition cursor-pointer"
              title="Vérifier la connexion"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${checking ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setDismissed(true)}
              className="p-1 hover:bg-amber-500/20 rounded text-amber-800 transition cursor-pointer"
              title="Masquer le bandeau"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Modal d'explication et de déblocage immédiat */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
            <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-xl w-full p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-stone-900">
                      Pourquoi vos actions n&apos;arrivent pas en base ?
                    </h3>
                    <p className="text-xs text-stone-500">
                      Diagnostic PostgreSQL : Erreur 42501 (Permission Denied)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="text-xs text-stone-600 space-y-2 bg-amber-50 p-3.5 rounded-2xl border border-amber-200 leading-relaxed">
                <p>
                  <strong>Cause identifiée :</strong> Votre instance Supabase est joignable, mais les tables dans le schéma <code className="bg-amber-100 px-1 py-0.5 rounded">public</code> n&apos;accordent pas encore les droits d&apos;insertion/mise à jour au rôle <code className="bg-amber-100 px-1 py-0.5 rounded">service_role</code> ou <code className="bg-amber-100 px-1 py-0.5 rounded">anon</code>.
                </p>
                <p>
                  PostgreSQL refuse donc les requêtes avec le message : <em className="text-amber-900">&quot;Grant the required privileges to the current role with: GRANT ALL ON ALL TABLES IN SCHEMA public...&quot;</em>.
                </p>
                <p className="text-emerald-800 font-medium">
                  ✅ Le serveur d&apos;application sauvegarde désormais vos données en persistance disque de secours, mais pour synchroniser votre cloud Supabase, il suffit d&apos;exécuter le script ci-dessous.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-stone-700 uppercase tracking-wider">
                    Script SQL de déblocage (déjà préparé) :
                  </span>
                  <button
                    onClick={handleCopyScript}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#2A7B76] hover:underline"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? 'Copié !' : 'Copier le script SQL'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-stone-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-40 border border-stone-800">
                  {UNLOCK_SQL_SCRIPT}
                </pre>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <a
                  href={SUPABASE_SQL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-[#2A7B76] hover:bg-[#236460] text-white font-bold text-xs rounded-xl transition inline-flex items-center gap-2 shadow-md shadow-[#2A7B76]/20"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Ouvrir l&apos;Éditeur SQL Supabase</span>
                </a>

                <button
                  onClick={async () => {
                    await performCheck();
                    if (!status?.hasPermissionError) {
                      setShowModal(false);
                    }
                  }}
                  className="px-3 py-2 text-stone-600 hover:text-stone-900 text-xs font-semibold transition inline-flex items-center gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${checking ? 'animate-spin' : ''}`} />
                  <span>Re-tester maintenant</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
