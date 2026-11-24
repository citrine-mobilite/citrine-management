import { Role } from './userTypes';

export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'pending_validation' | 'blocked' | 'idea' | 'en_cours';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent' | 'haut';

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
  description?: string;
  assignedTo?: string;
  employeeId?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
  startDate?: string;
  completedAt?: string;
  isBlocked?: boolean;
  time?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  acceptanceCriteria?: string[];
  comments?: Comment[];
  subtasks?: Subtask[];
  createdAt?: string;
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
  dueDate?: string;
  category?: string;
  projectId?: string;
  isMilestone?: boolean; // Indique si la tâche est un Jalon stratégique clé
  milestoneProgress?: number; // Progression du jalon (0 - 100%)
  milestoneTarget?: string; // Livrable ou indicateur attendu pour ce jalon
  estimatedHours?: number;
  actualHours?: number;
  completedAt?: string;
  createdAt?: string;
  comments?: Comment[];
  attachments?: Attachment[];
  incidents?: Incident[];
  subtasks?: Subtask[];
  reminderPeriod?: string;
  lastUpdatedByRole?: Role;
  lastUpdatedTime?: string;
}

export type ReminderTrigger = '5m' | '15m' | '30m' | '1h' | '1d' | 'none';
export type ReminderKind = 'deadline' | 'routine' | 'alarm' | 'movement';
export type ReminderCategory = 'vehicule' | 'fiscalite' | 'administratif' | 'rh' | 'autre';
export type ReminderRenewalCycle = 'none' | 'monthly' | 'quarterly' | 'semiannual' | 'annual';
export type ReminderRecurrenceMode = 'weekly_days' | 'weekdays' | 'daily' | 'monthly' | 'once';
export type ReminderRoutineType = 'reunion' | 'brief' | 'appel' | 'suivi' | 'personnel' | 'autre';

export interface Reminder {
  id: string;
  title: string;
  note?: string;
  description?: string;
  status?: string;
  kind?: ReminderKind;
  category?: ReminderCategory;
  routineType?: ReminderRoutineType;
  entityName?: string;
  documentRef?: string;
  date?: string;
  expirationDate?: string;
  alertLeadDays?: number;
  renewalCycle?: ReminderRenewalCycle;
  time?: string;
  location?: string;
  duration?: string;
  triggerBefore?: ReminderTrigger;
  triggerPeriods?: string[];
  triggeredPeriods?: string[];
  triggered?: boolean;
  stopped?: boolean;
  isResolved?: boolean;
  enableSoundAlarm?: boolean;
  sendPushNotification?: boolean;
  lastRenewedAt?: string;
  lastTriggeredKey?: string;
  employeeId?: string;
  employeeIds?: string[];
  allEmployees?: boolean;
  recurrence?: 'once' | 'daily' | 'weekdays' | 'weekends';
  recurrenceMode?: ReminderRecurrenceMode;
  recurrenceDays?: number[];
  createdAt: string;
}
