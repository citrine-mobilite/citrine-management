import React, { useState } from 'react';
import { X, Search, Tablet, CheckCircle2 } from 'lucide-react';
import { Employee, Presence, NotificationLog, CompanyModuleConfig, AttendanceIncident } from '../types';
import { getActiveKioskPinCode } from '../utils/geolocation';
import { isLate } from '../utils/dateUtils';
import { KioskPinBanner } from './kiosk/KioskPinBanner';
import { KioskEmployeeCard } from './kiosk/KioskEmployeeCard';
import { incidentService } from '../services/incidentService';

interface KioskClockingModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  presences: Presence[];
  onUpdatePresences: (presences: Presence[]) => void;
  onAddNotification: (log: NotificationLog) => void;
  companyName?: string;
  qrSecret?: string;
  moduleConfig?: CompanyModuleConfig;
  onAddAttendanceIncident?: (incident: AttendanceIncident) => void;
}

export default function KioskClockingModal({
  isOpen,
  onClose,
  employees = [],
  presences = [],
  onUpdatePresences,
  onAddNotification,
  companyName = 'Citrine Management HR',
  moduleConfig,
  onAddAttendanceIncident,
}: KioskClockingModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [kioskPin, setKioskPin] = useState<string>(() => moduleConfig?.kioskPin || getActiveKioskPinCode());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.department && emp.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleClockAction = (
    emp: Employee,
    action: 'arrival' | 'pauseStart' | 'pauseEnd' | 'departure'
  ) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const scheduleStart = moduleConfig?.lateThresholdTime || '08:30';
    const plannedDeparture = moduleConfig?.plannedDepartureTime || '16:30';
    const late = action === 'arrival' && isLate(timeStr, scheduleStart);

    const updatedPresences = [...presences];
    const existingIdx = updatedPresences.findIndex((p) => p.employeeId === emp.id && p.date === todayStr);

    if (existingIdx >= 0) {
      const existing = { ...updatedPresences[existingIdx] };
      if (action === 'arrival') {
        existing.arrivalTime = timeStr;
        existing.status = late ? 'late' : 'present';
      } else if (action === 'pauseStart') {
        existing.pauseStart = timeStr;
      } else if (action === 'pauseEnd') {
        existing.pauseEnd = timeStr;
      } else if (action === 'departure') {
        existing.departureTime = timeStr;
      }
      existing.location = 'Borne Tablette (Accueil)';
      existing.clockingMethod = 'kiosk_pin';
      updatedPresences[existingIdx] = existing;
    } else {
      updatedPresences.push({
        id: `pr-${Date.now()}`,
        employeeId: emp.id,
        date: todayStr,
        status: late ? 'late' : 'present',
        arrivalTime: action === 'arrival' ? timeStr : null,
        pauseStart: action === 'pauseStart' ? timeStr : null,
        pauseEnd: action === 'pauseEnd' ? timeStr : null,
        departureTime: action === 'departure' ? timeStr : null,
        location: 'Borne Tablette (Accueil)',
        clockingMethod: 'kiosk_pin',
      });
    }

    // Gestion automatique des incidents
    if (action === 'arrival' && late) {
      const autoIncident: AttendanceIncident = {
        id: `inc-${Date.now()}`,
        employeeId: emp.id,
        employeeName: emp.name,
        date: todayStr,
        timeString: timeStr,
        type: 'retard',
        origin: 'automatique_pointage',
        reason: `Retard automatique constaté sur la borne à ${timeStr} (seuil: ${scheduleStart})`,
        isDeclaredInAdvance: false,
        isJustified: false,
        status: 'automatique',
        createdAt: new Date().toISOString(),
      };
      incidentService.saveIncident(autoIncident);
      onAddAttendanceIncident?.(autoIncident);
    } else if (action === 'departure' && timeStr < plannedDeparture) {
      const autoIncident: AttendanceIncident = {
        id: `inc-${Date.now()}`,
        employeeId: emp.id,
        employeeName: emp.name,
        date: todayStr,
        timeString: timeStr,
        type: 'sortie_prematuree',
        origin: 'automatique_pointage',
        reason: `Sortie prématurée constatée sur la borne à ${timeStr} avant 16h30 (horaire de référence: ${plannedDeparture})`,
        isDeclaredInAdvance: false,
        isJustified: false,
        status: 'automatique',
        createdAt: new Date().toISOString(),
      };
      incidentService.saveIncident(autoIncident);
      onAddAttendanceIncident?.(autoIncident);
    }

    onUpdatePresences(updatedPresences);
    setToastMessage(`Pointage de ${emp.name} validé (${action}) à ${timeStr}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2A7B76] to-emerald-800 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tablet className="h-5 w-5 text-emerald-200" />
            <div>
              <h3 className="font-serif font-bold text-sm">Borne Tablette Accueil - {companyName}</h3>
              <p className="text-[10px] text-emerald-100">Pointage tactile rapide pour collaborateurs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition cursor-pointer text-white/80 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Pin Banner & Search Toolbar */}
        <div className="p-4 bg-stone-50 border-b border-stone-200 space-y-3">
          <KioskPinBanner kioskPin={kioskPin} setKioskPin={setKioskPin} moduleConfig={moduleConfig} />

          <div className="relative">
            <Search className="h-4 w-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un collaborateur par nom ou département..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:border-[#2A7B76] shadow-3xs"
            />
          </div>

          {toastMessage && (
            <div className="p-2.5 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs rounded-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
              <span>{toastMessage}</span>
            </div>
          )}
        </div>

        {/* Employee List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
          {filteredEmployees.length === 0 ? (
            <div className="p-8 text-center text-stone-400 text-xs italic">
              Aucun collaborateur trouvé pour cette recherche.
            </div>
          ) : (
            filteredEmployees.map((emp) => {
              const todayPresence = presences.find((p) => p.employeeId === emp.id && p.date === todayStr);
              return (
                <KioskEmployeeCard
                  key={emp.id}
                  emp={emp}
                  todayPresence={todayPresence}
                  onClockAction={handleClockAction}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
