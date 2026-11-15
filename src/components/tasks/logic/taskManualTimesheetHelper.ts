import { Task, NotificationLog, Employee, AppUser } from '../../../types';
import { clientMailService } from '../../../services/clientMailService';
import { showErrorAlert } from '../../../utils/sweetAlert';
import {
  getDoualaDateInfo,
  buildTimesheetHtmlReport,
  buildTimesheetExcelBase64,
  TimesheetItem,
  TimesheetBlocker,
  TimesheetManagerPoint,
} from '../../../services/timesheetReportService';
import { getTimesheetNotes } from '../../../services/timesheetNotesService';
import { isSubtaskInLast3Days, sortSubtasksNewestFirst } from '../../../utils/subtaskFilterUtils';

export async function executeSendManualTimesheet(params: {
  tasks: Task[];
  currentUser?: AppUser | null;
  currentEmployee?: Employee | null;
  onAddNotification: (log: NotificationLog) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}): Promise<void> {
  const { tasks, currentUser, currentEmployee, onAddNotification, showToast } = params;

  try {
    if (showToast) showToast('Génération et envoi de votre fiche de temps...', 'success');

    const myName = currentUser?.name || currentEmployee?.name || 'Collaborateur';
    const myEmail = currentUser?.email || currentEmployee?.email || '';
    const myId = currentUser?.id || currentEmployee?.id || 'emp-001';
    const department = currentEmployee?.department || 'Direction Générale';

    const doualaTime = getDoualaDateInfo();

    const myTasks = tasks.filter((t) => {
      const assigned = (t.assignedTo || '').toLowerCase();
      return (
        assigned.includes(myName.toLowerCase()) ||
        assigned.includes(myEmail.toLowerCase()) ||
        t.employeeId === myId
      );
    });

    let itemIndex = 1;
    const items: TimesheetItem[] = [];
    const blockers: TimesheetBlocker[] = [];
    const managerPoints: TimesheetManagerPoint[] = [];

    myTasks.forEach((t) => {
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

      if (Array.isArray(t.subtasks) && t.subtasks.length > 0) {
        const sortedSubs = sortSubtasksNewestFirst(t.subtasks, t.date);
        const recentSubs = sortedSubs.filter((s) => isSubtaskInLast3Days(s, t.date));
        const subsToProcess = recentSubs.length > 0 ? recentSubs : sortedSubs;

        subsToProcess.forEach((sub) => {
          const isBlocked = sub.status === 'blocked' || sub.isBlocked || Boolean(sub.blockerReason);
          items.push({
            index: itemIndex++,
            taskTitle: t.title,
            subTitle: sub.title,
            status: sub.status || (sub.completed ? 'completed' : 'todo'),
            statusLabel: sub.completed ? 'TERMINÉ' : sub.status === 'in_progress' ? 'EN COURS' : 'À FAIRE',
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
        const isBlocked = t.status === 'blocked';
        items.push({
          index: itemIndex++,
          taskTitle: t.title,
          subTitle: t.title,
          status: t.status || 'todo',
          statusLabel: t.status === 'completed' ? 'TERMINÉ' : t.status === 'in_progress' ? 'EN COURS' : 'À FAIRE',
          estimatedHours: Number(t.estimatedHours) || 1,
          actualHours: Number(t.actualHours) || 0,
          blockerReason: isBlocked ? 'Tâche bloquée' : undefined,
          isBlocked,
        });
      }
    });

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
    } catch {
      // Fallback silencieux
    }

    const totalEstimated = items.reduce((sum, i) => sum + i.estimatedHours, 0);
    const totalActual = items.reduce((sum, i) => sum + i.actualHours, 0);

    const topPriorities =
      items.length === 0
        ? []
        : myTasks.slice(0, 3).map((t, idx) => ({
            id: t.id,
            title: t.title,
            priority: (idx === 0 ? 'P1' : idx === 1 ? 'P2' : 'P3') as 'P1' | 'P2' | 'P3',
            status: t.status === 'completed' ? 'Fait' : t.status === 'in_progress' ? 'En cours' : 'À faire',
            isMilestone: !!t.isMilestone,
          }));

    const postponedTasks = myTasks.filter((t) => t.status !== 'completed').map((t) => t.title);

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
    const excelFilename = `feuille_de_taches_${safeCollabName}_${safeDate}.xlsx`;

    const result = await clientMailService.sendThreadedEmail({
      employeeName: myName,
      employeeId: myId,
      employeeEmail: myEmail,
      eventTitle: 'Feuille de tâches',
      threadCategory: 'timesheet',
      threadSubject: `Feuille de tâches - ${myName}`,
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
      console.log('✅ [FEUILLE DE TÂCHES SUCCÈS] Transmission confirmée :', result);
      if (showToast) showToast('Feuille de tâches Excel envoyée avec succès !', 'success');
      onAddNotification({
        id: `notif-${Date.now()}`,
        title: 'Feuille de tâches transmise',
        content: `Votre feuille de tâches (${items.length} activités, ${totalActual}h réelles) a été transmise aux RH avec la pièce jointe Excel.`,
        message: `Votre feuille de tâches (${items.length} activités, ${totalActual}h réelles) a été transmise aux RH avec la pièce jointe Excel.`,
        type: 'email',
        recipient: myEmail || myName,
        payload: JSON.stringify({ employeeId: myId }),
        timestamp: new Date().toISOString(),
        read: false,
        senderName: 'Système RH',
      });
    } else {
      const rawError = result.error || "Erreur inconnue lors de l'envoi de la fiche de temps.";
      console.error('❌ [FICHE DE TEMPS ÉCHEC]:', { error: rawError, fullResult: result });
      if (showToast) showToast(rawError, 'error');
      await showErrorAlert("Échec d'envoi de la fiche de temps", rawError);
    }
  } catch (err: any) {
    const rawException = err?.message || String(err);
    console.error('💥 [FICHE DE TEMPS EXCEPTION CLIENT]:', rawException);
    if (showToast) showToast(rawException, 'error');
    await showErrorAlert('Exception inattendue', rawException);
  }
}
