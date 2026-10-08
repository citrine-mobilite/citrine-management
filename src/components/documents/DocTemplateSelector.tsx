import React, { useState } from 'react';
import { Plus, Sparkles, Database, FileText, Briefcase, Award, ShieldAlert } from 'lucide-react';
import { DOC_TEMPLATES, DocTemplate } from '../DocTemplates';

interface DocTemplateSelectorProps {
  onSelectTemplate: (template: DocTemplate) => void;
  templates?: DocTemplate[];
}

export const DocTemplateSelector: React.FC<DocTemplateSelectorProps> = ({ 
  onSelectTemplate,
  templates 
}) => {
  const currentTemplates = templates && templates.length > 0 ? templates : DOC_TEMPLATES;
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'contracts' | 'attestations' | 'discipline' | 'operations'>('all');

  const filteredTemplates = currentTemplates.filter((tpl) => {
    if (categoryFilter === 'contracts') {
      return tpl.category === 'contract' || tpl.category === 'amendment';
    }
    if (categoryFilter === 'attestations') {
      return tpl.category === 'attestation' || tpl.category === 'certificate' || tpl.category === 'internship';
    }
    if (categoryFilter === 'discipline') {
      return tpl.category === 'disciplinary' || tpl.category === 'memo' || tpl.category === 'regulation';
    }
    if (categoryFilter === 'operations') {
      return tpl.category === 'mission' || tpl.category === 'discharge' || tpl.category === 'job_description' || tpl.category === 'evaluation';
    }
    return true;
  });

  return (
    <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#2A7B76]" />
          <h3 className="font-serif font-bold text-sm text-stone-900">
            Modèles de Documents RH ({currentTemplates.length} modèles synchronisés en BD)
          </h3>
        </div>

        {/* Filtres par domaine RH */}
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-2xl text-xs font-semibold overflow-x-auto self-start sm:self-auto max-w-full">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
              categoryFilter === 'all'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <FileText className="h-3 w-3" />
            <span>Tous ({currentTemplates.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('contracts')}
            className={`px-2.5 py-1 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
              categoryFilter === 'contracts'
                ? 'bg-white text-[#2A7B76] shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Briefcase className="h-3 w-3" />
            <span>Contrats & Avenants</span>
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('attestations')}
            className={`px-2.5 py-1 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
              categoryFilter === 'attestations'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Award className="h-3 w-3" />
            <span>Attestations</span>
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('discipline')}
            className={`px-2.5 py-1 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
              categoryFilter === 'discipline'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <ShieldAlert className="h-3 w-3" />
            <span>Discipline & Directives</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredTemplates.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => onSelectTemplate(tpl)}
            className="p-4 rounded-2xl border border-stone-200 hover:border-[#2A7B76] hover:bg-emerald-50/30 transition text-left group cursor-pointer flex flex-col justify-between space-y-2 shadow-2xs"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#2A7B76] bg-emerald-100/60 px-2 py-0.5 rounded-md border border-emerald-200/60">
                  {tpl.category}
                </span>

                <span className="text-[9px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80 flex items-center gap-1">
                  <Database className="h-2.5 w-2.5 text-[#2A7B76]" />
                  Modèle en BD
                </span>
              </div>

              <h4 className="font-bold text-xs text-stone-900 group-hover:text-[#2A7B76] transition mt-2">
                {tpl.name}
              </h4>
              <p className="text-[10px] text-stone-500 line-clamp-2 mt-1">{tpl.description}</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-[10px] font-bold text-[#2A7B76]">
              <span>Rédiger & Générer</span>
              <Plus className="h-3.5 w-3.5" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
