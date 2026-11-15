import React from 'react';
import { AlertCircle, FileText } from 'lucide-react';
import { Employee, IncidentCategory, IncidentSeverity } from '../../types';
import { CATEGORY_LABELS } from './disciplinaryCreateHelpers';

interface DisciplinaryCreateFieldsProps {
  employees: Employee[];
  employeeId: string;
  setEmployeeId: (v: string) => void;
  category: IncidentCategory;
  setCategory: (v: IncidentCategory) => void;
  date: string;
  setDate: (v: string) => void;
  severity: IncidentSeverity;
  setSeverity: (v: IncidentSeverity) => void;
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
  witnesses: string;
  setWitnesses: (v: string) => void;
  fieldErrors: { [key: string]: string };
  clearFieldError: (field: string) => void;
  onApplySuggestion: () => void;
}

export const DisciplinaryCreateFields: React.FC<DisciplinaryCreateFieldsProps> = ({
  employees,
  employeeId,
  setEmployeeId,
  category,
  setCategory,
  date,
  setDate,
  severity,
  setSeverity,
  title,
  setTitle,
  description,
  setDescription,
  location,
  setLocation,
  witnesses,
  setWitnesses,
  fieldErrors,
  clearFieldError,
  onApplySuggestion,
}) => {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-bold text-stone-800 mb-1">
            Collaborateur concerné <span className="text-rose-500">*</span>
          </label>
          <select
            value={employeeId}
            onChange={(e) => {
              setEmployeeId(e.target.value);
              clearFieldError('employeeId');
            }}
            className={`w-full p-2.5 bg-stone-50 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-[#2A7B76] outline-none ${
              fieldErrors.employeeId ? 'border-rose-400 bg-rose-50/30' : 'border-stone-200/90'
            }`}
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim()} ({emp.role || emp.roleType || 'Collaborateur'})
              </option>
            ))}
          </select>
          {fieldErrors.employeeId && (
            <p className="text-[10px] text-rose-600 font-bold mt-1">{fieldErrors.employeeId}</p>
          )}
        </div>

        <div>
          <label className="block font-bold text-stone-800 mb-1">
            Nature du manquement <span className="text-rose-500">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as IncidentCategory)}
            className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200/90 text-xs font-medium focus:ring-2 focus:ring-[#2A7B76] outline-none"
          >
            <option value="retard_repete">Retards Répétés</option>
            <option value="absence_injustifiee">Absence Injustifiée</option>
            <option value="insubordination">Insubordination / Non-respect des consignes</option>
            <option value="negligence_materiel">Négligence de matériel</option>
            <option value="faute_professionnelle">Faute Professionnelle</option>
            <option value="comportement_inadapte">Comportement Inadapté</option>
            <option value="autre">Autre manquement</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-bold text-stone-800 mb-1">
            Date des faits <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              clearFieldError('date');
            }}
            className={`w-full p-2.5 bg-stone-50 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-[#2A7B76] outline-none ${
              fieldErrors.date ? 'border-rose-400 bg-rose-50/30' : 'border-stone-200/90'
            }`}
          />
          {fieldErrors.date && (
            <p className="text-[10px] text-rose-600 font-bold mt-1">{fieldErrors.date}</p>
          )}
        </div>

        <div>
          <label className="block font-bold text-stone-800 mb-1">
            Degré de gravité <span className="text-rose-500">*</span>
          </label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
            className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200/90 text-xs font-bold text-stone-800 focus:ring-2 focus:ring-[#2A7B76] outline-none"
          >
            <option value="faible">Faible (Rappel à l'ordre)</option>
            <option value="moyen">Moyen (Demande d'explication)</option>
            <option value="grave">Grave (Mise en demeure / Avertissement)</option>
            <option value="critique">Critique (Mise à pied conservatoire)</option>
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block font-bold text-stone-800">Titre / Résumé du motif</label>
          <span className="text-[10px] text-stone-400">Optionnel (généré automatiquement si vide)</span>
        </div>
        <input
          type="text"
          placeholder={`Ex: Constat : ${CATEGORY_LABELS[category]}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200/90 text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block font-bold text-stone-800">
            Description factuelle des faits constatés <span className="text-rose-500">*</span>
          </label>
          <button
            type="button"
            onClick={onApplySuggestion}
            className="inline-flex items-center gap-1 text-[11px] text-[#2A7B76] hover:text-emerald-800 font-bold transition cursor-pointer"
          >
            <FileText className="h-3 w-3" /> Insérer un motif type
          </button>
        </div>
        <textarea
          rows={3}
          placeholder="Précisez les circonstances exactes, les horaires constatés, les impacts sur le service..."
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            clearFieldError('description');
          }}
          className={`w-full p-2.5 bg-stone-50 rounded-xl border text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none transition ${
            fieldErrors.description ? 'border-rose-400 bg-rose-50/30' : 'border-stone-200/90'
          }`}
        />
        {fieldErrors.description && (
          <p className="text-[10px] text-rose-600 font-bold mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {fieldErrors.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-bold text-stone-800 mb-1">Lieu de survenance</label>
          <input
            type="text"
            placeholder="Bureaux Citrine (HQ)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200/90 text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
          />
        </div>

        <div>
          <label className="block font-bold text-stone-800 mb-1">Témoins éventuels</label>
          <input
            type="text"
            placeholder="Ex: Chef de Projet, Collègues de bureau"
            value={witnesses}
            onChange={(e) => setWitnesses(e.target.value)}
            className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200/90 text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
          />
        </div>
      </div>
    </>
  );
};
