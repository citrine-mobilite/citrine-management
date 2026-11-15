import React from 'react';
import { Users } from 'lucide-react';
import { Employee } from '../../../types';

interface ReminderRecipientsSectionProps {
  isEmployee: boolean;
  currentEmployee: Employee | null;
  employees: Employee[];
  allEmployees: boolean;
  selectedEmployeeIds: string[];
  onToggleAllEmployees: (checked: boolean) => void;
  onToggleEmployee: (empId: string) => void;
}

export const ReminderRecipientsSection: React.FC<ReminderRecipientsSectionProps> = ({
  isEmployee,
  currentEmployee,
  employees,
  allEmployees,
  selectedEmployeeIds,
  onToggleAllEmployees,
  onToggleEmployee,
}) => {
  if (isEmployee) {
    return (
      <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between">
        <span className="font-bold text-stone-700 flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-[#2A7B76]" />
          Destinataire
        </span>
        <span className="font-bold text-[#2A7B76]">{currentEmployee?.name || 'Votre compte'}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2 bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80">
      <div className="flex items-center justify-between">
        <label className="font-bold text-stone-800 flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-[#2A7B76]" />
          Personnes notifiées
        </label>
        <label className="flex items-center gap-2 text-[11px] text-[#2A7B76] font-bold cursor-pointer">
          <input
            type="checkbox"
            checked={allEmployees}
            onChange={(e) => onToggleAllEmployees(e.target.checked)}
            className="rounded text-[#2A7B76] focus:ring-[#2A7B76]"
          />
          Toute l&apos;équipe
        </label>
      </div>

      {!allEmployees && (
        <div className="max-h-28 overflow-y-auto space-y-1 pt-2 border-t border-stone-200">
          {employees.map((emp) => (
            <label
              key={emp.id}
              className="flex items-center gap-2 p-1.5 hover:bg-white rounded-lg cursor-pointer transition text-[11px]"
            >
              <input
                type="checkbox"
                checked={selectedEmployeeIds.includes(emp.id)}
                onChange={() => onToggleEmployee(emp.id)}
                className="rounded text-[#2A7B76] focus:ring-[#2A7B76]"
              />
              <span className="font-semibold text-stone-800">{emp.name}</span>
              <span className="text-stone-400 text-[10px]">({emp.role || 'Employé'})</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};
