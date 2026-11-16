import React, { useMemo, useState } from 'react';
import { CopyCheck, EyeOff, GitMerge, AlertTriangle } from 'lucide-react';
import { Employee, Task } from '../../../types';
import {
  detectEmployeeRedundancies,
  RedundancyCluster,
  RedundantItemRef,
} from '../../../services/taskRedundancyService';
import { taskService } from '../../../services/taskService';
import { executeOperationWithLoading } from '../../../utils/sweetAlert';

interface TaskRedundancyPanelProps {
  employee: Employee;
  tasks: Task[];
  onUpdateTask?: (updatedTask: Task) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'completed':
      return 'Terminée';
    case 'in_progress':
    case 'en_cours':
      return 'En cours';
    case 'blocked':
      return 'Bloquée';
    default:
      return 'À faire';
  }
}

export const TaskRedundancyPanel: React.FC<TaskRedundancyPanelProps> = ({
  employee,
  tasks,
  onUpdateTask,
  showToast,
}) => {
  const [hiddenClusterIds, setHiddenClusterIds] = useState<string[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const clusters = useMemo(() => {
    const detected = detectEmployeeRedundancies(tasks, employee);
    return detected.filter((c) => !hiddenClusterIds.includes(c.clusterId));
  }, [tasks, employee, hiddenClusterIds]);

  const handleIgnoreCluster = async (cluster: RedundancyCluster) => {
    setBusyId(cluster.clusterId);
    await executeOperationWithLoading({
      loadingTitle: 'Mise à jour des tâches...',
      loadingText: 'Enregistrement de la décision, veuillez patienter...',
      action: async () => {
        const uids = cluster.items.map((it) => it.uid);
        const impactedTaskIds = Array.from(new Set(cluster.items.map((it) => it.taskId)));

        for (const taskId of impactedTaskIds) {
          const task = tasks.find((t) => t.id === taskId);
          if (!task) continue;
          const existingIgnored = new Set(task.ignoredDuplicateIds || []);
          uids.forEach((u) => {
            if (u !== `task:${task.id}`) existingIgnored.add(u);
          });

          const updatedSubs = (task.subtasks || []).map((s) => {
            const isInCluster = cluster.items.some((it) => it.subtaskId === s.id);
            if (!isInCluster) return s;
            const subIgnored = new Set(s.ignoredDuplicateIds || []);
            uids.forEach((u) => {
              if (u !== `sub:${task.id}:${s.id}`) subIgnored.add(u);
            });
            return { ...s, ignoredDuplicateIds: Array.from(subIgnored) };
          });

          const updatedTask: Task = {
            ...task,
            ignoredDuplicateIds: Array.from(existingIgnored),
            subtasks: updatedSubs,
            lastUpdatedTime: new Date().toISOString(),
          };

          await taskService.saveTask(updatedTask);
          if (onUpdateTask) onUpdateTask(updatedTask);
        }

        setHiddenClusterIds((prev) => [...prev, cluster.clusterId]);
      },
      successTitle: 'Doublon ignoré !',
      successMessage: "L'alerte de redondance a été marquée comme ignorée.",
      errorMessage: "Impossible d'ignorer le doublon.",
    });
    setBusyId(null);
  };

  const handleMergeTasks = async (cluster: RedundancyCluster) => {
    const taskRefs = cluster.items.filter((it) => it.kind === 'task');
    if (taskRefs.length < 2) return;

    setBusyId(cluster.clusterId);
    let mergedTitle = '';
    await executeOperationWithLoading({
      loadingTitle: 'Fusion des tâches...',
      loadingText: 'Regroupement des tâches et sous-tâches, veuillez patienter...',
      action: async () => {
        const primaryRef: RedundantItemRef = taskRefs[0];
        const secondaryRefs = taskRefs.slice(1);
        const primaryTask = tasks.find((t) => t.id === primaryRef.taskId);
        if (!primaryTask) return;
        mergedTitle = primaryTask.title;

        const mergedSubtasks = [...(primaryTask.subtasks || [])];
        let addedActualHours = Number(primaryTask.actualHours) || 0;
        let addedEstimatedHours = Number(primaryTask.estimatedHours) || 0;

        for (const secRef of secondaryRefs) {
          const secTask = tasks.find((t) => t.id === secRef.taskId);
          if (!secTask || secTask.id === primaryTask.id) continue;

          addedActualHours += Number(secTask.actualHours) || 0;
          addedEstimatedHours += Number(secTask.estimatedHours) || 0;

          if (Array.isArray(secTask.subtasks)) {
            secTask.subtasks.forEach((sub) => {
              const exists = mergedSubtasks.some(
                (m) => m.title.trim().toLowerCase() === sub.title.trim().toLowerCase()
              );
              if (!exists) mergedSubtasks.push(sub);
            });
          }

          const archivedSecondary: Task = {
            ...secTask,
            mergedIntoTaskId: primaryTask.id,
            status: 'completed',
            lastUpdatedTime: new Date().toISOString(),
          };
          await taskService.saveTask(archivedSecondary);
          if (onUpdateTask) onUpdateTask(archivedSecondary);
        }

        const updatedPrimary: Task = {
          ...primaryTask,
          subtasks: mergedSubtasks,
          actualHours: Math.round(addedActualHours * 10) / 10,
          estimatedHours: Math.round(addedEstimatedHours * 10) / 10,
          lastUpdatedTime: new Date().toISOString(),
        };
        await taskService.saveTask(updatedPrimary);
        if (onUpdateTask) onUpdateTask(updatedPrimary);

        setHiddenClusterIds((prev) => [...prev, cluster.clusterId]);
      },
      successTitle: 'Tâches fusionnées !',
      successMessage: `Les tâches ont été fusionnées dans "${mergedTitle || 'la tâche principale'}".`,
      errorMessage: 'Erreur lors de la fusion des tâches.',
    });
    setBusyId(null);
  };

  if (clusters.length === 0) {
    return (
      <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-900">
        <CopyCheck className="h-4 w-4 text-emerald-600 shrink-0" />
        <span className="font-semibold">Aucune redondance détectée sur les tâches et sous-tâches actives.</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-amber-200/90 overflow-hidden">
      <div className="bg-amber-50/90 px-4 py-3 border-b border-amber-200/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <h4 className="font-serif font-bold text-xs text-stone-900">
            Redondances Détectées ({clusters.length})
          </h4>
        </div>
        <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-lg">
          Tâches &amp; Sous-tâches
        </span>
      </div>

      <div className="divide-y divide-stone-100">
        {clusters.map((cluster) => {
          const canMerge = cluster.items.filter((it) => it.kind === 'task').length >= 2;
          const isBusy = busyId === cluster.clusterId;

          return (
            <div key={cluster.clusterId} className="p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-bold text-[10px] tabular-nums">
                    {cluster.maxSimilarity}% similaire
                  </span>
                  <span className="text-xs font-bold text-stone-800">{cluster.reasonLabel}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {canMerge && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleMergeTasks(cluster)}
                      className="px-2.5 py-1 rounded-lg bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold text-[11px] inline-flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                    >
                      <GitMerge className="h-3 w-3" />
                      <span>Fusionner</span>
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleIgnoreCluster(cluster)}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-[11px] inline-flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                  >
                    <EyeOff className="h-3 w-3" />
                    <span>Ignorer</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                {cluster.items.map((it) => (
                  <div
                    key={it.uid}
                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200/70 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-stone-200 text-stone-700">
                          {it.kind === 'subtask' ? 'Sous-tâche' : 'Tâche'}
                        </span>
                        <span className="font-semibold text-stone-900 truncate">{it.title}</span>
                      </div>
                      {it.parentTaskTitle && (
                        <div className="text-[10px] text-stone-500 mt-0.5 truncate">
                          Parent : {it.parentTaskTitle}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-mono text-stone-600 shrink-0 tabular-nums">
                      {it.date && <span>{it.date}</span>}
                      <span className="px-1.5 py-0.5 rounded bg-white border border-stone-200 font-sans font-bold text-stone-700">
                        {getStatusLabel(it.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskRedundancyPanel;
