import React from 'react';
import { Users, CheckCircle2, Cake, Briefcase } from 'lucide-react';
import { Employee } from '../../types';

interface CollaboratorStatsCardsProps {
  employees: Employee[];
}

export const CollaboratorStatsCards: React.FC<CollaboratorStatsCardsProps> = ({ employees }) => {
  const total = employees.length;
  const active = employees.filter((e) => e.status === 'en_poste' || !e.status).length;
  const onLeave = employees.filter((e) => e.status === 'en_conge').length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">Effectif Total</span>
          <Users className="h-4 w-4 text-[#2A7B76]" />
        </div>
        <p className="text-xl font-bold text-stone-900 mt-1">{total}</p>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">En Poste</span>
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        </div>
        <p className="text-xl font-bold text-emerald-700 mt-1">{active}</p>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">En Congé</span>
          <Briefcase className="h-4 w-4 text-amber-600" />
        </div>
        <p className="text-xl font-bold text-amber-700 mt-1">{onLeave}</p>
      </div>
    </div>
  );
};
