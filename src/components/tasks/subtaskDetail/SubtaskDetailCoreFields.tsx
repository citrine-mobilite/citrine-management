import React from 'react';
import { Calendar, User, Clock, Flag } from 'lucide-react';
import { Employee, Subtask, TaskPriority, TaskStatus } from '../../../types';

interface SubtaskDetailCoreFieldsProps {
  subtask: Subtask;
  canReassign: boolean;
  employees: Employee[];
  draftTitle: string;
  setDraftTitle: (v: string) => void;
  draftDescription: string;
  setDraftDescription: (v: string) => void;
  draftStatus: TaskStatus;
  setDraftStatus: (v: TaskStatus) => void;
  setIsBlocked: (v: boolean) => void;
  draftPriority: TaskPriority;
  setDraftPriority: (v: TaskPriority) => void;
  draftStartDate: string;
  setDraftStartDate: (v: string) => void;
  draftDueDate: string;
  setDraftDueDate: (v: string) => void;
  draftTime: string;
  setDraftTime: (v: string) => void;
  draftAssignedTo: string;
  setDraftAssignedTo: (v: string) => void;
}

export const SubtaskDetailCoreFields: React.FC<SubtaskDetailCoreFieldsProps> = ({
  subtask,
  canReassign,
  employees,
  draftTitle,
  setDraftTitle,
  draftDescription,
  setDraftDescription,
  draftStatus,
  setDraftStatus,
  setIsBlocked,
  draftPriority,
  setDraftPriority,
  draftStartDate,
  setDraftStartDate,
  draftDueDate,
  setDraftDueDate,
  draftTime,
  setDraftTime,
  draftAssignedTo,
  setDraftAssignedTo,
}) => {
  return (
    <>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
            <span>Intitulé de la sous-tâche *</span>
          </h3>
          <span className="text-[10px] text-stone-400 font-mono">ID: {subtask.id}</span>
        </div>
        <input
          type="text"
          required
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50 font-serif font-bold text-stone-900 text-lg sm:text-xl focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none transition shadow-2xs"
          placeholder="Ex: Rédiger le rapport technique, Réparer le compteur..."
        />
      </div>

      <div>
        <label className="block text-stone-700 font-bold mb-1">Description &amp; Spécifications</label>
        <textarea
          rows={3}
          value={draftDescription}
          onChange={(e) => setDraftDescription(e.target.value)}
          placeholder="Détails, consignes ou remarques opérationnelles..."
          className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 focus:ring-2 focus:ring-[#2A7B76] outline-none transition"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80">
        <div>
          <label className="block text-stone-600 font-bold mb-1 text-[11px]">Statut</label>
          <select
            value={draftStatus}
            onChange={(e) => {
              const val = e.target.value as TaskStatus;
              setDraftStatus(val);
              if (val === 'blocked') setIsBlocked(true);
            }}
            className="w-full px-2.5 py-2 rounded-lg border border-stone-200 bg-white font-bold text-stone-800 text-[11px] cursor-pointer"
          >
            <option value="idea">💡 Idée</option>
            <option value="todo">📌 À faire</option>
            <option value="in_progress">⚡ En cours</option>
            <option value="pending_validation">⏳ En validation</option>
            <option value="blocked">🚨 Bloquée</option>
            <option value="completed">✅ Terminée</option>
          </select>
        </div>

        <div>
          <label className="block text-stone-600 font-bold mb-1 text-[11px] flex items-center gap-1">
            <Flag className="h-3 w-3 text-[#2A7B76]" /> Priorité
          </label>
          <select
            value={draftPriority}
            onChange={(e) => setDraftPriority(e.target.value as TaskPriority)}
            className="w-full px-2.5 py-2 rounded-lg border border-stone-200 bg-white font-bold text-stone-800 text-[11px] cursor-pointer"
          >
            <option value="low">🟢 Basse</option>
            <option value="medium">🟡 Moyenne</option>
            <option value="high">🔴 Haute</option>
            <option value="urgent">⚡ Urgente</option>
          </select>
        </div>

        <div>
          <label className="block text-stone-600 font-bold mb-1 text-[11px] flex items-center gap-1">
            <User className="h-3 w-3 text-[#2A7B76]" /> Assigné à
          </label>
          {canReassign ? (
            <select
              value={draftAssignedTo}
              onChange={(e) => setDraftAssignedTo(e.target.value)}
              className="w-full px-2.5 py-2 rounded-lg border border-stone-200 bg-white font-medium text-stone-800 text-[11px]"
            >
              <option value="Équipe">Toute l&apos;équipe</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.name}>
                  {emp.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="w-full px-2.5 py-2 rounded-lg border border-stone-200 bg-stone-100 text-stone-700 font-medium text-[11px] flex items-center justify-between">
              <span className="font-bold text-stone-800 truncate">{subtask.assignedTo || 'Équipe'}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-200/85">
        <div>
          <label className="block text-stone-600 font-bold mb-1 text-[11px] flex items-center gap-1">
            <Calendar className="h-3 w-3 text-[#2A7B76]" /> Date de début
          </label>
          <input
            type="date"
            value={draftStartDate}
            onChange={(e) => setDraftStartDate(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white font-medium text-stone-800"
          />
        </div>

        <div>
          <label className="block text-stone-600 font-bold mb-1 text-[11px] flex items-center gap-1">
            <Calendar className="h-3 w-3 text-rose-600" /> Échéance
          </label>
          <input
            type="date"
            value={draftDueDate}
            onChange={(e) => setDraftDueDate(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white font-medium text-stone-800"
          />
        </div>

        <div>
          <label className="block text-stone-600 font-bold mb-1 text-[11px] flex items-center gap-1">
            <Clock className="h-3 w-3 text-[#2A7B76]" /> Heure limite
          </label>
          <input
            type="time"
            value={draftTime}
            onChange={(e) => setDraftTime(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white font-mono font-medium text-stone-800"
          />
        </div>
      </div>
    </>
  );
};
