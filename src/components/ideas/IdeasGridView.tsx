import React from 'react';
import { Lightbulb, CheckCircle, EyeOff, ThumbsUp } from 'lucide-react';
import { IdeaSuggestion, IdeaCategory, IdeaStatus } from '../../types';

export function getCategoryLabel(cat: IdeaCategory) {
  switch (cat) {
    case 'innovation_logistique': return 'Innovation Logistique';
    case 'vie_au_bureau': return 'Vie au Bureau & Confort';
    case 'processus_outils': return 'Processus & Outils';
    case 'bien_etre_securite': return 'Bien-être & Sécurité';
    case 'environnement_rse': return 'RSE & Environnement';
    default: return cat;
  }
}

export function getStatusBadge(status: IdeaStatus) {
  switch (status) {
    case 'soumise':
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Soumise</span>;
    case 'a_letude':
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">À l'étude</span>;
    case 'retenue_test':
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">Retenue pour test</span>;
    case 'deployee':
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">Déployée & Réalisée</span>;
    case 'archivee':
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200">Classée</span>;
  }
}

interface IdeasGridViewProps {
  ideas: IdeaSuggestion[];
  currentUserId: string;
  isAdminOrManager: boolean;
  onToggleLike: (idea: IdeaSuggestion) => void;
  onSelectIdea: (idea: IdeaSuggestion) => void;
}

export const IdeasGridView: React.FC<IdeasGridViewProps> = ({
  ideas,
  currentUserId,
  isAdminOrManager,
  onToggleLike,
  onSelectIdea,
}) => {
  if (ideas.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-8">
        <Lightbulb className="w-12 h-12 text-stone-300 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-stone-700">Aucune idée trouvée</h3>
        <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
          Soyez le premier à proposer une initiative pour améliorer le quotidien de Citrine !
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {ideas.map((idea) => {
        const isLiked = (idea.likedUserIds || []).includes(currentUserId);
        return (
          <div
            key={idea.id}
            className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#2A7B76]/50 transition"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  {getCategoryLabel(idea.category)}
                </span>
                {getStatusBadge(idea.status)}
              </div>

              <h4 className="text-sm font-bold text-stone-900 line-clamp-2">{idea.title}</h4>
              <p className="text-xs text-stone-600 line-clamp-3">{idea.description}</p>

              {idea.managementResponse && (
                <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-100 text-[11px] text-emerald-900">
                  <p className="font-semibold text-emerald-800 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    Réponse Direction Citrine :
                  </p>
                  <p className="mt-0.5 italic">{idea.managementResponse}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-stone-400 text-[11px]">
                {idea.isAnonymous ? (
                  <span className="flex items-center gap-1 text-stone-500 italic">
                    <EyeOff className="w-3 h-3" /> Anonyme
                  </span>
                ) : (
                  <span className="font-medium text-stone-700">
                    {idea.authorName} {idea.authorDepartment ? `(${idea.authorDepartment})` : ''}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleLike(idea)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    isLiked
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-emerald-700 text-emerald-700' : ''}`} />
                  <span>{idea.likesCount || 0}</span>
                </button>

                {isAdminOrManager && (
                  <button
                    onClick={() => onSelectIdea(idea)}
                    className="text-[#2A7B76] hover:underline font-semibold text-[11px] cursor-pointer"
                  >
                    Arbitrer
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
