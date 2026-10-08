import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Trash2, 
  MessageSquare, 
  CheckCircle2, 
  ShieldAlert, 
  Flag,
  Calendar,
  User,
  AlertTriangle
} from 'lucide-react';
import { Task, Employee, TaskStatus, TaskPriority, TaskProject, Subtask, Comment } from '../../types';

interface TaskDetailDrawerProps {
  task: Task | null;
  employees: Employee[];
  projects: TaskProject[];
  onClose: () => void;
  onSaveTask: (updatedTask: Task) => void;
  onDeleteTask: (taskId: string) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = (props) => {
  if (!props.task) return null;
  return <TaskDetailDrawerContent {...props} task={props.task} />;
};

interface TaskDetailDrawerContentProps extends Omit<TaskDetailDrawerProps, 'task'> {
  task: Task;
}

const TaskDetailDrawerContent: React.FC<TaskDetailDrawerContentProps> = ({
  task,
  employees,
  projects,
  onClose,
  onSaveTask,
  onDeleteTask,
  showToast,
}) => {
  // Local draft state for renaming, editing description, status, priority, etc.
  const [draftTitle, setDraftTitle] = useState(task.title);
  const [draftDescription, setDraftDescription] = useState(task.description || '');
  const [draftStatus, setDraftStatus] = useState<TaskStatus>(task.status);
  const [draftPriority, setDraftPriority] = useState<TaskPriority>(task.priority);
  const [draftAssignedTo, setDraftAssignedTo] = useState(task.assignedTo || 'Équipe');
  const [draftDate, setDraftDate] = useState(task.date);
  const [draftProjectId, setDraftProjectId] = useState(task.projectId || 'general');
  const [draftIsMilestone, setDraftIsMilestone] = useState(!!task.isMilestone);
  const [draftMilestoneTarget, setDraftMilestoneTarget] = useState(task.milestoneTarget || '');
  const [draftMilestoneProgress, setDraftMilestoneProgress] = useState(task.milestoneProgress ?? 0);

  // Subtasks & Comments
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [comments, setComments] = useState<Comment[]>(task.comments || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [blockerText, setBlockerText] = useState('');
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // Sync draft when task prop changes
  useEffect(() => {
    setDraftTitle(task.title);
    setDraftDescription(task.description || '');
    setDraftStatus(task.status);
    setDraftPriority(task.priority);
    setDraftAssignedTo(task.assignedTo || 'Équipe');
    setDraftDate(task.date);
    setDraftProjectId(task.projectId || 'general');
    setDraftIsMilestone(!!task.isMilestone);
    setDraftMilestoneTarget(task.milestoneTarget || '');
    setDraftMilestoneProgress(task.milestoneProgress ?? 0);
    setSubtasks(task.subtasks || []);
    setComments(task.comments || []);
  }, [task]);

  // Project restriction on assignees
  const activeProj = projects.find((p) => p.id === draftProjectId);
  const eligibleEmployees = activeProj && activeProj.memberIds && activeProj.memberIds.length > 0
    ? employees.filter((e) => activeProj.memberIds!.includes(e.id))
    : employees;

  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!draftTitle.trim()) {
      if (showToast) showToast('Le titre de la tâche ne peut pas être vide.', 'error');
      return;
    }

    const updated: Task = {
      ...task,
      title: draftTitle.trim(),
      description: draftDescription.trim(),
      status: draftStatus,
      priority: draftPriority,
      assignedTo: draftAssignedTo,
      date: draftDate,
      projectId: draftProjectId,
      isMilestone: draftIsMilestone,
      milestoneTarget: draftMilestoneTarget.trim() || undefined,
      milestoneProgress: draftMilestoneProgress,
      subtasks,
      comments,
      lastUpdatedTime: new Date().toISOString(),
    };

    onSaveTask(updated);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 3000);
    if (showToast) showToast('Modifications enregistrées avec succès !', 'success');
  };

  // Subtask handlers
  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSub: Subtask = {
      id: `sub-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false,
      subtasks: [],
    };
    const updated = [...subtasks, newSub];
    setSubtasks(updated);
    setNewSubtaskTitle('');
    onSaveTask({ ...task, subtasks: updated });
  };

  const handleToggleSubtask = (subId: string) => {
    const toggleInTree = (list: Subtask[]): Subtask[] => {
      return list.map((s) => {
        if (s.id === subId) return { ...s, completed: !s.completed };
        if (s.subtasks && s.subtasks.length > 0) return { ...s, subtasks: toggleInTree(s.subtasks) };
        return s;
      });
    };
    const updated = toggleInTree(subtasks);
    setSubtasks(updated);
    onSaveTask({ ...task, subtasks: updated });
  };

  const handleAddComment = () => {
    if (!newCommentText.trim()) return;
    const newCom: Comment = {
      id: `com-${Date.now()}`,
      author: 'Utilisateur',
      text: newCommentText.trim(),
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };
    const updated = [...comments, newCom];
    setComments(updated);
    setNewCommentText('');
    onSaveTask({ ...task, comments: updated });
    if (showToast) showToast('Commentaire ajouté.', 'success');
  };

  const handleSignalBlocker = () => {
    if (!blockerText.trim()) return;
    const newInc = {
      id: `inc-${Date.now()}`,
      title: blockerText.trim(),
      description: blockerText.trim(),
      severity: 'high' as const,
      createdAt: new Date().toLocaleDateString('fr-FR'),
      resolved: false,
    };
    const updated: Task = {
      ...task,
      status: 'blocked',
      incidents: [...(task.incidents || []), newInc],
    };
    setDraftStatus('blocked');
    onSaveTask(updated);
    setBlockerText('');
    if (showToast) showToast('Blocage signalé. Tâche passée en "Bloquée".', 'error');
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/35 backdrop-blur-xs flex justify-end animate-in fade-in">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-stone-200 flex flex-col p-6 overflow-y-auto space-y-5 animate-in slide-in-from-right duration-300">
        
        {/* Header Drawer */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              📌 Fiche Détail Tâche
            </span>
            {isSavedRecently && (
              <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="h-3.5 w-3.5" /> Enregistré !
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:bg-stone-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveAll} className="space-y-4 text-xs flex-1">
          
          {/* Renommer le titre de la tâche */}
          <div>
            <label className="block text-stone-700 font-bold mb-1">
              Intitulé de la tâche *
            </label>
            <input
              type="text"
              required
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50 font-bold text-stone-900 text-sm focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none transition"
              placeholder="Intitulé de la tâche..."
            />
          </div>

          {/* Toggle Type Jalon vs Tâche */}
          <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-amber-900 flex items-center gap-1.5 cursor-pointer">
                <Flag className="h-4 w-4 fill-amber-600 text-amber-600" />
                <span>Marquer comme Jalon Clé (Milestone)</span>
              </label>
              <input
                type="checkbox"
                checked={draftIsMilestone}
                onChange={(e) => setDraftIsMilestone(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
            </div>
            {draftIsMilestone && (
              <div className="space-y-2 pt-2 border-t border-amber-200/60">
                <div>
                  <label className="block font-bold text-amber-900 text-[11px] mb-1">
                    Livrable attendu ou critère de succès :
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Livrable validé par le client, signature officielle..."
                    value={draftMilestoneTarget}
                    onChange={(e) => setDraftMilestoneTarget(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-amber-300 bg-white text-stone-800 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-amber-900 mb-1">
                    <span>Progression du Jalon :</span>
                    <span>{draftMilestoneProgress}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={draftMilestoneProgress}
                    onChange={(e) => setDraftMilestoneProgress(Number(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Description : Ajouter ou modifier la description */}
          <div>
            <label className="block text-stone-700 font-bold mb-1">
              Description & Spécifications
            </label>
            <textarea
              rows={3}
              value={draftDescription}
              onChange={(e) => setDraftDescription(e.target.value)}
              placeholder="Ajouter ou modifier la description détaillée..."
              className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 focus:ring-2 focus:ring-[#2A7B76] outline-none transition"
            />
          </div>

          {/* Statut, Priorité, Module */}
          <div className="grid grid-cols-3 gap-2.5 bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80">
            <div>
              <label className="block text-stone-600 font-bold mb-1 text-[11px]">Étape / Statut</label>
              <select
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value as TaskStatus)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white font-bold text-stone-800 text-[11px] cursor-pointer"
              >
                <option value="idea">💡 Idée</option>
                <option value="todo">📌 À faire</option>
                <option value="in_progress">⚡ En cours</option>
                <option value="pending_validation">⏳ En attente</option>
                <option value="blocked">🚨 Bloquée</option>
                <option value="completed">✅ Terminée</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-600 font-bold mb-1 text-[11px]">Priorité</label>
              <select
                value={draftPriority}
                onChange={(e) => setDraftPriority(e.target.value as TaskPriority)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white font-bold text-stone-800 text-[11px] cursor-pointer"
              >
                <option value="low">🟢 Basse</option>
                <option value="medium">🟡 Moyenne</option>
                <option value="high">🔴 Haute</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-600 font-bold mb-1 text-[11px]">Projet / Module</label>
              <select
                value={draftProjectId}
                onChange={(e) => setDraftProjectId(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white font-bold text-stone-800 text-[11px] cursor-pointer"
              >
                {projects.filter((p) => p.id !== 'all').map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.icon || '📁'} {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date d'échéance et Assignation avec restriction membres */}
          <div className="grid grid-cols-2 gap-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80">
            <div>
              <label className="block text-stone-600 font-bold mb-1 text-[11px] flex items-center gap-1">
                <Calendar className="h-3 w-3 text-[#2A7B76]" /> Échéance
              </label>
              <input
                type="date"
                value={draftDate}
                onChange={(e) => setDraftDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white font-medium text-stone-800"
              />
            </div>

            <div>
              <label className="block text-stone-600 font-bold mb-1 text-[11px] flex items-center gap-1">
                <User className="h-3 w-3 text-[#2A7B76]" /> Assigné à (Membres)
              </label>
              <select
                value={draftAssignedTo}
                onChange={(e) => setDraftAssignedTo(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white font-medium text-stone-800"
              >
                <option value="Équipe">Toute l'équipe du projet</option>
                {eligibleEmployees.map((emp) => (
                  <option key={emp.id} value={emp.name}>{emp.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bouton d'enregistrement principal des modifications */}
          <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200 flex items-center justify-between">
            <span className="text-[11px] text-emerald-800 font-medium">
              Enregistrez vos changements de titre, statut, priorité ou description.
            </span>
            <button
              type="submit"
              className="bg-[#2A7B76] hover:bg-[#236864] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Enregistrer les modifications</span>
            </button>
          </div>

          {/* Section Sous-tâches */}
          <div className="space-y-2.5 bg-stone-50 p-4 rounded-2xl border border-stone-200/80">
            <h4 className="font-bold text-stone-800 text-xs">Sous-tâches</h4>
            <div className="space-y-1.5">
              {subtasks.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-stone-200">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={sub.completed}
                      onChange={() => handleToggleSubtask(sub.id)}
                      className="w-3.5 h-3.5 text-[#2A7B76] rounded cursor-pointer"
                    />
                    <span className={`text-xs ${sub.completed ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                      {sub.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Nouvelle sous-tâche..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:ring-1 focus:ring-[#2A7B76]"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 bg-[#2A7B76] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Ajouter
              </button>
            </div>
          </div>

          {/* Signalement de blocage */}
          <div className="space-y-2 bg-rose-50/50 p-3.5 rounded-2xl border border-rose-200/70">
            <h4 className="font-bold text-rose-800 text-[11px] flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-600" /> Signaler une difficulté / incident bloquant
            </h4>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ex: En attente d'un document client, panne API..."
                value={blockerText}
                onChange={(e) => setBlockerText(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl border border-rose-200 bg-white text-xs outline-none"
              />
              <button
                type="button"
                onClick={handleSignalBlocker}
                className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-rose-700 transition"
              >
                Bloquer
              </button>
            </div>
          </div>

          {/* Section Commentaires */}
          <div className="space-y-2.5 bg-stone-50 p-4 rounded-2xl border border-stone-200/80">
            <h4 className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-[#2A7B76]" /> Commentaires & Activités
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {comments.map((com) => (
                <div key={com.id} className="bg-white p-2.5 rounded-xl border border-stone-200 text-xs space-y-0.5">
                  <div className="flex items-center justify-between text-[10px] text-stone-400">
                    <span className="font-bold text-stone-700">{com.author}</span>
                    <span>{com.timestamp}</span>
                  </div>
                  <p className="text-stone-600">{com.text}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Écrire un commentaire..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:ring-1 focus:ring-[#2A7B76]"
              />
              <button
                type="button"
                onClick={handleAddComment}
                className="px-3 py-1.5 bg-[#2A7B76] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Publier
              </button>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onDeleteTask(task.id)}
            className="text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" /> Supprimer la tâche
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={() => handleSaveAll()}
              className="px-4 py-2 bg-[#2A7B76] hover:bg-[#236864] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Save className="h-3.5 w-3.5" />
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
