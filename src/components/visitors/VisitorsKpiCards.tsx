import React from 'react';
import { UserCheck, LogOut, Clock, Building2 } from 'lucide-react';

interface VisitorsKpiCardsProps {
  currentOnSite: number;
  todayDeparted: number;
  expectedVisitors: number;
  todayTotal: number;
}

export const VisitorsKpiCards: React.FC<VisitorsKpiCardsProps> = ({
  currentOnSite,
  todayDeparted,
  expectedVisitors,
  todayTotal,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-4.5 rounded-xl border border-stone-200 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-xs font-semibold text-emerald-800">Sur Site Actuellement</p>
          </div>
          <p className="text-2xl font-black text-stone-900 mt-1">{currentOnSite}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Badges en circulation</p>
        </div>
        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
          <UserCheck className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white p-4.5 rounded-xl border border-stone-200 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-stone-500">Sorties Effectuées</p>
          <p className="text-2xl font-bold text-stone-800 mt-1">{todayDeparted}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Visites clôturées aujourd'hui</p>
        </div>
        <div className="p-3 bg-stone-100 text-stone-600 rounded-xl">
          <LogOut className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white p-4.5 rounded-xl border border-stone-200 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-stone-500">Attendus / Convoqués</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{expectedVisitors}</p>
          <p className="text-[11px] text-amber-700 mt-0.5">Rendez-vous programmés</p>
        </div>
        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
          <Clock className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white p-4.5 rounded-xl border border-stone-200 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-stone-500">Total Visites Aujourd'hui</p>
          <p className="text-2xl font-bold text-[#2A7B76] mt-1">{todayTotal}</p>
          <p className="text-[11px] text-teal-700 mt-0.5">Flux global accueil</p>
        </div>
        <div className="p-3 bg-teal-50 text-[#2A7B76] rounded-xl">
          <Building2 className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
