import React from 'react';
import { Clock, UserCheck } from 'lucide-react';
import { Employee, Presence, CompanyModuleConfig } from '../../types';
import { ClockingStepInfo } from './presenceClockStepHelper';

interface PresenceSidebarWidgetProps {
  sidebarTime: string;
  activeSidebarEmpId: string;
  onChangeSidebarEmpId: (id: string) => void;
  clockableEmployees: Employee[];
  activeEmployee?: Employee;
  selectedDate: string;
  currentPresence?: Presence;
  moduleConfig?: CompanyModuleConfig;
  nextStep: ClockingStepInfo;
  isRestricted: boolean;
  punctualityRate: number;
  attendanceRate: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  onTriggerClockingStep: () => void;
  onOpenAdminClock: () => void;
  onSelectTab?: (tab: any) => void;
}

export const PresenceSidebarWidget: React.FC<PresenceSidebarWidgetProps> = ({
  sidebarTime,
  activeSidebarEmpId,
  onChangeSidebarEmpId,
  clockableEmployees,
  activeEmployee,
  selectedDate,
  currentPresence,
  moduleConfig,
  nextStep,
  isRestricted,
  punctualityRate,
  attendanceRate,
  presentCount,
  lateCount,
  absentCount,
  onTriggerClockingStep,
  onOpenAdminClock,
  onSelectTab,
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl border border-stone-200/80 p-5 shadow-sm space-y-4 flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
          <h3 className="font-serif font-bold text-xs text-[#2A7B76] uppercase tracking-wider flex items-center gap-1">
            <Clock className="h-4.5 w-4.5" />
            Espace Pointage Collaborateur
          </h3>
          <span className="font-mono font-bold text-stone-600 text-xs">{sidebarTime}</span>
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] text-stone-500 font-bold uppercase">Sélectionner la fiche collaborateur :</label>
          <select
            value={activeSidebarEmpId}
            onChange={(e) => onChangeSidebarEmpId(e.target.value)}
            className="w-full px-3 py-2 border border-stone-200 bg-stone-50 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#2A7B76] outline-none"
          >
            {clockableEmployees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.roleType || 'Employé'})
              </option>
            ))}
          </select>
          {onSelectTab && (
            <div className="text-right">
              <button
                onClick={() => onSelectTab('collaborators')}
                className="text-[10px] text-[#2A7B76] font-bold hover:underline inline-flex items-center"
              >
                Créer un collaborateur &rarr;
              </button>
            </div>
          )}
        </div>

        {activeEmployee && (
          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs border border-emerald-100 shrink-0">
              {activeEmployee.avatarUrl ? (
                <img src={activeEmployee.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span>{activeEmployee.name.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0">
              <span className="block font-bold text-xs text-stone-900 truncate">{activeEmployee.name}</span>
              <span className="block text-[10px] text-stone-400 truncate">{activeEmployee.email || 'Non renseigné'}</span>
            </div>
          </div>
        )}

        <div className="pt-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-stone-500 font-bold uppercase">Pointage du {selectedDate}</span>
            <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${
              currentPresence?.status === 'present'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : currentPresence?.status === 'late'
                ? 'bg-amber-50 text-amber-700 border-amber-100'
                : 'bg-rose-50 text-rose-700 border-rose-100'
            }`}>
              {currentPresence?.status === 'present' ? 'Présent' : currentPresence?.status === 'late' ? 'Retard' : 'Non pointé'}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-stone-400 font-bold whitespace-nowrap">Date :</span>
            <span className="text-[10px] font-bold text-stone-700 bg-stone-50 px-2 py-1 rounded border border-stone-200 w-full text-center">
              Aujourd'hui ({new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })})
            </span>
          </div>
        </div>

        {moduleConfig?.enableBreakTracking === false ? (
          <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] font-bold text-stone-500 uppercase tracking-wide">
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col items-center justify-center space-y-1">
              <span className="text-[9px] text-stone-400">Arrivée</span>
              <span className="font-mono text-sm text-stone-800 font-bold">{currentPresence?.arrivalTime || '—'}</span>
            </div>
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col items-center justify-center space-y-1">
              <span className="text-[9px] text-stone-400">Départ</span>
              <span className="font-mono text-sm text-stone-800 font-bold">{currentPresence?.departureTime || '—'}</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] font-bold text-stone-500 uppercase tracking-wide">
            <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col items-center justify-center space-y-1">
              <span className="text-[9px] text-stone-400">Arrivée</span>
              <span className="font-mono text-xs text-stone-800 font-bold">{currentPresence?.arrivalTime || '—'}</span>
            </div>
            <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col items-center justify-center space-y-1">
              <span className="text-[9px] text-stone-400">Pause Midi</span>
              <span className="font-mono text-xs text-stone-800 font-bold">{currentPresence?.pauseStart || '—'}</span>
            </div>
            <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col items-center justify-center space-y-1">
              <span className="text-[9px] text-stone-400">Retour Pause</span>
              <span className="font-mono text-xs text-stone-800 font-bold">{currentPresence?.pauseEnd || '—'}</span>
            </div>
            <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col items-center justify-center space-y-1">
              <span className="text-[9px] text-stone-400">Départ</span>
              <span className="font-mono text-xs text-stone-800 font-bold">{currentPresence?.departureTime || '—'}</span>
            </div>
          </div>
        )}

        <div className="space-y-1.5 pt-2 border-t border-stone-100">
          <span className="block text-[9px] text-stone-400 font-bold uppercase tracking-wider">Prochaine étape réglementaire :</span>
          <button
            onClick={onTriggerClockingStep}
            disabled={nextStep.action === 'done'}
            className="w-full py-2.5 bg-[#2A7B76] hover:bg-[#20635F] text-white font-extrabold text-xs rounded-2xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-45"
          >
            {nextStep.label}
          </button>
          {!isRestricted && (
            <button
              onClick={onOpenAdminClock}
              className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-stone-200"
            >
              <UserCheck className="h-3.5 w-3.5 text-[#2A7B76]" />
              <span>Badger avec motif pour ce collaborateur</span>
            </button>
          )}
          <p className="text-[10px] text-stone-400 italic text-center leading-normal">{nextStep.desc}</p>
        </div>

        <div className="space-y-2 pt-2">
          <div className="bg-amber-50/50 border border-amber-200/60 p-2.5 rounded-2xl text-[10px] text-amber-800 font-medium">
            🍱 La pause déjeuner est disponible de 11:00 à 15:00.
          </div>
          <div className="bg-red-50 border border-red-200 p-2.5 rounded-2xl text-[10px] text-rose-800 font-medium leading-normal">
            🚨 <b>Alerte de Retard :</b> À partir de 09h01, tout enregistrement déclenche une alerte WhatsApp d'activité.
          </div>
        </div>

        <div className="space-y-2.5 pt-4 border-t border-stone-100">
          <h4 className="text-[10px] text-stone-500 font-extrabold uppercase tracking-wide">Statistiques Globales</h4>
          <div className="space-y-2">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-stone-700">
                <span>Ponctualité :</span>
                <span>{punctualityRate}%</span>
              </div>
              <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${punctualityRate}%` }} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-stone-700">
                <span>Assiduité :</span>
                <span>{attendanceRate}%</span>
              </div>
              <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#2A7B76] h-full rounded-full transition-all duration-300" style={{ width: `${attendanceRate}%` }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-1.5 text-center text-[10px] font-extrabold tracking-wide uppercase">
            <div className="bg-emerald-50 text-emerald-800 p-2 border border-emerald-100 rounded-xl">
              <span className="block text-[8px] text-emerald-600 font-bold mb-0.5">Présent</span>
              <span className="font-mono text-sm">{presentCount}</span>
            </div>
            <div className="bg-amber-50 text-amber-800 p-2 border border-amber-100 rounded-xl">
              <span className="block text-[8px] text-amber-600 font-bold mb-0.5">Retard</span>
              <span className="font-mono text-sm">{lateCount}</span>
            </div>
            <div className="bg-rose-50 text-rose-800 p-2 border border-rose-100 rounded-xl">
              <span className="block text-[8px] text-rose-600 font-bold mb-0.5">Absent</span>
              <span className="font-mono text-sm">{absentCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
