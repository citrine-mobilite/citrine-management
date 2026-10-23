import React, { useState, useMemo, useRef } from 'react';
import { 
  ArrowLeft, 
  CheckSquare, 
  Clock, 
  Trophy, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  FileSpreadsheet, 
  Calendar, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  Flame,
  CheckCircle2,
  Filter,
  Search,
  RotateCcw,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock4,
  Hourglass
} from 'lucide-react';
import { Employee, Task, Subtask, Presence, AttendanceIncident, TaskStatus, AppUser } from '../../../types';
import { haptic } from '../../../services/hapticService';
import { SubtaskCreateModal } from '../../tasks/SubtaskCreateModal';
import { TimesheetModal } from '../../timesheet/TimesheetModal';
import { computeEmployeeRendement, isTaskAssignedToEmployee, getTaskDynamicProgress } from '../../../utils/rendementCalculator';
import { TaskTimePyramid } from './TaskTimePyramid';

interface EmployeeRendementPageProps {
  employee: Employee;
  tasks: Task[];
  assiduiteRate: number;
  presences?: Presence[];
  incidents?: AttendanceIncident[];
  onBack: () => void;
  onUpdateTask?: (updatedTask: Task) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
  currentUser?: AppUser | null;
  currentRole?: string;
}

type StatusFilter = 'all' | 'todo' | 'in_progress' | 'pending_validation' | 'blocked' | 'completed';
type DurationFilter = 'all' | 'short' | 'medium' | 'long';
type PeriodFilter = 'all' | 'today' | 'week' | 'month' | 'quarter';

