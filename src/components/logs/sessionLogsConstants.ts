export type LogSubTab = 'system_events' | 'audit_logs' | 'notifications';

export interface SessionLogItem {
  id: string;
  title: string;
  timestamp: string;
  dateKey: string;
  author: string;
  level: 'info' | 'success' | 'warning' | 'error';
  details: string;
  ipAddress?: string;
  targetName?: string;
  targetUserId?: string;
  targetEmployeeId?: string;
}
