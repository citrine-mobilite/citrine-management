import React from 'react';
import { Clock, User, Flag, Calendar, Tag, Activity } from 'lucide-react';
import { Employee, TaskPriority, TaskStatus } from '../../../types';

interface SubtaskTimingAndStatusFieldsProps {
  priority: TaskPriority;
  setPriority: (v: TaskPriority) => void;
  status: TaskStatus;
  setStatus: (v: TaskStatus) => void;
  selectedTag: string;
  setSelectedTag: (v: string) => void;
  estimatedHours: number;
  setEstimatedHours: (v: number) => void;
  actualHours: number;
  setActualHours: (v: number) => void;
  isEmpOrIntern: boolean;
  myName: string;
  assignedTo: string;
  setAssignedTo: (v: string) => void;
  employees: Employee[];
  dueDate: string;
  setDueDate: (v: string) => void;
  formattedDisplayDate: string;
}

export const SubtaskTimingAndStatusFields: React.FC<SubtaskTimingAndStatusFieldsProps> = ({
  priority,
  setPriority,
  status,
  setStatus,
  selectedTag,
  setSelectedTag,
  estimatedHours,
  setEstimatedHours,
  actualHours,
  setActualHours,
  isEmpOrIntern,
  myName,
  assignedTo,
  setAssignedTo,
  employees,
  dueDate,
  setDueDate,
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
            { id: 'low', label: 'Basse', icon: '🟢', border: 'border-emerald-300', bg: 'bg-emerald-50 text-emerald-800' },
            { id: 'medium', label: 'Moyenne', icon: '🟡', border: 'border-amber-300', bg: 'bg-amber-50 text-amber-800' },
            { id: 'high', label: 'Haute', icon: '🔴', border: 'border-rose-300', bg: 'bg-rose-50 text-rose-800' },
            { id: 'urgent', label: 'Urgente', icon: '⚡', border: 'border-purple-300', bg: 'bg-purple-50 text-purple-900' },
          ].map((p) => {
            const isSelected = priority === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPriority(p.id as TaskPriority)}
                className={`py-2 px-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-0.5 ${
                  isSelected
                    ? `${p.bg} ${p.border} font-bold ring-2 ring-[#2A7B76]/30 shadow-xs scale-102`
                    : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-600'
                }`}
              >
                <span className="text-xs">{p.icon}</span>
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
            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50/70 focus:bg-white focus:border-[#2A7B76] font-bold text-stone-800 outline-none transition shadow-2xs"
          >
            <option value="todo">📌 À faire</option>
            <option value="in_progress">⚡ En cours</option>
            <option value="pending_validation">⏳ En attente validation</option>
            <option value="blocked">🚨 Bloquée</option>
            <option value="completed">✅ Déjà terminée</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block font-bold text-stone-700 flex items-center gap-1.5 text-xs">
            <Tag className="h-3.5 w-3.5 text-[#2A7B76]" />
            Catégorie
          </label>
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50/70 focus:bg-white focus:border-[#2A7B76] font-semibold text-stone-800 outline-none transition shadow-2xs"
          >
            <option value="Exécution">⚡ Exécution opérationnelle</option>
            <option value="Contrôle">🔍 Contrôle & Validation</option>
            <option value="Rédaction">✍️ Rédaction & Documentation</option>
            <option value="Design">🎨 Design & Visuels</option>
            <option value="Technique">💻 Technique / IT</option>
            <option value="Coordination">🤝 Coordination RH</option>
          </select>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-[#2A7B76]" />
            Suivi du Temps & Capacité
          </label>
          <span className="text-[10px] text-stone-400 font-medium">
            Pris en compte dans la feuille de tâches
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          <div>
            <span className="text-[11px] font-semibold text-stone-600 block mb-1.5">
              Charge horaire prévue (Heures) <span className="text-rose-500">*</span>
            </span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 4, 8].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setEstimatedHours(h)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                    estimatedHours === h
                      ? 'bg-[#2A7B76] text-white shadow-2xs'
                      : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {h}h
                </button>
              ))}
              <input
                type="number"
                min={0.5}
                max={120}
                step={0.5}
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value))}
                className="w-16 px-2 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-mono font-bold text-stone-800 outline-none text-center focus:border-[#2A7B76]"
              />
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-stone-600 block mb-1.5">
              Temps réel déjà passé (Heures)
            </span>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={120}
                step={0.5}
                value={actualHours}
                onChange={(e) => setActualHours(Number(e.target.value))}
                placeholder="0"
                className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-mono font-bold text-stone-800 outline-none focus:border-[#2A7B76]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-stone-400">
                h
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <label className="block font-bold text-stone-700 flex items-center gap-1.5 text-xs">
            <User className="h-3.5 w-3.5 text-[#2A7B76]" />
            Responsable
          </label>
          {isEmpOrIntern ? (
            <div className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-100 text-stone-700 font-bold text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="truncate">{myName} (Moi-même)</span>
            </div>
          ) : (
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50/70 focus:bg-white focus:border-[#2A7B76] font-semibold text-stone-800 outline-none transition shadow-2xs"
            >
              <option value="Équipe">👥 Toute l'équipe</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.name}>
                  {emp.name} ({emp.department || 'Général'})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block font-bold text-stone-700 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#2A7B76]" />
              Échéance (Date)
            </span>
            {formattedDisplayDate && (
              <span className="text-[10px] font-mono font-bold text-[#2A7B76] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50">
                {formattedDisplayDate}
              </span>
            )}
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50/70 focus:bg-white focus:border-[#2A7B76] font-mono font-bold text-stone-800 outline-none text-xs transition shadow-2xs"
          />
        </div>
      </div>
    </>
  );
};
