import React, { useState, useMemo } from 'react';
import { 
  Search, 
  CheckSquare, 
  Trophy, 
  ShieldCheck, 
  Clock, 
  CalendarCheck2, 
  Users, 
  ArrowRight, 
  Eye, 
  Calendar,
  FileSpreadsheet,
  Sparkles
} from 'lucide-react';
import { Employee, Presence, Task, AttendanceIncident } from '../types';
import { computePresenceStatistics } from './presence/statistics/statisticsCalculations';
import { StatisticsKPIRibbon } from './presence/statistics/StatisticsKPIRibbon';
import { StatisticsChartsSection } from './presence/statistics/StatisticsChartsSection';
import { StatisticsEmployeeRankTable } from './presence/statistics/StatisticsEmployeeRankTable';
import EmployeeRendementPage from './presence/statistics/EmployeeRendementPage';
import EmployeeRendementHistogram from './presence/statistics/EmployeeRendementHistogram';
import { TimesheetModal } from './timesheet/TimesheetModal';
import { computeEmployeeRendement } from '../utils/rendementCalculator';

interface PresenceStatisticsViewProps {
  employees: Employee[];
  presences: Presence[];
  tasks?: Task[];
  incidents?: AttendanceIncident[];
  onSelectEmployee?: (id: string) => void;
  onUpdateTask?: (task: Task) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export function PresenceStatisticsView({
  employees,
  presences,
  tasks = [],
  incidents = [],
  onSelectEmployee,
  onUpdateTask,
  showToast,
}: PresenceStatisticsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'assiduite' | 'rendement'>('assiduite');
  const [period, setPeriod] = useState<'this_month' | 'last_month' | 'last_3_months' | 'all' | 'custom'>('this_month');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const firstDayOfMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [customStart, setCustomStart] = useState<string>(firstDayOfMonthStr);
  const [customEnd, setCustomEnd] = useState<string>(todayStr);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRendementEmployee, setSelectedRendementEmployee] = useState<Employee | null>(null);

  // Timesheet Modal state
  const [timesheetEmployee, setTimesheetEmployee] = useState<Employee | null>(null);
  const [timesheetMode, setTimesheetMode] = useState<'day' | 'month' | 'year'>('month');

  const trackedEmployees = useMemo(() => {
    return employees.filter((e) => e.roleType !== 'sponsor' && (e.status === 'en_poste' || !e.status));
  }, [employees]);

  const stats = useMemo(
    () => computePresenceStatistics(trackedEmployees, presences, period, customStart, customEnd),
    [trackedEmployees, presences, period, customStart, customEnd]
  );

  const statsByEmployeeList = stats?.statsByEmployee || [];

  const filteredStatsByEmployee = useMemo(() => {
    if (!searchQuery.trim()) return statsByEmployeeList;
    const q = searchQuery.toLowerCase();
    return statsByEmployeeList.filter(
      (s) =>
        s.employee.name.toLowerCase().includes(q) ||
        (s.employee.department && s.employee.department.toLowerCase().includes(q))
    );
  }, [statsByEmployeeList, searchQuery]);

  // 🚀 Métriques DYNAMIQUES de rendement calculées à partir des tâches, sous-tâches et jalons
  const employeeRendementMetricsList = useMemo(() => {
    return trackedEmployees.map((emp) => {
      const statRow = statsByEmployeeList.find((s) => s.employee.id === emp.id);
      const empAssiduite = statRow ? statRow.assiduiteRate : 100;
      return computeEmployeeRendement(emp, tasks, empAssiduite);
    });
  }, [trackedEmployees, tasks, statsByEmployeeList]);

  const filteredMetricsList = useMemo(() => {
    if (!searchQuery.trim()) return employeeRendementMetricsList;
    const q = searchQuery.toLowerCase();
    return employeeRendementMetricsList.filter(
      (m) =>
        m.employee.name.toLowerCase().includes(q) ||
        (m.employee.department && m.employee.department.toLowerCase().includes(q))
    );
  }, [employeeRendementMetricsList, searchQuery]);

