import React from 'react';
import { X, Save } from 'lucide-react';
import { Presence } from '../../types';
import FrenchTimePicker from '../employee/FrenchTimePicker';

interface EditFormState {
  arrivalTime: string;
  pauseStart: string;
  pauseEnd: string;
  departureTime: string;
  status: Presence['status'];
  location: string;
  correctionReason: string;
}

interface PresenceManualEditModalProps {
  isOpen: boolean;
  editingPresence: Presence | null;
  editForm: EditFormState;
  onChangeForm: (form: EditFormState) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const PresenceManualEditModal: React.FC<PresenceManualEditModalProps> = ({
  isOpen,
  editingPresence,
  editForm,
  onChangeForm,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  const isTimeChanged = Boolean(
    editingPresence &&
      (editForm.arrivalTime !== (editingPresence.arrivalTime || '') ||
        editForm.pauseStart !== (editingPresence.pauseStart || '') ||
        editForm.pauseEnd !== (editingPresence.pauseEnd || '') ||
        editForm.departureTime !== (editingPresence.departureTime || ''))
  );

  return (
    <div className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-stone-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <h3 className="font-serif font-bold text-base text-stone-900">Éditer le pointage collaborateur</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-stone-400 hover:bg-stone-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs font-bold text-stone-600">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-stone-500">Heure d'arrivée</label>
              <FrenchTimePicker
                value={editForm.arrivalTime}
                onChange={(val) => onChangeForm({ ...editForm, arrivalTime: val })}
              />
            </div>
            <div>
              <label className="block mb-1 text-stone-500">Heure de départ</label>
              <FrenchTimePicker
                value={editForm.departureTime}
                onChange={(val) => onChangeForm({ ...editForm, departureTime: val })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-stone-500">Début Pause</label>
              <FrenchTimePicker
                value={editForm.pauseStart}
                onChange={(val) => onChangeForm({ ...editForm, pauseStart: val })}
              />
            </div>
            <div>
              <label className="block mb-1 text-stone-500">Fin Pause</label>
              <FrenchTimePicker
                value={editForm.pauseEnd}
                onChange={(val) => onChangeForm({ ...editForm, pauseEnd: val })}
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-stone-500">Statut de la fiche</label>
            <select
              value={editForm.status}
              onChange={(e) => onChangeForm({ ...editForm, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-stone-200 bg-stone-50 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#2A7B76] outline-none"
            >
              <option value="present">Présent (À l'heure)</option>
              <option value="late">En retard</option>
              <option value="absent">Absent</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 text-stone-500">Lieu de pointage</label>
            <input
              type="text"
              value={editForm.location}
              onChange={(e) => onChangeForm({ ...editForm, location: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 bg-stone-50 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#2A7B76] outline-none"
            />
          </div>

          {isTimeChanged && (
            <div className="space-y-1 bg-amber-50 p-3 rounded-2xl border border-amber-100 animate-in fade-in">
              <label className="block text-stone-800 font-extrabold mb-1">
                Motif de la modification *
              </label>
              <textarea
                required
                rows={2}
                placeholder="Indiquez la raison du changement d'heure (ex: Retard de transport, oubli de pointage...)"
                value={editForm.correctionReason}
                onChange={(e) => onChangeForm({ ...editForm, correctionReason: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 bg-white rounded-xl text-xs font-medium focus:ring-1 focus:ring-amber-500 outline-none"
              />
              <span className="text-[9px] text-amber-700 italic">
                La modification d'une heure de présence requiert obligatoirement une justification réglementaire.
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-bold cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#2A7B76] text-white hover:bg-[#20635F] font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Save className="h-4 w-4" />
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
