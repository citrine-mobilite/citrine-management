import { useState, useEffect, useMemo, FormEvent } from 'react';
import { AttendanceIncident, AppUser, Employee, Presence, Task, TaskProject } from '../../../types';
import {
  generateDailyTaskSheet,
  generateMonthlyTaskSheet,
  generateYearlyTaskSheet,
  exportDailyTaskSheetToExcel,
} from '../../../services/taskSheetService';
import { exportToExcel } from '../../../services/excelExportService';
import { downloadTaskSheetPdf } from '../../../services/pdfExportService';
import { haptic } from '../../../services/hapticService';
import {
  getTaskSheetNotes,
  addTaskSheetNote,
  deleteTaskSheetNote,
  TaskSheetNote,
  TaskSheetNoteCategory,
  TaskSheetNoteUrgency,
  TASKSHEET_NOTES_UPDATED_EVENT,
} from '../../../services/taskSheetNotesService';
import {
  buildTaskSheetHtmlReport,
  buildTaskSheetExcelBase64,
  buildMonthlyTaskSheetHtmlReport,
  buildMonthlyTaskSheetExcelBase64,
  buildYearlyTaskSheetHtmlReport,
  buildYearlyTaskSheetExcelBase64,
  getDoualaDateInfo,
} from '../../../services/taskSheetReportService';
import { clientMailService } from '../../../services/clientMailService';
import { logSystemAudit } from '../../../services/adminAuditService';

interface CustomUnforeseenEvent {
  id: string;
  time: string;
  subject: string;
  lostMinutes: number;
}

interface UseTaskSheetModalLogicParams {
  isOpen: boolean;
  employee: Employee;
  allTasks: Task[];
  presences: Presence[];
  incidents: AttendanceIncident[];
  projects: TaskProject[];
  defaultMode?: 'day' | 'month' | 'year';
  defaultDate?: string;
  currentUser?: AppUser | null;
}

