import React from 'react';
import { Clock } from 'lucide-react';
import { Employee, Presence } from '../../types';
import { TabType } from '../Sidebar';

interface AdminDashboardTodayClockingsCardProps {
  clockableEmployees: Employee[];
  todayPresences: Presence[];
  onSelectTab: (tab: TabType) => void;
  onSelectEmployee: (id: string) => void;
}

export const AdminDashboardTodayClockingsCard: React.FC<AdminDashboardTodayClockingsCardProps> = ({
  clockableEmployees,
  todayPresences,
  onSelectTab,
  onSelectEmployee,
}) => {
  return (
    <div className="glass-card rounded-3xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-stone-200/60 pb-3">
        <h3 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-1.5">
          <Clock className="h-4.5 w-4.5 text-[#2A7B76]" />
          Pointages du Jour
        </h3>
        <button
          onClick={() => onSelectTab('presences')}
          className="text-[11px] font-bold text-[#2A7B76] hover:underline flex items-center gap-1 cursor-pointer"
        >
          Registre complet &rarr;
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-stone-400 font-bold uppercase tracking-wider text-[9px] border-b border-stone-100">
              <th className="pb-3">Collaborateur</th>
              <th className="pb-3">Poste</th>
              <th className="pb-3">Arrivée</th>
              <th className="pb-3">Statut</th>
              <th className="pb-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {clockableEmployees.slice(0, 5).map((emp) => {
              const p = todayPresences.find((x) => x.employeeId === emp.id);
              return (
                <tr key={emp.id} className="hover:bg-stone-50/50 transition">
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-3xs border border-emerald-100">
                        {emp.avatarUrl ? (
                          <img src={emp.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>{emp.name.slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="block font-bold text-stone-950 truncate text-[11px]">{emp.name}</span>
                        <span className="block text-[9px] text-stone-400 font-mono truncate">
                          {emp.phone || '+237 655500443'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-stone-500 font-medium truncate max-w-[120px]">
                    {emp.roleType || 'Collaborateur'}
                  </td>
                  <td className="py-3 font-mono font-bold text-stone-800">{p?.arrivalTime || '—'}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase border ${
                        p?.status === 'present'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : p?.status === 'late'
                          ? 'bg-amber-50 text-amber-700 border-amber-100'
                          : 'bg-stone-50 text-stone-400 border-stone-100'
                      }`}
                    >
                      {p?.status === 'present' ? 'Présent' : p?.status === 'late' ? 'En retard' : 'Non pointé'}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => onSelectEmployee(emp.id)}
                      className="px-2 py-1 rounded bg-[#2A7B76]/5 text-[#2A7B76] hover:bg-[#2A7B76] hover:text-white transition font-bold text-[10px] cursor-pointer"
                    >
                      Fiche
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
