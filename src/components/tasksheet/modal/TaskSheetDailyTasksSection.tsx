import React, { FormEvent } from 'react';
import { Clock, ShieldCheck, Bell, Flag, Plus, Trash2, CheckCircle2, Zap, MapPin } from 'lucide-react';
import { DailyTaskSheetData } from '../../../services/taskSheetService';

interface TaskSheetDailyTasksSectionProps {
  dailyData: DailyTaskSheetData;
  isAddingMovement?: boolean;
  onToggleAddingMovement?: (force?: boolean) => void;
  newMovementTitle?: string;
  onChangeNewMovementTitle?: (v: string) => void;
  newMovementTime?: string;
  onChangeNewMovementTime?: (v: string) => void;
  newMovementDuration?: number;
  onChangeNewMovementDuration?: (v: number) => void;
  newMovementCategory?: string;
  onChangeNewMovementCategory?: (v: string) => void;
  newMovementLocation?: string;
  onChangeNewMovementLocation?: (v: string) => void;
  newMovementNote?: string;
  onChangeNewMovementNote?: (v: string) => void;
  onSubmitMovement?: (e: FormEvent) => void;
  onToggleMovementStatus?: (id: string) => void;
  onDeleteMovement?: (id: string) => void;
}

export const TaskSheetDailyTasksSection: React.FC<TaskSheetDailyTasksSectionProps> = ({
  dailyData,
  isAddingMovement = false,
  onToggleAddingMovement,
  newMovementTitle = '',
  onChangeNewMovementTitle,
  newMovementTime = '10:30',
  onChangeNewMovementTime,
  newMovementDuration = 15,
  onChangeNewMovementDuration,
  newMovementCategory = 'terrain',
  onChangeNewMovementCategory,
  newMovementLocation = '',
  onChangeNewMovementLocation,
  newMovementNote = '',
  onChangeNewMovementNote,
  onSubmitMovement,
  onToggleMovementStatus,
  onDeleteMovement,
}) => {
  const importantPoints = dailyData.importantPoints || [];
  const pointsSummary = dailyData.importantPointsSummary || {
    total: importantPoints.length,
    alertsCount: importantPoints.filter((p) => p.category === 'alerte').length,
    remindersCount: importantPoints.filter((p) => p.category === 'rappel').length,
    movementsCount: importantPoints.filter((p) => p.category === 'mouvement').length,
    totalMinutes: importantPoints.reduce((s, p) => s + (p.durationMinutes || 0), 0),
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-200 border border-stone-200 rounded-2xl bg-white overflow-hidden">
        <div className="p-3">
          <span className="text-[11px] font-semibold text-stone-500 block">Assiduité</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <strong className="text-stone-900 text-xs font-bold">
              {dailyData.presenceIncidents && dailyData.presenceIncidents.length > 0
                ? 'Avec remarques'
                : 'Conforme (100%)'}
            </strong>
          </div>
        </div>

        <div className="p-3">
          <span className="text-[11px] font-semibold text-stone-500 block">Rendement Tâches</span>
          <div className="flex items-center gap-1.5 mt-0.5 tabular-nums">
            <Clock className="w-4 h-4 text-[#2A7B76] shrink-0" />
            <strong className="text-stone-900 text-sm font-bold">
              {dailyData.completedTasks}/{dailyData.totalTasks} ({dailyData.ratePercentage}%)
            </strong>
          </div>
        </div>

        <div className="p-3">
          <span className="text-[11px] font-semibold text-stone-500 block">Points Importants</span>
          <div className="flex items-center gap-1.5 mt-0.5 tabular-nums">
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <strong className="text-stone-900 text-sm font-bold">
              {pointsSummary.total} pt{pointsSummary.total > 1 ? 's' : ''} ({pointsSummary.totalMinutes} min)
            </strong>
          </div>
        </div>

        <div className="p-3">
          <span className="text-[11px] font-semibold text-stone-500 block">Charge Planifiée</span>
          <strong
            className={`text-sm font-bold block mt-0.5 tabular-nums ${
              dailyData.capacity.capacityStatus === 'overloaded' ? 'text-rose-700' : 'text-[#164e4b]'
            }`}
          >
            {Math.round(dailyData.capacity.plannedMinutes / 60)}h / 12h max
          </strong>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 overflow-hidden bg-white">
        <div className="bg-[#164e4b] text-white px-4 py-2.5 font-bold text-xs flex items-center justify-between">
          <span>Priorités du Jour</span>
          <span className="text-[11px] text-emerald-200 font-mono tabular-nums">
            {dailyData.topPriorities.length}
          </span>
        </div>
        <div className="divide-y divide-stone-200">
          {dailyData.topPriorities.map((p, idx) => (
            <div key={p.id || idx} className="p-2.5 flex items-center justify-between bg-white text-xs hover:bg-stone-50 transition">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-bold text-stone-400 w-4 text-center tabular-nums">{idx + 1}.</span>
                <span className="font-bold text-stone-900 truncate">{p.title}</span>
                {p.isMilestone && (
                  <span className="text-[10px] font-bold text-amber-700 shrink-0">· Jalon</span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-stone-500 uppercase font-mono font-semibold">{p.priority}</span>
                <span
                  className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                    p.status === 'Fait' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {p.status}
                </span>
              </div>
            </div>
          ))}
          {dailyData.topPriorities.length === 0 && (
            <div className="p-3 text-center text-stone-400 italic bg-stone-50 text-xs">
              Aucune priorité formelle enregistrée pour cette journée.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 overflow-hidden bg-white">
        <div className="bg-[#164e4b] text-white px-4 py-2.5 font-bold text-xs flex items-center justify-between">
          <span>Tâches du Jour</span>
          <span className="text-[11px] text-emerald-200 font-mono tabular-nums">
            {dailyData.completedTasks}/{dailyData.totalTasks} ({dailyData.ratePercentage}%)
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs tabular-nums">
            <thead className="bg-[#2A7B76] text-white font-bold text-[11px]">
              <tr>
                <th className="py-2 px-3">Sous-Tâche</th>
                <th className="py-2 px-3">Mission Parente</th>
                <th className="py-2 px-2 text-center w-12">Prio</th>
                <th className="py-2 px-3 text-right w-24">Estimé</th>
                <th className="py-2 px-3 text-center w-24">Échéance</th>
                <th className="py-2 px-3 text-center w-24">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {dailyData.tasks.map((t, idx) => (
                <tr key={idx} className="hover:bg-stone-50 transition">
                  <td className="py-2 px-3 font-semibold text-stone-900">{t.title}</td>
                  <td className="py-2 px-3 text-stone-600">
                    <span className="truncate block max-w-xs">{t.parentTaskTitle}</span>
                  </td>
                  <td
                    className={`py-2 px-2 text-center font-bold text-[11px] ${
                      t.priorityLabel === 'P1'
                        ? 'text-rose-600'
                        : t.priorityLabel === 'P2'
                        ? 'text-blue-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {t.priorityLabel}
                  </td>
                  <td className="py-2 px-3 text-right font-mono">{t.estimatedMinutes} min</td>
                  <td className="py-2 px-3 text-center font-mono text-[11px] text-stone-500">{t.dueDate}</td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        t.status === 'Fait' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
              {dailyData.tasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-stone-400 italic bg-stone-50">
                    Aucune sous-tâche formelle en cours ni terminée ce jour.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-[#164e4b] text-white font-bold text-xs">
              <tr>
                <td colSpan={2} className="py-2 px-3">Total (Tâches uniquement)</td>
                <td className="py-2 px-2 text-center">{dailyData.totalTasks}</td>
                <td className="py-2 px-3 text-right">{dailyData.completedTasks} fait</td>
                <td className="py-2 px-3 text-center">{dailyData.ratePercentage}%</td>
                <td className="py-2 px-3 text-center">{dailyData.postponedCount} à suivre</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Points Importants (Alertes, Rappels & Petits mouvements) — Hors tâches */}
      <div className="rounded-2xl border border-amber-200 overflow-hidden bg-white">
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Bell className="w-4 h-4 text-amber-700 shrink-0" />
            <div>
              <div className="font-bold text-xs text-amber-950">
                Points Importants (Alertes, Rappels &amp; Petits mouvements) — Hors tâches
              </div>
              <div className="text-[10.5px] text-amber-800/80">
                Non comptabilisés comme tâches · {pointsSummary.alertsCount} alerte(s), {pointsSummary.remindersCount} rappel(s), {pointsSummary.movementsCount} petit(s) mouvement(s) · {pointsSummary.totalMinutes} min
              </div>
            </div>
          </div>

          {onToggleAddingMovement && (
            <button
              type="button"
              onClick={() => onToggleAddingMovement()}
              className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingMovement ? 'Fermer' : 'Petit mouvement'}</span>
            </button>
          )}
        </div>

        {isAddingMovement && onSubmitMovement && (
          <form
            onSubmit={onSubmitMovement}
            className="p-3.5 bg-amber-50/40 border-b border-amber-200 space-y-2.5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input
                type="text"
                required
                value={newMovementTitle}
                onChange={(e) => onChangeNewMovementTitle?.(e.target.value)}
                placeholder="Ex: Dépôt courrier banque / Accueil client / Vérification véhicule..."
                className="sm:col-span-6 px-3 py-1.5 bg-white border border-amber-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <input
                type="time"
                value={newMovementTime}
                onChange={(e) => onChangeNewMovementTime?.(e.target.value)}
                className="sm:col-span-2 px-2.5 py-1.5 bg-white border border-amber-200 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <div className="sm:col-span-2 flex items-center gap-1 bg-white border border-amber-200 rounded-xl px-2">
                <input
                  type="number"
                  min={5}
                  max={480}
                  step={5}
                  value={newMovementDuration}
                  onChange={(e) => onChangeNewMovementDuration?.(Number(e.target.value) || 15)}
                  className="w-full py-1.5 text-xs font-mono text-stone-900 focus:outline-none"
                />
                <span className="text-[10px] text-stone-500">min</span>
              </div>
              <select
                value={newMovementCategory}
                onChange={(e) => onChangeNewMovementCategory?.(e.target.value)}
                className="sm:col-span-2 px-2 py-1.5 bg-white border border-amber-200 rounded-xl text-xs text-stone-800 focus:outline-none"
              >
                <option value="terrain">Terrain</option>
                <option value="course">Course</option>
                <option value="liaison">Liaison</option>
                <option value="support">Support</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
              <input
                type="text"
                value={newMovementLocation}
                onChange={(e) => onChangeNewMovementLocation?.(e.target.value)}
                placeholder="Lieu (optionnel)"
                className="sm:col-span-4 px-3 py-1.5 bg-white border border-amber-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none"
              />
              <input
                type="text"
                value={newMovementNote}
                onChange={(e) => onChangeNewMovementNote?.(e.target.value)}
                placeholder="Détail / précision (optionnel)"
                className="sm:col-span-6 px-3 py-1.5 bg-white border border-amber-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none"
              />
              <button
                type="submit"
                className="sm:col-span-2 px-3 py-1.5 bg-[#164e4b] hover:bg-[#113d3a] text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Enregistrer
              </button>
            </div>
          </form>
        )}

        <div className="divide-y divide-stone-100">
          {importantPoints.map((pt) => {
            const catClass =
              pt.category === 'alerte'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : pt.category === 'mouvement'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-indigo-50 text-indigo-800 border-indigo-200';

            return (
              <div
                key={pt.id}
                className="p-2.5 px-3.5 flex items-center justify-between gap-2 text-xs hover:bg-amber-50/20"
              >
                <div className="min-w-0 flex items-center gap-2.5">
                  <span className={`px-2 py-0.5 rounded-md border font-bold text-[10px] shrink-0 ${catClass}`}>
                    {pt.categoryLabel}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold text-stone-900 truncate">{pt.title}</div>
                    <div className="text-[11px] text-stone-500 font-mono flex flex-wrap items-center gap-x-2">
                      <span>{pt.time} · {pt.durationMinutes} min</span>
                      {pt.location && (
                        <span className="inline-flex items-center gap-0.5 font-sans">
                          <MapPin className="w-3 h-3 text-stone-400" />
                          {pt.location}
                        </span>
                      )}
                      {pt.detail && <span className="font-sans text-stone-500 truncate max-w-xs">· {pt.detail}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {pt.isQuickMovement && onToggleMovementStatus ? (
                    <button
                      type="button"
                      onClick={() => onToggleMovementStatus(pt.id)}
                      title="Basculer l'état de ce petit mouvement"
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer transition ${
                        pt.isResolved
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{pt.statusLabel}</span>
                    </button>
                  ) : (
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        pt.isResolved
                          ? 'bg-emerald-100 text-emerald-800'
                          : pt.isOverdue
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {pt.statusLabel}
                    </span>
                  )}

                  {pt.isQuickMovement && onDeleteMovement && (
                    <button
                      type="button"
                      onClick={() => onDeleteMovement(pt.id)}
                      title="Supprimer ce petit mouvement"
                      className="p-1 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {importantPoints.length === 0 && (
            <div className="p-4 text-center text-stone-400 italic text-xs bg-stone-50/60">
              Aucune alerte, rappel ou petit mouvement enregistré pour ce jour.
            </div>
          )}
        </div>
      </div>

      {dailyData.projectMilestones && dailyData.projectMilestones.length > 0 && (
        <div className="rounded-2xl border border-stone-200 overflow-hidden bg-white">
          <div className="bg-[#164e4b] text-white px-4 py-2.5 font-bold text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5 text-amber-300" />
              <span>Jalons Projets Suivis</span>
            </span>
            <span className="text-[11px] text-emerald-200 font-mono tabular-nums">
              {dailyData.projectMilestones.filter((m) => m.isDone).length}/{dailyData.projectMilestones.length}
            </span>
          </div>
          <div className="divide-y divide-stone-100">
            {dailyData.projectMilestones.map((m) => (
              <div key={m.milestoneId} className="p-2.5 flex items-center justify-between gap-2 text-xs hover:bg-stone-50">
                <div className="min-w-0">
                  <div className="font-bold text-stone-900 truncate">{m.title}</div>
                  <div className="text-[11px] text-stone-500 truncate">
                    {m.projectName}{m.targetDate ? ` · Éch. ${m.targetDate}` : ''}
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md font-bold text-[10px] shrink-0 ${
                    m.isDone
                      ? 'bg-emerald-100 text-emerald-800'
                      : m.isBlocked
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-teal-50 text-[#164e4b]'
                  }`}
                >
                  {m.isDone ? 'Franchi' : m.isBlocked ? 'Bloqué' : 'En cours'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
