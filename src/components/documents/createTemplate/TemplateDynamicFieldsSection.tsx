import React from 'react';
import { Plus, Trash2, Tag } from 'lucide-react';
import { TemplateField } from '../../../types';

interface TemplateDynamicFieldsSectionProps {
  fields: TemplateField[];
  newFieldKey: string;
  setNewFieldKey: (v: string) => void;
  newFieldLabel: string;
  setNewFieldLabel: (v: string) => void;
  newFieldType: 'text' | 'number' | 'date' | 'textarea';
  setNewFieldType: (v: 'text' | 'number' | 'date' | 'textarea') => void;
  onInsertTag: (key: string) => void;
  onRemoveField: (key: string) => void;
  onAddField: () => void;
}

export const TemplateDynamicFieldsSection: React.FC<TemplateDynamicFieldsSectionProps> = ({
  fields,
  newFieldKey,
  setNewFieldKey,
  newFieldLabel,
  setNewFieldLabel,
  newFieldType,
  setNewFieldType,
  onInsertTag,
  onRemoveField,
  onAddField,
}) => {
  return (
    <div className="space-y-3 p-4 bg-stone-50 rounded-2xl border border-stone-200/80">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-xs text-stone-800 flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-[#2A7B76]" />
            Variables Dynamiques du Document ({fields.length})
          </h4>
          <p className="text-[10px] text-stone-500">
            Ces champs seront demandés à l'utilisateur lors de la génération du document officiel.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {fields.map((f) => (
          <div
            key={f.key}
            className="p-2.5 bg-white rounded-xl border border-stone-200 flex items-center justify-between gap-2 shadow-2xs"
          >
            <div className="min-w-0">
              <span className="font-mono text-[10px] bg-emerald-50 text-[#2A7B76] px-1.5 py-0.5 rounded font-bold border border-emerald-200/60">
                {`{{${f.key}}}`}
              </span>
              <p className="text-xs text-stone-800 font-medium truncate mt-0.5">{f.label}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onInsertTag(f.key)}
                className="px-2 py-1 bg-stone-100 hover:bg-[#2A7B76] hover:text-white text-[10px] rounded-lg transition font-medium cursor-pointer"
                title="Insérer dans le texte"
              >
                + Insérer
              </button>
              <button
                type="button"
                onClick={() => onRemoveField(f.key)}
                className="p-1 text-stone-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                title="Supprimer ce champ"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-stone-200 flex flex-wrap sm:flex-nowrap gap-2 items-end">
        <div className="w-full sm:w-1/3 space-y-1">
          <label className="text-[10px] font-bold text-stone-600">Nom de la variable (code)</label>
          <input
            type="text"
            placeholder="ex: motif, montant..."
            value={newFieldKey}
            onChange={(e) => setNewFieldKey(e.target.value)}
            className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#2A7B76]"
          />
        </div>

        <div className="w-full sm:w-1/3 space-y-1">
          <label className="text-[10px] font-bold text-stone-600">Libellé affiché</label>
          <input
            type="text"
            placeholder="ex: Motif du congé..."
            value={newFieldLabel}
            onChange={(e) => setNewFieldLabel(e.target.value)}
            className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#2A7B76]"
          />
        </div>

        <div className="w-full sm:w-1/4 space-y-1">
          <label className="text-[10px] font-bold text-stone-600">Type de champ</label>
          <select
            value={newFieldType}
            onChange={(e) => setNewFieldType(e.target.value as any)}
            className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs outline-none"
          >
            <option value="text">Texte court</option>
            <option value="textarea">Texte long</option>
            <option value="date">Date</option>
            <option value="number">Nombre / Montant</option>
          </select>
        </div>

        <button
          type="button"
          onClick={onAddField}
          className="w-full sm:w-auto px-3 py-2 bg-[#2A7B76] hover:bg-[#20635F] text-white text-xs font-bold rounded-lg transition shrink-0 flex items-center justify-center gap-1 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Ajouter</span>
        </button>
      </div>
    </div>
  );
};
