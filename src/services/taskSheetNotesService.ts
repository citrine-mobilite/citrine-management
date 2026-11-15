import { safeStorage } from '../utils/safeStorage';
import { logSystemAudit } from './adminAuditService';

export type TaskSheetNoteCategory = 'bloquant' | 'retard' | 'information' | 'succes' | 'materiel';
export type TaskSheetNoteUrgency = 'normale' | 'haute' | 'critique';
export type TaskSheetNoteStatus = 'a_traiter' | 'pris_en_compte' | 'resolu';

export interface TaskSheetNote {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  time: string;
  category: TaskSheetNoteCategory;
  urgency: TaskSheetNoteUrgency;
  content: string;
  targetAudience: string;
  status: TaskSheetNoteStatus;
  authorName: string;
  createdAt: string;
  resolutionComment?: string;
}

const STORAGE_KEY = 'citrine_tasksheet_notes';
const LEGACY_STORAGE_KEY = 'citrine_timesheet_notes';
export const TASKSHEET_NOTES_UPDATED_EVENT = 'citrine:tasksheet_notes_updated';

function loadNotes(): TaskSheetNote[] {
  try {
    const raw = safeStorage.getItem(STORAGE_KEY) || safeStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((n) => typeof n?.id !== 'string' || !n.id.startsWith('note-seed-'));
      }
    }
  } catch (err) {
    console.warn('[taskSheetNotesService] Failed to load notes:', err);
  }
  return [];
}

function persistNotes(notes: TaskSheetNote[]): void {
  try {
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (err) {
    console.warn('[taskSheetNotesService] Failed to save notes:', err);
  }
}

export function getTaskSheetNotes(employeeId?: string, date?: string): TaskSheetNote[] {
  const notes = loadNotes();
  return notes.filter((n) => {
    if (employeeId && n.employeeId !== employeeId) return false;
    if (date && n.date !== date) return false;
    return true;
  });
}

export function addTaskSheetNote(data: {
  employeeId: string;
  employeeName: string;
  date: string;
  time?: string;
  category: TaskSheetNoteCategory;
  urgency: TaskSheetNoteUrgency;
  content: string;
  targetAudience?: string;
  authorName?: string;
}): TaskSheetNote {
  const notes = loadNotes();
  const now = new Date();
  const timeStr = data.time || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const newNote: TaskSheetNote = {
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

  logSystemAudit({
    authorName: newNote.authorName,
    authorRole: 'collaborateur',
    targetName: newNote.employeeName,
    targetEmployeeId: newNote.employeeId,
    operationType: 'feuille_avancement_taches',
    operationLabel: 'Point à signaler consigné (TaskSheet)',
    details: `Point de vigilance (${newNote.category.toUpperCase()} - ${newNote.urgency}) : "${newNote.content}" pour le ${newNote.date}`,
    level: newNote.urgency === 'critique' ? 'error' : newNote.urgency === 'haute' ? 'warning' : 'info',
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TASKSHEET_NOTES_UPDATED_EVENT, { detail: newNote }));
  }

  return newNote;
}

export function deleteTaskSheetNote(id: string): void {
  const notes = loadNotes();
  const filtered = notes.filter((n) => n.id !== id);
  persistNotes(filtered);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TASKSHEET_NOTES_UPDATED_EVENT));
  }
}

export function updateTaskSheetNoteStatus(
  id: string,
  status: TaskSheetNoteStatus,
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
    window.dispatchEvent(new CustomEvent(TASKSHEET_NOTES_UPDATED_EVENT));
  }
}
