import React, { useState, useEffect, useMemo } from 'react';
import { CheckSquare, FileText } from 'lucide-react';
import {
  Subtask,
  Employee,
  TaskPriority,
  TaskStatus,
  Task,
  TaskProject,
  AppUser,
  TaskRecurrence,
} from '../../types';
import { isSelfOnlyUser } from '../../utils/roleUtils';
import { SubtaskCreateModalHeader } from './subtaskCreate/SubtaskCreateModalHeader';
import { SubtaskTimingAndStatusFields } from './subtaskCreate/SubtaskTimingAndStatusFields';
import { AsanaRichFieldsPicker } from './shared/AsanaRichFieldsPicker';
import { findPotentialDuplicatesForInput } from '../../services/taskRedundancyService';
import { RedundancyWarningBanner } from './RedundancyWarningBanner';

interface SubtaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSubtask: (subtaskData: Subtask, targetTaskId?: string) => void;
  employees: Employee[];
  parentTask?: Task | null;
  parentSubtaskTitle?: string;
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
  parentSubtaskTitle,
  availableTasks = [],
  projects = [],
  defaultTaskId,
  currentUser,
  currentRole,
}) => {
  const isEmpOrIntern = isSelfOnlyUser(currentUser, currentRole);
  const myName = currentUser?.name || employees[0]?.name || 'Moi';
  const todayIso = new Date().toISOString().split('T')[0];

  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    parentTask?.id || defaultTaskId || availableTasks[0]?.id || ''
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [assignedTo, setAssignedTo] = useState(
    isEmpOrIntern ? myName : employees[0]?.name || 'Équipe'
  );
  const [startDate, setStartDate] = useState(parentTask?.startDate || todayIso);
  const [dueDate, setDueDate] = useState(parentTask?.dueDate || parentTask?.date || todayIso);
  const [time, setTime] = useState('09:00');
  const [estimatedHours, setEstimatedHours] = useState<number>(2);
  const [actualHours, setActualHours] = useState<number>(0);
  const [tags, setTags] = useState<string[]>(['Exécution']);
  const [dependsOnIds, setDependsOnIds] = useState<string[]>([]);
  const [recurrence, setRecurrence] = useState<TaskRecurrence>('none');
  const [followerIds, setFollowerIds] = useState<string[]>([]);
  const [criteria, setCriteria] = useState<string[]>([]);

  useEffect(() => {
    if (isEmpOrIntern && !assignedTo) {
      setAssignedTo(myName);
    }
  }, [isEmpOrIntern, myName, assignedTo]);

  useEffect(() => {
    if (parentTask) {
      setSelectedTaskId(parentTask.id);
      if (parentTask.dueDate || parentTask.date) {
        setDueDate(parentTask.dueDate || parentTask.date);
      }
      if (parentTask.startDate) {
        setStartDate(parentTask.startDate);
      }
    } else if (defaultTaskId) {
      setSelectedTaskId(defaultTaskId);
    } else if (availableTasks.length > 0 && !selectedTaskId) {
      setSelectedTaskId(availableTasks[0].id);
    }
  }, [parentTask, defaultTaskId, availableTasks, selectedTaskId]);

  const potentialDuplicates = useMemo(() => {
    const pool = availableTasks.length > 0 ? availableTasks : parentTask ? [parentTask] : [];
    return findPotentialDuplicatesForInput(title, pool, assignedTo ? [assignedTo] : []);
  }, [title, availableTasks, parentTask, assignedTo]);

  if (!isOpen) return null;

  const currentParent = parentTask || availableTasks.find((t) => t.id === selectedTaskId);
  const matchedProject = projects.find((p) => p.id === currentParent?.projectId);
  const allPoolTasks = availableTasks.length > 0 ? availableTasks : parentTask ? [parentTask] : [];

  const formattedDisplayDate = dueDate
    ? new Date(`${dueDate}T12:00:00`).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '';

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
      startDate: startDate || todayIso,
      dueDate,
      endDate: dueDate,
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
    };

    onCreateSubtask(newSubtask, selectedTaskId || currentParent?.id);
    setTitle('');
    setDescription('');
    setCriteria([]);
    setDependsOnIds([]);
    setFollowerIds([]);
    setTags(['Exécution']);
    setEstimatedHours(2);
    setActualHours(0);
    setRecurrence('none');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-2xl rounded-3xl w-full max-w-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18)] border border-white/80 overflow-hidden flex flex-col my-auto max-h-[94vh] animate-in zoom-in-95 duration-200">
        <SubtaskCreateModalHeader
          onClose={onClose}
          parentTask={parentTask}
          availableTasks={availableTasks}
          selectedTaskId={selectedTaskId}
          setSelectedTaskId={setSelectedTaskId}
          matchedProject={matchedProject}
        />

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {parentSubtaskTitle && (
            <div className="px-3 py-2 rounded-xl bg-stone-100 border border-stone-200 text-stone-700 font-semibold">
              Sous-tâche parente : <span className="text-stone-900">{parentSubtaskTitle}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block font-bold text-stone-800 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-[#2A7B76]" />
                Intitulé de la sous-tâche <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10px] font-normal text-stone-400">
                Mêmes attributs qu'une tâche Asana
              </span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ex: Rédiger la synthèse d'audit, Valider la maquette, Préparer l'envoi..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-stone-50/70 focus:bg-white focus:border-[#2A7B76] focus:ring-2 focus:ring-[#2A7B76]/20 text-stone-900 font-semibold text-xs outline-none transition"
            />
          </div>

          <RedundancyWarningBanner matches={potentialDuplicates} />

          <div className="space-y-1.5">
            <label className="block font-bold text-stone-700 text-xs">
              Description &amp; Spécifications
            </label>
            <textarea
              rows={2}
              placeholder="Instructions, consignes particulières, contexte ou livrable attendu..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-2xl border border-stone-200 bg-stone-50/70 focus:bg-white focus:border-[#2A7B76] focus:ring-2 focus:ring-[#2A7B76]/20 outline-none text-xs text-stone-800 transition resize-none"
            />
          </div>

          <SubtaskTimingAndStatusFields
            priority={priority}
            setPriority={setPriority}
            status={status}
            setStatus={setStatus}
            myName={myName}
            assignedTo={assignedTo}
            setAssignedTo={setAssignedTo}
            employees={employees}
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
            existingTasks={allPoolTasks}
            recurrence={recurrence}
            setRecurrence={setRecurrence}
            followerIds={followerIds}
            setFollowerIds={setFollowerIds}
            employees={employees}
            criteria={criteria}
            setCriteria={setCriteria}
          />

          <div className="flex items-center justify-between pt-4 border-t border-stone-200/60">
            <span className="text-[11px] text-stone-400 hidden sm:inline">
              Sous-tâche comptabilisée dans le calcul du rendement et de la charge.
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
                className="px-5 py-2.5 bg-[#2A7B76] hover:bg-[#20635F] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md shadow-[#2A7B76]/25 flex items-center gap-1.5"
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
