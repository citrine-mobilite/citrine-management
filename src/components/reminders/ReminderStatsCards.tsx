import React from 'react';
import { Bell, Clock, AlertCircle } from 'lucide-react';
import { Reminder } from '../../types';

interface ReminderStatsCardsProps {
  reminders: Reminder[];
}

export const ReminderStatsCards: React.FC<ReminderStatsCardsProps> = ({ reminders }) => {
  const activeCount = reminders.filter((r) => !r.triggered && !r.stopped).length;
  const triggeredCount = reminders.filter((r) => r.triggered).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">Total Rappels</span>
          <Bell className="h-4 w-4 text-[#2A7B76]" />
        </div>
        <p className="text-xl font-bold text-stone-900 mt-1">{reminders.length}</p>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">Actifs & Planifiés</span>
          <Clock className="h-4 w-4 text-emerald-600" />
        </div>
        <p className="text-xl font-bold text-emerald-700 mt-1">{activeCount}</p>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">Déclenchés</span>
          <AlertCircle className="h-4 w-4 text-amber-600" />
        </div>
        <p className="text-xl font-bold text-amber-700 mt-1">{triggeredCount}</p>
      </div>
    </div>
  );
};
