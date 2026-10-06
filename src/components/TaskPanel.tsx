import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Lock, 
  Mail, 
  FileText, 
  Edit, 
  Trash2, 
  MessageSquare,
  Sparkles,
  Calendar,
  Send,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Paperclip,
  Check,
  User,
  PlusCircle,
  Download,
  AlertOctagon,
  X
} from 'lucide-react';
import { Task, TaskStatus, TaskPriority, NotificationLog, Employee, Subtask, Comment, Attachment, Incident } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { haptic } from '../services/hapticService';
import SwipeableListItem from './SwipeableListItem';
import { SearchableSelect } from './common/SearchableSelect';

interface TaskPanelProps {
  tasks: Task[];
  onUpdateTasks: (updated: Task[]) => void;
  onAddNotification: (log: NotificationLog) => void;
  currentRole: 'Administrateur' | 'Employé' | 'Responsable';
  employees: Employee[];
  selectedEmployeeId: string;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

// Global columns for the status board with highly distinguishable status colors and clear contrasts
const STATUS_COLUMNS = [
  { 
    id: 'todo', 
    label: 'Tâches (À faire)', 
    bg: 'bg-stone-200/40', 
    border: 'border-stone-300/80', 
    text: 'text-stone-800', 
    badge: 'bg-stone-300/80 text-stone-800' 
  },
  { 
    id: 'in_progress', 
    label: 'En cours', 
    bg: 'bg-amber-100/30', 
    border: 'border-amber-300/60', 
    text: 'text-amber-900', 
    badge: 'bg-amber-200 text-amber-900' 
  },
  { 
    id: 'pending_validation', 
    label: 'En attente de validation', 
    bg: 'bg-emerald-50/40', 
    border: 'border-emerald-200/60', 
    text: 'text-stone-900', 
    badge: 'bg-emerald-100 text-emerald-800' 
  },
  { 
    id: 'completed', 
    label: 'Terminée', 
    bg: 'bg-emerald-50/40', 
    border: 'border-emerald-200/60', 
    text: 'text-stone-900', 
    badge: 'bg-emerald-100 text-emerald-800' 
  },
  { 
    id: 'blocked', 
    label: 'Bloquée / Incident 🚨', 
    bg: 'bg-red-100/30', 
    border: 'border-red-300/60', 
    text: 'text-red-950', 
    badge: 'bg-red-200 text-red-950' 
  }
] as const;

// Recursive Subtask Tree Component
interface RecursiveSubtaskListProps {
  subtasks: Subtask[];
  depth: number;
  onToggleComplete: (id: string) => void;
  onAddSubSubtask: (parentId: string, title: string) => void;
  onAddSubtaskComment: (subtaskId: string, commentText: string) => void;
}

function RecursiveSubtaskList({
  subtasks,
  depth,
  onToggleComplete,
  onAddSubSubtask,
  onAddSubtaskComment
}: RecursiveSubtaskListProps) {
  const [activeSubIdForComment, setActiveSubIdForComment] = useState<string | null>(null);
  const [activeSubIdForSubtask, setActiveSubIdForSubtask] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [subtaskTitle, setSubtaskTitle] = useState('');

  return (
    <div className={`space-y-2 ${depth > 0 ? 'ml-5 pl-2.5 border-l border-green-100 mt-2' : ''}`}>
      {subtasks.map(sub => (
        <div key={sub.id} className="bg-stone-50/50 p-2.5 rounded-xl border border-stone-100 text-xs">
          <div className="flex items-center justify-between gap-2 flex-wrap md:flex-nowrap">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={sub.completed}
                onChange={() => onToggleComplete(sub.id)}
                className="rounded text-green-600 focus:ring-green-500 h-3.5 w-3.5 cursor-pointer accent-green-600"
              />
              <span className={`font-medium ${sub.completed ? 'line-through text-stone-400' : 'text-stone-700'}`}>
                {sub.title}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-[10px] text-stone-400">
              <button
                type="button"
                onClick={() => {
                  setActiveSubIdForSubtask(activeSubIdForSubtask === sub.id ? null : sub.id);
                  setActiveSubIdForComment(null);
                }}
                className="text-stone-500 hover:text-green-600 font-bold bg-transparent border-0 cursor-pointer p-0"
              >
                + Sous-tâche
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  setActiveSubIdForComment(activeSubIdForComment === sub.id ? null : sub.id);
                  setActiveSubIdForSubtask(null);
                }}
                className="text-stone-500 hover:text-green-600 font-bold bg-transparent border-0 cursor-pointer p-0"
              >
                💬 Commenter ({sub.comments?.length || 0})
              </button>
            </div>
          </div>

          {/* Subtask Comments Feed */}
          {sub.comments && sub.comments.length > 0 && (
            <div className="mt-1.5 ml-5 pl-2 border-l border-stone-200 space-y-1 text-[10px] text-stone-500 italic bg-stone-100/30 p-1.5 rounded-lg">
              {sub.comments.map(c => (
                <div key={c.id} className="flex justify-between gap-1">
                  <span><strong>{c.author}:</strong> {c.text}</span>
                  <span className="text-[8px] text-stone-300 shrink-0">{new Date(c.timestamp).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              ))}
            </div>
          )}

          {/* New Sub-subtask Input */}
          {activeSubIdForSubtask === sub.id && (
            <div className="mt-2 ml-5 flex gap-1.5 items-center">
              <input
                type="text"
                placeholder="Ajouter une sous-tâche..."
                value={subtaskTitle}
                onChange={(e) => setSubtaskTitle(e.target.value)}
                className="flex-1 p-1 text-[11px] border border-stone-200 rounded-lg focus:outline-green-500 bg-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (subtaskTitle.trim()) {
                      onAddSubSubtask(sub.id, subtaskTitle.trim());
                      setSubtaskTitle('');
                      setActiveSubIdForSubtask(null);
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (subtaskTitle.trim()) {
                    onAddSubSubtask(sub.id, subtaskTitle.trim());
                    setSubtaskTitle('');
                    setActiveSubIdForSubtask(null);
                  }
                }}
                className="bg-green-600 text-white px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer"
              >
                Ajouter
              </button>
            </div>
          )}

          {/* New Comment Input */}
          {activeSubIdForComment === sub.id && (
            <div className="mt-2 ml-5 flex gap-1.5 items-center">
              <input
                type="text"
                placeholder="Rédiger un commentaire..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 p-1 text-[11px] border border-stone-200 rounded-lg focus:outline-green-500 bg-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (commentText.trim()) {
                      onAddSubtaskComment(sub.id, commentText.trim());
                      setCommentText('');
                      setActiveSubIdForComment(null);
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (commentText.trim()) {
                    onAddSubtaskComment(sub.id, commentText.trim());
                    setCommentText('');
                    setActiveSubIdForComment(null);
                  }
                }}
                className="bg-stone-600 text-white px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer"
              >
                Commenter
              </button>
            </div>
          )}

