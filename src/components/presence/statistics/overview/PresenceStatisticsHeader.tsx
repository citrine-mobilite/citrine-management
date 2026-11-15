import React from 'react';
import { Search, CheckSquare, ShieldCheck, Calendar } from 'lucide-react';
import { StatisticsPeriod } from '../statisticsCalculations';
import { HumaanTaskCheck } from '../../../illustrations/HumaanIllustrations';

interface PresenceStatisticsHeaderProps {
  activeSubTab: 'assiduite' | 'rendement';
  setActiveSubTab: (tab: 'assiduite' | 'rendement') => void;
  period: StatisticsPeriod;
  setPeriod: (p: StatisticsPeriod) => void;
  customStart: string;
  setCustomStart: (v: string) => void;
  customEnd: string;
  setCustomEnd: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  dynamicTeamRate: number;
}

export const PresenceStatisticsHeader: React.FC<PresenceStatisticsHeaderProps> = ({
  activeSubTab,
  setActiveSubTab,
  period,
  setPeriod,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  searchQuery,
  setSearchQuery,
  dynamicTeamRate,
}) => {
  return (
    <>
      <div className="bg-gradient-to-r from-emerald-950 via-[#2A7B76] to-[#164e4b] rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-3 z-10 w-full md:w-auto text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-emerald-100">
              Module RH & Décisionnel
            </span>
            <span className="text-xs text-emerald-200">Citrine Analytics Pro</span>
          </div>
          <h2 className="font-serif font-bold text-2xl md:text-3xl text-white">
            Statistiques, Assiduité & Rendement
          </h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
            <button
              onClick={() => setActiveSubTab('assiduite')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
                activeSubTab === 'assiduite'
                  ? 'bg-white text-[#2A7B76] shadow-sm'
                  : 'bg-white/15 text-white hover:bg-white/25 border border-white/20'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Assiduité & Présences</span>
            </button>
            <button
              onClick={() => setActiveSubTab('rendement')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
                activeSubTab === 'rendement'
                  ? 'bg-white text-[#2A7B76] shadow-sm'
                  : 'bg-white/15 text-white hover:bg-white/25 border border-white/20'
              }`}
            >
              <CheckSquare className="h-3.5 w-3.5" />
              <span>Rendement & Tâches ({dynamicTeamRate}%)</span>
            </button>
          </div>
        </div>

        <div className="shrink-0 z-10 hidden sm:flex items-center justify-center">
          <HumaanTaskCheck className="w-40 h-28 md:w-48 md:h-32 drop-shadow-md" />
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 rounded-2xl flex items-center gap-3 shrink-0 self-center md:self-auto z-10">
          <Calendar className="h-5 w-5 text-emerald-300" />
          <div className="text-xs">
            <div className="text-emerald-200 text-[10px] uppercase font-bold">Période Analysée</div>
            <div className="font-bold text-white">
              {period === 'today' && "Aujourd'hui"}
              {period === 'yesterday' && 'Hier'}
              {period === 'this_week' && 'Cette semaine'}
              {period === 'this_month' && 'Ce mois'}
              {period === 'last_3_months' && '3 derniers mois'}
              {period === 'last_month' && 'Mois dernier'}
              {period === 'all' && 'Tout l’historique'}
              {period === 'custom' && (customStart === customEnd ? `Le ${customStart}` : `Du ${customStart} au ${customEnd}`)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => setActiveSubTab('assiduite')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'assiduite'
              ? 'bg-[#2A7B76] text-white shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
          title="Afficher l'onglet Assiduité, Présences & Ponctualité"
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Assiduité & Présences</span>
        </button>

        <button
          onClick={() => setActiveSubTab('rendement')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'rendement'
              ? 'bg-[#2A7B76] text-white shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
          title="Afficher le rendement des collaborateurs, le suivi des tâches et sous-tâches"
        >
          <CheckSquare className="h-4 w-4" />
          <span>Rendement & Tâches</span>
          <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px] font-mono">
            {dynamicTeamRate}%
          </span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-3xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-stone-400 font-bold uppercase text-[10px] mr-1">Filtrer le rendement par :</span>
          {(['today', 'yesterday', 'this_week', 'this_month', 'last_3_months', 'custom'] as const).map((p) => {
            const labels: Record<string, string> = {
              today: "Aujourd'hui",
              yesterday: 'Hier',
              this_week: 'La semaine',
              this_month: 'Le mois',
              last_3_months: 'Les 3 mois',
              custom: 'Date personnalisée',
            };
            return (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  period === p
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {labels[p]}
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un collaborateur..."
            className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#2A7B76]"
          />
        </div>
      </div>

      {period === 'custom' && (
        <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 flex flex-wrap items-center gap-4 text-xs animate-in fade-in duration-200">
          <span className="font-bold text-[#2A7B76] flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>Sélectionner une date ou plage de rendement :</span>
          </span>
          <div className="flex items-center gap-2">
            <label className="text-stone-600 font-medium">Date (ou début) :</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => {
                setCustomStart(e.target.value);
                if (!customEnd || customEnd < e.target.value) {
                  setCustomEnd(e.target.value);
                }
              }}
              className="bg-white border border-stone-200 rounded-xl px-2.5 py-1 text-xs text-stone-800 font-bold focus:outline-none focus:border-[#2A7B76]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-stone-600 font-medium">Fin (optionnelle) :</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-white border border-stone-200 rounded-xl px-2.5 py-1 text-xs text-stone-800 font-bold focus:outline-none focus:border-[#2A7B76]"
            />
          </div>
          <button
            type="button"
            onClick={() => setCustomEnd(customStart)}
            className="px-2.5 py-1 bg-white border border-stone-300 rounded-lg text-[11px] font-semibold text-stone-600 hover:text-stone-900 cursor-pointer shadow-3xs"
          >
            Jour unique ({customStart})
          </button>
        </div>
      )}
    </>
  );
};
