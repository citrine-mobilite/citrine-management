import React, { useState, useEffect } from 'react';
import { ShieldAlert, Calendar, X } from 'lucide-react';
import { Employee } from '../../types';
import { disciplinaryReasonsService, DisciplinaryReason } from '../../services/disciplinaryReasonsService';

interface CollaboratorStatusReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  targetStatus: Employee['status'];
  onConfirm: (empId: string, status: Employee['status'], reason: string, startDate: string, endDate: string) => void;
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
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    if (isOpen) {
      let cat: string | undefined = undefined;
      if (targetStatus === 'renvoye') cat = 'renvoi';
      else if (targetStatus === 'suspendu') cat = 'suspension';
      else if (targetStatus === 'en_conge') cat = 'conge';
      else if (targetStatus === 'en_mission') cat = 'mission';
      else if (targetStatus === 'maladie') cat = 'maladie';

      const list = disciplinaryReasonsService.getActiveReasons(cat as any);
      setReasons(list);
      if (list.length > 0) {
        setSelectedReason(list[0].label);
      } else {
        setSelectedReason('Motif réglementaire standard');
      }
      setIsCustomMode(false);
      setCustomReasonText('');
      setStartDate(new Date().toISOString().split('T')[0]);
      const future = new Date();
      future.setDate(future.getDate() + 7);
      setEndDate(future.toISOString().split('T')[0]);
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
      const cat = targetStatus === 'renvoye' ? 'renvoi' : targetStatus === 'suspendu' ? 'suspension' : 'commun';
      const created = disciplinaryReasonsService.addCustomReason(customReasonText.trim(), cat);
      finalReason = created.label;
    }

    if (!startDate || !endDate) {
      if (showToast) showToast('Veuillez renseigner la date de début et la date de fin.', 'error');
      return;
    }

    onConfirm(employee.id, targetStatus, finalReason, startDate, endDate);
    onClose();
  };

  const getTitle = () => {
    switch (targetStatus) {
      case 'en_conge': return 'Mise en Congés du Collaborateur';
      case 'en_permission': return 'Mise en Permission';
      case 'en_mission': return 'Affectation en Mission Professionnelle';
      case 'maladie': return 'Déclaration d\'Arrêt Maladie';
      case 'suspendu': return 'Suspension Conservatoire';
      case 'renvoye': return 'Renvoi / Licenciement';
      case 'parti': return 'Départ de l\'Entreprise';
      default: return 'Changement de Statut RH';
    }
  };

  const getStatusLabel = () => {
    switch (targetStatus) {
      case 'en_conge': return 'En congés';
      case 'en_permission': return 'En permission';
      case 'en_mission': return 'En mission';
      case 'maladie': return 'Maladie';
      case 'suspendu': return 'Suspendu';
      case 'renvoye': return 'Renvoyé';
      case 'parti': return 'Départ';
      default: return targetStatus;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-stone-200 space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <h3 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-[#2A7B76]" /> {getTitle()}
          </h3>
          <button onClick={onClose} className="p-1 rounded-xl text-stone-400 hover:bg-stone-100 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Collaborateur ciblé :</span>
            <span className="font-bold text-stone-900 text-sm block">{employee.name}</span>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-stone-500 text-[11px]">{employee.roleType} - {employee.department}</span>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-[10px]">
                Nouveau statut : {getStatusLabel()}
              </span>
            </div>
          </div>

          {/* Motif */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-stone-600 block">
              Motif du changement de statut * :
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
              <option value="CUSTOM">+ Autre motif personnalisé (Saisir)...</option>
            </select>
          </div>

          {isCustomMode && (
            <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
              <label className="text-[10px] uppercase font-bold text-[#2A7B76] block">
                Préciser le motif :
              </label>
              <textarea
                required
                rows={2}
                value={customReasonText}
                onChange={(e) => setCustomReasonText(e.target.value)}
                placeholder="Ex: Mission d'audit sur site à Kribi..."
                className="w-full px-3 py-2 bg-white border border-[#2A7B76]/50 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#2A7B76]"
              />
            </div>
          )}

          {/* Dates de début et de fin */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-stone-600 block flex items-center gap-1">
                <Calendar className="h-3 w-3 text-[#2A7B76]" /> Date de début * :
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none focus:border-[#2A7B76]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-stone-600 block flex items-center gap-1">
                <Calendar className="h-3 w-3 text-[#2A7B76]" /> Date de fin * :
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none focus:border-[#2A7B76]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#2A7B76] hover:bg-[#23635F] text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
            >
              Enregistrer le Statut & Période
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
