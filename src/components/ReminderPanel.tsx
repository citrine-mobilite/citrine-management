import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellOff,
  Volume2, 
  MapPin, 
  Clock, 
  Plus, 
  Trash2, 
  Calendar, 
  AlertCircle, 
  Play, 
  Sparkles,
  Info
} from 'lucide-react';
import { Reminder, ReminderTrigger, Employee } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import SwipeableListItem from './SwipeableListItem';
import { soundService } from '../services/soundService';

interface ReminderPanelProps {
  reminders: Reminder[];
  onUpdateReminders: (updated: Reminder[]) => void;
  currentTime: string; // HH:MM
  employees?: Employee[];
  currentRole?: string;
  connectedEmployee?: Employee | null;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export const PERIOD_CHOICES = [
  { id: '0m', label: "À l'heure exacte" },
  { id: '5m', label: "5 minutes avant" },
  { id: '10m', label: "10 minutes avant" },
  { id: '15m', label: "15 minutes avant" },
  { id: '30m', label: "30 minutes avant" },
  { id: '1h', label: "1 heure avant" },
];

export default function ReminderPanel({
  reminders,
  onUpdateReminders,
  currentTime,
  employees = [],
  currentRole = 'Administrateur',
  connectedEmployee = null,
  showToast = () => {},
}: ReminderPanelProps) {
  // Get today's local date string (YYYY-MM-DD)
  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayStr = getTodayDateString();

  const visibleReminders = currentRole === 'Employé'
    ? reminders.filter(r => 
        r.employeeId === connectedEmployee?.id || 
        r.employeeIds?.includes(connectedEmployee?.id || '') ||
        (!r.employeeId && (!r.employeeIds || r.employeeIds.length === 0))
      )
    : reminders;

  const activeCount = visibleReminders.filter(r => !r.triggered && !r.stopped).length;

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [reminderToDelete, setReminderToDelete] = useState<Reminder | null>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [duration, setDuration] = useState('');
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>(['15m']);
  const [assignedEmployeeId, setAssignedEmployeeId] = useState<string>('');
  const [assignedEmployeeIds, setAssignedEmployeeIds] = useState<string[]>([]);
  const [assignmentType, setAssignmentType] = useState<'all' | 'single' | 'multiple'>('all');
  
  // Audio state
  const [activeAlert, setActiveAlert] = useState<Reminder | null>(null);

  // Play Programmatic Synthesized Chime (Web Audio API)
  const playSynthesizedChime = (volume = 0.5) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      
      const playBell = (freq: number, startTime: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 1.5);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + 1.5);
      };

      const now = ctx.currentTime;
      // Beautiful modern notification chime sequence
      playBell(523.25, now);       // C5
      playBell(659.25, now + 0.1); // E5
      playBell(783.99, now + 0.2); // G5
      playBell(1046.50, now + 0.3); // C6
      
    } catch (e) {
      console.warn('Web Audio API not allowed or supported by environment', e);
    }
  };

  // Repeating alarm sound for the active test/alert banner
  useEffect(() => {
    if (activeAlert) {
      soundService.startAlarmLoop(2200, 0.9);
    } else {
      soundService.stopAlarmLoop();
    }
    return () => {
      soundService.stopAlarmLoop();
    };
  }, [activeAlert]);

  // Add or Edit Reminder
  const handleSaveReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;

    if (editingReminderId) {
      const updated = reminders.map(r => {
        if (r.id === editingReminderId) {
          return {
            ...r,
            note,
            date: date || undefined,
            time: time || undefined,
            location: location || undefined,
            duration: duration || undefined,
            triggerBefore: (selectedPeriods[0] || 'none') as ReminderTrigger,
            triggerPeriods: selectedPeriods,
            employeeId: currentRole === 'Employé' 
              ? (connectedEmployee?.id || undefined) 
              : (assignmentType === 'single' ? assignedEmployeeId : undefined),
            employeeIds: currentRole === 'Employé' 
              ? undefined 
              : (assignmentType === 'multiple' ? assignedEmployeeIds : undefined),
            stopped: r.stopped,
          };
        }
        return r;
      });
      onUpdateReminders(updated);
      showToast('Alerte modifiée avec succès.', 'success');
    } else {
      const newReminder: Reminder = {
        id: `rem-${Date.now()}`,
        note: note,
        date: date || undefined,
        time: time || undefined,
        location: location || undefined,
        duration: duration || undefined,
        triggerBefore: (selectedPeriods[0] || 'none') as ReminderTrigger,
        triggerPeriods: selectedPeriods,
        triggeredPeriods: [],
        triggered: false,
        stopped: false,
        employeeId: currentRole === 'Employé' 
          ? (connectedEmployee?.id || undefined) 
          : (assignmentType === 'single' ? assignedEmployeeId : undefined),
        employeeIds: currentRole === 'Employé' 
          ? undefined 
          : (assignmentType === 'multiple' ? assignedEmployeeIds : undefined),
        createdAt: new Date().toISOString()
      };
      onUpdateReminders([...reminders, newReminder]);
      showToast('Alerte créée avec succès.', 'success');
    }

    setShowAddModal(false);
    resetForm();
  };

  // Open Edit Modal
  const handleEditReminder = (rem: Reminder) => {
    setEditingReminderId(rem.id);
    setNote(rem.note || '');
    setDate(rem.date || '');
    setTime(rem.time || '');
    setLocation(rem.location || '');
    setDuration(rem.duration || '');
    setSelectedPeriods(rem.triggerPeriods || [rem.triggerBefore || '15m']);
    
    if (rem.employeeIds && rem.employeeIds.length > 0) {
      setAssignmentType('multiple');
      setAssignedEmployeeIds(rem.employeeIds);
      setAssignedEmployeeId('');
    } else if (rem.employeeId) {
      setAssignmentType('single');
      setAssignedEmployeeId(rem.employeeId);
      setAssignedEmployeeIds([]);
    } else {
      setAssignmentType('all');
      setAssignedEmployeeId('');
      setAssignedEmployeeIds([]);
    }
    setShowAddModal(true);
  };

  // Delete Reminder prompt
  const handleDeleteReminder = (reminder: Reminder) => {
    setReminderToDelete(reminder);
  };

  const confirmDeleteReminder = () => {
    if (!reminderToDelete) return;
    onUpdateReminders(reminders.filter(r => r.id !== reminderToDelete.id));
    showToast('Alerte supprimée avec succès.', 'success');
    setReminderToDelete(null);
  };

  // Stop / Deactivate Reminder
  const handleStopReminder = (rem: Reminder) => {
    const updated = reminders.map(r => {
      if (r.id === rem.id) {
        return { ...r, stopped: true, triggered: true };
      }
      return r;
    });
    onUpdateReminders(updated);
    showToast("Alerte arrêtée.", 'success');
  };

  // Reactivate Reminder
  const handleReactivateReminder = (rem: Reminder) => {
    const updated = reminders.map(r => {
      if (r.id === rem.id) {
        return { ...r, stopped: false, triggered: false, triggeredPeriods: [] };
      }
      return r;
    });
    onUpdateReminders(updated);
    showToast("Alerte réactivée.", 'success');
  };

  // Reset form fields
  const resetForm = () => {
    setEditingReminderId(null);
    setNote('');
    setDate('');
    setTime('');
    setLocation('');
    setDuration('');
    setSelectedPeriods(['15m']);
    setAssignedEmployeeId(currentRole === 'Employé' ? (connectedEmployee?.id || '') : '');
    setAssignedEmployeeIds([]);
    setAssignmentType(currentRole === 'Employé' ? 'single' : 'all');
  };

  // Helper to subtract minutes from time (HH:MM)
  const getTriggerTime = (time?: string, trigger?: string): string => {
    if (!time || !time.includes(':')) return '00:00';
    if (!trigger || trigger === 'none' || trigger === '0m' || trigger === 'exact') return time;
    const [h, m] = time.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return '00:00';
    let totalMinutes = h * 60 + m;
    
    if (trigger === '5m') totalMinutes -= 5;
    else if (trigger === '10m') totalMinutes -= 10;
    else if (trigger === '15m') totalMinutes -= 15;
    else if (trigger === '30m') totalMinutes -= 30;
    else if (trigger === '1h') totalMinutes -= 60;
    
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    const newH = Math.floor(totalMinutes / 60) % 24;
    const newM = totalMinutes % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  };

  const handleTogglePeriodTrigger = (reminder: Reminder, period: string) => {
    const currentTriggered = reminder.triggeredPeriods || [];
    const isTriggered = currentTriggered.includes(period);
    const updatedTriggeredPeriods = isTriggered
      ? currentTriggered.filter(p => p !== period)
      : [...currentTriggered, period];

    const periods = reminder.triggerPeriods && reminder.triggerPeriods.length > 0
      ? reminder.triggerPeriods
      : [reminder.triggerBefore || 'none'];

    const allTriggered = periods.every(p => updatedTriggeredPeriods.includes(p));

    const updated = reminders.map(r => {
      if (r.id === reminder.id) {
        return {
          ...r,
          triggeredPeriods: updatedTriggeredPeriods,
          triggered: allTriggered
        };
      }
      return r;
    });
    onUpdateReminders(updated);
  };

  const handleBlockArrivedAlarms = (reminder: Reminder) => {
    const periods = reminder.triggerPeriods && reminder.triggerPeriods.length > 0
      ? reminder.triggerPeriods
      : [reminder.triggerBefore || 'none'];

    const isPastDate = reminder.date && reminder.date < todayStr;
    const isTodayDate = reminder.date && reminder.date === todayStr;

    const arrivedPeriods = periods.filter(period => {
      const triggerTime = getTriggerTime(reminder.time!, period);
      return isPastDate || (isTodayDate && triggerTime <= currentTime);
    });

    const currentTriggered = reminder.triggeredPeriods || [];
    const updatedTriggeredPeriods = Array.from(new Set([...currentTriggered, ...arrivedPeriods]));
    const allTriggered = periods.every(p => updatedTriggeredPeriods.includes(p));

    const updated = reminders.map(r => {
      if (r.id === reminder.id) {
        return {
          ...r,
          triggeredPeriods: updatedTriggeredPeriods,
          triggered: allTriggered
        };
      }
      return r;
    });
    onUpdateReminders(updated);
  };

  // Manual Trigger Simulation
  const triggerReminderNow = (reminder: Reminder) => {
    soundService.unlockAudio();
    soundService.startAlarmLoop(2000, 1.0);
    setActiveAlert(reminder);
    
    const periods = reminder.triggerPeriods && reminder.triggerPeriods.length > 0
      ? reminder.triggerPeriods
      : [reminder.triggerBefore || 'none'];

    const arrivedPeriods = periods.filter(period => {
      const triggerTime = getTriggerTime(reminder.time!, period);
      return triggerTime <= currentTime;
    });

    // If no periods have arrived, trigger the first period of the list
    const periodsToBlock = arrivedPeriods.length > 0 
      ? arrivedPeriods 
      : [periods[0]];

    const currentTriggered = reminder.triggeredPeriods || [];
    const updatedTriggeredPeriods = Array.from(new Set([...currentTriggered, ...periodsToBlock]));
    const allTriggered = periods.every(p => updatedTriggeredPeriods.includes(p));

    const updated = reminders.map(r => {
      if (r.id === reminder.id) {
        return { 
          ...r, 
          triggeredPeriods: updatedTriggeredPeriods,
          triggered: allTriggered
        };
      }
      return r;
    });
    onUpdateReminders(updated);
  };

  return (
    <div className="space-y-6" id="reminders-module">
      
      {/* Active Alarm Modal/Banner */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
          >
            <div className="flex items-start gap-3">
              <div className="bg-emerald-100 text-emerald-700 p-2.5 rounded-full shrink-0">
                <Bell className="h-5 w-5 animate-bounce" />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest font-mono">Pré-alarme Déclenchée</span>
                <h4 className="text-xs font-bold text-stone-900 leading-snug">{activeAlert.note}</h4>
                <p className="text-[10px] text-stone-500">
                  Événement planifié à {activeAlert.time} {activeAlert.location && `au ${activeAlert.location}`}
                </p>
                <p className="text-[9px] text-stone-500 italic mt-1 leading-normal">
                  💡 <strong>Note de blocage :</strong> Fermer cette alerte ne bloque que le rappel actuel. Les rappels ultérieurs de cet événement restent programmés et actifs.
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => {
                  soundService.stopAlarmLoop();
                  setActiveAlert(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition cursor-pointer shadow-xs"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <h2 className="text-xl font-serif font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <Bell className="h-5 w-5 text-emerald-600" />
            {currentRole === 'Employé' ? 'Mes Alertes & Rappels' : 'Alertes & Rappels Programmés'}
          </h2>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => {
              soundService.unlockAudio();
              soundService.startAlarmLoop(2000, 1.0);
              setActiveAlert({
                id: 'test-alarm',
                note: 'Test de sonnerie d\'alarme - Rappel d\'événement HERO Cab',
                time: currentTime || '12:00',
                location: 'Direction Générale',
                triggerBefore: 'none',
                triggeredPeriods: [],
                triggered: true,
                stopped: false
              });
            }}
            className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs text-xs"
            title="Tester la sonnerie d'alarme sonore sur cet appareil"
          >
            <Volume2 className="h-4 w-4 text-amber-600" />
            Tester l'alarme sonore
          </button>

          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            id="btn-add-reminder"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs text-xs"
          >
            <Plus className="h-4 w-4" />
            Ajouter un rappel
          </button>
        </div>
      </div>

      {/* Main Grid: Reminders List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="reminders-list-grid">
        {visibleReminders.map((rem) => {
          const hasDateTime = rem.date && rem.time;
          return (
            <SwipeableListItem
              key={rem.id}
              onSwipeRight={() => handleStopReminder(rem)}
              onSwipeLeft={() => handleDeleteReminder(rem)}
              rightLabel="Arrêter"
              leftLabel="Supprimer"
            >
              <div
                onClick={() => {
                  if (currentRole !== 'Employé' || rem.employeeId === connectedEmployee?.id) {
                    handleEditReminder(rem);
                  }
                }}
                className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between space-y-4 transition group ${
                  (currentRole !== 'Employé' || rem.employeeId === connectedEmployee?.id) ? 'cursor-pointer' : ''
                } ${
                  rem.triggered 
                    ? 'border-stone-150 bg-stone-50/40 hover:bg-white hover:border-green-300' 
                    : 'border-green-100 hover:border-green-300 hover:shadow-md'
                }`}
                title={(currentRole !== 'Employé' || rem.employeeId === connectedEmployee?.id) ? "Cliquer pour modifier cette alerte" : undefined}
              >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1 items-center">
                    {!hasDateTime ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-stone-100 text-stone-500">
                        📁 Mémo simple (sans alarme)
                      </span>
                    ) : (
                      <>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          rem.triggered 
                            ? 'bg-stone-200 text-stone-500' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {rem.stopped ? 'Arrêtée' : rem.triggered ? 'Toutes sonnées' : 'Programmée'}
                        </span>

                        {/* Display multiple selected alarm periods */}
                        {(!rem.stopped && (rem.triggerPeriods && rem.triggerPeriods.length > 0 ? rem.triggerPeriods : [rem.triggerBefore || 'none'])).map?.((period) => {
                          const hasFired = rem.triggeredPeriods?.includes(period);
                          const isFutureDate = rem.date && rem.date > todayStr;
                          const isPastDate = rem.date && rem.date < todayStr;
                          const isTodayDate = rem.date && rem.date === todayStr;
                          const isArrived = isPastDate || (isTodayDate && getTriggerTime(rem.time!, period) <= currentTime);
                          let label = "Échéance";
                          if (period === '5m') label = "-5m";
                          else if (period === '10m') label = "-10m";
                          else if (period === '15m') label = "-15m";
                          else if (period === '30m') label = "-30m";
                          else if (period === '1h') label = "-1h";

                          let badgeClass = "bg-green-50 text-green-700 border-green-200 animate-pulse hover:bg-green-100";
                          let badgeTitle = "Alarme active (Cliquer pour bloquer)";

                          if (hasFired) {
                            badgeClass = "bg-stone-100 text-stone-400 border-stone-200 line-through decoration-green-400 decoration-1 hover:bg-stone-200";
                            badgeTitle = "Alarme bloquée/passée (Cliquer pour réactiver)";
                          } else if (isArrived) {
                            badgeClass = "bg-amber-100 text-amber-800 border-amber-300 animate-bounce hover:bg-amber-200";
                            badgeTitle = "Alarme échue en cours (Cliquer pour bloquer)";
                          } else if (isFutureDate) {
                            badgeClass = "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100";
                            badgeTitle = `Alarme programmée pour le ${rem.date}`;
                          }

                          return (
                            <button
                              key={period}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePeriodTrigger(rem, period);
                              }}
                              className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono border cursor-pointer transition-all ${badgeClass}`}
                              title={badgeTitle}
                            >
                              🔔 {label}
                            </button>
                          );
                        })}
                      </>
                    )}
                  </div>
                  
                  {hasDateTime && !rem.triggered && !rem.stopped && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Check if there are arrived alarms to block */}
                      {(() => {
                        const periods = rem.triggerPeriods && rem.triggerPeriods.length > 0
                          ? rem.triggerPeriods
                          : [rem.triggerBefore || 'none'];
                        const isPastDate = rem.date && rem.date < todayStr;
                        const isTodayDate = rem.date && rem.date === todayStr;
                        const arrivedPeriods = periods.filter(p => {
                          const triggerTime = getTriggerTime(rem.time!, p);
                          return isPastDate || (isTodayDate && triggerTime <= currentTime);
                        });
                        const unblockedArrived = arrivedPeriods.filter(p => !rem.triggeredPeriods?.includes(p));
                        if (unblockedArrived.length > 0) {
                          return (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBlockArrivedAlarms(rem);
                              }}
                              className="text-[9px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1 cursor-pointer transition shadow-2xs"
                              title="Bloquer uniquement les alarmes de cette heure"
                            >
                              <BellOff className="h-2.5 w-2.5" /> Bloquer
                            </button>
                          );
                        }
                        return null;
                      })()}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerReminderNow(rem);
                        }}
                        className="text-[9px] font-bold text-green-600 bg-green-50/50 hover:bg-green-100/80 px-2 py-0.5 rounded border border-green-200 flex items-center gap-1 cursor-pointer transition"
                        title="Forcer le carillon maintenant pour tester"
                      >
                        <Play className="h-2.5 w-2.5" /> Simuler
                      </button>
                    </div>
                  )}
                </div>

                {/* Assigned Collaborators list */}
                {(() => {
                  if (rem.employeeIds && rem.employeeIds.length > 0) {
                    const assignedEmps = employees.filter(e => rem.employeeIds?.includes(e.id));
                    if (assignedEmps.length > 0) {
                      return (
                        <div className="flex flex-wrap items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg px-2 py-1 w-fit max-w-full">
                          <span className="text-[9px] font-bold text-emerald-900 mr-1 uppercase">Destinataires :</span>
                          <div className="flex -space-x-1.5 overflow-hidden mr-1">
                            {assignedEmps.slice(0, 3).map((emp) => (
                              <img
                                key={emp.id}
                                src={emp.avatarUrl || undefined}
                                alt={emp.name}
                                className="inline-block h-4 w-4 rounded-full ring-2 ring-emerald-50 object-cover"
                                title={emp.name}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] font-semibold">
                            {assignedEmps.length === 1 
                              ? assignedEmps[0].name 
                              : `${assignedEmps.length} collaborateurs`}
                          </span>
                        </div>
                      );
                    }
                  } else {
                    const assignedEmp = employees.find(e => e.id === rem.employeeId);
                    if (assignedEmp) {
                      return (
                        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg px-2 py-1 w-fit">
                          <img src={assignedEmp.avatarUrl || undefined} alt={assignedEmp.name} className="w-4 h-4 rounded-full object-cover" />
                          <span className="text-[10px] font-semibold">{assignedEmp.name}</span>
                        </div>
                      );
                    } else {
                      // It's a general reminder "Tout le monde"
                      return (
                        <div className="flex items-center gap-1.5 bg-blue-50 text-blue-800 border border-blue-100 rounded-lg px-2 py-1 w-fit">
                          <span className="text-[9.5px] font-bold">📢 Tout le monde</span>
                        </div>
                      );
                    }
                  }
                  return null;
                })()}

                {/* Note */}
                <h3 className="text-xs font-semibold text-stone-800 leading-relaxed font-sans">
                  {rem.note}
                </h3>

                {/* Event Metadata (Location, Duration) */}
                {(rem.location || rem.duration) && (
                  <div className="space-y-1 pt-1.5">
                    {rem.location && (
                      <div className="flex items-center gap-1.5 text-[10px] text-stone-500">
                        <MapPin className="h-3.5 w-3.5 text-green-400 shrink-0" />
                        <span>Lieu : {rem.location}</span>
                      </div>
                    )}
                    {rem.duration && (
                      <div className="flex items-center gap-1.5 text-[10px] text-stone-500">
                        <Clock className="h-3.5 w-3.5 text-green-400 shrink-0" />
                        <span>Durée : {rem.duration}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Manual Stop / Reactivate button */}
                <div className="flex items-center gap-2 pt-1.5">
                  {rem.stopped ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReactivateReminder(rem);
                      }}
                      className="px-2.5 py-1 text-[10px] font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl border border-stone-200 cursor-pointer flex items-center gap-1 transition-all"
                      title="Réactiver cette alerte"
                    >
                      ⏹️ Arrêtée (Réactiver)
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStopReminder(rem);
                      }}
                      className="px-2.5 py-1 text-[10px] font-bold text-green-700 bg-green-50/50 hover:bg-green-100 rounded-xl border border-green-200 cursor-pointer flex items-center gap-1 transition-all"
                      title="Marquer comme arrêtée"
                    >
                      🛑 Marquer comme arrêtée
                    </button>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="border-t border-green-100/60 pt-3 flex items-center justify-between text-[10px] text-stone-400 font-mono">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-green-300" />
                  {rem.date && rem.time ? `${rem.date} à ${rem.time}` : rem.date ? `${rem.date} (Sans heure)` : rem.time ? `Chaque jour à ${rem.time}` : 'Sans date ni heure'}
                </span>

                {(currentRole !== 'Employé' || rem.employeeId === connectedEmployee?.id) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteReminder(rem);
                    }}
                    className="p-1 text-stone-400 hover:text-green-800 hover:bg-green-50 rounded transition cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </SwipeableListItem>
        );
      })}

        {visibleReminders.length === 0 && (
          <div className="col-span-full py-16 text-center text-stone-400 text-xs italic bg-white rounded-2xl border border-stone-200/80">
            Aucun rappel programmé pour l'instant.
          </div>
        )}
      </div>

      {/* Add / Edit Reminder Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-stone-200/80 max-w-md w-full p-6 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between border-b border-stone-200/60 pb-3">
                <h4 className="font-serif font-semibold text-stone-900 text-sm">
                  {editingReminderId ? 'Modifier l\'alerte programmée' : 'Programmer une alerte ou rappel'}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-stone-400 hover:text-stone-600 text-xs cursor-pointer font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveReminder} className="space-y-4">
                {/* Note */}
                <div className="space-y-1">
                  <label className="text-stone-600 font-semibold">Note de rappel / Alarme :</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Réunion de coordination avec les assistants"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full border border-green-100 rounded-xl p-2.5 bg-green-50/20 focus:bg-white focus:outline-green-500"
                  />
                </div>

                {/* Assigné à (Collaborateur) */}
                {currentRole === 'Employé' ? (
                  <div className="space-y-1 bg-stone-50 p-2.5 rounded-xl border border-stone-150">
                    <label className="text-stone-500 font-semibold block">Destinataire :</label>
                    <div className="flex items-center gap-2 mt-1">
                      <img src={connectedEmployee?.avatarUrl || undefined} alt={connectedEmployee?.name} className="w-5 h-5 rounded-full object-cover" />
                      <span className="font-bold text-stone-800">{connectedEmployee?.name} (Moi-même)</span>
                    </div>
                    <p className="text-[10px] text-stone-400 mt-1">En tant que collaborateur, vous créez un rappel privé pour vous-même.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-stone-600 font-semibold block">Destinataire(s) du rappel :</label>
                    <div className="grid grid-cols-3 gap-2 pb-1">
                      <button
                        type="button"
                        onClick={() => {
                          setAssignmentType('all');
                          setAssignedEmployeeId('');
                          setAssignedEmployeeIds([]);
                        }}
                        className={`py-2 rounded-xl border text-[10px] font-bold text-center transition cursor-pointer ${
                          assignmentType === 'all'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        📢 Tout le monde
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAssignmentType('single');
                          setAssignedEmployeeId(employees[0]?.id || '');
                          setAssignedEmployeeIds([]);
                        }}
                        className={`py-2 rounded-xl border text-[10px] font-bold text-center transition cursor-pointer ${
                          assignmentType === 'single'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        👤 Un seul
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAssignmentType('multiple');
                          setAssignedEmployeeId('');
                          setAssignedEmployeeIds([]);
                        }}
                        className={`py-2 rounded-xl border text-[10px] font-bold text-center transition cursor-pointer ${
                          assignmentType === 'multiple'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        👥 Plusieurs
                      </button>
                    </div>

                    {assignmentType === 'single' && (
                      <select
                        value={assignedEmployeeId}
                        onChange={(e) => setAssignedEmployeeId(e.target.value)}
                        className="w-full border border-green-100 rounded-xl p-2.5 bg-green-50/20 focus:bg-white focus:outline-green-500 cursor-pointer"
                      >
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.roleType})
                          </option>
                        ))}
                      </select>
                    )}

                    {assignmentType === 'multiple' && (
                      <div className="border border-green-100 rounded-xl p-2.5 bg-green-50/10 space-y-2 max-h-40 overflow-y-auto">
                        <div className="flex justify-between items-center pb-1 border-b border-green-100/50">
                          <span className="text-[10px] text-stone-500 font-bold">Sélectionner les collaborateurs :</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (assignedEmployeeIds.length === employees.length) {
                                setAssignedEmployeeIds([]);
                              } else {
                                setAssignedEmployeeIds(employees.map(e => e.id));
                              }
                            }}
                            className="text-[9px] text-green-700 hover:underline font-bold"
                          >
                            {assignedEmployeeIds.length === employees.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-1.5 pt-1">
                          {employees.map((emp) => {
                            const isChecked = assignedEmployeeIds.includes(emp.id);
                            return (
                              <label key={emp.id} className="flex items-center gap-2 cursor-pointer select-none py-1 hover:bg-green-50/50 px-1 rounded">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setAssignedEmployeeIds(assignedEmployeeIds.filter(id => id !== emp.id));
                                    } else {
                                      setAssignedEmployeeIds([...assignedEmployeeIds, emp.id]);
                                    }
                                  }}
                                  className="rounded text-green-600 focus:ring-green-500 border-stone-300"
                                />
                                <div className="flex items-center gap-1.5">
                                  <img src={emp.avatarUrl || undefined} alt={emp.name} className="w-4 h-4 rounded-full object-cover" />
                                  <span className="text-stone-700 font-medium">{emp.name} ({emp.roleType})</span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-stone-600 font-semibold">Date de l'événement :</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full border border-green-100 rounded-xl p-2 bg-green-50/20 focus:bg-white focus:outline-green-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-stone-600 font-semibold">Heure exacte :</label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full border border-green-100 rounded-xl p-2 bg-green-50/20 focus:bg-white focus:outline-green-500 font-mono"
                    />
                  </div>
                </div>

                {/* Location & Duration */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-stone-600 font-semibold">Lieu (facultatif) :</label>
                    <input
                      type="text"
                      placeholder="Ex: Bureau de Direction / Salle RH"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full border border-green-100 rounded-xl p-2.5 bg-green-50/20 focus:bg-white focus:outline-green-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-stone-600 font-semibold">Durée (facultatif) :</label>
                    <input
                      type="text"
                      placeholder="Ex: 45 minutes"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full border border-green-100 rounded-xl p-2.5 bg-green-50/20 focus:bg-white focus:outline-green-500"
                    />
                  </div>
                </div>

                {/* Pre-alarm triggers */}
                <div className="space-y-2">
                  <label className="text-stone-600 font-semibold block">Déclencheurs du carillon (Pré-alarmes multiples autorisées) :</label>
                  <p className="text-[10px] text-stone-400 -mt-1 leading-tight">Le carillon d'alarme sonnera en boucle à chacun de ces moments pour cet événement.</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {PERIOD_CHOICES.map((choice) => {
                      const isSelected = selectedPeriods.includes(choice.id);
                      return (
                        <button
                          key={choice.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedPeriods(selectedPeriods.filter(p => p !== choice.id));
                            } else {
                              setSelectedPeriods([...selectedPeriods, choice.id]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-green-600 text-white border-green-600 shadow-sm' 
                              : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {isSelected ? '✓ ' : ''}{choice.label}
                        </button>
                      );
                    })}
                  </div>
                  {selectedPeriods.length === 0 && (
                    <p className="text-[10px] text-amber-600 font-medium">⚠️ Aucun déclencheur sélectionné : l'événement agira comme un simple mémo sans sonnerie.</p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-stone-200 rounded-xl text-stone-700 font-bold hover:bg-stone-50 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    Enregistrer l'alarme
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {reminderToDelete && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-green-100 max-w-sm w-full p-6 space-y-4 text-xs text-center"
            >
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <Trash2 className="h-6 w-6" />
              </div>
              <h4 className="font-serif font-bold text-green-950 text-base">
                Confirmer la suppression
              </h4>
              <p className="text-stone-500 text-xs">
                Êtes-vous sûr de vouloir supprimer l'alerte <strong className="text-stone-800">"{reminderToDelete.note}"</strong> ? Cette action est irréversible.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReminderToDelete(null)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-700 font-bold hover:bg-stone-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteReminder}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
