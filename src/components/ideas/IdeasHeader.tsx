import React from 'react';
import { Lightbulb, Plus } from 'lucide-react';

interface IdeasHeaderProps {
  activeSubTab: 'ideas' | 'surveys';
  isAdminOrManager: boolean;
  onOpenNewIdeaModal: () => void;
  onOpenNewSurveyModal: () => void;
}

export const IdeasHeader: React.FC<IdeasHeaderProps> = ({
  activeSubTab,
  isAdminOrManager,
  onOpenNewIdeaModal,
  onOpenNewSurveyModal,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
      <div className="flex items-center gap-2.5">
        <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
          <Lightbulb className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-stone-800">Boîte à Idées Interne, Signalements & Sondages</h1>
          <p className="text-xs text-stone-500">
            Participation des collaborateurs, propositions d'innovation et consultations d'entreprise Citrine
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {activeSubTab === 'ideas' ? (
          <button
            onClick={onOpenNewIdeaModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2A7B76] hover:bg-[#236863] rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Déposer une Idée
          </button>
        ) : (
          isAdminOrManager && (
            <button
              onClick={onOpenNewSurveyModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2A7B76] hover:bg-[#236863] rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Lancer un Sondage
            </button>
          )
        )}
      </div>
    </div>
  );
};
