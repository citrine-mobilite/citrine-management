import React from 'react';
import { Briefcase, Users, Calendar, CheckCircle2 } from 'lucide-react';

interface RecruitmentKpiCardsProps {
  openOffersCount: number;
  totalAppsCount: number;
  interviewsCount: number;
  hiredCount: number;
}

export const RecruitmentKpiCards: React.FC<RecruitmentKpiCardsProps> = ({
  openOffersCount,
  totalAppsCount,
  interviewsCount,
  hiredCount,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-4.5 rounded-xl border border-stone-200 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-stone-500">Postes Ouverts</p>
          <p className="text-2xl font-bold text-stone-800 mt-1">{openOffersCount}</p>
          <p className="text-[11px] text-teal-600 font-medium mt-0.5">Japoma & Siège Akwa</p>
        </div>
        <div className="p-3 bg-teal-50 text-[#2A7B76] rounded-xl">
          <Briefcase className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white p-4.5 rounded-xl border border-stone-200 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-stone-500">Vivier Total Candidats</p>
          <p className="text-2xl font-bold text-stone-800 mt-1">{totalAppsCount}</p>
          <p className="text-[11px] text-stone-500 font-medium mt-0.5">Profils enregistrés</p>
        </div>
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
          <Users className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white p-4.5 rounded-xl border border-stone-200 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-stone-500">Entretiens en cours</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{interviewsCount}</p>
          <p className="text-[11px] text-amber-700 font-medium mt-0.5">Évaluations RH & Tech</p>
        </div>
        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
          <Calendar className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white p-4.5 rounded-xl border border-stone-200 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-stone-500">Recrutements Validés</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{hiredCount}</p>
          <p className="text-[11px] text-emerald-700 font-medium mt-0.5">Nouveaux collaborateurs</p>
        </div>
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
