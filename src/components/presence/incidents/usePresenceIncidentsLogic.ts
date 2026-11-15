import { useState } from 'react';
import { AttendanceIncident, Employee, NotificationLog } from '../../../types';
import { incidentService } from '../../../services/incidentService';
import { pushNotificationBridgeService } from '../../../services/pushNotificationBridgeService';
import { COLLECTIONS, saveDocument } from '../../../services/dataService';

export function getIncidentTypeLabel(type: AttendanceIncident['type']): string {
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
}

interface UsePresenceIncidentsLogicProps {
  attendanceIncidents: AttendanceIncident[];
  employees: Employee[];
  onUpdateAttendanceIncidents?: (incidents: AttendanceIncident[]) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export function usePresenceIncidentsLogic({
  attendanceIncidents,
  employees,
  onUpdateAttendanceIncidents,
  showToast,
}: UsePresenceIncidentsLogicProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIncidentForJustification, setSelectedIncidentForJustification] =
    useState<AttendanceIncident | null>(null);
  const [adminNote, setAdminNote] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [newType, setNewType] = useState<AttendanceIncident['type']>('absence_injustifiee');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState(() =>
    new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  );
  const [newReason, setNewReason] = useState('');
  const [newAdminNote, setNewAdminNote] = useState('Signalement consigné manuellement au registre RH.');
  const [isCreating, setIsCreating] = useState(false);

  const filtered = attendanceIncidents.filter((inc) => {
    const empName =
      inc.employeeName || employees.find((e) => String(e.id) === String(inc.employeeId))?.name || '';
    const reasonText = inc.reason || inc.description || '';
    const dateText = inc.date || '';

    const matchesSearch =
      empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reasonText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dateText.includes(searchTerm);
    const matchesType =
      typeFilter === 'all' ||
      inc.type === typeFilter ||
      (typeFilter === 'sortie_prematuree' &&
        (inc.type === 'sortie_prematuree' || inc.type === 'depart_anticipe'));
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'auto' && (inc.origin === 'automatique_pointage' || inc.status === 'automatique')) ||
      (statusFilter === 'declared' &&
        (inc.isDeclaredInAdvance || inc.status === 'signale' || inc.status === 'justifie'));
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
      adminComment:
        adminNote.trim() ||
        (justifie ? 'Validé et justifié par la direction.' : 'Maintenu non justifié par la direction.'),
    };

    await incidentService.saveIncident(updated);
    if (onUpdateAttendanceIncidents) {
      onUpdateAttendanceIncidents(attendanceIncidents.map((i) => (i.id === incident.id ? updated : i)));
    }
    showToast?.(`Incident ${justifie ? 'validé et justifié' : 'marqué non justifié'}.`, 'success');
    setSelectedIncidentForJustification(null);
    setAdminNote('');
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

  return {
    searchTerm, setSearchTerm, typeFilter, setTypeFilter, statusFilter, setStatusFilter,
    selectedIncidentForJustification, setSelectedIncidentForJustification,
    adminNote, setAdminNote, showCreateModal, setShowCreateModal,
    newEmployeeId, setNewEmployeeId, newType, setNewType,
    newDate, setNewDate, newTime, setNewTime, newReason, setNewReason,
    newAdminNote, setNewAdminNote, isCreating,
    sorted, autoCount, declaredCount,
    handleJustifyIncident, handleCreateManualIncident,
  };
}
