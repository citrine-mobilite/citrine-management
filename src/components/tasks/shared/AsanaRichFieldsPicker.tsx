import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Link2,
  ListChecks,
  Plus,
  Repeat,
  Tag,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { Employee, Task, TaskRecurrence } from '../../../types';
import { collectAllDependencyCandidates } from '../logic/asanaTreeEngine';

const SUGGESTED_TAGS = [
  'Exécution',
  'Contrôle',
  'Rédaction',
  'Design',
  'Technique',
  'Client',
  'Administration',
  'Urgent',
];

const RECURRENCE_OPTIONS: Array<{ value: TaskRecurrence; label: string }> = [
  { value: 'none', label: 'Aucune' },
  { value: 'daily', label: 'Quotidienne' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuelle' },
];

interface AsanaRichFieldsPickerProps {
  estimatedHours: number;
  setEstimatedHours: (v: number) => void;
  actualHours: number;
  setActualHours: (v: number) => void;
  tags: string[];
  setTags: (v: string[]) => void;
  dependsOnIds: string[];
  setDependsOnIds: (v: string[]) => void;
  existingTasks: Task[];
  excludeNodeId?: string;
  recurrence: TaskRecurrence;
  setRecurrence: (v: TaskRecurrence) => void;
  followerIds: string[];
  setFollowerIds: (v: string[]) => void;
  employees: Employee[];
  criteria: string[];
  setCriteria: (v: string[]) => void;
}

export const AsanaRichFieldsPicker: React.FC<AsanaRichFieldsPickerProps> = ({
  estimatedHours,
  setEstimatedHours,
  actualHours,
  setActualHours,
  tags,
  setTags,
  dependsOnIds,
  setDependsOnIds,
  existingTasks,
  excludeNodeId,
  recurrence,
  setRecurrence,
  followerIds,
  setFollowerIds,
  employees,
  criteria,
  setCriteria,
}) => {
  const [newTagInput, setNewTagInput] = useState('');
  const [depSearch, setDepSearch] = useState('');
  const [showDepDropdown, setShowDepDropdown] = useState(false);
  const [newCriterion, setNewCriterion] = useState('');
  const [showFollowersDropdown, setShowFollowersDropdown] = useState(false);

  const depCandidates = useMemo(
    () => collectAllDependencyCandidates(existingTasks, excludeNodeId),
    [existingTasks, excludeNodeId]
  );

  const filteredDeps = useMemo(() => {
    const q = depSearch.trim().toLowerCase();
    return depCandidates
      .filter((c) => !dependsOnIds.includes(c.id))
      .filter(
        (c) =>
          !q ||
          c.title.toLowerCase().includes(q) ||
          (c.parentTaskTitle || '').toLowerCase().includes(q)
      )
      .slice(0, 14);
  }, [depCandidates, dependsOnIds, depSearch]);

  const handleAddTag = (raw: string) => {
    const clean = raw.trim();
    if (!clean) return;
    if (!tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleToggleDep = (depId: string) => {
    if (dependsOnIds.includes(depId)) {
      setDependsOnIds(dependsOnIds.filter((id) => id !== depId));
    } else {
      setDependsOnIds([...dependsOnIds, depId]);
    }
    setShowDepDropdown(false);
    setDepSearch('');
  };

  const handleAddCriterion = () => {
    const clean = newCriterion.trim();
    if (!clean) return;
    setCriteria([...criteria, clean]);
    setNewCriterion('');
  };

  const toggleFollower = (empId: string) => {
    if (followerIds.includes(empId)) {
      setFollowerIds(followerIds.filter((id) => id !== empId));
    } else {
      setFollowerIds([...followerIds, empId]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Temps estimé, Temps passé & Récurrence */}
      <div className="p-3.5 rounded-2xl bg-stone-50/80 border border-stone-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-[#2A7B76]" />
            Temps estimé, Temps passé &amp; Récurrence
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-stone-600 block mb-1">
              Temps estimé (h)
            </label>
            <div className="flex items-center gap-1 flex-wrap">
              {[1, 2, 4, 8].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setEstimatedHours(h)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer ${
                    estimatedHours === h
                      ? 'bg-[#2A7B76] text-white'
                      : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {h}h
                </button>
              ))}
              <input
                type="number"
                min={0}
                max={500}
                step={0.5}
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value) || 0)}
                className="w-14 px-2 py-1 bg-white border border-stone-200 rounded-lg text-xs font-mono font-bold text-stone-900 text-center outline-none focus:border-[#2A7B76]"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-stone-600 block mb-1">
              Temps réel passé (h)
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={500}
                step={0.5}
                value={actualHours}
                onChange={(e) => setActualHours(Number(e.target.value) || 0)}
                className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-mono font-bold text-stone-900 outline-none focus:border-[#2A7B76]"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-stone-400">
                h
              </span>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-stone-600 block mb-1 flex items-center gap-1">
              <Repeat className="h-3 w-3 text-[#2A7B76]" />
              Récurrence
            </label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as TaskRecurrence)}
              className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold text-stone-800 outline-none focus:border-[#2A7B76] cursor-pointer"
            >
              {RECURRENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Étiquettes (Multi-tags Asana) */}
      <div className="p-3.5 rounded-2xl bg-stone-50/80 border border-stone-200 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-[#2A7B76]" />
            Étiquettes ({tags.length})
          </span>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-stone-300 text-xs font-semibold text-stone-800"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-stone-400 hover:text-rose-600 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag(newTagInput);
              }
            }}
            placeholder="Ajouter une étiquette personnalisée (Entrée)..."
            className="flex-1 px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:border-[#2A7B76]"
          />
          <button
            type="button"
            onClick={() => handleAddTag(newTagInput)}
            className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 hover:border-[#2A7B76] text-[#2A7B76] text-xs font-bold cursor-pointer flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Ajouter</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => handleAddTag(sug)}
              className="px-2 py-0.5 rounded-md border border-dashed border-stone-300 bg-white/70 hover:border-[#2A7B76] hover:text-[#2A7B76] text-[11px] font-medium text-stone-600 cursor-pointer transition"
            >
              + {sug}
            </button>
          ))}
        </div>
      </div>

      {/* Dépendances (Bloqué par...) */}
      <div className="p-3.5 rounded-2xl bg-stone-50/80 border border-stone-200 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5 text-amber-600" />
            Dépendances / Bloqué par ({dependsOnIds.length})
          </span>
          <button
            type="button"
            onClick={() => setShowDepDropdown((v) => !v)}
            className="text-[11px] font-bold text-[#2A7B76] hover:underline cursor-pointer"
          >
            {showDepDropdown ? 'Fermer la liste' : '+ Sélectionner une dépendance'}
          </button>
        </div>

        {dependsOnIds.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {dependsOnIds.map((depId) => {
              const found = depCandidates.find((c) => c.id === depId);
              return (
                <span
                  key={depId}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-xs font-medium text-amber-900"
                >
                  <span className={found?.completed ? 'line-through opacity-70' : ''}>
                    {found?.parentTaskTitle ? `${found.parentTaskTitle} › ` : ''}
                    {found?.title || depId}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleDep(depId)}
                    className="text-amber-700 hover:text-rose-600 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {showDepDropdown && (
          <div className="p-2.5 rounded-xl border border-stone-200 bg-white space-y-2">
            <input
              type="text"
              value={depSearch}
              onChange={(e) => setDepSearch(e.target.value)}
              placeholder="Rechercher une tâche ou sous-tâche bloquante..."
              className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-xs outline-none focus:border-[#2A7B76]"
            />
            <div className="max-h-36 overflow-y-auto divide-y divide-stone-100">
              {filteredDeps.length === 0 ? (
                <div className="py-2 px-2 text-[11px] text-stone-400">
                  Aucune tâche ou sous-tâche disponible.
                </div>
              ) : (
                filteredDeps.map((cand) => (
                  <button
                    key={cand.id}
                    type="button"
                    onClick={() => handleToggleDep(cand.id)}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-stone-50 text-xs text-stone-800 flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <span className={`truncate ${cand.completed ? 'line-through text-stone-400' : 'font-medium'}`}>
                      {cand.title}
                    </span>
                    {cand.parentTaskTitle && (
                      <span className="text-[10px] text-stone-400 truncate shrink-0 max-w-[140px]">
                        {cand.parentTaskTitle}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Abonnés / Collaborateurs qui suivent */}
      <div className="p-3.5 rounded-2xl bg-stone-50/80 border border-stone-200 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-[#2A7B76]" />
            Collaborateurs abonnés ({followerIds.length})
          </span>
          <button
            type="button"
            onClick={() => setShowFollowersDropdown((v) => !v)}
            className="text-[11px] font-bold text-[#2A7B76] hover:underline cursor-pointer"
          >
            {showFollowersDropdown ? 'Masquer' : '+ Ajouter des abonnés'}
          </button>
        </div>

        {followerIds.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {followerIds.map((id) => {
              const emp = employees.find((e) => e.id === id || e.name === id);
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-stone-200 text-xs font-medium text-stone-700"
                >
                  <span>{emp?.name || id}</span>
                  <button
                    type="button"
                    onClick={() => toggleFollower(id)}
                    className="text-stone-400 hover:text-rose-600 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {showFollowersDropdown && (
          <div className="max-h-32 overflow-y-auto bg-white border border-stone-200 rounded-xl p-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {employees.map((emp) => (
              <label
                key={emp.id}
                className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer px-1.5 py-1 rounded hover:bg-stone-50"
              >
                <input
                  type="checkbox"
                  checked={followerIds.includes(emp.id)}
                  onChange={() => toggleFollower(emp.id)}
                  className="rounded border-stone-300 text-[#2A7B76]"
                />
                <span className="truncate">{emp.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Critères de validation / Checklist */}
      <div className="space-y-2 p-3.5 rounded-2xl bg-stone-50/80 border border-stone-200">
        <div className="flex items-center justify-between">
          <span className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
            <ListChecks className="h-3.5 w-3.5 text-[#2A7B76]" />
            Critères de validation ({criteria.length})
          </span>
        </div>

        {criteria.length > 0 && (
          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {criteria.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-stone-200 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#2A7B76] shrink-0" />
                  <span className="text-stone-800 truncate font-medium">{item}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCriteria(criteria.filter((_, i) => i !== idx))}
                  className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Ajouter un point de contrôle ou livrable attendu..."
            value={newCriterion}
            onChange={(e) => setNewCriterion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCriterion();
              }
            }}
            className="flex-1 px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs outline-none focus:border-[#2A7B76]"
          />
          <button
            type="button"
            onClick={handleAddCriterion}
            className="px-3 py-1.5 bg-white border border-stone-200 hover:border-[#2A7B76] text-[#2A7B76] rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Ajouter</span>
          </button>
        </div>
      </div>
    </div>
  );
};
