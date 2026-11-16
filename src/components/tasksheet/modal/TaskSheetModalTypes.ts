import {
  AttendanceIncident,
  AppUser,
  Employee,
  NotificationLog,
  Presence,
  Reminder,
  StrategicProject,
  Task,
  TaskProject,
} from '../../../types';

export interface TaskSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  allTasks: Task[];
  presences: Presence[];
  incidents?: AttendanceIncident[];
  projects?: TaskProject[];
  reminders?: Reminder[];
  strategicProjects?: StrategicProject[];
  notifications?: NotificationLog[];
  defaultMode?: 'day' | 'month' | 'year';
  defaultDate?: string;
  currentUser?: AppUser | null;
  currentRole?: string;
}
