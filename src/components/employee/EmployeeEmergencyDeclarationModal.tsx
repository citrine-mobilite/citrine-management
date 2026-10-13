import React from 'react';
import { HelpCircle, FileCheck2 } from 'lucide-react';
import { EmergencyType } from '../../types';
import { SearchableSelect } from '../common/SearchableSelect';

interface EmployeeEmergencyDeclarationModalProps {
  show: boolean;
  onClose: () => void;
  emergencyType: EmergencyType;
  setEmergencyType: (type: EmergencyType) => void;
  emergencyReason: string;
  setEmergencyReason: (reason: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
}

export const EmployeeEmergencyDeclarationModal: React.FC<EmployeeEmergencyDeclarationModalProps> = ({
  show,
  onClose,
  emergencyType,
  setEmergencyType,
  emergencyReason,
  setEmergencyReason,
  onSubmit,
  isSubmitting = false,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-2xl max-w-md w-full space-y-4 text-xs max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h3 className="font-serif font-bold text-stone-900 flex items-center gap-2 text-sm">
            <HelpCircle className="h-5 w-5 text-[#2A7B76]" /> *Autre* — Déclaration & Justification RH
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-stone-500">
              Type de déclaration :
            </label>
            <SearchableSelect
              value={emergencyType}
              onChange={(val) => setEmergencyType(val as EmergencyType)}
              options={[
                { value: 'sortie_professionnelle', label: '1. Sortie Professionnelle (Mission / Déplacement)', badge: 'Sortie Pro', badgeColor: 'bg-blue-100 text-blue-900' },
                { value: 'retour_sortie_professionnelle', label: '2. Retour de Sortie Professionnelle', badge: 'Retour Pro', badgeColor: 'bg-indigo-100 text-indigo-900' },
                { value: 'retard', label: '3. Retard à l\'arrivée', badge: 'Retard', badgeColor: 'bg-amber-100 text-amber-900' },
                { value: 'depart_anticipe', label: '4. Départ anticipé du bureau', badge: 'Départ', badgeColor: 'bg-rose-100 text-rose-900' },
                { value: 'permission', label: '5. Demande de permission / Absence', badge: 'Permission', badgeColor: 'bg-purple-100 text-purple-900' },
                { value: 'pause_anticipee', label: '6. Départ en pause anticipée', badge: 'Pause', badgeColor: 'bg-teal-100 text-teal-900' },
                { value: 'rallonge_pause', label: '7. Rallonge de pause exceptionnelle', badge: 'Rallonge', badgeColor: 'bg-cyan-100 text-cyan-900' },
                { value: 'autre', label: '8. Autre situation exceptionnelle / Urgence', badge: 'Autre', badgeColor: 'bg-stone-100 text-stone-900' },
              ]}
              placeholder="Sélectionner la situation..."
              searchPlaceholder="Rechercher type..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-stone-500">
              Motif circonstancié (obligatoire) :
            </label>
            <textarea
              required
              rows={3}
              value={emergencyReason}
              onChange={(e) => setEmergencyReason(e.target.value)}
              placeholder="Ex: Mission client à Akwa, rendez-vous d'affaires, embouteillage imprévu, démarche personnelle..."
              className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50/60 font-medium text-xs focus:outline-none focus:border-[#2A7B76] text-stone-800"
            />
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-stone-700 text-[11px] flex items-start gap-2">
            <FileCheck2 className="h-4 w-4 text-[#2A7B76] shrink-0 mt-0.5" />
            <p>
              Cette déclaration sera horodatée, transmise directement au service RH et consignée dans votre registre d'assiduité.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !emergencyReason.trim()}
              className="px-4 py-2 bg-[#2A7B76] hover:bg-[#20635F] disabled:opacity-50 text-white rounded-xl font-bold transition cursor-pointer shadow-xs"
            >
              {isSubmitting ? 'Transmission...' : 'Enregistrer la déclaration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
