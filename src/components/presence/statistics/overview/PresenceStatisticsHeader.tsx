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

const PERIOD_BUTTONS: Array<{ id: StatisticsPeriod; label: string }> = [
  { id: 'today', label: "Aujourd'hui" },
  { id: 'yesterday', label: 'Hier' },
  { id: 'this_week', label: 'Semaine' },
  { id: 'this_month', label: 'Ce mois' },
  { id: 'last_3_months', label: '3 mois' },
  { id: 'all', label: 'Tout' },
  { id: 'custom', label: 'Personnalisée' },
];

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
  const safeTeamRate = Number.isFinite(dynamicTeamRate) ? dynamicTeamRate : 0;

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-emerald-950 via-[#2A7B76] to-[#164e4b] rounded-3xl p-6 text-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-3 z-10 w-full md:w-auto text-center md:text-left">
          <h2 className="font-serif font-bold text-2xl md:text-3xl text-white">
            Statistiques, Assiduité &amp; Rendement
          </h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
            <button
              type="button"
              onClick={() => setActiveSubTab('assiduite')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSubTab === 'assiduite'
                  ? 'bg-white text-[#2A7B76] shadow-xs'
                  : 'bg-white/15 text-white hover:bg-white/25 border border-white/20'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Assiduité &amp; Présences</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('rendement')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer tabular-nums ${
                activeSubTab === 'rendement'
                  ? 'bg-white text-[#2A7B76] shadow-xs'
                  : 'bg-white/15 text-white hover:bg-white/25 border border-white/20'
              }`}
            >
              <CheckSquare className="h-3.5 w-3.5" />
              <span>Rendement &amp; Tâches ({safeTeamRate}%)</span>
            </button>
          </div>
        </div>

        <div className="shrink-0 z-10 hidden sm:flex items-center justify-center">
          <HumaanTaskCheck className="w-40 h-28 md:w-44 md:h-28 drop-shadow-md" />
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 rounded-2xl flex items-center gap-3 shrink-0 self-center md:self-auto z-10">
          <Calendar className="h-5 w-5 text-emerald-300" />
          <div className="text-xs">
            <div className="text-emerald-200 text-[10px] uppercase font-bold">Période Analysée</div>
            <div className="font-bold text-white tabular-nums">
              {period === 'today' && "Aujourd'hui"}
              {period === 'yesterday' && 'Hier'}
              {period === 'this_week' && 'Cette semaine'}
              {period === 'this_month' && 'Ce mois'}
              {period === 'last_3_months' && '3 derniers mois'}
              {period === 'last_month' && 'Mois dernier'}
              {period === 'all' && 'Tout l’historique'}
              {period === 'custom' &&
                (customStart === customEnd ? `Le ${customStart}` : `Du ${customStart} au ${customEnd}`)}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-stone-500 font-semibold text-[11px] mr-1">Période :</span>
          {PERIOD_BUTTONS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                period === p.id
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px] flex-1 sm:flex-initial">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un collaborateur ou département..."
            className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#2A7B76]"
          />
        </div>
      </div>

      {period === 'custom' && (
        <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 flex flex-wrap items-center gap-4 text-xs animate-in fade-in duration-200">
          <span className="font-bold text-[#2A7B76] flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>Plage de dates :</span>
          </span>
          <div className="flex items-center gap-2">
            <label className="text-stone-600 font-medium">Début :</label>
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
            <label className="text-stone-600 font-medium">Fin :</label>
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
            className="px-2.5 py-1 bg-white border border-stone-300 rounded-lg text-[11px] font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
          >
            Jour unique ({customStart})
          </button>
        </div>
      )}
    </div>
  );
};
