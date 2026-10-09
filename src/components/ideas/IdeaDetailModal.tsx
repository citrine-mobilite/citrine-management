import React from 'react';
import { X } from 'lucide-react';
import { IdeaSuggestion, IdeaStatus } from '../../types';
import { getCategoryLabel } from './IdeasGridView';

interface IdeaDetailModalProps {
  idea: IdeaSuggestion;
  onClose: () => void;
  onUpdateStatus: (idea: IdeaSuggestion, status: IdeaStatus, response?: string) => Promise<void>;
}

const STATUSES: IdeaStatus[] = ['soumise', 'a_letude', 'retenue_test', 'deployee', 'archivee'];

export const IdeaDetailModal: React.FC<IdeaDetailModalProps> = ({
  idea,
  onClose,
  onUpdateStatus,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-stone-200 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-[#2A7B76]">
              {getCategoryLabel(idea.category)}
            </span>
            <h3 className="text-base font-bold text-stone-900 mt-0.5">{idea.title}</h3>
            <p className="text-xs text-stone-500">
              {idea.isAnonymous ? 'Anonyme' : idea.authorName} • {idea.likesCount} soutien(s)
            </p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200">
          {idea.description}
        </p>

        <div className="space-y-2">
          <label className="text-xs font-bold text-stone-800">Décision hiérarchique :</label>
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => onUpdateStatus(idea, status)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition cursor-pointer ${
                  idea.status === status
                    ? 'bg-[#2A7B76] text-white shadow-xs'
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-stone-800">Réponse officielle de la Direction :</label>
          <textarea
            rows={3}
            placeholder="Indiquez la suite donnée au projet..."
            defaultValue={idea.managementResponse || ''}
            onBlur={(e) => onUpdateStatus(idea, idea.status, e.target.value)}
            className="w-full mt-1 text-xs px-3 py-2 border border-stone-200 rounded-xl"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
