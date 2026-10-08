import React from 'react';
import { UserCheck, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

interface StatisticsKPIRibbonProps {
  overallPresent: number;
  overallLate: number;
  avgAssiduite: number;
  avgPonctualite: number;
}

export const StatisticsKPIRibbon: React.FC<StatisticsKPIRibbonProps> = ({
  overallPresent,
  overallLate,
  avgAssiduite,
  avgPonctualite,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-3xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-stone-400 font-bold uppercase">Taux Assiduité</span>
          <TrendingUp className="h-4 w-4 text-[#2A7B76]" />
        </div>
        <div className="text-2xl font-bold text-[#2A7B76]">{avgAssiduite}%</div>
        <span className="text-[11px] text-stone-500 font-medium">Moyenne générale</span>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-3xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-emerald-700 font-bold uppercase">Ponctualité</span>
          <UserCheck className="h-4 w-4 text-emerald-600" />
        </div>
        <div className="text-2xl font-bold text-emerald-700">{avgPonctualite}%</div>
        <span className="text-[11px] text-emerald-600 font-medium">Arrivées sans retard</span>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-teal-100 shadow-3xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#2A7B76] font-bold uppercase">Présences Cumulées</span>
          <UserCheck className="h-4 w-4 text-[#2A7B76]" />
        </div>
        <div className="text-2xl font-bold text-stone-900">{overallPresent}</div>
        <span className="text-[11px] text-stone-500 font-medium">Jours validés</span>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-3xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-amber-700 font-bold uppercase">Retards Enregistrés</span>
          <Clock className="h-4 w-4 text-amber-600" />
        </div>
        <div className="text-2xl font-bold text-amber-600">{overallLate}</div>
        <span className="text-[11px] text-amber-700 font-medium">Occurrences</span>
      </div>
    </div>
  );
};
