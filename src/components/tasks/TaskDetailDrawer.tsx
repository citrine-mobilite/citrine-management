import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Trash2,
  Check,
  Heart,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  Plus,
  GripVertical,
  Link2,
  Repeat,
  AlertTriangle,
  MessageSquare,
  ShieldAlert,
  Calendar,
  Clock,
  Tag,
  ArrowLeft,
  ListChecks,
  Users,
  CheckCircle2,
  Briefcase,
  Flag,
} from 'lucide-react';
import {
  AppUser,
  Comment,
  Employee,
  Incident,
  Subtask,
  Task,
  TaskPriority,
  TaskProject,
  TaskRecurrence,
  TaskStatus,
} from '../../types';
import { canManageTaskAssignment, isSelfOnlyUser } from '../../utils/roleUtils';
import { pushNotificationBridgeService } from '../../services/pushNotificationBridgeService';
import { notifyExceptionalTaskCompletion } from '../../services/exceptionalTaskCompletionService';
import {
  buildAsanaBreadcrumb,
  collectAllDependencyCandidates,
  findSubtaskByPath,
  getUnfinishedBlockers,
  resolveProjectSections,
} from './logic/asanaTreeEngine';
import {
  filterAndSortSubtasks,
  formatSubtaskRelativeDate,
  getCurrentWeekBounds,
  sortSubtasksNewestFirst,
  SubtaskFilterPeriod,
} from '../../utils/subtaskFilterUtils';
import { SubtaskFilterBar } from './shared/SubtaskFilterBar';
import { SubtaskCreateModal } from './SubtaskCreateModal';

interface TaskDetailDrawerProps {
  task: Task | null;
  subtaskPath?: string[];
  onNavigatePath?: (path: string[]) => void;
  allTasks?: Task[];
  employees: Employee[];
  projects: TaskProject[];
  onClose: () => void;
  onSaveTask: (updatedTask: Task) => void;
  onSilentSaveTask?: (updatedTask: Task) => void;
  onToggleSubtaskAtPath?: (taskId: string, path: string[]) => void;
  onUpdateSubtaskAtPath?: (taskId: string, path: string[], patch: Partial<Subtask>) => void;
  onInlineAddSubtask?: (taskId: string, parentPath: string[], title: string, extra?: Partial<Subtask>) => void;
  onDeleteSubtaskAtPath?: (taskId: string, path: string[]) => void;
  onReorderSubtasksAtPath?: (taskId: string, parentPath: string[], draggedId: string, targetId: string) => void;
  onPromoteSubtaskToTask?: (taskId: string, path: string[]) => void;
  onDeleteTask: (task: Task) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
  currentRole?: string;
  currentUser?: AppUser | null;
}

const PRIORITY_OPTIONS: Array<{ value: TaskPriority; label: string }> = [
  { value: 'low', label: 'Basse' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'high', label: 'Haute' },
  { value: 'urgent', label: 'Urgente' },
];

const STATUS_OPTIONS: Array<{ value: TaskStatus; label: string }> = [
  { value: 'idea', label: 'Idée' },
  { value: 'todo', label: 'À faire' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'pending_validation', label: 'En validation' },
  { value: 'blocked', label: 'Bloquée' },
  { value: 'completed', label: 'Terminée' },
];

