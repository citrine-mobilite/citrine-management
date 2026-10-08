import React, { useState } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  CheckSquare, 
  Clock, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Plus, 
  X, 
  Filter,
  ShieldAlert,
  Info
} from 'lucide-react';
import { Employee, AppUser, Task, AttendanceIncident, NotificationLog } from '../../types';
import { soundService } from '../../services/soundService';

interface EmployeeAlertsTabProps {
  employeeProfile: Employee;
  currentUser?: AppUser | null;
  tasks: Task[];
  incidents: AttendanceIncident[];
  onAddNotification?: (log: NotificationLog) => void;
}

export interface PersonalAlert {
  id: string;
  title: string;
  message: string;
  type: 'urgent' | 'warning' | 'info' | 'task' | 'incident';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export const EmployeeAlertsTab: React.FC<EmployeeAlertsTabProps> = ({
  employeeProfile,
  currentUser,
  tasks,
  incidents,
  onAddNotification,
}) => {
  const [filter, setFilter] = useState<'all' | 'urgent' | 'task' | 'incident' | 'unread'>('all');
  const [isRinging, setIsRinging] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newType, setNewType] = useState<'urgent' | 'warning' | 'info'>('warning');

  // Derive initial personal alerts from tasks, incidents, and local storage / system
  const [customAlerts, setCustomAlerts] = useState<PersonalAlert[]>(() => {
    const list: PersonalAlert[] = [];

    // 1. Tasks alerts (high priority or assigned)
    tasks
      .filter((t) => t.assignedTo === employeeProfile.id && t.status !== 'completed')
      .slice(0, 5)
      .forEach((t) => {
        list.push({
          id: `task-alert-${t.id}`,
          title: `Tâche en cours : ${t.title}`,
          message: `Priorité ${t.priority.toUpperCase()} - Date limite : ${t.dueDate || 'Non définie'}. ${t.description || ''}`,
          type: t.priority === 'urgent' || t.priority === 'high' ? 'urgent' : 'task',
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          read: false,
        });
      });

    // 2. Incident alerts
    incidents
      .filter((i) => i.employeeId === employeeProfile.id)
      .slice(0, 5)
      .forEach((inc) => {
        const typeLabel = 
          inc.type === 'retard' ? 'Retard' :
          inc.type === 'sortie_prematuree' || inc.type === 'depart_anticipe' ? 'Sortie prématurée' :
          inc.type || 'Anomalie';
        list.push({
          id: `inc-alert-${inc.id}`,
          title: `Incident de Pointage : ${typeLabel}`,
          message: `${inc.reason || 'Anomalie détectée sur la présence'}. Statut : ${inc.status}`,
          type: 'incident',
          timestamp: inc.date || new Date().toISOString().split('T')[0],
          read: false,
        });
      });

    // 3. System Welcome Alert
    list.push({
      id: 'welcome-alert-1',
      title: 'Bienvenue dans votre Espace Collaborateur',
      message: 'Consultez ici toutes vos alertes de tâches, rappels de pointage et notifications système en temps réel.',
      type: 'info',
      timestamp: 'Aujourd\'hui',
      read: true,
    });

    return list;
  });

  const toggleRingtone = () => {
    if (isRinging) {
      soundService.stopContinuousAlertRingtone();
      setIsRinging(false);
    } else {
      soundService.startContinuousAlertRingtone(0.5);
      setIsRinging(true);
    }
  };