          {/* Recursive nesting */}
          {sub.subtasks && sub.subtasks.length > 0 && (
            <RecursiveSubtaskList
              subtasks={sub.subtasks}
              depth={depth + 1}
              onToggleComplete={onToggleComplete}
              onAddSubSubtask={onAddSubSubtask}
              onAddSubtaskComment={onAddSubtaskComment}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function TaskPanel({
  tasks,
  onUpdateTasks,
  onAddNotification,
  currentRole,
  employees,
  selectedEmployeeId,
}: TaskPanelProps) {
  // View mode
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  
  // Collaborative assignee filter (by default, active collaborator if employee role)
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

  // Pagination for list view (default 25)
  const [taskListPage, setTaskListPage] = useState<number>(1);
  const [taskListPageSize, setTaskListPageSize] = useState<number>(25);

  // Quick Daily task input
  const [dailyTaskTitle, setDailyTaskTitle] = useState('');
  const [dailyTaskPriority, setDailyTaskPriority] = useState<TaskPriority>('medium');

  // Selected focused task (for details workspace / Asana-style panel)
  const [focusedTask, setFocusedTask] = useState<Task | null>(null);

  // New Comment Input
  const [newCommentText, setNewCommentText] = useState('');

  // Incident declaration modal state
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentTitle, setIncidentTitle] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentSeverity, setIncidentSeverity] = useState<'low' | 'medium' | 'high'>('medium');

  // Manual Creation/Modification Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDate, setTaskDate] = useState('2026-07-08');
  const [taskTime, setTaskTime] = useState('09:00');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('todo');
  const [taskAssigneeId, setTaskAssigneeId] = useState<string>(selectedEmployeeId || 'emp-3');

  // Visual success notification bar
  const [liveSuccessAlert, setLiveSuccessAlert] = useState<string | null>(null);

  // Drag and Drop States
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [draggedOverColId, setDraggedOverColId] = useState<TaskStatus | null>(null);

  // Automatically enforce employee filters if logged in as collaborator
  React.useEffect(() => {
    if (currentRole === 'Employé' && selectedEmployeeId) {
      setAssigneeFilter(selectedEmployeeId);
      setTaskAssigneeId(selectedEmployeeId);
    }
  }, [currentRole, selectedEmployeeId]);

  // Current logged in name
  const activeUserDisplayName = useMemo(() => {
    if (currentRole === 'Responsable') return 'Responsable RH';
    if (currentRole === 'Administrateur') return 'Administrateur';
    return employees.find(e => e.id === selectedEmployeeId)?.name || 'Collaborateur';
  }, [currentRole, employees, selectedEmployeeId]);

  // Helper to count subtasks recursively
  const getSubtasksStats = (subtasks?: Subtask[]) => {
    if (!subtasks || subtasks.length === 0) return { total: 0, completed: 0 };
    let total = 0;
    let completed = 0;
    
    function recurse(list: Subtask[]) {
      list.forEach(item => {
        total++;
        if (item.completed) completed++;
        if (item.subtasks && item.subtasks.length > 0) {
          recurse(item.subtasks);
        }
      });
    }
    recurse(subtasks);
    return { total, completed };
  };

  // Immediate email trigger to ALL project managers
  const triggerCompletionEmail = (task: Task) => {
    const managers = employees.filter(e => 
      e.roleType === 'gestionnaire de projet' || 
      e.roleType === 'gestionnaire de projet assistant'
    );

    const completedBy = employees.find(e => e.id === task.employeeId)?.name || activeUserDisplayName;
    const stats = getSubtasksStats(task.subtasks);

    managers.forEach(mgr => {
      const emailText = `Bonjour ${mgr.name},\n\n` +
        `Citrine Management vous informe qu'une tâche administrative vient d'être MARQUÉE COMME TERMINÉE.\n\n` +
        `📋 *FICHE DE LA TÂCHE :*\n` +
        `• Titre : ${task.title}\n` +
        `• Description : ${task.description || 'Aucune description fournie.'}\n` +
        `• Collaborateur : ${completedBy}\n` +
        `• Échéance originale : ${task.date} à ${task.time}\n` +
        `• Priorité de traitement : ${task.priority.toUpperCase()}\n` +
        `• Sous-tâches accomplies : ${stats.completed}/${stats.total}\n\n` +
        `💬 *HISTORIQUE DES ÉCHANGES :*\n` +
        (task.comments && task.comments.length > 0 
          ? task.comments.map(c => `- [${c.author}]: "${c.text}"`).join('\n')
          : 'Aucun commentaire ou log enregistré.') +
        `\n\nCet e-mail automatique a été acheminé instantanément aux gestionnaires de projet en vertu des règles de coordination de Citrine Management.`;

      onAddNotification({
        id: `email-done-${Date.now()}-${mgr.id}`,
        type: 'email',
        recipient: `${mgr.name} (${mgr.email})`,
        title: `✅ Tâche Complétée : ${task.title}`,
        content: emailText,
        payload: JSON.stringify({
          trigger: "task_completion_alert",
          task_id: task.id,
          task_title: task.title,
          collaborator: completedBy,
          manager_notified: mgr.email,
          timestamp: new Date().toISOString()
        }, null, 2),
        timestamp: new Date().toISOString()
      });
    });

    setLiveSuccessAlert(`Succès ! Email de livraison envoyé à tous les gestionnaires (${managers.map(m => m.name).join(', ')}).`);
    setTimeout(() => setLiveSuccessAlert(null), 5000);
  };

  // Helper to inject system comment automatically
  const addSystemLog = (task: Task, text: string): Task => {
    const sysComment: Comment = {
      id: `comment-sys-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      author: `Système (${activeUserDisplayName})`,
      text: text,
      timestamp: new Date().toISOString()
    };
    return {
      ...task,
      comments: [...(task.comments || []), sysComment]
    };
  };

  // Recursive helper to complete all nested subtasks automatically
  const completeAllSubtasksRecursively = (subs: Subtask[]): Subtask[] => {
    if (!subs || subs.length === 0) return [];
    return subs.map(sub => ({
      ...sub,
      completed: true,
      subtasks: completeAllSubtasksRecursively(sub.subtasks || [])
    }));
  };

  // Change task status (drag/move effect)
  const handleUpdateStatus = (taskId: string, newStatus: TaskStatus) => {
    haptic.success();
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        if (t.status === newStatus) return t;
        let loggedTask = addSystemLog(t, `🔄 Statut modifié de "${t.status}" à "${newStatus}"`);
        loggedTask.status = newStatus;
        if (newStatus === 'completed') {
          loggedTask.subtasks = completeAllSubtasksRecursively(loggedTask.subtasks || []);
          setTimeout(() => triggerCompletionEmail(loggedTask), 100);
        }
        return loggedTask;
      }
      return t;
    });
    onUpdateTasks(updated);

    // Sync focused task if open
    if (focusedTask && focusedTask.id === taskId) {
      const nextFocused = updated.find(u => u.id === taskId) || null;
      setFocusedTask(nextFocused);
    }
  };

  // Create Quick Daily Task
  const handleCreateDailyTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dailyTaskTitle.trim()) return;

    const assigneeId = currentRole === 'Employé' ? (selectedEmployeeId || 'emp-3') : (assigneeFilter !== 'all' ? assigneeFilter : 'emp-3');
    const assignedName = employees.find(e => e.id === assigneeId)?.name || 'Alice Bertrand';

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: dailyTaskTitle,
      description: 'Tâche rapide ajoutée au journal d\'activité quotidien.',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].slice(0, 5),
      priority: dailyTaskPriority,
      status: 'todo',
      employeeId: assigneeId,
      comments: [],
      attachments: [],
      incidents: [],
      subtasks: []
    };

    const finalizedTask = addSystemLog(newTask, `🆕 Tâche créée dans le journal quotidien par ${activeUserDisplayName} et attribuée à ${assignedName}`);
    onUpdateTasks([...tasks, finalizedTask]);
    
    // Log task assignment notification
    onAddNotification({
      id: `task-assign-${Date.now()}`,
      type: 'system',
      recipient: assignedName,
      title: `Tâche assignée : ${dailyTaskTitle}`,
      content: `La tâche "${dailyTaskTitle}" vous a été assignée par ${activeUserDisplayName}.`,
      payload: JSON.stringify({
        event: 'task_assigned',
        taskId: newTask.id,
        title: dailyTaskTitle,
        assignedTo: assigneeId,
        assignedToName: assignedName,
        assignedBy: activeUserDisplayName,
        assignedById: selectedEmployeeId,
        priority: newTask.priority,
        description: newTask.description
      }),
      timestamp: new Date().toISOString()
    });

    setDailyTaskTitle('');
    setLiveSuccessAlert('Nouvelle tâche consignée avec succès dans votre liste quotidienne.');
    setTimeout(() => setLiveSuccessAlert(null), 3000);
  };

  // Recursive helpers for Subtasks state modification
  const handleToggleSubtaskInTree = (subtaskId: string) => {
    if (!focusedTask) return;

    const toggleFn = (sub: Subtask): Subtask => {
      const nextCompleted = !sub.completed;
      let updatedSub = { ...sub, completed: nextCompleted };
      
      // Auto logger on subtask comments
      const sysLog: Comment = {
        id: `subcomment-sys-${Date.now()}`,
        author: `Système`,
        text: `🏁 Sous-tâche marquée comme ${nextCompleted ? 'TERMINÉE' : 'À FAIRE'} par ${activeUserDisplayName}`,
        timestamp: new Date().toISOString()
      };
      updatedSub.comments = [...(sub.comments || []), sysLog];
      return updatedSub;
    };

    const recursiveToggle = (list: Subtask[]): Subtask[] => {
      return list.map(sub => {
        if (sub.id === subtaskId) {
          return toggleFn(sub);
        }
        if (sub.subtasks && sub.subtasks.length > 0) {
          return {
            ...sub,
            subtasks: recursiveToggle(sub.subtasks)
          };
        }
        return sub;
      });
    };

    const updatedSubtasks = recursiveToggle(focusedTask.subtasks || []);
    let updatedTask: Task = { ...focusedTask, subtasks: updatedSubtasks };
    updatedTask = addSystemLog(updatedTask, `💡 Une sous-tâche a été mise à jour`);
    
    // Update main list
    const nextTasks = tasks.map(t => t.id === focusedTask.id ? updatedTask : t);
    onUpdateTasks(nextTasks);
    setFocusedTask(updatedTask);
  };

  // Add deep subtask
  const handleAddSubSubtask = (parentId: string, title: string) => {
    if (!focusedTask) return;

    const newSub: Subtask = {
      id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: title,
      completed: false,
      comments: [],
      subtasks: []
    };

    const appendFn = (sub: Subtask): Subtask => {
      return {
        ...sub,
        subtasks: [...(sub.subtasks || []), newSub]
      };
    };

    const recursiveAppend = (list: Subtask[]): Subtask[] => {
      return list.map(sub => {
        if (sub.id === parentId) {
          return appendFn(sub);
        }
        if (sub.subtasks && sub.subtasks.length > 0) {
          return {
            ...sub,
            subtasks: recursiveAppend(sub.subtasks)
          };
        }
        return sub;
      });
    };

    const updatedSubtasks = recursiveAppend(focusedTask.subtasks || []);
    let updatedTask: Task = { ...focusedTask, subtasks: updatedSubtasks };
    updatedTask = addSystemLog(updatedTask, `🌿 Nouvelle sous-tâche "${title}" insérée par ${activeUserDisplayName}`);

    const nextTasks = tasks.map(t => t.id === focusedTask.id ? updatedTask : t);
    onUpdateTasks(nextTasks);
    setFocusedTask(updatedTask);
  };

  // Add subtask comment
  const handleAddSubtaskComment = (subtaskId: string, commentText: string) => {
    if (!focusedTask) return;

    const newComment: Comment = {
      id: `subcomment-${Date.now()}`,
      author: activeUserDisplayName,
      text: commentText,
      timestamp: new Date().toISOString()
    };

    const recursiveComment = (list: Subtask[]): Subtask[] => {
      return list.map(sub => {
        if (sub.id === subtaskId) {
          return {
            ...sub,
            comments: [...(sub.comments || []), newComment]
          };
        }
        if (sub.subtasks && sub.subtasks.length > 0) {
          return {
            ...sub,
            subtasks: recursiveComment(sub.subtasks)
          };
        }
        return sub;
      });
    };

    const updatedSubtasks = recursiveComment(focusedTask.subtasks || []);
    let updatedTask: Task = { ...focusedTask, subtasks: updatedSubtasks };
    updatedTask = addSystemLog(updatedTask, `💬 Commentaire déposé sur la sous-tâche par ${activeUserDisplayName}`);

    const nextTasks = tasks.map(t => t.id === focusedTask.id ? updatedTask : t);
    onUpdateTasks(nextTasks);
    setFocusedTask(updatedTask);
  };

  // Add primary subtask on focused task
  const handleAddPrimarySubtask = (title: string) => {
    if (!focusedTask || !title.trim()) return;

    const newSub: Subtask = {
      id: `subtask-prim-${Date.now()}`,
      title: title,
      completed: false,
      comments: [],
      subtasks: []
    };

    let updatedTask: Task = {
      ...focusedTask,
      subtasks: [...(focusedTask.subtasks || []), newSub]
    };
    updatedTask = addSystemLog(updatedTask, `🌿 Sous-tâche racine "${title}" ajoutée par ${activeUserDisplayName}`);

    const nextTasks = tasks.map(t => t.id === focusedTask.id ? updatedTask : t);
    onUpdateTasks(nextTasks);
    setFocusedTask(updatedTask);
  };

  // Add normal comment to active task
  const handleAddManualComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!focusedTask || !newCommentText.trim()) return;

    const manualComment: Comment = {
      id: `comment-user-${Date.now()}`,
      author: activeUserDisplayName,
      text: newCommentText.trim(),
      timestamp: new Date().toISOString()
    };

    const updatedTask = {
      ...focusedTask,
      comments: [...(focusedTask.comments || []), manualComment]
    };

    const nextTasks = tasks.map(t => t.id === focusedTask.id ? updatedTask : t);
    onUpdateTasks(nextTasks);
    setFocusedTask(updatedTask);
    setNewCommentText('');
  };

  // Declare an incident (Asana-style warning block)
  const handleDeclareIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!focusedTask || !incidentTitle.trim()) return;

    const newIncident: Incident = {
      id: `incident-${Date.now()}`,
      title: incidentTitle.trim(),
      description: incidentDescription.trim() || 'Aucune description d\'incident fournie.',
      severity: incidentSeverity,
      createdAt: new Date().toISOString(),
      resolved: false
    };

    let updatedTask: Task = {
      ...focusedTask,
      incidents: [...(focusedTask.incidents || []), newIncident],
      status: 'blocked' as TaskStatus // Auto move to blocked status column
    };

    updatedTask = addSystemLog(updatedTask, `🚨 INCIDENT DÉCLARÉ : "${incidentTitle}" (Gravité: ${incidentSeverity.toUpperCase()}) par ${activeUserDisplayName}`);

    // Trigger immediate alert to Responsable RH as requested
    const alertSubject = `🚨 INCIDENT CRITIQUE SIGNALÉ : ${focusedTask.title}`;
    const alertBody = `Bonjour,\n\n` +
      `Un incident vient d'être déclaré sur la tâche administrative "${focusedTask.title}".\n` +
      `• Incident : ${incidentTitle}\n` +
      `• Gravité : ${incidentSeverity.toUpperCase()}\n` +
      `• Description : ${incidentDescription || 'Sans description.'}\n` +
      `• Déclarant : ${activeUserDisplayName}\n\n` +
      `La tâche a été basculée automatiquement sous statut BLOQUÉ. Veuillez intervenir pour débloquer la situation.`;

    onAddNotification({
      id: `email-inc-${Date.now()}`,
      type: 'email',
      recipient: 'Responsable RH (coordination@citrine.com)',
      title: alertSubject,
      content: alertBody,
      payload: JSON.stringify({
        event: "incident_declared",
        task_id: focusedTask.id,
        incident_id: newIncident.id,
        severity: incidentSeverity,
        title: incidentTitle,
        reported_by: activeUserDisplayName
      }, null, 2),
      timestamp: new Date().toISOString()
    });

    const nextTasks = tasks.map(t => t.id === focusedTask.id ? updatedTask : t);
    onUpdateTasks(nextTasks);
    setFocusedTask(updatedTask);
    setShowIncidentModal(false);
    setIncidentTitle('');
    setIncidentDescription('');
    setLiveSuccessAlert(`Incident déclaré ! Alerte instantanée notifiée aux superviseurs.`);
    setTimeout(() => setLiveSuccessAlert(null), 5000);
  };

  // Resolve active incident
  const handleResolveIncident = (incidentId: string) => {
    if (!focusedTask) return;

    const updatedIncidents = (focusedTask.incidents || []).map(inc => {
      if (inc.id === incidentId) {
        return { ...inc, resolved: true, resolvedAt: new Date().toISOString() };
      }
      return inc;
    });

    const incident = focusedTask.incidents?.find(i => i.id === incidentId);

    let updatedTask: Task = {
      ...focusedTask,
      incidents: updatedIncidents,
      status: 'in_progress' as TaskStatus // Move back to in_progress or let user decide
    };

    updatedTask = addSystemLog(updatedTask, `✅ INCIDENT RÉSOLU : "${incident?.title || 'Incident'}" par ${activeUserDisplayName}`);

    const nextTasks = tasks.map(t => t.id === focusedTask.id ? updatedTask : t);
    onUpdateTasks(nextTasks);
    setFocusedTask(updatedTask);
  };

  // Share simulated document / mock attachment
  const [mockFileName, setMockFileName] = useState('');
  const handleSimulateAttachment = (fileNameString: string) => {
    const finalName = fileNameString.trim() || 'Rapport_Administratif.pdf';
    if (!focusedTask) return;

    const newAttach: Attachment = {
      id: `attach-${Date.now()}`,
      name: finalName,
      url: '#',
      uploadedAt: new Date().toISOString(),
      size: `${(Math.random() * 4 + 1).toFixed(1)} Mo`
    };

    let updatedTask: Task = {
      ...focusedTask,
      attachments: [...(focusedTask.attachments || []), newAttach]
    };

    updatedTask = addSystemLog(updatedTask, `📎 Document partagé : "${finalName}" (${newAttach.size}) par ${activeUserDisplayName}`);

    const nextTasks = tasks.map(t => t.id === focusedTask.id ? updatedTask : t);
    onUpdateTasks(nextTasks);
    setFocusedTask(updatedTask);
    setMockFileName('');
  };

  // Real Upload File with select and Drag & Drop
  const handleUploadFile = (fileName: string, fileSize: string) => {
    if (!focusedTask) return;

    const newAttach: Attachment = {
      id: `attach-${Date.now()}`,
      name: fileName,
      url: '#',
      uploadedAt: new Date().toISOString(),
      size: fileSize
    };

    let updatedTask: Task = {
      ...focusedTask,
      attachments: [...(focusedTask.attachments || []), newAttach]
    };

    updatedTask = addSystemLog(updatedTask, `📎 Document téléversé : "${fileName}" (${fileSize}) par ${activeUserDisplayName}`);

    const nextTasks = tasks.map(t => t.id === focusedTask.id ? updatedTask : t);
    onUpdateTasks(nextTasks);
    setFocusedTask(updatedTask);
    
    setLiveSuccessAlert(`Fichier "${fileName}" téléversé et attaché à la tâche.`);
    setTimeout(() => setLiveSuccessAlert(null), 3000);
  };

  // Open task creator/editor modal
  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDescription(task.description || '');
    setTaskDate(task.date);
    setTaskTime(task.time);
    setTaskPriority(task.priority);
    setTaskStatus(task.status);
    setTaskAssigneeId(task.employeeId || selectedEmployeeId || 'emp-3');
    setShowAddModal(true);
  };

  // Save changes from Creator/Editor modal
  const handleSaveModalTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    if (editingTask) {
      // Modify
      const updated = tasks.map(t => {
        if (t.id === editingTask.id) {
          let updatedTask: Task = {
            ...t,
            title: taskTitle,
            description: taskDescription,
            date: taskDate,
            time: taskTime,
            priority: taskPriority,
            status: taskStatus,
            employeeId: taskAssigneeId
          };
          if (t.status !== taskStatus) {
            updatedTask = addSystemLog(updatedTask, `🔄 Statut modifié de "${t.status}" à "${taskStatus}"`);
            if (taskStatus === 'completed') {
              updatedTask.subtasks = completeAllSubtasksRecursively(updatedTask.subtasks || []);
              setTimeout(() => triggerCompletionEmail(updatedTask), 100);
            }
          } else {
            updatedTask = addSystemLog(updatedTask, `✏️ Tâche mise à jour`);
          }
          return updatedTask;
        }
        return t;
      });
      const assignedName = employees.find(e => e.id === taskAssigneeId)?.name || 'Collaborateur';
      if (editingTask && editingTask.employeeId !== taskAssigneeId) {
        // Reassignment
        onAddNotification({
          id: `task-assign-${Date.now()}`,
          type: 'system',
          recipient: assignedName,
          title: `Tâche réassignée : ${taskTitle}`,
          content: `La tâche "${taskTitle}" vous a été réassignée par ${activeUserDisplayName}.`,
          payload: JSON.stringify({
            event: 'task_assigned',
            taskId: editingTask.id,
            title: taskTitle,
            assignedTo: taskAssigneeId,
            assignedToName: assignedName,
            assignedBy: activeUserDisplayName,
            assignedById: selectedEmployeeId
          }),
          timestamp: new Date().toISOString()
        });
      }
      onUpdateTasks(updated);
      setLiveSuccessAlert('Fiche administrative mise à jour.');
    } else {
      // Create New
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: taskTitle,
        description: taskDescription,
        date: taskDate,
        time: taskTime,
        priority: taskPriority,
        status: taskStatus,
        employeeId: taskAssigneeId,
        comments: [],
        attachments: [],
        incidents: [],
        subtasks: []
      };
      let finalizedTask = addSystemLog(newTask, `🆕 Tâche créée de manière planifiée par ${activeUserDisplayName}`);
      if (taskStatus === 'completed') {
        setTimeout(() => triggerCompletionEmail(finalizedTask), 100);
      }
      onUpdateTasks([...tasks, finalizedTask]);

      // Assignment notification
      const assignedName = employees.find(e => e.id === taskAssigneeId)?.name || 'Collaborateur';
      onAddNotification({
        id: `task-assign-${Date.now()}`,
        type: 'system',
        recipient: assignedName,
        title: `Tâche assignée : ${taskTitle}`,
        content: `La tâche "${taskTitle}" vous a été assignée par ${activeUserDisplayName}.`,
        payload: JSON.stringify({
          event: 'task_assigned',
          taskId: newTask.id,
          title: taskTitle,
          assignedTo: taskAssigneeId,
          assignedToName: assignedName,
          assignedBy: activeUserDisplayName,
          assignedById: selectedEmployeeId,
          priority: newTask.priority,
          description: newTask.description
        }),
        timestamp: new Date().toISOString()
      });

      setLiveSuccessAlert('Nouvelle tâche administrative enregistrée.');
    }

