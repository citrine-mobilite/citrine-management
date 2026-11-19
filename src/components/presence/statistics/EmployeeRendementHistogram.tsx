import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ArrowUpDown, 
  Filter, 
  Sparkles, 
  Trophy, 
  Clock, 
  CheckSquare, 
  FileSpreadsheet,
  LayoutGrid,
  BarChart2
} from 'lucide-react';
import { Employee } from '../../../types';
import { EmployeeRendementMetrics } from '../../../utils/rendementCalculator';

interface EmployeeRendementHistogramProps {
  metricsList: EmployeeRendementMetrics[];
  onSelectEmployee: (employee: Employee) => void;
  onOpenTimesheet?: (employee: Employee, mode?: 'day' | 'month' | 'year') => void;
}

export const EmployeeRendementHistogram: React.FC<EmployeeRendementHistogramProps> = ({
  metricsList = [],
  onSelectEmployee,
  onOpenTimesheet,
}) => {
  const [viewMode, setViewMode] = useState<'vertical' | 'horizontal'>('vertical');
  const [sortBy, setSortBy] = useState<'rate' | 'hours' | 'score' | 'name'>('rate');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [hoveredMetric, setHoveredMetric] = useState<EmployeeRendementMetrics | null>(null);

  // Available departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    (metricsList || []).forEach((m) => {
      if (m.employee.department) set.add(m.employee.department);
    });
    return Array.from(set);
  }, [metricsList]);

  // Filter & Sort
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

  // Team averages
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
      
      {/* Header with Title and Interactive Filters */}
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

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* View mode toggle (Bâtons Verticaux vs Liste Horizontale) */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              onClick={() => setViewMode('vertical')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                viewMode === 'vertical' 
                  ? 'bg-white text-[#2A7B76] shadow-2xs' 
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Afficher sous forme d'histogramme à colonnes verticales"
            >
              <BarChart2 className="h-3.5 w-3.5" />
              <span>Bâtons Verticaux</span>
            </button>
            <button
              onClick={() => setViewMode('horizontal')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                viewMode === 'horizontal' 
                  ? 'bg-white text-[#2A7B76] shadow-2xs' 
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Afficher sous forme de fiches horizontales détaillées"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Liste Détaillée</span>
            </button>
          </div>

          {/* Dept filter */}
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

          {/* Sort selector */}
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
            <Sparkles className="h-3.5 w-3.5" />
            <span>Moyenne Équipe : {teamAvgRate}%</span>
          </div>
        </div>
      </div>

      {/* 📊 MODE 1: HISTOGRAMME GRAPHIQUE VERTICAL */}
      {viewMode === 'vertical' && (
        <div className="space-y-4">
          {/* Legend and guidance */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="text-stone-400 text-[11px] italic">
              💡 Cliquez sur un bâton pour ouvrir la fiche de détail du collaborateur.
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-600">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-gradient-to-r from-emerald-500 to-teal-600"></span>
                <span>Excellent (≥ 80%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-gradient-to-r from-[#2A7B76] to-teal-700"></span>
                <span>Satisfaisant (50% - 79%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-gradient-to-r from-amber-400 to-amber-600"></span>
                <span>En progression (&lt; 50%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 border-t-2 border-dashed border-emerald-500"></span>
                <span>Moyenne Équipe ({teamAvgRate}%)</span>
              </span>
            </div>
          </div>

          {processedList.length === 0 ? (
            <div className="text-center py-16 text-stone-400 italic text-xs">
              Aucun collaborateur trouvé pour ce filtre.
            </div>
          ) : (
            <div className="relative pt-6 pb-2">
              {/* Vertical Chart Stage */}
              <div className="relative h-64 border-b border-stone-200">
                {/* Horizontal reference grid lines */}
                {[100, 75, 50, 25, 0].map((level) => (
                  <div
                    key={level}
                    className="absolute w-full flex items-center border-b border-stone-100"
                    style={{ bottom: `${level}%` }}
                  >
                    <span className="absolute -left-8 text-[10px] font-mono text-stone-400 font-medium">
                      {level}%
                    </span>
                  </div>
                ))}

                {/* Team Average Reference Line */}
                {teamAvgRate > 0 && (
                  <div
                    className="absolute w-full z-10 pointer-events-none flex items-center"
                    style={{ bottom: `${teamAvgRate}%` }}
                  >
                    <div className="w-full border-b-2 border-dashed border-teal-500/60" />
                    <span className="absolute right-0 -top-3.5 bg-teal-50 text-[#2A7B76] border border-teal-200 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-3xs">
                      Moyenne : {teamAvgRate}%
                    </span>
                  </div>
                )}

                {/* Columns Container */}
                <div className="h-full flex items-end justify-around gap-2 px-2 overflow-x-auto">
                  {processedList.map((m) => {
                    const rate = m.taskRendementRate;
                    const heightPercent = Math.max(rate, 6);
                    const isHovered = hoveredMetric?.employee.id === m.employee.id;

                    return (
                      <div
                        key={m.employee.id}
                        onMouseEnter={() => setHoveredMetric(m)}
                        onMouseLeave={() => setHoveredMetric(null)}
                        onClick={() => onSelectEmployee(m.employee)}
                        className="flex-1 min-w-[50px] max-w-[80px] h-full flex flex-col justify-end items-center group cursor-pointer relative"
                        title={`Cliquez pour ouvrir la fiche de détail et feuille de temps de ${m.employee.name}`}
                      >
                        {/* Rate number badge above bar */}
                        <div className={`mb-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold transition-transform group-hover:scale-110 shadow-3xs ${getBarBg(rate)}`}>
                          {rate}%
                        </div>

                        {/* Column Bar with gradient and subtle glow on hover */}
                        <div className="w-full relative flex items-end justify-center">
                          <div
                            className={`w-full rounded-t-xl bg-gradient-to-t ${getBarColor(rate)} transition-all duration-500 shadow-sm group-hover:shadow-md group-hover:brightness-105 border-t border-x`}
                            style={{ height: `${(heightPercent / 100) * 220}px` }}
                          >
                            {/* Milestone badge inside or atop */}
                            {m.milestonesCount > 0 && (
                              <div className="w-full flex justify-center pt-1">
                                <span className="bg-amber-400 text-amber-950 rounded-full p-0.5 shadow-2xs" title={`${m.completedMilestones}/${m.milestonesCount} jalons atteints`}>
                                  <Trophy className="h-2.5 w-2.5" />
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Hover Tooltip Floating Card */}
                        {isHovered && (
                          <div className="absolute bottom-full mb-8 z-30 w-56 bg-stone-900 text-white p-3 rounded-2xl shadow-xl text-left pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                            <div className="font-bold text-xs flex items-center justify-between border-b border-stone-800 pb-1.5 mb-2">
                              <span className="truncate">{m.employee.name}</span>
                              <span className="text-emerald-400 font-mono text-xs">{rate}%</span>
                            </div>
                            <div className="space-y-1 text-[11px] text-stone-300">
                              <div className="flex justify-between">
                                <span className="text-stone-400">Tâches :</span>
                                <span className="font-mono font-semibold">{m.completedTasks} / {m.totalTasks}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-stone-400">Sous-tâches :</span>
                                <span className="font-mono font-semibold">{m.completedSubtasks} / {m.totalSubtasks}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-stone-400">Charge estimée :</span>
                                <span className="font-mono font-semibold text-indigo-300">{m.estimatedHoursTotal}h</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-stone-400">Score combiné RH :</span>
                                <span className="font-mono font-semibold text-amber-300">{m.globalCombinedScore}%</span>
                              </div>
                            </div>
                            <div className="mt-2 pt-1 border-t border-stone-800 text-[10px] text-stone-400 text-center">
                              Cliquer pour ouvrir la fiche
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* X-axis: Employee Names and Avatars */}
              <div className="flex justify-around gap-2 px-2 pt-2 text-center">
                {processedList.map((m) => (
                  <div
                    key={m.employee.id}
                    onClick={() => onSelectEmployee(m.employee)}
                    className="flex-1 min-w-[50px] max-w-[80px] flex flex-col items-center group cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-lg bg-stone-100 group-hover:bg-[#2A7B76] group-hover:text-white text-[#2A7B76] font-bold text-[10px] flex items-center justify-center border border-stone-200 transition shadow-3xs">
                      {m.employee.name.charAt(0)}
                    </div>
                    <span className="text-[10px] font-bold text-stone-700 group-hover:text-[#2A7B76] transition truncate w-full mt-1">
                      {m.employee.name.split(' ')[0]}
                    </span>
                    <span className="text-[9px] text-stone-400 truncate w-full">
                      {m.estimatedHoursTotal}h
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 📊 MODE 2: VUE HORIZONTALE DÉTAILLÉE AVEC DOUBLE BÂTONS & FEUILLES DE TEMPS */}
      {viewMode === 'horizontal' && (
        <div className="space-y-4">
          {/* Visual Legend */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-stone-600 justify-end">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-gradient-to-r from-emerald-500 to-teal-600"></span>
              <span>Rendement Tâches & Sous-tâches (%)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-indigo-500"></span>
              <span>Charge Hebdomadaire (h)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Jalons Stratégiques Liés</span>
            </span>
          </div>

          {/* Bars container */}
          <div className="space-y-3">
            {processedList.map((m) => {
              const rate = m.taskRendementRate;
              const hoursPercentage = Math.min(Math.round((m.estimatedHoursTotal / maxHours) * 100), 100);

              return (
                <div
                  key={m.employee.id}
                  className="p-3.5 bg-stone-50/80 hover:bg-emerald-50/30 rounded-2xl border border-stone-200/90 hover:border-[#2A7B76] transition space-y-2 group shadow-2xs hover:shadow-md"
                >
                  {/* Employee Row Header */}
                  <div className="flex items-center justify-between text-xs">
                    <div 
                      onClick={() => onSelectEmployee(m.employee)}
                      className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-white border border-stone-200 text-[#2A7B76] font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs group-hover:bg-[#2A7B76] group-hover:text-white transition">
                        {m.employee.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <strong className="font-bold text-stone-900 group-hover:text-[#2A7B76] transition truncate">
                            {m.employee.name}
                          </strong>
                          {m.milestonesCount > 0 && (
                            <span className="bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded-md text-[9px] font-bold flex items-center gap-0.5">
                              <Trophy className="h-2.5 w-2.5" />
                              {m.completedMilestones}/{m.milestonesCount} jalons
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-stone-500 block truncate">
                          {m.employee.department || 'Général'} • {m.completedTasks}/{m.totalTasks} tâches ({m.completedSubtasks}/{m.totalSubtasks} sous-tâches)
                        </span>
                      </div>
                    </div>

                    {/* Numeric summary badges + Quick Timesheet Action */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] text-stone-400 block font-medium">Charge</span>
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg text-xs">
                          {m.estimatedHoursTotal}h
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-stone-400 block font-medium">Rendement</span>
                        <span className={`font-mono font-bold px-2.5 py-0.5 rounded-lg text-xs ${getBarBg(rate)}`}>
                          {rate}%
                        </span>
                      </div>

                      <div className="text-right hidden sm:block">
                        <span className="text-[10px] text-stone-400 block font-medium">Score Combiné</span>
                        <span className="font-mono font-bold text-stone-800 bg-white border border-stone-200 px-2 py-0.5 rounded-lg text-xs">
                          {m.globalCombinedScore}%
                        </span>
                      </div>

                      {/* Quick Timesheet Button */}
                      {onOpenTimesheet && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenTimesheet(m.employee, 'month');
                          }}
                          className="px-2.5 py-1.5 bg-white hover:bg-emerald-600 hover:text-white text-stone-700 border border-stone-200 hover:border-emerald-600 font-bold text-[11px] rounded-xl flex items-center gap-1 shadow-3xs transition cursor-pointer"
                          title="Générer automatiquement la feuille de temps de ce collaborateur"
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5 text-[#2A7B76] group-hover:text-white" />
                          <span className="hidden md:inline">Feuille de Temps</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dual Bâtons Histogram */}
                  <div className="space-y-1.5 pt-0.5">
                    {/* Bar 1: Rendement Tâches & Sous-tâches (%) */}
                    <div className="w-full bg-stone-200/80 h-3 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${getBarColor(rate)} transition-all duration-500`}
                        style={{ width: `${Math.max(rate, 4)}%` }}
                      />
                    </div>

                    {/* Bar 2: Charge horaire vs Capacité */}
                    <div className="w-full bg-stone-200/60 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                        style={{ width: `${Math.max(hoursPercentage, 4)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default EmployeeRendementHistogram;
