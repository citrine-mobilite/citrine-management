import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { PotentialDuplicateMatch } from '../../services/taskRedundancyService';

interface RedundancyWarningBannerProps {
  matches: PotentialDuplicateMatch[];
}

export const RedundancyWarningBanner: React.FC<RedundancyWarningBannerProps> = ({ matches }) => {
  if (!matches || matches.length === 0) return null;

  return (
    <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 animate-in fade-in duration-150">
      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
        <span>
          {matches.length === 1
            ? 'Élément similaire déjà actif détecté'
            : `${matches.length} éléments similaires déjà actifs détectés`}
        </span>
      </div>
      <div className="space-y-1.5">
        {matches.map((m) => (
          <div
            key={m.uid}
            className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-amber-200/80 text-[11px]"
          >
            <div className="min-w-0">
              <span className="font-semibold text-stone-900 truncate block">{m.title}</span>
              {m.parentTaskTitle && (
                <span className="text-[10px] text-stone-500 truncate block">
                  Sous-tâche de : {m.parentTaskTitle}
                </span>
              )}
            </div>
            <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 font-mono font-bold text-[10px] shrink-0 tabular-nums">
              {m.similarity}% similaire
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RedundancyWarningBanner;
