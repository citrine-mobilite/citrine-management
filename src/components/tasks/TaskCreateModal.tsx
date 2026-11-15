import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { Task, Employee, TaskStatus, TaskPriority, TaskProject, AppUser, Subtask } from '../../types';
import { isSelfOnlyUser } from '../../utils/roleUtils';
import { TaskCreateModalHeader } from './taskCreate/TaskCreateModalHeader';
import { TaskAssigneeAndMetadataFields } from './taskCreate/TaskAssigneeAndMetadataFields';
import { TaskInitialSubtasksBuilder } from './taskCreate/TaskInitialSubtasksBuilder';

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (taskData: Omit<Task, 'id' | 'comments' | 'incidents'> & { subtasks?: Subtask[] }) => void;
  employees: Employee[];
  projects: TaskProject[];
  defaultProjectId?: string;
  defaultStatus?: TaskStatus;
  isMilestoneDefault?: boolean;
  currentRole?: string;
  currentUser?: AppUser | null;
}

export const TaskCreateModal: React.FC<TaskCreateModalProps> = ({
  isOpen,
  onClose,
  onCreateTask,
  employees,
  projects,
  defaultProjectId = 'general',
  defaultStatus = 'todo',
  isMilestoneDefault = false,
  currentRole,
  currentUser,
}) => {
  const isEmpOrIntern = isSelfOnlyUser(currentUser, currentRole);
  const myName = currentUser?.name || employees[0]?.name || 'Moi';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId !== 'all' ? defaultProjectId : 'general');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignedList, setAssignedList] = useState<string[]>(isEmpOrIntern ? [myName] : ['Équipe']);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00');
  const [isMilestone, setIsMilestone] = useState(isMilestoneDefault);
  const [milestoneTarget, setMilestoneTarget] = useState('');
  const [milestoneProgress] = useState(0);

  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskAssignee, setNewSubtaskAssignee] = useState(isEmpOrIntern ? myName : (currentUser?.name || employees[0]?.name || 'Équipe'));
  const [newSubtaskHours, setNewSubtaskHours] = useState<number>(2);
  const [newSubtaskPriority] = useState<TaskPriority>('medium');
  const [newSubtaskDueDate, setNewSubtaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);

  useEffect(() => {
    setIsMilestone(isMilestoneDefault);
  }, [isMilestoneDefault]);

  useEffect(() => {
    if (isEmpOrIntern) {
      setAssignedList([myName]);
      setNewSubtaskAssignee(myName);
    }
  }, [isEmpOrIntern, myName]);

  if (!isOpen) return null;

  const selectedProj = projects.find((p) => p.id === projectId);
  const availableEmployees =
    selectedProj && selectedProj.memberIds && selectedProj.memberIds.length > 0
      ? employees.filter((e) => selectedProj.memberIds!.includes(e.id))
      : employees;

  const handleAddSubtaskQuick = () => {
    if (!newSubtaskTitle.trim()) return;
    const assignedEmp = employees.find((e) => e.name === newSubtaskAssignee);
    const subDueDate = newSubtaskDueDate || date || new Date().toISOString().split('T')[0];
    const newSub: Subtask = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: newSubtaskTitle.trim(),
      completed: false,
      priority: newSubtaskPriority,
      assignedTo: newSubtaskAssignee,
      employeeId: assignedEmp?.id,
      dueDate: subDueDate,
      endDate: subDueDate,
      estimatedHours: Number(newSubtaskHours) || 2,
      subtasks: [],
      createdAt: new Date().toISOString(),
    };
    setSubtasks([...subtasks, newSub]);
    setNewSubtaskTitle('');
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

    const finalAssigned = isEmpOrIntern
      ? currentUser?.name || assignedList[0] || 'Moi'
      : assignedList.length > 0
        ? assignedList.join(', ')
        : 'Équipe';

    onCreateTask({
      title: title.trim(),
      description: description.trim(),
      date,
      time: isEmpOrIntern ? '' : time,
      priority,
      status,
      assignedTo: finalAssigned,
      projectId: projectId || 'general',
      reminderPeriod: 'none',
      isMilestone,
      milestoneTarget: isMilestone ? milestoneTarget.trim() || undefined : undefined,
      milestoneProgress: isMilestone ? milestoneProgress : 0,
      subtasks,
    });

    setTitle('');
    setDescription('');
    setSubtasks([]);
    setIsMilestone(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        <TaskCreateModalHeader isMilestone={isMilestone} onClose={onClose} />

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-600" />
              <div>
                <strong className="text-amber-900 block font-bold text-xs">Jalon Stratégique</strong>
                <span className="text-[10px] text-amber-700">Définit une étape majeure ou livrable d'entreprise</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isMilestone}
                onChange={(e) => setIsMilestone(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">
              {isMilestone ? 'Intitulé du Jalon Stratégique *' : 'Titre de la tâche *'}
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder={isMilestone ? 'Ex: Lancement Version 2.0, Clôture Bilan Annuel...' : "Ex: Rédiger le compte-rendu hebdomadaire, Préparer l'audit..."}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none text-stone-900 font-semibold"
            />
          </div>

          {isMilestone && (
            <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-200/80 space-y-2.5">
              <label className="block font-bold text-amber-900 text-[11px]">
                Livrable attendu pour valider ce jalon
              </label>
              <input
                type="text"
                placeholder="Ex: Validation formelle du CA, Recette signée..."
                value={milestoneTarget}
                onChange={(e) => setMilestoneTarget(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-amber-200 bg-white text-xs outline-none focus:ring-2 focus:ring-amber-500 text-stone-900 font-medium"
              />
            </div>
          )}

          <div>
            <label className="block font-bold text-stone-700 mb-1">Description & Consignes (Optionnel)</label>
            <textarea
              rows={2}
              placeholder="Détails, spécifications, livrables attendus..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none"
            />
          </div>

          <TaskAssigneeAndMetadataFields
            date={date} setDate={setDate} time={time} setTime={setTime}
            projectId={projectId} setProjectId={setProjectId} projects={projects}
            status={status} setStatus={setStatus} priority={priority} setPriority={setPriority}
            isEmpOrIntern={isEmpOrIntern} currentUser={currentUser}
            assignedList={assignedList} setAssignedList={setAssignedList}
            availableEmployees={availableEmployees}
          />

          <TaskInitialSubtasksBuilder
            subtasks={subtasks} showSubtaskForm={showSubtaskForm} setShowSubtaskForm={setShowSubtaskForm}
            newSubtaskTitle={newSubtaskTitle} setNewSubtaskTitle={setNewSubtaskTitle}
            newSubtaskAssignee={newSubtaskAssignee} setNewSubtaskAssignee={setNewSubtaskAssignee}
            newSubtaskHours={newSubtaskHours} setNewSubtaskHours={setNewSubtaskHours}
            newSubtaskDueDate={newSubtaskDueDate} setNewSubtaskDueDate={setNewSubtaskDueDate}
            availableEmployees={availableEmployees}
            onAddSubtaskQuick={handleAddSubtaskQuick}
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
              {isMilestone ? 'Créer le Jalon Stratégique' : 'Créer la Tâche'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskCreateModal;
