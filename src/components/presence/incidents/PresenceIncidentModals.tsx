import React from 'react';
import { ShieldAlert, X, FileCheck2 } from 'lucide-react';
import { AttendanceIncident, Employee } from '../../../types';
import { getIncidentTypeLabel } from './usePresenceIncidentsLogic';

interface PresenceIncidentModalsProps {
  employees: Employee[];
  selectedIncidentForJustification: AttendanceIncident | null;
  onCloseJustification: () => void;
  adminNote: string;
  setAdminNote: (v: string) => void;
  onJustifyIncident: (incident: AttendanceIncident, justifie: boolean) => void;
  showCreateModal: boolean;
  onCloseCreateModal: () => void;
  newEmployeeId: string;
  setNewEmployeeId: (v: string) => void;
  newType: AttendanceIncident['type'];
  setNewType: (v: AttendanceIncident['type']) => void;
  newDate: string;
  setNewDate: (v: string) => void;
  newTime: string;
  setNewTime: (v: string) => void;
  newReason: string;
  setNewReason: (v: string) => void;
  newAdminNote: string;
  setNewAdminNote: (v: string) => void;
  isCreating: boolean;
  onCreateManualIncident: () => void;
}

export const PresenceIncidentModals: React.FC<PresenceIncidentModalsProps> = ({
  employees,
  selectedIncidentForJustification,
  onCloseJustification,
  adminNote,
  setAdminNote,
  onJustifyIncident,
  showCreateModal,
  onCloseCreateModal,
  newEmployeeId,
  setNewEmployeeId,
  newType,
  setNewType,
  newDate,
  setNewDate,
  newTime,
  setNewTime,
  newReason,
  setNewReason,
  newAdminNote,
  setNewAdminNote,
  isCreating,
  onCreateManualIncident,
}) => {
  return (
    <>
      {selectedIncidentForJustification && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-stone-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-[#2A7B76]" /> Décision RH sur l&apos;Incident
              </h3>
              <button
                onClick={onCloseJustification}
                className="p-1 rounded-xl text-stone-400 hover:bg-stone-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 bg-stone-50 p-3 rounded-2xl border border-stone-200/80">
              <div>
                <span className="text-[10px] text-stone-400 font-bold uppercase block">Collaborateur</span>
                <span className="font-bold text-stone-900">{selectedIncidentForJustification.employeeName}</span>
              </div>
              <div className="flex justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Date & Heure</span>
                  <span className="font-semibold text-stone-800">
                    {selectedIncidentForJustification.date} à {selectedIncidentForJustification.timeString}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Type</span>
                  <span className="font-bold text-stone-800 uppercase text-[11px]">
                    {getIncidentTypeLabel(selectedIncidentForJustification.type)}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 font-bold uppercase block">Motif constaté</span>
                <p className="text-stone-700 italic">{selectedIncidentForJustification.reason}</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-stone-600 block">
                Observation de la Direction / Motif d&apos;approbation :
              </label>
              <textarea
                rows={2}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Ex: Justificatif médical reçu, embouteillage vérifié..."
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#2A7B76] text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => onJustifyIncident(selectedIncidentForJustification, false)}
                className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold cursor-pointer"
              >
                Classer Non Justifié
              </button>
              <button
                onClick={() => onJustifyIncident(selectedIncidentForJustification, true)}
                className="px-4 py-2 rounded-xl bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold cursor-pointer shadow-xs"
              >
                Valider & Justifier
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-3 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-stone-200 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-600" />
                <span>Nouveau Signalement Manuel de Présence</span>
              </h3>
              <button
                onClick={onCloseCreateModal}
                className="p-1 rounded-xl text-stone-400 hover:bg-stone-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Consignez un manquement, un départ précipité ou une absence constatée sans validation managériale.
            </p>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-stone-700">Collaborateur concerné *</label>
              <select
                value={newEmployeeId}
                onChange={(e) => setNewEmployeeId(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#2A7B76]"
              >
                <option value="">Sélectionnez un employé...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.roleType || 'Employé'}) - {emp.department || 'Opérations'}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-stone-700">Type d&apos;incident</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#2A7B76]"
              >
                <option value="absence_injustifiee">Absence injustifiée / Départ sans validation</option>
                <option value="depart_sans_validation">Départ avant approbation de congé</option>
                <option value="depart_anticipe">Départ anticipé non autorisé</option>
                <option value="sortie_prematuree">Sortie de poste non autorisée</option>
                <option value="retard">Retard non justifié</option>
                <option value="autre">Autre anomalie de présence</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700">Date de l&apos;incident</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Heure de l&apos;incident</label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-800"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-stone-700">Motif & faits constatés *</label>
              <textarea
                rows={3}
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="Ex: A sollicité une absence de 2 jours et est parti sans que l'on ne valide..."
                required
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 resize-none focus:outline-none focus:border-[#2A7B76]"
              />
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-stone-700">Observation administrative</label>
              <input
                type="text"
                value={newAdminNote}
                onChange={(e) => setNewAdminNote(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-[#2A7B76]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={onCloseCreateModal}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={onCreateManualIncident}
                disabled={isCreating}
                className="px-5 py-2 bg-[#2A7B76] hover:bg-[#20635F] text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <ShieldAlert className="h-4 w-4" />
                <span>{isCreating ? 'Enregistrement...' : 'Enregistrer le signalement'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
