import React from 'react';
import { Check } from 'lucide-react';
import { Employee, Presence, SalaryPayment, Task } from '../../types';
import {
  COLLABORATOR_STATUS_MAP,
  getEmployeeStatusKey,
} from './collaboratorConstants';
import { CollaboratorRecapInsightsGrid } from './CollaboratorRecapInsightsGrid';

interface CollaboratorDetailProfileCardProps {
  emp: Employee;
  employees: Employee[];
  presences: Presence[];
  payslips: SalaryPayment[];
  tasks: Task[];
}

export const CollaboratorDetailProfileCard: React.FC<CollaboratorDetailProfileCardProps> = ({
  emp,
  employees,
  presences,
  payslips,
  tasks,
}) => {
  const statusKey = getEmployeeStatusKey(emp);
  const resolvedTeams =
    Array.isArray(emp.teams) && emp.teams.length > 0
      ? emp.teams
      : emp.team
      ? emp.team.split(',').map((t) => t.trim()).filter(Boolean)
      : ['Équipe IT & Développement'];

  return (
    <>
      <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="w-20 h-20 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-2xl border border-emerald-100 shadow-3xs shrink-0 overflow-hidden">
            {emp.avatarUrl ? (
              <img src={emp.avatarUrl} alt={emp.name} className="w-full h-full object-cover" />
            ) : (
              <span>{emp.name.slice(0, 2).toUpperCase()}</span>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap text-xs text-stone-500">
              <span className="font-semibold text-blue-700">
                {emp.roleType || 'Employé'}
              </span>
              <span aria-hidden="true">·</span>
              <span className={`font-semibold px-2 py-0.5 rounded-md border text-[11px] ${COLLABORATOR_STATUS_MAP[statusKey]?.color}`}>
                {COLLABORATOR_STATUS_MAP[statusKey]?.label}
              </span>
              {emp.position && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-stone-700 font-medium">{emp.position}</span>
                </>
              )}
            </div>

            <h2 className="font-serif font-bold text-xl text-stone-900">{emp.name}</h2>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-xs text-stone-500 font-medium pt-0.5">
              <span>{emp.email || 'Email non renseigné'}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{emp.phone || 'Téléphone non renseigné'}</span>
              <span aria-hidden="true">·</span>
              <span>{emp.department || 'Citrine Management'}</span>
              <span aria-hidden="true">·</span>
              <span>
                Resp :{' '}
                <strong className="text-stone-800">
                  {emp.managerName ||
                    employees.find((m) => String(m.id) === String(emp.managerId))?.name ||
                    'Direction Générale'}
                </strong>
              </span>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap pt-1 text-xs text-stone-500">
              <span className="font-semibold">Équipes :</span>
              <span>{resolvedTeams.join(' · ')}</span>
            </div>

            {emp.status === 'renvoye' && emp.departureReason && (
              <div className="mt-3 bg-red-50 border border-red-200 p-2.5 rounded-xl text-rose-800 text-[11px] font-medium">
                <strong>Motif de renvoi :</strong> {emp.departureReason}
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 flex items-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold">
            <Check className="h-4 w-4 text-emerald-600" />
            Assujetti aux pointages
          </span>
        </div>
      </div>

      <CollaboratorRecapInsightsGrid
        emp={emp}
        presences={presences}
        payslips={payslips}
        tasks={tasks}
      />
    </>
  );
};
