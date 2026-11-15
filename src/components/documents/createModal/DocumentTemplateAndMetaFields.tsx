import React from 'react';
import { FileText, User, Hash, Database, Shield } from 'lucide-react';
import { Employee } from '../../../types';
import { DocTemplate } from '../../DocTemplates';

interface DocumentTemplateAndMetaFieldsProps {
  availableTemplates: DocTemplate[];
  selectedTemplateId: string;
  setSelectedTemplateId: (id: string) => void;
  selectedEmployeeId: string;
  onEmployeeChange: (id: string) => void;
  employees: Employee[];
  refNumber: string;
  setRefNumber: (v: string) => void;
  title: string;
  setTitle: (v: string) => void;
  error: string | null;
  setError: (v: string | null) => void;
  activeTemplate: DocTemplate;
  fieldValues: Record<string, any>;
  onFieldChange: (key: string, val: any) => void;
  includeSignature: boolean;
  setIncludeSignature: (v: boolean) => void;
}

export const DocumentTemplateAndMetaFields: React.FC<DocumentTemplateAndMetaFieldsProps> = ({
  availableTemplates,
  selectedTemplateId,
  setSelectedTemplateId,
  selectedEmployeeId,
  onEmployeeChange,
  employees,
  refNumber,
  setRefNumber,
  title,
  setTitle,
  error,
  setError,
  activeTemplate,
  fieldValues,
  onFieldChange,
  includeSignature,
  setIncludeSignature,
}) => {
  return (
    <>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-[#2A7B76]" />
          Type de document ({availableTemplates.length} modèles disponibles en BD)
        </label>
        <select
          value={selectedTemplateId}
          onChange={(e) => setSelectedTemplateId(e.target.value)}
          className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 font-medium focus:ring-2 focus:ring-[#2A7B76] outline-none"
        >
          {availableTemplates.map((tpl) => (
            <option key={tpl.id} value={tpl.id}>
              {tpl.name} ({tpl.category.toUpperCase()})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-[#2A7B76]" />
            Collaborateur concerné (Optionnel)
          </label>
          <select
            value={selectedEmployeeId}
            onChange={(e) => onEmployeeChange(e.target.value)}
            className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:ring-2 focus:ring-[#2A7B76] outline-none"
          >
            <option value="">Document Général (Ensemble du personnel)</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} — {emp.roleType || 'Employé'} ({emp.department || 'Opérations'})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
            <Hash className="h-3.5 w-3.5 text-[#2A7B76]" />
            Numéro de référence officiel
          </label>
          <input
            type="text"
            value={refNumber}
            onChange={(e) => setRefNumber(e.target.value)}
            className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-800 focus:ring-2 focus:ring-[#2A7B76] outline-none"
            placeholder="N° 2026/RH-CIT/XXXX"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-stone-700">
          Objet / Titre officiel du document
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (error) setError(null);
          }}
          className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:ring-2 focus:ring-[#2A7B76] outline-none"
          placeholder="Ex: Attestation d'emploi et de présence..."
        />
      </div>

      {activeTemplate.fields.length > 0 && (
        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
          <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
            Paramètres du modèle ({activeTemplate.name})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeTemplate.fields.map((f) => (
              <div key={f.key} className={f.type === 'textarea' ? 'sm:col-span-2 space-y-1' : 'space-y-1'}>
                <label className="text-[11px] font-semibold text-stone-600">{f.label}</label>
                {f.type === 'textarea' ? (
                  <textarea
                    rows={3}
                    value={fieldValues[f.key] || ''}
                    onChange={(e) => onFieldChange(f.key, e.target.value)}
                    className="w-full p-2 bg-white border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
                  />
                ) : f.type === 'select' && f.options ? (
                  <select
                    value={fieldValues[f.key] || ''}
                    onChange={(e) => onFieldChange(f.key, e.target.value)}
                    className="w-full p-2 bg-white border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
                  >
                    {f.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.type}
                    value={fieldValues[f.key] || ''}
                    onChange={(e) => onFieldChange(f.key, e.target.value)}
                    className="w-full p-2 bg-white border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
        <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-[#2A7B76]" />
          Options de signature & conservation en base de données
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-stone-200 cursor-pointer hover:border-[#2A7B76]/60 transition select-none">
            <input
              type="checkbox"
              checked={includeSignature}
              onChange={(e) => setIncludeSignature(e.target.checked)}
              className="mt-0.5 rounded border-stone-300 text-[#2A7B76] focus:ring-[#2A7B76]"
            />
            <div className="text-xs">
              <span className="font-bold text-stone-800 block">Apposer la signature officielle</span>
              <span className="text-[10px] text-stone-500">
                Non cochée par défaut. Si décochée, le document est généré sans signature électronique (espace neutre réservé).
              </span>
            </div>
          </label>

          <div className="flex items-start gap-2.5 p-3 bg-emerald-50/80 rounded-xl border border-emerald-200/80 select-none">
            <Database className="h-4 w-4 text-[#2A7B76] shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-stone-800 block flex items-center gap-1.5">
                Conservation & Archivage en Base de Données
                <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.2 rounded border border-emerald-300">
                  Supabase Actif
                </span>
              </span>
              <span className="text-[10px] text-stone-600">
                Les données du document, métadonnées, dates et clauses sont automatiquement archivées en BD.
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
