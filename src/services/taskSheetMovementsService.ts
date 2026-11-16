import { Reminder } from '../types';
import { COLLECTIONS, deleteDocument, saveDocument } from './dataService';
import { logSystemAudit } from './adminAuditService';
import { safeStorage } from '../utils/safeStorage';

const STORAGE_KEY = 'citrine_tasksheet_movements';
export const TASKSHEET_MOVEMENTS_UPDATED_EVENT = 'citrine:tasksheet_movements_updated';

function loadLocalMovements(): Reminder[] {
  try {
    const raw = safeStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('[taskSheetMovementsService] Failed to load local movements:', err);
  }
  return [];
}

function persistLocalMovements(list: Reminder[]): void {
  try {
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 300)));
  } catch (err) {
    console.warn('[taskSheetMovementsService] Failed to persist local movements:', err);
  }
}

export function getLocalMovements(employeeId?: string, datePrefix?: string): Reminder[] {
  const list = loadLocalMovements();
  return list.filter((m) => {
    if (employeeId && String(m.employeeId || '') !== String(employeeId)) return false;
    if (datePrefix && !(m.date || '').startsWith(datePrefix)) return false;
    return true;
  });
}

export async function addQuickSmallMovement(params: {
  employeeId: string;
  employeeName: string;
  date: string;
  time?: string;
  title: string;
  note?: string;
  durationMinutes?: number;
  location?: string;
  movementCategory?: string;
  isResolved?: boolean;
  authorName?: string;
}): Promise<Reminder> {
  const now = new Date();
  const timeStr =
    params.time && /^\d{2}:\d{2}/.test(params.time)
      ? params.time.slice(0, 5)
      : `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const durationMin = Math.max(5, Math.min(480, Math.round(Number(params.durationMinutes) || 15)));

  const movement: Reminder = {
    id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: params.title.trim(),
    note: params.note?.trim() || undefined,
    date: params.date,
    time: timeStr,
    duration: `${durationMin} min`,
    location: params.location?.trim() || undefined,
    kind: 'movement',
    movementCategory: params.movementCategory || 'terrain',
    routineType: 'autre',
    recurrenceMode: 'once',
    employeeId: String(params.employeeId),
    employeeIds: [String(params.employeeId)],
    allEmployees: false,
    isResolved: params.isResolved !== undefined ? params.isResolved : true,
    status: params.isResolved === false ? 'active' : 'completed',
    stopped: false,
    createdAt: now.toISOString(),
  };

  const currentLocal = loadLocalMovements();
  persistLocalMovements([movement, ...currentLocal.filter((m) => m.id !== movement.id)]);

  try {
    await saveDocument(COLLECTIONS.REMINDERS, movement);
  } catch (err) {
    console.warn('[taskSheetMovementsService] Remote save notice (kept locally):', err);
  }

  logSystemAudit({
    authorName: params.authorName || params.employeeName,
    authorRole: 'collaborateur',
    targetName: params.employeeName,
    targetEmployeeId: String(params.employeeId),
    operationType: 'feuille_avancement_taches',
    operationLabel: 'Petit mouvement enregistré (Point important)',
    details: `${movement.title} (${movement.duration}, ${movement.date} à ${movement.time})`,
    level: 'info',
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TASKSHEET_MOVEMENTS_UPDATED_EVENT, { detail: movement }));
  }

  return movement;
}

export async function toggleQuickMovementStatus(
  id: string,
  reminders: Reminder[] = []
): Promise<void> {
  const existing =
    reminders.find((r) => r.id === id) || loadLocalMovements().find((m) => m.id === id);
  if (!existing) return;

  const nextResolved = !Boolean(existing.isResolved || existing.status === 'completed');
  const updated: Reminder = {
    ...existing,
    isResolved: nextResolved,
    status: nextResolved ? 'completed' : 'active',
  };

  const localList = loadLocalMovements();
  const nextLocal = localList.some((m) => m.id === id)
    ? localList.map((m) => (m.id === id ? updated : m))
    : [updated, ...localList];
  persistLocalMovements(nextLocal);

  try {
    await saveDocument(COLLECTIONS.REMINDERS, updated);
  } catch (err) {
    console.warn('[taskSheetMovementsService] Remote toggle notice:', err);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TASKSHEET_MOVEMENTS_UPDATED_EVENT, { detail: updated }));
  }
}

export async function deleteQuickSmallMovement(id: string): Promise<void> {
  const localList = loadLocalMovements();
  persistLocalMovements(localList.filter((m) => m.id !== id));

  try {
    await deleteDocument(COLLECTIONS.REMINDERS, id);
  } catch (err) {
    console.warn('[taskSheetMovementsService] Remote delete notice:', err);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TASKSHEET_MOVEMENTS_UPDATED_EVENT));
  }
}