    setShowAddModal(false);
    resetForm();
    setTimeout(() => setLiveSuccessAlert(null), 3000);
  };

  const resetForm = () => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDescription('');
    setTaskDate('2026-07-08');
    setTaskTime('09:00');
    setTaskPriority('medium');
    setTaskStatus('todo');
    setTaskAssigneeId(selectedEmployeeId || 'emp-3');
  };

  const handleDeleteTask = (taskId: string) => {
    const deletedTask = tasks.find(t => t.id === taskId);
    const updated = tasks.filter(t => t.id !== taskId);
    onUpdateTasks(updated);
    if (focusedTask?.id === taskId) {
      setFocusedTask(null);
    }
    setLiveSuccessAlert(`La tâche "${deletedTask?.title || ''}" a été supprimée avec succès.`);
    setTimeout(() => setLiveSuccessAlert(null), 3000);
  };

  // Native HTML5 Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDraggedOverColId(null);
  };

  const handleDragOver = (e: React.DragEvent, colId: TaskStatus) => {
    e.preventDefault();
    if (draggedOverColId !== colId) {
      setDraggedOverColId(colId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      handleUpdateStatus(taskId, targetStatus);
    }
    setDraggedTaskId(null);
    setDraggedOverColId(null);
  };

  // Filter tasks based on search, priority and assignee
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Security: if user is Employee, they can only see tasks assigned to them
      if (currentRole === 'Employé' && task.employeeId !== selectedEmployeeId) {
        return false;
      }
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      const matchesAssignee = assigneeFilter === 'all' || task.employeeId === assigneeFilter;
      return matchesSearch && matchesPriority && matchesAssignee;
    });
  }, [tasks, searchTerm, priorityFilter, assigneeFilter, currentRole, selectedEmployeeId]);

  // Simulate Friday Report
  const triggerFridayReportSimulation = () => {
    const todo = tasks.filter(t => t.status === 'todo');
    const inProgress = tasks.filter(t => t.status === 'in_progress');
    const pendingVal = tasks.filter(t => t.status === 'pending_validation');
    const completed = tasks.filter(t => t.status === 'completed');
    const blocked = tasks.filter(t => t.status === 'blocked');

    const emailContent = `Direction,\n\nVoici le rapport hebdomadaire d'avancement des tâches administratives Citrine Management.\n\n` +
      `📊 *STATISTIQUES DE LA SEMAINE :*\n` +
      `• Terminées : ${completed.length}\n` +
      `• En attente de validation : ${pendingVal.length}\n` +
      `• En cours : ${inProgress.length}\n` +
      `• Bloquées : ${blocked.length}\n` +
      `• À faire : ${todo.length}\n\n` +
      `✅ *RÉALISÉES AVEC SUCCÈS :*\n` +
      (completed.length > 0 
        ? completed.map(t => `- [${employees.find(e => e.id === t.employeeId)?.name || 'Équipe'}] ${t.title}`).join('\n') 
        : '- Aucune tâche finalisée.') +
      `\n\n⚠️ *POINTS CHAUDS & INCIDENTS ACTIFS :*\n` +
      (blocked.length > 0 
        ? blocked.map(t => `- Tâche: "${t.title}" (Bloqué ou incident en cours d'analyse)`).join('\n') 
        : '- Aucun point chaud actif.');

    onAddNotification({
      id: `friday-report-${Date.now()}`,
      type: 'email',
      recipient: 'Coordination (coordination@citrine.com)',
      title: "Rapport Hebdomadaire de Suivi Administratif (Vendredi 15h)",
      content: emailContent,
      payload: JSON.stringify({
        cron: "weekly_cron_friday",
        notified_recipient: "coordination@citrine.com",
        stats: { completed: completed.length, blocked: blocked.length, pendingVal: pendingVal.length }
      }, null, 2),
      timestamp: new Date().toISOString()
    });

    alert("Le rapport hebdomadaire automatisé de vendredi 15h00 a été transmis par email aux coordinateurs ! Vous pouvez l'auditer sous l'onglet 'Flux d'Alertes'.");
  };

  return (
    <div className="space-y-6" id="tasks-module-enhanced">
      
      {/* Toast Alerts */}
      <AnimatePresence>
        {liveSuccessAlert && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-50 border border-emerald-200 text-emerald-950 px-4 py-3 rounded-xl text-xs flex items-center gap-2 shadow-sm font-medium"
          >
            <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{liveSuccessAlert}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Module Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <h2 className="text-xl font-serif font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-600" />
            Tâches Administratives & Suivi de Projet
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="bg-stone-900 hover:bg-stone-800 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer border-0 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Nouvelle Tâche Planifiée
          </button>
        </div>
      </div>

      {/* Barre de Recherche et de Filtrage Premium (Main Search on Top) */}
      <div className="bg-white rounded-2xl border border-green-100 p-4 shadow-2xs grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Search Input */}
        <div className="md:col-span-5 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Rechercher une tâche par titre ou mot-clé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-xs border border-stone-200 rounded-xl focus:outline-green-500 bg-stone-50/20 text-stone-800 font-medium placeholder-stone-400"
          />
        </div>

        {/* Assignee Filter */}
        <div className="md:col-span-3 flex items-center gap-2">
          <span className="text-[10px] text-stone-400 font-bold shrink-0 uppercase">Assigné :</span>
          {currentRole === 'Employé' ? (
            <div className="flex-1 text-xs bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 text-green-800 font-semibold truncate">
              👤 {activeUserDisplayName}
            </div>
          ) : (
            <div className="flex-1 min-w-[160px]">
              <SearchableSelect
                value={assigneeFilter}
                onChange={setAssigneeFilter}
                options={[
                  { value: 'all', label: 'Tous les collaborateurs' },
                  ...employees.map(emp => ({
                    value: emp.id,
                    label: emp.name,
                    description: emp.roleType || 'Collaborateur'
                  }))
                ]}
                placeholder="Tous les collaborateurs"
                searchPlaceholder="Chercher collaborateur..."
                size="sm"
              />
            </div>
          )}
        </div>

        {/* Priority Filter */}
        <div className="md:col-span-2 flex items-center gap-2">
          <span className="text-[10px] text-stone-400 font-bold shrink-0 uppercase">Priorité :</span>
          <div className="flex-1 min-w-[140px]">
            <SearchableSelect
              value={priorityFilter}
              onChange={(val) => setPriorityFilter(val as any)}
              options={[
                { value: 'all', label: 'Toutes les priorités' },
                { value: 'high', label: '🔴 Haute', badge: 'Urgent', badgeColor: 'bg-red-100 text-red-800' },
                { value: 'medium', label: '🟡 Moyenne', badge: 'Normal', badgeColor: 'bg-amber-100 text-amber-800' },
                { value: 'low', label: '🟢 Basse', badge: 'Faible', badgeColor: 'bg-emerald-100 text-emerald-800' }
              ]}
              placeholder="Toutes priorités"
              searchPlaceholder="Filtrer priorité..."
              size="sm"
            />
          </div>
        </div>

        {/* View Switcher */}
        <div className="md:col-span-2 flex gap-1 bg-stone-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('board')}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition border-0 cursor-pointer ${
              viewMode === 'board' ? 'bg-white text-stone-900 shadow-2xs' : 'bg-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            📊 Kanban
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition border-0 cursor-pointer ${
              viewMode === 'list' ? 'bg-white text-stone-900 shadow-2xs' : 'bg-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            📑 Liste
          </button>
        </div>
      </div>

      {/* Full width Kanban or List view without the boxed sidebar */}
      <div className="w-full">
        <div className="min-w-0">
          
          {viewMode === 'board' ? (
            /* KANBAN BOARD WITH SPACIOUS COLUMNS */
            <div className="flex gap-4 items-start overflow-x-auto pb-6 pt-1 min-w-full">
              {STATUS_COLUMNS.map(col => {
                const columnTasks = filteredTasks.filter(t => t.status === col.id);
                const isDraggedOver = draggedOverColId === col.id;

                return (
                  <div 
                    key={col.id} 
                    onDragOver={(e) => handleDragOver(e, col.id)}
                    onDragLeave={() => setDraggedOverColId(null)}
                    onDrop={(e) => handleDrop(e, col.id)}
                    className={`p-4 rounded-2xl border flex flex-col min-w-[270px] sm:min-w-[290px] flex-1 min-h-[520px] max-h-[750px] transition-all duration-200 shadow-3xs ${
                      isDraggedOver 
                        ? 'bg-green-100/50 border-green-400 ring-2 ring-green-200 ring-offset-1 scale-[1.01]' 
                        : `${col.bg} ${col.border}`
                    }`}
                  >
                    
                    {/* Column Header */}
                    <div className={`flex items-center justify-between border-b pb-2 mb-3 ${col.border}`}>
                      <h4 className={`text-xs font-serif font-bold truncate ${col.text}`}>
                        {col.label}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold shadow-4xs ${col.badge}`}>
                        {columnTasks.length}
                      </span>
                    </div>

                    {/* Column body */}
                    <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                      {columnTasks.map(task => {
                        const stats = getSubtasksStats(task.subtasks);
                        const hasActiveIncident = task.incidents && task.incidents.some(i => !i.resolved);
                        const isBeingDragged = draggedTaskId === task.id;

                        return (
                          <SwipeableListItem
                            key={task.id}
                            onSwipeRight={() => handleUpdateStatus(task.id, 'completed')}
                            onSwipeLeft={() => handleDeleteTask(task.id)}
                            rightLabel="Terminer"
                            leftLabel="Supprimer"
                          >
                            <div
                              onClick={() => setFocusedTask(task)}
                              draggable
                              onDragStart={(e) => handleDragStart(e, task.id)}
                              onDragEnd={handleDragEnd}
                              className={`bg-white rounded-xl border p-3.5 shadow-2xs hover:shadow-xs transition cursor-grab active:cursor-grabbing select-none space-y-2 relative group ${
                                isBeingDragged ? 'opacity-40 border-dashed border-green-400' : ''
                              } ${
                                hasActiveIncident 
                                  ? 'border-red-400 bg-red-50/10' 
                                  : task.status === 'completed' 
                                    ? 'border-emerald-100 hover:border-emerald-200 bg-emerald-50/5'
                                    : 'border-stone-200/80 hover:border-green-300'
                              }`}
                            >
                            
                            {/* Card Badges */}
                            <div className="flex items-center justify-between gap-1.5 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${
                                task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                task.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                                'bg-stone-100 text-stone-600'
                              }`}>
                                {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                              </span>

                              <span className="text-[9px] text-stone-400 font-medium truncate max-w-[70px]">
                                👤 {employees.find(e => e.id === task.employeeId)?.name.split(' ')[0] || 'Inconnu'}
                              </span>
                            </div>

                            {/* Title */}
                            <h5 className={`text-xs font-bold leading-normal text-stone-800 ${task.status === 'completed' ? 'line-through text-stone-400' : ''}`}>
                              {task.title}
                            </h5>

                            {/* Indicators & Inline Status Selector */}
                            <div className="flex flex-col gap-2 pt-1.5 border-t border-stone-100">
                              <div className="flex items-center justify-between text-[10px] text-stone-400">
                                <span className="flex items-center gap-1 font-mono text-[9px]">
                                  <Clock className="h-3 w-3" />
                                  {task.date.slice(5)}
                                </span>

                                <div className="flex items-center gap-1.5">
                                  {stats.total > 0 && (
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${
                                      stats.completed === stats.total ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-600'
                                    }`}>
                                      🌿 {stats.completed}/{stats.total}
                                    </span>
                                  )}
                                  
                                  {(task.comments?.length || 0) > 0 && (
                                    <span className="flex items-center gap-0.5">
                                      💬 {task.comments?.length}
                                    </span>
                                  )}

                                  {(task.attachments?.length || 0) > 0 && (
                                    <span className="flex items-center gap-0.5">
                                      📎 {task.attachments?.length}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Inline Quick Change Status Dropdown */}
                              <div className="flex items-center justify-between gap-1 pt-0.5" onClick={(e) => e.stopPropagation()}>
                                <span className="text-[9px] text-stone-400 font-semibold uppercase tracking-wider">Changer statut :</span>
                                <div className="w-28">
                                  <SearchableSelect
                                    value={task.status}
                                    onChange={(val) => handleUpdateStatus(task.id, val as TaskStatus)}
                                    options={[
                                      { value: 'todo', label: 'À faire' },
                                      { value: 'in_progress', label: 'En cours' },
                                      { value: 'pending_validation', label: 'Validation' },
                                      { value: 'completed', label: 'Terminée' },
                                      { value: 'blocked', label: 'Bloquée' },
                                    ]}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Active Incident Warning Badge */}
                            {hasActiveIncident && (
                              <div className="bg-red-600 text-white text-[8px] font-bold uppercase py-0.5 px-1.5 rounded-md flex items-center gap-1 mt-1">
                                <AlertOctagon className="h-2.5 w-2.5 shrink-0" />
                                Incident Actif
                              </div>
                            )}

                            {/* Portée (Column move quick action overlay buttons) */}
                            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-white p-1 rounded-lg border shadow-xs transition duration-200">
                              <button
                                type="button"
                                title="Déplacer à gauche"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const statusList: TaskStatus[] = ['todo', 'in_progress', 'pending_validation', 'completed', 'blocked'];
                                  const idx = statusList.indexOf(task.status);
                                  if (idx > 0) handleUpdateStatus(task.id, statusList[idx - 1]);
                                }}
                                className="p-0.5 hover:bg-stone-100 rounded text-stone-500 cursor-pointer"
                              >
                                <ChevronLeft className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                title="Déplacer à droite"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const statusList: TaskStatus[] = ['todo', 'in_progress', 'pending_validation', 'completed', 'blocked'];
                                  const idx = statusList.indexOf(task.status);
                                  if (idx < statusList.length - 1) handleUpdateStatus(task.id, statusList[idx + 1]);
                                }}
                                className="p-0.5 hover:bg-stone-100 rounded text-stone-500 cursor-pointer"
                              >
                                <ChevronRight className="h-3 w-3" />
                              </button>
                            </div>

                          </div>
                        </SwipeableListItem>
                      );
                    })}

                      {columnTasks.length === 0 && (
                        <div className="py-8 text-center text-[10px] text-stone-400 italic bg-white/40 border border-dashed border-stone-200 rounded-xl">
                          Vide
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* FLAT LIST VIEW */
            <div className="bg-white rounded-2xl border border-green-100 p-4 space-y-3 shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-green-100 text-stone-400 uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Tâche</th>
                      <th className="py-2.5">Assigné à</th>
                      <th className="py-2.5">Échéance</th>
                      <th className="py-2.5">Priorité</th>
                      <th className="py-2.5">Statut</th>
                      <th className="py-2.5 text-right px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks
                      .slice((taskListPage - 1) * taskListPageSize, taskListPage * taskListPageSize)
                      .map(task => {
                      const stats = getSubtasksStats(task.subtasks);
                      const hasActiveIncident = task.incidents && task.incidents.some(i => !i.resolved);

                      return (
                        <tr
                          key={task.id}
                          className="border-b border-stone-100 hover:bg-stone-50/50 transition cursor-pointer"
                          onClick={() => setFocusedTask(task)}
                        >
                          <td className="py-3 px-3">
                            <div className="font-bold text-stone-800">{task.title}</div>
                            <div className="text-[10px] text-stone-400 truncate max-w-sm mt-0.5">{task.description || 'Aucune description.'}</div>
                            {hasActiveIncident && (
                              <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 rounded mt-1 uppercase">
                                🚨 Incident Actif
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-stone-600 font-medium">
                            👤 {employees.find(e => e.id === task.employeeId)?.name || 'Non attribué'}
                          </td>
                          <td className="py-3 font-mono text-stone-500">
                            {task.date} {task.time}
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              task.priority === 'high' ? 'bg-red-50 text-red-800' :
                              task.priority === 'medium' ? 'bg-amber-50 text-amber-800' :
                              'bg-stone-100 text-stone-600'
                            }`}>
                              {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                            </span>
                          </td>
                          <td className="py-3">
                            <select
                              value={task.status}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleUpdateStatus(task.id, e.target.value as TaskStatus)}
                              className="text-[11px] p-1 border border-stone-200 rounded-lg cursor-pointer bg-white font-medium focus:outline-green-500"
                            >
                              <option value="todo">À faire</option>
                              <option value="in_progress">En cours</option>
                              <option value="pending_validation">En attente de validation</option>
                              <option value="completed">Terminée</option>
                              <option value="blocked">Bloquée / Incident</option>
                            </select>
                          </td>
                          <td className="py-3 text-right px-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => openEditModal(task)}
                                className="p-1 text-stone-400 hover:text-stone-700 bg-transparent border-0 cursor-pointer"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-1 text-stone-400 hover:text-red-700 bg-transparent border-0 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredTasks.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center italic text-stone-400">
                          Aucune tâche administrative consignée.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls for list view */}
              {(() => {
                const totalItems = filteredTasks.length;
                const totalPages = Math.ceil(totalItems / taskListPageSize) || 1;
                const indexOfLastItem = taskListPage * taskListPageSize;
                const indexOfFirstItem = indexOfLastItem - taskListPageSize;

                return (
                  <div className="bg-stone-50 border-t border-stone-200 px-3 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs rounded-b-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-stone-500">Afficher</span>
                      <select
                        value={taskListPageSize}
                        onChange={(e) => {
                          setTaskListPageSize(Number(e.target.value));
                          setTaskListPage(1);
                        }}
                        className="bg-white border border-stone-200 rounded-lg px-2 py-1 font-bold text-stone-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                      >
                        <option value={25}>25 par page</option>
                        <option value={50}>50 par page</option>
                        <option value={10}>10 par page</option>
                      </select>
                      <span className="text-stone-300">|</span>
                      <span className="text-stone-500">
                        Lignes <strong className="text-stone-800">{totalItems > 0 ? indexOfFirstItem + 1 : 0}</strong> à <strong className="text-stone-800">{Math.min(indexOfLastItem, totalItems)}</strong> sur <strong className="text-stone-800">{totalItems}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setTaskListPage(1)}
                        disabled={taskListPage === 1}
                        className="p-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed text-stone-600 transition cursor-pointer"
                        title="Première page"
                      >
                        «
                      </button>
                      <button
                        onClick={() => setTaskListPage(prev => Math.max(prev - 1, 1))}
                        disabled={taskListPage === 1}
                        className="p-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed text-stone-600 transition cursor-pointer"
                        title="Page précédente"
                      >
                        ‹
                      </button>

                      <div className="px-2.5 py-0.5 bg-white border border-emerald-200 rounded-lg font-bold text-emerald-700 shadow-2xs">
                        Page {taskListPage} / {totalPages}
                      </div>

                      <button
                        onClick={() => setTaskListPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={taskListPage === totalPages}
                        className="p-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed text-stone-600 transition cursor-pointer"
                        title="Page suivante"
                      >
                        ›
                      </button>
                      <button
                        onClick={() => setTaskListPage(totalPages)}
                        disabled={taskListPage === totalPages}
                        className="p-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed text-stone-600 transition cursor-pointer"
                        title="Dernière page"
                      >
                        »
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

        </div>
      </div>

      {/* DETAILED WORKSPACE SIDE DRAWER / MODAL FOR ACTIVE TASK */}
      <AnimatePresence>
        {focusedTask && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-end p-0 z-50">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white h-full w-full max-w-2xl shadow-2xl border-l border-green-100 flex flex-col justify-between overflow-hidden"
            >
              
              {/* Drawer Header */}
              <div className="p-5 border-b border-green-50 bg-green-50/20 flex items-center justify-between shrink-0">
                <div className="space-y-1.5 max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-green-800 font-bold">
                      Fiche administrative : {focusedTask.id}
                    </span>
                    <select
                      value={focusedTask.status}
                      onChange={(e) => handleUpdateStatus(focusedTask.id, e.target.value as TaskStatus)}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border cursor-pointer focus:outline-none ${
                        focusedTask.status === 'completed' ? 'bg-emerald-100 border-emerald-200 text-emerald-950' :
                        focusedTask.status === 'blocked' ? 'bg-red-100 border-red-200 text-red-950' :
                        'bg-stone-100 border-stone-200 text-stone-700'
                      }`}
                    >
                      <option value="todo">À faire</option>
                      <option value="in_progress">En cours</option>
                      <option value="pending_validation">Validation</option>
                      <option value="completed">Terminée</option>
                      <option value="blocked">Bloquée</option>
                    </select>
                  </div>
                  <h3 className="text-base font-serif font-bold text-stone-900 truncate">
                    {focusedTask.title}
                  </h3>
                </div>

                <button
                  onClick={() => setFocusedTask(null)}
                  className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer border-0 bg-transparent"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
                
                {/* Description & Core Properties */}
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/60 space-y-3.5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-stone-400 font-bold uppercase text-[9px]">Assigné à :</span>
                      <div className="font-semibold text-stone-800 flex items-center gap-1.5">
                        👤 {employees.find(e => e.id === focusedTask.employeeId)?.name || 'Non attribué'}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-stone-400 font-bold uppercase text-[9px]">Échéance de traitement :</span>
                      <div className="font-semibold text-stone-800 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-stone-400" />
                        {focusedTask.date} à {focusedTask.time}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-200/50 space-y-1">
                    <span className="text-stone-400 font-bold uppercase text-[9px]">Description de la tâche :</span>
                    <p className="text-stone-700 leading-relaxed font-normal whitespace-pre-line">
                      {focusedTask.description || 'Aucune description détaillée enregistrée pour cette tâche.'}
                    </p>
                  </div>
                </div>

                {/* Active/Resolved Incidents (Asana Style) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-200/60 pb-1.5">
                    <h4 className="font-serif font-bold text-stone-900 text-xs flex items-center gap-1">
                      🚨 Incidents & Points d'Achoppement
                    </h4>
                    
                    <button
                      type="button"
                      onClick={() => setShowIncidentModal(true)}
                      className="text-red-700 hover:text-red-800 font-bold flex items-center gap-0.5 text-[10px] bg-transparent border-0 cursor-pointer"
                    >
                      + Déclarer un Incident
                    </button>
                  </div>

                  {focusedTask.incidents && focusedTask.incidents.length > 0 ? (
                    <div className="space-y-2.5">
                      {focusedTask.incidents.map(inc => (
                        <div key={inc.id} className={`p-3 rounded-xl border flex justify-between items-start gap-4 ${
                          inc.resolved 
                            ? 'bg-stone-50 border-stone-200 text-stone-500' 
                            : 'bg-red-50 border-red-200 text-red-950'
                        }`}>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                inc.severity === 'high' ? 'bg-red-600 text-white' : 'bg-amber-100 text-amber-900'
                              }`}>
                                Gravité: {inc.severity}
                              </span>
                              <span className="font-bold text-xs">{inc.title}</span>
                              {inc.resolved && (
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded">
                                  Résolu
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] leading-normal opacity-90">{inc.description}</p>
                            <span className="text-[9px] text-stone-400 block font-mono">Déclaré le: {new Date(inc.createdAt).toLocaleString('fr-FR')}</span>
                          </div>

                          {!inc.resolved && (
                            <button
                              type="button"
                              onClick={() => handleResolveIncident(inc.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-2.5 rounded-lg text-[10px] transition shrink-0 cursor-pointer border-0"
                            >
                              Résoudre
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center italic text-stone-400 bg-stone-50 rounded-xl border border-dashed border-stone-200">
                      Aucun incident actif sur cette tâche.
                    </div>
                  )}
                </div>

                {/* Subtasks Tree Workspace */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-200/60 pb-1.5">
                    <h4 className="font-serif font-bold text-stone-900 text-xs flex items-center gap-1">
                      🌿 Arborescence récursive des sous-tâches
                    </h4>
                    <span className="text-[10px] text-stone-400 italic">Multi-niveau</span>
                  </div>

                  {/* Add main root subtask */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="root-subtask-input"
                      placeholder="Ajouter une sous-tâche principale..."
                      className="flex-1 p-2.5 border border-stone-200 rounded-xl focus:outline-green-500 bg-stone-50/50"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value;
                          if (val.trim()) {
                            handleAddPrimarySubtask(val.trim());
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('root-subtask-input') as HTMLInputElement;
                        if (input && input.value.trim()) {
                          handleAddPrimarySubtask(input.value.trim());
                          input.value = '';
                        }
                      }}
                      className="bg-stone-900 hover:bg-stone-800 text-white font-bold px-3 py-2 rounded-xl text-xs cursor-pointer border-0"
                    >
                      Créer
                    </button>
                  </div>

                  {focusedTask.subtasks && focusedTask.subtasks.length > 0 ? (
                    <RecursiveSubtaskList
                      subtasks={focusedTask.subtasks}
                      depth={0}
                      onToggleComplete={handleToggleSubtaskInTree}
                      onAddSubSubtask={handleAddSubSubtask}
                      onAddSubtaskComment={handleAddSubtaskComment}
                    />
                  ) : (
                    <div className="py-4 text-center italic text-stone-400 bg-stone-50 rounded-xl border border-dashed border-stone-200">
                      Saisissez une première sous-tâche pour décomposer le travail.
                    </div>
                  )}
                </div>

                {/* Documents & Shared Files area */}
                <div className="space-y-3">
                  <div className="border-b border-stone-200/60 pb-1.5">
                    <h4 className="font-serif font-bold text-stone-900 text-xs">
                      📎 Documents & Justificatifs Partagés
                    </h4>
                  </div>

                  {/* Drag and Drop and Manual Selection upload panel */}
                  <div className="space-y-2">
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          const file = e.dataTransfer.files[0];
                          const sizeStr = file.size > 1024 * 1024 
                            ? `${(file.size / (1024 * 1024)).toFixed(1)} Mo` 
                            : `${(file.size / 1024).toFixed(0)} Ko`;
                          handleUploadFile(file.name, sizeStr);
                        }
                      }}
                      className="border-2 border-dashed border-green-200 hover:border-green-400 bg-green-50/10 hover:bg-green-50/25 p-4 rounded-xl text-center transition cursor-pointer flex flex-col items-center justify-center space-y-1.5"
                      onClick={() => {
                        const fileInput = document.getElementById('task-file-uploader-direct');
                        if (fileInput) fileInput.click();
                      }}
                    >
                      <Paperclip className="h-5 w-5 text-green-500 animate-pulse" />
                      <p className="text-[11px] font-bold text-stone-700">Glissez-déposez un document ici ou cliquez pour le sélectionner</p>
                      <p className="text-[9px] text-stone-400 font-medium">Tous types de justificatifs : PDF, images, rapports (max 10 Mo)</p>
                      <input
                        id="task-file-uploader-direct"
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            const sizeStr = file.size > 1024 * 1024 
                              ? `${(file.size / (1024 * 1024)).toFixed(1)} Mo` 
                              : `${(file.size / 1024).toFixed(0)} Ko`;
                            handleUploadFile(file.name, sizeStr);
                          }
                        }}
                      />
                    </div>

                    {/* Quick Sim Form as back-up */}
                    <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/60 flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="Saisir un nom de fichier pour simulation rapide..."
                        value={mockFileName}
                        onChange={(e) => setMockFileName(e.target.value)}
                        className="flex-1 text-[10px] p-1.5 border border-stone-200 rounded bg-white text-stone-800"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (mockFileName.trim()) {
                            handleSimulateAttachment(mockFileName);
                          } else {
                            handleSimulateAttachment("Rapport_Activité.pdf");
                          }
                        }}
                        className="bg-stone-900 hover:bg-stone-800 text-white font-bold px-2.5 py-1.5 rounded text-[10px] cursor-pointer"
                      >
                        Simuler
                      </button>
                    </div>
                  </div>

                  {focusedTask.attachments && focusedTask.attachments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {focusedTask.attachments.map(att => (
                        <div key={att.id} className="p-2.5 rounded-xl border border-stone-200 bg-white flex items-center justify-between gap-3 shadow-2xs">
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="h-4 w-4 text-green-500 shrink-0" />
                            <div className="truncate">
                              <span className="font-bold text-stone-800 text-[11px] block truncate">{att.name}</span>
                              <span className="text-[9px] text-stone-400 font-mono block">{att.size || '1.2 Mo'} • {new Date(att.uploadedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            className="p-1 hover:bg-stone-50 rounded text-stone-500 hover:text-green-600 cursor-pointer border-0 bg-transparent"
                            onClick={() => alert(`Téléchargement simulé de "${att.name}" (${att.size})`)}
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center italic text-stone-400 bg-stone-50 rounded-xl border border-dashed border-stone-200">
                      Aucun document partagé pour le moment.
                    </div>
                  )}
                </div>

                {/* Task History & Comments Feed */}
                <div className="space-y-3">
                  <div className="border-b border-stone-200/60 pb-1.5">
                    <h4 className="font-serif font-bold text-stone-900 text-xs">
                      💬 Historique d'Activité & Commentaires
                    </h4>
                  </div>

                  {/* Comments list */}
                  {focusedTask.comments && focusedTask.comments.length > 0 ? (
                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                      {focusedTask.comments.map(c => {
                        const isSystem = c.author.startsWith('Système');
                        return (
                          <div
                            key={c.id}
                            className={`p-3 rounded-xl border text-xs leading-relaxed ${
                              isSystem 
                                ? 'bg-stone-50 border-stone-100/80 text-stone-500 italic' 
                                : 'bg-stone-50 border-stone-200/60 text-stone-800 font-medium'
                            }`}
                          >
                            <div className="flex justify-between items-center gap-2 mb-1">
                              <span className={`font-bold ${isSystem ? 'text-[10px] text-stone-400' : 'text-stone-900'}`}>
                                {c.author}
                              </span>
                              <span className="text-[9px] text-stone-400 font-mono font-normal">
                                {new Date(c.timestamp).toLocaleString('fr-FR')}
                              </span>
                            </div>
                            <p>{c.text}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-4 text-center italic text-stone-400 bg-stone-50 rounded-xl border border-dashed border-stone-200">
                      Aucun commentaire rédigé.
                    </div>
                  )}

                  {/* Add manual comment form */}
                  <form onSubmit={handleAddManualComment} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Écrire un message ou une consigne..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      className="flex-1 p-2.5 border border-stone-200 rounded-xl focus:outline-green-500 bg-white"
                    />
                    <button
                      type="submit"
                      className="bg-stone-900 hover:bg-stone-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer border-0"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Poster
                    </button>
                  </form>
                </div>

              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-green-50 bg-stone-50 flex justify-between items-center shrink-0">
                <button
                  type="button"
                  onClick={() => openEditModal(focusedTask)}
                  className="px-3.5 py-2 border border-stone-300 rounded-xl font-bold hover:bg-white text-stone-700 transition cursor-pointer"
                >
                  Modifier les Informations
                </button>

                <div className="flex gap-2">
                  {focusedTask.status !== 'completed' ? (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(focusedTask.id, 'completed')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer border-0"
                    >
                      ✓ Marquer comme Terminée
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(focusedTask.id, 'in_progress')}
                      className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold rounded-xl transition cursor-pointer border-0"
                    >
                      Remettre en cours
                    </button>
                  )}
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL TO DECLARE AN INCIDENT */}
      <AnimatePresence>
        {showIncidentModal && focusedTask && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-red-200 shadow-2xl max-w-md w-full p-6 space-y-4 text-xs"
            >
              <div className="flex justify-between items-center border-b border-red-100 pb-3">
                <h4 className="font-serif font-bold text-red-950 text-sm flex items-center gap-1.5">
                  <AlertOctagon className="h-4.5 w-4.5 text-red-600 animate-pulse" />
                  Déclarer un incident (Asana Style)
                </h4>
                <button
                  type="button"
                  onClick={() => setShowIncidentModal(false)}
                  className="text-stone-400 hover:text-stone-700 cursor-pointer border-0 bg-transparent font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleDeclareIncident} className="space-y-4">
                <div className="bg-red-50 text-red-950 p-3 rounded-xl border border-red-100 leading-normal">
                  <strong>Conséquence :</strong> La tâche sera automatiquement déplacée vers la colonne <strong>BLOQUÉE</strong> et un e-mail immédiat de blocage sera acheminé à la direction.
                </div>

                <div className="space-y-1">
                  <label className="text-stone-600 font-bold">Intitulé du blocage :</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Refus de signature ou absence de justificatifs"
                    value={incidentTitle}
                    onChange={(e) => setIncidentTitle(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl p-2.5 focus:outline-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-stone-600 font-bold">Gravité de l'incident :</label>
                  <select
                    value={incidentSeverity}
                    onChange={(e) => setIncidentSeverity(e.target.value as any)}
                    className="w-full border border-stone-200 rounded-xl p-2.5 focus:outline-red-500 bg-white"
                  >
                    <option value="low">Basse (Simple retard de consultation)</option>
                    <option value="medium">Moyenne (Besoin d'arbitrage)</option>
                    <option value="high">Haute (Bloquant pour la semaine)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-stone-600 font-bold">Description détaillée du point de blocage :</label>
                  <textarea
                    rows={3}
                    placeholder="Expliquez avec précision l'élément bloquant et l'action attendue pour résoudre la situation..."
                    value={incidentDescription}
                    onChange={(e) => setIncidentDescription(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl p-2.5 focus:outline-red-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowIncidentModal(false)}
                    className="px-4 py-2 border border-stone-300 rounded-xl font-bold hover:bg-stone-50 text-stone-700 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-xs cursor-pointer border-0"
                  >
                    Déclarer et alerter
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GENERAL CREATOR / MODIFIER MODAL FOR TASKS */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-green-100 max-w-md w-full p-6 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between border-b border-stone-200/60 pb-3">
                <h4 className="font-serif font-bold text-stone-900 text-sm">
                  {editingTask ? 'Modifier la tâche planifiée' : 'Créer une tâche planifiée'}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-stone-400 hover:text-stone-600 text-xs cursor-pointer font-bold border-0 bg-transparent"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveModalTask} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-stone-600 font-bold">Titre de l'activité administrative :</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Préparation des dossiers RH d'Alice"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl p-2.5 focus:outline-green-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-stone-600 font-bold">Description des livrables ou consignes :</label>
                  <textarea
                    rows={2.5}
                    placeholder="Spécifiez les objectifs de la tâche..."
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl p-2.5 focus:outline-green-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-stone-600 font-bold">Date d'échéance :</label>
                    <input
                      type="date"
                      required
                      value={taskDate}
                      onChange={(e) => setTaskDate(e.target.value)}
                      className="w-full border border-stone-200 rounded-xl p-2 focus:outline-green-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-stone-600 font-bold">Heure d'échéance :</label>
                    <input
                      type="time"
                      required
                      value={taskTime}
                      onChange={(e) => setTaskTime(e.target.value)}
                      className="w-full border border-stone-200 rounded-xl p-2 focus:outline-green-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-stone-600 font-bold">Priorité de traitement :</label>
                    <SearchableSelect
                      value={taskPriority}
                      onChange={(val) => setTaskPriority(val as TaskPriority)}
                      options={[
                        { value: 'low', label: '🟢 Basse', badge: 'Normal' },
                        { value: 'medium', label: '🟡 Moyenne', badge: 'Important' },
                        { value: 'high', label: '🔴 Haute', badge: 'Urgent', badgeColor: 'bg-red-100 text-red-800' }
                      ]}
                      placeholder="Priorité"
                      searchPlaceholder="Rechercher priorité..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-stone-600 font-bold">Statut initial :</label>
                    <SearchableSelect
                      value={taskStatus}
                      onChange={(val) => setTaskStatus(val as TaskStatus)}
                      options={[
                        { value: 'todo', label: 'À faire' },
                        { value: 'in_progress', label: 'En cours' },
                        { value: 'pending_validation', label: 'En attente validation' },
                        { value: 'completed', label: 'Terminée' },
                        { value: 'blocked', label: 'Bloquée 🚨' }
                      ]}
                      placeholder="Statut"
                      searchPlaceholder="Rechercher statut..."
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-stone-600 font-bold">Attribuer à :</label>
                  {currentRole === 'Employé' ? (
                    <div className="w-full border border-stone-100 rounded-xl p-2.5 bg-stone-50 font-semibold text-stone-700">
                      👤 {activeUserDisplayName} (Auto-attribution)
                    </div>
                  ) : (
                    <SearchableSelect
                      value={taskAssigneeId}
                      onChange={setTaskAssigneeId}
                      options={employees.map(emp => ({
                        value: emp.id,
                        label: emp.name,
                        description: `${emp.roleType || 'Collaborateur'} • ${emp.department || 'Général'}`
                      }))}
                      placeholder="Sélectionner un collaborateur"
                      searchPlaceholder="Rechercher un collaborateur..."
                    />
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-stone-300 rounded-xl text-stone-700 font-bold hover:bg-stone-50 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-xs cursor-pointer border-0"
                  >
                    {editingTask ? 'Sauvegarder' : 'Planifier la tâche'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
