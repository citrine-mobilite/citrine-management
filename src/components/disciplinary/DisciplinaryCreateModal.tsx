import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import { DisciplinaryIncident, Employee, IncidentCategory, IncidentSeverity } from '../../types';
import {
  CATEGORY_SUGGESTIONS,
  buildDisciplinaryIncidentPayload,
} from './disciplinaryCreateHelpers';
import { DisciplinaryCreateFields } from './DisciplinaryCreateFields';

interface DisciplinaryCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onSubmit: (incident: DisciplinaryIncident) => void;
  authorName: string;
  authorRole?: string;
}

export const DisciplinaryCreateModal: React.FC<DisciplinaryCreateModalProps> = ({
  isOpen,
  onClose,
  employees,
  onSubmit,
  authorName,
  authorRole = 'Conseil de Direction',
}) => {
  const [employeeId, setEmployeeId] = useState('');
  const [category, setCategory] = useState<IncidentCategory>('retard_repete');
  const [date, setDate] = useState('');
  const [severity, setSeverity] = useState<IncidentSeverity>('moyen');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Bureaux Citrine (HQ)');
  const [witnesses, setWitnesses] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (employees && employees.length > 0) {
        if (!employeeId || !employees.some((e) => e.id === employeeId)) {
          setEmployeeId(employees[0].id);
        }
      } else {
        setEmployeeId('');
      }
      setDate(new Date().toISOString().split('T')[0]);
      setTitle('');
      setDescription('');
      setLocation('Bureaux Citrine (HQ)');
      setWitnesses('');
      setCategory('retard_repete');
      setSeverity('moyen');
      setSubmitError(null);
      setFieldErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, employees]);

  if (!isOpen) return null;

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleApplySuggestion = () => {
    const suggestion = CATEGORY_SUGGESTIONS[category];
    if (suggestion) {
      setDescription(suggestion);
      clearFieldError('description');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    if (!employees || employees.length === 0) {
      setSubmitError("Aucun collaborateur n'est enregistré dans l'entreprise pour consigner cet incident.");
      return;
    }

    const selectedEmp = employees.find((emp) => emp.id === employeeId) || employees[0];
    if (!selectedEmp) {
      setSubmitError('Veuillez sélectionner un collaborateur valide dans la liste.');
      return;
    }

    const errors: { [key: string]: string } = {};
    if (!date) errors.date = 'La date des faits est obligatoire.';
    if (!description.trim()) errors.description = 'La description factuelle des faits constatés est obligatoire.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitError('Veuillez compléter les champs obligatoires signalés en rouge ci-dessous.');
      return;
    }

    try {
      setIsSubmitting(true);
      const newIncident = buildDisciplinaryIncidentPayload({
        selectedEmp,
        date,
        category,
        severity,
        title,
        description,
        location,
        witnesses,
        authorName,
        authorRole,
      });
      onSubmit(newIncident);
      onClose();
    } catch (err: any) {
      console.error('Erreur lors de la consignation du fait:', err);
      setSubmitError(err?.message || "Une erreur inattendue est survenue lors de l'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        <div className="p-5 sm:p-6 border-b border-stone-100 relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 sm:right-5 sm:top-5 p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition cursor-pointer"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-600" /> Nouveau Constat RH
          </span>

          <h3 className="font-serif font-bold text-lg sm:text-xl text-stone-900">
            Consigner un Collaborateur / Ouvrir un Dossier
          </h3>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Enregistrez les faits observés pour instruction ou sanction disciplinaire.
          </p>
        </div>

        <form noValidate onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs font-semibold leading-relaxed">{submitError}</div>
            </div>
          )}

          {employees.length === 0 ? (
            <div className="p-6 text-center bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 space-y-2">
              <ShieldAlert className="h-8 w-8 text-amber-600 mx-auto" />
              <p className="font-bold">Aucun collaborateur trouvé</p>
              <p className="text-xs text-amber-700">
                Vous devez d'abord créer des collaborateurs dans l'onglet Collaborateurs pour pouvoir consigner un fait ou une sanction.
              </p>
            </div>
          ) : (
            <DisciplinaryCreateFields
              employees={employees}
              employeeId={employeeId}
              setEmployeeId={setEmployeeId}
              category={category}
              setCategory={setCategory}
              date={date}
              setDate={setDate}
              severity={severity}
              setSeverity={setSeverity}
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
              location={location}
              setLocation={setLocation}
              witnesses={witnesses}
              setWitnesses={setWitnesses}
              fieldErrors={fieldErrors}
              clearFieldError={clearFieldError}
              onApplySuggestion={handleApplySuggestion}
            />
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 font-bold text-stone-600 hover:bg-stone-100 rounded-xl transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || employees.length === 0}
              className="px-6 py-2.5 bg-[#2A7B76] hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? 'Consignation en cours...' : 'Consigner et Ouvrir le Dossier'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