export function useTaskSheetModalLogic({
  isOpen,
  employee,
  allTasks,
  presences,
  incidents,
  projects,
  defaultMode = 'day',
  defaultDate,
  currentUser,
}: UseTaskSheetModalLogicParams) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [mode, setMode] = useState<'day' | 'month' | 'year'>(defaultMode);
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate || todayStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(todayStr.slice(0, 7));
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const isViewingSelf = Boolean(
    currentUser &&
      (currentUser.name?.toLowerCase().includes(employee.name.toLowerCase()) ||
        currentUser.email?.toLowerCase() === employee.email?.toLowerCase() ||
        employee.name.toLowerCase().includes(currentUser.name?.toLowerCase() || ''))
  );

  const [customUnforeseenList, setCustomUnforeseenList] = useState<CustomUnforeseenEvent[]>([]);
  const [isAddingUnforeseen, setIsAddingUnforeseen] = useState(false);
  const [newUnforeseenTime, setNewUnforeseenTime] = useState('14:30');
  const [newUnforeseenSubject, setNewUnforeseenSubject] = useState('');
  const [newUnforeseenLostMin, setNewUnforeseenLostMin] = useState(30);

  const [taskSheetNotes, setTaskSheetNotes] = useState<TaskSheetNote[]>([]);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<TaskSheetNoteCategory>('bloquant');
  const [newNoteUrgency, setNewNoteUrgency] = useState<TaskSheetNoteUrgency>('haute');
  const [newNoteTarget, setNewNoteTarget] = useState('Manager Direct');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (defaultMode) setMode(defaultMode);
      if (defaultDate) setSelectedDate(defaultDate);
    }
  }, [isOpen, defaultMode, defaultDate]);

  useEffect(() => {
    if (isOpen && employee?.id) {
      setTaskSheetNotes(getTaskSheetNotes(employee.id, selectedDate));
    }
  }, [isOpen, employee?.id, selectedDate]);

  useEffect(() => {
    const handleNotesUpdate = () => {
      if (employee?.id) setTaskSheetNotes(getTaskSheetNotes(employee.id, selectedDate));
    };
    window.addEventListener(TASKSHEET_NOTES_UPDATED_EVENT, handleNotesUpdate);
    return () => window.removeEventListener(TASKSHEET_NOTES_UPDATED_EVENT, handleNotesUpdate);
  }, [employee?.id, selectedDate]);

  const rawDailyData = useMemo(
    () => generateDailyTaskSheet(employee, selectedDate, allTasks, presences, incidents, projects),
    [employee, selectedDate, allTasks, presences, incidents, projects]
  );

  const dailyData = useMemo(() => ({
    ...rawDailyData,
    unforeseenEvents: [
      ...rawDailyData.unforeseenEvents,
      ...customUnforeseenList.map((c) => ({ time: c.time, subject: c.subject, lostMinutes: c.lostMinutes })),
    ],
  }), [rawDailyData, customUnforeseenList]);

  const monthlyData = useMemo(
    () => generateMonthlyTaskSheet(employee, selectedMonth, allTasks, presences),
    [employee, selectedMonth, allTasks, presences]
  );

  const yearlyData = useMemo(
    () => generateYearlyTaskSheet(employee, selectedYear, allTasks, presences),
    [employee, selectedYear, allTasks, presences]
  );

  const handleAddTaskSheetNote = (e: FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !employee?.id) return;
    haptic.medium();
    addTaskSheetNote({
      employeeId: employee.id,
      employeeName: employee.name,
      date: selectedDate,
      category: newNoteCategory,
      urgency: newNoteUrgency,
      content: newNoteContent.trim(),
      targetAudience: newNoteTarget,
      authorName: employee.name,
    });
    setNewNoteContent('');
    setIsAddingNote(false);
  };

  const handleRemoveNote = (id: string) => {
    haptic.light();
    deleteTaskSheetNote(id);
  };

  const handleAddCustomUnforeseen = (e: FormEvent) => {
    e.preventDefault();
    if (!newUnforeseenSubject.trim()) return;
    haptic.medium();
    setCustomUnforeseenList([
      ...customUnforeseenList,
      { id: `unf-${Date.now()}`, time: newUnforeseenTime, subject: newUnforeseenSubject.trim(), lostMinutes: Number(newUnforeseenLostMin) || 30 },
    ]);
    setNewUnforeseenSubject('');
    setIsAddingUnforeseen(false);
  };

  const handleRemoveCustomUnforeseen = (id: string) => {
    haptic.light();
    setCustomUnforeseenList(customUnforeseenList.filter((item) => item.id !== id));
  };

  const handleExportExcel = () => {
    if (mode === 'day') {
      const notesSummary = taskSheetNotes.length > 0
        ? taskSheetNotes.map(n => `[${n.category.toUpperCase()} - ${n.urgency}] ${n.content} (Dest: ${n.targetAudience})`).join(' | ')
        : dailyData.managerAlertPoint;
      exportDailyTaskSheetToExcel({ ...dailyData, managerAlertPoint: notesSummary });
    } else if (mode === 'month') {
      const headers = ['Tâche / Mission Parente', 'Sous-Tâche', 'Priorité', 'Date / Échéance', 'Statut Sous-Tâche', 'Avancement Tâche'];
      const rows: any[] = [];
      (monthlyData.tasksList || []).forEach((t) => {
        if (t.subtasks && t.subtasks.length > 0) {
          t.subtasks.forEach((s) => rows.push([t.title, s.title, t.priority || 'Normal', t.date || selectedMonth, s.completed ? 'Terminée ✓' : (s.status === 'in_progress' ? 'En cours' : 'À faire'), `${t.completionPercentage}%`]));
        } else {
          rows.push([t.title, '(Tâche unitaire)', t.priority || 'Normal', t.date || selectedMonth, t.status === 'completed' ? 'Terminée ✓' : 'En cours', t.status === 'completed' ? '100%' : '50%']);
        }
      });
      exportToExcel(`tasksheet_mensuel_${employee.name}_${selectedMonth}.xls`, `TaskSheet Mensuel - ${monthlyData.monthName}`, headers, rows);
    } else {
      const headers = ['Mois', 'Jours Travaillés', 'Heures Cumulées', 'Sous-Tâches Achevées', 'Taux de Rendement'];
      const rows = yearlyData.monthlyBreakdown.map((m) => [m.monthName, m.daysWorked, `${m.hoursWorked}h`, m.tasksCompleted, `${m.rendementRate}%`]);
      exportToExcel(`tasksheet_annuel_${employee.name}_${selectedYear}.xls`, `Bilan Annuel TaskSheet ${selectedYear} - ${employee.name}`, headers, rows);
    }
  };

  const handleExportPdf = async () => {
    haptic.light();
    const { ensurePublicLogoLoaded } = await import('../../../services/pdf/publicLogoLoader');
    await ensurePublicLogoLoaded('/citrine-logo.png');
    downloadTaskSheetPdf({
      mode,
      dailyData,
      monthlyData,
      yearlyData,
      notes: taskSheetNotes,
    });
  };

  const handleSendEmail = async () => {
    if (isSendingEmail) return;
    setIsSendingEmail(true);
    haptic.medium();
    try {
      const safeName = employee.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      let htmlContent = '';
      let excelBase64 = '';
      let excelFilename = '';
      let eventTitle = '';
      let threadSubject = '';

      if (mode === 'day') {
        const douala = getDoualaDateInfo(new Date(`${selectedDate}T12:00:00`));
        const todayPresence = presences.find(
          (p) => String(p.employeeId) === String(employee.id) && p.date === selectedDate
        );
        const dailyAttendance = todayPresence
          ? {
              statusLabel:
                todayPresence.status === 'late'
                  ? 'En retard'
                  : todayPresence.status === 'mission'
                  ? 'En mission'
                  : todayPresence.status === 'absent'
                  ? 'Absent'
                  : 'Présent',
              statusType: todayPresence.status as any,
              arrivalTime: todayPresence.arrivalTime || undefined,
              pauseStart: todayPresence.pauseStart || undefined,
              pauseEnd: todayPresence.pauseEnd || undefined,
              departureTime: todayPresence.departureTime || undefined,
              location: todayPresence.location || 'Douala',
            }
          : undefined;

        const reportData = {
          employeeName: employee.name,
          employeeEmail: employee.email,
          employeeId: employee.id,
          department: dailyData.department,
          dateStr: douala.dateOnly,
          timeStr: douala.timeOnly,
          dailyAttendance,
          presenceIncidents: dailyData.presenceIncidents,
          items: dailyData.tasks.map((t, idx) => ({
            index: idx + 1,
            taskTitle: t.parentTaskTitle,
            subTitle: t.title,
            status: t.status === 'Fait' ? 'completed' : t.status === 'Bloqué' ? 'blocked' : t.status === 'En cours' ? 'in_progress' : 'todo',
            statusLabel: t.status,
            estimatedHours: Math.round((t.estimatedMinutes / 60) * 10) / 10,
            actualHours: 0,
            isBlocked: t.status === 'Bloqué',
          })),
          blockers: dailyData.unforeseenEvents.map((u) => ({
            sourceTask: u.sourceTask || 'Journée',
            reason: u.subject,
            time: u.time,
            status: u.status,
          })),
          managerPoints: taskSheetNotes.map((n) => ({
            sourceTask: `Note (${n.category})`,
            content: n.content,
            author: n.authorName,
            time: n.time,
            urgency: n.urgency,
          })),
          totalEstimatedHours: Math.round((dailyData.capacity.plannedMinutes / 60) * 10) / 10,
          totalActualHours: 0,
          topPriorities: dailyData.topPriorities,
          scheduleSlots: dailyData.scheduleSlots,
          postponedTasks: dailyData.postponedTasks,
        };

        htmlContent = buildTaskSheetHtmlReport(reportData);
        excelBase64 = await buildTaskSheetExcelBase64(reportData);
        excelFilename = `feuille_taches_${safeName}_${selectedDate.replace(/-/g, '_')}.xlsx`;
        eventTitle = `Feuille de Tâches Journalière (${selectedDate})`;
        threadSubject = `Feuille de Tâches - ${employee.name} (${douala.dateOnly})`;
      } else if (mode === 'month') {
        htmlContent = buildMonthlyTaskSheetHtmlReport(monthlyData);
        excelBase64 = await buildMonthlyTaskSheetExcelBase64(monthlyData);
        excelFilename = `feuille_taches_mensuelle_${safeName}_${selectedMonth}.xlsx`;
        eventTitle = `Feuille de Tâches Mensuelle (${monthlyData.monthName})`;
        threadSubject = `Feuille de Tâches Mensuelle (${monthlyData.monthName}) - ${employee.name}`;
      } else {
        htmlContent = buildYearlyTaskSheetHtmlReport(yearlyData);
        excelBase64 = await buildYearlyTaskSheetExcelBase64(yearlyData);
        excelFilename = `bilan_annuel_taches_${safeName}_${selectedYear}.xlsx`;
        eventTitle = `Bilan Annuel des Tâches (${selectedYear})`;
        threadSubject = `Bilan Annuel des Tâches (${selectedYear}) - ${employee.name}`;
      }

      const result = await clientMailService.sendThreadedEmail({
        employeeName: employee.name,
        employeeId: employee.id,
        employeeEmail: employee.email,
        eventTitle,
        threadCategory: 'tasksheet',
        threadSubject,
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
        logSystemAudit({
          authorName: currentUser?.name || employee.name,
          authorRole: currentUser?.role || 'collaborateur',
          targetName: employee.name,
          targetEmployeeId: String(employee.id),
          operationType: 'feuille_avancement_taches',
          operationLabel: `Envoi Mail (${mode === 'day' ? 'Jour' : mode === 'month' ? 'Mois' : 'Année'})`,
          details: `${eventTitle} transmise par e-mail avec pièce jointe ${excelFilename}.`,
          level: 'success',
        });
        setEmailFeedback({ type: 'success', message: `${eventTitle} transmise par e-mail avec succès.` });
      } else {
        setEmailFeedback({ type: 'error', message: result.error || "Impossible d'envoyer l'e-mail." });
      }
    } catch (err: any) {
      setEmailFeedback({ type: 'error', message: err?.message || String(err) });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return {
    mode, setMode, selectedDate, setSelectedDate, selectedMonth, setSelectedMonth, selectedYear, setSelectedYear,
    isViewingSelf, isAddingUnforeseen, setIsAddingUnforeseen, newUnforeseenTime, setNewUnforeseenTime,
    newUnforeseenSubject, setNewUnforeseenSubject, newUnforeseenLostMin, setNewUnforeseenLostMin,
    taskSheetNotes, isAddingNote, setIsAddingNote, newNoteContent, setNewNoteContent,
    newNoteCategory, setNewNoteCategory, newNoteUrgency, setNewNoteUrgency, newNoteTarget, setNewNoteTarget,
    dailyData, monthlyData, yearlyData, handleAddTaskSheetNote, handleRemoveNote,
    handleAddCustomUnforeseen, handleRemoveCustomUnforeseen, handleExportExcel, handleExportPdf,
    handleSendEmail, isSendingEmail, emailFeedback, setEmailFeedback,
  };
}
