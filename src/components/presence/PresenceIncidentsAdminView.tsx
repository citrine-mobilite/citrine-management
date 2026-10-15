import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldAlert, 
  Search, 
  Filter, 
  Check, 
  X,
  FileCheck2,
  Calendar,
  Plus
} from 'lucide-react';
import { AttendanceIncident, Employee, NotificationLog } from '../../types';
import { incidentService } from '../../services/incidentService';
import { pushNotificationBridgeService } from '../../services/pushNotificationBridgeService';
import { COLLECTIONS, saveDocument } from '../../services/dataService';

interface PresenceIncidentsAdminViewProps {
  attendanceIncidents: AttendanceIncident[];
  employees: Employee[];
  onUpdateAttendanceIncidents?: (incidents: AttendanceIncident[]) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export const PresenceIncidentsAdminView: React.FC<PresenceIncidentsAdminViewProps> = ({
  attendanceIncidents,
  employees,
  onUpdateAttendanceIncidents,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIncidentForJustification, setSelectedIncidentForJustification] = useState<AttendanceIncident | null>(null);
  const [adminNote, setAdminNote] = useState('');

  // Modal création manuelle
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [newType, setNewType] = useState<AttendanceIncident['type']>('absence_injustifiee');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState(() => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
  const [newReason, setNewReason] = useState('');
  const [newAdminNote, setNewAdminNote] = useState('Signalement consigné manuellement au registre RH.');
  const [isCreating, setIsCreating] = useState(false);

  const filtered = attendanceIncidents.filter((inc) => {
    const empName = inc.employeeName || employees.find((e) => String(e.id) === String(inc.employeeId))?.name || '';
    const reasonText = inc.reason || inc.description || '';
    const dateText = inc.date || '';

    const matchesSearch = 
      empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reasonText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dateText.includes(searchTerm);
    const matchesType = 
      typeFilter === 'all' || 
      inc.type === typeFilter || 
      (typeFilter === 'sortie_prematuree' && (inc.type === 'sortie_prematuree' || inc.type === 'depart_anticipe'));
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'auto' && (inc.origin === 'automatique_pointage' || inc.status === 'automatique')) ||
      (statusFilter === 'declared' && (inc.isDeclaredInAdvance || inc.status === 'signale' || inc.status === 'justifie'));
    return matchesSearch && matchesType && matchesStatus;
  });

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
  );

  const handleJustifyIncident = async (incident: AttendanceIncident, justifie: boolean) => {
    const updated = {
      ...incident,
      isJustified: justifie,
      status: (justifie ? 'justifie' : 'injustifie') as AttendanceIncident['status'],
      adminComment: adminNote.trim() || (justifie ? 'Validé et justifié par la direction.' : 'Maintenu non justifié par la direction.'),
    };

    await incidentService.saveIncident(updated);
    if (onUpdateAttendanceIncidents) {
      const newList = attendanceIncidents.map((i) => (i.id === incident.id ? updated : i));
      onUpdateAttendanceIncidents(newList);
    }
    showToast?.(`Incident ${justifie ? 'validé et justifié' : 'marqué non justifié'}.`, 'success');
    setSelectedIncidentForJustification(null);
    setAdminNote('');
  };

  const getTypeLabel = (type: AttendanceIncident['type']) => {
    switch (type) {
      case 'retard':
        return 'Retard';
      case 'sortie_prematuree':
      case 'depart_anticipe':
        return 'Sortie prématurée';
      case 'pause_anticipee':
        return 'Pause anticipée';
      case 'pause_prolongee':
        return 'Pause prolongée';
      case 'absence_injustifiee':
        return 'Absence injustifiée';
      case 'depart_sans_validation':
        return 'Départ sans validation';
      case 'absence_non_autorisee':
        return 'Absence non autorisée';
      default:
        return 'Autre';
    }
  };

