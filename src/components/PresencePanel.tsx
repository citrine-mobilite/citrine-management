import React, { useState } from 'react';
import { 
  Clock, 
  UserCheck, 
  UserX, 
  AlertCircle, 
  Edit2, 
  Coffee, 
  Sun, 
  Check, 
  MessageSquare,
  ShieldAlert,
  Send,
  User,
  Heart,
  Info,
  Eye,
  MapPin,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { Employee, Presence, PresenceStatus, NotificationLog, CompanyModuleConfig, AppUser } from '../types';
import { isCameroonHoliday, getHolidayInfo, isNonWorkingDay } from '../utils/cameroonHolidays';
import { COMPANY_HQ_LOCATION } from '../utils/geolocation';
import { enforceSequentialClockAction, isLate } from '../utils/dateUtils';
import { Download, TrendingUp, Award, CalendarDays, FileSpreadsheet, CheckCircle, BarChart3, Tablet, Building, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PointageMap } from './PointageMap';
import { PresenceStatisticsView } from './PresenceStatisticsView';
import PresenceRequestsView from './PresenceRequestsView';
import { haptic } from '../services/hapticService';
import { SearchableSelect } from './common/SearchableSelect';

export function formatFrenchPointageTitle(dateStr: string): string {
  if (!dateStr) return "Pointage du jour";
  const parts = dateStr.split('-');
  if (parts.length !== 3) return "Pointage du jour";
  
  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const monthsFr = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];

  if (isNaN(year) || isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11 || isNaN(day)) {
    return "Pointage du jour";
  }

  const dayFormatted = day === 1 ? '1er' : day;
  return `Pointage du ${dayFormatted} ${monthsFr[monthIdx]} ${year}`;
}

interface PresencePanelProps {
  employees: Employee[];
  presences: Presence[];
  onUpdatePresences: (updated: Presence[]) => void;
  onAddNotification: (log: NotificationLog) => void;
  currentRole: 'Administrateur' | 'Employé' | 'Responsable';
  selectedEmployeeId: string;
  onSelectEmployee: (id: string) => void;
  currentTime: string; // HH:MM
  onSelectTab?: (tab: any) => void;
  initialTab?: 'register' | 'statistics';
  showToast?: (message: string, type?: 'success' | 'error') => void;
  moduleConfig?: CompanyModuleConfig;
  currentUser?: AppUser;
}

// Function to calculate if a given date is in a week that is already finished.
// A week starts on Monday and ends on Sunday. It is considered finished after Friday 17:00 of that week.
export function isWeekFinishedForDate(
  dateStr: string,
  currentSimDate: string = '2026-07-08',
  currentSimTime: string = '08:45'
): boolean {
  if (!dateStr || !currentSimDate) return false;

  const parseYYYYMMDD = (str: string) => {
    const parts = str.split('-');
    if (parts.length !== 3) return null;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
    return new Date(y, m, d, 12, 0, 0);
  };

  const d = parseYYYYMMDD(dateStr);
  const simD = parseYYYYMMDD(currentSimDate);

  if (!d || !simD || isNaN(d.getTime()) || isNaN(simD.getTime())) return false;

  // Find Monday of dateStr's week
  const day = d.getDay(); // 0 = Sunday, 1 = Monday...
  const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.getFullYear(), d.getMonth(), diffToMonday, 0, 0, 0, 0);

  // Find Monday of current simulation week
  const simDay = simD.getDay();
  const simDiffToMonday = simD.getDate() - simDay + (simDay === 0 ? -6 : 1);
  const simMonday = new Date(simD.getFullYear(), simD.getMonth(), simDiffToMonday, 0, 0, 0, 0);

  // If the week is strictly before the current simulation week, it is finished
  if (monday.getTime() < simMonday.getTime()) {
    return true;
  }

  // If it's the current simulation week, check if we are past Friday 17:00
  if (monday.getTime() === simMonday.getTime()) {
    const currentDayOfWeek = simD.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
    
    if (currentDayOfWeek > 5 || currentDayOfWeek === 0) {
      // Saturday or Sunday of current week
      return true;
    }
    if (currentDayOfWeek === 5) {
      // Friday of current week: check if time is past 17:00
      const [hour, min] = (currentSimTime || '08:45').split(':').map(Number);
      if (hour > 17 || (hour === 17 && min > 0)) {
        return true;
      }
    }
    return false;
  }

  // Future week
  return false;
}

interface FrenchTimePickerProps {
  value: string;
  onChange: (newValue: string) => void;
  className?: string;
  id?: string;
}

function FrenchTimePicker({ value, onChange, className = "", id }: FrenchTimePickerProps) {
  // Parse hours and minutes from "HH:MM"
  let initialHour = "";
  let initialMin = "";
  
  if (value && value.includes(":")) {
    const parts = value.split(":");
    initialHour = parts[0] || "";
    initialMin = parts[1] || "";
  }

  const pad = (num: number) => num.toString().padStart(2, '0');

  // Hours: "" (Non défini) then "00" to "23"
  const hoursList = Array.from({ length: 24 }, (_, i) => pad(i));
  // Minutes: "" (Non défini) then "00" to "59"
  const minutesList = Array.from({ length: 60 }, (_, i) => pad(i));

  const handleHourChange = (newH: string) => {
    if (!newH) {
      onChange("");
    } else {
      const currentM = initialMin || "00";
      onChange(`${newH}:${currentM}`);
    }
  };

  const handleMinChange = (newM: string) => {
    const currentH = initialHour || "08";
    const mValue = newM || "00";
    onChange(`${currentH}:${mValue}`);
  };

  return (
    <div className={`inline-flex items-center gap-1.5 bg-stone-50 border border-stone-200/80 rounded-xl px-2 py-1.5 justify-center ${className}`} id={id}>
      <div className="w-20">
        <SearchableSelect
          value={initialHour}
          onChange={(val) => handleHourChange(val)}
          placeholder="-- h"
          searchPlaceholder="Heure..."
          options={hoursList.map(h => ({ value: h, label: `${h}h` }))}
        />
      </div>
      <span className="text-stone-400 font-bold text-[10px]">:</span>
      <div className="w-22">
        <SearchableSelect
          value={initialMin}
          onChange={(val) => handleMinChange(val)}
          placeholder="-- min"
          searchPlaceholder="Min..."
          disabled={!initialHour}
          options={minutesList.map(m => ({ value: m, label: `${m} min` }))}
        />
      </div>
    </div>
  );
}

