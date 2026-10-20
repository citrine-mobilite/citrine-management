import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Layers, 
  Flame, 
  TrendingUp, 
  Trophy, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Zap
} from 'lucide-react';
import { Task, TaskStatus } from '../../../types';

interface TaskWithMetrics extends Task {
  estimatedHours: number;
  dynamicProgress: number;
}

interface TaskTimePyramidProps {
  tasks: TaskWithMetrics[];
  onSelectTask?: (taskId: string) => void;
}

export const TaskTimePyramid: React.FC<TaskTimePyramidProps> = ({
  tasks,
  onSelectTask,
}) => {
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);

  // Trier les tâches de la plus chronophage (plus de temps) à la moins chronophage (moins de temps)
  const sortedByDuration = useMemo(() => {
    return [...tasks].sort((a, b) => b.estimatedHours - a.estimatedHours);
  }, [tasks]);

  const totalHours = useMemo(() => {
    return sortedByDuration.reduce((acc, t) => acc + t.estimatedHours, 0);
  }, [sortedByDuration]);

  const maxHours = useMemo(() => {
    return Math.max(...sortedByDuration.map((t) => t.estimatedHours), 1);
  }, [sortedByDuration]);

  const averageHours = useMemo(() => {
    if (sortedByDuration.length === 0) return 0;
    return Math.round((totalHours / sortedByDuration.length) * 10) / 10;
  }, [sortedByDuration, totalHours]);

  const topTask = sortedByDuration[0];
  const quickestTask = sortedByDuration[sortedByDuration.length - 1];

  // Helper pour badge de statut
  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Terminée
          </span>
        );
      case 'in_progress':
      case 'en_cours':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3 h-3" /> En cours
          </span>
        );
      case 'pending_validation':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
            En attente
          </span>
        );
      case 'blocked':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3 h-3" /> Bloquée
          </span>
        );
      case 'todo':
      case 'idea':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
            À faire
          </span>
        );
    }
  };

  // Gradient et couleur selon la strate pyramidale
  const getPyramidTierStyle = (hours: number, index: number, totalCount: number) => {
    const ratio = hours / maxHours;
    if (ratio >= 0.75) {
      return {
        wingGradient: 'from-emerald-600 via-[#2A7B76] to-emerald-600',
        wingGlow: 'hover:shadow-emerald-500/20',
        textColor: 'text-[#2A7B76]',
        label: 'Charge Lourde / Projet Clé',
      };
    }
    if (ratio >= 0.4) {
      return {
        wingGradient: 'from-teal-600 via-[#20635F] to-teal-600',
        wingGlow: 'hover:shadow-teal-500/20',
        textColor: 'text-teal-700',
        label: 'Charge Médiane',
      };
    }
    return {
      wingGradient: 'from-slate-500 via-stone-600 to-slate-500',
      wingGlow: 'hover:shadow-stone-500/20',
      textColor: 'text-stone-600',
      label: 'Tâche Rapide / Micro-action',
    };
  };

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-6">
      
      {/* En-tête de la pyramide */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-gradient-to-br from-[#2A7B76] to-emerald-800 text-white rounded-2xl shadow-sm">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-base text-stone-900">
                Pyramide du Temps Passé & Distribution des Charges
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-[#2A7B76] border border-emerald-200">
                Style Pyramide des Âges
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Tâches ordonnées de celle qui a demandé le plus de temps à celle qui en a demandé le moins.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono font-bold text-stone-600 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200">
            {sortedByDuration.length} tâche(s) au total
          </span>
        </div>
      </div>

      {/* Cartes de synthèse clés */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-200/80 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Charge Totale Cumulée
            </span>
            <div className="text-lg font-bold font-mono text-stone-900">{totalHours}h</div>
          </div>
          <div className="p-2 bg-emerald-50 text-[#2A7B76] rounded-xl border border-emerald-100">
            <Clock className="h-4 w-4" />
          </div>
        </div>

        <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-200/80 flex items-center justify-between">
          <div className="space-y-0.5 min-w-0 pr-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-600" />
              Sommet (Plus Chronophage)
            </span>
            <div className="text-xs font-bold text-stone-900 truncate" title={topTask?.title}>
              {topTask?.title || 'Aucune'}
            </div>
            <span className="text-[11px] font-mono text-emerald-700 font-bold">
              {topTask?.estimatedHours || 0}h ({totalHours > 0 ? Math.round(((topTask?.estimatedHours || 0) / totalHours) * 100) : 0}%)
            </span>
          </div>
          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shrink-0">
            <Trophy className="h-4 w-4" />
          </div>
        </div>

        <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-200/80 flex items-center justify-between">
          <div className="space-y-0.5 min-w-0 pr-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1">
              <Zap className="w-3 h-3 text-teal-600" />
              Base (Plus Rapide)
            </span>
            <div className="text-xs font-bold text-stone-900 truncate" title={quickestTask?.title}>
              {quickestTask?.title || 'Aucune'}
            </div>
            <span className="text-[11px] font-mono text-teal-700 font-bold">
              {quickestTask?.estimatedHours || 0}h (Moyenne : {averageHours}h)
            </span>
          </div>
          <div className="p-2 bg-teal-50 text-teal-600 rounded-xl border border-teal-100 shrink-0">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Guide visuel de lecture de la pyramide */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-stone-500 px-2 py-1 bg-stone-50 rounded-xl border border-stone-200/60">
        <span className="flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-[#2A7B76]" />
          <span>Axe vertical central : Les ailes s'étendent proportionnellement au temps passé (en heures)</span>
        </span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-semibold text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Charge Forte
          </span>
          <span className="flex items-center gap-1 font-semibold text-teal-700">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" /> Moyenne
          </span>
          <span className="flex items-center gap-1 font-semibold text-stone-600">
            <span className="w-2.5 h-2.5 rounded-full bg-stone-400 inline-block" /> Rapide
          </span>
        </div>
      </div>

      {/* Conteneur de la Pyramide des Tâches */}
      <div className="space-y-2.5 pt-2">
        {sortedByDuration.map((task, index) => {
          const hours = task.estimatedHours;
          const percentageOfTotal = totalHours > 0 ? Math.round((hours / totalHours) * 100) : 0;
          // Largeur de chaque demi-aile de la pyramide (de 10% à 95%)
          const wingWidth = Math.max(12, Math.round((hours / maxHours) * 95));
          const tierStyle = getPyramidTierStyle(hours, index, sortedByDuration.length);
          const isHovered = hoveredTaskId === task.id;

          return (
            <div
              key={task.id}
              onMouseEnter={() => setHoveredTaskId(task.id)}
              onMouseLeave={() => setHoveredTaskId(null)}
              onClick={() => onSelectTask?.(task.id)}
              className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                isHovered
                  ? 'bg-emerald-50/40 border-[#2A7B76] shadow-sm transform scale-[1.008]'
                  : 'bg-white hover:bg-stone-50/70 border-stone-200/80 shadow-3xs'
              }`}
              title="Cliquer pour afficher la tâche et ses sous-tâches détaillées"
            >
              {/* Ligne 1 : Titre, Rang, Statut et Heures */}
              <div className="flex items-center justify-between text-xs mb-2 gap-2">
                <div className="flex items-center gap-2 min-w-0 max-w-sm sm:max-w-md">
                  {/* Badge de rang */}
                  <span
                    className={`w-5 h-5 rounded-lg flex items-center justify-center font-mono font-bold text-[10px] shrink-0 ${
                      index === 0
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : index === 1
                        ? 'bg-stone-200 text-stone-800'
                        : index === 2
                        ? 'bg-amber-50 text-amber-800'
                        : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    #{index + 1}
                  </span>

                  <strong className="text-stone-900 font-bold truncate block">
                    {task.title}
                  </strong>

                  {task.isMilestone && (
                    <span className="bg-amber-100 text-amber-950 border border-amber-300 px-1.5 py-0.2 rounded-md text-[9px] font-bold shrink-0">
                      Jalon
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {getStatusBadge(task.status)}
                  <span className="font-mono font-bold text-xs text-stone-900 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-lg">
                    {hours}h
                  </span>
                  <span className="text-[10px] font-mono text-stone-400 hidden sm:inline">
                    ({percentageOfTotal}% du temps)
                  </span>
                </div>
              </div>

              {/* Ligne 2 : Structure Symétrique en Pyramide des Âges (Ailes Bilatérales Centrables) */}
              <div className="relative flex items-center justify-center h-5 w-full bg-stone-100/70 rounded-xl overflow-hidden px-2">
                {/* Ligne axiale centrale */}
                <div className="absolute inset-y-0 left-1/2 w-0.5 bg-stone-300/80 z-10" />

                {/* Aile Gauche (départ du centre vers la gauche) */}
                <div className="w-1/2 flex justify-end pr-0.5">
                  <div
                    className={`h-3 rounded-l-lg bg-gradient-to-l ${tierStyle.wingGradient} transition-all duration-500 shadow-2xs`}
                    style={{ width: `${wingWidth}%` }}
                  />
                </div>

                {/* Aile Droite (départ du centre vers la droite) */}
                <div className="w-1/2 flex justify-start pl-0.5">
                  <div
                    className={`h-3 rounded-r-lg bg-gradient-to-r ${tierStyle.wingGradient} transition-all duration-500 shadow-2xs`}
                    style={{ width: `${wingWidth}%` }}
                  />
                </div>

                {/* Étiquette d'avancement flottante au centre */}
                <span className="absolute z-20 text-[9px] font-mono font-bold text-white bg-black/40 px-2 py-0.2 rounded-full backdrop-blur-xs">
                  {task.dynamicProgress}% achevé
                </span>
              </div>

              {/* Ligne 3 : Détail des sous-tâches et progression */}
              <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1.5 px-0.5">
                <span>
                  {task.subtasks && task.subtasks.length > 0
                    ? `${task.subtasks.filter((s) => s.completed || s.status === 'completed').length}/${task.subtasks.length} sous-tâche(s)`
                    : 'Tâche unitaire'}
                </span>
                <span className="font-medium text-stone-500">
                  Progression réelle : <strong className="text-stone-700 font-bold">{task.dynamicProgress}%</strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskTimePyramid;
