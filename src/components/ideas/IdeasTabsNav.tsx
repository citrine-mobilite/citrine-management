import React from 'react';
import { Lightbulb, Vote } from 'lucide-react';

interface IdeasTabsNavProps {
  activeSubTab: 'ideas' | 'surveys';
  onTabChange: (tab: 'ideas' | 'surveys') => void;
  ideasCount: number;
  surveysCount: number;
}

export const IdeasTabsNav: React.FC<IdeasTabsNavProps> = ({
  activeSubTab,
  onTabChange,
  ideasCount,
  surveysCount,
}) => {
  return (
    <div className="flex items-center gap-2 border-b border-stone-200">
      <button
        onClick={() => onTabChange('ideas')}
        className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
          activeSubTab === 'ideas'
            ? 'border-[#2A7B76] text-[#2A7B76]'
            : 'border-transparent text-stone-500 hover:text-stone-700'
        }`}
      >
        <Lightbulb className="w-4 h-4" /> Boîte à Idées & Suggestions ({ideasCount})
      </button>
      <button
        onClick={() => onTabChange('surveys')}
        className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
          activeSubTab === 'surveys'
            ? 'border-[#2A7B76] text-[#2A7B76]'
            : 'border-transparent text-stone-500 hover:text-stone-700'
        }`}
      >
        <Vote className="w-4 h-4" /> Sondages & Consultations ({surveysCount})
      </button>
    </div>
  );
};
