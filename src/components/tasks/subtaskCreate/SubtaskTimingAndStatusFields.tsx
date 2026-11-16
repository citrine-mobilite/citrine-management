import React from 'react';
import { User, Flag, Calendar, Activity, Clock } from 'lucide-react';
import { Employee, TaskPriority, TaskStatus } from '../../../types';

interface SubtaskTimingAndStatusFieldsProps {
  priority: TaskPriority;
  setPriority: (v: TaskPriority) => void;
  status: TaskStatus;
  setStatus: (v: TaskStatus) => void;
  myName: string;
  assignedTo: string;
  setAssignedTo: (v: string) => void;
  employees: Employee[];
  startDate: string;
  setStartDate: (v: string) => void;
  dueDate: string;
  setDueDate: (v: string) => void;
  time: string;
  setTime: (v: string) => void;
  formattedDisplayDate: string;
}

export const SubtaskTimingAndStatusFields: React.FC<SubtaskTimingAndStatusFieldsProps> = ({
  priority,
  setPriority,
  status,
  setStatus,
  myName,
  assignedTo,
  setAssignedTo,
  employees,
  startDate,
  setStartDate,
  dueDate,
  setDueDate,
  time,
  setTime,
  formattedDisplayDate,
}) => {
  return (
    <>
      <div className="space-y-1.5">
        <label className="block font-bold text-stone-700 flex items-center gap-1.5 text-xs">
          <Flag className="h-3.5 w-3.5 text-[#2A7B76]" />
          Niveau de Priorité
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: 'low', label: 'Basse', border: 'border-emerald-300', bg: 'bg-emerald-50 text-emerald-800' },
            { id: 'medium', label: 'Moyenne', border: 'border-amber-300', bg: 'bg-amber-50 text-amber-800' },
            { id: 'high', label: 'Haute', border: 'border-rose-300', bg: 'bg-rose-50 text-rose-800' },
            { id: 'urgent', label: 'Urgente', border: 'border-purple-300', bg: 'bg-purple-50 text-purple-900' },
          ].map((p) => {
            const isSelected = priority === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPriority(p.id as TaskPriority)}
                className={`py-2 px-2.5 rounded-xl border text-center transition cursor-pointer ${
                  isSelected
                    ? `${p.bg} ${p.border} font-bold ring-2 ring-[#2A7B76]/30`
                    : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-600'
                }`}
              >
                <span className="text-[11px] font-semibold">{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <label className="block font-bold text-stone-700 flex items-center gap-1.5 text-xs">
            <Activity className="h-3.5 w-3.5 text-[#2A7B76]" />
            Statut Initial
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50/70 focus:bg-white focus:border-[#2A7B76] font-bold text-stone-800 outline-none transition cursor-pointer"
          >
            <option value="idea">Idée</option>
            <option value="todo">À faire</option>
            <option value="in_progress">En cours</option>
            <option value="pending_validation">En validation</option>
            <option value="blocked">Bloquée</option>
            <option value="completed">Déjà terminée</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-bold text-stone-700 flex items-center gap-1.5 text-xs">
              <User className="h-3.5 w-3.5 text-[#2A7B76]" />
              Assigné à
            </label>
            {myName && (
              <button
                type="button"
                onClick={() => setAssignedTo(myName)}
                className="text-[11px] font-semibold text-[#2A7B76] hover:underline cursor-pointer"
              >
                M'assigner
              </button>
            )}
          </div>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50/70 focus:bg-white focus:border-[#2A7B76] font-semibold text-stone-800 outline-none transition cursor-pointer"
          >
            <option value="Équipe">Toute l'équipe</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.name}>
                {emp.name} ({emp.department || 'Général'})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="space-y-1.5">
          <label className="block font-bold text-stone-700 flex items-center gap-1.5 text-xs">
            <Calendar className="h-3.5 w-3.5 text-stone-400" />
            Date de début
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50/70 focus:bg-white focus:border-[#2A7B76] font-mono font-bold text-stone-800 outline-none text-xs transition"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block font-bold text-stone-700 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#2A7B76]" />
              Échéance
            </span>
            {formattedDisplayDate && (
              <span className="text-[10px] font-mono font-bold text-[#2A7B76] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/50">
                {formattedDisplayDate}
              </span>
            )}
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50/70 focus:bg-white focus:border-[#2A7B76] font-mono font-bold text-stone-800 outline-none text-xs transition"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block font-bold text-stone-700 flex items-center gap-1.5 text-xs">
            <Clock className="h-3.5 w-3.5 text-[#2A7B76]" />
            Heure limite
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50/70 focus:bg-white focus:border-[#2A7B76] font-mono font-bold text-stone-800 outline-none text-xs transition"
          />
        </div>
      </div>
    </>
  );
};