  const handleCreateManualIncident = async () => {
    if (!newEmployeeId) {
      showToast?.('Veuillez sélectionner un employé.', 'error');
      return;
    }
    if (!newReason.trim()) {
      showToast?.('Veuillez renseigner le motif du signalement.', 'error');
      return;
    }

    const emp = employees.find((e) => e.id === newEmployeeId);
    if (!emp) return;

    setIsCreating(true);
    try {
      const now = new Date();
      const newInc: AttendanceIncident = {
        id: `inc-admin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        employeeId: emp.id,
        employeeName: emp.name,
        date: newDate,
        timeString: newTime,
        type: newType,
        origin: 'signale_par_responsable',
        reason: newReason.trim(),
        isDeclaredInAdvance: false,
        isJustified: false,
        status: 'injustifie',
        adminComment: newAdminNote.trim() || 'Signalement consigné manuellement au registre RH.',
        createdAt: now.toISOString(),
      };

      if (onUpdateAttendanceIncidents) {
        onUpdateAttendanceIncidents([newInc, ...attendanceIncidents]);
      }

      // Notification Push & Alert
      pushNotificationBridgeService.sendPush({
        title: `🚨 Signalement RH : ${emp.name}`,
        message: `Signalement d'absence/manquement consigné pour le ${newDate}. Motif : ${newReason.trim()}`,
        senderName: 'Direction RH',
        type: 'alert',
      });

      const notif: NotificationLog = {
        id: `notif-inc-${newInc.id}`,
        type: 'system',
        recipient: emp.email || emp.name,
        title: '🚨 Signalement RH d’Absence Non Autorisée',
        content: `Un signalement d'absence non validée a été consigné pour le ${newDate}. Motif : ${newReason.trim()}`,
        payload: JSON.stringify({
          source: 'incident_manual',
          incidentId: newInc.id,
          employeeId: emp.id,
          employeeName: emp.name,
          type: newType,
          date: newDate,
        }),
        timestamp: now.toISOString(),
        read: false,
      };

      await saveDocument(COLLECTIONS.NOTIFICATIONS, notif);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('citrine:new_unread_alert'));
      }

      showToast?.(`Signalement consigné avec succès sur ${emp.name}.`, 'success');
      setShowCreateModal(false);
      setNewReason('');
    } catch {
      showToast?.('Erreur lors de la création du signalement.', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const autoCount = attendanceIncidents.filter(
    (i) => i.origin === 'automatique_pointage' || i.status === 'automatique'
  ).length;
  const declaredCount = attendanceIncidents.filter(
    (i) => i.isDeclaredInAdvance || i.status === 'signale'
  ).length;

  return (
    <div className="space-y-4">
      {/* KPI mini banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1 text-[11px] font-bold">
            <span>Total des Incidents</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900">{attendanceIncidents.length}</div>
          <p className="text-[10px] text-stone-400">Toutes déclarations et détections</p>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 mb-1 text-[11px] font-bold">
            <span>Prévenus par Employés</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-emerald-950">{declaredCount}</div>
          <p className="text-[10px] text-emerald-700">Déclarations préalables acceptées</p>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-amber-800 mb-1 text-[11px] font-bold">
            <span>Incidents Automatiques</span>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-amber-950">{autoCount}</div>
          <p className="text-[10px] text-amber-700">Retards ou départs sans déclaration</p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="h-4 w-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par collaborateur, motif ou date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#2A7B76]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-700 font-semibold focus:outline-none"
          >
            <option value="all">Tous les types</option>
            <option value="absence_injustifiee">Absences injustifiées</option>
            <option value="depart_sans_validation">Départs sans validation</option>
            <option value="retard">Retards</option>
            <option value="sortie_prematuree">Sorties prématurées</option>
            <option value="pause_anticipee">Pauses anticipées</option>
            <option value="pause_prolongee">Pauses prolongées</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-700 font-semibold focus:outline-none"
          >
            <option value="all">Tous les statuts</option>
            <option value="declared">Signalés par employés</option>
            <option value="auto">Détectés automatiquement</option>
          </select>

          <button
            onClick={() => {
              setNewEmployeeId(employees[0]?.id || '');
              setShowCreateModal(true);
            }}
            className="bg-[#2A7B76] hover:bg-[#20635F] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 ml-auto md:ml-0"
            title="Consigner manuellement un manquement ou une absence non validée"
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau signalement</span>
          </button>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <h3 className="font-serif font-bold text-xs text-stone-900 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-600" /> Registre d'Assiduité des Collaborateurs ({sorted.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 text-[10px] uppercase font-bold border-b border-stone-100">
              <tr>
                <th className="py-3 px-4">Date & Heure</th>
                <th className="py-3 px-4">Collaborateur</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Origine & Statut</th>
                <th className="py-3 px-4">Motif Circonstancié</th>
                <th className="py-3 px-4 text-right">Décision RH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400 italic">
                    Aucun incident trouvé avec ces filtres.
                  </td>
                </tr>
              ) : (
                sorted.map((inc) => {
                  const isDeclared = inc.isDeclaredInAdvance || inc.status === 'signale' || inc.status === 'justifie';
                  return (
                    <tr key={inc.id} className="hover:bg-stone-50/60 transition">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-stone-900">{inc.date}</div>
                        <span className="font-mono text-[11px] text-stone-500">[{inc.timeString || '08:30'}]</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-stone-900 block">
                          {inc.employeeName || employees.find((e) => String(e.id) === String(inc.employeeId))?.name || 'Collaborateur'}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono">ID: {inc.employeeId || inc.id}</span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700">
                          {getTypeLabel(inc.type)}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {inc.status === 'injustifie' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1 w-fit">
                            <X className="h-3 w-3 text-rose-600" /> Rejeté / Non justifié
                          </span>
                        ) : inc.status === 'justifie' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Validé & Justifié
                          </span>
                        ) : isDeclared ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 flex items-center gap-1 w-fit">
                            <Clock className="h-3 w-3 text-blue-600" /> Signalé (En attente)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1 w-fit">
                            <AlertCircle className="h-3 w-3 text-amber-600" /> Incident Automatique
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 min-w-[220px]">
                        <p className="text-stone-800 text-xs">{inc.reason || inc.description || 'Incident consigné'}</p>
                        {inc.adminComment && (
                          <p className="text-[10px] text-[#2A7B76] italic mt-0.5">
                            Observation RH : {inc.adminComment}
                          </p>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedIncidentForJustification(inc);
                            setAdminNote(inc.adminComment || '');
                          }}
                          className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 font-bold text-xs transition cursor-pointer flex items-center gap-1 ml-auto"
                        >
                          <FileCheck2 className="h-3.5 w-3.5 text-[#2A7B76]" />
                          <span>Gérer</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Justification & Review Modal */}
      {selectedIncidentForJustification && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-stone-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-[#2A7B76]" /> Décision RH sur l'Incident
              </h3>
              <button
                onClick={() => setSelectedIncidentForJustification(null)}
                className="p-1 rounded-xl text-stone-400 hover:bg-stone-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 bg-stone-50 p-3 rounded-2xl border border-stone-200/80">
              <div>
                <span className="text-[10px] text-stone-400 font-bold uppercase block">Collaborateur</span>
                <span className="font-bold text-stone-900">{selectedIncidentForJustification.employeeName}</span>
              </div>
              <div className="flex justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Date & Heure</span>
                  <span className="font-semibold text-stone-800">{selectedIncidentForJustification.date} à {selectedIncidentForJustification.timeString}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Type</span>
                  <span className="font-bold text-stone-800 uppercase text-[11px]">{getTypeLabel(selectedIncidentForJustification.type)}</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 font-bold uppercase block">Motif constaté</span>
                <p className="text-stone-700 italic">{selectedIncidentForJustification.reason}</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-stone-600 block">
                Observation de la Direction / Motif d'approbation :
              </label>
              <textarea
                rows={2}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Ex: Justificatif médical reçu, embouteillage vérifié..."
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#2A7B76] text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => handleJustifyIncident(selectedIncidentForJustification, false)}
                className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold cursor-pointer"
              >
                Classer Non Justifié
              </button>
              <button
                onClick={() => handleJustifyIncident(selectedIncidentForJustification, true)}
                className="px-4 py-2 rounded-xl bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold cursor-pointer shadow-xs"
              >
                Valider & Justifier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Création Manuelle de Signalement */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-3 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-stone-200 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-600" />
                <span>Nouveau Signalement Manuel de Présence</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-xl text-stone-400 hover:bg-stone-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Consignez un manquement, un départ précipité ou une absence constatée sans validation managériale.
            </p>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-stone-700">Collaborateur concerné *</label>
              <select
                value={newEmployeeId}
                onChange={(e) => setNewEmployeeId(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#2A7B76]"
              >
                <option value="">Sélectionnez un employé...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.roleType || 'Employé'}) - {emp.department || 'Opérations'}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-stone-700">Type d'incident</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#2A7B76]"
              >
                <option value="absence_injustifiee">Absence injustifiée / Départ sans validation</option>
                <option value="depart_sans_validation">Départ avant approbation de congé</option>
                <option value="depart_anticipe">Départ anticipé non autorisé</option>
                <option value="sortie_prematuree">Sortie de poste non autorisée</option>
                <option value="retard">Retard non justifié</option>
                <option value="autre">Autre anomalie de présence</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700">Date de l'incident</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Heure de l'incident</label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-800"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-stone-700">Motif & faits constatés *</label>
              <textarea
                rows={3}
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="Ex: A sollicité une absence de 2 jours et est parti sans que l'on ne valide..."
                required
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 resize-none focus:outline-none focus:border-[#2A7B76]"
              />
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-stone-700">Observation administrative</label>
              <input
                type="text"
                value={newAdminNote}
                onChange={(e) => setNewAdminNote(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-[#2A7B76]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleCreateManualIncident}
                disabled={isCreating}
                className="px-5 py-2 bg-[#2A7B76] hover:bg-[#20635F] text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <ShieldAlert className="h-4 w-4" />
                <span>{isCreating ? 'Enregistrement...' : 'Enregistrer le signalement'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
