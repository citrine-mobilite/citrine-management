import React, { useState } from 'react';
import { Plus, Trash2, Workflow, X } from 'lucide-react';
import { TaskProject } from '../../types';
import { DEFAULT_PROJECT_RULES } from './taskConstants';
import { resolveProjectSections } from './logic/asanaTreeEngine';

interface TaskProjectRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: TaskProject;
  onToggleRule: (projectId: string, ruleId: string) => void;
  onAddSection: (projectId: string, title: string) => void;
  onDeleteSection: (projectId: string, sectionId: string) => void;
}

export const TaskProjectRulesModal: React.FC<TaskProjectRulesModalProps> = ({
  isOpen,
  onClose,
  project,
  onToggleRule,
  onAddSection,
  onDeleteSection,
}) => {
  const [newSectionTitle, setNewSectionTitle] = useState('');

  if (!isOpen || !project) return null;

  const targetProjectId = project.id === 'all' ? 'general' : project.id;
  const rules = project.rules && project.rules.length > 0 ? project.rules : DEFAULT_PROJECT_RULES;
  const sections = resolveProjectSections(project);

  const handleCreateSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitle.trim()) return;
    onAddSection(targetProjectId, newSectionTitle.trim());
    setNewSectionTitle('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 flex items-center justify-center p-4">
      <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center gap-2">
            <Workflow className="h-4 w-4 text-[#2A7B76]" />
            <h3 className="text-sm font-bold text-stone-900">
              Règles &amp; Sections · {project.id === 'all' ? 'Général' : project.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-500 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Automatisations Asana du projet */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Automatisations du workflow (Supabase)
            </h4>
            <div className="divide-y divide-stone-200 border border-stone-200 rounded-xl overflow-hidden">
              {rules.map((rule) => (
                <label
                  key={rule.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-stone-50 cursor-pointer"
                >
                  <span className="text-xs font-semibold text-stone-800">{rule.name}</span>
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={() => onToggleRule(targetProjectId, rule.id)}
                    className="h-4 w-4 rounded border-stone-300 text-[#2A7B76] focus:ring-[#2A7B76] cursor-pointer shrink-0"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Sections du projet */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Sections du projet
            </h4>
            <div className="divide-y divide-stone-200 border border-stone-200 rounded-xl overflow-hidden">
              {sections.map((sec) => (
                <div
                  key={sec.id}
                  className="flex items-center justify-between px-4 py-2.5 bg-white text-xs font-semibold text-stone-800"
                >
                  <span>{sec.title}</span>
                  {sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteSection(targetProjectId, sec.id)}
                      className="p-1 rounded hover:bg-rose-50 text-stone-400 hover:text-rose-600 cursor-pointer"
                      title="Supprimer la section"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleCreateSection} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                placeholder="Nom de la nouvelle section..."
                className="flex-1 px-3 py-2 text-xs border border-stone-200 rounded-xl outline-none focus:border-[#2A7B76]"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#2A7B76] text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Ajouter</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
