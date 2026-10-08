import React from 'react';
import { Clock, ChevronRight, UserCheck, MapPin } from 'lucide-react';
import { Employee, Presence } from '../../types';
import { TabType } from '../Sidebar';

interface DashboardLiveAttendanceListProps {
  todayPresences: Presence[];
  employees: Employee[];
  onSelectTab: (tab: TabType) => void;
  onSelectEmployee: (id: string) => void;
}

export const DashboardLiveAttendanceList: React.FC<DashboardLiveAttendanceListProps> = ({
  todayPresences,
  employees,
  onSelectTab,
  onSelectEmployee,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#2A7B76]" />
          <h3 className="font-serif font-bold text-xs text-stone-900">
            Pointages du Jour en Direct
          </h3>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
            {todayPresences.length}
          </span>
        </div>
        <button
          onClick={() => onSelectTab('presences')}
          className="text-[11px] text-[#2A7B76] hover:text-[#20635F] font-bold flex items-center gap-0.5 transition cursor-pointer"
        >
          <span>Tout voir</span>
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      <div className="divide-y divide-stone-100 overflow-y-auto max-h-[380px]">
        {todayPresences.length === 0 ? (
          <div className="p-8 text-center text-stone-400 text-xs italic">
            Aucun collaborateur n'a encore badgé aujourd'hui.
          </div>
        ) : (
          todayPresences.slice(0, 8).map((p) => {
            const emp = employees.find((e) => e.id === p.employeeId);
            const isLate = p.status === 'late';

            return (
              <div
                key={p.id}
                onClick={() => onSelectEmployee(p.employeeId)}
                className="p-3.5 hover:bg-stone-50/80 transition flex items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#2A7B76]/10 text-[#2A7B76] flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-[#2A7B76]/20">
                    {emp?.avatarUrl ? (
                      <img src={emp.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>{emp?.name?.slice(0, 2).toUpperCase() || 'EM'}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-stone-900 group-hover:text-[#2A7B76] transition truncate">
                      {emp?.name || 'Employé inconnu'}
                    </h4>
                    <p className="text-[10px] text-stone-400 truncate">
                      {emp?.department || 'Général'} • {emp?.roleType || 'Collaborateur'}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 space-y-0.5">
                  <div className="flex items-center gap-1 justify-end font-mono text-xs font-bold">
                    <span className={isLate ? 'text-amber-600' : 'text-emerald-700'}>
                      {p.arrivalTime || '--:--'}
                    </span>
                    {p.departureTime && (
                      <>
                        <span className="text-stone-300">→</span>
                        <span className="text-[#2A7B76]">{p.departureTime}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        isLate
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isLate ? 'Retard' : 'À l\'heure'}
                    </span>
                    {p.location && (
                      <span className="text-[9px] text-stone-400 flex items-center gap-0.5 max-w-[90px] truncate">
                        <MapPin className="h-2.5 w-2.5 text-[#2A7B76]" />
                        <span className="truncate">{p.location}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
