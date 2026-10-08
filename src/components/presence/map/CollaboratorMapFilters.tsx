import React from 'react';
import { Calendar, Filter } from 'lucide-react';

interface CollaboratorMapFiltersProps {
  filterPeriod: 'month' | 'year' | 'day' | 'all';
  setFilterPeriod: (val: 'month' | 'year' | 'day' | 'all') => void;
  selectedMonth: string;
  setSelectedMonth: (val: string) => void;
  selectedDay: string;
  setSelectedDay: (val: string) => void;
}

export const CollaboratorMapFilters: React.FC<CollaboratorMapFiltersProps> = ({
  filterPeriod,
  setFilterPeriod,
  selectedMonth,
  setSelectedMonth,
  selectedDay,
  setSelectedDay,
}) => {
  return (
    <div className="bg-white p-3.5 rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl">
        {[
          { id: 'month', label: 'Mois' },
          { id: 'day', label: 'Jour' },
          { id: 'year', label: 'Année' },
          { id: 'all', label: 'Tout' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterPeriod(f.id as any)}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
              filterPeriod === f.id ? 'bg-white text-[#2A7B76] shadow-2xs' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {filterPeriod === 'month' && (
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-2.5 py-1 bg-stone-50 border border-stone-200 rounded-xl font-bold text-xs text-stone-800 focus:outline-none focus:border-[#2A7B76]"
          />
        )}

        {filterPeriod === 'day' && (
          <input
            type="date"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="px-2.5 py-1 bg-stone-50 border border-stone-200 rounded-xl font-bold text-xs text-stone-800 focus:outline-none focus:border-[#2A7B76]"
          />
        )}
      </div>
    </div>
  );
};
