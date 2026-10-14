import React, { useState, useEffect } from 'react';
import { X, CheckSquare } from 'lucide-react';
import { Task, Employee, TaskStatus, TaskPriority, TaskProject, AppUser } from '../../types';

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (taskData: Omit<Task, 'id' | 'subtasks' | 'comments' | 'incidents'>) => void;
  employees: Employee[];
  projects: TaskProject[];
  defaultProjectId?: string;
  defaultStatus?: TaskStatus;
  isMilestoneDefault?: boolean;
  currentRole?: string;
  currentUser?: AppUser | null;
}

export const TaskCreateModal: React.FC<TaskCreateModalProps> = ({
  isOpen,
  onClose,
  onCreateTask,
  employees,
  projects,
  defaultProjectId = 'general',
  defaultStatus = 'todo',
  currentRole,
  currentUser,
}) => {
  const isEmployee = currentRole === 'employé' || (currentUser && currentUser.role === 'employé');
  const defaultAssigneeName = currentUser?.name || employees[0]?.name || 'Équipe';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId !== 'all' ? defaultProjectId : 'general');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [reminderPeriod, setReminderPeriod] = useState<string>('none');
  const [assignedList, setAssignedList] = useState<string[]>(isEmployee ? [defaultAssigneeName] : ['Équipe']);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00');

  useEffect(() => {
    if (isEmployee && currentUser) {
      setAssignedList([currentUser.name || defaultAssigneeName]);
    }
  }, [isEmployee, currentUser]);

  if (!isOpen) return null;

  // Filter assignees based on selected project members
  const selectedProj = projects.find((p) => p.id === projectId);
  const availableEmployees = selectedProj && selectedProj.memberIds && selectedProj.memberIds.length > 0
    ? employees.filter((e) => selectedProj.memberIds!.includes(e.id))
    : employees;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalAssigned = isEmployee 
      ? (currentUser?.name || assignedList[0] || 'Moi') 
      : (assignedList.length > 0 ? assignedList.join(', ') : 'Équipe');

    onCreateTask({
      title: title.trim(),
      description: description.trim(),
      date,
      time,
      priority,
      status,
      assignedTo: finalAssigned,
      projectId: projectId || 'general',
      reminderPeriod,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-stone-200 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100/70 text-[#2A7B76] rounded-xl">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Créer une Nouvelle Tâche
              </h3>
              <p className="text-[11px] text-stone-400">Action opérationnelle rattachée à un projet d'entreprise</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:bg-stone-100 cursor-pointer transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-stone-700 mb-1">
              Titre de la tâche *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Rédiger le compte-rendu hebdomadaire, Préparer l'audit..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none text-stone-900 font-semibold"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Description & Consignes (Optionnel)</label>
            <textarea
              rows={2}
              placeholder="Détails, spécifications, livrables attendus..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Date d'échéance</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none font-bold text-stone-800"
              />
            </div>
            <div>
              <label className="block font-bold text-stone-700 mb-1">Heure de sonnerie / rappel</label>
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
              <label className="block font-bold text-stone-700 mb-1">Projet de rattachement *</label>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Priorité</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none font-bold"
              >
                <option value="low">🟢 Basse</option>
                <option value="medium">🟡 Moyenne</option>
                <option value="high">🔴 Haute</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-stone-700 mb-1">Période de rappel</label>
              <select
                value={reminderPeriod}
                onChange={(e) => setReminderPeriod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none font-bold text-stone-800"
              >
                <option value="none">Aucun rappel</option>
                <option value="1h">1 heure avant</option>
                <option value="1d">1 jour avant</option>
                <option value="morning">Le matin de l'échéance</option>
                <option value="every_day">Rappel quotidien</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block font-bold text-stone-700 mb-1">Assigné à</label>
            {isEmployee ? (
              <input
                type="text"
                disabled
                value={currentUser?.name || assignedList[0] || 'Moi (Assignation automatique)'}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-100 text-stone-700 font-bold cursor-not-allowed"
              />
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 bg-stone-50 rounded-xl border border-stone-200">
                <label className="flex items-center gap-2 text-xs font-bold text-stone-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assignedList.includes('Équipe')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAssignedList(['Équipe']);
                      } else {
                        setAssignedList(assignedList.filter(x => x !== 'Équipe'));
                      }
                    }}
                    className="rounded border-stone-300 text-[#2A7B76]"
                  />
                  <span>Toute l'équipe</span>
                </label>
                {availableEmployees.map((emp) => (
                  <label key={emp.id} className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assignedList.includes(emp.name)}
                      onChange={(e) => {
                        let updated = assignedList.filter(x => x !== 'Équipe');
                        if (e.target.checked) {
                          updated.push(emp.name);
                        } else {
                          updated = updated.filter(x => x !== emp.name);
                        }
                        setAssignedList(updated.length > 0 ? updated : ['Équipe']);
                      }}
                      className="rounded border-stone-300 text-[#2A7B76]"
                    />
                    <span>{emp.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 font-bold transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="bg-[#2A7B76] hover:bg-[#23635f] text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer flex items-center gap-2"
            >
              Créer la tâche
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
