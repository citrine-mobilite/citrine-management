import React, { useState } from 'react';
import { X, Search, Tablet, CheckCircle2 } from 'lucide-react';
import { Employee, Presence, NotificationLog, CompanyModuleConfig, AttendanceIncident } from '../types';
import { getActiveKioskPinCode } from '../utils/geolocation';
import { KioskPinBanner } from './kiosk/KioskPinBanner';
import { KioskEmployeeCard } from './kiosk/KioskEmployeeCard';
import { executeKioskClockAction } from './kiosk/kioskClockingAction';
import { shouldEmployeeClock } from '../utils/roleUtils';
import { ModalPortal } from './common/ModalPortal';

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

  const todayStr = getDoualaDateString();

  const filteredEmployees = employees.filter(
    (emp) =>
      shouldEmployeeClock(emp) &&
      (emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.department && emp.department.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const handleClockAction = (emp: Employee, action: 'arrival' | 'pauseStart' | 'pauseEnd' | 'departure') =>
    executeKioskClockAction({
      emp,
      action,
      presences,
      moduleConfig,
      onUpdatePresences,
      onAddNotification,
      onAddAttendanceIncident,
      setToastMessage,
    });

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-r from-[#2A7B76] to-emerald-800 p-4 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Tablet className="h-5 w-5 text-emerald-200" />
              <div>
                <h3 className="font-serif font-bold text-sm">Borne Tablette Accueil - {companyName}</h3>
                <p className="text-[10px] text-emerald-100">Pointage tactile rapide pour collaborateurs</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition cursor-pointer text-white/80 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 bg-stone-50 border-b border-stone-200 space-y-3 shrink-0">
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
    </ModalPortal>
  );
}
