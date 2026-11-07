import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckSquare, 
  Clock, 
  User, 
  Flag, 
  Calendar, 
  Tag, 
  CheckCircle2, 
  ListChecks, 
  Plus, 
  Trash2, 
  FolderKanban,
  FileText,
  Activity,
  Layers
} from 'lucide-react';
import { Subtask, Employee, TaskPriority, TaskStatus, Task, TaskProject, AppUser } from '../../types';
import { isSelfOnlyUser } from '../../utils/roleUtils';
import { HumaanTaskCheck } from '../illustrations/HumaanIllustrations';

interface SubtaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSubtask: (subtaskData: Subtask, targetTaskId?: string) => void;
  employees: Employee[];
  parentTask?: Task | null;
  availableTasks?: Task[];
  projects?: TaskProject[];
  defaultTaskId?: string;
  currentUser?: AppUser | null;
  currentRole?: string;
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
  currentUser,
  currentRole,
}) => {
  const isEmpOrIntern = isSelfOnlyUser(currentUser, currentRole);
  const myName = currentUser?.name || employees[0]?.name || 'Moi';

  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    parentTask?.id || defaultTaskId || availableTasks[0]?.id || ''
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [assignedTo, setAssignedTo] = useState(isEmpOrIntern ? myName : (employees[0]?.name || 'Équipe'));
  
  // Échéance : STRICTEMENT la date sans heure (ex: 01/01/2027 ou YYYY-MM-DD)
  const [dueDate, setDueDate] = useState(
    parentTask?.date || new Date().toISOString().split('T')[0]
  );
  
  const [estimatedHours, setEstimatedHours] = useState<number>(2);
  const [actualHours, setActualHours] = useState<number>(0);
  const [selectedTag, setSelectedTag] = useState<string>('Exécution');

  // Checklist des critères de validation
  const [criteria, setCriteria] = useState<string[]>([]);
  const [newCriterion, setNewCriterion] = useState('');

  useEffect(() => {
    if (isEmpOrIntern) {
      setAssignedTo(myName);
    }
  }, [isEmpOrIntern, myName]);

  // Synchronisation de la tâche parente
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

  // Format d'affichage lisible de la date sélectionnée (ex: "07/11/2026")
  const formattedDisplayDate = dueDate 
    ? new Date(dueDate + 'T00:00:00').toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '';

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
      dueDate, // Date stricte sans heure
      estimatedHours: Number(estimatedHours) || 2,
      actualHours: Number(actualHours) || 0,
      tags: [selectedTag].filter(Boolean),
      acceptanceCriteria: criteria.length > 0 ? criteria : undefined,
      subtasks: [],
      createdAt: new Date().toISOString(),
    };

    onCreateSubtask(newSubtask, selectedTaskId || currentParent?.id);

    // Réinitialisation
    setTitle('');
    setDescription('');
    setCriteria([]);
    setEstimatedHours(2);
    setActualHours(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      
      {/* Conteneur Glassmorphism Haut de Gamme */}
      <div className="bg-white/95 backdrop-blur-2xl rounded-3xl w-full max-w-xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18)] border border-white/80 overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* HEADER ÉPURÉ & MODERNE */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-[#2A7B76]/10 border-b border-stone-200/60 shrink-0">
          
          {/* Micro illustration Humaan subtile en arrière-plan */}
          <div className="absolute top-2 right-14 pointer-events-none opacity-40 hidden sm:block">
            <HumaanTaskCheck className="w-16 h-16" />
          </div>

          <div className="flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#2A7B76] text-white flex items-center justify-center shadow-md shadow-[#2A7B76]/20 shrink-0">
                <CheckSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-stone-900 tracking-tight">
                  Nouvelle sous-tâche
                </h3>
                <p className="text-xs text-stone-500 font-medium">
                  Découpage opérationnel et suivi du rendement
                </p>
              </div>
            </div>

            {/* Bouton Fermer Glassmorphism */}
            <button
              onClick={onClose}
              type="button"
              className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-900 flex items-center justify-center transition cursor-pointer border border-stone-200/60"
              title="Fermer la fenêtre"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Badge discret Tâche Parente */}
          <div className="mt-3.5 flex items-center gap-2 text-xs">
            <span className="text-stone-500 font-medium flex items-center gap-1.5 shrink-0">
              <FolderKanban className="h-3.5 w-3.5 text-[#2A7B76]" />
              Tâche parente :
            </span>
            {parentTask ? (
              <span className="font-bold text-stone-800 bg-white/80 px-2.5 py-1 rounded-xl border border-stone-200/80 truncate max-w-xs shadow-2xs">
                {parentTask.title}
              </span>
            ) : availableTasks.length > 0 ? (
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="bg-white/90 text-stone-800 font-bold rounded-xl px-2.5 py-1 border border-stone-200/80 text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none cursor-pointer max-w-xs truncate shadow-2xs"
              >
                {availableTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            ) : (
              <span className="italic text-stone-400">Tâche active</span>
            )}

            {matchedProject && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-[#2A7B76] bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/60 ml-auto">
                {matchedProject.icon || '📁'} {matchedProject.name}
              </span>
            )}
          </div>
        </div>

        {/* CORPS DU FORMULAIRE */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4.5 text-xs">
          
          {/* 1. INTITULÉ DE LA SOUS-TÂCHE */}
          <div className="space-y-1.5">
            <label className="block font-bold text-stone-800 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-[#2A7B76]" />
                Intitulé de la sous-tâche <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10px] font-normal text-stone-400">Action unitaire précise</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ex: Rédiger la synthèse d'audit, Valider la maquette, Préparer l'envoi..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-stone-50/70 focus:bg-white focus:border-[#2A7B76] focus:ring-2 focus:ring-[#2A7B76]/20 text-stone-900 font-semibold text-xs outline-none transition shadow-2xs"
            />
          </div>

          {/* 2. DESCRIPTION */}
          <div className="space-y-1.5">
            <label className="block font-bold text-stone-700 text-xs">
              Description & Spécifications
            </label>
            <textarea
              rows={2}
              placeholder="Instructions, consignes particulières, contexte ou livrable attendu..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-2xl border border-stone-200 bg-stone-50/70 focus:bg-white focus:border-[#2A7B76] focus:ring-2 focus:ring-[#2A7B76]/20 outline-none text-xs text-stone-800 transition shadow-2xs resize-none"
            />
          </div>

          {/* 3. NIVEAU DE PRIORITÉ */}
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

          {/* 4 & 5. STATUT & CATÉGORIE */}
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

          {/* 6 & 7. CHARGE HORAIRE & TEMPS RÉEL PASSÉ */}
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
              {/* Charge horaire estimée */}
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

              {/* Temps réel passé */}
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

          {/* 8 & 9. RESPONSABLE & ÉCHÉANCE (STRICTEMENT DATE SANS HEURE) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Responsable */}
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

            {/* Échéance (Uniquement la date, format JJ/MM/AAAA sans heure) */}
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

          {/* 10. CRITÈRES DE VALIDATION (CHECKLIST) */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-stone-50/60 border border-stone-200/80">
            <label className="font-bold text-stone-700 text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ListChecks className="h-3.5 w-3.5 text-[#2A7B76]" />
                Critères de validation
              </span>
              <span className="text-[10px] text-stone-500 font-semibold">
                {criteria.length} critère{criteria.length > 1 ? 's' : ''}
              </span>
            </label>

            {/* Liste des critères existants */}
            {criteria.length > 0 && (
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {criteria.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-stone-200 text-xs shadow-3xs group hover:border-emerald-200 transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#2A7B76] shrink-0" />
                      <span className="text-stone-800 truncate font-medium">{item}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCriterion(idx)}
                      className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer transition rounded-lg hover:bg-rose-50"
                      title="Supprimer ce critère"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Champ d'ajout rapide de critère */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Ajouter un critère (ex: Relecture effectuée, Fichier annexé)..."
                value={newCriterion}
                onChange={(e) => setNewCriterion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCriterion();
                  }
                }}
                className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs outline-none focus:border-[#2A7B76] focus:ring-1 focus:ring-[#2A7B76] shadow-2xs"
              />
              <button
                type="button"
                onClick={handleAddCriterion}
                className="px-3 py-2 bg-[#2A7B76]/10 hover:bg-[#2A7B76] text-[#2A7B76] hover:text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 active:scale-95 shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Ajouter</span>
              </button>
            </div>
          </div>

          {/* PIED DU MODAL / ACTIONS */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-200/60">
            <span className="text-[11px] text-stone-400 hidden sm:inline">
              Sous-tâche comptabilisée dans le calcul du rendement.
            </span>
            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#2A7B76] hover:bg-[#20635F] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md shadow-[#2A7B76]/25 flex items-center gap-1.5 active:scale-98"
              >
                <CheckSquare className="h-4 w-4" />
                <span>Créer la sous-tâche</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};

export default SubtaskCreateModal;
