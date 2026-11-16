import React from 'react';
import {
  VisitorLog,
  VisitorPurpose,
  Employee,
  PersonType,
} from '../../types';
import { saveVisitorLog, deleteVisitorLog } from '../../services/visitorLogService';
import {
  executeOperationWithLoading,
  executeDeleteWithSweetAlert,
} from '../../utils/sweetAlert';

interface UseVisitorsActionsParams {
  employees: Employee[];
  visitorsCount: number;
  setVisitors: React.Dispatch<React.SetStateAction<VisitorLog[]>>;
  setIsNewModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onAddNotification?: (n: any) => void;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}

export function useVisitorsActions({
  employees,
  visitorsCount,
  setVisitors,
  setIsNewModalOpen,
  onAddNotification,
  showToast,
}: UseVisitorsActionsParams) {
  const handleQuickCheckOut = async (visitor: VisitorLog) => {
    const now = new Date();
    const checkOutTime = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    await executeOperationWithLoading({
      loadingTitle: 'Enregistrement de la sortie...',
      loadingText: `Sortie de "${visitor.visitorName}", veuillez patienter...`,
      action: async () => {
        const updated: VisitorLog = {
          ...visitor,
          status: 'sorti',
          checkOutTime,
        };
        await saveVisitorLog(updated);
        onAddNotification?.({
          title: 'Sortie Enregistrée',
          message: `${visitor.visitorName} a quitté ${visitor.siteLocation} (Badge ${visitor.badgeNumber} restitué).`,
          type: 'info',
        });
      },
      successTitle: 'Sortie enregistrée !',
      successMessage: `Sortie enregistrée pour ${visitor.visitorName} à ${checkOutTime}.`,
      errorMessage: "Erreur lors de l'enregistrement de sortie.",
    });
  };

  const handleQuickCheckIn = async (visitor: VisitorLog) => {
    const now = new Date();
    const checkInTime = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    await executeOperationWithLoading({
      loadingTitle: "Enregistrement de l'arrivée...",
      loadingText: `Arrivée de "${visitor.visitorName}", veuillez patienter...`,
      action: async () => {
        const updated: VisitorLog = {
          ...visitor,
          status: 'sur_site',
          checkInTime,
          checkOutTime: undefined,
        };
        await saveVisitorLog(updated);
      },
      successTitle: 'Arrivée confirmée !',
      successMessage: `Arrivée confirmée pour ${visitor.visitorName} à ${checkInTime}.`,
      errorMessage: "Erreur lors de l'enregistrement d'arrivée.",
    });
  };

  const handleAuthorizeAccess = async (visitor: VisitorLog) => {
    await executeOperationWithLoading({
      loadingTitle: "Validation de l'accès...",
      loadingText: `Autorisation pour "${visitor.visitorName}", veuillez patienter...`,
      action: async () => {
        const updated: VisitorLog = {
          ...visitor,
          status: 'sur_site',
          authorizationConfirmed: true,
        };
        await saveVisitorLog(updated);
        onAddNotification?.({
          title: 'Accès Bâtiment Autorisé',
          message: `${visitor.visitorName} (${visitor.visitorCompany}) a reçu l'autorisation d'accès.`,
          type: 'info',
        });
      },
      successTitle: 'Accès autorisé !',
      successMessage: `Accès autorisé pour ${visitor.visitorName}. Badge ${visitor.badgeNumber} remis.`,
      errorMessage: "Erreur lors de la validation d'accès.",
    });
  };

  const handleRejectAccess = async (visitor: VisitorLog) => {
    await executeOperationWithLoading({
      loadingTitle: "Refus de l'accès...",
      loadingText: `Enregistrement du refus pour "${visitor.visitorName}", veuillez patienter...`,
      action: async () => {
        const updated: VisitorLog = {
          ...visitor,
          status: 'refuse',
          authorizationConfirmed: false,
        };
        await saveVisitorLog(updated);
      },
      successTitle: 'Accès refusé',
      successMessage: `L'accès a été refusé pour ${visitor.visitorName}.`,
      errorMessage: "Erreur lors du refus d'accès.",
    });
  };

  const handleCreateVisitor = async (visitorData: Partial<VisitorLog>) => {
    if (!visitorData.visitorName || !visitorData.visitorPhone) {
      showToast?.('Nom et téléphone obligatoires.', 'error');
      return;
    }

    const selectedHost = employees.find((emp) => emp.id === visitorData.hostEmployeeId);
    const now = new Date();
    const checkInTime = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const checkInDate = now.toISOString().split('T')[0];
    const pType: PersonType = visitorData.personType || 'visiteur';

    const visitorToSave: VisitorLog = {
      id: `vis-${Date.now()}`,
      personType: pType,
      workerDomain: pType === 'travailleur' ? visitorData.workerDomain : undefined,
      supervisorName: pType === 'travailleur' ? visitorData.supervisorName : undefined,
      interventionPerimeter: pType === 'travailleur' ? visitorData.interventionPerimeter : undefined,
      isPreAuthorized: visitorData.isPreAuthorized,
      authorizationConfirmed: visitorData.authorizationConfirmed,
      visitorName: visitorData.visitorName,
      visitorCompany: visitorData.visitorCompany || (pType === 'travailleur' ? 'Prestataire BTP' : 'Particulier'),
      visitorPhone: visitorData.visitorPhone,
      idCardNumber: visitorData.idCardNumber || '',
      siteLocation: visitorData.siteLocation || 'Siège Japoma (Carrefour Matango)',
      purpose: (visitorData.purpose as VisitorPurpose) || 'rdv_commercial',
      hostEmployeeId: selectedHost?.id || '',
      hostEmployeeName: selectedHost
        ? selectedHost.name
        : visitorData.hostEmployeeName ||
          (pType === 'travailleur' ? visitorData.supervisorName || 'Superviseur Bâtiment' : 'Accueil Citrine'),
      hostDepartment: selectedHost?.department || (pType === 'travailleur' ? 'Technique & Bâtiment' : 'Général'),
      badgeNumber: visitorData.badgeNumber || `BADGE-${String(visitorsCount + 1).padStart(2, '0')}`,
      vehiclePlate: visitorData.vehiclePlate || '',
      checkInTime,
      checkInDate,
      status: visitorData.status || 'sur_site',
      notes: visitorData.notes || '',
      createdAt: now.toISOString(),
    };

    await executeOperationWithLoading({
      loadingTitle: "Enregistrement à l'accueil...",
      loadingText: 'Synchronisation de la fiche de visite avec le serveur...',
      action: async () => {
        await saveVisitorLog(visitorToSave);
        setIsNewModalOpen(false);

        onAddNotification?.({
          title: pType === 'travailleur' ? 'Arrivée Travailleur Bâtiment' : 'Arrivée Visiteur',
          message: `${visitorToSave.visitorName} (${visitorToSave.visitorCompany}) est enregistré sur le site ${visitorToSave.siteLocation}.`,
          type: 'info',
        });
      },
      isPendingCheck: () => visitorToSave.status !== 'sur_site',
      pendingTitle: 'Visiteur en attente',
      pendingMessage: `${visitorToSave.visitorName} a été enregistré en attente d'accord à l'accueil.`,
      successTitle: 'Accès autorisé !',
      successMessage: `${pType === 'travailleur' ? 'Le travailleur' : 'Le visiteur'} "${visitorToSave.visitorName}" a été enregistré et autorisé sur le site.`,
    });
  };

  const handleDeleteVisitor = async (visitor: VisitorLog) => {
    const vId = visitor.id || visitor.docId;
    if (!vId) return;

    await executeDeleteWithSweetAlert({
      title: 'Supprimer cette fiche visite ?',
      text: 'Voulez-vous vraiment retirer cet enregistrement du registre des visiteurs ?',
      itemName: visitor.visitorName,
      action: async () => {
        await deleteVisitorLog(vId);
        setVisitors((prev) => prev.filter((v) => v.id !== vId && v.docId !== vId));
      },
      successTitle: 'Fiche supprimée',
      successMessage: `La fiche de ${visitor.visitorName} a été supprimée du registre.`,
    });
  };

  return {
    handleQuickCheckOut,
    handleQuickCheckIn,
    handleAuthorizeAccess,
    handleRejectAccess,
    handleCreateVisitor,
    handleDeleteVisitor,
  };
}
