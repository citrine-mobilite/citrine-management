import React from 'react';
import { Check, X, Calendar, User, Clock, AlertTriangle } from 'lucide-react';
import { RequestItem } from './presenceRequestsUtils';

interface PresenceRequestItemCardProps {
  item: RequestItem;
  onOpenDecision: (item: RequestItem, action: 'approved' | 'rejected') => void;
}

export const PresenceRequestItemCard: React.FC<PresenceRequestItemCardProps> = ({
  item,
  onOpenDecision,
}) => {
  return (
    <div className="p-4 bg-white rounded-2xl border border-stone-200 hover:border-[#2A7B76] transition shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      <div className="space-y-1.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-stone-900">{item.employee?.name || 'Collaborateur'}</span>
          <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-mono">
            {item.date}
          </span>
          <span
            className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
              item.status === 'approved'
                ? 'bg-emerald-100 text-emerald-800'
                : item.status === 'rejected'
                ? 'bg-red-100 text-red-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {item.status === 'approved' ? 'Validé' : item.status === 'rejected' ? 'Refusé' : 'En attente'}
          </span>
        </div>

        <p className="text-[11px] text-stone-700 font-medium">
          <span className="font-bold text-stone-900">Motif :</span> « {item.reason} »
        </p>

        <div className="text-[10px] text-stone-400 flex items-center gap-2">
          <span>{item.details}</span>
          <span>•</span>
          <span>{item.type === 'emergency' ? 'Déclaration d\'urgence' : 'Justificatif horaire'}</span>
        </div>
      </div>

      {item.status === 'pending' && (
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            onClick={() => onOpenDecision(item, 'approved')}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[11px] flex items-center gap-1 transition cursor-pointer shadow-2xs"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Valider</span>
          </button>
          <button
            onClick={() => onOpenDecision(item, 'rejected')}
            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold rounded-xl text-[11px] flex items-center gap-1 transition cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            <span>Refuser</span>
          </button>
        </div>
      )}
    </div>
  );
};
