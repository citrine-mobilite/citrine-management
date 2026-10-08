import React from 'react';
import { PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';
import { VoIPCall } from '../../types';

interface CallHistoryListProps {
  callHistory: VoIPCall[];
  currentUserId?: string;
}

export const CallHistoryList: React.FC<CallHistoryListProps> = ({ callHistory, currentUserId }) => {
  if (callHistory.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-stone-200 text-center text-stone-500 text-xs">
        Aucun historique d'appel enregistré pour le moment.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-2xs divide-y divide-stone-100">
      {callHistory.map((call) => {
        const isOutgoing = call.callerId === currentUserId;
        const isMissed = call.status === 'missed';

        return (
          <div key={call.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-stone-50 transition">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isMissed
                    ? 'bg-rose-50 text-rose-600'
                    : isOutgoing
                    ? 'bg-emerald-50 text-[#2A7B76]'
                    : 'bg-teal-50 text-teal-800'
                }`}
              >
                {isMissed ? (
                  <PhoneMissed className="h-4 w-4" />
                ) : isOutgoing ? (
                  <PhoneOutgoing className="h-4 w-4" />
                ) : (
                  <PhoneIncoming className="h-4 w-4" />
                )}
              </div>

              <div>
                <h4 className="font-bold text-xs text-stone-900">
                  {isOutgoing ? `Vers ${call.calleeName}` : `De ${call.callerName}`}
                </h4>
                <p className="text-[10px] text-stone-500">
                  {new Date(call.createdAt).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  • <span className="capitalize">{call.type === 'video' ? 'Vidéo' : 'Audio'}</span>
                </p>
              </div>
            </div>

            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                isMissed ? 'bg-rose-100 text-rose-800' : 'bg-stone-100 text-stone-700'
              }`}
            >
              {isMissed ? 'Manqué' : 'Terminé'}
            </span>
          </div>
        );
      })}
    </div>
  );
};
