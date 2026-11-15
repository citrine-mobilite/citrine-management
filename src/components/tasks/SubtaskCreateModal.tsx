import React, { useState, useEffect } from 'react';
import { CheckSquare, FileText } from 'lucide-react';
import { Subtask, Employee, TaskPriority, TaskStatus, Task, TaskProject, AppUser } from '../../types';
import { isSelfOnlyUser } from '../../utils/roleUtils';
import { SubtaskCreateModalHeader } from './subtaskCreate/SubtaskCreateModalHeader';
import { SubtaskTimingAndStatusFields } from './subtaskCreate/SubtaskTimingAndStatusFields';
import { SubtaskCriteriaChecklist } from './subtaskCreate/SubtaskCriteriaChecklist';

interface SubtaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSubtask: (subtaskData: Subtask, targetTaskId?: string) => void;
  employees: Employee[];
  parentTask?: Task | null;
  availableTasks?: Task[];
  projects?: TaskProject[];
  defaultTaskId?: string;
  currentUser?: AppUser | null;
  currentRole?: string;
}

export const SubtaskCreateModal: React.FC<SubtaskCreateModalProps> = ({
  isOpen,
  onClose,
  onCreateSubtask,
  employees,
  parentTask,
  availableTasks = [],
  projects = [],
  defaultTaskId,
  currentUser,
  currentRole,
}) => {
  const isEmpOrIntern = isSelfOnlyUser(currentUser, currentRole);
  const myName = currentUser?.name || employees[0]?.name || 'Moi';

  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    parentTask?.id || defaultTaskId || availableTasks[0]?.id || ''
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [assignedTo, setAssignedTo] = useState(isEmpOrIntern ? myName : (employees[0]?.name || 'Équipe'));
  const [dueDate, setDueDate] = useState(
    parentTask?.date || new Date().toISOString().split('T')[0]
  );
  const [estimatedHours, setEstimatedHours] = useState<number>(2);
  const [actualHours, setActualHours] = useState<number>(0);
  const [selectedTag, setSelectedTag] = useState<string>('Exécution');
  const [criteria, setCriteria] = useState<string[]>([]);
  const [newCriterion, setNewCriterion] = useState('');

  useEffect(() => {
    if (isEmpOrIntern) {
      setAssignedTo(myName);
    }
  }, [isEmpOrIntern, myName]);

  useEffect(() => {
    if (parentTask) {
      setSelectedTaskId(parentTask.id);
    } else if (defaultTaskId) {
      setSelectedTaskId(defaultTaskId);
    } else if (availableTasks.length > 0 && !selectedTaskId) {
      setSelectedTaskId(availableTasks[0].id);
    }
  }, [parentTask, defaultTaskId, availableTasks, selectedTaskId]);

  if (!isOpen) return null;

  const currentParent = parentTask || availableTasks.find((t) => t.id === selectedTaskId);
  const matchedProject = projects.find((p) => p.id === currentParent?.projectId);

  const formattedDisplayDate = dueDate
    ? new Date(dueDate + 'T00:00:00').toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '';

  const handleAddCriterion = () => {
    if (!newCriterion.trim()) return;
    setCriteria([...criteria, newCriterion.trim()]);
    setNewCriterion('');
  };

  const handleRemoveCriterion = (idx: number) => {
    setCriteria(criteria.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const assignedEmp = employees.find((e) => e.name === assignedTo);
    const newSubtask: Subtask = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      completed: status === 'completed',
      description: description.trim() || undefined,
      priority,
      status,
      assignedTo,
      employeeId: assignedEmp?.id,
      dueDate,
      endDate: dueDate,
      estimatedHours: Number(estimatedHours) || 2,
      actualHours: Number(actualHours) || 0,
      tags: [selectedTag].filter(Boolean),
      acceptanceCriteria: criteria.length > 0 ? criteria : undefined,
      subtasks: [],
      createdAt: new Date().toISOString(),
    };

    onCreateSubtask(newSubtask, selectedTaskId || currentParent?.id);
    setTitle('');
    setDescription('');
    setCriteria([]);
    setEstimatedHours(2);
    setActualHours(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-2xl rounded-3xl w-full max-w-xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18)] border border-white/80 overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in zoom-in-95 duration-200">
        <SubtaskCreateModalHeader
          onClose={onClose}
          parentTask={parentTask}
          availableTasks={availableTasks}
          selectedTaskId={selectedTaskId}
          setSelectedTaskId={setSelectedTaskId}
          matchedProject={matchedProject}
        />

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4.5 text-xs">
          <div className="space-y-1.5">
            <label className="block font-bold text-stone-800 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-[#2A7B76]" />
                Intitulé de la sous-tâche <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10px] font-normal text-stone-400">Action unitaire précise</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ex: Rédiger la synthèse d'audit, Valider la maquette, Préparer l'envoi..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-stone-50/70 focus:bg-white focus:border-[#2A7B76] focus:ring-2 focus:ring-[#2A7B76]/20 text-stone-900 font-semibold text-xs outline-none transition shadow-2xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-stone-700 text-xs">
              Description & Spécifications
            </label>
            <textarea
              rows={2}
              placeholder="Instructions, consignes particulières, contexte ou livrable attendu..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-2xl border border-stone-200 bg-stone-50/70 focus:bg-white focus:border-[#2A7B76] focus:ring-2 focus:ring-[#2A7B76]/20 outline-none text-xs text-stone-800 transition shadow-2xs resize-none"
            />
          </div>

          <SubtaskTimingAndStatusFields
            priority={priority}
            setPriority={setPriority}
            status={status}
            setStatus={setStatus}
            selectedTag={selectedTag}
            setSelectedTag={setSelectedTag}
            estimatedHours={estimatedHours}
            setEstimatedHours={setEstimatedHours}
            actualHours={actualHours}
            setActualHours={setActualHours}
            isEmpOrIntern={isEmpOrIntern}
            myName={myName}
            assignedTo={assignedTo}
            setAssignedTo={setAssignedTo}
            employees={employees}
            dueDate={dueDate}
            setDueDate={setDueDate}
            formattedDisplayDate={formattedDisplayDate}
          />

          <SubtaskCriteriaChecklist
            criteria={criteria}
            newCriterion={newCriterion}
            setNewCriterion={setNewCriterion}
            onAddCriterion={handleAddCriterion}
            onRemoveCriterion={handleRemoveCriterion}
          />

          <div className="flex items-center justify-between pt-4 border-t border-stone-200/60">
            <span className="text-[11px] text-stone-400 hidden sm:inline">
              Sous-tâche comptabilisée dans le calcul du rendement.
            </span>
            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#2A7B76] hover:bg-[#20635F] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md shadow-[#2A7B76]/25 flex items-center gap-1.5 active:scale-98"
              >
                <CheckSquare className="h-4 w-4" />
                <span>Créer la sous-tâche</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubtaskCreateModal;
