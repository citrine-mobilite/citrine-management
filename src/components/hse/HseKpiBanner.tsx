import React from 'react';

interface HseKpiBannerProps {
  daysWithoutLostTimeAccident: number;
  totalIncidentsCount: number;
  nearMissesCount: number;
  resolutionRate: number;
  completedActionsCount: number;
  totalActionsCount: number;
  closedIncidentsCount: number;
}

export const HseKpiBanner: React.FC<HseKpiBannerProps> = ({
  daysWithoutLostTimeAccident,
  totalIncidentsCount,
  nearMissesCount,
  resolutionRate,
  completedActionsCount,
  totalActionsCount,
  closedIncidentsCount,
}) => {
  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-xl border border-stone-200 shadow-xs">
          <p className="text-xs font-medium text-stone-500">Total Événements</p>
          <p className="text-2xl font-bold text-stone-800 mt-1">{totalIncidentsCount}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Registre officiel tenu à jour</p>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-stone-200 shadow-xs">
          <p className="text-xs font-medium text-stone-500">Presque-accidents Détectés</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{nearMissesCount}</p>
          <p className="text-[11px] text-amber-700 mt-0.5">Risques neutralisés à temps</p>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-stone-200 shadow-xs">
          <p className="text-xs font-medium text-stone-500">Taux Résolution Actions (CAPA)</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{resolutionRate}%</p>
          <p className="text-[11px] text-emerald-700 mt-0.5">
            {completedActionsCount} / {totalActionsCount} actions soldées
          </p>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-stone-200 shadow-xs">
          <p className="text-xs font-medium text-stone-500">Dossiers Clôturés</p>
          <p className="text-2xl font-bold text-[#2A7B76] mt-1">{closedIncidentsCount}</p>
          <p className="text-[11px] text-teal-700 mt-0.5">Sur {totalIncidentsCount} déclarations</p>
        </div>
      </div>
    </div>
  );
};
