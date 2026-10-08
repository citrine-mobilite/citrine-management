import { Role } from './userTypes';

export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'pending_validation' | 'blocked' | 'idea';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
  size?: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  comments?: Comment[];
  subtasks?: Subtask[];
}

export interface TaskProject {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  createdAt: string;
  memberIds?: string[]; // IDs des collaborateurs faisant partie de ce projet (accès restreint)
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  priority: TaskPriority;
  status: TaskStatus;
  comment?: string;
  difficultyAlertSent?: boolean;
  employeeId?: string;
  assignedTo?: string;
  projectId?: string;
  isMilestone?: boolean; // Indique si la tâche est un Jalon stratégique clé
  milestoneProgress?: number; // Progression du jalon (0 - 100%)
  milestoneTarget?: string; // Livrable ou indicateur attendu pour ce jalon
  comments?: Comment[];
  attachments?: Attachment[];
  incidents?: Incident[];
  subtasks?: Subtask[];
  lastUpdatedByRole?: Role;
  lastUpdatedTime?: string;
}

export type ReminderTrigger = '5m' | '15m' | '30m' | '1h' | '1d' | 'none';

export interface Reminder {
  id: string;
  title: string;
  note?: string;
  date?: string;
  time?: string;
  location?: string;
  duration?: string;
  triggerBefore?: ReminderTrigger;
  triggerPeriods?: string[];
  triggeredPeriods?: string[];
  triggered?: boolean;
  stopped?: boolean;
  employeeId?: string;
  employeeIds?: string[];
  allEmployees?: boolean;
  recurrence?: 'once' | 'daily' | 'weekdays' | 'weekends';
  createdAt: string;
}
