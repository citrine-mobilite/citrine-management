import React from 'react';
import { X, UserCheck } from 'lucide-react';
import { JobApplication, ApplicationStage } from '../../types';

interface CandidateDetailModalProps {
  application: JobApplication;
  isAdminOrManager: boolean;
  onClose: () => void;
  onStageChange: (app: JobApplication, newStage: ApplicationStage) => void;
  onConvertCandidateToEmployee: (app: JobApplication) => void;
}

const STAGES: ApplicationStage[] = [
  'nouveau',
  'en_revue',
  'entretien_rh',
  'entretien_technique',
  'offre_proposee',
  'embauche',
  'rejete',
];

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  application,
  isAdminOrManager,
  onClose,
  onStageChange,
  onConvertCandidateToEmployee,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto border border-stone-200 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[#2A7B76] uppercase tracking-wider">Fiche Candidat</span>
            <h3 className="text-lg font-bold text-stone-900 mt-0.5">{application.candidateName}</h3>
            <p className="text-xs text-stone-500">{application.jobOfferTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stage Selector */}
        <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
          <label className="text-xs font-semibold text-stone-700">Étape du processus :</label>
          <div className="flex flex-wrap gap-1.5">
            {STAGES.map((stage) => (
              <button
                key={stage}
                onClick={() => onStageChange(application, stage)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
                  application.stage === stage
                    ? 'bg-[#2A7B76] text-white shadow-xs'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                {stage.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-stone-50 rounded-xl">
            <span className="text-stone-400 text-[11px]">Téléphone</span>
            <p className="font-semibold text-stone-800 mt-0.5">{application.candidatePhone}</p>
          </div>
          <div className="p-3 bg-stone-50 rounded-xl">
            <span className="text-stone-400 text-[11px]">Email</span>
            <p className="font-semibold text-stone-800 mt-0.5">{application.candidateEmail || 'Non communiqué'}</p>
          </div>
          <div className="p-3 bg-stone-50 rounded-xl">
            <span className="text-stone-400 text-[11px]">Ville & Localisation</span>
            <p className="font-semibold text-stone-800 mt-0.5">{application.candidateCity || 'Douala'}</p>
          </div>
          <div className="p-3 bg-stone-50 rounded-xl">
            <span className="text-stone-400 text-[11px]">Expérience</span>
            <p className="font-semibold text-stone-800 mt-0.5">{application.experienceYears} an(s)</p>
          </div>
        </div>

        {/* Notes RH */}
        {application.notes && (
          <div className="space-y-1">
            <span className="text-xs font-semibold text-stone-700">Notes d'évaluation RH :</span>
            <p className="text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200">
              {application.notes}
            </p>
          </div>
        )}

        {/* Actions Conversion */}
        {isAdminOrManager && application.stage !== 'embauche' && (
          <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
            <button
              onClick={() => onStageChange(application, 'rejete')}
              className="px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
            >
              Classer non retenu
            </button>

            <button
              onClick={() => onConvertCandidateToEmployee(application)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              Valider l'embauche & créer le collaborateur
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
