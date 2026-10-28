import { useState, useEffect, useMemo } from 'react';
import { Task, NotificationLog, Employee, TaskStatus, TaskPriority, TaskProject, AppUser, Subtask } from '../../types';
import { DEFAULT_TASK_PROJECTS } from './taskConstants';
import { taskService } from '../../services/taskService';
import { clientMailService } from '../../services/clientMailService';
import { pushNotificationBridgeService } from '../../services/pushNotificationBridgeService';
import { showSuccessAlert, showErrorAlert, confirmDeleteAlert } from '../../utils/sweetAlert';
import { isSelfOnlyUser } from '../../utils/roleUtils';
import {
  getDoualaDateInfo,
  buildTimesheetHtmlReport,
  buildTimesheetExcelBase64,
  TimesheetItem,
  TimesheetBlocker,
  TimesheetManagerPoint
} from '../../services/timesheetReportService';
import { getTimesheetNotes } from '../../services/timesheetNotesService';

interface UseTaskLogicProps {
  tasks: Task[];
  onUpdateTasks: (updated: Task[]) => void;
  onAddNotification: (log: NotificationLog) => void;
  currentRole: string;
  employees: Employee[];
  currentUser?: AppUser | null;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export function useTaskLogic({
  tasks,
  onUpdateTasks,
  onAddNotification,
  currentRole,
  employees,
  currentUser,
  showToast,
}: UseTaskLogicProps) {
  // Project & View Tabs
  const [projects, setProjects] = useState<TaskProject[]>(DEFAULT_TASK_PROJECTS);

  const [activeProjectId, setActiveProjectId] = useState<string>('all');
  const [activeView, setActiveView] = useState<'kanban' | 'table' | 'rendement'>('kanban');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'tasks' | 'milestones'>('all');

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMilestoneModalDefault, setIsMilestoneModalDefault] = useState(false);
  const [createModalDefaultStatus, setCreateModalDefaultStatus] = useState<TaskStatus>('todo');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);
  const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);
  const [taskForSubtaskModal, setTaskForSubtaskModal] = useState<Task | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const handleOpenDeleteModal = async (task: Task) => {
    const isConfirmed = await confirmDeleteAlert({
      title: 'Supprimer la tâche',
      text: 'Voulez-vous vraiment supprimer cette tâche ? Cette action est irréversible.',
      itemName: task.title,
      confirmButtonText: 'Oui, supprimer la tâche',
    });

    if (!isConfirmed) return;

    const targetId = String(task.id);
    const targetDocId = task.docId ? String(task.docId) : '';

    try {
      await taskService.deleteTask(targetId);
      if (targetDocId && targetDocId !== targetId) {
        await taskService.deleteTask(targetDocId);
      }

      const updated = tasks.filter((t) => {
        const tId = String(t.id);
        const tDocId = t.docId ? String(t.docId) : '';
        if (tId === targetId || (targetDocId && tId === targetDocId)) return false;
        if (tDocId && (tDocId === targetId || (targetDocId && tDocId === targetDocId))) return false;
        return true;
      });

      onUpdateTasks(updated);

      if (
        selectedTaskForDetail &&
        (String(selectedTaskForDetail.id) === targetId || (targetDocId && String(selectedTaskForDetail.id) === targetDocId))
      ) {
        setSelectedTaskForDetail(null);
      }

      if (showToast) {
        showToast('Tâche supprimée avec succès.', 'success');
      }
    } catch (err: any) {
      await showErrorAlert('Erreur de suppression', err?.message || 'Impossible de supprimer la tâche.');
    }
  };

  const handleDeleteTaskConfirm = async () => {
    // Maintenu pour rétrocompatibilité
  };

  // Connected employee
  const currentEmployee = useMemo(() => {
    if (!currentUser) return null;
    return employees.find((e) => e.email === currentUser.email || e.name === currentUser.name || e.id === currentUser.id);
  }, [currentUser, employees]);

  const isRestrictedStaff = isSelfOnlyUser(currentUser, currentRole);

  // Visible employees for filters and workload view (employees only see themselves)
  const visibleEmployees = useMemo(() => {
    if (!isRestrictedStaff) return employees;
    if (currentEmployee) return [currentEmployee];
    const matched = employees.filter(e => 
      e.id === currentUser?.id || 
      (currentUser?.email && e.email === currentUser.email) ||
      (currentUser?.name && e.name === currentUser.name)
    );
    return matched.length > 0 ? matched : employees.slice(0, 1);
  }, [employees, isRestrictedStaff, currentEmployee, currentUser]);

  // Project restriction: non-admin users only see projects they belong to
  const visibleProjects = useMemo(() => {
    if (!isRestrictedStaff) return projects;

    return projects.filter((p) => {
      if (p.id === 'all') return true;
      if (!p.memberIds || p.memberIds.length === 0) return true;
      if (currentEmployee && p.memberIds.includes(currentEmployee.id)) return true;
      if (currentUser && p.memberIds.includes(currentUser.id)) return true;
      return false;
    });
  }, [projects, isRestrictedStaff, currentUser, currentEmployee]);

  // Sync selected task details with tasks updates
  useEffect(() => {
    if (selectedTaskForDetail) {
      const latest = tasks.find((t) => t.id === selectedTaskForDetail.id);
      if (latest) setSelectedTaskForDetail(latest);
    }
  }, [tasks]);

  const saveProjects = (updatedProjects: TaskProject[]) => {
    setProjects(updatedProjects);
  };

  const handleCreateProject = async (newProject: TaskProject) => {
    const updated = [...projects, newProject];
    saveProjects(updated);
    setActiveProjectId(newProject.id);
    if (showToast) showToast(`Projet "${newProject.name}" créé avec succès !`, 'success');
  };

  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'comments' | 'incidents'> & { subtasks?: Subtask[] }) => {
    try {
      const taskItem: Task = {
        id: `task-${Date.now()}`,
        ...taskData,
        subtasks: taskData.subtasks || [],
        comments: [],
        incidents: [],
        lastUpdatedTime: new Date().toISOString(),
      };

      await taskService.saveTask(taskItem);
      const updatedTasks = [taskItem, ...tasks];
      onUpdateTasks(updatedTasks);

      onAddNotification({
        id: `notif-${Date.now()}`,
        recipient: taskItem.assignedTo || 'Équipe',
        type: 'system',
        title: 'Nouvelle Tâche Assignée',
        content: `${taskItem.title} (${taskItem.date})`,
        payload: '{}',
        timestamp: new Date().toISOString(),
      });

      pushNotificationBridgeService.sendPush({
        title: 'Nouvelle Tâche Assignée 📋',
        message: `${taskItem.title} vous a été assignée pour le ${taskItem.date}.`,
        senderName: currentRole || 'Responsable',
        type: 'task_assigned',
        link: 'tasks',
      });

      if (showToast) {
        showToast('Tâche créée et enregistrée en base avec succès.', 'success');
      }
    } catch (err: any) {
      await showErrorAlert('Erreur de création', err?.message || 'Impossible d\'enregistrer la tâche.');
    }
  };

  const handleOpenCreateSubtask = (task?: Task) => {
    setTaskForSubtaskModal(task || null);
    setIsSubtaskModalOpen(true);
  };

  const handleCreateSubtask = async (subtask: Subtask, targetTaskId?: string) => {
    try {
      const taskIdToUpdate = targetTaskId || taskForSubtaskModal?.id;
      if (!taskIdToUpdate) return;
      const target = tasks.find((t) => t.id === taskIdToUpdate);
      if (!target) return;

      const updatedTask: Task = {
        ...target,
        subtasks: [...(target.subtasks || []), subtask],
        lastUpdatedTime: new Date().toISOString(),
      };

      await taskService.saveTask(updatedTask);
      const updatedTasks = tasks.map((t) => (t.id === taskIdToUpdate ? updatedTask : t));
      onUpdateTasks(updatedTasks);

      if (selectedTaskForDetail && selectedTaskForDetail.id === taskIdToUpdate) {
        setSelectedTaskForDetail(updatedTask);
      }

      if (showToast) {
        showToast(`Sous-tâche "${subtask.title}" créée avec succès !`, 'success');
      }
    } catch (err: any) {
      await showErrorAlert('Erreur', err?.message || 'Impossible d\'ajouter la sous-tâche.');
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const updatedTask: Task = { ...targetTask, status: newStatus, lastUpdatedTime: new Date().toISOString() };
    await taskService.saveTask(updatedTask);

    const updated = tasks.map((t) => (t.id === taskId ? updatedTask : t));
    onUpdateTasks(updated);

    if (selectedTaskForDetail && selectedTaskForDetail.id === taskId) {
      setSelectedTaskForDetail(updatedTask);
    }

    const statusLabels: Record<string, string> = {
      todo: 'À faire',
      in_progress: 'En cours',
      review: 'En révision',
      completed: 'Terminée',
    };
    const label = statusLabels[newStatus] || newStatus;
    const targetRecipient = targetTask.assignedTo || targetTask.employeeId || 'Collaborateur';

    onAddNotification({
      id: `notif-task-move-${Date.now()}-${taskId}`,
      recipient: targetRecipient,
      type: 'system',
      title: `Mouvement de Tâche : ${targetTask.title}`,
      content: `La tâche est passée au statut « ${label} ».`,
      payload: JSON.stringify({
        source: 'task_movement',
        taskId: targetTask.id,
        employeeId: targetRecipient,
        newStatus,
        previousStatus: targetTask.status,
      }),
      timestamp: new Date().toISOString(),
      read: false,
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('citrine:new_unread_alert'));
    }

    pushNotificationBridgeService.sendPush({
      title: 'Mise à jour de Tâche 🔄',
      message: `La tâche "${targetTask.title}" est passée au statut : ${label}.`,
      senderName: currentRole || 'Collaborateur',
      type: 'task_assigned',
      link: 'tasks',
    });

    if (showToast) showToast('Statut mis à jour et enregistré.', 'success');
  };

  const handleSaveTask = async (updatedTask: Task) => {
    try {
      const prevTask = tasks.find((t) => t.id === updatedTask.id);
      const finalizedTask = { ...updatedTask, updatedAt: new Date().toISOString() };

      await taskService.saveTask(finalizedTask);
      const updated = tasks.map((t) => (t.id === finalizedTask.id ? finalizedTask : t));
      onUpdateTasks(updated);
      setSelectedTaskForDetail(finalizedTask);

      if (finalizedTask.assignedTo) {
        const isStatusChanged = prevTask && prevTask.status !== finalizedTask.status;
        const isPriorityChanged = prevTask && prevTask.priority !== finalizedTask.priority;
        if (isStatusChanged || isPriorityChanged || !prevTask) {
          onAddNotification({
            id: `notif-task-update-${Date.now()}-${finalizedTask.id}`,
            recipient: finalizedTask.assignedTo,
            type: 'system',
            title: `Mise à jour de tâche : ${finalizedTask.title}`,
            content: isStatusChanged 
              ? `Statut modifié : passage à « ${finalizedTask.status} »` 
              : `Détails de la tâche mis à jour.`,
            payload: JSON.stringify({
              source: 'task_movement',
              taskId: finalizedTask.id,
              employeeId: finalizedTask.assignedTo,
              newStatus: finalizedTask.status,
            }),
            timestamp: new Date().toISOString(),
            read: false,
          });

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('citrine:new_unread_alert'));
          }
        }
      }
      if (showToast) showToast('Tâche mise à jour avec succès.', 'success');
    } catch (err: any) {
      await showErrorAlert('Erreur', err?.message || 'Impossible d\'enregistrer les modifications.');
    }
  };

  const handleDeleteTask = async (id: string) => {
    await taskService.deleteTask(id);
    const updated = tasks.filter((t) => t.id !== id);
    onUpdateTasks(updated);
    setSelectedTaskForDetail(null);
    if (showToast) showToast('Tâche supprimée avec succès.');
  };

  // Filter tasks based on search, project permissions, priority, assignee, and milestone filter
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (isRestrictedStaff) {
        const empName = currentEmployee?.name || currentUser?.name;
        const empId = currentEmployee?.id || currentUser?.id;
        const userEmail = currentUser?.email;

        const assignedField = t.assignedTo || '';
        const assignedList = assignedField.split(',').map(s => s.trim());

        const assignedToMe = assignedList.some(a => 
          (empName && a.toLowerCase() === empName.toLowerCase()) ||
          (empId && a === empId) ||
          (userEmail && a.toLowerCase() === userEmail.toLowerCase()) ||
          a === 'Équipe' || a === 'Tous'
        ) || (t.employeeId && (t.employeeId === empId || t.employeeId === currentUser?.id));
        if (!assignedToMe) return false;
      }

      if (isRestrictedStaff && t.projectId && t.projectId !== 'general') {
        const p = projects.find((proj) => proj.id === t.projectId);
        if (p && p.memberIds && p.memberIds.length > 0) {
          const isMember = (currentEmployee && p.memberIds.includes(currentEmployee.id)) ||
                           (currentUser && p.memberIds.includes(currentUser.id));
          if (!isMember) return false;
        }
      }

      const matchSearch =
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.milestoneTarget && t.milestoneTarget.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchProject =
        activeProjectId === 'all'
          ? true
          : t.projectId === activeProjectId || (!t.projectId && activeProjectId === 'general');

      const matchPriority = filterPriority === 'all' ? true : t.priority === filterPriority;

      const assignedList = (t.assignedTo || 'Équipe').split(',').map(s => s.trim());
      const matchAssignee =
        filterAssignee === 'all'
          ? true
          : assignedList.includes(filterAssignee) || (!t.assignedTo && filterAssignee === 'Équipe');

      const matchType =
        filterType === 'all'
          ? true
          : filterType === 'milestones'
          ? !!t.isMilestone
          : !t.isMilestone;

      return matchSearch && matchProject && matchPriority && matchAssignee && matchType;
    });
  }, [tasks, searchTerm, activeProjectId, filterPriority, filterAssignee, filterType, currentRole, currentUser, currentEmployee, projects]);

  const handleSendManualTimesheet = async () => {
    try {
      if (showToast) showToast("Génération et envoi de votre fiche de temps...", "success");

      const myName = currentUser?.name || currentEmployee?.name || "Collaborateur";
      const myEmail = currentUser?.email || currentEmployee?.email || "";
      const myId = currentUser?.id || currentEmployee?.id || "emp-001";
      const department = currentEmployee?.department || "Direction Générale";

      const doualaTime = getDoualaDateInfo();

      const myTasks = tasks.filter((t) => {
        const assigned = (t.assignedTo || "").toLowerCase();
        return assigned.includes(myName.toLowerCase()) || assigned.includes(myEmail.toLowerCase()) || t.employeeId === myId;
      });

      let itemIndex = 1;
      const items: TimesheetItem[] = [];
      const blockers: TimesheetBlocker[] = [];
      const managerPoints: TimesheetManagerPoint[] = [];

      myTasks.forEach((t) => {
        // Blocages sur la tâche parente
        if (t.incidents && Array.isArray(t.incidents) && t.incidents.length > 0) {
          t.incidents.forEach((inc) => {
            blockers.push({
              sourceTask: t.title,
              reason: inc.title || inc.description || 'Incident ou blocage signalé',
              status: inc.resolved ? 'Résolu' : 'Bloqué',
            });
          });
        } else if (t.status === 'blocked') {
          blockers.push({
            sourceTask: t.title,
            reason: 'Tâche déclarée bloquée',
            status: 'Bloqué',
          });
        }

        // Remontées des commentaires sur la tâche parente -> Points à signaler au manager
        if (t.comment && typeof t.comment === 'string' && t.comment.trim()) {
          managerPoints.push({
            sourceTask: t.title,
            content: t.comment.trim(),
            author: myName,
          });
        }
        if (Array.isArray(t.comments) && t.comments.length > 0) {
          t.comments.forEach((c) => {
            managerPoints.push({
              sourceTask: t.title,
              content: c.text || '',
              author: c.author || myName,
              time: c.timestamp || '',
            });
          });
        }

        // Traitement des sous-tâches
        if (Array.isArray(t.subtasks) && t.subtasks.length > 0) {
          t.subtasks.forEach((sub) => {
            const isBlocked = sub.status === 'blocked' || sub.isBlocked || Boolean(sub.blockerReason);
            items.push({
              index: itemIndex++,
              taskTitle: t.title,
              subTitle: sub.title,
              status: sub.status || (sub.completed ? 'completed' : 'todo'),
              statusLabel: sub.completed ? 'TERMINÉ' : (sub.status === 'in_progress' ? 'EN COURS' : 'À FAIRE'),
              estimatedHours: Number(sub.estimatedHours) || 0,
              actualHours: Number(sub.actualHours) || 0,
              blockerReason: sub.blockerReason,
              isBlocked,
            });

            if (isBlocked) {
              blockers.push({
                sourceTask: `${sub.title} (sur "${t.title}")`,
                reason: sub.blockerReason || 'Difficulté opérationnelle signalée',
                status: 'Bloqué',
              });
            }

            if (Array.isArray(sub.comments)) {
              sub.comments.forEach((c) => {
                managerPoints.push({
                  sourceTask: `${sub.title} (sur "${t.title}")`,
                  content: c.text || '',
                  author: c.author || myName,
                  time: c.timestamp || '',
                });
              });
            }
          });
        } else {
          // Tâche simple sans sous-tâches : intégrée directement comme tâche du jour
          const isBlocked = t.status === 'blocked';
          items.push({
            index: itemIndex++,
            taskTitle: t.title,
            subTitle: t.title,
            status: t.status || 'todo',
            statusLabel: t.status === 'completed' ? 'TERMINÉ' : (t.status === 'in_progress' ? 'EN COURS' : 'À FAIRE'),
            estimatedHours: Number(t.estimatedHours) || 1,
            actualHours: Number(t.actualHours) || 0,
            blockerReason: isBlocked ? 'Tâche bloquée' : undefined,
            isBlocked,
          });
        }
      });

      // Intégrer également les notes consignées du collaborateur pour aujourd'hui
      try {
        const recordedNotes = getTimesheetNotes(String(myId), doualaTime.dayIso);
        recordedNotes.forEach((n) => {
          if (n.category === 'bloquant' || n.category === 'materiel') {
            blockers.push({
              sourceTask: `Note consignée (${n.category.toUpperCase()})`,
              reason: n.content,
              time: n.time,
              status: n.status,
            });
          } else {
            managerPoints.push({
              sourceTask: `Note consignée (${n.category.toUpperCase()})`,
              content: n.content,
              author: n.authorName || myName,
              time: n.time,
            });
          }
        });
      } catch (err) {
        // Fallback silencieux
      }

      const totalEstimated = items.reduce((sum, i) => sum + i.estimatedHours, 0);
      const totalActual = items.reduce((sum, i) => sum + i.actualHours, 0);

      // 🎯 Top 3 priorités du jour
      const topPriorities = myTasks.slice(0, 3).map((t, idx) => ({
        id: t.id,
        title: t.title,
        priority: (idx === 0 ? 'P1' : idx === 1 ? 'P2' : 'P3') as 'P1' | 'P2' | 'P3',
        status: t.status === 'completed' ? 'Fait' : (t.status === 'in_progress' ? 'En cours' : 'À faire'),
        isMilestone: !!t.isMilestone,
      }));

      // ☑️ Tâches non complètes à reporter à demain
      const postponedTasks = myTasks
        .filter((t) => t.status !== 'completed')
        .map((t) => t.title);

      const timesheetData = {
        employeeName: myName,
        employeeEmail: myEmail,
        employeeId: myId,
        department,
        dateStr: doualaTime.dateOnly,
        timeStr: doualaTime.timeOnly,
        items,
        blockers,
        managerPoints,
        totalEstimatedHours: totalEstimated,
        totalActualHours: totalActual,
        topPriorities,
        postponedTasks,
      };

      const htmlContent = buildTimesheetHtmlReport(timesheetData);
      const excelBase64 = buildTimesheetExcelBase64(timesheetData);

      const safeCollabName = myName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      const safeDate = doualaTime.dayIso.replace(/-/g, '_');
      const excelFilename = `feuille_de_temps_${safeCollabName}_${safeDate}.xlsx`;

      const result = await clientMailService.sendThreadedEmail({
        employeeName: myName,
        employeeId: myId,
        employeeEmail: myEmail,
        eventTitle: `Fiche de temps de la journée`,
        htmlContent,
        attachments: [
          {
            filename: excelFilename,
            content: excelBase64,
            encoding: 'base64',
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
        ],
      });

      if (result.success) {
        if (showToast) showToast("Fiche de temps Excel envoyée avec succès !", "success");
        onAddNotification({
          id: `notif-${Date.now()}`,
          title: "Fiche de temps transmise",
          content: `Votre fiche de temps (${items.length} activités, ${totalActual}h réelles) a été transmise aux RH avec la pièce jointe Excel.`,
          message: `Votre fiche de temps (${items.length} activités, ${totalActual}h réelles) a été transmise aux RH avec la pièce jointe Excel.`,
          type: "email",
          recipient: myEmail || myName,
          payload: JSON.stringify({ employeeId: myId }),
          timestamp: new Date().toISOString(),
          read: false,
          senderName: "Système RH",
        });
      } else {
        if (showToast) showToast(`Erreur d'envoi: ${result.error || "Impossible d'envoyer"}`, "error");
      }
    } catch (err: any) {
      if (showToast) showToast(`Erreur: ${err.message || "Échec de l'envoi"}`, "error");
    }
  };

  return {
    projects,
    visibleProjects,
    activeProjectId,
    setActiveProjectId,
    activeView,
    setActiveView,
    searchTerm,
    setSearchTerm,
    filterPriority,
    setFilterPriority,
    filterAssignee,
    setFilterAssignee,
    filterType,
    setFilterType,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isMilestoneModalDefault,
    setIsMilestoneModalDefault,
    createModalDefaultStatus,
    setCreateModalDefaultStatus,
    isNewProjectModalOpen,
    setIsNewProjectModalOpen,
    selectedTaskForDetail,
    setSelectedTaskForDetail,
    isSubtaskModalOpen,
    setIsSubtaskModalOpen,
    taskForSubtaskModal,
    setTaskForSubtaskModal,
    handleOpenCreateSubtask,
    handleCreateSubtask,
    filteredTasks,
    handleCreateProject,
    handleCreateTask,
    handleStatusChange,
    handleSaveTask,
    handleDeleteTask,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    taskToDelete,
    setTaskToDelete,
    handleOpenDeleteModal,
    handleDeleteTaskConfirm,
    isRestrictedStaff,
    visibleEmployees,
    handleSendManualTimesheet,
  };
}
