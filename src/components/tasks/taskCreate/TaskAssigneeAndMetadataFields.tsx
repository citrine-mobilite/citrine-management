import React, { useMemo, useState } from 'react';
import { Flag, Calendar, Clock, User, FolderKanban, Layers, Search } from 'lucide-react';
import {
  AppUser,
  Employee,
  TaskPriority,
  TaskProject,
  TaskSection,
  TaskStatus,
} from '../../../types';

interface TaskAssigneeAndMetadataFieldsProps {
  startDate: string;
  setStartDate: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
  time: string;
  setTime: (v: string) => void;
  projectId: string;
  setProjectId: (v: string) => void;
  projects: TaskProject[];
  sectionId: string;
  setSectionId: (v: string) => void;
  sections: TaskSection[];
  status: TaskStatus;
  setStatus: (v: TaskStatus) => void;
  priority: TaskPriority;
  setPriority: (v: TaskPriority) => void;
  currentUser?: AppUser | null;
  assignedList: string[];
  setAssignedList: (v: string[]) => void;
  availableEmployees: Employee[];
}

export const TaskAssigneeAndMetadataFields: React.FC<TaskAssigneeAndMetadataFieldsProps> = ({
  startDate,
  setStartDate,
  date,
  setDate,
  time,
  setTime,
  projectId,
  setProjectId,
  projects,
  sectionId,
  setSectionId,
  sections,
  status,
  setStatus,
  priority,
  setPriority,
  currentUser,
  assignedList,
  setAssignedList,
  availableEmployees,
}) => {
  const [assigneeSearch, setAssigneeSearch] = useState('');

  const filteredEmployees = useMemo(() => {
    const q = assigneeSearch.trim().toLowerCase();
    if (!q) return availableEmployees;
    return availableEmployees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.department || '').toLowerCase().includes(q)
    );
  }, [availableEmployees, assigneeSearch]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-stone-400" /> Date de début
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none font-mono font-bold text-stone-800"
          />
        </div>
        <div>
          <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-[#2A7B76]" /> Date d'échéance *
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none font-mono font-bold text-stone-800"
          />
        </div>
        <div>
          <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-[#2A7B76]" /> Heure limite
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none font-mono font-bold text-stone-800"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
            <FolderKanban className="h-3.5 w-3.5 text-[#2A7B76]" /> Projet (Optionnel)
          </label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none font-bold text-stone-800 cursor-pointer"
          >
            <option value="">📁 Aucun projet (Tâche indépendante)</option>
            {projects
              .filter((p) => p.id !== 'all')
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
            <Layers className="h-3.5 w-3.5 text-[#2A7B76]" /> Section
          </label>
          <select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none font-bold text-stone-800 cursor-pointer"
          >
            {sections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-bold text-stone-700 mb-1">Statut initial</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none font-bold text-stone-800 cursor-pointer"
          >
            <option value="idea">Idée</option>
            <option value="todo">À faire</option>
            <option value="in_progress">En cours</option>
            <option value="pending_validation">En validation</option>
            <option value="blocked">Bloquée</option>
            <option value="completed">Terminée</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
          <Flag className="h-3.5 w-3.5 text-[#2A7B76]" /> Priorité
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: 'low', label: 'Basse', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
            { id: 'medium', label: 'Moyenne', bg: 'bg-amber-50 text-amber-800 border-amber-300' },
            { id: 'high', label: 'Haute', bg: 'bg-rose-50 text-rose-800 border-rose-300' },
            { id: 'urgent', label: 'Urgente', bg: 'bg-purple-50 text-purple-900 border-purple-300' },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPriority(p.id as TaskPriority)}
              className={`py-2 rounded-xl border text-center transition cursor-pointer font-bold text-xs ${
                priority === p.id
                  ? `${p.bg} ring-2 ring-offset-1 ring-[#2A7B76]`
                  : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="font-bold text-stone-700 flex items-center gap-1">
            <User className="h-3.5 w-3.5 text-[#2A7B76]" /> Assigné à ({assignedList.join(', ') || 'Équipe'})
          </label>
          <div className="flex items-center gap-1.5">
            {currentUser?.name && (
              <button
                type="button"
                onClick={() => setAssignedList([currentUser.name])}
                className="text-[11px] font-semibold text-[#2A7B76] hover:underline cursor-pointer"
              >
                M'assigner
              </button>
            )}
          </div>
        </div>

        <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={assigneeSearch}
              onChange={(e) => setAssigneeSearch(e.target.value)}
              placeholder="Rechercher un collaborateur à assigner..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 bg-white text-xs outline-none focus:border-[#2A7B76]"
            />
          </div>

          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
            <label className="flex items-center gap-2 text-xs font-bold text-stone-800 cursor-pointer px-1.5 py-1 rounded hover:bg-white">
              <input
                type="checkbox"
                checked={assignedList.includes('Équipe')}
                onChange={(e) => {
                  if (e.target.checked) setAssignedList(['Équipe']);
                  else setAssignedList(assignedList.filter((x) => x !== 'Équipe'));
                }}
                className="rounded border-stone-300 text-[#2A7B76]"
              />
              <span>Toute l'équipe</span>
            </label>

            {filteredEmployees.map((emp) => (
              <label
                key={emp.id}
                className="flex items-center justify-between gap-2 text-xs font-medium text-stone-700 cursor-pointer px-1.5 py-1 rounded hover:bg-white"
              >
                <span className="flex items-center gap-2 truncate">
                  <input
                    type="checkbox"
                    checked={assignedList.includes(emp.name)}
                    onChange={(e) => {
                      let updated = assignedList.filter((x) => x !== 'Équipe');
                      if (e.target.checked) updated.push(emp.name);
                      else updated = updated.filter((x) => x !== emp.name);
                      setAssignedList(updated.length > 0 ? updated : ['Équipe']);
                    }}
                    className="rounded border-stone-300 text-[#2A7B76]"
                  />
                  <span className="truncate font-semibold text-stone-800">{emp.name}</span>
                </span>
                <span className="text-[10px] text-stone-400 shrink-0">
                  {emp.department || 'Général'}
                </span>
              </label>
            ))}

            {filteredEmployees.length === 0 && (
              <div className="text-[11px] text-stone-400 px-2 py-1">
                Aucun collaborateur trouvé.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
