import { Employee } from '../../types';
import type {
  ImportantPointsPeriodSummary,
  TaskSheetImportantPoint,
} from './importantPointsUtils';

export type { TaskSheetImportantPoint, ImportantPointsPeriodSummary };

export interface DailyTaskSheetTaskItem {
  id?: string;
  title: string;
  parentTaskTitle: string;
  domain: string;
  priorityLabel: 'P1' | 'P2' | 'P3';
  estimatedMinutes: number;
  dueDate: string;
  status: 'Fait' | 'En cours' | 'À faire' | 'Bloqué';
  isMilestone?: boolean;
}

export interface DailyCapacityMetrics {
  workMinutesNet: number;
  plannedMinutes: number;
  plannedSubtasksCount: number;
  maxRecommendedSubtasks: number;
  hasMilestone: boolean;
  milestoneTitle?: string;
  capacityStatus: 'optimal' | 'overloaded' | 'available';
  capacityAdvice: string;
}

export interface DailyTaskSheetData {
  employee: Employee;
  date: string;
  dayName: string;
  location: string;
  department: string;
  topPriorities: { id: string; title: string; priority: string; status: string; isMilestone?: boolean }[];
  tasks: DailyTaskSheetTaskItem[];
  totalTasks: number;
  completedTasks: number;
  ratePercentage: number;
  postponedCount: number;
  capacity: DailyCapacityMetrics;
  scheduleSlots: {
    timeRange: string;
    activity: string;
    resolutionNote?: string;
    isBreak?: boolean;
    isBuffer?: boolean;
    statusBadge?: string;
  }[];
  presenceIncidents: {
    time?: string;
    type: string;
    label: string;
    description: string;
    isJustified?: boolean;
  }[];
  unforeseenEvents: {
    time: string;
    subject: string;
    lostMinutes: number;
    sourceTask?: string;
    isFromBlockage?: boolean;
    status?: string;
  }[];
  postponedTasks: string[];
  managerAlertPoint: string;
  managerComments: {
    id: string;
    taskTitle: string;
    isSubtask: boolean;
    author: string;
    time: string;
    text: string;
  }[];
  reminders?: {
    id: string;
    title: string;
    time: string;
    durationMinutes: number;
    kind: string;
    routineType?: string;
    location?: string;
    statusLabel: 'Clôturé' | 'En retard' | 'Planifié';
  }[];
  remindersMinutesTotal?: number;
  importantPoints?: TaskSheetImportantPoint[];
  importantPointsSummary?: {
    total: number;
    alertsCount: number;
    remindersCount: number;
    movementsCount: number;
    totalMinutes: number;
  };
  projectMilestones?: {
    projectId: string;
    projectName: string;
    milestoneId: string;
    title: string;
    status: string;
    targetDate?: string;
    isDone: boolean;
    isBlocked: boolean;
    isOverdue: boolean;
  }[];
}

export interface MonthlyTaskSheetData {
  employee: Employee;
  month: string;
  monthName: string;
  totalDaysWorked: number;
  workingDaysInMonth: number;
  weekdayDaysWorked: number;
  weekendDaysWorked: number;
  totalHoursWorked: number;
  presentDays?: number;
  lateDays?: number;
  absentDays?: number;
  totalTasksAssigned: number;
  totalTasksCompleted: number;
  totalSubtasksCount: number;
  completedSubtasksCount: number;
  completionRate: number;
  milestonesSummary?: {
    total: number;
    completed: number;
    blocked: number;
    items: {
      id: string;
      title: string;
      projectName?: string;
      status: string;
      targetDate?: string;
      progress: number;
    }[];
  };
  remindersSummary?: {
    totalOccurrences: number;
    resolvedCount: number;
    overdueCount: number;
    totalHours: number;
  };
  importantPointsSummary?: ImportantPointsPeriodSummary;
  tasksList: {
    id: string;
    title: string;
    status: string;
    isMilestone?: boolean;
    priority?: string;
    date?: string;
    totalSubtasks: number;
    completedSubtasks: number;
    subtasks: { id: string; title: string; completed: boolean; status: string; estimatedHours?: number }[];
    completionPercentage: number;
  }[];
  dailyBreakdown: {
    date: string;
    dayName: string;
    isWeekend?: boolean;
    arrivalTime: string;
    departureTime: string;
    hoursWorked: number;
    status: string;
    tasksDoneCount: number;
    remindersCount?: number;
    importantPointsCount?: number;
    taskTitles?: string[];
  }[];
}

export interface YearlyTaskSheetData {
  employee: Employee;
  year: number;
  totalHoursWorked: number;
  totalDaysPresent: number;
  totalWorkingDays: number;
  totalWeekendDaysWorked: number;
  totalTasksCompleted: number;
  avgCompletionRate: number;
  totalSubtasksAssigned?: number;
  totalSubtasksCompleted?: number;
  subtaskCompletionRate?: number;
  milestonesSummary?: {
    total: number;
    completed: number;
    blocked: number;
  };
  remindersSummary?: {
    totalOccurrences: number;
    resolvedCount: number;
    overdueCount: number;
    totalHours: number;
  };
  importantPointsSummary?: ImportantPointsPeriodSummary;
  topTimeTasks?: Array<{
    id: string;
    title: string;
    hours: number;
    status: string;
    subtasksCount: number;
    completedSubtasksCount: number;
  }>;
  monthlyBreakdown: {
    monthName: string;
    daysWorked: number;
    workingDays: number;
    weekendDaysWorked: number;
    hoursWorked: number;
    tasksCompleted: number;
    subtasksTotal?: number;
    remindersCount?: number;
    importantPointsCount?: number;
    rendementRate: number;
  }[];
}
