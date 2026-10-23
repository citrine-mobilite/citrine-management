import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Trash2, 
  MessageSquare, 
  CheckCircle2, 
  Calendar,
  User,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Flag
} from 'lucide-react';
import { Subtask, Employee, TaskStatus, TaskPriority, TaskProject, Comment, AppUser, Incident } from '../../types';
import { canManageTaskAssignment, isSelfOnlyUser } from '../../utils/roleUtils';

interface SubtaskDetailModalProps {
  isOpen: boolean;
  subtask: Subtask | null;
  onClose: () => void;
  onSaveSubtask: (updatedSubtask: Subtask) => void;
  employees: Employee[];
  projects?: TaskProject[];
  showToast?: (message: string, type?: 'success' | 'error') => void;
  currentUser?: AppUser | null;
  currentRole?: string;
}

export const SubtaskDetailModal: React.FC<SubtaskDetailModalProps> = ({
  isOpen,
  subtask,
  onClose,
  onSaveSubtask,
  employees,
  projects = [],
  showToast,
  currentUser,
  currentRole,
}) => {
  if (!isOpen || !subtask) return null;

  const canReassign = canManageTaskAssignment(currentUser, currentRole);
  const isEmpOrIntern = isSelfOnlyUser(currentUser, currentRole);
  const isAssignedToCurrentUser = !currentUser || !subtask.assignedTo || subtask.assignedTo.includes(currentUser.name) || subtask.assignedTo === 'Équipe' || isEmpOrIntern;

  // Form states matching user exact requirements:
  // nom, description, statut, priorité, date debut, date fin (échéance), temps en heures passées, blocage, commentaires
  const [draftTitle, setDraftTitle] = useState(subtask.title);
  const [draftDescription, setDraftDescription] = useState(subtask.description || '');
  const [draftStatus, setDraftStatus] = useState<TaskStatus>(subtask.status || (subtask.completed ? 'completed' : 'todo'));
  const [draftPriority, setDraftPriority] = useState<TaskPriority>(subtask.priority || 'medium');
  const [draftAssignedTo, setDraftAssignedTo] = useState(subtask.assignedTo || 'Équipe');
  const [draftStartDate, setDraftStartDate] = useState(subtask.startDate || new Date().toISOString().split('T')[0]);
  const [draftDueDate, setDraftDueDate] = useState(subtask.dueDate || subtask.endDate || new Date().toISOString().split('T')[0]);
  const [draftActualHours, setDraftActualHours] = useState<number>(subtask.actualHours ?? 0);
  const [incidents, setIncidents] = useState<Incident[]>(subtask.incidents || []);
  const [blockerText, setBlockerText] = useState('');
  const [isBlocked, setIsBlocked] = useState(subtask.status === 'blocked' || !!subtask.blockerReason || (subtask.incidents && subtask.incidents.length > 0));

  const [subtasks, setSubtasks] = useState<Subtask[]>(subtask.subtasks || []);
  const [comments, setComments] = useState<Comment[]>(subtask.comments || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  
  // For nested subtask detail recursion
  const [selectedNestedSubtask, setSelectedNestedSubtask] = useState<Subtask | null>(null);

  useEffect(() => {
    setDraftTitle(subtask.title);
    setDraftDescription(subtask.description || '');
    setDraftStatus(subtask.status || (subtask.completed ? 'completed' : 'todo'));
    setDraftPriority(subtask.priority || 'medium');
    setDraftAssignedTo(subtask.assignedTo || 'Équipe');
    setDraftStartDate(subtask.startDate || new Date().toISOString().split('T')[0]);
    setDraftDueDate(subtask.dueDate || subtask.endDate || new Date().toISOString().split('T')[0]);
    setDraftActualHours(subtask.actualHours ?? 0);
    setIncidents(subtask.incidents || []);
    setIsBlocked(subtask.status === 'blocked' || !!subtask.blockerReason || (subtask.incidents && subtask.incidents.length > 0));
    setSubtasks(subtask.subtasks || []);
    setComments(subtask.comments || []);
  }, [subtask]);

  const handleSignalBlocker = () => {
    if (!blockerText.trim()) return;
    const newInc: Incident = {
      id: `inc-${Date.now()}`,
      title: blockerText.trim(),
      description: blockerText.trim(),
      severity: 'high',
      createdAt: new Date().toLocaleDateString('fr-FR'),
      resolved: false,
    };
    const updatedInc = [...incidents, newInc];
    setIncidents(updatedInc);
    setIsBlocked(true);
    setDraftStatus('blocked');
    setBlockerText('');

    // Sauvegarde immédiate : la sous-tâche passe automatiquement à "bloquée"
    const updated: Subtask = {
      ...subtask,
      title: draftTitle.trim() || subtask.title,
      description: draftDescription.trim() || subtask.description,
      status: 'blocked',
      completed: false,
      priority: draftPriority,
      assignedTo: canReassign ? draftAssignedTo : (subtask.assignedTo || 'Équipe'),
      startDate: draftStartDate,
      dueDate: draftDueDate,
      endDate: draftDueDate,
      actualHours: Number(draftActualHours) || 0,
      incidents: updatedInc,
      isBlocked: true,
      blockerReason: newInc.title,
      subtasks,
      comments,
    };

    onSaveSubtask(updated);
    if (showToast) showToast('Difficulté signalée : la sous-tâche est passée en "Bloquée".', 'error');
  };

  const handleRemoveIncident = (incId: string) => {
    const updatedInc = incidents.filter((i) => i.id !== incId);
    setIncidents(updatedInc);
    const stillBlocked = updatedInc.length > 0;
    setIsBlocked(stillBlocked);
    const newStatus: TaskStatus = stillBlocked ? 'blocked' : (draftStatus === 'blocked' ? 'in_progress' : draftStatus);
    setDraftStatus(newStatus);

    const updated: Subtask = {
      ...subtask,
      title: draftTitle.trim() || subtask.title,
      description: draftDescription.trim() || subtask.description,
      status: newStatus,
      completed: newStatus === 'completed',
      priority: draftPriority,
      assignedTo: canReassign ? draftAssignedTo : (subtask.assignedTo || 'Équipe'),
      startDate: draftStartDate,
      dueDate: draftDueDate,
      endDate: draftDueDate,
      actualHours: Number(draftActualHours) || 0,
      incidents: updatedInc,
      isBlocked: stillBlocked,
      blockerReason: stillBlocked ? updatedInc[updatedInc.length - 1].title : undefined,
      subtasks,
      comments,
    };

    onSaveSubtask(updated);
    if (showToast) showToast('Blocage retiré.', 'success');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftTitle.trim()) {
      if (showToast) showToast('Le titre ne peut pas être vide.', 'error');
      return;
    }

    let finalStatus = incidents.length > 0 ? 'blocked' : draftStatus;

    const updated: Subtask = {
      ...subtask,
      title: draftTitle.trim(),
      description: draftDescription.trim() || undefined,
      status: finalStatus,
      completed: finalStatus === 'completed',
      priority: draftPriority,
      // If user is employee or stagiaire, NEVER reassign! Keep original assignment
      assignedTo: canReassign ? draftAssignedTo : (subtask.assignedTo || 'Équipe'),
      startDate: draftStartDate,
      dueDate: draftDueDate,
      endDate: draftDueDate,
      actualHours: Number(draftActualHours) || 0,
      incidents,
      isBlocked: incidents.length > 0,
      blockerReason: incidents.length > 0 ? incidents[incidents.length - 1].title : undefined,
      subtasks,
      comments,
    };

    onSaveSubtask(updated);
    if (showToast) showToast('Sous-tâche mise à jour avec succès !', 'success');
    onClose();
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSub: Subtask = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: newSubtaskTitle.trim(),
      completed: false,
      priority: 'medium',
      status: 'todo',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: draftDueDate,
      subtasks: [],
    };
    const updated = [...subtasks, newSub];
    setSubtasks(updated);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (subId: string) => {
    const toggleTree = (list: Subtask[]): Subtask[] => {
      return list.map((s) => {
        if (s.id === subId) {
          const nextCompleted = !s.completed;
          return { ...s, completed: nextCompleted, status: nextCompleted ? 'completed' : 'todo' };
        }
        if (s.subtasks && s.subtasks.length > 0) {
          return { ...s, subtasks: toggleTree(s.subtasks) };
        }
        return s;
      });
    };
    setSubtasks(toggleTree(subtasks));
  };

  const handleAddComment = () => {
    if (!newCommentText.trim()) return;
    const newCom: Comment = {
      id: `com-${Date.now()}`,
      author: currentUser?.name || 'Collaborateur',
      text: newCommentText.trim(),
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };
    setComments([...comments, newCom]);
    setNewCommentText('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex justify-end animate-in fade-in">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-stone-200 flex flex-col p-6 overflow-y-auto space-y-5 animate-in slide-in-from-right duration-300">
        
        {/* Header - Removed awkward mention */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-[#2A7B76]/10 text-[#2A7B76] border border-[#2A7B76]/20">
              📋 Détail de la Sous-Tâche
            </span>
            {isBlocked && (
              <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Bloquée
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:bg-stone-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="space-y-4 text-xs flex-1">
          
          {/* Nom / Titre - Prominently visible as requested */}
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

          {/* Description */}
          <div>
            <label className="block text-stone-700 font-bold mb-1">Description & Spécifications</label>
            <textarea
              rows={3}
              value={draftDescription}
              onChange={(e) => setDraftDescription(e.target.value)}
              placeholder="Détails, consignes ou remarques opérationnelles..."
              className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 focus:ring-2 focus:ring-[#2A7B76] outline-none transition"
            />
          </div>

          {/* Statut & Priorité */}
          <div className="grid grid-cols-2 gap-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80">
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
                <option value="todo">📌 À faire</option>
                <option value="in_progress">⚡ En cours</option>
                <option value="blocked">🚨 Bloquée</option>
                <option value="completed">✅ Terminée</option>
                <option value="pending_validation">⏳ En attente de validation</option>
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
          </div>

          {/* Dates : Date de Début & Date de Fin (Échéance) */}
          <div className="grid grid-cols-2 gap-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-200/85">
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
                <Calendar className="h-3 w-3 text-rose-600" /> Date de fin (Échéance)
              </label>
              <input
                type="date"
                value={draftDueDate}
                onChange={(e) => setDraftDueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white font-medium text-stone-800"
              />
            </div>
          </div>

          {/* Temps passé en heures & Assigné à (Sécurisé : employé/stagiaire ne peut JAMAIS réassigner) */}
          <div className="grid grid-cols-2 gap-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-200/85">
            <div>
              <label className="block text-stone-600 font-bold mb-1 text-[11px] flex items-center gap-1">
                <Clock className="h-3 w-3 text-[#2A7B76]" /> Temps passé (Heures)
              </label>
              <input
                type="number"
                min={0}
                max={200}
                step={0.5}
                value={draftActualHours}
                onChange={(e) => setDraftActualHours(Number(e.target.value))}
                placeholder="0h"
                className="w-full px-3 py-1.5 rounded-lg border border-stone-200 bg-white font-mono font-bold text-stone-800"
              />
            </div>

            <div>
              <label className="block text-stone-600 font-bold mb-1 text-[11px] flex items-center gap-1">
                <User className="h-3 w-3 text-[#2A7B76]" /> Assigné à
              </label>
              {canReassign ? (
                <select
                  value={draftAssignedTo}
                  onChange={(e) => setDraftAssignedTo(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white font-medium text-stone-800 text-[11px]"
                >
                  <option value="Équipe">Toute l'équipe</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.name}>{emp.name}</option>
                  ))}
                </select>
              ) : (
                <div className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-100 text-stone-700 font-medium text-[11px] flex items-center justify-between">
                  <span className="font-bold text-stone-800">{subtask.assignedTo || 'Équipe'}</span>
                  <span className="text-[10px] text-stone-400 italic">Fixe (non réassignable)</span>
                </div>
              )}
            </div>
          </div>

          {/* Section Blocage / Difficulté (Autant de blocages qu'on veut) */}
          <div className="space-y-2.5 bg-rose-50/70 p-4 rounded-2xl border border-rose-200">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-rose-800 text-xs flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                <span>Blocages &amp; Difficultés signalés ({incidents.length})</span>
              </h4>
              <span className="text-[10px] text-rose-700 font-semibold bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                Imprévus en feuille de temps
              </span>
            </div>
            <p className="text-[10px] text-rose-600/90 italic">
              Les blocages signalés ici font office d'imprévus dans la feuille de temps (signalés directement par le collaborateur assigné).
            </p>

            {incidents.length > 0 && (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {incidents.map((inc) => (
                  <div key={inc.id} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-rose-200 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                      <span className="text-stone-800 font-medium truncate">{inc.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveIncident(inc.id)}
                      className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer transition"
                      title="Supprimer ce blocage"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {canReassign && !isAssignedToCurrentUser ? (
              <div className="bg-white/80 p-2.5 rounded-xl border border-rose-200 text-stone-600 text-[11px] flex items-center gap-2">
                <span className="text-base">🛡️</span>
                <span>
                  Les blocages font office d'imprévus : ils sont signalés par le collaborateur assigné (<strong>{subtask.assignedTo || 'l\'employé'}</strong>) lors de l'exécution de sa sous-tâche.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Signaler un nouveau blocage (ex: pièce manquante, attente validation)..."
                  value={blockerText}
                  onChange={(e) => setBlockerText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSignalBlocker();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-rose-200 bg-white text-xs outline-none focus:ring-2 focus:ring-rose-500 text-rose-900"
                />
                <button
                  type="button"
                  onClick={handleSignalBlocker}
                  className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 cursor-pointer shrink-0"
                >
                  Signaler
                </button>
              </div>
            )}
          </div>

          {/* Section Commentaires */}
          <div className="space-y-2.5 bg-stone-50 p-4 rounded-2xl border border-stone-200/80">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-[#2A7B76]" />
                <span>Commentaires &amp; Observations ({comments.length})</span>
              </h4>
              <span className="text-[10px] text-[#2A7B76] font-semibold bg-[#2A7B76]/10 px-2 py-0.5 rounded-full">
                Points pour le manager
              </span>
            </div>
            <p className="text-[10px] text-stone-500 italic">
              Vos commentaires rédigés ici font office de points à signaler au manager dans votre feuille de temps.
            </p>
            <div className="space-y-2 max-h-36 overflow-y-auto">
              {comments.map((com) => (
                <div key={com.id} className="bg-white p-2.5 rounded-xl border border-stone-200 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-stone-400 font-medium">
                    <span className="font-bold text-stone-700">{com.author}</span>
                    <span>{com.timestamp}</span>
                  </div>
                  <p className="text-stone-800">{com.text}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-[11px] text-stone-400 italic">Aucun commentaire sur cette sous-tâche.</p>
              )}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Ajouter une observation ou un commentaire..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddComment(); } }}
                className="flex-1 px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:ring-2 focus:ring-[#2A7B76]"
              />
              <button
                type="button"
                onClick={handleAddComment}
                className="px-3 py-1.5 bg-[#2A7B76] text-white rounded-xl text-xs font-bold hover:bg-[#23635f] cursor-pointer"
              >
                Envoyer
              </button>
            </div>
          </div>

          {/* Sous-tâches subordonnées récursives (si besoin de décomposer encore plus) */}
          <div className="space-y-2.5 bg-stone-50 p-4 rounded-2xl border border-stone-200/80">
            <h4 className="font-bold text-stone-800 text-xs flex items-center justify-between">
              <span>Sous-tâches subordonnées ({subtasks.length})</span>
              <span className="text-[10px] text-stone-400 font-normal">Décomposition modulaire</span>
            </h4>
            <div className="space-y-1.5">
              {subtasks.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-stone-200 gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={sub.completed}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleToggleSubtask(sub.id);
                      }}
                      className="w-4 h-4 rounded border-stone-300 text-[#2A7B76] cursor-pointer shrink-0"
                    />
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNestedSubtask(sub);
                      }}
                      className={`text-xs block truncate cursor-pointer hover:underline flex-1 ${sub.completed ? 'line-through text-stone-400' : 'text-stone-800 font-bold'}`}
                    >
                      {sub.title}
                    </span>
                    {(sub.status === 'blocked' || sub.isBlocked || (sub.incidents && sub.incidents.length > 0)) && (
                      <span className="px-1.5 py-0.5 rounded-md font-bold text-[9px] bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-0.5 shrink-0">
                        <span>🚨</span>
                        <span>Bloquée</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNestedSubtask(sub);
                      }}
                      className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Ouvrir ⚙️
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSubtasks(subtasks.filter(s => s.id !== sub.id));
                      }}
                      className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Ajouter une sous-tâche..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); } }}
                className="flex-1 px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:ring-2 focus:ring-[#2A7B76]"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 bg-[#2A7B76] text-white rounded-xl text-xs font-bold hover:bg-[#23635f] cursor-pointer"
              >
                Ajouter
              </button>
            </div>
          </div>

          {/* Bouton d'enregistrement */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full bg-[#2A7B76] hover:bg-[#236864] text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>Enregistrer les modifications</span>
            </button>
          </div>

        </form>

        {/* Recursive Sub-subtask Modal */}
        {selectedNestedSubtask && (
          <SubtaskDetailModal
            isOpen={true}
            subtask={selectedNestedSubtask}
            onClose={() => setSelectedNestedSubtask(null)}
            onSaveSubtask={(updatedNested) => {
              const updateInTree = (list: Subtask[]): Subtask[] => {
                return list.map((s) => {
                  if (s.id === updatedNested.id) return updatedNested;
                  if (s.subtasks && s.subtasks.length > 0) return { ...s, subtasks: updateInTree(s.subtasks) };
                  return s;
                });
              };
              const updatedSubtasks = updateInTree(subtasks);
              setSubtasks(updatedSubtasks);
              setSelectedNestedSubtask(updatedNested);
              onSaveSubtask({
                ...subtask,
                subtasks: updatedSubtasks,
              });
            }}
            employees={employees}
            projects={projects}
            showToast={showToast}
            currentUser={currentUser}
            currentRole={currentRole}
          />
        )}

      </div>
    </div>
  );
};

export default SubtaskDetailModal;
