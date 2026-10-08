import React from 'react';
import { Presence } from '../../types';
import { EmployeePresencesKPICards } from './EmployeePresencesKPICards';
import { EmployeeAttendanceReportBar } from './EmployeeAttendanceReportBar';
import { EmployeePresencesTable } from './EmployeePresencesTable';

interface EmployeePresencesHistorySectionProps {
  myPresences: Presence[];
  displayedPresences: Presence[];
  employeeClockingStats: {
    totalDays: number;
    presentCount: number;
    lateCount: number;
    assiduiteRate: number;
  };
  portalReportMonth: string;
  setPortalReportMonth: (month: string) => void;
  handleGeneratePortalReport: (month?: string) => void;
  isGeneratingReport: boolean;
  paginationMode: 'pages' | 'infinite';
  setPaginationMode: (mode: 'pages' | 'infinite') => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  presencePage: number;
  setPresencePage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  infiniteCount: number;
  setInfiniteCount: React.Dispatch<React.SetStateAction<number>>;
}

export const EmployeePresencesHistorySection: React.FC<EmployeePresencesHistorySectionProps> = ({
  myPresences,
  displayedPresences,
  employeeClockingStats,
  portalReportMonth,
  setPortalReportMonth,
  handleGeneratePortalReport,
  isGeneratingReport,
  paginationMode,
  setPaginationMode,
  pageSize,
  setPageSize,
  presencePage,
  setPresencePage,
  totalPages,
  infiniteCount,
  setInfiniteCount,
}) => {
  return (
    <div className="space-y-4">
      {/* Metrics summary */}
      <EmployeePresencesKPICards stats={employeeClockingStats} />

      {/* Certified Monthly Attendance Report Toolbar */}
      <EmployeeAttendanceReportBar
        portalReportMonth={portalReportMonth}
        setPortalReportMonth={setPortalReportMonth}
        handleGeneratePortalReport={handleGeneratePortalReport}
        isGeneratingReport={isGeneratingReport}
      />

      {/* Historical Presences Table & Responsive Mobile Cards */}
      <EmployeePresencesTable
        myPresences={myPresences}
        displayedPresences={displayedPresences}
        paginationMode={paginationMode}
        setPaginationMode={setPaginationMode}
        pageSize={pageSize}
        setPageSize={setPageSize}
        presencePage={presencePage}
        setPresencePage={setPresencePage}
        totalPages={totalPages}
        infiniteCount={infiniteCount}
        setInfiniteCount={setInfiniteCount}
      />
    </div>
  );
};

export default EmployeePresencesHistorySection;
