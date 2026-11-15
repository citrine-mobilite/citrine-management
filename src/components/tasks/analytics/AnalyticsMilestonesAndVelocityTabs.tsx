import React from 'react';
import { Trophy, TrendingUp, Target, Layers, Zap } from 'lucide-react';
import { Task } from '../../../types';
import { WorkloadStatRow } from './rendementAnalyticsUtils';

interface AnalyticsMilestonesTabProps {
  milestones: Task[];
  completedMilestones: number;
}

export const AnalyticsMilestonesTab: React.FC<AnalyticsMilestonesTabProps> = ({
  milestones,
  completedMilestones,
}) => {
  return (
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
          const isCompleted =
            milestone.status === 'completed' || (milestone.milestoneProgress ?? 0) >= 100;
          const subtasks = milestone.subtasks || [];
          const completedSub = subtasks.filter((s) => s.completed).length;
          const progress =
            milestone.milestoneProgress ??
            (isCompleted
              ? 100
              : subtasks.length > 0
              ? Math.round((completedSub / subtasks.length) * 100)
              : 0);

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
            <div
              key={milestone.id}
              className="bg-stone-50/80 p-5 rounded-2xl border border-stone-200/90 space-y-3.5 shadow-2xs hover:shadow-md transition"
            >
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

              <div className="space-y-1">
                <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#2A7B76] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(progress, 5)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-stone-400 font-medium">
                  <span>Échéance : {milestone.date}</span>
                  <span>
                    {completedSub}/{subtasks.length} sous-tâches validées
                  </span>
                </div>
              </div>

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
  );
};

interface AnalyticsVelocityTabProps {
  filteredTasks: Task[];
  totalTasks: number;
  totalSubtasks: number;
  completedSubtasks: number;
  subtasksCompletionRate: number;
  workloadStats: WorkloadStatRow[];
  onTimeRate: number;
}

export const AnalyticsVelocityTab: React.FC<AnalyticsVelocityTabProps> = ({
  filteredTasks,
  totalTasks,
  totalSubtasks,
  completedSubtasks,
  subtasksCompletionRate,
  workloadStats,
  onTimeRate,
}) => {
  return (
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
        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
          <h4 className="font-bold text-xs text-stone-800 flex items-center gap-1.5">
            <Target className="h-4 w-4 text-[#2A7B76]" /> Répartition par Priorité
          </h4>
          <div className="space-y-2 text-xs">
            {[
              { label: 'Urgentes ⚡', count: filteredTasks.filter((t) => t.priority === 'urgent').length },
              { label: 'Hautes 🔴', count: filteredTasks.filter((t) => t.priority === 'high').length },
              { label: 'Moyennes 🟡', count: filteredTasks.filter((t) => t.priority === 'medium').length },
              { label: 'Basses 🟢', count: filteredTasks.filter((t) => t.priority === 'low').length },
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
  );
};
