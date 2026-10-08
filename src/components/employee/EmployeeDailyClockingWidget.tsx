import React from 'react';
import { MapPin } from 'lucide-react';
import { Employee, Presence, AppUser, CompanyModuleConfig } from '../../types';
import { EmployeeDailyClockingHeader } from './EmployeeDailyClockingHeader';
import { EmployeeClockProgressionStepper } from './EmployeeClockProgressionStepper';
import { EmployeeSensorsDiagnostic } from './EmployeeSensorsDiagnostic';
import { EmployeeClockActionButtons } from './EmployeeClockActionButtons';
import { EmployeeClockEmergencySection } from './EmployeeClockEmergencySection';

interface EmployeeDailyClockingWidgetProps {
  currentUser: AppUser | null;
  employeeProfile: Employee;
  todayPresence?: Presence;
  todayStr: string;
  currentDateStr: string;
  liveTimeString: string;
  isLocating: boolean;
  sensorsDiagnostic: {
    status: 'idle' | 'scanning' | 'done';
    gps: { ok: boolean; coords?: string; error?: string };
    camera: { ok: boolean; error?: string };
  };
  runSensorsDiagnostic: () => void;
  setShowOfficeQRModal: (val: boolean) => void;
  setShowClockingModal: (val: boolean) => void;
  setPendingClockAction: (action: 'arrival' | 'pauseStart' | 'pauseEnd' | 'departure') => void;
  setSelectedClockMethod: (method: 'qr_code' | 'wifi_ip' | 'gps' | 'kiosk_pin') => void;
  setQrCodeError: (val: string | null) => void;
  startCameraScan: () => void;
  setEmergencyType: (val: 'retard' | 'pause_anticipee' | 'rallonge_pause' | 'depart_anticipe') => void;
  setEmergencyReason: (val: string) => void;
  setShowEmergencyModal: (val: boolean) => void;
  setCustomClockReason: (val: string) => void;
  setCustomClockError: (val: string | null) => void;
  setShowCustomClockModal: (val: boolean) => void;
  moduleConfig?: CompanyModuleConfig;
}

export const EmployeeDailyClockingWidget: React.FC<EmployeeDailyClockingWidgetProps> = ({
  currentUser,
  employeeProfile,
  todayPresence,
  todayStr,
  currentDateStr,
  liveTimeString,
  isLocating,
  sensorsDiagnostic,
  runSensorsDiagnostic,
  setShowOfficeQRModal,
  setShowClockingModal,
  setPendingClockAction,
  setSelectedClockMethod,
  setQrCodeError,
  startCameraScan,
  setEmergencyType,
  setEmergencyReason,
  setShowEmergencyModal,
  setCustomClockReason,
  setCustomClockError,
  setShowCustomClockModal,
  moduleConfig,
}) => {
  const handleTriggerClock = (action: 'arrival' | 'pauseStart' | 'pauseEnd' | 'departure') => {
    setPendingClockAction(action);
    setQrCodeError(null);
    setSelectedClockMethod('qr_code');
    setShowClockingModal(true);
    startCameraScan();
  };

  const enableBreakTracking = moduleConfig?.enableBreakTracking !== false;

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 shadow-sm space-y-6">
      <EmployeeDailyClockingHeader
        currentUser={currentUser}
        employeeProfile={employeeProfile}
        todayStr={todayStr}
        currentDateStr={currentDateStr}
        liveTimeString={liveTimeString}
        setShowOfficeQRModal={setShowOfficeQRModal}
      />

      <EmployeeClockProgressionStepper 
        todayPresence={todayPresence} 
        enableBreakTracking={enableBreakTracking}
      />

      <EmployeeSensorsDiagnostic
        sensorsDiagnostic={sensorsDiagnostic}
        runSensorsDiagnostic={runSensorsDiagnostic}
      />

      {todayPresence?.location && !isLocating && (
        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-950 font-bold">
            <MapPin className="h-4 w-4 text-[#2A7B76] shrink-0" />
            <span>
              Dernière zone badgée :{' '}
              <span className="text-stone-900 underline decoration-emerald-400">
                {todayPresence.location}
              </span>
            </span>
          </div>
          {todayPresence.latitude && todayPresence.longitude && (
            <span className="text-[10px] font-mono text-stone-600 bg-white px-2.5 py-1 rounded-xl border border-stone-200 font-semibold self-start sm:self-auto">
              GPS: {todayPresence.latitude.toFixed(4)}°, {todayPresence.longitude.toFixed(4)}°
            </span>
          )}
        </div>
      )}

      <EmployeeClockActionButtons
        todayPresence={todayPresence}
        liveTimeString={liveTimeString}
        isLocating={isLocating}
        onTriggerClock={handleTriggerClock}
        enableBreakTracking={enableBreakTracking}
        moduleConfig={moduleConfig}
      />

      <EmployeeClockEmergencySection
        todayPresence={todayPresence}
        onOpenEmergencyModal={() => {
          setEmergencyType('retard');
          setEmergencyReason('');
          setShowEmergencyModal(true);
        }}
        onOpenCustomClockModal={() => {
          setCustomClockReason('');
          setCustomClockError(null);
          setShowCustomClockModal(true);
        }}
      />
    </div>
  );
};

export default EmployeeDailyClockingWidget;