const RECURRENCE_OPTIONS: Array<{ value: TaskRecurrence; label: string }> = [
  { value: 'none', label: 'Aucune' },
  { value: 'daily', label: 'Quotidienne' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuelle' },
];

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = (props) => {
  if (!props.task) return null;
  return <TaskDetailDrawerContent {...props} task={props.task} />;
};

const TaskDetailDrawerContent: React.FC<Omit<TaskDetailDrawerProps, 'task'> & { task: Task }> = ({
  task,
  subtaskPath = [],
  onNavigatePath,
  allTasks = [],
  employees,
  projects,
  onClose,
  onSaveTask,
  onSilentSaveTask,
  onToggleSubtaskAtPath,
  onUpdateSubtaskAtPath,
  onInlineAddSubtask,
  onDeleteSubtaskAtPath,
  onReorderSubtasksAtPath,
  onPromoteSubtaskToTask,
  onDeleteTask,
  showToast,
  currentRole,
  currentUser,
}) => {
  const persistTask = onSilentSaveTask || onSaveTask;
  const isSubtaskMode = subtaskPath.length > 0;
  const activeSubtask = useMemo(
    () => (isSubtaskMode ? findSubtaskByPath(task.subtasks || [], subtaskPath) : null),
    [task.subtasks, subtaskPath, isSubtaskMode]
  );

  // Si le chemin pointe vers une sous-tâche supprimée, revenir au parent
  useEffect(() => {
    if (isSubtaskMode && !activeSubtask && onNavigatePath) {
      onNavigatePath(subtaskPath.slice(0, -1));
    }
  }, [isSubtaskMode, activeSubtask, subtaskPath, onNavigatePath]);

  const activeNode: Task | Subtask = activeSubtask || task;
  const canReassign = canManageTaskAssignment(currentUser, currentRole);
  const isEmpOrIntern = isSelfOnlyUser(currentUser, currentRole);
  const currentUserName = currentUser?.name || currentRole || 'Collaborateur';
  const isAssignedToCurrentUser =
    !currentUser ||
    !activeNode.assignedTo ||
    activeNode.assignedTo.includes(currentUser.name) ||
    activeNode.assignedTo === 'Équipe' ||
    isEmpOrIntern;

  const currentProject = projects.find((p) => p.id === (task.projectId || 'general'));
  const projectSections = resolveProjectSections(currentProject);
  const breadcrumbs = useMemo(
    () => buildAsanaBreadcrumb(task, subtaskPath, currentProject),
    [task, subtaskPath, currentProject]
  );

  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentWeekBounds = useMemo(() => getCurrentWeekBounds(), []);

  const [draftTitle, setDraftTitle] = useState(activeNode.title || '');
  const [draftDescription, setDraftDescription] = useState(activeNode.description || '');
  const [newSubTitle, setNewSubTitle] = useState('');
  const [newSubDueDate, setNewSubDueDate] = useState(
    activeNode.dueDate || (!isSubtaskMode ? task.date : '') || todayIso
  );
  const [newCommentText, setNewCommentText] = useState('');
  const [blockerText, setBlockerText] = useState('');
  const [newTagText, setNewTagText] = useState('');
  const [newCriterionText, setNewCriterionText] = useState('');
  const [showFollowersDropdown, setShowFollowersDropdown] = useState(false);
  const [showDepPicker, setShowDepPicker] = useState(false);
  const [depSearch, setDepSearch] = useState('');
  const [draggedSubId, setDraggedSubId] = useState<string | null>(null);
  const [expandedNestedIds, setExpandedNestedIds] = useState<Record<string, boolean>>({});
  const [isAdvancedSubModalOpen, setIsAdvancedSubModalOpen] = useState(false);
  const [savedIndicator, setSavedIndicator] = useState(false);

  const [subtaskFilterPeriod, setSubtaskFilterPeriod] = useState<SubtaskFilterPeriod>('current_week');
  const [subtaskFilterDate, setSubtaskFilterDate] = useState<string>(todayIso);
  const [subtaskRangeStart, setSubtaskRangeStart] = useState<string>(currentWeekBounds.startIso);
  const [subtaskRangeEnd, setSubtaskRangeEnd] = useState<string>(currentWeekBounds.endIso);

  useEffect(() => {
    setDraftTitle(activeNode.title || '');
    setDraftDescription(activeNode.description || '');
    setNewSubDueDate(
      activeNode.dueDate || (!isSubtaskMode ? task.date : '') || todayIso
    );
  }, [activeNode.id, activeNode.title, activeNode.description, activeNode.dueDate, isSubtaskMode, task.date, todayIso]);

  const flashSaved = () => {
    setSavedIndicator(true);
    setTimeout(() => setSavedIndicator(false), 1800);
  };

  /**
   * Met à jour instantanément le nœud courant (Tâche racine ou Sous-tâche à n'importe quelle profondeur).
   */
  const commitNodePatch = (patch: Partial<Task> & Partial<Subtask>) => {
    if (isSubtaskMode && onUpdateSubtaskAtPath) {
      onUpdateSubtaskAtPath(task.id, subtaskPath, patch);
    } else if (!isSubtaskMode) {
      persistTask({
        ...task,
        ...patch,
        lastUpdatedTime: new Date().toISOString(),
      });
    }
    flashSaved();
  };

  const isCompleted = isSubtaskMode
    ? Boolean(activeSubtask?.completed || activeSubtask?.status === 'completed')
    : task.status === 'completed';

  const unfinishedBlockers = useMemo(
    () => getUnfinishedBlockers(activeNode.dependsOnIds, allTasks),
    [activeNode.dependsOnIds, allTasks]
  );

  const handleToggleComplete = () => {
    if (!isCompleted && unfinishedBlockers.length > 0) {
      showToast?.(
        `Action bloquée : terminez d'abord « ${unfinishedBlockers[0].title} ».`,
        'error'
      );
      return;
    }
    if (isSubtaskMode && onToggleSubtaskAtPath) {
      onToggleSubtaskAtPath(task.id, subtaskPath);
      flashSaved();
    } else {
      const nextStatus: TaskStatus = isCompleted ? 'todo' : 'completed';
      const updatedSubtasks =
        nextStatus === 'completed'
          ? (task.subtasks || []).map((s) => ({
              ...s,
              completed: true,
              status: 'completed' as TaskStatus,
              completedAt: s.completedAt || new Date().toISOString(),
            }))
          : task.subtasks;
      const completedAt = nextStatus === 'completed' ? new Date().toISOString() : undefined;
      commitNodePatch({
        status: nextStatus,
        subtasks: updatedSubtasks,
        completedAt,
      });
      if (nextStatus === 'completed') {
        notifyExceptionalTaskCompletion(
          { ...task, status: 'completed', subtasks: updatedSubtasks, completedAt },
          currentUserName || task.assignedTo
        ).catch(() => {});
      }
    }
  };

  const likes = activeNode.likedBy || [];
  const hasLiked = likes.includes(currentUserName);
  const handleToggleLike = () => {
    const nextLikes = hasLiked
      ? likes.filter((u) => u !== currentUserName)
      : [...likes, currentUserName];
    commitNodePatch({ likedBy: nextLikes });
  };

  const allDepCandidates = useMemo(
    () => collectAllDependencyCandidates(allTasks, activeNode.id),
    [allTasks, activeNode.id]
  );
  const filteredDepCandidates = useMemo(() => {
    const q = depSearch.trim().toLowerCase();
    return allDepCandidates
      .filter((c) => !activeNode.dependsOnIds?.includes(c.id))
      .filter(
        (c) =>
          !q ||
          c.title.toLowerCase().includes(q) ||
          (c.parentTaskTitle || '').toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [allDepCandidates, activeNode.dependsOnIds, depSearch]);

  const handleAddDependency = (depId: string) => {
    const currentDeps = activeNode.dependsOnIds || [];
    if (currentDeps.includes(depId)) return;
    commitNodePatch({ dependsOnIds: [...currentDeps, depId] });
    setShowDepPicker(false);
    setDepSearch('');
  };

  const handleRemoveDependency = (depId: string) => {
    commitNodePatch({
      dependsOnIds: (activeNode.dependsOnIds || []).filter((id) => id !== depId),
    });
  };

  const DRAWER_SUGGESTED_TAGS = [
    'Exécution',
    'Contrôle',
    'Rédaction',
    'Design',
    'Technique',
    'Client',
    'Administration',
    'Urgent',
  ];

  const handleAddTag = (rawInput?: string) => {
    const source = rawInput !== undefined ? rawInput : newTagText;
    const tokens = source
      .split(/[,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (tokens.length === 0) {
      setNewTagText('');
      return;
    }
    const nextTags = [...(activeNode.tags || [])];
    let changed = false;
    for (const token of tokens) {
      if (!nextTags.some((existing) => existing.toLowerCase() === token.toLowerCase())) {
        nextTags.push(token);
        changed = true;
      }
    }
    if (changed) {
      commitNodePatch({ tags: nextTags });
    }
    setNewTagText('');
  };

  const handleToggleSuggestedTag = (tag: string) => {
    const currentTags = activeNode.tags || [];
    const exists = currentTags.some((t) => t.toLowerCase() === tag.toLowerCase());
    const nextTags = exists
      ? currentTags.filter((t) => t.toLowerCase() !== tag.toLowerCase())
      : [...currentTags, tag];
    commitNodePatch({ tags: nextTags });
  };

  const handleAddCriterion = () => {
    const clean = newCriterionText.trim();
    if (!clean) return;
    const currentCriteria = activeNode.acceptanceCriteria || [];
    commitNodePatch({ acceptanceCriteria: [...currentCriteria, clean] });
    setNewCriterionText('');
  };

  const handleToggleFollower = (empId: string) => {
    const current = activeNode.followerIds || [];
    const next = current.includes(empId)
      ? current.filter((id) => id !== empId)
      : [...current, empId];
    commitNodePatch({ followerIds: next });
  };

  const handleAddQuickSubtask = () => {
    const clean = newSubTitle.trim();
    if (!clean) return;
    if (onInlineAddSubtask) {
      onInlineAddSubtask(task.id, subtaskPath, clean, {
        dueDate: newSubDueDate,
        endDate: newSubDueDate,
      });
      flashSaved();
    }
    setNewSubTitle('');
  };

  const handleAddComment = () => {
    const clean = newCommentText.trim();
    if (!clean) return;
    const newCom: Comment = {
      id: `com-${Date.now()}`,
      author: currentUserName,
      text: clean,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };
    const nextComments = [...(activeNode.comments || []), newCom];
    commitNodePatch({ comments: nextComments });
    setNewCommentText('');
    const opKey = `task-comment:${activeNode.id}:${newCom.id}`;
    pushNotificationBridgeService.sendPush({
      operationKey: opKey,
      actionKey: opKey,
      title: 'Nouveau commentaire sur tâche',
      message: `${newCom.author} sur « ${activeNode.title} » : ${newCom.text}`,
      type: 'task_comment',
      link: 'tasks',
      suppressLocalNative: true,
      remoteBeams: {
        targetRoles: ['administrateur', 'responsable'],
        targetEmployeeIds: task.employeeId ? [String(task.employeeId)] : undefined,
      },
    });
  };

  const handleSignalBlocker = () => {
    const clean = blockerText.trim();
    if (!clean) return;
    const newInc: Incident = {
      id: `inc-${Date.now()}`,
      title: clean,
      description: clean,
      severity: 'high',
      createdAt: new Date().toLocaleDateString('fr-FR'),
      resolved: false,
    };
    const nextInc = [...(activeNode.incidents || []), newInc];
    commitNodePatch({
      status: 'blocked',
      incidents: nextInc,
      isBlocked: true,
      blockerReason: clean,
    });
    setBlockerText('');
    showToast?.('Blocage signalé et synchronisé.', 'error');
  };

  const handleRemoveIncident = (incId: string) => {
    const nextInc = (activeNode.incidents || []).filter((i) => i.id !== incId);
    const stillBlocked = nextInc.length > 0;
    commitNodePatch({
      incidents: nextInc,
      isBlocked: stillBlocked,
      blockerReason: stillBlocked ? nextInc[nextInc.length - 1].title : undefined,
      status: stillBlocked ? 'blocked' : activeNode.status === 'blocked' ? 'in_progress' : activeNode.status,
    });
  };

  const eligibleEmployees = useMemo(() => {
    if (currentProject?.memberIds && currentProject.memberIds.length > 0) {
      return employees.filter((e) => currentProject.memberIds!.includes(e.id));
    }
    return employees;
  }, [currentProject, employees]);

  const activeStartDate = activeNode.startDate || (!isSubtaskMode ? task.date : '') || '';
  const activeDueDate =
    activeNode.dueDate || (isSubtaskMode ? (activeSubtask?.endDate || '') : task.date) || '';

  const {
    displayedSubtasks: childSubtasks,
    hiddenCount: hiddenSubtaskCount,
    totalCount: totalSubtaskCount,
    activeRangeLabel,
  } = useMemo(
    () =>
      filterAndSortSubtasks(
        activeNode.subtasks || [],
        {
          period: subtaskFilterPeriod,
          specificDate: subtaskFilterDate,
          startDate: subtaskRangeStart,
          endDate: subtaskRangeEnd,
        },
        activeDueDate || task.date
      ),
    [
      activeNode.subtasks,
      subtaskFilterPeriod,
      subtaskFilterDate,
      subtaskRangeStart,
      subtaskRangeEnd,
      activeDueDate,
      task.date,
    ]
  );

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-stone-900/35 backdrop-blur-xs flex justify-end animate-in fade-in"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget && !isAdvancedSubModalOpen) {
            onClose();
          }
        }}
      >
        <aside
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-2xl h-full border-l border-stone-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        >
        {/* Top Asana Action Toolbar */}
        <div className="px-5 py-3 border-b border-stone-200 flex items-center justify-between gap-2 shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleComplete}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition whitespace-nowrap shrink-0 cursor-pointer ${
                isCompleted
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'bg-white border-stone-300 text-stone-700 hover:border-emerald-600 hover:text-emerald-700'
              }`}
            >
              <Check className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>{isCompleted ? 'Terminée' : 'Marquer comme terminée'}</span>
            </button>

            <span
              className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                isSubtaskMode
                  ? 'bg-emerald-50 text-[#2A7B76] border-emerald-200'
                  : 'bg-stone-100 text-stone-700 border-stone-200'
              }`}
              title={
                isSubtaskMode
                  ? "Sous-tâche : suit l'évolution de la réalisation liée à la tâche"
                  : 'Tâche cadre : représente le job description'
              }
            >
              <Briefcase className="h-3 w-3" />
              <span>{isSubtaskMode ? 'Sous-tâche (Évolution)' : 'Tâche (Job description)'}</span>
            </span>

            {savedIndicator && (
              <span className="text-[11px] font-medium text-emerald-700 tabular-nums">
                Synchronisé
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleToggleLike}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 transition cursor-pointer ${
                hasLiked
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'border-stone-200 text-stone-500 hover:bg-stone-50'
              }`}
              title="Aimer cette tâche"
            >
              <Heart className={`h-3.5 w-3.5 ${hasLiked ? 'fill-rose-500' : ''}`} />
              {likes.length > 0 && <span className="tabular-nums">{likes.length}</span>}
            </button>

            {isSubtaskMode && onPromoteSubtaskToTask && (
              <button
                type="button"
                onClick={() => onPromoteSubtaskToTask(task.id, subtaskPath)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-stone-200 text-stone-600 hover:bg-stone-50 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                title="Convertir cette sous-tâche en tâche principale du projet"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Promouvoir</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (isSubtaskMode && onDeleteSubtaskAtPath) {
                  onDeleteSubtaskAtPath(task.id, subtaskPath);
                } else {
                  onDeleteTask(task);
                  onClose();
                }
              }}
              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              title={isSubtaskMode ? 'Supprimer cette sous-tâche' : 'Supprimer cette tâche'}
            >
              <Trash2 className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
              title="Fermer le volet"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Asana Clickable Breadcrumb Bar */}
        <div className="px-5 py-2 bg-stone-50 border-b border-stone-200 flex items-center gap-1.5 text-xs overflow-x-auto shrink-0">
          {isSubtaskMode && onNavigatePath && (
            <button
              type="button"
              onClick={() => onNavigatePath(subtaskPath.slice(0, -1))}
              className="p-1 rounded hover:bg-stone-200/70 text-stone-600 cursor-pointer shrink-0"
              title="Revenir au parent"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
          )}
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            const clickable = crumb.kind !== 'project' && !isLast && Boolean(onNavigatePath);
            return (
              <React.Fragment key={`${crumb.kind}-${crumb.id}`}>
                {idx > 0 && <ChevronRight className="h-3 w-3 text-stone-400 shrink-0" />}
                {clickable ? (
                  <button
                    type="button"
                    onClick={() => onNavigatePath?.(crumb.path)}
                    className="text-stone-600 hover:text-[#2A7B76] hover:underline font-medium truncate max-w-[160px] cursor-pointer"
                  >
                    {crumb.title}
                  </button>
                ) : (
                  <span
                    className={`truncate max-w-[200px] ${
                      isLast ? 'font-semibold text-stone-900' : 'text-stone-500'
                    }`}
                  >
                    {crumb.title}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Main Scrollable Asana Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-xs">
          {/* Dependency Warning Banner if blocked by unfinished dependency */}
          {unfinishedBlockers.length > 0 && (
            <div className="px-3.5 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>
                En attente de :{' '}
                <strong>{unfinishedBlockers.map((b) => b.title).join(', ')}</strong>
              </span>
            </div>
          )}

          {/* Editable Title (Identical on Task & Subtask) */}
          <div>
            <input
              type="text"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onBlur={() => {
                const clean = draftTitle.trim();
                if (clean && clean !== activeNode.title) {
                  commitNodePatch({ title: clean });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  (e.currentTarget as HTMLInputElement).blur();
                }
              }}
              className={`w-full text-xl font-bold bg-transparent border border-transparent hover:border-stone-200 focus:border-[#2A7B76] focus:bg-white rounded-lg px-2 py-1.5 -mx-2 outline-none transition ${
                isCompleted ? 'line-through text-stone-400' : 'text-stone-900'
              }`}
              placeholder="Nom de la tâche..."
            />
          </div>

          {/* Asana Key-Value Metadata Grid (Identical Structure for Tasks & Subtasks) */}
          <div className="grid grid-cols-[140px_1fr] gap-y-3 gap-x-4 items-center border-y border-stone-100 py-4">
            {/* Responsable */}
            <span className="text-stone-500 font-medium">Responsable</span>
            <div>
              {canReassign ? (
                <select
                  value={activeNode.assignedTo || 'Équipe'}
                  onChange={(e) => {
                    const emp = employees.find((item) => item.name === e.target.value);
                    commitNodePatch({ assignedTo: e.target.value, employeeId: emp?.id });
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white font-medium text-stone-800 cursor-pointer outline-none focus:border-[#2A7B76]"
                >
                  <option value="Équipe">Toute l'équipe</option>
                  {eligibleEmployees.map((emp) => (
                    <option key={emp.id} value={emp.name}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="font-medium text-stone-800">{activeNode.assignedTo || 'Équipe'}</span>
              )}
            </div>

            {/* Dates (Début -> Échéance) */}
            <span className="text-stone-500 font-medium flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-stone-400" />
              <span>Échéance</span>
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={activeStartDate}
                onChange={(e) => commitNodePatch({ startDate: e.target.value })}
                className="px-2 py-1 rounded-lg border border-stone-200 bg-stone-50 text-stone-700 font-mono tabular-nums cursor-pointer"
                title="Date de début"
              />
              <span className="text-stone-400">→</span>
              <input
                type="date"
                value={activeDueDate}
                onChange={(e) =>
                  commitNodePatch({
                    dueDate: e.target.value,
                    ...(isSubtaskMode ? { endDate: e.target.value } : { date: e.target.value }),
                  })
                }
                className="px-2 py-1 rounded-lg border border-stone-200 bg-white text-stone-900 font-mono tabular-nums font-semibold cursor-pointer"
                title="Date d'échéance"
              />
              <input
                type="time"
                value={activeNode.time || '09:00'}
                onChange={(e) => commitNodePatch({ time: e.target.value })}
                className="px-2 py-1 rounded-lg border border-stone-200 bg-white text-stone-800 font-mono tabular-nums cursor-pointer"
                title="Heure limite"
              />
              <div className="flex items-center gap-1 ml-1 text-stone-500">
                <Repeat className="h-3.5 w-3.5 text-stone-400" />
                <select
                  value={activeNode.recurrence || 'none'}
                  onChange={(e) => commitNodePatch({ recurrence: e.target.value as TaskRecurrence })}
                  className="px-2 py-1 rounded-lg border border-stone-200 bg-white text-stone-700 cursor-pointer"
                  title="Récurrence"
                >
                  {RECURRENCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Projet & Section (pour tâche racine) */}
            {!isSubtaskMode && (
              <>
                <span className="text-stone-500 font-medium">Projet & Section</span>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={task.projectId || 'general'}
                    onChange={(e) => commitNodePatch({ projectId: e.target.value, sectionId: undefined })}
                    className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white font-medium text-stone-800 cursor-pointer"
                  >
                    {projects
                      .filter((p) => p.id !== 'all')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                  <select
                    value={task.sectionId || projectSections[0]?.id || 'sec_todo'}
                    onChange={(e) => commitNodePatch({ sectionId: e.target.value })}
                    className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 font-medium text-stone-700 cursor-pointer"
                  >
                    {projectSections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.title}
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-stone-500 font-medium flex items-center gap-1.5">
                  <Flag className="h-3.5 w-3.5 text-amber-600" />
                  <span>Jalon projet</span>
                </span>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={Boolean(task.isMilestone)}
                        onChange={(e) =>
                          commitNodePatch({
                            isMilestone: e.target.checked,
                            milestoneProgress: e.target.checked
                              ? task.milestoneProgress ?? (isCompleted ? 100 : 0)
                              : undefined,
                          })
                        }
                        className="rounded border-stone-300 text-amber-600 cursor-pointer"
                      />
                      <span className="font-semibold text-stone-800">
                        {task.isMilestone ? 'Jalon stratégique actif' : 'Marquer comme jalon clé'}
                      </span>
                    </label>
                    {task.isMilestone && (
                      <div className="flex items-center gap-2 bg-amber-50/70 border border-amber-200 rounded-lg px-2 py-1">
                        <span className="text-[11px] font-semibold text-amber-900">Avancement :</span>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={task.milestoneProgress ?? (isCompleted ? 100 : 0)}
                          onChange={(e) => {
                            const pct = Number(e.target.value);
                            commitNodePatch({
                              milestoneProgress: pct,
                              ...(pct >= 100 && task.status !== 'completed'
                                ? { status: 'completed', completedAt: new Date().toISOString() }
                                : {}),
                            });
                          }}
                          className="w-24 accent-amber-600 cursor-pointer"
                        />
                        <span className="font-mono font-bold text-amber-900 tabular-nums w-9 text-right">
                          {task.milestoneProgress ?? (isCompleted ? 100 : 0)}%
                        </span>
                      </div>
                    )}
                  </div>
                  {task.isMilestone && (
                    <input
                      type="text"
                      defaultValue={task.milestoneTarget || ''}
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val !== (task.milestoneTarget || '')) {
                          commitNodePatch({ milestoneTarget: val || undefined });
                        }
                      }}
                      placeholder="Livrable ou critère clé du jalon..."
                      className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50/40 focus:bg-white focus:border-amber-500 text-xs text-stone-800 outline-none"
                    />
                  )}
                </div>
              </>
            )}

            {/* Statut & Priorité */}
            <span className="text-stone-500 font-medium">Statut & Priorité</span>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={activeNode.status || (isCompleted ? 'completed' : 'todo')}
                onChange={(e) => {
                  const nextStatus = e.target.value as TaskStatus;
                  commitNodePatch({
                    status: nextStatus,
                    ...(isSubtaskMode ? { completed: nextStatus === 'completed' } : {}),
                    completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined,
                  });
                }}
                className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white font-semibold text-stone-800 cursor-pointer"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                value={activeNode.priority || 'medium'}
                onChange={(e) => commitNodePatch({ priority: e.target.value as TaskPriority })}
                className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white font-medium text-stone-800 cursor-pointer"
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Temps estimé & passé */}
            <span className="text-stone-500 font-medium flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-stone-400" />
              <span>Temps (h)</span>
            </span>
            <div className="flex items-center gap-3 tabular-nums">
              <label className="flex items-center gap-1.5 text-stone-600">
                <span>Estimé :</span>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={activeNode.estimatedHours ?? 0}
                  onChange={(e) => commitNodePatch({ estimatedHours: Number(e.target.value) || 0 })}
                  className="w-16 px-2 py-1 rounded-lg border border-stone-200 bg-white font-mono text-stone-900"
                />
              </label>
              <label className="flex items-center gap-1.5 text-stone-600">
                <span>Passé :</span>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={activeNode.actualHours ?? 0}
                  onChange={(e) => commitNodePatch({ actualHours: Number(e.target.value) || 0 })}
                  className="w-16 px-2 py-1 rounded-lg border border-stone-200 bg-white font-mono text-stone-900"
                />
              </label>
            </div>

            {/* Dépendances (Bloqué par) */}
            <span className="text-stone-500 font-medium flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5 text-stone-400" />
              <span>Dépendances</span>
            </span>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                {(activeNode.dependsOnIds || []).map((depId) => {
                  const found = allDepCandidates.find((c) => c.id === depId);
                  return (
                    <span
                      key={depId}
                      className="inline-flex items-center gap-1.5 text-xs text-stone-700 bg-stone-100 border border-stone-200 rounded-md px-2 py-0.5"
                    >
                      <span className={found?.completed ? 'line-through text-stone-400' : 'font-medium'}>
                        {found?.title || depId}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDependency(depId)}
                        className="text-stone-400 hover:text-rose-600 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setShowDepPicker((v) => !v)}
                  className="text-xs font-medium text-[#2A7B76] hover:underline cursor-pointer"
                >
                  + Ajouter une dépendance
                </button>
              </div>
              {showDepPicker && (
                <div className="p-2 rounded-lg border border-stone-200 bg-stone-50 space-y-1.5">
                  <input
                    type="text"
                    placeholder="Rechercher une tâche bloquante..."
                    value={depSearch}
                    onChange={(e) => setDepSearch(e.target.value)}
                    className="w-full px-2.5 py-1 rounded border border-stone-200 bg-white text-xs outline-none"
                  />
                  <div className="max-h-32 overflow-y-auto divide-y divide-stone-100">
                    {filteredDepCandidates.map((cand) => (
                      <button
                        key={cand.id}
                        type="button"
                        onClick={() => handleAddDependency(cand.id)}
                        className="w-full text-left px-2 py-1 hover:bg-white text-stone-700 flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <span className="truncate">{cand.title}</span>
                        {cand.parentTaskTitle && (
                          <span className="text-[10px] text-stone-400 truncate">{cand.parentTaskTitle}</span>
                        )}
                      </button>
                    ))}
                    {filteredDepCandidates.length === 0 && (
                      <div className="text-[11px] text-stone-400 py-1.5 px-2">Aucun résultat.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            <span className="text-stone-500 font-medium flex items-center gap-1.5 self-start pt-1">
              <Tag className="h-3.5 w-3.5 text-stone-400" />
              <span>Étiquettes ({(activeNode.tags || []).length})</span>
            </span>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                {(activeNode.tags || []).map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#2A7B76] bg-teal-50 border border-teal-200 rounded px-2 py-0.5"
                  >
                    <span>#{t}</span>
                    <button
                      type="button"
                      onClick={() =>
                        commitNodePatch({ tags: (activeNode.tags || []).filter((x) => x !== t) })
                      }
                      className="text-teal-600 hover:text-rose-600 cursor-pointer"
                      title={`Retirer l'étiquette ${t}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <div className="inline-flex items-center gap-1">
                  <input
                    type="text"
                    value={newTagText}
                    onChange={(e) => setNewTagText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    onBlur={() => {
                      if (newTagText.trim()) handleAddTag();
                    }}
                    placeholder="+ Étiquettes (Entrée ou virgule)"
                    className="px-2 py-0.5 text-xs bg-transparent border border-dashed border-stone-300 rounded outline-none focus:border-[#2A7B76] w-44"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTag()}
                    className="px-2 py-0.5 rounded border border-stone-200 bg-white hover:border-[#2A7B76] text-[#2A7B76] text-[11px] font-semibold cursor-pointer"
                    title="Ajouter les étiquettes saisies"
                  >
                    + Ajouter
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {DRAWER_SUGGESTED_TAGS.map((sug) => {
                  const selected = (activeNode.tags || []).some(
                    (t) => t.toLowerCase() === sug.toLowerCase()
                  );
                  return (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => handleToggleSuggestedTag(sug)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium border cursor-pointer transition ${
                        selected
                          ? 'bg-[#2A7B76] border-[#2A7B76] text-white'
                          : 'bg-stone-50 border-dashed border-stone-300 text-stone-600 hover:border-[#2A7B76] hover:text-[#2A7B76]'
                      }`}
                    >
                      {selected ? `✓ ${sug}` : `+ ${sug}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Collaborateurs abonnés */}
            <span className="text-stone-500 font-medium flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-stone-400" />
              <span>Abonnés</span>
            </span>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                {(activeNode.followerIds || []).map((id) => {
                  const emp = employees.find((e) => e.id === id || e.name === id);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 text-xs text-stone-700 bg-stone-100 border border-stone-200 rounded px-2 py-0.5"
                    >
                      <span>{emp?.name || id}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleFollower(id)}
                        className="text-stone-400 hover:text-rose-600 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setShowFollowersDropdown((v) => !v)}
                  className="text-xs font-medium text-[#2A7B76] hover:underline cursor-pointer"
                >
                  {showFollowersDropdown ? 'Fermer' : '+ Gérer les abonnés'}
                </button>
              </div>
              {showFollowersDropdown && (
                <div className="max-h-28 overflow-y-auto bg-stone-50 border border-stone-200 rounded-lg p-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {employees.map((emp) => (
                    <label
                      key={emp.id}
                      className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer px-1.5 py-0.5 rounded hover:bg-white"
                    >
                      <input
                        type="checkbox"
                        checked={(activeNode.followerIds || []).includes(emp.id)}
                        onChange={() => handleToggleFollower(emp.id)}
                        className="rounded border-stone-300 text-[#2A7B76]"
                      />
                      <span className="truncate">{emp.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-semibold text-stone-800 block">
              {isSubtaskMode ? 'Description & Détails de réalisation' : 'Description (Job description & périmètre)'}
            </label>
            <textarea
              rows={3}
              value={draftDescription}
              onChange={(e) => setDraftDescription(e.target.value)}
              onBlur={() => {
                if (draftDescription !== (activeNode.description || '')) {
                  commitNodePatch({ description: draftDescription });
                }
              }}
              placeholder="Ajouter des instructions, contexte ou livrables attendus..."
              className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-stone-50/70 focus:bg-white focus:border-[#2A7B76] outline-none text-stone-800"
            />
          </div>

          {/* Critères d'acceptation / validation (Identique Tâche & Sous-tâche) */}
          <div className="space-y-2 border-t border-stone-100 pt-4">
            <h4 className="font-semibold text-stone-900 flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5 text-[#2A7B76]" />
              <span>Critères d&apos;acceptation ({(activeNode.acceptanceCriteria || []).length})</span>
            </h4>

            {(activeNode.acceptanceCriteria || []).length > 0 && (
              <div className="space-y-1.5">
                {(activeNode.acceptanceCriteria || []).map((crit, idx) => (
                  <div
                    key={`${crit}-${idx}`}
                    className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50/70 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#2A7B76] shrink-0" />
                      <span className="text-stone-800 font-medium truncate">{crit}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        commitNodePatch({
                          acceptanceCriteria: (activeNode.acceptanceCriteria || []).filter(
                            (_, i) => i !== idx
                          ),
                        })
                      }
                      className="text-stone-400 hover:text-rose-600 p-0.5 cursor-pointer shrink-0"
                      title="Retirer ce critère"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ajouter un critère d'acceptation ou livrable attendu..."
                value={newCriterionText}
                onChange={(e) => setNewCriterionText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCriterion();
                  }
                }}
                className="flex-1 px-3 py-1.5 rounded-lg border border-stone-200 bg-white outline-none focus:border-[#2A7B76]"
              />
              <button
                type="button"
                onClick={handleAddCriterion}
                className="px-3 py-1.5 bg-white border border-stone-200 hover:border-[#2A7B76] text-[#2A7B76] rounded-lg font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Ajouter</span>
              </button>
            </div>
          </div>

          {/* Arborescence des Sous-tâches : Semaine en cours par défaut + Filtre date/période + Tri plus récentes -> plus anciennes */}
          <div className="space-y-3 border-t border-stone-100 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="font-semibold text-stone-900 flex items-center gap-2">
                  <span>
                    Évolutions &amp; Sous-tâches ({childSubtasks.length}/{totalSubtaskCount})
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                    {activeRangeLabel}
                  </span>
                </h4>
                {!isSubtaskMode && (
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Suivi hebdomadaire de l&apos;avancement par rapport au job description · Classées de la plus récente à la plus ancienne.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsAdvancedSubModalOpen(true)}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold text-[#2A7B76] cursor-pointer whitespace-nowrap"
              >
                + Nouvelle sous-tâche complète
              </button>
            </div>

            <SubtaskFilterBar
              period={subtaskFilterPeriod}
              onChangePeriod={setSubtaskFilterPeriod}
              specificDate={subtaskFilterDate}
              onChangeSpecificDate={setSubtaskFilterDate}
              rangeStart={subtaskRangeStart}
              onChangeRangeStart={setSubtaskRangeStart}
              rangeEnd={subtaskRangeEnd}
              onChangeRangeEnd={setSubtaskRangeEnd}
              totalCount={totalSubtaskCount}
            />

            {hiddenSubtaskCount > 0 && (
              <div className="px-3 py-2 rounded-xl bg-amber-50/90 border border-amber-200 text-[11px] text-amber-900 flex flex-wrap items-center justify-between gap-2">
                <span>
                  <strong>{hiddenSubtaskCount}</strong> sous-tâche{hiddenSubtaskCount > 1 ? 's' : ''} hors de la période affichée.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSubtaskFilterPeriod('date_range')}
                    className="font-semibold underline cursor-pointer"
                  >
                    Filtrer par période
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubtaskFilterPeriod('all')}
                    className="font-bold text-[#2A7B76] underline cursor-pointer"
                  >
                    Afficher toutes ({totalSubtaskCount})
                  </button>
                </div>
              </div>
            )}

            <div className="border border-stone-200 rounded-xl divide-y divide-stone-100 bg-white">
              {childSubtasks.length === 0 ? (
                <div className="py-5 px-4 text-center text-stone-400 space-y-1.5">
                  <p>
                    {totalSubtaskCount > 0
                      ? `Aucune sous-tâche sur cette période (${totalSubtaskCount} enregistrée${totalSubtaskCount > 1 ? 's' : ''} au total).`
                      : 'Aucune sous-tâche. Ajoutez-en une avec le formulaire complet ou ci-dessous.'}
                  </p>
                  {totalSubtaskCount > 0 && subtaskFilterPeriod !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSubtaskFilterPeriod('all')}
                      className="text-[#2A7B76] font-semibold hover:underline cursor-pointer"
                    >
                      Voir toutes les sous-tâches ({totalSubtaskCount})
                    </button>
                  )}
                </div>
              ) : (
                childSubtasks.map((sub) => {
                  const subPath = [...subtaskPath, sub.id];
                  const nestedCount = sub.subtasks?.length || 0;
                  const isExpanded = Boolean(expandedNestedIds[sub.id]);
                  const isSubDone = Boolean(sub.completed || sub.status === 'completed');
                  const relDate = formatSubtaskRelativeDate(sub, activeDueDate || task.date);
                  const criteriaCount = sub.acceptanceCriteria?.length || 0;

                  return (
                    <div key={sub.id} className="bg-white">
                      <div
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          setDraggedSubId(sub.id);
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (draggedSubId && draggedSubId !== sub.id && onReorderSubtasksAtPath) {
                            onReorderSubtasksAtPath(task.id, subtaskPath, draggedSubId, sub.id);
                          }
                          setDraggedSubId(null);
                        }}
                        className="flex items-center gap-2 px-3 py-2.5 hover:bg-stone-50 group"
                      >
                        <GripVertical className="h-3.5 w-3.5 text-stone-300 group-hover:text-stone-500 cursor-grab shrink-0" />
                        {nestedCount > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedNestedIds((prev) => ({ ...prev, [sub.id]: !prev[sub.id] }))
                            }
                            className="p-0.5 text-stone-400 hover:text-stone-700 cursor-pointer shrink-0"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </button>
                        ) : (
                          <span className="w-4 shrink-0" />
                        )}

                        <button
                          type="button"
                          onClick={() => onToggleSubtaskAtPath?.(task.id, subPath)}
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 cursor-pointer ${
                            isSubDone
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-stone-300 hover:border-[#2A7B76] text-transparent'
                          }`}
                        >
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </button>

                        <div className="flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => onNavigatePath?.(subPath)}
                            className={`w-full text-left truncate font-medium cursor-pointer hover:text-[#2A7B76] block ${
                              isSubDone ? 'line-through text-stone-400' : 'text-stone-800'
                            }`}
                          >
                            {sub.title}
                          </button>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[10px] text-stone-500">
                            <span className="font-mono text-stone-600">{relDate}</span>
                            {sub.priority && (
                              <span
                                className={`px-1.5 py-0.2 rounded font-semibold ${
                                  sub.priority === 'urgent' || sub.priority === 'high'
                                    ? 'bg-rose-50 text-rose-700'
                                    : sub.priority === 'medium'
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-stone-100 text-stone-600'
                                }`}
                              >
                                {sub.priority === 'urgent'
                                  ? 'Urgente'
                                  : sub.priority === 'high'
                                  ? 'Haute'
                                  : sub.priority === 'medium'
                                  ? 'Moyenne'
                                  : 'Basse'}
                              </span>
                            )}
                            {(sub.estimatedHours || sub.actualHours) ? (
                              <span className="font-mono text-blue-700 bg-blue-50 px-1.5 rounded">
                                {sub.actualHours || 0}h/{sub.estimatedHours || 0}h
                              </span>
                            ) : null}
                            {criteriaCount > 0 && (
                              <span className="text-[#2A7B76] bg-emerald-50 px-1.5 rounded">
                                ✓ {criteriaCount} critère{criteriaCount > 1 ? 's' : ''}
                              </span>
                            )}
                            {(sub.tags || []).map((t) => (
                              <span
                                key={t}
                                className="bg-teal-50 border border-teal-200 px-1.5 rounded text-[#2A7B76] font-medium"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        </div>

                        {nestedCount > 0 && (
                          <span className="text-[11px] text-stone-400 tabular-nums shrink-0">
                            {nestedCount} sous-tâche{nestedCount > 1 ? 's' : ''}
                          </span>
                        )}

                        <span className="text-[11px] text-stone-500 hidden sm:inline truncate max-w-[90px]">
                          {sub.assignedTo || 'Équipe'}
                        </span>

                        <input
                          type="date"
                          value={sub.dueDate || sub.endDate || ''}
                          onChange={(e) =>
                            onUpdateSubtaskAtPath?.(task.id, subPath, {
                              dueDate: e.target.value,
                              endDate: e.target.value,
                            })
                          }
                          className="text-[11px] font-mono text-stone-500 bg-transparent border border-transparent hover:border-stone-200 rounded px-1 py-0.5 cursor-pointer"
                        />

                        <button
                          type="button"
                          onClick={() => onNavigatePath?.(subPath)}
                          className="text-[11px] font-medium text-stone-400 hover:text-[#2A7B76] px-1.5 py-0.5 rounded hover:bg-stone-100 cursor-pointer shrink-0"
                          title="Ouvrir cette sous-tâche"
                        >
                          Détails ›
                        </button>
                      </div>

                      {isExpanded && sub.subtasks && sub.subtasks.length > 0 && (
                        <div className="pl-9 pr-3 pb-2 space-y-1 bg-stone-50/50 border-t border-stone-100">
                          {sortSubtasksNewestFirst(sub.subtasks, sub.dueDate || sub.endDate).map((grandChild) => {
                            const grandPath = [...subPath, grandChild.id];
                            const isGrandDone = Boolean(
                              grandChild.completed || grandChild.status === 'completed'
                            );
                            return (
                              <div
                                key={grandChild.id}
                                className="flex items-center gap-2 py-1 text-xs"
                              >
                                <span className="text-stone-300">└</span>
                                <button
                                  type="button"
                                  onClick={() => onToggleSubtaskAtPath?.(task.id, grandPath)}
                                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 cursor-pointer ${
                                    isGrandDone
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-stone-300 text-transparent'
                                  }`}
                                >
                                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onNavigatePath?.(grandPath)}
                                  className={`flex-1 text-left truncate hover:text-[#2A7B76] cursor-pointer ${
                                    isGrandDone ? 'line-through text-stone-400' : 'text-stone-700'
                                  }`}
                                >
                                  {grandChild.title}
                                </button>
                                {(grandChild.tags || []).length > 0 && (
                                  <div className="hidden sm:flex flex-wrap items-center gap-1">
                                    {(grandChild.tags || []).map((t) => (
                                      <span
                                        key={t}
                                        className="text-[10px] bg-teal-50 border border-teal-200 px-1 rounded text-[#2A7B76]"
                                      >
                                        #{t}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <span className="text-[11px] font-mono text-stone-400 tabular-nums">
                                  {grandChild.dueDate || grandChild.endDate || ''}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Inline Quick Subtask Creator + Complete Form trigger */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                placeholder="Ajout rapide d'une sous-tâche..."
                value={newSubTitle}
                onChange={(e) => setNewSubTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddQuickSubtask();
                  }
                }}
                className="flex-1 px-3 py-1.5 rounded-lg border border-stone-200 bg-white outline-none focus:border-[#2A7B76]"
              />
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={newSubDueDate}
                  onChange={(e) => setNewSubDueDate(e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-stone-200 bg-white font-mono text-[11px]"
                />
                <button
                  type="button"
                  onClick={handleAddQuickSubtask}
                  className="px-3 py-1.5 bg-[#2A7B76] hover:bg-[#226460] text-white rounded-lg font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Ajouter</span>
                </button>
              </div>
            </div>
          </div>

          {/* Commentaires (Points Manager Feuille de tâches) */}
          <div className="space-y-2.5 border-t border-stone-100 pt-4">
            <h4 className="font-semibold text-stone-900 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-[#2A7B76]" />
              <span>Commentaires & Points manager ({(activeNode.comments || []).length})</span>
            </h4>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {(activeNode.comments || []).map((com) => (
                <div key={com.id} className="p-2.5 rounded-lg border border-stone-200 bg-stone-50/70 space-y-0.5">
                  <div className="flex items-center justify-between text-[11px] text-stone-500">
                    <span className="font-semibold text-stone-800">{com.author}</span>
                    <span className="tabular-nums">{com.timestamp}</span>
                  </div>
                  <p className="text-stone-700">{com.text}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Poser une question ou laisser une note..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                className="flex-1 px-3 py-1.5 rounded-lg border border-stone-200 bg-white outline-none focus:border-[#2A7B76]"
              />
              <button
                type="button"
                onClick={handleAddComment}
                className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-semibold cursor-pointer"
              >
                Publier
              </button>
            </div>
          </div>

          {/* Blocages & Difficultés (Imprévus Feuille de tâches) */}
          <div className="space-y-2.5 border-t border-stone-100 pt-4">
            <h4 className="font-semibold text-rose-800 flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
              <span>Blocages & Imprévus ({(activeNode.incidents || []).length})</span>
            </h4>

            {(activeNode.incidents || []).length > 0 && (
              <div className="space-y-1.5">
                {(activeNode.incidents || []).map((inc) => (
                  <div
                    key={inc.id}
                    className="flex items-center justify-between p-2 rounded-lg border border-rose-200 bg-rose-50/60"
                  >
                    <span className="text-stone-800 font-medium">{inc.title}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveIncident(inc.id)}
                      className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {(!canReassign || isAssignedToCurrentUser) && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Signaler un blocage ou imprévu..."
                  value={blockerText}
                  onChange={(e) => setBlockerText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSignalBlocker();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-rose-200 bg-white outline-none focus:border-rose-500"
                />
                <button
                  type="button"
                  onClick={handleSignalBlocker}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Signaler
                </button>
              </div>
            )}
          </div>
        </div>
        </aside>
      </div>

      <SubtaskCreateModal
        isOpen={isAdvancedSubModalOpen}
        onClose={() => setIsAdvancedSubModalOpen(false)}
        onCreateSubtask={(sub) => {
          onInlineAddSubtask?.(task.id, subtaskPath, sub.title, sub);
        }}
        employees={employees}
        parentTask={task}
        parentSubtaskTitle={isSubtaskMode ? activeNode.title : undefined}
        availableTasks={allTasks}
        projects={projects}
        currentUser={currentUser}
        currentRole={currentRole}
      />
    </>
  );
};
