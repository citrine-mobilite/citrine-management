import React, { useState, useMemo } from 'react';
import { 
  X, 
  Calendar, 
  Download, 
  Printer, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  Trophy, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  Plus,
  Trash2,
  Zap,
  Coffee,
  ShieldCheck,
  Flame,
  Check
} from 'lucide-react';
import { Employee, Task, Presence, AttendanceIncident, TaskProject, AppUser } from '../../types';
import { 
  generateDailyTimesheet, 
  generateMonthlyTimesheet, 
  generateYearlyTimesheet,
  exportDailyTimesheetToExcel 
} from '../../services/timesheetService';
import { exportToExcel } from '../../services/excelExportService';
import { exportElementToPdf } from '../../services/pdfExportService';
import { haptic } from '../../services/hapticService';
import { 
  getTimesheetNotes, 
  addTimesheetNote, 
  deleteTimesheetNote, 
  updateTimesheetNoteStatus, 
  TimesheetNote, 
  TimesheetNoteCategory, 
  TimesheetNoteUrgency 
} from '../../services/timesheetNotesService';

interface TimesheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  allTasks: Task[];
  presences: Presence[];
  incidents?: AttendanceIncident[];
  projects?: TaskProject[];
  defaultMode?: 'day' | 'month' | 'year';
  defaultDate?: string;
  currentUser?: AppUser | null;
  currentRole?: string;
}

interface CustomUnforeseenEvent {
  id: string;
  time: string;
  subject: string;
  lostMinutes: number;
}

