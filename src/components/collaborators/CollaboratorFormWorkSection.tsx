import React from 'react';
import { Employee } from '../../types';
import { disciplinaryReasonsService } from '../../services/disciplinaryReasonsService';
import { AVAILABLE_TEAMS, CollaboratorFormData } from './collaboratorConstants';

interface CollaboratorFormWorkSectionProps {
  editingEmployee: Employee | null;
  formData: CollaboratorFormData;
  setFormData: React.Dispatch<React.SetStateAction<CollaboratorFormData>>;
  employees: Employee[];
}

export const CollaboratorFormWorkSection: React.FC<CollaboratorFormWorkSectionProps> = ({
  editingEmployee,
  formData,
  setFormData,
  employees,
}) => {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1.5 text-stone-500">🏢 Département d&apos;affectation *</label>
          <input
            type="text"
            list="departments-suggested"
            required
            placeholder="Ex: Informatique & IT, RH & Paie..."
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2A7B76] outline-none text-stone-800 text-xs font-semibold"
          />
          <datalist id="departments-suggested">
            <option value="Informatique & IT" />
            <option value="Ressources Humaines" />
            <option value="Finance & Comptabilité" />
            <option value="Opérations & Logistique" />
            <option value="Commercial & Partenariats" />
            <option value="Direction Générale & Stratégie" />
            <option value="Sécurité & HSE" />
          </datalist>
        </div>

        <div className="sm:col-span-2 space-y-2 bg-stone-50/80 p-3.5 rounded-2xl border border-stone-200">
          <div className="flex items-center justify-between">
            <label className="block text-stone-700 font-bold text-xs">
              👥 Équipes de Rattachement (Sélection multiple) *
            </label>
            <span className="text-[11px] text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
              {formData.teams.length} sélectionnée{formData.teams.length > 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-[11px] text-stone-500">
            Cliquez sur les équipes pour affecter ou retirer le collaborateur. Un collaborateur peut appartenir à plusieurs équipes simultanément.
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {AVAILABLE_TEAMS.map((teamName) => {
              const isSelected = formData.teams.includes(teamName);
              return (
                <button
                  key={teamName}
                  type="button"
                  onClick={() => {
                    const newTeams = isSelected
                      ? formData.teams.filter((t) => t !== teamName)
                      : [...formData.teams, teamName];
                    setFormData({ ...formData, teams: newTeams, team: newTeams.join(', ') });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-xs ring-2 ring-purple-300'
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-purple-50 hover:text-purple-700'
                  }`}
                >
                  <span className="text-xs">{isSelected ? '✓' : '+'}</span>
                  <span>{teamName}</span>
                </button>
              );
            })}
          </div>
          {formData.teams.length === 0 && (
            <span className="text-amber-600 text-[11px] font-semibold block pt-1">
              ⚠️ Aucune équipe sélectionnée. Veuillez sélectionner au moins une équipe de rattachement.
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1.5 text-stone-500">👔 Responsable Hiérarchique Direct</label>
          <select
            value={formData.managerId}
            onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2A7B76] outline-none text-stone-800 text-xs font-semibold"
          >
            <option value="">-- Aucun / Direction Générale --</option>
            {employees
              .filter((e) => !editingEmployee || e.id !== editingEmployee.id)
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.roleType || 'Collaborateur'})
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="block mb-1.5 text-stone-500">Statut Actuel *</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2A7B76] outline-none text-stone-800 text-xs font-semibold"
          >
            <option value="en_poste">En poste (Actif)</option>
            <option value="en_conge">En congés</option>
            <option value="en_permission">Permission</option>
            <option value="en_mission">En mission</option>
            <option value="maladie">Maladie</option>
            <option value="suspendu">Suspendu</option>
            <option value="parti">Départ</option>
            <option value="renvoye">Renvoyé</option>
          </select>
        </div>
      </div>

      {(formData.status === 'renvoye' || formData.status === 'suspendu') && (
        <div className="animate-in slide-in-from-top duration-300 space-y-2 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
          <label className="block text-stone-700 text-xs font-bold">
            {formData.status === 'renvoye' ? 'Motif de Renvoi RH *' : 'Motif de Suspension RH *'}
          </label>
          <select
            value={formData.status === 'renvoye' ? formData.departureReason || '' : formData.suspensionReason || ''}
            onChange={(e) => {
              const val = e.target.value;
              setFormData(
                formData.status === 'renvoye'
                  ? { ...formData, departureReason: val }
                  : { ...formData, suspensionReason: val }
              );
            }}
            className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-800 text-xs font-semibold focus:ring-2 focus:ring-[#2A7B76] outline-none"
          >
            <option value="">-- Sélectionner un motif réglementaire --</option>
            {disciplinaryReasonsService
              .getActiveReasons(formData.status === 'renvoye' ? 'renvoi' : 'suspension')
              .map((r) => (
                <option key={r.id} value={r.label}>
                  {r.label}
                </option>
              ))}
          </select>
          <input
            type="text"
            placeholder="Ou saisissez un motif personnalisé ici..."
            value={formData.status === 'renvoye' ? formData.departureReason || '' : formData.suspensionReason || ''}
            onChange={(e) => {
              const val = e.target.value;
              setFormData(
                formData.status === 'renvoye'
                  ? { ...formData, departureReason: val }
                  : { ...formData, suspensionReason: val }
              );
            }}
            className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-800 text-xs font-medium focus:ring-2 focus:ring-[#2A7B76] outline-none"
          />
        </div>
      )}
    </>
  );
};
