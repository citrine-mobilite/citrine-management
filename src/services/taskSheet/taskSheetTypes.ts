import { Employee } from '../../types';

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
}

export interface MonthlyTaskSheetData {
  employee: Employee;
  month: string;
  monthName: string;
  totalDaysWorked: number;
  totalHoursWorked: number;
  totalTasksAssigned: number;
  totalTasksCompleted: number;
  totalSubtasksCount: number;
  completedSubtasksCount: number;
  completionRate: number;
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
    arrivalTime: string;
    departureTime: string;
    hoursWorked: number;
    status: string;
    tasksDoneCount: number;
    taskTitles?: string[];
  }[];
}

export interface YearlyTaskSheetData {
  employee: Employee;
  year: number;
  totalHoursWorked: number;
  totalDaysPresent: number;
  totalTasksCompleted: number;
  avgCompletionRate: number;
  monthlyBreakdown: {
    monthName: string;
    daysWorked: number;
    hoursWorked: number;
    tasksCompleted: number;
    rendementRate: number;
  }[];
}
