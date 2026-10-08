import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Search, 
  UserCheck, 
  X, 
  Save, 
  Plus, 
  Download, 
  MapPin, 
  AlertTriangle, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Pencil,
  QrCode,
  KeyRound,
  DoorClosed,
  ShieldCheck,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { Employee, Presence, NotificationLog, CompanyModuleConfig, AppUser, AttendanceIncident } from '../types';
import { PointageMap } from './PointageMap';
import { MapLayerControls, MapLayerType } from './presence/map/MapLayerControls';
import FrenchTimePicker from './employee/FrenchTimePicker';
import { getEmployeeSoftColor } from '../utils/colorUtils';
import DynamicQrManagerModal from './presence/DynamicQrManagerModal';
import AdminOnBehalfClockModal from './presence/AdminOnBehalfClockModal';
import { PersonalAccessKeyModal } from './presence/PersonalAccessKeyModal';
import { PresenceIncidentsAdminView } from './presence/PresenceIncidentsAdminView';
import { incidentService } from '../services/incidentService';

interface PresencePanelProps {
  employees: Employee[];
  presences: Presence[];
  onUpdatePresences: (updated: Presence[]) => void;
  onAddNotification: (log: NotificationLog) => void;
  currentRole: 'Administrateur' | 'Employé' | 'Responsable';
  selectedEmployeeId: string;
  onSelectEmployee: (id: string) => void;
  currentTime: string;
  onSelectTab?: (tab: any) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
  moduleConfig?: CompanyModuleConfig;
  currentUser?: AppUser;
  attendanceIncidents?: AttendanceIncident[];
  onUpdateAttendanceIncidents?: (incidents: AttendanceIncident[]) => void;
  onAddAttendanceIncident?: (incident: AttendanceIncident) => void;
}

