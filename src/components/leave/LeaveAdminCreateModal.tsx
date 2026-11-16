import React from 'react';
import { CalendarDays, X, Plus } from 'lucide-react';
import { LeaveType, LeaveStatus } from '../../types/leaveTypes';
import { Employee } from '../../types/employeeTypes';

interface LeaveAdminCreateModalProps {
  isOpen: boolean;
  employees: Employee[];
  createEmployeeId: string;
  onChangeEmployeeId: (id: string) => void;
  createLeaveType: LeaveType;
  onChangeLeaveType: (t: LeaveType) => void;
  createStartDate: string;
  onChangeStartDate: (d: string) => void;
  createEndDate: string;
  onChangeEndDate: (d: string) => void;
  createDaysCount: number;
  onChangeDaysCount: (n: number) => void;
  createStatus: LeaveStatus;
  onChangeStatus: (s: LeaveStatus) => void;
  createReason: string;
  onChangeReason: (r: string) => void;
  createManagerComment: string;
  onChangeManagerComment: (c: string) => void;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const LeaveAdminCreateModal: React.FC<LeaveAdminCreateModalProps> = ({
  isOpen,
  employees,
  createEmployeeId,
  onChangeEmployeeId,
  createLeaveType,
  onChangeLeaveType,
  createStartDate,
  onChangeStartDate,
  createEndDate,
  onChangeEndDate,
  createDaysCount,
  onChangeDaysCount,
  createStatus,
  onChangeStatus,
  createReason,
  onChangeReason,
  createManagerComment,
  onChangeManagerComment,
  isSubmitting,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4 my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-[#2A7B76] rounded-xl">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">Attribuer un Congé ou une Permission</h3>
              <p className="text-[11px] text-stone-500">Saisie administrative directe pour le compte d'un collaborateur</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-stone-700">Collaborateur bénéficiaire *</label>
            <select value={createEmployeeId} onChange={(e) => onChangeEmployeeId(e.target.value)} className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 outline-none focus:border-[#2A7B76]" required>
              <option value="">Sélectionner un collaborateur...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim()} — {emp.role || emp.department || 'Salarié'}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-stone-700">Type de congé ou d'absence *</label>
            <select value={createLeaveType} onChange={(e) => onChangeLeaveType(e.target.value as LeaveType)} className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 outline-none focus:border-[#2A7B76]">
              <option value="conge_annuel">Congé annuel payé</option>
              <option value="permission_exceptionnelle">Permission exceptionnelle (Famille / Événement)</option>
              <option value="maladie">Arrêt maladie (justifié)</option>
              <option value="sans_solde">Congé sans solde</option>
              <option value="maternite_paternite">Congé Maternité / Paternité</option>
              <option value="recuperation">Repos compensateur / Récupération</option>
              <option value="mission_professionnelle">Mission professionnelle / Déplacement</option>
              <option value="autre">Autre motif d'absence</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-stone-700">Date début *</label>
              <input type="date" value={createStartDate} onChange={(e) => onChangeStartDate(e.target.value)} className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 outline-none focus:border-[#2A7B76]" required />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-stone-700">Date fin *</label>
              <input type="date" value={createEndDate} onChange={(e) => onChangeEndDate(e.target.value)} className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 outline-none focus:border-[#2A7B76]" required />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1">
              <label className="font-bold text-stone-700">Nombre de jours décomptés</label>
              <input type="number" min={0.5} step={0.5} max={90} value={createDaysCount} onChange={(e) => onChangeDaysCount(parseFloat(e.target.value) || 1)} className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 outline-none focus:border-[#2A7B76]" required />
            </div>
            <div className="flex-1 space-y-1">
              <label className="font-bold text-stone-700">Décision immédiate</label>
              <select value={createStatus} onChange={(e) => onChangeStatus(e.target.value as LeaveStatus)} className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 outline-none focus:border-[#2A7B76]">
                <option value="approved">✓ Validé d'office (Par la Direction)</option>
                <option value="pending">⏳ En attente de décision</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-stone-700">Motif &amp; Justification *</label>
            <textarea rows={2} value={createReason} onChange={(e) => onChangeReason(e.target.value)} placeholder="Précisez le motif du congé ou de la permission accordée..." required className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs text-stone-800 resize-none outline-none focus:border-[#2A7B76]" />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-stone-700">Note ou consigne de la Direction (optionnel)</label>
            <input type="text" value={createManagerComment} onChange={(e) => onChangeManagerComment(e.target.value)} placeholder="Ex: Accord exceptionnel de la Direction Générale..." className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 outline-none focus:border-[#2A7B76]" />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl cursor-pointer transition">
              Annuler
            </button>
            <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-[#2A7B76] hover:bg-[#20635F] text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
              <Plus className="h-4 w-4" />
              <span>{isSubmitting ? 'Enregistrement...' : 'Enregistrer la permission'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
