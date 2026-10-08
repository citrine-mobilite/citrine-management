import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Check, X, Plus } from 'lucide-react';
import { Employee } from '../../types';
import { disciplinaryReasonsService, DisciplinaryReason } from '../../services/disciplinaryReasonsService';

interface CollaboratorStatusReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  targetStatus: 'renvoye' | 'suspendu' | 'parti';
  onConfirm: (empId: string, status: Employee['status'], reason: string) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export const CollaboratorStatusReasonModal: React.FC<CollaboratorStatusReasonModalProps> = ({
  isOpen,
  onClose,
  employee,
  targetStatus,
  onConfirm,
  showToast,
}) => {
  const [reasons, setReasons] = useState<DisciplinaryReason[]>([]);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReasonText, setCustomReasonText] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const cat = targetStatus === 'renvoye' ? 'renvoi' : targetStatus === 'suspendu' ? 'suspension' : undefined;
      const list = disciplinaryReasonsService.getActiveReasons(cat);
      setReasons(list);
      if (list.length > 0) {
        setSelectedReason(list[0].label);
      }
      setIsCustomMode(false);
      setCustomReasonText('');
    }
  }, [isOpen, targetStatus]);

  if (!isOpen || !employee) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalReason = selectedReason;

    if (isCustomMode) {
      if (!customReasonText.trim()) {
        if (showToast) showToast('Veuillez préciser le motif personnalisé.', 'error');
        return;
      }
      const cat = targetStatus === 'renvoye' ? 'renvoi' : targetStatus === 'suspension' ? 'suspension' : 'commun';
      const created = disciplinaryReasonsService.addCustomReason(customReasonText.trim(), cat);
      finalReason = created.label;
    }

    onConfirm(employee.id, targetStatus, finalReason);
    onClose();
  };

  const getTitle = () => {
    if (targetStatus === 'renvoye') return 'Confirmation du Renvoi de Collaborateur';
    if (targetStatus === 'suspendu') return 'Confirmation de la Suspension de Collaborateur';
    return 'Motif de Départ du Collaborateur';
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-stone-200 space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <h3 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-600" /> {getTitle()}
          </h3>
          <button onClick={onClose} className="p-1 rounded-xl text-stone-400 hover:bg-stone-100 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Collaborateur ciblé :</span>
            <span className="font-bold text-stone-900 text-sm block">{employee.name}</span>
            <span className="text-stone-500 text-[11px] block">{employee.roleType} - {employee.department}</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-stone-600 block">
              Sélectionnez le motif réglementaire ({reasons.length} disponibles) :
            </label>

            <select
              value={isCustomMode ? 'CUSTOM' : selectedReason}
              onChange={(e) => {
                if (e.target.value === 'CUSTOM') {
                  setIsCustomMode(true);
                } else {
                  setIsCustomMode(false);
                  setSelectedReason(e.target.value);
                }
              }}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none focus:border-[#2A7B76]"
            >
              {reasons.map((r) => (
                <option key={r.id} value={r.label}>
                  {r.label}
                </option>
              ))}
              <option value="CUSTOM">+ Autre motif personnalisé (Créer nouveau)...</option>
            </select>
          </div>

          {isCustomMode && (
            <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
              <label className="text-[10px] uppercase font-bold text-[#2A7B76] block">
                Saisir le nouveau motif RH :
              </label>
              <textarea
                required
                rows={2}
                value={customReasonText}
                onChange={(e) => setCustomReasonText(e.target.value)}
                placeholder="Ex: Refus systématique de signer les feuilles de pointage..."
                className="w-full px-3 py-2 bg-white border border-[#2A7B76]/50 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#2A7B76]"
              />
              <p className="text-[10px] text-stone-400">
                Ce nouveau motif sera automatiquement enregistré dans la table admin pour les prochains usages.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
            >
              Valider le Statut & Motif
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
