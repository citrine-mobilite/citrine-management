import React from 'react';
import { CheckCircle } from 'lucide-react';
import { EnterpriseSurvey } from '../../types';

interface SurveysGridViewProps {
  surveys: EnterpriseSurvey[];
  currentUserId: string;
  onVoteOption: (survey: EnterpriseSurvey, optionId: string) => void;
}

export const SurveysGridView: React.FC<SurveysGridViewProps> = ({
  surveys,
  currentUserId,
  onVoteOption,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {surveys.map((survey) => {
        const totalVotes = survey.options.reduce((acc, o) => acc + o.votesCount, 0);
        const hasVoted = (survey.votedUserIds || []).includes(currentUserId);

        return (
          <div key={survey.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-[#2A7B76] border border-teal-200">
                  {survey.category || 'Consultation'}
                </span>
                <h3 className="text-base font-bold text-stone-900 mt-1.5">{survey.title}</h3>
                <p className="text-xs text-stone-500 mt-0.5">{survey.description}</p>
              </div>

              <span
                className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                  survey.status === 'actif'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-stone-100 text-stone-500'
                }`}
              >
                {survey.status === 'actif' ? 'En cours' : 'Clôturé'}
              </span>
            </div>

            {/* Options */}
            <div className="space-y-2.5 pt-2">
              {survey.options.map((opt) => {
                const percentage = totalVotes > 0 ? Math.round((opt.votesCount / totalVotes) * 100) : 0;
                return (
                  <div
                    key={opt.id}
                    onClick={() =>
                      survey.status === 'actif' && !hasVoted && onVoteOption(survey, opt.id)
                    }
                    className={`p-3 rounded-xl border transition ${
                      survey.status === 'actif' && !hasVoted
                        ? 'cursor-pointer hover:border-[#2A7B76] hover:bg-stone-50'
                        : ''
                    } ${hasVoted ? 'bg-stone-50/70 border-stone-200' : 'bg-white border-stone-200'}`}
                  >
                    <div className="flex items-center justify-between text-xs font-medium text-stone-800 mb-1.5">
                      <span>{opt.text}</span>
                      <span className="font-mono font-bold text-stone-700">
                        {percentage}% ({opt.votesCount} vote{opt.votesCount > 1 ? 's' : ''})
                      </span>
                    </div>

                    <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#2A7B76] h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
              <span>
                Total participants : <strong>{totalVotes}</strong>
              </span>
              {hasVoted ? (
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Votre vote a été comptabilisé
                </span>
              ) : (
                <span className="text-amber-600 font-medium">Cliquez sur une option pour voter</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
