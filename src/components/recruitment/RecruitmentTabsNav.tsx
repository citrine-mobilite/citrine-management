import React from 'react';
import { Users, Briefcase, Calendar } from 'lucide-react';

interface RecruitmentTabsNavProps {
  activeTab: 'applications' | 'offers' | 'interviews';
  onTabChange: (tab: 'applications' | 'offers' | 'interviews') => void;
  applicationsCount: number;
  offersCount: number;
  interviewsCount: number;
}

export const RecruitmentTabsNav: React.FC<RecruitmentTabsNavProps> = ({
  activeTab,
  onTabChange,
  applicationsCount,
  offersCount,
  interviewsCount,
}) => {
  return (
    <div className="flex items-center gap-2 border-b border-stone-200">
      <button
        onClick={() => onTabChange('applications')}
        className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
          activeTab === 'applications'
            ? 'border-[#2A7B76] text-[#2A7B76]'
            : 'border-transparent text-stone-500 hover:text-stone-700'
        }`}
      >
        <Users className="w-4 h-4" /> Vivier des Candidatures ({applicationsCount})
      </button>
      <button
        onClick={() => onTabChange('offers')}
        className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
          activeTab === 'offers'
            ? 'border-[#2A7B76] text-[#2A7B76]'
            : 'border-transparent text-stone-500 hover:text-stone-700'
        }`}
      >
        <Briefcase className="w-4 h-4" /> Offres d'Emploi ({offersCount})
      </button>
      <button
        onClick={() => onTabChange('interviews')}
        className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
          activeTab === 'interviews'
            ? 'border-[#2A7B76] text-[#2A7B76]'
            : 'border-transparent text-stone-500 hover:text-stone-700'
        }`}
      >
        <Calendar className="w-4 h-4" /> Entretiens & Planning ({interviewsCount})
      </button>
    </div>
  );
};
