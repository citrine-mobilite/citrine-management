import { AttendanceIncident, AppUser, Employee, Presence, Task, TaskProject } from '../../../types';

export interface TaskSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  allTasks: Task[];
  presences: Presence[];
  incidents?: AttendanceIncident[];
  projects?: TaskProject[];
  defaultMode?: 'day' | 'month' | 'year';
  defaultDate?: string;
  currentUser?: AppUser | null;
  currentRole?: string;
}
