import React from 'react';
import { Calendar } from 'lucide-react';
import { JobApplication, ApplicationStage } from '../../types';

interface RecruitmentInterviewsViewProps {
  interviews: JobApplication[];
  onSelectApplication: (app: JobApplication) => void;
  getStageBadge: (stage: ApplicationStage) => React.ReactNode;
}

export const RecruitmentInterviewsView: React.FC<RecruitmentInterviewsViewProps> = ({
  interviews,
  onSelectApplication,
  getStageBadge,
}) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-stone-200">
      <h3 className="text-sm font-bold text-stone-800 mb-3 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-[#2A7B76]" />
        Entretiens RH & Techniques Planifiés
      </h3>

      {interviews.length === 0 ? (
        <p className="text-xs text-stone-500 py-6 text-center">
          Aucun entretien planifié pour le moment.
        </p>
      ) : (
        <div className="divide-y divide-stone-100">
          {interviews.map((app) => (
            <div
              key={app.id}
              className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-stone-900">{app.candidateName}</h4>
                  {getStageBadge(app.stage)}
                </div>
                <p className="text-xs text-stone-500">
                  {app.jobOfferTitle} • Tél : {app.candidatePhone}
                </p>
                {app.interviewFeedback && (
                  <p className="text-[11px] text-stone-600 italic bg-stone-50 p-2 rounded-lg border border-stone-100">
                    « {app.interviewFeedback} »
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-bold text-purple-700">
                    {app.interviewDate
                      ? new Date(app.interviewDate).toLocaleString('fr-FR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })
                      : 'Date à fixer'}
                  </p>
                  <p className="text-[10px] text-stone-400">Siège Akwa ou Japoma</p>
                </div>

                <button
                  onClick={() => onSelectApplication(app)}
                  className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition cursor-pointer"
                >
                  Consulter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
