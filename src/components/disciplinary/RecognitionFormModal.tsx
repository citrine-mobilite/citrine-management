import React, { useState } from 'react';
import { Trophy, X } from 'lucide-react';
import { Employee, EmployeeRecognition } from '../../types';
import { ModalPortal } from '../common/ModalPortal';

interface RecognitionFormModalProps {
  isOpen: boolean;
  employees: Employee[];
  currentUserName: string;
  onClose: () => void;
  onAddRecognition: (recognition: EmployeeRecognition) => void;
}

export const RecognitionFormModal: React.FC<RecognitionFormModalProps> = ({
  isOpen,
  employees,
  currentUserName,
  onClose,
  onAddRecognition,
}) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [type, setType] = useState<'employe_du_mois' | 'trophee' | 'felicitations' | 'prime_performance' | 'autre'>('employe_du_mois');
  const [title, setTitle] = useState("Employé du Mois d'Octobre");
  const [description, setDescription] = useState('Pour sa ponctualité exemplaire, son professionnalisme et son implication remarquable.');
  const [period, setPeriod] = useState('Octobre 2026');
  const [bonusAmount, setBonusAmount] = useState<number>(0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((item) => item.id === selectedEmployeeId);
    if (!emp) return;

    const newRec: EmployeeRecognition = {
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      employeeId: emp.id,
      employeeName: emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
      employeeRole: emp.role || 'Collaborateur',
      type,
      title: title || (type === 'employe_du_mois' ? `Employé du Mois (${period})` : "Distinction d'Excellence"),
      description,
      period,
      awardedAt: new Date().toISOString().split('T')[0],
      awardedBy: currentUserName,
      bonusAmount: 0,
      badgeIcon: type === 'employe_du_mois' ? 'Trophy' : type === 'trophee' ? 'Medal' : 'Award',
    };

    onAddRecognition(newRec);
    onClose();
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
          <div className="bg-[#2A7B76] p-5 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <Trophy className="h-5 w-5 text-emerald-200" />
              <h3 className="font-serif font-bold text-base">Attribuer une Distinction</h3>
            </div>
            <button onClick={onClose} className="text-emerald-100 hover:text-white cursor-pointer">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Collaborateur à honorer *</label>
              <select
                required
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200 font-bold focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="">-- Choisir un collaborateur --</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name || `${e.firstName || ''} ${e.lastName || ''}`.trim()} ({e.role || 'Collaborateur'})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Type de Distinction *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200 font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="employe_du_mois">Employé du Mois</option>
                  <option value="trophee">Trophée du Mérite</option>
                  <option value="prime_performance">Prime de Performance</option>
                  <option value="felicitations">Félicitations Officielles</option>
                  <option value="autre">Autre Distinction</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Mois / Période *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Octobre 2026"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Titre de la récompense *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Motif / Éloge de la distinction *</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Prime financière (Optionnelle en FCFA)</label>
              <input
                type="number"
                step="5000"
                value={bonusAmount}
                onChange={(e) => setBonusAmount(Number(e.target.value))}
                className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200 font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-bold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-bold shadow-md cursor-pointer"
              >
                Valider et Honorer
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};
