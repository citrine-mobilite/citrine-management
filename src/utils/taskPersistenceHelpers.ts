export interface SanitizedTaskRow {
  doc_id: string;
  title: string;
  description: string | null;
  date: string | null;
  time: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  employee_id: number | null;
  department: string | null;
  project_id: number | null;
  due_date: string | null;
  is_milestone: boolean;
  milestone_progress: number;
  raw_data: any;
  updated_at?: string;
  id?: number;
  uid?: string;
}

/**
 * Parses a positive integer DB foreign key safely.
 * Returns null for string slugs like "general", "prevision", UUIDs, or empty values
 * so PostgreSQL BIGINT columns never throw error 22P02.
 */
export function parseNumericDbId(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) && value > 0 ? value : null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) {
      const parsed = Number(trimmed);
      return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
    }
  }
  return null;
}

/**
 * Sanitizes an ISO date field for PostgreSQL DATE columns.
 * Empty or invalid strings become null instead of causing 22007 errors.
 */
export function sanitizeDateColumn(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const datePart = trimmed.includes('T') ? trimmed.split('T')[0] : trimmed;
  return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : null;
}

/**
 * Maps a frontend Task object to a PostgreSQL-safe `tasks` row payload.
 * Preserves non-numeric project slugs (e.g. "general", "prevision") inside `raw_data`
 * while keeping SQL BIGINT columns strictly integer-or-null.
 */
export function sanitizeTaskRowForDb(
  item: Record<string, any>,
  base: Record<string, any>,
  docId: string
): SanitizedTaskRow {
  const numericEmployeeId = parseNumericDbId(item.employeeId ?? item.employee_id);
  const numericProjectId = parseNumericDbId(item.projectId ?? item.project_id);
  const rawProgress = Number(item.milestoneProgress ?? item.milestone_progress ?? 0);

  return {
    ...base,
    doc_id: docId,
    title: typeof item.title === 'string' && item.title.trim() ? item.title.trim() : 'Sans titre',
    description:
      typeof item.description === 'string' && item.description.trim()
        ? item.description
        : null,
    date: sanitizeDateColumn(item.date),
    time: typeof item.time === 'string' && item.time.trim() ? item.time.trim() : null,
    status: typeof item.status === 'string' && item.status.trim() ? item.status : 'todo',
    priority: typeof item.priority === 'string' && item.priority.trim() ? item.priority : 'medium',
    assigned_to:
      typeof item.assignedTo === 'string' && item.assignedTo.trim()
        ? item.assignedTo.trim()
        : null,
    employee_id: numericEmployeeId,
    department:
      typeof item.department === 'string' && item.department.trim()
        ? item.department.trim()
        : null,
    project_id: numericProjectId,
    due_date: sanitizeDateColumn(item.dueDate ?? item.due_date),
    is_milestone: Boolean(item.isMilestone ?? item.is_milestone),
    milestone_progress: Number.isFinite(rawProgress) ? rawProgress : 0,
    raw_data: item,
  };
}

export interface DualSaveResolution<T> {
  succeeded: boolean;
  serverSucceeded: boolean;
  supabaseSucceeded: boolean;
  warningMessage?: string;
  errorMessage?: string;
  data?: T;
}

/**
 * Evaluates the outcome of dual persistence (Express /api/data + direct Supabase).
 * Succeeds if at least one persistence channel confirmed writing to PostgreSQL.
 * Fails only if BOTH channels failed, returning a diagnostic message.
 */
export function resolveDualSaveOutcome<T>(
  serverResult: PromiseSettledResult<T>,
  supabaseResult: PromiseSettledResult<T>,
  collectionName: string
): DualSaveResolution<T> {
  if (serverResult.status === 'fulfilled' && supabaseResult.status === 'fulfilled') {
    return {
      succeeded: true,
      serverSucceeded: true,
      supabaseSucceeded: true,
      data: supabaseResult.value ?? serverResult.value,
    };
  }

  if (supabaseResult.status === 'fulfilled' && serverResult.status === 'rejected') {
    const serverReason =
      serverResult.reason instanceof Error
        ? serverResult.reason.message
        : String(serverResult.reason || 'Erreur serveur API');
    return {
      succeeded: true,
      serverSucceeded: false,
      supabaseSucceeded: true,
      warningMessage: `[${collectionName}] Enregistré via Supabase direct (relais API indisponible : ${serverReason})`,
      data: supabaseResult.value,
    };
  }

  if (serverResult.status === 'fulfilled' && supabaseResult.status === 'rejected') {
    const supaReason =
      supabaseResult.reason instanceof Error
        ? supabaseResult.reason.message
        : String(supabaseResult.reason || 'Erreur Supabase direct');
    return {
      succeeded: true,
      serverSucceeded: true,
      supabaseSucceeded: false,
      warningMessage: `[${collectionName}] Enregistré via API serveur (accès Supabase direct indisponible : ${supaReason})`,
      data: serverResult.value,
    };
  }

  const serverReason =
    serverResult.status === 'rejected' && serverResult.reason instanceof Error
      ? serverResult.reason.message
      : String(serverResult.status === 'rejected' ? serverResult.reason : 'Erreur serveur API');
  const supaReason =
    supabaseResult.status === 'rejected' && supabaseResult.reason instanceof Error
      ? supabaseResult.reason.message
      : String(supabaseResult.status === 'rejected' ? supabaseResult.reason : 'Erreur Supabase');

  return {
    succeeded: false,
    serverSucceeded: false,
    supabaseSucceeded: false,
    errorMessage: `Impossible d'enregistrer dans ${collectionName}. Supabase : ${supaReason} | API : ${serverReason}`,
  };
}

/**
 * Translates technical persistence errors into clear, actionable French error messages.
 */
export function extractFriendlyTaskErrorMessage(err: unknown): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === 'object' && err !== null && 'message' in err
        ? String((err as any).message)
        : String(err || '');

  const lower = raw.toLowerCase();
  if (!raw.trim()) {
    return "Impossible d'enregistrer la tâche en base de données. Veuillez réessayer.";
  }
  if (lower.includes('invalid input syntax for type bigint') || lower.includes('22p02')) {
    return "Format d'identifiant incompatible lors de l'enregistrement de la tâche.";
  }
  if (lower.includes('route api introuvable') || lower.includes('404')) {
    return "Le serveur d'enregistrement est temporairement indisponible. Vérifiez votre connexion et réessayez.";
  }
  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network')) {
    return "Connexion réseau interrompue. Impossible d'enregistrer la tâche pour le moment.";
  }
  if (lower.includes('permission denied') || lower.includes('42501') || lower.includes('row-level security')) {
    return "Droits insuffisants pour enregistrer cette tâche en base de données.";
  }
  return raw;
}
