import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Clock, 
  CalendarCheck2,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { EmployeeStatRow, RankingSortTab } from './statisticsCalculations';

interface StatisticsEmployeeRankTableProps {
  stats: EmployeeStatRow[];
  onSelectEmployee?: (id: string) => void;
}

export const StatisticsEmployeeRankTable: React.FC<StatisticsEmployeeRankTableProps> = ({
  stats,
  onSelectEmployee,
}) => {
  const [activeSortTab, setActiveSortTab] = useState<RankingSortTab>('all');

  const sortedStats = useMemo(() => {
    const list = [...stats];
    switch (activeSortTab) {
      case 'presences':
        return list.sort((a, b) => b.presenceRate - a.presenceRate || b.presentDays - a.presentDays);
      case 'assiduite':
        return list.sort((a, b) => b.assiduiteRate - a.assiduiteRate || b.globalScore - a.globalScore);
      case 'ponctualite':
        return list.sort((a, b) => b.ponctualiteRate - a.ponctualiteRate || b.presentDays - a.presentDays);
      case 'all':
      default:
        return list.sort((a, b) => b.globalScore - a.globalScore || b.assiduiteRate - a.assiduiteRate);
    }
  }, [stats, activeSortTab]);

  const navTabs: Array<{ id: RankingSortTab; label: string; icon: React.FC<any> }> = [
    {
      id: 'all',
      label: 'Tous (Score Global RH)',
      icon: Trophy,
    },
    {
      id: 'presences',
      label: 'Taux de Présence',
      icon: CalendarCheck2,
    },
    {
      id: 'assiduite',
      label: 'Assiduité & Régularité',
      icon: ShieldCheck,
    },
    {
      id: 'ponctualite',
      label: 'Ponctualité Matinale',
      icon: Clock,
    },
  ];

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-extrabold flex items-center justify-center text-xs shadow-2xs">
          🥇
        </span>
      );
    }
    if (index === 1) {
      return (
        <span className="w-6 h-6 rounded-full bg-stone-200 text-stone-800 border border-stone-300 font-extrabold flex items-center justify-center text-xs shadow-2xs">
          🥈
        </span>
      );
    }
    if (index === 2) {
      return (
        <span className="w-6 h-6 rounded-full bg-amber-700/20 text-amber-900 border border-amber-700/30 font-extrabold flex items-center justify-center text-xs shadow-2xs">
          🥉
        </span>
      );
    }
    return (
      <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-500 font-mono font-bold flex items-center justify-center text-[10px]">
        {index + 1}
      </span>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-700 bg-emerald-100 border-emerald-200';
    if (score >= 75) return 'text-teal-700 bg-teal-100 border-teal-200';
    if (score >= 60) return 'text-amber-700 bg-amber-100 border-amber-200';
    return 'text-rose-700 bg-rose-100 border-rose-200';
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden space-y-4 p-5">
      {/* Header - Just "Classement Collaborateurs" without any subtitle */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 text-[#2A7B76] rounded-xl border border-emerald-100">
            <Trophy className="h-5 w-5" />
          </div>
          <h3 className="font-serif font-bold text-base text-stone-900">
            Classement Collaborateurs
          </h3>
        </div>

        <span className="text-[11px] font-bold text-stone-400">
          {stats.length} collaborateur(s) classé(s)
        </span>
      </div>

      {/* 🧭 NAVIGATION DES ONGLETS DE CLASSEMENT (TOUS, PRÉSENCES, ASSIDUITÉ, PONCTUALITÉ) */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-stone-100/90 rounded-2xl border border-stone-200/80">
        {navTabs.map((tab) => {
          const isActive = activeSortTab === tab.id;
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSortTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#2A7B76] text-white shadow-xs ring-2 ring-emerald-200/60'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
              }`}
            >
              <TabIcon className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-200' : 'text-stone-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-stone-100">
        <table className="w-full text-left text-xs">
          <thead className="bg-stone-50 text-stone-500 text-[10px] uppercase font-bold border-b border-stone-100">
            <tr>
              <th className="py-3 px-3 text-center w-12">Rang</th>
              <th className="py-3 px-4">Collaborateur</th>
              <th className="py-3 px-4">Département</th>
              <th className="py-3 px-4 text-center">Jours Présents</th>
              <th className="py-3 px-4 text-center">Retards</th>
              <th className="py-3 px-4 text-center">Taux Présence</th>
              <th className="py-3 px-4 text-center">Ponctualité</th>
              <th className="py-3 px-4 text-center">Score Assiduité</th>
              <th className="py-3 px-4 text-right">Score Global RH</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 font-medium">
            {sortedStats.map((row, index) => {
              const isHighlightAll = activeSortTab === 'all';
              const isHighlightPresence = activeSortTab === 'presences';
              const isHighlightAssiduite = activeSortTab === 'assiduite';
              const isHighlightPonctualite = activeSortTab === 'ponctualite';

              return (
                <tr
                  key={row.employee.id}
                  onClick={() => onSelectEmployee?.(row.employee.id)}
                  className="hover:bg-stone-50/70 transition cursor-pointer"
                >
                  {/* Rang */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex justify-center">{getRankBadge(index)}</div>
                  </td>

                  {/* Collaborateur */}
                  <td className="py-3 px-4 font-bold text-stone-900">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#2A7B76]/10 text-[#2A7B76] flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-stone-200">
                        {row.employee.avatarUrl ? (
                          <img src={row.employee.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>{row.employee.name.slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="block truncate font-bold text-stone-900 text-xs">{row.employee.name}</span>
                        <span className="block text-[10px] text-stone-400 font-normal">{row.employee.roleType}</span>
                      </div>
                    </div>
                  </td>

                  {/* Département */}
                  <td className="py-3 px-4 text-stone-500 text-xs">
                    {row.employee.department || 'Citrine'}
                  </td>

                  {/* Jours Présents */}
                  <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700 text-xs">
                    {row.presentDays + row.lateDays} j
                  </td>

                  {/* Retards */}
                  <td className="py-3 px-4 text-center font-mono font-bold text-amber-600 text-xs">
                    {row.lateDays}
                  </td>

                  {/* Taux Présence */}
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`font-bold font-mono px-2 py-0.5 rounded-full text-[11px] border ${
                        isHighlightPresence
                          ? 'ring-2 ring-emerald-400 shadow-2xs ' + getScoreColor(row.presenceRate)
                          : getScoreColor(row.presenceRate)
                      }`}
                    >
                      {row.presenceRate}%
                    </span>
                  </td>

                  {/* Ponctualité */}
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`font-bold font-mono px-2 py-0.5 rounded-full text-[11px] border ${
                        isHighlightPonctualite
                          ? 'ring-2 ring-emerald-400 shadow-2xs ' + getScoreColor(row.ponctualiteRate)
                          : getScoreColor(row.ponctualiteRate)
                      }`}
                    >
                      {row.ponctualiteRate}%
                    </span>
                  </td>

                  {/* Score Assiduité */}
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`font-bold font-mono px-2 py-0.5 rounded-full text-[11px] border ${
                        isHighlightAssiduite
                          ? 'ring-2 ring-emerald-400 shadow-2xs ' + getScoreColor(row.assiduiteRate)
                          : getScoreColor(row.assiduiteRate)
                      }`}
                    >
                      {row.assiduiteRate}%
                    </span>
                  </td>

                  {/* Score Global RH */}
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`font-extrabold font-mono px-2.5 py-1 rounded-xl text-xs border ${
                        isHighlightAll
                          ? 'bg-[#2A7B76] text-white border-[#2A7B76] shadow-xs'
                          : getScoreColor(row.globalScore)
                      }`}
                    >
                      {row.globalScore} pts
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
