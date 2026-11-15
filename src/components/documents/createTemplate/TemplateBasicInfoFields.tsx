import React from 'react';
import { Database } from 'lucide-react';
import { DocumentCategory } from '../../../types';
import { TEMPLATE_CATEGORY_OPTIONS } from './docTemplateFormConstants';

interface TemplateBasicInfoFieldsProps {
  name: string;
  setName: (v: string) => void;
  category: DocumentCategory;
  setCategory: (v: DocumentCategory) => void;
  description: string;
  setDescription: (v: string) => void;
}

export const TemplateBasicInfoFields: React.FC<TemplateBasicInfoFieldsProps> = ({
  name,
  setName,
  category,
  setCategory,
  description,
  setDescription,
}) => {
  return (
    <>
      <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start gap-3">
        <Database className="h-4 w-4 text-[#2A7B76] shrink-0 mt-0.5" />
        <div className="text-xs text-stone-700 leading-relaxed">
          <strong className="text-emerald-900 block font-semibold">Stockage automatique en Base de Données</strong>
          Ce nouveau modèle sera stocké dans la table Supabase{' '}
          <code className="bg-emerald-100/70 px-1 py-0.5 rounded text-[11px] font-mono">rh_document_templates</code>.
          Il sera instantanément disponible pour toute l'équipe sans redéploiement.
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-stone-800">
            Nom du type de document <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Ex: Demande de Congé Payé, Ordre de Mutation..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-stone-800">
            Catégorie RH <span className="text-rose-500">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as DocumentCategory)}
            className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none font-medium"
          >
            {TEMPLATE_CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-stone-800">Description ou objectif du modèle</label>
        <input
          type="text"
          placeholder="Ex: Formalise les demandes et autorisations d'absence pour convenance personnelle."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
        />
      </div>
    </>
  );
};
