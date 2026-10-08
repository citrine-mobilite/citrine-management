import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Clock, 
  CheckSquare, 
  Bell, 
  AlertTriangle, 
  Settings, 
  ArrowRight,
  TrendingUp,
  LayoutDashboard
} from 'lucide-react';
import { Employee, Presence, Task, Reminder, AppUser } from '../types';
import { TabType } from './Sidebar';

interface AdminDashboardOverviewProps {
  currentUser: AppUser | null;
  employees: Employee[];
  presences: Presence[];
  tasks: Task[];
  reminders: Reminder[];
  currentTime?: string;
  onSelectTab: (tab: TabType) => void;
  onSelectEmployee: (id: string) => void;
}

export default function AdminDashboardOverview({
  currentUser,
  employees = [],
  presences = [],
  tasks = [],
  reminders = [],
  onSelectTab,
  onSelectEmployee,
}: AdminDashboardOverviewProps) {
  const [realTime, setRealTime] = useState(() => {
    return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  const currentDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setRealTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter values based on today's date
  const todayStr = new Date().toISOString().split('T')[0];
  const todayPresences = presences.filter((p) => p.date === todayStr);
  const presentCount = todayPresences.filter((p) => p.status === 'present').length;
  const lateCount = todayPresences.filter((p) => p.status === 'late').length;
  
  // Pending and active tasks
  const pendingTasks = tasks.filter((t) => t.status !== 'completed');
  const activeRemindersCount = reminders.length;

  const attendanceRate = employees.length > 0 
    ? Math.round((presentCount / employees.length) * 100) 
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* Dashboard Top Header Banner */}
      <div className="bg-gradient-to-r from-[#2A7B76] to-emerald-800 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-emerald-200" />
            <h2 className="font-serif font-bold text-xl">Tableau de Bord d'Administration</h2>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-xs font-mono font-bold shrink-0">
          <span className="text-emerald-200">🕒 {realTime}</span>
          <span className="text-white/40">|</span>
          <span className="capitalize">{currentDateFormatted}</span>
        </div>
      </div>

      {/* KPI Cards exactly as in Image 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* PRESENCES DU JOUR CARD */}
        <div 
          onClick={() => onSelectTab('presences')}
          className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs hover:shadow-md hover:border-emerald-300 transition duration-200 cursor-pointer flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-stone-500 font-extrabold uppercase tracking-wide">Présences du Jour</span>
            <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-stone-900">
              {presentCount} / {employees.length}{' '}
              <span className="text-xs text-emerald-600 font-semibold">({attendanceRate}%)</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-stone-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${attendanceRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* ANOMALIES & RETARDS CARD */}
        <div 
          onClick={() => onSelectTab('presences')}
          className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs hover:shadow-md hover:border-amber-300 transition duration-200 cursor-pointer flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-stone-500 font-extrabold uppercase tracking-wide">Anomalies & Retards</span>
            <div className="p-1.5 rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-stone-900">{lateCount}</div>
            <button 
              onClick={(e) => { e.stopPropagation(); onSelectTab('statistics'); }}
              className="text-[11px] text-[#2A7B76] font-bold hover:underline mt-2 inline-flex items-center gap-1 cursor-pointer"
            >
              Analyse d'assiduité &gt;
            </button>
          </div>
        </div>

        {/* TACHES EN COURS CARD */}
        <div 
          onClick={() => onSelectTab('tasks')}
          className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs hover:shadow-md hover:border-blue-300 transition duration-200 cursor-pointer flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-stone-500 font-extrabold uppercase tracking-wide">Tâches en Cours</span>
            <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
              <CheckSquare className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-stone-900">{pendingTasks.length}</div>
            <button 
              onClick={(e) => { e.stopPropagation(); onSelectTab('tasks'); }}
              className="text-[11px] text-[#2A7B76] font-bold hover:underline mt-2 inline-flex items-center gap-1 cursor-pointer"
            >
              Tableau des tâches &gt;
            </button>
          </div>
        </div>

        {/* ALERTES ACTIVES CARD */}
        <div 
          onClick={() => onSelectTab('reminders')}
          className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs hover:shadow-md hover:border-emerald-200 transition duration-200 cursor-pointer flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-stone-500 font-extrabold uppercase tracking-wide">Alertes Actives</span>
            <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Bell className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-stone-900">{activeRemindersCount}</div>
            <button 
              onClick={(e) => { e.stopPropagation(); onSelectTab('reminders'); }}
              className="text-[11px] text-[#2A7B76] font-bold hover:underline mt-2 inline-flex items-center gap-1 cursor-pointer"
            >
              Consulter les alertes &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid with full width Pointages and widgets underneath */}
      <div className="space-y-6">
        
        {/* FULL WIDTH: Pointages du Jour */}
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-1.5">
              <Clock className="h-4.5 w-4.5 text-[#2A7B76]" />
              Pointages du Jour
            </h3>
            <button 
              onClick={() => onSelectTab('presences')}
              className="text-[11px] font-bold text-[#2A7B76] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Registre complet &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-stone-400 font-bold uppercase tracking-wider text-[9px] border-b border-stone-100">
                  <th className="pb-3">Collaborateur</th>
                  <th className="pb-3">Poste</th>
                  <th className="pb-3">Arrivée</th>
                  <th className="pb-3">Statut</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {employees.slice(0, 5).map((emp) => {
                  const p = todayPresences.find((x) => x.employeeId === emp.id);
                  return (
                    <tr key={emp.id} className="hover:bg-stone-50/50 transition">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-3xs border border-emerald-100">
                            {emp.avatarUrl ? (
                              <img src={emp.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span>{emp.name.slice(0, 2).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="block font-bold text-stone-950 truncate text-[11px]">{emp.name}</span>
                            <span className="block text-[9px] text-stone-400 font-mono truncate">{emp.phone || '+237 655500443'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-stone-500 font-medium truncate max-w-[120px]">
                        {emp.roleType || 'Collaborateur'}
                      </td>
                      <td className="py-3 font-mono font-bold text-stone-800">
                        {p?.arrivalTime || '—'}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase border ${
                          p?.status === 'present' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : p?.status === 'late' 
                            ? 'bg-amber-50 text-amber-700 border-amber-100' 
                            : 'bg-stone-50 text-stone-400 border-stone-100'
                        }`}>
                          {p?.status === 'present' ? 'Présent' : p?.status === 'late' ? 'En retard' : 'Non pointé'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => onSelectEmployee(emp.id)}
                          className="px-2 py-1 rounded bg-[#2A7B76]/5 text-[#2A7B76] hover:bg-[#2A7B76] hover:text-white transition font-bold text-[10px] cursor-pointer"
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

        {/* BOTTOM SECTION: Sidebar Widgets side-by-side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* widget 1: Rappels & Délais */}
          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <h4 className="text-xs font-serif font-bold text-stone-900 flex items-center gap-1.5">
                <Bell className="h-4 w-4 text-[#2A7B76]" />
                Rappels & Délais
              </h4>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-lg">
                {activeRemindersCount}
              </span>
            </div>

            <div className="py-4 text-center">
              {activeRemindersCount === 0 ? (
                <p className="text-stone-400 italic text-[11px]">Aucun rappel en attente. Tout est à jour !</p>
              ) : (
                <div className="text-left space-y-2 max-h-36 overflow-y-auto">
                  {reminders.slice(0, 2).map((r) => (
                    <div key={r.id} className="p-2.5 bg-stone-50 rounded-xl border border-stone-100 text-[11px] font-medium text-stone-700">
                      🔔 <b>{r.title}</b> ({r.time})
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => onSelectTab('reminders')}
              className="w-full py-2 border border-stone-200 text-stone-700 hover:bg-stone-50 font-bold rounded-xl text-[10px] transition cursor-pointer text-center"
            >
              Toutes les alertes &gt;
            </button>
          </div>

          {/* widget 2: Tâches en Cours */}
          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <h4 className="text-xs font-serif font-bold text-stone-900 flex items-center gap-1.5">
                <CheckSquare className="h-4 w-4 text-[#2A7B76]" />
                Tâches en Cours ({pendingTasks.length})
              </h4>
            </div>

            <div className="py-2 space-y-2">
              {pendingTasks.length === 0 ? (
                <p className="text-stone-400 italic text-[11px] text-center py-4">Aucune tâche en cours.</p>
              ) : (
                pendingTasks.slice(0, 1).map((t) => (
                  <div key={t.id} className="p-3 bg-stone-50/50 rounded-2xl border border-stone-200/80 flex items-center justify-between gap-3 text-[11px]">
                    <div className="space-y-0.5 min-w-0">
                      <span className="block font-bold text-stone-900 truncate">{t.title}</span>
                      <span className="block text-[10px] text-stone-500">Assigné à : {t.assignedTo}</span>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-stone-100 border text-stone-600 rounded-md shrink-0 uppercase tracking-wide">
                      Normale
                    </span>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => onSelectTab('tasks')}
              className="w-full py-2 border border-stone-200 text-stone-700 hover:bg-stone-50 font-bold rounded-xl text-[10px] transition cursor-pointer text-center"
            >
              Accéder aux tâches &gt;
            </button>
          </div>

        </div>
      </div>

      {/* Shortcuts bar exactly as in Image 1 */}
      <div className="bg-white rounded-3xl border border-stone-200/80 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
          <h4 className="text-xs font-serif font-bold text-stone-900 flex items-center gap-1.5">
            <Settings className="h-4 w-4 text-[#2A7B76]" />
            Raccourcis Directs
          </h4>
          <button 
            onClick={() => onSelectTab('settings')}
            className="text-[10px] font-bold text-[#2A7B76] hover:underline flex items-center gap-1 cursor-pointer"
          >
            Paramètres & Modules &rarr;
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* ANNUAIRE */}
          <div 
            onClick={() => onSelectTab('collaborators')}
            className="flex items-center gap-3 p-3 bg-stone-50/50 hover:bg-emerald-50/30 rounded-2xl border border-stone-200/80 cursor-pointer transition"
          >
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <Users className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-stone-800">Annuaire</span>
          </div>

          {/* POINTAGE */}
          <div 
            onClick={() => onSelectTab('presences')}
            className="flex items-center gap-3 p-3 bg-stone-50/50 hover:bg-emerald-50/30 rounded-2xl border border-stone-200/80 cursor-pointer transition"
          >
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-stone-800">Pointage</span>
          </div>

          {/* TACHES */}
          <div 
            onClick={() => onSelectTab('tasks')}
            className="flex items-center gap-3 p-3 bg-stone-50/50 hover:bg-emerald-50/30 rounded-2xl border border-stone-200/80 cursor-pointer transition"
          >
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 shrink-0">
              <CheckSquare className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-stone-800">Tâches</span>
          </div>

          {/* PARAMETRES */}
          <div 
            onClick={() => onSelectTab('settings')}
            className="flex items-center gap-3 p-3 bg-stone-50/50 hover:bg-emerald-50/30 rounded-2xl border border-stone-200/80 cursor-pointer transition"
          >
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
              <Settings className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-stone-800">Paramètres</span>
          </div>
        </div>
      </div>

    </div>
  );
}
