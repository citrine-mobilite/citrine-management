import { safeStorage } from '../utils/safeStorage';
import { logSystemAudit } from './adminAuditService';

export type TimesheetNoteCategory = 'bloquant' | 'retard' | 'information' | 'succes' | 'materiel';
export type TimesheetNoteUrgency = 'normale' | 'haute' | 'critique';
export type TimesheetNoteStatus = 'a_traiter' | 'pris_en_compte' | 'resolu';

export interface TimesheetNote {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  category: TimesheetNoteCategory;
  urgency: TimesheetNoteUrgency;
  content: string;
  targetAudience: string; // e.g. "Manager Direct", "Direction RH", "Direction Technique"
  status: TimesheetNoteStatus;
  authorName: string;
  createdAt: string;
  resolutionComment?: string;
}

const STORAGE_KEY = 'citrine_timesheet_notes';

const SEED_NOTES: TimesheetNote[] = [
  {
    id: 'note-seed-1',
    employeeId: 'emp-1',
    employeeName: 'Kouam Marc',
    date: new Date().toISOString().split('T')[0],
    time: '11:30',
    category: 'information',
    urgency: 'normale',
    content: 'Toutes les sous-tâches prioritaires du matin terminées en avance.',
    targetAudience: 'Manager Direct',
    status: 'pris_en_compte',
    authorName: 'Kouam Marc',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'note-seed-2',
    employeeId: 'emp-1',
    employeeName: 'Kouam Marc',
    date: new Date().toISOString().split('T')[0],
    time: '15:15',
    category: 'materiel',
    urgency: 'haute',
    content: 'Coupure réseau intermittente au poste 4 impactant la saisie des fiches.',
    targetAudience: 'Support Technique',
    status: 'a_traiter',
    authorName: 'Kouam Marc',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
];

function loadNotes(): TimesheetNote[] {
  try {
    const raw = safeStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('[timesheetNotesService] Failed to load notes:', err);
  }
  return [...SEED_NOTES];
}

function persistNotes(notes: TimesheetNote[]): void {
  try {
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (err) {
    console.warn('[timesheetNotesService] Failed to save notes:', err);
  }
}

export function getTimesheetNotes(employeeId?: string, date?: string): TimesheetNote[] {
  const notes = loadNotes();
  return notes.filter((n) => {
    if (employeeId && n.employeeId !== employeeId) return false;
    if (date && n.date !== date) return false;
    return true;
  });
}

export function addTimesheetNote(data: {
  employeeId: string;
  employeeName: string;
  date: string;
  time?: string;
  category: TimesheetNoteCategory;
  urgency: TimesheetNoteUrgency;
  content: string;
  targetAudience?: string;
  authorName?: string;
}): TimesheetNote {
  const notes = loadNotes();
  const now = new Date();
  const timeStr = data.time || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const newNote: TimesheetNote = {
    id: `ts-note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    employeeId: data.employeeId,
    employeeName: data.employeeName,
    date: data.date,
    time: timeStr,
    category: data.category,
    urgency: data.urgency,
    content: data.content.trim(),
    targetAudience: data.targetAudience || 'Manager Direct',
    status: 'a_traiter',
    authorName: data.authorName || data.employeeName,
    createdAt: now.toISOString(),
  };

  const updated = [newNote, ...notes];
  persistNotes(updated);

  // Auto-record audit log
  logSystemAudit({
    authorName: newNote.authorName,
    authorRole: 'collaborateur',
    targetName: newNote.employeeName,
    targetEmployeeId: newNote.employeeId,
    operationType: 'feuille_de_temps',
    operationLabel: 'Point à signaler consigné',
    details: `Point de vigilance (${newNote.category.toUpperCase()} - ${newNote.urgency}) : "${newNote.content}" pour le ${newNote.date}`,
    level: newNote.urgency === 'critique' ? 'error' : newNote.urgency === 'haute' ? 'warning' : 'info',
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('citrine:timesheet_notes_updated', { detail: newNote }));
  }

  return newNote;
}

export function deleteTimesheetNote(id: string): void {
  const notes = loadNotes();
  const filtered = notes.filter((n) => n.id !== id);
  persistNotes(filtered);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('citrine:timesheet_notes_updated'));
  }
}

export function updateTimesheetNoteStatus(
  id: string,
  status: TimesheetNoteStatus,
  resolutionComment?: string
): void {
  const notes = loadNotes();
  const updated = notes.map((n) => {
    if (n.id === id) {
      return {
        ...n,
        status,
        resolutionComment: resolutionComment !== undefined ? resolutionComment : n.resolutionComment,
      };
    }
    return n;
  });
  persistNotes(updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('citrine:timesheet_notes_updated'));
  }
}
