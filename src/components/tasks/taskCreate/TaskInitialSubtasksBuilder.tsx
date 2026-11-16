import React, { useState } from 'react';
import { Plus, Trash2, Layers, Link2, CheckSquare } from 'lucide-react';
import {
  Employee,
  Subtask,
  Task,
  TaskPriority,
  TaskRecurrence,
  TaskStatus,
} from '../../../types';
import { SubtaskTimingAndStatusFields } from '../subtaskCreate/SubtaskTimingAndStatusFields';
import { AsanaRichFieldsPicker } from '../shared/AsanaRichFieldsPicker';

interface TaskInitialSubtasksBuilderProps {
  subtasks: Subtask[];
  showSubtaskForm: boolean;
  setShowSubtaskForm: (v: boolean) => void;
  defaultAssignee: string;
  defaultStartDate: string;
  defaultDueDate: string;
  availableEmployees: Employee[];
  existingTasks: Task[];
  onAddSubtask: (sub: Subtask) => void;
  onUpdateSubtaskDueDateInline: (index: number, updatedDate: string) => void;
  onRemoveSubtask: (idx: number) => void;
}

export const TaskInitialSubtasksBuilder: React.FC<TaskInitialSubtasksBuilderProps> = ({
  subtasks,
  showSubtaskForm,
  setShowSubtaskForm,
  defaultAssignee,
  defaultStartDate,
  defaultDueDate,
  availableEmployees,
  existingTasks,
  onAddSubtask,
  onUpdateSubtaskDueDateInline,
  onRemoveSubtask,
}) => {
  const todayIso = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [assignedTo, setAssignedTo] = useState(defaultAssignee || 'Équipe');
  const [startDate, setStartDate] = useState(defaultStartDate || todayIso);
  const [dueDate, setDueDate] = useState(defaultDueDate || todayIso);
  const [time, setTime] = useState('09:00');
  const [estimatedHours, setEstimatedHours] = useState<number>(2);
  const [actualHours, setActualHours] = useState<number>(0);
  const [tags, setTags] = useState<string[]>(['Exécution']);
  const [dependsOnIds, setDependsOnIds] = useState<string[]>([]);
  const [recurrence, setRecurrence] = useState<TaskRecurrence>('none');
  const [followerIds, setFollowerIds] = useState<string[]>([]);
  const [criteria, setCriteria] = useState<string[]>([]);

  const formattedDisplayDate = dueDate
    ? new Date(`${dueDate}T12:00:00`).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '';

  const handleAdd = () => {
    const clean = title.trim();
    if (!clean) return;
    const assignedEmp = availableEmployees.find((e) => e.name === assignedTo);
    const effectiveDue = dueDate || defaultDueDate || todayIso;

    const newSub: Subtask = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: clean,
      description: description.trim() || undefined,
      completed: status === 'completed',
      status,
      priority,
      assignedTo,
      employeeId: assignedEmp?.id,
      startDate: startDate || defaultStartDate || todayIso,
      dueDate: effectiveDue,
      endDate: effectiveDue,
      time: time || '09:00',
      estimatedHours: Number(estimatedHours) || 0,
      actualHours: Number(actualHours) || 0,
      tags: tags.length > 0 ? tags : undefined,
      dependsOnIds: dependsOnIds.length > 0 ? dependsOnIds : undefined,
      recurrence,
      followerIds: followerIds.length > 0 ? followerIds : undefined,
      acceptanceCriteria: criteria.length > 0 ? criteria : undefined,
      subtasks: [],
      createdAt: new Date().toISOString(),
      completedAt: status === 'completed' ? new Date().toISOString() : undefined,
    };

    onAddSubtask(newSub);
    setTitle('');
    setDescription('');
    setPriority('medium');
    setStatus('todo');
    setEstimatedHours(2);
    setActualHours(0);
    setTags(['Exécution']);
    setDependsOnIds([]);
    setRecurrence('none');
    setFollowerIds([]);
    setCriteria([]);
  };

  return (
    <div className="bg-stone-50/80 p-3.5 rounded-2xl border border-stone-200 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
          <Layers className="h-4 w-4 text-[#2A7B76]" />
          Sous-tâches d&apos;évolution ({subtasks.length})
        </span>
        <button
          type="button"
          onClick={() => setShowSubtaskForm(!showSubtaskForm)}
          className="text-[11px] font-bold text-[#2A7B76] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>{showSubtaskForm ? 'Masquer' : '+ Ajouter des sous-tâches complètes'}</span>
        </button>
      </div>

      {subtasks.length > 0 && (
        <div className="space-y-1.5">
          {subtasks.map((sub, i) => (
            <div
              key={sub.id || i}
              className="flex flex-col sm:flex-row sm:items-center justify-between bg-white px-3 py-2 rounded-xl border border-stone-200 text-xs gap-1.5"
            >
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <span className="w-2 h-2 rounded-full bg-[#2A7B76] shrink-0" />
                <strong className="text-stone-800 truncate">{sub.title}</strong>
                {(sub.tags || []).map((t) => (
                  <span
                    key={t}
                    className="px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 text-[10px] font-medium text-stone-600 shrink-0"
                  >
                    {t}
                  </span>
                ))}
                {sub.acceptanceCriteria && sub.acceptanceCriteria.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] font-medium text-[#2A7B76] shrink-0">
                    ✓ {sub.acceptanceCriteria.length} critère{sub.acceptanceCriteria.length > 1 ? 's' : ''}
                  </span>
                )}
                {sub.dependsOnIds && sub.dependsOnIds.length > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 font-semibold shrink-0">
                    <Link2 className="h-3 w-3" />
                    {sub.dependsOnIds.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] flex-wrap justify-end">
                <label
                  className="flex items-center gap-1 bg-stone-50 border border-stone-200 px-1.5 py-0.5 rounded-md"
                  title="Date d'échéance propre à cette sous-tâche"
                >
                  <span className="text-[9px] text-stone-500 font-semibold">Fin :</span>
                  <input
                    type="date"
                    value={sub.dueDate || ''}
                    onChange={(e) => onUpdateSubtaskDueDateInline(i, e.target.value)}
                    className="font-mono font-bold text-stone-800 bg-transparent outline-none cursor-pointer text-[10px]"
                  />
                </label>
                <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-medium">
                  {sub.assignedTo}
                </span>
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-mono font-bold">
                  {sub.actualHours || 0}h/{sub.estimatedHours || 0}h
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveSubtask(i)}
                  className="text-stone-400 hover:text-rose-600 p-0.5 transition cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showSubtaskForm && (
        <div className="p-3.5 bg-white rounded-2xl border border-stone-200 space-y-3 animate-in fade-in">
          <div className="space-y-1">
            <label className="block font-bold text-stone-700 text-[11px]">
              Intitulé de la sous-tâche *
            </label>
            <input
              type="text"
              placeholder="Intitulé de la sous-tâche (mêmes attributs qu'une tâche)..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-semibold outline-none focus:bg-white focus:ring-1 focus:ring-[#2A7B76]"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-stone-700 text-[11px]">
              Description &amp; Spécifications
            </label>
            <textarea
              rows={2}
              placeholder="Instructions, livrable attendu ou contexte d'avancement..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-[#2A7B76] resize-none"
            />
          </div>

          <SubtaskTimingAndStatusFields
            priority={priority}
            setPriority={setPriority}
            status={status}
            setStatus={setStatus}
            myName={defaultAssignee}
            assignedTo={assignedTo}
            setAssignedTo={setAssignedTo}
            employees={availableEmployees}
            startDate={startDate}
            setStartDate={setStartDate}
            dueDate={dueDate}
            setDueDate={setDueDate}
            time={time}
            setTime={setTime}
            formattedDisplayDate={formattedDisplayDate}
          />

          <AsanaRichFieldsPicker
            estimatedHours={estimatedHours}
            setEstimatedHours={setEstimatedHours}
            actualHours={actualHours}
            setActualHours={setActualHours}
            tags={tags}
            setTags={setTags}
            dependsOnIds={dependsOnIds}
            setDependsOnIds={setDependsOnIds}
            existingTasks={existingTasks}
            recurrence={recurrence}
            setRecurrence={setRecurrence}
            followerIds={followerIds}
            setFollowerIds={setFollowerIds}
            employees={availableEmployees}
            criteria={criteria}
            setCriteria={setCriteria}
          />

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleAdd}
              className="px-4 py-2 bg-[#2A7B76] text-white rounded-xl text-xs font-bold hover:bg-[#20635F] cursor-pointer flex items-center gap-1.5"
            >
              <CheckSquare className="h-3.5 w-3.5" />
              <span>Ajouter cette sous-tâche à la tâche</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
