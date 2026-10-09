import React from 'react';
import { HardHat } from 'lucide-react';

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
      {/* Safety Goal Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-[#2A7B76] text-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-xs">
            <HardHat className="w-8 h-8 text-emerald-200" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-emerald-200 font-bold">Sécurité au travail Citrine</p>
            <h3 className="text-lg font-bold">Objectif « Zéro Accident » sur les sites et sur la route</h3>
            <p className="text-xs text-emerald-100/90 mt-0.5">
              Port obligatoire des EPI à la Base Japoma • Contrôle check-list des freins et pneus avant départ
            </p>
          </div>
        </div>

        <div className="bg-white/10 px-5 py-3 rounded-xl border border-white/20 text-center shrink-0">
          <p className="text-2xl font-black font-mono tracking-tight text-white">{daysWithoutLostTimeAccident}</p>
          <p className="text-[11px] text-emerald-200 uppercase font-semibold">Jours sans accident avec arrêt</p>
        </div>
      </div>

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