  // Moyenne dynamique de l'équipe
  const dynamicTeamRate = useMemo(() => {
    if (employeeRendementMetricsList.length === 0) return 0;
    const sum = employeeRendementMetricsList.reduce((acc, m) => acc + m.taskRendementRate, 0);
    return Math.round(sum / employeeRendementMetricsList.length);
  }, [employeeRendementMetricsList]);

  // Total sous-tâches et jalons
  const totalSubtasksCount = useMemo(() => {
    return tasks.reduce((sum, t) => sum + (t.subtasks?.length || 0), 0);
  }, [tasks]);

  const completedSubtasksCount = useMemo(() => {
    return tasks.reduce(
      (sum, t) => sum + (t.subtasks?.filter((s) => s.completed || s.status === 'completed').length || 0),
      0
    );
  }, [tasks]);

  const handleOpenTimesheetModal = (employee: Employee, mode: 'day' | 'month' | 'year' = 'month') => {
    setTimesheetEmployee(employee);
    setTimesheetMode(mode);
  };

  // Si un employé est sélectionné pour le détail du rendement, on affiche la page dédiée avec feuilles de temps
  if (selectedRendementEmployee) {
    const statRow = statsByEmployeeList.find((s) => s.employee.id === selectedRendementEmployee.id);
    const empAssiduite = statRow ? statRow.assiduiteRate : 100;

    return (
      <EmployeeRendementPage
        employee={selectedRendementEmployee}
        tasks={tasks}
        assiduiteRate={empAssiduite}
        presences={presences}
        incidents={incidents}
        onBack={() => setSelectedRendementEmployee(null)}
        onUpdateTask={onUpdateTask}
        showToast={showToast}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-[#2A7B76] to-[#164e4b] rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-emerald-100">
              Module RH & Décisionnel
            </span>
            <span className="text-xs text-emerald-200">Citrine Analytics Pro</span>
          </div>
          <h2 className="font-serif font-bold text-2xl md:text-3xl text-white">
            Statistiques, Assiduité & Rendement
          </h2>
          <p className="text-xs text-emerald-100/90 max-w-2xl">
            Surveillance en temps réel de la ponctualité, de l'assiduité, du rendement des tâches et génération automatisée des feuilles de temps.
          </p>
        </div>

        {/* Global period filter badge */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 rounded-2xl flex items-center gap-3">
          <Calendar className="h-5 w-5 text-emerald-300" />
          <div className="text-xs">
            <div className="text-emerald-200 text-[10px] uppercase font-bold">Période Analysée</div>
            <div className="font-bold text-white">
              {period === 'this_month' && 'Ce mois-ci'}
              {period === 'last_month' && 'Mois dernier'}
              {period === 'last_3_months' && '3 derniers mois'}
              {period === 'all' && 'Tout l’historique'}
              {period === 'custom' && `Du ${customStart} au ${customEnd}`}
            </div>
          </div>
        </div>
      </div>

      {/* Subtabs Switcher */}
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
          title="Afficher l'histogramme et le rendement dynamique des collaborateurs"
        >
          <CheckSquare className="h-4 w-4" />
          <span>Rendement, Tâches & Histogramme</span>
          <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px] font-mono">
            {dynamicTeamRate}%
          </span>
        </button>
      </div>

      {/* Main Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-3xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-stone-400 font-bold uppercase text-[10px] mr-1">Filtrer par période :</span>
          {(['this_month', 'last_month', 'last_3_months', 'all', 'custom'] as const).map((p) => {
            const labels = {
              this_month: 'Ce mois',
              last_month: 'Mois dernier',
              last_3_months: '3 derniers mois',
              all: 'Tout l’historique',
              custom: 'Personnalisé',
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

        {/* Search input */}
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

      {/* Custom Date Pickers */}
      {period === 'custom' && (
        <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 flex flex-wrap items-center gap-4 text-xs animate-in fade-in duration-200">
          <span className="font-bold text-[#2A7B76] flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>Sélection de la plage personnalisée :</span>
          </span>
          <div className="flex items-center gap-2">
            <label className="text-stone-600 font-medium">Du :</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-white border border-stone-200 rounded-xl px-2.5 py-1 text-xs text-stone-800 font-bold focus:outline-none focus:border-[#2A7B76]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-stone-600 font-medium">Au :</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-white border border-stone-200 rounded-xl px-2.5 py-1 text-xs text-stone-800 font-bold focus:outline-none focus:border-[#2A7B76]"
            />
          </div>
        </div>
      )}

      {/* Contenu selon l'onglet actif */}
      {activeSubTab === 'assiduite' ? (
        <>
          <StatisticsKPIRibbon
            overallPresent={stats.overallPresent}
            overallLate={stats.overallLate}
            avgAssiduite={stats.avgAssiduite}
            avgPonctualite={stats.avgPonctualite}
          />
          <StatisticsChartsSection statsByEmployee={stats.statsByEmployee} />
          <StatisticsEmployeeRankTable
            stats={filteredStatsByEmployee}
            onSelectEmployee={onSelectEmployee}
          />
        </>
      ) : (
        /* 🚀 ONGLET RENDEMENT, TÂCHES & HISTOGRAMME DYNAMIQUE */
        <div className="space-y-6">
          {/* Summary Task KPIs DYNAMIQUES */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-3xs flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-[#2A7B76] rounded-2xl border border-emerald-100">
                <CheckSquare className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Tâches Assignées</span>
                <h3 className="text-xl font-bold font-serif text-stone-900 mt-0.5">
                  {tasks.length}
                </h3>
                <span className="text-[10px] text-stone-400 font-medium">
                  Dont {tasks.filter((t) => t.isMilestone).length} jalons stratégiques
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-3xs flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100">
                <CalendarCheck2 className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Tâches Clôturées</span>
                <h3 className="text-xl font-bold font-serif text-stone-900 mt-0.5">
                  {tasks.filter((t) => t.status === 'completed').length} / {tasks.length}
                </h3>
                <span className="text-[10px] text-stone-400 font-medium">
                  {tasks.filter((t) => t.status === 'in_progress').length} en cours
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-3xs flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl border border-purple-100">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Sous-Tâches Détaillées</span>
                <h3 className="text-xl font-bold font-serif text-stone-900 mt-0.5">
                  {completedSubtasksCount} / {totalSubtasksCount}
                </h3>
                <span className="text-[10px] text-stone-400 font-medium">
                  {totalSubtasksCount > 0 ? Math.round((completedSubtasksCount / totalSubtasksCount) * 100) : 0}% de sous-tâches faites
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-3xs flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Rendement Global Équipe</span>
                <h3 className="text-xl font-bold font-serif text-stone-900 mt-0.5 flex items-center gap-1.5">
                  <span>{dynamicTeamRate}%</span>
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </h3>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded-md">
                  Calcul dynamique continu
                </span>
              </div>
            </div>
          </div>

          {/* 📊 HISTOGRAMME DYNAMIQUE DU RENDEMENT DES UTILISATEURS */}
          <EmployeeRendementHistogram
            metricsList={filteredMetricsList}
            onSelectEmployee={(emp) => setSelectedRendementEmployee(emp)}
            onOpenTimesheet={(emp, mode) => handleOpenTimesheetModal(emp, mode)}
          />

          {/* Employee Productivity & Assiduity Combined Table */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-stone-50/50">
              <h3 className="font-serif font-bold text-xs text-stone-900 flex items-center gap-1.5">
                <CheckSquare className="h-4 w-4 text-[#2A7B76]" />
                Rendement des Tâches & Assiduité par Collaborateur ({filteredMetricsList.length})
              </h3>
              <span className="text-[11px] text-stone-500 italic">
                Cliquez sur une ligne pour ouvrir la fiche de détail ou générer la feuille de temps.
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 uppercase font-bold text-[10px] tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4">Collaborateur</th>
                    <th className="py-3 px-4">Département</th>
                    <th className="py-3 px-4 text-center">Score Assiduité</th>
                    <th className="py-3 px-4 text-center">Tâches & Sous-tâches</th>
                    <th className="py-3 px-4 text-center">Rendement Dynamique</th>
                    <th className="py-3 px-4 text-center">Score Combiné RH</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredMetricsList.map((m) => (
                    <tr
                      key={m.employee.id}
                      onClick={() => setSelectedRendementEmployee(m.employee)}
                      className="hover:bg-emerald-50/40 transition cursor-pointer group"
                      title="Cliquer pour ouvrir la page dédiée de rendement et de temps passé"
                    >
                      <td className="py-3 px-4 font-bold text-stone-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#2A7B76]/10 text-[#2A7B76] font-bold flex items-center justify-center text-xs shrink-0 group-hover:bg-[#2A7B76] group-hover:text-white transition">
                          {m.employee.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <span className="truncate block">{m.employee.name}</span>
                          {m.milestonesCount > 0 && (
                            <span className="text-[9px] text-amber-700 font-bold flex items-center gap-0.5">
                              <Trophy className="h-2.5 w-2.5" />
                              {m.completedMilestones}/{m.milestonesCount} jalons
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-stone-600">
                        {m.employee.department || 'Général'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {m.assiduiteRate}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-medium text-stone-700">
                        <div>
                          <span>{m.completedTasks} / {m.totalTasks} tâches</span>
                          <span className="text-[10px] text-stone-400 block">
                            ({m.completedSubtasks}/{m.totalSubtasks} sous-tâches)
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-20 bg-stone-100 h-2 rounded-full overflow-hidden border border-stone-200/50">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                m.taskRendementRate >= 80 
                                  ? 'bg-emerald-500' 
                                  : m.taskRendementRate >= 50 
                                  ? 'bg-[#2A7B76]' 
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.max(m.taskRendementRate, 4)}%` }}
                            />
                          </div>
                          <span className="font-bold text-stone-800 font-mono text-[11px]">
                            {m.taskRendementRate}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-extrabold ${
                            m.globalCombinedScore >= 80
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.globalCombinedScore >= 50
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {m.globalCombinedScore}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Bouton direct Feuille de temps */}
                          <button
                            onClick={() => handleOpenTimesheetModal(m.employee, 'month')}
                            className="px-2 py-1 bg-white hover:bg-emerald-600 hover:text-white text-stone-700 border border-stone-200 hover:border-emerald-600 rounded-lg transition inline-flex items-center gap-1 text-[11px] font-bold cursor-pointer shadow-3xs"
                            title="Générer automatiquement la feuille de temps de ce collaborateur (Jour/Mois/Année)"
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5 text-[#2A7B76]" />
                            <span className="hidden lg:inline">Feuille</span>
                          </button>

                          <button
                            onClick={() => setSelectedRendementEmployee(m.employee)}
                            className="p-1.5 bg-emerald-50 hover:bg-[#2A7B76] hover:text-white text-[#2A7B76] rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                            title="Ouvrir la page de détail du rendement et des sous-tâches"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {onSelectEmployee && (
                            <button
                              onClick={() => onSelectEmployee(m.employee.id)}
                              className="p-1.5 bg-stone-100 hover:bg-[#2A7B76] hover:text-white text-stone-600 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                              title="Voir le profil détaillé du collaborateur"
                            >
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredMetricsList.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-stone-400 italic">
                        Aucun collaborateur trouvé pour cette recherche.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 📄 MODAL FEUILLE DE TEMPS (JOUR / MOIS / ANNÉE) */}
      {timesheetEmployee && (
        <TimesheetModal
          isOpen={Boolean(timesheetEmployee)}
          onClose={() => setTimesheetEmployee(null)}
          employee={timesheetEmployee}
          allTasks={tasks}
          presences={presences}
          incidents={incidents}
          defaultMode={timesheetMode}
        />
      )}
    </div>
  );
}

export default PresenceStatisticsView;
