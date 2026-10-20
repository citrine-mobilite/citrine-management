import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckSquare, 
  Clock, 
  User, 
  Flag, 
  Calendar, 
  Sparkles, 
  Tag, 
  CheckCircle2, 
  ListChecks, 
  Plus, 
  Trash2, 
  AlertCircle,
  FolderKanban,
  FileCheck
} from 'lucide-react';
import { Subtask, Employee, TaskPriority, TaskStatus, Task, TaskProject } from '../../types';

interface SubtaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSubtask: (subtaskData: Subtask, targetTaskId?: string) => void;
  employees: Employee[];
  parentTask?: Task | null;
  availableTasks?: Task[];
  projects?: TaskProject[];
  defaultTaskId?: string;
}

export const SubtaskCreateModal: React.FC<SubtaskCreateModalProps> = ({
  isOpen,
  onClose,
  onCreateSubtask,
  employees,
  parentTask,
  availableTasks = [],
  projects = [],
  defaultTaskId,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    parentTask?.id || defaultTaskId || availableTasks[0]?.id || ''
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deliverable, setDeliverable] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [assignedTo, setAssignedTo] = useState(employees[0]?.name || 'Équipe');
  const [dueDate, setDueDate] = useState(
    parentTask?.date || new Date().toISOString().split('T')[0]
  );
  const [dueTime, setDueTime] = useState('17:00');
  const [estimatedHours, setEstimatedHours] = useState<number>(3);
  const [actualHours, setActualHours] = useState<number>(0);
  const [selectedTag, setSelectedTag] = useState<string>('Exécution');
  
  // Checklist / Acceptance criteria
  const [criteria, setCriteria] = useState<string[]>([]);
  const [newCriterion, setNewCriterion] = useState('');

  // Sync selected task when modal opens or parentTask changes
  useEffect(() => {
    if (parentTask) {
      setSelectedTaskId(parentTask.id);
      if (parentTask.date) setDueDate(parentTask.date);
    } else if (defaultTaskId) {
      setSelectedTaskId(defaultTaskId);
    } else if (availableTasks.length > 0 && !selectedTaskId) {
      setSelectedTaskId(availableTasks[0].id);
    }
  }, [parentTask, defaultTaskId, availableTasks]);

  if (!isOpen) return null;

  const currentParent = parentTask || availableTasks.find((t) => t.id === selectedTaskId);
  const matchedProject = projects.find((p) => p.id === currentParent?.projectId);

  const handleAddCriterion = () => {
    if (!newCriterion.trim()) return;
    setCriteria([...criteria, newCriterion.trim()]);
    setNewCriterion('');
  };

  const handleRemoveCriterion = (idx: number) => {
    setCriteria(criteria.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const assignedEmp = employees.find((e) => e.name === assignedTo);

    const newSubtask: Subtask = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      completed: status === 'completed',
      description: description.trim() || undefined,
      priority,
      status,
      assignedTo,
      employeeId: assignedEmp?.id,
      dueDate,
      time: dueTime,
      estimatedHours: Number(estimatedHours) || 2,
      actualHours: Number(actualHours) || 0,
      tags: [selectedTag].filter(Boolean),
      acceptanceCriteria: criteria.length > 0 ? criteria : (deliverable ? [deliverable] : undefined),
      subtasks: [],
      createdAt: new Date().toISOString(),
    };

    onCreateSubtask(newSubtask, selectedTaskId || currentParent?.id);
    
    // Reset form
    setTitle('');
    setDescription('');
    setDeliverable('');
    setCriteria([]);
    setEstimatedHours(3);
    setActualHours(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Asana Executive Header Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-[#2A7B76] to-emerald-900 p-5 text-white relative shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
                <Sparkles className="h-5 w-5 text-amber-300 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-indigo-100 border border-white/10">
                    Mode Asana Pro • Sous-Tâche
                  </span>
                  {matchedProject && (
                    <span className="text-[10px] font-medium text-emerald-200 flex items-center gap-1">
                      {matchedProject.icon || '📁'} {matchedProject.name}
                    </span>
                  )}
                </div>
                <h3 className="font-serif font-bold text-lg sm:text-xl text-white mt-0.5">
                  Créer une Sous-Tâche Haute Précision
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
              title="Fermer la fenêtre"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Parent Task Highlight */}
          <div className="mt-3.5 bg-black/20 backdrop-blur-xs rounded-xl p-2.5 border border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <FolderKanban className="h-4 w-4 text-emerald-300 shrink-0" />
              <span className="text-white/70 font-medium shrink-0">Tâche Parente :</span>
              {parentTask ? (
                <span className="font-bold text-white truncate max-w-xs">{parentTask.title}</span>
              ) : availableTasks.length > 0 ? (
                <select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="bg-white/10 text-white font-bold rounded-lg px-2 py-1 border border-white/20 text-xs focus:bg-stone-800 outline-none cursor-pointer"
                >
                  {availableTasks.map((t) => (
                    <option key={t.id} value={t.id} className="text-stone-900 bg-white">
                      {t.title}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="italic text-white/70">Tâche active sélectionnée</span>
              )}
            </div>
            {currentParent?.isMilestone && (
              <span className="bg-amber-400/20 text-amber-200 border border-amber-300/30 px-2 py-0.5 rounded-md text-[10px] font-bold">
                🎯 Jalon Lié
              </span>
            )}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Title */}
          <div>
            <label className="block font-bold text-stone-800 mb-1 flex items-center justify-between">
              <span>Intitulé précis de la sous-tâche *</span>
              <span className="text-[10px] font-normal text-stone-400">Action unitaire mesurable</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                autoFocus
                placeholder="Ex: Rédiger la section 3 du rapport d'audit, Valider la conformité légale..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] text-stone-900 font-semibold text-xs outline-none shadow-2xs transition"
              />
            </div>
          </div>

          {/* Description & Deliverables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Instructions & Spécifications
              </label>
              <textarea
                rows={2}
                placeholder="Méthodologie, contraintes, contexte..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                <FileCheck className="h-3.5 w-3.5 text-[#2A7B76]" />
                Livrable attendu (Définition de fini)
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Fichier PDF validé, pull request approuvée, email envoyé..."
                value={deliverable}
                onChange={(e) => setDeliverable(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none text-xs"
              />
            </div>
          </div>

          {/* Priority selector cards */}
          <div>
            <label className="block font-bold text-stone-700 mb-1.5 flex items-center gap-1">
              <Flag className="h-3.5 w-3.5 text-[#2A7B76]" />
              Niveau de Priorité Opérationnelle
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
                    className={`py-2 px-2 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-0.5 ${
                      isSelected
                        ? `${p.bg} ${p.border} font-bold ring-2 ring-offset-1 ring-[#2A7B76] shadow-2xs`
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

          {/* Status & Tag */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Étape Initiale (Statut)</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-bold text-stone-800 outline-none"
              >
                <option value="todo">📌 À faire</option>
                <option value="in_progress">⚡ En cours</option>
                <option value="pending_validation">⏳ En attente validation</option>
                <option value="blocked">🚨 Bloquée</option>
                <option value="completed">✅ Déjà terminée</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Tag className="h-3.5 w-3.5 text-[#2A7B76]" /> Catégorie / Tag
              </label>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-semibold text-stone-800 outline-none"
              >
                <option value="Exécution">⚡ Exécution</option>
                <option value="Contrôle">🔍 Contrôle & Validation</option>
                <option value="Rédaction">✍️ Rédaction & Doc</option>
                <option value="Design">🎨 Design & Visuel</option>
                <option value="Technique">💻 Technique / IT</option>
                <option value="Coordination">🤝 Coordination RH</option>
              </select>
            </div>
          </div>

          {/* Time & Capacity (Asana Workload Style) */}
          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-stone-800 text-[11px] flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#2A7B76]" />
                Charge Horaire & Suivi du Temps
              </label>
              <span className="text-[10px] text-stone-500 font-mono">
                Impact direct sur la charge globale
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[10px] font-semibold text-stone-500 block mb-1">
                  Temps estimé (Heures) *
                </span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 4, 8].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setEstimatedHours(h)}
                      className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
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
                    className="w-16 px-2 py-1 bg-white border border-stone-200 rounded-lg text-xs font-mono font-bold text-stone-800 outline-none text-center"
                  />
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-stone-500 block mb-1">
                  Temps déjà passé (Réel)
                </span>
                <input
                  type="number"
                  min={0}
                  max={120}
                  step={0.5}
                  value={actualHours}
                  onChange={(e) => setActualHours(Number(e.target.value))}
                  placeholder="0h"
                  className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-mono font-bold text-stone-800 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Assignee & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-[#2A7B76]" /> Responsable Assigné
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-semibold text-stone-800 outline-none"
              >
                <option value="Équipe">👥 Toute l'équipe</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name} ({emp.department || 'Général'})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-[#2A7B76]" /> Échéance
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-mono font-bold text-stone-800 outline-none text-[11px]"
                />
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">Heure limite</label>
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-mono font-bold text-stone-800 outline-none text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Acceptance Criteria Checklist (Asana style) */}
          <div className="space-y-2 bg-stone-50/70 p-3 rounded-2xl border border-stone-200/80">
            <label className="font-bold text-stone-700 text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ListChecks className="h-3.5 w-3.5 text-[#2A7B76]" />
                Critères de validation / Mini-Checklist
              </span>
              <span className="text-[10px] text-stone-400 font-normal">
                {criteria.length} point(s)
              </span>
            </label>

            <div className="space-y-1.5 max-h-28 overflow-y-auto">
              {criteria.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#2A7B76] shrink-0" />
                    <span className="text-stone-800 truncate">{item}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCriterion(idx)}
                    className="text-stone-400 hover:text-rose-600 p-0.5 cursor-pointer transition"
                    title="Supprimer ce critère"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-1.5 pt-1">
              <input
                type="text"
                placeholder="Ajouter un point de contrôle..."
                value={newCriterion}
                onChange={(e) => setNewCriterion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCriterion();
                  }
                }}
                className="flex-1 px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs outline-none focus:border-[#2A7B76]"
              />
              <button
                type="button"
                onClick={handleAddCriterion}
                className="px-2.5 py-1.5 bg-stone-200 hover:bg-[#2A7B76] hover:text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                <span>Ajouter</span>
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-stone-100">
            <span className="text-[11px] text-stone-400 italic hidden sm:inline">
              La sous-tâche sera synchronisée en temps réel et intégrée aux KPI Asana.
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#2A7B76] hover:bg-[#20635F] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md flex items-center gap-1.5 active:scale-98"
              >
                <CheckSquare className="h-4 w-4" />
                <span>Créer la Sous-Tâche</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};

export default SubtaskCreateModal;
