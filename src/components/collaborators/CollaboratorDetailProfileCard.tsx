import React from 'react';
import { Check } from 'lucide-react';
import { Employee } from '../../types';
import {
  COLLABORATOR_STATUS_MAP,
  formatCollaboratorXAF,
  getEmployeeStatusKey,
} from './collaboratorConstants';

interface CollaboratorDetailProfileCardProps {
  emp: Employee;
  employees: Employee[];
  presencesCount: number;
}

export const CollaboratorDetailProfileCard: React.FC<CollaboratorDetailProfileCardProps> = ({
  emp,
  employees,
  presencesCount,
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
              <img src={emp.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span>{emp.name.slice(0, 2).toUpperCase()}</span>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 rounded-lg">
                {emp.roleType || 'Employé'}
              </span>
              <span
                className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-lg border ${COLLABORATOR_STATUS_MAP[statusKey]?.color}`}
              >
                {COLLABORATOR_STATUS_MAP[statusKey]?.label}
              </span>
            </div>

            <h2 className="font-serif font-bold text-xl text-stone-900">{emp.name}</h2>

            <div className="flex flex-col sm:flex-row items-center gap-x-4 gap-y-1.5 text-xs text-stone-500 font-medium pt-1">
              <span>📧 {emp.email || 'Non renseigné'}</span>
              <span>📞 {emp.phone || 'Non renseigné'}</span>
              <span>🏢 {emp.department || 'Citrine Management'}</span>
              <span>
                👔 Resp :{' '}
                <b>
                  {emp.managerName ||
                    employees.find((m) => String(m.id) === String(emp.managerId))?.name ||
                    'Direction Générale'}
                </b>
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] font-bold text-stone-500">Équipes :</span>
              {resolvedTeams.map((tName, tIdx) => (
                <span
                  key={tIdx}
                  className="inline-block px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 font-bold text-[10px] border border-purple-200 shadow-3xs"
                >
                  👥 {tName}
                </span>
              ))}
            </div>

            {emp.status === 'renvoye' && emp.departureReason && (
              <div className="mt-3 bg-red-50 border border-red-100 p-2.5 rounded-xl text-rose-800 text-[11px] font-medium">
                ⚠️ <b>Motif de renvoi :</b> {emp.departureReason}
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 flex items-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-xs font-bold shadow-3xs">
            <Check className="h-4 w-4 text-emerald-600" />
            Assujetti aux pointages
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-emerald-50/50 p-5 rounded-3xl border border-emerald-100/60 shadow-3xs space-y-1.5">
          <span className="text-[10px] text-emerald-700/80 font-bold uppercase tracking-wide">
            Salaire de Base
          </span>
          <div className="text-lg font-bold text-emerald-800 font-mono">
            {formatCollaboratorXAF(emp.salary || 0)}
          </div>
        </div>
        <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100/60 shadow-3xs space-y-1.5">
          <span className="text-[10px] text-blue-700/80 font-bold uppercase tracking-wide">
            Pointages Présence
          </span>
          <div className="text-lg font-bold text-blue-800 font-mono">
            {presencesCount} enregistrements
          </div>
        </div>
        <div className="bg-amber-50/40 p-5 rounded-3xl border border-amber-100/60 shadow-3xs space-y-1.5">
          <span className="text-[10px] text-amber-700/80 font-bold uppercase tracking-wide">
            Date d&apos;arrivée
          </span>
          <div className="text-lg font-bold text-amber-800 font-mono">
            {emp.hireDate || '2026-01-01'}
          </div>
        </div>
        <div className="bg-purple-50/40 p-5 rounded-3xl border border-purple-100/60 shadow-3xs space-y-1.5">
          <span className="text-[10px] text-purple-700/80 font-bold uppercase tracking-wide">
            Anniversaire
          </span>
          <div className="text-lg font-bold text-purple-800 font-mono">
            {emp.birthDate || '2000-05-01'}
          </div>
        </div>
      </div>
    </>
  );
};
