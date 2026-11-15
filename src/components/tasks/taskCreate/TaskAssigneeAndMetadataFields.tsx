import React from 'react';
import { Flag, Calendar, Clock, User, FolderKanban } from 'lucide-react';
import { AppUser, Employee, TaskPriority, TaskProject, TaskStatus } from '../../../types';

interface TaskAssigneeAndMetadataFieldsProps {
  date: string;
  setDate: (v: string) => void;
  time: string;
  setTime: (v: string) => void;
  projectId: string;
  setProjectId: (v: string) => void;
  projects: TaskProject[];
  status: TaskStatus;
  setStatus: (v: TaskStatus) => void;
  priority: TaskPriority;
  setPriority: (v: TaskPriority) => void;
  isEmpOrIntern: boolean;
  currentUser?: AppUser | null;
  assignedList: string[];
  setAssignedList: (v: string[]) => void;
  availableEmployees: Employee[];
}

export const TaskAssigneeAndMetadataFields: React.FC<TaskAssigneeAndMetadataFieldsProps> = ({
  date,
  setDate,
  time,
  setTime,
  projectId,
  setProjectId,
  projects,
  status,
  setStatus,
  priority,
  setPriority,
  isEmpOrIntern,
  currentUser,
  assignedList,
  setAssignedList,
  availableEmployees,
}) => {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-[#2A7B76]" /> Date d'échéance *
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none font-bold text-stone-800"
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
            className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none font-bold text-stone-800"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
            <FolderKanban className="h-3.5 w-3.5 text-[#2A7B76]" /> Projet de rattachement *
          </label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none font-bold text-stone-800"
          >
            {projects.filter((p) => p.id !== 'all').map((p) => (
              <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-bold text-stone-700 mb-1">Étape initiale (Statut)</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none font-bold text-stone-800"
          >
            <option value="idea">💡 Idée</option>
            <option value="todo">📌 À faire</option>
            <option value="in_progress">⚡ En cours</option>
            <option value="pending_validation">⏳ En attente validation</option>
            <option value="blocked">🚨 Bloquée</option>
            <option value="completed">✅ Terminée</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
          <Flag className="h-3.5 w-3.5 text-[#2A7B76]" /> Priorité
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'low', label: 'Basse 🟢', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
            { id: 'medium', label: 'Moyenne 🟡', bg: 'bg-amber-50 text-amber-800 border-amber-300' },
            { id: 'high', label: 'Haute 🔴', bg: 'bg-rose-50 text-rose-800 border-rose-300' },
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

      <div>
        <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
          <User className="h-3.5 w-3.5 text-[#2A7B76]" /> Assigné à
        </label>
        {isEmpOrIntern ? (
          <input
            type="text"
            disabled
            value={currentUser?.name || assignedList[0] || 'Moi (Assignation automatique)'}
            className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-100 text-stone-700 font-bold cursor-not-allowed"
          />
        ) : (
          <div className="space-y-1.5 max-h-32 overflow-y-auto p-2 bg-stone-50 rounded-xl border border-stone-200">
            <label className="flex items-center gap-2 text-xs font-bold text-stone-800 cursor-pointer">
              <input
                type="checkbox"
                checked={assignedList.includes('Équipe')}
                onChange={(e) => {
                  if (e.target.checked) setAssignedList(['Équipe']);
                  else setAssignedList(assignedList.filter((x) => x !== 'Équipe'));
                }}
                className="rounded border-stone-300 text-[#2A7B76]"
              />
              <span>👥 Toute l'équipe</span>
            </label>
            {availableEmployees.map((emp) => (
              <label key={emp.id} className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
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
                <span>{emp.name} ({emp.department || 'Général'})</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
