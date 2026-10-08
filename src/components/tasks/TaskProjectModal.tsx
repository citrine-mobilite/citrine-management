import React, { useState } from 'react';
import { X, Save, FolderPlus, Users, ShieldAlert } from 'lucide-react';
import { TaskProject, Employee } from '../../types';

interface TaskProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProject: (project: TaskProject) => void;
  employees: Employee[];
}

export const TaskProjectModal: React.FC<TaskProjectModalProps> = ({
  isOpen,
  onClose,
  onSaveProject,
  employees,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📊');
  const [restrictMembers, setRestrictMembers] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleToggleMember = (empId: string) => {
    if (selectedMemberIds.includes(empId)) {
      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== empId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, empId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProject: TaskProject = {
      id: `proj-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      icon: icon || '📁',
      createdAt: new Date().toISOString(),
      memberIds: restrictMembers ? selectedMemberIds : [], // Empty means accessible to all
    };

    onSaveProject(newProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-[#2A7B76]" />
            <h3 className="font-serif font-bold text-base text-stone-900">
              Créer un Nouveau Projet
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-stone-400 hover:bg-stone-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-stone-700 mb-1">
              Nom du projet *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Prévision Budgétaire, Refonte Site, Marketing Q4..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Icône Emoji du projet</label>
            <div className="flex flex-wrap items-center gap-2">
              {['📊', '🚀', '📌', '💼', '💡', '🔥', '🎯', '👥', '⚡', '🏆', '📈', '🔬'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition cursor-pointer ${
                    icon === emoji
                      ? 'border-[#2A7B76] bg-emerald-50 scale-105 ring-2 ring-[#2A7B76]/30'
                      : 'border-stone-200 bg-white hover:bg-stone-50'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Description & Objectifs (Optionnel)</label>
            <textarea
              rows={2}
              placeholder="Objectif et périmètre de ce projet d'entreprise..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none"
            />
          </div>

          {/* Restriction d'accès : Ensemble de personnes membres */}
          <div className="space-y-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80">
            <div className="flex items-center justify-between">
              <label className="font-bold text-stone-800 flex items-center gap-1.5 cursor-pointer">
                <Users className="h-4 w-4 text-[#2A7B76]" />
                <span>Restreindre à des collaborateurs spécifiques</span>
              </label>
              <input
                type="checkbox"
                checked={restrictMembers}
                onChange={(e) => setRestrictMembers(e.target.checked)}
                className="w-4 h-4 rounded text-[#2A7B76] focus:ring-[#2A7B76] cursor-pointer"
              />
            </div>

            <p className="text-[11px] text-stone-500">
              {restrictMembers
                ? 'Seuls les collaborateurs cochés ci-dessous auront accès à ce projet et à ses tâches associées.'
                : 'Projet ouvert : visible et accessible à toute l\'équipe.'}
            </p>

            {restrictMembers && (
              <div className="space-y-2 pt-2 border-t border-stone-200/60 max-h-48 overflow-y-auto">
                <div className="text-[10px] uppercase font-bold text-stone-400">
                  Sélectionner les membres du projet ({selectedMemberIds.length} sélectionnés) :
                </div>
                {employees.map((emp) => {
                  const isSelected = selectedMemberIds.includes(emp.id);
                  return (
                    <div
                      key={emp.id}
                      onClick={() => handleToggleMember(emp.id)}
                      className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                          : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center text-[10px] font-bold">
                          {emp.name.slice(0, 1)}
                        </span>
                        <span>{emp.name}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded text-[#2A7B76] pointer-events-none"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-bold cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#2A7B76] text-white hover:bg-[#236864] font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Save className="h-4 w-4" />
              Créer le Projet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
