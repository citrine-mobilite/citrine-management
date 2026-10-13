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
import { Task, Employee, TaskStatus, TaskPriority, TaskProject, Subtask, Comment, AppUser } from '../../types';
import { pushNotificationBridgeService } from '../../services/pushNotificationBridgeService';

interface TaskDetailDrawerProps {
  task: Task | null;
  employees: Employee[];
  projects: TaskProject[];
  onClose: () => void;
  onSaveTask: (updatedTask: Task) => void;
  onDeleteTask: (taskId: string) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
  currentRole?: string;
  currentUser?: AppUser | null;
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
  currentRole,
  currentUser,
}) => {
  const isEmployee = currentRole === 'employé' || (currentUser && currentUser.role === 'employé');

  // Local draft state
  const [draftTitle, setDraftTitle] = useState(task.title);
  const [draftDescription, setDraftDescription] = useState(task.description || '');
  const [draftStatus, setDraftStatus] = useState<TaskStatus>(task.status);
  const [draftPriority, setDraftPriority] = useState<TaskPriority>(task.priority);
  const [draftAssignedList, setDraftAssignedList] = useState<string[]>(
    task.assignedTo ? task.assignedTo.split(',').map(s => s.trim()) : ['Équipe']
  );
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
    setDraftAssignedList(task.assignedTo ? task.assignedTo.split(',').map(s => s.trim()) : ['Équipe']);
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

    const finalAssigned = isEmployee
      ? (currentUser?.name || task.assignedTo || 'Équipe')
      : (draftAssignedList.length > 0 ? draftAssignedList.join(', ') : 'Équipe');

    const updated: Task = {
      ...task,
      title: draftTitle.trim(),
      description: draftDescription.trim(),
      status: draftStatus,
      priority: draftPriority,
      assignedTo: finalAssigned,
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
      author: currentUser?.name || 'Utilisateur',
      text: newCommentText.trim(),
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };
    const updated = [...comments, newCom];
    setComments(updated);
    setNewCommentText('');
    onSaveTask({ ...task, comments: updated });

    pushNotificationBridgeService.sendPush({
      title: `Nouveau Commentaire 💬`,
      message: `${newCom.author} a commenté sur la tâche "${task.title}": "${newCom.text}"`,
      type: 'task_comment',
      link: '#tasks'
    });
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
                <User className="h-3 w-3 text-[#2A7B76]" /> Assigné à
              </label>
              {isEmployee ? (
                <input
                  type="text"
                  disabled
                  value={task.assignedTo || currentUser?.name || 'Moi'}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-100 text-stone-600 font-medium cursor-not-allowed text-[11px]"
                />
              ) : (
                <div className="space-y-1 max-h-32 overflow-y-auto p-1.5 bg-white rounded-lg border border-stone-200">
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-stone-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftAssignedList.includes('Équipe')}
                      onChange={(e) => {
                        if (e.target.checked) setDraftAssignedList(['Équipe']);
                        else setDraftAssignedList(draftAssignedList.filter(x => x !== 'Équipe'));
                      }}
                      className="rounded border-stone-300 text-[#2A7B76]"
                    />
                    <span>Toute l'équipe</span>
                  </label>
                  {eligibleEmployees.map((emp) => (
                    <label key={emp.id} className="flex items-center gap-1.5 text-[11px] font-medium text-stone-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draftAssignedList.includes(emp.name)}
                        onChange={(e) => {
                          let updated = draftAssignedList.filter(x => x !== 'Équipe');
                          if (e.target.checked) updated.push(emp.name);
                          else updated = updated.filter(x => x !== emp.name);
                          setDraftAssignedList(updated.length > 0 ? updated : ['Équipe']);
                        }}
                        className="rounded border-stone-300 text-[#2A7B76]"
                      />
                      <span>{emp.name}</span>
                    </label>
                  ))}
                </div>
              )}
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
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sub.completed}
                      onChange={() => handleToggleSubtask(sub.id)}
                      className="w-4 h-4 rounded border-stone-300 text-[#2A7B76]"
                    />
                    <span className={`text-xs ${sub.completed ? 'line-through text-stone-400 font-medium' : 'text-stone-800 font-bold'}`}>
                      {sub.title}
                    </span>
                  </label>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Ajouter une sous-tâche..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); } }}
                className="flex-1 px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:ring-2 focus:ring-[#2A7B76]"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 bg-[#2A7B76] text-white rounded-xl text-xs font-bold hover:bg-[#23635f] cursor-pointer"
              >
                Ajouter
              </button>
            </div>
          </div>

          {/* Section Commentaires */}
          <div className="space-y-2.5 bg-stone-50 p-4 rounded-2xl border border-stone-200/80">
            <h4 className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-[#2A7B76]" /> Commentaires & Activité
            </h4>
            <div className="space-y-2 max-h-36 overflow-y-auto">
              {comments.map((com) => (
                <div key={com.id} className="bg-white p-2.5 rounded-xl border border-stone-200 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-stone-400 font-medium">
                    <span className="font-bold text-stone-700">{com.author}</span>
                    <span>{com.timestamp}</span>
                  </div>
                  <p className="text-stone-800">{com.text}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-[11px] text-stone-400 italic">Aucun commentaire pour le moment.</p>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Écrire un commentaire..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddComment(); } }}
                className="flex-1 px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:ring-2 focus:ring-[#2A7B76]"
              />
              <button
                type="button"
                onClick={handleAddComment}
                className="px-3 py-1.5 bg-[#2A7B76] text-white rounded-xl text-xs font-bold hover:bg-[#23635f] cursor-pointer"
              >
                Envoyer
              </button>
            </div>
          </div>

          {/* Section Signalement de blocage */}
          <div className="space-y-2 bg-rose-50/70 p-4 rounded-2xl border border-rose-200">
            <h4 className="font-bold text-rose-800 text-xs flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-600" /> Signaler une difficulté / un blocage
            </h4>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Décrivez le blocage rencontré..."
                value={blockerText}
                onChange={(e) => setBlockerText(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl border border-rose-200 bg-white text-xs outline-none focus:ring-2 focus:ring-rose-500 text-rose-900"
              />
              <button
                type="button"
                onClick={handleSignalBlocker}
                className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 cursor-pointer"
              >
                Signaler
              </button>
            </div>
          </div>

        </form>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (confirm('Voulez-vous vraiment supprimer cette tâche ?')) {
                onDeleteTask(task.id);
                onClose();
              }
            }}
            className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Supprimer la tâche</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs hover:bg-stone-200 transition cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
