import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseNumericDbId,
  sanitizeDateColumn,
  sanitizeTaskRowForDb,
  resolveDualSaveOutcome,
  extractFriendlyTaskErrorMessage,
} from './taskPersistenceHelpers';

test('parseNumericDbId returns integer only for valid positive numeric IDs', () => {
  assert.equal(parseNumericDbId(42), 42);
  assert.equal(parseNumericDbId('45'), 45);
  assert.equal(parseNumericDbId(' 12 '), 12);
  assert.equal(parseNumericDbId('general'), null);
  assert.equal(parseNumericDbId('prevision'), null);
  assert.equal(parseNumericDbId('rh_operations'), null);
  assert.equal(parseNumericDbId('proj-1794426656952'), null);
  assert.equal(parseNumericDbId('550e8400-e29b-41d4-a716-446655440000'), null);
  assert.equal(parseNumericDbId(''), null);
  assert.equal(parseNumericDbId(0), null);
  assert.equal(parseNumericDbId(-5), null);
  assert.equal(parseNumericDbId(null), null);
  assert.equal(parseNumericDbId(undefined), null);
});

test('sanitizeDateColumn accepts YYYY-MM-DD and ISO timestamps, rejects empty/garbage strings', () => {
  assert.equal(sanitizeDateColumn('2026-11-20'), '2026-11-20');
  assert.equal(sanitizeDateColumn('2026-11-20T14:30:00.000Z'), '2026-11-20');
  assert.equal(sanitizeDateColumn(''), null);
  assert.equal(sanitizeDateColumn('   '), null);
  assert.equal(sanitizeDateColumn('not-a-date'), null);
  assert.equal(sanitizeDateColumn(undefined), null);
});

test('sanitizeTaskRowForDb keeps projectId="general" in raw_data while setting SQL project_id to null', () => {
  const item = {
    id: 'task-1794500000000',
    title: '  Préparer rapport mensuel  ',
    description: 'Détails du rapport',
    date: '2026-11-20',
    time: '09:00',
    status: 'todo',
    priority: 'high',
    assignedTo: 'Équipe',
    projectId: 'general',
    employeeId: 'emp-abc',
    dueDate: '',
    isMilestone: false,
    milestoneProgress: 0,
  };

  const row = sanitizeTaskRowForDb(
    item,
    { doc_id: item.id, raw_data: item, updated_at: '2026-11-20T00:00:00.000Z' },
    item.id
  );

  assert.equal(row.doc_id, 'task-1794500000000');
  assert.equal(row.title, 'Préparer rapport mensuel');
  assert.equal(row.project_id, null);
  assert.equal(row.employee_id, null);
  assert.equal(row.date, '2026-11-20');
  assert.equal(row.due_date, null);
  assert.equal(row.raw_data.projectId, 'general');
});

test('sanitizeTaskRowForDb preserves numeric projectId and employeeId as integers', () => {
  const item = {
    id: 'task-1794500000001',
    title: 'Audit',
    projectId: '1',
    employeeId: '45',
    date: '2026-11-21',
    dueDate: '2026-11-25',
    isMilestone: true,
    milestoneProgress: 50,
  };

  const row = sanitizeTaskRowForDb(item, { doc_id: item.id }, item.id);
  assert.equal(row.project_id, 1);
  assert.equal(row.employee_id, 45);
  assert.equal(row.due_date, '2026-11-25');
  assert.equal(row.is_milestone, true);
  assert.equal(row.milestone_progress, 50);
});

test('resolveDualSaveOutcome succeeds if either server API or Supabase direct succeeds', () => {
  const task = { id: 'task-1', title: 'Test' };

  const bothOk = resolveDualSaveOutcome(
    { status: 'fulfilled', value: task },
    { status: 'fulfilled', value: task },
    'tasks'
  );
  assert.equal(bothOk.succeeded, true);
  assert.equal(bothOk.warningMessage, undefined);

  const supaOkServer404 = resolveDualSaveOutcome(
    { status: 'rejected', reason: new Error('Route API introuvable : [POST] /api/data/tasks') },
    { status: 'fulfilled', value: task },
    'tasks'
  );
  assert.equal(supaOkServer404.succeeded, true);
  assert.equal(supaOkServer404.serverSucceeded, false);
  assert.equal(supaOkServer404.supabaseSucceeded, true);
  assert.match(supaOkServer404.warningMessage || '', /Supabase direct/);

  const serverOkSupaFail = resolveDualSaveOutcome(
    { status: 'fulfilled', value: task },
    { status: 'rejected', reason: new Error('RLS error') },
    'tasks'
  );
  assert.equal(serverOkSupaFail.succeeded, true);
  assert.equal(serverOkSupaFail.serverSucceeded, true);
  assert.equal(serverOkSupaFail.supabaseSucceeded, false);

  const bothFail = resolveDualSaveOutcome(
    { status: 'rejected', reason: new Error('404 Not Found') },
    { status: 'rejected', reason: new Error('invalid input syntax for type bigint: "general"') },
    'tasks'
  );
  assert.equal(bothFail.succeeded, false);
  assert.match(bothFail.errorMessage || '', /Impossible d'enregistrer dans tasks/);
});

test('extractFriendlyTaskErrorMessage produces clean French messages', () => {
  assert.match(
    extractFriendlyTaskErrorMessage(new Error('invalid input syntax for type bigint: "general"')),
    /identifiant incompatible/i
  );
  assert.match(
    extractFriendlyTaskErrorMessage(new Error('Route API introuvable : [POST] /api/data/tasks')),
    /serveur d'enregistrement/i
  );
  assert.match(
    extractFriendlyTaskErrorMessage(new Error('Failed to fetch')),
    /réseau/i
  );
  assert.match(
    extractFriendlyTaskErrorMessage(new Error('')),
    /Veuillez réessayer/i
  );
});
