import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Presence, Employee, AttendanceIncident } from '../types';
import { extractPresenceRequests, RequestItem } from './presence/requests/presenceRequestsUtils';
import { PresenceDecisionModal } from './presence/requests/PresenceDecisionModal';
import { PresenceRequestItemCard } from './presence/requests/PresenceRequestItemCard';
import { SearchableSelect } from './common/SearchableSelect';
import { incidentService } from '../services/incidentService';
import { executeOperationWithLoading } from '../utils/sweetAlert';
import { pushNotificationBridgeService } from '../services/pushNotificationBridgeService';
import { COLLECTIONS, saveDocument } from '../services/dataService';

interface PresenceRequestsViewProps {
  presences: Presence[];
  employees: Employee[];
  onUpdatePresences: (updated: Presence[]) => Promise<void> | void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  attendanceIncidents?: AttendanceIncident[];
  onUpdateAttendanceIncidents?: (incidents: AttendanceIncident[]) => Promise<void> | void;
}

export default function PresenceRequestsView({
  presences,
  employees,
  onUpdatePresences,
  attendanceIncidents = [],
  onUpdateAttendanceIncidents,
}: PresenceRequestsViewProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'emergency' | 'correction' | 'departure'>('all');

  const [decisionModalItem, setDecisionModalItem] = useState<RequestItem | null>(null);
  const [decisionAction, setDecisionAction] = useState<'approved' | 'rejected' | null>(null);
  const [decisionComment, setDecisionComment] = useState('');
  const [isProcessingDecision, setIsProcessingDecision] = useState(false);

  const allRequests = useMemo(() => extractPresenceRequests(presences, employees), [presences, employees]);

  const filteredRequests = allRequests.filter((item) => {
    if (activeTab === 'pending' && item.status !== 'pending') return false;
    if (activeTab === 'history' && item.status === 'pending') return false;
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        item.employee?.name?.toLowerCase().includes(q) ||
        item.reason.toLowerCase().includes(q) ||
        item.date.includes(q)
      );
    }
    return true;
  });

  const handleOpenDecision = (item: RequestItem, action: 'approved' | 'rejected') => {
    setDecisionModalItem(item);
    setDecisionAction(action);
    setDecisionComment('');
  };

  const handleConfirmDecision = async () => {
    if (!decisionModalItem || !decisionAction) return;

    setIsProcessingDecision(true);
    try {
      await executeOperationWithLoading({
        loadingTitle: 'Traitement de la demande...',
        loadingText: 'Enregistrement de la décision de pointage, veuillez patienter...',
        action: async () => {
          const updatedPresences = [...presences];
          const pIdx = updatedPresences.findIndex((p) => p.id === decisionModalItem.presenceId);

          if (pIdx >= 0) {
            const presence = { ...updatedPresences[pIdx] };

            if (decisionModalItem.type === 'emergency' && presence.emergencies) {
              presence.emergencies = presence.emergencies.map((emg) =>
                emg.id === decisionModalItem.rawEmergency?.id
                  ? { ...emg, status: decisionAction }
                  : emg
              );

              if (attendanceIncidents && attendanceIncidents.length > 0) {
                const matchingIdx = attendanceIncidents.findIndex(
                  (inc) =>
                    inc.employeeId === decisionModalItem.employeeId &&
                    inc.date === decisionModalItem.date &&
                    (inc.type === decisionModalItem.subType || inc.reason === decisionModalItem.reason)
                );

                if (matchingIdx >= 0) {
                  const updatedInc: AttendanceIncident = {
                    ...attendanceIncidents[matchingIdx],
                    status: decisionAction === 'approved' ? 'justifie' : 'injustifie',
                    isJustified: decisionAction === 'approved',
                    adminComment: decisionComment.trim() || (decisionAction === 'approved' ? 'Validé par la direction.' : 'Signalement rejeté par la direction.'),
                  };
                  await incidentService.saveIncident(updatedInc);
                  await onUpdateAttendanceIncidents?.(
                    attendanceIncidents.map((item, idx) => (idx === matchingIdx ? updatedInc : item))
                  );
                }
              }
            } else if (decisionModalItem.type === 'correction') {
              presence.correctionReasonStatus = decisionAction;
            } else if (decisionModalItem.type === 'departure') {
              presence.departureReasonStatus = decisionAction;
            }

            updatedPresences[pIdx] = presence;
            await onUpdatePresences(updatedPresences);

            const targetEmp = decisionModalItem.employee || employees.find((e) => String(e.id) === String(decisionModalItem.employeeId));
            const operationKey = `presence-request-decision:${decisionModalItem.presenceId}:${decisionModalItem.id}:${decisionAction}`;
            const actionLabel = decisionAction === 'approved' ? 'validée et justifiée' : 'rejetée';
            const decisionTitle =
              decisionAction === 'approved'
                ? 'Demande / Signalement justifié'
                : 'Demande / Signalement rejeté';
            const decisionBody = `Votre demande du ${decisionModalItem.date} (${decisionModalItem.reason}) a été ${actionLabel} par la direction.`;

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
                targetUserIds: targetEmp?.userId ? [targetEmp.userId] : undefined,
                targetEmployeeIds: decisionModalItem.employeeId ? [String(decisionModalItem.employeeId)] : undefined,
                targetEmails: targetEmp?.email ? [targetEmp.email] : undefined,
              },
            });

            await saveDocument(COLLECTIONS.NOTIFICATIONS, {
              id: `notif-pres-req-${decisionModalItem.id}-${Date.now()}`,
              type: 'system',
              recipient: targetEmp?.email || targetEmp?.name || String(decisionModalItem.employeeId),
              title: decisionTitle,
              content: decisionBody,
              payload: JSON.stringify({
                source: 'presence_request_decision',
                operationKey,
                presenceId: decisionModalItem.presenceId,
                employeeId: decisionModalItem.employeeId,
                status: decisionAction,
              }),
              timestamp: new Date().toISOString(),
              read: false,
            });
          }
        },
        successTitle: decisionAction === 'approved' ? 'Demande validée !' : 'Demande rejetée',
        successMessage:
          decisionAction === 'approved'
            ? 'Demande de pointage validée avec succès.'
            : 'Demande rejetée avec mise à jour du statut.',
        errorMessage: 'Erreur lors du traitement de la demande.',
      });
    } finally {
      setIsProcessingDecision(false);
      setDecisionModalItem(null);
      setDecisionAction(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header & Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-[#2A7B76] text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            En Attente ({allRequests.filter((r) => r.status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTab === 'history'
                ? 'bg-[#2A7B76] text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Historique ({allRequests.filter((r) => r.status !== 'pending').length})
          </button>
        </div>

        <div className="flex items-center gap-2 flex-1 sm:max-w-md">
          <div className="relative flex-1">
            <Search className="h-3.5 w-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par collaborateur ou motif..."
              className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#2A7B76]"
            />
          </div>

          <div className="w-36">
            <SearchableSelect
              value={filterType}
              onChange={(val) => setFilterType(val as any)}
              options={[
                { value: 'all', label: 'Tous types' },
                { value: 'emergency', label: 'Urgences' },
                { value: 'correction', label: 'Corrections' },
                { value: 'departure', label: 'Départs' },
              ]}
              triggerClassName="py-1 px-2.5 text-xs h-8"
            />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {filteredRequests.length === 0 ? (
          <div className="bg-white p-8 text-center text-stone-400 text-xs italic rounded-2xl border border-stone-200">
            Aucune demande de pointage trouvée dans cette vue.
          </div>
        ) : (
          filteredRequests.map((item) => (
            <PresenceRequestItemCard
              key={item.id}
              item={item}
              onOpenDecision={handleOpenDecision}
            />
          ))
        )}
      </div>

      <PresenceDecisionModal
        item={decisionModalItem}
        action={decisionAction}
        comment={decisionComment}
        setComment={setDecisionComment}
        onClose={() => {
          setDecisionModalItem(null);
          setDecisionAction(null);
        }}
        onConfirm={handleConfirmDecision}
        isProcessing={isProcessingDecision}
      />
    </div>
  );
}
