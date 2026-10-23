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
import { Task, Employee, TaskStatus, TaskPriority, TaskProject, Subtask, Comment, AppUser, Incident } from '../../types';
import { pushNotificationBridgeService } from '../../services/pushNotificationBridgeService';
import { SubtaskCreateModal } from './SubtaskCreateModal';
import { SubtaskDetailModal } from './SubtaskDetailModal';
import { canManageTaskAssignment, isSelfOnlyUser } from '../../utils/roleUtils';

interface TaskDetailDrawerProps {
  task: Task | null;
  employees: Employee[];
  projects: TaskProject[];
  onClose: () => void;
  onSaveTask: (updatedTask: Task) => void;
  onDeleteTask: (task: Task) => void;
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
  const canReassign = canManageTaskAssignment(currentUser, currentRole);
  const isEmpOrIntern = isSelfOnlyUser(currentUser, currentRole);
  const isAssignedToCurrentUser = !currentUser || !task.assignedTo || task.assignedTo.includes(currentUser.name) || task.assignedTo === 'Équipe' || isEmpOrIntern;

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
  const [incidents, setIncidents] = useState<Incident[]>(task.incidents || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [blockerText, setBlockerText] = useState('');
  const [isSavedRecently, setIsSavedRecently] = useState(false);
  const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);
  const [selectedSubtaskForDetail, setSelectedSubtaskForDetail] = useState<Subtask | null>(null);

  const handleCreateSubtask = (newSub: Subtask) => {
    const updated = [...subtasks, newSub];
    setSubtasks(updated);
    onSaveTask({ ...task, subtasks: updated });
    if (showToast) showToast('Sous-tâche détaillée créée avec succès !', 'success');
  };

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
    setIncidents(task.incidents || []);
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

