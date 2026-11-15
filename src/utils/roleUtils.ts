export {
  normalizeRoleString,
  isEmployeeUser,
  isManagerUser,
  isAdminUser,
  getDefaultPortalForUser,
} from './roleCoreUtils';

export {
  shouldEmployeeClock,
  isITEmployee,
  isManagerOrAdminEmployee,
  isEmployeeOnlyRole,
} from './roleClockingUtils';

export {
  canSeeAllNotifications,
  canManageTaskAssignment,
  canViewOthersData,
  isSelfOnlyUser,
  findMatchingEmployee,
} from './rolePermissionUtils';
