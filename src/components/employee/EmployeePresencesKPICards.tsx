import React from 'react';

interface EmployeePresencesKPICardsProps {
  stats: {
    totalDays: number;
    presentCount: number;
    lateCount: number;
    assiduiteRate: number;
  };
}

export const EmployeePresencesKPICards: React.FC<EmployeePresencesKPICardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-3xs space-y-1">
        <span className="text-[10px] text-stone-400 font-bold uppercase">Nombre de pointages</span>
        <div className="text-xl font-bold text-stone-900">{stats.totalDays} jours</div>
      </div>
      <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-3xs space-y-1">
        <span className="text-[10px] text-emerald-700 font-bold uppercase">Jours Présents</span>
        <div className="text-xl font-bold text-emerald-600">{stats.presentCount}</div>
      </div>
      <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-3xs space-y-1">
        <span className="text-[10px] text-amber-700 font-bold uppercase">Retards consignés</span>
        <div className="text-xl font-bold text-amber-600">{stats.lateCount}</div>
      </div>
      <div className="bg-white p-4 rounded-2xl border border-teal-100 shadow-3xs space-y-1">
        <span className="text-[10px] text-[#2A7B76] font-bold uppercase">Taux d'assiduité</span>
        <div className="text-xl font-bold text-[#2A7B76]">{stats.assiduiteRate}%</div>
      </div>
    </div>
  );
};
