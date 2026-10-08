import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Trophy, CalendarCheck2, ShieldCheck, Clock, Layers } from 'lucide-react';
import { EmployeeStatRow, RankingSortTab } from './statisticsCalculations';

interface StatisticsChartsSectionProps {
  statsByEmployee: EmployeeStatRow[];
}

type ChartMetric = 'all' | 'presences' | 'assiduite' | 'ponctualite' | 'counts';

export const StatisticsChartsSection: React.FC<StatisticsChartsSectionProps> = ({
  statsByEmployee,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<ChartMetric>('all');

  const chartData = useMemo(() => {
    const list = [...statsByEmployee];
    switch (selectedMetric) {
      case 'presences':
        list.sort((a, b) => b.presenceRate - a.presenceRate || b.presentDays - a.presentDays);
        break;
      case 'assiduite':
        list.sort((a, b) => b.assiduiteRate - a.assiduiteRate || b.globalScore - a.globalScore);
        break;
      case 'ponctualite':
        list.sort((a, b) => b.ponctualiteRate - a.ponctualiteRate || b.presentDays - a.presentDays);
        break;
      case 'counts':
        list.sort((a, b) => b.presentDays - a.presentDays || a.lateDays - b.lateDays);
        break;
      case 'all':
      default:
        list.sort((a, b) => b.globalScore - a.globalScore || b.assiduiteRate - a.assiduiteRate);
        break;
    }
    return list.slice(0, 12).map((s) => ({
      name: s.employee.name.split(' ')[0] || s.employee.name,
      fullName: s.employee.name,
      globalScore: s.globalScore,
      presenceRate: s.presenceRate,
      assiduiteRate: s.assiduiteRate,
      ponctualiteRate: s.ponctualiteRate,
      presentDays: s.presentDays,
      lateDays: s.lateDays,
    }));
  }, [statsByEmployee, selectedMetric]);

  const metricsTabs = [
    { id: 'all' as ChartMetric, label: 'Score Global', icon: Trophy, color: '#2A7B76' },
    { id: 'presences' as ChartMetric, label: 'Taux Présence (%)', icon: CalendarCheck2, color: '#059669' },
    { id: 'assiduite' as ChartMetric, label: 'Assiduité (%)', icon: ShieldCheck, color: '#0284c7' },
    { id: 'ponctualite' as ChartMetric, label: 'Ponctualité (%)', icon: Clock, color: '#d97706' },
    { id: 'counts' as ChartMetric, label: 'Jours Présents / Retards', icon: Layers, color: '#475569' },
  ];

  return (
    <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
        <h3 className="font-serif font-bold text-xs text-stone-900">
          Visualisation Graphique par Collaborateur
        </h3>

        {/* Filter buttons on chart */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-stone-100 rounded-2xl">
          {metricsTabs.map((m) => {
            const isActive = selectedMetric === m.id;
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMetric(m.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white text-stone-900 shadow-2xs border border-stone-200/80'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <Icon className={`h-3 w-3 ${isActive ? 'text-[#2A7B76]' : 'text-stone-400'}`} />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis
              domain={selectedMetric === 'counts' ? ['auto', 'auto'] : [0, 100]}
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                borderRadius: '0.75rem',
                fontSize: '11px',
                fontWeight: 'bold',
              }}
            />

            {selectedMetric === 'all' && (
              <Bar dataKey="globalScore" name="Score Global RH (pts)" fill="#2A7B76" radius={[6, 6, 0, 0]} />
            )}

            {selectedMetric === 'presences' && (
              <Bar dataKey="presenceRate" name="Taux de Présence (%)" fill="#059669" radius={[6, 6, 0, 0]} />
            )}

            {selectedMetric === 'assiduite' && (
              <Bar dataKey="assiduiteRate" name="Score d'Assiduité (%)" fill="#0284c7" radius={[6, 6, 0, 0]} />
            )}

            {selectedMetric === 'ponctualite' && (
              <Bar dataKey="ponctualiteRate" name="Ponctualité (%)" fill="#d97706" radius={[6, 6, 0, 0]} />
            )}

            {selectedMetric === 'counts' && (
              <>
                <Bar dataKey="presentDays" name="Jours Présents" fill="#2A7B76" radius={[6, 6, 0, 0]} />
                <Bar dataKey="lateDays" name="Retards" fill="#e11d48" radius={[6, 6, 0, 0]} />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
