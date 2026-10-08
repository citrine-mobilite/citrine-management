import React from 'react';
import { KeyRound, Copy, Check, Trash2, Calendar, User, Clock } from 'lucide-react';
import { BadgeSecurityCode16 } from '../../../types';

interface BadgeCodeItemCardProps {
  codeItem: BadgeSecurityCode16;
  onCopy: (code: string, id: string) => void;
  onDelete: (id: string) => void;
  copiedCodeId: string | null;
}

export const BadgeCodeItemCard: React.FC<BadgeCodeItemCardProps> = ({
  codeItem,
  onCopy,
  onDelete,
  copiedCodeId,
}) => {
  return (
    <div className="p-3.5 bg-white rounded-2xl border border-stone-200 hover:border-[#2A7B76] transition shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-xs text-stone-900 bg-stone-100 px-2 py-0.5 rounded-lg border border-stone-200 tracking-wider">
            {codeItem.formattedCode}
          </span>
          <span
            className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
              codeItem.isUsed
                ? 'bg-stone-100 text-stone-500'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {codeItem.isUsed ? 'Utilisé' : 'Disponible'}
          </span>
        </div>

        {codeItem.notes && (
          <p className="text-[11px] text-stone-500 truncate">{codeItem.notes}</p>
        )}

        <div className="flex items-center gap-3 text-[10px] text-stone-400">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" /> {codeItem.generatedBy}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" /> {new Date(codeItem.createdAt).toLocaleDateString('fr-FR')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
        <button
          onClick={() => onCopy(codeItem.formattedCode, codeItem.id)}
          className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition cursor-pointer"
          title="Copier le code"
        >
          {copiedCodeId === codeItem.id ? (
            <Check className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>

        <button
          onClick={() => onDelete(codeItem.id)}
          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition cursor-pointer"
          title="Supprimer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
