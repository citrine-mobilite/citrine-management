import { offlineService } from '../offlineService';
import { getApiToken } from '../sessionService';
import { EMPLOYEES_COLLECTION, TransactionalCollaboratorInput, TransactionalCollaboratorResult } from './employeeHelpers';

export async function createCollaboratorWithUserTransactional(
  input: TransactionalCollaboratorInput
): Promise<TransactionalCollaboratorResult> {
  const token = getApiToken();
  if (!token) throw new Error('Session expirée. Veuillez vous reconnecter.');
  const response = await fetch('/api/collaborators/transactional', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success || !result.employee || !result.user) {
    throw new Error(result.error || 'La création du collaborateur a échoué.');
  }
  await offlineService.cacheLocally(EMPLOYEES_COLLECTION, result.employee);
  await offlineService.cacheLocally('users', result.user);
  if (result.notification) await offlineService.cacheLocally('notifications', result.notification);
  return result as TransactionalCollaboratorResult;
}
