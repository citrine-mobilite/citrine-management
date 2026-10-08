import React, { useState } from 'react';
import { UserCheck, X, Clock, AlertCircle, ShieldAlert, Check } from 'lucide-react';
import { Employee, Presence, AppUser, NotificationLog, AttendanceIncident, CompanyModuleConfig } from '../../types';
import { incidentService } from '../../services/incidentService';

interface AdminOnBehalfClockModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  presences: Presence[];
  currentUser?: AppUser | null;
  onUpdatePresences: (updated: Presence[]) => void;
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
  showToast,
  defaultEmployeeId,
  onAddAttendanceIncident,
  moduleConfig,
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState<string>(defaultEmployeeId || employees[0]?.id || '');
  const [clockAction, setClockAction] = useState<'arrival' | 'pauseStart' | 'pauseEnd' | 'departure'>('arrival');
  const [timeInput, setTimeInput] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [reasonInput, setReasonInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetEmployee = employees.find((e) => e.id === selectedEmpId) || employees[0];
  const todayStr = new Date().toISOString().split('T')[0];

  const QUICK_REASONS = [
    'Oubli de téléphone / Badge',
    'Batterie de téléphone déchargée',
    'Panne réseau / problème applicatif',
    'Collaborateur en mission extérieure',
    'Pointage sur place validé par responsable'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonInput.trim()) {
      setErrorMessage('Le motif administratif est obligatoire pour badger à la place d’un employé.');
      return;
    }

    if (!targetEmployee) {
      setErrorMessage('Veuillez sélectionner un collaborateur.');
      return;
    }

    const adminName = currentUser?.name || 'Responsable';
    const adminId = currentUser?.id || 'admin';
    const nowTime = timeInput || new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const lateThreshold = moduleConfig?.lateThresholdTime || '08:30';
    const plannedDeparture = moduleConfig?.plannedDepartureTime || '16:30';

    const updatedPresences = [...presences];
    const existingIdx = updatedPresences.findIndex(
      (p) => p.employeeId === targetEmployee.id && p.date === todayStr
    );

    const isLateNow = clockAction === 'arrival' && nowTime > lateThreshold;

    if (existingIdx >= 0) {
      const existing = { ...updatedPresences[existingIdx] };
      if (clockAction === 'arrival') {
        existing.arrivalTime = nowTime;
        existing.status = isLateNow ? 'late' : 'present';
      } else if (clockAction === 'pauseStart') {
        existing.pauseStart = nowTime;
      } else if (clockAction === 'pauseEnd') {
        existing.pauseEnd = nowTime;
      } else if (clockAction === 'departure') {
        existing.departureTime = nowTime;
      }

      existing.clockingMethod = 'admin_on_behalf';
      existing.badgedByAdminId = adminId;
      existing.badgedByAdminName = adminName;
      existing.adminBadgeReason = reasonInput.trim();
      existing.location = `Bureau (Pointé par ${adminName})`;

      updatedPresences[existingIdx] = existing;
    } else {
      const newPresence: Presence = {
        id: `pres-${Date.now()}`,
        employeeId: targetEmployee.id,
        date: todayStr,
        status: isLateNow ? 'late' : 'present',
        arrivalTime: clockAction === 'arrival' ? nowTime : null,
        pauseStart: clockAction === 'pauseStart' ? nowTime : null,
        pauseEnd: clockAction === 'pauseEnd' ? nowTime : null,
        departureTime: clockAction === 'departure' ? nowTime : null,
        clockingMethod: 'admin_on_behalf',
        badgedByAdminId: adminId,
        badgedByAdminName: adminName,
        adminBadgeReason: reasonInput.trim(),
        location: `Bureau (Pointé par ${adminName})`,
      };
      updatedPresences.unshift(newPresence);
    }

    // Gestion automatique des incidents : Retard ou Sortie prématurée
    if (clockAction === 'arrival' && isLateNow) {
      const autoIncident: AttendanceIncident = {
        id: `inc-${Date.now()}`,
        employeeId: targetEmployee.id,
        employeeName: targetEmployee.name,
        date: todayStr,
        timeString: nowTime,
        type: 'retard',
        origin: 'signale_par_responsable',
        reason: `Retard constaté lors du pointage administratif par ${adminName} à ${nowTime} (seuil: ${lateThreshold}). Motif: ${reasonInput.trim()}`,
        isDeclaredInAdvance: false,
        isJustified: false,
        status: 'automatique',
        createdAt: new Date().toISOString(),
      };
      incidentService.saveIncident(autoIncident);
      onAddAttendanceIncident?.(autoIncident);
    } else if (clockAction === 'departure' && nowTime < plannedDeparture) {
      const autoIncident: AttendanceIncident = {
        id: `inc-${Date.now()}`,
        employeeId: targetEmployee.id,
        employeeName: targetEmployee.name,
        date: todayStr,
        timeString: nowTime,
        type: 'sortie_prematuree',
        origin: 'signale_par_responsable',
        reason: `Sortie prématurée constatée lors du pointage administratif par ${adminName} à ${nowTime} avant 16h30 (horaire de référence: ${plannedDeparture}). Motif: ${reasonInput.trim()}`,
        isDeclaredInAdvance: false,
        isJustified: false,
        status: 'automatique',
        createdAt: new Date().toISOString(),
      };
      incidentService.saveIncident(autoIncident);
      onAddAttendanceIncident?.(autoIncident);
    }

    onUpdatePresences(updatedPresences);

    // Notification Log
    if (onAddNotification) {
      const actionLabels = {
        arrival: 'l\'Arrivée',
        pauseStart: 'le Début de Pause',
        pauseEnd: 'la Reprise de Pause',
        departure: 'le Départ'
      };
      onAddNotification({
        id: `notif-${Date.now()}`,
        title: `Pointage par Responsable : ${targetEmployee.name}`,
        message: `${adminName} a badgé ${actionLabels[clockAction]} de ${targetEmployee.name} à ${nowTime}. Motif : ${reasonInput.trim()}`,
        timestamp: new Date().toISOString(),
        type: 'presence',
        read: false,
        recipient: targetEmployee.name,
      });
    }

    if (showToast) {
      showToast(`Pointage validé avec succès pour ${targetEmployee.name} par ${adminName}.`, 'success');
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
              {employees.map((emp) => (
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

            {/* Quick motif chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_REASONS.map((r, idx) => (
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

          {/* Error notice */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Responsibility notice */}
          <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Ce pointage sera enregistré sous votre responsabilité (<b>{currentUser?.name || 'Responsable'}</b>). Il apparaîtra sur les registres avec mention officielle de votre identité et du motif saisi.
            </p>
          </div>

          {/* Submit Actions */}
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
