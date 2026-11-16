import { useState } from 'react';
import { AttendanceIncident, Employee, NotificationLog } from '../../../types';
import { incidentService } from '../../../services/incidentService';
import { pushNotificationBridgeService } from '../../../services/pushNotificationBridgeService';
import { COLLECTIONS, saveDocument } from '../../../services/dataService';
import { executeOperationWithLoading } from '../../../utils/sweetAlert';

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
  onUpdateAttendanceIncidents?: (incidents: AttendanceIncident[]) => Promise<void> | void;
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
    const res = await executeOperationWithLoading({
      loadingTitle: "Mise à jour de l'incident...",
      loadingText: `Enregistrement de la décision pour ${incident.employeeName || 'le collaborateur'}, veuillez patienter...`,
      action: async () => {
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
          await onUpdateAttendanceIncidents(attendanceIncidents.map((i) => (i.id === incident.id ? updated : i)));
        }

        const targetEmp = employees.find((e) => String(e.id) === String(incident.employeeId));
        const operationKey = `incident-justify:${incident.id}:${justifie ? 'justifie' : 'injustifie'}`;
        const decisionTitle = justifie
          ? 'Signalement justifié par la direction'
          : 'Signalement maintenu non justifié';
        const decisionBody = justifie
          ? `Votre signalement du ${incident.date} (${getIncidentTypeLabel(incident.type)}) a été validé et justifié.`
          : `Votre signalement du ${incident.date} (${getIncidentTypeLabel(incident.type)}) n'a pas été retenu comme justifié.`;

        pushNotificationBridgeService.sendPush({
          operationKey,
          actionKey: operationKey,
          title: decisionTitle,
          message: decisionBody,
          senderName: 'Direction RH',
          type: 'incident',
          link: 'presences',
          suppressLocalNative: true,
          remoteBeams: {
            targetUserIds: targetEmp?.userId ? [String(targetEmp.userId)] : undefined,
            targetEmployeeIds: incident.employeeId ? [String(incident.employeeId)] : undefined,
            targetEmails: targetEmp?.email ? [targetEmp.email] : undefined,
          },
        });

        await saveDocument(COLLECTIONS.NOTIFICATIONS, {
          id: `notif-inc-justif-${incident.id}-${Date.now()}`,
          type: 'system',
          recipient: targetEmp?.email || incident.employeeName || String(incident.employeeId),
          title: decisionTitle,
          content: decisionBody,
          payload: JSON.stringify({
            source: 'incident_justification',
            operationKey,
            incidentId: incident.id,
            employeeId: incident.employeeId,
            isJustified: justifie,
          }),
          timestamp: new Date().toISOString(),
          read: false,
        });
      },
      successTitle: 'Décision enregistrée !',
      successMessage: `Incident ${justifie ? 'validé et justifié' : 'marqué non justifié'}.`,
      errorMessage: "Erreur lors de la mise à jour de l'incident.",
    });

    if (res.success) {
      setSelectedIncidentForJustification(null);
      setAdminNote('');
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
      const res = await executeOperationWithLoading({
        loadingTitle: 'Consignation du signalement...',
        loadingText: `Enregistrement du signalement pour ${emp.name}, veuillez patienter...`,
        action: async () => {
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
            await onUpdateAttendanceIncidents([newInc, ...attendanceIncidents]);
          }

          const operationKey = `incident-manual:${newInc.id}`;
          pushNotificationBridgeService.sendPush({
            operationKey,
            actionKey: operationKey,
            title: `Signalement RH : ${emp.name}`,
            message: `Signalement d'absence/manquement consigné pour le ${newDate}. Motif : ${newReason.trim()}`,
            senderName: 'Direction RH',
            type: 'alert',
            link: 'presences',
            suppressLocalNative: true,
            remoteBeams: {
              targetUserIds: emp.userId ? [String(emp.userId)] : undefined,
              targetEmployeeIds: emp.id ? [String(emp.id)] : undefined,
              targetEmails: emp.email ? [emp.email] : undefined,
            },
          });

          const notif: NotificationLog = {
            id: `notif-inc-${newInc.id}`,
            type: 'system',
            recipient: emp.email || emp.name,
            title: 'Signalement RH d’Absence Non Autorisée',
            content: `Un signalement d'absence non validée a été consigné pour le ${newDate}. Motif : ${newReason.trim()}`,
            payload: JSON.stringify({
              source: 'incident_manual',
              operationKey,
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
        },
        successTitle: 'Signalement consigné !',
        successMessage: `Signalement consigné avec succès sur ${emp.name}.`,
        errorMessage: 'Erreur lors de la création du signalement.',
      });

      if (res.success) {
        setShowCreateModal(false);
        setNewReason('');
      }
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
