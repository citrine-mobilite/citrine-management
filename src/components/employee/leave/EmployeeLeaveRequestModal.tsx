import React from 'react';
import { CalendarDays, Clock, X, Compass, MapPin, Send } from 'lucide-react';
import { SearchableSelect } from '../../common/SearchableSelect';
import { LeaveType } from '../../../types';

interface EmployeeLeaveRequestModalProps {
  isOpen: boolean;
  modalMode: 'mission' | 'leave';
  leaveType: LeaveType;
  onChangeLeaveType: (t: LeaveType) => void;
  missionLocation: string;
  onChangeMissionLocation: (loc: string) => void;
  startDate: string;
  onChangeStartDate: (d: string) => void;
  endDate: string;
  onChangeEndDate: (d: string) => void;
  currentDurationDays: number;
  reason: string;
  onChangeReason: (r: string) => void;
  attachmentName: string;
  onChangeAttachmentName: (a: string) => void;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const EmployeeLeaveRequestModal: React.FC<EmployeeLeaveRequestModalProps> = ({
  isOpen,
  modalMode,
  leaveType,
  onChangeLeaveType,
  missionLocation,
  onChangeMissionLocation,
  startDate,
  onChangeStartDate,
  endDate,
  onChangeEndDate,
  currentDurationDays,
  reason,
  onChangeReason,
  attachmentName,
  onChangeAttachmentName,
  isSubmitting,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-3 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 border border-stone-200 shadow-2xl relative animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#2A7B76] border border-teal-100 flex items-center justify-center">
              {modalMode === 'mission' ? <Compass className="h-5 w-5" /> : <CalendarDays className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-base">
                {modalMode === 'mission' ? '🚀 Demande d’Ordre de Mission Professionnelle' : 'Déposer une demande de permission / congé'}
              </h3>
              <p className="text-[11px] text-stone-500">
                {modalMode === 'mission' ? 'Audit, déplacement extérieur, chantier, réunion client' : 'Transmise directement à votre responsable hiérarchique'}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          {modalMode === 'leave' && (
            <div className="space-y-1.5">
              <label className="font-bold text-stone-700">Type de congé / permission *</label>
              <SearchableSelect
                options={[
                  { value: 'conge_annuel', label: '🌴 Congé annuel payé' },
                  { value: 'permission_exceptionnelle', label: '💍 Permission exceptionnelle (Mariage, Décès, Naissance)' },
                  { value: 'maladie', label: '🏥 Arrêt maladie / Rendez-vous médical' },
                  { value: 'recuperation', label: '⏰ Repos compensateur / Récupération' },
                  { value: 'sans_solde', label: '📋 Congé sans solde' },
                  { value: 'maternite_paternite', label: '👶 Maternité / Paternité' },
                  { value: 'autre', label: "📝 Autre motif d'absence" },
                ]}
                value={leaveType}
                onChange={(val) => onChangeLeaveType(val as LeaveType)}
                placeholder="Sélectionner le type de demande"
                searchPlaceholder="Rechercher un type..."
              />
            </div>
          )}

          {modalMode === 'mission' && (
            <div className="space-y-1">
              <label className="font-bold text-stone-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#2A7B76]" />
                <span>Lieu / Destination de la mission *</span>
              </label>
              <input
                type="text"
                required
                value={missionLocation}
                onChange={(e) => onChangeMissionLocation(e.target.value)}
                placeholder="Ex: Yaoundé, Chantier Douala Port, Client Orange Cameroun..."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 focus:outline-none focus:border-[#2A7B76]"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-stone-700">Date de départ *</label>
              <input type="date" value={startDate} onChange={(e) => onChangeStartDate(e.target.value)} required className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 focus:outline-none focus:border-[#2A7B76]" />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-stone-700">Date de retour *</label>
              <input type="date" value={endDate} onChange={(e) => onChangeEndDate(e.target.value)} required className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 focus:outline-none focus:border-[#2A7B76]" />
            </div>
          </div>

          <div className="bg-emerald-50/80 border border-emerald-200/60 p-3 rounded-2xl flex items-center justify-between text-emerald-900">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              <span className="font-bold text-xs">Durée estimée :</span>
            </div>
            <span className="text-sm font-black text-emerald-800 font-mono">
              {currentDurationDays} jour{currentDurationDays > 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-stone-700">
              {modalMode === 'mission' ? 'Objectif et descriptif précis de la mission *' : 'Motif explicatif précis *'}
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => onChangeReason(e.target.value)}
              placeholder={modalMode === 'mission' ? 'Décrivez les tâches à accomplir, l’audit à réaliser ou l’objet du déplacement...' : 'Expliquez la raison de votre demande...'}
              required
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-800 focus:outline-none focus:border-[#2A7B76] resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-stone-700">
              {modalMode === 'mission' ? 'Réf. Ordre de mission / Bon de commande (facultatif)' : 'Référence justificatif (facultatif)'}
            </label>
            <input
              type="text"
              value={attachmentName}
              onChange={(e) => onChangeAttachmentName(e.target.value)}
              placeholder={modalMode === 'mission' ? 'Ex: Ordre de mission OM-2026-08, Billet...' : 'Ex: Certificat médical #492, Faire-part...'}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-[#2A7B76]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition cursor-pointer">
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold rounded-xl text-xs transition shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="h-4 w-4" />
              <span>{isSubmitting ? 'Transmission...' : modalMode === 'mission' ? 'Transmettre l’ordre de mission 🚀' : 'Transmettre ma demande'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
