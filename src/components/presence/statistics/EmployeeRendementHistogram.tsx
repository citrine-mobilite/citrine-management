import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, ArrowUpDown, Filter, LayoutGrid, BarChart2 } from 'lucide-react';
import { Employee } from '../../../types';
import { EmployeeRendementMetrics } from '../../../utils/rendementCalculator';
import { RendementVerticalChart } from './histogram/RendementVerticalChart';
import { RendementHorizontalList } from './histogram/RendementHorizontalList';

interface EmployeeRendementHistogramProps {
  metricsList: EmployeeRendementMetrics[];
  onSelectEmployee: (employee: Employee) => void;
  onOpenTaskSheet?: (employee: Employee, mode?: 'day' | 'month' | 'year') => void;
}

export const EmployeeRendementHistogram: React.FC<EmployeeRendementHistogramProps> = ({
  metricsList = [],
  onSelectEmployee,
  onOpenTaskSheet,
}) => {
  const [viewMode, setViewMode] = useState<'vertical' | 'horizontal'>('vertical');
  const [sortBy, setSortBy] = useState<'rate' | 'hours' | 'score' | 'name'>('rate');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [hoveredMetric, setHoveredMetric] = useState<EmployeeRendementMetrics | null>(null);

  const departments = useMemo(() => {
    const set = new Set<string>();
    (metricsList || []).forEach((m) => {
      if (m.employee.department) set.add(m.employee.department);
    });
    return Array.from(set);
  }, [metricsList]);

  const processedList = useMemo(() => {
    let list = metricsList || [];
    if (selectedDept !== 'all') {
      list = list.filter((m) => m.employee.department === selectedDept);
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'rate') return b.taskRendementRate - a.taskRendementRate;
      if (sortBy === 'hours') return b.estimatedHoursTotal - a.estimatedHoursTotal;
      if (sortBy === 'score') return b.globalCombinedScore - a.globalCombinedScore;
      return a.employee.name.localeCompare(b.employee.name);
    });
  }, [metricsList, selectedDept, sortBy]);

  const teamAvgRate = useMemo(() => {
    if (processedList.length === 0) return 0;
    const sum = processedList.reduce((acc, m) => acc + m.taskRendementRate, 0);
    return Math.round(sum / processedList.length);
  }, [processedList]);

  const maxHours = Math.max(...processedList.map((m) => m.estimatedHoursTotal), 35);

  const getBarColor = (rate: number) => {
    if (rate >= 80) return 'from-emerald-500 to-teal-600 border-emerald-400';
    if (rate >= 50) return 'from-[#2A7B76] to-teal-700 border-teal-500';
    if (rate >= 30) return 'from-amber-400 to-amber-600 border-amber-400';
    return 'from-rose-400 to-rose-600 border-rose-400';
  };

  const getBarBg = (rate: number) => {
    if (rate >= 80) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (rate >= 50) return 'bg-teal-50 text-teal-800 border-teal-200';
    if (rate >= 30) return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-rose-50 text-rose-800 border-rose-200';
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-[#2A7B76] rounded-xl border border-emerald-100">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-stone-900">
              Histogramme Comparatif du Rendement & Charges par Collaborateur
            </h3>
          </div>
          <p className="text-xs text-stone-500 pl-9">
            Diagramme dynamique en bâtons : Progression réelle des tâches, sous-tâches, jalons et heures planifiées.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              onClick={() => setViewMode('vertical')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                viewMode === 'vertical' ? 'bg-white text-[#2A7B76] shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Afficher sous forme d'histogramme à colonnes verticales"
            >
              <BarChart2 className="h-3.5 w-3.5" />
              <span>Bâtons Verticaux</span>
            </button>
            <button
              onClick={() => setViewMode('horizontal')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                viewMode === 'horizontal' ? 'bg-white text-[#2A7B76] shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Afficher sous forme de fiches horizontales détaillées"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Liste Détaillée</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 px-2.5 py-1.5 rounded-xl">
            <Filter className="h-3.5 w-3.5 text-stone-400" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent font-bold text-stone-700 outline-none cursor-pointer"
            >
              <option value="all">Tous départements</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 px-2.5 py-1.5 rounded-xl">
            <ArrowUpDown className="h-3.5 w-3.5 text-stone-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-bold text-stone-700 outline-none cursor-pointer"
            >
              <option value="rate">Trier par Rendement (%)</option>
              <option value="hours">Trier par Heures (h)</option>
              <option value="score">Trier par Score Global RH</option>
              <option value="name">Trier par Nom</option>
            </select>
          </div>

          <div className="bg-emerald-50 text-[#2A7B76] border border-emerald-200 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Moyenne Équipe : {teamAvgRate}%</span>
          </div>
        </div>
      </div>

      {viewMode === 'vertical' && (
        <RendementVerticalChart
          processedList={processedList}
          teamAvgRate={teamAvgRate}
          hoveredMetric={hoveredMetric}
          setHoveredMetric={setHoveredMetric}
          onSelectEmployee={onSelectEmployee}
          getBarColor={getBarColor}
          getBarBg={getBarBg}
        />
      )}

      {viewMode === 'horizontal' && (
        <RendementHorizontalList
          processedList={processedList}
          maxHours={maxHours}
          onSelectEmployee={onSelectEmployee}
          onOpenTaskSheet={onOpenTaskSheet}
          getBarColor={getBarColor}
          getBarBg={getBarBg}
        />
      )}
    </div>
  );
};

export default EmployeeRendementHistogram;
