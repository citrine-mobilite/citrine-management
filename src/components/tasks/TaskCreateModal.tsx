import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import {
  Task,
  Employee,
  TaskStatus,
  TaskPriority,
  TaskProject,
  AppUser,
  Subtask,
  TaskRecurrence,
} from '../../types';
import { isSelfOnlyUser } from '../../utils/roleUtils';
import { TaskAssigneeAndMetadataFields } from './taskCreate/TaskAssigneeAndMetadataFields';
import { TaskInitialSubtasksBuilder } from './taskCreate/TaskInitialSubtasksBuilder';
import { AsanaRichFieldsPicker } from './shared/AsanaRichFieldsPicker';
import { findPotentialDuplicatesForInput } from '../../services/taskRedundancyService';
import { RedundancyWarningBanner } from './RedundancyWarningBanner';
import { resolveProjectSections } from './logic/asanaTreeEngine';

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (taskData: Omit<Task, 'id' | 'comments' | 'incidents'> & { subtasks?: Subtask[] }) => void;
  employees: Employee[];
  projects: TaskProject[];
  defaultProjectId?: string;
  defaultStatus?: TaskStatus;
  currentRole?: string;
  currentUser?: AppUser | null;
  existingTasks?: Task[];
}

export const TaskCreateModal: React.FC<TaskCreateModalProps> = ({
  isOpen,
  onClose,
  onCreateTask,
  employees,
  projects,
  defaultProjectId = '',
  defaultStatus = 'todo',
  currentRole,
  currentUser,
  existingTasks = [],
}) => {
  const isEmpOrIntern = isSelfOnlyUser(currentUser, currentRole);
  const myName = currentUser?.name || employees[0]?.name || 'Moi';
  const todayIso = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId !== 'all' ? defaultProjectId : '');
  const [sectionId, setSectionId] = useState('sec_todo');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignedList, setAssignedList] = useState<string[]>(isEmpOrIntern ? [myName] : ['Équipe']);
  const [startDate, setStartDate] = useState(todayIso);
  const [date, setDate] = useState(todayIso);
  const [time, setTime] = useState('09:00');

  // Champs complets Asana
  const [estimatedHours, setEstimatedHours] = useState<number>(2);
  const [actualHours, setActualHours] = useState<number>(0);
  const [tags, setTags] = useState<string[]>([]);
  const [dependsOnIds, setDependsOnIds] = useState<string[]>([]);
  const [recurrence, setRecurrence] = useState<TaskRecurrence>('none');
  const [followerIds, setFollowerIds] = useState<string[]>([]);
  const [criteria, setCriteria] = useState<string[]>([]);

  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);

  const selectedProj = useMemo(
    () => projects.find((p) => p.id === projectId),
    [projects, projectId]
  );
  const projectSections = useMemo(
    () => resolveProjectSections(selectedProj),
    [selectedProj]
  );

  useEffect(() => {
    setStatus(defaultStatus);
  }, [defaultStatus]);

  useEffect(() => {
    if (defaultProjectId && defaultProjectId !== 'all') {
      setProjectId(defaultProjectId);
    }
  }, [defaultProjectId]);

  useEffect(() => {
    if (!projectSections.some((s) => s.id === sectionId)) {
      setSectionId(projectSections[0]?.id || 'sec_todo');
    }
  }, [projectSections, sectionId]);

  useEffect(() => {
    if (isEmpOrIntern && assignedList.length === 0) {
      setAssignedList([myName]);
    }
  }, [isEmpOrIntern, myName, assignedList.length]);

  const potentialDuplicates = useMemo(
    () => findPotentialDuplicatesForInput(title, existingTasks, assignedList),
    [title, existingTasks, assignedList]
  );

  if (!isOpen) return null;

  const availableEmployees =
    selectedProj && selectedProj.memberIds && selectedProj.memberIds.length > 0
      ? employees.filter((e) => selectedProj.memberIds!.includes(e.id))
      : employees;

  const handleAddSubtask = (newSub: Subtask) => {
    setSubtasks([newSub, ...subtasks]);
  };

  const handleUpdateSubtaskDueDateInline = (index: number, updatedDate: string) => {
    const updated = [...subtasks];
    if (updated[index]) {
      updated[index] = { ...updated[index], dueDate: updatedDate, endDate: updatedDate };
      setSubtasks(updated);
    }
  };

  const handleRemoveSubtask = (idx: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalAssigned =
      assignedList.length > 0 ? assignedList.join(', ') : myName || 'Équipe';
    const primaryEmp = employees.find((emp) => emp.name === assignedList[0]);

    onCreateTask({
      title: title.trim(),
      description: description.trim(),
      startDate: startDate || date,
      date,
      dueDate: date,
      time: time || '09:00',
      priority,
      status,
      assignedTo: finalAssigned,
      employeeId: primaryEmp?.id,
      projectId: projectId || undefined,
      sectionId: sectionId || projectSections[0]?.id || 'sec_todo',
      estimatedHours: Number(estimatedHours) || 0,
      actualHours: Number(actualHours) || 0,
      tags: tags.length > 0 ? tags : undefined,
      dependsOnIds: dependsOnIds.length > 0 ? dependsOnIds : undefined,
      recurrence,
      followerIds: followerIds.length > 0 ? followerIds : undefined,
      acceptanceCriteria: criteria.length > 0 ? criteria : undefined,
      reminderPeriod: 'none',
      subtasks,
    });

    setTitle('');
    setDescription('');
    setSubtasks([]);
    setTags([]);
    setDependsOnIds([]);
    setFollowerIds([]);
    setCriteria([]);
    setEstimatedHours(2);
    setActualHours(0);
    setRecurrence('none');
    onClose();
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      className="fixed inset-0 z-[60] bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto max-h-[94vh]"
      >
        <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div>
            <h3 className="font-serif font-bold text-base text-stone-900">Créer une nouvelle tâche</h3>
            <p className="text-[11px] text-stone-500">
              Cadre / Job description dont l&apos;évolution sera suivie via ses sous-tâches
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200 text-stone-500 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          <div>
            <label className="block font-bold text-stone-700 mb-1">Titre de la tâche *</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ex: Rédiger le compte-rendu hebdomadaire, Préparer l'audit..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none text-stone-900 font-semibold"
            />
          </div>

          <RedundancyWarningBanner matches={potentialDuplicates} />

          <div>
            <label className="block font-bold text-stone-700 mb-1">
              Description &amp; Consignes (Job description)
            </label>
            <textarea
              rows={2}
              placeholder="Détails, spécifications, livrables attendus..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none"
            />
          </div>

          <TaskAssigneeAndMetadataFields
            startDate={startDate}
            setStartDate={setStartDate}
            date={date}
            setDate={setDate}
            time={time}
            setTime={setTime}
            projectId={projectId}
            setProjectId={setProjectId}
            projects={projects}
            sectionId={sectionId}
            setSectionId={setSectionId}
            sections={projectSections}
            status={status}
            setStatus={setStatus}
            priority={priority}
            setPriority={setPriority}
            currentUser={currentUser}
            assignedList={assignedList}
            setAssignedList={setAssignedList}
            availableEmployees={availableEmployees}
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

          <TaskInitialSubtasksBuilder
            subtasks={subtasks}
            showSubtaskForm={showSubtaskForm}
            setShowSubtaskForm={setShowSubtaskForm}
            defaultAssignee={isEmpOrIntern ? myName : assignedList[0] || 'Équipe'}
            defaultStartDate={startDate}
            defaultDueDate={date}
            availableEmployees={availableEmployees}
            existingTasks={existingTasks}
            onAddSubtask={handleAddSubtask}
            onUpdateSubtaskDueDateInline={handleUpdateSubtaskDueDateInline}
            onRemoveSubtask={handleRemoveSubtask}
          />

          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 font-bold transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="bg-[#2A7B76] hover:bg-[#23635f] text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer flex items-center gap-2 active:scale-98"
            >
              Créer la Tâche
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskCreateModal;
