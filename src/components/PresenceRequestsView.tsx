import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Presence, Employee } from '../types';
import { extractPresenceRequests, RequestItem } from './presence/requests/presenceRequestsUtils';
import { PresenceDecisionModal } from './presence/requests/PresenceDecisionModal';
import { PresenceRequestItemCard } from './presence/requests/PresenceRequestItemCard';
import { SearchableSelect } from './common/SearchableSelect';

interface PresenceRequestsViewProps {
  presences: Presence[];
  employees: Employee[];
  onUpdatePresences: (updated: Presence[]) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function PresenceRequestsView({
  presences,
  employees,
  onUpdatePresences,
  showToast,
}: PresenceRequestsViewProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'emergency' | 'correction' | 'departure'>('all');

  const [decisionModalItem, setDecisionModalItem] = useState<RequestItem | null>(null);
  const [decisionAction, setDecisionAction] = useState<'approved' | 'rejected' | null>(null);
  const [decisionComment, setDecisionComment] = useState('');

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

  const handleConfirmDecision = () => {
    if (!decisionModalItem || !decisionAction) return;

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
      } else if (decisionModalItem.type === 'correction') {
        presence.correctionReasonStatus = decisionAction;
      } else if (decisionModalItem.type === 'departure') {
        presence.departureReasonStatus = decisionAction;
      }

      updatedPresences[pIdx] = presence;
      onUpdatePresences(updatedPresences);
      showToast?.(
        decisionAction === 'approved' ? 'Demande validée avec succès' : 'Demande rejetée',
        decisionAction === 'approved' ? 'success' : 'info'
      );
    }

    setDecisionModalItem(null);
    setDecisionAction(null);
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
      />
    </div>
  );
}