    const finalAssigned = canReassign
      ? (draftAssignedList.length > 0 ? draftAssignedList.join(', ') : 'Équipe')
      : (task.assignedTo || 'Équipe');

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
    const newInc: Incident = {
      id: `inc-${Date.now()}`,
      title: blockerText.trim(),
      description: blockerText.trim(),
      severity: 'high',
      createdAt: new Date().toLocaleDateString('fr-FR'),
      resolved: false,
    };
    const updatedInc = [...incidents, newInc];
    setIncidents(updatedInc);
    const updated: Task = {
      ...task,
      status: 'blocked',
      incidents: updatedInc,
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
          
          {/* Renommer le titre de la tâche - Grand et visible (style H2/H3) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>📌 Intitulé de la tâche *</span>
              </h3>
              <span className="text-[10px] text-stone-400 font-mono">ID: {task.id}</span>
            </div>
            <input
              type="text"
              required
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50 font-serif font-bold text-stone-900 text-lg sm:text-xl focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none transition shadow-2xs"
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
              {!canReassign ? (
                <div className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-100 text-stone-700 font-medium text-xs flex items-center justify-between">
                  <span className="font-bold text-stone-800">{task.assignedTo || 'Équipe'}</span>
                  <span className="text-[10px] text-stone-400 italic">Attribution fixée (non réassignable)</span>
                </div>
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
              {subtasks.map((sub: any) => (
                <div key={sub.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-2.5 rounded-xl border border-stone-200 gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={sub.completed}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleToggleSubtask(sub.id);
                      }}
                      className="w-4 h-4 rounded border-stone-300 text-[#2A7B76] cursor-pointer shrink-0"
                    />
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSubtaskForDetail(sub);
                      }}
                      className="min-w-0 flex-1 cursor-pointer group"
                      title="Cliquer pour ouvrir le détail complet de cette sous-tâche"
                    >
                      <h4 
                        className={`text-sm sm:text-base font-bold text-stone-900 group-hover:text-[#2A7B76] transition truncate ${sub.completed ? 'line-through text-stone-400 font-medium' : ''}`}
                      >
                        {sub.title} {sub.subtasks && sub.subtasks.length > 0 ? `(${sub.subtasks.length} sous-tâche(s))` : ''}
                      </h4>
                      {sub.description && (
                        <p className="text-[11px] text-stone-500 truncate mt-0.5">{sub.description}</p>
                      )}
                      {(sub.status === 'blocked' || sub.isBlocked || sub.blockerReason || (sub.incidents && sub.incidents.length > 0)) && (
                        <div className="text-[10px] text-rose-700 font-semibold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md mt-1 inline-flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 shrink-0 text-rose-600" />
                          <span className="truncate">Blocage : {sub.blockerReason || (sub.incidents && sub.incidents.length > 0 ? sub.incidents[sub.incidents.length - 1].title : 'Difficulté signalée')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] shrink-0 self-end sm:self-auto">
                    {(sub.status === 'blocked' || sub.isBlocked || (sub.incidents && sub.incidents.length > 0)) && (
                      <span className="px-2 py-0.5 rounded-md font-bold text-[9px] bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 shrink-0">
                        <AlertTriangle className="h-2.5 w-2.5 text-rose-600" />
                        <span>Bloquée</span>
                      </span>
                    )}
                    {sub.assignedTo && (
                      <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-medium">
                        {sub.assignedTo}
                      </span>
                    )}
                    {sub.estimatedHours && (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-mono font-bold">
                        {sub.estimatedHours}h
                      </span>
                    )}
                    {sub.priority && (
                      <span className={`px-1.5 py-0.5 rounded-md font-bold uppercase text-[9px] ${
                        sub.priority === 'urgent' || sub.priority === 'high' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-stone-100 text-stone-600'
                      }`}>
                        {sub.priority}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSubtaskForDetail(sub);
                      }}
                      className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[10px] font-bold cursor-pointer"
                      title="Ouvrir le détail complet et options de la sous-tâche"
                    >
                      Ouvrir ⚙️
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = subtasks.filter((s) => s.id !== sub.id);
                        setSubtasks(updated);
                        onSaveTask({ ...task, subtasks: updated });
                      }}
                      className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer transition"
                      title="Supprimer cette sous-tâche"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-1 pb-1">
              <button
                type="button"
                onClick={() => setIsSubtaskModalOpen(true)}
                className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-[#2A7B76] border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                title="Créer une sous-tâche détaillée avec le même procédé stylé que les tâches (style Asana)"
              >
                <span>+ Nouvelle sous-tâche détaillée (Style Asana)</span>
              </button>
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
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-[#2A7B76]" />
                <span>Commentaires &amp; Activité ({comments.length})</span>
              </h4>
              <span className="text-[10px] text-[#2A7B76] font-semibold bg-[#2A7B76]/10 px-2 py-0.5 rounded-full">
                Points pour le manager
              </span>
            </div>
            <p className="text-[10px] text-stone-500 italic">
              Vos commentaires rédigés ici font office de points à signaler au manager dans votre feuille de temps.
            </p>
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

          {/* Section Signalement de blocage (Autant de blocages qu'on veut) */}
          <div className="space-y-2.5 bg-rose-50/70 p-4 rounded-2xl border border-rose-200">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-rose-800 text-xs flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                <span>Blocages &amp; Difficultés signalés ({incidents.length})</span>
              </h4>
              <span className="text-[10px] text-rose-700 font-semibold bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                Imprévus en feuille de temps
              </span>
            </div>
            <p className="text-[10px] text-rose-600/90 italic">
              Les blocages signalés ici font office d'imprévus dans la feuille de temps (signalés directement par le collaborateur assigné).
            </p>

            {incidents.length > 0 && (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {incidents.map((inc) => (
                  <div key={inc.id} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-rose-200 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                      <span className="text-stone-800 font-medium truncate">{inc.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updatedInc = incidents.filter((i) => i.id !== inc.id);
                        setIncidents(updatedInc);
                        const updated: Task = {
                          ...task,
                          incidents: updatedInc,
                          status: updatedInc.length === 0 ? 'in_progress' : 'blocked',
                        };
                        onSaveTask(updated);
                      }}
                      className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer transition"
                      title="Supprimer ce blocage"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {canReassign && !isAssignedToCurrentUser ? (
              <div className="bg-white/80 p-2.5 rounded-xl border border-rose-200 text-stone-600 text-[11px] flex items-center gap-2">
                <span className="text-base">🛡️</span>
                <span>
                  Les blocages font office d'imprévus : ils sont signalés par le collaborateur assigné (<strong>{task.assignedTo || 'l\'employé'}</strong>) lors de l'exécution de sa tâche.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Décrivez un nouveau blocage..."
                  value={blockerText}
                  onChange={(e) => setBlockerText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSignalBlocker();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-rose-200 bg-white text-xs outline-none focus:ring-2 focus:ring-rose-500 text-rose-900"
                />
                <button
                  type="button"
                  onClick={handleSignalBlocker}
                  className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 cursor-pointer shrink-0"
                >
                  Signaler
                </button>
              </div>
            )}
          </div>

        </form>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onDeleteTask(task);
              onClose();
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

      {/* Subtask Create Modal (Asana style) */}
      <SubtaskCreateModal
        isOpen={isSubtaskModalOpen}
        onClose={() => setIsSubtaskModalOpen(false)}
        onCreateSubtask={handleCreateSubtask}
        employees={employees}
        parentTask={task}
        projects={projects}
        currentUser={currentUser}
        currentRole={currentRole}
      />

      {/* Subtask Detail Modal (behaves like a task, supports infinite nested subtasks) */}
      {selectedSubtaskForDetail && (
        <SubtaskDetailModal
          isOpen={true}
          subtask={selectedSubtaskForDetail}
          onClose={() => setSelectedSubtaskForDetail(null)}
          onSaveSubtask={(updatedSub) => {
            const updateInTree = (list: Subtask[]): Subtask[] => {
              return list.map((s) => {
                if (s.id === updatedSub.id) return updatedSub;
                if (s.subtasks && s.subtasks.length > 0) return { ...s, subtasks: updateInTree(s.subtasks) };
                return s;
              });
            };
            const updatedList = updateInTree(subtasks);
            setSubtasks(updatedList);
            onSaveTask({ ...task, subtasks: updatedList });
            setSelectedSubtaskForDetail(updatedSub);
          }}
          employees={employees}
          projects={projects}
          showToast={showToast}
          currentUser={currentUser}
          currentRole={currentRole}
        />
      )}
    </div>
  );
};
