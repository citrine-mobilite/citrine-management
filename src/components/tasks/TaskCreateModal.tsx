import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckSquare, 
  Flag, 
  Calendar, 
  Clock, 
  User, 
  Tag, 
  Plus, 
  Trash2, 
  Trophy, 
  Sparkles, 
  ListChecks, 
  FolderKanban, 
  Layers
} from 'lucide-react';
import { Task, Employee, TaskStatus, TaskPriority, TaskProject, AppUser, Subtask } from '../../types';
import { isSelfOnlyUser } from '../../utils/roleUtils';

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

  // Milestone fields
  const [isMilestone, setIsMilestone] = useState(isMilestoneDefault);
  const [milestoneTarget, setMilestoneTarget] = useState('');
  const [milestoneProgress, setMilestoneProgress] = useState(0);

  // Subtasks created directly during task creation
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskAssignee, setNewSubtaskAssignee] = useState(isEmpOrIntern ? myName : (currentUser?.name || employees[0]?.name || 'Équipe'));
  const [newSubtaskHours, setNewSubtaskHours] = useState<number>(2);
  const [newSubtaskPriority, setNewSubtaskPriority] = useState<TaskPriority>('medium');
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

  // Filter assignees based on selected project members
  const selectedProj = projects.find((p) => p.id === projectId);
  const availableEmployees = selectedProj && selectedProj.memberIds && selectedProj.memberIds.length > 0
    ? employees.filter((e) => selectedProj.memberIds!.includes(e.id))
    : employees;

  const handleAddSubtaskQuick = () => {
    if (!newSubtaskTitle.trim()) return;
    const assignedEmp = employees.find((e) => e.name === newSubtaskAssignee);
    const newSub: Subtask = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: newSubtaskTitle.trim(),
      completed: false,
      priority: newSubtaskPriority,
      assignedTo: newSubtaskAssignee,
      employeeId: assignedEmp?.id,
      dueDate: date,
      estimatedHours: Number(newSubtaskHours) || 2,
      subtasks: [],
      createdAt: new Date().toISOString(),
    };
    setSubtasks([...subtasks, newSub]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (idx: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalAssigned = isEmpOrIntern 
      ? (currentUser?.name || assignedList[0] || 'Moi') 
      : (assignedList.length > 0 ? assignedList.join(', ') : 'Équipe');

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

    // Reset
    setTitle('');
    setDescription('');
    setSubtasks([]);
    setIsMilestone(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2A7B76] via-[#20635F] to-emerald-900 p-5 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                {isMilestone ? (
                  <Trophy className="h-5 w-5 text-amber-300" />
                ) : (
                  <CheckSquare className="h-5 w-5 text-emerald-200" />
                )}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-emerald-100">
                  {isMilestone ? 'Jalon Stratégique (Milestone)' : 'Tâche Opérationnelle'}
                </span>
                <h3 className="font-serif font-bold text-lg sm:text-xl text-white mt-0.5">
                  {isMilestone ? 'Définir un Nouveau Jalon Clé' : 'Créer une Nouvelle Tâche'}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
              title="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Milestone Toggle */}
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

          {/* Title */}
          <div>
            <label className="block font-bold text-stone-700 mb-1">
              {isMilestone ? 'Intitulé du Jalon Stratégique *' : 'Titre de la tâche *'}
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder={isMilestone ? "Ex: Lancement Version 2.0, Clôture Bilan Annuel..." : "Ex: Rédiger le compte-rendu hebdomadaire, Préparer l'audit..."}
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

          {/* Description */}
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

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-[#2A7B76]" /> Date d'échéance *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none font-bold text-stone-800"
              />
            </div>
            <div>
              <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-[#2A7B76]" /> Heure limite
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none font-bold text-stone-800"
              />
            </div>
          </div>

          {/* Project & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                <FolderKanban className="h-3.5 w-3.5 text-[#2A7B76]" /> Projet de rattachement *
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none font-bold text-stone-800"
              >
                {projects.filter((p) => p.id !== 'all').map((p) => (
                  <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-stone-700 mb-1">Étape initiale (Statut)</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none font-bold text-stone-800"
              >
                <option value="idea">💡 Idée</option>
                <option value="todo">📌 À faire</option>
                <option value="in_progress">⚡ En cours</option>
                <option value="pending_validation">⏳ En attente validation</option>
                <option value="blocked">🚨 Bloquée</option>
                <option value="completed">✅ Terminée</option>
              </select>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
              <Flag className="h-3.5 w-3.5 text-[#2A7B76]" /> Priorité
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'low', label: 'Basse 🟢', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
                { id: 'medium', label: 'Moyenne 🟡', bg: 'bg-amber-50 text-amber-800 border-amber-300' },
                { id: 'high', label: 'Haute 🔴', bg: 'bg-rose-50 text-rose-800 border-rose-300' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id as TaskPriority)}
                  className={`py-2 rounded-xl border text-center transition cursor-pointer font-bold text-xs ${
                    priority === p.id
                      ? `${p.bg} ring-2 ring-offset-1 ring-[#2A7B76]`
                      : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-[#2A7B76]" /> Assigné à
            </label>
            {isEmpOrIntern ? (
              <input
                type="text"
                disabled
                value={currentUser?.name || assignedList[0] || 'Moi (Assignation automatique)'}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-100 text-stone-700 font-bold cursor-not-allowed"
              />
            ) : (
              <div className="space-y-1.5 max-h-32 overflow-y-auto p-2 bg-stone-50 rounded-xl border border-stone-200">
                <label className="flex items-center gap-2 text-xs font-bold text-stone-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assignedList.includes('Équipe')}
                    onChange={(e) => {
                      if (e.target.checked) setAssignedList(['Équipe']);
                      else setAssignedList(assignedList.filter(x => x !== 'Équipe'));
                    }}
                    className="rounded border-stone-300 text-[#2A7B76]"
                  />
                  <span>👥 Toute l'équipe</span>
                </label>
                {availableEmployees.map((emp) => (
                  <label key={emp.id} className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assignedList.includes(emp.name)}
                      onChange={(e) => {
                        let updated = assignedList.filter(x => x !== 'Équipe');
                        if (e.target.checked) updated.push(emp.name);
                        else updated = updated.filter(x => x !== emp.name);
                        setAssignedList(updated.length > 0 ? updated : ['Équipe']);
                      }}
                      className="rounded border-stone-300 text-[#2A7B76]"
                    />
                    <span>{emp.name} ({emp.department || 'Général'})</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 🌟 SOUS-TÂCHES INITIALES (Style Asana) */}
          <div className="bg-stone-50/80 p-3.5 rounded-2xl border border-stone-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-[#2A7B76]" />
                Sous-tâches associées ({subtasks.length})
              </span>
              <button
                type="button"
                onClick={() => setShowSubtaskForm(!showSubtaskForm)}
                className="text-[11px] font-bold text-[#2A7B76] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{showSubtaskForm ? 'Masquer' : '+ Ajouter des sous-tâches dès maintenant'}</span>
              </button>
            </div>

            {/* Subtasks list */}
            {subtasks.length > 0 && (
              <div className="space-y-1.5">
                {subtasks.map((sub, i) => (
                  <div key={sub.id || i} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-stone-200 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-[#2A7B76]"></span>
                      <strong className="text-stone-800 truncate">{sub.title}</strong>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-medium">
                        {sub.assignedTo}
                      </span>
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-mono font-bold">
                        {sub.estimatedHours}h
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtask(i)}
                        className="text-stone-400 hover:text-rose-600 p-0.5 transition cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick subtask builder inside modal */}
            {showSubtaskForm && (
              <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-2 animate-in fade-in">
                <input
                  type="text"
                  placeholder="Intitulé de la sous-tâche..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-xs font-semibold outline-none focus:bg-white focus:ring-1 focus:ring-[#2A7B76]"
                />
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={newSubtaskAssignee}
                    onChange={(e) => setNewSubtaskAssignee(e.target.value)}
                    className="px-2 py-1 rounded-lg border border-stone-200 bg-stone-50 text-[11px] font-medium"
                  >
                    <option value="Équipe">👥 Toute l'équipe</option>
                    {availableEmployees.map((emp) => (
                      <option key={emp.id} value={emp.name}>{emp.name}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={newSubtaskHours}
                      onChange={(e) => setNewSubtaskHours(Number(e.target.value))}
                      className="w-full px-2 py-1 rounded-lg border border-stone-200 bg-stone-50 text-[11px] font-mono font-bold text-center"
                    />
                    <span className="text-[10px] text-stone-500 font-bold">h</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSubtaskQuick}
                    className="px-3 py-1 bg-[#2A7B76] text-white rounded-lg text-xs font-bold hover:bg-[#20635F] cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Ajouter</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
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
