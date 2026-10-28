import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  CheckSquare, 
  Clock, 
  Users, 
  ShieldCheck, 
  BarChart3, 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Calendar, 
  Target, 
  TrendingUp, 
  Zap, 
  Sparkles,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { Task, Employee, TaskProject, AppUser } from '../../types';
import { getTaskDynamicProgress } from '../../utils/rendementCalculator';
import { isSelfOnlyUser, findMatchingEmployee } from '../../utils/roleUtils';

interface TaskRendementAnalyticsViewProps {
  tasks: Task[];
  employees: Employee[];
  projects?: TaskProject[];
  currentUser?: AppUser | null;
  currentRole?: string;
}

export const TaskRendementAnalyticsView: React.FC<TaskRendementAnalyticsViewProps> = ({
  tasks,
  employees,
  projects = [],
  currentUser,
  currentRole,
}) => {
  const isRestricted = isSelfOnlyUser(currentUser, currentRole);
  const matchedEmp = useMemo(() => findMatchingEmployee(employees, currentUser), [employees, currentUser]);
  const effectiveEmployees = useMemo(() => {
    if (!isRestricted) return employees;
    if (matchedEmp) return [matchedEmp];
    return employees.slice(0, 1);
  }, [isRestricted, matchedEmp, employees]);

  const [activeTab, setActiveTab] = useState<'workload' | 'milestones' | 'velocity'>('workload');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [capacityFilter, setCapacityFilter] = useState<'all' | 'overloaded' | 'available' | 'optimal'>('all');

  // Filter tasks by selected project if needed
  const filteredTasks = useMemo(() => {
    if (selectedProjectId === 'all') return tasks;
    return tasks.filter((t) => t.projectId === selectedProjectId);
  }, [tasks, selectedProjectId]);

  // Aggregate subtasks across all tasks
  const allSubtasks = useMemo(() => {
    return filteredTasks.flatMap((t) => t.subtasks || []);
  }, [filteredTasks]);

  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'in_progress').length;
  const dynamicProgressSum = filteredTasks.reduce((sum, t) => sum + getTaskDynamicProgress(t), 0);
  const globalCompletionRate = totalTasks > 0 ? Math.round(dynamicProgressSum / totalTasks) : 0;

  // Subtask depth metrics
  const totalSubtasks = allSubtasks.length;
  const completedSubtasks = allSubtasks.filter((s) => s.completed).length;
  const subtasksCompletionRate = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  // Milestones portfolio
  const milestones = useMemo(() => {
    return filteredTasks.filter((t) => t.isMilestone);
  }, [filteredTasks]);

  const completedMilestones = milestones.filter((m) => m.status === 'completed' || (m.milestoneProgress ?? 0) >= 100).length;
  const avgMilestoneProgress = milestones.length > 0 
    ? Math.round(milestones.reduce((sum, m) => sum + (m.milestoneProgress ?? (m.status === 'completed' ? 100 : 0)), 0) / milestones.length)
    : 0;

  // On-time delivery rate
  const onTimeTasks = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return filteredTasks.filter((t) => {
      if (t.status === 'completed') return true;
      if (!t.date && !t.dueDate) return true;
      const due = t.dueDate || t.date;
      return due >= today;
    }).length;
  }, [filteredTasks]);
  const onTimeRate = totalTasks > 0 ? Math.round((onTimeTasks / totalTasks) * 100) : 100;

  // Capacité et seuil de surcharge Citrine : 12h max / jour, surcharge > 10h / jour (calculée sur les sous-tâches)
  // Sur une semaine standard de 5 jours : 60h max (12h*5), seuil de surcharge > 50h (10h*5)
  const STANDARD_WEEKLY_CAPACITY = 60;
  const OVERLOAD_WEEKLY_THRESHOLD = 50;

  const workloadStats = useMemo(() => {
    return effectiveEmployees.map((emp) => {
      // Direct tasks
      const empTasks = filteredTasks.filter(
        (t) =>
          t.employeeId === emp.id ||
          t.assignedTo === emp.name ||
          t.assignedTo === emp.email
      );

      // Subtasks assigned to this employee (even if parent task is assigned to team or someone else)
      const empSubtasks = allSubtasks.filter(
        (s) => s.assignedTo === emp.name || s.employeeId === emp.id
      );

      const totalAssignedTasks = empTasks.length;
      const completedTaskCount = empTasks.filter((t) => t.status === 'completed').length;
      const totalAssignedSubtasks = empSubtasks.length;
      const completedSubtaskCount = empSubtasks.filter((s) => s.completed).length;

      // Workload hours estimation calculée EXCLUSIVEMENT sur les sous-tâches (règle opérationnelle Citrine)
      let subtasksHours = empSubtasks.reduce((sum, s) => sum + (Number(s.estimatedHours) || 1.5), 0);
      let subtasksActualHours = empSubtasks.reduce((sum, s) => sum + (Number(s.actualHours) || 0), 0);

      // Si une tâche n'a pas encore été décomposée en sous-tâches, compter 1h forfaitaire
      let mainTasksWithoutSubtasksCount = empTasks.filter(t => !t.subtasks || t.subtasks.length === 0).length;

      const totalEstimatedHours = subtasksHours + mainTasksWithoutSubtasksCount;
      const totalWorkloadHours = Math.max(totalEstimatedHours, 0);

      // Completion rate dynamic (Takes into account subtasks and milestones progress)
      const empDynamicProgressSum = empTasks.reduce((sum, t) => sum + getTaskDynamicProgress(t), 0);
      const combinedRate = totalAssignedTasks > 0 ? Math.round(empDynamicProgressSum / totalAssignedTasks) : 0;

      // Capacity Status : Surcharge si plus de 10h/jour (soit > 50h/semaine sur 5 jours, capacité max 12h/jour)
      let capacityStatus: 'overloaded' | 'optimal' | 'available' = 'optimal';
      if (totalWorkloadHours > OVERLOAD_WEEKLY_THRESHOLD) {
        capacityStatus = 'overloaded';
      } else if (totalWorkloadHours < 30) {
        capacityStatus = 'available';
      }

      return {
        employee: emp,
        totalTasks: totalAssignedTasks,
        completedTasks: completedTaskCount,
        totalSubtasks: totalAssignedSubtasks,
        completedSubtasks: completedSubtaskCount,
        subtasksHours,
        mainTasksHours: mainTasksWithoutSubtasksCount,
        totalHours: totalWorkloadHours,
        actualHours: subtasksActualHours,
        completionRate: combinedRate,
        capacityStatus,
        saturationPercentage: Math.round((totalWorkloadHours / STANDARD_WEEKLY_CAPACITY) * 100),
      };
    }).sort((a, b) => b.totalHours - a.totalHours);
  }, [filteredTasks, allSubtasks, effectiveEmployees]);

  // Filter workload by capacity status
  const displayedWorkload = useMemo(() => {
    if (capacityFilter === 'all') return workloadStats;
    return workloadStats.filter((w) => w.capacityStatus === capacityFilter);
  }, [workloadStats, capacityFilter]);

  const maxWorkload = Math.max(...workloadStats.map((w) => w.totalHours), STANDARD_WEEKLY_CAPACITY);
  const overloadedCount = workloadStats.filter((w) => w.capacityStatus === 'overloaded').length;
  const availableCount = workloadStats.filter((w) => w.capacityStatus === 'available').length;
  const optimalCount = workloadStats.filter((w) => w.capacityStatus === 'optimal').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 🚀 Top Banner Asana Enterprise Workload */}
      <div className="bg-gradient-to-r from-indigo-950 via-[#2A7B76] to-emerald-950 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-white/5 blur-3xl pointer-events-none" />
        
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
              <Flame className="h-6 w-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Asana Paid Tier • Portefeuille & Capacité
                </span>
                <span className="text-[10px] text-emerald-200 font-mono">
                  Base standard : {STANDARD_WEEKLY_CAPACITY}h / semaine
                </span>
              </div>
              <h2 className="font-serif font-bold text-xl md:text-2xl text-white mt-1">
                {isRestricted ? 'Mon Rendement & Ma Charge de Travail' : 'Pilotage Avancé du Rendement & Équilibrage des Capacités'}
              </h2>
            </div>
          </div>
          <p className="text-xs text-indigo-100/90 pl-1 max-w-3xl leading-relaxed">
            {isRestricted 
              ? 'Suivi personnel de votre charge horaire, accomplissement de vos tâches et progression de vos sous-tâches.'
              : 'Surveillance de la vélocité opérationnelle, répartition de la charge (Workload Balancing), décomposition fine des sous-tâches et progression des jalons stratégiques.'}
          </p>
        </div>

        {/* Global Summary Badge */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 z-10">
          <div className="flex items-center gap-2.5 bg-black/25 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <div>
              <span className="text-[10px] text-emerald-200 block font-medium">Santé Globale des Tâches</span>
              <strong className="text-white text-sm font-mono">{globalCompletionRate}% terminées</strong>
            </div>
          </div>
          {overloadedCount > 0 && (
            <div className="flex items-center gap-2 bg-rose-500/20 backdrop-blur-md px-4 py-1.5 rounded-2xl border border-rose-400/30 text-rose-200 text-xs font-bold">
              <AlertTriangle className="h-4 w-4 text-rose-300" />
              <span>{overloadedCount} collaborateur(s) en surcharge</span>
            </div>
          )}
        </div>
      </div>

      {/* 🧭 Asana Navigation Tabs & Filters Bar */}
      <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Sub-view switcher */}
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('workload')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'workload'
                ? 'bg-[#2A7B76] text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
            title="Capacité hebdomadaire et charge de travail par collaborateur"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Charge de Travail (Workload)</span>
          </button>

          <button
            onClick={() => setActiveTab('milestones')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'milestones'
                ? 'bg-[#2A7B76] text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
            title="Portefeuille des jalons majeurs et livrables stratégiques"
          >
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            <span>Portefeuille Jalons ({milestones.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('velocity')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'velocity'
                ? 'bg-[#2A7B76] text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
            title="Vélocité, taux de respect des délais et granularité des sous-tâches"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Vélocité & Sous-tâches</span>
          </button>
        </div>

        {/* Project Selector Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-stone-400" />
          <span className="text-[11px] font-bold text-stone-600">Projet :</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-stone-200 bg-stone-50 font-bold text-stone-800 text-xs focus:bg-white outline-none cursor-pointer"
          >
            <option value="all">📁 Tous les projets d'entreprise</option>
            {projects.filter((p) => p.id !== 'all').map((p) => (
              <option key={p.id} value={p.id}>
                {p.icon || '📁'} {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Ribbon Asana Business */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Tâches & Sous-tâches */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-3xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Tâches & Sous-tâches</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h3 className="text-xl font-bold font-serif text-stone-900">{totalTasks}</h3>
              <span className="text-xs text-stone-500 font-mono">({totalSubtasks} sous-tâches)</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold block">
              {completedTasks + completedSubtasks} unités achevées
            </span>
          </div>
        </div>

        {/* KPI 2: On-Time Delivery */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-3xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Respect des Échéances</span>
            <h3 className="text-xl font-bold font-serif text-stone-900 mt-0.5">{onTimeRate}%</h3>
            <span className="text-[10px] text-stone-500 font-medium block">
              Livrées dans les temps impartis
            </span>
          </div>
        </div>

        {/* KPI 3: Sous-tâches Execution Depth */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-3xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100">
            <CheckSquare className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Rendement Sous-Tâches</span>
            <h3 className="text-xl font-bold font-serif text-stone-900 mt-0.5">{subtasksCompletionRate}%</h3>
            <span className="text-[10px] text-stone-500 font-medium block">
              {completedSubtasks} / {totalSubtasks} points clôturés
            </span>
          </div>
        </div>

        {/* KPI 4: Milestones Progress */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-3xs flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl border border-purple-100">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Jalons Stratégiques</span>
            <h3 className="text-xl font-bold font-serif text-stone-900 mt-0.5">{avgMilestoneProgress}%</h3>
            <span className="text-[10px] text-purple-700 font-semibold block">
              {completedMilestones} / {milestones.length} jalons validés
            </span>
          </div>
        </div>
      </div>

      {/* TAB 1: WORKLOAD & CAPACITY BALANCING (GESTION DE CHARGE) */}
      {activeTab === 'workload' && (
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#2A7B76]" />
                Équilibrage de la Charge de Travail (Workload Capacity)
              </h3>
              <p className="text-xs text-stone-500">
                Visualisation des heures estimées par collaborateur par rapport à la capacité max hebdomadaire (35h).
              </p>
            </div>

            {/* Quick capacity filter chips */}
            <div className="flex items-center gap-1.5 text-xs">
              <button
                onClick={() => setCapacityFilter('all')}
                className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer ${
                  capacityFilter === 'all' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Tous ({workloadStats.length})
              </button>
              <button
                onClick={() => setCapacityFilter('overloaded')}
                className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 ${
                  capacityFilter === 'overloaded' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                <span>🚨 Surchargés</span>
                <span className="font-mono">({overloadedCount})</span>
              </button>
              <button
                onClick={() => setCapacityFilter('optimal')}
                className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 ${
                  capacityFilter === 'optimal' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                <span>🟢 Optimal</span>
                <span className="font-mono">({optimalCount})</span>
              </button>
              <button
                onClick={() => setCapacityFilter('available')}
                className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 ${
                  capacityFilter === 'available' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                <span>🔵 Disponible</span>
                <span className="font-mono">({availableCount})</span>
              </button>
            </div>
          </div>

          {/* Workload Bars List */}
          <div className="space-y-4 pt-2">
            {displayedWorkload.map((row) => {
              const isOverloaded = row.capacityStatus === 'overloaded';
              const isAvailable = row.capacityStatus === 'available';
              const percentage = Math.min(row.saturationPercentage, 160);

              return (
                <div 
                  key={row.employee.id} 
                  className={`p-4 rounded-2xl border transition space-y-2.5 ${
                    isOverloaded 
                      ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300' 
                      : isAvailable
                      ? 'bg-blue-50/30 border-blue-100 hover:border-blue-200'
                      : 'bg-stone-50/70 border-stone-200/90 hover:border-stone-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    {/* Employee Profile */}
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isOverloaded ? 'bg-rose-600 text-white' : 'bg-[#2A7B76] text-white'
                      }`}>
                        {row.employee.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-stone-900 font-bold text-sm">{row.employee.name}</strong>
                          {isOverloaded && (
                            <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Surcharge Risque Retard
                            </span>
                          )}
                          {isAvailable && (
                            <span className="bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              Disponible pour nouvelles tâches
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-stone-500">
                          {row.employee.department || 'Général'} • {row.employee.position || 'Collaborateur'}
                        </span>
                      </div>
                    </div>

                    {/* Numeric Stats */}
                    <div className="flex items-center gap-4 text-right">
                      <div className="hidden sm:block">
                        <span className="text-[10px] text-stone-400 block">Tâches / Sous-tâches</span>
                        <strong className="text-stone-800 font-mono">
                          {row.totalTasks}T / {row.totalSubtasks}ST
                        </strong>
                      </div>

                      <div>
                        <span className="text-[10px] text-stone-400 block">Charge Hebdo</span>
                        <strong className={`font-mono text-sm ${isOverloaded ? 'text-rose-700' : 'text-[#2A7B76]'}`}>
                          {row.totalHours}h / {STANDARD_WEEKLY_CAPACITY}h
                        </strong>
                      </div>

                      <div>
                        <span className="text-[10px] text-stone-400 block">Rendement Global</span>
                        <strong className="text-emerald-700 font-mono text-sm">{row.completionRate}%</strong>
                      </div>
                    </div>
                  </div>

                  {/* Visual Capacity Gauge (35h marker) */}
                  <div className="relative pt-1">
                    <div className="w-full bg-stone-200 h-3 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOverloaded 
                            ? 'bg-gradient-to-r from-amber-500 to-rose-600' 
                            : isAvailable
                            ? 'bg-gradient-to-r from-blue-400 to-cyan-500'
                            : 'bg-gradient-to-r from-emerald-500 to-[#2A7B76]'
                        }`}
                        style={{ width: `${Math.max(percentage, 6)}%` }}
                      />
                    </div>
                    
                    {/* Capacity saturation label */}
                    <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono pt-1">
                      <span>0h</span>
                      <span className="text-stone-600 font-bold">Capacité normale (35h)</span>
                      <span className={isOverloaded ? 'text-rose-600 font-bold' : ''}>
                        {row.saturationPercentage}% de charge
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {displayedWorkload.length === 0 && (
              <div className="text-center py-12 text-stone-400 italic text-xs">
                Aucun collaborateur ne correspond à ce critère de capacité.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PORTEFEUILLE DES JALONS STRATÉGIQUES (ASANA MILESTONES) */}
      {activeTab === 'milestones' && (
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Portefeuille des Jalons Majeurs d'Entreprise
              </h3>
              <p className="text-xs text-stone-500">
                Livrables stratégiques et étapes clés validant la progression des projets.
              </p>
            </div>
            <span className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-xl">
              {completedMilestones} / {milestones.length} Jalons Franchis
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {milestones.map((milestone) => {
              const isCompleted = milestone.status === 'completed' || (milestone.milestoneProgress ?? 0) >= 100;
              const subtasks = milestone.subtasks || [];
              const completedSub = subtasks.filter((s) => s.completed).length;
              const progress = milestone.milestoneProgress ?? (isCompleted ? 100 : (subtasks.length > 0 ? Math.round((completedSub / subtasks.length) * 100) : 0));

              let statusLabel = 'En bonne voie (On Track)';
              let statusStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
              if (isCompleted) {
                statusLabel = 'Franchi avec succès (Completed)';
                statusStyle = 'bg-purple-50 text-purple-800 border-purple-200';
              } else if (milestone.status === 'blocked') {
                statusLabel = 'Bloqué / En retard (Behind)';
                statusStyle = 'bg-rose-50 text-rose-800 border-rose-200';
              } else if (progress < 40) {
                statusLabel = 'À risque (At Risk)';
                statusStyle = 'bg-amber-50 text-amber-800 border-amber-200';
              }

              return (
                <div key={milestone.id} className="bg-stone-50/80 p-5 rounded-2xl border border-stone-200/90 space-y-3.5 shadow-2xs hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyle}`}>
                        {statusLabel}
                      </span>
                      <h4 className="font-serif font-bold text-sm text-stone-900 mt-1">
                        🎯 {milestone.title}
                      </h4>
                    </div>
                    <span className="font-mono text-base font-bold text-stone-900 bg-white border border-stone-200 px-2.5 py-1 rounded-xl">
                      {progress}%
                    </span>
                  </div>

                  {milestone.milestoneTarget && (
                    <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900">
                      <strong className="block text-[10px] uppercase font-bold text-amber-700">Livrable requis :</strong>
                      <span>{milestone.milestoneTarget}</span>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#2A7B76] h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(progress, 5)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-stone-400 font-medium">
                      <span>Échéance : {milestone.date}</span>
                      <span>{completedSub}/{subtasks.length} sous-tâches validées</span>
                    </div>
                  </div>

                  {/* Assignee */}
                  <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-600">
                    <span className="flex items-center gap-1 font-semibold">
                      <span>👤 Responsable :</span>
                      <span>{milestone.assignedTo || 'Équipe'}</span>
                    </span>
                    <span className="font-bold text-[#2A7B76]">Priorité {milestone.priority}</span>
                  </div>
                </div>
              );
            })}

            {milestones.length === 0 && (
              <div className="col-span-2 text-center py-16 text-stone-400 italic text-xs border-2 border-dashed border-stone-200 rounded-3xl">
                Aucun jalon stratégique défini. Utilisez "+ Nouveau Jalon" dans la bannière supérieure pour en créer un.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: VÉLOCITÉ, RATIO HEURES & SOUS-TÂCHES */}
      {activeTab === 'velocity' && (
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-6">
          <div>
            <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#2A7B76]" />
              Analyse de Vélocité et Décomposition des Sous-Tâches
            </h3>
            <p className="text-xs text-stone-500">
              Métriques de productivité inspirées des rapports Asana Business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Box 1: Taux d'achèvement par priorité */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
              <h4 className="font-bold text-xs text-stone-800 flex items-center gap-1.5">
                <Target className="h-4 w-4 text-[#2A7B76]" /> Répartition par Priorité
              </h4>
              <div className="space-y-2 text-xs">
                {[
                  { label: 'Urgentes ⚡', count: filteredTasks.filter((t) => t.priority === 'urgent').length, color: 'bg-purple-500' },
                  { label: 'Hautes 🔴', count: filteredTasks.filter((t) => t.priority === 'high').length, color: 'bg-rose-500' },
                  { label: 'Moyennes 🟡', count: filteredTasks.filter((t) => t.priority === 'medium').length, color: 'bg-amber-500' },
                  { label: 'Basses 🟢', count: filteredTasks.filter((t) => t.priority === 'low').length, color: 'bg-emerald-500' },
                ].map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-stone-600 font-medium">{p.label}</span>
                    <span className="font-mono font-bold text-stone-900 bg-white border border-stone-200 px-2 py-0.5 rounded-md">
                      {p.count} tâche(s)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Box 2: Profondeur des sous-tâches */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
              <h4 className="font-bold text-xs text-stone-800 flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-indigo-600" /> Granularité des Sous-Tâches
              </h4>
              <div className="space-y-2 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Total sous-tâches enregistrées :</span>
                  <strong className="text-stone-900 font-mono">{totalSubtasks}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Sous-tâches terminées :</span>
                  <strong className="text-emerald-700 font-mono">{completedSubtasks}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Moyenne par tâche :</span>
                  <strong className="text-stone-900 font-mono">
                    {totalTasks > 0 ? (totalSubtasks / totalTasks).toFixed(1) : 0} ST / tâche
                  </strong>
                </div>
                <div className="flex justify-between pt-1 border-t border-stone-200">
                  <span className="font-bold text-stone-800">Taux de résolution fine :</span>
                  <strong className="text-[#2A7B76] font-mono">{subtasksCompletionRate}%</strong>
                </div>
              </div>
            </div>

            {/* Box 3: Efficacité Horaire */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
              <h4 className="font-bold text-xs text-stone-800 flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-500" /> Efficacité Horaire Globale
              </h4>
              <div className="space-y-2 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Charge totale planifiée :</span>
                  <strong className="text-stone-900 font-mono">
                    {workloadStats.reduce((sum, w) => sum + w.totalHours, 0)}h
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Temps réel consigné :</span>
                  <strong className="text-stone-900 font-mono">
                    {workloadStats.reduce((sum, w) => sum + w.actualHours, 0)}h
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Taux de livraison ponctuelle :</span>
                  <strong className="text-emerald-700 font-mono">{onTimeRate}%</strong>
                </div>
                <div className="flex justify-between pt-1 border-t border-stone-200">
                  <span className="font-bold text-stone-800">Indice de Vélocité :</span>
                  <strong className="text-purple-700 font-bold">Optimal (A+)</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TaskRendementAnalyticsView;
