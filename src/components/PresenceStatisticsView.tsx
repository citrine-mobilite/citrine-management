import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Employee, Presence } from '../types';
import { computePresenceStatistics } from './presence/statistics/statisticsCalculations';
import { StatisticsKPIRibbon } from './presence/statistics/StatisticsKPIRibbon';
import { StatisticsChartsSection } from './presence/statistics/StatisticsChartsSection';
import { StatisticsEmployeeRankTable } from './presence/statistics/StatisticsEmployeeRankTable';

interface PresenceStatisticsViewProps {
  employees: Employee[];
  presences: Presence[];
  onSelectEmployee?: (id: string) => void;
}

export function PresenceStatisticsView({
  employees,
  presences,
  onSelectEmployee,
}: PresenceStatisticsViewProps) {
  const [period, setPeriod] = useState<'this_month' | 'last_month' | 'last_3_months' | 'all'>('this_month');
  const [searchQuery, setSearchQuery] = useState('');

  const trackedEmployees = useMemo(() => {
    return employees.filter((e) => e.roleType !== 'sponsor' && (e.status === 'en_poste' || !e.status));
  }, [employees]);

  const stats = useMemo(
    () => computePresenceStatistics(trackedEmployees, presences, period),
    [trackedEmployees, presences, period]
  );

  const filteredStatsByEmployee = useMemo(() => {
    if (!searchQuery.trim()) return stats.statsByEmployee;
    const q = searchQuery.toLowerCase();
    return stats.statsByEmployee.filter(
      (s) =>
        s.employee.name.toLowerCase().includes(q) ||
        (s.employee.department && s.employee.department.toLowerCase().includes(q))
    );
  }, [stats.statsByEmployee, searchQuery]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Period selector & search bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl overflow-x-auto">
          {[
            { id: 'this_month', label: 'Ce mois' },
            { id: 'last_month', label: 'Mois dernier' },
            { id: 'last_3_months', label: '3 derniers mois' },
            { id: 'all', label: 'Tout l’historique' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as any)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer ${
                period === p.id ? 'bg-[#2A7B76] text-white shadow-2xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="h-3.5 w-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrer par collaborateur..."
            className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#2A7B76]"
          />
        </div>
      </div>

      {/* KPI Ribbon */}
      <StatisticsKPIRibbon
        overallPresent={stats.overallPresent}
        overallLate={stats.overallLate}
        avgAssiduite={stats.avgAssiduite}
        avgPonctualite={stats.avgPonctualite}
      />

      {/* Chart Section */}
      <StatisticsChartsSection statsByEmployee={filteredStatsByEmployee} />

      {/* Ranked Employee Table */}
      <StatisticsEmployeeRankTable
        stats={filteredStatsByEmployee}
        onSelectEmployee={onSelectEmployee}
      />
    </div>
  );
}

export default PresenceStatisticsView;
