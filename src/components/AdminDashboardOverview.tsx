import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Bell, 
  ArrowRight, 
  ChevronRight, 
  UserCheck, 
  ListTodo,
  Settings,
  CalendarDays
} from 'lucide-react';
import { 
  Employee, 
  Presence, 
  Task, 
  Reminder, 
  AppUser
} from '../types';
import { TabType } from './Sidebar';
import { haptic } from '../services/hapticService';

interface AdminDashboardOverviewProps {
  currentUser: AppUser | null;
  employees: Employee[];
  presences: Presence[];
  tasks: Task[];
  reminders: Reminder[];
  currentTime: string;
  onSelectTab: (tab: TabType) => void;
  onSelectEmployee: (id: string) => void;
}

export default function AdminDashboardOverview({
  currentUser,
  employees = [],
  presences = [],
  tasks = [],
  reminders = [],
  currentTime,
  onSelectTab,
  onSelectEmployee
}: AdminDashboardOverviewProps) {
  // Live Real-Time Clock state
  const [realTime, setRealTime] = useState(() => {
    return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  const currentDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setRealTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute today's date string YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const activeEmployees = useMemo(() => {
    return employees.filter(e => !e.status || e.status === 'en_poste');
  }, [employees]);

  // Filter today's presence records
  const todayPresences = useMemo(() => {
    return presences.filter(p => p.date === todayStr);
  }, [presences, todayStr]);

  // Compute stats memoized
  const stats = useMemo(() => {
    const presentCount = todayPresences.filter(p => p.status === 'present').length;
    const lateCount = todayPresences.filter(p => p.status === 'late').length;
    const absentCount = todayPresences.filter(p => p.status === 'absent').length;
    const totalTracked = activeEmployees.length > 0 ? activeEmployees.length : 8;
    const clockedCount = presentCount + lateCount;
    const presenceRate = totalTracked > 0 ? Math.round((clockedCount / totalTracked) * 100) : 0;
    const todayEmergencies = todayPresences.flatMap(p => p.emergencies || []);
    const pendingTasks = tasks.filter(t => t.status !== 'completed');
    const highPriorityTasks = pendingTasks.filter(t => t.priority === 'high');
    const activeReminders = reminders.filter(r => !r.triggered && !r.stopped);

    return {
      presentCount,
      lateCount,
      absentCount,
      totalTracked,
      clockedCount,
      presenceRate,
      todayEmergencies,
      pendingTasks,
      highPriorityTasks,
      activeReminders
    };
  }, [todayPresences, activeEmployees.length, tasks, reminders]);

  const {
    presentCount,
    lateCount,
    absentCount,
    totalTracked,
    clockedCount,
    presenceRate,
    todayEmergencies,
    pendingTasks,
    highPriorityTasks,
    activeReminders
  } = stats;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner - Clean, Light & Airy (No dark green blocks) */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 mb-2 capitalize">
            <CalendarDays className="h-3.5 w-3.5 text-emerald-600" />
            <span>{currentDateFormatted}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
            Tableau de Bord & Pilotage RH
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-2 flex items-center gap-3">
            <Clock className="h-4 w-4 text-emerald-600" />
            <div>
              <div className="text-[9px] uppercase font-bold text-stone-400">Horloge Système</div>
              <div className="text-sm font-mono font-bold text-stone-800 leading-none mt-0.5">{realTime}</div>
            </div>
          </div>

          <button
            onClick={() => {
              haptic.light();
              onSelectTab('presences');
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <UserCheck className="h-4 w-4" />
            <span>Suivi des Pointages</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Présences */}
        <div 
          onClick={() => onSelectTab('presences')}
          className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-emerald-300 transition cursor-pointer space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-stone-500 tracking-wider">Présences du Jour</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-stone-900">{clockedCount} / {totalTracked}</span>
              <span className="text-xs font-bold text-emerald-600">({presenceRate}%)</span>
            </div>
            <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden mt-2.5">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(presenceRate, 100)}%` }} 
              />
            </div>
          </div>
        </div>

        {/* KPI 2: Retards */}
        <div 
          onClick={() => onSelectTab('statistics')}
          className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-amber-300 transition cursor-pointer space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-stone-500 tracking-wider">Anomalies & Retards</span>
            <div className={`p-2 rounded-xl border ${lateCount > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-stone-50 text-stone-600 border-stone-200'}`}>
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-stone-900">
              {lateCount}
            </div>
          </div>
          <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
            <span>Analyse d'assiduité</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>

        {/* KPI 3: Tâches */}
        <div 
          onClick={() => onSelectTab('tasks')}
          className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-blue-300 transition cursor-pointer space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-stone-500 tracking-wider">Tâches en Cours</span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
              <ListTodo className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-stone-900">{pendingTasks.length}</span>
              {highPriorityTasks.length > 0 && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  {highPriorityTasks.length} urgentes
                </span>
              )}
            </div>
          </div>
          <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
            <span>Tableau des tâches</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>

        {/* KPI 4: Alertes */}
        <div 
          onClick={() => onSelectTab('reminders')}
          className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-emerald-300 transition cursor-pointer space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-stone-500 tracking-wider">Alertes Actives</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
              <Bell className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-stone-900">{activeReminders.length}</div>
          </div>
          <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
            <span>Consulter les alertes</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Grid: Presences Table + Urgent Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Live Today's Attendance Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-600" />
                <span>Pointages du Jour</span>
              </h2>
            </div>
            <button
              onClick={() => onSelectTab('presences')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              Registre complet →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-400 font-bold uppercase text-[10px]">
                  <th className="pb-3 font-semibold">Collaborateur</th>
                  <th className="pb-3 font-semibold">Poste</th>
                  <th className="pb-3 font-semibold">Arrivée</th>
                  <th className="pb-3 font-semibold">Statut</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {activeEmployees.map((emp) => {
                  const pres = todayPresences.find(p => p.employeeId === emp.id);
                  const status = pres?.status || 'not_tracked';
                  const arrival = pres?.arrivalTime || '—';

                  return (
                    <tr key={emp.id} className="hover:bg-stone-50 transition">
                      <td className="py-3 pr-2">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={emp.avatarUrl || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100`} 
                            alt={emp.name}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full object-cover border border-stone-200 shrink-0" 
                          />
                          <div>
                            <div className="font-bold text-stone-900 text-xs">{emp.name}</div>
                            <div className="text-[10px] text-stone-400">{emp.phone || emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-stone-600 capitalize text-[11px] font-medium pr-2">
                        {emp.roleType}
                      </td>
                      <td className="py-3 font-mono font-bold text-stone-800 text-[11px] pr-2">
                        {arrival}
                      </td>
                      <td className="py-3 pr-2">
                        {status === 'present' && (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3 w-3" /> Présent
                          </span>
                        )}
                        {status === 'late' && (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <AlertTriangle className="h-3 w-3 text-amber-600" /> En retard
                          </span>
                        )}
                        {status === 'absent' && (
                          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Absent
                          </span>
                        )}
                        {status === 'not_tracked' && (
                          <span className="inline-flex items-center gap-1 bg-stone-100 text-stone-600 text-[10px] font-medium px-2 py-0.5 rounded-full">
                            Non pointé
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => {
                            onSelectEmployee(emp.id);
                            onSelectTab('collaborators');
                          }}
                          className="text-[11px] font-semibold text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 px-2.5 py-1 rounded-lg transition cursor-pointer"
                        >
                          Fiche
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Column: Urgent Tasks & Alerts Consolidation */}
        <div className="space-y-6">
          {/* Urgent Reminders Card */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Bell className="h-4 w-4 text-emerald-600" />
                <span>Rappels & Délais</span>
              </h2>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {activeReminders.length}
              </span>
            </div>

            {activeReminders.length === 0 ? (
              <div className="text-center py-6 text-stone-400 text-xs">
                Aucun rappel en attente. Tout est à jour !
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeReminders.slice(0, 3).map((rem) => {
                  const emp = employees.find(e => e.id === rem.employeeId);
                  return (
                    <div key={rem.id} className="p-3 bg-stone-50 hover:bg-stone-100/70 rounded-2xl border border-stone-200 text-xs space-y-1 transition">
                      <div className="flex items-center justify-between text-stone-800 font-bold">
                        <span className="truncate">{rem.note}</span>
                        <span className="text-[10px] font-mono text-emerald-700 shrink-0">{rem.time || rem.date || 'En attente'}</span>
                      </div>
                      {emp && (
                        <div className="text-[10px] text-stone-500">
                          Concerne : <strong>{emp.name}</strong>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => onSelectTab('reminders')}
              className="w-full py-2 bg-stone-50 hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border border-stone-200"
            >
              <span>Toutes les alertes</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Pending Tasks Card */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-blue-600" />
                <span>Tâches en Cours ({pendingTasks.length})</span>
              </h2>
            </div>

            {pendingTasks.length === 0 ? (
              <div className="text-center py-6 text-stone-400 text-xs">
                Aucune tâche en souffrance.
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingTasks.slice(0, 3).map((task) => {
                  const assignee = employees.find(e => e.id === task.employeeId);
                  return (
                    <div key={task.id} className="p-3 bg-stone-50 hover:bg-stone-100/70 rounded-2xl border border-stone-200 text-xs space-y-1 transition">
                      <div className="flex items-center justify-between font-bold text-stone-900">
                        <span className="truncate">{task.title}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                          task.priority === 'high' ? 'bg-amber-100 text-amber-800' : 'bg-stone-200 text-stone-700'
                        }`}>
                          {task.priority === 'high' ? 'Urgente' : 'Normale'}
                        </span>
                      </div>
                      {assignee && (
                        <div className="text-[10px] text-stone-500">
                          Assigné à : <strong>{assignee.name}</strong>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => onSelectTab('tasks')}
              className="w-full py-2 bg-stone-50 hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border border-stone-200"
            >
              <span>Accéder aux tâches</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Clean Light Shortcuts Panel */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-stone-900">Raccourcis Directs</h3>
          </div>
          <button
            onClick={() => onSelectTab('settings')}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
          >
            Paramètres & Modules →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onSelectTab('collaborators')}
            className="p-3.5 bg-stone-50 hover:bg-emerald-50/60 border border-stone-200 rounded-2xl text-left transition space-y-1 cursor-pointer"
          >
            <Users className="h-5 w-5 text-emerald-600" />
            <div className="font-bold text-xs text-stone-900">Annuaire</div>
          </button>

          <button
            onClick={() => onSelectTab('presences')}
            className="p-3.5 bg-stone-50 hover:bg-emerald-50/60 border border-stone-200 rounded-2xl text-left transition space-y-1 cursor-pointer"
          >
            <Clock className="h-5 w-5 text-emerald-600" />
            <div className="font-bold text-xs text-stone-900">Pointage</div>
          </button>

          <button
            onClick={() => onSelectTab('tasks')}
            className="p-3.5 bg-stone-50 hover:bg-emerald-50/60 border border-stone-200 rounded-2xl text-left transition space-y-1 cursor-pointer"
          >
            <ListTodo className="h-5 w-5 text-blue-600" />
            <div className="font-bold text-xs text-stone-900">Tâches</div>
          </button>

          <button
            onClick={() => onSelectTab('settings')}
            className="p-3.5 bg-stone-50 hover:bg-emerald-50/60 border border-stone-200 rounded-2xl text-left transition space-y-1 cursor-pointer"
          >
            <Settings className="h-5 w-5 text-emerald-700" />
            <div className="font-bold text-xs text-stone-900">Paramètres</div>
          </button>
        </div>
      </div>
    </div>
  );
}
