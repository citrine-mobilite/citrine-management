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

export type TaskRecurrence = 'none' | 'daily' | 'weekly' | 'monthly';
export type PersonalTaskBucket = 'recent' | 'today' | 'upcoming' | 'later';

export interface TaskSection {
  id: string;
  title: string;
  orderIndex: number;
  color?: string;
  collapsed?: boolean;
}

export interface TaskCustomFieldDef {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
}

export interface TaskProjectRule {
  id: string;
  name: string;
  trigger: 'all_subtasks_done' | 'moved_to_blocked' | 'task_completed';
  action: 'complete_parent' | 'notify_lead' | 'create_next_recurrence';
  enabled: boolean;
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
  sectionId?: string;
  orderIndex?: number;
  startDate?: string;
  dueDate?: string;
  endDate?: string;
  time?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  acceptanceCriteria?: string[];
  dependsOnIds?: string[];
  likedBy?: string[];
  followerIds?: string[];
  recurrence?: TaskRecurrence;
  customFields?: Record<string, string | number>;
  comments?: Comment[];
  subtasks?: Subtask[];
  blockerReason?: string;
  isBlocked?: boolean;
  incidents?: Incident[];
  createdAt?: string;
  completedAt?: string;
  ignoredDuplicateIds?: string[];
  mergedIntoTaskId?: string;
}

export interface TaskProject {
  id: string;
  docId?: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  createdAt: string;
  memberIds?: string[]; // IDs des collaborateurs faisant partie de ce projet (accès restreint)
  sections?: TaskSection[];
  customFields?: TaskCustomFieldDef[];
  rules?: TaskProjectRule[];
}

export interface Task {
  id: string;
  docId?: string;
  title: string;
  description?: string;
  date: string;
  startDate?: string;
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
  sectionId?: string;
  personalBucket?: PersonalTaskBucket;
  orderIndex?: number;
  isMilestone?: boolean; // Indique si la tâche est un Jalon stratégique clé
  milestoneProgress?: number; // Progression du jalon (0 - 100%)
  milestoneTarget?: string; // Livrable ou indicateur attendu pour ce jalon
  tags?: string[];
  acceptanceCriteria?: string[];
  dependsOnIds?: string[];
  likedBy?: string[];
  followerIds?: string[];
  recurrence?: TaskRecurrence;
  customFields?: Record<string, string | number>;
  blockerReason?: string;
  isBlocked?: boolean;
  comments?: Comment[];
  attachments?: Attachment[];
  incidents?: Incident[];
  subtasks?: Subtask[];
  reminderPeriod?: string;
  estimatedHours?: number;
  actualHours?: number;
  lastUpdatedByRole?: Role;
  lastUpdatedTime?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  ignoredDuplicateIds?: string[];
  mergedIntoTaskId?: string;
}

export type ReminderTrigger = '5m' | '15m' | '30m' | '1h' | '1d' | 'none';

export type ReminderKind = 'deadline' | 'routine' | 'alarm' | 'movement';

export type ReminderCategory = 'vehicule' | 'fiscalite' | 'administratif' | 'rh' | 'autre';

export type ReminderRenewalCycle = 'none' | 'monthly' | 'quarterly' | 'semiannual' | 'annual';

export type ReminderRecurrenceMode = 'once' | 'daily' | 'weekdays' | 'weekly_days' | 'monthly';

export type ReminderRoutineType = 'reunion' | 'brief' | 'appel' | 'suivi' | 'personnel' | 'autre';

export interface Reminder {
  id: string;
  title: string;
  note?: string;
  description?: string;
  status?: string;
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
  recurrenceMode?: ReminderRecurrenceMode;
  recurrenceDays?: number[]; // 0=Dimanche .. 6=Samedi (ex: [1, 3, 5] pour Lun/Mer/Ven)
  routineType?: ReminderRoutineType;
  movementCategory?: string;
  sendPushNotification?: boolean;
  enableSoundAlarm?: boolean;
  lastTriggeredKey?: string;
  kind?: ReminderKind;
  category?: ReminderCategory;
  entityName?: string;
  documentRef?: string;
  expirationDate?: string;
  alertLeadDays?: number;
  renewalCycle?: ReminderRenewalCycle;
  lastRenewedAt?: string;
  isResolved?: boolean;
  estimatedAmount?: number;
  createdAt: string;
}
