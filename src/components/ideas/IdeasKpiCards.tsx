import React from 'react';

interface IdeasKpiCardsProps {
  totalIdeasCount: number;
  deployedIdeasCount: number;
  activeSurveysCount: number;
  totalVotesAcrossSurveys: number;
}

export const IdeasKpiCards: React.FC<IdeasKpiCardsProps> = ({
  totalIdeasCount,
  deployedIdeasCount,
  activeSurveysCount,
  totalVotesAcrossSurveys,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-4.5 rounded-xl border border-stone-200 shadow-xs">
        <p className="text-xs font-medium text-stone-500">Idées Proposées</p>
        <p className="text-2xl font-bold text-stone-800 mt-1">{totalIdeasCount}</p>
        <p className="text-[11px] text-stone-400 mt-0.5">Par les équipes terrain et bureau</p>
      </div>

      <div className="bg-white p-4.5 rounded-xl border border-stone-200 shadow-xs">
        <p className="text-xs font-medium text-stone-500">Projets Déployés / En Test</p>
        <p className="text-2xl font-bold text-emerald-600 mt-1">{deployedIdeasCount}</p>
        <p className="text-[11px] text-emerald-700 mt-0.5">Améliorations concrétisées</p>
      </div>

      <div className="bg-white p-4.5 rounded-xl border border-stone-200 shadow-xs">
        <p className="text-xs font-medium text-stone-500">Sondages Actifs</p>
        <p className="text-2xl font-bold text-[#2A7B76] mt-1">{activeSurveysCount}</p>
        <p className="text-[11px] text-teal-700 mt-0.5">Consultations en cours</p>
      </div>

      <div className="bg-white p-4.5 rounded-xl border border-stone-200 shadow-xs">
        <p className="text-xs font-medium text-stone-500">Participation Globale</p>
        <p className="text-2xl font-bold text-stone-900 mt-1">{totalVotesAcrossSurveys}</p>
        <p className="text-[11px] text-stone-400 mt-0.5">Votes exprimés par les équipes</p>
      </div>
    </div>
  );
};
