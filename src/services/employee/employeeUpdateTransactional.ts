import { Employee } from '../../types';
import { offlineService } from '../offlineService';
import { getApiToken } from '../sessionService';
import { EMPLOYEES_COLLECTION, UpdateCollaboratorWithUserInput, UpdateCollaboratorWithUserResult } from './employeeHelpers';

export async function updateCollaboratorWithUserTransactional(
  input: UpdateCollaboratorWithUserInput
): Promise<UpdateCollaboratorWithUserResult> {
  const token = getApiToken();
  if (!token) throw new Error('Session expirée. Veuillez vous reconnecter.');
  const response = await fetch('/api/collaborators/update-transactional', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success || !result.employee) {
    throw new Error(result.error || 'La mise à jour du collaborateur a échoué.');
  }
  await offlineService.cacheLocally(EMPLOYEES_COLLECTION, result.employee as Employee);
  if (result.user) await offlineService.cacheLocally('users', result.user);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('citrine:employee_updated', { detail: result.employee }));
    if (result.user) window.dispatchEvent(new CustomEvent('citrine:user_updated', { detail: result.user }));
  }
  return result as UpdateCollaboratorWithUserResult;
}