export default function PresencePanel({
  employees,
  presences,
  onUpdatePresences,
  onAddNotification,
  currentRole,
  selectedEmployeeId,
  onSelectEmployee,
  currentTime,
  onSelectTab,
  initialTab,
  showToast,
  moduleConfig,
  currentUser,
}: PresencePanelProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPresence, setEditingPresence] = useState<Presence | null>(null);
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [newStatus, setNewStatus] = useState<PresenceStatus>('present');
  const [newArrival, setNewArrival] = useState('');
  const [newPauseStart, setNewPauseStart] = useState('');
  const [newPauseEnd, setNewPauseEnd] = useState('');
  const [newDeparture, setNewDeparture] = useState('');

  // States for inline presence cell editing
  const [editingCell, setEditingCell] = useState<{ presenceId: string; field: 'arrivalTime' | 'pauseStart' | 'pauseEnd' | 'departureTime' } | null>(null);
  const [inlineTimeValue, setInlineTimeValue] = useState('');
  const [inlineReason, setInlineReason] = useState('');

  // Background Date Monitoring Worker (Midnight Auto-Reset Trigger)
  const [currentAdminDateStr, setCurrentAdminDateStr] = useState<string>(() => new Date().toISOString().split('T')[0]);

  React.useEffect(() => {
    const timer = setInterval(() => {
      const actualToday = new Date().toISOString().split('T')[0];
      if (actualToday !== currentAdminDateStr) {
        setCurrentAdminDateStr(actualToday);
      }
    }, 1000); // Continuous background date check
    return () => clearInterval(timer);
  }, [currentAdminDateStr]);

  // Find presence for the selected employee on selected pointage date
  const todayStr = currentAdminDateStr;
  const [selectedPointageDate, setSelectedPointageDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Keep selectedPointageDate updated if currentAdminDateStr changes (e.g. at midnight)
  React.useEffect(() => {
    if (selectedPointageDate === todayStr) {
      setSelectedPointageDate(currentAdminDateStr);
    }
  }, [currentAdminDateStr]);

  const activeEmployeePresence = presences.find(
    (p) => p.employeeId === selectedEmployeeId && p.date === selectedPointageDate
  );
  const activeEmployee = employees.find((e) => e.id === selectedEmployeeId);

  const isSelfClocking = React.useMemo(() => {
    if (!currentUser || !activeEmployee) return false;
    return (
      activeEmployee.email.toLowerCase() === currentUser.email.toLowerCase() ||
      activeEmployee.name.toLowerCase() === currentUser.name.toLowerCase() ||
      `usr-${activeEmployee.id}` === currentUser.id
    );
  }, [currentUser, activeEmployee]);

  // Filter all collaborators who are non-sponsors AND currently "en_poste"
  const trackedEmployees = React.useMemo(() => {
    return employees.filter(
      (emp) => 
        emp.roleType !== 'sponsor' &&
        (emp.status === undefined || emp.status === 'en_poste')
    );
  }, [employees]);

  // Time calculations for daily schedules (e.g., pause midi rules)
  const [currentHour, currentMin] = currentTime.split(':').map(Number);
  const currentMinutesTotal = currentHour * 60 + currentMin;

  const isBefore12h = currentMinutesTotal < 12 * 60; // Avant midi (12h00)
  const isAfter15h = currentMinutesTotal >= 15 * 60;  // À partir de 15h00

  // Helper to trigger WhatsApp notification logs
  const triggerWhatsAppLog = (title: string, content: string, payloadObj: any) => {
    const newLog: NotificationLog = {
      id: `whatsapp-${Date.now()}`,
      type: 'whatsapp',
      recipient: 'Responsable Opérations (+237 600 00 00 00)',
      title,
      content,
      payload: JSON.stringify(payloadObj, null, 2),
      timestamp: new Date().toISOString()
    };
    onAddNotification(newLog);
  };

  // 1. Employee Clock-In/Out Milestones
  const handleClockAction = (actionType: 'arrival' | 'pauseStart' | 'pauseEnd' | 'departure') => {
    if (!selectedEmployeeId) return;
    haptic.success();

    let updatedPresences = [...presences];
    let recordIndex = presences.findIndex(
      (p) => p.employeeId === selectedEmployeeId && p.date === selectedPointageDate
    );

    let currentRecord: Presence;

    if (recordIndex === -1) {
      currentRecord = {
        id: `p-${Date.now()}`,
        employeeId: selectedEmployeeId,
        date: selectedPointageDate,
        arrivalTime: null,
        pauseStart: null,
        pauseEnd: null,
        departureTime: null,
        status: 'not_tracked',
      };
      updatedPresences.push(currentRecord);
      recordIndex = updatedPresences.length - 1;
    } else {
      currentRecord = { ...presences[recordIndex] };
    }

    // 🛡️ STRICT SEQUENTIAL CLOCKING ENFORCEMENT
    const seqResult = enforceSequentialClockAction(actionType, currentRecord);
    if (seqResult.overridden && seqResult.message) {
      showToast?.(seqResult.message, 'success');
    }
    actionType = seqResult.effectiveAction;

    // Capture real current local time at the exact moment of click
    const d = new Date();
    const exactNow = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    let assignedTime = exactNow;

    if (actionType === 'arrival') {
      const workStart = moduleConfig?.workStartTime || '08:00';
      const [h] = exactNow.split(':').map(Number);
      const [startH] = workStart.split(':').map(Number);
      if (!isNaN(h) && !isNaN(startH) && h < startH) {
        assignedTime = workStart;
      }
      currentRecord.arrivalTime = assignedTime;
      const lateThresh = moduleConfig?.lateThresholdTime || '08:15';
      if (isNonWorkingDay(currentRecord.date)) {
        currentRecord.status = 'present';
      } else {
        currentRecord.status = isLate(assignedTime, lateThresh) ? 'late' : 'present';
      }
    } else if (actionType === 'pauseStart') {
      currentRecord.pauseStart = assignedTime;
    } else if (actionType === 'pauseEnd') {
      currentRecord.pauseEnd = assignedTime;
    } else if (actionType === 'departure') {
      currentRecord.departureTime = assignedTime;
      const [h, m] = exactNow.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m) && (h > 17 || (h === 17 && m > 30))) {
        if (!currentRecord.departureReason) {
          currentRecord.departureReason = "Sortie tardive enregistrée après 17h30";
        }
      }
    }

    // Capture location & GPS coordinates when action button is clicked
    currentRecord.location = `${COMPANY_HQ_LOCATION.name} (${COMPANY_HQ_LOCATION.address})`;
    currentRecord.latitude = COMPANY_HQ_LOCATION.latitude;
    currentRecord.longitude = COMPANY_HQ_LOCATION.longitude;
    currentRecord.siteName = COMPANY_HQ_LOCATION.name;
    currentRecord.clockingMethod = 'manual_admin';
    currentRecord.updatedAt = new Date().toISOString();

    const clockKey = actionType === 'arrival' ? 'arrival' : actionType === 'departure' ? 'departure' : actionType;
    currentRecord.clockLocations = {
      ...(currentRecord.clockLocations || {}),
      [clockKey]: {
        latitude: COMPANY_HQ_LOCATION.latitude,
        longitude: COMPANY_HQ_LOCATION.longitude,
        zoneName: COMPANY_HQ_LOCATION.name,
        time: assignedTime,
        method: 'manual_admin',
        siteName: COMPANY_HQ_LOCATION.name
      }
    };

    updatedPresences[recordIndex] = currentRecord;
    onUpdatePresences(updatedPresences);

    const actionLabels: Record<string, string> = {
      arrival: "Heure d'arrivée (Badgeage)",
      pauseStart: 'Départ en pause',
      pauseEnd: 'Retour de pause',
      departure: 'Heure de départ (Badgeage)'
    };

    const employeeName = activeEmployee ? activeEmployee.name : 'Un employé';

    const isEmpLate = actionType === 'arrival' && currentRecord.status === 'late';

    // 1. Always create a notification when someone badges
    onAddNotification({
      id: `log-badge-${Date.now()}`,
      type: 'whatsapp',
      recipient: activeEmployee?.phone || activeEmployee?.email || '+237 600 000 000',
      title: isEmpLate 
        ? `⚠️ Retard Constaté : ${employeeName}`
        : `Badgeage enregistré - ${actionLabels[actionType]} (${employeeName})`,
      content: isEmpLate
        ? `Bonjour ${employeeName}, un retard d'arrivée a été consigné à ${assignedTime} pour le ${selectedPointageDate} (seuil : ${moduleConfig?.lateThresholdTime || 'configuré'}).`
        : `${employeeName} a badgé [${actionLabels[actionType]}] à ${assignedTime} le ${selectedPointageDate}.`,
      payload: JSON.stringify({
        event: isEmpLate ? "late_arrival" : "employee_badge",
        employeeId: selectedEmployeeId,
        employeeName,
        action: actionType,
        time: assignedTime,
        date: selectedPointageDate,
        location: COMPANY_HQ_LOCATION.name,
        threshold: moduleConfig?.lateThresholdTime || ''
      }, null, 2),
      timestamp: new Date().toISOString()
    });

    // 2. Trigger success Toast notification
    showToast?.(`Pointage enregistré : ${actionLabels[actionType]} à ${assignedTime} pour ${employeeName}`, 'success');
  };

  // 2. Open Edit/Correction Modal
  const openEditModal = (presence: Presence) => {
    if (isWeekFinishedForDate(presence.date, todayStr, currentTime)) {
      alert("Cette fiche appartient à une semaine déjà terminée (limite vendredi 17h00) et ne peut plus être modifiée.");
      return;
    }
    setEditingPresence(presence);
    setNewStatus(presence.status);
    setNewArrival(presence.arrivalTime || '');
    setNewPauseStart(presence.pauseStart || '');
    setNewPauseEnd(presence.pauseEnd || '');
    setNewDeparture(presence.departureTime || '');
    setCorrectionReason('');
    setShowEditModal(true);
  };

  // Helper to validate future times relative to current simulation date and time
  const isFutureTimeForDate = (dateStr: string, timeStr: string | null | undefined, simDate: string, simTime: string): boolean => {
    if (!timeStr || !timeStr.includes(':')) return false;
    if (isNonWorkingDay(dateStr)) return false;
    if (dateStr > simDate) return true;
    if (dateStr === simDate) {
      const [h, m] = timeStr.split(':').map(Number);
      const [curH, curM] = (simTime || '08:45').split(':').map(Number);
      if (isNaN(h) || isNaN(m) || isNaN(curH) || isNaN(curM)) return false;
      return (h * 60 + m) > (curH * 60 + curM);
    }
    return false;
  };

  // Helpers to check motif mandate
  const isTimeModified = (oldTime: string | null | undefined, newTime: string | null | undefined) => {
    const normOld = oldTime || '';
    const normNew = newTime || '';
    // Only mandatory if modifying an ALREADY RECORDED non-empty time
    return normOld !== '' && normNew !== normOld;
  };

  // 2.5 Save inline time change
  const handleSaveInlineCell = (presence: Presence, field: 'arrivalTime' | 'pauseStart' | 'pauseEnd' | 'departureTime', newTime: string, reason: string) => {
    if (isWeekFinishedForDate(presence.date, todayStr, currentTime)) {
      alert("Cette fiche appartient à une semaine déjà terminée et ne peut plus être modifiée.");
      return;
    }

    let finalNewTime = newTime;
    const workStart = moduleConfig?.workStartTime || '08:00';
    const [workH] = workStart.split(':').map(Number);
    // RULE 1: Arrival before work start time is automatically set to workStartTime
    if (field === 'arrivalTime' && newTime) {
      const [hour] = newTime.split(':').map(Number);
      if (!isNaN(hour) && !isNaN(workH) && hour < workH) {
        finalNewTime = workStart;
      }
    }

    // RULE: Block future time entries relative to current simulation time
    if (finalNewTime && isFutureTimeForDate(presence.date, finalNewTime, todayStr, currentTime)) {
      alert(`⚠️ Action impossible : Vous ne pouvez pas enregistrer un pointage pour une heure qui n'est pas encore arrivée (${finalNewTime} > heure actuelle ${currentTime}).`);
      return;
    }

    // RULE 2: Departure after 17:30 requires motif
    if (field === 'departureTime' && finalNewTime) {
      const [hour, min] = finalNewTime.split(':').map(Number);
      if (!isNaN(hour) && !isNaN(min) && (hour > 17 || (hour === 17 && min > 30))) {
        if (!reason.trim() && !presence.departureReason) {
          alert("Un motif est obligatoire pour un départ enregistré après 17h30.");
          return;
        }
      }
    }

    const oldTime = presence[field];
    const isMandatory = isTimeModified(oldTime, finalNewTime);

    if (isMandatory && !reason.trim()) {
      alert("Le motif de correction est obligatoire car vous modifiez une heure déjà enregistrée.");
      return;
    }

    let updatedStatus = presence.status;
    if (field === 'arrivalTime') {
      if (finalNewTime) {
        if (isNonWorkingDay(presence.date)) {
          updatedStatus = 'present';
        } else {
          const lateThresh = moduleConfig?.lateThresholdTime;
          updatedStatus = isLate(finalNewTime, lateThresh) ? 'late' : 'present';
        }
      } else {
        updatedStatus = 'not_tracked';
      }
    }

    const statusChanged = presence.status !== updatedStatus;
    const isStatusMandatory = statusChanged && (presence.status === 'present' || presence.status === 'late') && updatedStatus === 'absent';

    if (isStatusMandatory && !reason.trim()) {
      alert("Le motif de correction est obligatoire car vous passez le statut à Absent.");
      return;
    }

    let updatedPresences: Presence[];
    const isVirtual = presence.id.startsWith('p-temp-');

    const depReasonToSave = field === 'departureTime' && reason.trim() ? reason.trim() : presence.departureReason;

    const clockKey = field === 'arrivalTime' ? 'arrival' : field === 'departureTime' ? 'departure' : field;
    const updatedClockLocations = {
      ...(presence.clockLocations || {}),
      [clockKey]: {
        latitude: COMPANY_HQ_LOCATION.latitude,
        longitude: COMPANY_HQ_LOCATION.longitude,
        zoneName: COMPANY_HQ_LOCATION.name,
        time: finalNewTime,
        method: 'manual_admin' as const,
        siteName: COMPANY_HQ_LOCATION.name
      }
    };

    if (isVirtual) {
      const newRealPresence: Presence = {
        id: `p-${presence.employeeId}-${presence.date}`,
        employeeId: presence.employeeId,
        date: presence.date,
        arrivalTime: field === 'arrivalTime' ? finalNewTime : null,
        pauseStart: field === 'pauseStart' ? finalNewTime : null,
        pauseEnd: field === 'pauseEnd' ? finalNewTime : null,
        departureTime: field === 'departureTime' ? finalNewTime : null,
        departureReason: depReasonToSave || null,
        status: updatedStatus,
        correctionReason: reason.trim() || null,
        location: `${COMPANY_HQ_LOCATION.name} (${COMPANY_HQ_LOCATION.address})`,
        latitude: COMPANY_HQ_LOCATION.latitude,
        longitude: COMPANY_HQ_LOCATION.longitude,
        siteName: COMPANY_HQ_LOCATION.name,
        clockingMethod: 'manual_admin',
        clockLocations: updatedClockLocations,
        updatedAt: new Date().toISOString()
      };
      updatedPresences = [...presences, newRealPresence];
    } else {
      updatedPresences = presences.map(p => {
        if (p.id === presence.id) {
          return {
            ...p,
            [field]: finalNewTime || null,
            departureReason: depReasonToSave || p.departureReason,
            status: updatedStatus,
            correctionReason: reason.trim() || p.correctionReason,
            location: `${COMPANY_HQ_LOCATION.name} (${COMPANY_HQ_LOCATION.address})`,
            latitude: COMPANY_HQ_LOCATION.latitude,
            longitude: COMPANY_HQ_LOCATION.longitude,
            siteName: COMPANY_HQ_LOCATION.name,
            clockingMethod: 'manual_admin',
            clockLocations: updatedClockLocations,
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      });
    }

    onUpdatePresences(updatedPresences);

    const emp = employees.find(e => e.id === presence.employeeId);
    const empName = emp ? emp.name : 'Employé';

    const actionLabels = {
      arrivalTime: 'Heure d\'arrivée',
      pauseStart: 'Départ Pause',
      pauseEnd: 'Retour Pause',
      departureTime: 'Départ Bureau'
    };

    const isExistingTimeModified = isTimeModified(oldTime, finalNewTime);
    const logTitle = isExistingTimeModified 
      ? `Correction en ligne : ${empName}` 
      : `Saisie de pointage : ${empName}`;

    triggerWhatsAppLog(
      logTitle,
      `${isExistingTimeModified ? 'Modification d\'une heure enregistrée' : 'Saisie d\'un pointage'} [${actionLabels[field]}] pour ${empName}.\n• Ancienne heure: ${oldTime || '--:--'}\n• Nouvelle heure: ${newTime || '--:--'}\n• Statut final: ${updatedStatus.toUpperCase()}\n• Motif renseigné: "${reason.trim() || 'Non spécifié (Pointage initial)'}"`,
      {
        event: isExistingTimeModified ? "presence_inline_modification" : "presence_inline_initial_entry",
        employee: {
          id: presence.employeeId,
          name: empName
        },
        field: field,
        oldTime: oldTime,
        newTime: newTime,
        status: updatedStatus,
        reason: reason.trim() || null,
        timestamp: new Date().toISOString()
      }
    );

    setEditingCell(null);
    setInlineTimeValue('');
    setInlineReason('');
  };

  const isStatusModifiedToOrFromPresent = (oldStatus: string, newStatus: string) => {
    return (oldStatus === 'present' || oldStatus === 'late') && newStatus === 'absent';
  };

  const isMotifMandatory = editingPresence ? (
    isTimeModified(editingPresence.arrivalTime, newArrival) ||
    isTimeModified(editingPresence.pauseStart, newPauseStart) ||
    isTimeModified(editingPresence.pauseEnd, newPauseEnd) ||
    isTimeModified(editingPresence.departureTime, newDeparture) ||
    isStatusModifiedToOrFromPresent(editingPresence.status, newStatus)
  ) : false;

  // 3. Save Edit/Correction with Mandatory Reason
  const handleSaveCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPresence) return;

    if (isWeekFinishedForDate(editingPresence.date, todayStr, currentTime)) {
      alert("Cette fiche appartient à une semaine déjà terminée et ne peut plus être modifiée.");
      return;
    }

    let finalArrival = newArrival;
    const workStart = moduleConfig?.workStartTime || '08:00';
    const [workH] = workStart.split(':').map(Number);
    if (newArrival) {
      const [h] = newArrival.split(':').map(Number);
      if (!isNaN(h) && !isNaN(workH) && h < workH) {
        finalArrival = workStart;
      }
    }

    // BLOCK FUTURE TIMES validation
    const timesToCheck = [
      { label: "d'arrivée", val: finalArrival },
      { label: "de début de pause", val: newPauseStart },
      { label: "de retour de pause", val: newPauseEnd },
      { label: "de départ", val: newDeparture },
    ];
    for (const t of timesToCheck) {
      if (t.val && isFutureTimeForDate(editingPresence.date, t.val, todayStr, currentTime)) {
        alert(`⚠️ Action impossible : Vous ne pouvez pas enregistrer une heure ${t.label} qui n'est pas encore arrivée (${t.val} > heure actuelle ${currentTime}).`);
        return;
      }
    }

    if (isMotifMandatory && !correctionReason.trim()) {
      alert('Veuillez spécifier obligatoirement un motif pour cette modification car vous avez modifié une heure déjà enregistrée.');
      return;
    }

    let finalDepartureReason = editingPresence.departureReason;
    if (newDeparture) {
      const [h, m] = newDeparture.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m) && (h > 17 || (h === 17 && m > 30))) {
        if (!correctionReason.trim() && !editingPresence.departureReason) {
          alert("Un motif est obligatoire pour un départ enregistré après 17h30.");
          return;
        }
        if (correctionReason.trim()) {
          finalDepartureReason = correctionReason.trim();
        }
      }
    }

    let updatedPresences: Presence[];
    const isVirtual = editingPresence.id.startsWith('p-temp-');

    const updatedLocations = { ...(editingPresence.clockLocations || {}) };

    if (finalArrival) {
      updatedLocations.arrival = {
        latitude: COMPANY_HQ_LOCATION.latitude,
        longitude: COMPANY_HQ_LOCATION.longitude,
        zoneName: COMPANY_HQ_LOCATION.name,
        time: finalArrival,
        method: 'manual_admin',
        siteName: COMPANY_HQ_LOCATION.name
      };
    }
    if (newPauseStart) {
      updatedLocations.pauseStart = {
        latitude: COMPANY_HQ_LOCATION.latitude,
        longitude: COMPANY_HQ_LOCATION.longitude,
        zoneName: COMPANY_HQ_LOCATION.name,
        time: newPauseStart,
        method: 'manual_admin',
        siteName: COMPANY_HQ_LOCATION.name
      };
    }
    if (newPauseEnd) {
      updatedLocations.pauseEnd = {
        latitude: COMPANY_HQ_LOCATION.latitude,
        longitude: COMPANY_HQ_LOCATION.longitude,
        zoneName: COMPANY_HQ_LOCATION.name,
        time: newPauseEnd,
        method: 'manual_admin',
        siteName: COMPANY_HQ_LOCATION.name
      };
    }
    if (newDeparture) {
      updatedLocations.departure = {
        latitude: COMPANY_HQ_LOCATION.latitude,
        longitude: COMPANY_HQ_LOCATION.longitude,
        zoneName: COMPANY_HQ_LOCATION.name,
        time: newDeparture,
        method: 'manual_admin',
        siteName: COMPANY_HQ_LOCATION.name
      };
    }

    if (isVirtual) {
      // Create a persistent, real presence record with a unique ID
      const newRealPresence: Presence = {
        id: `p-${editingPresence.employeeId}-${editingPresence.date}`,
        employeeId: editingPresence.employeeId,
        date: editingPresence.date,
        status: newStatus,
        arrivalTime: finalArrival || null,
        pauseStart: newPauseStart || null,
        pauseEnd: newPauseEnd || null,
        departureTime: newDeparture || null,
        departureReason: finalDepartureReason || null,
        correctionReason: correctionReason,
        location: `${COMPANY_HQ_LOCATION.name} (${COMPANY_HQ_LOCATION.address})`,
        latitude: COMPANY_HQ_LOCATION.latitude,
        longitude: COMPANY_HQ_LOCATION.longitude,
        siteName: COMPANY_HQ_LOCATION.name,
        clockingMethod: 'manual_admin',
        clockLocations: updatedLocations,
        updatedAt: new Date().toISOString()
      };
      updatedPresences = [...presences, newRealPresence];
    } else {
      updatedPresences = presences.map((p) => {
        if (p.id === editingPresence.id) {
          return {
            ...p,
            status: newStatus,
            arrivalTime: finalArrival || null,
            pauseStart: newPauseStart || null,
            pauseEnd: newPauseEnd || null,
            departureTime: newDeparture || null,
            departureReason: finalDepartureReason || p.departureReason,
            correctionReason: correctionReason,
            location: `${COMPANY_HQ_LOCATION.name} (${COMPANY_HQ_LOCATION.address})`,
            latitude: COMPANY_HQ_LOCATION.latitude,
            longitude: COMPANY_HQ_LOCATION.longitude,
            siteName: COMPANY_HQ_LOCATION.name,
            clockingMethod: 'manual_admin',
            clockLocations: updatedLocations,
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      });
    }

    onUpdatePresences(updatedPresences);

    const employee = employees.find((e) => e.id === editingPresence.employeeId);
    const employeeName = employee ? employee.name : 'Employé';

    const oldTimesStr = [
      editingPresence.arrivalTime ? `Arrivée: ${editingPresence.arrivalTime}` : '',
      editingPresence.pauseStart ? `Pause: ${editingPresence.pauseStart}` : '',
      editingPresence.pauseEnd ? `Reprise: ${editingPresence.pauseEnd}` : '',
      editingPresence.departureTime ? `Départ: ${editingPresence.departureTime}` : '',
    ].filter(Boolean).join(', ') || 'Aucune heure enregistrée';

    const newTimesStr = [
      newArrival ? `Arrivée: ${newArrival}` : '',
      newPauseStart ? `Pause: ${newPauseStart}` : '',
      newPauseEnd ? `Reprise: ${newPauseEnd}` : '',
      newDeparture ? `Départ: ${newDeparture}` : '',
    ].filter(Boolean).join(', ');

    const hasModifiedExistingTime = editingPresence ? (
      isTimeModified(editingPresence.arrivalTime, newArrival) ||
      isTimeModified(editingPresence.pauseStart, newPauseStart) ||
      isTimeModified(editingPresence.pauseEnd, newPauseEnd) ||
      isTimeModified(editingPresence.departureTime, newDeparture)
    ) : false;

    const logTitle = hasModifiedExistingTime
      ? `Correction de présence : ${employeeName}`
      : `Saisie manuelle de pointage : ${employeeName}`;

    triggerWhatsAppLog(
      logTitle,
      `${hasModifiedExistingTime ? 'Modification d\'une heure déjà enregistrée' : 'Saisie d\'un pointage de présence'} pour ${employeeName}.\n• Ancien état: ${editingPresence.status.toUpperCase()} (${oldTimesStr})\n• Nouvel état: ${newStatus.toUpperCase()} (${newTimesStr})\n• Motif renseigné: "${correctionReason || 'Non spécifié (Pointage initial)'}"`,
      {
        event: hasModifiedExistingTime ? "presence_correction_by_coordinator" : "presence_manual_entry_by_coordinator",
        operator: currentRole,
        employee: {
          id: editingPresence.employeeId,
          name: employeeName
        },
        oldState: {
          status: editingPresence.status,
          arrivalTime: editingPresence.arrivalTime,
          pauseStart: editingPresence.pauseStart,
          pauseEnd: editingPresence.pauseEnd,
          departureTime: editingPresence.departureTime
        },
        newState: {
          status: newStatus,
          arrivalTime: newArrival || null,
          pauseStart: newPauseStart || null,
          pauseEnd: newPauseEnd || null,
          departureTime: newDeparture || null,
          reason: correctionReason || null
        },
        timestamp: new Date().toISOString()
      }
    );

    setShowEditModal(false);
    setEditingPresence(null);
  };

  // 4. Trigger Automatic 09:00 WhatsApp Report Simulation
  const triggerAutomatic0900Report = () => {
    const presentList: { name: string; time: string }[] = [];
    const lateList: { name: string; time: string }[] = [];
    const absentList: string[] = [];

    const holidayInfo = getHolidayInfo(todayStr);

    // Only include tracked employees in the daily report
    trackedEmployees.forEach((emp) => {
      const p = presences.find((p) => p.employeeId === emp.id && p.date === todayStr);
      if (!p || p.status === 'not_tracked' || (!p.arrivalTime && p.status !== 'absent')) {
        if (!holidayInfo) {
          absentList.push(emp.name);
        }
      } else if (p.status === 'present') {
        presentList.push({ name: emp.name, time: p.arrivalTime || '08:30' });
      } else if (p.status === 'late') {
        if (holidayInfo) {
          // No lateness on holidays
          presentList.push({ name: emp.name, time: p.arrivalTime || '08:30' });
        } else {
          lateList.push({ name: emp.name, time: p.arrivalTime || '09:15' });
        }
      } else if (p.status === 'absent') {
        if (!holidayInfo) {
          absentList.push(emp.name);
        }
      }
    });

    let reportMessage = '';
    if (holidayInfo) {
      reportMessage = `📢 *RAPPORT DE PRÉSENCES QUOTIDIEN (JOUR FÉRIÉ) - 09H00* 📢\n\n` +
        `🇨🇲 *Aujourd'hui est un jour férié officiel au Cameroun :* *${holidayInfo.name}*\n` +
        `📝 Le pointage est strictement facultatif aujourd'hui. Aucune pénalité n'est appliquée.\n\n` +
        `🟢 *Employés ayant choisi de pointer :*\n` +
        (presentList.length > 0 
          ? presentList.map(e => `• ${e.name} (Arrivé à ${e.time})`).join('\n') 
          : '• Aucun employé n\'a pointé ce matin (journée de repos officiellement)\n');
    } else {
      reportMessage = `📢 *RAPPORT DE PRÉSENCES QUOTIDIEN - 09H00* 📢\n\n` +
        `🟢 *Employés Présents :*\n` +
        (presentList.length > 0 
          ? presentList.map(e => `• ${e.name} à ${e.time}`).join('\n') 
          : '• Aucun employé arrivé dans les temps\n') +
        `\n🟡 *Retards :*\n` +
        (lateList.length > 0 
          ? lateList.map(e => `• ${e.name} (Arrivé à ${e.time})`).join('\n') 
          : '• Aucun retard enregistré ce matin\n') +
        `\n🔴 *Absents (Non enregistrés à 09h00) :*\n` +
        (absentList.length > 0 
          ? absentList.map(name => `• ${name}`).join('\n') 
          : '• Tout le monde est présent !');
    }

    triggerWhatsAppLog(
      holidayInfo 
        ? `Rapport automatique des présences (09h00 - Férié : ${holidayInfo.name})`
        : "Rapport automatique des présences (09h00)",
      reportMessage,
      {
        cron_event: "daily_presence_0900",
        destination: "Responsable Opérations",
        recipients_count: 1,
        statistics: {
          present: presentList.length,
          late: lateList.length,
          absent: absentList.length
        },
        data: {
          present: presentList,
          late: lateList,
          absent: absentList,
          is_holiday: !!holidayInfo,
          holiday_name: holidayInfo ? holidayInfo.name : null
        }
      }
    );

    alert("Le rapport automatique de 09h00 a été généré avec succès ! Vous pouvez consulter le journal d'envoi WhatsApp dans l'onglet 'Flux d'Alertes'.");
  };

  const [activeSubTab, setActiveSubTab] = useState<'register' | 'statistics' | 'requests'>(initialTab || 'register');

  React.useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab]);

  const pendingRequestsCount = React.useMemo(() => {
    let count = 0;
    presences.forEach(presence => {
      const pendingEmg = presence.emergencies?.filter(e => e.status === 'pending' || !e.status).length || 0;
      count += pendingEmg;

      if (presence.correctionReason && (presence.correctionReasonStatus === 'pending' || !presence.correctionReasonStatus)) {
        count += 1;
      }

      if (presence.departureReason && (presence.departureReasonStatus === 'pending' || !presence.departureReasonStatus)) {
        count += 1;
      }
    });
    return count;
  }, [presences]);
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'week' | 'month' | 'three_months' | 'specific_date' | 'custom_range'>('today');
  const [specificDate, setSpecificDate] = useState(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>('');

  // Pagination states for presence data table (default 25)
  const [presencePage, setPresencePage] = useState(1);
  const [presencePageSize, setPresencePageSize] = useState(25);

  // Synchroniser automatiquement le filtre de droite avec le collaborateur sélectionné à gauche pour la session Collaborateur
  React.useEffect(() => {
    if (currentRole === 'Employé' && selectedEmployeeId) {
      setFilterEmployeeId(selectedEmployeeId);
    }
  }, [currentRole, selectedEmployeeId]);

  // Selection on the left displays employee details in the pointer workspace, while filtering can be kept distinct.
  // We no longer automatically synchronize filterEmployeeId with selectedEmployeeId.

  // Calculate statistics for the selected employee
  const activeEmployeeStats = React.useMemo(() => {
    if (!selectedEmployeeId) return null;
    const targetEmp = employees.find(e => e.id === selectedEmployeeId);
    if (!targetEmp) return null;

    const pad = (n: number) => String(n).padStart(2, '0');
    const toDateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    // Get current month start & today
    const now = new Date();
    const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const mEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const empStart = targetEmp.hireDate && targetEmp.hireDate > toDateKey(mStart) ? new Date(targetEmp.hireDate) : mStart;
    const empEnd = targetEmp.departureDate && targetEmp.departureDate < toDateKey(mEnd) ? new Date(targetEmp.departureDate) : mEnd;

    let workingDaysThisMonth = 0;
    if (empStart <= empEnd) {
      const cur = new Date(empStart);
      while (cur <= empEnd) {
        const dayOfWeek = cur.getDay();
        const dKey = toDateKey(cur);
        if (dayOfWeek !== 0 && !isCameroonHoliday(dKey)) {
          workingDaysThisMonth++;
        }
        cur.setDate(cur.getDate() + 1);
      }
    }
    const totalWorkingDays = Math.max(1, workingDaysThisMonth);

    const empPresences = presences.filter(
      (p) => p.employeeId === selectedEmployeeId && p.date <= todayStr && p.status !== 'not_tracked'
    );
    
    let presentOnTime = 0;
    let late = 0;
    let declaredAbsent = 0;

    empPresences.forEach((p) => {
      if (p.status === 'absent') {
        declaredAbsent++;
      } else if (p.status === 'late' || (p.arrivalTime && p.arrivalTime > '08:15' && !isCameroonHoliday(p.date))) {
        late++;
      } else if (p.status === 'present' || p.arrivalTime) {
        presentOnTime++;
      }
    });

    const totalPointed = presentOnTime + late;
    const totalAbsences = Math.max(declaredAbsent, totalWorkingDays - totalPointed);
    const onTimeRate = totalPointed > 0 ? Math.round((presentOnTime / totalPointed) * 100) : 100;
    const attendanceRate = totalWorkingDays > 0 ? Math.min(100, Math.round((totalPointed / totalWorkingDays) * 100)) : 100;
    
    return {
      total: totalWorkingDays,
      present: presentOnTime,
      late,
      absent: totalAbsences,
      totalPointed,
      onTimeRate,
      attendanceRate
    };
  }, [selectedEmployeeId, presences, todayStr, employees]);

  // Determine the next step for daily pointage
  const nextStep = React.useMemo(() => {
    if (!activeEmployeePresence || !activeEmployeePresence.arrivalTime) {
      return {
        type: 'arrival' as const,
        label: 'Pointer mon Arrivée',
        icon: <UserCheck className="h-4 w-4" />,
        disabled: false,
        tooltip: "Enregistrer l'heure d'arrivée ce matin"
      };
    }

    const { arrivalTime, pauseStart, pauseEnd, departureTime } = activeEmployeePresence;

    if (departureTime) {
      return {
        type: 'completed' as const,
        label: 'Pointages terminés pour aujourd\'hui',
        icon: <CheckCircle className="h-4 w-4 text-emerald-600 inline" />,
        disabled: true,
        tooltip: "Tous les pointages de la journée ont été validés."
      };
    }

    const [currentHour, currentMin] = currentTime.split(':').map(Number);

    if (!pauseStart) {
      const isPauseTimeRange = currentHour >= 11 && currentHour < 15;
      if (isPauseTimeRange) {
        return {
          type: 'pauseStart' as const,
          label: 'Pointer mon début de Pause ☕',
          icon: <Coffee className="h-4 w-4" />,
          disabled: false,
          tooltip: "Débuter la pause déjeuner réglementaire"
        };
      } else if (currentHour >= 15) {
        return {
          type: 'departure' as const,
          label: 'Pointer mon Départ 👋',
          icon: <UserX className="h-4 w-4" />,
          disabled: false,
          tooltip: "Enregistrer l'heure de départ finale"
        };
      } else {
        return {
          type: 'waiting_pause' as const,
          label: 'Pause disponible à partir de 11:00',
          icon: <Coffee className="h-4 w-4" />,
          disabled: true,
          tooltip: "La pause déjeuner est réglementairement accessible de 11h00 à 15h00."
        };
      }
    }

    if (!pauseEnd) {
      return {
        type: 'pauseEnd' as const,
        label: 'Pointer ma reprise de Pause ☀️',
        icon: <Sun className="h-4 w-4" />,
        disabled: false,
        tooltip: "Marquer le retour de la pause de midi"
      };
    }

    return {
      type: 'departure' as const,
      label: 'Pointer mon Départ 👋',
      icon: <UserX className="h-4 w-4" />,
      disabled: false,
      tooltip: "Enregistrer votre départ bureau"
    };
  }, [activeEmployeePresence, currentTime]);

  // Compute filtered presences for the right-side history panel
  const filteredPresences = React.useMemo(() => {
    const isSingleDay = filterPeriod === 'today' || filterPeriod === 'specific_date';
    const targetDate = filterPeriod === 'today' ? todayStr : specificDate;

    if (isSingleDay) {
      // For a single day, ensure ALL tracked employees have a row (or the filtered employee)
      const list: Presence[] = [];
      const targetEmployees = filterEmployeeId 
        ? trackedEmployees.filter(e => e.id === filterEmployeeId) 
        : trackedEmployees;

      targetEmployees.forEach(emp => {
        const existing = presences.find(p => p.employeeId === emp.id && p.date === targetDate);
        if (existing) {
          list.push(existing);
        } else {
          list.push({
            id: `p-temp-${emp.id}-${targetDate}`,
            employeeId: emp.id,
            date: targetDate,
            arrivalTime: null,
            pauseStart: null,
            pauseEnd: null,
            departureTime: null,
            status: 'not_tracked' as any,
          });
        }
      });
      return list.sort((a, b) => {
        const empA = employees.find(e => e.id === a.employeeId)?.name || '';
        const empB = employees.find(e => e.id === b.employeeId)?.name || '';
        return empA.localeCompare(empB);
      });
    } else {
      // For range views, show historical entries of tracked employees only
      const pad = (n: number) => String(n).padStart(2, '0');
      const toDateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

      const now = new Date();
      // Week Monday to Sunday
      const day = now.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const weekStartStr = toDateKey(monday);
      const weekEndStr = toDateKey(sunday);

      // Month
      const currentMonthPrefix = todayStr.slice(0, 7);

      // 3 Months
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      threeMonthsAgo.setDate(1);
      const threeMonthsStartStr = toDateKey(threeMonthsAgo);

      return presences.filter((p) => {
        // Ensure the presence is for a tracked employee (non sponsor)
        const emp = employees.find(e => e.id === p.employeeId);
        if (!emp || emp.roleType === 'sponsor') {
          return false;
        }

        // 1. Employee filter
        if (filterEmployeeId && p.employeeId !== filterEmployeeId) {
          return false;
        }
        
        // 2. Period filter
        if (filterPeriod === 'week') {
          return p.date >= weekStartStr && p.date <= weekEndStr;
        } else if (filterPeriod === 'month') {
          return p.date.startsWith(currentMonthPrefix);
        } else if (filterPeriod === 'three_months') {
          return p.date >= threeMonthsStartStr && p.date <= todayStr;
        } else if (filterPeriod === 'custom_range') {
          return p.date >= startDate && p.date <= endDate;
        }
        return true;
      }).sort((a, b) => {
        // Sort by date descending, then by employee name
        if (a.date !== b.date) {
          return b.date.localeCompare(a.date);
        }
        const empA = employees.find(e => e.id === a.employeeId)?.name || '';
        const empB = employees.find(e => e.id === b.employeeId)?.name || '';
        return empA.localeCompare(empB);
      });
    }
  }, [presences, filterEmployeeId, filterPeriod, specificDate, todayStr, employees, startDate, endDate]);

  const rightMapDate = filterPeriod === 'today' ? todayStr : (filterPeriod === 'specific_date' ? specificDate : selectedPointageDate);

  // Export presence data to actual Excel sheet (.xls format with styling)
  const handleExportExcel = () => {
    if (filteredPresences.length === 0) {
      alert("Aucune donnée à exporter pour la période sélectionnée.");
      return;
    }
    
    const selectedEmp = employees.find(e => e.id === filterEmployeeId);
    const empNamePart = selectedEmp ? selectedEmp.name : "Tous les collaborateurs";
    const periodLabel = filterPeriod === 'today' ? "Aujourd'hui" : 
                        filterPeriod === 'week' ? "Cette semaine" : 
                        filterPeriod === 'month' ? "Ce mois" : 
                        filterPeriod === 'three_months' ? "3 derniers mois" : 
                        filterPeriod === 'specific_date' ? `Journée du ${specificDate}` : 
                        `Période personnalisée (du ${startDate} au ${endDate})`;

    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Présences</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; margin-top: 10px; }
          th { background-color: #BE123C; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #CBD5E1; text-align: left; }
          td { padding: 8px; border: 1px solid #CBD5E1; text-align: left; mso-number-format:"\\@"; }
          .title { font-size: 16px; font-weight: bold; color: #881337; font-family: 'Georgia', serif; }
          .meta { font-size: 11px; color: #64748B; margin-bottom: 10px; }
          .present { background-color: #F1F5F9; color: #1E293B; }
          .late { background-color: #FEF3C7; color: #92400E; }
          .absent { background-color: #F3F4F6; color: #9CA3AF; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="title">Citrine Management — Rapport d'Activités & Présences</div>
        <div class="meta">
          <strong>Collaborateur :</strong> ${empNamePart}<br/>
          <strong>Période :</strong> ${periodLabel}<br/>
          <strong>Exporté le :</strong> ${new Date().toLocaleString('fr-FR')}
        </div>
        <table>
          <thead>
            <tr>
              <th>Collaborateur</th>
              <th>Email</th>
              <th>Téléphone</th>
              <th>Date</th>
              <th>Statut</th>
              <th>Arrivée</th>
              <th>Début Pause</th>
              <th>Retour Pause</th>
              <th>Départ</th>
              <th>Zone Badgée (GPS)</th>
              <th>Motif de Correction</th>
            </tr>
          </thead>
          <tbody>
    `;

    filteredPresences.forEach(r => {
      const emp = employees.find(e => e.id === r.employeeId);
      const empName = emp ? emp.name : "Inconnu";
      const empEmail = emp ? emp.email : "";
      const empPhone = emp ? emp.phone : "";
      const isHoliday = isCameroonHoliday(r.date);
      const statusLabel = isHoliday 
        ? (r.status === 'present' || r.status === 'late' ? 'Présent (Férié)' : 'Repos (Férié)')
        : (r.status === 'present' ? 'Présent' :
           r.status === 'late' ? 'En retard' :
           r.status === 'absent' ? 'Absent' : 'Non pointé');
      
      const statusClass = isHoliday ? 'late' : (r.status === 'present' ? 'present' :
                          r.status === 'late' ? 'late' : 'absent');

      const zoneText = r.location 
        ? `${r.location} (${r.latitude ? r.latitude.toFixed(4) : '4.0185'}, ${r.longitude ? r.longitude.toFixed(4) : '9.8324'})` 
        : 'Douala, Japoma (4.0185, 9.8324)';

      html += `
        <tr>
          <td><b>${empName}</b></td>
          <td>${empEmail}</td>
          <td>${empPhone}</td>
          <td>${r.date}</td>
          <td class="${statusClass}">${statusLabel}</td>
          <td>${r.arrivalTime || "--:--"}</td>
          <td>${r.pauseStart || "--:--"}</td>
          <td>${r.pauseEnd || "--:--"}</td>
          <td>${r.departureTime || "--:--"}</td>
          <td>${zoneText}</td>
          <td>${r.correctionReason || ""}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const empNamePartClean = selectedEmp ? selectedEmp.name.toLowerCase().replace(/\s+/g, "_") : "tous_collaborateurs";
    const filename = `registre_presences_${empNamePartClean}_${filterPeriod}.xls`;
    
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" id="presence-module">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <h2 className="text-xl font-serif font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-emerald-600" />
            Suivi des Présences & Fiches de Pointage
          </h2>
        </div>

        {/* Navigation Tabs & Proxy Clock Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded-2xl">
            <button
              onClick={() => setActiveSubTab('register')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'register'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>📋 Registre & Pointages</span>
            </button>

            <button
              onClick={() => setActiveSubTab('statistics')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'statistics'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5 text-emerald-200" />
              <span>📊 Statistiques & Assiduité</span>
            </button>

            {(currentRole === 'Responsable' || currentRole === 'Administrateur') && (
              <button
                onClick={() => setActiveSubTab('requests')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer relative ${
                  activeSubTab === 'requests'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <span>🚨 Demandes & Urgences</span>
                {pendingRequestsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-extrabold animate-bounce shadow-md">
                    {pendingRequestsCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Render SubTabs */}
      {activeSubTab === 'requests' ? (
        <PresenceRequestsView
          presences={presences}
          employees={employees}
          onUpdatePresences={onUpdatePresences}
          showToast={showToast}
        />
      ) : activeSubTab === 'statistics' ? (
        <PresenceStatisticsView
          presences={presences}
          employees={employees}
          onSelectEmployee={(id) => {
            onSelectEmployee(id);
            setActiveSubTab('register');
          }}
        />
      ) : (
        <>
          {/* Breadcrumb / Back-navigation row */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium bg-[#FFFBFB] border border-green-100/60 p-2.5 px-4 rounded-xl w-fit shadow-2xs animate-fadeIn">
            <button 
              onClick={() => {
                onSelectEmployee('');
                setFilterEmployeeId('');
              }}
              className="hover:text-green-600 transition flex items-center gap-1 font-semibold cursor-pointer"
              title="Retourner au tableau général"
            >
              <Clock className="h-3.5 w-3.5 text-green-500 animate-pulse" />
              Suivi des Présences
            </button>
            {activeEmployee && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-stone-300" />
                <span className="text-green-900 font-bold bg-green-50/50 px-2.5 py-0.5 rounded-lg border border-green-100/50">
                  {activeEmployee.name}
                </span>
              </>
            )}
          </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left column: Quick Clock-In Widget & Stats */}
        <div className="lg:w-[380px] lg:order-1 shrink-0 sticky top-6 bg-white p-5 rounded-2xl border border-green-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-green-100 pb-3">
            <h3 className="text-xs font-bold tracking-wider uppercase text-green-800 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-green-500" />
              Espace Pointage Collaborateur
            </h3>
            <span className="bg-green-50/60 border border-green-100 text-green-800 text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold">
              {currentTime}
            </span>
          </div>

          {/* Employee selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-600">
              {currentRole === 'Employé' ? "Simuler en tant que :" : "Sélectionner la fiche collaborateur :"}
            </label>
            <SearchableSelect
              value={selectedEmployeeId}
              onChange={(val) => {
                onSelectEmployee(val);
                if (currentRole === 'Employé' || filterEmployeeId) {
                  setFilterEmployeeId(val);
                }
              }}
              options={trackedEmployees.map((emp) => ({
                value: emp.id,
                label: emp.name,
                description: `${emp.roleType || 'Collaborateur'} • ${emp.department || 'Général'}`,
                badge: emp.status === 'actif' ? 'Actif' : 'Inactif',
                badgeColor: emp.status === 'actif' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
              }))}
              placeholder="-- Choisissez un employé --"
              searchPlaceholder="Rechercher un collaborateur..."
              id="employee-pointer-select"
            />

            {/* Shortcut to Collaborateurs tab for managing employees */}
            {(currentRole === 'Responsable' || currentRole === 'Administrateur') && onSelectTab && (
              <div className="text-[10px] text-stone-500 flex justify-between items-center pt-0.5 px-1 leading-normal">
                <span>Un nouveau collaborateur ?</span>
                <button
                  type="button"
                  onClick={() => onSelectTab('collaborators')}
                  className="text-green-600 hover:text-green-700 font-bold underline flex items-center gap-0.5 cursor-pointer bg-transparent border-0 p-0"
                >
                  Créer un collaborateur &rarr;
                </button>
              </div>
            )}
          </div>

          {activeEmployee ? (
            <div className="space-y-5 pt-1">
              <div className="flex items-center gap-3 bg-green-50/40 p-3 rounded-xl border border-green-100/50">
                <img
                  src={activeEmployee.avatarUrl || undefined}
                  alt={activeEmployee.name}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover border border-green-200 shadow-xs"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-green-950 truncate">{activeEmployee.name}</h4>
                  <p className="text-[10px] text-stone-500 truncate">{activeEmployee.email}</p>
                </div>
              </div>

              {/* Pointage du Jour */}
              <div className="space-y-3">
                <div className="flex flex-col gap-1.5 border-b border-green-100 pb-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] font-bold font-serif uppercase tracking-wider text-green-950">
                      {formatFrenchPointageTitle(selectedPointageDate)}
                    </span>
                    {getHolidayInfo(selectedPointageDate) && (
                      <span className="bg-amber-100 border border-amber-200 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 shadow-3xs animate-pulse">
                        🇨🇲 Férié : {getHolidayInfo(selectedPointageDate)!.name}
                      </span>
                    )}
                    {activeEmployeePresence ? (
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        activeEmployeePresence.status === 'present' ? 'bg-green-100 text-green-800' :
                        activeEmployeePresence.status === 'late' ? 'bg-amber-100 text-amber-800' :
                        activeEmployeePresence.status === 'absent' ? 'bg-stone-200 text-stone-800' :
                        'bg-stone-100 text-stone-500'
                      }`}>
                        {activeEmployeePresence.status === 'present' ? 'Présent' :
                         activeEmployeePresence.status === 'late' ? 'En retard' :
                         activeEmployeePresence.status === 'absent' ? 'Absent' : 'Non pointé'}
                      </span>
                    ) : (
                      <span className="text-stone-400 italic text-[10px]">Aucun enregistrement</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px] bg-green-50/40 px-2.5 py-1 rounded-xl border border-green-100/60">
                    <span className="text-stone-600 font-medium">Changer la date :</span>
                    <input
                      type="date"
                      value={selectedPointageDate}
                      onChange={(e) => {
                        if (e.target.value) {
                          setSelectedPointageDate(e.target.value);
                          setSpecificDate(e.target.value);
                        }
                      }}
                      className="text-xs font-bold text-stone-800 bg-white border border-green-200 rounded-lg px-2 py-0.5 focus:outline-green-500 font-mono cursor-pointer"
                    />
                  </div>
                </div>

                {/* Milestones status */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2 border border-green-100/50 rounded-xl bg-green-50/20">
                    <span className="text-[9px] text-green-800 uppercase block font-semibold mb-0.5">Arrivée</span>
                    <span className="font-semibold text-stone-700 font-mono text-xs">
                      {activeEmployeePresence?.arrivalTime || '--:--'}
                    </span>
                  </div>
                  <div className="p-2 border border-green-100/50 rounded-xl bg-green-50/20">
                    <span className="text-[9px] text-green-800 uppercase block font-semibold mb-0.5">Pause Midi</span>
                    <span className="font-semibold text-stone-700 font-mono text-xs">
                      {activeEmployeePresence?.pauseStart || '--:--'}
                    </span>
                  </div>
                  <div className="p-2 border border-green-100/50 rounded-xl bg-green-50/20">
                    <span className="text-[9px] text-green-800 uppercase block font-semibold mb-0.5">Retour Pause</span>
                    <span className="font-semibold text-stone-700 font-mono text-xs">
                      {activeEmployeePresence?.pauseEnd || '--:--'}
                    </span>
                  </div>
                  <div className="p-2 border border-green-100/50 rounded-xl bg-green-50/20">
                    <span className="text-[9px] text-green-800 uppercase block font-semibold mb-0.5">Départ</span>
                    <span className="font-semibold text-stone-700 font-mono text-xs">
                      {activeEmployeePresence?.departureTime || '--:--'}
                    </span>
                  </div>
                </div>

                {/* Time triggers & Contextual Indicators */}
                <div className="space-y-3 pt-1" id="clock-actions-group">
                  {isSelfClocking ? (
                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-3">
                      <div className="flex items-start gap-2.5">
                        <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-xs text-stone-900">Mode Pointage Personnel (Responsable)</p>
                          <p className="text-[11px] text-stone-600 leading-relaxed mt-0.5">
                            Vous pointez pour votre propre compte. Vous bénéficiez ici de toutes les options de pointage employé (QR Code, Wi-Fi Bureau, GPS, Code 16 Caractères, PIN Borne) via votre Espace Collaborateur.
                          </p>
                        </div>
                      </div>
                      {onSelectTab && (
                        <button
                          type="button"
                          onClick={() => {
                            haptic.light();
                            onSelectTab('employee_portal');
                          }}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition"
                        >
                          <Clock className="h-4 w-4" />
                          <span>Ouvrir mon Espace Collaborateur & Toutes Options</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="bg-green-50/30 border border-green-100 p-3.5 rounded-xl space-y-2">
                      <p className="text-[10px] text-stone-500 font-semibold tracking-wide uppercase">Prochaine étape réglementaire :</p>
                      <button
                        onClick={() => {
                          if (nextStep.type !== 'completed' && nextStep.type !== 'waiting_pause') {
                            handleClockAction(nextStep.type);
                          }
                        }}
                        disabled={nextStep.disabled}
                        id="btn-clock-dynamic"
                        className="w-full inline-flex items-center justify-center gap-2 text-xs font-bold px-4 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white disabled:opacity-40 disabled:bg-stone-100 disabled:text-stone-400 cursor-pointer transition shadow-xs hover:shadow-md"
                        title={nextStep.tooltip}
                      >
                        {nextStep.icon}
                        <span>{nextStep.label}</span>
                      </button>
                      {nextStep.tooltip && (
                        <p className="text-[10px] text-stone-500 italic leading-relaxed text-center">
                          {nextStep.tooltip}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Contextual Daily Schedule/Pause Indicators */}
                  <div className="space-y-1.5 text-[10px] leading-relaxed">
                    {activeEmployeePresence?.arrivalTime && !activeEmployeePresence?.pauseStart && (
                      <div className="text-amber-700 bg-amber-50/50 border border-amber-100 rounded-lg p-2 flex items-center gap-1.5">
                        <Coffee className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <span>La pause déjeuner est disponible de 11:00 à 15:00.</span>
                      </div>
                    )}
                    {activeEmployeePresence?.pauseStart && !activeEmployeePresence?.pauseEnd && (
                      <div className="text-emerald-700 bg-emerald-50/50 border border-emerald-100 rounded-lg p-2 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>
                          Pause débutée à <strong>{activeEmployeePresence.pauseStart}</strong>. La reprise doit être pointée au retour.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {Number(currentTime.split(':')[0]) >= 9 && (
                  <div className="bg-green-50/50 border border-green-100 rounded-xl p-2.5 flex items-start gap-2">
                    <AlertCircle className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-green-950 leading-relaxed">
                      <strong>Alerte de Retard :</strong> À partir de 09h01, tout enregistrement déclenche une alerte WhatsApp d'activité.
                    </p>
                  </div>
                )}
              </div>

              {/* Statistiques Globales */}
              <div className="pt-3 border-t border-green-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-green-800">Statistiques Globales</span>
                  <span className="text-[9px] text-stone-400 italic">({activeEmployeeStats?.total} j. d'activité)</span>
                </div>

                <div className="p-3 bg-stone-50 border border-stone-100 rounded-xl space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-700 flex items-center gap-1">
                      <Award className="h-3.5 w-3.5 text-green-500" />
                      Ponctualité :
                    </span>
                    <span className="font-bold text-green-900 font-mono">{activeEmployeeStats?.onTimeRate}%</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${activeEmployeeStats?.onTimeRate}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-700 flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                      Assiduité :
                    </span>
                    <span className="font-bold text-green-900 font-mono">{activeEmployeeStats?.attendanceRate}%</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-green-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${activeEmployeeStats?.attendanceRate}%` }}
                    />
                  </div>
                </div>

                {/* Quantitative Stats Matrix */}
                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                  <div className="py-1.5 border border-emerald-100 rounded-xl bg-emerald-50/20">
                    <span className="text-[9px] text-emerald-800 block font-semibold">Présent</span>
                    <span className="font-mono font-bold text-emerald-700 text-xs">
                      {activeEmployeeStats?.present}
                    </span>
                  </div>
                  <div className="py-1.5 border border-amber-100 rounded-xl bg-amber-50/20">
                    <span className="text-[9px] text-amber-800 block font-semibold">Retard</span>
                    <span className="font-mono font-bold text-amber-700 text-xs">
                      {activeEmployeeStats?.late}
                    </span>
                  </div>
                  <div className="py-1.5 border border-green-100 rounded-xl bg-green-50/20">
                    <span className="text-[9px] text-green-800 block font-semibold">Absent</span>
                    <span className="font-mono font-bold text-green-700 text-xs">
                      {activeEmployeeStats?.absent}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-stone-400 text-xs italic">
              Veuillez sélectionner un collaborateur pour ouvrir sa fiche.
            </div>
          )}
        </div>

        {/* Right column: Filterable Attendance History with Excel Export */}
        <div className="lg:flex-1 lg:order-2 bg-white p-5 rounded-2xl border border-green-100 shadow-sm flex flex-col space-y-4">
          
          {/* List Toolbar / Filters */}
          <div className="bg-stone-50/50 p-4 rounded-xl border border-green-50 space-y-3 shrink-0">
            <div className="flex flex-col md:flex-row gap-3 items-end justify-between">
              
              {/* Employee filter */}
              <div className="space-y-1 w-full md:w-1/4">
                <label className="text-[10px] uppercase tracking-wider font-bold text-green-900 block">Collaborateur :</label>
                {currentRole === 'Employé' ? (
                  <div className="w-full text-xs border border-green-100 rounded-lg p-2 bg-green-50/50 text-green-900 font-bold truncate">
                    👤 {employees.find(e => e.id === selectedEmployeeId)?.name || 'Non sélectionné'}
                  </div>
                ) : (
                  <SearchableSelect
                    value={filterEmployeeId}
                    onChange={(val) => {
                      setFilterEmployeeId(val);
                      onSelectEmployee(val);
                    }}
                    options={[
                      { value: '', label: 'Tous les collaborateurs' },
                      ...trackedEmployees.map((emp) => ({
                        value: emp.id,
                        label: emp.name,
                        description: emp.roleType || 'Collaborateur'
                      }))
                    ]}
                    placeholder="Tous les collaborateurs"
                    searchPlaceholder="Filtrer collaborateur..."
                    size="sm"
                  />
                )}
              </div>

              {/* Period filter */}
              <div className="space-y-1 w-full md:w-1/4">
                <label className="text-[10px] uppercase tracking-wider font-bold text-green-900 block">Période :</label>
                <SearchableSelect
                  value={filterPeriod}
                  onChange={(val) => setFilterPeriod(val as any)}
                  options={[
                    { value: 'today', label: "Aujourd'hui" },
                    { value: 'week', label: 'Semaine en cours' },
                    { value: 'month', label: 'Mois en cours' },
                    { value: 'three_months', label: '3 derniers mois' },
                    { value: 'specific_date', label: 'Date spécifique' },
                    { value: 'custom_range', label: 'Plage personnalisée (Début/Fin)' }
                  ]}
                  placeholder="Sélectionner période"
                  searchPlaceholder="Rechercher période..."
                  size="sm"
                />
              </div>

              {/* Dynamic Specific Date Picker */}
              {filterPeriod === 'specific_date' && (
                <div className="space-y-1 w-full md:w-1/4 animate-fadeIn">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-green-900 block">Date :</label>
                  <input
                    type="date"
                    value={specificDate}
                    onChange={(e) => setSpecificDate(e.target.value)}
                    className="w-full text-xs border border-green-100 rounded-lg p-2 bg-white focus:outline-green-500 font-mono cursor-pointer"
                  />
                </div>
              )}

              {/* Dynamic Custom Date Range Pickers */}
              {filterPeriod === 'custom_range' && (
                <>
                  <div className="space-y-1 w-full md:w-1/5 animate-fadeIn">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-green-900 block">Date Début :</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full text-xs border border-green-100 rounded-lg p-2 bg-white focus:outline-green-500 font-mono cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1 w-full md:w-1/5 animate-fadeIn">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-green-900 block">Date Fin :</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full text-xs border border-green-100 rounded-lg p-2 bg-white focus:outline-green-500 font-mono cursor-pointer"
                    />
                  </div>
                </>
              )}

              {/* Export Button & Stats indicators */}
              <button
                onClick={handleExportExcel}
                className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs whitespace-nowrap"
                title="Exporter le registre de présence directement vers Microsoft Excel"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Exporter vers Excel (.xls)
              </button>

            </div>
          </div>

          {/* Heading with result count */}
          <div className="flex items-center justify-between border-b border-green-100 pb-2">
            <h4 className="text-xs font-bold text-green-950 uppercase tracking-wider">
              {filterPeriod === 'today' && formatFrenchPointageTitle(todayStr)}
              {filterPeriod === 'week' && "Fichier de présence — Semaine en cours"}
              {filterPeriod === 'month' && "Fichier de présence — Mois en cours"}
              {filterPeriod === 'three_months' && "Registre historique — 3 Derniers Mois"}
              {filterPeriod === 'specific_date' && formatFrenchPointageTitle(specificDate)}
              {filterPeriod === 'custom_range' && `Pointages du ${new Date(startDate).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short', year: 'numeric'})} au ${new Date(endDate).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short', year: 'numeric'})}`}
            </h4>
            <div className="flex items-center gap-2">
              {filterEmployeeId && (
                <button
                  onClick={() => {
                    setFilterEmployeeId('');
                    onSelectEmployee('');
                  }}
                  className="bg-green-100 hover:bg-green-200 text-green-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-green-200 transition flex items-center gap-1 cursor-pointer"
                  title="Effacer le filtre et afficher tous les collaborateurs"
                >
                  Filtré : {employees.find(e => e.id === filterEmployeeId)?.name} ✕
                </button>
              )}
              <span className="bg-green-50/80 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-100">
                {filteredPresences.length} fiches trouvées
              </span>
            </div>
          </div>

          {/* Main Table View */}
          <div className="flex-1 overflow-y-auto max-h-[380px] custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-white z-10 border-b border-green-100">
                <tr className="text-stone-400 uppercase text-[9px] font-bold tracking-wider">
                  <th className="py-2.5 font-semibold">Employé</th>
                  <th className="py-2.5 font-semibold text-center">Statut</th>
                  <th className="py-2.5 font-semibold text-center">Arrivée</th>
                  <th className="py-2.5 font-semibold text-center">Pause</th>
                  <th className="py-2.5 font-semibold text-center">Reprise</th>
                  <th className="py-2.5 font-semibold text-center">Départ</th>
                  <th className="py-2.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-50/50">
                {filteredPresences
                  .slice((presencePage - 1) * presencePageSize, presencePage * presencePageSize)
                  .map((presence) => {
                  const emp = employees.find((e) => e.id === presence.employeeId);
                  if (!emp) return null;

                  const isSelected = selectedEmployeeId === presence.employeeId;

                  return (
                    <tr 
                      key={presence.id} 
                      className={`transition ${
                        isSelected 
                          ? 'bg-green-100/40 font-medium' 
                          : 'hover:bg-green-50/20'
                      }`}
                    >
                      <td className={`py-2.5 pl-2 transition-all ${isSelected ? 'border-l-4 border-y-2 border-red-500 bg-green-100/50' : ''}`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation(); // Prevent any event bubbling
                                const checked = e.target.checked;
                                if (checked) {
                                  onSelectEmployee(presence.employeeId);
                                } else {
                                  onSelectEmployee('');
                                }
                              }}
                              className="h-3.5 w-3.5 text-green-600 border-green-300 rounded focus:ring-green-500 cursor-pointer shrink-0"
                              title="Cocher pour afficher ses détails à gauche sans vider le tableau"
                            />
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectEmployee(presence.employeeId);
                              }}
                              className="flex items-center gap-2 cursor-pointer group/user flex-1 min-w-0"
                              title="Cliquer pour afficher les détails de ce collaborateur à gauche sans filtrer le tableau"
                            >
                              <img
                                src={emp.avatarUrl || undefined}
                                alt={emp.name}
                                referrerPolicy="no-referrer"
                                className="w-7 h-7 rounded-full object-cover border border-green-100 shadow-2xs shrink-0 group-hover/user:scale-105 transition-transform"
                              />
                              <div className="min-w-0">
                                <span className="font-bold text-stone-800 block leading-tight group-hover/user:text-green-600 transition-colors truncate">
                                  {emp.name}
                                </span>
                                <span className="text-[9px] text-stone-400 block truncate">{emp.email}</span>
                                {presence.location ? (
                                  <span className="text-[9px] font-bold text-green-800 bg-green-50 border border-green-200/60 px-1.5 py-0.2 rounded-md inline-flex items-center gap-0.5 mt-0.5" title={`Coordonnées GPS: ${presence.latitude || '4.0185'}, ${presence.longitude || '9.8324'}`}>
                                    <MapPin className="h-2.5 w-2.5 text-green-500 shrink-0" />
                                    {presence.location}
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-medium text-stone-400 bg-stone-50 border border-stone-200/60 px-1.5 py-0.2 rounded-md inline-flex items-center gap-0.5 mt-0.5">
                                    <MapPin className="h-2.5 w-2.5 text-stone-400 shrink-0" />
                                    Douala, Japoma
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Eye button specifically to trigger filtering */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectEmployee(presence.employeeId);
                              setFilterEmployeeId(presence.employeeId);
                            }}
                            className="p-1 hover:bg-green-100 text-stone-400 hover:text-green-600 rounded-md transition cursor-pointer flex items-center justify-center shrink-0"
                            title="Cliquer sur l'œil pour filtrer le tableau et n'afficher que cet employé seul"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className={`py-2.5 text-center transition-all ${isSelected ? 'border-y-2 border-red-500 bg-green-100/50' : ''}`}>
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            isCameroonHoliday(presence.date) ? 'bg-amber-100 text-amber-800 border border-amber-200/50' :
                            presence.status === 'present' ? 'bg-green-200/80 text-green-800' :
                            presence.status === 'late' ? 'bg-amber-100 text-amber-800' :
                            presence.status === 'absent' ? 'bg-stone-200 text-stone-800' :
                            'bg-stone-100 text-stone-400'
                          }`}>
                            {isCameroonHoliday(presence.date)
                              ? (presence.status === 'present' || presence.status === 'late' ? 'Présent (Férié)' : 'Repos (Férié)')
                              : (presence.status === 'present' ? 'Présent' :
                                 presence.status === 'late' ? 'Retard' :
                                 presence.status === 'absent' ? 'Absent' : 'Non pointé')
                            }
                          </span>
                          {isCameroonHoliday(presence.date) && (
                            <span className="text-[8px] font-bold text-amber-700 block truncate max-w-[100px]" title={getHolidayInfo(presence.date)?.name}>
                              🇨🇲 {getHolidayInfo(presence.date)?.name}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Arrivée cell */}
                      <td className={`py-2 text-center font-mono text-stone-600 font-bold transition-all ${isSelected ? 'border-y-2 border-red-500 bg-green-100/50' : ''}`}>
                        {editingCell?.presenceId === presence.id && editingCell?.field === 'arrivalTime' ? (
                          <div className="flex flex-col items-center gap-1.5 p-1 bg-white border border-green-100 rounded-lg shadow-xs min-w-[140px] mx-auto" onClick={e => e.stopPropagation()}>
                            <FrenchTimePicker
                              value={inlineTimeValue}
                              onChange={(val) => setInlineTimeValue(val)}
                              className="w-full"
                            />
                            {isTimeModified(presence.arrivalTime, inlineTimeValue) && (
                              <input
                                type="text"
                                placeholder="Motif obligatoire..."
                                value={inlineReason}
                                onChange={(e) => setInlineReason(e.target.value)}
                                className="text-[9px] p-1 border border-green-200 rounded w-full text-center focus:outline-green-500"
                              />
                            )}
                            <div className="flex gap-1 w-full justify-center">
                              <button
                                onClick={() => handleSaveInlineCell(presence, 'arrivalTime', inlineTimeValue, inlineReason)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-1 rounded text-[9px] w-full cursor-pointer"
                              >
                                OK
                              </button>
                              <button
                                onClick={() => setEditingCell(null)}
                                className="bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold p-1 rounded text-[9px] w-full cursor-pointer"
                              >
                                X
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (currentRole === 'Responsable' || currentRole === 'Administrateur') {
                                setEditingCell({ presenceId: presence.id, field: 'arrivalTime' });
                                setInlineTimeValue(presence.arrivalTime || '');
                                setInlineReason('');
                              }
                            }}
                            className={`hover:text-green-600 hover:underline w-full py-2.5 text-center font-bold ${(currentRole === 'Responsable' || currentRole === 'Administrateur') ? 'cursor-pointer text-green-700' : 'cursor-default'}`}
                            disabled={!(currentRole === 'Responsable' || currentRole === 'Administrateur')}
                          >
                            <div>{presence.arrivalTime || '--:--'}</div>
                            {presence.arrivalTime && (
                              <div className="text-[9px] font-sans font-normal text-stone-500 flex items-center justify-center gap-0.5 mt-0.5">
                                <MapPin className="h-2.5 w-2.5 text-green-500 shrink-0" />
                                <span>({presence.clockLocations?.arrival?.zoneName || presence.location || 'Douala, Japoma'})</span>
                              </div>
                            )}
                          </button>
                        )}
                      </td>

                      {/* Pause Start cell */}
                      <td className={`py-2 text-center font-mono text-stone-500 transition-all ${isSelected ? 'border-y-2 border-red-500 bg-green-100/50' : ''}`}>
                        {editingCell?.presenceId === presence.id && editingCell?.field === 'pauseStart' ? (
                          <div className="flex flex-col items-center gap-1.5 p-1 bg-white border border-green-100 rounded-lg shadow-xs min-w-[140px] mx-auto" onClick={e => e.stopPropagation()}>
                            <FrenchTimePicker
                              value={inlineTimeValue}
                              onChange={(val) => setInlineTimeValue(val)}
                              className="w-full"
                            />
                            {isTimeModified(presence.pauseStart, inlineTimeValue) && (
                              <input
                                type="text"
                                placeholder="Motif obligatoire..."
                                value={inlineReason}
                                onChange={(e) => setInlineReason(e.target.value)}
                                className="text-[9px] p-1 border border-green-200 rounded w-full text-center focus:outline-green-500"
                              />
                            )}
                            <div className="flex gap-1 w-full justify-center">
                              <button
                                onClick={() => handleSaveInlineCell(presence, 'pauseStart', inlineTimeValue, inlineReason)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-1 rounded text-[9px] w-full cursor-pointer"
                              >
                                OK
                              </button>
                              <button
                                onClick={() => setEditingCell(null)}
                                className="bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold p-1 rounded text-[9px] w-full cursor-pointer"
                              >
                                X
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (currentRole === 'Responsable' || currentRole === 'Administrateur') {
                                setEditingCell({ presenceId: presence.id, field: 'pauseStart' });
                                setInlineTimeValue(presence.pauseStart || '');
                                setInlineReason('');
                              }
                            }}
                            className={`hover:text-green-600 hover:underline w-full py-2.5 text-center ${(currentRole === 'Responsable' || currentRole === 'Administrateur') ? 'cursor-pointer text-green-700' : 'cursor-default'}`}
                            disabled={!(currentRole === 'Responsable' || currentRole === 'Administrateur')}
                          >
                            <div>{presence.pauseStart || '--:--'}</div>
                            {presence.pauseStart && (
                              <div className="text-[9px] font-sans font-normal text-stone-500 flex items-center justify-center gap-0.5 mt-0.5">
                                <MapPin className="h-2.5 w-2.5 text-green-500 shrink-0" />
                                <span>({presence.clockLocations?.pauseStart?.zoneName || presence.location || 'Douala, Japoma'})</span>
                              </div>
                            )}
                          </button>
                        )}
                      </td>

                      {/* Pause End cell */}
                      <td className={`py-2 text-center font-mono text-stone-500 transition-all ${isSelected ? 'border-y-2 border-red-500 bg-green-100/50' : ''}`}>
                        {editingCell?.presenceId === presence.id && editingCell?.field === 'pauseEnd' ? (
                          <div className="flex flex-col items-center gap-1.5 p-1 bg-white border border-green-100 rounded-lg shadow-xs min-w-[140px] mx-auto" onClick={e => e.stopPropagation()}>
                            <FrenchTimePicker
                              value={inlineTimeValue}
                              onChange={(val) => setInlineTimeValue(val)}
                              className="w-full"
                            />
                            {isTimeModified(presence.pauseEnd, inlineTimeValue) && (
                              <input
                                type="text"
                                placeholder="Motif obligatoire..."
                                value={inlineReason}
                                onChange={(e) => setInlineReason(e.target.value)}
                                className="text-[9px] p-1 border border-green-200 rounded w-full text-center focus:outline-green-500"
                              />
                            )}
                            <div className="flex gap-1 w-full justify-center">
                              <button
                                onClick={() => handleSaveInlineCell(presence, 'pauseEnd', inlineTimeValue, inlineReason)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-1 rounded text-[9px] w-full cursor-pointer"
                              >
                                OK
                              </button>
                              <button
                                onClick={() => setEditingCell(null)}
                                className="bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold p-1 rounded text-[9px] w-full cursor-pointer"
                              >
                                X
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (currentRole === 'Responsable' || currentRole === 'Administrateur') {
                                setEditingCell({ presenceId: presence.id, field: 'pauseEnd' });
                                setInlineTimeValue(presence.pauseEnd || '');
                                setInlineReason('');
                              }
                            }}
                            className={`hover:text-green-600 hover:underline w-full py-2.5 text-center ${(currentRole === 'Responsable' || currentRole === 'Administrateur') ? 'cursor-pointer text-green-700' : 'cursor-default'}`}
                            disabled={!(currentRole === 'Responsable' || currentRole === 'Administrateur')}
                          >
                            <div>{presence.pauseEnd || '--:--'}</div>
                            {presence.pauseEnd && (
                              <div className="text-[9px] font-sans font-normal text-stone-500 flex items-center justify-center gap-0.5 mt-0.5">
                                <MapPin className="h-2.5 w-2.5 text-green-500 shrink-0" />
                                <span>({presence.clockLocations?.pauseEnd?.zoneName || presence.location || 'Douala, Japoma'})</span>
                              </div>
                            )}
                          </button>
                        )}
                      </td>

                      {/* Departure Time cell */}
                      <td className={`py-2 text-center font-mono text-stone-600 font-bold transition-all ${isSelected ? 'border-y-2 border-red-500 bg-green-100/50' : ''}`}>
                        {editingCell?.presenceId === presence.id && editingCell?.field === 'departureTime' ? (
                          <div className="flex flex-col items-center gap-1.5 p-1 bg-white border border-green-100 rounded-lg shadow-xs min-w-[140px] mx-auto" onClick={e => e.stopPropagation()}>
                            <FrenchTimePicker
                              value={inlineTimeValue}
                              onChange={(val) => setInlineTimeValue(val)}
                              className="w-full"
                            />
                            {isTimeModified(presence.departureTime, inlineTimeValue) && (
                              <input
                                type="text"
                                placeholder="Motif obligatoire..."
                                value={inlineReason}
                                onChange={(e) => setInlineReason(e.target.value)}
                                className="text-[9px] p-1 border border-green-200 rounded w-full text-center focus:outline-green-500"
                              />
                            )}
                            <div className="flex gap-1 w-full justify-center">
                              <button
                                onClick={() => handleSaveInlineCell(presence, 'departureTime', inlineTimeValue, inlineReason)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-1 rounded text-[9px] w-full cursor-pointer"
                              >
                                OK
                              </button>
                              <button
                                onClick={() => setEditingCell(null)}
                                className="bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold p-1 rounded text-[9px] w-full cursor-pointer"
                              >
                                X
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (currentRole === 'Responsable' || currentRole === 'Administrateur') {
                                setEditingCell({ presenceId: presence.id, field: 'departureTime' });
                                setInlineTimeValue(presence.departureTime || '');
                                setInlineReason('');
                              }
                            }}
                            className={`hover:text-green-600 hover:underline w-full py-2.5 text-center font-bold ${(currentRole === 'Responsable' || currentRole === 'Administrateur') ? 'cursor-pointer text-green-700' : 'cursor-default'}`}
                            disabled={!(currentRole === 'Responsable' || currentRole === 'Administrateur')}
                          >
                            <div>{presence.departureTime || '--:--'}</div>
                            {presence.departureTime && (
                              <div className="space-y-0.5 mt-0.5">
                                <div className="text-[9px] font-sans font-normal text-stone-500 flex items-center justify-center gap-0.5">
                                  <MapPin className="h-2.5 w-2.5 text-green-500 shrink-0" />
                                  <span>({presence.clockLocations?.departure?.zoneName || presence.location || 'Douala, Japoma'})</span>
                                </div>
                                {presence.departureReason && (
                                  <div className="text-[8px] font-medium text-amber-900 bg-amber-100/90 border border-amber-300/80 rounded px-1 py-0.5 max-w-[120px] mx-auto truncate font-sans" title={`Motif sortie tardive : ${presence.departureReason}`}>
                                    💬 {presence.departureReason}
                                  </div>
                                )}
                              </div>
                            )}
                          </button>
                        )}
                      </td>
                      <td className={`py-2.5 text-right pr-2 transition-all ${isSelected ? 'border-r-2 border-y-2 border-red-500 bg-green-100/50' : ''}`}>
                        {isWeekFinishedForDate(presence.date, todayStr, currentTime) ? (
                          <span 
                            className="inline-flex items-center gap-1 text-[9px] text-stone-400 font-medium bg-stone-100 border border-stone-200/50 px-1.5 py-0.5 rounded-md cursor-not-allowed"
                            title="Semaine terminée. Fiche verrouillée (limite vendredi 17h00)."
                          >
                            <ShieldAlert className="h-3 w-3 text-stone-400" />
                            Fermé
                          </span>
                        ) : (currentRole === 'Responsable' || currentRole === 'Administrateur') ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent selecting the row when editing
                              openEditModal(presence);
                            }}
                            className="p-1 hover:bg-green-50 hover:text-green-700 rounded-lg text-stone-400 transition cursor-pointer"
                            title="Modifier cette fiche de présence"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <span className="text-[9px] text-stone-400 italic">Lecture</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredPresences.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-stone-400 italic">
                      Aucune fiche de présence n'a été trouvée pour les critères sélectionnés.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Datatable Pagination Controls */}
          {(() => {
            const totalItems = filteredPresences.length;
            const totalPages = Math.ceil(totalItems / presencePageSize) || 1;
            const indexOfLastItem = presencePage * presencePageSize;
            const indexOfFirstItem = indexOfLastItem - presencePageSize;

            return (
              <div className="bg-stone-50 border-t border-stone-200 px-3 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs rounded-b-xl">
                <div className="flex items-center gap-3">
                  <span className="text-stone-500">Afficher</span>
                  <select
                    value={presencePageSize}
                    onChange={(e) => {
                      setPresencePageSize(Number(e.target.value));
                      setPresencePage(1);
                    }}
                    className="bg-white border border-stone-200 rounded-lg px-2 py-1 font-bold text-stone-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                  >
                    <option value={25}>25 par page</option>
                    <option value={50}>50 par page</option>
                    <option value={10}>10 par page</option>
                  </select>
                  <span className="text-stone-300">|</span>
                  <span className="text-stone-500">
                    Lignes <strong className="text-stone-800">{totalItems > 0 ? indexOfFirstItem + 1 : 0}</strong> à <strong className="text-stone-800">{Math.min(indexOfLastItem, totalItems)}</strong> sur <strong className="text-stone-800">{totalItems}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPresencePage(1)}
                    disabled={presencePage === 1}
                    className="p-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed text-stone-600 transition cursor-pointer"
                    title="Première page"
                  >
                    «
                  </button>
                  <button
                    onClick={() => setPresencePage(prev => Math.max(prev - 1, 1))}
                    disabled={presencePage === 1}
                    className="p-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed text-stone-600 transition cursor-pointer"
                    title="Page précédente"
                  >
                    ‹
                  </button>

                  <div className="px-2.5 py-0.5 bg-white border border-emerald-200 rounded-lg font-bold text-emerald-700 shadow-2xs">
                    Page {presencePage} / {totalPages}
                  </div>

                  <button
                    onClick={() => setPresencePage(prev => Math.min(prev + 1, totalPages))}
                    disabled={presencePage === totalPages}
                    className="p-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed text-stone-600 transition cursor-pointer"
                    title="Page suivante"
                  >
                    ›
                  </button>
                  <button
                    onClick={() => setPresencePage(totalPages)}
                    disabled={presencePage === totalPages}
                    className="p-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed text-stone-600 transition cursor-pointer"
                    title="Dernière page"
                  >
                    »
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Carte Leaflet montrant les lieux de pointage du jour (div de droite) */}
          <PointageMap
            presences={presences}
            employees={employees}
            selectedDate={rightMapDate}
            selectedEmployeeId={filterEmployeeId || undefined}
            onDateChange={(newDate) => {
              setSelectedPointageDate(newDate);
              setSpecificDate(newDate);
              setFilterPeriod('specific_date');
            }}
            className="mt-3 shrink-0"
          />

        </div>
      </div>

      {/* Edit Correction Modal */}
      <AnimatePresence>
        {showEditModal && editingPresence && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-green-100 max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-green-100 pb-3">
                <div>
                  <h4 className="font-serif font-bold text-green-950 text-sm">
                    {isMotifMandatory ? 'Correction de la fiche de présence' : 'Saisie manuelle de pointage'} — {formatFrenchPointageTitle(editingPresence.date)}
                  </h4>
                  <p className="text-[10px] text-stone-500 font-medium mt-0.5">
                    Collaborateur : <strong className="text-stone-800">{employees.find(e => e.id === editingPresence.employeeId)?.name}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="text-stone-400 hover:text-stone-600 text-xs cursor-pointer font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveCorrection} className="space-y-4 text-xs">
                {/* Date Selector */}
                <div className="space-y-1">
                  <label className="text-stone-600 font-semibold">Date du pointage :</label>
                  <input
                    type="date"
                    value={editingPresence.date}
                    onChange={(e) => {
                      if (e.target.value) {
                        const d = e.target.value;
                        setEditingPresence({ ...editingPresence, date: d });
                        setSelectedPointageDate(d);
                        setSpecificDate(d);
                      }
                    }}
                    className="w-full border border-green-100 rounded-xl p-2.5 bg-white font-mono font-bold text-xs cursor-pointer focus:outline-green-500"
                  />
                </div>

                {/* Status selector */}
                <div className="space-y-1">
                  <label className="text-stone-600 font-semibold">Statut de la présence :</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as PresenceStatus)}
                    className="w-full border border-green-100 rounded-xl p-2.5 bg-green-50/20 focus:bg-white focus:outline-green-500"
                  >
                    <option value="present">Présent</option>
                    <option value="late">En retard</option>
                    <option value="absent">Absent</option>
                    <option value="not_tracked">Non pointé</option>
                  </select>
                </div>

                {/* Times grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 flex flex-col">
                    <label className="text-stone-600 font-semibold">Heure d'arrivée :</label>
                    <FrenchTimePicker
                      value={newArrival}
                      onChange={(val) => setNewArrival(val)}
                      className="w-full justify-between"
                    />
                  </div>
                  <div className="space-y-1 flex flex-col">
                    <label className="text-stone-600 font-semibold">Départ Pause :</label>
                    <FrenchTimePicker
                      value={newPauseStart}
                      onChange={(val) => setNewPauseStart(val)}
                      className="w-full justify-between"
                    />
                  </div>
                  <div className="space-y-1 flex flex-col">
                    <label className="text-stone-600 font-semibold">Retour Pause :</label>
                    <FrenchTimePicker
                      value={newPauseEnd}
                      onChange={(val) => setNewPauseEnd(val)}
                      className="w-full justify-between"
                    />
                  </div>
                  <div className="space-y-1 flex flex-col">
                    <label className="text-stone-600 font-semibold">Départ Bureau :</label>
                    <FrenchTimePicker
                      value={newDeparture}
                      onChange={(val) => setNewDeparture(val)}
                      className="w-full justify-between"
                    />
                  </div>
                </div>

                {/* Mandatory Correction Reason */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-stone-600 font-semibold flex items-center gap-1">
                      <ShieldAlert className="h-3.5 w-3.5 text-green-500" />
                      Motif de la modification {isMotifMandatory && <span className="text-green-500">*</span>}
                    </label>
                    <span className={`text-[10px] italic font-bold ${isMotifMandatory ? 'text-green-800' : 'text-stone-400'}`}>
                      {isMotifMandatory ? 'Obligatoire' : 'Optionnel'}
                    </span>
                  </div>
                  <textarea
                    required={isMotifMandatory}
                    rows={2.5}
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    placeholder={isMotifMandatory ? "Ex: Problème de transport ou oubli de pointage ce matin..." : "Ex: Précisions optionnelles (facultatif)..."}
                    className="w-full border border-green-100 rounded-xl p-2.5 bg-green-50/20 focus:bg-white focus:outline-green-500"
                  />
                </div>

                <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-green-950 text-[10px] leading-relaxed">
                  <strong>Validation obligatoire :</strong> Cette mise à jour est acheminée par alerte WhatsApp avec le motif renseigné.
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-stone-200 rounded-xl text-stone-700 font-bold hover:bg-stone-50 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    Enregistrer & Envoyer l'alerte
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        </>
      )}
    </div>
  );
}
