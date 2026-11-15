import React from 'react';
import {
  ArrowLeft,
  Bell,
  Briefcase,
  CheckSquare,
  Clock,
  FileText,
  MapPin,
  Pencil,
  Printer,
} from 'lucide-react';
import { Employee, Presence, SalaryPayment, Task } from '../../types';
import { CollaboratorDetailTab } from './collaboratorConstants';
import { CollaboratorDetailProfileCard } from './CollaboratorDetailProfileCard';
import { CollaboratorDetailTabs } from './CollaboratorDetailTabs';

interface CollaboratorDetailViewProps {
  emp: Employee;
  employees: Employee[];
  presences: Presence[];
  salaryPayments: SalaryPayment[];
  tasks: Task[];
  activeDetailTab: CollaboratorDetailTab;
  setActiveDetailTab: (tab: CollaboratorDetailTab) => void;
  rhReportMonth: string;
  setRhReportMonth: (m: string) => void;
  isGeneratingRhReport: boolean;
  onGenerateMonthlyReport: (emp: Employee, month: string) => void;
  onBackToList: () => void;
  onEdit: (emp: Employee) => void;
  onPrint: () => void;
}

export const CollaboratorDetailView: React.FC<CollaboratorDetailViewProps> = ({
  emp,
  employees,
  presences,
  salaryPayments,
  tasks,
  activeDetailTab,
  setActiveDetailTab,
  rhReportMonth,
  setRhReportMonth,
  isGeneratingRhReport,
  onGenerateMonthlyReport,
  onBackToList,
  onEdit,
  onPrint,
}) => {
  const empPresences = presences.filter((p) => p.employeeId === emp.id);
  const empPayslips = salaryPayments.filter((p) => p.employeeId === emp.id);
  const empTasks = tasks.filter((t) => t.assignedTo === emp.name && t.status !== 'completed');

  const tabs: { id: CollaboratorDetailTab; label: string; icon: React.ReactNode }[] = [
    { id: 'payslips', label: `${empPayslips.length} Fiches de Paie (Mois par mois)`, icon: <FileText className="h-3.5 w-3.5" /> },
    { id: 'presences', label: `Historique des Présences (${empPresences.length})`, icon: <Clock className="h-3.5 w-3.5" /> },
    { id: 'map', label: 'Carte des Badges (GPS Leaflet)', icon: <MapPin className="h-3.5 w-3.5" /> },
    { id: 'alerts', label: 'Alertes Actives (0)', icon: <Bell className="h-3.5 w-3.5" /> },
    { id: 'tasks', label: `Tâches Non Terminées (${empTasks.length})`, icon: <CheckSquare className="h-3.5 w-3.5" /> },
    { id: 'missions', label: `Missions Professionnelles (${(emp.missionHistory || []).length})`, icon: <Briefcase className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToList}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer flex items-center gap-1 text-xs font-bold"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux collaborateurs
          </button>
          <div className="h-4 w-[1px] bg-stone-200 hidden sm:block" />
          <span className="text-xs text-stone-500 font-medium">
            Fiche Individuelle • <b className="text-stone-800 font-bold">{emp.name}</b>
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => onEdit(emp)}
            className="flex-1 sm:flex-initial px-3.5 py-2 border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5 text-[#2A7B76]" />
            Modifier la fiche
          </button>
          <button
            onClick={onPrint}
            className="flex-1 sm:flex-initial px-3.5 py-2 border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 text-stone-500" />
            Imprimer
          </button>
        </div>
      </div>

      <CollaboratorDetailProfileCard
        emp={emp}
        employees={employees}
        presencesCount={empPresences.length}
      />

      <div className="space-y-4">
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-stone-100 rounded-2xl border border-stone-200/80">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveDetailTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeDetailTab === tab.id
                  ? 'bg-[#2A7B76] text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <CollaboratorDetailTabs
          emp={emp}
          activeDetailTab={activeDetailTab}
          empPayslips={empPayslips}
          empPresences={empPresences}
          empTasks={empTasks}
          rhReportMonth={rhReportMonth}
          setRhReportMonth={setRhReportMonth}
          isGeneratingRhReport={isGeneratingRhReport}
          onGenerateMonthlyReport={onGenerateMonthlyReport}
        />
      </div>
    </div>
  );
};
