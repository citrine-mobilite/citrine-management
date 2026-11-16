import { useState, useEffect, useMemo, FormEvent } from 'react';
import { AttendanceIncident, AppUser, Employee, Presence, Task, TaskProject } from '../../../types';
import {
  generateDailyTimesheet,
  generateMonthlyTimesheet,
  generateYearlyTimesheet,
  exportDailyTimesheetToExcel,
} from '../../../services/timesheetService';
import { exportToExcel } from '../../../services/excelExportService';
import { exportElementToPdf } from '../../../services/pdfExportService';
import { haptic } from '../../../services/hapticService';
import { sortSubtasksNewestFirst } from '../../../utils/subtaskFilterUtils';
import {
  getTimesheetNotes,
  addTimesheetNote,
  deleteTimesheetNote,
  TimesheetNote,
  TimesheetNoteCategory,
  TimesheetNoteUrgency,
} from '../../../services/timesheetNotesService';

interface CustomUnforeseenEvent {
  id: string;
  time: string;
  subject: string;
  lostMinutes: number;
}

interface UseTimesheetModalLogicParams {
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

export function useTimesheetModalLogic({
  isOpen,
  employee,
  allTasks,
  presences,
  incidents,
  projects,
  defaultMode = 'day',
  defaultDate,
  currentUser,
}: UseTimesheetModalLogicParams) {
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

  const [timesheetNotes, setTimesheetNotes] = useState<TimesheetNote[]>([]);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<TimesheetNoteCategory>('bloquant');
  const [newNoteUrgency, setNewNoteUrgency] = useState<TimesheetNoteUrgency>('haute');
  const [newNoteTarget, setNewNoteTarget] = useState('Manager Direct');

  useEffect(() => {
    if (isOpen) {
      if (defaultMode) setMode(defaultMode);
      if (defaultDate) setSelectedDate(defaultDate);
    }
  }, [isOpen, defaultMode, defaultDate]);

  useEffect(() => {
    if (isOpen && employee?.id) {
      setTimesheetNotes(getTimesheetNotes(employee.id, selectedDate));
    }
  }, [isOpen, employee?.id, selectedDate]);

  useEffect(() => {
    const handleNotesUpdate = () => {
      if (employee?.id) setTimesheetNotes(getTimesheetNotes(employee.id, selectedDate));
    };
    window.addEventListener('citrine:timesheet_notes_updated', handleNotesUpdate);
    return () => window.removeEventListener('citrine:timesheet_notes_updated', handleNotesUpdate);
  }, [employee?.id, selectedDate]);

  const rawDailyData = useMemo(
    () => generateDailyTimesheet(employee, selectedDate, allTasks, presences, incidents, projects),
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
    () => generateMonthlyTimesheet(employee, selectedMonth, allTasks, presences),
    [employee, selectedMonth, allTasks, presences]
  );

  const yearlyData = useMemo(
    () => generateYearlyTimesheet(employee, selectedYear, allTasks, presences),
    [employee, selectedYear, allTasks, presences]
  );

  const handleAddTimesheetNote = (e: FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !employee?.id) return;
    haptic.medium();
    addTimesheetNote({
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
    deleteTimesheetNote(id);
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
      const notesSummary = timesheetNotes.length > 0
        ? timesheetNotes.map(n => `[${n.category.toUpperCase()} - ${n.urgency}] ${n.content} (Dest: ${n.targetAudience})`).join(' | ')
        : dailyData.managerAlertPoint;
      exportDailyTimesheetToExcel({ ...dailyData, managerAlertPoint: notesSummary });
    } else if (mode === 'month') {
      const headers = ['Tâche / Mission Parente', 'Sous-Tâche', 'Priorité', 'Date / Échéance', 'Statut Sous-Tâche', 'Avancement Tâche'];
      const rows: any[] = [];
      (monthlyData.tasksList || []).forEach((t) => {
        if (t.subtasks && t.subtasks.length > 0) {
          sortSubtasksNewestFirst(t.subtasks, t.date).forEach((s) => rows.push([t.title, s.title, t.priority || 'Normal', t.date || selectedMonth, s.completed ? 'Terminée ✓' : (s.status === 'in_progress' ? 'En cours' : 'À faire'), `${t.completionPercentage}%`]));
        } else {
          rows.push([t.title, '(Tâche unitaire)', t.priority || 'Normal', t.date || selectedMonth, t.status === 'completed' ? 'Terminée ✓' : 'En cours', t.status === 'completed' ? '100%' : '50%']);
        }
      });
      exportToExcel(`feuille_taches_mensuelle_${employee.name}_${selectedMonth}.xls`, `Feuille de Tâches - ${monthlyData.monthName}`, headers, rows);
    } else {
      const headers = ['Mois', 'Jours Travaillés', 'Heures Cumulées', 'Sous-Tâches Achevées', 'Taux de Rendement'];
      const rows = yearlyData.monthlyBreakdown.map((m) => [m.monthName, m.daysWorked, `${m.hoursWorked}h`, m.tasksCompleted, `${m.rendementRate}%`]);
      exportToExcel(`feuille_taches_annuelle_${employee.name}_${selectedYear}.xls`, `Bilan Annuel Tâches ${selectedYear} - ${employee.name}`, headers, rows);
    }
  };

  const handleExportPdf = () => {
    exportElementToPdf('timesheet-printable-sheet', `feuille_de_taches_${employee.name}_${mode}.pdf`);
  };

  return {
    mode, setMode, selectedDate, setSelectedDate, selectedMonth, setSelectedMonth, selectedYear, setSelectedYear,
    isViewingSelf, isAddingUnforeseen, setIsAddingUnforeseen, newUnforeseenTime, setNewUnforeseenTime,
    newUnforeseenSubject, setNewUnforeseenSubject, newUnforeseenLostMin, setNewUnforeseenLostMin,
    timesheetNotes, isAddingNote, setIsAddingNote, newNoteContent, setNewNoteContent,
    newNoteCategory, setNewNoteCategory, newNoteUrgency, setNewNoteUrgency, newNoteTarget, setNewNoteTarget,
    dailyData, monthlyData, yearlyData, handleAddTimesheetNote, handleRemoveNote,
    handleAddCustomUnforeseen, handleRemoveCustomUnforeseen, handleExportExcel, handleExportPdf,
  };
}
