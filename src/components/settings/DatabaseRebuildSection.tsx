import React, { useState } from 'react';
import { Database, RefreshCw, CheckCircle2 } from 'lucide-react';
import { initializeFullFirestoreDatabase, InitDatabaseResult } from '../../services/dbInitService';

interface DatabaseRebuildSectionProps {
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export const DatabaseRebuildSection: React.FC<DatabaseRebuildSectionProps> = ({ showToast }) => {
  const [isSeedingDb, setIsSeedingDb] = useState(false);
  const [seedResult, setSeedResult] = useState<InitDatabaseResult | null>(null);

  const handleRebuild = async () => {
    setIsSeedingDb(true);
    setSeedResult(null);
    try {
      const result = await initializeFullFirestoreDatabase({ overwriteExisting: false });
      setSeedResult(result);
      if (result.success && showToast) {
        showToast('Base Firestore initialisée et vérifiée avec succès !', 'success');
      }
    } catch {
      if (showToast) showToast('Échec de la réinitialisation de la base.', 'error');
    } finally {
      setIsSeedingDb(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs space-y-4">
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 text-[#2A7B76]" />
        <h3 className="font-serif font-bold text-sm text-stone-900">Maintenance & Base de Données Firestore</h3>
      </div>

      <p className="text-xs text-stone-600">
        Reconstruisez et vérifiez la structure des collections Firestore de l'entreprise.
      </p>

      <button
        onClick={handleRebuild}
        disabled={isSeedingDb}
        className="px-4 py-2.5 bg-[#2A7B76] hover:bg-[#20635F] text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 shadow-2xs disabled:opacity-50"
      >
        <RefreshCw className={`h-4 w-4 ${isSeedingDb ? 'animate-spin' : ''}`} />
        <span>{isSeedingDb ? 'Reconstruction en cours...' : 'Vérifier & Reconstruire Firestore'}</span>
      </button>

      {seedResult && (
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{seedResult.message}</span>
        </div>
      )}
    </div>
  );
};
