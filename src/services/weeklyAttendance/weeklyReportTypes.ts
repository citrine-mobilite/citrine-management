export interface DayPresenceRecord {
  dayName: string;
  dateStr: string;
  formattedDate: string;
  arrivalTime?: string;
  pauseStart?: string;
  pauseEnd?: string;
  departureTime?: string;
  workedHoursText: string;
  workedHoursNumber: number;
  statusLabel: string;
  statusType: 'on_time' | 'late' | 'absent' | 'mission' | 'leave' | 'future' | 'unknown';
  location?: string;
  notes?: string;
}

export interface EmployeeWeeklySummary {
  employeeId: string;
  employeeName: string;
  employeeEmail?: string;
  department: string;
  position: string;
  days: DayPresenceRecord[];
  totalWorkedHours: number;
  totalWorkedHoursText: string;
  daysWorkedCount: number;
  totalDaysExpected: number;
  latenessCount: number;
  attendanceRate: number;
}

export interface WeeklyAttendanceReportData {
  title: string;
  startDateStr: string;
  endDateStr: string;
  isFullWeek: boolean;
  isManualTrigger: boolean;
  generatedAtStr: string;
  totalCollaborators: number;
  totalCollectiveHoursText: string;
  averageAttendanceRate: number;
  totalLateness: number;
  lateThreshold: string;
  summaries: EmployeeWeeklySummary[];
}
