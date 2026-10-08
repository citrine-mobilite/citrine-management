import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { DisciplinaryIncident, Employee, IncidentCategory, IncidentSeverity } from '../../types';

interface DisciplinaryCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onSubmit: (incident: DisciplinaryIncident) => void;
  authorName: string;
  authorRole?: string;
}

const CATEGORY_LABELS: Record<IncidentCategory, string> = {
  retard_repete: 'Retards Répétés',
  absence_injustifiee: 'Absence Injustifiée',
  insubordination: 'Insubordination / Non-respect des consignes',
  negligence_materiel: 'Négligence de matériel',
  faute_professionnelle: 'Faute Professionnelle',
  comportement_inadapte: 'Comportement Inadapté',
  autre: 'Autre manquement',
};

const CATEGORY_SUGGESTIONS: Record<IncidentCategory, string> = {
  retard_repete: 'Retards successifs constatés aux prises de poste sans justificatif valable transmis à la hiérarchie.',
  absence_injustifiee: 'Absence non autorisée et non justifiée au poste de travail sans information préalable.',
  insubordination: 'Refus de se conformer aux consignes directes de travail et aux instructions de service.',
  negligence_materiel: 'Négligence manifeste et défaut d\'entretien sur les équipements ou matériels de travail confiés.',
  faute_professionnelle: 'Manquement avéré aux obligations contractuelles et aux règles d\'exercice professionnel.',
  comportement_inadapte: 'Attitude inconvenante contraire au bon fonctionnement du service et au règlement intérieur.',
  autre: 'Constat de manquement disciplinaire porté à l\'attention de la direction.',
};

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

  // Synchroniser à l'ouverture du modal
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

  const handleApplySuggestion = () => {
    const suggestion = CATEGORY_SUGGESTIONS[category];
    if (suggestion) {
      setDescription(suggestion);
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.description;
        return next;
      });
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
      setSubmitError("Veuillez sélectionner un collaborateur valide dans la liste.");
      return;
    }

    const errors: { [key: string]: string } = {};

    if (!date) {
      errors.date = 'La date des faits est obligatoire.';
    }

    if (!description.trim()) {
      errors.description = 'La description factuelle des faits constatés est obligatoire.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitError('Veuillez compléter les champs obligatoires signalés en rouge ci-dessous.');
      return;
    }

    try {
      setIsSubmitting(true);
      const empName = (selectedEmp.name || `${selectedEmp.firstName || ''} ${selectedEmp.lastName || ''}`.trim()) || 'Collaborateur';
      const categoryLabel = CATEGORY_LABELS[category] || category;
      const finalTitle = title.trim() || `Manquement : ${categoryLabel} (${empName})`;

      const newIncident: DisciplinaryIncident = {
        id: `DISC-2026-${Math.floor(100 + Math.random() * 900)}`,
        employeeId: selectedEmp.id,
        employeeName: empName,
        employeeRole: selectedEmp.role || selectedEmp.roleType || 'Collaborateur',
        employeeDepartment: selectedEmp.department || 'Direction Générale & Stratégie',
        date: date || new Date().toISOString().split('T')[0],
        category,
        severity,
        title: finalTitle,
        description: description.trim(),
        location: location.trim() || 'Bureaux Citrine (HQ)',
        witnesses: witnesses.trim(),
        reportedBy: authorName || 'Conseil de Direction',
        reportedByRole: authorRole,
        status: 'ouvert',
        ruleViolated: 'Article 14 - Règlement Intérieur',
        comments: [],
        history: [
          {
            id: `h-${Date.now()}`,
            date: new Date().toISOString(),
            action: 'Ouverture du dossier disciplinaire',
            authorName: authorName || 'Conseil de Direction',
            notes: 'Enregistrement initial du constat RH et consignation du dossier.',
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

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
        {/* Header */}
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

        {/* Form Container with scroll */}
        <form noValidate onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Global Alert in case of error */}
          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs font-semibold leading-relaxed">
                {submitError}
              </div>
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
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Field 1: Collaborateur concerné */}
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Collaborateur concerné <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={employeeId}
                    onChange={(e) => {
                      setEmployeeId(e.target.value);
                      if (fieldErrors.employeeId) {
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.employeeId;
                          return next;
                        });
                      }
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

                {/* Field 2: Nature du manquement */}
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
                {/* Field 3: Date des faits */}
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Date des faits <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      if (fieldErrors.date) {
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.date;
                          return next;
                        });
                      }
                    }}
                    className={`w-full p-2.5 bg-stone-50 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-[#2A7B76] outline-none ${
                      fieldErrors.date ? 'border-rose-400 bg-rose-50/30' : 'border-stone-200/90'
                    }`}
                  />
                  {fieldErrors.date && (
                    <p className="text-[10px] text-rose-600 font-bold mt-1">{fieldErrors.date}</p>
                  )}
                </div>

                {/* Field 4: Degré de gravité */}
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

              {/* Field 5: Titre / Résumé du motif */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-stone-800">
                    Titre / Résumé du motif
                  </label>
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

              {/* Field 6: Description factuelle */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-stone-800">
                    Description factuelle des faits constatés <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleApplySuggestion}
                    className="inline-flex items-center gap-1 text-[11px] text-[#2A7B76] hover:text-emerald-800 font-bold transition cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3" /> Insérer un motif type
                  </button>
                </div>
                <textarea
                  rows={3}
                  placeholder="Précisez les circonstances exactes, les horaires constatés, les impacts sur le service..."
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (fieldErrors.description) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.description;
                        return next;
                      });
                    }
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
                {/* Field 7: Lieu */}
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Lieu de survenance
                  </label>
                  <input
                    type="text"
                    placeholder="Bureaux Citrine (HQ)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200/90 text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
                  />
                </div>

                {/* Field 8: Témoins */}
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Témoins éventuels
                  </label>
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
          )}

          {/* Footer Actions */}
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

