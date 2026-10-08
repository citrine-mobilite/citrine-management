import React from 'react';
import { Scale, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { DisciplinaryIncident } from '../../types';

interface DisciplinaryStatsProps {
  incidents: DisciplinaryIncident[];
}

export const DisciplinaryStats: React.FC<DisciplinaryStatsProps> = ({ incidents }) => {
  const total = incidents.length;
  const critical = incidents.filter((i) => i.severity === 'critique' || i.severity === 'grave').length;
  const pending = incidents.filter((i) => i.status === 'ouvert' || i.status === 'en_instruction').length;
  const sanctioned = incidents.filter((i) => i.status === 'sanctionne').length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">Total Dossiers</span>
          <Scale className="h-4 w-4 text-[#2A7B76]" />
        </div>
        <p className="text-xl font-bold text-stone-900 mt-1">{total}</p>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">En Instruction</span>
          <AlertTriangle className="h-4 w-4 text-amber-600" />
        </div>
        <p className="text-xl font-bold text-amber-700 mt-1">{pending}</p>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">Cas Graves/Critiques</span>
          <ShieldAlert className="h-4 w-4 text-rose-600" />
        </div>
        <p className="text-xl font-bold text-rose-700 mt-1">{critical}</p>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">Sanctionnés</span>
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        </div>
        <p className="text-xl font-bold text-emerald-700 mt-1">{sanctioned}</p>
      </div>
    </div>
  );
};