export const EmployeeRendementPage: React.FC<EmployeeRendementPageProps> = ({
  employee,
  tasks,
  assiduiteRate,
  presences = [],
  incidents = [],
  onBack,
  onUpdateTask,
  showToast,
  currentUser,
  currentRole,
}) => {
  // Calcul DYNAMIQUE du rendement complet (tâches, sous-tâches, jalons, heures)
  const metrics = useMemo(() => {
    return computeEmployeeRendement(employee, tasks, assiduiteRate);
  }, [employee, tasks, assiduiteRate]);

  // Tasks with dynamic hours & progress
  const tasksWithDynamicData = useMemo(() => {
    return metrics.assignedTasks.map((t) => {
      let estimatedHours = 4;
      if (t.priority === 'urgent') estimatedHours = 10;
      else if (t.priority === 'high' || t.priority === 'haut') estimatedHours = 7;
      else if (t.priority === 'low') estimatedHours = 2;

      if (t.subtasks && t.subtasks.length > 0) {
        const subHours = t.subtasks.reduce((sum, s) => sum + (s.estimatedHours || 2), 0);
        estimatedHours = Math.max(estimatedHours, subHours);
      }

      const dynamicProgress = getTaskDynamicProgress(t);

      return {
        ...t,
        estimatedHours,
        dynamicProgress,
      };
    });
  }, [metrics.assignedTasks]);

  // Filtres d'affichage
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [limitToTen, setLimitToTen] = useState(true);

  // Expanded task state
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [newSubtaskTitles, setNewSubtaskTitles] = useState<{ [taskId: string]: string }>({});
  const [activeModalTask, setActiveModalTask] = useState<Task | null>(null);

  // Timesheet Modal State
  const [isTimesheetOpen, setIsTimesheetOpen] = useState(false);
  const [timesheetMode, setTimesheetMode] = useState<'day' | 'month' | 'year'>('month');

  const taskDetailSectionRef = useRef<HTMLDivElement>(null);

  // Dates pour le filtre de période
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Filtrage des tâches
  const filteredTasks = useMemo(() => {
    return tasksWithDynamicData.filter((task) => {
      // 1. Filtre par statut
      if (statusFilter !== 'all') {
        if (statusFilter === 'todo' && task.status !== 'todo' && task.status !== 'idea') return false;
        if (statusFilter === 'in_progress' && task.status !== 'in_progress' && task.status !== 'en_cours') return false;
        if (statusFilter === 'pending_validation' && task.status !== 'pending_validation' && (task.status as any) !== 'review') return false;
        if (statusFilter === 'blocked' && task.status !== 'blocked') return false;
        if (statusFilter === 'completed' && task.status !== 'completed') return false;
      }

      // 2. Filtre par durée
      if (durationFilter !== 'all') {
        const hours = task.estimatedHours;
        if (durationFilter === 'short' && hours >= 2) return false;
        if (durationFilter === 'medium' && (hours < 2 || hours > 5)) return false;
        if (durationFilter === 'long' && hours <= 5) return false;
      }

      // 3. Filtre par période
      if (periodFilter !== 'all') {
        const tDate = task.date || task.dueDate || task.createdAt || '';
        if (tDate) {
          if (periodFilter === 'today' && !tDate.startsWith(todayStr)) return false;
          if (periodFilter === 'week' && tDate < sevenDaysAgo) return false;
          if (periodFilter === 'month' && tDate < thirtyDaysAgo) return false;
          if (periodFilter === 'quarter' && tDate < ninetyDaysAgo) return false;
        }
      }

      // 4. Recherche par mot-clé
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = (task.description || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }

      return true;
    });
  }, [tasksWithDynamicData, statusFilter, durationFilter, periodFilter, searchQuery, todayStr, sevenDaysAgo, thirtyDaysAgo, ninetyDaysAgo]);

  // Tri par date / récence décroissante
  const sortedByRecencyTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      const dateA = a.date || a.createdAt || a.dueDate || '';
      const dateB = b.date || b.createdAt || b.dueDate || '';
      return dateB.localeCompare(dateA);
    });
  }, [filteredTasks]);

  // Affichage des 10 dernières par défaut
  const displayedTasks = useMemo(() => {
    if (limitToTen) {
      return sortedByRecencyTasks.slice(0, 10);
    }
    return sortedByRecencyTasks;
  }, [sortedByRecencyTasks, limitToTen]);

  const hasActiveFilters = statusFilter !== 'all' || durationFilter !== 'all' || periodFilter !== 'all' || searchQuery.trim() !== '';

  const resetFilters = () => {
    haptic.light();
    setStatusFilter('all');
    setDurationFilter('all');
    setPeriodFilter('all');
    setSearchQuery('');
  };

  const openTimesheet = (mode: 'day' | 'month' | 'year') => {
    haptic.light();
    setTimesheetMode(mode);
    setIsTimesheetOpen(true);
  };

  const handleSelectFromPyramid = (taskId: string) => {
    setExpandedTaskId(taskId);
    if (taskDetailSectionRef.current) {
      taskDetailSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCreateSubtaskFromModal = (newSub: Subtask) => {
    if (!activeModalTask) return;
    const updatedSubtasks = [...(activeModalTask.subtasks || []), newSub];
    const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every((s) => s.completed || s.status === 'completed');
    
    let newStatus = activeModalTask.status;
    if (allCompleted && activeModalTask.status !== 'completed') {
      newStatus = 'completed';
    }

    const updatedTask: Task = {
      ...activeModalTask,
      status: newStatus,
      subtasks: updatedSubtasks,
      lastUpdatedTime: new Date().toISOString(),
    };

    if (onUpdateTask) onUpdateTask(updatedTask);
    if (showToast) showToast(`Sous-tâche "${newSub.title}" créée avec succès !`, 'success');
    setActiveModalTask(null);
  };

  const handleToggleSubtask = (task: Task, subtaskId: string) => {
    haptic.light();
    const updatedSubtasks = (task.subtasks || []).map((sub) =>
      sub.id === subtaskId ? { ...sub, completed: !sub.completed, status: !sub.completed ? ('completed' as TaskStatus) : ('todo' as TaskStatus) } : sub
    );

    const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every((s) => s.completed);
    let newStatus = task.status;
    if (allCompleted && task.status !== 'completed') {
      newStatus = 'completed';
    } else if (!allCompleted && task.status === 'completed') {
      newStatus = 'in_progress';
    }

    const updatedTask: Task = {
      ...task,
      status: newStatus,
      subtasks: updatedSubtasks,
      lastUpdatedTime: new Date().toISOString(),
    };

    if (onUpdateTask) onUpdateTask(updatedTask);
    if (showToast) showToast('Rendement recalculé et sous-tâche mise à jour.', 'success');
  };

  const handleAddSubtask = (task: Task) => {
    const title = (newSubtaskTitles[task.id] || '').trim();
    if (!title) return;
    haptic.medium();

    const newSub: Subtask = {
      id: `sub-${Date.now()}`,
      title,
      completed: false,
      status: 'todo',
      estimatedHours: 2,
    };

    const updatedSubtasks = [...(task.subtasks || []), newSub];
    let newStatus = task.status;
    if (task.status === 'completed') {
      newStatus = 'in_progress';
    }

    const updatedTask: Task = {
      ...task,
      status: newStatus,
      subtasks: updatedSubtasks,
      lastUpdatedTime: new Date().toISOString(),
    };

    if (onUpdateTask) onUpdateTask(updatedTask);
    setNewSubtaskTitles({ ...newSubtaskTitles, [task.id]: '' });
    if (showToast) showToast('Sous-tâche ajoutée et rendement recalculé.', 'success');
  };

  const handleDeleteSubtask = (task: Task, subtaskId: string) => {
    haptic.light();
    const updatedSubtasks = (task.subtasks || []).filter((sub) => sub.id !== subtaskId);
    const updatedTask: Task = {
      ...task,
      subtasks: updatedSubtasks,
      lastUpdatedTime: new Date().toISOString(),
    };
    if (onUpdateTask) onUpdateTask(updatedTask);
    if (showToast) showToast('Sous-tâche supprimée.', 'success');
  };

  const handleStatusChange = (task: Task, newStatus: TaskStatus) => {
    haptic.medium();
    let updatedSubtasks = task.subtasks;
    if (newStatus === 'completed' && updatedSubtasks && updatedSubtasks.length > 0) {
      updatedSubtasks = updatedSubtasks.map((s) => ({ ...s, completed: true, status: 'completed' as TaskStatus }));
    }

    const updatedTask: Task = {
      ...task,
      status: newStatus,
      subtasks: updatedSubtasks,
      lastUpdatedTime: new Date().toISOString(),
    };

    if (onUpdateTask) onUpdateTask(updatedTask);
    if (showToast) showToast(`Statut mis à jour : ${newStatus} (Rendement actualisé).`, 'success');
  };

  const handleMilestoneProgressChange = (task: Task, progress: number) => {
    const clamped = Math.max(0, Math.min(100, progress));
    const isNowDone = clamped === 100;
    const updatedTask: Task = {
      ...task,
      milestoneProgress: clamped,
      status: isNowDone ? 'completed' : task.status === 'completed' ? 'in_progress' : task.status,
      lastUpdatedTime: new Date().toISOString(),
    };
    if (onUpdateTask) onUpdateTask(updatedTask);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* Top Navigation & Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-[#2A7B76] hover:text-white text-stone-700 rounded-xl font-bold text-xs transition cursor-pointer shadow-3xs"
          title="Retourner aux statistiques et à l'histogramme des collaborateurs"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retour aux Statistiques</span>
        </button>

        <span className="text-xs font-mono font-bold text-stone-500 bg-stone-100 px-3 py-1 rounded-xl">
          Fiche Rendement & Tâches Détaillée
        </span>
      </div>

      {/* Employee Header Banner */}
      <div className="bg-gradient-to-r from-[#2A7B76] via-[#20635F] to-emerald-950 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-bold font-serif text-2xl shrink-0 shadow-inner">
            {employee.name.charAt(0)}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-bold text-xl md:text-2xl">{employee.name}</h2>
              {metrics.milestonesCount > 0 && (
                <span className="bg-amber-400 text-amber-950 font-bold px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1 shadow-2xs">
                  <Trophy className="h-3 w-3" />
                  {metrics.completedMilestones}/{metrics.milestonesCount} jalons
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-100/95">
              {employee.department || 'Général'} • {employee.position || 'Collaborateur'} • {employee.email}
            </p>
          </div>
        </div>

        {/* Quick Timesheet Launcher on Header */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => openTimesheet('month')}
            className="px-3.5 py-2 bg-white text-[#2A7B76] hover:bg-emerald-50 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
            title="Générer automatiquement la feuille de temps de ce collaborateur (Jour / Mois / Année)"
          >
            <FileSpreadsheet className="h-4 w-4 text-[#2A7B76]" />
            <span>Feuilles de Temps</span>
          </button>
        </div>
      </div>

      {/* Barre d'automatisation des Feuilles de Temps */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-emerald-950 p-4 rounded-3xl text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-stone-700/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-2xl border border-emerald-400/30">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm text-white flex items-center gap-2">
              Génération Automatique de la Feuille de Temps
              <span className="text-[10px] font-sans font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 px-2 py-0.2 rounded-full">
                Modèle Officiel Citrine
              </span>
            </h4>
            <p className="text-xs text-stone-300">
              Générez, prévisualisez et exportez les feuilles d'activité par période.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => openTimesheet('day')}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-3xs"
          >
            <Calendar className="h-3.5 w-3.5 text-emerald-300" />
            <span>📅 Jour</span>
          </button>

          <button
            onClick={() => openTimesheet('month')}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Calendar className="h-3.5 w-3.5 text-white" />
            <span>🗓️ Mois</span>
          </button>

          <button
            onClick={() => openTimesheet('year')}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-3xs"
          >
            <Trophy className="h-3.5 w-3.5 text-amber-300" />
            <span>🏆 Année</span>
          </button>
        </div>
      </div>

      {/* KPI Ribbon DYNAMIQUE */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-3xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Score Combiné RH</span>
          <div className="flex items-center gap-2 mt-1">
            <Trophy className="h-5 w-5 text-amber-600" />
            <span className="font-serif font-bold text-xl text-stone-900">{metrics.globalCombinedScore}%</span>
          </div>
          <span className="text-[10px] text-stone-400 mt-1 block">50% Assiduité + 50% Rendement</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-3xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Assiduité Pointage</span>
          <div className="flex items-center gap-2 mt-1">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <span className="font-serif font-bold text-xl text-stone-900">{assiduiteRate}%</span>
          </div>
          <span className="text-[10px] text-stone-400 mt-1 block">Présence & ponctualité</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-3xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Rendement Dynamique</span>
          <div className="flex items-center gap-2 mt-1">
            <CheckSquare className="h-5 w-5 text-[#2A7B76]" />
            <span className="font-serif font-bold text-xl text-stone-900">{metrics.taskRendementRate}%</span>
          </div>
          <span className="text-[10px] text-stone-400 mt-1 block">Calculé sur tâches & sous-tâches</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-3xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Tâches & Sous-tâches</span>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="h-5 w-5 text-blue-600" />
            <span className="font-serif font-bold text-xl text-stone-900">
              {metrics.completedTasks}/{metrics.totalTasks}
            </span>
          </div>
          <span className="text-[10px] text-stone-400 mt-1 block">
            {metrics.completedSubtasks}/{metrics.totalSubtasks} sous-tâches ({metrics.estimatedHoursTotal}h)
          </span>
        </div>
      </div>

      {/* 📝 Section DÉTAIL DES TÂCHES (REDESIGNÉE, FILTRES STATUT / DURÉE / PÉRIODE, 10 DERNIÈRES) */}
      <div ref={taskDetailSectionRef} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-5">
        
        {/* En-tête de section & Switch 10 dernières / Tout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-[#2A7B76] rounded-xl border border-emerald-100">
                <CheckSquare className="h-4 w-4" />
              </div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Détail des Tâches & Sous-Tâches
              </h3>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Gestion fine des tâches et sous-tâches. Les modifications recalculent instantanément le rendement.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle 10 dernières vs Tout */}
            <div className="bg-stone-100 p-1 rounded-xl flex items-center border border-stone-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setLimitToTen(true)}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  limitToTen
                    ? 'bg-white text-[#2A7B76] shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Afficher uniquement les 10 dernières tâches récentes"
              >
                10 Dernières
              </button>
              <button
                type="button"
                onClick={() => setLimitToTen(false)}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  !limitToTen
                    ? 'bg-white text-[#2A7B76] shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Afficher la totalité des tâches de ce collaborateur"
              >
                Toutes ({sortedByRecencyTasks.length})
              </button>
            </div>
          </div>
        </div>

        {/* 🔍 BARRE DE FILTRAGE PAR STATUT, DURÉE & PÉRIODE + RECHERCHE */}
        <div className="bg-stone-50/80 p-4 rounded-2xl border border-stone-200/80 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
            
            {/* 1. Filtre par Statut */}
            <div>
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                Statut
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="w-full bg-white border border-stone-200 rounded-xl px-3 py-1.5 font-bold text-stone-800 outline-none cursor-pointer focus:border-[#2A7B76]"
              >
                <option value="all">Tous les statuts</option>
                <option value="todo">À faire</option>
                <option value="in_progress">En cours</option>
                <option value="pending_validation">En attente / révision</option>
                <option value="blocked">Bloquée</option>
                <option value="completed">Terminée</option>
              </select>
            </div>

            {/* 2. Filtre par Durée */}
            <div>
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                Durée estimée
              </label>
              <select
                value={durationFilter}
                onChange={(e) => setDurationFilter(e.target.value as DurationFilter)}
                className="w-full bg-white border border-stone-200 rounded-xl px-3 py-1.5 font-bold text-stone-800 outline-none cursor-pointer focus:border-[#2A7B76]"
              >
                <option value="all">Toutes durées</option>
                <option value="short">Rapide (&lt; 2h)</option>
                <option value="medium">Moyenne (2h à 5h)</option>
                <option value="long">Longue (&gt; 5h)</option>
              </select>
            </div>

            {/* 3. Filtre par Période */}
            <div>
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                Période
              </label>
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
                className="w-full bg-white border border-stone-200 rounded-xl px-3 py-1.5 font-bold text-stone-800 outline-none cursor-pointer focus:border-[#2A7B76]"
              >
                <option value="all">Toutes les dates</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">7 derniers jours</option>
                <option value="month">Ce mois-ci (30j)</option>
                <option value="quarter">3 derniers mois</option>
              </select>
            </div>

            {/* 4. Recherche par Titre */}
            <div>
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                Rechercher
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Mot-clé, titre..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-stone-200 rounded-xl font-medium text-xs text-stone-900 outline-none focus:border-[#2A7B76]"
                />
              </div>
            </div>
          </div>

          {/* Barre d'état des filtres */}
          <div className="flex items-center justify-between pt-1 text-[11px] text-stone-500">
            <span>
              Affichage de <strong className="text-stone-900 font-bold">{displayedTasks.length}</strong> tâche(s)
              {limitToTen && sortedByRecencyTasks.length > 10 && ` (sur les ${sortedByRecencyTasks.length} correspondantes)`}
            </span>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-[#2A7B76] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Réinitialiser les filtres</span>
              </button>
            )}
          </div>
        </div>

        {/* 📋 LISTE DES TÂCHES REDESIGNÉES */}
        <div className="space-y-3">
          {displayedTasks.map((task) => {
            const isExpanded = expandedTaskId === task.id;
            const subtasks = task.subtasks || [];
            const completedSub = subtasks.filter((s) => s.completed || s.status === 'completed').length;
            const isCompleted = task.status === 'completed';
            const progress = task.dynamicProgress;

            return (
              <div
                key={task.id}
                className="bg-white hover:bg-stone-50/50 rounded-2xl border border-stone-200/90 shadow-3xs overflow-hidden transition-all duration-200"
              >
                {/* En-tête de la carte tâche */}
                <div
                  onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : task.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : task.status === 'blocked'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-stone-100 text-stone-700 border border-stone-300'
                      }`}
                    >
                      {isCompleted ? '✓' : isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-xs sm:text-sm text-stone-900 truncate">{task.title}</h4>
                        {task.isMilestone && (
                          <span className="bg-amber-100 text-amber-950 border border-amber-300 px-1.5 py-0.2 rounded-md text-[9px] font-bold flex items-center gap-0.5">
                            <Trophy className="w-2.5 h-2.5" /> Jalon
                          </span>
                        )}
                        {task.date && (
                          <span className="text-[10px] text-stone-400 font-mono">
                            📅 {task.date}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-1 flex-wrap">
                        <span>Sous-tâches : <strong className="text-stone-700">{completedSub}/{subtasks.length}</strong></span>
                        <span>•</span>
                        <span>Avancement réel : <strong className={isCompleted ? 'text-emerald-700' : progress > 0 ? 'text-[#2A7B76]' : 'text-stone-600'}>{progress}%</strong></span>
                        {task.priority && (
                          <>
                            <span>•</span>
                            <span className="capitalize text-stone-600">Priorité : {task.priority}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {/* Statut modifiable directement */}
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-xl outline-none cursor-pointer border transition shadow-3xs ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : task.status === 'in_progress'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : task.status === 'blocked'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-stone-50 text-stone-700 border-stone-200'
                      }`}
                      title="Changer directement le statut de la tâche"
                    >
                      <option value="todo">À faire</option>
                      <option value="in_progress">En cours</option>
                      <option value="pending_validation">En attente</option>
                      <option value="blocked">Bloquée</option>
                      <option value="completed">Terminée ✓</option>
                    </select>

                    <span className="font-mono text-[11px] font-bold text-stone-700 bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-xl">
                      {task.estimatedHours}h
                    </span>
                  </div>
                </div>

                {/* Petite barre de progression fine sous la carte */}
                <div className="w-full bg-stone-100 h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isCompleted
                        ? 'bg-emerald-500'
                        : progress > 0
                        ? 'bg-[#2A7B76]'
                        : 'bg-transparent'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Jalon interactif si présent */}
                {task.isMilestone && (
                  <div className="px-4 py-2 bg-amber-50/50 border-t border-amber-100 flex items-center justify-between gap-3 text-xs">
                    <span className="font-bold text-amber-900 text-[11px] flex items-center gap-1">
                      <Trophy className="h-3 w-3 text-amber-600" />
                      Avancement du Jalon : {task.milestoneProgress ?? (task.status === 'completed' ? 100 : 0)}%
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={task.milestoneProgress ?? (task.status === 'completed' ? 100 : 0)}
                      onChange={(e) => handleMilestoneProgressChange(task, parseInt(e.target.value, 10))}
                      className="w-32 accent-[#2A7B76] cursor-pointer"
                      title="Ajuster l'avancement du jalon"
                    />
                  </div>
                )}

                {/* Tiroir détaillé des sous-tâches */}
                {isExpanded && (
                  <div className="p-4 bg-stone-50/60 border-t border-stone-200/80 space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                      <span>Sous-tâches de la tâche ({subtasks.length})</span>
                      <span className="text-[#2A7B76] font-mono font-bold">
                        {completedSub}/{subtasks.length} achevée(s)
                      </span>
                    </div>

                    <div className="space-y-2">
                      {subtasks.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-stone-200 hover:border-[#2A7B76]/50 transition shadow-3xs"
                        >
                          <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={sub.completed}
                              onChange={() => handleToggleSubtask(task, sub.id)}
                              className="w-4 h-4 rounded border-stone-300 text-[#2A7B76] cursor-pointer accent-[#2A7B76]"
                            />
                            <span
                              className={`text-xs truncate ${
                                sub.completed ? 'line-through text-stone-400 font-medium' : 'text-stone-800 font-bold'
                              }`}
                            >
                              {sub.title}
                            </span>
                            {sub.estimatedHours && (
                              <span className="text-[10px] text-stone-400 font-mono ml-1">
                                ({sub.estimatedHours}h)
                              </span>
                            )}
                          </label>

                          <button
                            onClick={() => handleDeleteSubtask(task, sub.id)}
                            className="p-1 text-stone-400 hover:text-rose-600 transition cursor-pointer ml-2"
                            title="Supprimer cette sous-tâche"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}

                      {subtasks.length === 0 && (
                        <p className="text-xs text-stone-400 italic py-1">
                          Aucune sous-tâche créée pour le moment.
                        </p>
                      )}
                    </div>

                    {/* Boutons d'ajout de sous-tâche */}
                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveModalTask(task)}
                        className="w-full sm:w-auto px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#2A7B76] border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Créer une sous-tâche complète"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Nouvelle sous-tâche détaillée</span>
                      </button>

                      <div className="flex items-center gap-2 flex-1 w-full">
                        <input
                          type="text"
                          value={newSubtaskTitles[task.id] || ''}
                          onChange={(e) =>
                            setNewSubtaskTitles({ ...newSubtaskTitles, [task.id]: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddSubtask(task);
                          }}
                          placeholder="Ajout rapide de sous-tâche..."
                          className="flex-1 px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#2A7B76]"
                        />
                        <button
                          onClick={() => handleAddSubtask(task)}
                          className="px-3 py-1.5 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Ajouter</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {displayedTasks.length === 0 && (
            <div className="text-center py-12 text-stone-400 italic text-xs bg-stone-50 rounded-2xl border border-stone-200/80">
              Aucune tâche ne correspond à vos filtres actuels.
            </div>
          )}
        </div>
      </div>

      {/* 📊 PYRAMIDE DU TEMPS PASSÉ & DISTRIBUTION DES CHARGES (FORMAT PYRAMIDE DES ÂGES) */}
      <TaskTimePyramid
        tasks={tasksWithDynamicData}
        onSelectTask={handleSelectFromPyramid}
      />

      {/* Subtask Create Modal (Asana Style) */}
      {activeModalTask && (
        <SubtaskCreateModal
          isOpen={Boolean(activeModalTask)}
          onClose={() => setActiveModalTask(null)}
          onCreateSubtask={handleCreateSubtaskFromModal}
          employees={[employee]}
          parentTask={activeModalTask}
        />
      )}

      {/* MODAL FEUILLE DE TEMPS (JOUR / MOIS / ANNÉE) */}
      {isTimesheetOpen && (
        <TimesheetModal
          isOpen={isTimesheetOpen}
          onClose={() => setIsTimesheetOpen(false)}
          employee={employee}
          allTasks={tasks}
          presences={presences}
          incidents={incidents}
          defaultMode={timesheetMode}
          currentUser={currentUser}
          currentRole={currentRole}
        />
      )}
    </div>
  );
};

export default EmployeeRendementPage;
