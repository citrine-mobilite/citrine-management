import React from 'react';
import { FileText } from 'lucide-react';

interface EmployeeAttendanceReportBarProps {
  portalReportMonth: string;
  setPortalReportMonth: (month: string) => void;
  handleGeneratePortalReport: (month?: string) => void;
  isGeneratingReport: boolean;
}

export const EmployeeAttendanceReportBar: React.FC<EmployeeAttendanceReportBarProps> = ({
  portalReportMonth,
  setPortalReportMonth,
  handleGeneratePortalReport,
  isGeneratingReport,
}) => {
  return (
    <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-3xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-stone-600 font-bold">Mois d'attestation RH :</span>
        <input
          type="month"
          value={portalReportMonth}
          onChange={(e) => setPortalReportMonth(e.target.value)}
          className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1 text-xs font-bold text-stone-800 focus:outline-none focus:border-[#2A7B76] shadow-2xs cursor-pointer"
        />
      </div>

      <button
        onClick={() => handleGeneratePortalReport(portalReportMonth)}
        disabled={isGeneratingReport}
        className="bg-[#2A7B76] hover:bg-[#20635F] disabled:opacity-50 text-white font-bold px-3.5 py-1.5 rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer ml-auto sm:ml-0"
      >
        <FileText className="h-3.5 w-3.5" />
        <span>{isGeneratingReport ? 'Génération...' : 'Télécharger Fiche Mensuelle Certifiée (PDF)'}</span>
      </button>
    </div>
  );
};