  const handleMarkAsRead = (id: string) => {
    setCustomAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a))
    );
  };

  const handleDeleteAlert = (id: string) => {
    setCustomAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleCreatePersonalAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const alertItem: PersonalAlert = {
      id: `custom-alert-${Date.now()}`,
      title: newTitle.trim(),
      message: newMessage.trim() || 'Rappel personnel créé.',
      type: newType,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };

    setCustomAlerts((prev) => [alertItem, ...prev]);

    if (onAddNotification) {
      onAddNotification({
        id: alertItem.id,
        type: 'system',
        recipient: employeeProfile.email || currentUser?.email || 'Collaborateur',
        title: alertItem.title,
        content: alertItem.message,
        payload: JSON.stringify({ source: 'personal_alert' }),
        timestamp: new Date().toISOString(),
      });
    }

    setNewTitle('');
    setNewMessage('');
    setShowCreateModal(false);
  };

  const filteredAlerts = customAlerts.filter((a) => {
    if (filter === 'unread') return !a.read;
    if (filter === 'urgent') return a.type === 'urgent';
    if (filter === 'task') return a.type === 'task';
    if (filter === 'incident') return a.type === 'incident';
    return true;
  });

  const unreadCount = customAlerts.filter((a) => !a.read).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner Actions */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-serif font-bold text-stone-800">Mes Alertes & Rappels</h2>
              {unreadCount > 0 && (
                <span className="bg-amber-100 text-amber-800 border border-amber-300 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500">
              Alertes personnelles, priorités de tâches et notifications de présence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Continuous Sound Ringtone Toggle */}
          <button
            onClick={toggleRingtone}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 border transition cursor-pointer active:scale-98 ${
              isRinging
                ? 'bg-red-600 text-white border-red-700 animate-pulse shadow-md'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
            }`}
            title="Tester la sonnerie d'alerte continue"
          >
            {isRinging ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-amber-600" />}
            <span>{isRinging ? 'Arrêter la Sonnerie' : 'Tester Sonnerie'}</span>
          </button>

          {/* New Custom Alert */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#2A7B76] hover:bg-[#20615d] text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer active:scale-98 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Nouvelle Alerte</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto p-1 bg-stone-100 rounded-2xl border border-stone-200 text-xs">
        {[
          { id: 'all', label: 'Toutes les alertes', count: customAlerts.length },
          { id: 'unread', label: 'Non lues', count: unreadCount },
          { id: 'urgent', label: 'Urgentes / Prioritaires', count: customAlerts.filter((a) => a.type === 'urgent').length },
          { id: 'task', label: 'Tâches', count: customAlerts.filter((a) => a.type === 'task').length },
          { id: 'incident', label: 'Incidents', count: customAlerts.filter((a) => a.type === 'incident').length },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id as any)}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
              filter === item.id
                ? 'bg-white text-stone-800 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>{item.label}</span>
            <span className="px-1.5 py-0.2 rounded-md bg-stone-200 text-stone-700 text-[10px] font-mono">
              {item.count}
            </span>
          </button>
        ))}
      </div>

      {/* List of Alerts */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-2xs space-y-3">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-stone-800 text-base">Aucune alerte à afficher</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Toutes vos notifications et rappels personnels sont à jour pour ce filtre.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredAlerts.map((alert) => {
            const isUrgent = alert.type === 'urgent';
            const isIncident = alert.type === 'incident';

            return (
              <div
                key={alert.id}
                className={`bg-white rounded-2xl p-5 border shadow-2xs transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  !alert.read
                    ? isUrgent
                      ? 'border-red-300 bg-red-50/30'
                      : 'border-amber-300 bg-amber-50/20'
                    : 'border-stone-200 opacity-80'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2.5 rounded-2xl shrink-0 mt-0.5 ${
                      isUrgent
                        ? 'bg-red-100 text-red-700'
                        : isIncident
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isUrgent ? (
                      <ShieldAlert className="h-5 w-5" />
                    ) : isIncident ? (
                      <AlertTriangle className="h-5 w-5" />
                    ) : alert.type === 'task' ? (
                      <CheckSquare className="h-5 w-5" />
                    ) : (
                      <Info className="h-5 w-5" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-stone-800 text-sm">{alert.title}</h4>
                      {!alert.read && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" title="Non lu" />
                      )}
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">{alert.message}</p>
                    <span className="text-[10px] text-stone-400 font-mono block pt-1">
                      Enregistré à : {alert.timestamp}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {!alert.read && (
                    <button
                      onClick={() => handleMarkAsRead(alert.id)}
                      className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold cursor-pointer transition"
                    >
                      Marquer lu
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteAlert(alert.id)}
                    className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl cursor-pointer transition"
                    title="Supprimer cette alerte"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for creating custom personal alert */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-bold text-stone-800 text-base flex items-center gap-2">
                <Bell className="h-5 w-5 text-[#2A7B76]" />
                Créer une Alerte Personnelle
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePersonalAlert} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Titre de l'Alerte</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Rappel réunion client à 15h"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Niveau d'Urgence</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none bg-white"
                >
                  <option value="info">Informatif / Normal</option>
                  <option value="warning">Important / Attention</option>
                  <option value="urgent">Urgente / Critique</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Description / Détails</label>
                <textarea
                  rows={3}
                  placeholder="Notes personnelles..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#2A7B76] hover:bg-[#20615d] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Enregistrer l'Alerte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
