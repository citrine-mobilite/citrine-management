import React from 'react';
import { Search, Filter, Flag } from 'lucide-react';
import { Employee } from '../../types';

interface TaskFilterBarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  filterPriority: string;
  onPriorityChange: (val: string) => void;
  filterAssignee: string;
  onAssigneeChange: (val: string) => void;
  filterType?: 'all' | 'tasks' | 'milestones';
  onTypeChange?: (val: 'all' | 'tasks' | 'milestones') => void;
  employees: Employee[];
}

export const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  filterPriority,
  onPriorityChange,
  filterAssignee,
  onAssigneeChange,
  employees,
}) => {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs gap-3">
      {/* Search Input */}
      <div className="relative w-full lg:max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <input
          type="text"
          placeholder="Rechercher une tâche par titre ou description..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none text-stone-900"
        />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
        {/* Priority Filter */}
        <select
          value={filterPriority}
          onChange={(e) => onPriorityChange(e.target.value)}
          className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 focus:outline-none cursor-pointer"
        >
          <option value="all">Toutes priorités</option>
          <option value="high">🔴 Haute priorité</option>
          <option value="medium">🟡 Moyenne priorité</option>
          <option value="low">🟢 Basse priorité</option>
        </select>

        {/* Assignee Filter */}
        <select
          value={filterAssignee}
          onChange={(e) => onAssigneeChange(e.target.value)}
          className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 focus:outline-none cursor-pointer"
        >
          <option value="all">Tous les collaborateurs</option>
          <option value="Équipe">Toute l'équipe</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.name}>{emp.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
};