export default function PresencePanel({
  employees = [],
  presences = [],
  onUpdatePresences,
  onAddNotification,
  onSelectTab,
  showToast,
  currentUser,
  moduleConfig,
  attendanceIncidents = [],
  onUpdateAttendanceIncidents,
  onAddAttendanceIncident,
}: PresencePanelProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  // Selected date and employee for the left sidebar clocking widget
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [activeSidebarEmpId, setActiveSidebarEmpId] = useState(employees[0]?.id || '');
  const [sidebarTime, setSidebarTime] = useState(() => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));

  // Main list filters
  const [collaboratorFilter, setCollaboratorFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('today'); // 'today', 'yesterday', 'all'
  const [itemsPerPage, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Manual pointage editor modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPresence, setEditingPresence] = useState<Presence | null>(null);

  // Dedicated Badging Modals for Responsable
  const [isDynamicQrModalOpen, setIsDynamicQrModalOpen] = useState(false);
  const [isAdminClockModalOpen, setIsAdminClockModalOpen] = useState(false);
  const [isOfficeQrModalOpen, setIsOfficeQrModalOpen] = useState(false);
  const [activePresenceTab, setActivePresenceTab] = useState<'presences' | 'incidents'>('presences');
  const [mapLayer, setMapLayer] = useState<MapLayerType>('standard');

  const [editForm, setEditForm] = useState({
    arrivalTime: '08:00',
    pauseStart: '',
    pauseEnd: '',
    departureTime: '',
    status: 'present' as Presence['status'],
    location: 'Bureau Principal - Douala III',
    correctionReason: '',
  });

  // Clock in/out logic for the selected employee on the left sidebar
  const activeEmployee = employees.find((e) => e.id === activeSidebarEmpId) || employees[0];
  const empPresences = presences.filter((p) => p.employeeId === activeEmployee?.id);
  const currentPresence = presences.find(
    (p) => p.employeeId === activeEmployee?.id && p.date === selectedDate
  );

  // Calculate global stats for this employee based on the last 6 activity days
  const presentCount = empPresences.filter((p) => p.status === 'present').length;
  const lateCount = empPresences.filter((p) => p.status === 'late').length;
  const absentCount = empPresences.filter((p) => p.status === 'absent').length;
  const totalActDays = presentCount + lateCount + absentCount || 1;
  const punctualityRate = Math.round((presentCount / totalActDays) * 100);
  const attendanceRate = Math.round(((presentCount + lateCount) / (totalActDays + 1)) * 100) || 50;

  useEffect(() => {
    const timer = setInterval(() => {
      setSidebarTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync activeEmployee changes to left sidebar
  useEffect(() => {
    if (employees.length > 0 && !activeSidebarEmpId) {
      setActiveSidebarEmpId(employees[0].id);
    }
  }, [employees]);

  // Determine clocking state machine step for the green button
  const getNextClockingStep = () => {
    const isBreakEnabled = moduleConfig?.enableBreakTracking !== false;
    if (!currentPresence) {
      return {
        label: 'Pointer mon Arrivée ☕',
        desc: 'Débuter la journée de travail et enregistrer l\'arrivée',
        action: 'arrival',
      };
    }
    if (isBreakEnabled && !currentPresence.pauseStart) {
      return {
        label: 'Pointer mon début de Pause 🍲',
        desc: 'Débuter la pause déjeuner réglementaire',
        action: 'pause_start',
      };
    }
    if (isBreakEnabled && !currentPresence.pauseEnd) {
      return {
        label: 'Pointer mon retour de Pause 💻',
        desc: 'Terminer la pause déjeuner et reprendre le travail',
        action: 'pause_end',
      };
    }
    if (!currentPresence.departureTime) {
      return {
        label: 'Pointer mon Départ 🏠',
        desc: 'Terminer la journée de travail et enregistrer le départ',
        action: 'departure',
      };
    }
    return {
      label: 'Journée terminée ! ✅',
      desc: 'Tous les pointages réglementaires ont été enregistrés',
      action: 'done',
    };
  };

  const nextStep = getNextClockingStep();

  // Execute manual clocking step
  const handleTriggerClockingStep = () => {
    if (nextStep.action === 'done' || !activeEmployee) return;

    let updatedPresences = [...presences];
    const timeNow = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const lateThreshold = moduleConfig?.lateThresholdTime || '08:30';
    const plannedDeparture = moduleConfig?.plannedDepartureTime || '16:30';

    if (nextStep.action === 'arrival') {
      const isLateNow = timeNow > lateThreshold;
      const newPresence: Presence = {
        id: `pres-${Date.now()}`,
        employeeId: activeEmployee.id,
        date: selectedDate,
        arrivalTime: timeNow,
        pauseStart: null,
        pauseEnd: null,
        departureTime: null,
        status: isLateNow ? 'late' : 'present',
        location: 'Bureau Principal - Douala III',
        latitude: 4.0511 + (Math.random() - 0.5) * 0.01,
        longitude: 9.7679 + (Math.random() - 0.5) * 0.01,
        clockingMethod: 'manual_admin',
      };
      updatedPresences.unshift(newPresence);

      // Création automatique de l'incident Retard
      if (isLateNow) {
        const autoIncident: AttendanceIncident = {
          id: `inc-${Date.now()}`,
          employeeId: activeEmployee.id,
          employeeName: activeEmployee.name,
          date: selectedDate,
          timeString: timeNow,
          type: 'retard',
          origin: 'signale_par_responsable',
          reason: `Retard automatique constaté à ${timeNow} (seuil: ${lateThreshold})`,
          isDeclaredInAdvance: false,
          isJustified: false,
          status: 'automatique',
          createdAt: new Date().toISOString(),
        };
        incidentService.saveIncident(autoIncident);
        if (onAddAttendanceIncident) onAddAttendanceIncident(autoIncident);
        else if (onUpdateAttendanceIncidents) onUpdateAttendanceIncidents([autoIncident, ...attendanceIncidents]);
      }

      if (showToast) showToast(`Arrivée pointée à ${timeNow} pour ${activeEmployee.name}.`, isLateNow ? 'error' : 'success');
    } else {
      const existingIndex = presences.findIndex(
        (p) => p.employeeId === activeEmployee.id && p.date === selectedDate
      );
      if (existingIndex >= 0) {
        const updatedObj = { ...updatedPresences[existingIndex] };
        if (nextStep.action === 'pause_start') updatedObj.pauseStart = timeNow;
        if (nextStep.action === 'pause_end') updatedObj.pauseEnd = timeNow;
        if (nextStep.action === 'departure') {
          updatedObj.departureTime = timeNow;
          if (timeNow < plannedDeparture) {
            updatedObj.departureReason = "Sortie prématurée (avant 16:30)";
            if (!updatedObj.emergencies) updatedObj.emergencies = [];
            updatedObj.emergencies.push({
              id: `emg-${Date.now()}`,
              type: 'sortie_prematuree',
              reason: 'Sortie prématurée automatique (avant 16:30)',
              timestamp: new Date().toISOString(),
              timeString: timeNow,
              status: 'approved'
            });

            // Création automatique de l'incident Sortie prématurée
            const autoIncident: AttendanceIncident = {
              id: `inc-${Date.now()}`,
              employeeId: activeEmployee.id,
              employeeName: activeEmployee.name,
              date: selectedDate,
              timeString: timeNow,
              type: 'sortie_prematuree',
              origin: 'signale_par_responsable',
              reason: `Sortie prématurée constatée à ${timeNow} avant 16h30`,
              isDeclaredInAdvance: false,
              isJustified: false,
              status: 'automatique',
              createdAt: new Date().toISOString(),
            };
            incidentService.saveIncident(autoIncident);
            if (onAddAttendanceIncident) onAddAttendanceIncident(autoIncident);
            else if (onUpdateAttendanceIncidents) onUpdateAttendanceIncidents([autoIncident, ...attendanceIncidents]);
          }
        }
        updatedPresences[existingIndex] = updatedObj;
        if (showToast) showToast(`Pointage ${nextStep.action} enregistré pour ${activeEmployee.name}.`, 'success');
      }
    }

    onUpdatePresences(updatedPresences);
  };

  // Filter list rows based on collaborator select and date/period select (strictly restricted to today)
  const filteredPresences = presences.filter((p) => {
    const matchesEmp = collaboratorFilter === 'all' || p.employeeId === collaboratorFilter;
    const matchesPeriod = p.date === todayStr;
    return matchesEmp && matchesPeriod;
  });

  // Paginated presence rows
  const totalItems = filteredPresences.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPresences = filteredPresences.slice(startIndex, startIndex + itemsPerPage);

  // Manual pointage edit modal open handler
  const handleOpenEditPresence = (presence: Presence) => {
    setEditingPresence(presence);
    setEditForm({
      arrivalTime: presence.arrivalTime || '',
      pauseStart: presence.pauseStart || '',
      pauseEnd: presence.pauseEnd || '',
      departureTime: presence.departureTime || '',
      status: presence.status || 'present',
      location: presence.location || 'Bureau Principal - Douala III',
      correctionReason: presence.correctionReason || '',
    });
    setIsEditModalOpen(true);
  };

  // Save manual pointage modifications
  const handleSaveManualEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPresence) return;

    const isTimeModified = 
      editForm.arrivalTime !== (editingPresence.arrivalTime || '') ||
      editForm.pauseStart !== (editingPresence.pauseStart || '') ||
      editForm.pauseEnd !== (editingPresence.pauseEnd || '') ||
      editForm.departureTime !== (editingPresence.departureTime || '');

    if (isTimeModified && !editForm.correctionReason.trim()) {
      if (showToast) showToast('Un motif est obligatoire pour toute modification d\'heure de pointage.', 'error');
      return;
    }

    const updated = presences.map((p) =>
      p.id === editingPresence.id ? { ...p, ...editForm } : p
    );
    onUpdatePresences(updated);
    if (showToast) showToast('Pointage collaborateur mis à jour avec succès.', 'success');
    setIsEditModalOpen(false);
  };

  // Export Excel placeholder
  const handleExportExcel = () => {
    if (showToast) showToast('Export du registre des présences au format Excel (.xls)...', 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      
      {/* 🚀 BARRE D'ACTIONS RAPIDES DU RESPONSABLE (Badgeage & Pointage) */}
      <div className="bg-white p-3 sm:p-4 rounded-3xl border border-stone-200/90 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
          {/* Bouton dédié : Générer QR Code Dynamique (30 secondes) */}
          <button
            onClick={() => setIsDynamicQrModalOpen(true)}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#2A7B76] to-emerald-700 hover:from-[#20635F] hover:to-emerald-800 text-white font-extrabold text-xs shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-98"
          >
            <QrCode className="h-4 w-4 text-emerald-200 animate-pulse shrink-0" />
            <span>Générer QR Code Dynamique (30s)</span>
          </button>

          {/* Bouton : Badger pour un collaborateur */}
          <button
            onClick={() => setIsAdminClockModalOpen(true)}
            className="w-full py-3 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs border border-stone-200 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-98"
          >
            <UserCheck className="h-4 w-4 text-[#2A7B76] shrink-0" />
            <span>Badger pour un Collaborateur</span>
          </button>

          {/* Bouton : Clé d'Accès Personnelle (16 Caractères - 3 min) */}
          <button
            onClick={() => setIsOfficeQrModalOpen(true)}
            className="w-full py-3 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs border border-stone-200 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-98"
          >
            <KeyRound className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Clé d'Accès Personnelle (16 Car.)</span>
          </button>
        </div>
      </div>

      {/* Subtab Switcher: Pointages du Jour VS Registre des Incidents */}
      <div className="flex items-center gap-2 p-1.5 bg-stone-100/90 rounded-2xl border border-stone-200/80 w-fit">
        <button
          onClick={() => setActivePresenceTab('presences')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activePresenceTab === 'presences'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Clock className="h-4 w-4 text-[#2A7B76]" />
          <span>Feuille des Pointages du Jour</span>
        </button>
        <button
          onClick={() => setActivePresenceTab('incidents')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activePresenceTab === 'incidents'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <span>Registre des Incidents & Retards ({attendanceIncidents.length})</span>
        </button>
      </div>

      {activePresenceTab === 'incidents' ? (
        <PresenceIncidentsAdminView
          attendanceIncidents={attendanceIncidents}
          employees={employees}
          onUpdateAttendanceIncidents={onUpdateAttendanceIncidents}
          showToast={showToast}
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      
      {/* 1. LEFT SIDEBAR: Clocking Action Widget conforming exactly to Image 2 */}
      <div className="space-y-4">
        <div className="bg-white rounded-3xl border border-stone-200/80 p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
            <h3 className="font-serif font-bold text-xs text-[#2A7B76] uppercase tracking-wider flex items-center gap-1">
              <Clock className="h-4.5 w-4.5" />
              Espace Pointage Collaborateur
            </h3>
            <span className="font-mono font-bold text-stone-600 text-xs">{sidebarTime}</span>
          </div>

          {/* Fiche Collaborateur Dropdown Selector */}
          <div className="space-y-1">
            <label className="block text-[10px] text-stone-500 font-bold uppercase">Sélectionner la fiche collaborateur :</label>
            <select
              value={activeSidebarEmpId}
              onChange={(e) => setActiveSidebarEmpId(e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 bg-stone-50 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#2A7B76] outline-none"
            >
              {employees.map((emp) => (
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

          {/* Connected Employee Profiler */}
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

          {/* Pointage Details & Indicators */}
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

            {/* Display static date instead of picker */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-stone-400 font-bold whitespace-nowrap">Date :</span>
              <span className="text-[10px] font-bold text-stone-700 bg-stone-50 px-2 py-1 rounded border border-stone-200 w-full text-center">
                Aujourd'hui ({new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })})
              </span>
            </div>
          </div>

          {/* Pointages grid buttons (2 ou 4 selon activation des pauses) */}
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

          {/* Action Step Button */}
          <div className="space-y-1.5 pt-2 border-t border-stone-100">
            <span className="block text-[9px] text-stone-400 font-bold uppercase tracking-wider">Prochaine étape réglementaire :</span>
            <button
              onClick={handleTriggerClockingStep}
              disabled={nextStep.action === 'done'}
              className="w-full py-2.5 bg-[#2A7B76] hover:bg-[#20635F] text-white font-extrabold text-xs rounded-2xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-45"
            >
              {nextStep.label}
            </button>
            <button
              onClick={() => setIsAdminClockModalOpen(true)}
              className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-stone-200"
            >
              <UserCheck className="h-3.5 w-3.5 text-[#2A7B76]" />
              <span>Badger avec motif pour ce collaborateur</span>
            </button>
            <p className="text-[10px] text-stone-400 italic text-center leading-normal">
              {nextStep.desc}
            </p>
          </div>

          {/* Regulations Warning boxes */}
          <div className="space-y-2 pt-2">
            <div className="bg-amber-50/50 border border-amber-200/60 p-2.5 rounded-2xl text-[10px] text-amber-800 font-medium">
              🍱 La pause déjeuner est disponible de 11:00 à 15:00.
            </div>
            <div className="bg-red-50 border border-red-200 p-2.5 rounded-2xl text-[10px] text-rose-800 font-medium leading-normal">
              🚨 <b>Alerte de Retard :</b> À partir de 09h01, tout enregistrement déclenche une alerte WhatsApp d'activité.
            </div>
          </div>

          {/* Global Statistics conforming exactly to Image 2 */}
          <div className="space-y-2.5 pt-4 border-t border-stone-100">
            <h4 className="text-[10px] text-stone-500 font-extrabold uppercase tracking-wide">Statistiques Globales</h4>
            
            <div className="space-y-2">
              {/* Ponctualite */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-stone-700">
                  <span>Ponctualité :</span>
                  <span>{punctualityRate}%</span>
                </div>
                <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${punctualityRate}%` }} />
                </div>
              </div>

              {/* Assiduite */}
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

            {/* Presence 3-status grid block */}
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

      {/* 2. RIGHT SECTION: Registers List and Pointage Maps conforming to Image 2 */}
      <div className="xl:col-span-2 space-y-6">
        
        {/* Filters bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center gap-2 w-full md:w-auto flex-1">
            <div className="space-y-1 flex-1">
              <label className="block text-[10px] text-stone-400 font-extrabold uppercase">Collaborateur :</label>
              <select
                value={collaboratorFilter}
                onChange={(e) => setCollaboratorFilter(e.target.value)}
                className="w-full px-3 py-1.5 border border-stone-200 bg-stone-50 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#2A7B76] outline-none"
              >
                <option value="all">Tous les collaborateurs</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 flex-1">
              <label className="block text-[10px] text-stone-400 font-extrabold uppercase">Période :</label>
              <span className="block px-3 py-1.5 border border-stone-200 bg-stone-50 text-stone-500 rounded-xl text-xs font-semibold">
                Aujourd'hui uniquement
              </span>
            </div>
          </div>

          <div className="shrink-0 pt-4 md:pt-0 w-full md:w-auto">
            <button
              onClick={handleExportExcel}
              className="w-full md:w-auto px-4 py-2 bg-emerald-50 text-emerald-800 hover:bg-[#2A7B76] hover:text-white border border-emerald-100 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Exporter vers Excel (.xls)
            </button>
          </div>
        </div>

        {/* Registers Table list */}
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden space-y-3">
          <div className="p-4 bg-stone-50/50 border-b border-stone-100 flex items-center justify-between">
            <h4 className="font-serif font-bold text-xs text-stone-900 uppercase tracking-wide">
              Pointages de la Journée
            </h4>
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-lg border border-emerald-200">
              {filteredPresences.length} fiches trouvées
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50/80 text-stone-500 font-bold uppercase tracking-wider text-[9px] border-b border-stone-200">
                <tr>
                  <th className="p-3 pl-4">Employé</th>
                  <th className="p-3 text-center">Statut</th>
                  <th className="p-3">Arrivée</th>
                  <th className="p-3">Pause</th>
                  <th className="p-3">Reprise</th>
                  <th className="p-3">Départ</th>
                  <th className="p-3 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {paginatedPresences.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-stone-400 italic">
                      Aucun pointage ne correspond aux filtres appliqués.
                    </td>
                  </tr>
                ) : (
                  paginatedPresences.map((p) => {
                    const emp = employees.find((e) => e.id === p.employeeId);
                    const softTheme = getEmployeeSoftColor(emp?.name || 'Collaborateur');
                    const isActive = p.employeeId === activeSidebarEmpId;
                    return (
                      <tr 
                        key={p.id} 
                        onClick={() => setActiveSidebarEmpId(p.employeeId)}
                        className={`hover:bg-stone-50/30 transition cursor-pointer border-2 ${isActive ? 'border-red-500 bg-red-50/50' : 'border-transparent'}`}
                      >
                        {/* Employe Info & GPS location badge conforming exactly to Image 2 */}
                        <td className="p-3 pl-4">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              className="rounded border-stone-300 text-[#2A7B76] focus:ring-[#2A7B76]"
                            />
                            <div className={`w-9 h-9 rounded-2xl ${softTheme.bg} flex items-center justify-center font-bold text-xs shrink-0 border overflow-hidden shadow-3xs`}>
                              {emp?.avatarUrl ? (
                                <img src={emp.avatarUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span>{emp?.name.slice(0, 2).toUpperCase()}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="block font-bold text-stone-900 text-[11px] leading-tight">{emp?.name}</span>
                              <span className="block text-[9px] text-stone-400 font-mono leading-none truncate max-w-[140px]">{emp?.email}</span>
                              <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                <span className={`inline-flex items-center gap-0.5 text-[8px] rounded px-1.5 py-0.5 font-bold cursor-pointer border ${softTheme.badge}`}>
                                  📍 {p.location || 'Bureau'}
                                </span>
                                {p.clockingMethod === 'admin_on_behalf' && (
                                  <span 
                                    className="inline-flex items-center gap-1 text-[8px] bg-indigo-50 text-indigo-800 border border-indigo-200 rounded px-1.5 py-0.5 font-bold truncate max-w-[200px]" 
                                    title={`Badgé par ${p.badgedByAdminName || 'Responsable'} — Motif : ${p.adminBadgeReason || 'Non précisé'}`}
                                  >
                                    🛡️ Badgé par {p.badgedByAdminName || 'Resp.'} : "{p.adminBadgeReason || 'Sur place'}"
                                  </span>
                                )}
                                {p.clockingMethod === 'qr_code_dynamic' && (
                                  <span className="inline-flex items-center gap-1 text-[8px] bg-teal-50 text-teal-800 border border-teal-200 rounded px-1.5 py-0.5 font-bold">
                                    ⚡ QR Dynamique (30s)
                                  </span>
                                )}
                                {p.clockingMethod === 'qr_code_door' && (
                                  <span className="inline-flex items-center gap-1 text-[8px] bg-emerald-50 text-emerald-800 border border-emerald-200 rounded px-1.5 py-0.5 font-bold">
                                    🚪 QR Porte • GPS
                                  </span>
                                )}
                                {p.clockingMethod === 'badge_code_16' && (
                                  <span className="inline-flex items-center gap-1 text-[8px] bg-amber-50 text-amber-800 border border-amber-200 rounded px-1.5 py-0.5 font-bold">
                                    🔑 Clé 16 Car. • GPS
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Status badge */}
                        <td className="p-3 text-center">
                          <span className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                            p.status === 'present' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : p.status === 'late' 
                              ? 'bg-amber-50 text-amber-700 border-amber-200' 
                              : 'bg-stone-100 text-stone-400 border-stone-300'
                          }`}>
                            {p.status === 'present' ? 'Présent' : p.status === 'late' ? 'Retard' : 'Non pointé'}
                          </span>
                        </td>

                        {/* Times & Locations */}
                        <td className="p-3">
                          <div className="font-mono font-bold text-emerald-800 text-[11px]">{p.arrivalTime || '—'}</div>
                          <span className="block text-[8px] text-stone-400 leading-none truncate max-w-[110px]">{p.location || 'Douala'}</span>
                        </td>
                        <td className="p-3 font-mono font-medium text-stone-500 text-[11px]">{p.pauseStart || '—'}</td>
                        <td className="p-3 font-mono font-medium text-stone-500 text-[11px]">{p.pauseEnd || '—'}</td>
                        <td className="p-3">
                          <div className="font-mono font-bold text-stone-800 text-[11px]">{p.departureTime || '—'}</div>
                          {p.departureTime && p.departureTime < '16:30' && (
                            <span className="inline-block text-[8px] font-bold bg-amber-50 text-amber-800 border border-amber-100 rounded px-1 mt-0.5 animate-pulse">
                              Urgence Départ Anticipé
                            </span>
                          )}
                        </td>

                        {/* Actions icon fast manual edit conforming exactly to Image 2 */}
                        <td className="p-3 text-right pr-4">
                          <button
                            onClick={() => handleOpenEditPresence(p)}
                            className="p-1.5 text-stone-400 hover:text-[#2A7B76] hover:bg-emerald-50 rounded-xl transition cursor-pointer"
                            title="Modifier pointage"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table pagination conforming to Image 2 */}
          <div className="p-4 bg-stone-50 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-stone-500 text-[10px] font-bold">Afficher</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="px-1.5 py-1 rounded-lg border border-stone-200 bg-white font-bold text-stone-850"
                >
                  <option value={10}>10 par page</option>
                  <option value={25}>25 par page</option>
                  <option value={50}>50 par page</option>
                </select>
              </div>
              <div className="h-4 w-[1px] bg-stone-200"></div>
              <span className="text-stone-500 text-[10px] font-bold">
                Lignes <b>{startIndex + 1} à {Math.min(startIndex + itemsPerPage, totalItems)}</b> sur <b>{totalItems}</b>
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1 border border-stone-200 hover:bg-white text-stone-600 disabled:opacity-40 transition cursor-pointer"
                title="Première page"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 border border-stone-200 hover:bg-white text-stone-600 disabled:opacity-40 transition cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="px-3 py-1 bg-[#2A7B76] text-white rounded font-bold text-[10px] border border-[#2A7B76]">
                Page {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 border border-stone-200 hover:bg-white text-stone-600 disabled:opacity-40 transition cursor-pointer flex items-center gap-1"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1 border border-stone-200 hover:bg-white text-stone-600 disabled:opacity-40 transition cursor-pointer"
                title="Dernière page"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Map box : Carte fixe dans son card avec contrôles intégrés dans l'en-tête */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-sm space-y-4 relative isolate z-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-[#2A7B76] rounded-xl border border-emerald-100">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-xs text-stone-900">
                  Lieux des pointages du jour
                </h4>
                <p className="text-[10px] text-stone-400">
                  Visualisation géographique des collaborateurs
                </p>
              </div>
            </div>

            {/* Contrôles intégrés dans l'en-tête : Nombre de badges et sélecteur de tuiles */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {filteredPresences.filter(x => x.arrivalTime).length} badges
              </span>
              <MapLayerControls currentLayer={mapLayer} onSelectLayer={setMapLayer} />
            </div>
          </div>

          {/* Conteneur de carte fixe dans le card, isolé du contexte global */}
          <div className="w-full h-[360px] rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 relative isolate z-0">
            <PointageMap
              presences={filteredPresences}
              employees={employees}
              selectedDate={selectedDate}
              currentLayer={mapLayer}
              onLayerChange={setMapLayer}
              showInternalControls={false}
              className="w-full h-full border-0 shadow-none min-h-[360px]"
            />
          </div>

          {/* Map coordinate labels below map */}
          <div className="flex flex-wrap gap-2 pt-1">
            {filteredPresences.map((p) => {
              const emp = employees.find((e) => e.id === p.employeeId);
              if (!emp) return null;
              return (
                <span key={p.id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-50 border border-stone-200/60 rounded-2xl text-[10px] font-bold text-stone-700">
                  📍 {emp.name} ({p.arrivalTime ? `Arrivée ${p.arrivalTime}` : 'Départ'})
                </span>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  )}

      {/* Manual Pointage Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-serif font-bold text-base text-stone-900">Éditer le pointage collaborateur</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-xl text-stone-400 hover:bg-stone-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualEdit} className="space-y-4 text-xs font-bold text-stone-600">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-stone-500">Heure d'arrivée</label>
                  <FrenchTimePicker
                    value={editForm.arrivalTime}
                    onChange={(val) => setEditForm({ ...editForm, arrivalTime: val })}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-stone-500">Heure de départ</label>
                  <FrenchTimePicker
                    value={editForm.departureTime}
                    onChange={(val) => setEditForm({ ...editForm, departureTime: val })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-stone-500">Début Pause</label>
                  <FrenchTimePicker
                    value={editForm.pauseStart}
                    onChange={(val) => setEditForm({ ...editForm, pauseStart: val })}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-stone-500">Fin Pause</label>
                  <FrenchTimePicker
                    value={editForm.pauseEnd}
                    onChange={(val) => setEditForm({ ...editForm, pauseEnd: val })}
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-stone-500">Statut de la fiche</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-stone-200 bg-stone-50 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#2A7B76] outline-none"
                >
                  <option value="present">Présent (À l'heure)</option>
                  <option value="late">En retard</option>
                  <option value="absent">Absent</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-stone-500">Lieu de pointage</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 bg-stone-50 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#2A7B76] outline-none"
                />
              </div>

              {editingPresence && (
                editForm.arrivalTime !== (editingPresence.arrivalTime || '') ||
                editForm.pauseStart !== (editingPresence.pauseStart || '') ||
                editForm.pauseEnd !== (editingPresence.pauseEnd || '') ||
                editForm.departureTime !== (editingPresence.departureTime || '')
              ) && (
                <div className="space-y-1 bg-amber-50 p-3 rounded-2xl border border-amber-100 animate-in fade-in">
                  <label className="block text-stone-800 font-extrabold mb-1">
                    Motif de la modification *
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Indiquez la raison du changement d'heure (ex: Retard de transport, oubli de pointage...)"
                    value={editForm.correctionReason}
                    onChange={(e) => setEditForm({ ...editForm, correctionReason: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 bg-white rounded-xl text-xs font-medium focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                  <span className="text-[9px] text-amber-700 italic">
                    La modification d'une heure de présence requiert obligatoirement une justification réglementaire.
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#2A7B76] text-white hover:bg-[#20635F] font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Save className="h-4 w-4" />
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ⚡ MODAL 1 : QR CODE DYNAMIQUE (30s) DU RESPONSABLE SUR PLACE */}
      {isDynamicQrModalOpen && (
        <DynamicQrManagerModal
          isOpen={isDynamicQrModalOpen}
          onClose={() => setIsDynamicQrModalOpen(false)}
          managerName={currentUser?.name || 'Responsable'}
          managerId={currentUser?.id || 'admin'}
          onSessionUsed={(empName) => {
            if (showToast) showToast(`Pointage validé avec succès pour ${empName} !`, 'success');
          }}
        />
      )}

      {/* 👤 MODAL 2 : BADGER POUR UN EMPLOYÉ AVEC MOTIF OBLIGATOIRE */}
      {isAdminClockModalOpen && (
        <AdminOnBehalfClockModal
          isOpen={isAdminClockModalOpen}
          onClose={() => setIsAdminClockModalOpen(false)}
          employees={employees}
          presences={presences}
          currentUser={currentUser}
          defaultEmployeeId={activeSidebarEmpId}
          onUpdatePresences={onUpdatePresences}
          onAddNotification={onAddNotification}
          showToast={showToast}
          moduleConfig={moduleConfig}
          onAddAttendanceIncident={
            onAddAttendanceIncident ||
            (onUpdateAttendanceIncidents
              ? (inc) => onUpdateAttendanceIncidents([inc, ...attendanceIncidents])
              : undefined)
          }
        />
      )}

      {/* 🔑 MODAL 3 : CLÉ D'ACCÈS PERSONNELLE 16 CARACTÈRES (3 MIN) */}
      {isOfficeQrModalOpen && (
        <PersonalAccessKeyModal
          isOpen={isOfficeQrModalOpen}
          onClose={() => setIsOfficeQrModalOpen(false)}
          managerName={currentUser?.name || 'Responsable'}
          companyName={moduleConfig?.companyName || 'Citrine Entreprise'}
          showToast={showToast}
        />
      )}

    </div>
  );
}
