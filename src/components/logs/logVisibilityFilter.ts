import { AppUser, Employee, NotificationLog } from '../../types';
import { AdminAccountOperation } from '../../services/adminAuditService';
import { canSeeAllNotifications, findMatchingEmployee } from '../../utils/roleUtils';
import { SessionLogItem } from './sessionLogsConstants';

export interface UserIdentityTokens {
  canSeeAll: boolean;
  userId: string;
  empId: string;
  name: string;
  email: string;
}

export function buildUserIdentityTokens(
  currentUser?: AppUser | null,
  employees: Employee[] = []
): UserIdentityTokens {
  const canSeeAll = canSeeAllNotifications(currentUser);
  const matchedEmp = findMatchingEmployee(employees || [], currentUser);

  return {
    canSeeAll,
    userId: String(currentUser?.id || '').trim().toLowerCase(),
    empId: String(matchedEmp?.id || currentUser?.employeeId || '').trim().toLowerCase(),
    name: String(matchedEmp?.name || currentUser?.name || '').trim().toLowerCase(),
    email: String(matchedEmp?.email || currentUser?.email || '').trim().toLowerCase(),
  };
}

function matchesUserTokens(tokens: UserIdentityTokens, candidates: Array<unknown>): boolean {
  const cleanValues = candidates
    .map((v) => String(v || '').trim().toLowerCase())
    .filter(Boolean);

  if (cleanValues.length === 0) return false;

  return cleanValues.some((val) => {
    if (tokens.userId && val === tokens.userId) return true;
    if (tokens.empId && val === tokens.empId) return true;
    if (tokens.email && (val === tokens.email || val.includes(tokens.email))) return true;
    if (tokens.name && tokens.name.length >= 2 && (val === tokens.name || val.includes(tokens.name))) return true;
    return false;
  });
}

export function isAuditOperationVisibleToUser(
  op: AdminAccountOperation,
  tokens: UserIdentityTokens
): boolean {
  if (tokens.canSeeAll) return true;

  return matchesUserTokens(tokens, [
    op.targetUserId,
    op.targetEmployeeId,
    op.targetName,
    op.authorName,
    op.metadata?.userId,
    op.metadata?.employeeId,
    op.metadata?.targetEmail,
    op.metadata?.userEmail,
    op.metadata?.recipient,
    op.metadata?.assignedTo,
  ]);
}

export function isSessionLogVisibleToUser(
  item: SessionLogItem,
  tokens: UserIdentityTokens
): boolean {
  if (tokens.canSeeAll) return true;

  return matchesUserTokens(tokens, [
    item.author,
    item.targetName,
    item.targetUserId,
    item.targetEmployeeId,
    item.details,
  ]);
}

export function isNotificationVisibleToUser(
  notif: NotificationLog,
  tokens: UserIdentityTokens
): boolean {
  if (tokens.canSeeAll) return true;

  const recip = (notif.recipient || '').toLowerCase();
  if (recip === 'tous' || recip === 'équipe' || recip === 'equipe' || recip === 'all') {
    return true;
  }

  let payloadEmployeeId = '';
  let payloadEmail = '';
  try {
    if (notif.payload) {
      const parsed = JSON.parse(notif.payload);
      payloadEmployeeId = parsed?.employeeId || '';
      payloadEmail = parsed?.email || '';
    }
  } catch {
    // Ignore non-JSON payload
  }

  return matchesUserTokens(tokens, [
    notif.recipient,
    notif.title,
    notif.content,
    notif.senderName,
    payloadEmployeeId,
    payloadEmail,
  ]);
}
