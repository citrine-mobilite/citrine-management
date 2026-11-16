import React, { useState } from 'react';
import { UserCheck, X, AlertCircle, ShieldAlert, Check } from 'lucide-react';
import { Employee, Presence, AppUser, NotificationLog, AttendanceIncident, CompanyModuleConfig } from '../../types';
import { shouldEmployeeClock } from '../../utils/roleUtils';
import {
  AdminClockAction,
  QUICK_ADMIN_CLOCK_REASONS,
  executeAdminOnBehalfClocking,
} from './adminOnBehalfClockHelper';
import { executeOperationWithLoading } from '../../utils/sweetAlert';

interface AdminOnBehalfClockModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  presences: Presence[];
  currentUser?: AppUser | null;
  onUpdatePresences: (updated: Presence[]) => Promise<void> | void;
  onAddNotification?: (log: NotificationLog) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
  defaultEmployeeId?: string;
  onAddAttendanceIncident?: (incident: AttendanceIncident) => void;
  moduleConfig?: CompanyModuleConfig;
}

export const AdminOnBehalfClockModal: React.FC<AdminOnBehalfClockModalProps> = ({
  isOpen,
  onClose,
  employees,
  presences,
  currentUser,
  onUpdatePresences,
  onAddNotification,
  defaultEmployeeId,
  onAddAttendanceIncident,
  moduleConfig,
}) => {
  const eligibleEmployees = employees.filter((emp) => shouldEmployeeClock(emp));
  const [selectedEmpId, setSelectedEmpId] = useState<string>(defaultEmployeeId || eligibleEmployees[0]?.id || employees[0]?.id || '');
  const [clockAction, setClockAction] = useState<AdminClockAction>('arrival');
  const [timeInput, setTimeInput] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [reasonInput, setReasonInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetEmployee = employees.find((e) => e.id === selectedEmpId) || employees[0];
  const todayStr = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonInput.trim()) {
      setErrorMessage('Le motif administratif est obligatoire pour badger à la place d’un employé.');
      return;
    }
    if (!targetEmployee) {
      setErrorMessage('Veuillez sélectionner un collaborateur.');
      return;
    }

    let adminName = currentUser?.name || 'Responsable';
    const res = await executeOperationWithLoading({
      loadingTitle: 'Enregistrement du pointage...',
      loadingText: `Validation administrative pour ${targetEmployee.name}, veuillez patienter...`,
      action: async () => {
        const result = await executeAdminOnBehalfClocking({
          targetEmployee,
          clockAction,
          timeInput,
          reasonInput,
          todayStr,
          presences,
          currentUser,
          moduleConfig,
          onUpdatePresences,
          onAddNotification,
          onAddAttendanceIncident,
        });
        if (!result.success) {
          throw new Error(result.error || 'Erreur lors du pointage.');
        }
        adminName = result.adminName || adminName;
      },
      successTitle: 'Pointage validé !',
      successMessage: `Pointage enregistré avec succès pour ${targetEmployee.name} par ${adminName}.`,
      errorMessage: 'Erreur lors du pointage.',
    });

    if (!res.success) {
      setErrorMessage(res.error?.message || 'Erreur lors du pointage.');
      return;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2A7B76] to-emerald-800 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-emerald-200" />
            <div>
              <h3 className="font-serif font-bold text-sm">Badger à la place d'un Employé</h3>
              <p className="text-[10px] text-emerald-100">Pointage administratif avec mention du motif</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition cursor-pointer text-white/80 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Target Employee selector */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-stone-500 uppercase">Collaborateur concerné :</label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 bg-stone-50 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#2A7B76] outline-none"
            >
              {eligibleEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.roleType || 'Employé'})
                </option>
              ))}
            </select>
          </div>

          {/* Action selection */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-stone-500 uppercase">Action à enregistrer :</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'arrival', label: 'Arrivée' },
                { id: 'pauseStart', label: 'Début Pause' },
                { id: 'pauseEnd', label: 'Reprise' },
                { id: 'departure', label: 'Départ' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setClockAction(item.id as any)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                    clockAction === item.id
                      ? 'bg-[#2A7B76] text-white border-[#2A7B76] shadow-xs'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time Picker */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-stone-500 uppercase">Heure du pointage :</label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                className="px-3 py-2 border border-stone-200 bg-stone-50 rounded-xl text-xs font-mono font-bold focus:ring-1 focus:ring-[#2A7B76] outline-none"
                required
              />
              <span className="text-[11px] text-stone-400">Date : Aujourd'hui ({todayStr})</span>
            </div>
          </div>

          {/* Motif obligatoire */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-stone-700 uppercase flex items-center justify-between">
              <span>Motif administratif du badgeage (Obligatoire) :</span>
              <span className="text-red-500 font-bold">*</span>
            </label>
            <textarea
              value={reasonInput}
              onChange={(e) => {
                setReasonInput(e.target.value);
                setErrorMessage(null);
              }}
              rows={2}
              placeholder="Ex: Oubli de téléphone, batterie déchargée, intervention client sur site..."
              className="w-full px-3 py-2 border border-stone-200 bg-stone-50 rounded-xl text-xs focus:ring-1 focus:ring-[#2A7B76] outline-none resize-none"
              required
            />

            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_ADMIN_CLOCK_REASONS.map((r, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setReasonInput(r)}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium transition cursor-pointer border border-stone-200"
                >
                  + {r}
                </button>
              ))}
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Ce pointage sera enregistré sous votre responsabilité (<b>{currentUser?.name || 'Responsable'}</b>). Il apparaîtra sur les registres avec mention officielle de votre identité et du motif saisi.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#2A7B76] hover:bg-[#20635F] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>Confirmer le Pointage</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminOnBehalfClockModal;
