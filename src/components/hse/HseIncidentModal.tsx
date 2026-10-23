import React, { useState } from 'react';
import { X } from 'lucide-react';
import { HseIncident, HseIncidentType, HseSeverity, HseStatus, Employee, AppUser } from '../../types';
import { SearchableSelect, SelectOption } from '../common/SearchableSelect';

interface HseIncidentModalProps {
  initialIncident?: HseIncident | null;
  employees: Employee[];
  currentUser?: AppUser | null;
  onClose: () => void;
  onSave: (incidentData: Partial<HseIncident>) => Promise<void>;
}

export const HseIncidentModal: React.FC<HseIncidentModalProps> = ({
  initialIncident,
  employees = [],
  currentUser,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<HseIncident>>({
    site: initialIncident?.site || 'Base Japoma - Carrefour Matango',
    zonePrecise: initialIncident?.zonePrecise || '',
    type: initialIncident?.type || 'presque_accident',
    severity: initialIncident?.severity || 'faible',
    status: initialIncident?.status || 'signale',
    date: initialIncident?.date || new Date().toISOString().split('T')[0],
    time: initialIncident?.time || new Date().toTimeString().slice(0, 5),
    title: initialIncident?.title || '',
    description: initialIncident?.description || '',
    immediateActionTaken: initialIncident?.immediateActionTaken || '',
    rootCause: initialIncident?.rootCause || '',
    victimName: initialIncident?.victimName || '',
    victimInjury: initialIncident?.victimInjury || '',
    daysLost: initialIncident?.daysLost || 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const siteOptions: SelectOption[] = [
    { value: 'Base Japoma - Carrefour Matango', label: 'Base Japoma - Carrefour Matango' },
  ];

  const typeOptions: SelectOption[] = [
    { value: 'presque_accident', label: 'Presque-accident (Near-miss)' },
    { value: 'situation_dangereuse', label: 'Situation dangereuse' },
    { value: 'accident_sans_arret', label: 'Accident sans arrêt' },
    { value: 'accident_avec_arret', label: 'Accident avec arrêt' },
    { value: 'deversement_chimique', label: 'Déversement / Fuite huile' },
    { value: 'incendie_debut', label: 'Risque Incendie' },
    { value: 'degradation_materiel', label: 'Dommage matériel' },
  ];

  const severityOptions: SelectOption[] = [
    { value: 'faible', label: 'Faible (Aucune séquelle)' },
    { value: 'modere', label: 'Modéré' },
    { value: 'grave', label: 'Grave' },
    { value: 'critique', label: 'Critique (Arrêt d\'activité)' },
  ];

  const statusOptions: SelectOption[] = [
    { value: 'signale', label: 'Signalé' },
    { value: 'en_cours_analyse', label: 'En cours d\'analyse' },
    { value: 'actions_lancees', label: 'Actions lancées' },
    { value: 'cloture', label: 'Clôturé' },
  ];

  const employeeOptions: SelectOption[] = [
    { value: '', label: 'Aucun / Personne externe' },
    ...employees.map((e) => ({
      value: e.name,
      label: `${e.name} (${e.roleType || 'Employé'} - ${e.department || 'Général'})`,
    })),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 border border-stone-200 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-stone-900">
            {initialIncident ? `Modifier l'incident ${initialIncident.reference}` : 'Déclarer un Incident / Danger HSE'}
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-semibold text-stone-700">Titre de l'événement *</label>
            <input
              type="text"
              required
              placeholder="ex: Câble électrique dénudé près du quai Japoma"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-[#2A7B76]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Site d'occurrence</label>
              <SearchableSelect
                options={siteOptions}
                value={formData.site || ''}
                onChange={(val) => setFormData({ ...formData, site: String(val) })}
                placeholder="Sélectionner le site..."
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Zone précise</label>
              <input
                type="text"
                placeholder="ex: Fosse vidange / Parking"
                value={formData.zonePrecise}
                onChange={(e) => setFormData({ ...formData, zonePrecise: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-[#2A7B76]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Nature de l'événement</label>
              <SearchableSelect
                options={typeOptions}
                value={formData.type || 'presque_accident'}
                onChange={(val) => setFormData({ ...formData, type: val as HseIncidentType })}
                placeholder="Sélectionner la nature..."
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Niveau de gravité</label>
              <SearchableSelect
                options={severityOptions}
                value={formData.severity || 'faible'}
                onChange={(val) => setFormData({ ...formData, severity: val as HseSeverity })}
                placeholder="Sélectionner la gravité..."
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Statut</label>
              <SearchableSelect
                options={statusOptions}
                value={formData.status || 'signale'}
                onChange={(val) => setFormData({ ...formData, status: val as HseStatus })}
                placeholder="Sélectionner le statut..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Collaborateur / Victime impliquée</label>
              <SearchableSelect
                options={employeeOptions}
                value={formData.victimName || ''}
                onChange={(val) => setFormData({ ...formData, victimName: String(val) })}
                placeholder="Rechercher un collaborateur..."
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Nature de la blessure / Dommage</label>
              <input
                type="text"
                placeholder="ex: Écorchure avant-bras (aucun arrêt)"
                value={formData.victimInjury || ''}
                onChange={(e) => setFormData({ ...formData, victimInjury: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-[#2A7B76]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-stone-700">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-[#2A7B76]"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700">Heure</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-[#2A7B76]"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700">Jours d'arrêt (si applicable)</label>
              <input
                type="number"
                min="0"
                value={formData.daysLost ?? 0}
                onChange={(e) => setFormData({ ...formData, daysLost: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-[#2A7B76]"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-stone-700">Description détaillée des faits *</label>
            <textarea
              rows={3}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Que s'est-il passé exactement ? Qui était présent ? Comment le danger a-t-il été découvert ?"
              className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-[#2A7B76]"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700">Action d'urgence prise immédiatement</label>
            <input
              type="text"
              value={formData.immediateActionTaken}
              onChange={(e) => setFormData({ ...formData, immediateActionTaken: e.target.value })}
              placeholder="ex: Balisage avec ruban, coupure disjoncteur..."
              className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-[#2A7B76]"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700">Cause racine identifiée (analyse)</label>
            <input
              type="text"
              value={formData.rootCause || ''}
              onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })}
              placeholder="ex: Fuite joint non signalée lors de la check-list"
              className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-[#2A7B76]"
            />
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-stone-200 text-stone-600 rounded-xl hover:bg-stone-50 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700 transition cursor-pointer"
            >
              {isSubmitting ? 'Enregistrement...' : initialIncident ? 'Mettre à jour' : 'Enregistrer le signalement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
