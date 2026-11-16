import { useState, useEffect } from 'react';
import {
  HseIncident,
  HseIncidentType,
  HseSeverity,
  HseCorrectiveAction,
  AppUser,
} from '../../types';
import {
  subscribeToHseIncidents,
  saveHseIncident,
  deleteHseIncident,
} from '../../services/hseService';
import { executeOperationWithLoading, executeDeleteWithSweetAlert } from '../../utils/sweetAlert';

export function useHsePanelLogic(params: {
  currentUser?: AppUser | null;
  onAddNotification?: (n: any) => void;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}) {
  const { currentUser, onAddNotification, showToast } = params;
  const [incidents, setIncidents] = useState<HseIncident[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<HseIncident | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<HseIncident | null>(null);

  useEffect(() => {
    const unsub = subscribeToHseIncidents(setIncidents);
    return () => unsub();
  }, []);

  const isAdminOrManager = currentUser?.role === 'administrateur' || currentUser?.role === 'responsable';
  const daysWithoutLostTimeAccident = 142;
  const nearMissesCount = incidents.filter((i) => i.type === 'presque_accident' || i.type === 'situation_dangereuse').length;
  const allActions = incidents.flatMap((i) => i.correctiveActions || []);
  const completedActionsCount = allActions.filter((a) => a.isCompleted).length;
  const resolutionRate = allActions.length > 0 ? Math.round((completedActionsCount / allActions.length) * 100) : 100;
  const closedCount = incidents.filter((i) => i.status === 'cloture').length;

  const filteredIncidents = incidents.filter((inc) => {
    const matchSearch =
      inc.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inc.zonePrecise && inc.zonePrecise.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inc.victimName && inc.victimName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchSite = selectedSite === 'all' || inc.site === selectedSite;
    const matchSev = selectedSeverity === 'all' || inc.severity === selectedSeverity;
    const matchStat = selectedStatus === 'all' || inc.status === selectedStatus;
    return matchSearch && matchSite && matchSev && matchStat;
  });

  const handleToggleAction = async (incident: HseIncident, actionId: string) => {
    await executeOperationWithLoading({
      loadingTitle: "Mise à jour de l'action corrective...",
      loadingText: `Actualisation de "${incident.reference}", veuillez patienter...`,
      action: async () => {
        const updatedActions = (incident.correctiveActions || []).map((a) => {
          if (a.id === actionId) {
            const nextState = !a.isCompleted;
            return { ...a, isCompleted: nextState, completedAt: nextState ? new Date().toISOString() : undefined };
          }
          return a;
        });
        const allDone = updatedActions.length > 0 && updatedActions.every((a) => a.isCompleted);
        const updatedIncident: HseIncident = {
          ...incident,
          correctiveActions: updatedActions,
          status: allDone ? 'cloture' : 'actions_lancees',
        };
        await saveHseIncident(updatedIncident);
        setSelectedIncident(updatedIncident);
      },
      successTitle: 'Action mise à jour !',
      successMessage: "L'action corrective HSE a été mise à jour avec succès.",
      errorMessage: 'Erreur lors de la mise à jour.',
    });
  };

  const handleAddAction = async (incident: HseIncident, action: HseCorrectiveAction) => {
    await executeOperationWithLoading({
      loadingTitle: "Ajout de l'action corrective...",
      loadingText: `Enregistrement sur le dossier "${incident.reference}", veuillez patienter...`,
      action: async () => {
        const updatedIncident: HseIncident = {
          ...incident,
          status: 'actions_lancees',
          correctiveActions: [...(incident.correctiveActions || []), action],
        };
        await saveHseIncident(updatedIncident);
        setSelectedIncident(updatedIncident);
      },
      successTitle: 'Action corrective ajoutée !',
      successMessage: 'L’action corrective a été ajoutée au plan HSE.',
      errorMessage: "Erreur lors de l'ajout de l'action.",
    });
  };

  const handleSaveIncident = async (incidentData: Partial<HseIncident>) => {
    if (!incidentData.title || !incidentData.description) {
      showToast?.('Veuillez renseigner un titre et une description.', 'error');
      return;
    }

    const isEdit = Boolean(editingIncident);
    await executeOperationWithLoading({
      loadingTitle: isEdit ? "Mise à jour de l'incident..." : 'Enregistrement du signalement...',
      loadingText: 'Synchronisation du registre HSE avec le serveur...',
      action: async () => {
        if (editingIncident) {
          const updated: HseIncident = {
            ...editingIncident,
            ...incidentData,
            id: editingIncident.id,
            reference: editingIncident.reference,
            createdAt: editingIncident.createdAt,
          };
          await saveHseIncident(updated);
          setIsModalOpen(false);
          setEditingIncident(null);
          setSelectedIncident(null);
        } else {
          const incToSave: HseIncident = {
            id: `hse-${Date.now()}`,
            reference: `HSE-2026-${String(incidents.length + 1).padStart(4, '0')}`,
            site: incidentData.site || 'Base Japoma - Carrefour Matango',
            zonePrecise: incidentData.zonePrecise || 'Zone générale',
            type: (incidentData.type as HseIncidentType) || 'presque_accident',
            severity: (incidentData.severity as HseSeverity) || 'faible',
            date: incidentData.date || new Date().toISOString().split('T')[0],
            time: incidentData.time || '10:00',
            title: incidentData.title || '',
            description: incidentData.description || '',
            reportedBy: currentUser?.name || 'Agent Citrine',
            reportedByRole: currentUser?.role || 'Collaborateur',
            immediateActionTaken: incidentData.immediateActionTaken || '',
            rootCause: incidentData.rootCause || '',
            victimName: incidentData.victimName || '',
            victimInjury: incidentData.victimInjury || '',
            daysLost: incidentData.daysLost || 0,
            status: incidentData.status || 'signale',
            correctiveActions: [],
            createdAt: new Date().toISOString(),
          };
          await saveHseIncident(incToSave);
          setIsModalOpen(false);
          onAddNotification?.({
            title: 'Nouveau Signalement HSE',
            message: `${incToSave.reference} : "${incToSave.title}" sur le site de ${incToSave.site}.`,
            type: incToSave.severity === 'grave' || incToSave.severity === 'critique' ? 'warning' : 'info',
          });
        }
      },
      successTitle: isEdit ? 'Incident mis à jour !' : 'Signalement enregistré !',
      successMessage: isEdit ? "Le rapport d'incident a été mis à jour." : 'Le signalement HSE a été consigné avec succès dans le registre.',
    });
  };

  const handleDeleteIncident = async (incidentId: string) => {
    const inc = incidents.find((i) => i.id === incidentId);
    await executeDeleteWithSweetAlert({
      title: 'Supprimer ce signalement ?',
      text: 'Voulez-vous vraiment supprimer cet événement du registre HSE ?',
      itemName: inc?.title,
      action: async () => {
        await deleteHseIncident(incidentId);
        setSelectedIncident(null);
      },
      successTitle: 'Signalement supprimé',
      successMessage: "L'incident a été retiré du registre HSE.",
    });
  };

  return {
    incidents,
    searchTerm,
    setSearchTerm,
    selectedSite,
    setSelectedSite,
    selectedSeverity,
    setSelectedSeverity,
    selectedStatus,
    setSelectedStatus,
    isModalOpen,
    setIsModalOpen,
    editingIncident,
    setEditingIncident,
    selectedIncident,
    setSelectedIncident,
    isAdminOrManager,
    daysWithoutLostTimeAccident,
    nearMissesCount,
    allActionsCount: allActions.length,
    completedActionsCount,
    resolutionRate,
    closedCount,
    filteredIncidents,
    handleToggleAction,
    handleAddAction,
    handleSaveIncident,
    handleDeleteIncident,
  };
}