export const TimesheetModal: React.FC<TimesheetModalProps> = ({
  isOpen,
  onClose,
  employee,
  allTasks,
  presences,
  incidents = [],
  projects = [],
  defaultMode = 'day',
  defaultDate,
  currentUser,
  currentRole,
}) => {
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

  // Gestion interactive des Imprévus saisis en direct
  const [customUnforeseenList, setCustomUnforeseenList] = useState<CustomUnforeseenEvent[]>([]);
  const [isAddingUnforeseen, setIsAddingUnforeseen] = useState(false);
  const [newUnforeseenTime, setNewUnforeseenTime] = useState('14:30');
  const [newUnforeseenSubject, setNewUnforeseenSubject] = useState('');
  const [newUnforeseenLostMin, setNewUnforeseenLostMin] = useState(30);

  // Gestion interactive des Points à Signaler dans la Feuille de Temps
  const [timesheetNotes, setTimesheetNotes] = useState<TimesheetNote[]>([]);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<TimesheetNoteCategory>('bloquant');
  const [newNoteUrgency, setNewNoteUrgency] = useState<TimesheetNoteUrgency>('haute');
  const [newNoteTarget, setNewNoteTarget] = useState('Manager Direct');

  React.useEffect(() => {
    if (isOpen) {
      if (defaultMode) setMode(defaultMode);
      if (defaultDate) setSelectedDate(defaultDate);
    }
  }, [isOpen, defaultMode, defaultDate]);

  React.useEffect(() => {
    if (isOpen && employee?.id) {
      setTimesheetNotes(getTimesheetNotes(employee.id, selectedDate));
    }
  }, [isOpen, employee?.id, selectedDate]);

  React.useEffect(() => {
    const handleNotesUpdate = () => {
      if (employee?.id) {
        setTimesheetNotes(getTimesheetNotes(employee.id, selectedDate));
      }
    };
    window.addEventListener('citrine:timesheet_notes_updated', handleNotesUpdate);
    return () => window.removeEventListener('citrine:timesheet_notes_updated', handleNotesUpdate);
  }, [employee?.id, selectedDate]);

  const handleAddTimesheetNote = (e: React.FormEvent) => {
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

  // Compute timesheet data based on active mode
  const rawDailyData = useMemo(() => {
    return generateDailyTimesheet(employee, selectedDate, allTasks, presences, incidents, projects);
  }, [employee, selectedDate, allTasks, presences, incidents, projects]);

  // Fusionner les imprévus enregistrés et les imprévus saisis dans le modal
  const dailyData = useMemo(() => {
    const combinedUnforeseen = [
      ...rawDailyData.unforeseenEvents,
      ...customUnforeseenList.map((c) => ({
        time: c.time,
        subject: c.subject,
        lostMinutes: c.lostMinutes,
      })),
    ];
    return {
      ...rawDailyData,
      unforeseenEvents: combinedUnforeseen,
    };
  }, [rawDailyData, customUnforeseenList]);

  const monthlyData = useMemo(() => {
    return generateMonthlyTimesheet(employee, selectedMonth, allTasks, presences);
  }, [employee, selectedMonth, allTasks, presences]);

  const yearlyData = useMemo(() => {
    return generateYearlyTimesheet(employee, selectedYear, allTasks, presences);
  }, [employee, selectedYear, allTasks, presences]);

  if (!isOpen) return null;

  const handleAddCustomUnforeseen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnforeseenSubject.trim()) return;
    haptic.medium();

    const newEvent: CustomUnforeseenEvent = {
      id: `unf-${Date.now()}`,
      time: newUnforeseenTime,
      subject: newUnforeseenSubject.trim(),
      lostMinutes: Number(newUnforeseenLostMin) || 30,
    };

    setCustomUnforeseenList([...customUnforeseenList, newEvent]);
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
      exportDailyTimesheetToExcel({
        ...dailyData,
        managerAlertPoint: notesSummary,
      });
    } else if (mode === 'month') {
      const headers = ['Date', 'Jour', 'Arrivée', 'Départ', 'Heures Travaillées', 'Statut Pointage', 'Tâches Clôturées'];
      const rows = monthlyData.dailyBreakdown.map((d) => [
        d.date,
        d.dayName,
        d.arrivalTime,
        d.departureTime,
        `${d.hoursWorked}h`,
        d.status,
        d.tasksDoneCount,
      ]);
      exportToExcel(`feuille_temps_mensuelle_${employee.name}_${selectedMonth}.xls`, `Feuille Mensuelle - ${monthlyData.monthName}`, headers, rows);
    } else {
      const headers = ['Mois', 'Jours Travaillés', 'Heures Cumulées', 'Tâches Achevées', 'Taux de Rendement'];
      const rows = yearlyData.monthlyBreakdown.map((m) => [
        m.monthName,
        m.daysWorked,
        `${m.hoursWorked}h`,
        m.tasksCompleted,
        `${m.rendementRate}%`,
      ]);
      exportToExcel(`feuille_temps_annuelle_${employee.name}_${selectedYear}.xls`, `Bilan Annuel ${selectedYear} - ${employee.name}`, headers, rows);
    }
  };

  const handleExportPdf = () => {
    exportElementToPdf('timesheet-printable-sheet', `feuille_de_temps_${employee.name}_${mode}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto max-h-[95vh]">
        
        {/* Top Dialog Toolbar */}
        <div className="bg-gradient-to-r from-emerald-950 via-[#2A7B76] to-[#164e4b] p-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
              <FileSpreadsheet className="h-5 w-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-emerald-100">
                  Modèle Officiel Citrine
                </span>
                <span className="text-[10px] text-emerald-200 font-medium">
                  {employee.name} • {employee.department || 'Général'}
                </span>
              </div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-white">
                Feuille de Temps Automatique &amp; Plan Horaire
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Exporter sous format Excel (.xls)"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Excel (.xls)</span>
            </button>
            <button
              onClick={handleExportPdf}
              className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer border border-white/20"
              title="Imprimer ou exporter en PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer ml-1"
              title="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mode Selector & Date Navigator */}
        <div className="p-3 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 text-xs">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-stone-200/80 p-1 rounded-xl">
            <button
              onClick={() => setMode('day')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                mode === 'day' ? 'bg-[#2A7B76] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              📅 Plan du Jour (Journalier)
            </button>
            <button
              onClick={() => setMode('month')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                mode === 'month' ? 'bg-[#2A7B76] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              🗓️ Synthèse Mensuelle
            </button>
            <button
              onClick={() => setMode('year')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                mode === 'year' ? 'bg-[#2A7B76] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              🏆 Bilan Annuel
            </button>
          </div>

          {/* Date controls */}
          <div className="flex items-center gap-2">
            {mode === 'day' && (
              <div className="flex items-center gap-1.5 bg-white border border-stone-200 px-3 py-1 rounded-xl">
                <Calendar className="h-3.5 w-3.5 text-[#2A7B76]" />
                <span className="font-semibold text-stone-600">Date :</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="font-mono font-bold text-stone-900 outline-none text-xs"
                />
              </div>
            )}

            {mode === 'month' && (
              <div className="flex items-center gap-1.5 bg-white border border-stone-200 px-3 py-1 rounded-xl">
                <Calendar className="h-3.5 w-3.5 text-[#2A7B76]" />
                <span className="font-semibold text-stone-600">Mois :</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="font-mono font-bold text-stone-900 outline-none text-xs"
                />
              </div>
            )}

            {mode === 'year' && (
              <div className="flex items-center gap-1.5 bg-white border border-stone-200 px-3 py-1 rounded-xl">
                <Calendar className="h-3.5 w-3.5 text-[#2A7B76]" />
                <span className="font-semibold text-stone-600">Année :</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="font-mono font-bold text-stone-900 outline-none text-xs"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Printable & Interactive Timesheet Sheet */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 bg-stone-100/50">
          <div 
            id="timesheet-printable-sheet" 
            className="bg-white p-6 rounded-2xl border border-stone-300 shadow-sm space-y-5 text-xs text-stone-900 max-w-3xl mx-auto"
            style={{ fontFamily: 'Calibri, Arial, sans-serif' }}
          >
            
            {/* Header Citrine Plan du Jour */}
            <div className="border-b-2 border-[#164e4b] pb-3 flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-serif font-black tracking-wide italic text-[#164e4b]">
                  CITRINE
                </h1>
                <div className="font-bold text-sm text-[#164e4b] mt-0.5">
                  {mode === 'day' && `PLAN DU JOUR — ${dailyData.department.toUpperCase()}`}
                  {mode === 'month' && `FEUILLE DE TEMPS MENSUELLE — ${monthlyData.monthName.toUpperCase()}`}
                  {mode === 'year' && `BILAN ANNUEL D'ACTIVITÉ — ${yearlyData.year}`}
                </div>
              </div>

              <div className="text-right text-[11px] text-stone-600 font-mono space-y-0.5">
                <div><strong>Collaborateur :</strong> {employee.name}</div>
                <div><strong>Lieu :</strong> Douala • <strong>Département :</strong> {employee.department || 'IT'}</div>
                {mode === 'day' && <div><strong>Date :</strong> {dailyData.date} ({dailyData.dayName})</div>}
              </div>
            </div>

            {/* MODE 1: PLAN DU JOUR DYNAMIQUE */}
            {mode === 'day' && (
              <div className="space-y-4">
                
                {/* 🎯 BANNIÈRE DE CAPACITÉ JOURNALIÈRE CALCULÉE (AVEC JALON OU SANS JALON) */}
                <div className={`p-3.5 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  dailyData.capacity.capacityStatus === 'overloaded'
                    ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                    : dailyData.capacity.capacityStatus === 'optimal'
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-teal-50/70 border-teal-200 text-teal-950'
                }`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold uppercase tracking-wider text-[10px] bg-white/80 px-2 py-0.5 rounded-md border border-stone-200">
                        Capacité Opérationnelle du Jour
                      </span>
                      {dailyData.capacity.hasMilestone && (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-amber-600" />
                          Jalon Clé Détecté : {dailyData.capacity.milestoneTitle}
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-xs leading-relaxed">
                      {dailyData.capacity.capacityAdvice}
                    </p>
                  </div>

                  <div className="text-right shrink-0 font-mono text-[11px] bg-white/90 p-2.5 rounded-xl border border-stone-200/80 shadow-3xs space-y-0.5">
                    <div><strong>Capacité max :</strong> 12h / jour</div>
                    <div className={dailyData.capacity.capacityStatus === 'overloaded' ? 'text-rose-600 font-bold' : 'text-stone-500'}>
                      {dailyData.capacity.capacityStatus === 'overloaded' ? '⚠️ Surcharge (> 10h)' : 'Seuil surcharge > 10h'}
                    </div>
                    <div className="font-bold text-[#2A7B76]">
                      {dailyData.totalTasks} sous-tâche(s) ({Math.round(dailyData.capacity.plannedMinutes / 60)}h)
                    </div>
                  </div>
                </div>

                {/* 1. LES 3 PRIORITÉS DU JOUR (LES GRANDES TÂCHES / JOB DESCRIPTION) */}
                <div className="rounded-xl border border-stone-300 overflow-hidden">
                  <div className="bg-[#164e4b] text-white px-3 py-2 font-bold text-xs flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span>🎯</span>
                      <span>LES 3 PRIORITÉS DU JOUR — si je ne fais que ça, la journée est réussie</span>
                    </div>
                    <span className="text-[10px] text-emerald-200 font-normal">
                      Piliers majeurs de la journée
                    </span>
                  </div>
                  <div className="divide-y divide-stone-200">
                    {dailyData.topPriorities.map((p, idx) => (
                      <div key={p.id || idx} className="p-2.5 flex items-center justify-between bg-white text-xs hover:bg-stone-50 transition">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-bold text-stone-400 w-4 text-center">{idx + 1}.</span>
                          <span className="font-bold text-blue-800 truncate">{p.title}</span>
                          {p.isMilestone && (
                            <span className="bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded-md text-[9px] font-bold shrink-0 flex items-center gap-0.5">
                              <Trophy className="w-2.5 h-2.5" /> Jalon Clé
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-stone-500 uppercase font-mono font-semibold">
                            {p.priority}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            p.status === 'Fait' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {p.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    {dailyData.topPriorities.length === 0 && (
                      <div className="p-3 text-center text-stone-400 italic">
                        Aucune mission prioritaire définie pour aujourd'hui.
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. TÂCHES DU JOUR (LES SOUS-TÂCHES CONCRÈTES TRAITÉES) */}
                <div className="rounded-xl border border-stone-300 overflow-hidden">
                  <div className="bg-[#164e4b] text-white px-3 py-2 font-bold text-xs flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span>📋</span>
                      <span>TÂCHES DU JOUR (Sous-tâches concrètes traitées)</span>
                    </div>
                    <span className="text-[10px] text-emerald-200 font-mono">
                      {dailyData.completedTasks}/{dailyData.totalTasks} terminées ({dailyData.ratePercentage}%)
                    </span>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#2A7B76] text-white font-bold text-[11px]">
                      <tr>
                        <th className="py-2 px-3">Sous-Tâche</th>
                        <th className="py-2 px-3">Mission Parente (Job Description)</th>
                        <th className="py-2 px-2 text-center w-12">Prio</th>
                        <th className="py-2 px-3 text-right w-24">Estimé (min)</th>
                        <th className="py-2 px-3 text-center w-24">Échéance</th>
                        <th className="py-2 px-3 text-center w-24">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 font-medium">
                      {dailyData.tasks.map((t, idx) => (
                        <tr key={idx} className="hover:bg-stone-50 transition">
                          <td className="py-2 px-3 font-semibold text-blue-800 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                            <span>{t.title}</span>
                          </td>
                          <td className="py-2 px-3 text-stone-600">
                            <span className="truncate block max-w-xs">{t.parentTaskTitle}</span>
                          </td>
                          <td className={`py-2 px-2 text-center font-bold text-[11px] ${
                            t.priorityLabel === 'P1' ? 'text-rose-600' : t.priorityLabel === 'P2' ? 'text-blue-600' : 'text-amber-600'
                          }`}>
                            {t.priorityLabel}
                          </td>
                          <td className="py-2 px-3 text-right font-mono">{t.estimatedMinutes} min</td>
                          <td className="py-2 px-3 text-center font-mono text-[11px] text-stone-500">{t.dueDate}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              t.status === 'Fait' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {dailyData.tasks.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-stone-400 italic">
                            Aucune sous-tâche planifiée aujourd'hui.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {/* Summary row */}
                    <tfoot className="bg-[#164e4b] text-white font-bold text-xs">
                      <tr>
                        <td colSpan={2} className="py-2 px-3">Total sous-tâches / réalisées / avancement</td>
                        <td className="py-2 px-2 text-center">{dailyData.totalTasks}</td>
                        <td className="py-2 px-3 text-right">{dailyData.completedTasks} fait</td>
                        <td className="py-2 px-3 text-center">{dailyData.ratePercentage}%</td>
                        <td className="py-2 px-3 text-center">{dailyData.postponedCount} à suivre</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* 3. PLAN HORAIRE DYNAMIQUE (HORAIRES 08H00 – 17H00, PAUSE STRICTE 12H–13H) */}
                <div className="rounded-xl border border-stone-300 overflow-hidden">
                  <div className="bg-[#164e4b] text-white px-3 py-2 font-bold text-xs flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span>🕒</span>
                      <span>PLAN HORAIRE (08:00 – 17:00) — garde un créneau « tampon » pour les imprévus</span>
                    </div>
                    <span className="text-[10px] bg-amber-400/30 text-amber-100 border border-amber-300/40 px-2 py-0.5 rounded-full font-mono">
                      12:00 – 13:00 : TAMPON IMPRÉVUS / pause
                    </span>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#2A7B76] text-white font-bold text-[11px]">
                      <tr>
                        <th className="py-2 px-3 w-40">Heure</th>
                        <th className="py-2 px-3">Ce que je fais sur ce créneau</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {dailyData.scheduleSlots.map((s, idx) => {
                        const isBuffer = s.isBreak || s.isBuffer || s.timeRange.includes('12:00');

                        return (
                          <tr 
                            key={idx} 
                            className={`transition ${
                              isBuffer 
                                ? 'bg-amber-50/90 font-bold text-amber-950 border-y border-amber-200' 
                                : 'bg-white hover:bg-stone-50/70'
                            }`}
                          >
                            <td className="py-2.5 px-3 font-mono font-bold text-stone-800">
                              {s.timeRange}
                            </td>
                            <td className={`py-2.5 px-3 font-bold ${isBuffer ? 'text-amber-800' : 'text-blue-800'}`}>
                              {isBuffer ? '⚡ TAMPON IMPRÉVUS / pause' : s.activity}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 4. IMPRÉVUS SURVENUS AUJOURD'HUI (Alimentés par les blocages signalés par le collaborateur) */}
                <div className="rounded-xl border border-stone-300 overflow-hidden space-y-0">
                  <div className="bg-[#164e4b] text-white px-3 py-2 font-bold text-xs flex items-center justify-between">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>⚡</span>
                      <span>IMPRÉVUS SURVENUS AUJOURD'HUI ({dailyData.unforeseenEvents.length})</span>
                      <span className="text-[10px] text-emerald-200 font-normal">
                        — issus des blocages signalés par {employee.name}
                      </span>
                    </div>
                    {isViewingSelf ? (
                      <button
                        type="button"
                        onClick={() => setIsAddingUnforeseen(!isAddingUnforeseen)}
                        className="px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded-lg text-[10px] font-bold text-white transition cursor-pointer flex items-center gap-1"
                        title="Ajouter un imprévu complémentaire"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{isAddingUnforeseen ? 'Fermer' : '+ Ajouter un Imprévu'}</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-emerald-200/90 font-medium italic">
                        Signalés par l'employé sur ses tâches
                      </span>
                    )}
                  </div>

                  {/* Formulaire d'ajout rapide d'imprévu (collaborateur lui-même) */}
                  {isViewingSelf && isAddingUnforeseen && (
                    <form onSubmit={handleAddCustomUnforeseen} className="p-3 bg-amber-50/70 border-b border-amber-200 flex flex-wrap items-center gap-2 text-xs animate-in fade-in duration-150">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-stone-600 text-[10px]">Heure :</span>
                        <input
                          type="text"
                          value={newUnforeseenTime}
                          onChange={(e) => setNewUnforeseenTime(e.target.value)}
                          placeholder="ex: 14:15"
                          className="w-16 px-2 py-1 bg-white border border-stone-300 rounded-lg font-mono text-xs outline-none"
                        />
                      </div>

                      <div className="flex-1 min-w-[200px]">
                        <input
                          type="text"
                          value={newUnforeseenSubject}
                          onChange={(e) => setNewUnforeseenSubject(e.target.value)}
                          placeholder="Quoi ? (ex: Panne réseau, coupure de courant, urgence client...)"
                          className="w-full px-2.5 py-1 bg-white border border-stone-300 rounded-lg text-xs outline-none focus:border-[#2A7B76]"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="font-bold text-stone-600 text-[10px]">Temps perdu :</span>
                        <input
                          type="number"
                          value={newUnforeseenLostMin}
                          onChange={(e) => setNewUnforeseenLostMin(Number(e.target.value))}
                          className="w-16 px-2 py-1 bg-white border border-stone-300 rounded-lg font-mono text-xs outline-none"
                        />
                        <span className="text-[10px] text-stone-500">min</span>
                      </div>

                      <button
                        type="submit"
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1 shadow-3xs"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Enregistrer l'imprévu</span>
                      </button>
                    </form>
                  )}

                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#2A7B76] text-white font-bold text-[11px]">
                      <tr>
                        <th className="py-2 px-3 w-28">Heure</th>
                        <th className="py-2 px-3">Origine &amp; Sujet de l'imprévu (Blocage opérationnel)</th>
                        <th className="py-2 px-3 w-28 text-center">Statut</th>
                        <th className="py-2 px-3 text-right w-28">Temps impact</th>
                        {isViewingSelf && <th className="py-2 px-2 text-center w-12">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {dailyData.unforeseenEvents.map((u, idx) => (
                        <tr key={idx} className="bg-white hover:bg-stone-50 transition">
                          <td className="py-2 px-3 font-mono font-bold text-stone-700">{u.time}</td>
                          <td className="py-2 px-3 text-stone-800">
                            <div className="space-y-0.5">
                              <span className="font-semibold text-stone-900 block">{u.subject}</span>
                              {u.sourceTask && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-stone-500 font-medium bg-stone-100 px-1.5 py-0.2 rounded border border-stone-200">
                                  <span>Tâche source :</span>
                                  <strong className="text-stone-700">{u.sourceTask}</strong>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              u.status === 'Résolu'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}>
                              {u.status || 'Bloqué'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-rose-600 font-bold">{u.lostMinutes} min</td>
                          {isViewingSelf && (
                            <td className="py-2 px-2 text-center">
                              {(u as any).id && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCustomUnforeseen((u as any).id || String(idx))}
                                  className="text-stone-400 hover:text-rose-600 p-0.5 rounded cursor-pointer transition"
                                  title="Supprimer cet imprévu"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                      {dailyData.unforeseenEvents.length === 0 && (
                        <tr>
                          <td colSpan={isViewingSelf ? 5 : 4} className="py-3 px-3 text-center text-stone-400 italic">
                            Aucun blocage ni imprévu opérationnel signalé par le collaborateur sur cette journée.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 5. BILAN FIN DE JOURNÉE & SUIVI */}
                <div className="rounded-xl border border-stone-300 overflow-hidden">
                  <div className="bg-[#164e4b] text-white px-3 py-2 font-bold text-xs flex items-center gap-1.5">
                    <span>☑️</span>
                    <span>BILAN FIN DE JOURNÉE (2 min)</span>
                  </div>
                  <div className="divide-y divide-stone-200 bg-white p-3 space-y-3">
                    <div>
                      <strong className="block text-stone-700 text-xs font-bold mb-1">À reporter à demain :</strong>
                      {dailyData.postponedTasks.length > 0 ? (
                        <ul className="list-disc pl-5 text-blue-700 font-medium space-y-0.5">
                          {dailyData.postponedTasks.map((t, idx) => (
                            <li key={idx}>{t}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-emerald-700 font-semibold">Toutes les sous-tâches du jour ont été clôturées avec succès !</p>
                      )}
                    </div>

                    {/* SECTION POINTS À SIGNALER INTERACTIVE */}
                    <div className="pt-3 border-t border-stone-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <strong className="text-stone-800 text-xs font-bold flex items-center gap-1.5">
                            <span className="text-rose-600">🚩</span>
                            <span>Points à Signaler au Manager &amp; Direction</span>
                          </strong>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2A7B76]/10 text-[#2A7B76]">
                            {timesheetNotes.length} consigné(s)
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsAddingNote(!isAddingNote)}
                          className="px-2.5 py-1 bg-[#2A7B76] hover:bg-[#20635F] text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 self-start sm:self-auto cursor-pointer shadow-3xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{isAddingNote ? 'Masquer le formulaire' : '+ Ajouter un point à signaler'}</span>
                        </button>
                      </div>

                      {/* Formulaire d'ajout d'un point à signaler */}
                      {isAddingNote && (
                        <form onSubmit={handleAddTimesheetNote} className="mb-3 p-3 bg-stone-50 rounded-xl border border-stone-300 space-y-2.5 animate-in fade-in duration-150">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-bold text-stone-600">Catégorie :</span>
                              <select
                                value={newNoteCategory}
                                onChange={(e) => setNewNoteCategory(e.target.value as any)}
                                className="bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs outline-none"
                              >
                                <option value="bloquant">🔴 Bloquant (Urgent)</option>
                                <option value="retard">🟠 Retard / Risque de délai</option>
                                <option value="materiel">⚙️ Panne matérielle / Réseau</option>
                                <option value="information">🔵 Information / Coordination</option>
                                <option value="succes">🟢 Fait marquant / Avance</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-bold text-stone-600">Urgence :</span>
                              <select
                                value={newNoteUrgency}
                                onChange={(e) => setNewNoteUrgency(e.target.value as any)}
                                className="bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs outline-none"
                              >
                                <option value="normale">Normale</option>
                                <option value="haute">Haute</option>
                                <option value="critique">Critique</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-bold text-stone-600">Destinataire :</span>
                              <select
                                value={newNoteTarget}
                                onChange={(e) => setNewNoteTarget(e.target.value)}
                                className="bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs outline-none"
                              >
                                <option value="Manager Direct">Manager Direct</option>
                                <option value="Direction RH">Direction RH</option>
                                <option value="Direction Technique">Direction Technique</option>
                                <option value="Tous les Responsables">Tous les Responsables</option>
                              </select>
                            </div>
                          </div>

                          {/* Quick suggestions */}
                          <div className="flex flex-wrap items-center gap-1 text-[10px]">
                            <span className="text-stone-400 font-semibold">Suggestions rapides :</span>
                            {[
                              'Aucun blocage à signaler sur cette journée.',
                              'En attente de validation client / manager.',
                              'Panne de connexion réseau au bureau.',
                              'Besoin de renfort sur les tâches prioritaires.',
                              'Retard approvisionnement / pièce manquante.',
                            ].map((preset, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setNewNoteContent(preset)}
                                className="px-2 py-0.5 bg-white hover:bg-stone-200 text-stone-700 rounded-md border border-stone-200 transition cursor-pointer"
                              >
                                {preset}
                              </button>
                            ))}
                          </div>

                          <div className="flex gap-2">
                            <textarea
                              rows={2}
                              value={newNoteContent}
                              onChange={(e) => setNewNoteContent(e.target.value)}
                              placeholder="Décrivez précisément le point à signaler (fait bloquant, besoin de matériel, question au supérieur...)"
                              className="flex-1 p-2 bg-white border border-stone-300 rounded-xl text-xs outline-none focus:border-[#2A7B76] resize-none"
                              required
                            />
                            <button
                              type="submit"
                              className="px-4 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold text-xs rounded-xl transition cursor-pointer flex flex-col items-center justify-center gap-1 shrink-0"
                            >
                              <Check className="w-4 h-4" />
                              <span>Enregistrer</span>
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Remontées des Commentaires faisant office de Points à signaler au Manager */}
                      <div className="mb-3 space-y-2 bg-stone-50/90 p-3 rounded-2xl border border-stone-200">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                            <span>💬</span>
                            <span>Commentaires sur les tâches (Points à signaler au Manager) ({dailyData.managerComments.length})</span>
                          </span>
                          <span className="text-[10px] text-[#2A7B76] font-semibold bg-[#2A7B76]/10 px-2 py-0.5 rounded-full">
                            Compte-rendu opérationnel
                          </span>
                        </div>

                        {dailyData.managerComments.length > 0 ? (
                          <div className="space-y-1.5">
                            {dailyData.managerComments.map((com) => (
                              <div
                                key={com.id}
                                className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/60 text-xs flex items-start gap-2.5"
                              >
                                <span className="text-base shrink-0">💬</span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                                    <strong className="text-stone-900 font-bold">{com.author}</strong>
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-200 text-blue-900 uppercase">
                                      {com.isSubtask ? 'Sous-tâche' : 'Tâche'}
                                    </span>
                                    <span className="font-semibold text-stone-600 truncate max-w-[200px]">
                                      {com.taskTitle}
                                    </span>
                                    <span className="text-stone-400 font-mono ml-auto">
                                      {com.time}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-stone-800 mt-1 font-medium leading-relaxed bg-white p-2 rounded-lg border border-blue-100">
                                    "{com.text}"
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-stone-400 italic py-1">
                            Aucun commentaire rédigé sur les tâches aujourd'hui (les commentaires saisis par le collaborateur sur ses tâches font office de points à signaler au manager).
                          </p>
                        )}
                      </div>

                      {/* Liste des points à signaler enregistrés */}
                      <div className="space-y-2">
                        {timesheetNotes.map((note) => {
                          const catBadge =
                            note.category === 'bloquant'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : note.category === 'retard'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : note.category === 'materiel'
                              ? 'bg-purple-100 text-purple-800 border-purple-300'
                              : note.category === 'succes'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-blue-100 text-blue-800 border-blue-300';

                          return (
                            <div
                              key={note.id}
                              className="p-2.5 bg-stone-50 hover:bg-stone-100/80 rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition"
                            >
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase border ${catBadge}`}>
                                    {note.category}
                                  </span>
                                  <span className="font-mono text-[10px] text-stone-500 font-bold">
                                    {note.time}
                                  </span>
                                  <span className="text-[10px] font-semibold text-stone-600 bg-white px-2 py-0.5 rounded border border-stone-200">
                                    Destinataire : {note.targetAudience}
                                  </span>
                                  {note.status === 'resolu' && (
                                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                      ✓ Résolu
                                    </span>
                                  )}
                                </div>
                                <p className="text-stone-800 font-medium leading-relaxed">
                                  {note.content}
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateTimesheetNoteStatus(
                                      note.id,
                                      note.status === 'resolu' ? 'pris_en_compte' : 'resolu'
                                    )
                                  }
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                    note.status === 'resolu'
                                      ? 'bg-stone-200 text-stone-700 border-stone-300'
                                      : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                  }`}
                                  title="Marquer comme résolu ou en cours"
                                >
                                  {note.status === 'resolu' ? 'Rouvrir' : 'Marquer Résolu'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveNote(note.id)}
                                  className="p-1 text-stone-400 hover:text-rose-600 rounded transition cursor-pointer"
                                  title="Supprimer ce point à signaler"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {timesheetNotes.length === 0 && (
                          <div className="text-stone-700 bg-stone-50/80 p-2.5 rounded-lg border border-dashed border-stone-300 text-xs flex items-center justify-between gap-2">
                            <span>
                              {dailyData.managerAlertPoint || 'Aucun point particulier consigné pour cette journée.'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsAddingNote(true)}
                              className="text-[#2A7B76] hover:underline font-bold text-[11px] shrink-0 cursor-pointer"
                            >
                              + Signaler un point
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* MODE 2: SYNTHÈSE MENSUELLE */}
            {mode === 'month' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-center">
                    <span className="text-[10px] text-stone-400 font-bold uppercase">Jours Travaillés</span>
                    <strong className="block text-xl font-bold font-serif text-[#164e4b] mt-0.5">
                      {monthlyData.totalDaysWorked} jours
                    </strong>
                  </div>
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-center">
                    <span className="text-[10px] text-stone-400 font-bold uppercase">Heures Cumulées</span>
                    <strong className="block text-xl font-bold font-serif text-indigo-700 mt-0.5">
                      {monthlyData.totalHoursWorked}h
                    </strong>
                  </div>
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-center">
                    <span className="text-[10px] text-stone-400 font-bold uppercase">Rendement Tâches</span>
                    <strong className="block text-xl font-bold font-serif text-emerald-700 mt-0.5">
                      {monthlyData.completionRate}%
                    </strong>
                  </div>
                </div>

                <div className="rounded-xl border border-stone-300 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#164e4b] text-white font-bold text-[11px]">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-2 text-center">Jour</th>
                        <th className="py-2 px-3 text-center">Arrivée</th>
                        <th className="py-2 px-3 text-center">Départ</th>
                        <th className="py-2 px-3 text-right">Heures</th>
                        <th className="py-2 px-3 text-center">Pointage</th>
                        <th className="py-2 px-3 text-center">Tâches Clôturées</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 font-medium">
                      {monthlyData.dailyBreakdown.map((d, idx) => (
                        <tr key={idx} className={d.hoursWorked > 0 ? 'bg-white' : 'bg-stone-50 text-stone-400'}>
                          <td className="py-1.5 px-3 font-mono">{d.date}</td>
                          <td className="py-1.5 px-2 text-center uppercase font-bold text-[10px]">{d.dayName}</td>
                          <td className="py-1.5 px-3 text-center font-mono">{d.arrivalTime}</td>
                          <td className="py-1.5 px-3 text-center font-mono">{d.departureTime}</td>
                          <td className="py-1.5 px-3 text-right font-mono font-bold">{d.hoursWorked > 0 ? `${d.hoursWorked}h` : '-'}</td>
                          <td className="py-1.5 px-3 text-center">
                            {d.status !== '-' && (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                d.status === 'Présent' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {d.status}
                              </span>
                            )}
                          </td>
                          <td className="py-1.5 px-3 text-center font-bold text-blue-700 font-mono">
                            {d.tasksDoneCount > 0 ? `${d.tasksDoneCount} fait` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* MODE 3: BILAN ANNUEL */}
            {mode === 'year' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-center">
                    <span className="text-[10px] text-stone-400 font-bold uppercase">Présences Annuelles</span>
                    <strong className="block text-xl font-bold font-serif text-[#164e4b] mt-0.5">
                      {yearlyData.totalDaysPresent} jours
                    </strong>
                  </div>
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-center">
                    <span className="text-[10px] text-stone-400 font-bold uppercase">Volume Horaire</span>
                    <strong className="block text-xl font-bold font-serif text-indigo-700 mt-0.5">
                      {yearlyData.totalHoursWorked}h
                    </strong>
                  </div>
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-center">
                    <span className="text-[10px] text-stone-400 font-bold uppercase">Taux Réussite Moyen</span>
                    <strong className="block text-xl font-bold font-serif text-emerald-700 mt-0.5">
                      {yearlyData.avgCompletionRate}%
                    </strong>
                  </div>
                </div>

                <div className="rounded-xl border border-stone-300 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#164e4b] text-white font-bold text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Mois</th>
                        <th className="py-2.5 px-3 text-center">Jours Travaillés</th>
                        <th className="py-2.5 px-3 text-right">Heures Cumulées</th>
                        <th className="py-2.5 px-3 text-center">Tâches Réalisées</th>
                        <th className="py-2.5 px-3 text-center">Taux de Rendement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 font-medium">
                      {yearlyData.monthlyBreakdown.map((m, idx) => (
                        <tr key={idx} className="hover:bg-stone-50">
                          <td className="py-2 px-3 font-bold text-stone-800">{m.monthName}</td>
                          <td className="py-2 px-3 text-center font-mono">{m.daysWorked} j</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-indigo-700">{m.hoursWorked}h</td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-emerald-700">{m.tasksCompleted}</td>
                          <td className="py-2 px-3 text-center font-mono font-bold">{m.rendementRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default TimesheetModal;
