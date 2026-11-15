import React from 'react';
import { Save, Calendar, User } from 'lucide-react';
import { Task, Employee, TaskStatus, TaskPriority, TaskProject } from '../../../types';

interface TaskDetailFormFieldsProps {
  task: Task;
  projects: TaskProject[];
  eligibleEmployees: Employee[];
  canReassign: boolean;
  draftTitle: string;
  setDraftTitle: (val: string) => void;
  draftDescription: string;
  setDraftDescription: (val: string) => void;
  draftStatus: TaskStatus;
  setDraftStatus: (val: TaskStatus) => void;
  draftPriority: TaskPriority;
  setDraftPriority: (val: TaskPriority) => void;
  draftProjectId: string;
  setDraftProjectId: (val: string) => void;
  draftDate: string;
  setDraftDate: (val: string) => void;
  draftAssignedList: string[];
  setDraftAssignedList: (val: string[]) => void;
}

export const TaskDetailFormFields: React.FC<TaskDetailFormFieldsProps> = ({
  task,
  projects,
  eligibleEmployees,
  canReassign,
  draftTitle,
  setDraftTitle,
  draftDescription,
  setDraftDescription,
  draftStatus,
  setDraftStatus,
  draftPriority,
  setDraftPriority,
  draftProjectId,
  setDraftProjectId,
  draftDate,
  setDraftDate,
  draftAssignedList,
  setDraftAssignedList,
}) => (
  <>
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
          <span>📌 Intitulé de la tâche *</span>
        </h3>
        <span className="text-[10px] text-stone-400 font-mono">ID: {task.id}</span>
      </div>
      <input
        type="text"
        required
        value={draftTitle}
        onChange={(e) => setDraftTitle(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50 font-serif font-bold text-stone-900 text-lg sm:text-xl focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none transition shadow-2xs"
        placeholder="Intitulé de la tâche..."
      />
    </div>

    <div>
      <label className="block text-stone-700 font-bold mb-1">Description &amp; Spécifications</label>
      <textarea
        rows={3}
        value={draftDescription}
        onChange={(e) => setDraftDescription(e.target.value)}
        placeholder="Ajouter ou modifier la description détaillée..."
        className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 focus:ring-2 focus:ring-[#2A7B76] outline-none transition"
      />
    </div>

    <div className="grid grid-cols-3 gap-2.5 bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80">
      <div>
        <label className="block text-stone-600 font-bold mb-1 text-[11px]">Étape / Statut</label>
        <select
          value={draftStatus}
          onChange={(e) => setDraftStatus(e.target.value as TaskStatus)}
          className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white font-bold text-stone-800 text-[11px] cursor-pointer"
        >
          <option value="idea">💡 Idée</option>
          <option value="todo">📌 À faire</option>
          <option value="in_progress">⚡ En cours</option>
          <option value="pending_validation">⏳ En attente</option>
          <option value="blocked">🚨 Bloquée</option>
          <option value="completed">✅ Terminée</option>
        </select>
      </div>

      <div>
        <label className="block text-stone-600 font-bold mb-1 text-[11px]">Priorité</label>
        <select
          value={draftPriority}
          onChange={(e) => setDraftPriority(e.target.value as TaskPriority)}
          className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white font-bold text-stone-800 text-[11px] cursor-pointer"
        >
          <option value="low">🟢 Basse</option>
          <option value="medium">🟡 Moyenne</option>
          <option value="high">🔴 Haute</option>
        </select>
      </div>

      <div>
        <label className="block text-stone-600 font-bold mb-1 text-[11px]">Projet / Module</label>
        <select
          value={draftProjectId}
          onChange={(e) => setDraftProjectId(e.target.value)}
          className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white font-bold text-stone-800 text-[11px] cursor-pointer"
        >
          {projects
            .filter((p) => p.id !== 'all')
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.icon || '📁'} {p.name}
              </option>
            ))}
        </select>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80">
      <div>
        <label className="block text-stone-600 font-bold mb-1 text-[11px] flex items-center gap-1">
          <Calendar className="h-3 w-3 text-[#2A7B76]" /> Échéance
        </label>
        <input
          type="date"
          value={draftDate}
          onChange={(e) => setDraftDate(e.target.value)}
          className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white font-medium text-stone-800"
        />
      </div>

      <div>
        <label className="block text-stone-600 font-bold mb-1 text-[11px] flex items-center gap-1">
          <User className="h-3 w-3 text-[#2A7B76]" /> Assigné à
        </label>
        {!canReassign ? (
          <div className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-100 text-stone-700 font-medium text-xs flex items-center justify-between">
            <span className="font-bold text-stone-800">{task.assignedTo || 'Équipe'}</span>
            <span className="text-[10px] text-stone-400 italic">Attribution fixée (non réassignable)</span>
          </div>
        ) : (
          <div className="space-y-1 max-h-32 overflow-y-auto p-1.5 bg-white rounded-lg border border-stone-200">
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-stone-800 cursor-pointer">
              <input
                type="checkbox"
                checked={draftAssignedList.includes('Équipe')}
                onChange={(e) => {
                  if (e.target.checked) setDraftAssignedList(['Équipe']);
                  else setDraftAssignedList(draftAssignedList.filter((x) => x !== 'Équipe'));
                }}
                className="rounded border-stone-300 text-[#2A7B76]"
              />
              <span>Toute l'équipe</span>
            </label>
            {eligibleEmployees.map((emp) => (
              <label key={emp.id} className="flex items-center gap-1.5 text-[11px] font-medium text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftAssignedList.includes(emp.name)}
                  onChange={(e) => {
                    let updated = draftAssignedList.filter((x) => x !== 'Équipe');
                    if (e.target.checked) updated.push(emp.name);
                    else updated = updated.filter((x) => x !== emp.name);
                    setDraftAssignedList(updated.length > 0 ? updated : ['Équipe']);
                  }}
                  className="rounded border-stone-300 text-[#2A7B76]"
                />
                <span>{emp.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>

    <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200 flex items-center justify-between">
      <span className="text-[11px] text-emerald-800 font-medium">
        Enregistrez vos changements de titre, statut, priorité ou description.
      </span>
      <button
        type="submit"
        className="bg-[#2A7B76] hover:bg-[#236864] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
      >
        <Save className="h-3.5 w-3.5" />
        <span>Enregistrer les modifications</span>
      </button>
    </div>
  </>
);
